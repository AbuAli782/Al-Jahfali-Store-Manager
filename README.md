<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/168d7962-1fc1-4fda-8479-1846b861ca85

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in `.env.local` or in your environment to your Gemini API key
3. Run the app locally:
   `npm run dev`

## Deploy to Hosting

1. Install dependencies:
   `npm install`
2. Build the app for production:
   `npm run build`
3. Set environment variables on the host:
   - `GEMINI_API_KEY` = your Gemini API key
   - `PORT` = provided by the host (optional, defaults to 3000)
   - `NODE_ENV` = `production` (recommended)
4. Start the server:
   `npm start`

> The project now uses `server.ts` with `process.env.PORT`, so it works on most Node hosting platforms.

## Deploy on Railway

Railway detects Node.js apps automatically. Use these settings:

- Build command: `npm run build`
- Start command: `npm start`
- Environment variables:
  - `GEMINI_API_KEY`
  - `PORT` (optional)
  - `NODE_ENV=production`

### Firebase

The app already includes Firebase configuration in `firebase-applet-config.json`.
- Firestore connectivity is enabled through `src/lib/db.ts`.
- Google auth is used in the admin panel.
- Admin login is allowed for the email `lya628625@gmail.com`.

> If you want, يمكنك لاحقًا تحديث `firebase-applet-config.json` بقيم مشروع Firebase آخر أو تحويله إلى متغيرات بيئية عند الحاجة.
