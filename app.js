/* =========================================================================
   Dhikr Garden Grower — app shell (vanilla JS, 100% client-side)
   -------------------------------------------------------------------------
   CONTENT CONTRACT — content/data.js (written separately) sets window.DG_CONTENT.
   The app tolerates it being missing/partial, and reads BOTH key families:

   Provisional keys:  dhikr[], unlockStages[] (+dhikrIds), tahlilSpecials{},
                      secret{}, daily{morning[],evening[]}, articles[]
                      ({title,url,excerpt}), gettingStarted[], seasons[]
                      ({hijriMonths[],greeting}), generalPresets[],
                      per-dhikr dhikr[].milestones{cumulative{},single{}}.

   Real data.js keys: practiceDhikr[] ({id,arabic,transliteration,
                      translation,target,virtue,flower{name,emoji},stage}),
                      unlockStages[] ({stage,name,sessionsRequired}),
                      learningPath[] ({stage,title,description,dhikrIds}),
                      milestones{ perDhikr[], tierRarity{},
                        flowers{dhikrId:{cumulative{},single{}}},
                        specials[] ({threshold,name,emoji,rarity,dhikrId}),
                        goldenVariants{dhikrId:{name,emoji}},
                        secret{name,emoji,rarity,threshold} },
                      dailyRhythm{morning[],evening[]} ({arabic,
                        transliteration,translation,count}),
                      articles[] ({title,description,url,embed}),
                      seasons[] ({name,hijriMonth,description}),
                      gettingStarted[] ({title,body}).

   EVERY read below tolerates DG_CONTENT being missing or partial.
   ========================================================================= */
'use strict';

/* ---------------- safe storage (never throws) ---------------- */
function safeGet(key, fallback) {
  try {
    var v = window.localStorage.getItem(key);
    if (v === null || v === undefined) return fallback;
    return JSON.parse(v);
  } catch (e) { return fallback; }
}
function safeSet(key, val) {
  try { window.localStorage.setItem(key, JSON.stringify(val)); return true; }
  catch (e) { return false; }
}

/* ---------------- tiny utils ---------------- */
function esc(s) {
  return String(s === undefined || s === null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function pad2(n) { return (n < 10 ? '0' : '') + n; }
function uid() {
  return 'f' + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36);
}
function todayKey(d) {
  d = d || new Date();
  return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}
function fmtNum(n) {
  n = Number(n) || 0;
  try { return n.toLocaleString('en-US'); } catch (e) { return String(n); }
}
function fmtClock(date) {
  try {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  } catch (e) { return ''; }
}
function el(id) { return document.getElementById(id); }

/* ---------------- content accessors (all defensive) ----------------
   Reads BOTH the provisional contract keys and the real data.js keys: */
var D = (typeof window.DG_CONTENT === 'object' && window.DG_CONTENT) ? window.DG_CONTENT : {};

function getDhikr() {
  var list = Array.isArray(D.dhikr) ? D.dhikr
    : (Array.isArray(D.practiceDhikr) ? D.practiceDhikr : []);
  return list.filter(function (d) { return d && d.id; });
}
function dhikrById(id) {
  var list = getDhikr();
  for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return null;
}
function getStages() {
  var s = Array.isArray(D.unlockStages) ? D.unlockStages : [];
  return s.filter(function (x) { return x && x.name; }).slice(0, 5);
}
function getDaily() {
  var d = (D.daily && typeof D.daily === 'object') ? D.daily
    : ((D.dailyRhythm && typeof D.dailyRhythm === 'object') ? D.dailyRhythm : {});
  return {
    morning: Array.isArray(d.morning) ? d.morning : [],
    evening: Array.isArray(d.evening) ? d.evening : []
  };
}
function getArticles() {
  var a = Array.isArray(D.articles) ? D.articles : [];
  return a.filter(function (x) { return x && (x.title || x.url); });
}
function getSteps() {
  var s = Array.isArray(D.gettingStarted) ? D.gettingStarted : [];
  return s.filter(function (x) { return x && x.title; }).slice(0, 4);
}
function getSeasons() {
  var s = Array.isArray(D.seasons) ? D.seasons : [];
  return s.filter(function (x) {
    return x && (Array.isArray(x.hijriMonths) || typeof x.hijriMonth === 'number');
  });
}
function getSecret() {
  var s = (D.milestones && D.milestones.secret && typeof D.milestones.secret === 'object') ? D.milestones.secret
    : ((D.secret && typeof D.secret === 'object') ? D.secret : {});
  return {
    name: s.name || 'Diamond Desert Rose',
    threshold: Number(s.threshold) > 0 ? Number(s.threshold) : 1000000,
    emoji: s.emoji || '💎',
    rarity: s.rarity || 'Secret',
    note: s.note || s.description || ''
  };
}
function getSpecials() {
  var out = {};
  var arr = (D.milestones && Array.isArray(D.milestones.specials)) ? D.milestones.specials : [];
  for (var i = 0; i < arr.length; i++) {
    var sp = arr[i];
    if (sp && Number(sp.threshold) > 0) {
      out[String(sp.threshold)] = {
        name: sp.name || 'Special bloom', emoji: sp.emoji || '🌺',
        rarity: sp.rarity || 'Special', dhikrId: sp.dhikrId || null
      };
    }
  }
  var legacy = (D.tahlilSpecials && typeof D.tahlilSpecials === 'object') ? D.tahlilSpecials : {};
  ['10000', '70000'].forEach(function (T) {
    if (!out[T]) {
      var o = (legacy[T] && typeof legacy[T] === 'object') ? legacy[T] : {};
      out[T] = {
        name: o.name || (T === '10000' ? 'Celestial Orchid' : 'Twin Constellation Bloom'),
        emoji: o.emoji || '🌺',
        rarity: o.rarity || (T === '10000' ? 'Legendary' : 'Mythic')
      };
    }
  });
  return out;
}
function getGeneralPresets() {
  var p = Array.isArray(D.generalPresets) ? D.generalPresets : [];
  p = p.filter(function (x) { return Number(x) > 0; }).map(Number);
  return p.length ? p.slice(0, 4) : [33, 100, 1000];
}

/* The dhikr whose cumulative total drives the 10k/70k specials (tahlil). */
function findTahlil() {
  var list = getDhikr();
  var i, d;
  for (i = 0; i < list.length; i++) {
    if (String(list[i].id).toLowerCase().indexOf('tahlil') !== -1) return list[i];
  }
  for (i = 0; i < list.length; i++) {
    d = list[i];
    var t = String(d.transliteration || '').toLowerCase();
    if (t.indexOf('la ilaha illa') !== -1 || t.indexOf('la ilaha illa allah') !== -1) return d;
  }
  return null;
}

var MILESTONE_TIERS = [100, 500, 1000];
var TIER_RARITY = { 100: 'Common', 500: 'Uncommon', 1000: 'Rare' };

function milestoneFlower(dh, tier, kind) {
  // kind: 'cumulative' | 'single'
  // sources: dh.milestones (contract) OR D.milestones.flowers[dhikrId] (data.js)
  var m = (dh && dh.milestones && dh.milestones[kind]) ? dh.milestones[kind] : {};
  var dmKind = {};
  try {
    if (dh && D.milestones && D.milestones.flowers && D.milestones.flowers[dh.id]) {
      dmKind = D.milestones.flowers[dh.id][kind] || {};
    }
  } catch (e) { dmKind = {}; }
  var o = null;
  if (m[String(tier)] && typeof m[String(tier)] === 'object') o = m[String(tier)];
  else if (dmKind[String(tier)] && typeof dmKind[String(tier)] === 'object') o = dmKind[String(tier)];
  o = o || {};
  var tierRar = (D.milestones && D.milestones.tierRarity) || {};
  var base = dh && (dh.transliteration || dh.id) ? String(dh.transliteration || dh.id) : 'dhikr';
  return {
    name: o.name || (base + ' · ' + tier + ' bloom'),
    emoji: o.emoji || '🌸',
    rarity: o.rarity || tierRar[String(tier)] || TIER_RARITY[tier] || 'Common'
  };
}
function baseFlower(dh) {
  var f = (dh && dh.flower && typeof dh.flower === 'object') ? dh.flower : {};
  return { name: f.name || 'Seedling', emoji: f.emoji || '🌱' };
}

/* ---------------- state (all under dg_ keys, all safe) ---------------- */
var S = {
  totals: safeGet('dg_totals', {}),            // {dhikrId: cumulative count}
  best: safeGet('dg_best', {}),                // {dhikrId: best single sitting}
  sessions: safeGet('dg_sessions', 0),         // completed practice sessions
  general: safeGet('dg_general', []),          // [{count, at}]
  lifetime: safeGet('dg_lifetime', 0),
  checklist: safeGet('dg_checklist', {}),      // {"YYYY-MM-DD": {morning:{i:n}, evening:{i:n}}}
  garden: safeGet('dg_garden', []),            // [{id,dhikrId,name,emoji,plantedAt,matureAt,kind,rarity}]
  herbarium: safeGet('dg_herbarium', {}),     // {key:{name,emoji,rarity,at}}
  location: safeGet('dg_location', null),      // null=never asked | {granted:bool,lat,lon}
  milestones: safeGet('dg_milestones', {}),    // {key:true}
  announced: safeGet('dg_announced', []),       // [flowerId...] matured-notified
  lastOpened: safeGet('dg_lastOpened', 0)
};
if (typeof S.sessions !== 'number') S.sessions = 0;
if (typeof S.lifetime !== 'number') S.lifetime = 0;
if (!Array.isArray(S.garden)) S.garden = [];
if (!Array.isArray(S.general)) S.general = [];
if (!Array.isArray(S.announced)) S.announced = [];

function saveState() {
  safeSet('dg_totals', S.totals);
  safeSet('dg_best', S.best);
  safeSet('dg_sessions', S.sessions);
  safeSet('dg_general', S.general.slice(-200));
  safeSet('dg_lifetime', S.lifetime);
  safeSet('dg_checklist', S.checklist);
  safeSet('dg_garden', S.garden.slice(-120));   // garden keeps latest blooms
  safeSet('dg_herbarium', S.herbarium);
  safeSet('dg_location', S.location);
  safeSet('dg_milestones', S.milestones);
  safeSet('dg_announced', S.announced.slice(-300));
  safeSet('dg_lastOpened', S.lastOpened);
}

/* ---------------- prayer times: Muslim World League solar math ----------------
   Fajr 18°, Isha 17°, Maghrib/Sunrise 0.833°, Asr standard (factor 1).
   Pure math, no network. Returns null when location unknown. */
function fixAngle(a) { a = a % 360; return a < 0 ? a + 360 : a; }
function dsin(d) { return Math.sin(d * Math.PI / 180); }
function dcos(d) { return Math.cos(d * Math.PI / 180); }
function dtan(d) { return Math.tan(d * Math.PI / 180); }
function darcsin(x) { return Math.asin(Math.max(-1, Math.min(1, x))) * 180 / Math.PI; }
function darccos(x) { return Math.acos(Math.max(-1, Math.min(1, x))) * 180 / Math.PI; }
function darctan2(y, x) { return Math.atan2(y, x) * 180 / Math.PI; }
function darccot(x) { return Math.atan(1 / x) * 180 / Math.PI; }

function computePrayerTimes(date, lat, lon) {
  try {
    var tz = -date.getTimezoneOffset() / 60; // local offset hours
    var y = date.getFullYear(), m = date.getMonth() + 1, day = date.getDate();
    var jdn;
    if (m <= 2) { y -= 1; m += 12; }
    var A = Math.floor(y / 100), B = 2 - A + Math.floor(A / 4);
    jdn = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + day + B - 1524.5;
    var Dd = jdn - 2451545.0;
    var g = fixAngle(357.529 + 0.98560028 * Dd);
    var q = fixAngle(280.459 + 0.98564736 * Dd);
    var L = fixAngle(q + 1.915 * dsin(g) + 0.020 * dsin(2 * g));
    var e = 23.439 - 0.00000036 * Dd;
    var RA = darctan2(dcos(e) * dsin(L), dcos(L)) / 15;
    RA = ((RA % 24) + 24) % 24;
    var decl = darcsin(dsin(e) * dsin(L));
    var eqt = q / 15 - RA;

    var transit = 12 + tz - lon / 15 - eqt; // solar noon, local hours

    function hourAngle(angleDeg) {
      var cH = (dsin(angleDeg) - dsin(lat) * dsin(decl)) / (dcos(lat) * dcos(decl));
      return darccos(cH) / 15;
    }
    function asrAngle() {
      var alt = darccot(1 + dtan(Math.abs(lat - decl)));
      return alt;
    }
    function toDate(h) {
      var d2 = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
      d2.setTime(d2.getTime() + h * 3600 * 1000);
      return d2;
    }
    return {
      fajr:    toDate(transit - hourAngle(-18)),
      sunrise: toDate(transit - hourAngle(-0.833)),
      dhuhr:   toDate(transit + 2 / 60),
      asr:     toDate(transit + hourAngle(asrAngle())),
      maghrib: toDate(transit + hourAngle(0.833)),
      isha:    toDate(transit + hourAngle(-17))
    };
  } catch (err) { return null; }
}

/* Rough fallback timetable (local time) when location is unknown. */
function fallbackPrayers(date) {
  function at(h, min) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, min || 0, 0, 0);
  }
  return { fajr: at(5, 30), sunrise: at(7, 0), dhuhr: at(12, 30), asr: at(16, 0), maghrib: at(18, 30), isha: at(20, 0) };
}

