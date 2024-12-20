import { Flags, SfCommand } from "@salesforce/sf-plugins-core";
import {
  ComponentSet,
  ComponentSetBuilder,
} from "@salesforce/source-deploy-retrieve";
import {
  download,
  load,
  store,
  type Channels,
} from "../../metadata-coverage-report.js";
import {
  validateMetadataTypes,
  type MetadataCoverageResult,
} from "../../validation.js";

export class MetadataCoverageCheck extends SfCommand<MetadataCoverageResult> {
  public static readonly summary =
    "Check the Metadata Coverage for the given source directory, metadata type or package.xml.";
  public static readonly examples = [
    "<%= config.bin %> <%= command.id %> --source-dir force-app --2gp-unlocked",
    "<%= config.bin %> <%= command.id %> --manifest src/package.xml --1gp-managed",
    "<%= config.bin %> <%= command.id %> --metadata CustomHelpMenuSection --2gp-unlocked",
    "<%= config.bin %> <%= command.id %> --metadata CustomHelpMenuSection --2gp-unlocked --2gp-managed",
    "<%= config.bin %> <%= command.id %> --metadata CustomHelpMenuSection --2gp-managed --api-version 65.0",
  ];

  public static readonly requiresProject = true;

  public static readonly flags = {
    "api-version": Flags.orgApiVersion({
      description: "The API version of the Metadata Coverage Report to use.",
    }),

    /** Sources */
    "source-dir": Flags.string({
      char: "d",
      summary: "File paths for source to check.",
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
      summary: "Metadata component names to check.",
      multiple: true,
      exactlyOne: ["manifest", "metadata", "source-dir"],
      helpGroup: "Sources",
    }),

    /** Metadata Coverage Channels */
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
  };

  public async run(): Promise<MetadataCoverageResult> {
    const { flags } = await this.parse(MetadataCoverageCheck);

    const channelsToCheck: (keyof Channels)[] = [];
    for (const flag of Object.keys(FLAG_TO_CHANNEL)) {
      if (flags[flag as keyof typeof flags]) {
        channelsToCheck.push(
          FLAG_TO_CHANNEL[flag as keyof typeof FLAG_TO_CHANNEL]
        );
      }
    }
    if (channelsToCheck.length === 0) {
      const flagNames = METADATA_COVERAGE_CHANNEL_FLAGNAMES.map(
        (name) => `--${name}`
      );
      this.error(
        `You haven't specified any channels using flags. Please refine using any of the following flags:\n${flagNames.join(
          "\n"
        )}`
      );
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
    const apiVersion = this.determineApiVersion(
      componentSet,
      flags["api-version"]
    );
    const majorApiVersion = apiVersion.split(".")[0];

    const report = await this.getReport(majorApiVersion);
    const packageXmlObject = await componentSet.getObject();

    this.logToStderr(
      `Found ${packageXmlObject.Package.types.length} metadata type${
        packageXmlObject.Package.types.length > 1 ? "s" : ""
      } to check.`
    );

    const result = validateMetadataTypes(
      packageXmlObject.Package.types,
      report,
      channelsToCheck
    );
    this.outputResult(result);
    return result;
  }

  async getReport(majorApiVersion: string) {
    try {
      const report = await load(majorApiVersion);
      this.logToStderr(
        `Using cached Metadata Coverage Report v${majorApiVersion}.`
      );
      return report;
    } catch (e) {
      const report = await download(majorApiVersion, this.spinner);
      await store(report);
      return report;
    }
  }

  determineApiVersion(
    componentSet: ComponentSet,
    explicitApiVersion: string | undefined
  ): string {
    const sourceApiVersion =
      this.project!.getSfProjectJson().get("sourceApiVersion");
    const apiVersion =
      explicitApiVersion ?? componentSet.sourceApiVersion ?? sourceApiVersion;
    if (!apiVersion) {
      throw new Error("Could not determine API version");
    }
    return apiVersion;
  }

  private outputResult(result: MetadataCoverageResult): void {
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
  }
}

export const METADATA_COVERAGE_CHANNEL_FLAGNAMES = Object.values(
  MetadataCoverageCheck.flags
)
  .filter((flag) => flag.helpGroup === "Metadata Coverage Channels")
  .map((flag) => flag.name);

const FLAG_TO_CHANNEL: Record<
  (typeof METADATA_COVERAGE_CHANNEL_FLAGNAMES)[number],
  keyof Channels
> = {
  "1gp-managed": "classicManagedPackaging",
  "1gp-unmanaged": "classicUnmanagedPackaging",
  "2gp-managed": "managedPackaging",
  "2gp-unlocked": "unlockedPackagingWithoutNamespace",
  "2gp-unlocked-with-namespace": "unlockedPackagingWithNamespace",
  "source-tracking": "sourceTracking",
  "tooling-api": "toolingApi",
  "metadata-api": "metadataApi",
  "apex-metadata-api": "apexMetadataApi",
  changesets: "changeSets",
};
