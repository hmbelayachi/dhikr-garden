/* =========================================================================
   Dhikr Garden Grower — app shell (vanilla JS, 100% client-side)
   -------------------------------------------------------------------------
   CONTENT CONTRACT — data.js (written separately) sets window.DG_CONTENT.
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
  var th = themeDef(currentTheme());
  var src = (th.gettingStarted && th.gettingStarted.length) ? th.gettingStarted : D.gettingStarted;
  var s = Array.isArray(src) ? src : [];
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
  var secretOut = {
    name: s.name || 'Diamond Desert Rose',
    threshold: Number(s.threshold) > 0 ? Number(s.threshold) : 1000000,
    emoji: s.emoji || '💎',
    rarity: s.rarity || 'Secret',
    note: s.note || s.description || ''
  };
  var _scTheme = currentTheme();
  if (_scTheme !== 'garden') {
    var _sct = themeDef(_scTheme).secret || {};
    if (_sct.name) secretOut.name = _sct.name;
    if (_sct.emoji) secretOut.emoji = _sct.emoji;
  }
  return secretOut;
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
  var _spTheme = currentTheme();
  if (_spTheme !== 'garden') {
    var _spt = themeDef(_spTheme).specials || {};
    ['10000', '70000'].forEach(function (Tk) {
      if (_spt[Tk] && out[Tk]) {
        if (_spt[Tk].name) out[Tk].name = _spt[Tk].name;
        if (_spt[Tk].emoji) out[Tk].emoji = _spt[Tk].emoji;
      }
    });
  }
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

/* ---------------- switchable themes ----------------
   Progress (counts, milestones, discoveries) is theme-agnostic; only the
   reward names/illustrations/copy re-skin. Rarity tiers never change. */
function currentTheme() {
  return (typeof S !== 'undefined' && (S.theme === 'highway' || S.theme === 'mine')) ? S.theme : 'garden';
}
function themeDef(id) {
  try {
    var t = D.themes && D.themes[id];
    return (t && typeof t === 'object') ? t : {};
  } catch (e) { return {}; }
}
/* themed copy string, falling back to the garden wording, then to fallback */
function T(key, fallback) {
  var th = themeDef(currentTheme());
  if (th.copy && th.copy[key] !== undefined && th.copy[key] !== null && th.copy[key] !== '') return th.copy[key];
  var g = themeDef('garden');
  if (g.copy && g.copy[key] !== undefined && g.copy[key] !== null && g.copy[key] !== '') return g.copy[key];
  return fallback;
}
function applyThemeToDom() {
  var t = currentTheme();
  try { document.body.setAttribute('data-theme', t); } catch (e) {}
  try {
    var color = themeDef(t).themeColor || '#0b100e';
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', color);
  } catch (e) {}
}
function setTheme(id) {
  if (typeof S === 'undefined') return;
  S.theme = (id === 'highway' || id === 'mine') ? id : 'garden';
  safeSet('dg_theme', S.theme);
  applyThemeToDom();
  try { showScreen(currentScreen); } catch (e) {}
}
function milestoneFlower(dh, tier, kind) {
  // kind: 'cumulative' | 'single'
  var theme = currentTheme();
  if (theme !== 'garden' && dh && dh.id) {
    var th = themeDef(theme);
    var rb = (th.rewardBases && th.rewardBases[dh.id]) || {};
    if (rb.name || rb.emoji) {
      var words = (th.tierWords && th.tierWords[kind]) || {};
      var w = words[String(tier)] || '';
      var tr = (D.milestones && D.milestones.tierRarity) || {};
      return {
        name: (w ? w + ' ' : '') + (rb.name || String(dh.transliteration || dh.id)),
        emoji: rb.emoji || (theme === 'mine' ? '💎' : '🏎️'),
        rarity: tr[String(tier)] || TIER_RARITY[tier] || 'Common'
      };
    }
  }
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
  var theme = currentTheme();
  if (theme !== 'garden' && dh && dh.id) {
    var th = themeDef(theme);
    var rb = (th.rewardBases && th.rewardBases[dh.id]) || {};
    if (rb.name || rb.emoji) return { name: rb.name || 'Reward', emoji: rb.emoji || (theme === 'mine' ? '💎' : '🏎️') };
  }
  var f = (dh && dh.flower && typeof dh.flower === 'object') ? dh.flower : {};
  return { name: f.name || 'Seedling', emoji: f.emoji || '🌱' };
}

/* ---------------- SPROUT mini-game constants (defined before state: state validation uses them) ---------------- */
var SPROUT_COST = 5; // adhkar credits per climb attempt
var SPROUT_COSTUMES = [
  { id: 'sproutling', name: 'Sproutling', emoji: '🌱', at: 0 },
  { id: 'bloom-rider', name: 'Bloom Rider', emoji: '🌸', at: 250 },
  { id: 'trailblazer', name: 'Trailblazer', emoji: '🌿', at: 750 },
  { id: 'golden-champion', name: 'Golden Champion', emoji: '🏆', at: 1500 }
];
function sproutCostumeById(id) {
  for (var i = 0; i < SPROUT_COSTUMES.length; i++) if (SPROUT_COSTUMES[i].id === id) return SPROUT_COSTUMES[i];
  return SPROUT_COSTUMES[0];
}
/* Deterministic PRNG (mulberry32) — platform layouts vary per attempt but never by luck. */
function sproutRng(seed) {
  var a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
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
  lastOpened: safeGet('dg_lastOpened', 0),
  dayCounts: safeGet('dg_daycounts', {}),       // {"YYYY-MM-DD": recitations that day} (for the "today" badge)
  theme: safeGet('dg_theme', 'garden'),            // active theme: 'garden' | 'highway' | 'mine'
  replants: safeGet('dg_replants', {}),           // {awardKey: [copyNumbers]} — re-planted variant copies
  replantChoice: safeGet('dg_replant_choice', null), // selected awardKey for the General counter re-plant card
  credits: (function () { var c = safeGet('dg_credits', 0); return (typeof c === 'number' && c >= 0) ? Math.floor(c) : 0; })(),
  creditAwards: safeGet('dg_credit_awards', {}),     // {"YYYY-MM-DD": {"morning": {idx:credits}, "evening": {idx:credits}}}
  sproutHigh: (function () { var h = safeGet('dg_sprout_high', 0); return (typeof h === 'number' && h >= 0) ? Math.floor(h) : 0; })(),
  sproutCostumes: safeGet('dg_sprout_costumes', ['sproutling']), // unlocked costume ids
  sproutEquipped: safeGet('dg_sprout_equipped', 'sproutling'),
  sproutAttempts: (function () { var a = safeGet('dg_sprout_attempts', 0); return (typeof a === 'number' && a >= 0) ? Math.floor(a) : 0; })()
};
if (typeof S.sessions !== 'number') S.sessions = 0;
if (typeof S.lifetime !== 'number') S.lifetime = 0;
if (!Array.isArray(S.garden)) S.garden = [];
if (!Array.isArray(S.general)) S.general = [];
if (!Array.isArray(S.announced)) S.announced = [];
if (!S.dayCounts || typeof S.dayCounts !== 'object' || Array.isArray(S.dayCounts)) S.dayCounts = {};
if (S.theme !== 'highway' && S.theme !== 'mine') S.theme = 'garden';   // unknown theme values fall back to garden
if (!S.replants || typeof S.replants !== 'object' || Array.isArray(S.replants)) S.replants = {};
if (!S.creditAwards || typeof S.creditAwards !== 'object' || Array.isArray(S.creditAwards)) S.creditAwards = {};
if (!Array.isArray(S.sproutCostumes) || !S.sproutCostumes.length) S.sproutCostumes = ['sproutling'];
if (SPROUT_COSTUMES.map(function (c) { return c.id; }).indexOf(S.sproutEquipped) === -1) S.sproutEquipped = 'sproutling';

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
  safeSet('dg_theme', S.theme);
  safeSet('dg_replants', S.replants);
  safeSet('dg_replant_choice', S.replantChoice);
  safeSet('dg_credits', S.credits);
  safeSet('dg_credit_awards', S.creditAwards);
  safeSet('dg_sprout_high', S.sproutHigh);
  safeSet('dg_sprout_costumes', S.sproutCostumes);
  safeSet('dg_sprout_equipped', S.sproutEquipped);
  safeSet('dg_sprout_attempts', S.sproutAttempts);
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
  if (st === 0) return T('stageSeed', '🌱');
  if (st === 1) return T('stageSprout', '🌿');
  return f.emoji || T('defaultEmoji', '🌸');
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
    sub: (flower.rarity ? flower.rarity + ' ' + T('awardNoun', 'bloom') + ' · ' : '') + T('awardVerb', 'planted in your garden 🌱')
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
  var gf = goldenFlowerFor(dh);   // theme-aware golden name/emoji
  var name = gf.name;
  var gemoji = gf.emoji;
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
  var dk = todayKey();
  S.dayCounts[dk] = (Number(S.dayCounts[dk]) || 0) + n;
  safeSet('dg_daycounts', S.dayCounts);
  saveState();
  checkMilestones(dh, n);
}

/* ---------------- re-planting ----------------
   A General counter session of 100+ reps can add another variant copy of an
   already-unlocked collectible. Finishes are deterministic (no randomness):
   Copy 2 = accent, Copy 3 = detailed trim, Copy 4+ = collector shine.
   Golden variants and the secret are one-of-one and can never be replanted.
   Listed-dhikr totals are never touched — this only grows the collection. */
function replantFinishFor(copyNum) {
  var theme = currentTheme();
  var table = (D.replantFinishes && D.replantFinishes[theme]) || (D.replantFinishes && D.replantFinishes.garden) || {};
  var f = table[copyNum >= 4 ? '4' : String(copyNum)] || table['2'] || {};
  return { word: f.word || 'Accent', desc: f.desc || 'Accent color unlocked' };
}
function replantBlocked(key) {
  return !key || /^m:gold:/.test(key) || key === 'm:secret';
}
/* unlocked collectibles eligible for replanting (theme-aware names) */
function replantChoices() {
  var list = getDhikr(), tahlil = findTahlil(), out = [];
  function push(key, name, emoji, label) {
    if (!S.herbarium[key] || replantBlocked(key)) return;   // locked, golden, or secret
    out.push({ key: key, name: name, emoji: emoji, label: label });
  }
  for (var i = 0; i < list.length; i++) {
    (function (dh) {
      var bf = baseFlower(dh);
      push('base:' + dh.id, bf.name, bf.emoji, dh.transliteration || dh.id);
      var slots = herbariumSlotsFor(dh, tahlil), s;
      for (s = 0; s < slots.length; s++) {
        if (slots[s].golden) continue;   // golden ladder slot: one-of-one
        push(slots[s].key, slots[s].name, slots[s].emoji, dh.transliteration || dh.id);
      }
    })(list[i]);
  }
  return out;
}
/* owned copy numbers for an award key, sorted (original = copy 1, not listed) */
function replantCopies(key) {
  var c = (S.replants && S.replants[key]) || [];
  if (!Array.isArray(c)) return [];
  return c.filter(function (n) { return Number(n) >= 2; })
    .map(Number).sort(function (a, b) { return a - b; });
}
/* first available copy number from 2 upward — reuses a deleted copy's number,
   never collides with an existing one */
