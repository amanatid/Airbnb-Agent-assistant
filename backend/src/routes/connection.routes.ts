import { Router } from "express";
import { requireSession } from "../middleware/requireSession.js";
import {
  createCalendarConnectUrl,
  createSheetsConnectUrl,
  getCalendarConnection,
  getSheetsConnection,
  refreshCalendarConnection,
  refreshSheetsConnection,
} from "../services/connection.service.js";


export const connectionRouter = Router();


connectionRouter.use(requireSession);

connectionRouter.get("/", async (req, res) => {
  try {
    const connection = await getCalendarConnection(req.auth!.userId);
    // Fetch both connections in parallel
    // const [connection, sheetsConnection] = await Promise.all([
    //   getCalendarConnection(req.auth!.userId),
    //   getSheetsConnection(req.auth!.userId),
    // ]);
    console.log('hit  get  connect....')  
    res.json({ connection });
 //   res.json({ connection, sheetsConnection });
  } catch {
    res.status(500).json({ error: "could not load connections" });
  }
});

connectionRouter.post("/connect", async (req, res) => {
  try {
    console.log('hit  post connect....')
    const refreshToken =
      typeof req.body?.refreshToken === "string" ? req.body.refreshToken : "";

    if (!refreshToken) {
      res.status(400).json({ error: "Refresh token required" });
    }

    const redirectUrl =
      typeof req.body?.redirectUrl === "string"
        ? req.body.redirectUrl
        : `${process.env.APP_URL ?? "http://localhost:3000"}/dashboard`;

    const result = await createCalendarConnectUrl({
      userId: req.auth!.userId,
      refreshToken,
      redirectUrl,
    });

    // const [result, result1] = await Promise.all([
    //    createCalendarConnectUrl({
    //      userId: req.auth!.userId,
    //     refreshToken,
    //     redirectUrl,
    //  }),
    //   createSheetsConnectUrl({
    //    userId: req.auth!.userId,
    //    refreshToken,
    //    redirectUrl,
    //   })
    // ]);


    res.json(result);
   // res.json({result, result1});

  } catch {
    res.status(500).json({ error: "could not start connection" });
  }
});

connectionRouter.post("/refresh-status", async (req, res) => {
  try {
    const connection = await refreshCalendarConnection({
      userId: req.auth!.userId,
      authUserId: req.auth!.authUserId,
    });

    // const [connection, connection1] = await Promise.all([
    //           await refreshCalendarConnection({
    //             userId: req.auth!.userId,
    //             authUserId: req.auth!.authUserId,
    //           }),

    //           await refreshSheetsConnection({
    //             userId: req.auth!.userId,
    //             authUserId: req.auth!.authUserId,
    //           }),
              

    // ])

  //  res.json({ connection, connection1 });
    res.json({ connection});
  } catch {
    res.status(500).json({ error: "failed to refresh the status" });
  }
});



export const CALENDAR_CONNECTION_ID =
  process.env.DESCOPE_CALENDAR_CONNECTION_ID ?? "google-calendar";

export const CALENDAR_CONNECTION_LABEL = "Google Calendar";


///////////////////////////////////////////////////////////
export const connectionRouter1 = Router();
connectionRouter1.use(requireSession);

connectionRouter1.get("/", async (req, res) => {
  try {
    const connection = await getSheetsConnection(req.auth!.userId);

    res.json({ connection });
  } catch {
    res.status(500).json({ error: "could not load connections" });
  }
});



connectionRouter1.post("/connect", async (req, res) => {
  try {
    console.log('hit  post connect1....')
    const refreshToken =
      typeof req.body?.refreshToken === "string" ? req.body.refreshToken : "";

    if (!refreshToken) {
      res.status(400).json({ error: "Refresh token required" });
    }

    const redirectUrl =
      typeof req.body?.redirectUrl === "string"
        ? req.body.redirectUrl
        : `${process.env.APP_URL ?? "http://localhost:3000"}/dashboard`;

    const result = await createSheetsConnectUrl({
      userId: req.auth!.userId,
      refreshToken,
      redirectUrl,
    });

    // const [result, result1] = await Promise.all([
    //    createCalendarConnectUrl({
    //      userId: req.auth!.userId,
    //     refreshToken,
    //     redirectUrl,
    //  }),
    //   createSheetsConnectUrl({
    //    userId: req.auth!.userId,
    //    refreshToken,
    //    redirectUrl,
    //   })
    // ]);


    res.json(result);
   // res.json({result, result1});

  } catch {
    res.status(500).json({ error: "could not start connection" });
  }
});



connectionRouter1.post("/refresh-status", async (req, res) => {
  try {
    const connection = await refreshSheetsConnection({
      userId: req.auth!.userId,
      authUserId: req.auth!.authUserId,
    });

    // const [connection, connection1] = await Promise.all([
    //           await refreshCalendarConnection({
    //             userId: req.auth!.userId,
    //             authUserId: req.auth!.authUserId,
    //           }),

    //           await refreshSheetsConnection({
    //             userId: req.auth!.userId,
    //             authUserId: req.auth!.authUserId,
    //           }),
              

    // ])

  //  res.json({ connection, connection1 });
    res.json({ connection});
  } catch {
    res.status(500).json({ error: "failed to refresh the status" });
  }
});



export const SHEETS_CONNECTION_ID =
  process.env.DESCOPE_SHEETS_CONNECTION_ID ?? "google-sheets";

export const SHEETS_CONNECTION_LABEL = "Google Sheets";



