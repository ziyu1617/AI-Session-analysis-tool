# AI Session Analysis Tool

An LLM-powered tool for analyzing user session behavior. Upload tracking data (CSV / Excel), and the tool automatically groups events into sessions, reconstructs each user's behavior path, and uses a large language model to generate session summaries, deep insights, and order-product identification.

## Features

- **Data upload** — Accepts CSV and Excel (`.xlsx` / `.xls`), grouping events into sessions by `session_id`
- **Session analytics** — Page visits, action-type breakdowns, and page exposure duration
- **AI analysis** — Three independent perspectives, each driven by its own prompt:
  - **Session summary** — Reconstructs the user's decision journey with page dwell times
  - **Deep insights** — A product-oriented analysis report in markdown
  - **Order products** — Determines checkout status and the corresponding products from behavior fields

## Requirements

- Node.js ≥ 18 (this project uses Vite 5, which does not support Node 16 or earlier)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure your model API key

Create a `.env.local` file in the project root:

```
DEEPSEEK_API_KEY=your-api-key
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-v4-flash
```

This file is listed in `.gitignore` and will not be committed. The key is used only by the local backend process and **never reaches the frontend bundle**.

### 3. Start the app

```bash
npm run dev
```

This starts both:

- Backend at `http://127.0.0.1:3001` — holds the API key and proxies model requests
- Frontend at `http://localhost:8080`

### Other commands

```bash
npm test       # Run unit tests
npm run build  # Build the frontend
```

## Data Format

| Field | Description |
| --- | --- |
| `session_id` | **Required.** Session identifier |
| `fmt_time2` | **Required.** Event timestamp |
| `page_name` | Page name |
| `event_name` | Event name |
| `action_type_name` | Action type — used to classify exposure / click / add-to-cart / order |
| `sequence` | Event sequence number, used for deduplication |

## Project Structure

```
server/          Local backend; holds the API key and forwards model requests
src/analysis/    Session analysis module (prompts, serialization, post-processing)
src/components/  React components
src/utils/       Shared computation logic
```

## Architecture

The API key lives only in the backend process. The frontend calls `/api/ai/complete` and has no knowledge of the model provider — no credentials exist in the browser. To switch providers, edit `server/deepseek.js` only.

The three analyses are deliberately kept separate. Each has its own prompt, its own session serialization, and its own post-processing, because each is meant to produce a different kind of result. Adjusting one has no effect on the other two — see `src/analysis/kinds/`.

## License

MIT
