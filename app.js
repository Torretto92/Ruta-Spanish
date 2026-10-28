/* Ruta Spanish — learning engine. Needs course.js loaded first. */
'use strict';

/* ---------- constants ---------- */
const DAY = 864e5;
const INT = [0, 0.25, 1, 3, 7, 16, 35];          // spaced-repetition intervals (days) per box 0..6
const STORE = 'ruta-spanish-v1';
const PERSONS = ['yo','tú','él / ella / usted','nosotros','vosotros','ellos / ellas / ustedes'];
const DRILL_P = [0,1,2,3,5];
const TENSES = { pres:'present', pret:'past' };
const BANDS = { A1:'Beginner', A2:'Elementary', B1:'Intermediate' };
const PRAISE = ['¡Muy bien!','¡Correcto!','¡Perfecto!','¡Eso es!','¡Genial!'];
const NAMES = new Set(['Ana','Carlos','Lucía','Madrid','México','Mexico','Australia','España','Spain','Chile','Tom','Smith','Marco','Sam','Elena','Spanish','English','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday','Mondays','I','I\'m','I\'d']);
const LEVEL_NAMES = ['', 'Learn', 'Practise', 'Master'];
const LEVEL_TYPES = {
  1: ['mc_es2en','pic','mc_en2es','pic','listen_mc','tiles_es2en','tiles_es2en','match','fill'],
  2: ['pic','mc_en2es','tiles_en2es','tiles_es2en','type_w','type_w','fill','listen_w','conj','conj','dlg','match'],
  3: ['type_w','type_s','type_s','listen_s','speak','conj','conj','tiles_en2es','dlg','fill','listen_w']
};
const TYPES = {
  mc_es2en:{k:['w','s']}, pic:{k:['w']}, mc_en2es:{k:['w']}, listen_mc:{k:['w'],audio:1}, match:{k:['w']},
  tiles_es2en:{k:['s']}, tiles_en2es:{k:['s']}, fill:{k:['s']}, type_w:{k:['w']}, type_s:{k:['s']},
  listen_w:{k:['w'],audio:1}, listen_s:{k:['s'],audio:1}, speak:{k:['s'],mic:1}, conj:{k:['v']}, dlg:{k:['d']}
};

/* ---------- state ---------- */
function fresh(){ return { v:1, units:{}, srs:{}, xp:0, today:{d:'',xp:0}, streak:{n:0,last:''},
  settings:{ rate:0.85, voice:'', theme:'system', goal:30, speak:true, sfx:true }, stats:{ answers:0, correct:0 } }; }
