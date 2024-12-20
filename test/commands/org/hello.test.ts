import { Connection } from "@salesforce/core";
import { MockTestOrgData, TestContext } from "@salesforce/core/testSetup";
import { stubSfCommandUx } from "@salesforce/sf-plugins-core";
import { expect } from "chai";
import { OrgHelloCommand } from "../../../src/commands/org/hello.js";

describe("org hello", () => {
  const $$ = new TestContext();
  const testOrg = new MockTestOrgData();

  beforeEach(async () => {
    await $$.stubAuths(testOrg);
    stubSfCommandUx($$.SANDBOX);
  });

  it("should return an expiration date for a scratch org", async () => {
    $$.SANDBOX.stub(Connection.prototype, "query").resolves({
      records: [
        {
          Id: testOrg.orgId,
          Name: "Super Awesome Org",
          TrialExpirationDate: "2018-03-20T23:24:11.000+0000",
        },
      ],
      done: true,
      totalSize: 1,
    });
    const result = await OrgHelloCommand.run(["-o", testOrg.username]);
    expect(result.orgId).to.deep.equal(testOrg.orgId);
    expect(result.outputString).to.deep.equal(
      "Hello world! This is org: Super Awesome Org and I will be around until Tue Mar 20 2018!"
    );
  });

  it("should not return an expiration date for a permanent org", async () => {
    $$.SANDBOX.stub(Connection.prototype, "query").resolves({
      records: [
        {
          Id: testOrg.orgId,
          Name: "Super Permantent Org",
          TrialExpirationDate: null,
        },
      ],
      done: true,
      totalSize: 1,
    });
    const result = await OrgHelloCommand.run(["-o", testOrg.username]);
    expect(result.orgId).to.deep.equal(testOrg.orgId);
    expect(result.outputString).to.deep.equal(
      "Hello world! This is org: Super Permantent Org"
    );
  });
});
