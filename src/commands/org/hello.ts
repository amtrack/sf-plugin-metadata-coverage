import { Flags, SfCommand } from "@salesforce/sf-plugins-core";

export type OrgHelloResult = {};

export class OrgHelloCommand extends SfCommand<OrgHelloResult> {
  public static readonly summary = "print a greeting and your org IDs";
  public static readonly examples = [
    "<%= config.bin %> <%= command.id %> --target-org myOrg@example.com",
    "<%= config.bin %> <%= command.id %> --name myname --target-org myOrg@example.com",
  ];

  public static readonly flags = {
    name: Flags.string({
      char: "n",
      summary: "name to print",
      default: "world",
    }),
  };

  public async run(): Promise<OrgHelloResult> {
    // const { flags } = await this.parse(OrgHelloCommand);
    const apiVersion = "62.0";
    const apiVersionMajor = apiVersion.split(".")[0];
    const reportResult = await fetch(
      `https://dx-extended-coverage.my.salesforce-sites.com/services/apexrest/report?version=${apiVersionMajor}`
    );
    const report = await reportResult.json();
    // console.log({ report });
    // @ts-expect-error
    console.log(report.types.WorkflowRule.channels);
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
    return {};
  }
}