var PRAYERS = null; // {name, at}[] for today, sorted
function refreshPrayers() {
  var now = new Date();
  var raw = null;
  if (S.location && S.location.granted && typeof S.location.lat === 'number') {
    raw = computePrayerTimes(now, S.location.lat, S.location.lon);
  }
  if (!raw) raw = fallbackPrayers(now);
  PRAYERS = [
    { name: 'Fajr', at: raw.fajr }, { name: 'Sunrise', at: raw.sunrise },
    { name: 'Dhuhr', at: raw.dhuhr }, { name: 'Asr', at: raw.asr },
    { name: 'Maghrib', at: raw.maghrib }, { name: "Isha", at: raw.isha }
  ];
}
function nextPrayer(now) {
  if (!PRAYERS) return null;
  for (var i = 0; i < PRAYERS.length; i++) {
    if (PRAYERS[i].at > now) return { cur: PRAYERS[i], prev: i > 0 ? PRAYERS[i - 1] : null };
  }
  return { cur: null, prev: PRAYERS[PRAYERS.length - 1] };
}

/* ---------------- ambience tint by time of day (+ prayer times) ---------------- */
function applyAmbience() {
  var now = new Date();
  var p = PRAYERS || [];
  function named(n) {
    for (var i = 0; i < p.length; i++) if (p[i].name === n) return p[i].at;
    return null;
  }
  var fajr = named('Fajr'), sunrise = named('Sunrise'),
      maghrib = named('Maghrib'), isha = named('Isha');
  var cls = 'amb-day';
  try {
    if (fajr && isha) {
      var f = fajr.getTime(), sr = sunrise ? sunrise.getTime() : f + 9e6,
          mg = maghrib ? maghrib.getTime() : f + 4.5e7, ish = isha.getTime(),
          t = now.getTime();
      if (t >= ish || t < f - 18e5) cls = 'amb-night';
      else if (t >= f - 18e5 && t < sr + 27e5) cls = 'amb-dawn';
      else if (t >= mg - 36e5 && t < mg + 18e5) cls = 'amb-sunset';
      else cls = 'amb-day';
    } else {
      var h = now.getHours();
      if (h < 5 || h >= 21) cls = 'amb-night';
      else if (h < 7) cls = 'amb-dawn';
      else if (h >= 17 && h < 20) cls = 'amb-sunset';
    }
  } catch (e) { cls = 'amb-day'; }
  document.body.classList.remove('amb-dawn', 'amb-day', 'amb-sunset', 'amb-night');
  document.body.classList.add(cls);
}

/* ---------------- Hijri date + seasons ---------------- */
function hijriMonth() {
  try {
    var parts = new Intl.DateTimeFormat('en-u-ca-islamic', { month: 'numeric' }).formatToParts(new Date());
    for (var i = 0; i < parts.length; i++) {
      if (parts[i].type === 'month') {
        var n = parseInt(parts[i].value, 10);
        return isNaN(n) ? null : n;
      }
    }
    return null;
  } catch (e) { return null; }
}
function hijriDateString() {
  try {
    return new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', { dateStyle: 'long' }).format(new Date());
  } catch (e) {
    try { return new Intl.DateTimeFormat('en-u-ca-islamic', { dateStyle: 'long' }).format(new Date()); }
    catch (e2) { return ''; }
  }
}
function currentSeason() {
  var m = hijriMonth();
  if (m === null) return null;
  var seasons = getSeasons();
  for (var i = 0; i < seasons.length; i++) {
    var s = seasons[i];
    if (Array.isArray(s.hijriMonths) && s.hijriMonths.indexOf(m) !== -1) return s;
    if (typeof s.hijriMonth === 'number' && s.hijriMonth === m) return s;
  }
  return null;
}

/* ---------------- garden: planting + offline maturation ----------------
   Each planted flower: {id, dhikrId, name, emoji, plantedAt, matureAt,
   kind:'base'|'milestone'|'special'|'secret'|'golden', rarity}.
   Stages advance purely on elapsed wall-clock time. NEVER touches counts. */
var HOUR = 3600 * 1000;
var DURATION = { base: 6 * HOUR, milestone: 24 * HOUR, special: 72 * HOUR, secret: 72 * HOUR, golden: 72 * HOUR };

