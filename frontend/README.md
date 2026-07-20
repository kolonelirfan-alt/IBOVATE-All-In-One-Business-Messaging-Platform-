# IBOVATE Omnichannel Frontend

Welcome to the frontend application for the **IBOVATE All-In-One Business Messaging Platform**. This application is built using modern web technologies to provide a high-performance, premium, and responsive user interface for managing omnichannel customer interactions (WhatsApp, Instagram, Web Chat).

## 🚀 Tech Stack

- **Framework:** [Next.js 14](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Styling:** Pure CSS (CSS Modules & Global Styles) with a custom Design System
- **State Management:** React Hooks
- **Icons:** Standard emojis & SVG

## ✨ Key Features

- **Dashboard:** Real-time analytics, message volume charts, and connected channel statuses.
- **Omnichannel Inbox:** Unified inbox handling conversations from multiple platforms in a 4-panel layout (Sidebar, Conversation List, Chat Area, Contact Profile).
- **Contacts (CRM):** Customer directory with search, filtering, and interaction history.
- **Campaigns (Broadcast):** Manage bulk messaging, templates, and track delivery statuses (Draft, Scheduled, Processing, Completed, Failed).
- **Bot & Automation:** Rule engine for auto-replies, keyword triggers, and ticket routing.
- **Settings & API Management:** Workspace configuration, agent management, business hours, and secure API Token generation for external integrations.
- **Dark Mode Support:** Premium dark UI for reduced eye strain and better contrast.

## 🛠️ Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- Backend API running locally (or deployed)

### Installation

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env.local` file in the root of the `frontend` directory and add your backend API URL:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                 # Next.js App Router pages
│   │   ├── (dashboard)/     # Main application routes (Inbox, CRM, etc.)
│   │   ├── api/             # Next.js API Routes (Proxies)
│   │   ├── globals.css      # Core design system and CSS variables
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Landing page / Auth screen
│   ├── components/          # Reusable UI components
│   ├── lib/                 # Utility functions and API helpers
│   └── types/               # TypeScript interface definitions
├── public/                  # Static assets (images, fonts)
└── package.json             # Project dependencies and scripts
```

## 🎨 Design System

We use a custom, utility-driven CSS design system defined in `src/app/globals.css`. It prioritizes:
- **Aesthetics:** Deep dark themes (`var(--bg-0)`, `var(--bg-1)`), vibrant primary colors (`var(--primary)`), and smooth gradients.
- **Responsiveness:** Fluid layouts using Flexbox and Grid.
- **Micro-animations:** Subtle hover states, fade-ins (`.animate-fade-in`), and transitions for a premium feel.

*Avoid using ad-hoc inline styles for colors; always rely on CSS variables for consistent theming.*

## 🚢 Deployment

This project is optimized for deployment on Vercel or Railway.

**Railway Deployment:**
The project includes a `railway.json` at the root for zero-config deployments. Ensure the `NEXT_PUBLIC_API_URL` environment variable is set in your Railway dashboard to point to your live Python backend.

---
*Built for scale. Designed for engagement.*