let S = fresh();
function load(){ try { const r = localStorage.getItem(STORE); if (r) adopt(JSON.parse(r)); } catch(e){} }
function adopt(o){ const f = fresh(); S = Object.assign(f, o); S.settings = Object.assign(fresh().settings, o.settings || {}); S.stats = Object.assign(fresh().stats, o.stats || {}); }
function save(){ try { localStorage.setItem(STORE, JSON.stringify(S)); } catch(e){} }
function dstr(t){ const d = new Date(t == null ? Date.now() : t); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function todayXP(){ return S.today.d === dstr() ? S.today.xp : 0; }
function addXP(n){ const t = dstr(); if (S.today.d !== t) S.today = { d:t, xp:0 }; S.today.xp += n; S.xp += n; }
function bumpStreak(){ const t = dstr(); if (S.streak.last === t) return; S.streak.n = S.streak.last === dstr(Date.now()-DAY) ? S.streak.n + 1 : 1; S.streak.last = t; }
function streakNow(){ return (S.streak.last === dstr() || S.streak.last === dstr(Date.now()-DAY)) ? S.streak.n : 0; }
function rec(key, ok){
  const now = Date.now(); const r = S.srs[key] || { b:0, d:now, r:0, w:0 };
  if (ok){ r.b = Math.min(r.b + 1, 6); r.r++; r.d = now + INT[r.b]*DAY; }
  else   { r.b = 0; r.w++; r.d = now + 10*60e3; }
  S.srs[key] = r; S.stats.answers++; if (ok) S.stats.correct++;
}
const box = k => S.srs[k] ? S.srs[k].b : -1;

/* ---------- course index ---------- */
function parse(str){
  let hint = '', s = str; const ti = s.indexOf(' ~ ');
  if (ti >= 0){ hint = s.slice(ti+3).trim(); s = s.slice(0, ti); }
  const p = s.split(' = ');
  return { es:p[0].split('|').map(x=>x.trim()), en:p[1].split('|').map(x=>x.trim()), hint };
}
const ITEMS = {}, UNIT_ITEMS = {};
COURSE.forEach((u, ui) => {
  const list = [];
  u.words.forEach((w,i) => list.push(Object.assign(parse(w), { key:`${u.id}|w|${i}`, kind:'w', u:ui })));
  u.sents.forEach((w,i) => list.push(Object.assign(parse(w), { key:`${u.id}|s|${i}`, kind:'s', u:ui })));
  if (u.dlg){
    u.lines = u.dlg.map(l => { const c = l.indexOf(': '); return Object.assign(parse(l.slice(c+2)), { who:l.slice(0,c) }); });
    u.lines.forEach((l,i) => { if (i > 0) list.push(Object.assign({}, l, { key:`${u.id}|d|${i}`, kind:'d', u:ui, li:i })); });
  }
  (u.verbs || []).forEach(vk => { const [v,t] = vk.split('|');
    DRILL_P.forEach(p => list.push({ key:`${u.id}|v|${v}|${t}|${p}`, kind:'v', u:ui, verb:v, tense:t, p, es:[VERBS[vk][p]], en:[`${v} (${TENSES[t]}), ${PERSONS[p]}`], hint:'' }));
  });
  list.forEach(it => ITEMS[it.key] = it); UNIT_ITEMS[u.id] = list;
});
const ALL = Object.values(ITEMS);
const WG = {};
ALL.filter(i => i.kind === 'w').forEach(i => {
  const k = i.es[0].replace(/[¿¡?!.,;:]/g,'').toLowerCase().trim(), g = i.en[0];
  if (!k.includes(' ')) { if (!GLOSS[k]) WG[k] = g; }
  else { const m = k.match(/^(el|la|los|las) ([^ ]+)$/); if (m){ if (!GLOSS[m[2]]) WG[m[2]] = g.replace(/^the /,''); } else if (!PHRASES[k]) PHRASES[k] = g; }
});

const lvl = i => S.units[COURSE[i].id] || 0;
const unlocked = i => i === 0 || lvl(i-1) >= 1 || lvl(i) >= 1;
function maxU(){ let m = 0; COURSE.forEach((u,i) => { if (unlocked(i)) m = i; }); return m; }
function dueItems(){ const now = Date.now(); return ALL.filter(i => S.srs[i.key] && S.srs[i.key].d <= now); }
function weakItems(){ return ALL.filter(i => { const r = S.srs[i.key]; return r && r.w > 0 && r.b < 3; }); }
function learnedWords(){ return ALL.filter(i => i.kind === 'w' && box(i.key) >= 2).length; }

/* ---------- text helpers ---------- */
const rnd = n => Math.floor(Math.random()*n);
const pick = a => a[rnd(a.length)];
function shuffle(a){ a = a.slice(); for (let i=a.length-1;i>0;i--){ const j=rnd(i+1); [a[i],a[j]]=[a[j],a[i]]; } return a; }
function norm(s){ return String(s).toLowerCase().replace(/[’']/g,'').replace(/[¿¡?!.,;:"“”«»()]/g,' ').replace(/-/g,' ').replace(/\s+/g,' ').trim(); }
function deacc(s){ return s.normalize('NFD').replace(/[̀-ͯ]/g,''); }
function clean(w){ return w.replace(/[¿¡?!.,;:]/g,''); }
function tok(s){ const t = s.split(/\s+/).map(clean).filter(Boolean); if (t.length && !NAMES.has(t[0]) && !/^I'/.test(t[0])) t[0] = t[0].charAt(0).toLowerCase() + t[0].slice(1); return t; }
function lev(a,b){ const m=a.length,n=b.length; if(!m) return n; if(!n) return m; let p=Array.from({length:n+1},(_,j)=>j);
  for(let i=1;i<=m;i++){ const c=[i]; for(let j=1;j<=n;j++) c[j]=Math.min(p[j]+1,c[j-1]+1,p[j-1]+(a[i-1]===b[j-1]?0:1)); p=c; } return p[n]; }
const PRON = /^(yo|tú|él|ella|nosotros|nosotras|ellos|ellas|usted|ustedes) /;
function variants(s, es){ const v = [norm(s)]; if (es){ const m = v[0].replace(PRON,''); if (m !== v[0]) v.push(m); } return v; }

function gradeText(input, answers, es){
  const n = norm(input); if (!n) return { ok:false };
  const ins = variants(input, es);
  const pairs = []; answers.forEach(a => variants(a, es).forEach(y => ins.forEach(x => pairs.push([x,y,a]))));
  for (const [x,y] of pairs) if (x === y) return { ok:true };
  for (const [x,y,a] of pairs) if (deacc(x) === deacc(y)) return { ok:true, note:'Watch the accents: <b>'+esc(a)+'</b>' };
  if (es) for (const a of answers){ const m = norm(a).match(/^(el|la|los|las|un|una) (.+)$/); if (m && deacc(n) === deacc(m[2])) return { ok:true, note:'Remember the article: <b>'+esc(a)+'</b>' }; }
  for (const [x,y,a] of pairs){ const L = y.length, allow = L >= 16 ? 2 : L >= 6 ? 1 : 0; if (allow && lev(deacc(x), deacc(y)) <= allow) return { ok:true, note:'Small typo. Correct spelling: <b>'+esc(a)+'</b>' }; }
  return { ok:false };
}
function gradeStrict(input, answers){
  const n = norm(input); if (!n) return { ok:false };
  if (answers.some(a => norm(a) === n)) return { ok:true };
  if (answers.some(a => deacc(norm(a)) === deacc(n))) return { ok:false, note:'Close, but the accent changes the meaning here.' };
  return { ok:false };
}
function gradeExact(input, answers){ const n = norm(input); return { ok: answers.some(a => norm(a) === n) }; }
function esc(s){ return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]); }

/* ---------- exercise factory ---------- */
function distract(item, field, n, kinds){
  const ans = new Set(item[field].map(x => deacc(norm(x))));
  const same = UNIT_ITEMS[COURSE[item.u].id].filter(i => kinds.includes(i.kind) && i.key !== item.key);
  const all = ALL.filter(i => kinds.includes(i.kind) && i.u <= Math.max(maxU(), item.u) && i.key !== item.key);
  const out = [], seenN = new Set(ans);
  for (const src of [shuffle(same), shuffle(all)]) for (const i of src){
    if (out.length >= n) break;
    const ks = i[field].map(x => deacc(norm(x)));
    if (ks.some(k => seenN.has(k))) continue;
    ks.forEach(k => seenN.add(k)); out.push(i[field][0]);
  }
  return out;
}
function makeEx(type, item){
  const ex = { type, item, items:[item] };
  const u = COURSE[item.u];
  switch (type){
    case 'mc_es2en': return Object.assign(ex, { t:'mc', label:'What does this mean?', show:item.es[0], audio:item.es[0],
      options:shuffle([item.en[0], ...distract(item,'en',3,[item.kind])]), answers:item.en, reveal:null });
    case 'pic': {
      if (!hasArt(item)) return null;
      const keys = new Set([artKey(item.es[0]) || item.es[0]]), ens = new Set(item.en.map(norm)), out = [item];
      const top = Math.max(maxU(), item.u);
      for (const src of [shuffle(UNIT_ITEMS[u.id]), shuffle(ALL.filter(i => i.u <= top))]) for (const o of src){
        if (out.length >= 4) break;
        if (o === item || !hasArt(o)) continue;
        const k = artKey(o.es[0]) || o.es[0];
        if (keys.has(k) || o.en.some(e => ens.has(norm(e)))) continue;
        keys.add(k); o.en.forEach(e => ens.add(norm(e))); out.push(o);
      }
      if (out.length < 3) return null;
      return Object.assign(ex, { t:'pic', label:'Which one is “' + item.en[0].replace(/^(the|a|an) /i,'') + '”?', opts:shuffle(out), answers:[item.es[0]] });
    }
    case 'mc_en2es': return Object.assign(ex, { t:'mc', label:'Choose the Spanish', show:item.en[0], hint:item.hint,
      options:shuffle([item.es[0], ...distract(item,'es',3,[item.kind])]), answers:item.es, optAudio:true });
    case 'listen_mc': return Object.assign(ex, { t:'mc', label:'Tap what you hear', listen:item.es[0],
      options:shuffle([item.es[0], ...distract(item,'es',3,['w'])]), answers:item.es, reveal:item.en[0] });
    case 'match': {
      const set = [item], ens = new Set(item.en.map(norm)), ess = new Set(item.es.map(norm));
      for (const o of shuffle(UNIT_ITEMS[u.id].filter(i => i.kind === 'w' && i.key !== item.key))){
        if (set.length >= 5) break;
        if (o.en.some(e => ens.has(norm(e))) || o.es.some(e => ess.has(norm(e)))) continue;
        o.en.forEach(e => ens.add(norm(e))); o.es.forEach(e => ess.add(norm(e))); set.push(o);
      }
      if (set.length < 3) return null;
      return Object.assign(ex, { t:'match', label:'Match the pairs', items:set });
    }
    case 'tiles_es2en': case 'tiles_en2es': {
      const to = type === 'tiles_es2en' ? 'en' : 'es', from = to === 'en' ? 'es' : 'en';
      const toks = tok(item[to][0]);
      const pool = ALL.filter(i => i.kind === 's' && i.key !== item.key && i.u <= Math.max(maxU(), item.u)).flatMap(i => tok(i[to][0]));
      const have = new Set(toks.map(norm)), extra = [], want = Math.min(4, Math.max(2, Math.round(toks.length/2)));
      for (const t of shuffle(pool)){ if (extra.length >= want) break; const k = norm(t); if (!k || have.has(k)) continue; have.add(k); extra.push(t); }
      return Object.assign(ex, { t:'tiles', to, label: to === 'en' ? 'Translate into English' : 'Translate into Spanish',
        show:item[from][0], audio: from === 'es' ? item.es[0] : null, bank:shuffle([...toks, ...extra]), answers:item[to] });
    }
    case 'fill': {
      const words = item.es[0].split(/\s+/);
      const idxs = words.map((w,i) => [w,i]).filter(([w]) => clean(w).length >= 3);
      if (!idxs.length) return null;
      const [w, i] = pick(idxs); const ans = clean(w).toLowerCase();
      const pool = ALL.filter(x => (x.kind === 's' || x.kind === 'w') && x.u <= Math.max(maxU(), item.u)).flatMap(x => tok(x.es[0]).map(t => t.toLowerCase()));
      const out = [ans];
      for (const t of shuffle(pool)){ if (out.length >= 4) break; if (t.length < 2 || NAMES.has(t)) continue; if (out.some(o => deacc(o) === deacc(t))) continue; out.push(t); }
      const lead = (w.match(/^[¿¡]*/) || [''])[0], trail = (w.match(/[?!.,;:]*$/) || [''])[0];
      const pre = words.slice(0,i).join(' '), post = words.slice(i+1).join(' ');
      return Object.assign(ex, { t:'fill', label:'Fill in the blank', preW:pre, postW:post, lead, trail,
        en:item.en[0], options:shuffle(out), answers:[ans], full:item.es[0] });
    }
    case 'type_w': case 'type_s': return Object.assign(ex, { t:'type', label:'Write this in Spanish', show:item.en[0], hint:item.hint, answers:item.es });
    case 'listen_w': case 'listen_s': return Object.assign(ex, { t:'type', label:'Type what you hear', listen:item.es[0], answers:item.es, reveal:item.en[0] });
    case 'speak': return Object.assign(ex, { t:'speak', label:'Say this out loud', show:item.es[0], en:item.en[0], answers:item.es });
    case 'conj': return Object.assign(ex, { t:'type', label:'Conjugate the verb', conj:item, answers:item.es });
    case 'dlg': {
      const others = COURSE.filter(x => x.lines && x !== u).flatMap(x => x.lines.slice(1));
      const later = u.lines.filter((l,j) => j > item.li + 1);
      const wrong = shuffle([...shuffle(others).slice(0,2), ...shuffle(later).slice(0,1)]).filter(l => l.es[0] !== item.es[0]).slice(0,2);
      return Object.assign(ex, { t:'dlg', label:'What comes next?', before:u.lines.slice(0, item.li), who:item.who,
        opts:shuffle([item, ...wrong]), options:null, answers:[item.es[0]], reveal:item.en[0] });
    }
  }
  return null;
}
function canDo(type, flags){
  const T = TYPES[type];
  if (T.audio && !VOICE) return false;
  if (T.mic && (!SR || !S.settings.speak || micBlocked || (flags && flags.noSpeak))) return false;
  return true;
}

/* ---------- session builders ---------- */
function buildLesson(ui, level, test){
  const u = COURSE[ui], pool = UNIT_ITEMS[u.id];
  const n = test ? 12 : [0,12,14,15][level];
  const types = LEVEL_TYPES[test ? 3 : level];
  const older = ALL.filter(i => i.u < ui && S.srs[i.key]);
  const used = {}, seen = new Set(), out = [];
  const forced = (!test && level === 1) ? ['mc_es2en','mc_en2es','mc_es2en'] : [];
  let count = 0, guard = 0;
  while (count < n && guard++ < 400){
    const type = forced.length ? forced.shift() : pick(types);
    if (!canDo(type)) continue;
    const kinds = TYPES[type].k;
    let cands = pool.filter(i => kinds.includes(i.kind) && (type !== 'pic' || hasArt(i)));
    if (level >= 2 && !test && Math.random() < 0.2){ const rc = older.filter(i => kinds.includes(i.kind) && (type !== 'pic' || hasArt(i))); if (rc.length) cands = rc; }
    if (!cands.length) continue;
    const scored = cands.map(i => [i, (used[i.key]||0)*10 + (box(i.key) < 0 && !seen.has(i.key) ? -3 : Math.max(0,box(i.key))) + Math.random()*2.5]);
    scored.sort((a,b) => a[1]-b[1]);
    const item = scored[0][0];
    const ex = makeEx(type, item); if (!ex) continue;
    used[item.key] = (used[item.key]||0) + 1;
    if (!test) for (const it of ex.items) if (it.kind === 'w' && box(it.key) < 0 && !seen.has(it.key)) out.push({ t:'intro', item:it, items:[it] });
    ex.items.forEach(it => seen.add(it.key));
    out.push(ex); count++;
  }
  return out;
}
function exForItem(item){
  const b = box(item.key);
  let opts;
  if (item.kind === 'w') opts = b <= 2 ? ['mc_es2en','mc_en2es','listen_mc'].concat(hasArt(item) ? ['pic','pic'] : []) : ['type_w','listen_w','type_w'];
  else if (item.kind === 's') opts = b <= 2 ? ['tiles_es2en','tiles_en2es','fill'] : ['type_s','listen_s','speak','tiles_en2es'];
  else if (item.kind === 'v') opts = ['conj'];
  else opts = ['dlg'];
  opts = opts.filter(t => canDo(t));
  return makeEx(pick(opts), item);
}
function buildFromItems(items, n){
  return shuffle(items).slice(0, n).map(exForItem).filter(Boolean);
}
function buildReview(){
  const due = dueItems().sort((a,b) => S.srs[a.key].b - S.srs[b.key].b || S.srs[a.key].d - S.srs[b.key].d).slice(0, 15);
  return buildFromItems(due, 15);
}
function buildMistakes(){
  const w = weakItems().sort((a,b) => (S.srs[b.key].w - S.srs[b.key].r) - (S.srs[a.key].w - S.srs[a.key].r)).slice(0, 12);
  return buildFromItems(w, 12);
}
function buildVerbs(){
  const v = ALL.filter(i => i.kind === 'v' && unlocked(i.u));
  return shuffle(v).sort((a,b) => box(a.key) - box(b.key)).slice(0, 15).map(i => makeEx('conj', i));
}

/* ---------- speech ---------- */
const TTS = typeof window !== 'undefined' && 'speechSynthesis' in window;
const SR = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
let VOICE = null, micBlocked = false;
const MALE = /\b(alvaro|álvaro|jorge|pablo|ra[uú]l|dar[ií]o|gonzalo|tom[aá]s|jos[eé]|arnau|gerardo|liberto|cecilio|andr[eé]s|juan|diego|carlos|enrique|luciano|mateo|alonso|sa[uú]l|teo|rodrigo|emilio|nicol[aá]s|lorenzo|alex|federico|mauricio|sergio|male|hombre)\b/i;
const FEMALE = /\b(helena|laura|elvira|paloma|sabina|dalia|m[oó]nica|paulina|elena|luc[ií]a|conchita|pen[eé]lope|lupe|ximena|abril|irene|estrella|larissa|marisol|l[ií]a|ver[oó]nica|camila|valentina|catalina|beatriz|carlota|female|mujer)\b|google espa/i;
const isMale = v => MALE.test(v.name) && !FEMALE.test(v.name);
const vid = v => v.voiceURI || v.name;
function vQuality(v){ const t = (v.voiceURI || '') + ' ' + v.name;
  if (/premium/i.test(t)) return 3; if (/enhanced|mejorad|superior|natural|neural|online/i.test(t)) return 2; return 0; }
const NOVELTY = /\b(eddy|flo|grandma|grandpa|reed|rocko|sandy|shelley|albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|fred|junior|kathy|ralph|abuel[oa])\b/i;
const REGION = { ES:'Spain', MX:'Mexico', US:'US', AR:'Argentina', CO:'Colombia', CL:'Chile', '419':'Latin America' };
function vLabel(v){
  const nm = v.name.replace(/^Microsoft /,'').replace(/ - Spanish.*$/,'').replace(/\s*\((enhanced|premium|mejorad[ao]|superior)\)/i,'').replace(/ Online \(Natural\)/,'');
  const rg = REGION[(v.lang.split(/[-_]/)[1] || '').toUpperCase()] || v.lang;
  const q = vQuality(v);
  return nm + ' · ' + rg + (q === 3 ? ' · Premium' : q === 2 ? (/natural|neural|online/i.test(v.name) ? ' · Natural' : ' · Enhanced') : '') + (isMale(v) ? ' · male' : '');
}
function esVoices(){
  if (!TTS) return [];
  const best = {};
  speechSynthesis.getVoices().filter(v => /^es/i.test(v.lang) && !NOVELTY.test(v.name)).forEach(v => {
    const k = v.name.replace(/\s*\(.*\)/,'').replace(/ Online.*$/,'').toLowerCase() + '|' + v.lang.toLowerCase();
    if (!best[k] || vQuality(v) > vQuality(best[k])) best[k] = v;
  });
  return Object.values(best).sort((a,b) => voiceScore(b) - voiceScore(a));
}
function voiceScore(v){
  let s = 0;
  if (isMale(v)) s += 10; else if (FEMALE.test(v.name)) s -= 2;
  s += vQuality(v) * 4;
  if (/^es[-_]ES/i.test(v.lang)) s += 2; else if (/^es[-_](MX|US|419)/i.test(v.lang)) s += 1;
  return s;
}
function pickVoice(){
  if (!TTS) return; const vs = speechSynthesis.getVoices();
  const es = vs.filter(v => /^es/i.test(v.lang));
  const want = S.settings.voice;
  const chosen = want && (es.find(v => vid(v) === want) || es.filter(v => v.name === want).sort((a,b) => vQuality(b) - vQuality(a))[0]);
  VOICE = chosen || esVoices()[0] || null;
}
function say(text, slow){
  if (!TTS) return;
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text);
    u.lang = VOICE ? VOICE.lang : 'es-ES'; if (VOICE) u.voice = VOICE; u.rate = S.settings.rate * (slow ? 0.65 : 1); u.pitch = 1; u.volume = 1;
    speechSynthesis.speak(u); } catch(e){}
}
let actx = null;
function sfx(ok){
  if (!S.settings.sfx) return;
  try { actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const notes = ok ? [660, 990] : [220, 180];
    notes.forEach((f, i) => { const o = actx.createOscillator(), g = actx.createGain(); o.type = ok ? 'sine' : 'triangle';
      o.frequency.value = f; const t = actx.currentTime + i*0.09; g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.12, t+0.02); g.gain.exponentialRampToValueAtTime(0.0001, t+0.18);
      o.connect(g).connect(actx.destination); o.start(t); o.stop(t+0.2); });
  } catch(e){}
}

/* ---------- illustrations ----------
   ART: simple 24×24 line illustrations drawn for Ruta (stroke = currentColor).
   Words get a picture through WORD_ART; a word without one is simply never used
   in picture questions. To use a real photo instead, add its URL to IMAGES in
   course.js — the picture card shows the photo and falls back to the drawing if
   the photo can't load. */
const ART = {
  glass:'<path d="M6 3h12l-1.6 17.2a1 1 0 0 1-1 .8H8.6a1 1 0 0 1-1-.8z"/><path d="M6.6 9h10.8" /><path class="fl" d="M6.6 9h10.8l-1 11.2H7.6z"/>',
  bread:'<path class="fl" d="M4 12a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v7H4z"/><path d="M4 12a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v7H4z"/><path d="M9 9.5l-1 2M13 9.5l-1 2M17 10l-1 2"/>',
  milk:'<path class="fl" d="M8 2h8v4l2 3v13H6V9l2-3z"/><path d="M8 2h8v4l2 3v13H6V9l2-3z"/><path d="M6 9h12M8 6h8"/><path d="M10 14h4"/>',
  coffee:'<path class="fl" d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16M8 3c-1 1 1 2 0 3M12 3c-1 1 1 2 0 3M3 22h14"/>',
  apple:'<path class="fl" d="M12 8c-3-2-8-1-8 5 0 4.5 3 8.5 5 8.5 1.2 0 2-.8 3-.8s1.8.8 3 .8c2 0 5-4 5-8.5 0-6-5-7-8-5z"/><path d="M12 8c-3-2-8-1-8 5 0 4.5 3 8.5 5 8.5 1.2 0 2-.8 3-.8s1.8.8 3 .8c2 0 5-4 5-8.5 0-6-5-7-8-5z"/><path d="M12 8c0-2 .8-4 3-5.5M12 7.5c-1.5-2-3.5-2.5-5-2"/>',
  cheese:'<path class="fl" d="M2 17L14 6l8 5v6z"/><path d="M2 17L14 6l8 5v6zM2 17h20v4H2z"/><circle cx="12" cy="14" r="1.4"/><circle cx="17" cy="15" r="1"/>',
  meat:'<path class="fl" d="M14 4a6 6 0 0 1 6 7c-.5 3-4 4-6 4l-4 4-3-1 1-3 1-4c0-4 2-7 5-7z"/><path d="M14 4a6 6 0 0 1 6 7c-.5 3-4 4-6 4l-4 4-3-1 1-3 1-4c0-4 2-7 5-7z"/><path d="M7 18l-3 2 1-3M4 20a1.5 1.5 0 1 1-1-2.6"/>',
  fish:'<path class="fl" d="M2.5 12c3-5 10-6.5 14.5-1.5L21 7.5v9l-4-3c-4.5 5-11.5 3.5-14.5-1.5z"/><path d="M2.5 12c3-5 10-6.5 14.5-1.5L21 7.5v9l-4-3c-4.5 5-11.5 3.5-14.5-1.5z"/><circle cx="8" cy="11" r=".9"/><path d="M12 9c1 2 1 4 0 6"/>',
  rice:'<path class="fl" d="M3 12h18a9 9 0 0 1-18 0z"/><path d="M3 12h18a9 9 0 0 1-18 0zM8 21h8"/><path d="M7 9.5l1-2M11 9V6.5M15 9.5l-.8-2.2M18 10l.8-1.6"/>',
  beer:'<path class="fl" d="M5 7h10v14H5z"/><path d="M5 7h10v14H5zM15 10h2.5a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H15"/><path d="M5 7a2.5 2.5 0 0 1 3-3 3.5 3.5 0 0 1 6 1 2 2 0 0 1 1 2M8.5 11v7M11.5 11v7"/>',
  house:'<path class="fl" d="M5 10v11h14V10l-7-6z"/><path d="M3 11.5L12 4l9 7.5M5 10v11h14V10"/><path d="M10 21v-6h4v6"/>',
  city:'<path class="fl" d="M9 21V4h8v17z"/><path d="M3 21V10h6v11M9 21V4h8v17M17 21v-9h4v9M2 21h20"/><path d="M12 8h2M12 12h2M12 16h2M5.5 14h1M5.5 17h1"/>',
  road:'<path class="fl" d="M8 3h8l4 18H4z"/><path d="M8 3L4 21M16 3l4 18M12 4v2.5M12 10v3M12 17v3"/>',
  bank:'<path class="fl" d="M3 10l9-6 9 6z"/><path d="M3 10l9-6 9 6zM5 10v8M9.7 10v8M14.3 10v8M19 10v8M3 21h18M4 18h16"/>',
  beach:'<path class="fl" d="M3 10a9 7 0 0 1 18 0z"/><path d="M3 10a9 7 0 0 1 18 0zM12 10v10M2 21c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0"/>',
  school:'<path class="fl" d="M3 9l9-5 9 5-9 5z"/><path d="M3 9l9-5 9 5-9 5zM7 11.5V16c3 2.2 7 2.2 10 0v-4.5M21 9v6"/>',
  toilet:'<path class="fl" d="M5 11h14a7 6 0 0 1-14 0z"/><path d="M7 3h4v8H7zM5 11h14a7 6 0 0 1-14 0zM9 17l-.5 4h7l-.5-4"/>',
  man:'<circle class="fl" cx="12" cy="6" r="3.2"/><circle cx="12" cy="6" r="3.2"/><path class="fl" d="M6 21v-3a6 6 0 0 1 12 0v3z"/><path d="M6 21v-3a6 6 0 0 1 12 0v3"/><path d="M12 12.5v3"/>',
  woman:'<circle class="fl" cx="12" cy="6" r="3.2"/><circle cx="12" cy="6" r="3.2"/><path d="M8.6 5.5c-.8 2 0 4 .5 5M15.4 5.5c.8 2 0 4-.5 5"/><path class="fl" d="M12 11l-6 10h12z"/><path d="M12 11l-6 10h12z"/>',
  boy:'<circle class="fl" cx="12" cy="9" r="2.8"/><circle cx="12" cy="9" r="2.8"/><path class="fl" d="M8 21v-2.5a4 4 0 0 1 8 0V21z"/><path d="M8 21v-2.5a4 4 0 0 1 8 0V21M9.5 7c1-1.8 4-1.8 5 0"/>',
  girl:'<circle class="fl" cx="12" cy="9" r="2.8"/><circle cx="12" cy="9" r="2.8"/><path d="M14.5 6.5l2.5-1.5v3zM14.5 6.5L17 8"/><path class="fl" d="M12 13.5L8 21h8z"/><path d="M12 13.5L8 21h8z"/>',
  friends:'<circle class="fl" cx="8" cy="7" r="2.8"/><circle cx="8" cy="7" r="2.8"/><circle class="fl" cx="16.5" cy="8" r="2.4"/><circle cx="16.5" cy="8" r="2.4"/><path d="M2.5 20v-2a5.5 5.5 0 0 1 11 0v2M13.5 15a4.5 4.5 0 0 1 8 2.8V20"/>',
  family:'<circle cx="7" cy="6" r="2.4"/><circle cx="17" cy="6" r="2.4"/><circle class="fl" cx="12" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><path d="M2.5 20v-4a4.5 4.5 0 0 1 9 0M12.5 16a4.5 4.5 0 0 1 9 0v4M9 21v-1.5a3 3 0 0 1 6 0V21"/>',
  elder:'<circle cx="10" cy="6" r="3"/><path class="fl" d="M5 21v-3.5a5 5 0 0 1 10 0V21z"/><path d="M5 21v-3.5a5 5 0 0 1 10 0V21M18 12v9M18 12a2 2 0 0 1 3 0"/>',
  sun:'<circle class="fl" cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>',
  sunset:'<path class="fl" d="M6 16a6 6 0 0 1 12 0z"/><path d="M6 16a6 6 0 0 1 12 0M2 16h20M5 20h14M12 4v3M4.5 8.5l2 2M19.5 8.5l-2 2"/>',
  moon:'<path class="fl" d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/><path d="M17 3v3M15.5 4.5h3"/>',
  wave:'<path class="fl" d="M7 12V6a1.5 1.5 0 0 1 3 0v4V4a1.5 1.5 0 0 1 3 0v6V5a1.5 1.5 0 0 1 3 0v6-3a1.5 1.5 0 0 1 3 0v6a7 7 0 0 1-7 7c-3 0-4.5-1.5-6.5-4l-2.5-3.5a1.5 1.5 0 0 1 2.4-1.8z"/><path d="M7 12V6a1.5 1.5 0 0 1 3 0v4V4a1.5 1.5 0 0 1 3 0v6V5a1.5 1.5 0 0 1 3 0v6-3a1.5 1.5 0 0 1 3 0v6a7 7 0 0 1-7 7c-3 0-4.5-1.5-6.5-4l-2.5-3.5a1.5 1.5 0 0 1 2.4-1.8z"/>',
  heart:'<path class="fl" d="M12 20s-8-4.6-8-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 8 2.8C20 15.4 12 20 12 20z"/><path d="M12 20s-8-4.6-8-10.2A4.3 4.3 0 0 1 12 7a4.3 4.3 0 0 1 8 2.8C20 15.4 12 20 12 20z"/>',
  yes:'<circle class="fl" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><path d="M7.5 12.5l3 3 6-6.5"/>',
  no:'<circle class="fl" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><path d="M8.5 8.5l7 7M15.5 8.5l-7 7"/>',
  table:'<path class="fl" d="M3 8h18v3H3z"/><path d="M3 8h18v3H3zM5 11v10M19 11v10M5 16h14"/>',
  receipt:'<path class="fl" d="M5 2h14v20l-2.3-1.5L14.3 22 12 20.5 9.7 22l-2.4-1.5L5 22z"/><path d="M5 2h14v20l-2.3-1.5L14.3 22 12 20.5 9.7 22l-2.4-1.5L5 22zM9 7h6M9 11h6M9 15h3"/>',
  menu:'<path class="fl" d="M5 3h12a2 2 0 0 1 2 2v16H7a2 2 0 0 1-2-2z"/><path d="M5 3h12a2 2 0 0 1 2 2v16H7a2 2 0 0 1-2-2zM9 8h6M9 12h6M9 16h4"/>',
  waiter:'<circle cx="9" cy="5.5" r="2.6"/><path class="fl" d="M4 21v-5a5 5 0 0 1 10 0v5z"/><path d="M4 21v-5a5 5 0 0 1 10 0v5M14 12h8M15 12a3 3 0 0 1 6 0M18 8.5v.5"/>',
  cutlery:'<path d="M7 2v8M4 2v5a3 3 0 0 0 6 0V2M7 10v12"/><path class="fl" d="M17 2c-2 1-3 4-3 8h3v12h1V2z"/><path d="M17 2c-2 1-3 4-3 8h3M18 2v20"/>',
  egg:'<path class="fl" d="M3 14a9 6 0 0 0 18 0z"/><path d="M3 14a9 6 0 0 0 18 0zM2 14h20"/><circle class="fl" cx="12" cy="12" r="3.5"/><circle cx="12" cy="12" r="3.5"/>',
  coins:'<ellipse class="fl" cx="9" cy="7" rx="6" ry="3"/><ellipse cx="9" cy="7" rx="6" ry="3"/><path d="M3 7v4c0 1.7 2.7 3 6 3s6-1.3 6-3V7M3 11v4c0 1.7 2.7 3 6 3 1.2 0 2.3-.2 3.2-.5"/><circle cx="17" cy="16" r="4.5"/>',
  tag:'<path class="fl" d="M3 3h8l10 10-8 8L3 11z"/><path d="M3 3h8l10 10-8 8L3 11z"/><circle cx="7.5" cy="7.5" r="1.5"/>',
  sparkle:'<path class="fl" d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/><path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
  hourglass:'<path class="fl" d="M7 3h10c0 5-5 6-5 9 0-3-5-4-5-9z"/><path d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9"/>',
  big:'<rect class="fl" x="3" y="3" width="18" height="18" rx="3"/><rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 16l8-8M12 8h4v4"/>',
  small:'<rect class="fl" x="9" y="9" width="6" height="6" rx="1.5"/><rect x="9" y="9" width="6" height="6" rx="1.5"/><path d="M3 3l4 4M21 3l-4 4M3 21l4-4M21 21l-4-4"/>',
  happy:'<circle class="fl" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><path d="M8 14a4.5 4.5 0 0 0 8 0M9 9.5v.5M15 9.5v.5"/>',
  sad:'<circle class="fl" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><path d="M8 16.5a4.5 4.5 0 0 1 8 0M9 9.5v.5M15 9.5v.5"/>',
  sleepy:'<circle class="fl" cx="11" cy="13" r="8"/><circle cx="11" cy="13" r="8"/><path d="M7.5 12h2M12.5 12h2M9 16.5h4M16 3h4l-4 4h4"/>',
  pretty:'<path class="fl" d="M12 21c-5-3-8-6-8-10a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 4-3 7-8 10z"/><path d="M12 21c-5-3-8-6-8-10a4 4 0 0 1 8-1 4 4 0 0 1 8 1c0 4-3 7-8 10zM16 4l1-2M19 6l2-1"/>',
  plane:'<path class="fl" d="M2 13l8-1 5-8h3l-2 8 5 .5 1.5-2.5H23l-1 4 1 4h-1.5L20 15.5 15 16l2 8h-3l-5-8-7-1z"/><path d="M2 13l8-1 5-8h2.5l-2 8 5 .5 1.5-2.5h1.5l-1 4 1 4H21l-1.5-2.5-5 .5 2 8H14l-5-8-7-1z"/>',
  ticket:'<path class="fl" d="M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4z"/><path d="M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4zM15 7v10" stroke-dasharray="2 2"/>',
  train:'<rect class="fl" x="5" y="3" width="14" height="14" rx="3"/><rect x="5" y="3" width="14" height="14" rx="3"/><path d="M5 10h14M8 21l2-4M16 21l-2-4"/><circle cx="9" cy="13.5" r=".9"/><circle cx="15" cy="13.5" r=".9"/>',
  bed:'<path class="fl" d="M3 12h18v6H3z"/><path d="M3 6v15M3 12h18v6M21 18v3M3 18h18"/><rect x="5" y="9" width="5" height="3" rx="1"/>',
  door:'<path class="fl" d="M6 3h12v18H6z"/><path d="M4 21h16M6 21V3h12v18"/><circle cx="15" cy="12" r="1"/>',
  suitcase:'<rect class="fl" x="3" y="7" width="18" height="13" rx="2"/><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V4h6v3M8 7v13M16 7v13"/>',
  key:'<circle class="fl" cx="7.5" cy="14.5" r="4.5"/><circle cx="7.5" cy="14.5" r="4.5"/><path d="M10.7 11.3L20 2M16 6l2.5 2.5M18.5 3.5L21 6"/>',
  right:'<path class="fl" d="M3 9h11V4l7 8-7 8v-5H3z"/><path d="M3 9h11V4l7 8-7 8v-5H3z"/>',
  left:'<path class="fl" d="M21 9H10V4l-7 8 7 8v-5h11z"/><path d="M21 9H10V4l-7 8 7 8v-5h11z"/>',
  up:'<path class="fl" d="M9 21V10H4l8-7 8 7h-5v11z"/><path d="M9 21V10H4l8-7 8 7h-5v11z"/>',
  ball:'<circle class="fl" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><path d="M12 7.5l3.5 2.5-1.3 4h-4.4L8.5 10zM12 3v4.5M15.5 10l5-1.5M14.2 14l3 4M9.8 14l-3 4M8.5 10L3.5 8.5"/>',
  music:'<path d="M9 18V5l11-2v13"/><circle class="fl" cx="6.5" cy="18" r="2.8"/><circle cx="6.5" cy="18" r="2.8"/><circle class="fl" cx="17.5" cy="16" r="2.8"/><circle cx="17.5" cy="16" r="2.8"/>',
  books:'<path class="fl" d="M2 5c3-1 7-1 10 1 3-2 7-2 10-1v14c-3-1-7-1-10 1-3-2-7-2-10-1z"/><path d="M2 5c3-1 7-1 10 1 3-2 7-2 10-1v14c-3-1-7-1-10 1-3-2-7-2-10-1zM12 6v14"/>',
  dance:'<circle cx="13" cy="4" r="2"/><path d="M13 6.5l-2 6 3 3v5.5M11 12.5l-4 2M13 8l4 3 3-2M11 12.5l-3 7.5"/>',
  swim:'<circle cx="17" cy="6" r="2"/><path d="M4 12l5-4 4 3 3-2M2 17c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0"/><path d="M2 21c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0"/>',
  speech:'<path class="fl" d="M4 4h16v11H9l-5 4z"/><path d="M4 4h16v11H9l-5 4zM8 8.5h8M8 11.5h5"/>',
  briefcase:'<rect class="fl" x="3" y="7" width="18" height="13" rx="2"/><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V4h6v3M3 13h18"/>',
  headphones:'<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect class="fl" x="3" y="14" width="5" height="7" rx="2"/><rect x="3" y="14" width="5" height="7" rx="2"/><rect class="fl" x="16" y="14" width="5" height="7" rx="2"/><rect x="16" y="14" width="5" height="7" rx="2"/>',
  pot:'<path class="fl" d="M4 10h16v7a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z"/><path d="M4 10h16v7a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3zM2 10h20M9 4c-1 1 1 2 0 3M13 4c-1 1 1 2 0 3"/>',
  feet:'<path class="fl" d="M7 3c2 0 3 2.5 3 5.5S9 13 7 13s-3-1.5-3-4.5S5 3 7 3z"/><path d="M7 3c2 0 3 2.5 3 5.5S9 13 7 13s-3-1.5-3-4.5S5 3 7 3zM5 15.5h4M17 8c2 0 3 2.5 3 5.5S19 18 17 18s-3-1.5-3-4.5S15 8 17 8zM15 20.5h4"/>',
  pencil:'<path class="fl" d="M15 4l5 5-11 11H4v-5z"/><path d="M15 4l5 5-11 11H4v-5zM13 6l5 5"/>',
  dooropen:'<path d="M4 21h16M6 21V3h8"/><path class="fl" d="M14 3l5 2v16l-5-1z"/><path d="M14 3l5 2v16l-5-1zM14 3v17"/>',
  lightbulb:'<path class="fl" d="M12 3a6 6 0 0 1 4 10.5c-1 1-1.5 2-1.5 3.5h-5c0-1.5-.5-2.5-1.5-3.5A6 6 0 0 1 12 3z"/><path d="M12 3a6 6 0 0 1 4 10.5c-1 1-1.5 2-1.5 3.5h-5c0-1.5-.5-2.5-1.5-3.5A6 6 0 0 1 12 3zM9.5 20h5M10.5 22.5h3"/>',
  phone:'<rect class="fl" x="6" y="2" width="12" height="20" rx="3"/><rect x="6" y="2" width="12" height="20" rx="3"/><path d="M11 18h2"/>',
  bag:'<path class="fl" d="M5 8h14l-1 13H6z"/><path d="M5 8h14l-1 13H6zM9 8V6a3 3 0 0 1 6 0v2"/>',
  eye:'<path class="fl" d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  globe:'<circle class="fl" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/>',
  clock:'<circle class="fl" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  clockback:'<path d="M3.5 9A9 9 0 1 1 3 12M3 4v5h5"/><path d="M12 7v5l3 2"/>',
  calendar:'<rect class="fl" x="3" y="5" width="18" height="16" rx="2"/><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  hungry:'<circle class="fl" cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="9"/><path d="M8 15c2 2 6 2 8 0M9 9.5v.5M15 9.5v.5M16.5 14.5c.5 1 .5 2-.5 2.5"/>',
  thirsty:'<path class="fl" d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/><path d="M9.5 15a2.5 2.5 0 0 0 2.5 2.5"/>',
  gift:'<rect class="fl" x="3" y="9" width="18" height="12" rx="1.5"/><rect x="3" y="9" width="18" height="12" rx="1.5"/><path d="M12 9v12M3 13h18M12 9c-2-4-6-4-6-1.5S10 9 12 9zM12 9c2-4 6-4 6-1.5S14 9 12 9z"/>',
  palette:'<path class="fl" d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.5-4-8-9-8z"/><path d="M12 3a9 9 0 1 0 0 18c1.5 0 2-1 2-2s-1-1.5-1-2.5 1-1.5 2-1.5h2a4 4 0 0 0 4-4c0-4.5-4-8-9-8z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>',
  rocket:'<path class="fl" d="M12 2c4 2 6 6 6 11l-2.5 3h-7L6 13c0-5 2-9 6-11z"/><path d="M12 2c4 2 6 6 6 11l-2.5 3h-7L6 13c0-5 2-9 6-11zM9 19l-1 3M15 19l1 3M12 18v4"/><circle cx="12" cy="9" r="2"/>',
  pin:'<path class="fl" d="M12 22s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/><path d="M12 22s-7-6.5-7-12a7 7 0 0 1 14 0c0 5.5-7 12-7 12z"/><circle cx="12" cy="10" r="2.5"/>'
};
/* Spanish word (as written in course.js) → illustration. Numbers and weekdays are drawn as text. */
const WORD_ART = {
  'hola':'wave','buenos días':'sun','buenas tardes':'sunset','buenas noches':'moon','gracias':'heart','sí':'yes','no':'no',
  'el hombre':'man','la mujer':'woman','el niño':'boy','la niña':'girl','el amigo':'friends',
  'el agua':'glass','el pan':'bread','la leche':'milk','el café':'coffee','la manzana':'apple','el queso':'cheese','la carne':'meat',
  'el pescado':'fish','el arroz':'rice','la cerveza':'beer',
  'la madre':'woman','el padre':'man','el hermano':'boy','la hermana':'girl','los padres':'family','el abuelo':'elder','la abuela':'elder',
  'hablar':'speech','trabajar':'briefcase','estudiar':'books','escuchar':'headphones','cocinar':'pot','caminar':'feet',
  'la casa':'house','la ciudad':'city','la calle':'road','el banco':'bank','la playa':'beach','la escuela':'school','el baño':'toilet',
  'la semana':'calendar','¿qué hora es?':'clock','ayer':'clockback',
  'comer':'cutlery','beber':'glass','leer':'books','escribir':'pencil','abrir':'dooropen','vivir':'house',
  'tengo hambre':'hungry','tengo sed':'thirsty',
  'grande':'big','pequeño':'small','bonito':'pretty','nuevo':'sparkle','viejo':'hourglass','caro':'coins','barato':'tag','feliz':'happy','cansado':'sleepy','malo':'sad',
  'la mesa':'table','la cuenta':'receipt','el menú':'menu','el camarero':'waiter','la comida':'cutlery','la cena':'moon','el desayuno':'egg','la propina':'coins',
  'viajar':'plane','comprar':'bag','llamar':'phone','ver':'eye','salir':'dooropen',
  'el fútbol':'ball','la música':'music','los libros':'books','bailar':'dance','nadar':'swim',
  'el aeropuerto':'plane','el billete':'ticket','el tren':'train','el hotel':'bed','la habitación':'door','la maleta':'suitcase','la llave':'key',
  'a la derecha':'right','a la izquierda':'left','todo recto':'up'
};
const NUM_ART = { uno:'1', dos:'2', tres:'3', cuatro:'4', cinco:'5', seis:'6', siete:'7', ocho:'8', nueve:'9', diez:'10', once:'11', doce:'12', veinte:'20', cien:'100' };
const DAY_ART = { 'el lunes':'L', 'el martes':'M', 'el miércoles':'X', 'el jueves':'J', 'el viernes':'V', 'el sábado':'S', 'el domingo':'D' };
const UNIT_ART = { saludos:'wave', personas:'man', numeros:'#', comida:'apple', familia:'family', 'verbos-ar':'speech', lugares:'pin', tiempo:'clock',
  'verbos-er-ir':'books', 'tener-querer':'gift', describir:'palette', restaurante:'cutlery', futuro:'rocket', pasado:'clockback', gustos:'heart', viaje:'plane' };
const BLOB_HUES = ['c-learn','c-remember','c-test','c-practical','c-think','c-expression'];
const BLOB_SHAPES = ['b1','b2','b3','b4'];
function hashStr(s){ let x = 0; for (const c of s) x = (x * 31 + c.charCodeAt(0)) >>> 0; return x; }
/* key used to make sure two choices never share a picture */
function artKey(es){ return WORD_ART[es] || (NUM_ART[es] && 'n' + NUM_ART[es]) || (DAY_ART[es] && 'd' + DAY_ART[es]) || null; }
const hasArt = it => it.kind === 'w' && (artKey(it.es[0]) || (typeof IMAGES !== 'undefined' && IMAGES[it.es[0]]));
function artSvg(id){
  if (id === '#') return '<svg viewBox="0 0 24 24" aria-hidden="true"><text x="12" y="16.5" text-anchor="middle" class="art-txt" font-size="11">123</text></svg>';
  return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' + (ART[id] || ART.sparkle) + '</svg>';
}
/* A picture on layered blobs. size: 'sm' | 'md' | 'lg' */
function blobArt(es, size, seedOverride){
  const seed = hashStr(seedOverride || es);
  const hue = BLOB_HUES[seed % BLOB_HUES.length], shape = BLOB_SHAPES[(seed >>> 3) % BLOB_SHAPES.length];
  const wrap = h('span', { class:'blob-art ' + (size || 'md') + ' ' + hue + ' ' + shape, 'aria-hidden':'true' },
    h('span', { class:'blob back' }), h('span', { class:'blob front' }), h('span', { class:'blob shine' }));
  const url = typeof IMAGES !== 'undefined' && IMAGES[es];
  const drawn = () => { const n = NUM_ART[es], d = DAY_ART[es];
    if (n) return h('span', { class:'art art-num' }, n);
    if (d) return h('span', { class:'art art-day', html: artSvg('calendar') }, h('b', {}, d));
    return h('span', { class:'art', html: artSvg(WORD_ART[es] || UNIT_ART[es] || es) }); };
  if (url){
    const img = h('img', { class:'art art-photo', src:url, alt:'', loading:'lazy', decoding:'async' });
    img.addEventListener('error', () => img.replaceWith(drawn()));
    wrap.append(img);
  } else wrap.append(drawn());
  return wrap;
}

/* ---------- Sol, the mascot: layered geometric SVG ----------
   Groups you can animate with CSS: .sol-feet, .sol-foot, .sol-body, .sol-rays,
   .sol-eyes, .sol-eye, .sol-pupil, .sol-mouth, .sol-arm. Every group scales and
   rotates around its own centre or base (see "Sol" in the stylesheet). Add a mood
   class to the <svg>: .is-idle, .is-bounce, .is-wiggle, .is-cheer, .is-spin. */
const SOL_SVG = '<svg class="sol" viewBox="0 0 120 140" role="img" aria-label="Sol, the Ruta mascot">' +
  '<ellipse class="sol-shadow" cx="60" cy="134" rx="28" ry="4.5"/>' +
  '<g class="sol-feet"><ellipse class="sol-foot l" cx="47" cy="124" rx="11" ry="7"/><ellipse class="sol-foot r" cx="73" cy="124" rx="11" ry="7"/></g>' +
  '<g class="sol-body">' +
    '<g class="sol-rays">' + [0,45,90,135,180,225,270,315].map(a => '<rect class="sol-ray" x="55" y="6" width="10" height="16" rx="5" transform="rotate(' + a + ' 60 62)"/>').join('') + '</g>' +
    '<g class="sol-arm l"><rect x="10" y="66" width="22" height="10" rx="5"/></g>' +
    '<g class="sol-arm r"><rect x="88" y="66" width="22" height="10" rx="5"/></g>' +
    '<circle class="sol-core" cx="60" cy="62" r="38"/>' +
    '<circle class="sol-core-shade" cx="60" cy="62" r="38"/>' +
    '<g class="sol-cheeks"><ellipse cx="38" cy="74" rx="7" ry="4.5"/><ellipse cx="82" cy="74" rx="7" ry="4.5"/></g>' +
    '<g class="sol-eyes">' +
      '<g class="sol-eye l"><ellipse class="sol-white" cx="46" cy="56" rx="9" ry="10.5"/><circle class="sol-pupil" cx="47.5" cy="58" r="5"/><circle class="sol-glint" cx="49.5" cy="55.5" r="1.8"/></g>' +
      '<g class="sol-eye r"><ellipse class="sol-white" cx="74" cy="56" rx="9" ry="10.5"/><circle class="sol-pupil" cx="75.5" cy="58" r="5"/><circle class="sol-glint" cx="77.5" cy="55.5" r="1.8"/></g>' +
    '</g>' +
    '<path class="sol-mouth" d="M48 76 Q60 90 72 76 Q60 82 48 76 Z"/>' +
  '</g></svg>';
function solEl(mood){ const w = h('span', { class:'sol-wrap', html:SOL_SVG }); if (mood) w.firstChild.classList.add('is-' + mood); return w; }
function solPlay(svg, mood, ms){
  if (!svg) return;
  svg.classList.remove('is-bounce','is-wiggle','is-cheer','is-spin'); void svg.getBoundingClientRect();
  svg.classList.add('is-' + mood);
  clearTimeout(svg._t); svg._t = setTimeout(() => svg.classList.remove('is-' + mood), ms || 900);
}

/* ---------- motion ----------
   Uses Motion (motion.dev, loaded from the CDN as window.Motion) for springs.
   If the library hasn't loaded (offline, blocked), the same calls fall back to the
   browser's built-in Web Animations API, so nothing breaks.
   Keyframes use plain CSS properties (transform, opacity, width) so both engines understand them. */
const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const MotionLib = () => (typeof window !== 'undefined' && window.Motion && typeof window.Motion.animate === 'function') ? window.Motion : null;
const SPRING = {
  bar:    { stiffness:170, damping:17, mass:1 },
  pop:    { stiffness:520, damping:14, mass:0.7 },
  mascot: { stiffness:300, damping:13, mass:0.9 },
  enter:  { stiffness:340, damping:30, mass:1 }
};
/* anim(el, { prop:[from, to] | [k1, k2, …] }, { spring | duration, ease, delay, keep }) → Promise */
function anim(el, kf, o){
  o = o || {};
  if (!el) return Promise.resolve();
  const last = {}; for (const k in kf) last[k] = Array.isArray(kf[k]) ? kf[k][kf[k].length - 1] : kf[k];
  const settle = () => { if (o.keep) for (const k in last) el.style[k] = last[k]; else for (const k in last) el.style[k] = ''; };
  if (reducedMotion()){ if (o.keep) settle(); return Promise.resolve(); }
  const M = MotionLib();
  if (M){
    try {
      const opts = o.spring ? Object.assign({ type:'spring', delay:o.delay || 0 }, o.spring)
                            : { duration:o.duration || 0.3, ease:o.ease || 'easeOut', delay:o.delay || 0 };
      const a = M.animate(el, kf, opts);
      return new Promise(res => { const done = () => { settle(); res(); };
        if (a && typeof a.then === 'function') a.then(done, done); else setTimeout(done, ((o.duration || 0.6) + (o.delay || 0)) * 1000); });
    } catch(e){ /* fall through to Web Animations */ }
  }
  if (!el.animate){ settle(); return Promise.resolve(); }
  const n = Math.max(...Object.values(kf).map(v => Array.isArray(v) ? v.length : 1));
  const frames = Array.from({ length:n }, (_, i) => { const f = {}; for (const k in kf){ const v = kf[k];
    f[k] = Array.isArray(v) ? v[Math.min(i, v.length - 1)] : v; } return f; });
  if (n === 1) frames.unshift({});
  const a = el.animate(frames, { duration: o.spring ? 620 : (o.duration || 0.3) * 1000, delay:(o.delay || 0) * 1000, fill:'forwards',
    easing: o.spring ? 'cubic-bezier(.3,1.45,.55,1)' : (o.ease === 'linear' ? 'linear' : 'cubic-bezier(.2,.7,.3,1)') });
  return a.finished.then(() => { settle(); a.cancel(); }, () => settle());
}

/* 1. lesson progress bar: springs forward on each correct answer */
function setProgress(animate){
  const fill = $('#bar-fill'); if (!fill || !Q) return;
  const pct = Math.min(100, Math.round(Q.prog / Math.max(1, Q.goal) * 100));
  const from = fill.style.width || '0%';
  fill.style.width = pct + '%';
  if (animate && from !== pct + '%'){
    anim(fill, { width:[from, pct + '%'] }, { spring:SPRING.bar, keep:true });
    anim($('#bar-shine'), { opacity:[0, 0.9, 0], transform:['translateX(-30%)', 'translateX(10%)', 'translateX(60%)'] }, { duration:0.7, ease:'linear' });
  }
}

/* 2. mascot: Sol pops up from the bottom-left corner on correct answers */
const MASCOT_SVG = '<svg viewBox="0 0 120 120" aria-hidden="true">' +
  '<g class="m-rays">' + [0,45,90,135,180,225,270,315].map(a => '<path d="M60 6 L67 22 L53 22 Z" transform="rotate(' + a + ' 60 64)" fill="#FF9F3D"/>').join('') + '</g>' +
  '<circle cx="60" cy="64" r="36" fill="#FFB703" stroke="#D99700" stroke-width="4"/>' +
  '<ellipse cx="48" cy="60" rx="5" ry="7" fill="#2B2B2B"/><ellipse cx="72" cy="60" rx="5" ry="7" fill="#2B2B2B"/>' +
  '<circle cx="50" cy="57" r="2" fill="#FFF"/><circle cx="74" cy="57" r="2" fill="#FFF"/>' +
  '<ellipse cx="40" cy="73" rx="6" ry="4" fill="#FF8CC4" opacity=".8"/><ellipse cx="80" cy="73" rx="6" ry="4" fill="#FF8CC4" opacity=".8"/>' +
  '<path d="M47 74 Q60 88 73 74 Q60 80 47 74 Z" fill="#7A2E00"/>' +
  '<path class="m-arm" d="M92 70 q14 -6 16 -22" fill="none" stroke="#D99700" stroke-width="7" stroke-linecap="round"/>' +
  '</svg>';
const MASCOT_LINES = ['¡Muy bien!','¡Eso es!','¡Olé!','¡Genial!','¡Bravo!','¡Así se hace!','¡Sigue así!'];
let mascotTimer = null, mascotBusy = false;
function mascotPop(hot){
  const m = $('#mascot'); if (!m) return;
  clearTimeout(mascotTimer);
  const bar = $('#checkbar');
  m.style.bottom = (bar ? bar.offsetHeight : 90) - 6 + 'px';
  $('#mascot-say').textContent = hot ? '¡' + Q.combo + ' seguidas!' : pick(MASCOT_LINES);
  m.hidden = false;
  const body = m.querySelector('.m-body'), bubble = m.querySelector('.m-bubble');
  if (!mascotBusy){
    mascotBusy = true;
    anim(body, { transform:['translateY(110%) rotate(-12deg)', 'translateY(0%) rotate(0deg)'] }, { spring:SPRING.mascot, keep:true }).then(() => { mascotBusy = false; });
  } else anim(body, { transform:['translateY(0%) scale(1)', 'translateY(-8%) scale(1.06)', 'translateY(0%) scale(1)'] }, { duration:0.35 });
  anim(bubble, { opacity:[0, 1], transform:['scale(.6) translateY(10px)', 'scale(1) translateY(0px)'] }, { spring:SPRING.pop, delay:0.12, keep:true });
  setTimeout(() => solPlay(m.querySelector('.sol'), hot ? 'spin' : 'cheer', 900), 180);
  mascotTimer = setTimeout(mascotHide, 1700);
}
function mascotHide(){
  const m = $('#mascot'); if (!m || m.hidden) return;
  clearTimeout(mascotTimer);
  anim(m.querySelector('.m-bubble'), { opacity:[1, 0] }, { duration:0.15, keep:true });
  anim(m.querySelector('.m-body'), { transform:['translateY(0%) rotate(0deg)', 'translateY(115%) rotate(8deg)'] }, { duration:0.3, ease:'easeIn', keep:true })
    .then(() => { if (!mascotBusy) m.hidden = true; });
}

/* 3. answer feedback: pop + glow on correct, shake on wrong */
const CHECK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const CROSS_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/></svg>';
function feedbackFx(ok){
  const st = $('#stage');
  const badge = $('#bar-msg .v-icon');
  if (ok){
    anim(badge, { transform:['scale(0)', 'scale(1)'], opacity:[0, 1] }, { spring:SPRING.pop, keep:true });
    const target = st.querySelector('.opt.right, .answer.right, .blank.right') || st.querySelector('.line');
    if (target){
      if (target.classList.contains('opt')){
        const c = h('span', { class:'check-badge', html:CHECK_SVG }); target.append(c);
        anim(c, { transform:['scale(0)', 'scale(1)'], opacity:[0, 1] }, { spring:SPRING.pop, keep:true });
      }
      if (target.tagName === 'INPUT'){
        anim(target, { boxShadow:['0 0 0 0px rgba(76,197,28,0.6)', '0 0 0 10px rgba(76,197,28,0)'] }, { duration:0.7 });
        return;
      }
      const glow = h('span', { class:'glow-ring', 'aria-hidden':'true' });
      if (getComputedStyle(target).position === 'static') target.style.position = 'relative';
      target.append(glow);
      anim(glow, { opacity:[0, 1, 0], transform:['scale(.97)', 'scale(1.01)', 'scale(1.05)'] }, { duration:0.8 }).then(() => glow.remove());
      anim(target, { transform:['scale(1)', 'scale(1.035)', 'scale(1)'] }, { duration:0.32 });
    }
  } else {
    anim(badge, { transform:['scale(.4) rotate(-20deg)', 'scale(1) rotate(0deg)'], opacity:[0, 1] }, { spring:SPRING.pop, keep:true });
    const target = st.querySelector('.opt.wrong, .answer.wrong, .blank.wrong') || st.querySelector('.line') || st.querySelector('.ex');
    anim(target, { transform:['translateX(0px)', 'translateX(-9px)', 'translateX(8px)', 'translateX(-6px)', 'translateX(5px)', 'translateX(-2px)', 'translateX(0px)'] }, { duration:0.45, ease:'easeOut' });
  }
}

/* 4. screen transitions: slide-and-fade between questions and tabs */
function slideOut(el){ return anim(el, { opacity:[1, 0], transform:['translateX(0px)', 'translateX(-28px)'] }, { duration:0.16, ease:'easeIn', keep:true }); }
function slideIn(el, dx){ return anim(el, { opacity:[0, 1], transform:['translateX(' + (dx == null ? 32 : dx) + 'px)', 'translateX(0px)'] }, { spring:SPRING.enter }); }
function fadeUp(el){ return anim(el, { opacity:[0, 1], transform:['translateY(10px)', 'translateY(0px)'] }, { duration:0.28 }); }

/* ---------- DOM helpers ---------- */
const $ = s => document.querySelector(s);
function h(tag, attrs, ...kids){
  const e = document.createElement(tag);
  for (const k in (attrs || {})){ const v = attrs[k];
    if (k === 'class') e.className = v; else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v); }
  for (const c of kids.flat()){ if (c == null || c === false) continue; e.append(c.nodeType ? c : document.createTextNode(c)); }
  return e;
}
const ICON = {
  play:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 8.5a4.5 4.5 0 0 1 0 7M18.5 6a8 8 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  slow:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/><path d="M16 9.5a3 3 0 0 1 0 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  mic:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  close:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
  gear:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  flame:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2c1 4 5 5.5 5 11a5 5 0 0 1-10 0c0-2.5 1.2-4 2.5-5 0 2 1 3 2 3 0-3-1-6 .5-9z" fill="currentColor"/></svg>'
};
function audioBtns(text){
  return h('div', { class:'audio' },
    h('button', { class:'icon-btn big', type:'button', 'aria-label':'Play audio', html:ICON.play, onclick:() => say(text) }),
    h('button', { class:'icon-btn', type:'button', 'aria-label':'Play slowly', html:ICON.slow, onclick:() => say(text, true) }));
}
function toast(msg){ const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.tm); toast.tm = setTimeout(() => t.hidden = true, 2600); }
function show(id){ ['home','lesson','done'].forEach(s => $('#'+s).hidden = s !== id); $('#nav').hidden = id !== 'home'; document.body.classList.toggle('in-lesson', id !== 'home'); window.scrollTo(0,0); }

