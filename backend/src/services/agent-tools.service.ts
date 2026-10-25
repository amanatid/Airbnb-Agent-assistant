import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  cancelMeeting,
  checkCalendarBusy,
  createMeeting,
  listUpcomingMeetings,import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import {
  cancelMeeting,
  checkCalendarBusy,
  createMeeting,
  listUpcomingMeetings,
  rescheduleMeeting,
  createMeetingLogSheet,
  appendMeetingToSheet,
  readMeetingLogSheet,

  createReservationCalendarEvent,
  updateReservationCalendarEvent,
  cancelReservationCalendarEvent,
  createReservationSheet,
  appendReservationToSheet,
  readReservationSheet,
  updateReservationInSheet,
} from "./calendar.service.js";

//////////////////////////////////////////////////////////////
const reservationSchema = z.object({
  reservationId: z.string().min(1),
  guestName: z.string().min(1),
  arrivalDate: z.string().regex(/^\d{2}-\d{2}-\d{4}$/),
  departureDate: z.string().regex(/^\d{2}-\d{2}-\d{4}$/),
  totalCharge: z.number().nonnegative(),
  phoneNumber: z.string(),
  status: z.enum([
    "pending",
    "confirmed",
    "cancelled",
    "completed",
  ]).default("confirmed"),
  notes: z.string().optional(),
  calendarEventId: z.string().optional(),
});




function parseDisplayDate(value: string): string {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value);

  if (!match) {
    throw new Error("Date must be in DD-MM-YYYY format.");
  }

  const [, dd, mm, yyyy] = match;
  const iso = `${yyyy}-${mm}-${dd}`;
  const date = new Date(`${iso}T00:00:00.000Z`);

  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== iso
  ) {
    throw new Error(`Invalid calendar date: ${value}`);
  }

  return iso;
}

function calculateNights(
  arrivalDate: string,
  departureDate: string,
): number {
  const arrival = parseDisplayDate(arrivalDate);
  const departure = parseDisplayDate(departureDate);

  if (departure <= arrival) {
    throw new Error("Departure date must be later than arrival date.");
  }

  return Math.round(
    (
      Date.parse(`${departure}T00:00:00.000Z`) -
      Date.parse(`${arrival}T00:00:00.000Z`)
    ) / 86_400_000,
  );
}


