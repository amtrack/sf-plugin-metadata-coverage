import { TestContext } from "@salesforce/core/testSetup";
import { stubSfCommandUx } from "@salesforce/sf-plugins-core";
import { expect } from "chai";
import { join } from "node:path";
import { MetadataCoverageCheck } from "../../../src/commands/metadata-coverage/check.js";

describe("metadata-coverage check", () => {
  const $$ = new TestContext();
  stubSfCommandUx($$.SANDBOX);

  beforeEach(async () => {
    $$.inProject(true);
  });

  it("should check successfully", async () => {
    const result = await MetadataCoverageCheck.run([
      "--source-dir",
      join("test", "fixtures", "unpackaged"),
      "--2gp-unlocked",
    ]);
    expect(result.success).to.equal(true);
    expect(result.unsupported).to.have.length(0);
  });

  it("should fail when unsupported", async () => {
    const result = await MetadataCoverageCheck.run([
      "--source-dir",
      join("test", "fixtures", "unpackaged"),
      "--2gp-managed",
      "--json",
    ]);
    expect(result.success).to.equal(false);
    expect(result.unsupported).to.have.length(1);
  });
});
