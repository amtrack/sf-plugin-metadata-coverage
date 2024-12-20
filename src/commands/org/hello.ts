import { Flags, SfCommand } from "@salesforce/sf-plugins-core";
import { queryOrganization } from "../../queries.js";

export type OrgHelloResult = {
  orgId: string;
  outputString: string;
};

export class OrgHelloCommand extends SfCommand<OrgHelloResult> {
  public static readonly summary = "print a greeting and your org IDs";
  public static readonly examples = [
    "<%= config.bin %> <%= command.id %> --target-org myOrg@example.com",
    "<%= config.bin %> <%= command.id %> --name myname --target-org myOrg@example.com",
  ];

  public static readonly flags = {
    "target-org": Flags.requiredOrg(),
    name: Flags.string({
      char: "n",
      summary: "name to print",
      default: "world",
    }),
  };

  public async run(): Promise<OrgHelloResult> {
    const { flags } = await this.parse(OrgHelloCommand);
    const conn = flags["target-org"].getConnection();
    const organization = await queryOrganization(conn);
    let outputString = `Hello ${flags.name}! This is org: ${organization.Name}`;
    if (organization.TrialExpirationDate) {
      const date = new Date(
        new Date(organization.TrialExpirationDate).setUTCHours(0)
      ).toDateString();
      outputString = `${outputString} and I will be around until ${date}!`;
    }
    this.log(outputString);

    // Return an object to be displayed with --json
    return { orgId: organization.Id, outputString };
  }
}