/* ---------- theme switching ---------- */
const THEME_KEY = 'ruta-theme';
const MOON = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z" fill="currentColor"/></svg>';
const SUNICON = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="currentColor"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
const darkMQ = typeof window !== 'undefined' && window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : null;
/* which theme is actually showing right now */
function effectiveTheme(){ const a = document.documentElement.getAttribute('data-theme'); return a === 'dark' || a === 'light' ? a : (darkMQ && darkMQ.matches ? 'dark' : 'light'); }
/* t = 'system' | 'light' | 'dark' */
function applyTheme(t){
  t = t === 'light' || t === 'dark' ? t : 'system';
  const root = document.documentElement;
  if (t === 'system'){ if (root.hasAttribute('data-ruta-theme')){ root.removeAttribute('data-theme'); root.removeAttribute('data-ruta-theme'); } }
  else { root.setAttribute('data-theme', t); root.setAttribute('data-ruta-theme', ''); }
  try { if (t === 'system') localStorage.removeItem(THEME_KEY); else localStorage.setItem(THEME_KEY, t); } catch(e){}
  syncThemeColor();
}
function setTheme(t){ S.settings.theme = t; save(); applyTheme(t); if (!$('#home').hidden) renderHome(); }
function syncThemeColor(){
  const m = document.querySelector('meta[name="theme-color"]');
  if (m) m.setAttribute('content', getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#FFFFFF');
}
function themeBtn(){
  const dark = effectiveTheme() === 'dark';
  return h('button', { class:'theme-btn', type:'button', 'aria-label': dark ? 'Switch to light mode' : 'Switch to dark mode', title: dark ? 'Light mode' : 'Dark mode',
    html: dark ? SUNICON : MOON, onclick:() => setTheme(dark ? 'light' : 'dark') });
}

/* ---------- home: tabs ---------- */
const MARK = '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="15" fill="currentColor"/><path d="M8 25c3-1 4-5 8-6s6-4 8-12" fill="none" stroke="var(--bg)" stroke-width="3.2" stroke-linecap="round"/><path d="M8 25c3-1 4-5 8-6s6-4 8-12" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="2 2.5" stroke-linecap="round"/><circle cx="24" cy="7.5" r="2.4" fill="var(--bg)"/></svg>';
let TAB = 'learn';
const TABS = [
  ['learn','Learn','<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19c3-1 4-5 8-5s4 3 8 1M4 19V5m16 10V5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="9" r="2.5" fill="currentColor"/></svg>'],
  ['practice','Practise','<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M18 3v4h-4M6 21v-4h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'],
  ['scroll','Scroll','<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3" width="14" height="8" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><rect x="5" y="14" width="14" height="7" rx="2" fill="none" stroke="currentColor" stroke-width="2"/></svg>'],
  ['listen','Listen','<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 15v-3a8 8 0 0 1 16 0v3" fill="none" stroke="currentColor" stroke-width="2"/><rect x="3" y="14" width="5" height="7" rx="2" fill="currentColor"/><rect x="16" y="14" width="5" height="7" rx="2" fill="currentColor"/></svg>'],
  ['me','Me','<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>']
];
function setTab(t){ if (t !== 'listen') stopListen(); TAB = t; renderHome(); window.scrollTo(0,0); fadeUp($('#home')); }
function renderNav(){
  const nav = $('#nav'); nav.innerHTML = '';
  nav.append(h('div', { class:'nav-in' }, TABS.map(([id, label, svg]) =>
    h('button', { class:'nav-b'+(TAB === id ? ' on' : ''), type:'button', 'aria-current': TAB === id ? 'page' : false, onclick:() => setTab(id) },
      h('span', { class:'nav-i', html:svg }), h('span', {}, label)))));
}
function userLevel(){ return Math.floor(Math.sqrt(S.xp / 15)) + 1; }
function levelSpan(){ const L = userLevel(), a = 15*(L-1)*(L-1), b = 15*L*L; return { L, pct: Math.round((S.xp - a) / (b - a) * 100), need: b - S.xp }; }
/* ---------- sticky top bar with status widgets ---------- */
const FLAME_SVG = '<svg viewBox="0 0 24 32" aria-hidden="true"><path class="fl-out" d="M12 1c1.5 6 9 9 9 18a9 9 0 0 1-18 0c0-4.5 2.3-7.5 4.8-9.4 0 3.6 1.8 5.4 3.6 5.4C11.4 9.6 9.6 5 12 1z"/><path class="fl-in" d="M12 15c1.2 3 4.5 4.3 4.5 8.2a4.5 4.5 0 0 1-9 0c0-2 1-3.2 2.2-3.8 0 1.5.9 2.2 1.8 2.2-.3-2.4-.6-4.2.5-6.6z"/></svg>';
const GEM_SVG = '<svg viewBox="0 0 32 28" aria-hidden="true"><path class="g-top" d="M8 1h16l7 8H1z"/><path class="g-left" d="M1 9h10l5 18z"/><path class="g-mid" d="M11 9h10l-5 18z"/><path class="g-right" d="M21 9h10L16 27z"/><path class="g-cap" d="M8 1l3 8h10l3-8z"/><path class="g-glint" d="M10.5 3.5l1.5 4"/></svg>';
function gemsNow(){ if (typeof S.gems !== 'number') S.gems = Math.floor((S.xp || 0) / 4); return S.gems; }
function addGems(n){ gemsNow(); S.gems += n; }
function initialOf(){ const n = (S.settings.name || '').trim(); return n ? n[0].toUpperCase() : ''; }
function avatarEl(){
  const pct = Math.min(100, Math.round(todayXP() / Math.max(1, S.settings.goal) * 100));
  const ini = initialOf();
  const b = h('button', { class:'avatar' + (pct >= 100 ? ' goal-done' : ''), type:'button', style:'--p:' + pct,
    'aria-label':'Your profile. Daily goal ' + pct + '% done', title:'Daily goal ' + pct + '%', onclick:() => setTab('me') },
    h('span', { class:'avatar-in' + (ini ? '' : ' is-sol'), html: ini ? '' : SOL_SVG }, ini || null));
  return b;
}
function topBar(title, tag){
  const st = streakNow(), alive = S.streak.last === dstr();
  const streak = h('button', { class:'hud-item streak' + (st ? '' : ' cold') + (alive ? ' lit' : ''), type:'button',
    'aria-label': st + ' day streak', title: st + ' day streak',
    onclick:() => toast(st ? (alive ? st + '-day streak. You\'ve practised today. ¡Bien!' : st + '-day streak. Do a lesson today to keep it alive.') : 'Finish a lesson to start a streak.') },
    h('span', { class:'hud-ico flame-ico', html:FLAME_SVG }), h('b', {}, String(st)));
  const gems = h('button', { class:'hud-item gems', type:'button', 'aria-label': gemsNow() + ' gems', title:'Gems',
    onclick:() => toast('Gems: earn 5 per lesson, 10 for a perfect one, and more from Today\'s five.') },
    h('span', { class:'hud-ico gem-ico', html:GEM_SVG }), h('b', {}, String(gemsNow())));
  return h('header', { class:'topnav' },
    h('div', { class:'brand' }, h('span', { class:'mark', 'aria-hidden':'true', html:MARK }), h('span', { class:'brand-name' }, 'Ruta'), tag ? h('span', { class:'tag' }, tag) : null),
    h('div', { class:'hud', role:'group', 'aria-label':'Your stats' },
      streak, gems, h('span', { class:'hud-item lv', title:'Level' }, 'Lv ', h('b', {}, String(userLevel()))), themeBtn(), avatarEl()));
}
function watchStuck(){
  const set = () => { const t = document.querySelector('#home .topnav'); if (t) t.classList.toggle('stuck', window.scrollY > 4); };
  window.addEventListener('scroll', set, { passive:true }); set();
}
function renderHome(){
  const home = $('#home'); home.innerHTML = '';
  ({ learn:renderLearn, practice:renderPractice, scroll:renderScroll, listen:renderListen, me:renderMe })[TAB](home);
  renderNav();
}

/* progress helpers */
function bandPct(band){
  const us = COURSE.map((u,i) => [u,i]).filter(([u]) => u.band === band);
  const done = us.reduce((n,[u,i]) => n + lvl(i), 0);
  return Math.round(done / (us.length * 3) * 100);
}
function bandRow(band, active){
  const pct = bandPct(band), n = COURSE.filter(u => u.band === band).length;
  return h('div', { class:'lvl-row'+(active ? ' active' : '')+(pct === 100 ? ' full' : '') },
    h('span', { class:'band-code' }, band),
    h('span', { class:'lvl-name' }, BANDS[band], h('small', {}, n + ' units')),
    h('span', { class:'lvl-bar', role:'progressbar', 'aria-label':BANDS[band]+' progress', 'aria-valuemin':'0', 'aria-valuemax':'100', 'aria-valuenow':String(pct) },
      h('span', { style:'width:'+pct+'%' })),
    h('span', { class:'lvl-pct' }, pct + '%'));
}
function currentUnit(){
  for (let i=0;i<COURSE.length;i++) if (unlocked(i) && lvl(i) < 1) return i;
  for (let i=0;i<COURSE.length;i++) if (unlocked(i) && lvl(i) < 3) return i;
  return -1;
}
const BAND_LIST = [...new Set(COURSE.map(u => u.band))];

/* the route map */
function routeMap(){
  const NS = 'http://www.w3.org/2000/svg';
  const el = (t, a) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; };
  const svg = el('svg', { viewBox:'0 0 360 150', class:'route', role:'img', 'aria-label':'Your route from Beginner to Intermediate' });
  const D = 'M18 118 C 70 120, 70 60, 120 62 S 190 112, 238 88 S 300 26, 342 34';
  const base = el('path', { d:D, class:'road' }), dash = el('path', { d:D, class:'road-mid' }), done = el('path', { d:D, class:'road-done' });
  svg.append(base, dash, done);
  const wrap = h('div', { class:'route-wrap' }); wrap.append(svg);
  requestAnimationFrame(() => {
    const L = base.getTotalLength(); if (!L) return;
    const fr = BAND_LIST.reduce((n,b) => n + bandPct(b), 0) / (BAND_LIST.length * 100);
    done.style.strokeDasharray = L; done.style.strokeDashoffset = L;
    requestAnimationFrame(() => { done.style.strokeDashoffset = L * (1 - fr); });
    const start = base.getPointAtLength(0);
    svg.append(el('circle', { cx:start.x, cy:start.y, r:4, class:'stop-start' }));
    const t0 = el('text', { x:start.x, y:start.y + 22, class:'stop-l', 'text-anchor':'start' }); t0.textContent = '¡Hola!'; svg.append(t0);
    BAND_LIST.forEach((b, i) => {
      const p = base.getPointAtLength(L * (i+1) / BAND_LIST.length), full = bandPct(b) === 100;
      svg.append(el('circle', { cx:p.x, cy:p.y, r:9, class:'stop'+(full ? ' full' : '') }));
      const code = el('text', { x:p.x, y:p.y + 3.5, class:'stop-c', 'text-anchor':'middle' }); code.textContent = b; svg.append(code);
      const below = i === 1 ? p.y + 26 : p.y - 16;
      const lab = el('text', { x: i === BAND_LIST.length-1 ? p.x + 8 : p.x, y:below, class:'stop-l', 'text-anchor': i === BAND_LIST.length-1 ? 'end' : 'middle' });
      lab.textContent = BANDS[b] + ' ' + bandPct(b) + '%'; svg.append(lab);
    });
    const me = base.getPointAtLength(Math.max(0.001, L * fr));
    svg.append(el('circle', { cx:me.x, cy:me.y, r:12, class:'me-glow' }), el('circle', { cx:me.x, cy:me.y, r:6, class:'me' }));
  });
  return wrap;
}

