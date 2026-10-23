import { CALENDAR_CONNECTION_ID,SHEETS_CONNECTION_ID, descopeClient } from "../config/descope.js";

export async function getCalendarAccessToken(authUserId: string) {
  if (!CALENDAR_CONNECTION_ID || !process.env.DESCOPE_MANAGEMENT_KEY) {
    throw new Error("connection is not configured");
  }

  const response =
    await descopeClient.management.outboundApplication.fetchToken(
      CALENDAR_CONNECTION_ID,
      authUserId,
    );

  const accessToken =
    response.ok && response.data
      ? (response.data as { accessToken?: string }).accessToken
      : undefined;

  if (!accessToken) {
    throw new Error(
      "Calender access token is not present, please check or reconnect",
    );
  }

  return accessToken;
}


////////////////////////////SHeets/////////////////////////////////


export async function getSheetsAccessToken(authUserId: string) {
  if (!SHEETS_CONNECTION_ID || !process.env.DESCOPE_MANAGEMENT_KEY) {
    throw new Error("connection is not configured");
  }

  const response =
    await descopeClient.management.outboundApplication.fetchToken(
      SHEETS_CONNECTION_ID,
      authUserId,
    );

  const accessToken =
    response.ok && response.data
      ? (response.data as { accessToken?: string }).accessToken
      : undefined;

  if (!accessToken) {
    throw new Error(
      "Sheets access token is not present, please check or reconnect",
    );
  }

  return accessToken;
}
