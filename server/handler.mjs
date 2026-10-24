import {boundedText} from './http.mjs';
import {revenueStatus,locker,checkout,portal,webhook,configured,advertising} from './revenue.mjs';
import { arenaById, arenas } from '../game/content.mjs';
import { createMatch, resolveRound, validatePlan, waitPlan, canonical, validateArena } from '../game/engine.mjs';
const json=(body,status=200,headers={})=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}});
const random=(length=24)=>Array.from(crypto.getRandomValues(new Uint8Array(length)),n=>n.toString(16).padStart(2,'0')).join('');
const hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value))),n=>n.toString(16).padStart(2,'0')).join('');
const fail=(status,message)=>{throw Object.assign(new Error(message),{status});};
const label=(value,max=24)=>{if(typeof value!=='string'||!value.trim()||value.trim().length>max||/[\u0000-\u001f\u007f]/.test(value))fail(400,`Use 1–${max} characters without control codes.`);return value.trim();};
const cookie=token=>`freight_session=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=2592000`;
async function body(request){if(Number(request.headers.get('content-length')||0)>16000)fail(413,'Request is too large.');const raw=await boundedText(request,16000);if(new TextEncoder().encode(raw).length>16000)fail(413,'Request is too large.');let parsed;try{parsed=JSON.parse(raw||'{}');}catch{fail(400,'Use valid JSON.');}if(!parsed||typeof parsed!=='object'||Array.isArray(parsed))fail(400,'Use a JSON object.');return parsed;}
async function rate(db,request){const minute=Math.floor(Date.now()/60000),ip=await hash(request.headers.get('CF-Connecting-IP')||'local');const key=ip+':'+minute;const row=await db.prepare('INSERT INTO limits(bucket,hits,expires_at) VALUES(?,1,?) ON CONFLICT(bucket) DO UPDATE SET hits=hits+1 RETURNING hits').bind(key,Date.now()+120000).first();if(row.hits>160)fail(429,'Too many requests. Please wait a minute.');}
async function account(db,request,required=true){const token=request.headers.get('cookie')?.match(/(?:^|;\s*)freight_session=([a-f0-9]{48})/)?.[1];const user=token?await db.prepare('SELECT p.id,p.alias FROM sessions s JOIN profiles p ON p.id=s.profile_id WHERE s.token_hash=? AND s.expires_at>?').bind(await hash(token),Date.now()).first():null;if(!user&&required)fail(401,'Create or recover your courier first.');return user;}
async function session(db,user){const token=random();await db.prepare('INSERT INTO sessions(token_hash,profile_id,expires_at) VALUES(?,?,?)').bind(await hash(token),user.id,Date.now()+2592000000).run();return token;}
async function member(db,id,user){const room=await db.prepare('SELECT r.* FROM rooms r JOIN members m ON m.room_id=r.id WHERE r.id=? AND m.profile_id=?').bind(id,user.id).first();if(!room)fail(404,'This room is not available to this courier.');return room;}
async function people(db,id){return(await db.prepare('SELECT p.id,p.alias FROM members m JOIN profiles p ON p.id=m.profile_id WHERE m.room_id=? ORDER BY m.joined_at,p.id').bind(id).all()).results;}
export async function pump(db,room,now=Date.now()){
  if(room.phase!=='planning')return room;
  const state=JSON.parse(room.state_json),rows=(await db.prepare('SELECT profile_id,plan_json FROM plans WHERE room_id=? AND round=?').bind(room.id,room.round).all()).results;
  if(rows.length<state.players.length&&now<room.deadline)return room;
  const submitted=Object.fromEntries(rows.map(row=>[row.profile_id,JSON.parse(row.plan_json)]));
  const missing=state.players.filter(player=>!submitted[player.id]).map(player=>player.id);
  const result=resolveRound(state,submitted);result.replay.automaticWaits=missing;result.replay.engineVersion=state.engineVersion;
  const marker=random(16),next=result.state,deadline=next.phase==='planning'?now+90000:null;
  await db.batch([
    db.prepare('UPDATE rooms SET state_json=?,phase=?,round=?,version=version+1,deadline=?,last_resolution=?,last_replay=?,updated_at=? WHERE id=? AND version=? AND phase=\'planning\' AND round=?').bind(JSON.stringify(next),next.phase,next.round,deadline,marker,JSON.stringify(result.replay),now,room.id,room.version,room.round),
    db.prepare('INSERT OR IGNORE INTO replays(room_id,round,replay_json) SELECT id,?,? FROM rooms WHERE id=? AND last_resolution=?').bind(room.round,JSON.stringify(result.replay),room.id,marker)
  ]);
  return await db.prepare('SELECT * FROM rooms WHERE id=?').bind(room.id).first();
}
async function view(db,room,user){room=await pump(db,room);const committed=(await db.prepare('SELECT profile_id,plan_json FROM plans WHERE room_id=? AND round=?').bind(room.id,room.round).all()).results;const own=committed.find(row=>row.profile_id===user.id);return{id:room.id,hostId:room.host_id,phase:room.phase,round:room.round,version:room.version,deadline:room.deadline,serverNow:Date.now(),arena:JSON.parse(room.arena_json),state:room.state_json?JSON.parse(room.state_json):null,members:await people(db,room.id),committedIds:committed.map(row=>row.profile_id),ownPlan:own?JSON.parse(own.plan_json):null,replay:room.last_replay?JSON.parse(room.last_replay):null};}
export async function handle(request,env){
 try{
  const url=new URL(request.url),path=url.pathname.replace(/^\/api\/?/,'').split('/').filter(Boolean).map(segment=>decodeURIComponent(segment)),method=request.method;
  if(url.origin!==(env.SITE_ORIGIN||'https://three-beat-freight.pages.dev'))fail(404,'Use the current public Three Beat Freight address.');
  if(method==='POST'&&path.join('/')!=='billing/webhook'&&request.headers.get('Origin')!==url.origin)fail(403,'Use this site to submit requests.');
  if(!env.DB)fail(503,'Rooms are unavailable. You can still play solo.');
  const db=env.DB;if(path.join('/')==='billing/webhook'&&method==='POST')return json(await webhook(request,env));await rate(db,request);
  if(Math.random()<0.02){await db.batch([db.prepare('DELETE FROM limits WHERE expires_at<?').bind(Date.now()),db.prepare('DELETE FROM sessions WHERE expires_at<?').bind(Date.now())]);}
  if(path.join('/')==='revenue'&&method==='GET')return json(await revenueStatus(db,env,await account(db,request,false)));
  if(path.join('/')==='status'&&method==='GET'){return json({user:await account(db,request,false),multiplayer:true,adsEnabled:advertising(env).available,paymentsAvailable:configured(env)});}
  if(path.join('/')==='profile'&&method==='POST'){
   const input=await body(request);if(await account(db,request,false))fail(409,'This browser already has a courier.');
   const alias=label(input.alias),id=random(12),recoveryKey=random(),now=Date.now();await db.prepare('INSERT INTO profiles(id,alias,recovery_hash,created_at) VALUES(?,?,?,?)').bind(id,alias,await hash(recoveryKey),now).run();const token=await session(db,{id});return json({user:{id,alias},recoveryKey},201,{'Set-Cookie':cookie(token)});
  }
  if(path.join('/')==='recover'&&method==='POST'){const input=await body(request);const key=label(input.recoveryKey,64);const user=await db.prepare('SELECT id,alias FROM profiles WHERE recovery_hash=?').bind(await hash(key)).first();if(!user)fail(401,'Recovery key was not recognized.');return json({user},200,{'Set-Cookie':cookie(await session(db,user))});}
  if(path.join('/')==='logout'&&method==='POST'){const token=request.headers.get('cookie')?.match(/freight_session=([a-f0-9]{48})/)?.[1];if(token)await db.prepare('DELETE FROM sessions WHERE token_hash=?').bind(await hash(token)).run();return json({ok:true},200,{'Set-Cookie':'freight_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'});}
  const user=await account(db,request);
  if(path[0]==='locker')return json(await locker(db,env,user,path,method,method==='POST'?await body(request):{}));
  if(path.join('/')==='billing/checkout'&&method==='POST')return json(await checkout(env,user,url.origin));
  if(path.join('/')==='billing/portal'&&method==='POST')return json(await portal(env,user,url.origin));
  if(path.join('/')==='rooms'&&method==='GET'){const rows=(await db.prepare('SELECT r.id,r.phase,r.updated_at,r.arena_json FROM rooms r JOIN members m ON m.room_id=r.id WHERE m.profile_id=? ORDER BY r.updated_at DESC LIMIT 30').bind(user.id).all()).results;return json({rooms:rows.map(row=>({id:row.id,phase:row.phase,updatedAt:row.updated_at,title:JSON.parse(row.arena_json).title}))});}
  if(path.join('/')==='rooms'&&method==='POST'){
   const input=await body(request);let arena;if(input.arena){try{arena=validateArena(input.arena);}catch(error){fail(400,error.message);}}else{try{arena=arenaById(input.arenaId||arenas[0].id);}catch{fail(400,'Choose a published arena.');}}
   const recent=await db.prepare('SELECT COUNT(*) AS n FROM rooms WHERE host_id=? AND created_at>?').bind(user.id,Date.now()-3600000).first();if(recent.n>=12)fail(429,'A courier may create twelve rooms per hour.');
   const id=random(6),now=Date.now();await db.batch([db.prepare('INSERT INTO rooms(id,host_id,arena_json,created_at,updated_at) VALUES(?,?,?,?,?)').bind(id,user.id,JSON.stringify(arena),now,now),db.prepare('INSERT INTO members(room_id,profile_id,joined_at) VALUES(?,?,?)').bind(id,user.id,now)]);return json({room:await view(db,await member(db,id,user),user)},201);
  }
  if(path[0]!=='rooms'||!/^([a-f0-9]{12})$/.test(path[1]||''))fail(404,'Endpoint not found.');const id=path[1];
  if(path.length===3&&path[2]==='join'&&method==='POST'){
   const now=Date.now();await db.prepare('INSERT OR IGNORE INTO members(room_id,profile_id,joined_at) SELECT id,?,? FROM rooms WHERE id=? AND phase=\'lobby\' AND (SELECT COUNT(*) FROM members WHERE room_id=?)<4').bind(user.id,now,id,id).run();return json({room:await view(db,await member(db,id,user),user)});
  }
  let room=await member(db,id,user);
  if(path.length===2&&method==='GET')return json({room:await view(db,room,user)});
  if(path[2]==='start'&&path.length===3&&method==='POST'){
   if(room.host_id!==user.id)fail(403,'Only the host can start.');if(room.phase!=='lobby')fail(409,'This room has already started.');const players=await people(db,id);if(players.length<2)fail(409,'Invite at least one friend.');const now=Date.now(),state=createMatch(JSON.parse(room.arena_json),players,{mode:'versus',rounds:6});
   const changed=await db.prepare('UPDATE rooms SET state_json=?,phase=\'planning\',round=1,version=version+1,deadline=?,updated_at=? WHERE id=? AND phase=\'lobby\' AND (SELECT COUNT(*) FROM members WHERE room_id=?)=?').bind(JSON.stringify(state),now+90000,now,id,id,players.length).run();if(changed.meta.changes!==1)fail(409,'The room changed. Refresh and start again.');return json({room:await view(db,await member(db,id,user),user)});
  }
  if(path[2]==='plan'&&path.length===3&&method==='POST'){
   const input=await body(request);let plan;try{plan=validatePlan(input.plan);}catch(error){fail(400,error.message);}room=await pump(db,room);if(room.phase!=='planning'||input.round!==room.round)fail(409,'This round changed. Refresh before planning.');const now=Date.now();const existing=await db.prepare('SELECT plan_json FROM plans WHERE room_id=? AND round=? AND profile_id=?').bind(id,room.round,user.id).first();if(existing&&existing.plan_json!==JSON.stringify(plan))fail(409,'A committed plan is locked until the round resolves.');
   if(!existing)await db.batch([
    db.prepare('INSERT OR IGNORE INTO plans(room_id,round,profile_id,plan_json,committed_at) SELECT id,round,?,?,? FROM rooms WHERE id=? AND round=? AND phase=\'planning\' AND deadline>CAST((julianday(\'now\')-2440587.5)*86400000 AS INTEGER)').bind(user.id,JSON.stringify(plan),now,id,input.round),
    db.prepare('UPDATE rooms SET version=version+1 WHERE changes()=1 AND id=? AND round=? AND phase=\'planning\'').bind(id,input.round)
   ]);
   const saved=await db.prepare('SELECT plan_json FROM plans WHERE room_id=? AND round=? AND profile_id=?').bind(id,input.round,user.id).first();if(!saved||saved.plan_json!==JSON.stringify(plan))fail(409,'The deadline passed or another plan was already committed.');return json({room:await view(db,await member(db,id,user),user)});
  }
  if(path[2]==='replays'&&path.length===3&&method==='GET'){const rows=(await db.prepare('SELECT round,replay_json FROM replays WHERE room_id=? ORDER BY round').bind(id).all()).results;return json({replays:rows.map(row=>JSON.parse(row.replay_json))});}
  fail(404,'Endpoint not found.');
 }catch(error){if(!error.status)console.error('Room request failed',{type:error.name});return json({error:error.status?error.message:'This action could not finish. Refresh the room to check your plan.'},error.status||500);}
}