function nextCopyNumber(key) {
  var copies = replantCopies(key), n = 2;
  while (copies.indexOf(n) !== -1) n++;
  return n;
}
/* theme-aware display info for a variant copy */
function replantVariantInfo(key, copyNum) {
  var baseName = null, baseEmoji = null, choices = replantChoices(), i;
  for (i = 0; i < choices.length; i++) {
    if (choices[i].key === key) { baseName = choices[i].name; baseEmoji = choices[i].emoji; break; }
  }
  if (baseName === null) {
    var rec = S.herbarium[key] || {};
    baseName = rec.name || 'Collectible';
    baseEmoji = rec.emoji || T('defaultEmoji', '🌸');
  }
  var fin = replantFinishFor(copyNum);
  return { name: baseName + ' · ' + fin.word, emoji: baseEmoji, finish: fin, copy: copyNum };
}
/* award a variant copy; returns false when ineligible */
function awardReplant(key) {
  if (replantBlocked(key) || !S.herbarium[key]) return false;
  var n = nextCopyNumber(key);
  var copies = replantCopies(key);
  copies.push(n);
  copies.sort(function (a, b) { return a - b; });
  if (!S.replants || typeof S.replants !== 'object') S.replants = {};
  S.replants[key] = copies;
  var v = replantVariantInfo(key, n);
  var dhikrId = null;
  var m = /^(?:m:[cs]:|m:sp:|base:)([^:]+)/.exec(key);
  if (m) dhikrId = m[1];
  var rec = S.herbarium[key] || {};
  plantFlower({ dhikrId: dhikrId, name: v.name, emoji: v.emoji, kind: 'replant', rarity: rec.rarity || '' });
  saveState();
  celebrate({
    emoji: v.emoji,
    title: v.name,
    sub: 'Copy ' + n + ' · ' + v.finish.desc + ' · added to your collection'
  });
  return true;
}
/* release (delete) a variant copy so its number can be replanted again */
function releaseReplant(key, copyNum) {
  var copies = replantCopies(key);
  var ix = copies.indexOf(Number(copyNum));
  if (ix === -1) return false;
  copies.splice(ix, 1);
  if (copies.length) S.replants[key] = copies;
  else delete S.replants[key];
  saveState();
  return true;
}
/* small chips showing owned copies + finishes, with release buttons */
function replantChipsFor(key) {
  var copies = replantCopies(key);
  if (!copies.length) return '';
  var html = '<div class="rcopies">';
  for (var i = 0; i < copies.length; i++) {
    var v = replantVariantInfo(key, copies[i]);
    html += '<span class="rcopy">' + esc(v.emoji) + ' Copy ' + copies[i] + ' · ' + esc(v.finish.word) +
      ' <button class="rcopy-x" data-rkey="' + esc(key) + '" data-rcopy="' + copies[i] +
      '" aria-label="Release copy ' + copies[i] + '">×</button></span>';
  }
  return html + '</div>';
}
function wireReplantReleases(sec) {
  var xs = sec.querySelectorAll('[data-rcopy]');
  for (var i = 0; i < xs.length; i++) {
    (function (b) {
      b.addEventListener('click', function (ev) {
        ev.stopPropagation();
        var k = b.getAttribute('data-rkey'), n = Number(b.getAttribute('data-rcopy'));
        if (window.confirm('Release Copy ' + n + '? You can plant it again later.')) {
          if (releaseReplant(k, n)) {
            toast('Copy released — plant it again any time 🌱');
            showScreen(currentScreen);
          }
        }
      });
    })(xs[i]);
  }
}

/* recitations logged today (drives the gold "N today" badge) */
function todayCount() {
  return Number(S.dayCounts[todayKey()]) || 0;
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
  return false; /* No locks on the Practice list: every remembrance is always pickable. */
}

/* ---------------- UI primitives ---------------- */
var SCREENS = ['home', 'practice', 'daily', 'learn', 'herbarium', 'articles', 'reader', 'progress', 'game', 'getting-started'];
var currentScreen = 'home';

function showScreen(name) {
  if (SCREENS.indexOf(name) === -1) name = 'home';
  try { stopSprout(); } catch (e) { /* game loop never blocks navigation */ }
  currentScreen = name;
  for (var i = 0; i < SCREENS.length; i++) {
    var sec = el('screen-' + SCREENS[i]);
    if (sec) sec.classList.toggle('active', SCREENS[i] === name);
  }
  var navs = document.querySelectorAll('#bottomnav .navbtn');
  for (var j = 0; j < navs.length; j++) {
    navs[j].classList.toggle('active', navs[j].getAttribute('data-screen') === name);
  }
  try { window.scrollTo(0, 0); } catch (e) { /* scroll optional */ }
  try {
    var fn = { home: renderHome, practice: renderPractice, daily: renderDaily,
               learn: renderLearn, herbarium: renderHerbarium, articles: renderArticles,
               reader: function () {}, progress: renderProgress, game: renderGame, 'getting-started': renderGettingStarted }[name];
    if (fn) fn();
  } catch (e) { /* a screen must never break navigation */ }
}


