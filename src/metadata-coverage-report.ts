import type { Spinner } from "@salesforce/sf-plugins-core";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export interface MetadataCoverageReport {
  types: {
    [key: string]: {
      channels: Channels;
    };
  };
  versions: {
    selected: number;
    max: number;
    min: number;
  };
}

export interface Channels {
  unlockedPackagingWithoutNamespace: boolean;
  unlockedPackagingWithNamespace: boolean;
  toolingApi: boolean;
  sourceTracking: boolean;
  metadataApi: boolean;
  managedPackaging: boolean;
  classicUnmanagedPackaging: boolean;
  classicManagedPackaging: boolean;
  changeSets: boolean;
  apexMetadataApi: boolean;
}

export const REPORT_URL =
  "https://dx-extended-coverage.my.salesforce-sites.com/services/apexrest/report";

export async function download(
  majorApiVersion: string,
  spinner?: Spinner
): Promise<MetadataCoverageReport> {
  spinner?.start(`Downloading Metadata Coverage Report v${majorApiVersion}`);
  try {
    const reportResponse = await fetch(
      `${REPORT_URL}?version=${majorApiVersion}`
    );
    if (!reportResponse.ok) {
      throw new Error("Failed downloading Metadata Coverage Report.");
    }
    return (await reportResponse.json()) as MetadataCoverageReport;
  } finally {
    spinner?.stop();
  }
}

export async function load(majorApiVersion: string) {
  const reportPath = getLocalReportPath(majorApiVersion);
  if (existsSync(reportPath)) {
    return JSON.parse(readFileSync(reportPath, "utf8"));
  }
  throw new Error("Failed loading local Report");
}

export async function store(report: MetadataCoverageReport) {
  const majorApiVersion = String(report.versions.selected);
  mkdirSync(getStorageDirectory(), { recursive: true });
  writeFileSync(getLocalReportPath(majorApiVersion), JSON.stringify(report));
}

function getStorageDirectory() {
  return join(dirname(new URL(import.meta.url).pathname), "..", "data");
}

function getLocalReportPath(majorApiVersion: string): string {
  return join(getStorageDirectory(), `report-${majorApiVersion}.json`);
}
