"use server";

import { google } from "googleapis";
import { ServiceRequest } from "./airtable";

// Create OAuth2 client for authentication
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.REDIRECT_URI
);

// Set credentials with refresh token
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

// Create calendar service using the OAuth2 client
const calendar = google.calendar({
  version: "v3",
  auth: oauth2Client, // Use the OAuth2 client here, not the API key
});

export async function getAvailableSlots(startDate: Date, endDate: Date) {
  try {
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    return response.data.items;
  } catch (error) {
    console.error("Error fetching calendar slots:", error);
    return [];
  }
}

/**
 * Get available time slots for a specific date
 * @param date The date to check for available slots
 * @returns Array of available time slots
 */
export async function getAvailableSlotsForDate(date: Date) {
  try {
    // Set time to start of day
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    // Set time to end of day
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    const events = await getAvailableSlots(startDate, endDate);

    // Define business hours (9 AM to 5 PM)
    const businessHours = [];
    for (let hour = 9; hour < 17; hour++) {
      businessHours.push(`${hour}:00`);
    }

    // Filter out times that are already booked
    const bookedTimes = (events || []).map((event) => {
      const startTime = new Date(
        event.start?.dateTime || event.start?.date || new Date()
      );
      return `${startTime.getHours()}:00`;
    });

    return businessHours.filter((time) => !bookedTimes.includes(time));
  } catch (error) {
    console.error("Error getting available slots for date:", error);
    return [];
  }
}

/**
 * Schedule a service based on a service request
 * @param serviceRequest The service request to schedule
 * @returns The created calendar event
 */
export async function scheduleService(serviceRequest: ServiceRequest) {
  if (!serviceRequest.preferredDate) {
    throw new Error("Preferred date is required for scheduling");
  }

  try {
    const eventSummary = `Storage ${
      serviceRequest.type.charAt(0).toUpperCase() + serviceRequest.type.slice(1)
    }`;

    const event = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: eventSummary,
        description: `${
          serviceRequest.type.charAt(0).toUpperCase() +
          serviceRequest.type.slice(1)
        } for ${serviceRequest.customerName}\nEmail: ${
          serviceRequest.customerEmail
        }\nPhone: ${
          serviceRequest.customerPhone || "Not provided"
        }\n\nDetails: ${serviceRequest.description}`,
        start: {
          dateTime: new Date(serviceRequest.preferredDate).toISOString(),
          timeZone: "UTC",
        },
        end: {
          dateTime: new Date(
            new Date(serviceRequest.preferredDate).getTime() + 60 * 60 * 1000
          ).toISOString(),
          timeZone: "UTC",
        },
      },
    });

    return event.data;
  } catch (error) {
    console.error(`Error scheduling ${serviceRequest.type}:`, error);
    throw error;
  }
}

export async function scheduleCollection(
  dateTime: string,
  customerDetails: any
) {
  try {
    const event = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: "Storage Collection",
        description: `Collection for ${customerDetails.name}\nPhone: ${customerDetails.phone}\nAddress: ${customerDetails.address}`,
        start: {
          dateTime,
          timeZone: "UTC",
        },
        end: {
          dateTime: new Date(
            new Date(dateTime).getTime() + 60 * 60 * 1000
          ).toISOString(),
          timeZone: "UTC",
        },
      },
    });
    return event.data;
  } catch (error) {
    console.error("Error scheduling collection:", error);
    throw error;
  }
}

/**
 * Update a scheduled service in the calendar
 * @param eventId The ID of the calendar event
 * @param serviceRequest The updated service request
 * @returns The updated calendar event
 */
export async function updateScheduledService(
  eventId: string,
  serviceRequest: ServiceRequest
) {
  if (!serviceRequest.scheduledDate) {
    throw new Error("Scheduled date is required for updating");
  }

  try {
    const eventSummary = `Storage ${
      serviceRequest.type.charAt(0).toUpperCase() + serviceRequest.type.slice(1)
    }`;

    const event = await calendar.events.update({
      calendarId: "primary",
      eventId: eventId,
      requestBody: {
        summary: eventSummary,
        description: `${
          serviceRequest.type.charAt(0).toUpperCase() +
          serviceRequest.type.slice(1)
        } for ${serviceRequest.customerName}\nEmail: ${
          serviceRequest.customerEmail
        }\nPhone: ${
          serviceRequest.customerPhone || "Not provided"
        }\n\nDetails: ${serviceRequest.description}`,
        start: {
          dateTime: new Date(serviceRequest.scheduledDate).toISOString(),
          timeZone: "UTC",
        },
        end: {
          dateTime: new Date(
            new Date(serviceRequest.scheduledDate).getTime() + 60 * 60 * 1000
          ).toISOString(),
          timeZone: "UTC",
        },
      },
    });

    return event.data;
  } catch (error) {
    console.error(`Error updating scheduled ${serviceRequest.type}:`, error);
    throw error;
  }
}
