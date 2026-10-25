import { google } from "googleapis";
import { randomUUID } from "node:crypto";
import { getCalendarAccessToken, getSheetsAccessToken } from "./token.service.js";



//////////////////////////////////////////////////////
const RESERVATION_HEADERS = [
  "Reservation ID",
  "Guest Name",
  "Arrival Date",
  "Departure Date",
  "Total Nights",
  "Total Charge",
  "Phone Number",
  "Status",
  "Calendar Event ID",
  "Notes",
  "Last Updated",
];

type ReservationInput = {
  reservationId: string;
  guestName: string;
  arrivalDate: string;
  departureDate: string;
  totalNights: number;
  totalCharge: number;
  phoneNumber: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  notes?: string;
  calendarEventId?: string;
};

function reservationStayDescription(input: ReservationInput) {
  return [
    "BOOKING PERIOD",
    `Reservation ID: ${input.reservationId}`,
    `Guest: ${input.guestName}`,
    `Check-in: ${displayDate(input.arrivalDate)}`,
    `Check-out: ${displayDate(input.departureDate)}`,
    `Total nights: ${input.totalNights}`,
    `Phone Number: ${input.phoneNumber}`,
    `Status: ${input.status}`,
    `Notes: ${input.notes ?? ""}`,
  ].join("\n");
}


function toCalendarDate(value: string): string {
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
    throw new Error(`Invalid date: ${value}`);
  }

  return iso;
}

function displayDate(value: string): string {
  const iso = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : toCalendarDate(value);

  const [year, month, day] = iso.split("-");
  return `${day}-${month}-${year}`;
}

function nextCalendarDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

function reservationEventDescription(
  input: ReservationInput,
  eventType: "CHECK-IN" | "CHECK-OUT",
) {
  const relevantDate =
    eventType === "CHECK-IN"
      ? input.arrivalDate
      : input.departureDate;

  return [
    `${eventType} DATE: ${displayDate(relevantDate)}`,
    `Reservation ID: ${input.reservationId}`,
    `Guest: ${input.guestName}`,
    `Check-in: ${displayDate(input.arrivalDate)}`,
    `Check-out: ${displayDate(input.departureDate)}`,
    `Total nights: ${input.totalNights}`,
    `Phone Number: ${input.phoneNumber}`,
    `Status: ${input.status}`,
    `Notes: ${input.notes ?? ""}`,
  ].join("\n");
}


function reservationDescription(input: ReservationInput) {
  return [
    `Reservation ID: ${input.reservationId}`,
    `Guest: ${input.guestName}`,
    `Arrival: ${input.arrivalDate}`,
    `Departure: ${input.departureDate}`,
    `Nights: ${input.totalNights}`,
    `Total charge: ${input.totalCharge}`,
    `Phone : ${input.phoneNumber}`,
    `Status: ${input.status}`,
    `Notes: ${input.notes ?? ""}`,
  ].join("\n");
}

// Create an all-day event for the reservation.


export async function createReservationCalendarEvent(
  input: ReservationInput & { authUserId: string },
) {
  const calendar = await calendarForUser(input.authUserId);

  const arrival = toCalendarDate(input.arrivalDate);
  const departure = toCalendarDate(input.departureDate);

  if (departure <= arrival) {
    throw new Error("Departure date must be later than arrival date.");
  }

  const createdIds: string[] = [];

  try {
    const checkIn = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: `CHECK-IN - ${input.guestName} - ${input.reservationId}`,
        description: reservationEventDescription(input, "CHECK-IN"),
        start: { date: arrival },
        end: { date: nextCalendarDate(arrival) },
      },
    });

    if (!checkIn.data.id) {
      throw new Error("Check-in event ID was not returned.");
    }
    createdIds.push(checkIn.data.id);

    const checkOut = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: `CHECK-OUT - ${input.guestName} - ${input.reservationId}`,
        description: reservationEventDescription(input, "CHECK-OUT"),
        start: { date: departure },
        end: { date: nextCalendarDate(departure) },
      },
    });

    if (!checkOut.data.id) {
      throw new Error("Check-out event ID was not returned.");
    }
    createdIds.push(checkOut.data.id);

    const booking = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: `BOOKING - ${input.guestName} - ${input.reservationId}`,
        description: reservationStayDescription(input),
        start: { date: arrival },
        end: { date: departure },
      },
    });

    if (!booking.data.id) {
      throw new Error("Booking event ID was not returned.");
    }
    createdIds.push(booking.data.id);

    return {
      success: true,
      calendarEventId: createdIds.join(","),
      checkInEventId: checkIn.data.id,
      checkOutEventId: checkOut.data.id,
      bookingEventId: booking.data.id,
      reservationId: input.reservationId,
    };
  } catch (error) {
    await Promise.allSettled(
      createdIds.map((eventId) =>
        calendar.events.delete({
          calendarId: "primary",
          eventId,
        }),
      ),
    );

    throw error;
  }
}

