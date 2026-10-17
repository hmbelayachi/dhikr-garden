/* =========================================================================
   Dhikr Garden Grower — app shell (vanilla JS, 100% client-side)
   -------------------------------------------------------------------------
   CONTENT CONTRACT — data.js (written separately) sets window.DG_CONTENT.
   The app tolerates it being missing/partial, and reads BOTH key families:

   Provisional keys:  dhikr[], unlockStages[] (+dhikrIds), tahlilSpecials{},
                      secret{}, daily{morning[],evening[]},
                      gettingStarted[], seasons[]
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

/* ---------------- v11 migration: checklist/credit keys index -> item id ----------------
   v10 stored daily checklist + credit awards by numeric index; two items were
   removed in v11, shifting indexes. Convert old numeric keys to item ids once. */
var OLD_MORNING_IDS = ["bika-asbahna", "ayat-al-kursi", "la-ilaha-wahdahu", "a-udhu-bikalimatillah",
  "sayyid-istighfar", "alim-al-ghayb", "ushhiduk", "muawwidhat-ikhlas", "muawwidhat-falaq",
  "muawwidhat-nas", "bismillahil-ladhi", "dua-al-hamm", "hasbiyallah", "mann-shahida",
  "raditu-billahi", "subhanallahi-wa-bihamdihi-am", "ya-hayyu-ya-qayyum"];
var OLD_EVENING_IDS = ["bika-amsayna", "amsayna", "ayat-al-kursi", "la-ilaha-wahdahu",
  "a-udhu-bikalimatillah", "sayyid-istighfar", "alim-al-ghayb", "ushhiduk", "muawwidhat-ikhlas",
  "muawwidhat-falaq", "muawwidhat-nas", "bismillahil-ladhi", "dua-al-hamm", "hasbiyallah",
  "mann-shahida", "raditu-billahi", "subhanallahi-wa-bihamdihi-am", "ya-hayyu-ya-qayyum"];

function newDailyIds(period) {
  var d = getDaily();
  var list = period === 'morning' ? d.morning : d.evening;
  var out = {};
  for (var i = 0; i < list.length; i++) if (list[i] && list[i].id) out[list[i].id] = true;
  return out;
}
function migrateChecklistKeys() {
  if (safeGet('dg_migrated_v11', false)) return;
  try {
    var periods = ['morning', 'evening'];
    var oldLists = { morning: OLD_MORNING_IDS, evening: OLD_EVENING_IDS };
    for (var p = 0; p < periods.length; p++) {
      (function (period) {
        var valid = newDailyIds(period);
        var oldArr = oldLists[period];
        [['checklist', S.checklist], ['creditAwards', S.creditAwards]].forEach(function (pair) {
          var store = pair[1];
          if (!store || typeof store !== 'object') return;
          Object.keys(store).forEach(function (day) {
            var rec = store[day] && store[day][period];
            if (!rec || typeof rec !== 'object') return;
            var next = {};
            Object.keys(rec).forEach(function (k) {
              var id = /^\d+$/.test(k) ? oldArr[Number(k)] : k;
              if (id && valid[id]) next[id] = rec[k];
            });
            store[day][period] = next;
          });
        });
      })(periods[p]);
    }
    saveState();
  } catch (e) { /* migration must never break boot */ }
  safeSet('dg_migrated_v11', true);
}

/* ---------------- ADHKAR ARCADE constants ---------------- */
var GAME_COST = 5;
var ARCADE_GAMES = [
  { id: 'sprout', name: 'Sprout Climb', emoji: '🌱', img: 'char-sprout.png', tag: 'Climb, double-jump & power up' },
  { id: 'flip', name: 'Flip Runner', emoji: '🌀', img: 'char-flip.png', tag: 'Flip, dodge & unlock gear' },
  { id: 'firefly', name: 'Firefly Flight', emoji: '✨', tag: 'Flap through narrowing arches' },
  { id: 'vine', name: 'Vine Snake', emoji: '🌿', tag: 'Grow, turn & chase water' }
];
function arcadeGameDef(id) {
  for (var i = 0; i < ARCADE_GAMES.length; i++) if (ARCADE_GAMES[i].id === id) return ARCADE_GAMES[i];
  return ARCADE_GAMES[0];
}
/* character art for game cards/start cards; falls back to the emoji */
function arcadeIconHtml(gm, px) {
  var s = Number(px) || 56;
  if (gm && gm.img) return '<img class="arcade-char-img" src="' + esc(gm.img) + '" alt="" style="height:' + s + 'px;width:auto">';
  return '<div style="font-size:' + Math.round(s * 0.6) + 'px;line-height:1">' + (gm ? gm.emoji : '🎮') + '</div>';
}
function arcadeHigh(game) {
  return Math.floor(Number((S.arcadeHigh || {})[game]) || 0);
}
function setArcadeHigh(game, v) {
  if (!S.arcadeHigh || typeof S.arcadeHigh !== 'object') S.arcadeHigh = {};
  v = Math.floor(Number(v) || 0);
  if (v > arcadeHigh(game)) { S.arcadeHigh[game] = v; saveState(); return true; }
  return false;
}
function bumpArcadeAttempts(game) {
  if (!S.arcadeAttempts || typeof S.arcadeAttempts !== 'object') S.arcadeAttempts = {};
  S.arcadeAttempts[game] = (Number(S.arcadeAttempts[game]) || 0) + 1;
  saveState();
  return S.arcadeAttempts[game];
}
/* extended Sprout costumes (distance milestones) */
SPROUT_COSTUMES.push(
  { id: 'sky-sprinter', name: 'Sky Sprinter', emoji: '🌤️', at: 2500 },
  { id: 'cloud-dancer', name: 'Cloud Dancer', emoji: '☁️', at: 4000 },
  { id: 'star-voyager', name: 'Star Voyager', emoji: '🌠', at: 6000 }
);
/* Flip Runner customization: shirt / shoes / hat, unlocked every 1000m of best distance */
var FLIP_SHIRTS = [
  { id: 'fs-white', name: 'White Tee', color: '#f4efe3', at: 0 },
  { id: 'fs-garden', name: 'Garden Tee', color: '#4caf50', at: 1000 },
  { id: 'fs-gold', name: 'Gold Tee', color: '#e3a93c', at: 2000 },
  { id: 'fs-sky', name: 'Sky Tee', color: '#7fb5e8', at: 3000 },
  { id: 'fs-rose', name: 'Rose Tee', color: '#e08ac0', at: 4000 }
];
var FLIP_SHOES = [
  { id: 'fsh-trail', name: 'Trail Shoes', color: '#8a6a4a', at: 0 },
  { id: 'fsh-ember', name: 'Ember Runners', color: '#d9534f', at: 1000 },
  { id: 'fsh-river', name: 'River Runners', color: '#4f7ed9', at: 2000 },
  { id: 'fsh-champ', name: 'Champion Kicks', color: '#e3a93c', at: 3000 },
  { id: 'fsh-mint', name: 'Mint Dashers', color: '#7be0b8', at: 4000 }
];
var FLIP_HATS = [
  { id: 'fh-none', name: 'No Hat', color: null, at: 0 },
  { id: 'fh-greencap', name: 'Green Cap', color: '#4caf50', at: 1000 },
  { id: 'fh-goldcap', name: 'Gold Cap', color: '#e3a93c', at: 2000 },
  { id: 'fh-nightcap', name: 'Night Cap', color: '#2b3a55', at: 3000 },
  { id: 'fh-crown', name: 'Runner Crown', color: '#ffd700', at: 4000 }
];
function flipOptById(list, id) {
  for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return list[0];
}
/* newly unlocked customization items: deterministic from old vs new best — no state needed */
function newlyUnlocked(list, oldBest, newBest) {
  var out = [];
  for (var i = 0; i < list.length; i++) {
    if (list[i].at > oldBest && list[i].at <= newBest) out.push(list[i]);
  }
  return out;
}
function unlockedOpts(list, best) {
  var out = [];
  for (var i = 0; i < list.length; i++) if (best >= list[i].at) out.push(list[i]);
  return out;
}
/* Firefly glow colors + vine colors, unlocked at score milestones */
var FIREFLY_GLOWS = [
  { id: 'fg-gold', name: 'Golden Glow', color: '#ffd94d', at: 0 },
  { id: 'fg-mint', name: 'Mint Glow', color: '#7be0b8', at: 10 },
  { id: 'fg-sky', name: 'Sky Glow', color: '#7fb5e8', at: 25 },
  { id: 'fg-rose', name: 'Rose Glow', color: '#ff9ecf', at: 50 },
  { id: 'fg-violet', name: 'Violet Glow', color: '#c49eff', at: 100 }
];
var VINE_COLORS = [
  { id: 'vc-green', name: 'Garden Vine', color: '#4caf50', at: 0 },
  { id: 'vc-deep', name: 'Deep Jungle', color: '#1f7a3a', at: 10 },
  { id: 'vc-gold', name: 'Golden Vine', color: '#c9a227', at: 25 },
  { id: 'vc-teal', name: 'Teal Vine', color: '#2fa39a', at: 50 },
  { id: 'vc-plum', name: 'Plum Vine', color: '#8e4a8e', at: 100 }
];
function colorOptById(list, id) {
  for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return list[0];
}

/* ---------------- per-item recitation audio (listen-in-full gate) ----------------
   Audio elements are created lazily via `new Audio()` (never preloaded) and live
   outside the DOM, so checklist re-renders never disturb playback. */
var audioEls = {}; // itemId -> HTMLAudioElement
function audioUrlFor(id) {
  var m = (D.audioMap && typeof D.audioMap === 'object') ? D.audioMap : {};
  return m[id] || null;
}
/* Listen-in-full unlocks reset each day: the student listens in full each day
   before checking the item off. Stored per date; old days are pruned. */
function audioDay() {
  var k = todayKey();
  if (!S.audioListened || typeof S.audioListened !== 'object' || Array.isArray(S.audioListened)) S.audioListened = {};
  if (!S.audioListened[k] || typeof S.audioListened[k] !== 'object') S.audioListened[k] = {};
  var keys = Object.keys(S.audioListened).sort();
  while (keys.length > 14) { delete S.audioListened[keys.shift()]; }
  return S.audioListened[k];
}
function audioListened(id) { return !!audioDay()[id]; }
function needsListen(id) { return !!audioUrlFor(id) && !audioListened(id); }
function markAudioListened(id) {
  var d = audioDay();
  if (d[id]) return;
  d[id] = 1;
  safeSet('dg_audio_listened_v2', S.audioListened);
}
function stopOtherAudio(exceptId) {
  Object.keys(audioEls).forEach(function (id) {
    if (id === exceptId) return;
    try { audioEls[id].pause(); } catch (e) {}
  });
}
function stopAllAudio() {
  Object.keys(audioEls).forEach(function (id) {
    try { audioEls[id].pause(); } catch (e) {}
  });
}
/* refresh one row's audio UI (play label, progress, lock state) — queries DOM fresh */
function syncAudioRow(id) {
  var row = document.querySelector('.check-row[data-item="' + id + '"]');
  if (!row) return;
  var a = audioEls[id];
  var playing = !!(a && !a.paused && !a.ended);
  var listened = audioListened(id);
  var btn = row.querySelector('[data-audio-play]');
  if (btn && !btn.disabled) btn.innerHTML = playing ? '⏸ Pause' : (listened || (a && a.currentTime > 0) ? '▶ Replay' : '▶ Recitation');
  var prog = row.querySelector('[data-audio-prog]');
  if (prog && a && a.duration) prog.style.width = Math.min(100, (a.currentTime / a.duration) * 100).toFixed(1) + '%';
  else if (prog && listened) prog.style.width = '100%';
  var badge = row.querySelector('[data-audio-done]');
  if (badge) badge.hidden = !listened;
  var lockNote = row.querySelector('[data-audio-lock]');
  if (lockNote) lockNote.hidden = !needsListen(id);
}
function getAudioEl(id) {
  if (audioEls[id]) return audioEls[id];
  var url = audioUrlFor(id);
  if (!url) return null;
  var a = new Audio();
  a.preload = 'none';
  a.src = url; // set only on first tap — clips are never preloaded
  a.addEventListener('ended', function () {
    markAudioListened(id);
    syncAudioRow(id);
    toast('MashaAllah — recitation complete 🤲');
  });
  a.addEventListener('pause', function () {
    // pausing restarts the recitation from the beginning
    if (!a.ended) { try { a.currentTime = 0; } catch (e) {} }
    syncAudioRow(id);
  });
  a.addEventListener('timeupdate', function () { syncAudioRow(id); });
  a.addEventListener('play', function () { stopOtherAudio(id); syncAudioRow(id); });
  a.addEventListener('error', function () { toast('Audio could not play. Try again.'); syncAudioRow(id); });
  audioEls[id] = a;
  return a;
}
function toggleAudio(id) {
  var a = getAudioEl(id);
  if (!a) return;
  if (a.paused) {
    stopOtherAudio(id);
    try {
      var pr = a.play();
      if (pr && pr.catch) pr.catch(function () { toast('Audio could not play. Try again.'); });
    } catch (e) { toast('Audio could not play. Try again.'); }
  } else {
    a.pause(); // pause handler resets to the beginning
  }
  syncAudioRow(id);
}

/* ---------------- rhythm levels ---------------- */
function getRhythmLevels() {
  var a = Array.isArray(D.rhythmLevels) ? D.rhythmLevels : [];
  return a.filter(function (x) { return x && x.id && x.name; });
}
function rhythmLevelDef() {
  var ls = getRhythmLevels();
  for (var i = 0; i < ls.length; i++) if (ls[i].id === S.rhythmLevel) return ls[i];
  for (var j = 0; j < ls.length; j++) if (ls[j].id === 'expert') return ls[j];
  return { id: 'expert', name: 'Expert', creditMult: 3, itemIds: null };
}
function levelItemIds() {
  var def = rhythmLevelDef();
  return def.itemIds || null; // null = full checklist
}
function inLevel(itemId) {
  var ids = levelItemIds();
  return ids === null || ids.indexOf(itemId) !== -1;
}
function findDailyItem(period, id) {
  var d = getDaily();
  var list = period === 'morning' ? d.morning : d.evening;
  for (var i = 0; i < list.length; i++) if (list[i] && list[i].id === id) return list[i];
  return null;
}

/* ---------------- prayer time-gating (Aladhan API, cached per day) ----------------
   Morning is completable Fajr -> Maghrib; Evening Maghrib -> next Fajr.
   Without a granted location both lists stay accessible with a setup prompt. */
