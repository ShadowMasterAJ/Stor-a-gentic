"use server";

import Airtable from "airtable";

const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY || "";
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID || "";

if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
  throw new Error(
    "Airtable API key or Base ID is not defined in environment variables"
  );
}

const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

// Service request types
export type ServiceRequestType =
  | "collection"
  | "delivery"
  | "inquiry"
  | "other";

// Service request status
export type ServiceRequestStatus =
  | "pending"
  | "scheduled"
  | "completed"
  | "cancelled";

// Service request interface
export interface ServiceRequest {
  id?: string;
  type: ServiceRequestType;
  status: ServiceRequestStatus;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  description: string;
  preferredDate?: string;
  scheduledDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export async function logCustomerInquiry(message: string, response: string) {
  try {
    const record = await base("Customer Inquiries").create({
      Message: message,
      Response: response,
      // Timestamp: new Date().toISOString(),
    });
    return {
      id: record.getId(),
      message: record.get("Message"),
      response: record.get("Response"),
      // timestamp: record.get("Timestamp"),
    };
  } catch (error) {
    console.error("Error logging to Airtable:", error);
  }
}


export async function getFAQs() {
  try {
    const records = await base("FAQs").select().all();
    return records.map((record) => ({
      question: record.get("Question"),
      answer: record.get("Answer"),
    }));
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    return [];
  }
}

/**
 * Create a new service request in Airtable
 */
export async function createServiceRequest(request: ServiceRequest) {
  try {
    const record = await base("Service Requests").create({
      Type: request.type,
      Status: request.status,
      "Customer Name": request.customerName,
      "Customer Email": request.customerEmail,
      "Customer Phone": request.customerPhone || "",
      Description: request.description,
      "Preferred Date": request.preferredDate || "",
      "Scheduled Date": request.scheduledDate || "",
      "Updated At": request.updatedAt || "",
    });

    return {
      ...request,
      id: record.getId(),
    };
  } catch (error) {
    console.error("Error creating service request in Airtable:", error);
    throw new Error("Failed to create service request");
  }
}

/**
 * Update an existing service request in Airtable
 */
export async function updateServiceRequest(request: ServiceRequest) {
  if (!request.id) {
    throw new Error("Service request ID is required for updates");
  }

  try {
    await base("Service Requests").update(request.id, {
      Type: request.type,
      Status: request.status,
      "Customer Name": request.customerName,
      "Customer Email": request.customerEmail,
      "Customer Phone": request.customerPhone || "",
      Description: request.description,
      "Preferred Date": request.preferredDate || "",
      "Scheduled Date": request.scheduledDate || "",
      "Updated At": new Date().toISOString(),
    });

    return request;
  } catch (error) {
    console.error("Error updating service request in Airtable:", error);
    throw new Error("Failed to update service request");
  }
}

/**
 * Get all service requests from Airtable
 */
export async function getServiceRequests() {
  try {
    const records = await base("Service Requests").select().all();
    return records.map((record) => ({
      id: record.getId(),
      type: record.get("Type") as ServiceRequestType,
      status: record.get("Status") as ServiceRequestStatus,
      customerName: record.get("Customer Name") as string,
      customerEmail: record.get("Customer Email") as string,
      customerPhone: record.get("Customer Phone") as string,
      description: record.get("Description") as string,
      preferredDate: record.get("Preferred Date") as string,
      scheduledDate: record.get("Scheduled Date") as string,
      createdAt: record.get("Created At") as string,
      updatedAt: record.get("Updated At") as string,
    }));
  } catch (error) {
    console.error("Error fetching service requests from Airtable:", error);
    return [];
  }
}

/**
 * Get a service request by ID
 */
export async function getServiceRequestById(id: string) {
  try {
    const record = await base("Service Requests").find(id);
    return {
      id: record.getId(),
      type: record.get("Type") as ServiceRequestType,
      status: record.get("Status") as ServiceRequestStatus,
      customerName: record.get("Customer Name") as string,
      customerEmail: record.get("Customer Email") as string,
      customerPhone: record.get("Customer Phone") as string,
      description: record.get("Description") as string,
      preferredDate: record.get("Preferred Date") as string,
      scheduledDate: record.get("Scheduled Date") as string,
      createdAt: record.get("Created At") as string,
      updatedAt: record.get("Updated At") as string,
    };
  } catch (error) {
    console.error("Error fetching service request from Airtable:", error);
    throw new Error("Service request not found");
  }
}
