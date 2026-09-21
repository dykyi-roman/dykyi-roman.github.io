/* Foundation of the Spanish section: stored state, data loading, speech and
   the plain building blocks the other three files draw with. This is the file
   that creates window.SP, so it loads first; the rest extend it.
   spanish-core.js -> spanish-search.js -> spanish-prose.js -> spanish-rows.js.
   Everything is built with createElement + textContent — the JSON carries no
   markup, and nothing here ever assigns innerHTML. */

(function () {
    'use strict';

    var SP = {};
    window.SP = SP;   // set before anything else: the other three files read it at load
    /* ---------- seeded shuffle (same approach as resources/learn.js) ---------- */

    SP.mulberry32 = function (seed) {
        var a = seed >>> 0;
        return function () {
            a = (a + 0x6D2B79F5) >>> 0;
            var t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    };

    SP.shuffleCopy = function (items, rng) {
        var random = rng || Math.random;
        var copy = items.slice();
        for (var i = copy.length - 1; i > 0; i--) {
            var j = Math.floor(random() * (i + 1));
            var tmp = copy[i]; copy[i] = copy[j]; copy[j] = tmp;
        }
        return copy;
    };

    SP.pick = function (items, rng) {
        var random = rng || Math.random;
        return items[Math.floor(random() * items.length)];
    };

    /* ---------- dates ---------- */

    function pad(n) { return n < 10 ? '0' + n : String(n); }

    SP.formatDate = function (d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
    SP.todayStr = function () { return SP.formatDate(new Date()); };
    SP.todaySeed = function () { return Number(SP.todayStr().replace(/-/g, '')); };
    SP.dateInDays = function (days) {
        var d = new Date();
        d.setDate(d.getDate() + days);
        return SP.formatDate(d);
    };

    /* ---------- storage ---------- */

    SP.loadState = function (key, version) {
        try {
            var raw = localStorage.getItem(key);
            if (!raw) return null;
            var state = JSON.parse(raw);
            if (!state || state.v !== (version || 1)) return null;
            return state;
        } catch (e) { return null; }
    };

    SP.saveState = function (key, state) {
        try { localStorage.setItem(key, JSON.stringify(state)); } catch (e) { /* private mode / quota */ }
    };

    /* ---------- learned and pending ---------- */

    // Two different things, deliberately apart:
    //   learned   a hand-kept list in resources/spanish/learned.json — the same
    //             kind of source the words themselves come from, so it reads
    //             the same on every device and is reviewable in the repo;
    //   pending   what this browser has ticked off as still to do, in
    //             localStorage — private to the device, changed with one tap,
    //             gone with the site data.
    // The pending list has been renamed twice (learned, then favorites), so a
    // record left under either old key is adopted once; both branches can go
    // when they have had time to run everywhere.
    var PENDING_KEY = 'spanishPending';
    var LEGACY_PENDING_KEYS = ['spanishFavorites', 'spanishLearned'];
    var pendingState = null;

    function pendingRecord() {
        if (!pendingState) {
            pendingState = SP.loadState(PENDING_KEY, 1);
            if (!pendingState) {
                var legacy = null;
                LEGACY_PENDING_KEYS.forEach(function (key) { legacy = legacy || SP.loadState(key, 1); });
                pendingState = { v: 1, ids: (legacy && legacy.ids) || {}, fold: (legacy && legacy.fold) || {} };
                if (legacy) SP.saveState(PENDING_KEY, pendingState);
            }
            if (!pendingState.ids) pendingState.ids = {};
            if (!pendingState.fold) pendingState.fold = {};
            // localStorage leads, as it does in projects/business — the cookie
            // speaks only when it has nothing to say, which is exactly the case
            // the mirror exists for: site data cleared, cookie still there.
            if (!Object.keys(pendingState.fold).length) {
                var fromCookie = foldFromCookie();
                if (fromCookie) {
                    pendingState.fold = fromCookie;
                    SP.saveState(PENDING_KEY, pendingState);   // the two stores converge again
                }
            }
        }
        return pendingState;
    }

    SP.pending = {
        // A word that has been learned is no longer one to do, so it is not
        // pending however this browser once marked it: the mark is stale, not
        // a second opinion. Answered here rather than at each call site, so
        // the sections, the counts, the copy button and the CSV column all
        // agree without asking twice.
        has: function (id) { return !!pendingRecord().ids[id] && !SP.learned.has(id); },

        // The value is the day it was marked. Nothing reads it yet, but it
        // costs what a boolean costs and answers "since when".
        set: function (id, on) {
            var ids = pendingRecord().ids;
            if (on) ids[id] = SP.todayStr();
            else delete ids[id];
            SP.saveState(PENDING_KEY, pendingState);
            return on;
        },

        toggle: function (id) { return SP.pending.set(id, !SP.pending.has(id)); },

        // Not pruned against the items on screen — a stage outside the current
        // scope is not loaded, so dropping ids unknown to the page would wipe
        // what it did not fetch. The learned list is the one thing that can be
        // pruned against: it loads whole on every page, so an id in it is known
        // for certain. Called when learned.json arrives, since until then
        // nothing knows which marks are the stale ones; a list that failed to
        // load is empty and drops nothing.
        prune: function () {
            var ids = pendingRecord().ids;
            var dropped = 0;
            Object.keys(ids).forEach(function (id) {
                if (!SP.learned.has(id)) return;
                delete ids[id];
                dropped++;
            });
            if (dropped) SP.saveState(PENDING_KEY, pendingState);
            return dropped;
        }
    };

    /* ---------- the fold, kept in a cookie as well ---------- */

    // Whether a section is folded is written to both stores, the way
    // projects/business keeps its parameters: the two are cleared by different
    // things, so a preference kept in both survives more than it would in
    // either. Only the fold is mirrored — the marks would outgrow the ~4KB a
    // cookie holds, and localStorage carries those alone.
    var FOLD_COOKIE = 'spanishFold';

    function readCookie(name) {
        if (typeof document === 'undefined') return '';
        try {
            var m = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
            return m ? decodeURIComponent(m[1]) : '';
        } catch (e) { return ''; }
    }

    function writeCookie(name, value) {
        try {
            document.cookie = name + '=' + encodeURIComponent(value) +
                '; path=/; max-age=31536000; SameSite=Lax';
        } catch (e) { /* cookies off, or a file:// page, where Chrome drops them */ }
    }

    function foldFromCookie() {
        var raw = readCookie(FOLD_COOKIE);
        if (!raw) return null;
        try {
            var fold = JSON.parse(raw);
            return fold && typeof fold === 'object' && !Array.isArray(fold) ? fold : null;
        } catch (e) { return null; }
    }

    // Folding a section is one switch for the whole page: every list subscribes
    // and redraws itself, so no two lists can disagree about what is showing.
    var foldListeners = [];

    // How a section opens while nothing is on record for it. Reference holds
    // tables that are looked up rather than worked through, so it starts folded
    // away; the first fold or unfold is recorded like any other and wins.
    var FOLDED_BY_DEFAULT = { reference: true };

    SP.view = {
        folded: function (kind) {
            var fold = pendingRecord().fold;
            return fold[kind] === undefined ? !!FOLDED_BY_DEFAULT[kind] : !!fold[kind];
        },

        setFolded: function (kind, on) {
            pendingRecord().fold[kind] = !!on;
            SP.saveState(PENDING_KEY, pendingState);
            writeCookie(FOLD_COOKIE, JSON.stringify(pendingState.fold));
            foldListeners.forEach(function (fn) { fn(kind, !!on); });
        },

        // Register once per list: a list that re-registers on every render
        // would pile up listeners and redraw itself many times over.
        onFold: function (fn) { foldListeners.push(fn); }
    };

    /* ---------- the side a covered row hides ---------- */

    // A row in Learned or Pending covers one side of itself until it is tapped:
    // the meaning (English and Russian) by default, or the Spanish with its
    // transliteration, to practise the other way round. It is one choice for
    // the whole section, kept in a cookie so the hub and every stage page open
    // on the side picked last, and carried by an attribute on <html>, so the
    // switch repaints every list on the page without redrawing any of them.
    var COVER_COOKIE = 'spanishCover';
    var COVER_SIDES = ['meaning', 'spanish'];
    var coverSide = readCookie(COVER_COOKIE);

    if (COVER_SIDES.indexOf(coverSide) === -1) {
        coverSide = 'meaning';
    } else {
        // Safari caps a cookie written from script at seven days, whatever
        // max-age asks for, so every visit writes it again to keep it alive.
        writeCookie(COVER_COOKIE, coverSide);
    }

    function paintCover() {
        if (typeof document !== 'undefined') document.documentElement.setAttribute('data-sp-cover', coverSide);
    }

    paintCover();

    var coverListeners = [];

    SP.cover = {
        side: function () { return coverSide; },

        set: function (side) {
            if (COVER_SIDES.indexOf(side) === -1 || side === coverSide) return;
            coverSide = side;
            writeCookie(COVER_COOKIE, side);
            paintCover();
            // What the change does to the rows already on the screen is the
            // lists' own business, and they subscribe for it: this file knows
            // which side is hidden, not what a row is made of.
            coverListeners.forEach(function (fn) { fn(side); });
        },

        onChange: function (fn) { coverListeners.push(fn); }
    };

    /* ---------- data loading ---------- */

    SP.base = '../resources/spanish/';   // overridden by each page before load()
    SP.manifest = null;
    SP.stages = {};                      // id -> parsed stage, cached in memory
    SP.rules = null;                     // parsed rules.json, cached in memory
    SP.patterns = null;                  // parsed patterns.json, cached in memory

    function fetchJson(url) {
        // GitHub Pages serves max-age=600; without no-cache a fresh publish
        // stays invisible for ten minutes.
        return fetch(url, { cache: 'no-cache' }).then(function (r) {
            if (!r.ok) throw new Error(url + ' — HTTP ' + r.status);
            return r.json();
        });
    }

    SP.loadManifest = function () {
        if (SP.manifest) return Promise.resolve(SP.manifest);
        return fetchJson(SP.base + 'index.json').then(function (data) {
            if (!data || !Array.isArray(data.stages) || data.stages.length === 0) {
                throw new Error('index.json: no stages');
            }
            SP.manifest = data;
            return data;
        });
    };

    // Validate on load and throw loudly rather than render half a page.
    function buildStage(stage, entry) {
        if (!stage || !Array.isArray(stage.items)) throw new Error(entry.file + ': no items');
        var seen = Object.create(null);
        // A table's place among the stage's sets is the order Reference draws
        // them in; a set the stage forgot to declare goes after the rest.
        var sets = stage.sets || [];
        var setRank = Object.create(null);
        sets.forEach(function (set, i) { setRank[set.name] = i; });
        stage.items.forEach(function (item) {
            if (!item.id || !item.type) throw new Error(entry.file + ': incomplete item');
            if (seen[item.id]) throw new Error(entry.file + ': duplicate id ' + item.id);
            seen[item.id] = true;
            item.stage = stage.no;          // injected, never stored in the file
            item.stageId = stage.id;
            if (item.set) item.setRank = item.set in setRank ? setRank[item.set] : sets.length;
        });
        (stage.notes || []).forEach(function (note) { note.stage = stage.no; });
        stage.icon = entry.icon;        // lives in the manifest, injected like item.stage
        return stage;
    }

    SP.loadStage = function (entry) {
        if (SP.stages[entry.id]) return Promise.resolve(SP.stages[entry.id]);
        return fetchJson(SP.base + entry.file).then(function (data) {
            var stage = buildStage(data, entry);
            SP.stages[entry.id] = stage;
            return stage;
        });
    };

    SP.loadStages = function (entries) {
        return Promise.all(entries.map(SP.loadStage));
    };

    SP.loadRules = function () {
        if (SP.rules) return Promise.resolve(SP.rules);
        return fetchJson(SP.base + 'rules.json').then(function (data) {
            SP.rules = data;
            return data;
        });
    };

    SP.loadPatterns = function () {
        if (SP.patterns) return Promise.resolve(SP.patterns);
        return fetchJson(SP.base + 'patterns.json').then(function (data) {
            if (!data || !Array.isArray(data.themes) || data.themes.length === 0) {
                throw new Error('patterns.json: no themes');
            }
            SP.patterns = data;
            return data;
        });
    };

    // The learned list is small, has no stage of its own and is wanted by every
    // page, so it loads beside the manifest rather than with a stage.
    var learnedIds = null;

    SP.loadLearned = function () {
        if (learnedIds) return Promise.resolve(learnedIds);
        return fetchJson(SP.base + 'learned.json').then(function (data) {
            learnedIds = (data && data.ids) || {};
            // The list has just told us which marks are stale; drop them now
            // rather than carry them until the word leaves the file again.
            SP.pending.prune();
            return learnedIds;
        }).catch(function (e) {
            // A progress file that failed to load must not take the page with
            // it: the words still read fine with an empty Learned section.
            console.error('learned.json did not load — ' + e.message);
            learnedIds = {};
            return learnedIds;
        });
    };

    // Each learned id draws its place in the Learned section once per page load.
    var learnedPlace = Object.create(null);

    function placeOf(id) {
        if (!(id in learnedPlace)) learnedPlace[id] = Math.random();
        return learnedPlace[id];
    }

    SP.learned = {
        has: function (id) { return !!(learnedIds && learnedIds[id]); },

        // A copy of `items` in the order this page load dealt them. Learned rows
        // are covered for recall, and in the order of the file a row's
        // neighbours would give its answer away, so every load deals them
        // afresh — but only once: while the page is open a redraw (a fold, a
        // filter, "Show more", a search) keeps every row where it was. `runOf`,
        // when given, keeps each run of the incoming order together and
        // shuffles only inside it: the hub's list has a seam at every change of
        // stage and type, and a shuffle across them would put one between
        // almost every two rows.
        shuffle: function (items, runOf) {
            var runs = Object.create(null);
            var next = 0;
            return items.map(function (item) {
                var run = runOf ? runOf(item) : '';
                if (!(run in runs)) runs[run] = next++;
                return { item: item, run: runs[run], place: placeOf(item.id) };
            }).sort(function (a, b) {
                return a.run - b.run || a.place - b.place;
            }).map(function (entry) { return entry.item; });
        }
    };

    /* ---------- verb forms ---------- */

    // Three tenses of every verb in the corpus, six persons each. Like the
    // learned list it has no stage of its own and is wanted by every page, so
    // it loads beside the manifest — and, like it, a failure to load costs
    // nothing but the panel: the words still read fine without their forms.
    // The key is the infinitive exactly as the entry spells it, so a reflexive
    // is stored with its pronoun (me ducho) and nothing has to be stripped.
    var verbData = null;
    var verbIndex = null;

    SP.loadVerbs = function () {
        if (verbIndex) return Promise.resolve(verbIndex);
        return fetchJson(SP.base + 'verbs.json').then(function (data) {
            verbData = data;
            verbIndex = Object.create(null);
            (data.verbs || []).forEach(function (verb) { verbIndex[verb.es] = verb; });
            return verbIndex;
        }).catch(function (e) {
            console.error('verbs.json did not load — ' + e.message);
            verbData = null;
            verbIndex = Object.create(null);
            return verbIndex;
        });
    };

    SP.verbs = {
        get: function (es) { return (verbIndex && es && verbIndex[es]) || null; },
        persons: function () { return (verbData && verbData.persons) || []; },
        tenses: function () { return (verbData && verbData.tenses) || []; },
        kind: function (key) {
            return ((verbData && verbData.kinds) || []).filter(function (k) { return k.key === key; })[0] || null;
        }
    };

    // Which verbs a row can show the forms of: a word carries at most one, a
    // pair one per half — `abrir / cerrar` is two paradigms, not one. Each is
    // the entry from verbs.json, so a caller never looks the infinitive up
    // twice. A row with nothing here draws no forms at all.
    SP.verbsOf = function (item) {
        if (!item) return [];
        if (item.type === 'pair') {
            return [item.a, item.b].map(function (half) {
                return half ? SP.verbs.get(half.es) : null;
            }).filter(Boolean);
        }
        var one = SP.verbs.get(item.es);
        return one ? [one] : [];
    };

    /* ---------- item helpers ---------- */

    SP.TYPE_LABEL = {
        vocab: 'Word',
        pair: 'Pair',
        drill: 'Drill'
    };

    // What gets spoken for an item — always the Spanish side. A drill runs
    // either way round: a Russian prompt with a Spanish answer, or a Spanish
    // line to translate or understand with a Russian answer. Whichever side
    // carries no Cyrillic is the Spanish one; a drill with none has nothing to
    // say, and its speak button is simply left out.
    var CYRILLIC = /[Ѐ-ӿ]/;

    SP.spokenText = function (item) {
        if (!item) return '';
        if (item.type === 'drill') {
            if (item.answer && !CYRILLIC.test(item.answer)) return item.answer;
            if (item.prompt && !CYRILLIC.test(item.prompt)) return item.prompt;
            return '';
        }
        return item.es || '';
    };

    // The Russian side, used as the flashcard back and as a quiz option.
    SP.meaningOf = function (item) { return item.ru || ''; };

    // Items that make sense as a card or a quiz question.
    SP.isStudyable = function (item) {
        return item.type === 'vocab' || item.type === 'pair';
    };

    /* ---------- DOM helpers ---------- */

    SP.el = function (tag, cls, text) {
        var node = document.createElement(tag);
        if (cls) node.className = cls;
        if (text !== undefined && text !== null) node.textContent = text;
        return node;
    };

    SP.clear = function (node) { while (node && node.firstChild) node.removeChild(node.firstChild); };

    // Puts what was searched for in colour inside a row that has just been
    // found. A list of a hundred rows says nothing about why each one is there
    // — a match can be in the Spanish, the transliteration, either gloss or an
    // example folded under the word — so the letters that matched are painted.
    //
    // It is handed one field at a time, never a whole row: the buttons, the
    // section tag and the drawn brackets are text nodes too, and a query like
    // `pend` would light up the tag of every Pending row. The rows themselves
    // are built with textContent, so this is where the only markup inside them
    // comes from.
    SP.iconSpan = function (icon) {
        if (!icon) return null;
        var span = SP.el('span', 'sp-icon', icon);
        span.setAttribute('aria-hidden', 'true');
        return span;
    };
    /* ---------- transcription ---------- */

    // The Russian transcription of a Spanish word, derived rather than stored.
    // It is the same rule the corpus `tr` was written by, which is why it is
    // code and not another column in the JSON: three tenses of six persons for
    // 218 verbs is close to four thousand forms, and writing them into
    // verbs.json would have trebled a file every page already fetches whole.
    // Derived, they cost nothing until a table is opened.
    //
    // The rule, from rules.intro: "э" for e, a hard "л" (never "ль"), "рр" for
    // rr and for a word-initial r, c and z as "с", g and j before e/i as "х",
    // a silent h, "ь" or "й" for a gliding i, and U+0301 on the stressed vowel
    // of every word of two syllables or more. Checked against all 1375 written
    // transcriptions in the stage files: it reproduces every one of them but
    // the five loanwords the key itself calls exceptions (online, ticket, DNI,
    // NIE, wasap), which is why those are written by hand and this is not used
    // to fill a `tr`.
    var TR_ACUTE = '\u0301';
    var TR_VOWELS = 'aeiou\u00e1\u00e9\u00ed\u00f3\u00fa\u00fc';
    var TR_ACCENTED = '\u00e1\u00e9\u00ed\u00f3\u00fa';
    var TR_BASE = { '\u00e1': 'a', '\u00e9': 'e', '\u00ed': 'i', '\u00f3': 'o', '\u00fa': 'u' };
    var TR_PLAIN = {
        a: '\u0430', e: '\u044d', i: '\u0438', o: '\u043e', u: '\u0443',
        '\u00e1': '\u0430', '\u00e9': '\u044d', '\u00ed': '\u0438', '\u00f3': '\u043e',
        '\u00fa': '\u0443', '\u00fc': '\u0443'
    };
    // After a gliding i the vowel softens the Russian way — nadie -> на́дье.
    var TR_SOFT = { '\u0430': '\u044f', '\u044d': '\u0435', '\u043e': '\u043e', '\u0443': '\u044e', '\u0438': '\u0438' };
    // After ñ it softens too, but e stays "э" — compañero -> компаньэ́ро.
    var TR_SOFT_N = { '\u0430': '\u044f', '\u044d': '\u044d', '\u043e': '\u043e', '\u0443': '\u044e', '\u0438': '\u0438' };
    var TR_SIMPLE = { d: '\u0434', f: '\u0444', k: '\u043a', m: '\u043c', n: '\u043d', p: '\u043f', t: '\u0442' };
    var TR_STRIP = /[^A-Za-z\u00c0-\u024f]+/g;

    function trBase(ch) { return TR_BASE[ch] || ch; }
    function trVowel(ch) { return !!ch && TR_VOWELS.indexOf(ch) !== -1; }
    function trStrong(ch) { return !!ch && 'aeo'.indexOf(trBase(ch)) !== -1; }

    // The syllable nuclei, as [start, end) over the letters. Two strong vowels
    // stand apart (ve-o, ca-er) and so does an accented weak one (dí-a); every
    // other run of vowels is one diphthong.
    function trNuclei(letters) {
        var out = [];
        var i = 0;
        while (i < letters.length) {
            if (!trVowel(letters[i])) { i += 1; continue; }
            var j = i + 1;
            while (j < letters.length && trVowel(letters[j])) {
                var a = letters[j - 1];
                var b = letters[j];
                if (trStrong(a) && trStrong(b)) break;
                if ('\u00ed\u00fa'.indexOf(a) !== -1 || '\u00ed\u00fa'.indexOf(b) !== -1) break;
                j += 1;
            }
            out.push([i, j]);
            i = j;
        }
        return out;
    }

    // Which letter carries the stress: the written accent if there is one,
    // otherwise the penultimate syllable for a word ending in a vowel, n or s
    // and the last one for anything else. Inside a diphthong it falls on the
    // strong vowel, or on the second of two weak ones.
    function trStress(letters) {
        var i;
        for (i = 0; i < letters.length; i += 1) {
            if (TR_ACCENTED.indexOf(letters[i]) !== -1) return i;
        }
        var nuclei = trNuclei(letters);
        if (!nuclei.length) return -1;
        var last = letters[letters.length - 1];
        var pick = nuclei.length > 1 && 'aeiouns'.indexOf(last) !== -1
            ? nuclei[nuclei.length - 2]
            : nuclei[nuclei.length - 1];
        for (i = pick[0]; i < pick[1]; i += 1) {
            if (trStrong(letters[i])) return i;
        }
        return pick[1] - 1;
    }

    // Each piece carries where it came from: the index of the Spanish vowel it
    // renders, so the stress mark lands on the right letter, and a marker that
    // says the next vowel follows a soft sign — or a silent h, which keeps two
    // vowels apart (prohibir is pro-i-bir, not пройбир).
    function trWord(word) {
        var letters = word.toLowerCase().split('');
        var n = letters.length;
        if (!n) return '';
        var stressed = trStress(letters);
        var out = [];
        var i = 0;

        function at(k) { return letters[i + k] || ''; }
        function push(text, index, soft) { out.push([text, index === undefined ? -1 : index, soft || null]); }

        while (i < n) {
            var ch = letters[i];
            var prev = out.length ? out[out.length - 1] : null;
            if (trVowel(ch)) {
                var afterConsonant = !!prev && prev[1] < 0 && prev[2] === null;
                // A gliding i between a consonant and a vowel: hacia -> а́сья.
                if (ch === 'i' && trVowel(at(1)) && afterConsonant) { push('\u044c', -1, 'i'); i += 1; continue; }
                // A falling one, after a strong vowel: seis -> сэйс, oigo -> о́йго.
                // After u it stays a vowel — cuidado is куида́до, not куйдадо.
                if (ch === 'i' && prev && prev[1] >= 0 && trStrong(letters[prev[1]]) && i !== stressed) {
                    push('\u0439'); i += 1; continue;
                }
                var vowel = TR_PLAIN[ch] || ch;
                if (prev && prev[2] === 'i') vowel = TR_SOFT[vowel] || vowel;
                else if (prev && prev[2] === 'n') vowel = TR_SOFT_N[vowel] || vowel;
                push(vowel, i); i += 1; continue;
            }
            if (ch === 'c') {
                if (at(1) === 'h') { push('\u0447'); i += 2; continue; }
                push(trBase(at(1)) === 'e' || trBase(at(1)) === 'i' ? '\u0441' : '\u043a'); i += 1; continue;
            }
            if (ch === 'q') { push('\u043a'); i += at(1) === 'u' ? 2 : 1; continue; }
            if (ch === 'g') {
                if (trBase(at(1)) === 'e' || trBase(at(1)) === 'i') { push('\u0445'); i += 1; continue; }
                // The u of gue/gui is silent; the ü of güe is not.
                if (at(1) === 'u' && (trBase(at(2)) === 'e' || trBase(at(2)) === 'i')) { push('\u0433'); i += 2; continue; }
                push('\u0433'); i += 1; continue;
            }
            if (ch === 'h') { push('', -1, 'h'); i += 1; continue; }
            if (ch === 'j') { push('\u0445'); i += 1; continue; }
            if (ch === 'l') {
                if (at(1) === 'l') { push('\u0439'); i += 2; continue; }
                push('\u043b'); i += 1; continue;
            }
            if (ch === 'r') {
                if (at(1) === 'r') { push('\u0440\u0440'); i += 2; continue; }
                // Trilled at the start of a word and after l, n, s.
                push(i === 0 || 'lns'.indexOf(letters[i - 1]) !== -1 ? '\u0440\u0440' : '\u0440'); i += 1; continue;
            }
            if (ch === '\u00f1') { push('\u043d\u044c', -1, 'n'); i += 1; continue; }
            if (ch === 'y') { push(n === 1 ? '\u0438' : '\u0439'); i += 1; continue; }
            if (ch === 'x') { push('\u043a\u0441'); i += 1; continue; }
            if (ch === 'z' || ch === 's') { push('\u0441'); i += 1; continue; }
            if (ch === 'b' || ch === 'v' || ch === 'w') { push('\u0431'); i += 1; continue; }
            if (TR_SIMPLE[ch]) { push(TR_SIMPLE[ch]); i += 1; continue; }
            push(ch); i += 1;
        }

        // A monosyllable carries no mark, which is what the written corpus does.
        var mark = trNuclei(letters).length > 1;
        var text = '';
        out.forEach(function (part) {
            text += part[0];
            if (mark && part[1] === stressed) text += TR_ACUTE;
        });
        return text;
    }

    // A word or a short phrase — a reflexive form is "me ducho".
    SP.translit = function (text) {
        return String(text || '').trim().split(/\s+/).map(function (part) {
            var word = part.replace(TR_STRIP, '');
            return word ? trWord(word) : '';
        }).filter(Boolean).join(' ');
    };

    /* ---------- speech ---------- */

    var SVG_NS = 'http://www.w3.org/2000/svg';

    var tts = {
        rate: 1,
        _voice: null,
        _current: null
    };

    // Treat speech as available whenever the API exists. Voice lists load
    // asynchronously (and on iOS may stay empty until the first utterance),
    // so gating the whole feature on finding an es-ES voice would hide it
    // from people who actually have one.
    tts.available = function () {
        return typeof window !== 'undefined' &&
            'speechSynthesis' in window &&
            typeof window.SpeechSynthesisUtterance === 'function';
    };

    tts.voice = function () {
        if (!tts.available()) return null;
        if (tts._voice) return tts._voice;
        var voices = [];
        try { voices = window.speechSynthesis.getVoices() || []; } catch (e) { voices = []; }
        if (!voices.length) return null;
        tts._voice =
            voices.filter(function (v) { return v.lang === 'es-ES'; })[0] ||
            voices.filter(function (v) { return v.lang && v.lang.replace('_', '-').indexOf('es-') === 0; })[0] ||
            voices.filter(function (v) { return v.lang && v.lang.slice(0, 2) === 'es'; })[0] ||
            null;
        return tts._voice;
    };

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        // Chrome fills the list asynchronously; drop the cache when it changes.
        window.speechSynthesis.addEventListener('voiceschanged', function () { tts._voice = null; tts.voice(); });
        tts.voice();
    }

    tts.speak = function (text, opts) {
        if (!tts.available() || !text) return false;
        var options = opts || {};
        try {
            window.speechSynthesis.cancel();
            var u = new window.SpeechSynthesisUtterance(String(text));
            var voice = tts.voice();
            if (voice) u.voice = voice;
            u.lang = voice && voice.lang ? voice.lang : 'es-ES';
            u.rate = options.rate || tts.rate;
            if (options.onend) u.addEventListener('end', options.onend);
            if (options.onend) u.addEventListener('error', options.onend);
            tts._current = u;
            window.speechSynthesis.speak(u);
            return true;
        } catch (e) { return false; }
    };

    tts.stop = function () {
        if (!tts.available()) return;
        try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
    };

    SP.tts = tts;

    /* ---------- asking ChatGPT ---------- */

    // chatgpt.com/?q= opens a new chat with the prompt already sent. The prompt
    // is in Russian, like the glosses, and asks for what a row cannot hold.
    var ASK_HOME = 'https://chatgpt.com/';
    var ASK_URL = ASK_HOME + '?q=';

    function askPrompt(text, kind) {
        return kind === 'phrase'
            ? 'Испанская фраза «' + text + '». Объясни по-русски: смысл, из чего она построена грамматически, когда так говорят, 2–3 похожих примера с переводом.'
            : 'Испанское слово «' + text + '». Объясни по-русски: значение и оттенки, произношение, род и основные формы, 2–3 примера употребления с переводом.';
    }

    // A real link, not window.open: on a phone with the ChatGPT app installed
    // the system hands a tapped link to the app, while window.open first made a
    // tab of its own and left it behind empty. On a touch screen the link opens
    // in place for the same reason — without the app, Back returns here; with a
    // mouse it takes a new tab.
    // Until it is pressed the link points at the bare chatgpt.com, and it goes
    // back there once the pointer or the focus leaves: the full address would
    // print the Spanish in the status bar on hover, and a covered row is meant
    // to keep it hidden. For the same reason the title names the action, not
    // the word. The icon is images/chatgpt.svg, painted by the CSS as a mask so
    // it takes the button's colour. kind: 'word' | 'phrase'.
    SP.askButton = function (text, kind) {
        if (!text) return null;
        var link = SP.el('a', 'sp-ask');
        var url = ASK_URL + encodeURIComponent(askPrompt(text, kind));
        link.href = ASK_HOME;
        if (!(window.matchMedia && window.matchMedia('(pointer: coarse)').matches)) {
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
        }
        link.title = 'Ask ChatGPT';
        link.setAttribute('aria-label', 'Ask ChatGPT about: ' + text);
        var icon = link.appendChild(SP.el('span', 'sp-ask-icon'));
        icon.setAttribute('aria-hidden', 'true');

        function arm() { link.href = url; }
        function disarm() { link.href = ASK_HOME; }
        // pointerdown covers the middle click and the context menu; click
        // covers the keyboard. The link follows whatever href holds once the
        // click listeners have run. The click must not reach the row: its
        // reveal toggle calls preventDefault and would cancel the navigation.
        link.addEventListener('pointerdown', arm);
        link.addEventListener('click', function (e) { e.stopPropagation(); arm(); });
        link.addEventListener('pointerleave', disarm);
        link.addEventListener('blur', disarm);
        return link;
    };

    // The tail of a list row: the question, then whatever the caller closes
    // with — the chevron that opens a word's drawer. One grid cell for both, so
    // the row keeps a single column for its controls. The keys stop here too —
    // the row's own Enter/Space toggles the cover and would otherwise cancel
    // the button the key was meant for, which is also why the chevron rides in
    // this cell rather than beside it.
    // The chevron sits last, against the edge of the card: it is the control
    // that opens something below it, so it reads as the head of what it opens.
    SP.rowTools = function (text, kind, tail) {
        var tools = SP.el('div', 'sp-tools');
        var ask = SP.askButton(text, kind);
        if (ask) tools.appendChild(ask);
        if (tail) tools.appendChild(tail);
        tools.addEventListener('keydown', function (e) { e.stopPropagation(); });
        return tools;
    };
    /* ---------- lifting an entry to the top ---------- */

    // The pin at the head of a learned row, of a rules section and of a
    // pattern card: it takes that one entry to the top of its list, and puts
    // it back exactly where it stood when it is pressed again. What belongs up
    // there is whatever is being worked on right now — a word the shuffle
    // buried, the rule being read beside it — and that outlives the page:
    // the learned list is dealt afresh on every load, so a pick kept only in
    // memory would be shuffled away by the next reload, which is the one thing
    // pinning is for. The record is this browser's, like the pending marks,
    // and holds the moment each entry went up so the newest leads.
    var PIN_KEY = 'spanishPinned';
    var pinState = null;
    var pinListeners = [];

    function pinRecord() {
        if (!pinState) {
            pinState = SP.loadState(PIN_KEY, 1) || { v: 1, ids: {} };
            if (!pinState.ids) pinState.ids = {};
        }
        return pinState;
    }

    SP.pin = {
        has: function (key) { return !!key && !!pinRecord().ids[key]; },

        // The value is when it went up, so the list can put the newest first —
        // the same place a fresh click lands it.
        set: function (key, on) {
            if (!key) return false;
            var ids = pinRecord().ids;
            if (on) ids[key] = Date.now();
            else delete ids[key];
            SP.saveState(PIN_KEY, pinState);
            pinListeners.forEach(function (fn) { fn(key, !!on); });
            return !!on;
        },

        toggle: function (key) { return SP.pin.set(key, !SP.pin.has(key)); },

        // Register once per list, as with the fold: a list that re-registers
        // on every render would redraw itself as many times as it was drawn.
        onChange: function (fn) { pinListeners.push(fn); },

        // The pinned entries in front of the rest, newest first, everything
        // else in the order it came in. This is how a list that redraws itself
        // keeps them up — through the next reload as well, since the record
        // outlives the page while the shuffle behind it does not — and how they
        // go back: the order under them never moved, so unpinning puts an entry
        // down exactly where it was. The anchor below serves the two panels
        // that are drawn once and never again.
        first: function (items, keyOf) {
            var top = [];
            var rest = [];
            var ids = pinRecord().ids;
            items.forEach(function (item) {
                var key = keyOf ? keyOf(item) : item.id;
                if (ids[key]) top.push({ item: item, at: ids[key] });
                else rest.push(item);
            });
            top.sort(function (a, b) { return b.at - a.at; });
            return top.map(function (entry) { return entry.item; }).concat(rest);
        },

        // For the rules and the patterns, which are drawn once: hand back what
        // was pinned before this load, oldest first, so raising them one by one
        // onto the shelf leaves the newest on top.
        pickPinned: function (entries) {
            var ids = pinRecord().ids;
            return entries.filter(function (entry) { return !!ids[entry.key]; })
                .sort(function (a, b) { return ids[a.key] - ids[b.key]; });
        },

        raise: function (node, host) { pinRaise(node, host); },
        lower: function (node) { pinLower(node); }
    };

    // The way back for those two panels. An anchor comment is left where the
    // node stood, so "where it was" holds however much has been pinned, folded
    // or marked above it meanwhile.
    function pinRaise(node, host) {
        if (!node || !host || node.spPin || !node.parentNode) return;
        var anchor = document.createComment('pin');
        node.parentNode.insertBefore(anchor, node);
        node.spPin = anchor;
        host.insertBefore(node, host.firstChild);
        node.classList.add('is-pinned');
    }

    function pinLower(node) {
        var anchor = node && node.spPin;
        if (!anchor) return;
        node.spPin = null;
        node.classList.remove('is-pinned');
        if (!anchor.parentNode) return;
        anchor.parentNode.insertBefore(node, anchor);
        anchor.parentNode.removeChild(anchor);
    }

    function pinNode(value) { return typeof value === 'function' ? value() : value; }

    // A pushpin: outlined while it would lift the entry, filled once the entry
    // is up, and struck through under a pointer or a focus ring on a pinned
    // one, since that is when the next press takes it down. Quiet until then —
    // a list of a hundred words does not need a hundred lit pins down its
    // edge, so an unpinned one is barely there until it is hovered or focused,
    // while a pinned one carries the full orange and says on the entry itself
    // why it is at the top.
    // `move` is {node, host} where the list is drawn once and the entry has to
    // be carried up by hand — the rules and the patterns. A list that redraws
    // itself passes nothing and reorders through SP.pin.first instead.
    SP.pinButton = function (key, move) {
        var btn = SP.el('button', 'sp-pin');
        btn.type = 'button';
        btn.appendChild(SP.icon.pin());

        function sync(on) {
            btn.classList.toggle('is-on', on);
            btn.setAttribute('aria-pressed', on ? 'true' : 'false');
            var label = on ? 'Unpin — put it back where it was' : 'Pin to the top';
            btn.title = label;
            btn.setAttribute('aria-label', label);
        }

        // A list row is a reveal toggle on the click and on the key alike, so
        // both stop here — the same reason .sp-tools stops the keys at the
        // other end of the row.
        btn.addEventListener('keydown', function (e) { e.stopPropagation(); });
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            e.preventDefault();
            var on = SP.pin.toggle(key);
            if (move && on) pinRaise(pinNode(move.node), pinNode(move.host));
            else if (move) pinLower(pinNode(move.node));
            sync(on);
        });

        sync(SP.pin.has(key));
        return btn;
    };

    /* ---------- icons ---------- */

    function checkIcon() {
        var svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('aria-hidden', 'true');
        var box = document.createElementNS(SVG_NS, 'rect');
        box.setAttribute('x', '3');
        box.setAttribute('y', '3');
        box.setAttribute('width', '18');
        box.setAttribute('height', '18');
        box.setAttribute('rx', '4');
        var tick = document.createElementNS(SVG_NS, 'path');
        tick.setAttribute('class', 'sp-tick');
        tick.setAttribute('d', 'M7 12.4l3.4 3.4L17.2 9');
        svg.appendChild(box);
        svg.appendChild(tick);
        return svg;
    }

    // Two sheets, the usual sign for "copy".
    function copyIcon() {
        var svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('class', 'sp-copy-icon');
        var front = document.createElementNS(SVG_NS, 'rect');
        front.setAttribute('x', '9');
        front.setAttribute('y', '9');
        front.setAttribute('width', '12');
        front.setAttribute('height', '12');
        front.setAttribute('rx', '2');
        var back = document.createElementNS(SVG_NS, 'path');
        back.setAttribute('d', 'M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1');
        svg.appendChild(back);
        svg.appendChild(front);
        return svg;
    }

    // An arrow dropping into a tray, the usual sign for "download".
    function downloadIcon() {
        var svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('class', 'sp-download-icon');
        var arrow = document.createElementNS(SVG_NS, 'path');
        arrow.setAttribute('d', 'M12 3v12M7 10l5 5 5-5');
        var tray = document.createElementNS(SVG_NS, 'path');
        tray.setAttribute('d', 'M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3');
        svg.appendChild(arrow);
        svg.appendChild(tray);
        return svg;
    }

    // A crossed-out eye: the lit segment beside it is the side that is hidden.
    function eyeOffIcon() {
        var svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('class', 'sp-cover-icon');
        var eye = document.createElementNS(SVG_NS, 'path');
        eye.setAttribute('d', 'M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z');
        var pupil = document.createElementNS(SVG_NS, 'circle');
        pupil.setAttribute('cx', '12');
        pupil.setAttribute('cy', '12');
        pupil.setAttribute('r', '3');
        var slash = document.createElementNS(SVG_NS, 'path');
        slash.setAttribute('d', 'M4 4l16 16');
        svg.appendChild(eye);
        svg.appendChild(pupil);
        svg.appendChild(slash);
        return svg;
    }

    // The ✕ that empties the search field.
    function crossIcon() {
        var svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('aria-hidden', 'true');
        var path = document.createElementNS(SVG_NS, 'path');
        path.setAttribute('d', 'M6 6l12 12M18 6L6 18');
        svg.appendChild(path);
        return svg;
    }

    // The pin that lifts one entry to the top of its list, and the same pin
    // struck through, which takes it back down. Both go into every button and
    // CSS shows one. The strike is cut out of the pin through a mask rather
    // than drawn across it, so a gap runs along the line and the pin still
    // reads at 20px. A mask is found by id and each button has its own, so
    // the id carries a counter.
    var PIN_HEAD = 'M8 3h8l-1 1.5V9l3 4v2H6v-2l3-4V4.5Z';
    var PIN_NEEDLE = 'M12 15v6';
    var PIN_STRIKE = 'M4 4l16 16';
    var pinMaskSeq = 0;

    function svgPath(d, cls) {
        var path = document.createElementNS(SVG_NS, 'path');
        path.setAttribute('d', d);
        if (cls) path.setAttribute('class', cls);
        return path;
    }

    function pinIcon() {
        var id = 'sp-pin-cut-' + (++pinMaskSeq);
        var svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('class', 'sp-pin-icon');

        var mask = document.createElementNS(SVG_NS, 'mask');
        mask.setAttribute('id', id);
        mask.setAttribute('maskUnits', 'userSpaceOnUse');
        mask.setAttribute('x', '0');
        mask.setAttribute('y', '0');
        mask.setAttribute('width', '24');
        mask.setAttribute('height', '24');
        var keep = document.createElementNS(SVG_NS, 'rect');
        keep.setAttribute('width', '24');
        keep.setAttribute('height', '24');
        keep.setAttribute('fill', '#fff');
        keep.setAttribute('stroke', 'none');
        var cut = svgPath(PIN_STRIKE);
        cut.setAttribute('stroke', '#000');
        cut.setAttribute('stroke-width', '5');
        mask.appendChild(keep);
        mask.appendChild(cut);
        // In <defs> at the root, not inside the struck group: that group is
        // display: none most of the time, and a mask under it is not safe to use.
        svg.appendChild(document.createElementNS(SVG_NS, 'defs')).appendChild(mask);

        var pin = document.createElementNS(SVG_NS, 'g');
        pin.setAttribute('class', 'sp-pin-on');
        pin.appendChild(svgPath(PIN_HEAD, 'sp-pin-head'));
        pin.appendChild(svgPath(PIN_NEEDLE));

        var off = document.createElementNS(SVG_NS, 'g');
        off.setAttribute('class', 'sp-pin-off');
        var cutPin = off.appendChild(document.createElementNS(SVG_NS, 'g'));
        cutPin.setAttribute('mask', 'url(#' + id + ')');
        cutPin.appendChild(svgPath(PIN_HEAD));
        cutPin.appendChild(svgPath(PIN_NEEDLE));
        off.appendChild(svgPath(PIN_STRIKE));

        svg.appendChild(pin);
        svg.appendChild(off);
        return svg;
    }

    function chevronIcon() {
        var svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('class', 'sp-chevron');
        var path = document.createElementNS(SVG_NS, 'path');
        path.setAttribute('d', 'M6 9.5l6 6 6-6');
        svg.appendChild(path);
        return svg;
    }

    // Every glyph the section draws, in one export, wanted all over: the
    // search field draws the ✕, a list draws the tick and the chevron.
    SP.icon = {
        check: checkIcon,
        copy: copyIcon,
        download: downloadIcon,
        eyeOff: eyeOffIcon,
        cross: crossIcon,
        chevron: chevronIcon,
        pin: pinIcon
    };

    // Every list is split into the same four sections, in this order. Reference
    // is the stage's closed sets — days, months, numbers — drawn as tables; the
    // other three hold the words worked through one by one.

    /* ---------- error surface ---------- */

    SP.showError = function (containerId, error) {
        var box = document.getElementById(containerId);
        if (!box) return;
        SP.clear(box);
        box.appendChild(SP.el('strong', null, 'Could not load the Spanish data. '));
        box.appendChild(document.createTextNode(
            'Open the site over HTTP (python3 -m http.server 8000) — fetch is blocked on file://.'
        ));
        box.hidden = false;
        if (error) console.error(error);
    };

})();
