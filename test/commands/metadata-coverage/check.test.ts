import { TestContext } from "@salesforce/core/testSetup";
import { stubSfCommandUx } from "@salesforce/sf-plugins-core";
import { expect } from "chai";
import { MetadataCoverageCheck } from "../../../src/commands/metadata-coverage/check.js";

describe("metadata-coverage check", () => {
  const $$ = new TestContext();
  stubSfCommandUx($$.SANDBOX);

  beforeEach(async () => {
    $$.setConfigStubContents("SfProjectJson", {
      contents: {
        packageDirectories: [
          {
            path: "force-app",
            default: true,
          },
        ],
        sourceApiVersion: "64.0",
      },
    });
    // $$.inProject(true);
    // $$.localPathRetrieverSync()
  });

  it("should check successfully", async () => {
    const result = await MetadataCoverageCheck.run([
      "--source-dir",
      "force-app",
      "--2gp-unlocked",
    ]);
    expect(result.success).to.equal(true);
  });

  it.skip("should fail when uncovered", async () => {
    const result = await MetadataCoverageCheck.run([]);
    expect(result.success).to.equal(false);
  });
});
