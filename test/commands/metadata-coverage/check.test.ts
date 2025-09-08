import { TestContext } from "@salesforce/core/testSetup";
import { stubSfCommandUx } from "@salesforce/sf-plugins-core";
import { expect } from "chai";
import { join } from "node:path";
import { MetadataCoverageCheck } from "../../../src/commands/metadata-coverage/check.js";
import { SfProject } from "@salesforce/core";
import { mkdirSync, rmSync } from "node:fs";

describe("metadata-coverage check", function () {
  this.slow(8_000);
  this.timeout(15_000);

  const $$ = new TestContext();
  let project: SfProject;

  beforeEach(async () => {
    $$.inProject(true);
    project = SfProject.getInstance();
    stubSfCommandUx($$.SANDBOX);
    mkdirSync(join(project.getPath(), "force-app"), { recursive: true });
    project.getSfProjectJson().set("packageDirectories", [
      {
        path: "force-app",
        default: true,
      },
    ]);
    project.getSfProjectJson().set("sourceApiVersion", "64.0");
    await project.getSfProjectJson().write();
  });

  it("should fail with exit code when no channel specified", async () => {
    let err;
    try {
      await MetadataCoverageCheck.run([
        "--source-dir",
        join("test", "fixtures", "unpackaged"),
      ]);
    } catch (e) {
      err = e;
    }
    expect(err).to.match(/You haven't specified any channels/);
    expect(err).to.match(/--2gp-managed/);
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
    expect(result.unsupported[0].type).to.equal("CustomHelpMenuSection");
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

  it("should download specific version of report and run check", async () => {
    after(() => {
      rmSync(join("data", "report-59.json"), { force: true });
    });
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
