import { Flags, SfCommand } from "@salesforce/sf-plugins-core";
import { ComponentSetBuilder } from "@salesforce/source-deploy-retrieve";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Channels, MetadataCoverageReport } from "../../types.js";

export const REPORT_URL =
  "https://dx-extended-coverage.my.salesforce-sites.com/services/apexrest/report";

export type MetadataCoverageResult = {
  success: boolean;
  message: string;
  unsupported: {
    type: string;
    members: string[];
    channels: Partial<Channels>;
  }[];
};

export class MetadataCoverageCheck extends SfCommand<MetadataCoverageResult> {
  public static readonly summary =
    "check the Metadata Coverage for the given source";
  public static readonly examples = [
    "<%= config.bin %> <%= command.id %> --metadata CustomHelpMenuSection --2gp-managed",
    "<%= config.bin %> <%= command.id %> --metadata CustomHelpMenuSection --2gp-managed --api-version 65.0",
    "<%= config.bin %> <%= command.id %> --source-dir force-app",
    "<%= config.bin %> <%= command.id %> --source-dir force-app --source-dir unpackaged",
    "<%= config.bin %> <%= command.id %> --manifest src/package.xml",
  ];

  public static readonly requiresProject = true;

  public static readonly flags = {
    "source-dir": Flags.string({
      char: "d",
      summary: `File paths for source to check.`,
      multiple: true,
      exactlyOne: ["manifest", "metadata", "source-dir"],
      helpGroup: "Sources",
    }),
    manifest: Flags.file({
      char: "x",
      summary:
        "File path for the manifest (package.xml) that specifies the components to check.",
      exactlyOne: ["manifest", "metadata", "source-dir"],
      exists: true,
      helpGroup: "Sources",
    }),
    metadata: Flags.string({
      char: "m",
      summary: `Metadata component names to check.`,
      multiple: true,
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
      report = JSON.parse(readFileSync(reportPath, "utf8"));
    } else {
      this.spinner.start(
        `Downloading Metadata Coverage Report v${apiVersionMajor}`
      );
      const reportResponse = await fetch(
        `${REPORT_URL}?version=${apiVersionMajor}`
      );
      this.spinner.stop();
      if (!reportResponse.ok) {
        throw new Error("Failed downloading Metadata Coverage Report.");
      }
      report = (await reportResponse.json()) as MetadataCoverageReport;
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
    this.logToStderr(
      `Checking ${objects.Package.types.length} metadata type${
        objects.Package.types.length > 1 ? "s" : ""
      }.`
    );

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
      const coverageChannelFlags = Object.values(MetadataCoverageCheck.flags)
        .filter((flag) => flag.helpGroup === "Metadata Coverage Channels")
        .map((flag) => `--${flag.name}`);
      this.warn(
        `You haven't specified any channels using flags. Please refine using any of the following flags: ${coverageChannelFlags.join(
          ", "
        )}`
      );
    }

    const result: MetadataCoverageResult = {
      success: true,
      message: "All metadata types are supported.",
      unsupported: [],
    };
    for (const mdType of objects.Package.types) {
      let typeName = mdType.name;
      if (typeName === "Settings") {
        for (const setting of mdType.members) {
          typeName = `${setting}Settings`;
          const coverageForType = report.types[typeName];
          if (!coverageForType) {
            result.success = false;
            result.unsupported.push({
              type: typeName,
              members: [`${setting}Settings`],
              channels: {},
            });
          } else if (
            requiredChannels.some(
              (channel) => !coverageForType.channels[channel]
            )
          ) {
            result.success = false;
            const channels = Object.fromEntries(
              requiredChannels
                .filter((key) => key in coverageForType.channels)
                .map((key) => [key, coverageForType.channels[key]])
            );
            result.unsupported.push({
              type: typeName,
              members: [`${setting}Settings`],
              channels,
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
      const coverageForType = report.types[typeName];
      if (!coverageForType) {
        result.success = false;
        result.unsupported.push({
          type: typeName,
          members: mdType.members,
          channels: {},
        });
      } else if (
        requiredChannels.some((channel) => !coverageForType.channels[channel])
      ) {
        result.success = false;
        result.message = "Some metadata types are not supported.";
        const channels = Object.fromEntries(
          requiredChannels
            .filter((key) => key in coverageForType.channels)
            .map((key) => [key, coverageForType.channels[key]])
        );
        result.unsupported.push({
          type: typeName,
          members: mdType.members,
          channels,
        });
      }
    }
    if (result.success) {
      this.logSuccess(result.message);
    } else {
      if (!this.jsonEnabled()) {
        this.styledHeader("Unsupported Metadata Types");
        const data = result.unsupported.map((row) => ({
          type: row.type,
          ...row.channels,
          members: row.members.join(", "),
        }));
        this.table({
          data,
        });
        this.error(result.message);
      }
    }
    return result;
  }
}
