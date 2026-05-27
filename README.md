# Oneline ✍️ (IN PROGRESS)

> Collaborative one-sentence storytelling with strangers.

Get matched with a random person. Take turns adding one sentence. After 10 sentences, your story is complete.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Vue 3 + Vite |
| Styling | UnoCSS |
| PWA | vite-plugin-pwa |
| Backend | Supabase (Auth + DB + Realtime) |
| Hosting | Vercel |

---

## Getting Started

### 1. Clone & install

```bash
git clone https://github.com/you/oneline
cd oneline
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the SQL Editor, run the entire contents of `supabase_schema.sql`
3. Go to **Table Editor** and enable **Realtime** on: `stories`, `sentences`, `queue`
4. Go to **Authentication → Settings** and enable **Anonymous sign-ins**
5. Go to **Settings → API** and copy your Project URL and anon key

### 3. Configure environment

```bash
cp .env.example .env
```

Fill in your values:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Add your environment variables in the Vercel dashboard under **Settings → Environment Variables**.

---

## PWA Icons

Add these two files to `/public/icons/`:
- `icon-192.png` (192×192)
- `icon-512.png` (512×512)

You can generate them at [realfavicongenerator.net](https://realfavicongenerator.net)

---

## Features

- 🎲 Random anonymous username on first visit
- 🔗 Realtime matchmaking with strangers
- ✍️ Turn-based sentence writing (10 sentences = done)
- ♥ Vote on individual sentences
- 🚩 Report inappropriate sentences
- 📚 Save stories to your personal library
- ↓ Export stories as `.txt`
- 🌙 Dark mode toggle
- 📲 Installable as a PWA

---

## Project Structure

```
oneline/
├── src/
│   ├── lib/
│   │   ├── supabase.js       # Supabase client
│   │   └── username.js       # Random username generator
│   ├── stores/
│   │   ├── auth.js           # Auth + profile store
│   │   └── story.js          # Story + matchmaking store
│   ├── views/
│   │   ├── Home.vue          # Landing page
│   │   ├── Queue.vue         # Matchmaking waiting room
│   │   ├── Story.vue         # Active story writing
│   │   ├── Complete.vue      # Finished story
│   │   └── Library.vue       # Saved stories
│   ├── App.vue               # Root with dark mode
│   ├── main.js               # Entry point
│   └── router.js             # Vue Router
├── supabase_schema.sql        # Run this in Supabase SQL editor
├── uno.config.js              # UnoCSS config
├── vite.config.js             # Vite + PWA config
└── vercel.json                # Vercel routing
```