var RHYTHM_TIMES = null; // {fajr: Date, maghrib: Date}
var rhythmTimesStamp = '';
function parseAladhanTime(s) {
  var m = /^(\d{1,2}):(\d{2})/.exec(String(s || ''));
  if (!m) return null;
  var d = new Date();
  d.setHours(Number(m[1]), Number(m[2]), 0, 0);
  return d;
}
function ensureRhythmTimes(cb) {
  var today = todayKey();
  if (rhythmTimesStamp === today && RHYTHM_TIMES) return; // already loaded today
  function finish() {
    rhythmTimesStamp = today;
    if (typeof cb === 'function') cb();
  }
  var loc = S.location;
  if (!(loc && loc.granted && typeof loc.lat === 'number')) { RHYTHM_TIMES = null; return; }
  var cache = S.prayerCache;
  if (cache && cache.date === today && cache.fajr && cache.maghrib &&
      cache.lat === loc.lat && cache.lon === loc.lon) {
    RHYTHM_TIMES = { fajr: new Date(cache.fajr), maghrib: new Date(cache.maghrib) };
    rhythmTimesStamp = today;
    return; // cache hit: no re-render needed
  }
  function useLocal() {
    try {
      var pt = computePrayerTimes(new Date(), loc.lat, loc.lon);
      if (pt && pt.fajr && pt.maghrib) {
        RHYTHM_TIMES = { fajr: pt.fajr, maghrib: pt.maghrib };
        S.prayerCache = { date: today, lat: loc.lat, lon: loc.lon,
          fajr: pt.fajr.toISOString(), maghrib: pt.maghrib.toISOString(), local: true };
        safeSet('dg_prayer_cache', S.prayerCache);
      } else { RHYTHM_TIMES = null; }
    } catch (e) { RHYTHM_TIMES = null; }
    finish();
  }
  var dd = pad2(new Date().getDate()) + '-' + pad2(new Date().getMonth() + 1) + '-' + new Date().getFullYear();
  var url = 'https://api.aladhan.com/v1/timings/' + dd + '?latitude=' + loc.lat + '&longitude=' + loc.lon + '&method=2';
  try {
    fetch(url).then(function (r) { return r.json(); }).then(function (j) {
      var t = j && j.data && j.data.timings;
      if (t && t.Fajr && t.Maghrib) {
        var f = parseAladhanTime(t.Fajr), m = parseAladhanTime(t.Maghrib);
        if (f && m) {
          RHYTHM_TIMES = { fajr: f, maghrib: m };
          S.prayerCache = { date: today, lat: loc.lat, lon: loc.lon, fajr: f.toISOString(), maghrib: m.toISOString() };
          safeSet('dg_prayer_cache', S.prayerCache);
          finish();
          return;
        }
      }
      useLocal();
    }).catch(useLocal);
  } catch (e) { useLocal(); }
}
function rhythmWindow() {
  var now = new Date();
  if (!(S.location && S.location.granted) || !RHYTHM_TIMES || !RHYTHM_TIMES.fajr || !RHYTHM_TIMES.maghrib) {
    return { morningOpen: true, eveningOpen: true, gated: false, nextUnlock: null };
  }
  var fajr = RHYTHM_TIMES.fajr.getTime(), maghrib = RHYTHM_TIMES.maghrib.getTime(), t = now.getTime();
  var morningOpen = t >= fajr && t < maghrib;
  var next;
  if (morningOpen) {
    next = { prayer: 'Maghrib', at: new Date(maghrib), forPeriod: 'evening' };
  } else {
    var nf = new Date(fajr);
    if (t >= fajr) nf.setDate(nf.getDate() + 1); // after Fajr but before Maghrib is impossible here; this covers t < fajr (evening window)
    next = { prayer: 'Fajr', at: nf, forPeriod: 'morning' };
  }
  return { morningOpen: morningOpen, eveningOpen: !morningOpen, gated: true, nextUnlock: next };
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
  sproutCostumes: safeGet('dg_sprout_costumes', ['sproutling']), // unlocked costume ids
  sproutEquipped: safeGet('dg_sprout_equipped', 'sproutling'),
  arcadeHigh: (function () { // per-game bests {sprout,flip,firefly,vine}; migrates v10 dg_sprout_high
    var h = safeGet('dg_arcade_high', null);
    if (!h || typeof h !== 'object' || Array.isArray(h)) h = {};
    var old = safeGet('dg_sprout_high', 0);
    if (!(typeof h.sprout === 'number' && h.sprout >= 0) && typeof old === 'number' && old > 0) h.sprout = Math.floor(old);
    return h;
  })(),
  arcadeAttempts: safeGet('dg_arcade_attempts', {}), // per-game attempt counts
  flipCustom: safeGet('dg_flip_custom', null),       // {shirt,shoes,hat} ids
  fireflyGlow: safeGet('dg_firefly_glow', 'fg-gold'),
  vineColor: safeGet('dg_vine_color', 'vc-green'),
  rhythmLevel: safeGet('dg_rhythm_level', 'expert'), // checklist level id
  audioListened: safeGet('dg_audio_listened_v2', {}),   // {YYYY-MM-DD:{itemId:1}} — relocks daily
  prayerCache: safeGet('dg_prayer_cache', null),      // {date,lat,lon,fajr,maghrib} ISO strings
  arcadeTime: (function () { var t = safeGet('dg_arcade_time', 0); return (typeof t === 'number' && t >= 0) ? Math.floor(t) : 0; })(),
  buddy: safeGet('dg_buddy', null),                       // companion state (normalized below)
  bloomHigh: (function () { var h = safeGet('dg_bloom_high', 0); return (typeof h === 'number' && h >= 0) ? Math.floor(h) : 0; })(),
  bloomAttempts: (function () { var n = safeGet('dg_bloom_attempts', 0); return (typeof n === 'number' && n >= 0) ? Math.floor(n) : 0; })()
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
if (!S.arcadeHigh || typeof S.arcadeHigh !== 'object' || Array.isArray(S.arcadeHigh)) S.arcadeHigh = {};
if (!S.arcadeAttempts || typeof S.arcadeAttempts !== 'object' || Array.isArray(S.arcadeAttempts)) S.arcadeAttempts = {};
if (!S.flipCustom || typeof S.flipCustom !== 'object') S.flipCustom = { shirt: 'fs-white', shoes: 'fsh-brown', hat: 'fh-none' };
if (['beginner', 'beginner-na', 'intermediate', 'expert'].indexOf(S.rhythmLevel) === -1) S.rhythmLevel = 'expert';
if (!S.audioListened || typeof S.audioListened !== 'object' || Array.isArray(S.audioListened)) S.audioListened = {};

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
  safeSet('dg_sprout_costumes', S.sproutCostumes);
  safeSet('dg_sprout_equipped', S.sproutEquipped);
  safeSet('dg_arcade_high', S.arcadeHigh);
  safeSet('dg_arcade_attempts', S.arcadeAttempts);
  safeSet('dg_flip_custom', S.flipCustom);
  safeSet('dg_firefly_glow', S.fireflyGlow);
  safeSet('dg_vine_color', S.vineColor);
  safeSet('dg_rhythm_level', S.rhythmLevel);
  safeSet('dg_audio_listened_v2', S.audioListened);
  safeSet('dg_prayer_cache', S.prayerCache);
  safeSet('dg_arcade_time', S.arcadeTime);
  safeSet('dg_buddy', S.buddy);
  safeSet('dg_bloom_high', S.bloomHigh);
  safeSet('dg_bloom_attempts', S.bloomAttempts);
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
var SCREENS = ['home', 'practice', 'daily', 'learn', 'herbarium', 'reader', 'progress', 'game', 'getting-started', 'companion', 'bloom'];
var currentScreen = 'home';

function showScreen(name) {
  if (SCREENS.indexOf(name) === -1) name = 'home';
  try { buddyTrackScreen(name); } catch (e) { /* buddy time tracking optional */ }
  try { stopArcade(); stopBloom(); stopAllAudio(); } catch (e) { /* game loop never blocks navigation */ }
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
               learn: renderLearn, herbarium: renderHerbarium,
               reader: function () {}, progress: renderProgress, game: renderGame, 'getting-started': renderGettingStarted,
               companion: renderCompanion, bloom: renderBloom }[name];
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
    ['learn', 'Learn', getLearnArticles().length + ' articles', '#7fb5e8'],
    ['herbarium', T('collection', 'Herbarium'), herbProg.known + '/' + herbProg.total + ' discovered', '#e08ac0'],
    ['progress', 'Progress', fmtNum(S.lifetime) + ' lifetime', '#7fb5e8'],
    ['game', 'Adhkar Arcade', '4 games · ' + fmtNum(S.credits) + ' coins', '#9fe0b8']
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
    for (var i = 0; i < items.length; i++) { if (items[i] && items[i].id && rec && rec[items[i].id]) n++; }
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
    var checked = !!(it.id && day.morning && day.morning[it.id]);
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

/* Home-page arcade picker: the four games visible up front, tap one to jump in. */
function homeArcadePanel() {
  var html = '<section class="card home-arcade"><div class="row-between" style="align-items:center">' +
    '<div><span class="kicker k-gold">Spend your adhkar credits</span>' +
    '<h2 style="margin:4px 0 0">Adhkar Arcade</h2></div>' +
    '<div style="display:flex;gap:8px;align-items:center">' +
    '<span class="coin-badge"><b>' + fmtNum(S.credits) + '</b><small>coins</small></span>' +
    '<span class="coin-badge"><b>⏱ ' + arcadeTimeStr(S.arcadeTime) + '</b><small>time</small></span></div></div>' +
    '<div class="arcade-grid">';
  for (var i = 0; i < ARCADE_GAMES.length; i++) {
    (function (gm) {
      html += '<button class="card arcade-card home-game-card" data-arcade-play="' + gm.id + '">' +
        arcadeIconHtml(gm, 56) +
        '<h3>' + esc(gm.name) + '</h3><p class="muted">' + esc(gm.tag) + '</p></button>';
    })(ARCADE_GAMES[i]);
  }
  html += '</div><button class="btn-gold btn-block" data-arcade-menu style="margin-top:12px">' +
    'Open arcade · ' + GAME_COST + ' coins per attempt</button></section>';
  return html;
}

function renderHome() {
  var sec = el('screen-home');
  if (!sec) return;
  try { buddyCheckDevolution(); } catch (e) { /* buddy optional */ }
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

  // companion environment hero — buddy standing in the selected theme,
  // very top of home (theme cards follow right below as the switcher)
  try { html += buddyEnvHeroHtml(); } catch (e) { /* buddy optional */ }

  // theme picker (stays as the theme switcher, right below the hero it switches)
  html += themePickerCard();

  // while-you-were-away (offline maturation notice)
  if (away.length) {
    var names = away.slice(0, 4).map(function (f) { return esc(f.name); }).join(', ');
    var more = away.length > 4 ? ' +' + (away.length - 4) + ' more' : '';
    var awayUnit = away.length > 1 ? T('awayPlur', 'flowers bloomed') : T('awaySing', 'flower bloomed');
    html += '<div class="notice"><span class="ntitle">While you were away&hellip;</span>' +
      esc(String(away.length)) + ' ' + esc(awayUnit) + ': ' + names + more + '</div>';
  }

  // garden hero (stats + tend button; the environment scene now lives in the companion hero above)
  html += '<section class="card garden-hero"><span class="kicker k-sage">' + esc(T('heroKicker', 'Your garden')) + '</span>' +
    '<h2 class="hero-title">' + esc(T('heroTitle', 'What you remember, grows.')) + '</h2>' +
    '<div class="hero-lines"><div><b>' + discovered + '/' + totalKeys + '</b> ' + esc(T('milestoneUnit', 'milestone blooms')) + '</div>' +
    '<div><b>' + fmtNum(S.lifetime) + '</b> remembrances tended</div></div>' +
    '<div class="stat-row"><div class="stat"><b>' + discovered + '</b><span>' + esc(T('statUnit', 'blooms')) + '</span></div>' +
    '<div class="stat"><b>' + fmtNum(S.lifetime) + '</b><span>lifetime</span></div>' +
    '<div class="stat"><b>' + practiced + '</b><span>phrases</span></div></div>' +
    '<button class="btn-gold btn-block" data-go-bloom style="margin-top:12px">Tend your blooms 🌸</button></section>';

  // next reward
  html += renderNextReward();

  // getting started
  html += '<section class="card"><span class="kicker k-sage">' + esc(T('gsKicker', 'New to the garden?')) + '</span>' +
    '<div class="row-between"><div><h2 style="margin:0 0 4px">Getting started</h2>' +
    '<p class="muted" style="margin:0">' + esc(T('gsBody', 'Learn how practice grows your garden and unlocks new blooms.')) + '</p></div>' +
    '<button class="link-arrow" data-go="getting-started">Start &rarr;</button></div></section>';

  // daily rhythm preview
  html += dailyPreview();

  // arcade picker
  html += homeArcadePanel();

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
  var ap = sec.querySelectorAll('[data-arcade-play]');
  for (var ap_i = 0; ap_i < ap.length; ap_i++) {
    (function (b) { b.addEventListener('click', function () { arcadeScreen = b.getAttribute('data-arcade-play'); showScreen('game'); }); })(ap[ap_i]);
  }
  var am = sec.querySelector('[data-arcade-menu]');
  if (am) am.addEventListener('click', function () { arcadeScreen = 'menu'; showScreen('game'); });
  var gb = sec.querySelector('[data-go-bloom]');
  if (gb) gb.addEventListener('click', function () { showScreen('bloom'); });
  var gc = sec.querySelector('[data-go-companion]');
  if (gc) gc.addEventListener('click', function () { showScreen('companion'); });
  try { wireBuddyScene(sec); } catch (e) { /* buddy optional */ }
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
  try { buddySpawnMotes(sec.querySelector('.buddy-env-scene')); } catch (e) { /* buddy optional */ }
  buddyFlushPending(sec);
}

/* ---------------- location: asked ONCE ---------------- */
function requestLocation(after) {
  function done(loc) {
    S.location = loc;
    saveState();
    refreshPrayers(); applyAmbience();
    rhythmTimesStamp = ''; RHYTHM_TIMES = null; // refetch prayer times with new coords
    if (after === 'daily') { ensureRhythmTimes(function () { renderDaily(); }); renderDaily(); }
    else renderHome();
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
var PC = { dhikrId: null, target: 33, count: 0, generalTarget: 33, generalCount: 0, milestone: 0, generalMilestone: 0, lvMilestone: 0, generalLvMilestone: 0, lastTap: 0, generalLastTap: 0, segStart: 0, generalSegStart: 0, slowHintAt: 0 };

/* Tap integrity: at least 1 second must pass between counted taps.
   Faster taps are ignored (with a subtle hint); the first tap always counts. */
function tapPaced(which) {
  var now = Date.now();
  var key = which === 'general' ? 'generalLastTap' : 'lastTap';
  var last = PC[key] || 0;
  if (last && now - last < 1000) {
    if (now - (PC.slowHintAt || 0) > 2500) {
      PC.slowHintAt = now;
      toast('Slow down — one tap each second 🤲');
    }
    return false;
  }
  PC[key] = now;
  var sk = which === 'general' ? 'generalSegStart' : 'segStart';
  if (!PC[sk]) PC[sk] = now; // segment timer starts on the first counted tap
  return true;
}
function tapReset(which) {
  if (which === 'general') { PC.generalCount = 0; PC.generalMilestone = 0; PC.generalLvMilestone = 0; PC.generalLastTap = 0; PC.generalSegStart = 0; }
  else { PC.count = 0; PC.milestone = 0; PC.lvMilestone = 0; PC.lastTap = 0; PC.segStart = 0; }
}

/* Milestone bundle (the chat app's economy): every 10 dhikr on phrase OR
   general counters grants ONE bundle via a single celebratory pop-up —
   +60s arcade time and +10 buddy snacks. No saving required. Credits now
   come only from the morning/evening checklist. 1-second tap pacing
   (tapPaced) is the enforcement — faster taps are ignored. Companion levels
   stay on 33s (see awardLevelMilestone). */
function awardMilestoneBundle(which) {
  buddy(); // ensure buddy state exists
  var n = which === 'general' ? PC.generalCount : PC.count;
  var key = which === 'general' ? 'generalMilestone' : 'milestone';
  var m = Math.floor(n / 10);
  if (m <= (PC[key] || 0)) return;
  PC[key] = m;
  // award the bundle
  var timeNote = '';
  var newTime = (Number(S.arcadeTime) || 0) + 60;
  if (newTime >= 1800) {
    if ((Number(S.arcadeTime) || 0) < 1800) timeNote = ' (Arcade bank full!)';
    newTime = 1800;
  }
  S.arcadeTime = newTime;
  var bd = buddy();
  bd.snacks = (Number(bd.snacks) || 0) + 10;
  saveState();
  celebrate({
    emoji: '🎉',
    title: fmtNum(m * 10) + ' dhikr — mashaAllah!',
    sub: '+1:00 arcade time ⏱' + timeNote + ' · +10 snacks 🍯'
  });
}

/* Companion levels stay on 33s: 1 level per 33 Practice dhikr per counting
   run, idempotent per milestone (2 on Radiant Day if radiant was already
   active when the 33-segment began). Brief level-up notice. */
function awardLevelMilestone(which) {
  buddy(); // ensure buddy state exists
  var n = which === 'general' ? PC.generalCount : PC.count;
  var key = which === 'general' ? 'generalLvMilestone' : 'lvMilestone';
  var sk = which === 'general' ? 'generalSegStart' : 'segStart';
  var m = Math.floor(n / 33);
  if (m <= (PC[key] || 0)) return;
  PC[key] = m;
  var segStart = PC[sk] || Date.now();
  PC[sk] = 0; // next 33-segment starts on the next counted tap
  var bd = buddy();
  // Radiant double-XP applies only if radiant was already active when this
  // 33-segment began (the milestone that activates Radiant Day earns 1 level)
  var radiant = bd.radiantDay === todayKey() && (Number(bd.radiantSince) || 0) < segStart;
  var lvGain = radiant ? 2 : 1;
  var gained = buddyGainLevels(lvGain);
  buddyCheckTreasures();
  saveState();
  if (gained > 0) {
    toast('+' + gained + ' companion level 🌱 · Level ' + fmtNum(buddy().level) + ' of 500');
    var lc = buddyVisibleChar();
    if (lc) { buddyPlayAnim(lc, 'buddy-alevel'); buddyFx(lc, ['✨', '🌟', '💛'], 10, 'burst'); }
  }
}

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
      PC.dhikrId = sel.value; tapReset('phrase');
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
    if (!tapPaced('phrase')) return;
    PC.count++;
    buddyCountDhikr(1);
    awardMilestoneBundle('phrase');
    awardLevelMilestone('phrase');
    updateTapUI();
    if (PC.count >= PC.target) {
      setTimeout(function () { completeSession(false); }, 350);
    }
  });
  el('reset-btn').addEventListener('click', function () { tapReset('phrase'); updateTapUI(); });
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
  tapReset('phrase');
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
    (function (b) { b.addEventListener('click', function () { PC.generalTarget = Number(b.getAttribute('data-t')); tapReset('general'); upd(); }); })(presets[i]);
  }
  el('gset').addEventListener('click', function () {
    var v = Math.max(1, Math.floor(Number(el('gcustom').value) || 0));
    if (v > 0) { PC.generalTarget = v; tapReset('general'); upd(); }
  });
  btn.addEventListener('click', function () {
    if (!tapPaced('general')) return;
    PC.generalCount++; upd();
    buddyCountDhikr(1);
    awardMilestoneBundle('general');
    awardLevelMilestone('general');
    if (PC.generalCount >= PC.generalTarget) {
      setTimeout(function () { saveGeneral(false); }, 350);
    }
  });
  el('greset').addEventListener('click', function () { tapReset('general'); upd(); });
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
  tapReset('general');
  renderPractice();
}

/* ---------------- DAILY RHYTHM ---------------- */
var dailyTab = 'morning';
var dailyExpanded = { morning: false, evening: false }; // per-tab collapse state for out-of-level adhkar

function checklistDay() {
  var k = todayKey();
  if (!S.checklist[k]) S.checklist[k] = { morning: {}, evening: {} };
  // prune old days (keep 14)
  var keys = Object.keys(S.checklist).sort();
  while (keys.length > 14) { delete S.checklist[keys.shift()]; }
  return S.checklist[k];
}

/* ---------------- adhkar credit wallet ----------------
   Each checklist item awards 1-4 credits (x level multiplier) once per day
   per period, keyed by item id. Unchecking never revokes; rechecking never
   double-awards. */
function itemCredits(it) {
  var c = Number(it && it.credits);
  if (!(c >= 1 && c <= 9)) c = 1;
  return Math.round(c);
}
function awardCredits(period, id, it) {
  var k = todayKey();
  if (!S.creditAwards[k] || typeof S.creditAwards[k] !== 'object') S.creditAwards[k] = { morning: {}, evening: {} };
  var rec = S.creditAwards[k][period];
  if (!rec || typeof rec !== 'object') rec = S.creditAwards[k][period] = {};
  if (rec[id]) return 0;
  var mult = Number(rhythmLevelDef().creditMult) || 1;
  var c = itemCredits(it) * mult;
  rec[id] = c;
  S.credits = (Number(S.credits) || 0) + c;
  var keys = Object.keys(S.creditAwards).sort();
  while (keys.length > 14) { delete S.creditAwards[keys.shift()]; }
  saveState();
  return c;
}
function creditWalletCard(withPlay) {
  var html = '<div class="card"><div class="row-between"><div><span class="kicker k-gold">🪙 Adhkar credits</span>' +
    '<div style="font-size:1.6rem;font-weight:900;color:var(--cream)">' + fmtNum(S.credits) + '</div></div>' +
    (withPlay ? '<button class="btn-gold" data-go="game">Open arcade 🕹️</button>' : '') + '</div>' +
    '<p class="muted" style="margin:8px 0 0">Earn credits by completing morning &amp; evening adhkar — higher levels earn more. ' +
    'Each arcade game costs ' + GAME_COST + ' credits per attempt.</p></div>';
  return html;
}

function doneCountFor(period) {
  var d = getDaily();
  var list = period === 'morning' ? d.morning : d.evening;
  var day = checklistDay();
  var n = 0;
  for (var i = 0; i < list.length; i++) {
    if (list[i] && list[i].id && day[period] && day[period][list[i].id]) n++;
  }
  return n;
}

function minLevelFor(id) {
  var ls = getRhythmLevels();
  for (var i = 0; i < ls.length; i++) {
    var ids = ls[i].itemIds;
    if (ids === null || ids === undefined) return ls[i].name;
    if (ids.indexOf(id) !== -1) return ls[i].name;
  }
  return 'Expert';
}

function dailyRowHtml(it, period, day, periodOpen) {
  var id = it.id;
  var checked = !!(day[period] && day[period][id]);
  var outOfLevel = !inLevel(id);
  var shaded = outOfLevel || !periodOpen;
  var url = audioUrlFor(id);
  var listened = audioListened(id);
  var locked = !!url && !listened;
  var html = '<div class="check-row' + (checked ? ' done' : '') + (shaded ? ' shaded' : '') +
    '" data-item="' + esc(id) + '">' +
    '<input type="checkbox" class="bigcheck" data-check="' + esc(id) + '"' +
    (checked ? ' checked' : '') + (shaded ? ' disabled' : '') +
    ' aria-label="Mark complete: ' + esc(it.transliteration || ('item ' + id)) + '">' +
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
  if (url && !shaded) {
    var a = audioEls[id];
    var playing = !!(a && !a.paused && !a.ended);
    html += '<div class="audio-row"><button class="aplay" data-audio-play="' + esc(id) + '">' +
      (playing ? '⏸ Pause' : (listened ? '▶ Replay' : '▶ Recitation')) + '</button>' +
      '<div class="aprog"><i data-audio-prog="' + esc(id) + '" style="width:' + (listened ? '100' : '0') + '%"></i></div>' +
      '<span class="alistened" data-audio-done="' + esc(id) + '"' + (listened ? '' : ' hidden') + '>✓ Listened</span></div>' +
      '<div class="lock-note" data-audio-lock="' + esc(id) + '"' + (locked ? '' : ' hidden') + '>' +
      '🔒 Listen to the recitation in full to unlock</div>';
  }
  if (outOfLevel) {
    html += '<div class="lock-note">Part of the <b>' + esc(minLevelFor(id)) + '</b> level — switch levels above to unlock it.</div>';
  }
  html += '</div></div>';
  return html;
}

/* unlocked (in-level) items first, original order preserved within each group */
function dailyRowsHtml(period, win) {
  var d = getDaily();
  var items = (period === 'morning' ? d.morning : d.evening) || [];
  var day = checklistDay();
  var periodOpen = period === 'morning' ? win.morningOpen : win.eveningOpen;
  var inL = [], outL = [], i;
  for (i = 0; i < items.length; i++) {
    var it = items[i] || {};
    if (!it.id) continue;
    (inLevel(it.id) ? inL : outL).push(it);
  }
  var ordered = inL; // in-level first; out-of-level collapse behind a toggle
  var html = '';
  for (i = 0; i < ordered.length; i++) html += dailyRowHtml(ordered[i], period, day, periodOpen);
  if (outL.length) {
    var expanded = !!dailyExpanded[period];
    html += '<button class="more-adhkar-toggle" data-expand-adhkar="' + period + '">' +
      (expanded ? 'Hide extra adhkar ▲' : 'Show ' + outL.length + ' more adhkar ▼') + '</button>';
    if (expanded) {
      for (i = 0; i < outL.length; i++) html += dailyRowHtml(outL[i], period, day, periodOpen);
    }
  }
  return html;
}