var modalQueue = [];
function celebrate(opts) {
  modalQueue.push(opts);
  if (!el('modal').hidden) return; // one at a time
  showNextModal();
}
function showNextModal() {
  var o = modalQueue.shift();
  if (!o) { el('modal').hidden = true; return; }
  el('modal-emoji').textContent = o.emoji || T('defaultEmoji', '🌸');
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

/* next unearned milestone for one specific dhikr (drives the practice card pill + "Next:" line) */
function nextMilestoneFor(dh) {
  if (!dh) return null;
  var cands = [];
  var total = Number(S.totals[dh.id]) || 0;
  var best = Number(S.best[dh.id]) || 0;
  var k, tier;
  for (k = 0; k < MILESTONE_TIERS.length; k++) {
    tier = MILESTONE_TIERS[k];
    if (!S.milestones['c:' + dh.id + ':' + tier])
      cands.push({ threshold: tier, current: total, kind: 'cumulative' });
    if (!S.milestones['s:' + dh.id + ':' + tier])
      cands.push({ threshold: tier, current: best, kind: 'single' });
  }
  var tahlil = findTahlil();
  if (tahlil && tahlil.id === dh.id) {
    var sp = getSpecials();
    ['10000', '70000'].forEach(function (T) {
      if (!S.milestones['sp:' + dh.id + ':' + T])
        cands.push({ threshold: Number(T), current: total, kind: 'special', flower: sp[T] });
    });
  }
  var bestC = null;
  for (var i = 0; i < cands.length; i++) {
    var rem = cands[i].threshold - cands[i].current;
    if (rem <= 0) continue;
    if (!bestC || rem < bestC.remaining) {
      var fl = cands[i].flower || milestoneFlower(dh, cands[i].threshold, cands[i].kind);
      bestC = { remaining: rem, threshold: cands[i].threshold, current: cands[i].current,
                kind: cands[i].kind, flower: fl };
    }
  }
  return bestC;
}

function renderNextReward() {
  var nr = nextRewardInfo();
  if (!nr) {
    return '<div class="card"><span class="kicker k-gold">Next reward</span>' +
      '<h2>' + esc(T('rewardDoneTitle', 'Garden complete')) + '</h2><p class="muted">' +
      esc(T('rewardDoneBody', 'Every bloom discovered. May your garden keep growing with every remembrance.')) + '</p></div>';
  }
  var pct = Math.min(100, Math.max(0, (nr.current / nr.threshold) * 100));
  var dhName = nr.dhikr ? (nr.dhikr.transliteration || nr.dhikr.id) : 'lifetime dhikr';
  var kindLabel = nr.kind === 'single' ? 'in one sitting' : 'cumulative';
  return '<div class="card"><span class="kicker k-gold">Next reward</span>' +
    '<div class="nr-card"><div class="nr-ico">' + esc(nr.flower.emoji) + '</div>' +
    '<div class="nr-body"><h3>' + esc(nr.flower.name) + '</h3>' +
    '<div class="nr-sub">' + fmtNum(nr.remaining) + ' more ' + esc(dhName) + ' &middot; ' + esc(kindLabel) + '</div>' +
    '<div class="nr-rarity">' + esc(nr.flower.rarity || '') + '</div></div>' +
    '<button class="nr-go" data-go="practice">Go</button></div>' +
    '<div class="pbar"><i style="width:' + pct.toFixed(1) + '%"></i></div>' +
    '<div class="pbar-label"><span>' + fmtNum(nr.current) + '</span><span>' + fmtNum(nr.threshold) + '</span></div></div>';
}

/* Illustrated garden scene for the home hero: night sky, sun, soil mound,
   the gardener's latest bloom at center, dotted ghost-flower outlines. */
/* ---------------- themed home hero scenes ---------------- */
function heroScene() {
  var t = currentTheme();
  if (t === 'highway') return highwayScene();
  if (t === 'mine') return mineScene();
  return gardenScene();
}
function latestRewardEmoji(fallback) {
  for (var g = S.garden.length - 1; g >= 0; g--) {
    if (S.garden[g] && S.garden[g].emoji) return S.garden[g].emoji;
  }
  return fallback;
}
function highwayScene() {
  var car = latestRewardEmoji('🏎️');
  return '<div class="highway-scene" aria-hidden="true">' +
    '<div class="hw-glow"></div>' +
    '<div class="hw-road"><i></i><i></i><i></i><i></i><i></i></div>' +
    '<div class="hw-car">' + esc(car) + '</div>' +
    '<div class="hw-speed"><i></i><i></i><i></i></div>' +
    '<div class="hw-sign">🏁</div></div>';
}
function mineScene() {
  var gem = latestRewardEmoji('💎');
  return '<div class="mine-scene" aria-hidden="true">' +
    '<div class="mn-wall"></div>' +
    '<div class="mn-gem">' + esc(gem) + '</div>' +
    '<div class="mn-spark"><i></i><i></i><i></i></div>' +
    '<div class="mn-pick">⛏️</div>' +
    '<div class="mn-floor"></div></div>';
}
function gardenScene() {
  var stars = '';
  var pts = [[6, 12], [18, 30], [32, 8], [47, 22], [60, 10], [74, 28], [88, 14], [12, 48], [94, 44], [40, 40]];
  for (var i = 0; i < pts.length; i++) {
    stars += '<i style="left:' + pts[i][0] + '%;top:' + pts[i][1] + '%"></i>';
  }
  var latest = null;
  for (var g = S.garden.length - 1; g >= 0; g--) {
    if (S.garden[g] && S.garden[g].emoji) { latest = S.garden[g].emoji; break; }
  }
  var ghosts = '<div class="gs-ghost" style="left:18%;bottom:52px"><div class="gf-head"></div><div class="gf-stem"></div></div>' +
    '<div class="gs-ghost" style="left:34%;bottom:60px"><div class="gf-head"></div><div class="gf-stem"></div></div>' +
    '<div class="gs-ghost" style="left:68%;bottom:58px"><div class="gf-head"></div><div class="gf-stem"></div></div>' +
    '<div class="gs-ghost" style="left:83%;bottom:50px"><div class="gf-head"></div><div class="gf-stem"></div></div>';
  return '<div class="garden-scene" aria-hidden="true"><div class="gs-stars">' + stars + '</div>' +
    '<div class="gs-sun"></div>' + ghosts +
    '<div class="gs-stem" style="left:50%;height:56px"></div>' +
    '<div class="gs-flower" style="left:50%;bottom:88px">' + esc(latest || '🌸') + '</div>' +
    '<div class="gs-soil"></div></div>';
}

/* line-icon SVGs for the Explore section cards */
var SEC_ICONS = {
  practice: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>',
  daily: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/><path d="M9 15l2 2 4-4"/></svg>',
  learn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zm0 0a2 2 0 0 0 2 2h13"/></svg>',
  herbarium: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21v-8"/><path d="M12 13c0-3.5 2.5-6 6-6 0 3.5-2.5 6-6 6z"/><path d="M12 13c0-3.5-2.5-6-6-6 0 3.5 2.5 6 6 6z"/></svg>',
  articles: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2h9l5 5v15a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><path d="M14 2v6h6M9 13h7M9 17h7"/></svg>',
  progress: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
  game: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 11v4M5 13h4"/><circle cx="16" cy="11.5" r="1" fill="currentColor"/><circle cx="18.5" cy="14" r="1" fill="currentColor"/></svg>'
};

/* theme picker card (Home): three worlds, one tap switches and re-renders */
function themePickerCard() {
  var ids = ['garden', 'highway', 'mine'];
  var cur = currentTheme();
  var html = '<section class="card"><span class="kicker k-sage">' + esc(T('themeKicker', 'Choose your world')) + '</span>' +
    '<h2 style="margin:0 0 4px">' + esc(T('themeTitle', 'Pick a theme')) + '</h2><div class="theme-grid">';
  for (var i = 0; i < ids.length; i++) {
    var th = themeDef(ids[i]);
    html += '<button class="theme-opt' + (ids[i] === cur ? ' active' : '') + '" data-theme-pick="' + ids[i] + '"' +
      ' aria-pressed="' + (ids[i] === cur ? 'true' : 'false') + '">' +
      '<span class="theme-emoji">' + esc(th.emoji || '🌱') + '</span>' +
      '<b>' + esc(th.name || ids[i]) + '</b><i>' + esc(th.tagline || '') + '</i></button>';
  }
  return html + '</div></section>';
}
function sectionGrid() {
  var list = getDhikr();
  var practiced = 0, i;
  for (i = 0; i < list.length; i++) { if ((Number(S.totals[list[i].id]) || 0) > 0) practiced++; }
  var herbProg = herbariumProgress();
  var items = [
    ['practice', 'Practice', 'Count a dhikr', '#7bc496'],
    ['daily', 'Daily rhythm', 'Morning & evening', '#f0a05a'],
    ['learn', 'Learning path', practiced + '/' + list.length + ' practiced', '#7fb5e8'],
    ['herbarium', T('collection', 'Herbarium'), herbProg.known + '/' + herbProg.total + ' discovered', '#e08ac0'],
    ['articles', 'Articles', getArticles().length + ' pages', '#f0a05a'],
    ['progress', 'Progress', fmtNum(S.lifetime) + ' lifetime', '#7fb5e8'],
    ['game', 'Sprout climb', 'Mini-game · ' + fmtNum(S.credits) + ' credits', '#9fe0b8']
  ];
  var html = '<span class="kicker k-sage">Explore</span><h2 class="giant-sm">Open a section</h2><div class="sec-grid">';
  for (i = 0; i < items.length; i++) {
    html += '<button class="sec-card" data-go="' + items[i][0] + '" style="--edge:' + items[i][3] + '">' +
      '<span class="sec-ico">' + (SEC_ICONS[items[i][0]] || '') + '</span>' +
      '<span class="sec-txt"><b>' + esc(items[i][1]) + '</b><i>' + esc(items[i][2]) + '</i></span></button>';
  }
  return html + '</div>';
}

/* Herbarium collection preview: featured dhikr's base + cumulative ladder (card look, compact) */
function herbariumPreview() {
  var dh = findTahlil() || getDhikr()[0];
  if (!dh) return '';
  var slots = [
    { key: 'base:' + dh.id, label: 'First bloom', flower: baseFlower(dh), pill: (dh.flower && dh.flower.rarity) || 'Common' },
    { key: 'm:c:' + dh.id + ':100', label: '100 · cumulative', flower: milestoneFlower(dh, 100, 'cumulative') },
    { key: 'm:c:' + dh.id + ':500', label: '500 · cumulative', flower: milestoneFlower(dh, 500, 'cumulative') },
    { key: 'm:c:' + dh.id + ':1000', label: '1,000 · cumulative', flower: milestoneFlower(dh, 1000, 'cumulative') }
  ];
  var html = '<div class="card"><span class="kicker k-sage">' + esc(T('previewKicker', 'Collection preview')) + '</span>' +
    '<div class="row-between"><h2>' + esc(T('collection', 'Herbarium')) + '</h2><button class="link-arrow" data-go="herbarium">Open &rarr;</button></div>' +
    '<div class="herb-prev-grid">';
  for (var i = 0; i < slots.length; i++) {
    var rec = S.herbarium[slots[i].key];
    var fl = slots[i].flower || {};
    var pill = rec ? (rec.rarity || slots[i].pill || fl.rarity || 'Common') : (slots[i].pill || fl.rarity || 'Common');
    html += herbBloomCard({
      emoji: fl.emoji || T('defaultEmoji', '🌸'),
      name: fl.name,
      pill: pill, pillCls: pillClsFor(pill),
      label: rec ? (dh.transliteration || '') : slots[i].label,
      known: !!rec,
      extra: replantChipsFor(slots[i].key)
    });
  }
  return html + '</div></div>';
}

/* compact daily-rhythm preview for home (taps through to the Daily screen) */
function dailyPreview() {
  var daily = getDaily();
  var mItems = daily.morning || [], eItems = daily.evening || [];
  var day = checklistDay();
  function doneCount(items, rec) {
    var n = 0;
    for (var i = 0; i < items.length; i++) { if (rec && rec[i]) n++; }
    return n;
  }
  var mDone = doneCount(mItems, day.morning), eDone = doneCount(eItems, day.evening);
  var html = '<div class="card"><span class="kicker k-gold">Today&rsquo;s gentle rhythm</span>' +
    '<div class="row-between"><h2>Morning &amp; evening</h2><button class="link-arrow" data-go="daily">View all &rarr;</button></div>' +
    '<div class="tabs" style="margin-top:10px">' +
    '<button class="tab active" data-goto-daily="morning"><span>Morning</span><b>' + mDone + '/' + mItems.length + '</b></button>' +
    '<button class="tab" data-goto-daily="evening"><span>Evening</span><b>' + eDone + '/' + eItems.length + '</b></button></div>';
  var shown = mItems.slice(0, 2);
  for (var i = 0; i < shown.length; i++) {
    var it = shown[i] || {};
    var checked = !!(day.morning && day.morning[i]);
    html += '<div class="check-row' + (checked ? ' done' : '') + '" data-goto-daily="morning" style="cursor:pointer">' +
      '<span class="bigcheck" style="display:block;' + (checked ? 'background:var(--gold);border-color:var(--gold)' : '') + '">' +
      (checked ? '<span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--gold-ink);font-size:1.8rem;font-weight:900">✓</span>' : '') + '</span>' +
      '<div class="check-body">' + (it.arabic ? arabicBlock(it.arabic, 'arabic-mid') : '') +
      (it.count ? '<span class="check-count">&times;' + esc(it.count) + '</span>' : '') + '</div></div>';
  }
  return html + '</div>';
}

/* atmosphere card (folds in prayer info + the once-only location prompt) */
function atmosphereCard(now, np, season, hijri) {
  var prayerName = '';
  if (np && np.prev) prayerName = np.prev.name;
  else if (np && np.cur) prayerName = np.cur.name;
  var html = '<div class="card"><span class="kicker k-sage">' + esc(T('atmosphereKicker', 'Garden atmosphere')) + '</span>' +
    '<div class="atm-row"><h2>' + esc(season && season.name && season.id !== 'default' ? season.name : T('defaultSeason', 'Everyday garden')) + '</h2>' +
    '<div class="atm-time">' + esc(fmtClock(now)) + (prayerName ? '<span>' + esc(prayerName) + '</span>' : '') + '</div></div>' +
    '<p class="muted" style="margin-top:8px">' + (hijri ? esc(hijri) + ' &middot; ' : '') +
    'Lighting follows today&rsquo;s calculated prayer times.</p>';
  if (S.location === null) {
    html += '<div class="btn-row"><button class="btn-gold" id="loc-yes">Share location</button>' +
      '<button class="btn-ghost" id="loc-no">Not now</button></div>' +
      '<p class="muted" style="margin-top:8px;font-size:.8rem">Share once for accurate prayer times. It stays on your phone &mdash; nothing is sent anywhere.</p>';
  }
  return html + '</div>';
}

function renderHome() {
  var sec = el('screen-home');
  if (!sec) return;
  var away = newlyMatured();
  var season = currentSeason();
  var hijri = hijriDateString();
  var now = new Date();
  var np = nextPrayer(now);
  var list = getDhikr();
  var herbProg = herbariumProgress();
  var discovered = herbProg.known;
  var totalKeys = herbProg.total;
  var practiced = 0, i;
  for (i = 0; i < list.length; i++) { if ((Number(S.totals[list[i].id]) || 0) > 0) practiced++; }
  var html = '';

  // header: kicker + giant title + gold "today" badge
  html += '<span class="kicker k-sage">' + esc(T('homeKicker', 'Your quiet patch')) + '</span>';
  html += '<div class="home-head"><h1 class="giant">Home</h1>' +
    '<span class="today-badge">' + fmtNum(todayCount()) + '<small>today</small></span></div>';

  // while-you-were-away (offline maturation notice)
  if (away.length) {
    var names = away.slice(0, 4).map(function (f) { return esc(f.name); }).join(', ');
    var more = away.length > 4 ? ' +' + (away.length - 4) + ' more' : '';
    var awayUnit = away.length > 1 ? T('awayPlur', 'flowers bloomed') : T('awaySing', 'flower bloomed');
    html += '<div class="notice"><span class="ntitle">While you were away&hellip;</span>' +
      esc(String(away.length)) + ' ' + esc(awayUnit) + ': ' + names + more + '</div>';
  }

  // garden hero
  html += '<section class="card garden-hero"><span class="kicker k-sage">' + esc(T('heroKicker', 'Your garden')) + '</span>' +
    '<h2 class="hero-title">' + esc(T('heroTitle', 'What you remember, grows.')) + '</h2>' + heroScene() +
    '<div class="hero-lines"><div><b>' + discovered + '/' + totalKeys + '</b> ' + esc(T('milestoneUnit', 'milestone blooms')) + '</div>' +
    '<div><b>' + fmtNum(S.lifetime) + '</b> remembrances tended</div></div>' +
    '<div class="stat-row"><div class="stat"><b>' + discovered + '</b><span>' + esc(T('statUnit', 'blooms')) + '</span></div>' +
    '<div class="stat"><b>' + fmtNum(S.lifetime) + '</b><span>lifetime</span></div>' +
    '<div class="stat"><b>' + practiced + '</b><span>phrases</span></div></div></section>';

  // theme picker
  html += themePickerCard();

  // next reward
  html += renderNextReward();

  // getting started
  html += '<section class="card"><span class="kicker k-sage">' + esc(T('gsKicker', 'New to the garden?')) + '</span>' +
    '<div class="row-between"><div><h2 style="margin:0 0 4px">Getting started</h2>' +
    '<p class="muted" style="margin:0">' + esc(T('gsBody', 'Learn how practice grows your garden and unlocks new blooms.')) + '</p></div>' +
    '<button class="link-arrow" data-go="getting-started">Start &rarr;</button></div></section>';

  // daily rhythm preview
  html += dailyPreview();

  // explore grid
  html += sectionGrid();

  // herbarium preview
  html += herbariumPreview();

  // atmosphere
  html += atmosphereCard(now, np, season, hijri);

  sec.innerHTML = html;

  // wire navigation buttons
  var gos = sec.querySelectorAll('[data-go]');
  for (var k = 0; k < gos.length; k++) {
    (function (b) { b.addEventListener('click', function () { showScreen(b.getAttribute('data-go')); }); })(gos[k]);
  }
  var gd = sec.querySelectorAll('[data-goto-daily]');
  for (var q = 0; q < gd.length; q++) {
    (function (b) { b.addEventListener('click', function () { dailyTab = b.getAttribute('data-goto-daily'); showScreen('daily'); }); })(gd[q]);
  wireReplantReleases(sec);
  }
  var tp = sec.querySelectorAll('[data-theme-pick]');
  for (var tp_i = 0; tp_i < tp.length; tp_i++) {
    (function (b) { b.addEventListener('click', function () { setTheme(b.getAttribute('data-theme-pick')); }); })(tp[tp_i]);
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
      var unlocked = true; /* Practice dropdown never locks: all remembrances pickable. */
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

var practiceMode = 'listed'; // 'listed' | 'general' — segmented toggle on the Practice screen

function wirePracticeChrome(sec) {
  var gos = sec.querySelectorAll('[data-go]');
  for (var k = 0; k < gos.length; k++) {
    (function (b) { b.addEventListener('click', function () { showScreen(b.getAttribute('data-go')); }); })(gos[k]);
  }
  var modes = sec.querySelectorAll('[data-pmode]');
  for (var m = 0; m < modes.length; m++) {
    (function (b) { b.addEventListener('click', function () { practiceMode = b.getAttribute('data-pmode'); renderPractice(); }); })(modes[m]);
  }
}

function renderPractice() {
  var sec = el('screen-practice');
  if (!sec) return;
  var list = getDhikr();
  var html = '<button class="backlink" data-go="home">← Garden</button>' +
    '<span class="kicker k-sage">Quiet counting</span>' +
    '<h1 class="giant">Count your dhikr</h1>' +
    '<div class="seg"><button class="seg-btn' + (practiceMode === 'listed' ? ' active' : '') +
    '" data-pmode="listed">Listed remembrance</button>' +
    '<button class="seg-btn' + (practiceMode === 'general' ? ' active' : '') +
    '" data-pmode="general">General counter</button></div>';

  if (practiceMode === 'general') {
    html += renderGeneralCounter();
    sec.innerHTML = html;
    wirePracticeChrome(sec);
    wireGeneral(sec);
    return;
  }

  if (!list.length) {
    html += '<div class="card"><div class="empty-note">Practice content is being prepared —<br>check back soon, inshaAllah.</div></div>';
    sec.innerHTML = html;
    wirePracticeChrome(sec);
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

  html += '<div class="card dd-card"><label class="field" for="dhikr-select">Remembrance</label>' +
    '<select id="dhikr-select">' + practiceOptions() + '</select>' +
    '<div class="dd-cap">' + list.length + ' remembrances &middot; choose one to begin</div></div>';
  html += '<div id="practice-body">' + practiceBody(dh, locked) + '</div>';
  sec.innerHTML = html;
  wirePracticeChrome(sec);

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
}

function practiceBody(dh, locked) {
  if (!dh) return '<div class="card"><div class="empty-note">Choose a dhikr above.</div></div>';
  if (locked) {
    var found = dhikrStage(dh);
    var req = found ? (Number(found.stage.sessionsRequired) || 0) : 0;
    return '<div class="card prac-card"><div class="empty-note">This dhikr unlocks after <b>' + req +
      '</b> practice sessions.<br>You have <b>' + S.sessions + '</b> so far — keep going!</div></div>';
  }
  var nm = nextMilestoneFor(dh);
  var html = '<div class="card prac-card">';
  if (nm && nm.flower && nm.flower.rarity) {
    html += '<span class="rarity-pill">' + esc(nm.flower.rarity) + '</span>';
  }
  if (dh.arabic) html += arabicBlock(dh.arabic, 'arabic-big');
  if (dh.transliteration) html += '<p class="translit">' + esc(dh.transliteration) + '</p>';
  if (dh.translation) html += '<p class="translation">' + esc(dh.translation) + '</p>';
  if (nm && nm.flower) {
    var kindLabel = nm.kind === 'single' ? 'in one sitting' : 'cumulative';
    html += '<div class="next-line">Next: ' + esc(nm.flower.name) + ' &middot; ' + fmtNum(nm.threshold) + ' ' + esc(kindLabel) + '</div>';
  }
  if (dh.virtue) html += '<p class="virtue-line">' + esc(dh.virtue) + '</p>';

  var targets = [33, 100, 500, 1000];
  if (dh && Number(dh.target) > 0 && targets.indexOf(Number(dh.target)) === -1) targets.push(Number(dh.target));
  targets.sort(function (a, b) { return a - b; });
  html += '<div class="target-row"><label for="target-select">Target</label>' +
    '<select id="target-select">' +
    targets.map(function (t) {
      return '<option value="' + t + '"' + (PC.target === t ? ' selected' : '') + '>' + t + '</option>';
    }).join('') + '</select></div>';

  html += '<button class="tap-circle" id="tap-btn" aria-label="Tap for dhikr">' +
    '<span class="tap-num" id="tap-count">' + PC.count + '</span>' +
    '<span class="tap-of">of <span id="tap-target">' + PC.target + '</span></span></button>' +
    '<div class="tap-hint">Tap to count</div>' +
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
  if (n <= 0) { toast('Tap a few times first ' + T('tapEmoji', '🌱')); return; }
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
    sub: fmtNum(n) + ' × ' + (dh.transliteration || dh.id) + ' · a ' + bf.name + ' ' + T('sessionVerb', 'was planted') + ' ' + T('sessionEmoji', '🌱')
  });
  renderPractice();
}

/* ---- general counter (no flower, logged as "General dhikr") ----
   A 100+ session can also plant another variant copy of an unlocked collectible. */
function renderReplantCard() {
  var choices = replantChoices();
  var html = '<div class="card"><span class="kicker k-sage">Collection choice</span>';
  if (!choices.length) {
    html += '<h3 style="margin:0 0 6px">Choose what to collect again</h3>' +
      '<p class="muted" style="margin:0">Unlock a collectible first — finish any dhikr session or reach a milestone — then you can plant another version of it here.</p></div>';
    return html;
  }
  var sel = S.replantChoice, i, valid = false;
  for (i = 0; i < choices.length; i++) if (choices[i].key === sel) { valid = true; break; }
  if (!valid) sel = choices[0].key;
  var copies = replantCopies(sel);
  var owned = 1 + copies.length;
  var next = nextCopyNumber(sel);
  var v = replantVariantInfo(sel, next);
  html += '<div class="row-between"><h3 style="margin:0">Choose what to collect again</h3>' +
    '<span class="owned-badge">' + owned + ' owned</span></div>' +
    '<label class="field" for="replant-select" style="margin-top:10px">Unlocked collectible</label>' +
    '<select id="replant-select">';
  for (i = 0; i < choices.length; i++) {
    var c = choices[i];
    html += '<option value="' + esc(c.key) + '"' + (c.key === sel ? ' selected' : '') + '>' +
      esc(c.name + (c.label ? ' · ' + c.label : '')) + '</option>';
  }
  html += '</select>' +
    '<div class="replant-preview"><div class="rp-emoji">' + esc(v.emoji) + '</div>' +
    '<div><div class="rp-name">' + esc(v.name) + '</div>' +
    '<div class="rp-sub">Copy ' + next + ' · ' + esc(v.finish.desc) + '</div></div></div>' +
    '<p class="muted" style="margin:10px 0 0">100 more repetitions to add this variant.</p></div>';
  return html;
}

function renderGeneralCounter() {
  var presets = getGeneralPresets();
  var html = '<div class="card"><span class="kicker k-sage">Use this for any dhikr</span>' +
    '<p class="muted" style="margin:0">Save 100 or more repetitions to add a new version of an eligible collectible you have already unlocked. Golden and secret rewards stay one-of-one, and your listed-dhikr totals stay unchanged.</p></div>';
  html += renderReplantCard();
  html += '<div class="card" style="border:2px dashed var(--gold)"><span class="kicker">General counter</span>' +
    '<h3>🔢 Count anything</h3>' +
    '<p class="muted">For any remembrance not listed above. Saved as “General dhikr” — counts only, your listed-dhikr totals stay unchanged.</p>' +
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
  var rs = el('replant-select');
  if (rs) {
    if (S.replantChoice) { try { rs.value = S.replantChoice; } catch (e) {} }
    rs.addEventListener('change', function () {
      S.replantChoice = rs.value || null;
      safeSet('dg_replant_choice', S.replantChoice);
      renderPractice();
    });
  }
}

function saveGeneral(early) {
  var n = PC.generalCount;
  if (n <= 0) { toast('Tap a few times first ' + T('tapEmoji', '🌱')); return; }
  S.general.push({ count: n, at: Date.now() });
  S.lifetime += n;
  var dk = todayKey();
  S.dayCounts[dk] = (Number(S.dayCounts[dk]) || 0) + n;
  safeSet('dg_daycounts', S.dayCounts);
  // 100+ reps also plants another variant copy of the chosen unlocked collectible
  var replanted = false;
  if (n >= 100 && S.replantChoice) {
    replanted = awardReplant(S.replantChoice);
  }
  saveState();
  // lifetime secret still applies to general counts
  var secret = getSecret();
  if (S.lifetime >= secret.threshold && !S.milestones['secret']) {
    S.milestones['secret'] = true;
    plantFlower({ dhikrId: null, name: secret.name, emoji: secret.emoji, kind: 'secret', rarity: secret.rarity });
    discoverFlower('m:secret', secret.name, secret.emoji, secret.rarity);
    saveState();
    celebrate({ emoji: secret.emoji, title: secret.name, sub: 'SECRET UNLOCKED · ' + fmtNum(secret.threshold) + ' lifetime remembrances!' });
  } else if (!replanted) {
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

/* ---------------- adhkar credit wallet ----------------
   Each checklist item awards 1-4 credits once per day per period.
   Unchecking never revokes; rechecking never double-awards. */
function itemCredits(it) {
  var c = Number(it && it.credits);
  if (!(c >= 1 && c <= 9)) c = 1;
  return Math.round(c);
}
function awardCredits(period, idx, it) {
  var k = todayKey();
  if (!S.creditAwards[k] || typeof S.creditAwards[k] !== 'object') S.creditAwards[k] = { morning: {}, evening: {} };
  var rec = S.creditAwards[k][period];
  if (!rec || typeof rec !== 'object') rec = S.creditAwards[k][period] = {};
  if (rec[idx]) return 0;
  var c = itemCredits(it);
  rec[idx] = c;
  S.credits = (Number(S.credits) || 0) + c;
  var keys = Object.keys(S.creditAwards).sort();
  while (keys.length > 14) { delete S.creditAwards[keys.shift()]; }
  saveState();
  return c;
}
function creditWalletCard(withPlay) {
  var html = '<div class="card"><div class="row-between"><div><span class="kicker k-gold">🪙 Adhkar credits</span>' +
    '<div style="font-size:1.6rem;font-weight:900;color:var(--cream)">' + fmtNum(S.credits) + '</div></div>' +
    (withPlay ? '<button class="btn-gold" data-go="game">Play Sprout 🕹️</button>' : '') + '</div>' +
    '<p class="muted" style="margin:8px 0 0">Earn credits by completing morning &amp; evening adhkar — harder ones are worth more. ' +
    'Each climb costs ' + SPROUT_COST + ' credits.</p></div>';
  return html;
}

function renderDaily() {
  var sec = el('screen-daily');
  if (!sec) return;
  var daily = getDaily();
  var mItems = daily.morning || [], eItems = daily.evening || [];
  var html = '<button class="backlink" data-go="home">← Home</button>' +
    '<span class="kicker k-sage">Today&rsquo;s gentle rhythm</span>' +
    '<h1 class="giant">Morning &amp; evening</h1>' +
    '<p class="lede">Check each remembrance as you complete it. Open &ldquo;Read transliteration&rdquo; ' +
    'whenever you need help reading the Arabic; progress is saved for today with no streak penalty.</p>';

  html += '<div class="card" style="text-align:center">' +
    '<span class="kicker k-sage">🎧 Listen along</span>' +
    '<h2 style="margin:6px 0 4px">Awrad al-Tahsin</h2>' +
    '<p class="muted">Play the audio recitation in a new tab, then follow along while you check off the list below.</p>' +
    '<a class="btn-gold" style="display:block;text-align:center;text-decoration:none" href="https://www.aicp.org/index.php/islamic-information/audio/2015-06-04-14-18-23/558-2015-09-27-15-26-58" target="_blank" rel="noopener">▶ Play audio</a></div>';

  html += creditWalletCard(true);

  var items = dailyTab === 'morning' ? mItems : eItems;
  var day = checklistDay();
  var mDone = 0, eDone = 0, i;
  for (i = 0; i < mItems.length; i++) { if (day.morning && day.morning[i]) mDone++; }
  for (i = 0; i < eItems.length; i++) { if (day.evening && day.evening[i]) eDone++; }
  var done = dailyTab === 'morning' ? mDone : eDone;

  if (!items.length) {
    html += '<div class="card"><div class="empty-note">Daily remembrances are being prepared —<br>check back soon, inshaAllah.</div></div>';
  } else {
    html += '<div class="card checklist-card"><span class="kicker k-sage">Today&rsquo;s checklist</span>' +
      '<div class="check-head"><h2>' + (dailyTab === 'morning' ? 'Morning' : 'Evening') + '</h2>' +
      '<span class="check-done-count">' + done + '/' + items.length + '</span></div>' +
      '<div class="tabs"><button class="tab' + (dailyTab === 'morning' ? ' active' : '') +
      '" data-tab="morning"><span>Morning</span><b>' + mDone + '/' + mItems.length + '</b></button>' +
      '<button class="tab' + (dailyTab === 'evening' ? ' active' : '') +
      '" data-tab="evening"><span>Evening</span><b>' + eDone + '/' + eItems.length + '</b></button></div>' +
      '<div id="daily-list">';
    for (i = 0; i < items.length; i++) {
      (function (idx, it) {
        var checked = !!day[dailyTab][idx];
        html += '<div class="check-row' + (checked ? ' done' : '') + '" data-idx="' + idx + '">' +
          '<input type="checkbox" class="bigcheck" ' + (checked ? 'checked' : '') +
          ' aria-label="Mark complete: ' + esc(it.transliteration || ('item ' + (idx + 1))) + '">' +
          '<div class="check-body">';
        if (it.arabic) html += arabicBlock(it.arabic, 'arabic-mid');
        if (it.transliteration || it.count) {
          html += '<button class="translit-toggle" aria-expanded="false"><span>Read transliteration' +
            (it.count ? ' &middot; &times;' + esc(it.count) : '') + '</span><span class="tt-plus">+</span></button>' +
            '<div class="translit-body" hidden>' +
            (it.transliteration ? '<p class="translit">' + esc(it.transliteration) + '</p>' : '') +
            (it.count ? '<p class="muted">Repeat <b>' + esc(it.count) + '</b> times</p>' : '') + '</div>';
        } else if (it.count) {
          html += '<span class="check-count">&times;' + esc(it.count) + '</span>';
        }
        html += '</div></div>';
      })(i, items[i] || {});
    }
    html += '</div></div>';
    html += '<div class="card" style="text-align:center"><span class="kicker k-sage">Today</span>' +
      '<div style="font-size:1.6rem;font-weight:900;color:var(--cream)">' + done + ' / ' + items.length + ' complete</div>' +
      '<div class="pbar green"><i style="width:' + (items.length ? (done / items.length * 100).toFixed(0) : 0) + '%"></i></div></div>';
  }

  sec.innerHTML = html;

  var gos = sec.querySelectorAll('[data-go]');
  for (var g = 0; g < gos.length; g++) {
    (function (b) { b.addEventListener('click', function () { showScreen(b.getAttribute('data-go')); }); })(gos[g]);
  }
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
        if (box.checked) {
          d[dailyTab][idx] = 1;
          var gained = awardCredits(dailyTab, idx, items[idx]);
          if (gained > 0) toast('+' + gained + ' adhkar credits 🪙');
        } else delete d[dailyTab][idx];
        saveState();
        renderDaily(); // refresh list + summary (toggle states reset — acceptable)
      });
      if (tog && body) tog.addEventListener('click', function () {
        var open = body.hidden;
        body.hidden = !open;
        tog.setAttribute('aria-expanded', String(open));
        var plus = tog.querySelector('.tt-plus');
        if (plus) plus.textContent = open ? '−' : '+';
      });
    })(rows[r]);
  }
}

