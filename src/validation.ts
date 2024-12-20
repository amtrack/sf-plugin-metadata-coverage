import type {
  Channels,
  MetadataCoverageReport,
} from "./metadata-coverage-report.js";

export function isFullySupported(
  reportChannels: Channels,
  requiredChannels: (keyof Channels)[]
): boolean {
  return requiredChannels.every((channel) => reportChannels[channel]);
}

export function getFilteredChannels(
  channels: Channels,
  requiredChannels: (keyof Channels)[]
): Partial<Channels> {
  return Object.fromEntries(
    requiredChannels
      .filter((key) => key in channels)
      .map((key) => [key, channels[key]])
  );
}

export function mapTypeForMetadataReport(typeName: string): string {
  switch (typeName) {
    case "CustomLabel":
      return "CustomLabels";
    case "MatchingRule":
      return "MatchingRules";
    default:
      return typeName;
  }
}

export function isSettingsType(typeName: string): boolean {
  return typeName === "Settings";
}

export function createSettingsTypeName(setting: string): string {
  return `${setting}Settings`;
}

export type MetadataCoverageResult = {
  success: boolean;
  message: string;
  unsupported: {
    type: string;
    members: string[];
    channels: Partial<Channels>;
  }[];
};

export function validateMetadataTypes(
  metadataTypes: { name: string; members: string[] }[],
  report: MetadataCoverageReport,
  requiredChannels: (keyof Channels)[]
): MetadataCoverageResult {
  const result: MetadataCoverageResult = {
    success: true,
    message: "All metadata types are supported.",
    unsupported: [],
  };

  for (const mdType of metadataTypes) {
    if (isSettingsType(mdType.name)) {
      validateSettingsType(mdType, report, requiredChannels, result);
    } else {
      validateRegularType(mdType, report, requiredChannels, result);
    }
  }

  if (!result.success) {
    result.message = "Some metadata types are not supported.";
  }

  return result;
}

function validateSettingsType(
  mdType: { name: string; members: string[] },
  report: MetadataCoverageReport,
  requiredChannels: (keyof Channels)[],
  result: MetadataCoverageResult
): void {
  for (const setting of mdType.members) {
    const typeName = createSettingsTypeName(setting);
    const coverageForType = report.types[typeName];

    if (!coverageForType) {
      result.success = false;
      result.unsupported.push({
        type: typeName,
        members: [`${setting}Settings`],
        channels: {},
      });
    } else if (!isFullySupported(coverageForType.channels, requiredChannels)) {
      result.success = false;
      const channels = getFilteredChannels(
        coverageForType.channels,
        requiredChannels
      );
      result.unsupported.push({
        type: typeName,
        members: [`${setting}Settings`],
        channels,
      });
    }
  }
}

function validateRegularType(
  mdType: { name: string; members: string[] },
  report: MetadataCoverageReport,
  requiredChannels: (keyof Channels)[],
  result: MetadataCoverageResult
): void {
  const typeName = mapTypeForMetadataReport(mdType.name);
  const coverageForType = report.types[typeName];

  if (!coverageForType) {
    result.success = false;
    result.unsupported.push({
      type: typeName,
      members: mdType.members,
      channels: {},
    });
  } else if (!isFullySupported(coverageForType.channels, requiredChannels)) {
    result.success = false;
    const channels = getFilteredChannels(
      coverageForType.channels,
      requiredChannels
    );
    result.unsupported.push({
      type: typeName,
      members: mdType.members,
      channels,
    });
  }
}
