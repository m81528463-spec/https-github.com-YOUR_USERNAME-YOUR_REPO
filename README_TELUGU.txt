Satisfaction for U - Test Deploy ZIP

இந்த ZIP-ல் index.html, booking.html, admin.html, worker.js, wrangler.toml உள்ளன.
இது TEST Worker-க்கு மட்டும். Production Worker அல்லது production domain-ல் deploy செய்ய வேண்டாம்.

Admin login Secrets (Cloudflare > Workers & Pages > satisfactionforu-test > Settings > Variables and Secrets):
ADMIN_USERNAME = Manoj2026
ADMIN_PASSWORD = நீங்கள் தேர்ந்தெடுத்த புதிய password (முந்தைய value-ஐ உறுதி செய்ய முடியாது)
ADMIN_SECRET = நீளமான random secret; இதை யாரிடமும் பகிர வேண்டாம்.
இவை Secret வகையில் இருக்க வேண்டும்; plain environment variable ஆக அல்ல.

முக்கிய KV பாதுகாப்பு:
wrangler.toml-ல் KV namespace ID சேர்க்கப்படவில்லை. Test-க்கென தனி KV namespace உருவாக்கி,
Cloudflare Dashboard-ல் SFU_DATA binding-ஐ அந்த TEST namespace-க்கு இணைக்கவும்.
Production KV namespace-ஐ இணைக்க வேண்டாம்; இல்லையெனில் admin-ல் மாற்றும் தரவு Production-ஐ பாதிக்கலாம்.

GitHub வழி deploy செய்வதற்கு முன்:
1. தற்போதைய repo கோப்புகளின் backup எடுக்கவும்.
2. Cloudflare deployment project உண்மையில் satisfactionforu-test-ஐ target செய்கிறதா உறுதி செய்யவும்.
3. Production domain / Production Worker-ஐ target செய்ய வேண்டாம்.
4. Secrets மற்றும் தனி test KV binding அமைந்த பிறகே deploy செய்யவும்.
5. Deploy ஆன பிறகு https://satisfactionforu-test.m81528463.workers.dev/admin.html இல் சோதிக்கவும்.

இந்த ZIP உருவாக்கப்பட்டது மட்டுமே; deploy செய்யப்படவில்லை அல்லது live-ல் verify செய்யப்படவில்லை.
