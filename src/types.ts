export interface MetadataCoverageReport {
  types: { [key: string]: Type };
}

export interface Type {
  details: Detail[];
  knownIssues: KnownIssue[] | null;
  channels: Channels;
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

export interface Detail {
  url: null | string;
  name: Name;
  detailText?: null;
  detailRichText?: string;
}

export enum Name {
  DevHubRequirementWhenUsingScratchOrgs = "Dev Hub requirement when using scratch orgs",
  MetadataAPIDocumentation = "Metadata API Documentation",
  Pilot = "Pilot",
}

export interface KnownIssue {
  url: string;
  lastUpdated: string;
  affectedUsers: number;
  tags: null | string;
  status: Status;
  summary: string;
  title: string;
}

export enum Status {
  Fixed = "Fixed",
  InReview = "In Review",
  NoFix = "No Fix",
}
