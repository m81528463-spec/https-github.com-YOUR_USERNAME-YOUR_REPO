SATISFACTION FOR U — TEST FIX PACKAGE

Purpose:
- Add browser-side compressed photo uploads for Hero and About backgrounds.
- Add browser-side compressed profile-photo uploads.
- Prevent Worker from silently truncating uploaded image data.
- Use the supplied patched homepage that requests /api/data and renders settings/profiles.

Files changed in this test package:
- admin.html: background/profile photo upload controls, previews, compression, and safe preservation of existing photos.
- worker.js: separate image-size limits, validation, and a 20 MiB serialized-data safety cap.
- index.html: replaced with the supplied index_patched.html to load public data from /api/data.

Unchanged:
- booking.html
- wrangler.toml
- README content other than this replacement note

IMPORTANT SAFETY:
- This ZIP is for TEST REVIEW ONLY.
- It has NOT been uploaded to GitHub.
- It has NOT been deployed to Cloudflare.
- It has NOT changed Production, DNS, secrets, KV bindings, or KV data.
- Do not deploy this package to Production until tested against a separate test Worker and test KV namespace.
- Admin background image fields are stored in the same site-data KV record as the rest of the website data. Use compressed photos and keep the number of large photos limited.


పరిష్కార ప్యాచ్ (Test ZIP మాత్రమే): Adminలో 5 profile photos, About/second-page backgrounds KVలో save అవుతాయి; homepage మరియు booking page /api/data నుంచి profile names/photos/settings చదువుతాయి. Live websiteకు deploy చేయలేదు. wrangler.tomlలో SFU_DATA test KV bindingను Cloudflare dashboardలో జతచేయాలి.


తాజా Homepage Photo Fix:
- మొదటి పేజీలో Admin నుంచి సేవ్ చేసిన Active Profiles మాత్రమే API ద్వారా చూపబడతాయి.
- ప్రతి Profile card లో Admin లో సేవ్ చేసిన మొదటి ఫోటో కనిపిస్తుంది.
- Hardcoded sample names / stock-photo placeholders తొలగించబడ్డాయి.
- ఫోటోలు browser localStorage లో సేవ్ కావు; Worker API ద్వారా Cloudflare KV (SFU_DATA, site-data) లో సేవ్ అవుతాయి.
- మొదటి పేజీ /api/data నుంచి KV డేటాను చదువుతుంది.
- ఇది Test package మాత్రమే. Production Worker, production KV, live website లేదా GitHub లో ఏ మార్పూ చేయలేదు.
