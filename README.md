<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Lumina-Pro | AI Brand Studio
Lumina-Pro is a full-stack AI workspace built for strategic brand intelligence. It features automated market analysis, visual studio content generation, live supply chain disruption monitoring, and real-time voice pitch coaching.

## Architecture & Features
This project has been heavily hardened for public deployment:
- **Frontend**: React (Vite) + Tailwind CSS v4.
- **Backend Proxy**: Express.js server providing a secure WebSocket and REST proxy to the Gemini API. Protected by `helmet` security headers and `express-rate-limit`.
- **Database / Auth**: Supabase (PostgreSQL) is used to persist user brand profiles and history.
  - **Offline-Safe**: Employs debounced state-syncing and layout safeguards to prevent data loss.
- **Core Stability**: Integrated `vitest` and `supertest` for component and backend automation.
- **Advanced Export**: Native client-side PDF Report generation via `html2canvas` and `jsPDF`.
- **Fault Tolerance**: Global React `<ErrorBoundary>` overlay protects the application against destructive API responses or component crashes.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Supabase & Gemini
Create a `.env.local` file in the root directory.

#### Supabase Setup:
1. Go to [Supabase](https://supabase.com) and click **New Project** (if asked for a framework, you can select **React** or just skip it—it only affects their tutorial docs).
2. Choose a region and a database password.
3. Once the project provisions, go to **Project Settings -> API**.
4. Copy the `Project URL` and `anon/public` key into your `.env.local`.

#### Gemini Setup:
1. Grab an API key from [Google AI Studio](https://aistudio.google.com/).

```env
# Gemini Configuration (Server-side only)
GEMINI_API_KEY=your_gemini_key

# Supabase Configuration (Client-side)
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Initialize the Database
Before running the app for the first time, you must provision your Supabase tables and Row Level Security (RLS) policies:
1. Open the local `supabase_schema.sql` file.
2. Copy the entire script.
3. Go to your Supabase Dashboard's **SQL Editor**, paste it, and click **Run**.

### 4. Run the Application
The execution script uses `concurrently` to automatically launch the API Proxy on port `3001` and the Vite Frontend on port `3000` simultaneously.

```bash
npm run dev
```

### 5. Running Tests
You can verify the stability of the Express backend and React isolated components by running the Vitest suite:
```bash
npm run test
```

## Production Deployment
To deploy this application:
1. Build the React frontend using `npm run build`.
2. Host the frontend static output on Vercel, Netlify, or your platform of choice.
3. Host the `server.js` proxy on a Node.js hosting platform (e.g., Render, Railway, Heroku).
4. Update the `server.js` `allowedOrigins` logic to point strictly to your new frontend production URL.
