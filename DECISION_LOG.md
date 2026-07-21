# Decision Log: Monday.com Business Intelligence Agent
**Candidate:** Abishek A  
**Role:** Full-Stack/Backend Engineer (AI and Agents)

---

## 1. Key Assumptions
*   **Data Scale & Model Context:** The active list of deal funnels and work orders for typical mid-sized projects fits well within thousands of rows. Given that the Google Gemini model features a massive context window of 1 million tokens, fetching the complete database state dynamically from Monday.com and injecting it directly into the prompt context is highly scalable, fast, and eliminates complex database sync bottlenecks.
*   **Fuzzy Relationships:** The mapping between Deals (Sales) and Work Orders (Operations) is linked via text fields (`Deal Name` <=> `Associated Deal`). We assume spelling and casing variations will occur, which the generative model handles natively.
*   **Read-Only Operations:** The assignment requirements state the agent reads data to generate insights, meaning write permissions to Monday.com are not required, reducing security risks.

## 2. Technical Stack & Trade-offs
*   **Frontend:** React 18 (TypeScript) + Tailwind CSS + Recharts (for executive visuals) + Framer Motion (for polished micro-interactions).
*   **Deployment:** Serverless hosting via Vercel.
*   **AI Engine:** Google Gemini API (`gemini-1.5-flash` client-side).
*   **Trade-off Choice (Client-Side Agent vs. Java Backend Broker):**
    *   *Option A (Chosen):* React app querying Monday.com GraphQL directly and orchestrating the Gemini SDK in the browser.
    *   *Option B:* Java Spring Boot backend proxying the requests.
    *   *Rationale:* For a 6-hour execution window, Option A eliminates server cold starts, deployment configurations, and data pipeline bottlenecks. It ensures the evaluator can instantly access the application via a Vercel link and test it with their own credentials securely.

## 3. Data Resilience & Messy Data Management
*   **Null and Empty Fields:** The app programmatically checks for missing target dates or comments. These are flagged in our **Data Quality Center** to maintain audit trails.
*   **Date Normalization:** Handled dynamically via the system instruction context. The model extracts structural meaning from varying formats (e.g. "July 26", "2026-07-21") and standardizes them to calendar quarters.
*   **Integrity Alerts:** Banners notify users if a closed-won deal exists but has no active work order started, bridging the gap between sales and operations.

## 4. Interpretation of "Leadership Updates"
*   We built a dedicated **Executive Reports** module that synthesizes current status into a print-ready briefing. Key metrics like closed revenue, active pipeline, top risks, and action items are automatically summarized and formatted for immediate PDF print output.

## 5. What I'd Do Differently with More Time
1.  **Vector Store & RAG:** If datasets scale beyond 50,500 items, we would use a backend (e.g. Java Spring Boot) coupled with a vector database (e.g., PgVector) to fetch only relevant data chunks.
2.  **Webhooks Sync:** Set up real-time webhooks on Monday.com to push edits to a local cache database rather than pulling datasets on demand.
