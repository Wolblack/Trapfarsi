/* TRAPFARSI cloud layer. Runs safely in local-only mode until configured. */
(() => {
  const cfgUrl = window.TRAPFARSI_SUPABASE_URL || "";
  const cfgKey = window.TRAPFARSI_SUPABASE_ANON_KEY || "";
  const enabled = Boolean(cfgUrl && cfgKey && window.supabase?.createClient);
  const keys = {
    profile: "tf_profile_v1",
    playlists: "tf_playlists_v1",
    community_posts: "tf_community_posts_v1",
    lyrics_notes: "tf_lyrics_notes_v1"
  };
  let client = null;
  let currentUser = null;
  let syncTimer = null;
  const $ = id => document.getElementById(id);
  const localRead = key => { try { const v=JSON.parse(localStorage.getItem(keys[key])); return v===null?null:v; } catch (_) { return null; } };
  const localWrite = (key,value) => { try { localStorage.setItem(keys[key],JSON.stringify(value)); return true; } catch (_) { return false; } };
  const toast = msg => { const el=$("toast"); if(el){el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2600);} };
  function addStyles(){
    if($("tf-cloud-style"))return;
    const style=document.createElement("style");style.id="tf-cloud-style";style.textContent=`
      .tf-cloud-panel{margin:0 0 22px;padding:20px;border:1px solid rgba(35,42,55,.1);border-radius:22px;background:rgba(255,255,255,.72);box-shadow:0 10px 34px rgba(30,40,60,.05)}
      .tf-cloud-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center}.tf-cloud-row input{flex:1;min-width:180px}
      .tf-cloud-status{font-size:12px;color:#657080;margin:8px 0 0}.tf-cloud-panel h2{margin:0 0 6px}.tf-cloud-panel p{margin:0 0 12px}
      .tf-cloud-panel .community-input{box-sizing:border-box;width:100%;margin:6px 0 10px}
      .tf-cloud-danger{border:0;background:transparent;text-decoration:underline;cursor:pointer;color:#687080;font:inherit;font-size:12px}
    `;document.head.append(style);
  }
  function mountPanel(){
    const page=$("page-profile"); if(!page||$("tf-cloud-panel"))return;
    addStyles();
    const panel=document.createElement("section");panel.id="tf-cloud-panel";panel.className="tf-cloud-panel";
    panel.innerHTML=`<div class="eyebrow">ACCOUNT & SYNC</div><h2 id="tf-cloud-heading">Make your library yours.</h2><p id="tf-cloud-copy">Sign in by email to sync your profile and playlists across devices and join the shared community.</p><div id="tf-cloud-controls"><div class="tf-cloud-row"><input class="community-input" id="tf-cloud-email" type="email" autocomplete="email" placeholder="you@example.com" aria-label="Email address"><button class="primary-button" id="tf-cloud-send">Email me a sign-in link</button></div></div><div class="tf-cloud-status" id="tf-cloud-status"></div>`;
    page.querySelector(".route-heading").insertAdjacentElement("afterend",panel);
    $("tf-cloud-send").addEventListener("click",sendLink);
    if(!enabled){$("tf-cloud-status").textContent="Cloud is not configured yet. Local-only mode still works. Follow README.md to connect Supabase."; $("tf-cloud-send").disabled=true;$("tf-cloud-send").title="Configure Supabase first";}
    else {$("tf-cloud-status").textContent="Cloud setup detected. Email sign-in uses a secure magic link; no password is stored here.";}
  }
  function status(msg){if($("tf-cloud-status"))$("tf-cloud-status").textContent=msg;}
  async function sendLink(){
    const email=$("tf-cloud-email")?.value.trim();
    if(!email||!email.includes("@")){status("Enter a valid email address.");return;}
    $("tf-cloud-send").disabled=true;
    try{
      const {error}=await client.auth.signInWithOtp({email,options:{emailRedirectTo:location.href.split("#")[0]}});
      if(error)throw error;
      status("Sign-in link sent. Open the email on this device to finish signing in.");
    }catch(e){status(e.message||"Could not send sign-in link.");}
    finally{$("tf-cloud-send").disabled=false;}
  }
  async function loadCloud(){
    if(!currentUser)return;
    try{
      const {data,error}=await client.from("listener_data").select("data_key,value").eq("user_id",currentUser.id);
      if(error)throw error;
      (data||[]).forEach(row=>{if(keys[row.data_key])localWrite(row.data_key,row.value);});
      if(typeof window.tfRenderProfile==="function")window.tfRenderProfile();
      if(typeof window.tfRenderCommunity==="function")window.tfRenderCommunity();
      status("Signed in · Your account data is synced on this device.");
    }catch(e){status("Signed in, but cloud data could not load: "+(e.message||"check your Supabase schema."));}
  }
  async function pushKey(key){
    if(!enabled||!currentUser)return;
    const value=localRead(key); if(value===null)return;
    const {error}=await client.from("listener_data").upsert({user_id:currentUser.id,data_key:key,value,updated_at:new Date().toISOString()},{onConflict:"user_id,data_key"});
    if(error)status("Sync issue: "+error.message);
  }
  function scheduleSync(key){if(!currentUser)return;clearTimeout(syncTimer);syncTimer=setTimeout(()=>pushKey(key).catch(()=>{}),450);}
  async function signOut(){
    if(!client)return;
    const {error}=await client.auth.signOut();
    if(error){status(error.message);return;}
    currentUser=null;renderSignedOut();status("Signed out. This device's local copy remains available.");
  }
  function renderSignedIn(user){
    const controls=$("tf-cloud-controls");if(!controls)return;
    controls.innerHTML=`<div class="tf-cloud-row"><strong>${escapeHtml(user.email||"Signed in listener")}</strong><button class="secondary-button" id="tf-cloud-signout">Sign out</button></div>`;
    $("tf-cloud-signout").addEventListener("click",signOut);
    $("tf-cloud-heading").textContent="Your account is connected.";
    $("tf-cloud-copy").textContent="Profile and playlists sync to your account. Community posts are being moved to the shared feed when you publish while signed in.";
  }
  function renderSignedOut(){
    const controls=$("tf-cloud-controls");if(!controls)return;
    controls.innerHTML=`<div class="tf-cloud-row"><input class="community-input" id="tf-cloud-email" type="email" autocomplete="email" placeholder="you@example.com" aria-label="Email address"><button class="primary-button" id="tf-cloud-send">Email me a sign-in link</button></div>`;
    $("tf-cloud-send").addEventListener("click",sendLink);
    $("tf-cloud-heading").textContent="Make your library yours.";
    $("tf-cloud-copy").textContent="Sign in by email to sync your profile and playlists across devices and join the shared community.";
    if(!enabled)$("tf-cloud-send").disabled=true;
  }
  function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
  async function loadCommunity(){
    if(!client)return;
    try{
      const {data,error}=await client.from("community_posts").select("id,user_id,author_name,category,body,created_at").order("created_at",{ascending:false}).limit(100);
      if(error)throw error;
      const box=$("tf-community-posts");if(!box)return;
      const filter=$("tf-feed-filter")?.value||"All topics";
      const posts=(data||[]).filter(p=>filter==="All topics"||p.category===filter);
      box.replaceChildren();
      if(!posts.length){const empty=document.createElement("article");empty.className="glass community-post";const h=document.createElement("h3");h.textContent="No shared conversations yet.";const p=document.createElement("p");p.textContent="Be the first to start a conversation in this channel.";empty.append(h,p);box.append(empty);return;}
      posts.forEach(post=>{
        const card=document.createElement("article");card.className="glass community-post";
        const top=document.createElement("div");top.className="post-top";
        const avatar=document.createElement("div");avatar.className="post-avatar";avatar.textContent=(post.author_name||"L").slice(0,1).toUpperCase();
        const who=document.createElement("div");const author=document.createElement("div");author.className="post-author";author.textContent=post.author_name;
        const time=document.createElement("div");time.className="post-time";time.textContent=new Date(post.created_at).toLocaleString();who.append(author,time);
        const tag=document.createElement("span");tag.className="post-category";tag.textContent=post.category;top.append(avatar,who,tag);
        const body=document.createElement("p");body.className="post-body";body.textContent=post.body;
        const foot=document.createElement("div");foot.className="post-footer";const stamp=document.createElement("span");stamp.textContent="SHARED COMMUNITY";foot.append(stamp);
        if(currentUser&&post.user_id===currentUser.id){const del=document.createElement("button");del.className="text-action danger";del.textContent="Delete post";del.addEventListener("click",async()=>{const {error}=await client.from("community_posts").delete().eq("id",post.id);if(error){status("Could not delete post: "+error.message);return;}await loadCommunity();});foot.append(del);}
        card.append(top,body,foot);box.append(card);
      });
    }catch(e){status("Shared community unavailable; showing local preview. "+(e.message||""));}
  }
  async function publishSharedPost(){
    if(!enabled||!currentUser||!client)return;
    const body=$("tf-post-text")?.value.trim();
    if(!body)return;
    const profile=localRead("profile")||{name:"Listener"};
    const category=$("tf-post-category")?.value||"Music Talk";
    const {error}=await client.from("community_posts").insert({user_id:currentUser.id,author_name:(profile.name||"Listener").slice(0,32),category,body});
    if(error){status("Local preview saved, but shared post failed: "+error.message);return;}
    await loadCommunity();status("Your post is now visible in the shared community.");
  }
  async function init(){
    mountPanel();
    if(!enabled)return;
    client=window.supabase.createClient(cfgUrl,cfgKey);
    const {data:{session}}=await client.auth.getSession();
    if(session){currentUser=session.user;renderSignedIn(currentUser);await loadCloud();await loadCommunity();}
    $("tf-post-submit")?.addEventListener("click",()=>{publishSharedPost().catch(e=>status(e.message||"Could not publish shared post."));});
    $("tf-feed-filter")?.addEventListener("change",()=>loadCommunity());
    client.auth.onAuthStateChange((event,session)=>{
      if(event==="SIGNED_IN"&&session){currentUser=session.user;renderSignedIn(currentUser);setTimeout(()=>{loadCloud();loadCommunity();},0);}
      if(event==="SIGNED_OUT"){currentUser=null;renderSignedOut();}
    });
    // Keep profile/playlists/notes private to their account; sync local edits.
    window.addEventListener("storage",e=>{
      const key=Object.keys(keys).find(k=>keys[k]===e.key);if(key)scheduleSync(key);
    });
    // Wrap localStorage writes used by the app so same-tab changes sync too.
    const originalSet=Storage.prototype.setItem;
    Storage.prototype.setItem=function(k,v){originalSet.call(this,k,v);const key=Object.keys(keys).find(x=>keys[x]===k);if(key)scheduleSync(key);};
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();