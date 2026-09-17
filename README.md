This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Maps and road routing (Leaflet + OpenStreetMap)

BagPack renders OpenStreetMap tiles with Leaflet, uses Nominatim to resolve/search places, and uses OSRM for real road geometry, distance, and duration. Fuel, round-trip, and per-person costs are calculated from that road distance. OpenStreetMap/OSRM do not provide toll prices, reviews, ticket prices, or motorcycle-specific routing on the default public OSRM server, so the app labels those values unavailable instead of inventing them.

The public endpoints work for light local development. For production, use hosted or self-hosted Nominatim/OSRM instances and configure:

```bash
NOMINATIM_API_URL=https://your-nominatim-host
PHOTON_API_URL=https://your-photon-host
OSRM_API_URL=https://your-osrm-host
OSM_USER_AGENT=BagPack/0.1 (contact: you@example.com)
```

For optional Reddit community evidence, register a Reddit API application and add server-side OAuth credentials:

```bash
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_USER_AGENT=BagPack/0.1 by your-reddit-username
```

BagPack does not scrape IRCTC or claim live train availability without authorized access. Domestic recommendation cards link to the official IRCTC train-search page for the final availability check and booking.

Restart `npm run dev` after changing environment variables. Public OpenStreetMap services are best-effort and have usage policies; do not use them for heavy production traffic.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