function plantFlower(opts) {
  var now = Date.now();
  var dur = DURATION[opts.kind] || DURATION.base;
  var f = {
    id: uid(),
    dhikrId: opts.dhikrId || null,
    name: opts.name || 'Seedling',
    emoji: opts.emoji || '🌸',
    plantedAt: now,
    matureAt: now + dur,
    kind: opts.kind || 'base',
    rarity: opts.rarity || ''
  };
  S.garden.push(f);
  if (S.garden.length > 120) S.garden = S.garden.slice(-120);
  saveState();
  return f;
}

function growthStage(f, now) {
  now = now || Date.now();
  if (now >= f.matureAt) return 2; // bloomed
  var span = Math.max(1, f.matureAt - f.plantedAt);
  return (now - f.plantedAt) / span < 1 / 3 ? 0 : 1; // 0 seed, 1 sprout
}
function stageEmoji(f, now) {
  var st = growthStage(f, now);
  if (st === 0) return '🌱';
  if (st === 1) return '🌿';
  return f.emoji || '🌸';
}
function stageLabel(f, now) {
  var st = growthStage(f, now);
  return st === 0 ? 'seed' : st === 1 ? 'sprout' : 'bloom';
}

/* Flowers that matured since the user last opened the app. */
function newlyMatured() {
  var now = Date.now();
  var last = Number(S.lastOpened) || 0;
  var out = [];
  for (var i = 0; i < S.garden.length; i++) {
    var f = S.garden[i];
    if (f.matureAt <= now && f.matureAt > last && S.announced.indexOf(f.id) === -1) {
      out.push(f);
      S.announced.push(f.id);
    }
  }
  if (out.length) saveState();
  return out;
}

/* ---------------- herbarium discovery ---------------- */
function discoverFlower(key, name, emoji, rarity) {
  if (S.herbarium[key]) return false;
  S.herbarium[key] = { name: name, emoji: emoji, rarity: rarity || '', at: Date.now() };
  saveState();
  return true;
}

/* ---------------- milestone engine ----------------
   Called after ANY count update. Awards:
   - per-dhikr cumulative 100/500/1000 (distinct flowers)
   - per-dhikr single-sitting 100/500/1000 (distinct flowers)
   - tahlil specials at 10k / 70k cumulative
   - 1M lifetime secret (Diamond Desert Rose)
   - golden variant per dhikr when all 6 of its milestone flowers are earned
   Each award plants the flower, logs herbarium discovery, and celebrates. */
function awardMilestone(key, flower, dhikrId, kind) {
  if (S.milestones[key]) return false;
  S.milestones[key] = true;
  plantFlower({ dhikrId: dhikrId, name: flower.name, emoji: flower.emoji, kind: kind, rarity: flower.rarity });
  discoverFlower('m:' + key, flower.name, flower.emoji, flower.rarity);
  saveState();
  celebrate({
    emoji: flower.emoji,
    title: flower.name,
    sub: (flower.rarity ? flower.rarity + ' bloom · ' : '') + 'planted in your garden 🌱'
  });
  return true;
}

function checkGoldenLadder(dh) {
  if (!dh) return;
  for (var t = 0; t < MILESTONE_TIERS.length; t++) {
    var tier = MILESTONE_TIERS[t];
    if (!S.milestones['c:' + dh.id + ':' + tier]) return;
    if (!S.milestones['s:' + dh.id + ':' + tier]) return;
  }
  // full ladder complete → deterministic golden variant of the base flower
  var gkey = 'gold:' + dh.id;
  if (S.milestones[gkey]) return;
  S.milestones[gkey] = true;
  var bf = baseFlower(dh);
  var gv = {};
  try { gv = (D.milestones && D.milestones.goldenVariants && D.milestones.goldenVariants[dh.id]) || {}; }
  catch (e) { gv = {}; }
  var name = gv.name || ('Golden ' + bf.name);
  var gemoji = gv.emoji || bf.emoji || '✨';
  plantFlower({ dhikrId: dh.id, name: name, emoji: gemoji, kind: 'golden', rarity: 'Golden' });
  discoverFlower('m:' + gkey, name, gemoji, 'Golden');
  saveState();
  celebrate({ emoji: gemoji, title: name, sub: 'Golden variant · every milestone ladder for this dhikr is complete!' });
}

function checkMilestones(dh, sessionCount) {
  if (!dh) return;
  var total = Number(S.totals[dh.id]) || 0;
  var i, tier, key, fl;
  for (i = 0; i < MILESTONE_TIERS.length; i++) {
    tier = MILESTONE_TIERS[i];
    key = 'c:' + dh.id + ':' + tier;
    if (total >= tier && !S.milestones[key]) {
      fl = milestoneFlower(dh, tier, 'cumulative');
      awardMilestone(key, fl, dh.id, 'milestone');
    }
    key = 's:' + dh.id + ':' + tier;
    if (sessionCount >= tier && !S.milestones[key]) {
      fl = milestoneFlower(dh, tier, 'single');
      awardMilestone(key, fl, dh.id, 'milestone');
    }
  }
  // tahlil specials
  var tahlil = findTahlil();
  if (tahlil && tahlil.id === dh.id) {
    var specials = getSpecials();
    var tiers = ['10000', '70000'];
    for (i = 0; i < tiers.length; i++) {
      var T = tiers[i];
      key = 'sp:' + dh.id + ':' + T;
      if (total >= Number(T) && !S.milestones[key]) {
        awardMilestone(key, specials[T], dh.id, 'special');
      }
    }
  }
  checkGoldenLadder(dh);
  // lifetime secret
  var secret = getSecret();
  if (S.lifetime >= secret.threshold && !S.milestones['secret']) {
    S.milestones['secret'] = true;
    plantFlower({ dhikrId: null, name: secret.name, emoji: secret.emoji, kind: 'secret', rarity: secret.rarity });
    discoverFlower('m:secret', secret.name, secret.emoji, secret.rarity);
    saveState();
    celebrate({
      emoji: secret.emoji,
      title: secret.name,
      sub: 'SECRET UNLOCKED · ' + fmtNum(secret.threshold) + ' lifetime remembrances. SubhanAllah!'
    });
  }
}

/* Add counts for a dhikr (a finished session of `n` recitations). */
function addDhikrCount(dh, n) {
  n = Math.max(0, Math.floor(Number(n) || 0));
  if (!dh || n <= 0) return;
  S.totals[dh.id] = (Number(S.totals[dh.id]) || 0) + n;
  if (n > (Number(S.best[dh.id]) || 0)) S.best[dh.id] = n;
  S.lifetime += n;
  saveState();
  checkMilestones(dh, n);
}

/* ---------------- unlock stages ----------------
   Stage↔dhikr mapping sources: stage.dhikrIds (contract),
   D.learningPath[].dhikrIds matched by stage number (data.js),
   or dhikr.stage number (data.js fallback). */
function stageDhikrIds(st) {
  if (st && Array.isArray(st.dhikrIds) && st.dhikrIds.length) return st.dhikrIds;
  var lp = Array.isArray(D.learningPath) ? D.learningPath : [];
  var sn = st ? st.stage : undefined;
  var i;
  for (i = 0; i < lp.length; i++) {
    if (lp[i] && lp[i].stage === sn && Array.isArray(lp[i].dhikrIds)) return lp[i].dhikrIds;
  }
  var out = [];
  var list = getDhikr();
  for (i = 0; i < list.length; i++) {
    if (list[i].stage === sn) out.push(list[i].id);
  }
  return out;
}
function stageMeta(st) {
  var lp = Array.isArray(D.learningPath) ? D.learningPath : [];
  var sn = st ? st.stage : undefined;
  for (var i = 0; i < lp.length; i++) {
    if (lp[i] && lp[i].stage === sn) {
      return { title: lp[i].title || st.name, description: lp[i].description || st.description || '' };
    }
  }
  return { title: st.name, description: st.description || '' };
}
function stageUnlocked(stage) {
  var req = Number(stage.sessionsRequired) || 0;
  return S.sessions >= req;
}
function dhikrStage(dh) {
  var stages = getStages();
  for (var i = 0; i < stages.length; i++) {
    var ids = stageDhikrIds(stages[i]);
    if (ids.indexOf(dh.id) !== -1) return { stage: stages[i], index: i };
  }
  return null;
}
function dhikrLocked(dh) {
  var found = dhikrStage(dh);
  if (!found) return false;
  return !stageUnlocked(found.stage);
}

/* ---------------- UI primitives ---------------- */
var SCREENS = ['home', 'practice', 'daily', 'learn', 'herbarium', 'articles', 'reader', 'progress', 'getting-started'];
var currentScreen = 'home';

