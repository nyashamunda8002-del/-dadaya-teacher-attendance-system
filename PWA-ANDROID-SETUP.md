# Dadaya Teacher Attendance — PWA / Android

This project is configured as an installable Progressive Web App (PWA).

## Deploying to Vercel

1. Commit and push the project to GitHub.
2. Vercel will rebuild the Vite application.
3. Open the HTTPS Vercel URL in Chrome on Android.
4. Choose **Install app** (or **Add to Home screen**).

## Important attendance behavior

The service worker caches the application shell for offline startup, but deliberately does **not** intercept `/api/*`, Firebase, authentication, or external Google service requests. Clock-in/clock-out and GPS validation therefore continue to use the live backend/database when those operations are performed.

## App icons

- `public/pwa-192x192.png`
- `public/pwa-512x512.png`

These were generated from the project's existing Dadaya app icon SVG.

## Native APK

A PWA is not itself an APK. This project makes the Vercel site installable as a PWA. If a store-ready APK/AAB is required later, package the HTTPS PWA with Trusted Web Activity (Bubblewrap) or Capacitor.
