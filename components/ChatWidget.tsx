"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Bot, Calendar, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { getChatCompletion, detectServiceRequest } from "@/lib/services/openai";
import {
  logCustomerInquiry,
  createServiceRequest,
  ServiceRequest,
  ServiceRequestType,
} from "@/lib/services/airtable";
import {
  scheduleService,
  getAvailableSlotsForDate,
} from "@/lib/services/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Sparkles } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

interface ServiceFormData {
  type: ServiceRequestType;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  description: string;
  preferredDate: Date | undefined;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! How can I help you with your storage needs today?",
      sender: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Service request state
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [serviceFormData, setServiceFormData] = useState<ServiceFormData>({
    type: "collection",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    description: "",
    preferredDate: undefined,
  });
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [isSubmittingService, setIsSubmittingService] = useState(false);

  // Function to fetch available time slots when a date is selected
  const fetchAvailableTimeSlots = async (date: Date) => {
    try {
      const slots = await getAvailableSlotsForDate(date);
      setAvailableTimeSlots(slots);
      if (slots.length > 0) {
        setSelectedTimeSlot(slots[0]);
      } else {
        setSelectedTimeSlot("");
      }
    } catch (error) {
      console.error("Error fetching available time slots:", error);
      setAvailableTimeSlots([]);
      setSelectedTimeSlot("");
    }
  };

  // Effect to fetch time slots when preferred date changes
  useEffect(() => {
    if (serviceFormData.preferredDate) {
      fetchAvailableTimeSlots(serviceFormData.preferredDate);
    }
  }, [serviceFormData.preferredDate]);

  // Add a ref for the scroll area
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add effect to scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleServiceSubmit = async () => {
    if (
      !serviceFormData.customerName ||
      !serviceFormData.customerEmail ||
      !serviceFormData.preferredDate
    ) {
      return;
    }

    setIsSubmittingService(true);

    try {
      // Create the full date time string
      const preferredDateTime = serviceFormData.preferredDate
        ? new Date(serviceFormData.preferredDate)
        : new Date();
      if (selectedTimeSlot) {
        const [hours] = selectedTimeSlot.split(":");
        preferredDateTime.setHours(parseInt(hours), 0, 0, 0);
      }

      // Create service request in Airtable
      const serviceRequest: ServiceRequest = {
        type: serviceFormData.type,
        status: "pending",
        customerName: serviceFormData.customerName,
        customerEmail: serviceFormData.customerEmail,
        customerPhone: serviceFormData.customerPhone,
        description: serviceFormData.description,
        preferredDate: preferredDateTime.toISOString(),
        createdAt: new Date().toISOString(),
      };

      const createdRequest = await createServiceRequest(serviceRequest);

      try {
        // Try to schedule in Google Calendar, but don't fail if it doesn't work
        await scheduleService(createdRequest);
      } catch (calendarError) {
        console.error("Error scheduling in calendar:", calendarError);
        // Continue with the process even if calendar scheduling fails
      }

      // Add confirmation message to chat
      const confirmationMessage: Message = {
        id: Date.now().toString(),
        content: `Great! I've scheduled your ${
          serviceFormData.type === "other"
            ? "service request"
            : serviceFormData.type
        } for ${format(
          preferredDateTime,
          "PPP"
        )} at ${selectedTimeSlot}. You can check your google calendar. Is there anything else I can help you with?`,
        sender: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, confirmationMessage]);
      setShowServiceForm(false);

      // Reset form data
      setServiceFormData({
        type: "collection",
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        description: "",
        preferredDate: undefined,
      });
    } catch (error) {
      console.error("Error submitting service request:", error);

      const errorMessage: Message = {
        id: Date.now().toString(),
        content:
          "I'm sorry, there was an error scheduling your service. Please try again or contact our support team directly.",
        sender: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSubmittingService(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    console.log("ChatWidget: Sending user message:", input);

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    console.log("ChatWidget: Loading state set to true");

    try {
      // First, detect if this is a service request
      const serviceRequestInfo = await detectServiceRequest(input);

      // Convert messages to OpenAI format for chat history
      const chatHistory = messages.map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.content,
      }));

      // Add the current message
      chatHistory.push({
        role: "user",
        content: input,
      });

      // Get AI response with chat history
      console.log("ChatWidget: Requesting AI completion with chat history");
      const response = await getChatCompletion(input, chatHistory);
      console.log(
        "ChatWidget: Received AI response:",
        response.substring(0, 50) + (response.length > 50 ? "..." : "")
      );

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: serviceRequestInfo.isServiceRequest
          ? "Please fill out the form to schedule your service request."
          : response,
        sender: "assistant",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      console.log("ChatWidget: Added assistant message to chat");

      // Log the interaction to Airtable
      console.log("ChatWidget: Logging interaction to Airtable");
      await logCustomerInquiry(input, response);
      console.log("ChatWidget: Successfully logged to Airtable");

      // If this is a service request, show the service form
      if (serviceRequestInfo.isServiceRequest) {
        console.log("ChatWidget: Detected service request", serviceRequestInfo);

        // Pre-fill the form with any detected information
        setServiceFormData({
          type: (serviceRequestInfo.type as ServiceRequestType) || "collection",
          customerName: serviceRequestInfo.customerName || "",
          customerEmail: serviceRequestInfo.customerEmail || "",
          customerPhone: serviceRequestInfo.customerPhone || "",
          description: serviceRequestInfo.description || input,
          preferredDate: serviceRequestInfo.preferredDate
            ? new Date(serviceRequestInfo.preferredDate)
            : undefined,
        });

        // Show the service form dialog
        setTimeout(() => {
          setShowServiceForm(true);
        }, 1000); // Slight delay to allow the assistant message to be read
      }
    } catch (error) {
      console.error("ChatWidget: Error in chat process:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content:
          "I apologize, but I'm having trouble processing your request at the moment.",
        sender: "assistant",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      console.log("ChatWidget: Added error message to chat");
    } finally {
      setIsLoading(false);
      console.log("ChatWidget: Loading state set to false");
    }
  };