function showScreen(name) {
  if (SCREENS.indexOf(name) === -1) name = 'home';
  currentScreen = name;
  for (var i = 0; i < SCREENS.length; i++) {
    var sec = el('screen-' + SCREENS[i]);
    if (sec) sec.classList.toggle('active', SCREENS[i] === name);
  }
  var navs = document.querySelectorAll('#bottomnav .navbtn');
  for (var j = 0; j < navs.length; j++) {
    navs[j].classList.toggle('active', navs[j].getAttribute('data-screen') === name);
  }
  closeSheet();
  try { window.scrollTo(0, 0); } catch (e) { /* scroll optional */ }
  try {
    var fn = { home: renderHome, practice: renderPractice, daily: renderDaily,
               learn: renderLearn, herbarium: renderHerbarium, articles: renderArticles,
               reader: function () {}, progress: renderProgress, 'getting-started': renderGettingStarted }[name];
    if (fn) fn();
  } catch (e) { /* a screen must never break navigation */ }
}

function openSheet() { var s = el('moresheet'); if (s) s.hidden = false; }
function closeSheet() { var s = el('moresheet'); if (s) s.hidden = true; }

var modalQueue = [];
function celebrate(opts) {
  modalQueue.push(opts);
  if (!el('modal').hidden) return; // one at a time
  showNextModal();
}
function showNextModal() {
  var o = modalQueue.shift();
  if (!o) { el('modal').hidden = true; return; }
  el('modal-emoji').textContent = o.emoji || '🌸';
  el('modal-title').textContent = o.title || 'MashaAllah!';
  el('modal-sub').textContent = o.sub || '';
  el('modal').hidden = false;
}
function toast(msg, ms) {
  var t = el('toast');
  if (!t) return;
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(t._h);
  t._h = setTimeout(function () { t.hidden = true; }, ms || 2600);
}

/* ---------------- HOME ---------------- */
function arabicBlock(text, cls) {
  return '<div class="arabic ' + (cls || 'arabic-mid') + '" dir="rtl" lang="ar">' + esc(text) + '</div>';
}

function renderGardenGrid(limit) {
  var now = Date.now();
  var flowers = S.garden.slice(-(limit || 24)).reverse();
  if (!flowers.length) {
    return '<div class="garden-empty">Your garden is empty — finish a practice session<br>to plant your first flower 🌱</div>';
  }
  var html = '<div class="garden-grid">';
  for (var i = 0; i < flowers.length; i++) {
    var f = flowers[i];
    var st = growthStage(f, now);
    html += '<div class="plot ' + (st === 2 ? 'bloomed' : 'growing') + '" title="' + esc(f.name) + '">' +
      '<span class="stage-tag">' + (st === 2 ? '🌸' : st === 1 ? '🌿' : '🌱') + '</span>' +
      '<div style="font-size:1.9rem;line-height:1.1">' + esc(stageEmoji(f, now)) + '</div>' +
      '<div class="pname">' + esc(f.name) + '</div></div>';
  }
  html += '</div>';
  return html;
}

function nextRewardInfo() {
  var cands = [];
  var list = getDhikr();
  var i, t, tier;
  for (i = 0; i < list.length; i++) {
    (function (dh) {
      var total = Number(S.totals[dh.id]) || 0;
      var best = Number(S.best[dh.id]) || 0;
      for (var k = 0; k < MILESTONE_TIERS.length; k++) {
        tier = MILESTONE_TIERS[k];
        if (!S.milestones['c:' + dh.id + ':' + tier])
          cands.push({ threshold: tier, current: total, kind: 'cumulative', dhikr: dh });
        if (!S.milestones['s:' + dh.id + ':' + tier])
          cands.push({ threshold: tier, current: best, kind: 'single', dhikr: dh });
      }
      var tahlil = findTahlil();
      if (tahlil && tahlil.id === dh.id) {
        var sp = getSpecials();
        ['10000', '70000'].forEach(function (T) {
          if (!S.milestones['sp:' + dh.id + ':' + T])
            cands.push({ threshold: Number(T), current: total, kind: 'special', dhikr: dh, flower: sp[T] });
        });
      }
    })(list[i]);
  }
  var secret = getSecret();
  if (!S.milestones['secret'])
    cands.push({ threshold: secret.threshold, current: S.lifetime, kind: 'secret', dhikr: null, flower: { name: '???', emoji: '💎', rarity: 'Secret' } });

  var bestC = null;
  for (i = 0; i < cands.length; i++) {
    var rem = cands[i].threshold - cands[i].current;
    if (rem <= 0) continue;
    if (!bestC || rem < bestC.remaining) {
      var fl = cands[i].flower;
      if (!fl) fl = milestoneFlower(cands[i].dhikr, cands[i].threshold, cands[i].kind);
      bestC = { remaining: rem, threshold: cands[i].threshold, current: cands[i].current,
                kind: cands[i].kind, dhikr: cands[i].dhikr, flower: fl };
    }
  }
  return bestC;
}

function renderNextReward() {
  var nr = nextRewardInfo();
  if (!nr) {
    return '<div class="card"><span class="kicker">Next reward</span>' +
      '<h2>🌟 Garden complete!</h2><p class="muted">Every bloom discovered. May your garden keep growing with every remembrance.</p></div>';
  }
  var pct = Math.min(100, Math.max(0, (nr.current / nr.threshold) * 100));
  var dhName = nr.dhikr ? (nr.dhikr.transliteration || nr.dhikr.id) : 'lifetime dhikr';
  var kindLabel = nr.kind === 'single' ? 'in one sitting' : nr.kind === 'secret' ? 'total' : 'total';
  return '<div class="card"><span class="kicker">Next reward</span>' +
    '<div style="display:flex;gap:14px;align-items:center">' +
    '<div style="font-size:3rem">' + esc(nr.flower.emoji) + '</div>' +
    '<div style="flex:1"><h3 style="margin:0 0 2px">' + esc(nr.flower.name) + '</h3>' +
    '<div class="muted"><b>' + fmtNum(nr.remaining) + '</b> more ' + esc(dhName) + ' ' + esc(kindLabel) + '</div>' +
    '<div class="muted" style="font-size:.78rem;letter-spacing:.06em;text-transform:uppercase;color:var(--gold-600);font-weight:800">' +
    esc(nr.flower.rarity || '') + '</div></div></div>' +
    '<div class="pbar"><i style="width:' + pct.toFixed(1) + '%"></i></div>' +
    '<div class="pbar-label"><span>' + fmtNum(nr.current) + '</span><span>' + fmtNum(nr.threshold) + '</span></div></div>';
}

function locationCard() {
  if (S.location !== null) return ''; // asked once already
  return '<div class="card" id="loccard"><span class="kicker">Prayer-time ambience</span>' +
    '<h3>🕌 Tune the garden to your day</h3>' +
    '<p class="muted">Share your location <b>once</b> and the app will show prayer times and tint the garden by time of day. It stays on your phone — nothing is sent anywhere.</p>' +
    '<div class="btn-row"><button class="btn-green" id="loc-yes">Share location</button>' +
    '<button class="btn-ghost" id="loc-no">Not now</button></div></div>';
}