/* DAILY FIVE */
const DAILY = [
  ['lesson','Lesson','aprender','c-learn','<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6l8-3 8 3-8 3zM7 8v5c3 2 7 2 10 0V8" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>'],
  ['word','Word','palabra','c-remember','<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19l5-14h4l5 14M8 13h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'],
  ['life','Real life','práctico','c-practical','<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="10" r="2.5" fill="currentColor"/></svg>'],
  ['saying','Saying','refrán','c-expression','<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 18v-5a5 5 0 0 1 5-5M14 18v-5a5 5 0 0 1 5-5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>'],
  ['brain','Brain','mente','c-think','<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M13 3L5 14h6l-1 7 8-11h-6z" fill="currentColor"/></svg>']
];
const dayNum = () => Math.floor((Date.now() - new Date().getTimezoneOffset()*6e4) / DAY);
function daily(){ if (!S.daily || S.daily.d !== dstr()) S.daily = { d:dstr(), done:{} }; return S.daily; }
function markDaily(k){
  const d = daily(); if (d.done[k]) return false;
  d.done[k] = true; addXP(2); addGems(2); bumpStreak();
  if (DAILY.every(([id]) => d.done[id])){ addXP(5); addGems(10); toast('All five done today. +5 XP and +10 gems. ¡Enhorabuena!'); }
  save(); return true;
}
function gotIt(k){ return h('button', { class:'btn primary wide', type:'button', onclick:() => { const n = markDaily(k); closeSheet(); renderHome();
  if (n && !DAILY.every(([id]) => daily().done[id])) toast('+2 XP · ' + DAILY.filter(([id]) => daily().done[id]).length + ' of 5 done today'); } }, daily().done[k] ? 'Close' : 'Got it'); }
