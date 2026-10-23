import "dotenv/config";
import cors from "cors";
import express from "express";
 import { getPool } from "./db/pool.js";
 import { connectionRouter, connectionRouter1 } from "./routes/connection.routes.js";
 import { agentRoutes } from "./routes/agent.routes.js";
// import { mountMcpServer } from "./mcp/mount.js";

const app = express();
const port = Number(process.env.PORT) || 4000;
const appOrigin = process.env.APP_URL ?? "http://localhost:3000";

app.use(
  cors({
    origin: appOrigin,
    credentials: true,
  }),
);

app.use(express.json());


app.get("/health", async (_req, res) => {
  try {  
    await getPool().query("SELECT 1");
    res.json({ status: "ok", service: "agentic-calendar-app", database: "up" });
  } catch (err){   
    console.error("Database connection error:", err); // <--- Add this line
    //console.log("Database connection error:", err);
    res.status(503).json({
      status: "error",
      service: "agentic-calendar-app",
      database: "down",
    });
  }
});

app.use("/api/connections", connectionRouter)
app.use("/api/connections/sheets", connectionRouter1)
app.use("/api/agent", agentRoutes)

// mountMcpServer(app);

 app.listen(port, () => {
   console.log(`Agentic Calendar App is running on port: ${port}`);
 });