function renderHome() {
  var sec = el('screen-home');
  if (!sec) return;
  var away = newlyMatured();
  var season = currentSeason();
  var hijri = hijriDateString();
  var now = new Date();
  var np = nextPrayer(now);
  var html = '';

  // header
  html += '<h1 class="page-title">🌙 Dhikr Garden</h1>';
  html += '<p class="page-sub">' + (hijri ? esc(hijri) + ' · ' : '') + 'Every remembrance plants something beautiful.</p>';

  // seasonal banner
  if (season) {
    html += '<div class="season-banner">🌙 <b>' + esc(season.name || 'Blessed season') + '</b><br>' +
      '<span>' + esc(season.greeting || season.note || season.description || '') + '</span></div>';
  }

  // while-you-were-away
  if (away.length) {
    var names = away.slice(0, 4).map(function (f) { return esc(f.name); }).join(', ');
    var more = away.length > 4 ? ' +' + (away.length - 4) + ' more' : '';
    html += '<div class="notice"><span class="ntitle">🌤️ While you were away…</span>' +
      esc(String(away.length)) + ' flower' + (away.length > 1 ? 's' : '') +
      ' bloomed: ' + names + more + '</div>';
  }

  // hero: the garden itself
  html += '<div class="hero"><span class="kicker" style="color:var(--gold-400)">Your garden</span>' +
    '<h1 style="margin:2px 0 8px">Watch it grow 🌱</h1>' + renderGardenGrid(24);
  // prayer strip inside hero when location known
  if (PRAYERS && S.location && S.location.granted) {
    html += '<div class="prayer-strip" style="margin-top:10px">';
    for (var pi = 0; pi < PRAYERS.length; pi++) {
      var isNext = np && np.cur && PRAYERS[pi].name === np.cur.name;
      html += '<div class="prayer-chip' + (isNext ? ' next' : '') + '"><span class="pt">' +
        esc(PRAYERS[pi].name) + '</span>' + esc(fmtClock(PRAYERS[pi].at)) + '</div>';
    }
    html += '</div>';
    if (np && np.cur) {
      var mins = Math.round((np.cur.at - now) / 60000);
      html += '<p style="margin:6px 0 0;font-size:.9rem">⏳ ' + esc(np.cur.name) + ' in ' +
        (mins >= 60 ? Math.floor(mins / 60) + 'h ' + (mins % 60) + 'm' : mins + ' min') + '</p>';
    }
  }
  html += '</div>';

  // location prompt (once)
  html += locationCard();

  // next reward
  html += renderNextReward();

  // getting started teaser
  html += '<div class="card"><span class="kicker">New here?</span>' +
    '<h3>🌱 Getting Started</h3><p class="muted">Four quick steps to grow your first flower.</p>' +
    '<button class="btn-gold" data-go="getting-started">Start here</button></div>';

  // 2-column feature menu (Nidaa-style)
  var items = [
    ['practice', '📿', 'Practice'],
    ['daily', '☀️', 'Daily Rhythm'],
    ['learn', '📖', 'Learning Path'],
    ['herbarium', '🌸', 'Herbarium'],
    ['articles', '📰', 'Articles'],
    ['progress', '📊', 'Progress']
  ];
  html += '<h2 style="color:#fff;margin:6px 0 10px">Open a Section</h2><div class="grid2">';
  for (var gi = 0; gi < items.length; gi++) {
    html += '<button class="menu-btn" data-go="' + items[gi][0] + '">' +
      '<span class="micon">' + items[gi][1] + '</span>' + esc(items[gi][2]) + '</button>';
  }
  html += '</div>';

  // lifetime footer stat
  html += '<div class="card" style="text-align:center"><span class="kicker">Lifetime remembrances</span>' +
    '<div style="font-size:2.2rem;font-weight:800;color:var(--green-900)">' + fmtNum(S.lifetime) + '</div></div>';

  sec.innerHTML = html;

  // wire buttons
  var gos = sec.querySelectorAll('[data-go]');
  for (var k = 0; k < gos.length; k++) {
    (function (b) { b.addEventListener('click', function () { showScreen(b.getAttribute('data-go')); }); })(gos[k]);
  }
  var ly = el('loc-yes'), ln = el('loc-no');
  if (ly) ly.addEventListener('click', requestLocation);
  if (ln) ln.addEventListener('click', function () {
    S.location = { granted: false };
    saveState(); renderHome();
  });
}

/* ---------------- location: asked ONCE ---------------- */
function requestLocation() {
  function done(loc) {
    S.location = loc;
    saveState();
    refreshPrayers(); applyAmbience();
    renderHome();
  }
  if (!('geolocation' in navigator)) { done({ granted: false }); return; }
  try {
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        done({ granted: true, lat: pos.coords.latitude, lon: pos.coords.longitude });
        toast('🕌 Prayer times set for your location');
      },
      function () { done({ granted: false }); },
      { timeout: 12000, maximumAge: 86400000 }
    );
  } catch (e) { done({ granted: false }); }
}

/* ---------------- PRACTICE ---------------- */
var PC = { dhikrId: null, target: 33, count: 0, generalTarget: 33, generalCount: 0 };

function practiceOptions() {
  var list = getDhikr();
  var stages = getStages();
  var html = '';
  if (stages.length) {
    for (var s = 0; s < stages.length; s++) {
      var st = stages[s];
      var unlocked = stageUnlocked(st);
      var ids = stageDhikrIds(st);
      var meta = stageMeta(st);
      html += '<optgroup label="' + esc(meta.title) + (unlocked ? '' : ' 🔒 (' + (Number(st.sessionsRequired) || 0) + ' sessions)') + '">';
      for (var i = 0; i < list.length; i++) {
        var dh = list[i];
        if (ids.indexOf(dh.id) === -1) continue;
        html += '<option value="' + esc(dh.id) + '"' + (unlocked ? '' : ' disabled') + '>' +
          esc(dh.transliteration || dh.id) + (unlocked ? '' : ' 🔒') + '</option>';
      }
      html += '</optgroup>';
    }
  } else {
    for (var j = 0; j < list.length; j++) {
      html += '<option value="' + esc(list[j].id) + '">' + esc(list[j].transliteration || list[j].id) + '</option>';
    }
  }
  return html;
}

function renderPractice() {
  var sec = el('screen-practice');
  if (!sec) return;
  var list = getDhikr();
  var html = '<h1 class="page-title">📿 Practice</h1><p class="page-sub">Tap, remember, grow.</p>';

  if (!list.length) {
    html += '<div class="card"><div class="empty-note">Practice content is being prepared —<br>check back soon, inshaAllah 🌱</div></div>';
    html += renderGeneralCounter();
    sec.innerHTML = html;
    wireGeneral(sec);
    return;
  }

  if (!PC.dhikrId || !dhikrById(PC.dhikrId)) {
    // pick first unlocked dhikr
    for (var i = 0; i < list.length; i++) {
      if (!dhikrLocked(list[i])) { PC.dhikrId = list[i].id; break; }
    }
    if (!PC.dhikrId) PC.dhikrId = list[0].id;
    var firstDh = dhikrById(PC.dhikrId);
    if (firstDh && Number(firstDh.target) > 0) PC.target = Number(firstDh.target);
  }
  var dh = dhikrById(PC.dhikrId);
  var locked = dhikrLocked(dh);

  html += '<div class="card"><label class="field" for="dhikr-select">Choose a dhikr</label>' +
    '<select id="dhikr-select">' + practiceOptions() + '</select></div>';
  html += '<div id="practice-body">' + practiceBody(dh, locked) + '</div>';
  html += renderGeneralCounter();
  sec.innerHTML = html;

  var sel = el('dhikr-select');
  if (sel) {
    sel.value = PC.dhikrId;
    sel.addEventListener('change', function () {
      PC.dhikrId = sel.value; PC.count = 0;
      var ndh = dhikrById(PC.dhikrId);
      if (ndh && Number(ndh.target) > 0) PC.target = Number(ndh.target);
      el('practice-body').innerHTML = practiceBody(ndh, dhikrLocked(ndh));
      wireTap();
    });
  }
  wireTap();
  wireGeneral(sec);
}

function practiceBody(dh, locked) {
  if (!dh) return '<div class="card"><div class="empty-note">Choose a dhikr above 🌱</div></div>';
  if (locked) {
    var found = dhikrStage(dh);
    var req = found ? (Number(found.stage.sessionsRequired) || 0) : 0;
    return '<div class="card"><div class="empty-note">🔒 This dhikr unlocks after <b>' + req +
      '</b> practice sessions.<br>You have <b>' + S.sessions + '</b> so far — keep going!</div></div>';
  }
  var html = '<div class="card"><span class="kicker">Now practicing</span>';
  if (dh.arabic) html += arabicBlock(dh.arabic, 'arabic-big');
  if (dh.transliteration) html += '<p class="translit">' + esc(dh.transliteration) + '</p>';
  if (dh.translation) html += '<p class="translation">' + esc(dh.translation) + '</p>';
  if (dh.virtue) html += '<p class="muted">✨ ' + esc(dh.virtue) + '</p>';
  html += '<div class="pbar-label" style="margin-top:10px"><span>Sessions completed</span><span><b>' +
    S.sessions + '</b></span></div></div>';

  var targets = [33, 100, 500, 1000];
  if (dh && Number(dh.target) > 0 && targets.indexOf(Number(dh.target)) === -1) targets.push(Number(dh.target));
  targets.sort(function (a, b) { return a - b; });
  html += '<div class="card"><label class="field" for="target-select">Target</label>' +
    '<select id="target-select">' +
    targets.map(function (t) {
      return '<option value="' + t + '"' + (PC.target === t ? ' selected' : '') + '>' + t + '</option>';
    }).join('') + '</select>' +
    '<div class="counter-wrap"><div class="tap-count" id="tap-count">' + PC.count + '</div>' +
    '<div class="tap-target">of <span id="tap-target">' + PC.target + '</span></div>' +
    '<button class="tap-btn" id="tap-btn" aria-label="Tap for dhikr">🤲</button>' +
    '<div class="tap-hint">Tap the button with each recitation</div></div>' +
    '<div class="pbar green" style="margin-top:14px"><i id="tap-bar" style="width:0%"></i></div>' +
    '<div class="btn-row" style="margin-top:12px">' +
    '<button class="btn-green" id="complete-btn">Complete session</button>' +
    '<button class="btn-ghost" id="reset-btn">Reset</button></div></div>';
  return html;
}

function wireTap() {
  var btn = el('tap-btn');
  if (!btn) return;
  var ts = el('target-select');
  if (ts) ts.addEventListener('change', function () {
    PC.target = Math.max(1, Number(ts.value) || 33);
    var tt = el('tap-target'); if (tt) tt.textContent = PC.target;
    updateTapUI();
  });
  btn.addEventListener('click', function () {
    PC.count++;
    updateTapUI();
    if (PC.count >= PC.target) {
      setTimeout(function () { completeSession(false); }, 350);
    }
  });
  el('reset-btn').addEventListener('click', function () { PC.count = 0; updateTapUI(); });
  el('complete-btn').addEventListener('click', function () { completeSession(true); });
  updateTapUI();
}

