import { Flags, SfCommand } from "@salesforce/sf-plugins-core";
import { download, store } from "../../metadata-coverage-report.js";

export class MetadataCoverageDownload extends SfCommand<void> {
  public static readonly summary =
    "Explicitly download a Metadata Coverage Report.";
  public static readonly description =
    "By default it downloads the Metadata Coverage Report for the version of the sfdx-project.json > sourceApiVersion.";
  public static readonly examples = [
    "<%= config.bin %> <%= command.id %>",
    "<%= config.bin %> <%= command.id %> --api-version 65.0",
  ];

  public static readonly requiresProject = true;

  public static readonly flags = {
    "api-version": Flags.orgApiVersion({
      description: "The API version of the Metadata Coverage Report to use.",
    }),
  };

  public async run(): Promise<void> {
    const { flags } = await this.parse(MetadataCoverageDownload);
    const apiVersion =
      flags["api-version"] ??
      this.project!.getSfProjectJson().get("sourceApiVersion");
    if (!apiVersion) {
      throw new Error("Could not determine API version");
    }
    const majorApiVersion = apiVersion.split(".")[0];
    const report = await download(majorApiVersion, this.spinner);
    await store(report);
    this.spinner.stop();
  }
}
