"use server";

import OpenAI from "openai";
import dotenv from "dotenv";
import path from "path";
import { getFAQs } from "./airtable";

dotenv.config();

export async function getChatCompletion(
  message: string,
  chatHistory: Array<{ role: string; content: string }> = []
) {
  try {
    // Check for API key before creating the OpenAI instance
    if (!process.env.OPENAI_API_KEY) {
      console.error("Missing OPENAI_API_KEY environment variable.");
      console.error(
        "Current environment variables:",
        process.env.OPENAI_API_KEY
      );
      throw new Error("Missing OPENAI_API_KEY environment variable");
    }

    // Get FAQs to include in the system prompt
    const faqs = await getFAQs();
    let faqContent = "";

    if (faqs.length > 0) {
      faqContent =
        "\n\nHere are some frequently asked questions and their answers:\n";
      faqs.forEach((faq, index) => {
        faqContent += `${index + 1}. Q: ${faq.question}\nA: ${faq.answer}\n\n`;
      });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const messages = [
      {
        role: "system",
        content: `You are an AI assistant that analyzes customer messages to detect service requests. 
          Extract the following information from the message:
          1. Service type (collection, delivery, inquiry, or other)
          2. Customer name (if provided)
          3. Customer email (if provided)
          4. Customer phone (if provided)
          5. Preferred date (if provided)
          6. Description of the request
          
          Respond in JSON format only with these fields: 
          {"isServiceRequest": boolean, "type": string, "customerName": string, "customerEmail": string, "customerPhone": string, "preferredDate": string, "description": string}
          
          If the message is not a service request, set isServiceRequest to false and leave other fields empty.`,
      },
      ...chatHistory,
      {
        role: "user",
        content: message,
      },
    ];
    const completion = await openai.chat.completions.create({
      messages:
        messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      model: "gpt-3.5-turbo",
    });

    return (
      completion.choices[0]?.message?.content ||
      "I apologize, but I couldn't process your request at the moment."
    );
  } catch (error) {
    console.error("Error getting chat completion:", error);
    return "I apologize, but I'm having trouble connecting to the AI service at the moment.";
  }
}

/**
 * Determine if a message is requesting a service
 * @param message The user message to analyze
 * @returns Object with service type and other extracted information
 */
export async function detectServiceRequest(
  message: string,
  chatHistory: Array<{ role: string; content: string }> = []
) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("Missing OPENAI_API_KEY environment variable");
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const messages = [
      {
        role: "system",
        content: `You are an AI assistant that analyzes customer messages to detect service requests. 
          Extract the following information from the message:
          1. Service type (collection, delivery, inquiry, or other)
          2. Customer name (if provided)
          3. Customer email (if provided)
          4. Customer phone (if provided)
          5. Preferred date (if provided)
          6. Description of the request
          
          Respond in JSON format only with these fields: 
          {"isServiceRequest": boolean, "type": string, "customerName": string, "customerEmail": string, "customerPhone": string, "preferredDate": string, "description": string}
          
          If the message is not a service request, set isServiceRequest to false and leave other fields empty.`,
      },
      ...chatHistory,
      {
        role: "user",
        content: message,
      },
    ];
    const completion = await openai.chat.completions.create({
      messages:
        messages as OpenAI.Chat.Completions.ChatCompletionMessageParam[],
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" },
    });

    const responseContent = completion.choices[0]?.message?.content || "";
    return JSON.parse(responseContent);
  } catch (error) {
    console.error("Error detecting service request:", error);
    return { isServiceRequest: false };
  }
}
