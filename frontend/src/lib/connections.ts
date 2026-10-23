import { getRefreshToken } from "@descope/nextjs-sdk/client";
import { apiFetch } from "./api";
import { ConnectionInfo } from "./types";
import { redirect } from "next/dist/server/api-utils";

export async function fetchCalendarConnection(token: string) {
  const data = await apiFetch<{ connection: ConnectionInfo }>(
    "/api/connections",
    { token },
  );

    console.log('onloading',data)
  return data.connection;
}

export async function connectCalendar(token: string) {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("refreshToken invalid");

  const result = await apiFetch<{ url: string }>("/api/connections/connect", {
    method: "POST",
    token,
    body: {
      redirectUrl: `${window.location.origin}/dashboard`,
      refreshToken,
    },
  });
  console.log("redirect", `${window.location.origin}/dashboard`  )
  console.log("result",result);

  window.location.href = result.url;
}

export async function refreshCalendarConnection(token: string) {
  await apiFetch("/api/connections/refresh-status", {
    method: "POST",
    token,
  });
}
/////////////////////Sheets/////////////////////
export async function fetchSheetsConnection(token: string) {
  const data = await apiFetch<{ connection: ConnectionInfo }>(
    "/api/connections/sheets",
    { token },
  );

    console.log('onloading',data)
  return data.connection;
}


export async function connectSheets(token: string) {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("refreshToken invalid");

  const result = await apiFetch<{ url: string }>("/api/connections/sheets/connect", {
    method: "POST",
    token,
    body: {
      redirectUrl: `${window.location.origin}/dashboard`,
      refreshToken,
    },
  });
  console.log("sheets redirect", `${window.location.origin}/dashboard`  )
  console.log("sheets result",result);

  window.location.href = result.url;
}


export async function refreshSheetsConnection(token: string) {
  await apiFetch("/api/connections/sheets/refresh-status", {
    method: "POST",
    token,
  });
}