export function createReservationTools(authUserId: string) {
  return {
    createReservationCalendarEvent: createTool({
      id: "createReservationCalendarEvent",
      description:
        "Create an all-day Google Calendar event for a guest's stay. " +
        "The departure date is the exclusive event end date.",
      inputSchema: reservationSchema,
      execute: async (input) => {
       

        const totalNights = calculateNights(
                input.arrivalDate,
                input.departureDate,
              );

        return await createReservationCalendarEvent({
          authUserId,
          ...input,
          totalNights,
        });
      },
    }),

    updateReservationCalendarEvent: createTool({
      id: "updateReservationCalendarEvent",
      description:
        "Update an existing reservation Calendar event by its event ID.",
      inputSchema: reservationSchema.extend({
        calendarEventId: z.string().min(1),
      }),
      execute: async (input) => {
       

      const totalNights = calculateNights(
                          input.arrivalDate,
                          input.departureDate,
                        );

        return await updateReservationCalendarEvent({
          authUserId,
          ...input,
          totalNights,
        });
      },
    }),

    cancelReservationCalendarEvent: createTool({
      id: "cancelReservationCalendarEvent",
      description:
        "Remove a reservation's Calendar event using its event ID.",
      inputSchema: z.object({
        calendarEventId: z.string().min(1),
      }),
      execute: async ({ calendarEventId }) =>
        cancelReservationCalendarEvent({
          authUserId,
          calendarEventId,
        }),
    }),

    createReservationSheet: createTool({
      id: "createReservationSheet",
      description: "Create a Google Sheets reservation register.",
      inputSchema: z.object({
        title: z.string().default("Airbnb Reservations"),
      }),
      execute: async ({ title }) =>
        createReservationSheet({ authUserId, title }),
    }),

    appendReservationToSheet: createTool({
      id: "appendReservationToSheet",
      description:
        "Append a new reservation to a Google Sheets register.",
      inputSchema: z.object({
        spreadsheetId: z.string().min(1),
        ...reservationSchema.shape,
        totalNights: z.number().int().positive(),
        calendarEventId: z.string().optional(),
      }),
      execute: async (input) => {
              const totalNights = calculateNights(
                input.arrivalDate,
                input.departureDate,
              );

              if (input.totalNights !== totalNights) {
                throw new Error(
                  "Total nights must match the arrival and departure dates.",
                );
}
        return await appendReservationToSheet({
          authUserId,
          ...input,
        });
      },
    }),

    updateReservationInSheet: createTool({
      id: "updateReservationInSheet",
      description:
        "Update an existing spreadsheet row identified by reservation ID.",
      inputSchema: z.object({
        spreadsheetId: z.string().min(1),
        reservationId: z.string().min(1),
        guestName: z.string().optional(),
        arrivalDate: z.string().optional(),
        departureDate: z.string().optional(),
        totalNights: z.number().int().positive().optional(),
        totalCharge: z.number().nonnegative().optional(),
        phoneNumber: z.string().optional(),
        status: z.enum([
          "pending", "confirmed", "cancelled", "completed",
        ]).optional(),
        calendarEventId: z.string().optional(),
        notes: z.string().optional(),
      }),
      execute: async (input) =>
        await updateReservationInSheet({
          authUserId,
          ...input,
        }),
    }),

    readReservationSheet: createTool({
      id: "readReservationSheet",
      description:
        "Read reservations from a Google Sheets register.",
      inputSchema: z.object({
        spreadsheetId: z.string().min(1),
        range: z.string().optional(),
      }),
      execute: async (input) =>
        await readReservationSheet({ authUserId, ...input }),
    }),
  };
}
//////////////////////////////////////////////////////////////////
export function createCalendarTools(authUserId: string) {
  return {
    listUpcomingMeetings: createTool({
      id: "listUpcomingMeetings",
      description:
        "List Google Calendar events. Set todayOnly=true for today's agenda only.",
      inputSchema: z.object({
        maxResults: z.number().int().min(1).max(20).optional(),
        todayOnly: z
          .boolean()
          .optional()
          .describe("If true, only return events for today"),
      }),
      execute: async ({ maxResults, todayOnly }) => {
        return await listUpcomingMeetings({
          authUserId,
          maxResults,
          todayOnly,
        });
      },
    }),

    checkCalendarBusy: createTool({
      id: "checkCalendarBusy",
      description:
        "Check if the user is busy between two ISO datetimes using Google freebusy.",
      inputSchema: z.object({
        startIso: z.string().describe("Start time as ISO-8601 datetime"),
        endIso: z.string().describe("End time as ISO-8601 datetime"),
      }),
      execute: async ({ startIso, endIso }) => {
        return await checkCalendarBusy({
          authUserId,
          startIso,
          endIso,
        });
      },
    }),
    createMeeting: createTool({
      id: "createMeeting",
      description:
        "Create a Google Calendar event. Adds a Google Meet link by default. Emails invites(send) when attendee Emails are set.",
      inputSchema: z.object({
        title: z.string().min(1),
        startIso: z.string().describe("Start time as ISO-8601 datetime"),
        endIso: z.string().describe("End time as ISO-8601 datetime"),
        attendeeEmails: z
          .array(z.string())
          .optional()
          .describe("Invite these emails; Google sends calendar invites"),
        description: z.string().optional(),
        addGoogleMeet: z
          .boolean()
          .optional()
          .describe("Default true. Set false to skip Google Meet link"),
      }),
      execute: async (input) => {
        return await createMeeting({
          authUserId,
          ...input,
        });
      },
    }),

    rescheduleMeeting: createTool({
      id: "rescheduleMeeting",
      description:
        "Move an existing event to a new start/end time and email invitees.",
      inputSchema: z.object({
        eventId: z.string().min(1),
        startIso: z.string().describe("Start time as ISO-8601 datetime"),
        endIso: z.string().describe("End time as ISO-8601 datetime"),
      }),

      execute: async (input) => {
        return await rescheduleMeeting({ authUserId, ...input });
      },
    }),

        


    cancelMeeting: createTool({
      id: "cancelMeeting",
      description:
        "Cancel a Google Calendar event by id and email attendees about the cancellation.",
      inputSchema: z.object({
        eventId: z.string().min(1),
      }),
      execute: async (input) => {
        return await cancelMeeting({
          authUserId,
          ...input,
        });
    
      },
    }),


    
   // --- Google Sheets Tools ---
    createMeetingLogSheet: createTool({
      id: "createMeetingLogSheet",
      description:
        "Create a new Google Sheet specifically designed for logging meeting records with standard header columns.",
      inputSchema: z.object({
        title: z
          .string()
          .optional()
          .describe("Title of the spreadsheet. Defaults to 'Meeting Log'."),
      }),
      execute: async ({ title }) => {
        return await createMeetingLogSheet({ authUserId, title });
      },
    }),

   
    appendMeetingToSheet: createTool({
      id: "appendMeetingToSheet",
      description:
        "Append a new meeting row (Date, Title, Attendees, Duration, Meet Link, Notes) to a Google Sheet.",
      inputSchema: z.object({
        spreadsheetId: z
          .string()
          .describe("The Google Sheet ID where data should be appended"),
        dateTime: z.string().describe("Formatted date/time string"),
        title: z.string().describe("Meeting title"),
        attendees: z.array(z.string()).optional().describe("List of attendee emails/names"),
        duration: z.string().optional().describe("Duration of the meeting (e.g., '30m', '1h')"),
        meetLink: z.string().optional().describe("Google Meet link if available"),
        notes: z.string().optional().describe("Meeting summary or notes"),
      }),
      execute: async (input) => {
        return await appendMeetingToSheet({ authUserId, ...input });
      },
    }),

    readMeetingLogSheet: createTool({
      id: "readMeetingLogSheet",
      description:
        "Read rows from a meeting log spreadsheet to fetch past meeting logs or history.",
      inputSchema: z.object({
        spreadsheetId: z.string().describe("The Google Sheet ID to read from"),
        range: z
          .string()
          .optional()
          .describe("Sheet range to read, defaults to 'Meetings!A1:Z100'"),
      }),
      execute: async (input) => {
        return await readMeetingLogSheet({ authUserId, ...input });
      },
    }),


  };
}

  rescheduleMeeting,
  createMeetingLogSheet,
  appendMeetingToSheet,
  readMeetingLogSheet,

  createReservationCalendarEvent,
  updateReservationCalendarEvent,
  cancelReservationCalendarEvent,
  createReservationSheet,
  appendReservationToSheet,
  readReservationSheet,
  updateReservationInSheet,
} from "./calendar.service.js";