/* ---------------- LEARN (learning path / unlock stages) ---------------- */
/* Learn timeline: 10 phrases, flat numbered list, no stages, no locks. */
var LEARN_ITEMS = [
  { desc: 'Begin with tahlil', name: 'la ilaha illallah', dhikrId: 'tahlil' },
  { desc: 'Learn takbir', name: 'Allahu akbar', dhikrId: 'allahu-akbar' },
  { desc: 'Learn tasbih', name: 'subhanallah', dhikrId: 'subhanallah' },
  { desc: 'Learn tahmid', name: 'alhamdulillah', dhikrId: 'alhamdulillah' },
  { desc: 'Plant with praise', name: 'subhanallah wa bihamdihi', dhikrId: 'subhanallahi-wa-bihamdihi' },
  { desc: 'Ask forgiveness', name: 'Astaghfirullah', dhikrId: 'astaghfirullah' },
  { desc: 'Include your parents', name: 'Rabi-ghfirli wa liwalidayya',
    arabic: '\u0631\u064e\u0628\u0650\u0651 \u0627\u063a\u0652\u0641\u0650\u0631\u0652 \u0644\u0650\u064a \u0648\u064e\u0644\u0650\u0648\u064e\u0627\u0644\u0650\u062f\u064e\u064a\u064e\u0651',
    transliteration: 'Rabi-ghfirli wa liwalidayya',
    translation: 'My Lord, forgive me and my parents.' },
  { desc: 'Learn the longer istighfar', name: 'Astaghfirullaha-ladhi la ilaha illa Huwa-l-Hayy-al-Qayyum wa atubu ilayh',
    arabic: '\u0623\u064e\u0633\u0652\u062a\u064e\u063a\u0652\u0641\u0650\u0631\u064f \u0627\u0644\u0644\u0647\u064e \u0627\u0644\u0630\u0650\u064a \u0644\u0627 \u0625\u0650\u0644\u0647\u064e \u0625\u0650\u0644\u0627 \u0647\u064f\u0648\u064e \u0627\u0644\u0652\u062d\u064e\u064a\u064f\u0651 \u0627\u0644\u0652\u0642\u064e\u064a\u064f\u0651\u0648\u0645\u064f \u0648\u064e\u0623\u064e\u062a\u064f\u0648\u0628\u064f \u0625\u0650\u0644\u064e\u064a\u0652\u0647\u0650',
    transliteration: 'Astaghfirullaha-ladhi la ilaha illa Huwa-l-Hayy-al-Qayyum wa atubu ilayh',
    translation: 'I seek the forgiveness of Allah, besides Whom there is no deity, the Ever-Living, the Sustainer of all, and I repent to Him.' },
  { desc: 'Morning & evening protection', name: 'bismillahil-ladhi la yadurru ma\'a-smihi shay\'un fil-\'ardi wala fis-sama\'i waHuwas-Sami\'ul-\'Alim', dailyId: 'bismillahil-ladhi' },
  { desc: 'Lean on Allah', name: 'L\u0101 \u1e25awla wa l\u0101 quwwata ill\u0101 bill\u0101h', dhikrId: 'la-hawla' }
];
var learnDetailIdx = null;

