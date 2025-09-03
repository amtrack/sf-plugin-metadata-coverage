#!/usr/bin/env node

import { createWriteStream } from "node:fs";
import { join } from "node:path";
import { Readable } from "node:stream";
import { REPORT_URL } from "../src/commands/metadata-coverage/check.ts";

const result = await fetch("https://org62.my.salesforce.com/services/data");
const releases = await result.json();
const latest5Releases = releases.splice(releases.length - 5);
const versionNumbers = latest5Releases.map((release) => release.version);
console.error(`Latest 5 Releases: ${versionNumbers.join(", ")}`);

for (const versionNumber of versionNumbers) {
  const apiVersionMajor = versionNumber.split(".")[0];
  console.error(
    `Downloading Metadata Coverage Report for ${apiVersionMajor}...`
  );
  const response = await fetch(`${REPORT_URL}?version=${apiVersionMajor}`);
  let writer = createWriteStream(
    join("data", `report-${apiVersionMajor}.json`)
  );
  Readable.fromWeb(response.body).pipe(writer);
  console.error(`Done`);
}
