# 🌟 Beacon - Gratitude Social App

**"Improving the happiness index of the world"**

Beacon is a social platform where users share smiling selfies with gratitude stories. The app promotes positivity, mindfulness, and community through gratitude sharing, weekly competitions, and curated wellness products.

## Features

- **Gratitude Feed** — Share smiling selfies with your gratitude story, categorized by Family, Nature, Friendship, Career, Wellness, Kindness, Community
- **AI Smile Verification** — (Planned) AI verifies genuine smiles to maintain community authenticity
- **Leaderboard** — Weekly & all-time top gratitude sharers with smile streaks
- **Mindfulness Shop** — Curated Amazon Canada mindfulness products (journals, meditation tools, wellness items) with direct purchase links
- **Likes & Tips** — Appreciate others' gratitude stories with likes and tips
- **User Profiles** — Customizable profiles with bio, location, smile streaks, and post history

## Tech Stack

- **Frontend:** React + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Express.js (Node.js)
- **Database:** Supabase (PostgreSQL + Auth)
- **Routing:** Wouter (hash-based)
- **State:** TanStack React Query
- **Build:** Vite + esbuild

## Getting Started

### Prerequisites
- Node.js 20+
- A [Supabase](https://supabase.com) project

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/madhupalakkada/beacon-app.git
   cd beacon-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Supabase:
   - Create a Supabase project
   - Run the SQL in `supabase-setup.sql` in the Supabase SQL Editor
   - Enable email autoconfirm in Authentication > Providers > Email
   - Update the Supabase URL and anon key in `server/supabase.ts`

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:5000

### Build for Production

```bash
npm run build
NODE_ENV=production node dist/index.cjs
```

## Project Structure

```
beacon-app/
├── client/src/
│   ├── components/     # UI components (post-card, app-layout, theme)
│   ├── hooks/          # Custom hooks (toast, mobile detection)
│   ├── lib/            # Auth provider, API client, utilities
│   ├── pages/          # All app pages (feed, create-post, shop, etc.)
│   └── index.css       # Tailwind + custom theme (warm amber/gold)
├── server/
│   ├── index.ts        # Express server entry point
│   ├── routes.ts       # All API routes (auth, posts, products, users)
│   ├── storage.ts      # Supabase storage class
│   └── supabase.ts     # Supabase client config
├── shared/
│   └── schema.ts       # Shared TypeScript types
└── supabase-setup.sql  # Database schema + RLS policies
```

## Color Theme

Warm amber/gold primary (`hsl(25, 85%, 55%)`) with soft cream surfaces — designed to evoke warmth, gratitude, and positivity.

## License

MIT