// Update the existing event rather than creating a duplicate.
export async function updateReservationCalendarEvent(
  input: ReservationInput & {
    authUserId: string;
    calendarEventId: string;
  },
) {
  const calendar = await calendarForUser(input.authUserId);

  const arrival = toCalendarDate(input.arrivalDate);
  const departure = toCalendarDate(input.departureDate);

  if (departure <= arrival) {
    throw new Error("Departure date must be later than arrival date.");
  }

  const ids = input.calendarEventId
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (ids.length === 0) {
    throw new Error("No Calendar event ID was supplied.");
  }

  // Existing order: check-in, check-out, booking bar.
  const eventDefinitions = [
    {
      summary: `CHECK-IN - ${input.guestName} - ${input.reservationId}`,
      description: reservationEventDescription(input, "CHECK-IN"),
      start: { date: arrival },
      end: { date: nextCalendarDate(arrival) },
    },
    {
      summary: `CHECK-OUT - ${input.guestName} - ${input.reservationId}`,
      description: reservationEventDescription(input, "CHECK-OUT"),
      start: { date: departure },
      end: { date: nextCalendarDate(departure) },
    },
    {
      summary: `BOOKING - ${input.guestName} - ${input.reservationId}`,
      description: reservationStayDescription(input),
      start: { date: arrival },
      end: { date: departure },
    },
  ];

  const updatedIds: string[] = [];

  for (let i = 0; i < eventDefinitions.length; i++) {
    const eventId = ids[i];
    const requestBody = eventDefinitions[i];

    if (eventId) {
      await calendar.events.patch({
        calendarId: "primary",
        eventId,
        requestBody,
      });

      updatedIds.push(eventId);
    } else {
      const response = await calendar.events.insert({
        calendarId: "primary",
        requestBody,
      });

      if (!response.data.id) {
        throw new Error(
          `Calendar event ${i + 1} was not created successfully.`,
        );
      }

      updatedIds.push(response.data.id);
    }
  }

  return {
    success: true,
    calendarEventId: updatedIds.join(","),
    checkInEventId: updatedIds[0],
    checkOutEventId: updatedIds[1],
    bookingEventId: updatedIds[2],
    reservationId: input.reservationId,
  };
}

export async function cancelReservationCalendarEvent(input: {
  authUserId: string;
  calendarEventId: string;
}) {
  const calendar = await calendarForUser(input.authUserId);

  const eventIds = input.calendarEventId
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (eventIds.length === 0) {
    throw new Error("No Calendar event IDs were supplied.");
  }

  const results = await Promise.allSettled(
    eventIds.map((eventId) =>
      calendar.events.delete({
        calendarId: "primary",
        eventId,
      }),
    ),
  );

  const failed = results
    .map((result, index) => ({ result, eventId: eventIds[index] }))
    .filter(({ result }) => result.status === "rejected");

  if (failed.length > 0) {
    throw new Error(
      `Failed to cancel Calendar event(s): ${
        failed.map(({ eventId }) => eventId).join(", ")
      }. Other events may already have been cancelled.`,
    );
  }

  return {
    success: true,
    calendarEventIds: eventIds,
  };
}