function refreshDailyCounts() {
  var d = getDaily();
  var mLen = (d.morning || []).length, eLen = (d.evening || []).length;
  var mDone = doneCountFor('morning'), eDone = doneCountFor('evening');
  var tm = document.querySelector('[data-tabcount="morning"]');
  var te = document.querySelector('[data-tabcount="evening"]');
  if (tm) tm.textContent = mDone + '/' + mLen;
  if (te) te.textContent = eDone + '/' + eLen;
  var cur = dailyTab === 'morning' ? mDone : eDone;
  var len = dailyTab === 'morning' ? mLen : eLen;
  var dc = el('daily-donecount'); if (dc) dc.textContent = cur + '/' + len;
  var sm = el('daily-summary'); if (sm) sm.textContent = cur + ' / ' + len + ' complete';
  var pb = el('daily-pbar'); if (pb) pb.style.width = (len ? (cur / len * 100).toFixed(0) : 0) + '%';
}

function renderDaily() {
  var sec = el('screen-daily');
  if (!sec) return;
  var daily = getDaily();
  var win = rhythmWindow();
  var level = rhythmLevelDef();
  var levels = getRhythmLevels();
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

  if (levels.length) {
    html += '<div class="card"><span class="kicker k-sage">Your level</span><div class="lvl-grid">';
    for (var li = 0; li < levels.length; li++) {
      var L = levels[li];
      html += '<button class="lvl-btn' + (L.id === level.id ? ' active' : '') + '" data-level="' + esc(L.id) + '">' +
        '<b>' + esc(L.name) + '</b><i>' + esc(L.desc || '') + '</i>' +
        '<span class="lvl-mult">×' + (Number(L.creditMult) || 1) + ' credits</span></button>';
    }
    html += '</div><p class="muted" style="margin:10px 0 0">Pick whatever level you are comfortable with — you can switch any time.</p></div>';
  }

  if (!win.gated) {
    if (!(S.location && S.location.granted)) {
      html += '<div class="card gate-note"><span class="kicker k-sage">🕌 Prayer times</span>' +
        '<p class="muted" style="margin:6px 0 10px">Share your location once so morning adhkar open at Fajr and evening adhkar at Maghrib.</p>' +
        '<button class="btn-gold" id="daily-loc">Share location</button></div>';
    }
  } else if (win.nextUnlock) {
    var nu = win.nextUnlock;
    html += '<div class="card gate-note"><span class="kicker k-sage">🕌 Prayer times</span>' +
      '<p class="muted" style="margin:6px 0 0">' +
      (nu.forPeriod === 'morning' ? 'Morning' : 'Evening') + ' adhkar unlock at ' + esc(nu.prayer) +
      ' · ' + esc(fmtClock(nu.at)) + '</p></div>';
  }

  var mDone = doneCountFor('morning'), eDone = doneCountFor('evening');
  var mItems = daily.morning || [], eItems = daily.evening || [];
  var cur = dailyTab === 'morning' ? mDone : eDone;
  var items = dailyTab === 'morning' ? mItems : eItems;

  html += '<div class="card checklist-card"><span class="kicker k-sage">Today&rsquo;s checklist</span>' +
    '<div class="check-head"><h2 id="daily-head">' + (dailyTab === 'morning' ? 'Morning' : 'Evening') + '</h2>' +
    '<span class="check-done-count" id="daily-donecount">' + cur + '/' + items.length + '</span></div>' +
    '<div class="tabs"><button class="tab' + (dailyTab === 'morning' ? ' active' : '') +
    '" data-tab="morning"><span>Morning</span><b data-tabcount="morning">' + mDone + '/' + mItems.length + '</b></button>' +
    '<button class="tab' + (dailyTab === 'evening' ? ' active' : '') +
    '" data-tab="evening"><span>Evening</span><b data-tabcount="evening">' + eDone + '/' + eItems.length + '</b></button></div>' +
    '<div id="daily-list">' + dailyRowsHtml(dailyTab, win) + '</div></div>';

  html += '<div class="card" style="text-align:center"><span class="kicker k-sage">Today</span>' +
    '<div style="font-size:1.6rem;font-weight:900;color:var(--cream)" id="daily-summary">' + cur + ' / ' + items.length + ' complete</div>' +
    '<div class="pbar green"><i id="daily-pbar" style="width:' + (items.length ? (cur / items.length * 100).toFixed(0) : 0) + '%"></i></div></div>';

  sec.innerHTML = html;
  wireDaily(sec);
  // fetch today's prayer times (Aladhan, cached) then re-render with gating
  ensureRhythmTimes(function () { if (currentScreen === 'daily') renderDaily(); });
}