function updateTapUI() {
  var c = el('tap-count'), bar = el('tap-bar');
  if (c) c.textContent = PC.count;
  if (bar) bar.style.width = Math.min(100, (PC.count / Math.max(1, PC.target)) * 100).toFixed(1) + '%';
}

function completeSession(early) {
  var dh = dhikrById(PC.dhikrId);
  if (!dh || dhikrLocked(dh)) return;
  var n = PC.count;
  if (n <= 0) { toast('Tap a few times first 🌱'); return; }
  addDhikrCount(dh, n);
  S.sessions++;
  var bf = baseFlower(dh);
  plantFlower({ dhikrId: dh.id, name: bf.name, emoji: bf.emoji, kind: 'base', rarity: '' });
  discoverFlower('base:' + dh.id, bf.name, bf.emoji, '');
  saveState();
  PC.count = 0;
  celebrate({
    emoji: bf.emoji,
    title: early ? 'Session complete!' : 'Target reached — mashaAllah!',
    sub: fmtNum(n) + ' × ' + (dh.transliteration || dh.id) + ' · a ' + bf.name + ' was planted 🌱'
  });
  renderPractice();
}

/* ---- general counter (no flower, logged as "General dhikr") ---- */
function renderGeneralCounter() {
  var presets = getGeneralPresets();
  var html = '<div class="card" style="border:2px dashed var(--gold-500)"><span class="kicker">General counter</span>' +
    '<h3>🔢 Count anything</h3>' +
    '<p class="muted">For any remembrance not listed above. Saved as “General dhikr” — no flower, just the count.</p>' +
    '<div class="btn-row" style="margin-bottom:10px">';
  for (var i = 0; i < presets.length; i++) {
    html += '<button class="btn-ghost gpreset" data-t="' + presets[i] + '">' + presets[i] + '</button>';
  }
  html += '</div><div class="btn-row"><input type="number" id="gcustom" min="1" placeholder="Custom target" aria-label="Custom target">' +
    '<button class="btn-ghost" id="gset">Set</button></div>' +
    '<div class="counter-wrap"><div class="tap-count" id="gtap-count" style="font-size:3rem">' + PC.generalCount + '</div>' +
    '<div class="tap-target">of <span id="gtap-target">' + PC.generalTarget + '</span></div>' +
    '<button class="tap-btn" id="gtap-btn" style="width:150px;height:150px;font-size:2.6rem" aria-label="Tap for general dhikr">🔢</button></div>' +
    '<div class="btn-row" style="margin-top:12px"><button class="btn-green" id="gcomplete">Save to log</button>' +
    '<button class="btn-ghost" id="greset">Reset</button></div></div>';
  return html;
}

function wireGeneral(sec) {
  var btn = el('gtap-btn');
  if (!btn) return;
  function upd() {
    el('gtap-count').textContent = PC.generalCount;
    el('gtap-target').textContent = PC.generalTarget;
  }
  var presets = sec.querySelectorAll('.gpreset');
  for (var i = 0; i < presets.length; i++) {
    (function (b) { b.addEventListener('click', function () { PC.generalTarget = Number(b.getAttribute('data-t')); PC.generalCount = 0; upd(); }); })(presets[i]);
  }
  el('gset').addEventListener('click', function () {
    var v = Math.max(1, Math.floor(Number(el('gcustom').value) || 0));
    if (v > 0) { PC.generalTarget = v; PC.generalCount = 0; upd(); }
  });
  btn.addEventListener('click', function () {
    PC.generalCount++; upd();
    if (PC.generalCount >= PC.generalTarget) {
      setTimeout(function () { saveGeneral(false); }, 350);
    }
  });
  el('greset').addEventListener('click', function () { PC.generalCount = 0; upd(); });
  el('gcomplete').addEventListener('click', function () { saveGeneral(true); });
}

function saveGeneral(early) {
  var n = PC.generalCount;
  if (n <= 0) { toast('Tap a few times first 🌱'); return; }
  S.general.push({ count: n, at: Date.now() });
  S.lifetime += n;
  saveState();
  // lifetime secret still applies to general counts
  var secret = getSecret();
  if (S.lifetime >= secret.threshold && !S.milestones['secret']) {
    S.milestones['secret'] = true;
    plantFlower({ dhikrId: null, name: secret.name, emoji: secret.emoji, kind: 'secret', rarity: secret.rarity });
    discoverFlower('m:secret', secret.name, secret.emoji, secret.rarity);
    saveState();
    celebrate({ emoji: secret.emoji, title: secret.name, sub: 'SECRET UNLOCKED · ' + fmtNum(secret.threshold) + ' lifetime remembrances!' });
  } else {
    toast('Saved ' + fmtNum(n) + ' as General dhikr 🤲');
  }
  PC.generalCount = 0;
  renderPractice();
}

/* ---------------- DAILY RHYTHM ---------------- */
var dailyTab = 'morning';

function checklistDay() {
  var k = todayKey();
  if (!S.checklist[k]) S.checklist[k] = { morning: {}, evening: {} };
  // prune old days (keep 14)
  var keys = Object.keys(S.checklist).sort();
  while (keys.length > 14) { delete S.checklist[keys.shift()]; }
  return S.checklist[k];
}

function renderDaily() {
  var sec = el('screen-daily');
  if (!sec) return;
  var daily = getDaily();
  var html = '<h1 class="page-title">☀️ Daily Rhythm</h1>' +
    '<p class="page-sub">A gentle rhythm for your day — no streaks, no pressure. Just presence. 🌿</p>';
  html += '<div class="tabs"><button class="tab' + (dailyTab === 'morning' ? ' active' : '') +
    '" data-tab="morning">🌅 Morning</button>' +
    '<button class="tab' + (dailyTab === 'evening' ? ' active' : '') + '" data-tab="evening">🌙 Evening</button></div>';

  var items = dailyTab === 'morning' ? daily.morning : daily.evening;
  var day = checklistDay();
  var done = 0;

  if (!items.length) {
    html += '<div class="card"><div class="empty-note">Daily remembrances are being prepared —<br>check back soon, inshaAllah 🌱</div></div>';
  } else {
    html += '<div id="daily-list">';
    for (var i = 0; i < items.length; i++) {
      (function (idx, it) {
        var checked = !!day[dailyTab][idx];
        if (checked) done++;
        html += '<div class="check-row' + (checked ? ' done' : '') + '" data-idx="' + idx + '">' +
          '<input type="checkbox" class="bigcheck" ' + (checked ? 'checked' : '') +
          ' aria-label="Mark complete: ' + esc(it.transliteration || ('item ' + (idx + 1))) + '">' +
          '<div class="check-body">';
        if (it.arabic) html += arabicBlock(it.arabic, 'arabic-mid');
        if (it.transliteration || it.count) {
          html += '<button class="translit-toggle" aria-expanded="false">▸ Read transliteration' +
            (it.count ? ' · ×' + esc(it.count) : '') + '</button>' +
            '<div class="translit-body" hidden>' +
            (it.transliteration ? '<p class="translit">' + esc(it.transliteration) + '</p>' : '') +
            (it.count ? '<p class="muted">Repeat <b>' + esc(it.count) + '</b> times</p>' : '') + '</div>';
        } else if (it.count) {
          html += '<span class="check-count">×' + esc(it.count) + '</span>';
        }
        html += '</div></div>';
      })(i, items[i] || {});
    }
    html += '</div>';
    html += '<div class="card" style="text-align:center"><span class="kicker">Today</span>' +
      '<div style="font-size:1.6rem;font-weight:800;color:var(--green-900)">' + done + ' / ' + items.length + ' complete</div>' +
      '<div class="pbar green"><i style="width:' + (items.length ? (done / items.length * 100).toFixed(0) : 0) + '%"></i></div></div>';
  }

  sec.innerHTML = html;

  var tabs = sec.querySelectorAll('[data-tab]');
  for (var t = 0; t < tabs.length; t++) {
    (function (b) { b.addEventListener('click', function () { dailyTab = b.getAttribute('data-tab'); renderDaily(); }); })(tabs[t]);
  }
  var rows = sec.querySelectorAll('.check-row');
  for (var r = 0; r < rows.length; r++) {
    (function (row) {
      var idx = Number(row.getAttribute('data-idx'));
      var box = row.querySelector('.bigcheck');
      var tog = row.querySelector('.translit-toggle');
      var body = row.querySelector('.translit-body');
      if (box) box.addEventListener('change', function () {
        var d = checklistDay();
        if (box.checked) d[dailyTab][idx] = 1; else delete d[dailyTab][idx];
        saveState();
        renderDaily(); // refresh list + summary (toggle states reset — acceptable)
      });
      if (tog && body) tog.addEventListener('click', function () {
        var open = body.hidden;
        body.hidden = !open;
        tog.setAttribute('aria-expanded', String(open));
        tog.innerHTML = (open ? '▾' : '▸') + ' Read transliteration' +
          (items[idx] && items[idx].count ? ' · ×' + esc(items[idx].count) : '');
      });
    })(rows[r]);
  }
}