// Create a spreadsheet and initialize its header row.
export async function createReservationSheet(input: {
  authUserId: string;
  title?: string;
}) {
  const sheets = await sheetsForUser(input.authUserId);

  const response = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title: input.title ?? "Airbnb Reservations",
      },
      sheets: [
        { properties: { title: "Reservations" } },
      ],
    },
  });

  const spreadsheetId = response.data.spreadsheetId;
  const spreadsheetUrl = response.data.spreadsheetUrl;

  if (!spreadsheetId) {
    throw new Error("Google Sheets did not return a spreadsheet ID.");
  }

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: "Reservations!A1",
    valueInputOption: "RAW",
    requestBody: {
      values: [RESERVATION_HEADERS],
    },
  });

  return {
    success: true,
    spreadsheetId,
    spreadsheetUrl,
    title: input.title ?? "Airbnb Reservations",
  };
}

// Append a new reservation row.
export async function appendReservationToSheet(
  input: ReservationInput & {
    authUserId: string;
    spreadsheetId: string;
  },
) {
  const sheets = await sheetsForUser(input.authUserId);

  // Check for duplicate reservation IDs before appending.
  const existing = await readReservationSheet({
    authUserId: input.authUserId,
    spreadsheetId: input.spreadsheetId,
  });

  const duplicate = existing.rows.slice(1).some(
    (row) => row[0] === input.reservationId,
  );

  if (duplicate) {
    throw new Error(
      `Reservation ${input.reservationId} already exists.`,
    );
  }

  const row = [
    input.reservationId,
    input.guestName,
    input.arrivalDate,
    input.departureDate,
    input.totalNights,
    input.totalCharge,
    input.phoneNumber,
    input.status,
    input.calendarEventId ?? "",
    input.notes ?? "",
    new Date().toISOString(),
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: input.spreadsheetId,
    range: "Reservations!A:K",
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] },
  });

  return {
    success: true,
    reservationId: input.reservationId,
    spreadsheetId: input.spreadsheetId,
  };
}

export async function readReservationSheet(input: {
  authUserId: string;
  spreadsheetId: string;
  range?: string;
}) {
  const sheets = await sheetsForUser(input.authUserId);

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: input.spreadsheetId,
    range: input.range ?? "Reservations!A1:K1000",
  });

  return {
    rows: response.data.values ?? [],
  };
}

// Update a reservation by its stable ID, preserving unchanged fields.
export async function updateReservationInSheet(input: {
  authUserId: string;
  spreadsheetId: string;
  reservationId: string;
  guestName?: string;
  arrivalDate?: string;
  departureDate?: string;
  totalNights?: number;
  totalCharge?: number;
  phoneNumber?: string;
  status?: "pending" | "confirmed" | "cancelled" | "completed";
  calendarEventId?: string;
  notes?: string;
}) {
  const sheets = await sheetsForUser(input.authUserId);

  const result = await sheets.spreadsheets.values.get({
    spreadsheetId: input.spreadsheetId,
    range: "Reservations!A1:K1000",
  });

  const rows = result.data.values ?? [];
  const matches = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row, index }) =>
      index > 0 && row[0] === input.reservationId
    );

  if (matches.length === 0) {
    throw new Error(
      `Reservation ${input.reservationId} was not found.`,
    );
  }

  if (matches.length > 1) {
    throw new Error(
      `Multiple rows have reservation ID ${input.reservationId}.`,
    );
  }

  const { row: existing, index } = matches[0];
  const updated = Array.from(
    { length: RESERVATION_HEADERS.length },
    (_, i) => existing[i] ?? "",
  );

  const fields = [
    ["guestName", 1],
    ["arrivalDate", 2],
    ["departureDate", 3],
    ["totalNights", 4],
    ["totalCharge", 5],
    ["phoneNumber", 6],
    ["status", 7],
    ["calendarEventId", 8],
    ["notes", 9],
  ] as const;

  for (const [field, column] of fields) {
    const value = input[field];
    if (value !== undefined) updated[column] = value;
  }

  updated[10] = new Date().toISOString();

  // Validate the final dates, not just the supplied changes.
  
