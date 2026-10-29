# Airbnb Reservation Assistant

An AI-powered reservation assistant built with TypeScript and Mastra that helps manage Airbnb reservations by integrating with Google Calendar and Google Sheets.

## Features

- **Airbnb iCal integration:** Imports reservation events from an Airbnb calendar feed.
- **Google Calendar integration:** Creates and updates calendar events for imported reservations.
- **Google Sheets integration:** Stores reservation information in an existing Google Sheets reservation register.
- **AI-powered assistant:** Uses Mastra tools to execute reservation-management tasks.
- **Date formatting:** Uses `DD-MM-YYYY` for reservation arrival and departure dates.
- **Duplicate prevention:** Uses stable reservation IDs to help prevent duplicate records.
- **One-way synchronization:** Transfers reservation data from Airbnb to Google Calendar and Google Sheets.

## Tech Stack

- TypeScript
- Mastra AI framework
- Google Calendar API
- Google Sheets API
- Airbnb iCal
- Render — backend hosting
- Vercel — frontend hosting

## How It Works

1. The assistant retrieves reservation events from the configured Airbnb iCal feed.
2. It filters the events to identify reservations and exclude blocked or unavailable dates.
3. It creates or updates corresponding events in Google Calendar.
4. It creates or updates reservation records in the configured Google Sheets spreadsheet.
5. The assistant reports the synchronization results.

**Synchronization direction:**

`Airbnb → Google Calendar`

`Airbnb → Google Sheets`

This project is designed for one-way synchronization. Changes made in Google Calendar or Google Sheets are not sent back to Airbnb.

## Configuration

Before running the project, configure the required environment variables and API credentials.

Typical requirements include:

- Google Cloud project with the Google Calendar API and Google Sheets API enabled.
- Google OAuth credentials or another supported Google authentication configuration.
- The ID of the Google Sheets spreadsheet used as the reservation register.
- The Airbnb iCal feed URL.
- Any additional environment variables required by the application.

Store sensitive values in environment variables or your hosting provider's secret settings. Do not commit API keys, OAuth tokens, private iCal URLs, or credential files to GitHub.

## Deployment

### Backend — Render

1. Connect this GitHub repository to Render.
2. Configure the build and start commands for the TypeScript application.
3. Add the required environment variables and credentials.
4. Deploy the backend and verify that the service starts successfully.

### Frontend — Vercel

1. Import the GitHub repository into Vercel, or connect the frontend directory if the project uses a monorepo.
2. Configure the frontend build settings.
3. Set the frontend environment variables, including the backend API URL.
4. Deploy the frontend and verify that it can communicate with the backend.

Use the actual build commands, start command, and environment variable names defined in the project.

## Reservation Data

The Google Sheets reservation register can include:

- Reservation ID
- Guest Name
- Arrival Date
- Departure Date
- Total Nights
- Total Charge
- Phone Number
- Status
- Calendar Event ID
- Notes
- Last Updated

Airbnb iCal feeds generally provide calendar information rather than full guest details or payment information. Fields unavailable from the feed should not be treated as verified reservation data.

## Limitations

- The iCal feed may not contain guest names, contact information, or reservation prices.
- Filtering depends on the event summaries provided by Airbnb and must be tested against the actual feed.
- Changes or cancellations in Airbnb may require additional reconciliation logic to update or remove existing records.
- Google Calendar and Google Sheets must be correctly configured and accessible to the application.

## Security

- Keep private Airbnb iCal URLs confidential.
- Never commit `.env` files, service-account keys, access tokens, or other secrets.
- Use environment variables and deployment-platform secret settings for sensitive configuration.
- Restrict Google API access to the resources and permissions the application needs.

## Project Status

This project is under development. Features and configuration requirements may change as the reservation workflow evolves.
