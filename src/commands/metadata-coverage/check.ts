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
    "<%= config.bin %> <%= command.id %> --source-dir force-app",
    "<%= config.bin %> <%= command.id %> --source-dir force-app --source-dir unpackaged",
    "<%= config.bin %> <%= command.id %> --manifest src/package.xml",
    "<%= config.bin %> <%= command.id %> --metadata CustomHelpMenuSection",
  ];

  public static readonly requiresProject = true;

  public static readonly flags = {
    "source-dir": Flags.string({
      char: "d",
      summary: `File paths for source to check.`,
      description: `Example values: 'force-app', 'force-app/main/default/'`,
      multiple: true,
      exclusive: ["manifest", "metadata"],
      exactlyOne: ["manifest", "metadata", "source-dir"],
      helpGroup: "Sources",
    }),
    manifest: Flags.file({
      char: "x",
      summary:
        "File path for the manifest (package.xml) that specifies the components to check.",
      exclusive: ["metadata", "source-dir"],
      exactlyOne: ["manifest", "metadata", "source-dir"],
      exists: true,
      helpGroup: "Sources",
    }),
    metadata: Flags.string({
      char: "m",
      summary: `Metadata component names to check.`,
      description: `Example values: 'RecordType:Account.Business', 'Profile:Admin'`,
      multiple: true,
      exclusive: ["manifest", "source-dir"],
      exactlyOne: ["manifest", "metadata", "source-dir"],
      helpGroup: "Sources",
    }),

    "1gp-managed": Flags.boolean({ helpGroup: "Metadata Coverage Channels" }),
    "1gp-unmanaged": Flags.boolean({ helpGroup: "Metadata Coverage Channels" }),
    "2gp-managed": Flags.boolean({ helpGroup: "Metadata Coverage Channels" }),
    "2gp-unlocked": Flags.boolean({ helpGroup: "Metadata Coverage Channels" }),
    "2gp-unlocked-with-namespace": Flags.boolean({
      helpGroup: "Metadata Coverage Channels",
    }),
    "source-tracking": Flags.boolean({
      helpGroup: "Metadata Coverage Channels",
    }),
    "tooling-api": Flags.boolean({ helpGroup: "Metadata Coverage Channels" }),
    "metadata-api": Flags.boolean({ helpGroup: "Metadata Coverage Channels" }),
    "apex-metadata-api": Flags.boolean({
      helpGroup: "Metadata Coverage Channels",
    }),
    changesets: Flags.boolean({ helpGroup: "Metadata Coverage Channels" }),

    "api-version": Flags.orgApiVersion(),
  };

  public async run(): Promise<MetadataCoverageResult> {
    const { flags } = await this.parse(MetadataCoverageCheck);
    if (!flags.manifest && !flags["source-dir"] && !flags.metadata) {
      throw new Error("");
    }

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
    const componentSet = await ComponentSetBuilder.build({
      sourcepath: flags["source-dir"],
      ...(flags.manifest
        ? {
            manifest: {
              manifestPath: flags.manifest,
              directoryPaths: this.project!.getUniquePackageDirectories().map(
                (dir) => dir.fullPath
              ),
            },
          }
        : {}),
      ...(flags.metadata
        ? {
            metadata: {
              metadataEntries: flags.metadata,
              directoryPaths: this.project!.getUniquePackageDirectories().map(
                (dir) => dir.fullPath
              ),
            },
          }
        : {}),
    });
    const objects = await componentSet.getObject();

    const requiredChannels: (keyof Channels)[] = [];
    if (flags["1gp-managed"]) {
      requiredChannels.push("classicManagedPackaging");
    }
    if (flags["1gp-unmanaged"]) {
      requiredChannels.push("classicUnmanagedPackaging");
    }
    if (flags["2gp-managed"]) {
      requiredChannels.push("managedPackaging");
    }
    if (flags["2gp-unlocked"]) {
      requiredChannels.push("unlockedPackagingWithoutNamespace");
    }
    if (flags["2gp-unlocked-with-namespace"]) {
      requiredChannels.push("unlockedPackagingWithNamespace");
    }
    if (flags["source-tracking"]) {
      requiredChannels.push("sourceTracking");
    }
    if (flags["tooling-api"]) {
      requiredChannels.push("toolingApi");
    }
    if (flags["metadata-api"]) {
      requiredChannels.push("metadataApi");
    }
    if (flags["apex-metadata-api"]) {
      requiredChannels.push("apexMetadataApi");
    }
    if (flags.changesets) {
      requiredChannels.push("changeSets");
    }
    if (requiredChannels.length === 0) {
      this.warn("You haven't specified any channels using flags. ");
    }

    const result: MetadataCoverageResult = {
      success: true,
      uncovered: [],
    };
    for (const mdType of objects.Package.types) {
      let typeName = mdType.name;
      if (typeName === "Settings") {
        for (const setting of mdType.members) {
          typeName = `${setting}Settings`;
          const coverage = report.types[typeName];
          if (!coverage) {
            result.success = false;
            result.uncovered.push({
              type: typeName,
              members: [`${setting}Settings`],
            });
          } else if (
            requiredChannels.some((channel) => !coverage.channels[channel])
          ) {
            result.success = false;
            result.uncovered.push({
              type: typeName,
              members: [`${setting}Settings`],
              channels: coverage.channels,
            });
          }
        }
        continue;
      }
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
    this.logToStderr("Successfully checked Metadata Coverage Report.");
    return result;
  }
}