  console.log(
    "ChatWidget: Rendering with",
    messages.length,
    "messages, chat is",
    isOpen ? "open" : "closed"
  );

  console.log(
    "ChatWidget: Rendering with",
    messages.length,
    "messages, chat is",
    isOpen ? "open" : "closed"
  );

  return (
    <>
      <motion.div
        initial={{ rotate: -10, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        <Button
          className="fixed bottom-7 right-7 rounded-full h-16 w-16 shadow-lg flex items-center justify-center bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 hover:scale-110 transition-transform duration-200 active:animate-pulse "
          onClick={() => {
            console.log("ChatWidget: Opening chat widget");
            setIsOpen(!isOpen);
          }}
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X className="h-7 w-7 text-white" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <MessageCircle className="h-7 w-7 text-white" />
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ scale: 0.95, y: 200 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 200 }}
            transition={{
              type: "tween",
              duration: 0.2,
              ease: "easeOut",
            }}
            className="fixed bottom-28 right-7"
          >
            <Card className="w-[400px] h-[650px] flex flex-col shadow-2xl rounded-3xl overflow-hidden border-0 bg-gradient-to-b from-white to-gray-50">
              <div className="flex items-center rounded-3xl justify-between p-4 border-b bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                <div className="flex items-center gap-3">
                  <Avatar className="border-2 border-white h-10 w-10 bg-white flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-indigo-600" />
                  </Avatar>
                  <div>
                    <span className="font-bold text-xl">Storage Assistant</span>
                    <div className="flex items-center">
                      <Badge
                        variant="outline"
                        className={`text-xs border-white/30 text-white/90 bg-white/10 animate-pulse ${
                          messages.some(
                            (m) =>
                              m.sender === "assistant" &&
                              (m.content.includes("error") ||
                                m.content.includes("trouble"))
                          )
                            ? "border-red-400 text-red-400"
                            : "border-green-400 text-green-400"
                        }`}
                      >
                        Online
                      </Badge>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 rounded-full"
                  onClick={() => {
                    console.log("ChatWidget: Closing chat widget");
                    setIsOpen(false);
                  }}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <ScrollArea
                className="flex-1 p-4 bg-gradient-to-b from-gray-50 to-white"
                ref={scrollAreaRef}
              >
                <div className="flex flex-col gap-4">
                  <AnimatePresence initial={false}>
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className={`flex ${
                          message.sender === "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-[80%] text-[14px] rounded-xl p-3 shadow-md ${
                            message.sender === "user"
                              ? "bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-br-sm"
                              : "bg-white border border-gray-100 rounded-bl-sm"
                          }`}
                        >
                          {message.content}
                          <div
                            className={`text-xs mt-1 ${
                              message.sender === "user"
                                ? "text-blue-100"
                                : "text-gray-400"
                            }`}
                          >
                            <div
                              className={`text-xs mt-1 ${
                                message.sender === "user"
                                  ? "text-right"
                                  : "text-left"
                              }`}
                            >
                              {format(message.timestamp, "h:mm a")}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {/* Invisible element at the end to scroll to */}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              <div className="flex gap-2 mb-4 overflow-x-auto p-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 whitespace-nowrap"
                  onClick={() => {
                    setInput("I'd like to schedule a storage service");
                    handleSend();
                  }}
                >
                  <Calendar className="h-4 w-4" />
                  Schedule Service
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 whitespace-nowrap"
                  onClick={() => {
                    setInput("I need a delivery service");
                    handleSend();
                  }}
                >
                  <Send className="h-4 w-4" />
                  Request Delivery
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 whitespace-nowrap"
                  onClick={() => {
                    setInput("I'd like to inquire about storage options");
                    handleSend();
                  }}
                >
                  <MessageCircle className="h-4 w-4" />
                  Storage Inquiry
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 whitespace-nowrap"
                  onClick={() => {
                    setInput("I need help with my existing storage");
                    handleSend();
                  }}
                >
                  <Bot className="h-4 w-4" />
                  Get Support
                </Button>
              </div>

              <div className="p-4 border-t bg-white">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        console.log(
                          "ChatWidget: Enter key pressed, sending message"
                        );
                        handleSend();
                      }
                    }}
                    disabled={isLoading}
                    className="rounded-full border-gray-200 focus:border-blue-500 shadow-sm"
                  />
                  <Button
                    onClick={handleSend}
                    disabled={isLoading}
                    className="rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-sm"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Service Request Form Dialog */}
      <Dialog open={showServiceForm} onOpenChange={setShowServiceForm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Schedule a Service</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="service-type" className="text-right">
                Service Type
              </Label>
              <Select
                value={serviceFormData.type}
                onValueChange={(value: ServiceRequestType) =>
                  setServiceFormData({ ...serviceFormData, type: value })
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="collection">Collection</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                  <SelectItem value="inquiry">Inquiry</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={serviceFormData.customerName}
                onChange={(e) =>
                  setServiceFormData({
                    ...serviceFormData,
                    customerName: e.target.value,
                  })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="email" className="text-right">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={serviceFormData.customerEmail}
                onChange={(e) =>
                  setServiceFormData({
                    ...serviceFormData,
                    customerEmail: e.target.value,
                  })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input
                id="phone"
                value={serviceFormData.customerPhone}
                onChange={(e) =>
                  setServiceFormData({
                    ...serviceFormData,
                    customerPhone: e.target.value,
                  })
                }
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !serviceFormData.preferredDate &&
                          "text-muted-foreground"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {serviceFormData.preferredDate ? (
                        format(serviceFormData.preferredDate, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={serviceFormData.preferredDate}
                      onSelect={(date) =>
                        setServiceFormData({
                          ...serviceFormData,
                          preferredDate: date || undefined,
                        })
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            {serviceFormData.preferredDate && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="time" className="text-right">
                  Time
                </Label>
                <Select
                  value={selectedTimeSlot}
                  onValueChange={setSelectedTimeSlot}
                  disabled={availableTimeSlots.length === 0}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue
                      placeholder={
                        availableTimeSlots.length === 0
                          ? "No available slots"
                          : "Select a time"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTimeSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>
                        {slot}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Details
              </Label>
              <Textarea
                id="description"
                value={serviceFormData.description}
                onChange={(e) =>
                  setServiceFormData({
                    ...serviceFormData,
                    description: e.target.value,
                  })
                }
                className="col-span-3"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="submit"
              onClick={handleServiceSubmit}
              disabled={
                isSubmittingService ||
                !serviceFormData.customerName ||
                !serviceFormData.customerEmail ||
                !serviceFormData.preferredDate ||
                !selectedTimeSlot
              }
            >
              {isSubmittingService ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Scheduling...
                </>
              ) : (
                "Schedule Service"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