function openDaily(k){
  pickVoice();
  const n = dayNum();
  const row = (es, big) => h('div', { class:'sc-row' }, h('p', { class: big ? 'sc-es' : 'sc-ex', lang:'es' }, glossify(es)), audioBtns(es));
  if (k === 'lesson'){ const cur = currentUnit(); if (cur >= 0) startSession('lesson', cur, Math.min(3, lvl(cur)+1)); else startSession('review'); return; }
  if (k === 'brain'){ startSession('quick'); return; }
  if (k === 'word'){ const [w, en, ex, exEn] = WORD_DAY[n % WORD_DAY.length]; setTimeout(() => say(w), 200);
    openSheet('Word of the day', [h('p', { class:'kicker c-remember' }, 'Palabra del día', h('i', {}, ' · ' + new Date().toLocaleDateString(undefined, { weekday:'long', day:'numeric', month:'long' }))),
      row(w, true), h('p', { class:'sc-en' }, en), h('div', { class:'card' }, row(ex), h('p', { class:'small' }, exEn)), gotIt('word')]); }
  if (k === 'life'){ const [sit, es, en, tip] = PRACTICAL[n % PRACTICAL.length]; setTimeout(() => say(es), 200);
    openSheet('Real-life Spanish', [h('p', { class:'kicker c-practical' }, sit), row(es, true), h('p', { class:'sc-en' }, en),
      h('p', { class:'small' }, tip), gotIt('life')]); }
  if (k === 'saying'){ const [es, lit, mean, src] = DICHOS[n % DICHOS.length]; setTimeout(() => say(es), 200);
    openSheet(src ? 'Quote of the day' : 'Saying of the day', [h('p', { class:'kicker c-expression' }, src ? 'Cita' : 'Refrán', h('i', {}, src ? ' · ' + src : ' · saying')),
      row(es, true), h('p', { class:'sc-en' }, '"' + lit + '"'), h('p', { class:'small' }, 'Meaning: ' + mean), gotIt('saying')]); }
}
function dailyCard(){
  const d = daily(), n = DAILY.filter(([id]) => d.done[id]).length;
  return h('section', { class:'card daily' },
    h('div', { class:'levels-head' }, h('h2', {}, 'Today\'s five', h('i', { lang:'es' }, ' · hoy')), h('span', { class:'levels-total' }, n + ' of 5 done')),
    h('div', { class:'five' }, DAILY.map(([id, label, es, cls, svg]) => h('button', { class:'d-btn ' + cls + (d.done[id] ? ' done' : ''), type:'button', onclick:() => openDaily(id),
      'aria-label': label + (d.done[id] ? ', done' : '') },
      h('span', { class:'d-ring', html: d.done[id] ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' : svg }),
      h('span', { class:'d-l' }, label), h('span', { class:'d-es', lang:'es' }, es)))));
}

/* LEARN */
function renderLearn(home){
  const cur = currentUnit(), due = dueItems().length, tx = todayXP(), goal = S.settings.goal;
  const total = Math.round(COURSE.reduce((n,u,i) => n + lvl(i), 0) / (COURSE.length * 3) * 100);
  const act = cur >= 0 ? COURSE[cur].band : BAND_LIST[BAND_LIST.length-1];
  home.append(...[topBar(),
    h('section', { class:'hero' },
      (() => { const hr = new Date().getHours();
        const g = hr < 12 ? ['¡Buenos días!', 'Good morning'] : hr < 20 ? ['¡Buenas tardes!', 'Good afternoon'] : ['¡Buenas noches!', 'Good evening'];
        const sub = streakNow() > 1 ? streakNow() + ' days in a row. Keep it going!' : cur >= 0 ? g[1] + '. Ready for ' + COURSE[cur].es + '?' : g[1] + '. You finished the route!';
        const solBtn = h('button', { class:'hero-sol', type:'button', 'aria-label':'Sol, the mascot. Tap to say hello' }, solEl('idle'));
        const lines = ['¡Hola!', '¡Vamos!', '¡Tú puedes!', '¡Olé!', '¡Qué bien!'];
        solBtn.addEventListener('click', () => { const svg = solBtn.querySelector('.sol'); solPlay(svg, pick(['bounce','wiggle','cheer','spin'])); pickVoice(); say(pick(lines)); });
        return h('div', { class:'hero-top' }, solBtn, h('div', { class:'hero-bubble' }, h('span', { lang:'es' }, g[0]), h('small', {}, sub))); })(),
      h('p', { class:'eyebrow' }, 'Tu ruta', h('i', { lang:'es' }, ' · your route')),
      h('h1', { class:'hero-t' }, cur >= 0 ? 'Next stop: ' : '¡Lo lograste!', cur >= 0 ? h('span', { lang:'es' }, COURSE[cur].es) : null),
      routeMap(),
      cur >= 0 ? h('button', { class:'btn primary wide', type:'button', onclick:() => startSession('lesson', cur, Math.min(3, lvl(cur)+1)) },
        (lvl(cur) === 0 ? 'Start ' : LEVEL_NAMES[Math.min(3, lvl(cur)+1)] + ' ') + COURSE[cur].es) : null,
      h('div', { class:'goal' }, h('span', {}, 'Today ', h('b', {}, tx + ' / ' + goal + ' XP')),
        h('span', { class:'meter' }, h('span', { style:'width:'+Math.min(100, Math.round(tx/goal*100))+'%' })))),
    dailyCard(),
    h('section', { class:'card levels', 'aria-label':'Course progress' },
      h('div', { class:'levels-head' }, h('h2', {}, 'Your Spanish level'), h('span', { class:'levels-total' }, total + '% of the course')),
      BAND_LIST.map(b => bandRow(b, b === act))),
    due ? h('button', { class:'card nudge c-remember', type:'button', onclick:() => startSession('review') },
      h('span', { class:'kicker' }, 'Review', h('i', { lang:'es' }, ' · repasar')), h('span', { class:'nudge-t' }, due + (due === 1 ? ' card is' : ' cards are') + ' ready'),
      h('span', { class:'small' }, 'A few minutes now locks them into long-term memory.')) : null].filter(Boolean));
  let band = '', list = null;
  COURSE.forEach((u, i) => {
    if (u.band !== band){ band = u.band;
      home.append(h('h2', { class:'band' }, h('span', { class:'band-code' }, band), BANDS[band], h('span', { class:'band-pct' }, bandPct(band) + '%')));
      list = h('ol', { class:'path', start:String(i+1) }); home.append(list); }
    const L = lvl(i), open = unlocked(i);
    const pips = h('span', { class:'pips', 'aria-label':'Level '+L+' of 3' }, [1,2,3].map(n => h('span', { class: n <= L ? 'on' : '' })));
    const actions = h('div', { class:'unit-actions' });
    if (open) actions.append(h('button', { class:'btn small '+(i === cur ? 'primary' : 'soft'), type:'button', onclick:() => startSession('lesson', i, Math.min(3, L+1)) },
      L === 0 ? 'Start' : L < 3 ? LEVEL_NAMES[L+1] : 'Practise'));
    else actions.append(h('button', { class:'btn small ghost', type:'button', onclick:() => startSession('test', i) }, 'Test out'));
    actions.append(h('button', { class:'btn small text', type:'button', onclick:() => openNotes(i) }, 'Notes'));
    list.append(h('li', { class:'unit'+(open ? '' : ' locked')+(i === cur ? ' current' : '')+(L === 3 ? ' mastered' : '') },
      h('span', { class:'unit-pic', 'aria-hidden':'true' }, blobArt(u.id, 'sm'), h('span', { class:'unit-n' }, L === 3 ? '✓' : String(i+1))),
      h('div', { class:'unit-t' }, h('span', { class:'unit-es', lang:'es' }, u.es), h('span', { class:'unit-en' }, u.en), pips),
      actions));
  });
}

/* PRACTISE */
function keptItems(){ return (S.kept || []).map(k => ITEMS[k]).filter(Boolean); }
function renderPractice(home){
  const due = dueItems().length, weak = weakItems().length, kept = keptItems().length;
  const tile = (cls, kicker, es, title, note, n, go) => h('button', { class:'card tile-card '+cls, type:'button', disabled: n === 0, onclick:go },
    h('span', { class:'kicker' }, kicker, h('i', { lang:'es' }, ' · ' + es)), h('span', { class:'nudge-t' }, title), h('span', { class:'small' }, note));
  home.append(topBar(),
    h('section', { class:'page-head' }, h('p', { class:'eyebrow' }, 'Practise', h('i', { lang:'es' }, ' · practicar')), h('h1', { class:'hero-t' }, 'Keep it sharp')),
    h('div', { class:'grid' },
      tile('c-remember', 'Review', 'repasar', due ? due + ' ready to review' : 'All caught up', due ? 'Cards whose timer has run out. Do these first.' : 'Come back later. Cards return as they start to fade.', due, () => startSession('review')),
      tile('c-test', 'Mistakes', 'errores', weak ? 'Fix ' + weak + ' weak spots' : 'No weak spots', 'Only the things you keep getting wrong.', weak, () => startSession('mistakes')),
      tile('c-practical', 'Verbs', 'verbos', 'Verb drill', 'Conjugate the verbs you\'ve unlocked, person by person.', 1, () => startSession('verbs')),
      tile('c-learn', 'Kept', 'guardados', kept ? 'Practise ' + kept + ' kept cards' : 'Nothing kept yet', 'Bookmark words and phrases in Scroll to practise them here.', kept, () => startSession('kept'))),
    h('section', { class:'card' }, h('h2', { class:'card-h' }, 'Words known'),
      h('p', { class:'big-num' }, String(learnedWords()), h('small', {}, ' of ' + ALL.filter(i => i.kind === 'w').length)),
      h('p', { class:'small' }, 'A word counts as known once you\'ve got it right on two separate reviews.')));
}

/* SCROLL */
const SC = { feed:[], filter:'all', bags:{}, seen:0 };
const SC_TYPES = { word:['Word','palabra','c-learn'], phrase:['Phrase','frase','c-remember'], quiz:['Quiz','prueba','c-test'],
  grammar:['Grammar','gramática','c-think'], culture:['Culture','cultura','c-expression'], friend:['False friend','falso amigo','c-practical'] };
const SC_FILTERS = [['all','All'],['word','Words'],['phrase','Phrases'],['quiz','Quiz'],['grammar','Grammar'],['culture','Culture'],['friend','False friends']];
function scPool(type){
  const top = Math.min(COURSE.length - 1, maxU() + 1), inR = i => i.u <= top;
  if (type === 'word') return ALL.filter(i => i.kind === 'w' && inR(i)).map(i => ({ type, item:i, id:i.key }));
  if (type === 'phrase') return ALL.filter(i => (i.kind === 's' || i.kind === 'd') && inR(i)).map(i => ({ type, item:i, id:i.key }));
  if (type === 'quiz') return ALL.filter(i => i.kind === 'w' && inR(i)).map(i => ({ type, item:i, id:'q|'+i.key }));
  if (type === 'grammar') return COURSE.flatMap((u, ui) => ui > top ? [] : (u.tip.match(/<p>[\s\S]*?<\/p>/g) || []).map((p, j) => ({ type, unit:u, html:p, id:'g|'+u.id+'|'+j })));
  if (type === 'culture') return CULTURE.map((c, j) => ({ type, title:c[0], html:c[1], id:'c|'+j }));
  if (type === 'friend') return FALSE_FRIENDS.map((f, j) => ({ type, f, id:'f|'+j }));
  return [];
}
function scDraw(type){
  if (!SC.bags[type] || !SC.bags[type].length) SC.bags[type] = shuffle(scPool(type));
  return SC.bags[type].pop();
}
function scNext(n){
  const mix = ['word','phrase','quiz','word','grammar','phrase','culture','quiz','friend','word','phrase','culture'];
  const out = [];
  for (let k = 0; k < n; k++){
    const t = SC.filter === 'all' ? mix[(SC.feed.length + k) % mix.length] : SC.filter;
    const c = scDraw(t); if (c) out.push(c);
  }
  return out;
}
function scToday(){ if (!S.sc || S.sc.d !== dstr()) S.sc = { d:dstr(), n:0 }; return S.sc; }
function isKept(id){ return (S.kept || []).includes(id) || (S.keptMisc || []).includes(id); }
function toggleKeep(card, btn){
  const it = card.item, id = it && card.type !== 'quiz' ? it.key : (it ? it.key : card.id);
  const list = it ? (S.kept = S.kept || []) : (S.keptMisc = S.keptMisc || []);
  const ix = list.indexOf(id);
  if (ix >= 0){ list.splice(ix, 1); btn.setAttribute('aria-pressed','false'); toast('Removed from kept'); }
  else { list.push(id); btn.setAttribute('aria-pressed','true');
    if (it && !S.srs[it.key]) S.srs[it.key] = { b:0, d:Date.now(), r:0, w:0 };
    toast(it ? 'Kept. It\'s now in your reviews.' : 'Kept'); }
  save(); const k = $('#sc-kept'); if (k) k.textContent = String((S.kept || []).length + (S.keptMisc || []).length);
}
const BOOK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z" fill="currentColor"/></svg>';
function scCard(card){
  const [label, es, cls] = SC_TYPES[card.type];
  const keepId = card.item ? card.item.key : card.id;
  const keep = h('button', { class:'keep', type:'button', 'aria-label':'Keep this card', 'aria-pressed': String(isKept(keepId)), html:BOOK });
  keep.addEventListener('click', () => toggleKeep(card, keep));
  const headRow = h('div', { class:'sc-head' }, h('span', { class:'kicker' }, label, h('i', { lang:'es' }, ' · ' + es)),
    card.type !== 'quiz' ? keep : null);
  const body = [];
  if (card.type === 'word' || card.type === 'phrase'){
    const it = card.item, u = COURSE[it.u], isNew = !unlocked(it.u);
    body.push(h('div', { class:'sc-row' }, h('p', { class:'sc-es', lang:'es' }, glossify(it.es[0])), audioBtns(it.es[0])),
      h('p', { class:'sc-en' }, it.en.slice(0, 2).join(' · ')),
      h('p', { class:'sc-meta' }, (it.kind === 'd' ? it.who + ' · ' : '') + 'From ' + u.es + (isNew ? ' · coming up next' : '') + (it.hint ? ' · ' + it.hint : '')));
  } else if (card.type === 'quiz'){
    const it = card.item, opts = shuffle([it.en[0], ...distract(it, 'en', 2, ['w'])]);
    let done = false;
    const btns = opts.map(o => h('button', { class:'opt', type:'button' }, o));
    const result = h('p', { class:'sc-meta', 'aria-live':'polite' });
    btns.forEach((b, j) => b.addEventListener('click', () => { if (done) return; done = true;
      const ok = it.en.includes(opts[j]); rec(it.key, ok); save(); sfx(ok); say(it.es[0]);
      btns.forEach((x, k) => { x.disabled = true; if (it.en.includes(opts[k])) x.classList.add('right'); else if (k === j) x.classList.add('wrong'); });
      result.textContent = ok ? '¡Correcto! Counted toward your reviews.' : 'Not quite. This one will come back in your reviews.'; }));
    body.push(h('p', { class:'sc-q' }, 'What does ', h('b', { lang:'es' }, it.es[0]), ' mean?'), h('div', { class:'options' }, btns), result);
  } else if (card.type === 'grammar'){
    body.push(h('h3', { class:'sc-title' }, card.unit.en), h('div', { class:'sc-text', html:card.html }));
  } else if (card.type === 'culture'){
    body.push(h('h3', { class:'sc-title' }, card.title), h('div', { class:'sc-text', html:'<p>' + card.html + '</p>' }));
  } else if (card.type === 'friend'){
    const [w, looks, real, ex] = card.f;
    const ans = h('div', { class:'sc-answer', hidden:true },
      h('p', {}, h('b', { lang:'es' }, w), ' means ', h('b', {}, real), '.'),
      h('div', { class:'sc-row' }, h('p', { class:'sc-ex', lang:'es' }, ex), audioBtns(ex)));
    const reveal = h('button', { class:'reveal', type:'button' }, 'Show the answer ›');
    reveal.addEventListener('click', () => { ans.hidden = false; reveal.hidden = true; say(w); });
    body.push(h('h3', { class:'sc-title' }, h('span', { lang:'es' }, w), ' ≠ ', looks),
      h('p', { class:'sc-q' }, 'It looks like "' + looks + '", but it isn\'t. What does it really mean?'), reveal, ans);
  }
  return h('article', { class:'card sc-card ' + cls }, headRow, ...body);
}
function renderScroll(home){
  const t = scToday();
  home.append(topBar(null, 'Scroll'),
    h('div', { class:'sc-counts' }, h('span', { class:'pill' }, h('b', { id:'sc-today' }, String(t.n)), ' today'),
      h('span', { class:'pill' }, h('b', { id:'sc-kept' }, String((S.kept || []).length + (S.keptMisc || []).length)), ' kept')),
    h('div', { class:'filters', role:'toolbar', 'aria-label':'Card types' }, SC_FILTERS.map(([id, label]) =>
      h('button', { class:'chip'+(SC.filter === id ? ' on' : ''), type:'button', 'aria-pressed': String(SC.filter === id),
        onclick:() => { SC.filter = id; SC.feed = []; renderHome(); } }, label))));
  const feed = h('div', { class:'feed', id:'feed' });
  if (!SC.feed.length){
    feed.append(h('article', { class:'card sc-card c-learn intro-card' }, h('span', { class:'kicker' }, 'Welcome', h('i', { lang:'es' }, ' · bienvenido')),
      h('h3', { class:'sc-title big' }, 'Scroll as long as you like.'),
      h('p', { class:'sc-text' }, 'Small cards of real Spanish: words, phrases, quick quizzes, grammar tips, culture and false friends. Tap the bookmark to keep a card. Kept words and phrases go straight into your reviews.')));
    SC.feed = scNext(10);
  }
  SC.feed.forEach(c => feed.append(scCard(c)));
  const more = h('div', { class:'more', 'aria-hidden':'true' }, 'Loading more…');
  home.append(feed, more);
  let busy = false;
  const io = new IntersectionObserver(es => { if (!es[0].isIntersecting || busy || TAB !== 'scroll') return; busy = true;
    const add = scNext(8); SC.feed.push(...add); add.forEach(c => feed.append(scCard(c))); setTimeout(() => busy = false, 150); }, { rootMargin:'600px' });
  io.observe(more);
  const seen = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting && !e.target.dataset.seen){ e.target.dataset.seen = '1';
    const s = scToday(); s.n++; const el = $('#sc-today'); if (el) el.textContent = String(s.n); save(); } }), { threshold:0.6 });
  const watch = () => feed.querySelectorAll('.sc-card:not([data-w])').forEach(c => { c.dataset.w = '1'; seen.observe(c); });
  watch(); new MutationObserver(watch).observe(feed, { childList:true });
}

