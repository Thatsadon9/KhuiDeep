# KhuiDeep Deployment

## Supabase

1. Open Supabase SQL Editor for:

```text
https://okcyedusumxoewabwnlz.supabase.co
```

2. Run these files in order:

```text
supabase/migrations/0001_create_khui_deep_schema.sql
supabase/seed.sql
```

The seed is safe to run again. It upserts the four default categories, removes the previous seeded questions for those categories, and inserts the current 40-card question deck.

3. Copy the public anon key from Supabase:

```text
Project Settings -> API -> Project API keys -> anon public
```

## Environment Variables

Set these values locally and in your hosting provider:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://okcyedusumxoewabwnlz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Do not use the `service_role` key in this frontend app.

## Vercel

Use the default Next.js settings:

```text
Install Command: npm install
Build Command: npm run build
Output Directory: .next
```

Add both environment variables above for Production, Preview, and Development.

## Verify

After deployment, open:

```text
/
/play/all
```

If Supabase is not configured or returns an error, the app falls back to the bundled question deck so the site still loads.