function getStudySections() {
  var s = Array.isArray(D.studySections) ? D.studySections : [];
  return s.filter(function (x) { return x && (x.title || x.body); });
}

/* resolve display content for a learn item: practice dhikr, daily item, or inline */
function learnItemContent(item) {
  if (item.dhikrId) { var dh = dhikrById(item.dhikrId); if (dh) return dh; }
  if (item.dailyId) {
    var daily = getDaily();
    var all = (daily.morning || []).concat(daily.evening || []);
    for (var i = 0; i < all.length; i++) if (all[i] && all[i].id === item.dailyId) return all[i];
  }
  return item;
}

function learnItemPracticed(item) {
  if (!item.dhikrId) return false;
  return (Number(S.totals[item.dhikrId]) || 0) > 0;
}

function renderLearnTimeline() {
  var i, practiced = 0;
  for (i = 0; i < LEARN_ITEMS.length; i++) if (learnItemPracticed(LEARN_ITEMS[i])) practiced++;
  var pct = Math.round((practiced / LEARN_ITEMS.length) * 100);
  var html = '<button class="backlink" data-go="home">\u2190 ' + esc(T('homeName', 'Garden')) + '</button>' +
    '<span class="kicker k-sage">A path, not a race</span>' +
    '<div class="giant">Learn one phrase at a time.</div>' +
    '<p class="lede">The four most accepted words are tahlil, takbir, tasbih, and tahmid. Begin there, then continue into daily remembrance.</p>';
  html += '<div class="lp-track"><div class="lp-fill" style="width:' + pct + '%"><span>' +
    practiced + ' of ' + LEARN_ITEMS.length + ' practiced</span></div></div>';
  html += '<div class="learn-timeline">';
  for (i = 0; i < LEARN_ITEMS.length; i++) {
    (function (it, idx) {
      var done = learnItemPracticed(it);
      html += '<div class="lt-row' + (done ? ' done' : '') + '">' +
        '<div class="lt-num">' + (done ? '\u2713' : (idx + 1)) + '</div>' +
        '<div class="lt-txt"><span class="lt-desc">' + esc(it.desc) + '</span>' +
        '<span class="lt-name">' + esc(it.name) + '</span></div>' +
        '<button class="lt-open" data-learn-open="' + idx + '">' + (done ? 'Bloomed' : 'Open') + '</button></div>';
    })(LEARN_ITEMS[i], i);
  }
  html += '</div>';
  html += '<span class="kicker k-sage">Practice notes</span>' +
    '<div class="giant-sm">Remembering, with care</div>';
  var notes = getStudySections();
  for (i = 0; i < notes.length; i++) {
    html += '<div class="card"><h3>' + esc(notes[i].title || '') + '</h3>' +
      '<p class="muted" style="margin:0">' + esc(notes[i].body || '') + '</p></div>';
  }
  return html;
}

