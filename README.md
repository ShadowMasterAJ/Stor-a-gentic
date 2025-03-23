# Stor-a-gentic

A powerful AI assistant for storage facilities that helps customers with inquiries, scheduling, and service requests. Built with Next.js, TypeScript, and OpenAI's GPT models.

## Features

- 💬 **Intelligent Chat Interface**: Natural language processing for customer inquiries
- 📅 **Service Scheduling**: Automated booking for collections and deliveries
- 🔄 **Context-Aware Responses**: Maintains conversation history for coherent interactions
- 📊 **Airtable Integration**: Logs customer interactions and service requests
- 📆 **Google Calendar Integration**: Schedules service appointments automatically
- 📱 **Responsive Design**: Works seamlessly on desktop and mobile devices
- ⚡ **Real-time Responses**: Fast AI-powered assistance for customers
- 🎨 **Customizable UI**: Professional and modern interface

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **AI**: OpenAI GPT-3.5 Turbo
- **Database**: Airtable
- **Calendar**: Google Calendar API
- **Styling**: Tailwind CSS with custom components
- **Animation**: Framer Motion

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- OpenAI API key
- Airtable account and API key
- Google Calendar API credentials

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/EasybeeAI.git
   cd EasybeeAI
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the root directory with the following variables:

   ```
   OPENAI_API_KEY=your_openai_api_key
   AIRTABLE_API_KEY=your_airtable_api_key
   AIRTABLE_BASE_ID=your_airtable_base_id
   GOOGLE_CALENDAR_CREDENTIALS=your_google_calendar_credentials_json
   ```

4. Start the development server:

   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Usage

### Chat Widget

The chat widget provides an intuitive interface for customers to interact with your AI assistant. It can:

- Answer questions about storage services
- Schedule collections and deliveries
- Provide information about pricing and availability
- Handle customer inquiries

### Service Scheduling

When a customer requests a service:

1. The AI detects the service request intent
2. A service form is presented to the customer
3. Available time slots are displayed based on your calendar
4. Upon submission, the service is scheduled in Airtable and Google Calendar
5. A confirmation message is sent to the customer

### Admin Dashboard

Access the admin dashboard to:

- View customer interactions
- Manage service requests
- Update FAQs and knowledge base
- Configure AI assistant behavior

## Project Structure

```
EasybeeAI/
├── components/         # React components
├── lib/                # Utility functions and services
│   ├── services/       # API integrations (OpenAI, Airtable, Google Calendar)
│   └── utils/          # Helper functions
├── pages/              # Next.js pages
├── public/             # Static assets
├── styles/             # Global styles
└── types/              # TypeScript type definitions
```

## Customization

### Modifying the AI Behavior

Edit the system prompts in `lib/services/openai.ts` to customize how the AI assistant responds to customers.

### Styling the Chat Widget

The chat widget can be styled by modifying the components in `components/ChatWidget.tsx`.

### Adding FAQs

Update your Airtable base with new FAQs, and they will automatically be included in the AI's knowledge base.