/* LISTEN */
const LS = { on:false, unit:null, mode:'both', list:[], i:0, tok:0 };
let EN_VOICE = null;
function pickEnVoice(){
  if (!TTS) return; const vs = speechSynthesis.getVoices().filter(v => /^en/i.test(v.lang));
  const sc = v => (MALE.test(v.name) || /\b(guy|ryan|william|christopher|eric|david|mark|james|george|thomas|liam|daniel)\b/i.test(v.name) ? 6 : 0) + (/natural|neural|online/i.test(v.name) ? 5 : 0) + (/en[-_](AU|GB)/i.test(v.lang) ? 1 : 0);
  EN_VOICE = vs.sort((a,b) => sc(b) - sc(a))[0] || null;
}
function speakP(text, lang, rateMul){
  return new Promise(res => {
    if (!TTS) return res();
    const u = new SpeechSynthesisUtterance(text);
    if (lang === 'es'){ if (VOICE){ u.voice = VOICE; u.lang = VOICE.lang; } else u.lang = 'es-ES'; }
    else { if (EN_VOICE){ u.voice = EN_VOICE; u.lang = EN_VOICE.lang; } else u.lang = 'en-AU'; }
    u.rate = S.settings.rate * (rateMul || 1);
    let done = false; const fin = () => { if (!done){ done = true; res(); } };
    u.onend = fin; u.onerror = fin; setTimeout(fin, 4000 + text.length * 180);
    speechSynthesis.speak(u);
  });
}
const wait = ms => new Promise(r => setTimeout(r, ms));
function listenList(key){
  if (key === 'kept') return keptItems();
  if (key === 'learned') return ALL.filter(i => (i.kind === 'w' || i.kind === 's') && box(i.key) >= 1);
  const u = COURSE.find(x => x.id === key); return u ? UNIT_ITEMS[u.id].filter(i => i.kind !== 'v') : [];
}
let wakeLock = null;
async function runListen(){
  const tok = ++LS.tok;
  try { if ('wakeLock' in navigator) wakeLock = await navigator.wakeLock.request('screen'); } catch(e){}
  while (LS.on && tok === LS.tok && LS.i < LS.list.length){
    paintListen();
    const it = LS.list[LS.i];
    await speakP(it.es[0], 'es'); if (tok !== LS.tok) return; await wait(1100);
    if (LS.mode === 'both'){ await speakP(it.en[0], 'en'); if (tok !== LS.tok) return; await wait(900); }
    await speakP(it.es[0], 'es', 0.8); if (tok !== LS.tok) return; await wait(1500);
    if (tok !== LS.tok) return;
    LS.i++;
  }
  if (tok === LS.tok && LS.i >= LS.list.length){ LS.on = false; LS.i = 0; paintListen(true); }
}
function stopListen(){ LS.on = false; LS.tok++; try { speechSynthesis.cancel(); } catch(e){} try { wakeLock && wakeLock.release(); } catch(e){} wakeLock = null; }
function paintListen(finished){
  const box2 = $('#ls-now'); if (!box2) return;
  const it = LS.list[LS.i];
  $('#ls-es').textContent = it ? it.es[0] : '—';
  $('#ls-en').textContent = it ? it.en[0] : '';
  $('#ls-count').textContent = LS.list.length ? (Math.min(LS.i + 1, LS.list.length) + ' / ' + LS.list.length) : '';
  $('#ls-fill').style.width = (LS.list.length ? LS.i / LS.list.length * 100 : 0) + '%';
  const pb = $('#ls-play'); pb.innerHTML = LS.on ? PAUSE : PLAYBIG; pb.setAttribute('aria-label', LS.on ? 'Pause' : 'Play');
  if (finished) toast('Track finished. ¡Bien hecho!');
}
const PLAYBIG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';
const PAUSE = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/></svg>';
function voicesBySex(){
  const es = esVoices();
  return { male: es.find(isMale) || null, female: es.find(v => !isMale(v)) || null };
}
function renderListen(home){
  pickVoice(); pickEnVoice();
  const opts = [['learned','Everything I\'ve learned'], ['kept','My kept cards'], ...COURSE.map((u, i) => [u.id, (i+1) + '. ' + u.es + ' (' + u.en + ')' + (unlocked(i) ? '' : ' · preview')])];
  if (!LS.unit){ const cu = currentUnit(); LS.unit = COURSE[Math.max(0, cu)].id; }
  LS.list = listenList(LS.unit); if (LS.i >= LS.list.length) LS.i = 0;
  const sel = h('select', { id:'ls-unit' }, opts.map(([v, l]) => h('option', { value:v, selected: v === LS.unit }, l)));
  sel.addEventListener('change', () => { stopListen(); LS.unit = sel.value; LS.i = 0; renderHome(); });
  const mode = (m, l) => h('button', { class:'chip'+(LS.mode === m ? ' on' : ''), type:'button', 'aria-pressed': String(LS.mode === m), onclick:() => { LS.mode = m; renderHome(); } }, l);
  const { male, female } = voicesBySex();
  const narr = (v, label, key) => v ? h('div', { class:'narr'+(VOICE && vid(VOICE) === vid(v) ? ' on' : '') },
    h('button', { class:'narr-pick', type:'button', onclick:() => { S.settings.voice = vid(v); save(); pickVoice(); renderHome(); } },
      h('span', { class:'narr-a', 'aria-hidden':'true' }, key), h('span', {}, h('b', {}, label), h('small', {}, vLabel(v).replace(/ · male$/,'')))),
    h('button', { class:'btn small soft', type:'button', onclick:() => { const keep = VOICE; VOICE = v; say('Hola, soy tu narrador.'); VOICE = keep; } }, '▶ Hear')) : null;
  const play = h('button', { class:'big-play', id:'ls-play', type:'button', 'aria-label':'Play', html:PLAYBIG });
  play.addEventListener('click', () => { if (!LS.list.length){ toast('Nothing to play here yet.'); return; }
    if (LS.on) stopListen(); else { LS.on = true; runListen(); } paintListen(); });
  const skip = d => { const was = LS.on; stopListen(); LS.i = Math.max(0, Math.min(LS.list.length - 1, LS.i + d)); paintListen(); if (was){ LS.on = true; runListen(); } };
  home.append(topBar(null, 'Listen'),
    h('section', { class:'page-head' }, h('p', { class:'eyebrow' }, 'Escuchar', h('i', {}, ' · listen')), h('h1', { class:'hero-t' }, 'Learn on the go'),
      h('p', { class:'small' }, 'Hands-free lessons for the drive, the walk or the gym. Each line plays in Spanish, then English, then Spanish again, slower.')),
    h('section', { class:'card player' },
      h('label', { class:'lbl', for:'ls-unit' }, 'What to play'), sel,
      h('div', { class:'chips' }, mode('both', 'Spanish + English'), mode('es', 'Spanish only')),
      h('div', { class:'now', id:'ls-now', 'aria-live':'polite' },
        h('p', { class:'ls-es', id:'ls-es', lang:'es' }), h('p', { class:'ls-en', id:'ls-en' })),
      h('div', { class:'ls-track' }, h('span', { class:'meter' }, h('span', { id:'ls-fill' })), h('span', { class:'ls-count', id:'ls-count' })),
      h('div', { class:'controls' },
        h('button', { class:'icon-btn ctl', type:'button', 'aria-label':'Previous', html:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h2v14H6zM20 5v14L9 12z" fill="currentColor"/></svg>', onclick:() => skip(-1) }),
        play,
        h('button', { class:'icon-btn ctl', type:'button', 'aria-label':'Next', html:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16 5h2v14h-2zM4 5v14l11-7z" fill="currentColor"/></svg>', onclick:() => skip(1) }))),
    h('section', { class:'card' }, h('h2', { class:'card-h' }, 'Choose your narrator'),
      (male || female) ? h('div', { class:'narrs' }, narr(male, 'Male', 'M'), narr(female, 'Female', 'F'))
        : h('p', { class:'small' }, 'No Spanish voice found on this device. Try Microsoft Edge or your phone\'s browser.'),
      !male ? h('p', { class:'small' }, 'No male Spanish voice in this browser. Microsoft Edge has a clear one called Álvaro.') : null,
      h('p', { class:'small' }, 'Tip: keep this tab open while you drive. Your screen stays awake during playback where the browser allows it.')));
  paintListen();
}

/* ME */
function renderMe(home){
  const { L, pct, need } = levelSpan();
  const acc = S.stats.answers ? Math.round(S.stats.correct / S.stats.answers * 100) : 0;
  const unitsDone = COURSE.filter((u, i) => lvl(i) === 3).length;
  const stat = (k, v, sm) => h('div', { class:'stat' }, h('span', { class:'stat-k' }, k), h('span', { class:'stat-v' }, v, sm ? h('small', {}, sm) : null));
  home.append(topBar(),
    h('section', { class:'page-head' }, h('p', { class:'eyebrow' }, 'Tú', h('i', {}, ' · you')), h('h1', { class:'hero-t' }, 'Level ' + L)),
    h('section', { class:'card' },
      h('div', { class:'levels-head' }, h('h2', { class:'card-h' }, 'Next level'), h('span', { class:'levels-total' }, need + ' XP to go')),
      h('span', { class:'lvl-bar' }, h('span', { style:'width:'+pct+'%' }))),
    h('section', { class:'stats' },
      stat('Streak', String(streakNow()), streakNow() === 1 ? ' day' : ' days'), stat('Total XP', String(S.xp)),
      stat('Accuracy', acc + '%'), stat('Words known', String(learnedWords())),
      stat('Units mastered', String(unitsDone), ' / ' + COURSE.length), stat('Answers', String(S.stats.answers))),
    h('section', { class:'card settings' }, h('h2', { class:'card-h' }, 'Settings'), ...settingsNodes()),
    h('p', { class:'foot' }, 'Ruta is free and private. Progress is saved in this browser only.'));
}

/* ---------- sessions ---------- */
let Q = null, ctx = null, phase = 'answer';
function startSession(mode, ui, level){
  stopListen(); pickVoice();
  let queue = [];
  if (mode === 'lesson') queue = buildLesson(ui, level, false);
  else if (mode === 'test') queue = buildLesson(ui, 3, true);
  else if (mode === 'review') queue = buildReview();
  else if (mode === 'mistakes') queue = buildMistakes();
  else if (mode === 'verbs') queue = buildVerbs();
  else if (mode === 'kept') queue = buildFromItems(keptItems(), 15);
  else if (mode === 'quick'){ let pool = ALL.filter(i => (i.kind === 'w' || i.kind === 's' || i.kind === 'v') && S.srs[i.key]);
    if (pool.length < 8) pool = ALL.filter(i => (i.kind === 'w' || i.kind === 's') && unlocked(i.u)); queue = buildFromItems(pool, 8); }
  if (!queue.length){ toast('Nothing to practise here yet.'); return; }
  Q = { mode, ui, level, queue, i:0, total:0, right:0, combo:0, missed:new Set(), t0:Date.now(), noSpeak:false,
    goal: queue.filter(e => e.t !== 'intro').length, prog:0,
    before:{ streakDay:S.streak.last, today:todayXP(), level:userLevel() } };
  $('#quit').hidden = true;
  $('#bar-fill').style.width = '0%'; $('#stage').innerHTML = '';
  show('lesson'); nextEx();
}
function setBar(state, html, label, enabled){
  const b = $('#checkbar'); b.className = 'checkbar' + (state ? ' '+state : '');
  $('#bar-msg').innerHTML = html || ''; const btn = $('#bar-btn'); btn.textContent = label; btn.disabled = !enabled;
}
function syncBar(){ $('#bar-btn').disabled = !(ctx && ctx.ready); }
function nextEx(){
  while (Q.i < Q.queue.length && Q.queue[Q.i].t === 'speak' && !canDo('speak', Q)){ Q.i++; Q.prog++; }
  hideTip(); mascotHide();
  if (Q.i >= Q.queue.length) return finish();
  const ex = Q.queue[Q.i], stage = $('#stage'), old = stage.firstElementChild;
  const render = () => {
    stage.innerHTML = ''; ctx = null; phase = 'answer';
    const R = { pic:rPic, intro:rIntro, mc:rMC, tiles:rTiles, type:rType, fill:rFill, match:rMatch, speak:rSpeak, dlg:rDlg }[ex.t];
    R(ex, stage);
    if (ex.t === 'intro'){ phase = 'next'; setBar('', '', 'Continue', true); }
    else if (ex.t === 'match'){ setBar('', 'Tap a Spanish word, then its meaning.', 'Check', false); }
    else setBar('', '', 'Check', false);
    const el = stage.firstElementChild; if (old) slideIn(el); else fadeUp(el);
  };
  if (old && !reducedMotion()){ phase = 'busy'; slideOut(old).then(render); } else render();
}
function onBar(){
  if (!Q) return;
  if (phase === 'answer'){ if (!ctx || !ctx.ready) return; resolve(ctx.check()); }
  else if (phase === 'next'){ Q.i++; nextEx(); }
}
function resolve(res){
  const ex = Q.queue[Q.i]; phase = 'next';
  if (ctx && ctx.lock) ctx.lock(res);
  if (!res.skip){
    if (!res.noRecord && (!ex.retry || !res.ok)) ex.items.forEach(it => rec(it.key, res.ok));
    if (!ex.retry){ Q.total++; if (res.ok) Q.right++; else Q.missed.add(ex.item.key); }
    if (res.ok && !ex.retry) Q.combo++; else if (!res.ok) Q.combo = 0;
    let requeued = false;
    if (!res.ok && Q.mode !== 'test' && ex.t !== 'match'){ const again = makeEx(ex.type, ex.item); if (again){ again.retry = true; Q.queue.push(again); requeued = true; } }
    if (!requeued){ Q.prog++; setProgress(true); }
    save();
  }
  if (res.skip){ Q.prog++; setProgress(true); setBar('', res.msg || '', 'Continue', true); return; }
  sfx(res.ok);
  const extra = ex.reveal ? '<span class="mean">'+esc(ex.reveal)+'</span>' : '';
  const hot = res.ok && !ex.retry && Q.combo >= 5 && Q.combo % 5 === 0;
  if (hot) fanfare(false);
  if (res.ok) setBar('good' + (hot ? ' hot' : ''), '<b class="verdict"><span class="v-icon">'+CHECK_SVG+'</span>'+(hot ? '¡' + Q.combo + ' seguidas! <span class="combo">' + Q.combo + ' in a row</span>' : pick(PRAISE))+'</b>'+(res.note ? '<span>'+res.note+'</span>' : '')+extra, 'Continue', true);
  else {
    const ans = ex.t === 'match' ? '' : '<span>Correct answer: <b lang="'+(ex.to === 'en' || ex.type === 'mc_es2en' ? 'en' : 'es')+'">'+esc(ex.answers[0])+'</b></span>';
    setBar('bad', '<b class="verdict"><span class="v-icon">'+CROSS_SVG+'</span>'+(ex.t === 'match' ? 'Done, with a few slips' : 'Not quite')+'</b>'+(res.note ? '<span>'+res.note+'</span>' : '')+ans+extra, 'Continue', true);
  }
  feedbackFx(res.ok);
  if (res.ok) mascotPop(hot);
  $('#bar-btn').focus({ preventScroll:true });
}
/* ---------- finish: celebration screens ---------- */
function fanfare(big){
  if (!S.settings.sfx) return;
  try { actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const seq = big ? [523, 659, 784, 1047, 1319] : [523, 659, 784, 1047];
    seq.forEach((f, i) => { const o = actx.createOscillator(), g = actx.createGain(); o.type = 'triangle';
      o.frequency.value = f; const t = actx.currentTime + i * 0.11; g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.13, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + (i === seq.length-1 ? 0.7 : 0.25));
      o.connect(g).connect(actx.destination); o.start(t); o.stop(t + 0.8); });
  } catch(e){}
}
function confetti(big){
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const cv = h('canvas', { class:'confetti', 'aria-hidden':'true' }); document.body.append(cv);
  const ctx2 = cv.getContext('2d'), dpr = window.devicePixelRatio || 1;
  const W = cv.width = innerWidth * dpr, H = cv.height = innerHeight * dpr;
  const cs = getComputedStyle(document.documentElement);
  const cols = ['--accent','--sun','--c-remember','--c-think','--c-expression','--good'].map(v => cs.getPropertyValue(v).trim() || '#E2A541');
  const N = big ? 170 : 90, P = [];
  for (let i = 0; i < N; i++){ const fromLeft = i % 2 === 0;
    P.push({ x: fromLeft ? 0 : W, y: H * (0.55 + Math.random() * 0.2), vx: (fromLeft ? 1 : -1) * (4 + Math.random() * 9) * dpr, vy: -(10 + Math.random() * 12) * dpr,
      w: (5 + Math.random() * 6) * dpr, hh: (8 + Math.random() * 8) * dpr, r: Math.random() * 6, vr: (Math.random() - .5) * .35, c: cols[i % cols.length] }); }
  const t0 = performance.now();
  (function frame(t){
    const el = t - t0; ctx2.clearRect(0, 0, W, H);
    P.forEach(p => { p.vy += 0.32 * dpr; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx2.save(); ctx2.translate(p.x, p.y); ctx2.rotate(p.r); ctx2.globalAlpha = Math.max(0, 1 - el / 3200);
      ctx2.fillStyle = p.c; ctx2.fillRect(-p.w/2, -p.hh/2, p.w, p.hh * Math.abs(Math.cos(p.r * 2))); ctx2.restore(); });
    if (el < 3300) requestAnimationFrame(frame); else cv.remove();
  })(t0);
}
function countUp(el, to, fmt){
  const t0 = performance.now(), d = 900;
  (function f(t){ const k = Math.min(1, (t - t0) / d), e = 1 - Math.pow(1 - k, 3); el.textContent = fmt(Math.round(to * e)); if (k < 1) requestAnimationFrame(f); })(t0);
}
function accWord(acc){ return acc === 100 ? '¡Perfecto!' : acc >= 90 ? '¡Excelente!' : acc >= 75 ? 'Muy bien' : acc >= 50 ? 'Bien hecho' : 'Sigue así'; }
const CHEERS = ['¡Lo has clavado!','¡Qué crack!','¡Vas volando!','¡Sigue así!','¡Increíble!','¡Olé!'];
const TROPHY = '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M20 8h24v14a12 12 0 0 1-24 0z" fill="currentColor"/><path d="M20 12H10v4a10 10 0 0 0 10 10M44 12h10v4a10 10 0 0 1-10 10" fill="none" stroke="currentColor" stroke-width="4"/><path d="M28 34h8v10h-8z" fill="currentColor"/><path d="M20 52h24v6H20zM24 44h16v8H24z" fill="currentColor"/></svg>';
const STAR = '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 4l8.5 17.6 19.3 2.6-14.1 13.4 3.5 19.2L32 47.5 14.8 56.8l3.5-19.2L4.2 24.2l19.3-2.6z" fill="currentColor"/></svg>';
const BIGFLAME = '<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M32 4c3 11 15 16 15 31a15 15 0 0 1-30 0c0-7 3.5-12 7.5-15 0 6 3 9 6 9 0-9-3-17 1.5-25z" fill="currentColor"/><path d="M32 34c2 5 7 7 7 13a7 7 0 0 1-14 0c0-3 1.5-5 3.5-6 0 2.5 1.5 3.5 3 3.5-.5-4-1-7 .5-10.5z" fill="var(--bg)" opacity=".55"/></svg>';

function finish(){
  mascotHide(); const mm = $('#mascot'); if (mm) mm.hidden = true;
  const B = Q.before || {};
  const acc = Q.total ? Math.round(Q.right / Q.total * 100) : 100;
  const perfect = Q.total >= 4 && Q.right === Q.total;
  let xp = Q.right + (Q.mode === 'lesson' ? 5 : 3);
  if (perfect) xp += 5;
  let title = 'Session complete', note = '', unlocked2 = null, mastered = null, passed = true;
  if (Q.mode === 'lesson'){
    const u = COURSE[Q.ui]; const before = lvl(Q.ui); const p0 = bandPct(u.band); S.units[u.id] = Math.max(before, Q.level); const p1 = bandPct(u.band);
    if (p1 > p0) Q.bandUp = { band:u.band, p0, p1 };
    title = LEVEL_NAMES[Q.level] + ' complete';
    if (before < 1 && Q.level === 1 && Q.ui + 1 < COURSE.length) unlocked2 = Q.ui + 1;
    if (before < 3 && Q.level === 3) mastered = Q.ui;
  } else if (Q.mode === 'test'){
    const wrong = Q.total - Q.right;
    if (wrong <= 2){ for (let i=0;i<=Q.ui;i++) S.units[COURSE[i].id] = Math.max(lvl(i), 1); title = 'Test passed'; note = 'Units up to ' + COURSE[Q.ui].es + ' are now open.'; }
    else { passed = false; title = 'Not this time'; note = 'You missed ' + wrong + '. Passing needs 2 or fewer. The earlier units will get you there.'; }
  } else title = { review:'Review complete', mistakes:'Weak spots practised', verbs:'Verb drill complete', kept:'Kept cards practised', quick:'Brain workout done' }[Q.mode] || title;
  if (Q.mode === 'lesson' || (Q.mode === 'test' && passed)) markDaily('lesson');
  if (['review','mistakes','verbs','kept','quick'].includes(Q.mode)) markDaily('brain');
  const gemsWon = !passed ? 1 : ['lesson','test'].includes(Q.mode) ? (perfect ? 10 : 5) : (perfect ? 5 : 3);
  addXP(xp); addGems(gemsWon); bumpStreak();
  if (perfect){ S.perfect = (S.perfect || 0) + 1; }
  save();
  const secs = Math.round((Date.now() - Q.t0) / 1000);
  const missed = [...Q.missed].map(k => ITEMS[k]).filter(Boolean);
  const streakUp = B.streakDay !== dstr() && S.streak.last === dstr();
  const goalHit = (B.today || 0) < S.settings.goal && todayXP() >= S.settings.goal;
  const lvUp = userLevel() > (B.level || 1);
  const unitName = Q.ui != null && COURSE[Q.ui] ? COURSE[Q.ui].es : '';

  const screens = [];
  /* 1. results */
  screens.push(() => {
    const xpEl = h('dd', {}, '+0'), accEl = h('dd', {}, '0%');
    const node = h('div', { class:'done-card' + (perfect ? ' perfect center' : '') },
      perfect ? h('div', { class:'medal', html:STAR }) : h('div', { class:'done-sol' }, solEl(passed ? 'cheer' : 'wiggle')),
      h('p', { class:'eyebrow' }, perfect ? 'Sin errores · flawless' : (passed ? pick(CHEERS) : 'Casi · almost')),
      h('h2', {}, perfect ? '¡Perfecto!' : title),
      h('p', { class:'done-note' }, perfect ? 'Every answer right first time' + (unitName && Q.mode === 'lesson' ? ' in ' + unitName + '. ' : '. ') + '+5 bonus XP.' + (S.perfect > 1 ? ' That\'s ' + S.perfect + ' perfect sessions so far.' : '')
        : (unitName && Q.mode === 'lesson' ? unitName + ' · ' + title + '. ' : '') + note),
      h('dl', { class:'done-stats' },
        h('div', { class:'ds xp' }, h('dt', {}, 'Total XP'), xpEl, h('span', { class:'ds-w' }, perfect ? 'incl. +5 bonus' : 'earned')),
        h('div', { class:'ds acc' }, h('dt', {}, 'Accuracy'), accEl, h('span', { class:'ds-w' }, accWord(acc))),
        h('div', { class:'ds time' }, h('dt', {}, 'Time'), h('dd', {}, Math.floor(secs/60)+':'+String(secs%60).padStart(2,'0')), h('span', { class:'ds-w' }, secs < 120 ? '¡Rápido!' : 'Steady'))),
      h('p', { class:'gem-earn' }, h('span', { class:'hud-ico gem-ico', html:GEM_SVG }), '+' + gemsWon + ' gems', h('small', {}, ' · ' + gemsNow() + ' total')),
      missed.length ? h('div', { class:'missed' }, h('h3', {}, 'Worth another look'),
        h('ul', {}, missed.map(it => h('li', {}, h('button', { class:'icon-btn tiny', type:'button', 'aria-label':'Play', html:ICON.play, onclick:() => say(it.es[0]) }),
          h('span', { lang:'es', class:'m-es' }, it.es[0]), h('span', { class:'m-en' }, it.en[0]))))) : null);
    setTimeout(() => { countUp(xpEl, xp, n => '+' + n); countUp(accEl, acc, n => n + '%'); }, 250);
    if (passed){ confetti(perfect); fanfare(perfect); if (perfect) setTimeout(() => say('¡Perfecto!'), 700); }
    return node;
  });
  /* 2. streak */
  if (streakUp) screens.push(() => {
    const n = S.streak.n, today = new Date(), dow = (today.getDay() + 6) % 7;
    const days = ['L','M','X','J','V','S','D'].map((d, i) => { const ago = dow - i;
      const on = ago >= 0 && ago < n, isT = ago === 0;
      return h('span', { class:'wk' + (on ? ' on' : '') + (isT ? ' today' : '') + (ago < 0 ? ' future' : '') }, h('b', {}, d)); });
    fanfare(false);
    return h('div', { class:'done-card center' }, h('div', { class:'medal flame-big', html:BIGFLAME }),
      h('p', { class:'big-count' }, String(n)), h('h2', {}, n === 1 ? 'Day streak started' : 'day streak!'),
      h('div', { class:'week' }, days),
      h('p', { class:'done-note' }, n === 1 ? 'Come back tomorrow to make it two. Even five minutes counts.' : 'You\'ve practised ' + n + ' days in a row. Keep the flame alive tomorrow.'));
  });
  /* 3. daily goal */
  if (goalHit) screens.push(() => h('div', { class:'done-card center' }, h('div', { class:'medal', html:TROPHY }),
    h('p', { class:'eyebrow' }, 'Meta diaria · daily goal'), h('h2', {}, 'Daily goal reached'),
    h('p', { class:'done-note' }, todayXP() + ' XP today, goal ' + S.settings.goal + '. Anything more today is a bonus.')));
  /* 4. unit progress / unlock / mastered */
  if (Q.bandUp || unlocked2 != null || mastered != null) screens.push(() => {
    if (mastered != null) setTimeout(() => confetti(true), 150);
    return h('div', { class:'done-card' },
      mastered != null ? h('div', { class:'medal', html:TROPHY }) : null,
      h('p', { class:'eyebrow' }, 'Tu ruta · your route'),
      h('h2', {}, mastered != null ? COURSE[mastered].es + ' mastered' : unlocked2 != null ? 'New stop unlocked' : 'You moved forward'),
      unlocked2 != null ? h('p', { class:'done-note' }, 'Unit ' + (unlocked2 + 1) + ', ', h('b', { lang:'es' }, COURSE[unlocked2].es), ' (' + COURSE[unlocked2].en + '), is now open.') : null,
      mastered != null ? h('p', { class:'done-note' }, 'All three levels done. Its words will keep coming back in reviews so they stay fresh.') : null,
      routeMap(),
      Q.bandUp ? h('div', { class:'levels' }, bandRow(Q.bandUp.band, true), h('p', { class:'small' }, BANDS[Q.bandUp.band] + ' went from ' + Q.bandUp.p0 + '% to ' + Q.bandUp.p1 + '%.')) : null);
  });
  /* 5. level up */
  if (lvUp) screens.push(() => { confetti(false); fanfare(true);
    return h('div', { class:'done-card center' }, h('div', { class:'medal lv-medal' }, h('span', {}, 'Lv'), h('b', {}, String(userLevel()))),
      h('p', { class:'eyebrow' }, 'Nuevo nivel · level up'), h('h2', {}, 'You reached level ' + userLevel()),
      h('p', { class:'done-note' }, levelSpan().need + ' XP to level ' + (userLevel() + 1) + '.')); });

  let si = 0;
  const done = $('#done');
  const paint = () => {
    done.innerHTML = '';
    const last = si === screens.length - 1;
    const node = screens[si]();
    node.classList.add('pop');
    done.append(node,
      screens.length > 1 ? h('div', { class:'dots', 'aria-hidden':'true' }, screens.map((_, i) => h('span', { class: i === si ? 'on' : '' }))) : null,
      h('button', { class:'btn primary wide', type:'button', id:'done-btn', onclick:() => {
        if (!last){ si++; paint(); window.scrollTo(0,0); } else { Q = null; renderHome(); show('home'); } } }, last ? 'Continue' : 'Next'));
    setTimeout(() => { const b = $('#done-btn'); if (b) b.focus(); }, 50);
  };
  show('done'); paint();
}

/* ---------- exercise renderers ---------- */
function head(ex){ return h('p', { class:'ex-label' }, ex.retry ? 'Try again: ' + ex.label : ex.label); }
function rPic(ex, st){
  let chosen = null; const btns = [];
  const grid = h('div', { class:'pic-grid' });
  ex.opts.forEach((it, i) => {
    const b = h('button', { class:'opt pic', type:'button', 'aria-pressed':'false', 'data-k':String(i+1) },
      h('span', { class:'k', 'aria-hidden':'true' }, String(i+1)),
      h('span', { class:'pic-top' }, blobArt(it.es[0], 'md')),
      h('span', { class:'pic-bottom', lang:'es' }, it.es[0]));
    b.addEventListener('click', () => { if (phase !== 'answer') return; chosen = it.es[0]; btns.forEach(x => x.setAttribute('aria-pressed', String(x === b))); say(it.es[0]); ctx.ready = true; syncBar(); });
    btns.push(b); grid.append(b); });
  st.append(h('div', { class:'ex' }, head(ex), grid));
  ctx = { ready:false, check:() => gradeExact(chosen, ex.answers), lock:() => btns.forEach((b, i) => { b.disabled = true;
    if (ex.opts[i].es[0] === ex.answers[0]) b.classList.add('right'); else if (ex.opts[i].es[0] === chosen) b.classList.add('wrong'); }) };
}
function rIntro(ex, st){
  const it = ex.item; setTimeout(() => say(it.es[0]), 250);
  st.append(h('div', { class:'ex intro' }, h('p', { class:'ex-label new' }, 'New word'),
    hasArt(it) ? h('div', { class:'intro-art' }, blobArt(it.es[0], 'lg')) : null,
    h('div', { class:'big-row' }, h('span', { class:'big', lang:'es' }, it.es[0]), audioBtns(it.es[0])),
    h('p', { class:'intro-en' }, it.en.slice(0,2).join(' · ')), it.hint ? h('p', { class:'hint' }, it.hint) : null));
}
function promptBlock(ex){
  if (ex.listen){ setTimeout(() => say(ex.listen), 250); return h('div', { class:'listen' }, audioBtns(ex.listen)); }
  const lang = ex.audio ? 'es' : 'en';
  return h('div', {}, h('div', { class:'big-row' }, h('span', { class:'big'+(ex.show.length > 28 ? ' long' : ''), lang }, ex.audio ? glossify(ex.show) : ex.show), ex.audio ? audioBtns(ex.audio) : null),
    ex.hint ? h('p', { class:'hint' }, ex.hint) : null,
    ex.audio && Q && ((Q.mode === 'lesson' && Q.level === 1) || S.stats.answers < 40) ? h('p', { class:'cue' }, 'Stuck? Hover over or tap a dotted word for a hint.') : null);
}
function rMC(ex, st){
  if (ex.audio) setTimeout(() => say(ex.audio), 250);
  let chosen = null; const btns = [];
  const grid = h('div', { class:'options' });
  ex.options.forEach((o, i) => { const b = h('button', { class:'opt', type:'button', 'aria-pressed':'false', 'data-k':String(i+1) },
      h('span', { class:'k', 'aria-hidden':'true' }, String(i+1)), h('span', { lang: ex.type === 'mc_es2en' ? 'en' : 'es' }, o));
    b.addEventListener('click', () => { if (phase !== 'answer') return; chosen = o; btns.forEach(x => x.setAttribute('aria-pressed', String(x === b))); if (ex.optAudio || ex.listen) say(o); ctx.ready = true; syncBar(); });
    btns.push(b); grid.append(b); });
  st.append(h('div', { class:'ex' }, head(ex), promptBlock(ex), grid));
  ctx = { ready:false, check:() => gradeExact(chosen, ex.answers), lock:() => btns.forEach((b, i) => { b.disabled = true;
    if (ex.answers.some(a => norm(a) === norm(ex.options[i]))) b.classList.add('right'); else if (ex.options[i] === chosen) b.classList.add('wrong'); }) };
}
function rDlg(ex, st){
  const chat = h('div', { class:'chat' }, ex.before.map((l, i) => h('button', { class:'bubble '+(l.who === ex.before[0].who ? 'l' : 'r'), type:'button', title:'Tap for the translation',
    onclick:(e) => { say(l.es[0]); e.currentTarget.classList.toggle('shown'); } },
    h('span', { class:'who' }, l.who), h('span', { lang:'es' }, l.es[0]), h('span', { class:'tr' }, l.en[0]))));
  let chosen = null; const btns = [];
  const grid = h('div', { class:'options' });
  ex.opts.forEach((l, i) => { const b = h('button', { class:'opt', type:'button', 'aria-pressed':'false', 'data-k':String(i+1) },
    h('span', { class:'k', 'aria-hidden':'true' }, String(i+1)), h('span', { lang:'es' }, l.es[0]));
    b.addEventListener('click', () => { if (phase !== 'answer') return; chosen = l.es[0]; btns.forEach(x => x.setAttribute('aria-pressed', String(x === b))); ctx.ready = true; syncBar(); });
    btns.push(b); grid.append(b); });
  st.append(h('div', { class:'ex' }, head(ex), chat, h('p', { class:'reply-cue' }, ex.who + ' replies:'), grid));
  ctx = { ready:false, check:() => gradeExact(chosen, ex.answers), lock:() => btns.forEach((b, i) => { b.disabled = true;
    if (ex.opts[i].es[0] === ex.answers[0]) b.classList.add('right'); else if (ex.opts[i].es[0] === chosen) b.classList.add('wrong'); }) };
}
function rTiles(ex, st){
  if (ex.audio) setTimeout(() => say(ex.audio), 250);
  const placed = []; const line = h('div', { class:'line', 'aria-label':'Your answer' }), bank = h('div', { class:'bank' });
  const draw = () => {
    line.innerHTML = ''; bank.innerHTML = '';
    placed.forEach((bi, pi) => line.append(h('button', { class:'tile', type:'button', lang:ex.to, onclick:() => { if (phase !== 'answer') return; placed.splice(pi,1); draw(); } }, ex.bank[bi])));
    ex.bank.forEach((t, bi) => { const used = placed.includes(bi);
      bank.append(h('button', { class:'tile'+(used ? ' gone' : ''), type:'button', lang:ex.to, disabled:used, 'aria-hidden': used ? 'true' : false,
        onclick:() => { if (phase !== 'answer') return; placed.push(bi); if (ex.to === 'es') say(t); draw(); } }, t)); });
    if (ctx){ ctx.ready = placed.length > 0; syncBar(); }
  };
  st.append(h('div', { class:'ex' }, head(ex), promptBlock(ex), line, bank));
  ctx = { ready:false, check:() => gradeExact(placed.map(i => ex.bank[i]).join(' '), ex.answers),
    lock:() => { st.querySelectorAll('.tile').forEach(b => b.disabled = true); } };
  draw();
}
function accentKeys(inp){
  return h('div', { class:'accents', 'aria-label':'Spanish characters' }, ['á','é','í','ó','ú','ñ','ü','¿','¡'].map(c =>
    h('button', { class:'key', type:'button', lang:'es', onmousedown:e => e.preventDefault(), onclick:() => {
      if (inp.disabled) return; const s = inp.selectionStart ?? inp.value.length, e2 = inp.selectionEnd ?? inp.value.length;
      inp.value = inp.value.slice(0,s) + c + inp.value.slice(e2); inp.focus(); inp.setSelectionRange(s+1, s+1); inp.dispatchEvent(new Event('input')); } }, c)));
}
function rType(ex, st){
  let top;
  if (ex.conj){ const v = ex.conj;
    top = h('div', { class:'conj' }, h('span', { class:'conj-verb', lang:'es' }, v.verb),
      h('span', { class:'conj-meta' }, VERB_EN[v.verb] + ', ' + TENSES[v.tense] + ' tense'),
      h('span', { class:'conj-person', lang:'es' }, PERSONS[v.p] + ' …'));
  } else top = promptBlock(ex);
  const inp = h('input', { id:'answer', class:'answer', type:'text', autocomplete:'off', autocapitalize:'off', autocorrect:'off', spellcheck:'false', lang:'es',
    'aria-label':'Your answer in Spanish', placeholder: ex.listen ? 'Type the Spanish you hear' : 'Type in Spanish' });
  inp.addEventListener('input', () => { ctx.ready = !!inp.value.trim(); syncBar(); });
  st.append(h('div', { class:'ex' }, head(ex), top, inp, accentKeys(inp)));
  ctx = { ready:false, check:() => ex.conj ? gradeStrict(inp.value, ex.answers) : gradeText(inp.value, ex.answers, true),
    lock:(res) => { inp.disabled = true; inp.classList.add(res.ok ? 'right' : 'wrong'); } };
  setTimeout(() => inp.focus({ preventScroll:true }), 60);
}
function rFill(ex, st){
  let chosen = null; const blank = h('span', { class:'blank', lang:'es' }, ' ');
  const btns = ex.options.map((o, i) => h('button', { class:'chip', type:'button', lang:'es', 'data-k':String(i+1), onclick:(e) => {
    if (phase !== 'answer') return; chosen = o; blank.textContent = o; blank.classList.add('filled');
    btns.forEach(b => b.setAttribute('aria-pressed', String(b === e.currentTarget))); ctx.ready = true; syncBar(); } }, o));
  st.append(h('div', { class:'ex' }, head(ex),
    h('p', { class:'fill-line', lang:'es' }, glossify(ex.preW), ex.preW ? ' ' : '', ex.lead, blank, ex.trail, ex.postW ? ' ' : '', glossify(ex.postW)),
    h('p', { class:'hint en' }, ex.en), h('div', { class:'chips' }, btns)));
  ctx = { ready:false, check:() => gradeExact(chosen, ex.answers), lock:(res) => { btns.forEach(b => b.disabled = true); blank.classList.add(res.ok ? 'right' : 'wrong'); if (res.ok) say(ex.full); } };
}
function rMatch(ex, st){
  const left = shuffle(ex.items), right = shuffle(ex.items);
  let selL = null, selR = null, mistakes = 0, matched = 0; const penal = new Set();
  const L = h('div', { class:'col' }), Rr = h('div', { class:'col' });
  const lb = left.map(it => h('button', { class:'pair', type:'button', lang:'es', onclick:(e) => { say(it.es[0]); selL = { it, b:e.currentTarget }; mark(); try2(); } }, it.es[0]));
  const rb = right.map(it => h('button', { class:'pair', type:'button', lang:'en', onclick:(e) => { selR = { it, b:e.currentTarget }; mark(); try2(); } }, it.en[0]));
  function mark(){ lb.concat(rb).forEach(b => b.setAttribute('aria-pressed', String((selL && selL.b === b) || (selR && selR.b === b)))); }
  function try2(){
    if (!selL || !selR) return;
    const a = selL, b = selR; selL = selR = null;
    if (a.it.key === b.it.key){
      a.b.disabled = b.b.disabled = true; a.b.classList.add('done'); b.b.classList.add('done');
      if (!penal.has(a.it.key)) rec(a.it.key, true); matched++;
      if (matched === ex.items.length){ save(); ctx.ready = true; resolve({ ok: mistakes === 0, noRecord:true }); }
    } else {
      mistakes++; if (!penal.has(a.it.key)){ penal.add(a.it.key); rec(a.it.key, false); Q.missed.add(a.it.key); }
      [a.b, b.b].forEach(x => { x.classList.add('shake'); setTimeout(() => x.classList.remove('shake'), 400); }); sfx(false);
    }
    mark();
  }
  L.append(...lb); Rr.append(...rb);
  st.append(h('div', { class:'ex' }, head(ex), h('div', { class:'match' }, L, Rr)));
  ctx = { ready:false, check:() => ({ ok: mistakes === 0, noRecord:true }) };
}
function rSpeak(ex, st){
  const out = h('p', { class:'heard', 'aria-live':'polite' }, '');
  let rec1 = null, listening = false, said = '';
  const mic = h('button', { class:'mic', type:'button', html:ICON.mic + '<span>Tap and speak</span>', onclick:() => {
    if (phase !== 'answer') return;
    if (listening){ try { rec1.stop(); } catch(e){} return; }
    try { rec1 = new SR(); } catch(e){ micBlocked = true; return skip('Speech recognition is not available in this browser.'); }
    rec1.lang = 'es-ES'; rec1.interimResults = false; rec1.maxAlternatives = 3;
    rec1.onresult = (e) => { const alts = [...e.results[0]].map(r => r.transcript); said = alts[0];
      out.innerHTML = 'You said: <b lang="es">' + esc(said) + '</b>'; ctx.best = alts; ctx.ready = true; syncBar(); };
    rec1.onerror = (e) => { if (/not-allowed|service-not-allowed|audio-capture/.test(e.error)){ micBlocked = true; skip('The microphone isn\'t available here. Speaking practice works on your own site in Chrome or Edge.'); }
      else out.textContent = 'Didn\'t catch that. Tap and try again.'; };
    rec1.onend = () => { listening = false; mic.classList.remove('on'); };
    try { rec1.start(); listening = true; mic.classList.add('on'); out.textContent = 'Listening…'; } catch(e){ out.textContent = 'Couldn\'t start the microphone.'; }
  } });
  function skip(msg){ Q.noSpeak = true; ctx.ready = true; resolve({ skip:true, msg }); }
  st.append(h('div', { class:'ex' }, head(ex),
    h('div', { class:'big-row' }, h('span', { class:'big long', lang:'es' }, glossify(ex.show)), audioBtns(ex.show)),
    h('p', { class:'hint en' }, ex.en), mic, out,
    h('button', { class:'btn text', type:'button', onclick:() => skip('Speaking is off for the rest of this session.') }, 'Can\'t talk right now')));
  ctx = { ready:false, best:[], check:() => {
    const want = deacc(norm(ex.answers[0])).split(' ');
    let bestScore = 0;
    for (const a of ctx.best){ const got = deacc(norm(a)).split(' '); const hit = want.filter(w => got.includes(w)).length; bestScore = Math.max(bestScore, hit / want.length); }
    return bestScore >= 0.75 ? { ok:true, note: bestScore < 1 ? 'Close enough. Listen once more to polish it.' : '' } : { ok:false, note:'Try to say every word. Tap play to hear it again.' };
  } };
}

/* ---------- word hints ---------- */
function glossify(text){
  const out = []; const words = String(text || '').split(/\s+/).filter(Boolean);
  let i = 0;
  while (i < words.length){
    let n = 1, g = null;
    for (let k = Math.min(4, words.length - i); k >= 2; k--){
      const key = words.slice(i, i+k).map(w => clean(w).toLowerCase()).join(' ');
      if (PHRASES[key]){ n = k; g = PHRASES[key]; break; }
    }
    if (!g){ const k = clean(words[i]).toLowerCase(); g = GLOSS[k] || WG[k] || null; }
    const raw = words.slice(i, i+n).join(' ');
    const lead = raw.match(/^[¿¡]*/)[0], trail = raw.match(/[?!.,;:]*$/)[0], core = raw.slice(lead.length, raw.length - trail.length);
    if (lead) out.push(lead);
    out.push(g && core ? h('span', { class:'w', tabindex:'0', 'data-g':g }, core) : core);
    if (trail) out.push(trail);
    i += n; if (i < words.length) out.push(' ');
  }
  return h('span', { class:'gl', lang:'es' }, out);
}
let tipFor = null;
function showTip(el){
  const t = $('#wtip'); t.textContent = el.getAttribute('data-g'); t.hidden = false; tipFor = el;
  document.querySelectorAll('.w.on').forEach(x => x.classList.remove('on')); el.classList.add('on');
  const r = el.getBoundingClientRect(), tw = t.offsetWidth, th = t.offsetHeight, vw = document.documentElement.clientWidth;
  let top = r.top - th - 8; if (top < 8) top = r.bottom + 8;
  const left = Math.max(8, Math.min(vw - tw - 8, r.left + r.width/2 - tw/2));
  t.style.top = top + 'px'; t.style.left = left + 'px';
}
function hideTip(){ const t = document.getElementById('wtip'); if (t) t.hidden = true; tipFor = null; document.querySelectorAll('.w.on').forEach(x => x.classList.remove('on')); }
function wireTips(){
  let touch = false;
  document.addEventListener('touchstart', () => { touch = true; }, { passive:true });
  document.addEventListener('mouseover', e => { if (touch) return; const w = e.target.closest && e.target.closest('.w'); if (w) showTip(w); });
  document.addEventListener('mouseout', e => { if (touch) return; const w = e.target.closest && e.target.closest('.w'); if (w && !w.contains(e.relatedTarget)) hideTip(); });
  document.addEventListener('focusin', e => { if (e.target.classList && e.target.classList.contains('w')) showTip(e.target); });
  document.addEventListener('focusout', e => { if (e.target.classList && e.target.classList.contains('w')) hideTip(); });
  document.addEventListener('click', e => { const w = e.target.closest && e.target.closest('.w');
    if (w){ showTip(w); say(w.textContent); } else hideTip(); });
  window.addEventListener('scroll', hideTip, { passive:true });
}

/* ---------- notes & settings sheets ---------- */
function openSheet(title, body){
  const sh = $('#sheet'); $('#sheet-title').textContent = title; const b = $('#sheet-body'); b.innerHTML = ''; b.append(...body);
  sh.hidden = false; document.body.classList.add('locked'); $('#sheet-close').focus();
}
function closeSheet(){ $('#sheet').hidden = true; document.body.classList.remove('locked'); }
function openNotes(i){
  const u = COURSE[i];
  const tables = (u.verbs || []).map(vk => { const [v,t] = vk.split('|');
    return h('div', { class:'vt-wrap' }, h('table', { class:'vt' }, h('caption', {}, h('span', { lang:'es' }, v), ', ' + VERB_EN[v] + ' (' + TENSES[t] + ')'),
      h('tbody', {}, PERSONS.map((p, pi) => h('tr', {}, h('th', { scope:'row', lang:'es' }, p), h('td', { lang:'es' }, VERBS[vk][pi])))))); });
  const row = it => h('li', {}, h('button', { class:'icon-btn tiny', type:'button', 'aria-label':'Play '+it.es[0], html:ICON.play, onclick:() => say(it.es[0]) }),
    h('span', { class:'m-es', lang:'es' }, it.es[0]), h('span', { class:'m-en' }, it.en[0]));
  const items = UNIT_ITEMS[u.id];
  openSheet(u.es, [
    h('p', { class:'eyebrow' }, 'Unit ' + (i+1) + ' · ' + u.band + ' · ' + u.en),
    h('div', { class:'tip' , html:u.tip }), ...tables,
    h('h3', {}, 'Words'), h('ul', { class:'vocab' }, items.filter(x => x.kind === 'w').map(row)),
    h('h3', {}, 'Sentences'), h('ul', { class:'vocab' }, items.filter(x => x.kind === 's').map(row)),
    u.lines ? h('h3', {}, 'Conversation') : null,
    u.lines ? h('ul', { class:'vocab' }, u.lines.map(l => h('li', {}, h('button', { class:'icon-btn tiny', type:'button', 'aria-label':'Play line', html:ICON.play, onclick:() => say(l.es[0]) }),
      h('span', { class:'m-es', lang:'es' }, h('b', {}, l.who + ': '), l.es[0]), h('span', { class:'m-en' }, l.en[0])))) : null
  ].filter(Boolean));
}
function backupCode(){ return btoa(unescape(encodeURIComponent(JSON.stringify(S)))); }
function openSettings(){ openSheet('Settings', settingsNodes()); }
function settingsNodes(){
  pickVoice();
  const rate = h('input', { id:'set-rate', type:'range', min:'0.6', max:'1.1', step:'0.05', value:String(S.settings.rate) });
  const rateOut = h('output', { for:'set-rate' }, Math.round(S.settings.rate*100) + '%');
  rate.addEventListener('input', () => { S.settings.rate = +rate.value; rateOut.textContent = Math.round(S.settings.rate*100) + '%'; save(); });
  const goal = h('select', { id:'set-goal' }, [10,20,30,50,80].map(g => h('option', { value:String(g), selected: S.settings.goal === g }, g + ' XP a day')));
  goal.addEventListener('change', () => { S.settings.goal = +goal.value; save(); });
  const tog = (id, key, label, note) => { const c = h('input', { id, type:'checkbox', checked:S.settings[key] });
    c.addEventListener('change', () => { S.settings[key] = c.checked; save(); });
    return h('label', { class:'switch', for:id }, c, h('span', {}, label, note ? h('small', {}, note) : null)); };
  const code = h('textarea', { id:'set-code', readonly:true, rows:'3' }, backupCode());
  const restore = h('textarea', { id:'set-restore', rows:'3', placeholder:'Paste a backup code here' });
  const status = h('p', { class:'status', 'aria-live':'polite' });
  const confirmRow = h('div', { class:'confirm', hidden:true }, h('span', {}, 'This erases every unit, streak and review. Sure?'),
    h('button', { class:'btn small danger', type:'button', onclick:() => { S = fresh(); save(); closeSheet(); SC.feed = []; renderHome(); toast('Progress reset.'); } }, 'Yes, reset'),
    h('button', { class:'btn small text', type:'button', onclick:() => confirmRow.hidden = true }, 'Cancel'));
  const seg = h('div', { class:'seg', role:'group', 'aria-label':'Appearance' }, [['system','Auto'],['light','Light'],['dark','Dark']].map(([v, l]) =>
    h('button', { class:'chip' + ((S.settings.theme || 'system') === v ? ' on' : ''), type:'button', 'aria-pressed': String((S.settings.theme || 'system') === v),
      onclick:() => setTheme(v) }, l)));
  return [
    (() => { const inp = h('input', { id:'set-name', class:'answer', type:'text', maxlength:'24', autocomplete:'given-name', placeholder:'Your first name', value:S.settings.name || '' });
      inp.addEventListener('change', () => { S.settings.name = inp.value.trim(); save(); renderHome(); });
      return h('div', { class:'field' }, h('label', { for:'set-name' }, 'Your name'), inp, h('p', { class:'small' }, 'Shown as your profile picture. Leave it empty to use Sol.')); })(),
    h('div', { class:'field' }, h('span', { class:'lbl' }, 'Appearance'), seg, h('p', { class:'small' }, 'Auto follows your phone or computer.')),
    (() => { const all = esVoices();
      const sel = h('select', { id:'set-voice' }, all.map(v => h('option', { value:vid(v), selected: VOICE && vid(v) === vid(VOICE) }, vLabel(v))));
      sel.addEventListener('change', () => { S.settings.voice = sel.value; save(); pickVoice(); say('Hola, ¿qué tal? Vamos a aprender español.'); });
      const anyMale = all.some(isMale);
      return h('div', { class:'field' }, h('label', { for:'set-voice' }, 'Voice'),
        all.length ? sel : h('p', { class:'small' }, 'No Spanish voice found on this device, so listening exercises are skipped.'),
        h('p', { class:'small' }, anyMale ? 'Enhanced, Premium and Natural voices are the clearest. On iPhone, download them in Settings › Accessibility › Spoken Content › Voices › Spanish, then reopen Ruta.'
          : 'This browser has no male Spanish voice. Open Ruta in Microsoft Edge for the clear male voice Álvaro.')); })(),
    h('div', { class:'field' }, h('label', { for:'set-rate' }, 'Voice speed'), h('div', { class:'range' }, rate, rateOut),
      h('button', { class:'btn small soft', type:'button', onclick:() => say('Hola, ¿qué tal? Vamos a aprender español.') }, 'Test voice')),
    h('div', { class:'field' }, h('label', { for:'set-goal' }, 'Daily goal'), goal),
    tog('set-speak', 'speak', 'Speaking exercises', SR ? 'Uses your microphone in Chrome, Edge or Safari.' : 'Not supported in this browser.'),
    tog('set-sfx', 'sfx', 'Sound effects'),
    h('h3', {}, 'Move your progress'),
    h('p', { class:'small' }, 'Progress lives in this browser. Copy this code, then paste it into Ruta on your other device.'),
    code, h('button', { class:'btn small soft', type:'button', onclick:() => {
      code.value = backupCode();
      const done = () => status.textContent = 'Backup code copied.';
      try { navigator.clipboard.writeText(code.value).then(done, () => { code.select(); status.textContent = 'Press Ctrl+C or Cmd+C to copy.'; }); }
      catch(e){ code.select(); status.textContent = 'Press Ctrl+C or Cmd+C to copy.'; } } }, 'Copy backup code'),
    restore, h('button', { class:'btn small soft', type:'button', onclick:() => {
      try { const o = JSON.parse(decodeURIComponent(escape(atob(restore.value.trim())))); if (!o || !o.srs) throw 0;
        adopt(o); save(); applyTheme(S.settings.theme); renderHome(); status.textContent = 'Progress restored.'; }
      catch(e){ status.textContent = 'That code didn\'t work. Copy the whole code and try again.'; } } }, 'Restore from code'),
    status,
    h('h3', {}, 'Start over'),
    h('button', { class:'btn small danger-ghost', type:'button', onclick:() => confirmRow.hidden = false }, 'Reset all progress'), confirmRow
  ];
}

/* ---------- boot ---------- */
function boot(){
  load();
  applyTheme(S.settings.theme);
  if (darkMQ) (darkMQ.addEventListener ? darkMQ.addEventListener('change', () => { syncThemeColor(); if (!$('#home').hidden) renderHome(); }) : darkMQ.addListener(syncThemeColor));
  pickVoice();
  [300, 1000, 2500, 5000].forEach(t => setTimeout(() => { const before = VOICE && vid(VOICE); pickVoice(); pickEnVoice(); if ((VOICE && vid(VOICE)) !== before && !$('#home').hidden && (TAB === 'listen' || TAB === 'me')) renderHome(); }, t));
  if (TTS && 'onvoiceschanged' in speechSynthesis) speechSynthesis.onvoiceschanged = () => { pickVoice(); pickEnVoice(); if (TAB === 'listen' && !$('#home').hidden) renderHome(); };
  wireTips(); watchStuck();
  const mb = $('#mascot .m-body'); if (mb) mb.innerHTML = SOL_SVG;
  $('#bar-btn').addEventListener('click', onBar);
  $('#sheet-close').addEventListener('click', closeSheet);
  $('#sheet').addEventListener('click', e => { if (e.target.id === 'sheet') closeSheet(); });
  $('#close-lesson').addEventListener('click', () => { $('#quit').hidden = false; $('#quit-keep').focus(); });
  $('#quit-keep').addEventListener('click', () => $('#quit').hidden = true);
  $('#quit-go').addEventListener('click', () => { save(); Q = null; renderHome(); show('home'); });
  document.addEventListener('keydown', e => {
    if (!$('#sheet').hidden){ if (e.key === 'Escape') closeSheet(); return; }
    if (!Q || $('#lesson').hidden) return;
    const typing = document.activeElement && /INPUT|TEXTAREA/.test(document.activeElement.tagName);
    if (e.key === 'Enter'){ if (document.activeElement && document.activeElement.tagName === 'BUTTON' && document.activeElement.id !== 'bar-btn' && phase === 'answer') return; e.preventDefault(); onBar(); }
    else if (!typing && phase === 'answer' && /^[1-9]$/.test(e.key)){ const b = $('#stage [data-k="'+e.key+'"]'); if (b) b.click(); }
  });
  renderHome(); show('home');
}
if (typeof document !== 'undefined' && document.getElementById('home')) boot();