/* ---------------- LEARN (learning path / unlock stages) ---------------- */
function renderLearn() {
  var sec = el('screen-learn');
  if (!sec) return;
  var stages = getStages();
  var html = '<h1 class="page-title">📖 Learning Path</h1>' +
    '<p class="page-sub">Unlock new remembrances as your practice grows.</p>';

  if (!stages.length) {
    // fallback: list all dhikr unlocked
    var list = getDhikr();
    if (!list.length) {
      html += '<div class="card"><div class="empty-note">Learning content is being prepared 🌱</div></div>';
    } else {
      html += '<div class="card"><span class="kicker">All remembrances</span>';
      for (var j = 0; j < list.length; j++) html += learnDhikrRow(list[j]);
      html += '</div>';
    }
  } else {
    for (var s = 0; s < stages.length; s++) {
      (function (st, si) {
        var unlocked = stageUnlocked(st);
        var req = Number(st.sessionsRequired) || 0;
        var meta = stageMeta(st);
        html += '<div class="card stage' + (unlocked ? '' : ' locked') + '"><span class="kicker">Stage ' +
          (si + 1) + ' of ' + stages.length + '</span><h2>' + (unlocked ? '🌿 ' : '🔒 ') + esc(meta.title) + '</h2>';
        if (meta.description) html += '<p class="muted">' + esc(meta.description) + '</p>';
        if (unlocked) {
          html += '<p class="muted">' + S.sessions + ' sessions completed — unlocked.</p>';
        } else {
          html += '<p><span class="lock-tag">🔒 Complete ' + req + ' practice sessions to unlock (' + S.sessions + '/' + req + ')</span></p>';
        }
        var ids = stageDhikrIds(st);
        var anyDh = false;
        for (var i = 0; i < ids.length; i++) {
          var dh = dhikrById(ids[i]);
          if (dh) { html += learnDhikrRow(dh); anyDh = true; }
        }
        if (!anyDh) html += '<p class="muted">Remembrances for this stage are being prepared.</p>';
        html += '</div>';
      })(stages[s], s);
    }
  }
  sec.innerHTML = html;
}

function learnDhikrRow(dh) {
  var html = '<div class="stage-dhikr">';
  if (dh.arabic) html += arabicBlock(dh.arabic, 'arabic-mid');
  if (dh.transliteration) html += '<p class="translit" style="margin:4px 0">' + esc(dh.transliteration) + '</p>';
  if (dh.translation) html += '<p class="translation" style="margin:0">' + esc(dh.translation) + '</p>';
  html += '</div>';
  return html;
}

/* ---------------- HERBARIUM (codex) ---------------- */
function herbariumTotals() {
  // every collectible flower key the data defines
  var list = getDhikr();
  var keys = [];
  var i, t;
  for (i = 0; i < list.length; i++) {
    keys.push('base:' + list[i].id);
    for (t = 0; t < MILESTONE_TIERS.length; t++) {
      keys.push('m:c:' + list[i].id + ':' + MILESTONE_TIERS[t]);
      keys.push('m:s:' + list[i].id + ':' + MILESTONE_TIERS[t]);
    }
    keys.push('m:gold:' + list[i].id);
  }
  var tahlil = findTahlil();
  if (tahlil) { keys.push('m:sp:' + tahlil.id + ':10000'); keys.push('m:sp:' + tahlil.id + ':70000'); }
  keys.push('m:secret');
  return keys;
}

function herbariumCell(key, label, emoji, rarity, known, golden) {
  return '<div class="herb-cell' + (known ? '' : ' unknown') + (golden ? ' golden' : '') + '">' +
    '<div class="hemoji">' + (known ? esc(emoji) : '❔') + '</div>' +
    '<div class="hname">' + (known ? esc(label) : '???') + '</div>' +
    (known && rarity ? '<div class="hrarity">' + esc(rarity) + '</div>' : '') + '</div>';
}

function renderHerbarium() {
  var sec = el('screen-herbarium');
  if (!sec) return;
  var keys = herbariumTotals();
  var known = 0;
  var html = '<h1 class="page-title">🌸 Herbarium</h1>' +
    '<p class="page-sub">Every bloom you have discovered — and the silhouettes still waiting.</p>';

  if (!getDhikr().length) {
    html += '<div class="card"><div class="empty-note">The codex is being prepared —<br>check back soon 🌱</div></div>';
    sec.innerHTML = html;
    return;
  }

  // golden variants section
  var goldHtml = '';
  var list = getDhikr();
  for (var g = 0; g < list.length; g++) {
    (function (dh) {
      var k = 'm:gold:' + dh.id;
      var rec = S.herbarium[k];
      var bf = baseFlower(dh);
      goldHtml += herbariumCell(k, rec ? rec.name : ('Golden ' + bf.name), rec ? rec.emoji : '✨', 'Golden', !!rec, true);
    })(list[g]);
  }

  // main codex
  var mainHtml = '';
  for (var i = 0; i < keys.length; i++) {
    (function (key) {
      if (key.indexOf('gold:') !== -1) return; // golden lives in its own section
      var rec = S.herbarium[key];
      if (rec) known++;
      var label = rec ? rec.name : key;
      var emoji = rec ? rec.emoji : '🌸';
      var rarity = rec ? rec.rarity : '';
      mainHtml += herbariumCell(key, label, emoji, rarity, !!rec, false);
    })(keys[i]);
  }

  var pctKeys = keys.filter(function (k) { return k.indexOf('gold:') === -1; });
  var pct = pctKeys.length ? Math.round((known / pctKeys.length) * 100) : 0;
  html += '<div class="card" style="text-align:center"><span class="kicker">Collection</span>' +
    '<div style="font-size:2rem;font-weight:800;color:var(--green-900)">' + pct + '%</div>' +
    '<div class="muted">' + known + ' of ' + pctKeys.length + ' blooms discovered</div>' +
    '<div class="pbar"><i style="width:' + pct + '%"></i></div></div>';

  html += '<h2 style="color:#fff;margin:4px 0 10px">✨ Golden variants</h2>' +
    '<div class="card"><p class="muted">Complete every milestone ladder (100 / 500 / 1,000, cumulative + single sitting) for a dhikr to grow its golden variant.</p>' +
    '<div class="herb-grid">' + goldHtml + '</div></div>';

  html += '<h2 style="color:#fff;margin:4px 0 10px">🌿 Codex</h2>' +
    '<div class="herb-grid">' + mainHtml + '</div>';

  sec.innerHTML = html;
}

/* ---------------- ARTICLES ---------------- */
var readerArticle = null;

function renderArticles() {
  var sec = el('screen-articles');
  if (!sec) return;
  var arts = getArticles();
  var html = '<h1 class="page-title">📰 Articles</h1>' +
    '<p class="page-sub">Read and learn at your own pace.</p>';
  if (!arts.length) {
    html += '<div class="card"><div class="empty-note">Articles are being prepared —<br>check back soon 🌱</div></div>';
  } else {
    for (var i = 0; i < arts.length; i++) {
      (function (a, idx) {
        var excerpt = a.excerpt || a.description || '';
        html += '<div class="card article-card" data-idx="' + idx + '" role="button" tabindex="0">' +
          '<h3>📄 ' + esc(a.title || 'Article') + '</h3>' +
          (excerpt ? '<p class="muted">' + esc(excerpt) + '</p>' : '') +
          '<span class="muted">Tap to read →</span></div>';
      })(arts[i], i);
    }
  }
  sec.innerHTML = html;
  var cards = sec.querySelectorAll('.article-card');
  for (var c = 0; c < cards.length; c++) {
    (function (card) {
      function open() {
        readerArticle = getArticles()[Number(card.getAttribute('data-idx'))];
        renderReader();
        showScreen('reader');
      }
      card.addEventListener('click', open);
      card.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    })(cards[c]);
  }
}

