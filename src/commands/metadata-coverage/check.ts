import { Flags, SfCommand } from "@salesforce/sf-plugins-core";
import { ComponentSetBuilder } from "@salesforce/source-deploy-retrieve";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

export interface MetadataCoverageReport {
  types: { [key: string]: Type };
}

export interface Type {
  details: Detail[];
  knownIssues: KnownIssue[] | null;
  channels: Channels;
}

export interface Channels {
  unlockedPackagingWithoutNamespace: boolean;
  unlockedPackagingWithNamespace: boolean;
  toolingApi: boolean;
  sourceTracking: boolean;
  metadataApi: boolean;
  managedPackaging: boolean;
  classicUnmanagedPackaging: boolean;
  classicManagedPackaging: boolean;
  changeSets: boolean;
  apexMetadataApi: boolean;
}

export interface Detail {
  url: null | string;
  name: Name;
  detailText?: null;
  detailRichText?: string;
}

export enum Name {
  DevHubRequirementWhenUsingScratchOrgs = "Dev Hub requirement when using scratch orgs",
  MetadataAPIDocumentation = "Metadata API Documentation",
  Pilot = "Pilot",
}

export interface KnownIssue {
  url: string;
  lastUpdated: string;
  affectedUsers: number;
  tags: null | string;
  status: Status;
  summary: string;
  title: string;
}

export enum Status {
  Fixed = "Fixed",
  InReview = "In Review",
  NoFix = "No Fix",
}

export type MetadataCoverageResult = {
  success: boolean;
  uncovered: { type: string; members: string[]; channels?: Channels }[];
};

export class MetadataCoverageCheck extends SfCommand<MetadataCoverageResult> {
  public static readonly summary =
    "check the Metadata Coverage for the given source";
  public static readonly examples = [
    "<%= config.bin %> <%= command.id %> --target-org myOrg@example.com",
  ];

  public static readonly requiresProject = true;

  public static readonly flags = {
    "api-version": Flags.orgApiVersion(),
  };

  public async run(): Promise<MetadataCoverageResult> {
    const { flags } = await this.parse(MetadataCoverageCheck);
    const sourceApiVersion =
      this.project!.getSfProjectJson().get("sourceApiVersion");
    const apiVersion = flags["api-version"] ?? sourceApiVersion ?? "64.0";
    const apiVersionMajor = apiVersion.split(".")[0];
    const reportPath = join(
      dirname(new URL(import.meta.url).pathname),
      "..",
      "..",
      "..",
      "data",
      `report-${apiVersionMajor}.json`
    );
    let report: MetadataCoverageReport;
    if (existsSync(reportPath)) {
      report = JSON.parse(
        readFileSync(
          join(
            dirname(new URL(import.meta.url).pathname),
            "..",
            "..",
            "..",
            "data",
            `report-${apiVersionMajor}.json`
          ),
          "utf8"
        )
      );
    } else {
      this.spinner.start(
        `Downloading Metadata Coverage Report v${apiVersionMajor}`
      );
      const reportResult = await fetch(
        `https://dx-extended-coverage.my.salesforce-sites.com/services/apexrest/report?version=${apiVersionMajor}`
      );
      if (!reportResult.ok) {
        throw new Error("Failed downloading Metadata Coverage Report.");
      }
      report = (await reportResult.json()) as MetadataCoverageReport;
      this.spinner.stop();
    }
    const packageDirectories = this.project!.getPackageDirectories();
    const sourcePaths = packageDirectories.map((dir) => dir.path);
    const componentSet = await ComponentSetBuilder.build({
      sourcepath: sourcePaths,
    });
    const objects = await componentSet.getObject();

    const requiredChannels: (keyof Channels)[] = [
      "managedPackaging",
      "unlockedPackagingWithoutNamespace",
    ];

    const result: MetadataCoverageResult = {
      success: true,
      uncovered: [],
    };
    for (const mdType of objects.Package.types) {
      let typeName = mdType.name;
      if (typeName === "CustomLabel") {
        typeName = "CustomLabels";
      }
      if (typeName === "MatchingRule") {
        typeName = "MatchingRules";
      }
      const coverage = report.types[typeName];
      if (!coverage) {
        result.success = false;
        result.uncovered.push({
          type: typeName,
          members: mdType.members,
        });
      } else if (
        requiredChannels.some((channel) => !coverage.channels[channel])
      ) {
        result.success = false;
        result.uncovered.push({
          type: typeName,
          members: mdType.members,
          channels: coverage.channels,
        });
      }
    }
    if (!result.success) {
      this.logJson(result.uncovered);
      throw new Error("Some metadata types are not covered.");
    }
    this.log("Successfully checked Metadata Coverage Report.");
    return result;
  }
}