function renderLearnDetail(it) {
  var c = learnItemContent(it);
  var html = '<button class="backlink" data-learn-back="1">\u2190 Learn</button>' +
    '<span class="kicker k-sage">' + esc(it.desc || 'Learn') + '</span>';
  if (c.arabic) html += '<div class="arabic arabic-big" dir="rtl">' + esc(c.arabic) + '</div>';
  html += '<p class="translit" style="text-align:center">' + esc(c.transliteration || it.name) + '</p>';
  if (c.translation) html += '<p class="translation" style="text-align:center">' + esc(c.translation) + '</p>';
  if (c.virtue) html += '<div class="card"><p class="muted" style="margin:0">' + esc(c.virtue) + '</p></div>';
  if (c.note) html += '<p class="muted" style="text-align:center">' + esc(c.note) + '</p>';
  if (c.target) html += '<p class="muted" style="text-align:center">Suggested count: <b>' + esc(String(c.target)) + '</b></p>';
  if (it.dhikrId && dhikrById(it.dhikrId)) {
    html += '<button class="btn-gold" data-learn-practice="' + esc(it.dhikrId) + '">Practice this dhikr \u2192</button>';
  }
  return html;
}

function renderLearn() {
  var sec = el('screen-learn');
  if (!sec) return;
  var html = (learnDetailIdx !== null && LEARN_ITEMS[learnDetailIdx])
    ? renderLearnDetail(LEARN_ITEMS[learnDetailIdx])
    : renderLearnTimeline();
  sec.innerHTML = html;
  var gos = sec.querySelectorAll('[data-go]');
  for (var k = 0; k < gos.length; k++) {
    (function (b) { b.addEventListener('click', function () { showScreen(b.getAttribute('data-go')); }); })(gos[k]);
  }
  var opens = sec.querySelectorAll('[data-learn-open]');
  for (var q = 0; q < opens.length; q++) {
    (function (b) { b.addEventListener('click', function () { learnDetailIdx = Number(b.getAttribute('data-learn-open')); renderLearn(); }); })(opens[q]);
  }
  var backs = sec.querySelectorAll('[data-learn-back]');
  for (var r = 0; r < backs.length; r++) {
    (function (b) { b.addEventListener('click', function () { learnDetailIdx = null; renderLearn(); }); })(backs[r]);
  }
  var pracs = sec.querySelectorAll('[data-learn-practice]');
  for (var p = 0; p < pracs.length; p++) {
    (function (b) { b.addEventListener('click', function () {
      var id = b.getAttribute('data-learn-practice');
      PC.dhikrId = id; PC.count = 0;
      var ndh = dhikrById(id);
      if (ndh && Number(ndh.target) > 0) PC.target = Number(ndh.target);
      showScreen('practice');
    }); })(pracs[p]);
  }
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

/* rarity → pill style class */
function pillClsFor(rarity) {
  var r = String(rarity || '').toLowerCase();
  if (r.indexOf('diamond') !== -1) return 'pill-diamond';
  if (r.indexOf('uncommon') !== -1) return 'pill-uncommon';
  if (r.indexOf('rare') !== -1) return 'pill-rare';
  if (r.indexOf('gold') !== -1) return 'pill-golden';
  if (r.indexOf('exotic') !== -1) return 'pill-exotic';
  if (r.indexOf('secret') !== -1) return 'pill-secret';
  return 'pill-common';
}

/* deterministic golden variant for a dhikr (no state change) */
function goldenFlowerFor(dh) {
  var theme = currentTheme();
  if (theme !== 'garden' && dh && dh.id) {
    var th = themeDef(theme);
    var rb = (th.rewardBases && th.rewardBases[dh.id]) || {};
    if (rb.name || rb.emoji) {
      return {
        name: (th.goldenPrefix || 'Golden') + ' ' + (rb.name || 'Reward'),
        emoji: rb.emoji || (theme === 'mine' ? '💎' : '🏎️'),
        rarity: 'Golden'
      };
    }
  }
  var bf = baseFlower(dh);
  var gv = {};
  try { gv = (D.milestones && D.milestones.goldenVariants && D.milestones.goldenVariants[dh.id]) || {}; } catch (e) { gv = {}; }
  return { name: gv.name || ('Golden ' + bf.name), emoji: gv.emoji || bf.emoji || '\u2728', rarity: 'Golden' };
}

/* one bloom card — shared by the herbarium screen and the home preview.
   o: {emoji, name, pill, pillCls, label, golden, known, alwaysShow, extra} */
function herbBloomCard(o) {
  var revealed = o.known || o.alwaysShow;
  return '<div class="herb-cell' + (o.golden ? ' golden' : '') + '">' +
    '<div class="hbloom' + (revealed ? '' : ' sil') + '">' + esc(o.emoji || '\uD83C\uDF38') + '</div>' +
    '<div class="hpill ' + (o.pillCls || 'pill-common') + '">' + esc(o.pill || '') + '</div>' +
    '<div class="hname' + ((o.known && o.name) ? '' : ' q') + '">' + ((o.known && o.name) ? esc(o.name) : '?') + '</div>' +
    '<div class="hlabel">' + esc(o.label || '') + '</div>' +
    (o.extra || '') + '</div>';
}

/* bloom slots for one dhikr: 3 cumulative + 3 one-sitting + golden ladder (+ 2 specials for tahlil) */
function herbariumSlotsFor(dh, tahlil) {
  var slots = [], t, tier;
  for (t = 0; t < MILESTONE_TIERS.length; t++) {
    tier = MILESTONE_TIERS[t];
    var fc = milestoneFlower(dh, tier, 'cumulative');
    slots.push({ key: 'm:c:' + dh.id + ':' + tier, emoji: fc.emoji, name: fc.name, pill: fc.rarity, label: fmtNum(tier) + ' \u00B7 cumulative' });
    var fs = milestoneFlower(dh, tier, 'single');
    slots.push({ key: 'm:s:' + dh.id + ':' + tier, emoji: fs.emoji, name: fs.name, pill: fs.rarity, label: fmtNum(tier) + ' \u00B7 one sitting' });
  }
  var gf = goldenFlowerFor(dh);
  slots.push({ key: 'm:gold:' + dh.id, emoji: gf.emoji, name: gf.name, pill: 'Golden',
    label: 'Complete the 100 / 500 / 1,000 ladder', golden: true, alwaysShow: true });
  if (tahlil && dh.id === tahlil.id) {
    var specials = getSpecials();
    var sp10 = specials['10000'] || {}, sp70 = specials['70000'] || {};
    slots.push({ key: 'm:sp:' + dh.id + ':10000', emoji: sp10.emoji || '\uD83C\uDF3A', name: sp10.name || 'Special reward', pill: 'Exotic', label: '10,000 \u00B7 cumulative' });
    slots.push({ key: 'm:sp:' + dh.id + ':70000', emoji: sp70.emoji || '\u2728', name: sp70.name || 'Special reward', pill: '2\u00D7 Exotic', label: '70,000 \u00B7 cumulative' });
  }
  return slots;
}

/* collection progress in the 72-bloom scheme (excludes the hidden secret) */
function herbariumProgress() {
  var list = getDhikr(), tahlil = findTahlil();
  var total = 0, known = 0;
  for (var i = 0; i < list.length; i++) {
    var slots = herbariumSlotsFor(list[i], tahlil);
    for (var s = 0; s < slots.length; s++) {
      total++;
      if (S.herbarium[slots[s].key]) known++;
    }
  }
  return { known: known, total: total };
}

function wireHerbariumNav(sec) {
  var gos = sec.querySelectorAll('[data-go]');
  for (var k = 0; k < gos.length; k++) {
    (function (b) { b.addEventListener('click', function () { showScreen(b.getAttribute('data-go')); }); })(gos[k]);
  }
}

function renderHerbarium() {
  var sec = el('screen-herbarium');
  if (!sec) return;
  var list = getDhikr();
  var html = '<button class="backlink" data-go="home">\u2190 ' + esc(T('homeName', 'Garden')) + '</button>' +
    '<span class="kicker k-sage">Private collection</span>' +
    '<div class="giant">' + esc(T('collection', 'Herbarium')) + '</div>' +
    '<p class="lede">' + esc(T('herbariumLede', 'Undiscovered blooms stay in silhouette. Every reveal comes from a clear milestone\u2014never chance, trading, or comparison with anyone else.')) + '</p>';

  if (!list.length) {
    html += '<div class="card"><div class="empty-note">The codex is being prepared \u2014<br>check back soon \uD83C\uDF31</div></div>';
    sec.innerHTML = html;
    wireHerbariumNav(sec);
    return;
  }

  var tahlil = findTahlil();
  var prog = herbariumProgress();
  var pct = prog.total ? Math.round((prog.known / prog.total) * 100) : 0;
  html += '<div class="card herb-progress">' +
    '<div class="hp-left"><div class="hp-pct">' + pct + '%</div><div class="hp-cap">discovered</div></div>' +
    '<div class="hp-track"><i style="width:' + pct + '%"></i><b class="hp-knob" style="left:' + pct + '%"></b></div>' +
    '<div class="hp-right">' + prog.known + ' of ' + prog.total + '</div></div>';

  for (var i = 0; i < list.length; i++) {
    (function (dh) {
      var slots = herbariumSlotsFor(dh, tahlil);
      var cards = '', secKnown = 0;
      for (var s = 0; s < slots.length; s++) {
        var sl = slots[s];
        var rec = S.herbarium[sl.key];
        if (rec) secKnown++;
        cards += herbBloomCard({
          emoji: sl.emoji, name: sl.name,
          pill: sl.pill, pillCls: pillClsFor(sl.pill),
          label: sl.label, golden: !!sl.golden, known: !!rec, alwaysShow: !!sl.alwaysShow,
          extra: replantChipsFor(sl.key)
        });
      }
      html += '<div class="herb-dhikr"><div class="hd-head"><div class="hd-titles">' +
        '<div class="arabic hd-arabic" dir="rtl">' + esc(dh.arabic || '') + '</div>' +
        '<div class="hd-translit">' + esc(dh.transliteration || '') + '</div></div>' +
        '<div class="hd-count">' + secKnown + '/' + slots.length + '</div></div>' +
        '<div class="herb-grid">' + cards + '</div></div>';
    })(list[i]);
  }

  /* hidden secret bloom (revealed only at 1,000,000 lifetime) */
  var secret = getSecret();
  var srec = S.herbarium['m:secret'];
  html += '<div class="herb-dhikr"><div class="hd-head"><div class="hd-titles">' +
    '<div class="hd-sectitle">' + esc(T('secretTitle', 'Secret bloom')) + '</div></div></div>' +
    '<div class="herb-grid">' + herbBloomCard({
      emoji: secret.emoji, name: srec ? secret.name : null,
      pill: srec ? (srec.rarity || 'Secret') : 'Secret',
      pillCls: srec ? pillClsFor(srec.rarity) : 'pill-secret',
      label: srec ? (fmtNum(secret.threshold) + ' \u00B7 lifetime') : T('secretHidden', 'A hidden bloom'),
      golden: true, known: !!srec
    }) + '</div></div>';

  sec.innerHTML = html;
  wireHerbariumNav(sec);
  wireReplantReleases(sec);
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
    '<p class="page-sub">' + esc(T('progressSub', 'Your remembrance journey, in numbers and blooms.')) + '</p>';

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
        if (S.milestones['gold:' + dh.id]) chips += '<span class="chip" title="' + esc(goldenFlowerFor(dh).name) + '">' + esc(goldenFlowerFor(dh).emoji) + '</span>';
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
      '<h3>???</h3><p class="muted">' + esc(T('secretTease', 'A secret bloom hides in this garden… keep remembering.')) + '</p>';
  }
  html += '</div>';

  sec.innerHTML = html;
}

