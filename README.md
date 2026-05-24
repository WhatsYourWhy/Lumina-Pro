# Shank Strategy Ops LLC | Operations & Consulting Workbench

A full-stack, state-of-the-art AI consulting and logistics workbench designed specifically for **Shank Strategy Ops LLC**. It features automated market analysis, visual slide concept generation, live supply chain disruption monitoring, and custom corporate consulting frameworks (SWOT, SCOR, PESTEL, DMAIC, and BULLWHIP).

---

## Key Features & Capabilities

This workbench combines business intelligence and supply chain operations into a unified strategic dashboard:

1. **Strategy Hub**:
   - **Client Discovery Sync**: Automatically scrapes public brand information (industry, description, tone) using search-grounded Gemini models.
   - **Executive Consulting Frameworks**: Generates high-density strategic outputs including SWOT, SCOR (logistics), PESTEL (macro-environment), DMAIC (Lean Six Sigma process improvements), and BULLWHIP (supply chain volatility risk) briefs using `gemini-3-pro-preview` with an active reasoning budget.
   - **Markdown Rendering**: Formats consulting briefs into rich typography (bullet points, clear headers, bold accents, divider rules).
2. **Logistics Risk Console**:
   - **Operational Risk Summary**: Analyzes custom routing nodes, ports, and transit corridors using `gemini-2.5-flash` grounded in Google Maps and Google Search.
   - **Disruption Radar**: Scans for live geological or transit bottlenecks in real-time, displaying them with styled risk severity badges (high, medium, low).
   - **Route Corridors**: Includes quick-select presets for transpacific marine lanes, European rail networks, and NAFTA highways.
3. **Creative Asset Studio**:
   - **Content Studio**: Generates tone-customized LinkedIn copywriting drafts (Thought Leadership, Technical/Operational, Risk/Mitigation, Visionary).
   - **Visual Concept Studio**: Generates high-quality branded slide graphics, presentation backgrounds, and logistics mockups using `gemini-2.5-flash-image` with commercial style presets.

---

## Technical Architecture

* **Frontend**: React (Vite) + Tailwind CSS v4 + Lucide Icons.
* **Backend Security Proxy**: Express.js server providing a rate-limited reverse proxy that acts as a bridge to the Google GenAI REST & WebSocket endpoints. It securely injects the `GEMINI_API_KEY` header at the edge, keeping credentials safe.
* **Database & Synchronization**: Supabase (PostgreSQL) partitions user configurations and strategic briefing histories, utilizing debounced state syncs (1.5s) to prevent data loss.
* **Document Exporting**: Direct client-side PDF Report generation via `html2canvas` and `jsPDF`.

---

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Keys
Create a `.env.local` file in the root directory:

```env
# Gemini Configuration (Server-side proxy only)
GEMINI_API_KEY=your_gemini_api_key

# Supabase Configuration (Client-side client)
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Initialize the Database
1. Copy the SQL commands from `supabase_schema.sql`.
2. Execute the script inside your Supabase project's **SQL Editor** to provision the `brand_profiles` and `global_intel` tables along with the Row Level Security (RLS) policies and triggers.

### 4. Run the Application
Start the concurrently managed stack (Vite frontend on port `3000`, Express proxy server on port `3001`):
```bash
npm run dev
```

### 5. Run Tests
Verify the stability of the React component rendering and Express API proxy routing:
```bash
npm run test
```
