import { LibSQLStore } from "@mastra/libsql";
import { Memory } from "@mastra/memory";
import { resolve } from "node:path";

const dbPath = resolve(process.cwd(), "mastra.db");

export const memoryStore = new LibSQLStore({
  id: "meeting-assistant-memory",
  url: `file:${dbPath}`,
});

export function createAgentMemory() {
  return new Memory({
    storage: memoryStore,
    options: {
      lastMessages: 20,
      workingMemory: {
        enabled: true,
        scope: "resource",
        template:
       `# Airbnb Reservation Preferences

          ## Property
          - Property name:
          - Property timezone:
          - Check-in time:
          - Check-out time:

          ## Google Sheets
          - Default reservation spreadsheet ID:
          - Default worksheet name: Reservations
          - Preferred columns:
          - Reporting preferences:

          ## Reservation Management
          - Default booking status:
          - Cancellation policy:
          - Calendar synchronization enabled:
          - Spreadsheet synchronization enabled:
          - Notes:
          `,
      },
    },
  });
}