/* ---------------- GETTING STARTED ---------------- */
function fallbackSteps() {
  return [
    { title: 'Pick a remembrance', body: 'Open Practice and choose a dhikr from the list. Every remembrance is ready from the start.' },
    { title: 'Tap and remember', body: 'Set a target (33 is a lovely start) and tap the big button with each recitation. There is no timer and no rush.' },
    { title: T('fbStep3Title', 'Grow your garden'), body: T('fbStep3Body', 'Every finished session plants a flower. Flowers start as seeds, sprout, and bloom in real time — even while the app is closed.') },
    { title: 'Keep a gentle rhythm', body: T('fbStep4Body', 'Check the Daily Rhythm for morning and evening remembrances, and visit your Herbarium to see every bloom you have discovered.') }
  ];
}

function renderGettingStarted() {
  var sec = el('screen-getting-started');
  if (!sec) return;
  var steps = getSteps();
  if (!steps.length) steps = fallbackSteps();
  var html = '<h1 class="page-title">' + esc(T('gsEmoji', '🌱')) + ' Getting Started</h1>' +
    '<p class="page-sub">' + esc(T('gsSub', 'Four steps to your first bloom.')) + '</p>';
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

/* ---------------- SPROUT mini-game (Doodle Jump-style climber) ----------------
   Skill only: Sprout auto-bounces, the player steers by touch-and-slide
   (pointer events — no buttons). Platforms generate endlessly upward via a
   deterministic seeded PRNG; the run ends when Sprout falls. The animation
   loop draws straight to canvas and NEVER re-renders the app per frame. */
var sproutG = null; // active run state, or null

function sproutSkin() {
  var t = (typeof currentTheme === 'function') ? currentTheme() : 'garden';
  if (t === 'highway') return { bgTop: '#182236', bgBot: '#0a0e16', plat: '#46586f', edge: '#ffd23f', deco: '🏁', name: 'Turbo Climb' };
  if (t === 'mine') return { bgTop: '#2b1f12', bgBot: '#0f0b07', plat: '#7a5636', edge: '#ffcf6e', deco: '💎', name: 'Shaft Climb' };
  return { bgTop: '#16281d', bgBot: '#0b100e', plat: '#2f6b4f', edge: '#9fe0b8', deco: '🌸', name: 'Sprout Climb' };
}

function stopSprout() {
  if (sproutG) {
    if (sproutG.raf) { try { cancelAnimationFrame(sproutG.raf); } catch (e) {} }
    sproutG = null;
  }
  try {
    var c = el('sprout-canvas');
    if (c) { c.onpointerdown = c.onpointermove = c.onpointerup = c.onpointercancel = null; }
  } catch (e) {}
}

function sproutUnlockCheck() {
  var newly = [];
  for (var i = 0; i < SPROUT_COSTUMES.length; i++) {
    var c = SPROUT_COSTUMES[i];
    if (S.sproutHigh >= c.at && S.sproutCostumes.indexOf(c.id) === -1) {
      S.sproutCostumes.push(c.id);
      newly.push(c);
    }
  }
  if (newly.length) saveState();
  return newly;
}

function sproutRoundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function sproutAddPlat(G) {
  var top = G.plats.length ? G.plats[G.plats.length - 1].wy : 30;
  var gap = 62 + G.rng() * 46; // 62..108px — always clearable (jump height ~139px)
  var w = G.PW;
  G.plats.push({ x: G.rng() * (G.W - w), wy: top - gap, w: w });
}

function sproutStep(G, dt) {
  if (G.ptr) {
    var want = (G.ptrX - G.x) * 18;
    if (want > 520) want = 520;
    if (want < -520) want = -520;
    G.vx = want;
  } else {
    G.vx *= Math.pow(0.0005, dt);
    if (Math.abs(G.vx) < 4) G.vx = 0;
  }
  var prevBottom = G.wy + 17;
  G.vy += G.GRAV * dt;
  if (G.vy > 1400) G.vy = 1400;
  G.wy += G.vy * dt;
  G.x += G.vx * dt;
  if (G.x < -20) G.x += G.W + 40;
  if (G.x > G.W + 20) G.x -= G.W + 40;
  if (G.vy > 0) {
    var nb = G.wy + 17;
    for (var i = 0; i < G.plats.length; i++) {
      var p = G.plats[i];
      if (prevBottom <= p.wy && nb >= p.wy && G.x + 14 > p.x && G.x - 14 < p.x + p.w) {
        G.wy = p.wy - 17;
        G.vy = -G.BOUNCE;
        break;
      }
    }
  }
  if (G.wy < G.camY + G.H * 0.42) G.camY = G.wy - G.H * 0.42;
  if (G.wy < G.minWy) { G.minWy = G.wy; G.score = Math.floor(-G.minWy / 10); }
  var highest = G.plats[G.plats.length - 1].wy;
  while (highest > G.camY - 80) { sproutAddPlat(G); highest = G.plats[G.plats.length - 1].wy; }
  while (G.plats.length && G.plats[0].wy > G.camY + G.H + 80) G.plats.shift();
  if (G.wy - G.camY > G.H + 60) sproutGameOver(G);
}

function sproutDraw(G) {
  var ctx = G.ctx, W = G.W, H = G.H, skin = G.skin, i;
  var bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, skin.bgTop); bg.addColorStop(1, skin.bgBot);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,0.05)';
  for (i = 0; i < 24; i++) {
    var dx = (i * 97) % W;
    var yy = (((i * 57) % H - G.camY * 0.3) % H + H) % H;
    ctx.fillRect(dx, yy, 3, 3);
  }
  for (i = 0; i < G.plats.length; i++) {
    var p = G.plats[i], sy = p.wy - G.camY;
    if (sy < -30 || sy > H + 30) continue;
    ctx.fillStyle = skin.plat;
    sproutRoundRect(ctx, p.x, sy, p.w, G.PH, 7); ctx.fill();
    ctx.fillStyle = skin.edge;
    ctx.fillRect(p.x + 4, sy, p.w - 8, 3);
    if (i % 4 === 1) { ctx.font = '14px serif'; ctx.fillText(skin.deco, p.x + p.w / 2 - 7, sy + 2); }
  }
  var sxy = G.wy - G.camY;
  ctx.font = '36px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(G.costume.emoji, G.x, sxy);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  sproutRoundRect(ctx, 10, 10, 118, 34, 10); ctx.fill();
  ctx.fillStyle = '#f4efe3'; ctx.font = '700 16px Nunito,sans-serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('▲ ' + G.score, 22, 28);
  ctx.textAlign = 'right';
  ctx.fillText('Best ' + Math.max(S.sproutHigh, G.score), W - 22, 28);
}

