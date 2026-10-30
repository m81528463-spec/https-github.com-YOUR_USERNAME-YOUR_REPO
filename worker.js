const DATA_KEY = "site-data";
const DEFAULT_SETTINGS = {
  brand: "Satisfaction for U",
  heroEyebrow: "Adults 18+ · Visakhapatnam",
  heroTitle: "Visakhapatnam Female Escort Services",
  heroDescription: "Browse profiles and send a respectful enquiry.",
  whyTitle: "Why Satisfaction for U?",
  whyDescription: "Clear information, respect, consent, and direct contact.",
  seoTitle: "Satisfaction for U",
  seoDescription: "Profile listings and booking enquiries."
};
const json = (data, status=200, extra={}) => new Response(JSON.stringify(data), {
  status, headers: {"content-type":"application/json; charset=utf-8","cache-control":"no-store",...extra}
});
function b64url(bytes) {
  let s=""; for (const b of new Uint8Array(bytes)) s+=String.fromCharCode(b);
  return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
async function sign(payload, secret) {
  const key=await crypto.subtle.importKey("raw",new TextEncoder().encode(secret),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  return b64url(await crypto.subtle.sign("HMAC",key,new TextEncoder().encode(payload)));
}
async function validToken(request, env) {
  const auth=request.headers.get("authorization")||"";
  const token=auth.startsWith("Bearer ")?auth.slice(7):"";
  if(!token||!env.ADMIN_SECRET)return false;
  const parts=token.split(".");
  if(parts.length!==2||await sign(parts[0],env.ADMIN_SECRET)!==parts[1])return false;
  try { const p=JSON.parse(atob(parts[0].replace(/-/g,"+").replace(/_/g,"/"))); return Number(p.exp)>Date.now(); }
  catch { return false; }
}
async function getData(env) {
  if(!env.SFU_DATA)throw new Error("KV binding SFU_DATA is missing.");
  const stored=await env.SFU_DATA.get(DATA_KEY,"json");
  const data=stored&&typeof stored==="object"?stored:{profiles:[],settings:{}};
  data.profiles=Array.isArray(data.profiles)?data.profiles:[];
  data.settings={...DEFAULT_SETTINGS,...(data.settings||{})};
  return data;
}
async function saveData(env,data) {
  if(!env.SFU_DATA)throw new Error("KV binding SFU_DATA is missing.");
  const serialized=JSON.stringify(data);
  // Keep a safety margin below Cloudflare KV's per-value size ceiling.
  if(new TextEncoder().encode(serialized).length>20*1024*1024)throw new Error("Saved site data is too large. Remove or compress some images before saving.");
  await env.SFU_DATA.put(DATA_KEY,serialized);
}
function cors(origin){return {"access-control-allow-origin":origin,"access-control-allow-methods":"GET,POST,PUT,DELETE,OPTIONS","access-control-allow-headers":"Content-Type, Authorization","vary":"Origin"};}
export default {
 async fetch(request,env) {
  const url=new URL(request.url);
  if(url.pathname.startsWith("/api/")) {
   const h=cors(url.origin);
   if(request.method==="OPTIONS")return new Response(null,{status:204,headers:h});
   try {
    if(url.pathname==="/api/data"&&request.method==="GET")return json(await getData(env),200,h);
    if(url.pathname==="/api/login"&&request.method==="POST") {
     if(!env.ADMIN_USERNAME||!env.ADMIN_PASSWORD||!env.ADMIN_SECRET)return json({error:"Configure ADMIN_USERNAME, ADMIN_PASSWORD and ADMIN_SECRET in Cloudflare Secrets."},503,h);
     let body;try{body=await request.json();}catch{return json({error:"Invalid JSON."},400,h);}
     if(body.username!==env.ADMIN_USERNAME||body.password!==env.ADMIN_PASSWORD)return json({error:"Incorrect username or password."},401,h);
     const payload=b64url(new TextEncoder().encode(JSON.stringify({sub:String(body.username),exp:Date.now()+4*60*60*1000})));
     return json({ok:true,token:payload+"."+await sign(payload,env.ADMIN_SECRET)},200,h);
    }
    if(url.pathname.startsWith("/api/admin/")) {
     if(!(await validToken(request,env)))return json({error:"Session expired. Please sign in again."},401,h);
     if(url.pathname==="/api/admin/data"&&request.method==="GET")return json(await getData(env),200,h);
     if(url.pathname==="/api/admin/settings"&&request.method==="PUT") {
      let body;try{body=await request.json();}catch{return json({error:"Invalid JSON."},400,h);}
      const data=await getData(env), incoming=body.settings||{};
      const allowed=["brand","heroEyebrow","heroTitle","heroDescription","whyTitle","whyDescription","heroButton","seoTitle","seoDescription","canonical","heroBackground","whyBackground","heroImage","whyImage","bookingHeroBackground","bookingExperienceBackground","bookingSectionBackground","contactPhone","contactWhatsApp","contactEmail"];
      const imageKeys=new Set(["heroBackground","whyBackground","heroImage","whyImage","bookingHeroBackground","bookingExperienceBackground","bookingSectionBackground"]);
      for(const k of allowed)if(incoming[k]!==undefined){
       const value=String(incoming[k]??"");
       const limit=imageKeys.has(k)?700000:5000;
       if(value.length>limit)return json({error:(imageKeys.has(k)?"Background image":"Setting")+" is too large. Please choose a smaller/compressed image."},413,h);
       if(imageKeys.has(k)&&value&&!(/^https:\/\//i.test(value)||/^data:image\/(jpeg|png|webp);base64,/i.test(value)))return json({error:"Background image must be an HTTPS URL or JPEG, PNG or WebP image."},400,h);
       data.settings[k]=value;
      }
      await saveData(env,data);return json({ok:true,settings:data.settings},200,h);
     }
     if(url.pathname==="/api/admin/profiles"&&(request.method==="PUT"||request.method==="DELETE")) {
      let body;try{body=await request.json();}catch{return json({error:"Invalid JSON."},400,h);}
      const data=await getData(env);
      if(request.method==="PUT") {
       const p=body.profile;
       if(!p||!String(p.id||"").trim()||!String(p.name||"").trim())return json({error:"Profile ID and name are required."},400,h);
       const rawPhotos=Array.isArray(p.photos)?p.photos:[];
       const photos=rawPhotos.slice(0,5).map(x=>String(x||""));
       const legacyPhoto=String(p.photo||"");
       if(!photos.some(Boolean)&&legacyPhoto)photos[0]=legacyPhoto;
       for(const photo of photos){
        if(photo.length>500000)return json({error:"Each profile photo must be compressed below 500 KB."},413,h);
        if(photo&&!( /^https:\/\//i.test(photo)||/^data:image\/(jpeg|png|webp);base64,/i.test(photo)))return json({error:"Use HTTPS URLs or JPEG, PNG or WebP images for profile photos."},400,h);
       }
       const photo=photos.find(Boolean)||"";
       const clean={id:String(p.id).slice(0,80),name:String(p.name).slice(0,100),location:String(p.location||"").slice(0,120),photo,photos,description:String(p.description||"").slice(0,2000),phone:String(p.phone||"").slice(0,40),whatsapp:String(p.whatsapp||"").slice(0,40),active:p.active!==false,createdAt:p.createdAt||new Date().toISOString()};
       const i=data.profiles.findIndex(x=>x.id===clean.id);if(i>=0)data.profiles[i]=clean;else data.profiles.push(clean);
      } else data.profiles=data.profiles.filter(p=>p.id!==String(body.id||""));
      await saveData(env,data);return json({ok:true,profiles:data.profiles},200,h);
     }
    }
    return json({error:"API endpoint not found."},404,h);
   } catch(e) {return json({error:e?.message||"Server error."},503,h);}
  }
  if(!env.ASSETS)return new Response("Static Assets binding ASSETS is missing.",{status:500});
  // Publicly serve admin.html; authentication is required for /api/admin/*, not the login page.
  return env.ASSETS.fetch(request);
 }
};