function wireDaily(sec) {
  var gos = sec.querySelectorAll('[data-go]');
  for (var g = 0; g < gos.length; g++) {
    (function (b) { b.addEventListener('click', function () { showScreen(b.getAttribute('data-go')); }); })(gos[g]);
  }
  var lvls = sec.querySelectorAll('[data-level]');
  for (var l = 0; l < lvls.length; l++) {
    (function (b) {
      b.addEventListener('click', function () {
        S.rhythmLevel = b.getAttribute('data-level');
        safeSet('dg_rhythm_level', S.rhythmLevel);
        dailyExpanded = { morning: false, evening: false }; // level switch collapses extras again
        stopAllAudio();
        renderDaily();
        toast('Level: ' + rhythmLevelDef().name + ' 🌙');
      });
    })(lvls[l]);
  }
  var dl = el('daily-loc');
  if (dl) dl.addEventListener('click', function () { requestLocation('daily'); });
  var tabs = sec.querySelectorAll('[data-tab]');
  for (var t = 0; t < tabs.length; t++) {
    (function (b) {
      b.addEventListener('click', function () {
        stopAllAudio();
        dailyTab = b.getAttribute('data-tab');
        renderDaily();
      });
    })(tabs[t]);
  }
  var exT = sec.querySelector('[data-expand-adhkar]');
  if (exT) exT.addEventListener('click', function () {
    var p = exT.getAttribute('data-expand-adhkar');
    dailyExpanded[p] = !dailyExpanded[p];
    renderDaily();
  });
  var rows = sec.querySelectorAll('.check-row');
  for (var r = 0; r < rows.length; r++) {
    (function (row) {
      var id = row.getAttribute('data-item');
      var box = row.querySelector('[data-check]');
      var tog = row.querySelector('.translit-toggle');
      var body = row.querySelector('.translit-body');
      var playBtn = row.querySelector('[data-audio-play]');
      if (box && !box.disabled) {
        box.addEventListener('click', function (e) {
          if (needsListen(id)) { e.preventDefault(); toast('Listen to the recitation first.'); }
        });
        box.addEventListener('change', function () {
          if (needsListen(id)) { box.checked = false; return; } // safety net
          var d = checklistDay();
          if (box.checked) {
            d[dailyTab][id] = 1;
            var gained = awardCredits(dailyTab, id, findDailyItem(dailyTab, id));
            if (gained > 0) toast('+' + gained + ' adhkar credits 🪙');
            row.classList.add('done');
          } else {
            delete d[dailyTab][id];
            row.classList.remove('done');
          }
          saveState();
          refreshDailyCounts();
        });
      }
      if (playBtn && !playBtn.disabled) {
        playBtn.addEventListener('click', function () { toggleAudio(id); });
      }
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

/* ---------------- LEARN: reading library (16 articles, grouped) ---------------- */
function getLearnArticles() {
  var a = Array.isArray(D.learnArticles) ? D.learnArticles : [];
  return a.filter(function (x) { return x && x.title && x.url; });
}
function getLearnGroups() {
  var g = Array.isArray(D.learnArticleGroups) ? D.learnArticleGroups : [];
  return g.filter(function (x) { return x && x.id && x.name; });
}

function renderLearn() {
  var sec = el('screen-learn');
  if (!sec) return;
  var arts = getLearnArticles();
  var groups = getLearnGroups();
  var html = '<button class="backlink" data-go="home">← ' + esc(T('homeName', 'Garden')) + '</button>' +
    '<span class="kicker k-sage">Read and learn</span>' +
    '<div class="giant">Learn</div>' +
    '<p class="lede">Short reads for young hearts — work through the Dear Youth sessions, then explore dhikr, repentance, and character.</p>';
  if (!arts.length) {
    html += '<div class="card"><div class="empty-note">Articles are being prepared —<br>check back soon, inshaAllah.</div></div>';
  } else {
    var order = groups.length ? groups : [{ id: null, name: '', desc: '' }];
    for (var gi = 0; gi < order.length; gi++) {
      (function (gr) {
        var list = [];
        for (var i = 0; i < arts.length; i++) {
          if (gr.id === null || arts[i].group === gr.id) list.push({ a: arts[i], idx: i });
        }
        if (!list.length) return;
        if (gr.name) {
          html += '<span class="kicker k-sage">' + esc(gr.name) + '</span>';
          if (gr.desc) html += '<p class="muted" style="margin:0 0 10px">' + esc(gr.desc) + '</p>';
        }
        for (var j = 0; j < list.length; j++) {
          (function (entry) {
            var a = entry.a;
            html += '<div class="card article-card" data-learn-article="' + entry.idx + '" role="button" tabindex="0">' +
              '<h3>📄 ' + esc(a.title) + '</h3>' +
              (a.summary ? '<p class="muted">' + esc(a.summary) + '</p>' : '') +
              '<span class="muted">Tap to read →</span></div>';
          })(list[j]);
        }
      })(order[gi]);
    }
  }
  sec.innerHTML = html;
  var gos = sec.querySelectorAll('[data-go]');
  for (var k = 0; k < gos.length; k++) {
    (function (b) { b.addEventListener('click', function () { showScreen(b.getAttribute('data-go')); }); })(gos[k]);
  }
  var cards = sec.querySelectorAll('[data-learn-article]');
  for (var c = 0; c < cards.length; c++) {
    (function (card) {
      function open() {
        var a = getLearnArticles()[Number(card.getAttribute('data-learn-article'))];
        readerArticle = { title: a.title, url: a.url, description: a.summary, embed: true };
        readerBackScreen = 'learn';
        renderReader();
        showScreen('reader');
      }
      card.addEventListener('click', open);
      card.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
    })(cards[c]);
  }
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

/* ---------------- READER (Learn articles) ---------------- */
var readerArticle = null;
var readerBackScreen = 'learn';

function renderReader() {
  var sec = el('screen-reader');
  if (!sec) return;
  var a = readerArticle;
  if (!a || !a.url) {
    sec.innerHTML = '<h1 class="page-title">📰 Article</h1><div class="card"><div class="empty-note">This article is unavailable.</div>' +
      '<button class="btn-ghost" data-back>← Back to Learn</button></div>';
  } else if (a.embed === false) {
    sec.innerHTML = '<h1 class="page-title" style="font-size:1.3rem">📄 ' + esc(a.title || 'Article') + '</h1>' +
      '<div class="card"><button class="btn-ghost" data-back style="margin-bottom:12px">← Learn</button>' +
      (a.description ? '<p class="muted">' + esc(a.description) + '</p>' : '') +
      '<p class="muted">This article opens in your browser.</p>' +
      '<a class="btn-gold" style="display:block;text-align:center;text-decoration:none" href="' + esc(a.url) +
      '" target="_blank" rel="noopener">Read article ↗</a></div>';
  } else {
    sec.innerHTML = '<h1 class="page-title" style="font-size:1.3rem">📄 ' + esc(a.title || 'Article') + '</h1>' +
      '<div class="card"><button class="btn-ghost" data-back style="margin-bottom:12px">← Learn</button>' +
      '<iframe class="reader-frame" src="' + esc(a.url) + '" title="' + esc(a.title || 'Article') +
      '" sandbox="allow-scripts allow-same-origin" loading="lazy"></iframe>' +
      '<p class="muted" style="margin-top:10px">Some websites block embedding — if the page is blank, use the button below.</p>' +
      '<a class="btn-gold" style="display:block;text-align:center;text-decoration:none" href="' + esc(a.url) +
      '" target="_blank" rel="noopener">Open externally ↗</a></div>';
  }
  var backs = sec.querySelectorAll('[data-back]');
  for (var i = 0; i < backs.length; i++) {
    (function (b) {
      b.addEventListener('click', function () { showScreen('learn'); });
    })(backs[i]);
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

/* ---------------- ADHKAR ARCADE (four skill games) ----------------
   Each attempt costs GAME_COST credits, deducted up front. All games draw
   straight to canvas on rAF and NEVER re-render the app per frame.
   Touch-only controls, no gameplay buttons, no luck-based mechanics. */
var GAME_COST = 5;
var arcadeScreen = 'menu'; // 'menu' | 'sprout' | 'flip' | 'firefly' | 'vine'
var sproutG = null, flipG = null, fireflyG = null, vineG = null; // active run states

function nowMs() {
  return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
}
function arcadeCancel(G) {
  if (G && G.raf) { try { cancelAnimationFrame(G.raf); } catch (e) {} }
}
function stopArcade() {
  arcadeRunEnd();
  arcadeCountdownClear();
  arcadeCancel(sproutG); arcadeCancel(flipG); arcadeCancel(fireflyG); arcadeCancel(vineG);
  sproutG = flipG = fireflyG = vineG = null;
  try {
    ['sprout-canvas', 'flip-canvas', 'firefly-canvas', 'vine-canvas'].forEach(function (id) {
      var c = el(id);
      if (c) {
        c.onpointerdown = c.onpointermove = c.onpointerup = c.onpointercancel = null;
        c.ontouchstart = c.ontouchmove = c.ontouchend = null;
      }
    });
  } catch (e) {}
}
/* deduct one attempt; returns the attempt number, or 0 when too poor.
   Attempts need 5 credits AND arcade time above zero. */
function arcadeStartDeduct(gameId) {
  if ((Number(S.credits) || 0) < GAME_COST) { toast('Not enough credits yet 🪙'); return 0; }
  if ((Number(S.arcadeTime) || 0) <= 0) { toast('Out of arcade time ⏱ — earn 1 min per 10 dhikr in Practice'); return 0; }
  S.credits -= GAME_COST;
  var n = bumpArcadeAttempts(gameId);
  saveState();
  return n;
}
function arcadeCanPlay() {
  return (Number(S.credits) || 0) >= GAME_COST && (Number(S.arcadeTime) || 0) > 0;
}
function arcadeTimeStr(s) {
  s = Math.max(0, Math.floor(Number(s) || 0));
  return Math.floor(s / 60) + ':' + pad2(s % 60);
}
/* ---- arcade time: ticks down in real time while a run is active ---- */
var arcadeRun = null; // {gameId, timerId}
function arcadeTimeChip(show) {
  var chip = el('arcade-time-chip');
  if (!chip) {
    chip = document.createElement('div');
    chip.id = 'arcade-time-chip';
    chip.className = 'arcade-time-chip';
    chip.hidden = true;
    document.body.appendChild(chip);
  }
  if (show === false) { chip.hidden = true; return; }
  chip.hidden = false;
  chip.textContent = '⏱ ' + arcadeTimeStr(S.arcadeTime);
}
function arcadeRunBegin(gameId) {
  arcadeRunEnd();
  arcadeRun = { gameId: gameId, timerId: 0 };
  arcadeTimeChip(true);
  arcadeRun.timerId = setInterval(function () { arcadeTimeTick(); }, 1000);
}
function arcadeRunEnd() {
  if (arcadeRun && arcadeRun.timerId) { try { clearInterval(arcadeRun.timerId); } catch (e) {} }
  arcadeRun = null;
  arcadeTimeChip(false);
}
function arcadeTimeTick() {
  if (!arcadeRun) return;
  S.arcadeTime = Math.max(0, (Number(S.arcadeTime) || 0) - 1);
  arcadeTimeChip(true);
  if (S.arcadeTime <= 0) { arcadeRunTimeUp(); }
  else if (S.arcadeTime % 5 === 0) { try { saveState(); } catch (e) {} }
}
/* time ran out mid-run: end the attempt with an out-of-time panel */
function arcadeRunTimeUp() {
  var gameId = arcadeRun ? arcadeRun.gameId : null;
  var G = gameId === 'sprout' ? sproutG : gameId === 'flip' ? flipG : gameId === 'firefly' ? fireflyG : gameId === 'vine' ? vineG : null;
  var score = G ? Math.floor(Number(G.score) || 0) : 0;
  if (G) G.over = true;
  arcadeRunEnd();
  stopArcade();
  if (!gameId) return;
  try { setArcadeHigh(gameId, score); saveState(); } catch (e) {}
  var over = el(gameId + '-over');
  if (!over) return;
  over.innerHTML = '<div class="sprout-result"><div style="font-size:2.6rem">⏱</div>' +
    '<h2>Out of arcade time</h2>' +
    '<p class="muted">Every 10 dhikr in Practice earns 1 more minute.</p>' +
    '<div class="btn-row" style="justify-content:center">' +
    '<button class="btn-gold" data-goto-practice>Practice dhikr 🤲</button>' +
    '<button class="btn-ghost" data-done>Arcade menu</button></div></div>';
  over.hidden = false;
  var gp = over.querySelector('[data-goto-practice]');
  if (gp) gp.addEventListener('click', function () { showScreen('practice'); });
  var dn = over.querySelector('[data-done]');
  if (dn) dn.addEventListener('click', function () { arcadeScreen = 'menu'; renderGame(); });
}
/* canvas setup; the wrap must already be unhidden so it has a width */
function arcadeCanvas(wrapId, canvasId, height) {
  var wrap = el(wrapId), canvas = el(canvasId);
  if (!wrap || !canvas) return null;
  var dpr = (typeof window.devicePixelRatio === 'number' && window.devicePixelRatio > 0) ? window.devicePixelRatio : 1;
  var W = wrap.clientWidth || 340, H = height || 480;
  canvas.style.height = H + 'px';
  try { canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr); } catch (e) {}
  var ctx = canvas.getContext('2d');
  if (!ctx) { toast('Game unavailable on this device'); return null; }
  try { ctx.setTransform(dpr, 0, 0, dpr, 0, 0); } catch (e) {}
  return { wrap: wrap, canvas: canvas, ctx: ctx, W: W, H: H };
}
function arcadeShowRun(wrapId, overId, startCardId) {
  var wrap = el(wrapId);
  if (wrap) wrap.hidden = false;
  var over = el(overId);
  if (over) over.hidden = true;
  var sc = el(startCardId);
  if (sc) sc.style.display = 'none';
  try { wrap.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
}
/* 3-2-1 countdown on the game overlay before the run begins; timers die with stopArcade. */
var arcadeCountdownTimers = [];
function arcadeCountdownClear() {
  for (var i = 0; i < arcadeCountdownTimers.length; i++) { try { clearTimeout(arcadeCountdownTimers[i]); } catch (e) {} }
  arcadeCountdownTimers = [];
}
function arcadeCountdown(overId, beginFn) {
  arcadeCountdownClear();
  var over = el(overId);
  if (!over) { beginFn(); return; }
  over.hidden = false;
  var seq = ['3', '2', '1', 'Go!'];
  (function show(i) {
    if (i >= seq.length) {
      over.hidden = true;
      over.innerHTML = '';
      beginFn();
      return;
    }
    over.innerHTML = '<div class="countdown-num">' + seq[i] + '</div>';
    arcadeCountdownTimers.push(setTimeout(function () { show(i + 1); }, i === seq.length - 1 ? 600 : 850));
  })(0);
}
/* shared game-over overlay */
function arcadeOverHtml(gameId, score, unit, isBest, extraHtml) {
  var canAfford = (Number(S.credits) || 0) >= GAME_COST;
  var hasTime = (Number(S.arcadeTime) || 0) > 0;
  var canPlay = canAfford && hasTime;
  var def = arcadeGameDef(gameId);
  var needMsg = !canAfford ? 'Need ' + GAME_COST + ' 🪙 to play'
    : (!hasTime ? 'Need arcade time ⏱ — earn it in Practice' : '');
  return '<div class="sprout-result"><div style="font-size:2.6rem">' + def.emoji + '</div>' +
    '<h2>' + (isBest ? 'New best!' : esc(def.name) + ' over!') + '</h2>' +
    '<div class="sprout-score">' + fmtNum(score) + ' <small style="font-size:1rem;color:var(--sage)">' + esc(unit) + '</small></div>' +
    (isBest ? '<p class="kicker k-gold">New personal best!</p>'
            : '<p class="muted">Best: ' + fmtNum(arcadeHigh(gameId)) + ' ' + esc(unit) + '</p>') +
    (extraHtml || '') +
    '<div class="btn-row" style="justify-content:center">' +
    '<button class="btn-gold" data-again="' + gameId + '"' + (canPlay ? '' : ' disabled') + '>' +
    (canPlay ? 'Play again · ' + GAME_COST + ' 🪙' : needMsg) + '</button>' +
    '<button class="btn-ghost" data-done>Done</button></div></div>';
}
function wireArcadeOver(overEl, startFn) {
  if (!overEl) return;
  var again = overEl.querySelector('[data-again]');
  if (again && !again.disabled) again.addEventListener('click', startFn);
  var done = overEl.querySelector('[data-done]');
  if (done) done.addEventListener('click', function () { arcadeScreen = 'menu'; renderGame(); });
}
function arcadeUnlockLines(lists, oldBest, newBest) {
  var html = '';
  for (var i = 0; i < lists.length; i++) {
    var newly = newlyUnlocked(lists[i], oldBest, newBest);
    for (var j = 0; j < newly.length; j++) {
      html += '<p class="kicker k-gold">🎽 New unlock: ' + esc(newly[j].name) + '</p>';
    }
  }
  return html;
}
/* customization grid shared by all games (opts: {id,name,emoji?,color?,at}) */
function customGrid(title, opts, equippedId, best, attr) {
  var html = '<div class="card"><span class="kicker k-sage">' + esc(title) + '</span><div class="costume-grid">';
  for (var i = 0; i < opts.length; i++) {
    (function (o) {
      var owned = best >= o.at;
      var active = equippedId === o.id;
      var face = o.color
        ? '<span class="swatch" style="background:' + o.color + '"></span>'
        : '<span class="costume-emoji">' + (owned ? (o.emoji || '✦') : '🔒') + '</span>';
      html += '<button class="costume' + (active ? ' active' : '') + '" data-custom="' + attr + ':' + o.id + '"' +
        (owned ? '' : ' disabled') + '>' + face +
        '<b>' + esc(o.name) + '</b>' +
        '<i>' + (owned ? (active ? 'Selected' : 'Tap to select') : 'Best ' + fmtNum(o.at)) + '</i></button>';
    })(opts[i]);
  }
  return html + '</div></div>';
}
function wireCustom(sec, onPick) {
  var cs = sec.querySelectorAll('[data-custom]');
  for (var k = 0; k < cs.length; k++) {
    (function (b) {
      b.addEventListener('click', function () {
        if (b.disabled) return;
        onPick(b.getAttribute('data-custom'));
      });
    })(cs[k]);
  }
}
function arcadeBalanceCard() {
  return '<div class="card"><div class="row-between"><div><span class="kicker k-gold">🪙 Your coins</span>' +
    '<div style="font-size:1.6rem;font-weight:900;color:var(--cream)">' + fmtNum(S.credits) + '</div></div>' +
    '<div style="text-align:center"><span class="kicker k-sage">⏱ Arcade time</span>' +
    '<div style="font-size:1.6rem;font-weight:900;color:var(--cream)">' + arcadeTimeStr(S.arcadeTime) + '</div></div>' +
    '<div style="text-align:right"><span class="kicker k-sage">Per attempt</span>' +
    '<div style="font-size:1.6rem;font-weight:900;color:var(--cream)">' + GAME_COST + ' 🪙</div></div></div>' +
    '<p class="muted" style="margin:8px 0 0">Earn coins from morning &amp; evening adhkar — and 1:00 of arcade time for every 10 dhikr in Practice. Each attempt needs coins <i>and</i> time.</p></div>';
}
function arcadeStartCard(gameId, emoji, readyText, startId) {
  var canAfford = (Number(S.credits) || 0) >= GAME_COST;
  var hasTime = (Number(S.arcadeTime) || 0) > 0;
  var canPlay = canAfford && hasTime;
  var gm = arcadeGameDef(gameId);
  var icon = (gm && gm.img) ? arcadeIconHtml(gm, 72) : '<div style="font-size:2.4rem">' + emoji + '</div>';
  var needMsg = !canAfford ? 'Need ' + GAME_COST + ' coins to play'
    : (!hasTime ? 'Out of arcade time ⏱ — every 10 dhikr in Practice earns 1:00' : '');
  return '<div class="card" style="text-align:center" id="' + startId + '">' +
    icon +
    '<p class="muted">' + readyText + '</p>' +
    '<button class="btn-gold" id="' + startId + '-btn"' + (canPlay ? '' : ' disabled') + '>' +
    (canPlay ? 'Start · ' + GAME_COST + ' 🪙' : needMsg) + '</button>' +
    (canPlay ? '' : '<p class="muted" style="margin-top:8px">Complete morning &amp; evening adhkar to earn coins.</p>') +
    '</div>';
}

/* ---------------- SPROUT (upgraded Doodle Jump-style climber) ----------------
   Auto-bounces; steer by touch-and-slide. Quick tap = one bonus mid-air jump
   per platform contact. Difficulty tiers every 100 m: moving platforms,
   break-after-one-bounce platforms, springs, and a 5-second jetpack pickup. */

function sproutSkin() {
  var t = (typeof currentTheme === 'function') ? currentTheme() : 'garden';
  if (t === 'highway') return { bgTop: '#182236', bgBot: '#0a0e16', plat: '#46586f', edge: '#ffd23f', deco: '🏁', name: 'Turbo Climb' };
  if (t === 'mine') return { bgTop: '#2b1f12', bgBot: '#0f0b07', plat: '#7a5636', edge: '#ffcf6e', deco: '💎', name: 'Shaft Climb' };
  return { bgTop: '#16281d', bgBot: '#0b100e', plat: '#2f6b4f', edge: '#9fe0b8', deco: '🌸', name: 'Sprout Climb' };
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

function sproutTier(G) { return Math.floor(Math.max(0, -G.minWy / 10) / 100); }

function sproutAddPlat(G) {
  var top = G.plats.length ? G.plats[G.plats.length - 1].wy : 30;
  var tier = sproutTier(G);
  var gap = Math.min(118, 62 + G.rng() * 46 + tier * 5); // always clearable (jump ~139px)
  var w = Math.max(42, G.PW - tier * 3); // platforms narrow with height — difficulty never plateaus
  var kind = 'normal';
  var rt = Math.min(4, tier), r = G.rng();
  var breakP = rt >= 1 ? 0.05 + rt * 0.045 : 0;
  var moveP = rt >= 1 ? 0.08 + rt * 0.05 : 0;
  if (r < breakP) kind = 'break';
  else if (r < breakP + moveP) kind = 'moving';
  var p = { x: G.rng() * (G.W - w), wy: top - gap, w: w, kind: kind, vx: 0,
            broken: false, breakT: 0, spring: false, jetpack: false };
  if (kind === 'moving') p.vx = (55 + tier * 22) * (G.rng() < 0.5 ? -1 : 1);
  if (kind === 'normal' && G.rng() < 0.08) p.spring = true;
  if (tier >= 1 && G.rng() < 0.03) p.jetpack = true;
  G.plats.push(p);
}

function sproutGen(G) {
  var highest = G.plats[G.plats.length - 1].wy;
  while (highest > G.camY - 80) { sproutAddPlat(G); highest = G.plats[G.plats.length - 1].wy; }
  var kept = [];
  for (var i = 0; i < G.plats.length; i++) {
    var p = G.plats[i];
    if (p.wy > G.camY + G.H + 80) continue;
    if (p.broken && p.breakT <= 0) continue;
    kept.push(p);
  }
  G.plats = kept;
}

function collectJetpack(G) {
  for (var i = 0; i < G.plats.length; i++) {
    var p = G.plats[i];
    if (!p.jetpack || p.broken) continue;
    if (Math.abs(G.x - (p.x + p.w / 2)) < 30 && Math.abs(G.wy - (p.wy - 30)) < 36) {
      p.jetpack = false;
      G.jetpack = 5;
      break;
    }
  }
}

function sproutStep(G, dt) {
  var i, p;
  for (i = 0; i < G.plats.length; i++) {
    p = G.plats[i];
    if (p.kind === 'moving' && !p.broken) {
      p.x += p.vx * dt;
      if (p.x <= 0) { p.x = 0; p.vx = Math.abs(p.vx); }
      else if (p.x + p.w >= G.W) { p.x = G.W - p.w; p.vx = -Math.abs(p.vx); }
    }
    if (p.broken) p.breakT -= dt;
  }
  if (G.ptr) {
    var want = (G.ptrX - G.x) * 18;
    if (want > 520) want = 520;
    if (want < -520) want = -520;
    G.vx = want;
  } else {
    G.vx *= Math.pow(0.0005, dt);
    if (Math.abs(G.vx) < 4) G.vx = 0;
  }
  // jetpack: 5 seconds of powered flight
  if (G.jetpack > 0) {
    G.jetpack -= dt;
    G.vy = -950;
    G.wy += G.vy * dt;
    G.x += G.vx * dt;
    if (G.x < -20) G.x += G.W + 40;
    if (G.x > G.W + 20) G.x -= G.W + 40;
    if (G.wy < G.camY + G.H * 0.42) G.camY = G.wy - G.H * 0.42;
    if (G.wy < G.minWy) { G.minWy = G.wy; G.score = Math.floor(-G.minWy / 10); }
    sproutGen(G);
    collectJetpack(G);
    if (G.jetpack <= 0) { G.vy = -200; G.airJump = true; }
    return;
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
    for (i = 0; i < G.plats.length; i++) {
      p = G.plats[i];
      if (p.broken) continue;
      if (prevBottom <= p.wy && nb >= p.wy && G.x + 14 > p.x && G.x - 14 < p.x + p.w) {
        G.wy = p.wy - 17;
        G.vy = p.spring ? -G.BOUNCE * 1.7 : -G.BOUNCE;
        G.airJump = true; // one bonus mid-air jump per platform contact
        if (p.kind === 'break') { p.broken = true; p.breakT = 0.35; }
        if (p.jetpack) { p.jetpack = false; G.jetpack = 5; }
        break;
      }
    }
  }
  collectJetpack(G);
  if (G.wy < G.camY + G.H * 0.42) G.camY = G.wy - G.H * 0.42;
  if (G.wy < G.minWy) { G.minWy = G.wy; G.score = Math.floor(-G.minWy / 10); }
  sproutGen(G);
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
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (i = 0; i < G.plats.length; i++) {
    var p = G.plats[i], sy = p.wy - G.camY;
    if (sy < -40 || sy > H + 40) continue;
    var alpha = (p.broken && p.breakT > 0) ? Math.max(0.15, p.breakT / 0.35) : 1;
    ctx.globalAlpha = alpha;
    if (p.kind === 'break') ctx.fillStyle = '#8a6a4a';
    else if (p.kind === 'moving') ctx.fillStyle = '#5a7a9a';
    else ctx.fillStyle = skin.plat;
    sproutRoundRect(ctx, p.x, sy, p.w, G.PH, 7); ctx.fill();
    ctx.fillStyle = p.kind === 'break' ? '#c9a227' : skin.edge;
    ctx.fillRect(p.x + 4, sy, p.w - 8, 3);
    ctx.font = '13px serif';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    if (p.kind === 'moving') ctx.fillText('⇄', p.x + p.w / 2, sy + 8);
    if (p.kind === 'break' && !p.broken) ctx.fillText('✕', p.x + p.w / 2, sy + 8);
    if (p.spring) { ctx.font = '15px serif'; ctx.fillText('🌀', p.x + p.w / 2, sy - 4); }
    if (p.jetpack) { ctx.font = '20px serif'; ctx.fillText('🚀', p.x + p.w / 2, sy - 22); }
    ctx.globalAlpha = 1;
  }
  var sxy = G.wy - G.camY;
  if (G.jetpack > 0) { ctx.font = '22px serif'; ctx.fillText('🔥', G.x, sxy + 24); }
  else if (G.airJump) { ctx.font = '13px serif'; ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillText('✦', G.x + 20, sxy - 20); }
  ctx.font = '36px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",serif';
  ctx.fillText(G.costume.emoji, G.x, sxy);
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  sproutRoundRect(ctx, 10, 10, 118, 34, 10); ctx.fill();
  ctx.fillStyle = '#f4efe3'; ctx.font = '700 16px Nunito,sans-serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('▲ ' + G.score, 22, 28);
  ctx.textAlign = 'right';
  ctx.fillText('Best ' + Math.max(arcadeHigh('sprout'), G.score), W - 22, 28);
  if (G.jetpack > 0) {
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffd94d';
    ctx.font = '700 14px Nunito,sans-serif';
    ctx.fillText('🚀 ' + G.jetpack.toFixed(1) + 's', W / 2, 60);
  }
}

function sproutGameOver(G) {
  if (G.over) return;
  G.over = true;
  if (sproutG === G) { arcadeCancel(sproutG); sproutG = null; }
  var oldBest = arcadeHigh('sprout');
  var isBest = setArcadeHigh('sprout', G.score);
  var extra = arcadeUnlockLines([SPROUT_COSTUMES], oldBest, arcadeHigh('sprout'));
  var over = el('sprout-over');
  if (!over) return;
  over.innerHTML = arcadeOverHtml('sprout', G.score, 'm', isBest, extra);
  over.hidden = false;
  wireArcadeOver(over, startSproutRun);
  if (isBest) {
    try { celebrate({ emoji: '🧗', title: 'New best climb!', sub: 'You reached ' + fmtNum(G.score) + ' m — alhamdulillah!' }); } catch (e) {}
  }
  arcadeRunEnd();
  arcadeLossGate();
}

function startSproutRun() {
  var attempt = arcadeStartDeduct('sprout');
  if (!attempt) return;
  var wrap = el('sprout-wrap');
  if (wrap) wrap.hidden = false;
  var setup = arcadeCanvas('sprout-wrap', 'sprout-canvas', 480);
  if (!setup) return;
  stopArcade();
  arcadeRunBegin('sprout');
  arcadeShowRun('sprout-wrap', 'sprout-over', 'sprout-start-card');
  var canvas = setup.canvas;
  var skin = sproutSkin();
  var rng = sproutRng(attempt * 7919 + 13);
  var W = setup.W, H = setup.H;
  var G = {
    ctx: setup.ctx, W: W, H: H, skin: skin, rng: rng,
    x: W / 2, wy: 0, vy: 0, vx: 0,
    camY: 0, minWy: 0, score: 0,
    plats: [], raf: 0, over: false,
    ptr: false, ptrX: W / 2, downT: 0, downX: 0, downY: 0,
    airJump: false, jetpack: 0,
    costume: sproutCostumeById(S.sproutEquipped),
    GRAV: 2300, BOUNCE: 800, PW: 66, PH: 14
  };
  G.plats.push({ x: W / 2 - G.PW / 2, wy: 30, w: G.PW, kind: 'normal', vx: 0, broken: false, breakT: 0, spring: false, jetpack: false });
  for (var i = 0; i < 14; i++) sproutAddPlat(G);
  G.vy = -G.BOUNCE; // launch immediately — the first jump starts with the run
  sproutG = G;
  G.countdown = true; // input + loop wait for the 3-2-1
  function toX(e) {
    try {
      var r = canvas.getBoundingClientRect();
      return e.clientX - r.left;
    } catch (err) { return G.x; }
  }
  canvas.onpointerdown = function (e) {
    if (G.countdown) return;
    G.ptr = true; G.ptrX = toX(e);
    G.downT = nowMs(); G.downX = e.clientX; G.downY = e.clientY;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    if (e.preventDefault) e.preventDefault();
  };
  canvas.onpointermove = function (e) { if (G.ptr) G.ptrX = toX(e); };
  canvas.onpointerup = function (e) {
    // quick tap (not a steering slide) = the bonus mid-air jump
    if (G.ptr && e && typeof e.clientX === 'number') {
      var dtms = nowMs() - G.downT;
      var moved = Math.hypot(e.clientX - G.downX, e.clientY - G.downY);
      if (dtms < 260 && moved < 16 && G.airJump && !G.over && G.jetpack <= 0) {
        G.vy = -G.BOUNCE * 0.9;
        G.airJump = false;
      }
    }
    G.ptr = false;
  };
  canvas.onpointercancel = function () { G.ptr = false; };
  arcadeCountdown('sprout-over', function () {
    if (!sproutG || sproutG !== G || G.over) return;
    G.countdown = false;
    G.last = nowMs();
    (function kick() {
      if (!sproutG || sproutG !== G || G.over) return;
      var t = nowMs(), dt = (t - G.last) / 1000;
      G.last = t;
      if (dt > 0.05) dt = 0.05;
      if (dt < 0) dt = 0;
      sproutStep(G, dt);
      sproutDraw(G);
      if (!G.over) G.raf = requestAnimationFrame(kick);
    })();
  });
}

/* ---------------- FLIP RUNNER (Gravity Guy-style) ----------------
   The runner sprints right on its own; tap anywhere to flip gravity and run
   on the ceiling. Dodge gaps and spike blocks. Endless, scored in meters. */
function flipSkin() {
  var t = currentTheme();
  if (t === 'highway') return { bgTop: '#1a2233', bgBot: '#0a0e16', ground: '#3a4a63', edge: '#ffd23f' };
  if (t === 'mine') return { bgTop: '#2b1f12', bgBot: '#0f0b07', ground: '#6b4e2e', edge: '#ffcf6e' };
  return { bgTop: '#14231a', bgBot: '#0b100e', ground: '#2f6b4f', edge: '#9fe0b8' };
}
function flipGen(G, tier) {
  function genSide(nextKey, list, isFloor) {
    while (G[nextKey] < G.W + 140) {
      var gap = 90 + G.rng() * 90 + tier * 14;
      var w = 150 + G.rng() * 170;
      var x = G[nextKey] + gap;
      list.push({ x: x, w: w });
      if (tier >= 1 && w > 200 && G.rng() < 0.22 + tier * 0.04) {
        G.obs.push({ x: x + 50 + G.rng() * (w - 120), side: isFloor ? 'floor' : 'ceil' });
      }
      G[nextKey] = x + w;
    }
  }
  genSide('nextF', G.floors, true);
  genSide('nextC', G.ceils, false);
}
function flipStep(G, dt) {
  var tier = Math.floor(G.score / 100);
  var speed = 235 + tier * 30;
  var floorY = G.H - 46, ceilY = 46;
  G.vy += G.g * 2600 * dt;
  if (G.vy > 1500) G.vy = 1500;
  if (G.vy < -1500) G.vy = -1500;
  G.y += G.vy * dt;
  G.dist += speed * dt;
  G.score = Math.floor(G.dist / 40);
  var i;
  for (i = 0; i < G.floors.length; i++) G.floors[i].x -= speed * dt;
  for (i = 0; i < G.ceils.length; i++) G.ceils[i].x -= speed * dt;
  for (i = 0; i < G.obs.length; i++) G.obs[i].x -= speed * dt;
  G.nextF -= speed * dt; G.nextC -= speed * dt; // scroll spawn cursors so the run stays endless
  var px = G.x;
  function segAt(list) {
    for (var k = 0; k < list.length; k++) {
      var sg = list[k];
      if (px >= sg.x && px <= sg.x + sg.w) return sg;
    }
    return null;
  }
  if (G.g > 0) {
    var f = segAt(G.floors);
    if (f && G.vy >= 0 && G.y + G.h / 2 >= floorY) { G.y = floorY - G.h / 2; G.vy = 0; G.grounded = true; }
    else if (G.grounded && !f) G.grounded = false;
    if (G.y - G.h / 2 > G.H + 50) { flipGameOver(G); return; }
  } else {
    var c = segAt(G.ceils);
    if (c && G.vy <= 0 && G.y - G.h / 2 <= ceilY) { G.y = ceilY + G.h / 2; G.vy = 0; G.grounded = true; }
    else if (G.grounded && !c) G.grounded = false;
    if (G.y + G.h / 2 < -50) { flipGameOver(G); return; }
  }
  for (i = 0; i < G.obs.length; i++) {
    var o = G.obs[i];
    var oy = o.side === 'floor' ? floorY - 24 : ceilY;
    if (G.x + G.w / 2 > o.x && G.x - G.w / 2 < o.x + 24 &&
        G.y + G.h / 2 > oy && G.y - G.h / 2 < oy + 24) {
      flipGameOver(G); return;
    }
  }
  flipGen(G, tier);
  G.floors = G.floors.filter(function (sg) { return sg.x + sg.w > -80; });
  G.ceils = G.ceils.filter(function (sg) { return sg.x + sg.w > -80; });
  G.obs = G.obs.filter(function (o) { return o.x > -80; });
}
function flipDraw(G) {
  var ctx = G.ctx, W = G.W, H = G.H, skin = G.skin, i;
  var floorY = H - 46, ceilY = 46;
  var bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, skin.bgTop); bg.addColorStop(1, skin.bgBot);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = skin.ground;
  for (i = 0; i < G.ceils.length; i++) {
    var c = G.ceils[i];
    ctx.fillRect(c.x, 0, c.w, ceilY);
  }
  for (i = 0; i < G.floors.length; i++) {
    var f = G.floors[i];
    ctx.fillRect(f.x, floorY, f.w, H - floorY);
  }
  ctx.fillStyle = skin.edge;
  for (i = 0; i < G.ceils.length; i++) ctx.fillRect(G.ceils[i].x, ceilY - 3, G.ceils[i].w, 3);
  for (i = 0; i < G.floors.length; i++) ctx.fillRect(G.floors[i].x, floorY, G.floors[i].w, 3);
  // spike obstacles
  ctx.fillStyle = '#d9534f';
  for (i = 0; i < G.obs.length; i++) {
    var o = G.obs[i];
    var oy = o.side === 'floor' ? floorY : ceilY;
    ctx.beginPath();
    if (o.side === 'floor') {
      ctx.moveTo(o.x, oy); ctx.lineTo(o.x + 12, oy - 24); ctx.lineTo(o.x + 24, oy);
    } else {
      ctx.moveTo(o.x, oy); ctx.lineTo(o.x + 12, oy + 24); ctx.lineTo(o.x + 24, oy);
    }
    ctx.closePath(); ctx.fill();
  }
  // runner: shirt torso, head, hat, shoes (flips with gravity)
  var up = G.g < 0 ? -1 : 1;
  var cx = G.x, cy = G.y;
  ctx.fillStyle = G.custom.shoes.color || '#8a6a4a';
  ctx.fillRect(cx - 11, cy + up * (G.h / 2 - 6), 9, 6);
  ctx.fillRect(cx + 2, cy + up * (G.h / 2 - 6), 9, 6);
  ctx.fillStyle = G.custom.shirt.color || '#f4efe3';
  sproutRoundRect(ctx, cx - G.w / 2, cy - G.h / 2 + (up > 0 ? 8 : 0), G.w, G.h - 8, 6);
  ctx.fill();
  ctx.fillStyle = '#e8b98a';
  ctx.beginPath(); ctx.arc(cx, cy - up * (G.h / 2 - 4), 9, 0, Math.PI * 2); ctx.fill();
  if (G.custom.hat.color) {
    ctx.fillStyle = G.custom.hat.color;
    ctx.beginPath(); ctx.arc(cx, cy - up * (G.h / 2 - 4), 9, Math.PI, 0); ctx.fill();
    ctx.fillRect(cx - 9, cy - up * (G.h / 2 - 4) - (up > 0 ? 2 : -2), 18, 3);
  }
  // HUD
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  sproutRoundRect(ctx, 10, 10, 118, 34, 10); ctx.fill();
  ctx.fillStyle = '#f4efe3'; ctx.font = '700 16px Nunito,sans-serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('➤ ' + G.score + ' m', 22, 28);
  ctx.textAlign = 'right';
  ctx.fillText('Best ' + Math.max(arcadeHigh('flip'), G.score) + ' m', W - 22, 28);
}
function flipGameOver(G) {
  if (G.over) return;
  G.over = true;
  if (flipG === G) { arcadeCancel(flipG); flipG = null; }
  var oldBest = arcadeHigh('flip');
  var isBest = setArcadeHigh('flip', G.score);
  var extra = arcadeUnlockLines([FLIP_SHIRTS, FLIP_SHOES, FLIP_HATS], oldBest, arcadeHigh('flip'));
  var over = el('flip-over');
  if (!over) return;
  over.innerHTML = arcadeOverHtml('flip', G.score, 'm', isBest, extra);
  over.hidden = false;
  wireArcadeOver(over, startFlipRun);
  if (isBest) {
    try { celebrate({ emoji: '🌀', title: 'New best run!', sub: 'You ran ' + fmtNum(G.score) + ' m — alhamdulillah!' }); } catch (e) {}
  }
  arcadeRunEnd();
  arcadeLossGate();
}
function startFlipRun() {
  var attempt = arcadeStartDeduct('flip');
  if (!attempt) return;
  var wrap = el('flip-wrap');
  if (wrap) wrap.hidden = false;
  var setup = arcadeCanvas('flip-wrap', 'flip-canvas', 420);
  if (!setup) return;
  stopArcade();
  arcadeRunBegin('flip');
  arcadeShowRun('flip-wrap', 'flip-over', 'flip-start-card');
  var canvas = setup.canvas;
  var W = setup.W, H = setup.H;
  var G = {
    ctx: setup.ctx, W: W, H: H, rng: sproutRng(attempt * 104729 + 7),
    x: Math.round(W * 0.32), y: H - 46 - 17, vy: 0, g: 1, w: 26, h: 34,
    dist: 0, score: 0, grounded: true,
    floors: [{ x: -60, w: W + 240 }], ceils: [{ x: -60, w: W + 240 }],
    nextF: W + 180, nextC: W + 180, obs: [],
    skin: flipSkin(), raf: 0, over: false,
    custom: {
      shirt: flipOptById(FLIP_SHIRTS, S.flipCustom.shirt),
      shoes: flipOptById(FLIP_SHOES, S.flipCustom.shoes),
      hat: flipOptById(FLIP_HATS, S.flipCustom.hat)
    }
  };
  flipG = G;
  G.countdown = true; // input + loop wait for the 3-2-1
  canvas.onpointerdown = function (e) {
    if (e.preventDefault) e.preventDefault();
    if (G.countdown) return;
    if (flipG === G && !G.over) { G.g *= -1; G.vy = 0; G.grounded = false; }
  };
  G.last = nowMs();
  arcadeCountdown('flip-over', function () {
    if (!flipG || flipG !== G || G.over) return;
    G.countdown = false;
    G.last = nowMs();
    (function kick() {
      if (!flipG || flipG !== G || G.over) return;
      var t = nowMs(), dt = (t - G.last) / 1000;
      G.last = t;
      if (dt > 0.05) dt = 0.05;
      if (dt < 0) dt = 0;
      flipStep(G, dt);
      flipDraw(G);
      if (!G.over) G.raf = requestAnimationFrame(kick);
    })();
  });
}

/* ---------------- FIREFLY FLIGHT (Flappy-style) ----------------
   Tap anywhere to flap through garden arch gaps. One point per arch;
   arches narrow and speed rises with score. */
function startFireflyRun() {
  var attempt = arcadeStartDeduct('firefly');
  if (!attempt) return;
  var wrap = el('firefly-wrap');
  if (wrap) wrap.hidden = false;
  var setup = arcadeCanvas('firefly-wrap', 'firefly-canvas', 480);
  if (!setup) return;
  stopArcade();
  arcadeRunBegin('firefly');
  arcadeShowRun('firefly-wrap', 'firefly-over', 'firefly-start-card');
  var canvas = setup.canvas;
  var W = setup.W, H = setup.H;
  var G = {
    ctx: setup.ctx, W: W, H: H, rng: sproutRng(attempt * 1299709 + 3),
    x: Math.round(W * 0.35), y: Math.round(H * 0.45), vy: 0, r: 12,
    arches: [], nextX: W + 120, score: 0, over: false, raf: 0,
    glow: colorOptById(FIREFLY_GLOWS, S.fireflyGlow).color || '#ffd94d'
  };
  fireflyG = G;
  G.countdown = true; // input + loop wait for the 3-2-1
  canvas.onpointerdown = function (e) {
    if (e.preventDefault) e.preventDefault();
    if (G.countdown) return;
    if (fireflyG === G && !G.over) G.vy = -430;
  };
  arcadeCountdown('firefly-over', function () {
    if (!fireflyG || fireflyG !== G || G.over) return;
    G.countdown = false;
    G.last = nowMs();
    (function kick() {
      if (!fireflyG || fireflyG !== G || G.over) return;
    var t = nowMs(), dt = (t - G.last) / 1000;
    G.last = t;
    if (dt > 0.05) dt = 0.05;
    if (dt < 0) dt = 0;
    fireflyStep(G, dt);
    fireflyDraw(G);
    if (!G.over) G.raf = requestAnimationFrame(kick);
    })();
  });
}
function fireflyStep(G, dt) {
  var speed = Math.min(430, 195 + G.score * 2.4);
  G.vy += 1500 * dt;
  if (G.vy > 900) G.vy = 900;
  G.y += G.vy * dt;
  var i, a;
  for (i = 0; i < G.arches.length; i++) {
    a = G.arches[i];
    a.x -= speed * dt;
    if (!a.passed && a.x + a.w < G.x) { a.passed = true; G.score++; }
  }
  G.nextX -= speed * dt; // scroll the spawn cursor with the world so arches keep coming
  while (G.nextX < G.W + 160) {
    var gapH = Math.max(112, 178 - G.score * 1.7);
    var gy = 100 + G.rng() * (G.H - 200);
    G.arches.push({ x: G.nextX, gapY: gy, gapH: gapH, w: 56, passed: false });
    G.nextX += 235 + G.rng() * 60;
  }
  G.arches = G.arches.filter(function (x) { return x.x + x.w > -60; });
  if (G.y - G.r < 0 || G.y + G.r > G.H) { fireflyGameOver(G); return; }
  for (i = 0; i < G.arches.length; i++) {
    a = G.arches[i];
    if (G.x + G.r > a.x && G.x - G.r < a.x + a.w) {
      if (G.y - G.r < a.gapY - a.gapH / 2 || G.y + G.r > a.gapY + a.gapH / 2) {
        fireflyGameOver(G); return;
      }
    }
  }
}
function fireflyDraw(G) {
  var ctx = G.ctx, W = G.W, H = G.H, i;
  var bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#0d1626'); bg.addColorStop(1, '#101d12');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  for (i = 0; i < 30; i++) {
    ctx.fillRect((i * 89) % W, (i * 61) % H, 2, 2);
  }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (i = 0; i < G.arches.length; i++) {
    var a = G.arches[i];
    var topB = a.gapY - a.gapH / 2, botT = a.gapY + a.gapH / 2;
    ctx.fillStyle = '#2f6b4f';
    sproutRoundRect(ctx, a.x, -10, a.w, topB + 10, 10); ctx.fill();
    sproutRoundRect(ctx, a.x, botT, a.w, H - botT + 10, 10); ctx.fill();
    ctx.fillStyle = '#9fe0b8';
    ctx.fillRect(a.x + 5, 0, 4, topB);
    ctx.fillRect(a.x + 5, botT, 4, H - botT);
    ctx.font = '16px serif';
    ctx.fillText('🌿', a.x + a.w / 2, topB - 12);
    ctx.fillText('🌿', a.x + a.w / 2, botT + 12);
  }
  // firefly: glow + body
  var gr = ctx.createRadialGradient(G.x, G.y, 2, G.x, G.y, 34);
  gr.addColorStop(0, G.glow); gr.addColorStop(1, 'rgba(255,217,77,0)');
  ctx.fillStyle = gr;
  ctx.beginPath(); ctx.arc(G.x, G.y, 34, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff3b0';
  ctx.beginPath(); ctx.arc(G.x, G.y, G.r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#8a6a12';
  ctx.beginPath(); ctx.arc(G.x - 4, G.y - 3, 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(G.x + 4, G.y - 3, 2.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  sproutRoundRect(ctx, 10, 10, 110, 34, 10); ctx.fill();
  ctx.fillStyle = '#f4efe3'; ctx.font = '700 16px Nunito,sans-serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('✨ ' + G.score, 22, 28);
  ctx.textAlign = 'right';
  ctx.fillText('Best ' + Math.max(arcadeHigh('firefly'), G.score), W - 22, 28);
}
function fireflyGameOver(G) {
  if (G.over) return;
  G.over = true;
  if (fireflyG === G) { arcadeCancel(fireflyG); fireflyG = null; }
  var oldBest = arcadeHigh('firefly');
  var isBest = setArcadeHigh('firefly', G.score);
  var extra = arcadeUnlockLines([FIREFLY_GLOWS], oldBest, arcadeHigh('firefly'));
  var over = el('firefly-over');
  if (!over) return;
  over.innerHTML = arcadeOverHtml('firefly', G.score, 'arches', isBest, extra);
  over.hidden = false;
  wireArcadeOver(over, startFireflyRun);
  if (isBest) {
    try { celebrate({ emoji: '✨', title: 'New best flight!', sub: fmtNum(G.score) + ' arches — alhamdulillah!' }); } catch (e) {}
  }
  arcadeRunEnd();
  arcadeLossGate();
}

/* ---------------- VINE SNAKE (classic snake) ----------------
   Swipe to steer, or tap left/right to turn. Guide the growing vine to water
   drops without tangling. Speed rises with every drop. */
function vineDrop(G) {
  var free = [];
  for (var x = 0; x < G.N; x++) {
    for (var y = 0; y < G.N; y++) {
      var on = false;
      for (var i = 0; i < G.snake.length; i++) {
        if (G.snake[i].x === x && G.snake[i].y === y) { on = true; break; }
      }
      if (!on) free.push({ x: x, y: y });
    }
  }
  if (!free.length) return { x: 0, y: 0 };
  return free[Math.floor(G.rng() * free.length)];
}
function vineQueueDir(G, nd) {
  var last = G.queue.length ? G.queue[G.queue.length - 1] : G.dir;
  if ((nd.x !== -last.x || nd.y !== -last.y) && (nd.x !== last.x || nd.y !== last.y)) {
    if (G.queue.length < 3) G.queue.push(nd);
  }
}
function vineTurn(G, side) {
  var d = G.queue.length ? G.queue[G.queue.length - 1] : G.dir;
  vineQueueDir(G, side < 0 ? { x: d.y, y: -d.x } : { x: -d.y, y: d.x });
}
function vineTick(G) {
  if (G.queue.length) G.dir = G.queue.shift();
  var head = { x: G.snake[0].x + G.dir.x, y: G.snake[0].y + G.dir.y };
  if (head.x < 0 || head.y < 0 || head.x >= G.N || head.y >= G.N) { vineGameOver(G); return; }
  var grows = G.drop && head.x === G.drop.x && head.y === G.drop.y;
  var lim = G.snake.length - (grows ? 0 : 1);
  for (var i = 0; i < lim; i++) {
    if (G.snake[i].x === head.x && G.snake[i].y === head.y) { vineGameOver(G); return; }
  }
  G.snake.unshift(head);
  if (grows) {
    G.score++;
    G.tick = Math.max(80, G.tick - 3);
    G.drop = vineDrop(G);
  } else {
    G.snake.pop();
  }
}
function vineDraw(G) {
  var ctx = G.ctx, W = G.W, H = G.H, cell = G.cell;
  var bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#12241a'); bg.addColorStop(1, '#0b100e');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (var gLine = 1; gLine < G.N; gLine++) {
    ctx.beginPath(); ctx.moveTo(gLine * cell, 0); ctx.lineTo(gLine * cell, H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, gLine * cell); ctx.lineTo(W, gLine * cell); ctx.stroke();
  }
  if (G.drop) {
    ctx.font = Math.round(cell * 0.8) + 'px serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('💧', (G.drop.x + 0.5) * cell, (G.drop.y + 0.5) * cell);
  }
  for (var i = G.snake.length - 1; i >= 0; i--) {
    var s = G.snake[i];
    ctx.fillStyle = i === 0 ? G.color : G.color;
    ctx.globalAlpha = i === 0 ? 1 : 0.92;
    sproutRoundRect(ctx, s.x * cell + 1.5, s.y * cell + 1.5, cell - 3, cell - 3, 5);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  var hx = (G.snake[0].x + 0.5) * cell, hy = (G.snake[0].y + 0.5) * cell;
  ctx.fillStyle = '#0b100e';
  var ex = G.dir.x * 3, ey = G.dir.y * 3;
  ctx.beginPath(); ctx.arc(hx - 4 + ex, hy - 3 + ey, 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(hx + 4 + ex, hy - 3 + ey, 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  sproutRoundRect(ctx, 10, 10, 110, 34, 10); ctx.fill();
  ctx.fillStyle = '#f4efe3'; ctx.font = '700 16px Nunito,sans-serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('💧 ' + G.score, 22, 28);
  ctx.textAlign = 'right';
  ctx.fillText('Best ' + Math.max(arcadeHigh('vine'), G.score), G.W - 22, 28);
}
function vineGameOver(G) {
  if (G.over) return;
  G.over = true;
  if (vineG === G) { arcadeCancel(vineG); vineG = null; }
  var oldBest = arcadeHigh('vine');
  var isBest = setArcadeHigh('vine', G.score);
  var extra = arcadeUnlockLines([VINE_COLORS], oldBest, arcadeHigh('vine'));
  var over = el('vine-over');
  if (!over) return;
  over.innerHTML = arcadeOverHtml('vine', G.score, 'drops', isBest, extra);
  over.hidden = false;
  wireArcadeOver(over, startVineRun);
  if (isBest) {
    try { celebrate({ emoji: '🌿', title: 'New best vine!', sub: fmtNum(G.score) + ' drops — alhamdulillah!' }); } catch (e) {}
  }
  arcadeRunEnd();
  arcadeLossGate();
}
function startVineRun() {
  var attempt = arcadeStartDeduct('vine');
  if (!attempt) return;
  var wrap = el('vine-wrap');
  if (wrap) wrap.hidden = false;
  var side = (wrap && wrap.clientWidth) || 340;
  var setup = arcadeCanvas('vine-wrap', 'vine-canvas', side);
  if (!setup) return;
  stopArcade();
  arcadeRunBegin('vine');
  arcadeShowRun('vine-wrap', 'vine-over', 'vine-start-card');
  var canvas = setup.canvas;
  var N = 17, cell = setup.W / N;
  var G = {
    ctx: setup.ctx, W: setup.W, H: setup.W, N: N, cell: cell,
    rng: sproutRng(attempt * 224737 + 11),
    snake: [{ x: 4, y: 8 }, { x: 3, y: 8 }, { x: 2, y: 8 }], // left-of-center, moving right: full runway before the far wall
    dir: { x: 1, y: 0 }, queue: [], drop: null,
    score: 0, acc: 0, tick: 175, over: false, raf: 0,
    color: colorOptById(VINE_COLORS, S.vineColor).color || '#4caf50',
    pdown: null
  };
  G.drop = vineDrop(G);
  vineG = G;
  G.countdown = true; // input + loop wait for the 3-2-1
  canvas.onpointerdown = function (e) {
    if (G.countdown) return;
    G.pdown = { x: e.clientX, y: e.clientY };
    if (e.preventDefault) e.preventDefault();
  };
  canvas.onpointerup = function (e) {
    if (!G.pdown || vineG !== G || G.over) { G.pdown = null; return; }
    var dx = e.clientX - G.pdown.x, dy = e.clientY - G.pdown.y;
    G.pdown = null;
    if (Math.hypot(dx, dy) < 24) {
      try {
        var r = canvas.getBoundingClientRect();
        var hx = (G.snake[0].x + 0.5) * G.cell;
        vineTurn(G, (e.clientX - r.left) < hx ? -1 : 1);
      } catch (err) {}
    } else if (Math.abs(dx) > Math.abs(dy)) {
      vineQueueDir(G, { x: dx > 0 ? 1 : -1, y: 0 });
    } else {
      vineQueueDir(G, { x: 0, y: dy > 0 ? 1 : -1 });
    }
    if (e.preventDefault) e.preventDefault();
  };
  arcadeCountdown('vine-over', function () {
    if (!vineG || vineG !== G || G.over) return;
    G.countdown = false;
    G.last = nowMs();
    (function kick() {
      if (!vineG || vineG !== G || G.over) return;
      var t = nowMs(), dt = t - G.last;
      G.last = t;
      if (dt > 250) dt = 250;
      if (dt < 0) dt = 0;
      G.acc += dt;
      while (G.acc >= G.tick && !G.over) { G.acc -= G.tick; vineTick(G); }
      vineDraw(G);
      if (!G.over) G.raf = requestAnimationFrame(kick);
    })();
  });
}

/* ---------------- ARCADE screens ---------------- */
function renderGame() {
  var sec = el('screen-game');
  if (!sec) return;
  stopArcade();
  if (arcadeScreen === 'sprout') renderSproutScreen(sec);
  else if (arcadeScreen === 'flip') renderFlipScreen(sec);
  else if (arcadeScreen === 'firefly') renderFireflyScreen(sec);
  else if (arcadeScreen === 'vine') renderVineScreen(sec);
  else renderArcadeMenu(sec);
}

function renderArcadeMenu(sec) {
  var html = '<button class="backlink" data-go="home">← Home</button>' +
    '<span class="kicker k-sage">Skill games · no luck, just you</span>' +
    '<h1 class="giant">Adhkar Arcade</h1>' +
    '<p class="lede">Spend the coins you earned from morning &amp; evening adhkar, plus your arcade time. Each attempt costs ' +
    GAME_COST + ' coins and needs time on the clock — every 10 dhikr in Practice earns 1:00.</p>';
  html += arcadeBalanceCard();
  html += '<div class="arcade-grid">';
  for (var i = 0; i < ARCADE_GAMES.length; i++) {
    (function (gm) {
      var best = arcadeHigh(gm.id);
      var unit = (gm.id === 'sprout' || gm.id === 'flip') ? 'm' : 'pts';
      html += '<div class="card arcade-card">' + arcadeIconHtml(gm, 64) +
        '<h3>' + esc(gm.name) + '</h3><p class="muted">' + esc(gm.tag) + '</p>' +
        '<div class="arcade-best">Best: <b>' + fmtNum(best) + '</b> ' + unit + '</div>' +
        '<button class="btn-gold" data-arcade-open="' + gm.id + '">Play · ' + GAME_COST + ' 🪙</button></div>';
    })(ARCADE_GAMES[i]);
  }
  html += '</div>';
  sec.innerHTML = html;
  var gos = sec.querySelectorAll('[data-go]');
  for (var g = 0; g < gos.length; g++) {
    (function (b) { b.addEventListener('click', function () { showScreen(b.getAttribute('data-go')); }); })(gos[g]);
  }
  var opens = sec.querySelectorAll('[data-arcade-open]');
  for (var k = 0; k < opens.length; k++) {
    (function (b) {
      b.addEventListener('click', function () { arcadeScreen = b.getAttribute('data-arcade-open'); renderGame(); });
    })(opens[k]);
  }
}

function arcadeBackBtn() {
  return '<button class="backlink" data-arcade-back="1">← Arcade</button>';
}
function wireArcadeBack(sec) {
  var bs = sec.querySelectorAll('[data-arcade-back]');
  for (var i = 0; i < bs.length; i++) {
    bs[i].addEventListener('click', function () { arcadeScreen = 'menu'; renderGame(); });
  }
  var gos = sec.querySelectorAll('[data-go]');
  for (var g = 0; g < gos.length; g++) {
    (function (b) { b.addEventListener('click', function () { showScreen(b.getAttribute('data-go')); }); })(gos[g]);
  }
}

function renderSproutScreen(sec) {
  var skin = sproutSkin();
  var eq = sproutCostumeById(S.sproutEquipped);
  var best = arcadeHigh('sprout');
  var html = arcadeBackBtn() +
    '<span class="kicker k-sage">Skill game · no luck, just you</span>' +
    '<h1 class="giant">' + esc(skin.name) + '</h1>' +
    '<p class="lede">Sprout bounces on his own — press and slide your finger anywhere in the play area to steer. ' +
    'Quick-tap for one bonus jump per bounce. Watch for moving and breakable platforms, springs, and jetpacks!</p>';
  html += arcadeBalanceCard();
  html += '<div class="card"><div class="row-between"><div><span class="kicker k-sage">Best climb</span>' +
    '<div style="font-size:1.6rem;font-weight:900;color:var(--cream)">' + fmtNum(best) + ' m</div></div></div></div>';
  html += customGrid('Sprout&rsquo;s wardrobe', SPROUT_COSTUMES, S.sproutEquipped, best, 'sprout:costume');
  html += '<div class="card sprout-wrap" id="sprout-wrap" hidden>' +
    '<canvas id="sprout-canvas" class="sprout-canvas game-canvas"></canvas>' +
    '<div class="sprout-over" id="sprout-over" hidden></div></div>';
  html += arcadeStartCard('sprout', eq.emoji, 'Ready, ' + esc(eq.name) + '?', 'sprout-start-card');
  sec.innerHTML = html;
  wireArcadeBack(sec);
  wireCustom(sec, function (spec) {
    var parts = spec.split(':');
    var c = sproutCostumeById(parts[2]);
    if (best >= c.at) { S.sproutEquipped = c.id; saveState(); renderGame(); }
  });
  var start = el('sprout-start-card-btn');
  if (start && !start.disabled) start.addEventListener('click', startSproutRun);
}

function renderFlipScreen(sec) {
  var best = arcadeHigh('flip');
  var fc = S.flipCustom;
  var html = arcadeBackBtn() +
    '<span class="kicker k-sage">Skill game · no luck, just you</span>' +
    '<h1 class="giant">🌀 Flip Runner</h1>' +
    '<p class="lede">Your runner sprints on his own — <b>tap anywhere to flip gravity</b> and run on the ceiling. ' +
    'Dodge gaps and spikes. New shirt, shoe, and hat styles unlock every 1,000 m of best distance.</p>';
  html += arcadeBalanceCard();
  html += '<div class="card"><div class="row-between"><div><span class="kicker k-sage">Best run</span>' +
    '<div style="font-size:1.6rem;font-weight:900;color:var(--cream)">' + fmtNum(best) + ' m</div></div></div></div>';
  html += customGrid('Shirts', FLIP_SHIRTS, fc.shirt, best, 'flip:shirt');
  html += customGrid('Shoes', FLIP_SHOES, fc.shoes, best, 'flip:shoes');
  html += customGrid('Hats', FLIP_HATS, fc.hat, best, 'flip:hat');
  html += '<div class="card sprout-wrap" id="flip-wrap" hidden>' +
    '<canvas id="flip-canvas" class="sprout-canvas game-canvas"></canvas>' +
    '<div class="sprout-over" id="flip-over" hidden></div></div>';
  html += arcadeStartCard('flip', '🌀', 'Ready to run?', 'flip-start-card');
  sec.innerHTML = html;
  wireArcadeBack(sec);
  wireCustom(sec, function (spec) {
    var parts = spec.split(':'); // flip:shirt:fs-gold
    var slot = parts[1], id = parts[2];
    var list = slot === 'shirt' ? FLIP_SHIRTS : slot === 'shoes' ? FLIP_SHOES : FLIP_HATS;
    var opt = flipOptById(list, id);
    if (best >= opt.at) { S.flipCustom[slot] = id; saveState(); renderGame(); }
  });
  var start = el('flip-start-card-btn');
  if (start && !start.disabled) start.addEventListener('click', startFlipRun);
}

function renderFireflyScreen(sec) {
  var best = arcadeHigh('firefly');
  var html = arcadeBackBtn() +
    '<span class="kicker k-sage">Skill game · no luck, just you</span>' +
    '<h1 class="giant">✨ Firefly Flight</h1>' +
    '<p class="lede"><b>Tap anywhere to flap</b> through the garden arches — one point per arch. ' +
    'The arches narrow and speed up as you score. New glow colors unlock at score milestones.</p>';
  html += arcadeBalanceCard();
  html += '<div class="card"><div class="row-between"><div><span class="kicker k-sage">Best flight</span>' +
    '<div style="font-size:1.6rem;font-weight:900;color:var(--cream)">' + fmtNum(best) + ' arches</div></div></div></div>';
  html += customGrid('Glow colors', FIREFLY_GLOWS, S.fireflyGlow, best, 'firefly:glow');
  html += '<div class="card sprout-wrap" id="firefly-wrap" hidden>' +
    '<canvas id="firefly-canvas" class="sprout-canvas game-canvas"></canvas>' +
    '<div class="sprout-over" id="firefly-over" hidden></div></div>';
  html += arcadeStartCard('firefly', '✨', 'Ready to fly?', 'firefly-start-card');
  sec.innerHTML = html;
  wireArcadeBack(sec);
  wireCustom(sec, function (spec) {
    var id = spec.split(':')[2];
    var opt = colorOptById(FIREFLY_GLOWS, id);
    if (best >= opt.at) { S.fireflyGlow = id; saveState(); renderGame(); }
  });
  var start = el('firefly-start-card-btn');
  if (start && !start.disabled) start.addEventListener('click', startFireflyRun);
}

function renderVineScreen(sec) {
  var best = arcadeHigh('vine');
  var html = arcadeBackBtn() +
    '<span class="kicker k-sage">Skill game · no luck, just you</span>' +
    '<h1 class="giant">🌿 Vine Snake</h1>' +
    '<p class="lede"><b>Swipe to steer</b>, or tap the left/right side to turn. Guide your growing vine to the water drops ' +
    'without tangling yourself — every drop speeds you up. New vine colors unlock at score milestones.</p>';
  html += arcadeBalanceCard();
  html += '<div class="card"><div class="row-between"><div><span class="kicker k-sage">Best vine</span>' +
    '<div style="font-size:1.6rem;font-weight:900;color:var(--cream)">' + fmtNum(best) + ' drops</div></div></div></div>';
  html += customGrid('Vine colors', VINE_COLORS, S.vineColor, best, 'vine:color');
  html += '<div class="card sprout-wrap" id="vine-wrap" hidden>' +
    '<canvas id="vine-canvas" class="sprout-canvas game-canvas"></canvas>' +
    '<div class="sprout-over" id="vine-over" hidden></div></div>';
  html += arcadeStartCard('vine', '🌿', 'Ready to grow?', 'vine-start-card');
  sec.innerHTML = html;
  wireArcadeBack(sec);
  wireCustom(sec, function (spec) {
    var id = spec.split(':')[2];
    var opt = colorOptById(VINE_COLORS, id);
    if (best >= opt.at) { S.vineColor = id; saveState(); renderGame(); }
  });
  var start = el('vine-start-card-btn');
  if (start && !start.disabled) start.addEventListener('click', startVineRun);
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

/* ================= DHIKR BUDDY (companion) =================
   One consistent companion across all themes. 500 levels (1 per 33 Practice
   dhikr, 2 on Radiant Day), 10 visual stages, devolution after inactivity,
   snack jar, 18 secret treasures, 5 interactions.
   ALL day logic uses the LOCAL calendar date (todayKey) — never UTC. */
var BUDDY_MAX_LEVEL = 500;
var BUDDY_STAGE_NAMES = ['Newborn', 'Tiny', 'Curious', 'Playful', 'Bright', 'Brave', 'Shining', 'Radiant', 'Luminous', 'Celestial'];
var BUDDY_STAGE_EMOJI = ['🌱', '🌿', '🍀', '🌷', '🌻', '🌺', '🌹', '🪷', '🌸', '💫'];
var BUDDY_TREASURES = [
  { id: 'tr-hat', name: 'Sunny Hat', emoji: '🎩' },
  { id: 'tr-cap', name: 'Sporty Cap', emoji: '🧢' },
  { id: 'tr-crown', name: 'Tiny Crown', emoji: '👑' },
  { id: 'tr-bow', name: 'Ribbon Bow', emoji: '🎀' },
  { id: 'tr-shades', name: 'Cool Shades', emoji: '🕶️' },
  { id: 'tr-star', name: 'Star Charm', emoji: '🌟' },
  { id: 'tr-gem', name: 'Sparkle Gem', emoji: '💎' },
  { id: 'tr-balloon', name: 'Balloon Buddy', emoji: '🎈' },
  { id: 'tr-rainbow', name: 'Rainbow Trail', emoji: '🌈' },
  { id: 'tr-note', name: 'Melody Note', emoji: '🎵' },
  { id: 'tr-moon', name: 'Moon Glow', emoji: '🌙' },
  { id: 'tr-sun', name: 'Sunny Glow', emoji: '☀️' },
  { id: 'tr-bfly', name: 'Butterfly Friend', emoji: '🦋' },
  { id: 'tr-sparkle', name: 'Sparkle Dust', emoji: '💫' },
  { id: 'tr-bell', name: 'Happy Bell', emoji: '🔔' },
  { id: 'tr-honey', name: 'Honey Pot', emoji: '🍯' },
  { id: 'tr-frame', name: 'Flower Frame', emoji: '🌼' },
  { id: 'tr-aurora', name: 'Aurora Sky', emoji: '🌌' }
];
/* The gold cap is NOT part of the base character art — it is an equipable
   accessory, owned from the start and equipped by default. It is never part
   of the secret random treasure pool. */
var BUDDY_HAT = { id: 'tr-goldcap', name: 'Gold Cap', img: 'hat.png' };
var BUDDY_TREASURE_DHIKR_STEPS = [100, 300, 600, 1000, 1500, 2200, 3000, 4000, 5500, 7500]; // hidden: lifetime taps
var BUDDY_TREASURE_TIME_STEPS = [5, 15, 30, 60, 120, 240, 480, 720]; // hidden: minutes with buddy
var BUDDY_TREATS = [
  { id: 'glow', name: 'Honey Drop', emoji: '🍯', effect: 'golden glow' },
  { id: 'trail', name: 'Star Berry', emoji: '🫐', effect: 'sparkle trail' },
  { id: 'cheeks', name: 'Moon Melon', emoji: '🍈', effect: 'rainbow cheeks' }
];
function defaultBuddy() {
  return {
    name: 'Sprout', level: 1, snacks: 0,
    lastActiveDay: null, dayDhikr: {}, radiantDay: null, radiantSince: 0,
    devolveBlocks: 0, tucked: false,
    treats: {}, treasures: [], treasurePool: [], treasureDhikrIdx: 0, treasureTimeIdx: 0,
    tapTotal: 0, homeTimeMs: 0, equipped: [], puffUntil: 0
  };
}
function shuffledTreasurePool() {
  var ids = BUDDY_TREASURES.map(function (t) { return t.id; });
  for (var i = ids.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = ids[i]; ids[i] = ids[j]; ids[j] = tmp;
  }
  return ids;
}
function buddy() {
  if (!S.buddy || typeof S.buddy !== 'object' || Array.isArray(S.buddy)) S.buddy = defaultBuddy();
  var b = S.buddy, d = defaultBuddy(), k;
  for (k in d) { if (b[k] === undefined) b[k] = d[k]; }
  if (typeof b.level !== 'number' || b.level < 1) b.level = 1;
  if (b.level > BUDDY_MAX_LEVEL) b.level = BUDDY_MAX_LEVEL;
  if (!Array.isArray(b.treasures)) b.treasures = [];
  if (!Array.isArray(b.treasurePool)) b.treasurePool = [];
  if (!Array.isArray(b.equipped)) b.equipped = [];
  /* one-time grant: the gold cap is owned from the start and equipped by
     default (never re-granted, so unequipping persists) */
  if (!b._hatGiven) {
    if (b.treasures.indexOf('tr-goldcap') < 0) b.treasures.push('tr-goldcap');
    if (b.equipped.indexOf('tr-goldcap') < 0) b.equipped.push('tr-goldcap');
    b._hatGiven = true;
  }
  if (!b.dayDhikr || typeof b.dayDhikr !== 'object' || Array.isArray(b.dayDhikr)) b.dayDhikr = {};
  if (!b.treats || typeof b.treats !== 'object' || Array.isArray(b.treats)) b.treats = {};
  if (!b.treasurePool.length && !b.treasures.length) b.treasurePool = shuffledTreasurePool();
  return b;
}
function buddyStage(level) {
  level = Math.max(1, Math.min(BUDDY_MAX_LEVEL, Math.floor(Number(level) || 1)));
  return Math.min(10, Math.max(1, Math.floor((level - 1) / 50) + 1));
}
function buddyStageName(level) { return BUDDY_STAGE_NAMES[buddyStage(level) - 1]; }
function treasureById(id) {
  if (id === 'tr-goldcap') return BUDDY_HAT;
  for (var i = 0; i < BUDDY_TREASURES.length; i++) if (BUDDY_TREASURES[i].id === id) return BUDDY_TREASURES[i];
  return null;
}
/* full days between two local day keys (b later than a) */
function dayDiff(a, b) {
  try {
    var pa = String(a).split('-'), pb = String(b).split('-');
    var da = new Date(+pa[0], +pa[1] - 1, +pa[2]);
    var db = new Date(+pb[0], +pb[1] - 1, +pb[2]);
    return Math.round((db - da) / 86400000);
  } catch (e) { return 0; }
}
/* devolution: -10 levels per 3 inactive days, floor 1, no double-counting.
   Inactive days = local day difference from last active day (today counts
   once it is not yet active); day 2 shows the misses-you nudge instead. */
function buddyCheckDevolution() {
  var b = buddy();
  var today = todayKey();
  if (!b.lastActiveDay || b.lastActiveDay === today) { if (b.lastActiveDay === today) b.devolveBlocks = 0; return; }
  var inactiveDays = Math.max(0, dayDiff(b.lastActiveDay, today));
  var blocks = Math.floor(inactiveDays / 3);
  var newBlocks = blocks - (Number(b.devolveBlocks) || 0);
  if (newBlocks > 0) {
    b.devolveBlocks = blocks;
    b.level = Math.max(1, b.level - newBlocks * 10);
    saveState();
  }
}
function buddyMissesYou() {
  var b = buddy();
  var today = todayKey();
  if (!b.lastActiveDay || b.lastActiveDay === today) return false;
  return dayDiff(b.lastActiveDay, today) === 2; // day 2 of inactivity: gentle nudge
}
function buddySleepy() {
  var b = buddy();
  if (b.tucked) return true;
  var today = todayKey();
  return !!b.lastActiveDay && b.lastActiveDay !== today && (Number(b.dayDhikr[today]) || 0) < 33;
}
function buddyIsRadiant() { return buddy().radiantDay === todayKey(); }
/* called once per counted Practice tap (both counters) */
function buddyCountDhikr(n) {
  var b = buddy();
  var today = todayKey();
  b.tapTotal = (Number(b.tapTotal) || 0) + n;
  var before = Number(b.dayDhikr[today]) || 0;
  b.dayDhikr[today] = before + n;
  var keys = Object.keys(b.dayDhikr);
  if (keys.length > 14) { keys.sort(); for (var i = 0; i < keys.length - 14; i++) delete b.dayDhikr[keys[i]]; }
  if (before < 33 && b.dayDhikr[today] >= 33) {
    b.lastActiveDay = today;
    b.devolveBlocks = 0;
    b.radiantDay = today;
    b.radiantSince = Date.now();
    saveState();
    celebrate({ emoji: '✨', title: 'Radiant Day!', sub: b.name + ' glows golden and earns DOUBLE levels until midnight. Keep going! 🤲' });
  }
  buddyCheckTreasures();
}
function buddyGainLevels(n) {
  var b = buddy();
  var before = b.level;
  b.level = Math.min(BUDDY_MAX_LEVEL, before + Math.max(0, Math.floor(n)));
  return b.level - before;
}
/* secret treasures: hidden dhikr + time milestones, random no-duplicate order */
function buddyCheckTreasures() {
  var b = buddy();
  var changed = false;
  var di = Number(b.treasureDhikrIdx) || 0;
  while (di < BUDDY_TREASURE_DHIKR_STEPS.length && (Number(b.tapTotal) || 0) >= BUDDY_TREASURE_DHIKR_STEPS[di]) {
    di++;
    if (buddyAwardTreasure()) changed = true;
  }
  b.treasureDhikrIdx = di;
  var ti = Number(b.treasureTimeIdx) || 0;
  var mins = (Number(b.homeTimeMs) || 0) / 60000;
  while (ti < BUDDY_TREASURE_TIME_STEPS.length && mins >= BUDDY_TREASURE_TIME_STEPS[ti]) {
    ti++;
    if (buddyAwardTreasure()) changed = true;
  }
  b.treasureTimeIdx = ti;
  if (changed) saveState();
}
function buddyAwardTreasure() {
  var b = buddy();
  if (!b.treasurePool.length) return false;
  var id = b.treasurePool.shift();
  b.treasures.push(id);
  var t = treasureById(id);
  celebrate({
    emoji: '🎁',
    title: 'A surprise gift appeared!',
    sub: (t ? t.emoji + ' ' + t.name : 'A mystery treasure') + ' — see it in Treasures! (' + b.treasures.length + ' of 18 found)'
  });
  var tc = buddyVisibleChar();
  if (tc) { buddyPlayAnim(tc, 'buddy-acelebrate'); buddyFx(tc, ['🎉', '✨', '🌟', '💛'], 10, 'burst'); }
  return true;
}

/* ---- buddy rendering ---- */
function buddyThemeAccessory() {
  var t = currentTheme();
  if (t === 'highway') return '🥽';
  if (t === 'mine') return '⛑️';
  return '🌸';
}
function buddyActiveTreats() {
  var b = buddy(), now = Date.now(), out = [], tr = b.treats || {}, k;
  for (k in tr) { if (Number(tr[k]) > now) out.push(k); }
  return out;
}
function buddyHatImgHtml(size) {
  var b = buddy();
  if ((b.equipped || []).indexOf('tr-goldcap') < 0) return '';
  var hw = Math.round(size * 0.80), top = Math.round(size * -0.167);
  return '<img class="buddy-hatimg" src="hat.png" alt="Gold cap" style="width:' + hw + 'px;top:' + top + 'px">';
}
function buddyCharHtml(sizeBase) {
  var b = buddy();
  var stage = buddyStage(b.level);
  var base = Number(sizeBase) > 0 ? Number(sizeBase) : 56;
  var size = Math.round(base * Math.min(1.26, 0.84 + (stage - 1) * 0.045));
  var cls = 'buddy-char stage-' + stage;
  var now = Date.now();
  if (buddyIsRadiant()) cls += ' buddy-radiant';
  if (b.puffUntil && Number(b.puffUntil) > now) cls += ' buddy-puff';
  var treats = buddyActiveTreats();
  if (treats.indexOf('glow') >= 0) cls += ' treat-glow';
  if (treats.indexOf('trail') >= 0) cls += ' treat-trail';
  if (treats.indexOf('cheeks') >= 0) cls += ' treat-cheeks';
  if (b.tucked) cls += ' buddy-sleeping';
  var html = '<div class="' + cls + '" data-buddy-tap="1" role="button" tabindex="0" aria-label="' + esc(b.name) + ', your companion, level ' + b.level + '">';
  html += '<span class="buddy-idle"><span class="buddy-motion">';
  html += '<span class="buddy-emoji"><img class="buddy-img" src="buddy.png" alt="' + esc(b.name) + '" style="width:' + size + 'px;height:' + size + 'px">' + buddyHatImgHtml(size) + '</span>';
  html += '<span class="buddy-blink" aria-hidden="true"><i></i><i></i></span>';
  html += '</span></span>';
  html += '<span class="buddy-accessory">' + buddyThemeAccessory() + '</span>';
  var eq = b.equipped || [], shown = 0;
  if (eq.length) {
    html += '<span class="buddy-equipped">';
    for (var i = 0; i < eq.length && shown < 3; i++) {
      var t = treasureById(eq[i]);
      if (!t || t.id === 'tr-goldcap') continue;
      html += '<span>' + (t.img ? '<img src="' + t.img + '" alt="" style="width:1.1em;height:1.1em;vertical-align:-0.15em">' : t.emoji) + '</span>'; shown++;
    }
    html += '</span>';
  }
  if (buddySleepy()) html += '<span class="buddy-zzz">💤</span>';
  html += '</div>';
  return html;
}
/* ---- buddy motion helpers: one-shot interaction animations + particles ----
   Layering (each layer carries at most one animation so states compose):
   .buddy-idle   — always-on idle bob + breathe (slowed when sleeping)
   .buddy-motion — one-shot interaction animations (tap, feed, rub, twirl…)
   .buddy-emoji  — feed puff-up scale + radiant/treat glow filters */
var BUDDY_ONE_SHOTS = ['buddy-atap', 'buddy-afeed', 'buddy-arub', 'buddy-atreat', 'buddy-awake', 'buddy-achase', 'buddy-alevel', 'buddy-acelebrate'];
var BUDDY_FX_MAX = 24; /* particle cap per buddy for performance */
function buddyPlayAnim(char, cls) {
  if (!char || !char.classList) return;
  char.classList.remove(cls);
  void char.offsetWidth;
  char.classList.add(cls);
}
function buddyVisibleChar() {
  var chars = document.querySelectorAll('[data-buddy-tap]');
  for (var i = 0; i < chars.length; i++) {
    try {
      var r = chars[i].getBoundingClientRect();
      if (r && r.width > 0 && r.height > 0) return chars[i];
    } catch (e) { /* ignore */ }
  }
  return chars.length ? chars[0] : null;
}
/* spawn lightweight particle spans (transform/opacity only); mode 'rise'|'burst' */
function buddyFx(char, glyphs, n, mode) {
  if (!char || !char.appendChild || !glyphs || !glyphs.length) return;
  var live = 0;
  try { live = char.querySelectorAll('.buddy-fx').length; } catch (e) { live = 0; }
  for (var i = 0; i < n && live < BUDDY_FX_MAX; i++) {
    var s = document.createElement('span');
    s.className = 'buddy-fx' + (mode === 'burst' ? ' burst' : '');
    s.textContent = glyphs[(Math.random() * glyphs.length) | 0];
    s.style.left = (18 + Math.random() * 64).toFixed(1) + '%';
    if (mode === 'burst') {
      s.style.top = '38%';
      var ang = Math.random() * Math.PI * 2, dist = 46 + Math.random() * 60;
      if (s.style.setProperty) {
        s.style.setProperty('--dx', (Math.cos(ang) * dist).toFixed(0) + 'px');
        s.style.setProperty('--dy', (Math.sin(ang) * dist - 30).toFixed(0) + 'px');
      }
      s.style.animationDuration = (0.7 + Math.random() * 0.5).toFixed(2) + 's';
    } else {
      s.style.top = (4 + Math.random() * 22).toFixed(1) + '%';
      s.style.animationDuration = (0.9 + Math.random() * 0.6).toFixed(2) + 's';
      s.style.animationDelay = (Math.random() * 0.25).toFixed(2) + 's';
    }
    char.appendChild(s);
    (function (el) {
      setTimeout(function () { try { if (el.parentNode) el.parentNode.removeChild(el); } catch (e) {} }, 2400);
    })(s);
    live++;
  }
}
/* pending animation: set before a re-render, played on the fresh buddy after */
var buddyPendingAnim = null;
function buddyFlushPending(scope) {
  if (!buddyPendingAnim) return;
  var p = buddyPendingAnim; buddyPendingAnim = null;
  var char = (scope && scope.querySelector) ? scope.querySelector('[data-buddy-tap]') : buddyVisibleChar();
  if (!char) return;
  if (p.cls) buddyPlayAnim(char, p.cls);
  if (p.fx) buddyFx(char, p.fx.glyphs, p.fx.n, p.fx.mode);
}
/* ambient scene life: slow drifting motes behind the buddy in the environment */
function buddySpawnMotes(scene) {
  if (!scene || !scene.appendChild) return;
  try { if (scene.querySelector('.buddy-mote')) return; } catch (e) {}
  var t = currentTheme();
  var color = t === 'highway' ? 'rgba(255,255,255,.65)' : t === 'mine' ? 'rgba(190,220,255,.75)' : 'rgba(255,240,170,.75)';
  for (var i = 0; i < 10; i++) {
    var m = document.createElement('span');
    m.className = 'buddy-mote';
    m.style.left = (4 + Math.random() * 92).toFixed(1) + '%';
    m.style.background = color;
    if (m.style.setProperty) m.style.setProperty('--dx', ((Math.random() - 0.5) * 60).toFixed(0) + 'px');
    m.style.animationDuration = (7 + Math.random() * 6).toFixed(1) + 's';
    m.style.animationDelay = (-Math.random() * 12).toFixed(1) + 's';
    scene.appendChild(m);
  }
}
/* tap = squash-and-stretch hop (also the gentle nudge used by rub hint) */
function buddyWiggle(char) {
  buddyPlayAnim(char, 'buddy-atap');
}
if (typeof document !== 'undefined' && document.addEventListener) {
  document.addEventListener('animationend', function (e) {
    var t = e.target;
    var char = (t && t.closest) ? t.closest('.buddy-char') : null;
    if (!char || !char.classList) return;
    for (var i = 0; i < BUDDY_ONE_SHOTS.length; i++) char.classList.remove(BUDDY_ONE_SHOTS[i]);
  });
}
function buddySparkle(wrap, x, y) {
  if (!wrap) return;
  var s = document.createElement('span');
  s.className = 'buddy-sparkle';
  s.textContent = '✨';
  s.style.left = x + 'px';
  s.style.top = y + 'px';
  wrap.appendChild(s);
  setTimeout(function () { if (s.parentNode) s.parentNode.removeChild(s); }, 900);
}
function buddyCareLabel() {
  var t = currentTheme();
  if (t === 'highway') return 'Polish';
  if (t === 'mine') return 'Brush';
  return 'Water';
}
function buddyXpBarHtml(slim) {
  var b = buddy();
  var pct = Math.min(100, (b.level / BUDDY_MAX_LEVEL) * 100);
  return '<div class="buddy-xp' + (slim ? ' slim' : '') + '" role="progressbar" aria-valuenow="' + b.level + '" aria-valuemax="' + BUDDY_MAX_LEVEL + '">' +
    '<div class="buddy-xp-fill" style="width:' + pct.toFixed(1) + '%"></div></div>';
}
/* Road to 500: winding path, 10 sealed "?" chests at 50..500, traveling pin */
function roadTo500Html() {
  var b = buddy();
  var html = '<div class="card"><span class="kicker k-sage">Companion Journey</span>' +
    '<h3 style="margin:4px 0 10px">Road to 500</h3><div class="road">';
  for (var s = 1; s <= 10; s++) {
    var lvl = s * 50;
    var reached = b.level >= lvl;
    var isCurrent = buddyStage(b.level) === s;
    html += '<div class="road-node' + (s % 2 ? ' left' : ' right') + (reached ? ' open' : '') + (isCurrent ? ' current' : '') + '">' +
      '<div class="road-chest">' + (reached ? '⭐' : '?') + '</div>' +
      '<div class="road-lvl">' + lvl + '</div>' +
      (isCurrent ? '<div class="road-pin">📍 Lv ' + b.level + '</div>' : '') +
      '</div>';
  }
  html += '</div>';
  var next = Math.min(500, (Math.floor(b.level / 50) + 1) * 50);
  html += '<p class="muted" style="text-align:center;margin-bottom:0">Next mystery chest at level ' + next + ' — ' + Math.max(0, next - b.level) + ' to go</p></div>';
  return html;
}
function treasuresHtml() {
  var b = buddy();
  var secrets = [];
  for (var si = 0; si < b.treasures.length; si++) { if (b.treasures[si] !== 'tr-goldcap') secrets.push(b.treasures[si]); }
  var html = '<div class="card" id="companion-treasures"><div class="row-between" style="align-items:center"><div>' +
    '<span class="kicker k-gold">Treasures</span>' +
    '<h3 style="margin:4px 0 0">' + secrets.length + ' of 18 found</h3></div></div>' +
    '<div class="treasure-grid">';
  var hatOn = (b.equipped || []).indexOf('tr-goldcap') >= 0;
  html += '<button class="treasure' + (hatOn ? ' active' : '') + '" data-treasure="tr-goldcap">' +
    '<span><img class="treasure-img" src="hat.png" alt="Gold cap"></span><b>Gold Cap</b><i>' + (hatOn ? 'On' : 'Tap to wear') + '</i></button>';
  for (var i = 0; i < secrets.length; i++) {
    var t = treasureById(secrets[i]);
    if (!t) continue;
    var active = (b.equipped || []).indexOf(t.id) >= 0;
    html += '<button class="treasure' + (active ? ' active' : '') + '" data-treasure="' + t.id + '">' +
      '<span>' + t.emoji + '</span><b>' + esc(t.name) + '</b><i>' + (active ? 'On' : 'Tap to wear') + '</i></button>';
  }
  for (var k = secrets.length; k < 18; k++) {
    html += '<div class="treasure secret"><span>?</span><b>Secret</b></div>';
  }
  html += '</div><p class="muted" style="margin-bottom:0">Secret gifts appear as you do dhikr and spend time with your buddy.</p></div>';
  return html;
}
/* large companion hero: buddy standing in the selected theme environment,
   at the very top of home (replaces the old compact preview card) */
function buddyEnvHeroHtml() {
  var b = buddy();
  var t = currentTheme();
  var scene = t === 'highway' ? highwayScene() : t === 'mine' ? mineScene() : gardenScene();
  var html = '<section class="card buddy-env-hero">';
  html += '<div class="buddy-env-scene">' + scene + '<div class="buddy-env-char">' + buddyCharHtml(170) + '</div></div>';
  html += '<div class="buddy-env-plaque"><b>' + esc(b.name) + '</b><div class="muted">Level ' + b.level + ' of 500 · ' + esc(buddyStageName(b.level)) + '</div></div>';
  html += '<button class="btn-gold btn-block" data-go-companion style="margin:10px 16px 16px">Visit companion →</button>';
  html += '</section>';
  return html;
}
/* ---- companion screen (mirrors the chat app's companion layout) ---- */
function renderCompanion() {
  var sec = el('screen-companion');
  if (!sec) return;
  buddyCheckDevolution();
  var b = buddy();
  var t = currentTheme();
  var scene = t === 'highway' ? highwayScene() : t === 'mine' ? mineScene() : gardenScene();
  var radiant = buddyIsRadiant();
  /* 1. environment scene hero with the big illustrated buddy */
  var html = '<button class="backlink" data-go="home">← Home</button>';
  html += '<section class="card buddy-env-hero companion-env"><div class="buddy-env-scene" id="companion-scene">' + scene +
    '<div class="buddy-env-char">' + buddyCharHtml(170) + '</div>';
  if (radiant) html += '<div class="buddy-env-badge">✨ Radiant Day · 2× levels</div>';
  html += '</div><div class="buddy-env-plaque"><b>' + esc(b.name) + '</b>' +
    '<div class="muted">Level ' + b.level + ' of 500 · ' + esc(buddyStageName(b.level)) + '</div></div>';
  if (!radiant && buddyMissesYou()) html += '<p class="muted" style="text-align:center;margin:4px 16px 14px">Your companion misses you 💛</p>';
  html += '</section>';
  /* 2. care rows: theme rub + treats, goodnight + star fetch */
  var careIcon = t === 'highway' ? '✨' : t === 'mine' ? '🖌️' : '💧';
  html += '<section class="card"><div class="care-rows"><div class="care-row">' +
    '<button class="care-tile" data-buddy-rub><span class="care-ic">' + careIcon + '</span>' +
    '<span class="care-tx"><b>' + esc(buddyCareLabel()) + '</b><i>Hands-on care</i></span></button>' +
    '<button class="care-tile" data-buddy-treats><span class="care-ic">🍯</span>' +
    '<span class="care-tx"><b>Treats</b><i>Pick a 1-hour effect</i></span></button></div>' +
    '<div class="care-row">' +
    '<button class="care-tile" data-buddy-sleep><span class="care-ic">' + (b.tucked ? '🌅' : '🌙') + '</span>' +
    '<span class="care-tx"><b>' + (b.tucked ? 'Wake up' : 'Goodnight') + '</b><i>' + (b.tucked ? 'rise & shine' : 'Tuck your buddy in') + '</i></span></button>' +
    '<button class="care-tile" data-buddy-fetch><span class="care-ic">⭐</span>' +
    '<span class="care-tx"><b>Star fetch</b><i>Toss and bring it back</i></span></button></div></div></section>';
  /* 3. snack jar */
  html += '<section class="card"><div class="row-between" style="align-items:center"><div>' +
    '<span class="kicker k-gold">🍯 Snack jar</span>' +
    '<div style="font-size:1.6rem;font-weight:900"><span id="snack-count">' + fmtNum(b.snacks) + '</span> <small class="muted">snacks</small></div></div>' +
    '<button class="btn-gold" data-buddy-feed' + (b.snacks >= 10 ? '' : ' disabled') + '>Feed · 10 🍯</button></div>' +
    '<p class="muted" style="margin:8px 0 0">Feeding is just for fun — ' + esc(b.name) + ' grows from your dhikr, not from snacks.</p></section>';
  /* 4. rename + treasures tiles */
  var secrets = 0, si;
  for (si = 0; si < b.treasures.length; si++) { if (b.treasures[si] !== 'tr-goldcap') secrets++; }
  html += '<div class="duo-tiles">' +
    '<div class="card duo-tile"><div><b>' + esc(b.name) + '</b><div class="muted">Level ' + b.level + ' of 500</div></div>' +
    '<button class="linklike" data-buddy-rename>Rename</button></div>' +
    '<div class="card duo-tile"><div><b>Treasures</b><div class="muted">' + secrets + ' of 18 found</div></div>' +
    '<button class="linklike" data-scroll-treasures>Open</button></div></div>';
  /* 5. radiant day banner */
  if (radiant) html += '<div class="radiant-banner">✨ <b>Radiant Day!</b> ' + esc(b.name) +
    ' is glowing golden, and every 33 dhikr earns 2 levels until midnight.</div>';
  /* 6. full treasures shelf, then the companion journey */
  html += treasuresHtml();
  html += roadTo500Html();
  sec.innerHTML = html;
  var gos = sec.querySelectorAll('[data-go]');
  for (var g = 0; g < gos.length; g++) {
    (function (x) { x.addEventListener('click', function () { showScreen(x.getAttribute('data-go')); }); })(gos[g]);
  }
  wireBuddyScene(sec);
  var st = sec.querySelector('[data-scroll-treasures]');
  if (st) st.addEventListener('click', function () { var tg = document.getElementById('companion-treasures'); if (tg) tg.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  var rn = sec.querySelector('[data-buddy-rename]');
  if (rn) rn.addEventListener('click', buddyRenameModal);
  var rub = sec.querySelector('[data-buddy-rub]');
  if (rub) rub.addEventListener('click', function () { toast(buddyCareLabel() + ' your buddy — rub them gently! 💛'); wireBuddyRubHint(sec); });
  var tr = sec.querySelector('[data-buddy-treats]');
  if (tr) tr.addEventListener('click', buddyTreatPicker);
  var sl = sec.querySelector('[data-buddy-sleep]');
  if (sl) sl.addEventListener('click', function () {
    var bb = buddy();
    bb.tucked = !bb.tucked;
    saveState();
    if (bb.tucked) buddyPendingAnim = { cls: null, fx: { glyphs: ['💤', '💤', 'z'], n: 5, mode: 'rise' } };
    else buddyPendingAnim = { cls: 'buddy-awake' };
    renderCompanion();
    toast(bb.tucked ? 'Goodnight! 🌙' : 'Good morning! ☀️');
  });
  var ft = sec.querySelector('[data-buddy-fetch]');
  if (ft) ft.addEventListener('click', function () { buddyStarFetch(sec); });
  var fd = sec.querySelector('[data-buddy-feed]');
  if (fd) fd.addEventListener('click', function () { buddyFeed(sec); });
  var trs = sec.querySelectorAll('[data-treasure]');
  for (var ti = 0; ti < trs.length; ti++) {
    (function (x) {
      x.addEventListener('click', function () {
        var bb = buddy();
        var id = x.getAttribute('data-treasure');
        var ix = bb.equipped.indexOf(id);
        if (ix >= 0) bb.equipped.splice(ix, 1); else bb.equipped.push(id);
        saveState();
        renderCompanion();
      });
    })(trs[ti]);
  }
  buddySpawnMotes(sec.querySelector('#companion-scene'));
  buddyFlushPending(sec);
}
/* tap = wiggle (wakes if tucked); rub = pointer drag with sparkles */
function wireBuddyScene(scope) {
  var chars = scope.querySelectorAll('[data-buddy-tap]');
  for (var i = 0; i < chars.length; i++) {
    (function (char) {
      var rubbing = false;
      char.addEventListener('pointerdown', function (e) {
        rubbing = true;
        buddyWiggle(char);
        var r = char.getBoundingClientRect(), w = char.closest('.buddy-wrap') || char.parentNode;
        var wr = w.getBoundingClientRect();
        buddySparkle(w, e.clientX - wr.left, e.clientY - wr.top);
      });
      char.addEventListener('pointermove', function (e) {
        if (!rubbing) return;
        var w = char.closest('.buddy-wrap') || char.parentNode;
        var wr = w.getBoundingClientRect();
        buddySparkle(w, e.clientX - wr.left, e.clientY - wr.top);
      });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (ev) {
        char.addEventListener(ev, function () { rubbing = false; });
      });
      char.addEventListener('click', function () {
        var b = buddy();
        if (b.tucked) {
          b.tucked = false;
          saveState();
          toast('Good morning! ☀️');
          buddyPendingAnim = { cls: 'buddy-awake' };
          if (scope.id === 'screen-companion') renderCompanion();
          else showScreen('home');
          return;
        }
        buddyWiggle(char);
      });
      char.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); char.click(); }
      });
    })(chars[i]);
  }
}
function wireBuddyRubHint(scope) {
  var char = scope.querySelector('[data-buddy-tap]');
  if (char) {
    buddyPlayAnim(char, 'buddy-arub');
    var t = currentTheme();
    buddyFx(char, t === 'mine' ? ['✨', '💎'] : t === 'highway' ? ['✨', '💫'] : ['✨', '💧'], 8, 'burst');
  }
  toast('Rub ' + buddy().name + ' gently with your finger 💛');
}
function buddyFeed(scope) {
  var b = buddy();
  if ((Number(b.snacks) || 0) < 10) { toast('Not enough snacks 🍯 — earn 10 per 10 dhikr!'); return; }
  b.snacks -= 10;
  b.puffUntil = Date.now() + 4000;
  saveState();
  var sc = el('snack-count');
  if (sc) sc.textContent = fmtNum(b.snacks);
  var fd = scope.querySelector('[data-buddy-feed]');
  if (fd && b.snacks < 10) fd.disabled = true;
  var char = scope.querySelector('[data-buddy-tap]');
  if (char) {
    char.classList.add('buddy-puff');
    buddyPlayAnim(char, 'buddy-afeed');
    buddyFx(char, ['💛', '💖', '🧡'], 6, 'rise');
    setTimeout(function () { char.classList.remove('buddy-puff'); }, 4200);
  }
  toast('Yum! 😋');
}
function buddyTreatPicker() {
  var ov = document.createElement('div');
  ov.className = 'gate-backdrop';
  ov.id = 'treat-picker';
  var html = '<div class="gate-modal" role="dialog" aria-modal="true" aria-label="Treat picker">' +
    '<div style="font-size:2.4rem">🍯</div><h2>Pick a treat</h2>' +
    '<p class="muted">Free &amp; unlimited — each gives a fun 1-hour effect.</p>';
  for (var i = 0; i < BUDDY_TREATS.length; i++) {
    (function (t) {
      html += '<button class="btn-gold btn-block treat-pick" data-treat="' + t.id + '" style="margin-top:8px">' +
        t.emoji + ' ' + esc(t.name) + ' <small>· ' + esc(t.effect) + '</small></button>';
    })(BUDDY_TREATS[i]);
  }
  html += '<button class="btn-ghost btn-block" id="treat-close" style="margin-top:8px">Not now</button></div>';
  ov.innerHTML = html;
  document.body.appendChild(ov);
  function close() { if (ov.parentNode) ov.parentNode.removeChild(ov); }
  el('treat-close').addEventListener('click', close);
  ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
  var picks = ov.querySelectorAll('[data-treat]');
  for (var k = 0; k < picks.length; k++) {
    (function (x) {
      x.addEventListener('click', function () {
        var b = buddy();
        b.treats[x.getAttribute('data-treat')] = Date.now() + 3600000;
        saveState();
        close();
        toast('Magical treat! ✨ (1 hour)');
        buddyPendingAnim = { cls: 'buddy-atreat', fx: { glyphs: ['✨', '🌟', '💫'], n: 8, mode: 'burst' } };
        if (currentScreen === 'companion') renderCompanion();
        else { var tc2 = buddyVisibleChar(); if (tc2) { buddyPlayAnim(tc2, 'buddy-atreat'); buddyFx(tc2, ['✨', '🌟', '💫'], 8, 'burst'); } buddyPendingAnim = null; }
      });
    })(picks[k]);
  }
}
function buddyStarFetch(scope) {
  var scene = scope.querySelector('#companion-scene') || scope.querySelector('.buddy-wrap');
  if (!scene) return;
  if (scene.querySelector('.fetch-star')) return;
  var star = document.createElement('span');
  star.className = 'fetch-star';
  star.textContent = '⭐';
  scene.appendChild(star);
  var char = scope.querySelector('[data-buddy-tap]');
  setTimeout(function () { if (char) buddyPlayAnim(char, 'buddy-achase'); }, 450);
  setTimeout(function () {
    if (star.parentNode) star.parentNode.removeChild(star);
    buddyWiggle(char);
    toast('Good catch! ⭐');
  }, 2150);
}
function buddyRenameModal() {
  var b = buddy();
  var ov = document.createElement('div');
  ov.className = 'gate-backdrop';
  ov.id = 'rename-modal';
  ov.innerHTML = '<div class="gate-modal" role="dialog" aria-modal="true" aria-label="Rename companion">' +
    '<div style="font-size:2.4rem">✏️</div><h2>Name your companion</h2>' +
    '<input id="rename-input" class="rename-input" maxlength="24" value="' + esc(b.name) + '" />' +
    '<div class="btn-row" style="justify-content:center;margin-top:12px">' +
    '<button class="btn-gold" id="rename-save">Save</button>' +
    '<button class="btn-ghost" id="rename-cancel">Cancel</button></div></div>';
  document.body.appendChild(ov);
  function close() { if (ov.parentNode) ov.parentNode.removeChild(ov); }
  function save() {
    var v = el('rename-input').value.trim().slice(0, 24);
    if (v) { buddy().name = v; saveState(); }
    close();
    if (currentScreen === 'companion') renderCompanion();
    else showScreen('home');
  }
  el('rename-save').addEventListener('click', save);
  el('rename-cancel').addEventListener('click', close);
  el('rename-input').addEventListener('keydown', function (e) { if (e.key === 'Enter') save(); });
  setTimeout(function () { var i = el('rename-input'); if (i) i.focus(); }, 50);
}

/* ================= ARCADE LOSS GATE =================
   When any arcade attempt ends, a non-dismissable modal requires 10 taps of
   "La ilaha illa Allah" (Arabic + transliteration) before the next game.
   1s pacing between taps (faster taps ignored with a hint); live elapsed
   readout; clears at 10/10. Gate taps earn nothing. */
var gateState = null;
function arcadeLossGate() {
  if (gateState) return;
  var ov = document.createElement('div');
  ov.id = 'dhikr-gate';
  ov.className = 'gate-backdrop';
  ov.innerHTML =
    '<div class="gate-modal" role="dialog" aria-modal="true" aria-label="Dhikr gate">' +
    '<div style="font-size:2.4rem">🤲</div>' +
    '<h2>Before your next game…</h2>' +
    '<p class="muted">Say <b>La ilaha illa Allah</b> 10 times</p>' +
    arabicBlock('لَا إِلَهَ إِلَّا اللَّهُ', 'arabic-mid') +
    '<div class="gate-count"><b id="gate-num">0</b><span> / 10</span></div>' +
    '<div class="gate-elapsed">⏱ <span id="gate-elapsed">0:00</span> elapsed</div>' +
    '<button class="btn-gold btn-block" id="gate-tap" style="font-size:1.25rem;padding:18px">Tap · one recitation</button>' +
    '<p class="muted" id="gate-hint" style="min-height:1.4em"></p>' +
    '</div>';
  document.body.appendChild(ov);
  gateState = { n: 0, t0: 0, lastTap: 0, timer: 0, ov: ov };
  gateState.timer = setInterval(function () {
    if (!gateState) return;
    var s = gateState.t0 ? Math.floor((Date.now() - gateState.t0) / 1000) : 0;
    var e = el('gate-elapsed');
    if (e) e.textContent = Math.floor(s / 60) + ':' + pad2(s % 60);
  }, 250);
  el('gate-tap').addEventListener('click', gateTap);
}
function gateTap() {
  if (!gateState) return;
  var now = Date.now();
  if (gateState.lastTap && now - gateState.lastTap < 1000) {
    var h = el('gate-hint');
    if (h) h.textContent = 'Slow down — one tap each second 🤲';
    return;
  }
  gateState.lastTap = now;
  if (!gateState.t0) gateState.t0 = now;
  gateState.n++;
  var num = el('gate-num');
  if (num) num.textContent = gateState.n;
  var h2 = el('gate-hint');
  if (h2) h2.textContent = '';
  if (gateState.n >= 10) gateClose();
}
function gateClose() {
  if (gateState && gateState.timer) { try { clearInterval(gateState.timer); } catch (e) {} }
  if (gateState && gateState.ov && gateState.ov.parentNode) gateState.ov.parentNode.removeChild(gateState.ov);
  gateState = null;
}

function stopBloom() {
  if (bloomG) { try { cancelAnimationFrame(bloomG.raf); } catch (e) {} }
  bloomG = null;
}
/* ================= BLOOM TENDER =================
   Home-screen garden game (NOT in the arcade): 5 coins per 30-drop round.
   Tap falling water drops to grow the player's own collected blooms
   bud → sprout → bloom. 100 pts per completed bloom, own high score,
   misses fade with no penalty, fixed seeded drop patterns (no chance). */
var bloomG = null;
function bloomCollected() {
  var seen = {}, out = [], i, f, key;
  for (i = 0; i < S.garden.length; i++) {
    f = S.garden[i];
    key = (f.name || '') + '|' + (f.emoji || '');
    if (f.emoji && !seen[key]) { seen[key] = 1; out.push({ name: f.name || 'Bloom', emoji: f.emoji }); }
  }
  if (!out.length) out.push({ name: 'Garden Bloom', emoji: '🌸' });
  return out.slice(0, 6);
}
function renderBloom() {
  var sec = el('screen-bloom');
  if (!sec) return;
  if (bloomG) { try { cancelAnimationFrame(bloomG.raf); } catch (e) {} bloomG = null; }
  var html = '<button class="backlink" data-go="home">← Home</button>' +
    '<span class="kicker k-sage">Tend your blooms</span>' +
    '<h1 class="giant">Bloom Tender</h1>' +
    '<p class="lede">Tap falling water drops to grow <b>your own</b> collected blooms — bud → sprout → bloom. ' +
    '30 drops per round, 100 points per finished bloom. Misses just fade away.</p>' +
    '<div class="card"><div class="row-between" style="align-items:center"><div>' +
    '<span class="kicker k-sage">Best</span>' +
    '<div style="font-size:1.6rem;font-weight:900;color:var(--cream)">' + fmtNum(S.bloomHigh) + ' pts</div></div>' +
    '<button class="btn-gold" id="bloom-start">Play · ' + GAME_COST + ' 🪙</button></div>' +
    '<p class="muted" style="margin:8px 0 0">Coins only — no arcade time needed.</p></div>' +
    '<div class="card" id="bloom-wrap" hidden><canvas id="bloom-canvas" class="game-canvas"></canvas>' +
    '<div id="bloom-over" hidden></div></div>';
  sec.innerHTML = html;
  var gos = sec.querySelectorAll('[data-go]');
  for (var g = 0; g < gos.length; g++) {
    (function (x) { x.addEventListener('click', function () { showScreen(x.getAttribute('data-go')); }); })(gos[g]);
  }
  var st = el('bloom-start');
  if (st) st.addEventListener('click', startBloomRun);
}
function startBloomRun() {
  if ((Number(S.credits) || 0) < GAME_COST) { toast('Not enough credits yet 🪙'); return; }
  S.credits -= GAME_COST;
  S.bloomAttempts = (Number(S.bloomAttempts) || 0) + 1;
  saveState();
  var wrap = el('bloom-wrap');
  if (wrap) wrap.hidden = false;
  var over = el('bloom-over');
  if (over) over.hidden = true;
  var setup = arcadeCanvas('bloom-wrap', 'bloom-canvas', 480);
  if (!setup) return;
  var st = el('bloom-start');
  if (st) st.style.display = 'none';
  var blooms = bloomCollected();
  var seed = (S.bloomAttempts * 2654435761 + 97) % 2147483647;
  if (seed <= 0) seed += 2147483646;
  function rnd() { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }
  var G = {
    ctx: setup.ctx, W: setup.W, H: setup.H, canvas: setup.canvas,
    blooms: blooms, bi: 0, stage: 0,
    drops: [], spawned: 0, spawnT: 0, score: 0, finished: 0,
    raf: 0, over: false, splash: null, rnd: rnd
  };
  bloomG = G;
  try { wrap.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (e) {}
  setup.canvas.onpointerdown = function (e) { bloomTap(e, G); };
  (function loop() {
    if (!bloomG || bloomG !== G || G.over) return;
    bloomStep(G, 1 / 60);
    bloomDraw(G);
    G.raf = requestAnimationFrame(loop);
  })();
}
function bloomSpawn(G) {
  G.drops.push({
    x: 34 + G.rnd() * (G.W - 68),
    y: -24,
    vy: 120 + G.rnd() * 90,
    hit: 0, miss: 0
  });
  G.spawned++;
}
function bloomStep(G, dt) {
  G.spawnT += dt;
  if (G.spawned < 30 && G.spawnT >= 2.6) { G.spawnT = 0; bloomSpawn(G); }
  var i, d;
  for (i = G.drops.length - 1; i >= 0; i--) {
    d = G.drops[i];
    if (d.hit > 0) { d.hit += dt; if (d.hit > 0.5) G.drops.splice(i, 1); continue; }
    if (d.miss > 0) { d.miss += dt; if (d.miss > 0.6) G.drops.splice(i, 1); continue; }
    d.y += d.vy * dt;
    if (d.y > G.H + 24) { d.miss = 0.001; }
  }
  if (G.splash && (Date.now() - G.splash > 600)) G.splash = null;
  if (G.spawned >= 30 && !G.drops.length) bloomGameOver(G);
}
function bloomTap(e, G) {
  if (!G || G.over) return;
  var r = G.canvas.getBoundingClientRect();
  var x = (e.clientX - r.left) * (G.W / r.width);
  var y = (e.clientY - r.top) * (G.H / r.height);
  for (var i = 0; i < G.drops.length; i++) {
    var d = G.drops[i];
    if (d.hit > 0 || d.miss > 0) continue;
    var dx = d.x - x, dy = d.y - y;
    if (dx * dx + dy * dy < 48 * 48) {
      d.hit = 0.001;
      G.splash = Date.now();
      G.stage++;
      if (G.stage >= 3) {
        G.stage = 0;
        G.finished++;
        G.score += 100;
        G.bi = (G.bi + 1) % G.blooms.length;
      }
      return;
    }
  }
}
function bloomDraw(G) {
  var ctx = G.ctx, W = G.W, H = G.H, i, d;
  var grd = ctx.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, '#16281d'); grd.addColorStop(1, '#0b100e');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, W, H);
  // current bloom at the bottom
  var b = G.blooms[G.bi % G.blooms.length];
  var face = G.stage === 0 ? '🌱' : (G.stage === 1 ? '🌿' : b.emoji);
  var fs = G.stage === 0 ? 40 : (G.stage === 1 ? 52 : 76);
  ctx.font = fs + 'px serif';
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(face, W / 2, H - 90);
  ctx.font = '600 14px sans-serif';
  ctx.fillStyle = '#cfe3d4';
  ctx.fillText(b.name + (G.stage < 2 ? ' · growing…' : ' · bloomed!'), W / 2, H - 36);
  // drops
  for (i = 0; i < G.drops.length; i++) {
    d = G.drops[i];
    if (d.hit > 0) {
      ctx.globalAlpha = Math.max(0, 1 - d.hit * 2);
      ctx.font = '30px serif';
      ctx.fillText('💦', d.x, d.y);
      ctx.globalAlpha = 1;
    } else if (d.miss > 0) {
      ctx.globalAlpha = Math.max(0, 0.7 - d.miss);
      ctx.font = '26px serif';
      ctx.fillText('💧', d.x, d.y);
      ctx.globalAlpha = 1;
    } else {
      ctx.font = '28px serif';
      ctx.fillText('💧', d.x, d.y);
    }
  }
  // HUD
  ctx.font = '700 18px sans-serif';
  ctx.textAlign = 'left'; ctx.textBaseline = 'top';
  ctx.fillStyle = '#ffe9a8';
  ctx.fillText('✨ ' + G.score, 14, 12);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#9db8a4';
  ctx.fillText('💧 ' + Math.min(30, G.spawned) + '/30', W - 14, 12);
}
function bloomGameOver(G) {
  if (G.over) return;
  G.over = true;
  if (bloomG === G) bloomG = null;
  G.canvas.onpointerdown = null;
  var isBest = false;
  if (G.score > (Number(S.bloomHigh) || 0)) { S.bloomHigh = G.score; isBest = true; }
  saveState();
  var over = el('bloom-over');
  if (!over) return;
  var canAfford = (Number(S.credits) || 0) >= GAME_COST;
  over.innerHTML = '<div class="sprout-result"><div style="font-size:2.6rem">🌸</div>' +
    '<h2>' + (isBest ? 'New best!' : 'Round over!') + '</h2>' +
    '<div class="sprout-score">' + fmtNum(G.score) + ' <small style="font-size:1rem;color:var(--sage)">pts</small></div>' +
    '<p class="muted">' + G.finished + ' blooms finished · Best: ' + fmtNum(S.bloomHigh) + ' pts</p>' +
    '<div class="btn-row" style="justify-content:center">' +
    '<button class="btn-gold" id="bloom-again"' + (canAfford ? '' : ' disabled') + '>' +
    (canAfford ? 'Play again · ' + GAME_COST + ' 🪙' : 'Need ' + GAME_COST + ' 🪙 to play') + '</button>' +
    '<button class="btn-ghost" id="bloom-done">Done</button></div></div>';
  over.hidden = false;
  var ag = el('bloom-again');
  if (ag && canAfford) ag.addEventListener('click', startBloomRun);
  var dn = el('bloom-done');
  if (dn) dn.addEventListener('click', function () { showScreen('home'); });
  if (isBest) {
    try { celebrate({ emoji: '🌸', title: 'New best tending!', sub: fmtNum(G.score) + ' points — alhamdulillah!' }); } catch (e) {}
  }
}

/* time-with-buddy: accrues on home + companion screens (hidden treasure milestones) */
var buddyScreenT0 = 0;
function buddyTrackScreen(nextName) {
  try {
    if (buddyScreenT0 && (currentScreen === 'home' || currentScreen === 'companion')) {
      var b = buddy();
      b.homeTimeMs = (Number(b.homeTimeMs) || 0) + (Date.now() - buddyScreenT0);
      buddyCheckTreasures();
      saveState();
    }
  } catch (e) { /* never break navigation */ }
  buddyScreenT0 = (nextName === 'home' || nextName === 'companion') ? Date.now() : 0;
}

/* ---------------- boot ---------------- */
function boot() {
  try { migrateChecklistKeys(); } catch (e) { /* migration optional */ }
  try { buddy(); buddyCheckDevolution(); } catch (e) { /* buddy optional */ }
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
  // buddy time-with-pet tracking (hidden treasure milestones)
  try {
    setInterval(function () {
      if ((currentScreen === 'home' || currentScreen === 'companion') && buddyScreenT0) {
        var b = buddy();
        b.homeTimeMs = (Number(b.homeTimeMs) || 0) + (Date.now() - buddyScreenT0);
        buddyScreenT0 = Date.now();
        buddyCheckTreasures();
        saveState();
      }
    }, 30000);
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