function renderReader() {
  var sec = el('screen-reader');
  if (!sec) return;
  var a = readerArticle;
  if (!a || !a.url) {
    sec.innerHTML = '<h1 class="page-title">📰 Article</h1><div class="card"><div class="empty-note">This article is unavailable.</div>' +
      '<button class="btn-ghost" data-back>← Back to articles</button></div>';
  } else if (a.embed === false) {
    sec.innerHTML = '<h1 class="page-title" style="font-size:1.3rem">📄 ' + esc(a.title || 'Article') + '</h1>' +
      '<div class="card"><button class="btn-ghost" data-back style="margin-bottom:12px">← All articles</button>' +
      (a.description ? '<p class="muted">' + esc(a.description) + '</p>' : '') +
      '<p class="muted">This article opens in your browser.</p>' +
      '<a class="btn-gold" style="display:block;text-align:center;text-decoration:none" href="' + esc(a.url) +
      '" target="_blank" rel="noopener">Read article ↗</a></div>';
  } else {
    sec.innerHTML = '<h1 class="page-title" style="font-size:1.3rem">📄 ' + esc(a.title || 'Article') + '</h1>' +
      '<div class="card"><button class="btn-ghost" data-back style="margin-bottom:12px">← All articles</button>' +
      '<iframe class="reader-frame" src="' + esc(a.url) + '" title="' + esc(a.title || 'Article') +
      '" sandbox="allow-scripts allow-same-origin" loading="lazy"></iframe>' +
      '<p class="muted" style="margin-top:10px">Some websites block embedding — if the page is blank, use the button below.</p>' +
      '<a class="btn-gold" style="display:block;text-align:center;text-decoration:none" href="' + esc(a.url) +
      '" target="_blank" rel="noopener">Open externally ↗</a></div>';
  }
  var backs = sec.querySelectorAll('[data-back]');
  for (var i = 0; i < backs.length; i++) {
    backs[i].addEventListener('click', function () { showScreen('articles'); });
  }
}

/* ---------------- PROGRESS ---------------- */
function renderProgress() {
  var sec = el('screen-progress');
  if (!sec) return;
  var list = getDhikr();
  var html = '<h1 class="page-title">📊 Progress</h1>' +
    '<p class="page-sub">Your remembrance journey, in numbers and blooms.</p>';

  html += '<div class="card" style="text-align:center"><span class="kicker">Lifetime remembrances</span>' +
    '<div style="font-size:2.6rem;font-weight:800;color:var(--green-900)">' + fmtNum(S.lifetime) + '</div>' +
    '<div class="muted">' + S.sessions + ' practice sessions · ' + S.general.length + ' general counts logged</div></div>';

  if (!list.length) {
    html += '<div class="card"><div class="empty-note">Progress tracking is being prepared 🌱</div></div>';
  } else {
    for (var i = 0; i < list.length; i++) {
      (function (dh) {
        var total = Number(S.totals[dh.id]) || 0;
        var best = Number(S.best[dh.id]) || 0;
        html += '<div class="card"><div class="prog-row">';
        if (dh.arabic) html += '<div class="arabic prog-ar" dir="rtl" lang="ar">' + esc(dh.arabic) + '</div>';
        if (dh.transliteration) html += '<div class="translit">' + esc(dh.transliteration) + '</div>';
        html += '<div class="prog-stats"><span>Total <b>' + fmtNum(total) + '</b></span>' +
          '<span>Best sitting <b>' + fmtNum(best) + '</b></span></div>';
        var chips = '';
        for (var t = 0; t < MILESTONE_TIERS.length; t++) {
          var tier = MILESTONE_TIERS[t];
          ['c', 's'].forEach(function (k) {
            var key = k + ':' + dh.id + ':' + tier;
            if (S.milestones[key]) {
              var fl = milestoneFlower(dh, tier, k === 'c' ? 'cumulative' : 'single');
              chips += '<span class="chip" title="' + esc(fl.name) + ' (' + (k === 'c' ? 'cumulative' : 'single') + ' ' + tier + ')">' + esc(fl.emoji) + '</span>';
            }
          });
        }
        var tahlil = findTahlil();
        if (tahlil && tahlil.id === dh.id) {
          var sp = getSpecials();
          ['10000', '70000'].forEach(function (T) {
            if (S.milestones['sp:' + dh.id + ':' + T]) {
              chips += '<span class="chip" title="' + esc(sp[T].name) + '">' + esc(sp[T].emoji) + '</span>';
            }
          });
        }
        if (S.milestones['gold:' + dh.id]) chips += '<span class="chip" title="Golden variant">✨</span>';
        if (chips) html += '<div class="milestone-chips">' + chips + '</div>';
        html += '</div></div>';
      })(list[i]);
    }
  }

  // secret: hidden until unlocked
  var secret = getSecret();
  var unlocked = !!S.milestones['secret'];
  html += '<div class="card secret-card' + (unlocked ? ' revealed' : '') + '"><span class="kicker">Secret achievement</span>';
  if (unlocked) {
    var rec = S.herbarium['m:secret'];
    html += '<div style="font-size:3.4rem">' + esc(secret.emoji) + '</div>' +
      '<h2>' + esc(secret.name) + '</h2>' +
      '<p class="muted">' + fmtNum(secret.threshold) + ' lifetime remembrances reached. ' +
      (rec && rec.at ? 'Unlocked ' + esc(new Date(rec.at).toLocaleDateString()) + '. ' : '') +
      esc(secret.note) + '</p>';
  } else {
    html += '<div style="font-size:3rem;filter:grayscale(1);opacity:.4">❔</div>' +
      '<h3>???</h3><p class="muted">A secret bloom hides in this garden… keep remembering.</p>';
  }
  html += '</div>';

  sec.innerHTML = html;
}

/* ---------------- GETTING STARTED ---------------- */
var FALLBACK_STEPS = [
  { title: 'Pick a remembrance', body: 'Open Practice and choose a dhikr from the list. The first ones are unlocked right away — more open up as you complete sessions.' },
  { title: 'Tap and remember', body: 'Set a target (33 is a lovely start) and tap the big button with each recitation. There is no timer and no rush.' },
  { title: 'Grow your garden', body: 'Every finished session plants a flower. Flowers start as seeds 🌱, sprout 🌿, and bloom 🌸 in real time — even while the app is closed.' },
  { title: 'Keep a gentle rhythm', body: 'Check the Daily Rhythm for morning and evening remembrances, and visit your Herbarium to see every bloom you have discovered.' }
];

function renderGettingStarted() {
  var sec = el('screen-getting-started');
  if (!sec) return;
  var steps = getSteps();
  if (!steps.length) steps = FALLBACK_STEPS;
  var html = '<h1 class="page-title">🌱 Getting Started</h1>' +
    '<p class="page-sub">Four steps to your first bloom.</p>';
  for (var i = 0; i < steps.length && i < 4; i++) {
    html += '<div class="card"><div class="step-row"><span class="step-num">' + (i + 1) + '</span>' +
      '<div><h3>' + esc(steps[i].title) + '</h3><p class="muted" style="margin:0">' +
      esc(steps[i].body || '') + '</p></div></div></div>';
  }
  html += '<div class="card" style="text-align:center"><button class="btn-gold" id="gs-go">Open Practice 📿</button></div>';
  sec.innerHTML = html;
  var b = el('gs-go');
  if (b) b.addEventListener('click', function () { showScreen('practice'); });
}

/* ---------------- navigation wiring ---------------- */
function wireNav() {
  var navs = document.querySelectorAll('#bottomnav .navbtn');
  for (var i = 0; i < navs.length; i++) {
    (function (b) {
      b.addEventListener('click', function () {
        var s = b.getAttribute('data-screen');
        if (s === 'more') { openSheet(); return; }
        showScreen(s);
      });
    })(navs[i]);
  }
  var sheets = document.querySelectorAll('#moresheet .sheetbtn[data-screen]');
  for (var j = 0; j < sheets.length; j++) {
    (function (b) {
      b.addEventListener('click', function () { showScreen(b.getAttribute('data-screen')); });
    })(sheets[j]);
  }
  el('sheetclose').addEventListener('click', closeSheet);
  el('moresheet').addEventListener('click', function (e) {
    if (e.target === el('moresheet')) closeSheet();
  });
  el('modal-ok').addEventListener('click', showNextModal);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      closeSheet();
      if (!el('modal').hidden) showNextModal();
    }
  });
}

/* If content/data.js arrives late (or is replaced at runtime), pick it up. */
function refreshContent() {
  var fresh = (typeof window.DG_CONTENT === 'object' && window.DG_CONTENT) ? window.DG_CONTENT : {};
  D = fresh;
  try { showScreen(currentScreen); } catch (e) { /* never blank the app */ }
}
window.addEventListener('dg-content-ready', refreshContent);

/* ---------------- boot ---------------- */
function boot() {
  try { refreshPrayers(); } catch (e) { /* prayers optional */ }
  try { applyAmbience(); } catch (e) { /* ambience optional */ }
  wireNav();
  showScreen('home');            // renders home incl. "while you were away"
  S.lastOpened = Date.now();     // mark this visit AFTER the away-check
  saveState();
  // re-tint periodically while the app stays open
  try {
    setInterval(function () { refreshPrayers(); applyAmbience(); }, 15 * 60 * 1000);
  } catch (e) { /* timers optional */ }
  // service worker (offline shell) — same-directory scope only
  try {
    if ('serviceWorker' in navigator && /^https?:$/.test(window.location.protocol)) {
      window.addEventListener('load', function () {
        navigator.serviceWorker.register('sw.js').catch(function () { /* offline still fine */ });
      });
    }
  } catch (e) { /* SW optional */ }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
