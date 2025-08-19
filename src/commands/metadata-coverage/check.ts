import { Flags, SfCommand } from "@salesforce/sf-plugins-core";
import { ComponentSetBuilder } from "@salesforce/source-deploy-retrieve";
import { readFileSync } from "node:fs";
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
    console.error(flags["api-version"]);
    const apiVersion = "62.0";
    const sourceApiVersion = this.project
      ?.getSfProjectJson()
      .get("sourceApiVersion");
    console.error({ sourceApiVersion });
    const apiVersionMajor = apiVersion.split(".")[0];
    // const reportResult = await fetch(
    //   `https://dx-extended-coverage.my.salesforce-sites.com/services/apexrest/report?version=${apiVersionMajor}`
    // );
    // const report = await reportResult.json();
    const report = JSON.parse(
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
    // console.log({ report });
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
    const packageDirectories = this.project!.getPackageDirectories();
    const sourcePaths = packageDirectories.map((dir) => dir.path);
    const componentSet = await ComponentSetBuilder.build({
      sourcepath: sourcePaths,
    });
    const objects = await componentSet.getObject();
    let success = true;
    for (const mdType of objects.Package.types) {
      const coverage = report.types[mdType.name];
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
