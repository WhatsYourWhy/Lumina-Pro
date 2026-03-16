<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Lumina-Pro | AI Brand Studio
Lumina-Pro is a full-stack AI workspace built for strategic brand intelligence. It features automated market analysis, visual studio content generation, live supply chain disruption monitoring, and real-time voice pitch coaching.

## Architecture
This project has been hardened for public deployment:
- **Frontend**: React (Vite) + Tailwind CSS v4.
- **Backend Proxy**: Express.js server that securely routes all Gemini REST and WebSocket requests to prevent API key exposure to the client. Rate-limiting is enabled by default.
- **Database / Auth**: Supabase (PostgreSQL) is used to persist user brand profiles and history across devices securely using Row Level Security.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env.local` file in the root directory and add the following keys. 
- You can get a Gemini key from Google AI Studio. 
- You can get the Supabase variables by creating a free Supabase project and checking your API settings.

```env
# Gemini Configuration (Server-side only)
GEMINI_API_KEY=your_gemini_key

# Supabase Configuration (Client-side)
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Initialize the Database
Before running the app for the first time, you must provision your Supabase tables:
1. Open `supabase_schema.sql`
2. Copy the entire script.
3. Paste it into your Supabase Dashboard's SQL Editor and run it.

### 4. Run the Application
The execution script uses `concurrently` to launch the API Proxy on port 3001 and the Vite Frontend on port 3000 simultaneously.

```bash
npm run dev
```

## Production Deployment
To deploy this application:
1. Build the React frontend using `npm run build`.
2. Host the frontend static output on Vercel, Netlify, or similar platforms.
3. Host the `server.js` proxy on a Node.js hosting platform (e.g., Render, Railway, Heroku).
4. Update `server.js` block `app.use(cors(...))` to point to your new frontend production URL.