function sproutGameOver(G) {
  if (G.over) return;
  G.over = true;
  if (sproutG === G) {
    if (G.raf) { try { cancelAnimationFrame(G.raf); } catch (e) {} }
    sproutG = null;
  }
  var isHigh = G.score > S.sproutHigh;
  if (isHigh) S.sproutHigh = G.score;
  var newly = sproutUnlockCheck();
  saveState();
  var over = el('sprout-over');
  if (!over) return;
  var canAfford = (Number(S.credits) || 0) >= SPROUT_COST;
  var html = '<div class="sprout-result"><div style="font-size:2.6rem">🌟</div>' +
    '<h2>Climb over!</h2><div class="sprout-score">' + fmtNum(G.score) + '</div>' +
    (isHigh ? '<p class="kicker k-gold">New best climb!</p>' : '<p class="muted">Best: ' + fmtNum(S.sproutHigh) + '</p>');
  for (var i = 0; i < newly.length; i++) {
    html += '<p class="kicker k-gold">🎽 New costume unlocked: ' + esc(newly[i].name) + ' ' + newly[i].emoji + '</p>';
  }
  html += '<div class="btn-row" style="justify-content:center">' +
    '<button class="btn-gold" id="sprout-again"' + (canAfford ? '' : ' disabled') + '>' +
    (canAfford ? 'Climb again · ' + SPROUT_COST + ' 🪙' : 'Need ' + SPROUT_COST + ' 🪙 for another climb') + '</button>' +
    '<button class="btn-ghost" id="sprout-done">Done</button></div></div>';
  over.innerHTML = html;
  over.hidden = false;
  var again = el('sprout-again');
  if (again && canAfford) again.addEventListener('click', function () { startSproutRun(); });
  var done = el('sprout-done');
  if (done) done.addEventListener('click', function () { renderGame(); });
  if (isHigh) {
    try { celebrate({ emoji: '🧗', title: 'New best climb!', sub: 'You reached ' + fmtNum(G.score) + ' — alhamdulillah!' }); } catch (e) {}
  }
}

function startSproutRun() {
  if ((Number(S.credits) || 0) < SPROUT_COST) { toast('Not enough credits yet 🪙'); return; }
  S.credits -= SPROUT_COST;
  S.sproutAttempts++;
  saveState();
  var wrap = el('sprout-wrap'), canvas = el('sprout-canvas'), over = el('sprout-over'), startCard = el('sprout-start-card');
  if (!wrap || !canvas) return;
  stopSprout();
  wrap.hidden = false;
  if (over) over.hidden = true;
  if (startCard) startCard.style.display = 'none';
  var skin = sproutSkin();
  var dpr = (typeof window.devicePixelRatio === 'number' && window.devicePixelRatio > 0) ? window.devicePixelRatio : 1;
  var W = wrap.clientWidth || 340, H = 480;
  canvas.style.height = H + 'px';
  try {
    canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
  } catch (e) {}
  var ctx = canvas.getContext('2d');
  if (!ctx) { toast('Game unavailable on this device'); return; }
  try { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); } catch (e) {}
  var rng = sproutRng(S.sproutAttempts * 7919 + 13);
  var G = {
    ctx: ctx, W: W, H: H, skin: skin, rng: rng,
    x: W / 2, wy: 0, vy: 0, vx: 0,
    camY: 0, minWy: 0, score: 0,
    plats: [], raf: 0, last: 0, over: false,
    ptr: false, ptrX: W / 2,
    costume: sproutCostumeById(S.sproutEquipped),
    GRAV: 2300, BOUNCE: 800, PW: 66, PH: 14
  };
  G.plats.push({ x: W / 2 - G.PW / 2, wy: 30, w: G.PW });
  for (var i = 0; i < 14; i++) sproutAddPlat(G);
  G.vy = -G.BOUNCE; // launch immediately — the first jump starts with the run
  sproutG = G;
  function toX(e) {
    try {
      var r = canvas.getBoundingClientRect();
      return e.clientX - r.left;
    } catch (err) { return G.x; }
  }
  canvas.onpointerdown = function (e) {
    G.ptr = true; G.ptrX = toX(e);
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    if (e.preventDefault) e.preventDefault();
  };
  canvas.onpointermove = function (e) { if (G.ptr) G.ptrX = toX(e); };
  function endPtr() { G.ptr = false; }
  canvas.onpointerup = endPtr; canvas.onpointercancel = endPtr;
  try {
    var perf = (typeof performance !== 'undefined' && performance.now) ? performance : Date;
    G.last = perf.now();
    var nowFn = function () { return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now(); };
    var frame = function () {
      if (!sproutG || sproutG !== G || G.over) return;
      var t = nowFn(), dt = (t - G.last) / 1000;
      G.last = t;
      if (dt > 0.05) dt = 0.05;
      if (dt < 0) dt = 0;
      sproutStep(G, dt);
      sproutDraw(G);
      if (!G.over) G.raf = requestAnimationFrame(frame);
    };
    G.raf = requestAnimationFrame(frame);
  } catch (e) { /* loop optional */ }
  try { wrap.scrollIntoView({ block: 'nearest' }); } catch (e) {}
}

function renderGame() {
  var sec = el('screen-game');
  if (!sec) return;
  stopSprout();
  var skin = sproutSkin();
  var eq = sproutCostumeById(S.sproutEquipped);
  var canAfford = (Number(S.credits) || 0) >= SPROUT_COST;
  var html = '<button class="backlink" data-go="home">← Home</button>' +
    '<span class="kicker k-sage">Skill game · no luck, just you</span>' +
    '<h1 class="giant">' + esc(skin.name) + '</h1>' +
    '<p class="lede">Sprout bounces on his own — press and slide your finger anywhere in the play area to steer. ' +
    'Climb as high as you can; the run ends if you fall.</p>';

  html += '<div class="card"><div class="row-between"><div><span class="kicker k-gold">🪙 Adhkar credits</span>' +
    '<div style="font-size:1.6rem;font-weight:900;color:var(--cream)">' + fmtNum(S.credits) + '</div></div>' +
    '<div style="text-align:right"><span class="kicker k-sage">Best climb</span>' +
    '<div style="font-size:1.6rem;font-weight:900;color:var(--cream)">' + fmtNum(S.sproutHigh) + '</div></div></div>' +
    '<p class="muted" style="margin:8px 0 0">Each climb costs ' + SPROUT_COST + ' credits, earned from morning &amp; evening adhkar.</p></div>';

  html += '<div class="card"><span class="kicker k-sage">Sprout&rsquo;s wardrobe</span><div class="costume-grid">';
  for (var i = 0; i < SPROUT_COSTUMES.length; i++) {
    (function (c) {
      var owned = S.sproutCostumes.indexOf(c.id) !== -1;
      var active = S.sproutEquipped === c.id;
      html += '<button class="costume' + (active ? ' active' : '') + '" data-costume="' + c.id + '"' + (owned ? '' : ' disabled') + '>' +
        '<span class="costume-emoji">' + (owned ? c.emoji : '🔒') + '</span>' +
        '<b>' + esc(c.name) + '</b>' +
        '<i>' + (owned ? (active ? 'Wearing' : 'Tap to wear') : 'Score ' + fmtNum(c.at)) + '</i></button>';
    })(SPROUT_COSTUMES[i]);
  }
  html += '</div></div>';

  html += '<div class="card sprout-wrap" id="sprout-wrap" hidden>' +
    '<canvas id="sprout-canvas" class="sprout-canvas"></canvas>' +
    '<div class="sprout-over" id="sprout-over" hidden></div></div>';

  html += '<div class="card" style="text-align:center" id="sprout-start-card">' +
    '<div style="font-size:2.4rem">' + eq.emoji + '</div>' +
    '<p class="muted">Ready, ' + esc(eq.name) + '?</p>' +
    '<button class="btn-gold" id="sprout-start"' + (canAfford ? '' : ' disabled') + '>' +
    (canAfford ? 'Start climb · ' + SPROUT_COST + ' 🪙' : 'Need ' + SPROUT_COST + ' credits to climb') + '</button>' +
    (canAfford ? '' : '<p class="muted" style="margin-top:8px">Complete morning &amp; evening adhkar to earn credits.</p>') +
    '</div>';

  sec.innerHTML = html;

  var gos = sec.querySelectorAll('[data-go]');
  for (var g = 0; g < gos.length; g++) {
    (function (b) { b.addEventListener('click', function () { showScreen(b.getAttribute('data-go')); }); })(gos[g]);
  }
  var cos = sec.querySelectorAll('[data-costume]');
  for (var k = 0; k < cos.length; k++) {
    (function (b) {
      b.addEventListener('click', function () {
        var id = b.getAttribute('data-costume');
        if (S.sproutCostumes.indexOf(id) !== -1) { S.sproutEquipped = id; saveState(); renderGame(); }
      });
    })(cos[k]);
  }
  var start = el('sprout-start');
  if (start && canAfford) start.addEventListener('click', function () { startSproutRun(); });
}

/* ---------------- navigation wiring ---------------- */
function wireNav() {
  var navs = document.querySelectorAll('#bottomnav .navbtn');
  for (var i = 0; i < navs.length; i++) {
    (function (b) {
      b.addEventListener('click', function () {
        showScreen(b.getAttribute('data-screen'));
      });
    })(navs[i]);
  }
  el('modal-ok').addEventListener('click', showNextModal);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      if (!el('modal').hidden) showNextModal();
    }
  });
}

/* If data.js arrives late (or is replaced at runtime), pick it up. */
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
  applyThemeToDom();
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
