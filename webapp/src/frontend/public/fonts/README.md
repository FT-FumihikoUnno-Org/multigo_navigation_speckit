Roboto fonts (self-hosted)

This directory is where the app expects Roboto font files for self-hosting.

Expected filenames (placed in this directory):
- Roboto-Regular.ttf
- Roboto-Medium.ttf
- Roboto-Bold.ttf

How to provide them:
1. Running the helper script (if your environment can reach GitHub raw content):
   cd scripts && sh download-roboto.sh

   If your environment blocks direct github content, you can set FONT_BASE_URL to a URL that serves the files, for example:
   FONT_BASE_URL="https://my-internal-server/fonts/roboto" sh scripts/download-roboto.sh

2. Or manually download the Roboto TTF files (Apache 2.0 licensed) and place them here.

Notes:
- Prefer using woff2 files in production; this repo downloads TTF for convenience. You can convert to woff2 using fonttools or use prebuilt woff2 files.
- After placing fonts, rebuild the frontend: npm run build
