<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# DiviTrack

A dividend tracking application built with React, TypeScript, and Vite. Track your stock portfolio dividends, view upcoming ex-dates, and analyze your dividend income.

**Live App:** [https://divitrack.vercel.app](https://divitrack.vercel.app)

## Tech Stack

- **Frontend:** React 19 + TypeScript
- **Build Tool:** Vite
- **Charts:** Recharts
- **AI:** Google Generative AI (Gemini)
- **Icons:** Lucide React
- **Hosting:** Vercel

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   ```bash
   npm run dev
   ```
   The app will be available at `http://localhost:3000`

## Deployment (Vercel)

This project is deployed on **Vercel** and linked to the project [asafnaves-projects/divi_track](https://vercel.com/asafnaves-projects/divi_track).

### Production URL

| Environment | URL |
|-------------|-----|
| Production  | [https://divitrack.vercel.app](https://divitrack.vercel.app) |

### How to Deploy

1. Install the Vercel CLI (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy to production:
   ```bash
   vercel --prod
   ```

### Vercel Configuration

The project uses a [`vercel.json`](vercel.json) file with the following rewrites:

- `/api/yahoo/*` → Proxied to `https://query2.finance.yahoo.com/*` (Yahoo Finance API)
- `/*` → Falls back to `index.html` (SPA routing)

### Environment Variables

| Variable         | Description                    | Required |
|------------------|--------------------------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key          | Yes      |

Environment variables are managed via the [Vercel Dashboard](https://vercel.com/asafnaves-projects/divi_track/settings/environment-variables).

## Project Structure

```
DiviTrack/
├── App.tsx              # Main application component
├── index.tsx            # Entry point
├── index.html           # HTML template
├── components/          # React components
├── services/            # API services (Yahoo Finance)
├── data/                # Static data
├── types.ts             # TypeScript type definitions
├── constants.ts         # App constants
├── vite.config.ts       # Vite configuration
├── vercel.json          # Vercel deployment config
└── package.json         # Dependencies & scripts
```

## AI Studio

View the original app in AI Studio: [https://ai.studio/apps/drive/1b1sYVCe_9PXAVJKJaaqTgXqbhTVOyRzr](https://ai.studio/apps/drive/1b1sYVCe_9PXAVJKJaaqTgXqbhTVOyRzr)
