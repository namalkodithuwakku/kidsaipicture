# Say & See Kids

A mobile-first, installable kids vocabulary PWA. Children can speak or select a safe word, see a high-quality saved storybook picture, hear pronunciation, and learn the spelling.

## Current version

- Eight bundled storybook illustrations that load instantly
- Two-stage AI generation for a curated child-safe vocabulary
- A fast low-quality preview first, followed by a high-quality background upgrade
- Permanent Vercel Blob storage shared by every user
- Automatic in-app replacement when the high-quality square WebP is ready
- Browser speech recognition and pronunciation
- Letter-by-letter spelling
- Device-local favourites
- Offline picture caching
- Responsive mobile and desktop layout
- Standard Next.js package ready for GitHub and Vercel

## Run locally

```bash
npm install
npm run dev
```

## Vercel

Import the GitHub repository into Vercel, then configure:

- `OPENAI_API_KEY`: your server-side OpenAI API key.
- Vercel Blob: create a public Blob store and connect it to this project. Vercel will provide either OIDC storage variables or `BLOB_READ_WRITE_TOKEN`.

Apply the variables to Production, Preview, and Development, then redeploy. Never add `NEXT_PUBLIC_` to either secret.

The server accepts only the curated preschool vocabulary in `app/api/pictures/route.ts`. Final pictures are returned first, previews are reused while an upgrade is running, and a small Blob marker prevents duplicate high-quality jobs. New generation is rate-limited to help control costs.