const arrival = toCalendarDate(String(updated[2]));
const departure = toCalendarDate(String(updated[3]));

if (departure <= arrival) {
  throw new Error("Departure date must be later than arrival date.");
}

const calculatedNights = Math.round(
  (
    Date.parse(`${departure}T00:00:00.000Z`) -
    Date.parse(`${arrival}T00:00:00.000Z`)
  ) / 86_400_000,
);

if (
  input.totalNights !== undefined &&
  input.totalNights !== calculatedNights
) {
  throw new Error(
    "Total nights must match the arrival and departure dates.",
  );
}

updated[4] = calculatedNights;


  await sheets.spreadsheets.values.update({
    spreadsheetId: input.spreadsheetId,
    range: `Reservations!A${index + 1}:K${index + 1}`,
    valueInputOption: "RAW",
    requestBody: { values: [updated] },
  });

  return {
    success: true,
    reservationId: input.reservationId,
    totalNights: calculatedNights,
  };
}

///////////////////////////////////////////////////////////


//calls calendar  to  access its methods 
function calendarClient(accessToken: string) {
  const auth = new google.auth.OAuth2();

  auth.setCredentials({
    access_token: accessToken,
  });

  return google.calendar({
    version: "v3",
    auth,
  });
}

//get  access to the  google calendar through ur accessToken
async function calendarForUser(authUserId: string) {
  const accessToken = await getCalendarAccessToken(authUserId);

  return calendarClient(accessToken);
}

function formatEvent(event: {
  id?: string | null;
  summary?: string | null;
  description?: string | null;
  location?: string | null;
  start?: { dateTime?: string | null; date?: string | null } | null;
  end?: { dateTime?: string | null; date?: string | null } | null;
  htmlLink?: string | null;
  hangoutLink?: string | null;
  attendees?: Array<{
    email?: string | null;
    displayName?: string | null;
  }> | null;
}) {
  return {
    id: event.id,
    title: event.summary ?? "(no title)",
    description: event.description?.trim() || null,
    location: event.location?.trim() || null,
    start: event.start?.dateTime ?? event.start?.date ?? null,
    end: event.end?.dateTime ?? event.end?.date ?? null,
    htmlLink: event.htmlLink ?? null,
    meetLink: event.hangoutLink ?? null,
    attendees: (event.attendees ?? [])
      .map((person) => person.email || person.displayName)
      .filter((value): value is string => Boolean(value)),
  };
}

export async function listUpcomingMeetings(input: {
  authUserId: string;
  maxResults?: number;
  todayOnly?: boolean;
}) {
  const calendar = await calendarForUser(input.authUserId);

  let timeMin = new Date().toISOString();

  let timeMax: string | undefined;

  if (input.todayOnly) {
    const start = new Date();

    // 00:00:00:00
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    timeMin = start.toISOString();
    timeMax = end.toISOString();
  }

  const response = await calendar.events.list({
    calendarId: "primary",
    timeMin,
    timeMax,
    maxResults: input.maxResults ?? 10,
    singleEvents: true,
    orderBy: "startTime",
  });

  
  return (response.data.items ?? []).map(formatEvent);
  // Verbose equivalent
 //response.data.items.map((event) => formatEvent(event));
}

export async function createMeeting(input: {
  authUserId: string;
  title: string;
  startIso: string;
  endIso: string;
  attendeeEmails?: string[];
  description?: string;
  addGoogleMeet?: boolean;
}) {
  const calendar = await calendarForUser(input.authUserId);

  // enabling this one by default
  const withMeet = input.addGoogleMeet !== false;

  const response = await calendar.events.insert({
    calendarId: "primary",
    sendUpdates: "all",
    conferenceDataVersion: withMeet ? 1 : undefined,
    requestBody: {
      summary: input.title,
      description: input.description,
      start: {
        dateTime: input.startIso,
      },
      end: {
        dateTime: input.endIso,
      },
      attendees: (input.attendeeEmails ?? []).map((email) => ({ email })),
      conferenceData: withMeet
        ? {
            createRequest: {
              requestId: randomUUID(),
              conferenceSolutionKey: {
                type: "hangoutsMeet",
              },
            },
          }
        : undefined,
    },
  });

  console.log("Attendee Emails",input.attendeeEmails)
  
  return {
    ...formatEvent(response.data),
    inviteEmailsSent: (input.attendeeEmails ?? []).length > 0,
    googleMeetAdded: withMeet,
  };
}

