import { getPool } from "../db/pool.js";

export type ConnectionStatus = "connected" | "disconnected" | "pending";

export type CurrentConnectionRow = {
  user_id: string;
  provider: "calendar";
  status: ConnectionStatus;
};

export async function getCalendarConnectionRow(userId: string) {
  const result = await getPool().query<CurrentConnectionRow>(
    `
        SELECT user_id, provider, status
        FROM connections
        WHERE user_id = $1 AND provider = 'calendar'
        
        `,
    [userId],
  );

  return result.rows[0] ?? null;
}

export async function upsertCalendarConnection(input: {
  userId: string;
  status: ConnectionStatus;
}) {
  const result = await getPool().query<CurrentConnectionRow>(
    `
        INSERT INTO connections (user_id, provider, status)
        VALUES ($1, 'calendar', $2)
        on CONFLICT (user_id, provider)
        DO UPDATE SET status = EXCLUDED.status
        RETURNING user_id, provider, status
        
        `,
    [input.userId, input.status],
  );

  return result.rows[0];
}
///////////////////////////////////////////////
export type CurrentConnectionRowSheets = {
  user_id: string;
  provider: "sheets";
  status: ConnectionStatus;
};


export async function getSheetsConnectionRow(userId: string) {
  const result = await getPool().query<CurrentConnectionRowSheets>(
    `
        SELECT user_id, provider, status
        FROM connections1
        WHERE user_id = $1 AND provider = 'sheets'
        
        `,
    [userId],
  );

  return result.rows[0] ?? null;
}


export async function upsertSheetsConnection(input: {
  userId: string;
  status: ConnectionStatus;
}) {
  const result = await getPool().query<CurrentConnectionRowSheets>(
    `
        INSERT INTO connections1 (user_id, provider, status)
        VALUES ($1, 'sheets', $2)
        on CONFLICT (user_id, provider)
        DO UPDATE SET status = EXCLUDED.status
        RETURNING user_id, provider, status
        
        `,
    [input.userId, input.status],
  );

  return result.rows[0];
}
