import { type Connection } from "@salesforce/core";

interface Organization {
  Id: string;
  Name: string;
  TrialExpirationDate: string | null;
}

export async function queryOrganization(
  conn: Connection
): Promise<Organization> {
  const query = "Select Id, Name, TrialExpirationDate from Organization";
  const result = await conn.query<Organization>(query);
  return result.records[0];
}