//////////////////////////////////////////////////////////////
const reservationSchema = z.object({
  reservationId: z.string().min(1),
  guestName: z.string().min(1),
  arrivalDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  totalCharge: z.number().nonnegative(),
  currency: z.string().length(3).default("EUR"),
  status: z.enum([
    "pending",
    "confirmed",
    "cancelled",
    "completed",
  ]).default("confirmed"),
  notes: z.string().optional(),
  calendarEventId: z.string().optional(),
});

export function createReservationTools(authUserId: string) {
  return {
    createReservationCalendarEvent: createTool({
      id: "createReservationCalendarEvent",
      description:
        "Create an all-day Google Calendar event for a guest's stay. " +
        "The departure date is the exclusive event end date.",
      inputSchema: reservationSchema,
      execute: async (input) => {
        if (input.departureDate <= input.arrivalDate) {
          throw new Error(
            "Departure date must be later than arrival date.",
          );
        }

        const totalNights = Math.round(
          (
            Date.parse(`${input.departureDate}T00:00:00Z`) -
            Date.parse(`${input.arrivalDate}T00:00:00Z`)
          ) / 86_400_000,
        );

        return await createReservationCalendarEvent({
          authUserId,
          ...input,
          totalNights,
        });
      },
    }),

    updateReservationCalendarEvent: createTool({
      id: "updateReservationCalendarEvent",
      description:
        "Update an existing reservation Calendar event by its event ID.",
      inputSchema: reservationSchema.extend({
        calendarEventId: z.string().min(1),
      }),
      execute: async (input) => {
        if (input.departureDate <= input.arrivalDate) {
          throw new Error("Invalid reservation date range.");
        }

        const totalNights = Math.round(
          (
            Date.parse(`${input.departureDate}T00:00:00Z`) -
            Date.parse(`${input.arrivalDate}T00:00:00Z`)
          ) / 86_400_000,
        );

        return await updateReservationCalendarEvent({
          authUserId,
          ...input,
          totalNights,
        });
      },
    }),

    cancelReservationCalendarEvent: createTool({
      id: "cancelReservationCalendarEvent",
      description:
        "Remove a reservation's Calendar event using its event ID.",
      inputSchema: z.object({
        calendarEventId: z.string().min(1),
      }),
      execute: async ({ calendarEventId }) =>
        cancelReservationCalendarEvent({
          authUserId,
          calendarEventId,
        }),
    }),

    createReservationSheet: createTool({
      id: "createReservationSheet",
      description: "Create a Google Sheets reservation register.",
      inputSchema: z.object({
        title: z.string().default("Airbnb Reservations"),
      }),
      execute: async ({ title }) =>
        createReservationSheet({ authUserId, title }),
    }),

    appendReservationToSheet: createTool({
      id: "appendReservationToSheet",
      description:
        "Append a new reservation to a Google Sheets register.",
      inputSchema: z.object({
        spreadsheetId: z.string().min(1),
        ...reservationSchema.shape,
        totalNights: z.number().int().positive(),
        calendarEventId: z.string().optional(),
      }),
      execute: async (input) => {
        if (input.departureDate <= input.arrivalDate) {
          throw new Error("Invalid reservation date range.");
        }

        return await appendReservationToSheet({
          authUserId,
          ...input,
        });
      },
    }),

    updateReservationInSheet: createTool({
      id: "updateReservationInSheet",
      description:
        "Update an existing spreadsheet row identified by reservation ID.",
      inputSchema: z.object({
        spreadsheetId: z.string().min(1),
        reservationId: z.string().min(1),
        guestName: z.string().optional(),
        arrivalDate: z.string().optional(),
        departureDate: z.string().optional(),
        totalNights: z.number().int().positive().optional(),
        totalCharge: z.number().nonnegative().optional(),
        currency: z.string().length(3).optional(),
        status: z.enum([
          "pending", "confirmed", "cancelled", "completed",
        ]).optional(),
        calendarEventId: z.string().optional(),
        notes: z.string().optional(),
      }),
      execute: async (input) =>
        await updateReservationInSheet({
          authUserId,
          ...input,
        }),
    }),

    readReservationSheet: createTool({
      id: "readReservationSheet",
      description:
        "Read reservations from a Google Sheets register.",
      inputSchema: z.object({
        spreadsheetId: z.string().min(1),
        range: z.string().optional(),
      }),
      execute: async (input) =>
        await readReservationSheet({ authUserId, ...input }),
    }),
  };
}
//////////////////////////////////////////////////////////////////
export function createCalendarTools(authUserId: string) {
  return {
    listUpcomingMeetings: createTool({
      id: "listUpcomingMeetings",
      description:
        "List Google Calendar events. Set todayOnly=true for today's agenda only.",
      inputSchema: z.object({
        maxResults: z.number().int().min(1).max(20).optional(),
        todayOnly: z
          .boolean()
          .optional()
          .describe("If true, only return events for today"),
      }),
      execute: async ({ maxResults, todayOnly }) => {
        return await listUpcomingMeetings({
          authUserId,
          maxResults,
          todayOnly,
        });
      },
    }),

    checkCalendarBusy: createTool({
      id: "checkCalendarBusy",
      description:
        "Check if the user is busy between two ISO datetimes using Google freebusy.",
      inputSchema: z.object({
        startIso: z.string().describe("Start time as ISO-8601 datetime"),
        endIso: z.string().describe("End time as ISO-8601 datetime"),
      }),
      execute: async ({ startIso, endIso }) => {
        return await checkCalendarBusy({
          authUserId,
          startIso,
          endIso,
        });
      },
    }),
    createMeeting: createTool({
      id: "createMeeting",
      description:
        "Create a Google Calendar event. Adds a Google Meet link by default. Emails invites(send) when attendee Emails are set.",
      inputSchema: z.object({
        title: z.string().min(1),
        startIso: z.string().describe("Start time as ISO-8601 datetime"),
        endIso: z.string().describe("End time as ISO-8601 datetime"),
        attendeeEmails: z
          .array(z.string())
          .optional()
          .describe("Invite these emails; Google sends calendar invites"),
        description: z.string().optional(),
        addGoogleMeet: z
          .boolean()
          .optional()
          .describe("Default true. Set false to skip Google Meet link"),
      }),
      execute: async (input) => {
        return await createMeeting({
          authUserId,
          ...input,
        });
      },
    }),

    rescheduleMeeting: createTool({
      id: "rescheduleMeeting",
      description:
        "Move an existing event to a new start/end time and email invitees.",
      inputSchema: z.object({
        eventId: z.string().min(1),
        startIso: z.string().describe("Start time as ISO-8601 datetime"),
        endIso: z.string().describe("End time as ISO-8601 datetime"),
      }),

      execute: async (input) => {
        return await rescheduleMeeting({ authUserId, ...input });
      },
    }),

        


    cancelMeeting: createTool({
      id: "cancelMeeting",
      description:
        "Cancel a Google Calendar event by id and email attendees about the cancellation.",
      inputSchema: z.object({
        eventId: z.string().min(1),
      }),
      execute: async (input) => {
        return await cancelMeeting({
          authUserId,
          ...input,
        });
    
      },
    }),


    
   // --- Google Sheets Tools ---
    createMeetingLogSheet: createTool({
      id: "createMeetingLogSheet",
      description:
        "Create a new Google Sheet specifically designed for logging meeting records with standard header columns.",
      inputSchema: z.object({
        title: z
          .string()
          .optional()
          .describe("Title of the spreadsheet. Defaults to 'Meeting Log'."),
      }),
      execute: async ({ title }) => {
        return await createMeetingLogSheet({ authUserId, title });
      },
    }),

   
    appendMeetingToSheet: createTool({
      id: "appendMeetingToSheet",
      description:
        "Append a new meeting row (Date, Title, Attendees, Duration, Meet Link, Notes) to a Google Sheet.",
      inputSchema: z.object({
        spreadsheetId: z
          .string()
          .describe("The Google Sheet ID where data should be appended"),
        dateTime: z.string().describe("Formatted date/time string"),
        title: z.string().describe("Meeting title"),
        attendees: z.array(z.string()).optional().describe("List of attendee emails/names"),
        duration: z.string().optional().describe("Duration of the meeting (e.g., '30m', '1h')"),
        meetLink: z.string().optional().describe("Google Meet link if available"),
        notes: z.string().optional().describe("Meeting summary or notes"),
      }),
      execute: async (input) => {
        return await appendMeetingToSheet({ authUserId, ...input });
      },
    }),

    readMeetingLogSheet: createTool({
      id: "readMeetingLogSheet",
      description:
        "Read rows from a meeting log spreadsheet to fetch past meeting logs or history.",
      inputSchema: z.object({
        spreadsheetId: z.string().describe("The Google Sheet ID to read from"),
        range: z
          .string()
          .optional()
          .describe("Sheet range to read, defaults to 'Meetings!A1:Z100'"),
      }),
      execute: async (input) => {
        return await readMeetingLogSheet({ authUserId, ...input });
      },
    }),


  };
}
