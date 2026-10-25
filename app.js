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
  1: ['mc_es2en','mc_es2en','mc_en2es','listen_mc','tiles_es2en','tiles_es2en','match','fill'],
  2: ['mc_en2es','tiles_en2es','tiles_es2en','type_w','type_w','fill','listen_w','conj','conj','dlg','match'],
  3: ['type_w','type_s','type_s','listen_s','speak','conj','conj','tiles_en2es','dlg','fill','listen_w']
};
const TYPES = {
  mc_es2en:{k:['w','s']}, mc_en2es:{k:['w']}, listen_mc:{k:['w'],audio:1}, match:{k:['w']},
  tiles_es2en:{k:['s']}, tiles_en2es:{k:['s']}, fill:{k:['s']}, type_w:{k:['w']}, type_s:{k:['s']},
  listen_w:{k:['w'],audio:1}, listen_s:{k:['s'],audio:1}, speak:{k:['s'],mic:1}, conj:{k:['v']}, dlg:{k:['d']}
};

/* ---------- state ---------- */
function fresh(){ return { v:1, units:{}, srs:{}, xp:0, today:{d:'',xp:0}, streak:{n:0,last:''},
  settings:{ rate:0.9, goal:30, speak:true, sfx:true }, stats:{ answers:0, correct:0 } }; }
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
      return Object.assign(ex, { t:'fill', label:'Fill in the blank', pre:(pre ? pre+' ' : '')+lead, post:trail+(post ? ' '+post : ''),
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
    let cands = pool.filter(i => kinds.includes(i.kind));
    if (level >= 2 && !test && Math.random() < 0.2){ const rc = older.filter(i => kinds.includes(i.kind)); if (rc.length) cands = rc; }
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
  if (item.kind === 'w') opts = b <= 2 ? ['mc_es2en','mc_en2es','listen_mc'] : ['type_w','listen_w','type_w'];
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
function pickVoice(){
  if (!TTS) return; const vs = speechSynthesis.getVoices();
  VOICE = vs.find(v => /^es[-_]ES/i.test(v.lang)) || vs.find(v => /^es[-_](MX|US|419)/i.test(v.lang)) || vs.find(v => /^es/i.test(v.lang)) || null;
}
function say(text, slow){
  if (!TTS) return;
  try { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text);
    u.lang = VOICE ? VOICE.lang : 'es-ES'; if (VOICE) u.voice = VOICE; u.rate = S.settings.rate * (slow ? 0.6 : 1);
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
function show(id){ ['home','lesson','done'].forEach(s => $('#'+s).hidden = s !== id); window.scrollTo(0,0); }

/* ---------- home ---------- */
function currentUnit(){
  for (let i=0;i<COURSE.length;i++) if (unlocked(i) && lvl(i) < 1) return i;
  for (let i=0;i<COURSE.length;i++) if (unlocked(i) && lvl(i) < 3) return i;
  return -1;
}
function renderHome(){
  const home = $('#home'); home.innerHTML = '';
  const goal = S.settings.goal, tx = todayXP(), due = dueItems().length, weak = weakItems().length, cur = currentUnit();
  home.append(
    h('header', { class:'top' },
      h('div', { class:'brand' }, h('span', { class:'mark', 'aria-hidden':'true' }),
        h('div', {}, h('h1', {}, 'Ruta'), h('p', { class:'sub' }, 'Spanish, one step at a time'))),
      h('button', { class:'icon-btn', type:'button', 'aria-label':'Settings', html:ICON.gear, onclick:openSettings })),
    h('section', { class:'stats', 'aria-label':'Your progress' },
      h('div', { class:'stat' }, h('span', { class:'stat-k' }, 'Streak'),
        h('span', { class:'stat-v streak' }, h('span', { class:'flame', html:ICON.flame }), String(streakNow()), h('small', {}, streakNow() === 1 ? ' day' : ' days'))),
      h('div', { class:'stat' }, h('span', { class:'stat-k' }, 'Today'),
        h('span', { class:'stat-v' }, String(tx), h('small', {}, ' / '+goal+' XP')),
        h('span', { class:'meter', role:'progressbar', 'aria-valuemin':'0', 'aria-valuemax':String(goal), 'aria-valuenow':String(Math.min(tx,goal)) },
          h('span', { style:'width:'+Math.min(100, Math.round(tx/goal*100))+'%' }))),
      h('div', { class:'stat' }, h('span', { class:'stat-k' }, 'Words known'), h('span', { class:'stat-v' }, String(learnedWords()), h('small', {}, ' / '+ALL.filter(i=>i.kind==='w').length)))),
    h('section', { class:'practice', 'aria-label':'Practice' },
      h('button', { class:'btn '+(due ? 'primary' : 'ghost'), type:'button', disabled: !due, onclick:() => startSession('review') },
        due ? 'Review '+due+' due' : 'Nothing due to review'),
      h('button', { class:'btn ghost', type:'button', disabled: !weak, onclick:() => startSession('mistakes') }, weak ? 'Fix mistakes ('+weak+')' : 'No weak spots'),
      h('button', { class:'btn ghost', type:'button', onclick:() => startSession('verbs') }, 'Verb drill'))
  );
  let band = '';
  let list = null;
  COURSE.forEach((u, i) => {
    if (u.band !== band){ band = u.band;
      home.append(h('h2', { class:'band' }, h('span', { class:'band-code' }, band), BANDS[band]));
      list = h('ol', { class:'path', start:String(i+1) }); home.append(list); }
    const L = lvl(i), open = unlocked(i);
    const pips = h('span', { class:'pips', 'aria-label':'Level '+L+' of 3' }, [1,2,3].map(n => h('span', { class: n <= L ? 'on' : '' })));
    const actions = h('div', { class:'unit-actions' });
    if (open){
      const label = L === 0 ? 'Start' : L < 3 ? LEVEL_NAMES[L+1] : 'Practise';
      actions.append(h('button', { class:'btn small '+(i === cur ? 'primary' : 'soft'), type:'button', onclick:() => startSession('lesson', i, Math.min(3, L+1)) }, label));
    } else {
      actions.append(h('button', { class:'btn small ghost', type:'button', onclick:() => startSession('test', i) }, 'Test out'));
    }
    actions.append(h('button', { class:'btn small text', type:'button', onclick:() => openNotes(i) }, 'Notes'));
    list.append(h('li', { class:'unit'+(open ? '' : ' locked')+(i === cur ? ' current' : '') },
      h('span', { class:'unit-n', 'aria-hidden':'true' }, String(i+1)),
      h('div', { class:'unit-t' }, h('span', { class:'unit-es', lang:'es' }, u.es), h('span', { class:'unit-en' }, u.en), pips),
      actions));
  });
  home.append(h('p', { class:'foot' }, 'Progress is saved in this browser. Use Settings to copy a backup code to another device.'));
}

/* ---------- sessions ---------- */
let Q = null, ctx = null, phase = 'answer';
function startSession(mode, ui, level){
  pickVoice();
  let queue = [];
  if (mode === 'lesson') queue = buildLesson(ui, level, false);
  else if (mode === 'test') queue = buildLesson(ui, 3, true);
  else if (mode === 'review') queue = buildReview();
  else if (mode === 'mistakes') queue = buildMistakes();
  else if (mode === 'verbs') queue = buildVerbs();
  if (!queue.length){ toast('Nothing to practise here yet.'); return; }
  Q = { mode, ui, level, queue, i:0, total:0, right:0, missed:new Set(), t0:Date.now(), noSpeak:false };
  $('#quit').hidden = true;
  show('lesson'); nextEx();
}
function progress(){
  const real = Q.queue.filter(e => e.t !== 'intro'), done = Q.queue.slice(0, Q.i).filter(e => e.t !== 'intro').length;
  $('#bar-fill').style.width = Math.round(done / real.length * 100) + '%';
}
function setBar(state, html, label, enabled){
  const b = $('#checkbar'); b.className = 'checkbar' + (state ? ' '+state : '');
  $('#bar-msg').innerHTML = html || ''; const btn = $('#bar-btn'); btn.textContent = label; btn.disabled = !enabled;
}
function syncBar(){ $('#bar-btn').disabled = !(ctx && ctx.ready); }
function nextEx(){
  while (Q.i < Q.queue.length && Q.queue[Q.i].t === 'speak' && !canDo('speak', Q)) Q.i++;
  if (Q.i >= Q.queue.length) return finish();
  progress();
  const ex = Q.queue[Q.i], stage = $('#stage'); stage.innerHTML = ''; ctx = null; phase = 'answer';
  const R = { intro:rIntro, mc:rMC, tiles:rTiles, type:rType, fill:rFill, match:rMatch, speak:rSpeak, dlg:rDlg }[ex.t];
  R(ex, stage);
  if (ex.t === 'intro'){ phase = 'next'; setBar('', '', 'Continue', true); }
  else if (ex.t === 'match'){ setBar('', 'Tap a Spanish word, then its meaning.', 'Check', false); }
  else setBar('', '', 'Check', false);
  stage.querySelector('.ex') && stage.querySelector('.ex').classList.add('in');
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
    if (!res.ok && Q.mode !== 'test' && ex.t !== 'match'){ const again = makeEx(ex.type, ex.item); if (again){ again.retry = true; Q.queue.push(again); } }
    save();
  }
  if (res.skip){ setBar('', res.msg || '', 'Continue', true); return; }
  sfx(res.ok);
  const extra = ex.reveal ? '<span class="mean">'+esc(ex.reveal)+'</span>' : '';
  if (res.ok) setBar('good', '<b class="verdict">'+pick(PRAISE)+'</b>'+(res.note ? '<span>'+res.note+'</span>' : '')+extra, 'Continue', true);
  else {
    const ans = ex.t === 'match' ? '' : '<span>Correct answer: <b lang="'+(ex.to === 'en' || ex.type === 'mc_es2en' ? 'en' : 'es')+'">'+esc(ex.answers[0])+'</b></span>';
    setBar('bad', '<b class="verdict">'+(ex.t === 'match' ? 'Done, with a few slips' : 'Not quite')+'</b>'+(res.note ? '<span>'+res.note+'</span>' : '')+ans+extra, 'Continue', true);
  }
  $('#bar-btn').focus({ preventScroll:true });
}
function finish(){
  const acc = Q.total ? Math.round(Q.right / Q.total * 100) : 100;
  const xp = Q.right + (Q.mode === 'lesson' ? 5 : 3);
  let title = 'Session complete', note = '';
  if (Q.mode === 'lesson'){
    const u = COURSE[Q.ui]; const before = lvl(Q.ui); S.units[u.id] = Math.max(before, Q.level);
    title = u.es + ': ' + LEVEL_NAMES[Q.level] + ' complete';
    if (before < 1 && Q.level === 1 && Q.ui + 1 < COURSE.length) note = 'Unit ' + (Q.ui + 2) + ', ' + COURSE[Q.ui+1].es + ', is now open.';
  } else if (Q.mode === 'test'){
    const wrong = Q.total - Q.right;
    if (wrong <= 2){ for (let i=0;i<=Q.ui;i++) S.units[COURSE[i].id] = Math.max(lvl(i), 1); title = 'Test passed'; note = 'Units up to ' + COURSE[Q.ui].es + ' are now open.'; }
    else { title = 'Not this time'; note = 'You missed ' + wrong + '. Passing needs 2 or fewer. The earlier units will get you there.'; }
  } else if (Q.mode === 'review') title = 'Review complete';
  else if (Q.mode === 'mistakes') title = 'Weak spots practised';
  else if (Q.mode === 'verbs') title = 'Verb drill complete';
  addXP(xp); bumpStreak(); save();
  const secs = Math.round((Date.now() - Q.t0) / 1000);
  const missed = [...Q.missed].map(k => ITEMS[k]).filter(Boolean);
  const done = $('#done'); done.innerHTML = '';
  done.append(h('div', { class:'done-card' },
    h('p', { class:'eyebrow' }, todayXP() >= S.settings.goal ? 'Daily goal reached' : 'Nice work'),
    h('h2', {}, title), note ? h('p', { class:'done-note' }, note) : null,
    h('dl', { class:'done-stats' },
      h('div', {}, h('dt', {}, 'XP earned'), h('dd', {}, '+'+xp)),
      h('div', {}, h('dt', {}, 'Accuracy'), h('dd', {}, acc+'%')),
      h('div', {}, h('dt', {}, 'Time'), h('dd', {}, Math.floor(secs/60)+':'+String(secs%60).padStart(2,'0')))),
    missed.length ? h('div', { class:'missed' }, h('h3', {}, 'Worth another look'),
      h('ul', {}, missed.map(it => h('li', {}, h('button', { class:'icon-btn tiny', type:'button', 'aria-label':'Play', html:ICON.play, onclick:() => say(it.es[0]) }),
        h('span', { lang:'es', class:'m-es' }, it.es[0]), h('span', { class:'m-en' }, it.kind === 'v' ? it.en[0] : it.en[0]))))) : h('p', { class:'done-note' }, 'No mistakes. These will come back for review when they start to fade.'),
    h('button', { class:'btn primary wide', type:'button', id:'done-btn', onclick:() => { Q = null; renderHome(); show('home'); } }, 'Continue')));
  show('done'); setTimeout(() => $('#done-btn').focus(), 50);
}

/* ---------- exercise renderers ---------- */
function head(ex){ return h('p', { class:'ex-label' }, ex.retry ? 'Try again: ' + ex.label : ex.label); }
function rIntro(ex, st){
  const it = ex.item; setTimeout(() => say(it.es[0]), 250);
  st.append(h('div', { class:'ex intro' }, h('p', { class:'ex-label new' }, 'New word'),
    h('div', { class:'big-row' }, h('span', { class:'big', lang:'es' }, it.es[0]), audioBtns(it.es[0])),
    h('p', { class:'intro-en' }, it.en.slice(0,2).join(' · ')), it.hint ? h('p', { class:'hint' }, it.hint) : null));
}
function promptBlock(ex){
  if (ex.listen){ setTimeout(() => say(ex.listen), 250); return h('div', { class:'listen' }, audioBtns(ex.listen)); }
  const lang = ex.audio ? 'es' : 'en';
  return h('div', {}, h('div', { class:'big-row' }, h('span', { class:'big'+(ex.show.length > 28 ? ' long' : ''), lang }, ex.show), ex.audio ? audioBtns(ex.audio) : null),
    ex.hint ? h('p', { class:'hint' }, ex.hint) : null);
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
    h('p', { class:'fill-line', lang:'es' }, ex.pre, blank, ex.post),
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
    h('div', { class:'big-row' }, h('span', { class:'big long', lang:'es' }, ex.show), audioBtns(ex.show)),
    h('p', { class:'hint en' }, ex.en), mic, out,
    h('button', { class:'btn text', type:'button', onclick:() => skip('Speaking is off for the rest of this session.') }, 'Can\'t talk right now')));
  ctx = { ready:false, best:[], check:() => {
    const want = deacc(norm(ex.answers[0])).split(' ');
    let bestScore = 0;
    for (const a of ctx.best){ const got = deacc(norm(a)).split(' '); const hit = want.filter(w => got.includes(w)).length; bestScore = Math.max(bestScore, hit / want.length); }
    return bestScore >= 0.75 ? { ok:true, note: bestScore < 1 ? 'Close enough. Listen once more to polish it.' : '' } : { ok:false, note:'Try to say every word. Tap play to hear it again.' };
  } };
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
function openSettings(){
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
    h('button', { class:'btn small danger', type:'button', onclick:() => { S = fresh(); save(); closeSheet(); renderHome(); toast('Progress reset.'); } }, 'Yes, reset'),
    h('button', { class:'btn small text', type:'button', onclick:() => confirmRow.hidden = true }, 'Cancel'));
  openSheet('Settings', [
    h('div', { class:'field' }, h('label', { for:'set-rate' }, 'Voice speed'), h('div', { class:'range' }, rate, rateOut),
      h('button', { class:'btn small soft', type:'button', onclick:() => say('Hola, ¿qué tal? Vamos a aprender español.') }, 'Test voice'),
      h('p', { class:'small' }, VOICE ? 'Using voice: ' + VOICE.name + ' (' + VOICE.lang + ')' : 'No Spanish voice found on this device, so listening exercises are skipped. Most phones and Chrome include one.')),
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
        adopt(o); save(); renderHome(); status.textContent = 'Progress restored.'; }
      catch(e){ status.textContent = 'That code didn\'t work. Copy the whole code and try again.'; } } }, 'Restore from code'),
    status,
    h('h3', {}, 'Start over'),
    h('button', { class:'btn small danger-ghost', type:'button', onclick:() => confirmRow.hidden = false }, 'Reset all progress'), confirmRow
  ]);
}

/* ---------- boot ---------- */
function boot(){
  load(); pickVoice();
  if (TTS && 'onvoiceschanged' in speechSynthesis) speechSynthesis.onvoiceschanged = pickVoice;
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
