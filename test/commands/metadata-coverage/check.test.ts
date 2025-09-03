import { TestContext } from "@salesforce/core/testSetup";
import { stubSfCommandUx } from "@salesforce/sf-plugins-core";
import { expect } from "chai";
import { join } from "node:path";
import { MetadataCoverageCheck } from "../../../src/commands/metadata-coverage/check.js";

describe("metadata-coverage check", () => {
  const $$ = new TestContext();

  beforeEach(async () => {
    $$.inProject(true);
    stubSfCommandUx($$.SANDBOX);
    $$.setConfigStubContents("SfProjectJson", {
      contents: {
        packageDirectories: [{ path: "force-app", default: true }],
      },
    });
  });

  it("should succeed when all types of the metadata flag are supported", async () => {
    const result = await MetadataCoverageCheck.run([
      "--metadata",
      "ApexClass",
      "--metadata",
      "ApexTrigger",
      "--metadata-api",
    ]);
    expect(result.success).to.equal(true);
    expect(result.unsupported).to.have.length(0);
  });

  it("should succeed when all types in the source-dir are supported", async () => {
    const result = await MetadataCoverageCheck.run([
      "--source-dir",
      join("test", "fixtures", "unpackaged"),
      "--2gp-unlocked",
    ]);
    expect(result.success).to.equal(true);
    expect(result.unsupported).to.have.length(0);
  });
  it("should succeed when all types are supported", async () => {
    const result = await MetadataCoverageCheck.run([
      "--source-dir",
      join("test", "fixtures", "unpackaged"),
      "--2gp-unlocked",
    ]);
    expect(result.success).to.equal(true);
    expect(result.unsupported).to.have.length(0);
  });

  it("should fail when some types are unsupported", async () => {
    const result = await MetadataCoverageCheck.run([
      "--source-dir",
      join("test", "fixtures", "unpackaged"),
      "--2gp-managed",
      "--json",
    ]);
    expect(result.success).to.equal(false);
    expect(result.unsupported).to.have.length(1);
  });

  it.skip("should download specific version of report and run check", async function () {
    this.slow(5_000);
    this.timeout(10_000);
    const result = await MetadataCoverageCheck.run([
      "--api-version",
      "59.0",
      "--source-dir",
      join("test", "fixtures", "unpackaged"),
      "--2gp-unlocked",
    ]);
    expect(result.success).to.equal(true);
    expect(result.unsupported).to.have.length(0);
  });
});