export async function cancelMeeting(input: {
  authUserId: string;
  eventId: string;
}) {
  const calendar = await calendarForUser(input.authUserId);

  await calendar.events.delete({
    calendarId: "primary",
    eventId: input.eventId,
    sendUpdates: "all",
  });

  return {
    cancelled: true,
    eventId: input.eventId,
  };
}

export async function rescheduleMeeting(input: {
  authUserId: string;
  eventId: string;
  startIso: string;
  endIso: string;
}) {
  const calendar = await calendarForUser(input.authUserId);

  const response = await calendar.events.patch({
    calendarId: "primary",
    eventId: input.eventId,
    sendUpdates: "all",
    requestBody: {
      start: {
        dateTime: input.startIso,
      },
      end: {
        dateTime: input.endIso,
      },
    },
  });

  return formatEvent(response.data);
}

export async function checkCalendarBusy(input: {
  authUserId: string;
  startIso: string;
  endIso: string;
}) {
  const calendar = await calendarForUser(input.authUserId);

  const response = await calendar.freebusy.query({
    requestBody: {
      timeMin: input.startIso,
      timeMax: input.endIso,
      items: [
        {
          id: "primary",
        },
      ],
    },
  });

  const busy = response.data?.calendars?.primary?.busy ?? [];

  return {
    busy: busy.map((item) => ({
      start: item.start ?? null,
      end: item.end ?? null,
    })),
  };
}


////////////Sheets////////////////////////
function   sheetsClient(accessToken: string) {
  const auth = new google.auth.OAuth2();

  auth.setCredentials({
    access_token: accessToken,
  });

  return google.sheets({
    version: "v4",
    auth,
  });
}


//get  access to the  google sheets through ur accessToken
async function sheetsForUser(authUserId: string) {
  const accessToken = await getSheetsAccessToken(authUserId);

  return sheetsClient(accessToken);
}

export async function createMeetingLogSheet(input: {
  authUserId: string;
  title?: string;
}) {
  const sheets = await sheetsForUser(input.authUserId);

  // 1. Create a new Spreadsheet
  const response = await sheets.spreadsheets.create({
    requestBody: {
      properties: {
        title: input.title ?? "Meeting Log",
      },
      sheets: [
        {
          properties: {
            title: "Meetings",
          },
        },
      ],
    },
  });

  const spreadsheetId = response.data.spreadsheetId;
  const spreadsheetUrl = response.data.spreadsheetUrl;

  // 2. Add header row
  if (spreadsheetId) {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Meetings!A1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          ["Date/Time", "Title", "Attendees", "Duration", "Meet Link", "Notes/Summary"],
        ],
      },
    });
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
    title: input.title ?? "Meeting Log",
  };
}

export async function appendMeetingToSheet(input: {
  authUserId: string;
  spreadsheetId: string;
  dateTime: string;
  title: string;
  attendees?: string[];
  duration?: string;
  meetLink?: string;
  notes?: string;
}) {
  const sheets = await sheetsForUser(input.authUserId);

  const rowValues = [
    input.dateTime,
    input.title,
    (input.attendees ?? []).join(", "),
    input.duration ?? "30m",
    input.meetLink ?? "",
    input.notes ?? "",
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: input.spreadsheetId,
    range: "Meetings!A1",
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [rowValues],
    },
  });

  return {
    success: true,
    spreadsheetId: input.spreadsheetId,
    loggedMeeting: input.title,
  };
}

export async function readMeetingLogSheet(input: {
  authUserId: string;
  spreadsheetId: string;
  range?: string;
}) {
  const sheets = await sheetsForUser(input.authUserId);

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: input.spreadsheetId,
    range: input.range ?? "Meetings!A1:Z100",
  });

  return {
    rows: response.data.values ?? [],
  };
}


