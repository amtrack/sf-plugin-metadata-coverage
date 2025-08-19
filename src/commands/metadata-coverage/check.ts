import { Flags, SfCommand } from "@salesforce/sf-plugins-core";
import { ComponentSetBuilder } from "@salesforce/source-deploy-retrieve";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

export type MetadataCoverageResult = {
  success: boolean;
  outputString: string;
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
    let report;
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
      report = await reportResult.json();
      this.spinner.stop();
    }
    const packageDirectories = this.project!.getPackageDirectories();
    const sourcePaths = packageDirectories.map((dir) => dir.path);
    const componentSet = await ComponentSetBuilder.build({
      sourcepath: sourcePaths,
    });
    const objects = await componentSet.getObject();

    // channels: {
    //   unlockedPackagingWithoutNamespace: true,
    //   unlockedPackagingWithNamespace: true,
    //   toolingApi: true,
    //   sourceTracking: true,
    //   metadataApi: true,
    //   managedPackaging: true,
    //   classicUnmanagedPackaging: true,
    //   classicManagedPackaging: true,
    //   changeSets: true,
    //   apexMetadataApi: false
    // }
    const requiredChannels = [
      "managedPackaging",
      "unlockedPackagingWithoutNamespace",
    ];

    let success = true;
    for (const mdType of objects.Package.types) {
      let typeName = mdType.name;
      if (typeName === "CustomLabel") {
        typeName = "CustomLabels";
      }
      if (typeName === "MatchingRule") {
        typeName = "MatchingRules";
      }
      const coverage = report.types[typeName];
      if (requiredChannels.some((channel) => !coverage?.channels[channel])) {
        success = false;
        console.error(mdType.name, mdType.members, coverage?.channels);
      }
    }
    const result: MetadataCoverageResult = {
      success,
      outputString: success
        ? "Successfully checked Metadata Coverage Report."
        : "Some metadata types are not covered.",
    };
    this.log(result.outputString);
    return result;
  }
}
