# Say & See Kids

A mobile-first, installable kids vocabulary PWA. Children can speak or select a safe word, see a high-quality saved storybook picture, hear pronunciation, and learn the spelling.

## Current version

- Eight approved child-safe words and saved illustrations
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

Import the GitHub repository into Vercel. No environment variables are required for the current saved-picture version.

`OPENAI_API_KEY` and `BLOB_READ_WRITE_TOKEN` are reserved for Step 2, when live generation and permanent storage for new approved words are connected. Do not expose either variable with a `NEXT_PUBLIC_` prefix.
