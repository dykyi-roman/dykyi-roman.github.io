/* Shared core for the Spanish section: data loading, storage, speech and the
   renderers used by both the hub trainer and the stage reference pages.
   Everything is built with createElement + textContent — the JSON carries no
   markup, and nothing here ever assigns innerHTML.
   Exposes window.SP. */

(function () {
    'use strict';

    var SP = {};

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
            // Another side to recall starts the round over: whatever was
            // uncovered under the old choice is covered under the new one. An
            // open panel of examples spells out both sides, so it goes too —
            // otherwise the new cover would draw a bar over a word whose answer
            // is still written out underneath it.
            document.querySelectorAll('.sp-lex-row.is-open').forEach(function (row) {
                SP.setExamplesOpen(row, false);
            });
            document.querySelectorAll('.is-revealed').forEach(function (row) {
                row.classList.remove('is-revealed');
            });
            document.querySelectorAll(':is(.sp-lex-row, .sp-drill-row):is(.is-learned, .is-pending)').forEach(revealTitle);
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

    /* ---------- search ---------- */

    // Accents are a spelling detail, not a search term: "esta" has to find
    // "está" and "solo" has to find "sólo", so both sides are folded down to
    // bare letters before they meet.
    SP.normalize = function (text) {
        return String(text === undefined || text === null ? '' : text)
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    };

    // Everything an entry can be found by, folded once and kept on the item:
    // the pool is rebuilt on every keystroke, and 1552 items would otherwise be
    // re-folded each time.
    function searchText(item) {
        if (item._search === undefined) {
            item._search = SP.normalize([
                item.es, item.tr, item.en, item.ru, item.prompt, item.answer, item.group, item.set
            ].filter(Boolean).join(' '));
        }
        return item._search;
    }

    // The examples are searched apart from the rest. They are what the phrase
    // items became, so this is the only place that text still lives — and the
    // hub needs to know a match came from here alone, to open the panel that
    // holds it. Folded once and kept, like the line above.
    function exampleText(item) {
        if (item._searchEx === undefined) {
            item._searchEx = SP.normalize((item.ex || []).map(function (line) {
                return line.es + ' ' + line.ru;
            }).join(' '));
        }
        return item._searchEx;
    }

    // `query` must come from SP.normalize — the caller folds it once per pass
    // rather than once per item.
    SP.matches = function (item, query) {
        if (!query) return true;
        return SP.matchesOwn(item, query) || SP.matchesExample(item, query);
    };

    // True when the query is found in what the row itself shows.
    SP.matchesOwn = function (item, query) {
        if (!query) return true;
        return searchText(item).indexOf(query) !== -1;
    };

    // True when the query is found in the examples of a word. The caller uses
    // it to tell a row that matched on its own text from one that matched on
    // something folded away inside it.
    SP.matchesExample = function (item, query) {
        if (!query || !item.ex || !item.ex.length) return false;
        return exampleText(item).indexOf(query) !== -1;
    };

    // A search field that reports every change, settled so a fast typist does
    // not redraw a long list on every letter.
    // It draws its own ✕. The one a type="search" field comes with shows only
    // while the field has the focus or the pointer — on a phone, only while the
    // keyboard is up, so once that is put away the results have nothing left
    // to close them with. This one stays for as long as there is text (the CSS
    // hides it by :placeholder-shown), and the native one is hidden.
    SP.searchBox = function (placeholder, onChange) {
        var box = SP.el('div', 'sp-search-box');
        var input = SP.el('input', 'sp-search');
        input.type = 'search';
        input.placeholder = placeholder;
        input.setAttribute('aria-label', placeholder);
        var timer = null;
        input.addEventListener('input', function () {
            clearTimeout(timer);
            timer = setTimeout(onChange, 140);
        });

        var clearBtn = SP.el('button', 'sp-search-clear');
        clearBtn.type = 'button';
        clearBtn.title = 'Clear the search';
        clearBtn.setAttribute('aria-label', 'Clear the search');
        clearBtn.appendChild(crossIcon());

        // A tap leaves the focus where it was: with the keyboard up it stays up
        // for the next word, and once put away it is not brought back.
        var hadFocus = false;
        clearBtn.addEventListener('pointerdown', function () { hadFocus = document.activeElement === input; });
        clearBtn.addEventListener('mousedown', function (e) { e.preventDefault(); });
        clearBtn.addEventListener('click', function (e) {
            clearTimeout(timer);
            input.value = '';
            // Pressed from the keyboard (detail 0), the button has just hidden
            // itself from under the focus, so the focus goes back to the field.
            if (hadFocus || e.detail === 0) input.focus();
            hadFocus = false;
            onChange();
        });

        box.appendChild(input);
        box.appendChild(clearBtn);
        return {
            node: box,
            input: input,
            query: function () { return SP.normalize(input.value.trim()); },
            clear: function () { input.value = ''; }
        };
    };

    /* ---------- DOM helpers ---------- */

    SP.el = function (tag, cls, text) {
        var node = document.createElement(tag);
        if (cls) node.className = cls;
        if (text !== undefined && text !== null) node.textContent = text;
        return node;
    };

    SP.clear = function (node) { while (node && node.firstChild) node.removeChild(node.firstChild); };

    // A stage's thematic mark. Decoration only — the title beside it already
    // says which stage this is — so it is hidden from assistive tech.
    SP.iconSpan = function (icon) {
        if (!icon) return null;
        var span = SP.el('span', 'sp-icon', icon);
        span.setAttribute('aria-hidden', 'true');
        return span;
    };

    /* ---------- speech ---------- */

    var SVG_NS = 'http://www.w3.org/2000/svg';

    function speakerIcon() {
        var svg = document.createElementNS(SVG_NS, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('aria-hidden', 'true');
        var body = document.createElementNS(SVG_NS, 'path');
        body.setAttribute('d', 'M3 9v6h4l5 5V4L7 9H3z');
        var wave = document.createElementNS(SVG_NS, 'path');
        wave.setAttribute('d', 'M16.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z');
        svg.appendChild(body);
        svg.appendChild(wave);
        return svg;
    }

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

    // A 44px round-cornered speak button. Returns null when speech is absent,
    // so callers simply skip appending it.
    SP.speakButton = function (text, label) {
        if (!tts.available() || !text) return null;
        var btn = SP.el('button', 'sp-speak');
        btn.type = 'button';
        btn.setAttribute('aria-label', label || ('Listen: ' + text));
        btn.appendChild(speakerIcon());
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            e.preventDefault();
            btn.classList.add('speaking');
            tts.speak(text, { onend: function () { btn.classList.remove('speaking'); } });
            // Safety net: some platforms never fire "end" on a cancelled utterance.
            setTimeout(function () { btn.classList.remove('speaking'); }, 4000);
        });
        return btn;
    };

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

    // The tail of a list row: the speaker, then the question. One grid cell for
    // both, so the row keeps a single column for its controls. The keys stop
    // here too — the row's own Enter/Space toggles the cover and would
    // otherwise cancel the button the key was meant for.
    // `lead` is an optional control drawn before the speaker — the chevron that
    // opens a word's usage examples. It rides in this cell rather than beside
    // it because the cell already stops a keydown from reaching the row's
    // reveal toggle, which is exactly what a second button in a row needs.
    // `voices` is what the speakers read, when that is not the row's own text:
    // a pair is two words, so it gets a speaker each rather than one that reads
    // the slash out loud. They follow the order the row prints them in, and
    // each names its own word in its accessible label.
    SP.rowTools = function (text, kind, lead, voices) {
        var tools = SP.el('div', 'sp-tools');
        if (lead) tools.appendChild(lead);
        (voices && voices.length ? voices : [text]).forEach(function (one) {
            var speak = SP.speakButton(one);
            if (speak) tools.appendChild(speak);
        });
        var ask = SP.askButton(text, kind);
        if (ask) tools.appendChild(ask);
        tools.addEventListener('keydown', function (e) { e.stopPropagation(); });
        return tools;
    };

    /* ---------- section headers and the pending checkbox ---------- */

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
    SP.copyIcon = function () {
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
    };

    // An arrow dropping into a tray, the usual sign for "download".
    SP.downloadIcon = function () {
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
    };

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

    // Every list is split into the same four sections, in this order. Reference
    // is the stage's closed sets — days, months, numbers — drawn as tables; the
    // other three hold the words worked through one by one.
    SP.SECTIONS = ['reference', 'learned', 'pending', 'left'];
    SP.SECTION_LABEL = { reference: 'Reference', learned: 'Learned', pending: 'Pending', left: 'Left' };

    // The header of one section: a dashed line naming what follows and how much
    // of it there is. All but the last fold — the rest of the list is what you
    // are working through, so it has nothing to fold away. Returns the node
    // plus the one call that keeps the caption true.
    SP.sectionDivider = function (kind) {
        var foldable = kind !== 'left';
        var node = SP.el(foldable ? 'button' : 'div', 'sp-divider' + (foldable ? '' : ' is-quiet'));
        var label;

        if (foldable) {
            node.type = 'button';
            node.appendChild(chevronIcon());
        }
        label = SP.el('span', 'sp-divider-label');
        node.appendChild(label);

        function syncState() {
            if (!foldable) return;
            var folded = SP.view.folded(kind);
            node.setAttribute('aria-expanded', folded ? 'false' : 'true');
            node.title = (folded ? 'Show ' : 'Hide ') + SP.SECTION_LABEL[kind].toLowerCase();
        }

        if (foldable) {
            syncState();
            node.addEventListener('click', function () { SP.view.setFolded(kind, !SP.view.folded(kind)); });
        }

        return {
            node: node,
            sync: function (count) {
                label.textContent = SP.SECTION_LABEL[kind] + ' · ' + count;
                syncState();
            }
        };
    };

    // Keeps the headers of one list true: each counts its section, an empty
    // section shows none, and the rest of the list gets one only once something
    // sits above it — Left comes last, so everything before it is above.
    SP.syncSectionHeads = function (heads, counts) {
        var above = 0;
        SP.SECTIONS.forEach(function (kind) {
            heads[kind].sync(counts[kind]);
            heads[kind].node.hidden = kind === 'left' ? above === 0 : counts[kind] === 0;
            above += counts[kind];
        });
    };

    // The same line without the fold, naming what follows it: a table inside
    // Reference, or on the hub a run of one type of entry.
    SP.quietDivider = function (label) {
        var node = SP.el('div', 'sp-divider is-quiet');
        node.appendChild(SP.el('span', 'sp-divider-label', label));
        return node;
    };

    // Opens a row with the checkbox and flags the row so the CSS gives its grid
    // the extra control column. The checkbox leads the row, in the DOM as on the
    // screen, as far from the speak button as the row allows: side by side at
    // the tail, a tap meant for the speaker could unmark the word.
    // A learned row and a row of a Reference table pass no checkbox and get no
    // column: there is nothing to tick, and an empty cell only pushed the text
    // away from the edge. Every list row is still a row you can test yourself
    // on, so the reveal listener goes on regardless — it does nothing until the
    // row is in Learned or Pending, and the mark and speak buttons stop the
    // click before it reaches the row.
    SP.attachMark = function (row, mark) {
        attachReveal(row);
        if (!mark) return row;
        row.classList.add('has-mark');
        row.insertBefore(mark, row.firstChild);
        return row;
    };

    function covered(row) {
        return row.classList.contains('is-learned') || row.classList.contains('is-pending');
    }

    function revealTitle(row) {
        if (!covered(row)) { row.removeAttribute('title'); return; }
        // A drill covers its answer on either side; any other row, the side picked.
        var what = row.classList.contains('sp-drill-row') ? 'answer'
            : (coverSide === 'spanish' ? 'Spanish' : 'translation');
        row.title = (row.classList.contains('is-revealed') ? 'Hide the ' : 'Show the ') + what;
    }

    function attachReveal(row) {
        function toggle(e) {
            if (!covered(row)) return;
            e.preventDefault();
            row.classList.toggle('is-revealed');
            revealTitle(row);
        }
        row.addEventListener('click', toggle);
        row.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') toggle(e);
        });
    }

    // Which section an entry is drawn in, decided here and nowhere else. A word
    // of one of the stage's sets lives in Reference alone, whatever the two
    // lists say about it: it is a row of a table, not a word to tick off.
    // Otherwise learned is asked first — and SP.pending.has already answers
    // false for a learned id, so the two lists cannot disagree about a word.
    SP.sectionOf = function (item) {
        if (item.set) return 'reference';
        if (SP.learned.has(item.id)) return 'learned';
        return SP.pending.has(item.id) ? 'pending' : 'left';
    };

    // Reference reads table by table, in the order the stage declares its sets,
    // and each table in the order of the file. The index in the incoming order
    // breaks the ties, so the sort is stable.
    SP.orderBySet = function (items) {
        return items.map(function (item, i) {
            return { item: item, i: i };
        }).sort(function (a, b) {
            return a.item.stage - b.item.stage || a.item.setRank - b.item.setRank || a.i - b.i;
        }).map(function (entry) { return entry.item; });
    };

    // Paints a row for the section it is in. A row in Learned or Pending covers
    // one side (SP.cover) until it is tapped, and takes the focus so a keyboard
    // can do the same; a Reference row covers nothing, as the rest does not.
    SP.setRowState = function (row, learned, pending) {
        row.classList.toggle('is-learned', learned);
        row.classList.toggle('is-pending', !learned && pending);
        if (covered(row)) {
            row.tabIndex = 0;
            // A row that starts hiding a side puts its hints away with it: an
            // open panel writes out both sides, so a word just ticked into
            // Pending would move there with its answer still on the screen.
            SP.setExamplesOpen(row, false);
            row.classList.remove('is-revealed');
        } else {
            row.classList.remove('is-revealed');
            row.removeAttribute('tabindex');
        }
        revealTitle(row);
        return row;
    };

    // Opens or closes a word's examples — the one place that state is changed,
    // so the covered side and the checkbox can close a panel without knowing
    // how it was opened. The panel fills itself on the first open: a page holds
    // a hundred rows, and three speak buttons each for panels nobody opens is
    // three hundred listeners bought for nothing.
    //
    // Opening also reveals the row. The examples spell out the Spanish and the
    // Russian alike, so leaving the word itself under a bar would be hiding an
    // answer that is already on the screen.
    SP.setExamplesOpen = function (row, on) {
        if (!on && !row.classList.contains('is-open')) return;
        var btn = row.querySelector('.sp-ex-toggle');
        var panel = row.querySelector('.sp-exlines');
        if (!btn || !panel) return;
        if (on && panel.fill) { panel.fill(); panel.fill = null; }
        row.classList.toggle('is-open', on);
        btn.setAttribute('aria-expanded', on ? 'true' : 'false');
        panel.hidden = !on;
        // Only a covered row has anything to reveal; on any other, the class
        // would be a leftover waiting to show a side that is about to be hidden.
        if (on && covered(row)) row.classList.add('is-revealed');
        exampleTitle(btn, on);
        revealTitle(row);
    };

    function exampleTitle(btn, on) {
        var label = on ? 'Hide the examples' : 'Show the examples';
        btn.title = label;
        btn.setAttribute('aria-label', label);
    }

    // In a search the sections can be far apart on the screen — and a single
    // match can be the only row under its header — so a found row says on
    // itself which list it is in.
    SP.setSectionTag = function (tag, kind) {
        if (!tag) return tag;
        tag.className = 'sp-tag is-' + kind;
        tag.textContent = SP.SECTION_LABEL[kind];
        return tag;
    };

    SP.sectionTag = function (kind) {
        return SP.setSectionTag(SP.el('span'), kind);
    };

    // Where a row carries it: right after the Spanish, the one part every kind
    // of row has. It cannot be a child of the row itself — above 700px the
    // lexicon row is a grid whose cells are spoken for.
    SP.tagRow = function (row, kind) {
        var head = row.querySelector('.sp-lex-es') || row.querySelector('.sp-drill-es');
        if (!head) return null;
        var tag = SP.sectionTag(kind);
        head.appendChild(tag);
        return tag;
    };


    // The 44px checkbox that puts an entry in the pending list. A button with
    // aria-pressed rather than a real checkbox, so it has the shape and the
    // touch target of .sp-speak at the other end of the row.
    SP.markButton = function (item, onChange) {
        var btn = SP.el('button', 'sp-mark');
        btn.type = 'button';
        btn.setAttribute('aria-label', 'Mark as pending');
        btn.appendChild(checkIcon());

        function sync(on) {
            btn.classList.toggle('is-on', on);
            btn.setAttribute('aria-pressed', on ? 'true' : 'false');
            btn.title = on ? 'Pending — click to unmark' : 'Mark as pending';
        }

        sync(SP.pending.has(item.id));
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            e.preventDefault();
            var on = SP.pending.toggle(item.id);
            sync(on);
            if (onChange) onChange(on);
        });
        return btn;
    };

    // The switch between the two sides a covered row can hide: one control of
    // two segments in row order, the lit one naming the side that is hidden.
    // Every copy follows SP.cover, so no two on a page can disagree.
    var COVER_OPTIONS = [
        { side: 'spanish', label: 'ES', hint: 'Hide the Spanish and its transliteration' },
        { side: 'meaning', label: 'EN', hint: 'Hide the English and Russian' }
    ];

    SP.coverSwitch = function () {
        var group = SP.el('div', 'sp-cover');
        group.setAttribute('role', 'group');
        group.setAttribute('aria-label', 'What Learned and Pending rows hide');
        group.appendChild(eyeOffIcon());

        var buttons = COVER_OPTIONS.map(function (option) {
            var btn = SP.el('button', 'sp-cover-btn', option.label);
            btn.type = 'button';
            btn.title = option.hint;
            btn.setAttribute('aria-label', option.label + ' — ' + option.hint);
            btn.addEventListener('click', function () { SP.cover.set(option.side); });
            group.appendChild(btn);
            return btn;
        });

        function sync(side) {
            COVER_OPTIONS.forEach(function (option, i) {
                var on = option.side === side;
                buttons[i].classList.toggle('active', on);
                buttons[i].setAttribute('aria-pressed', on ? 'true' : 'false');
            });
        }

        sync(SP.cover.side());
        SP.cover.onChange(sync);
        return group;
    };

    /* ---------- prose rendering ---------- */

    SP.renderSpans = function (parent, spans) {
        (spans || []).forEach(function (span) {
            if (!span || span.t === undefined) return;
            if (span.s === 'es') parent.appendChild(SP.el('span', 'sp-es', span.t));
            else if (span.s === 'b') parent.appendChild(SP.el('span', 'sp-b', span.t));
            else parent.appendChild(document.createTextNode(span.t));
        });
        return parent;
    };

    function cellKey(cell) {
        return (cell || []).map(function (span) {
            if (!span || span.t === undefined) return '';
            return (span.s || '') + '\u0001' + span.t;
        }).join('\u0002');
    }

    // Ключ правила повторяется в каждой строке своих примеров — на экране он нужен один раз.
    // Считаем, сколько строк подряд делят первую ячейку: 0 означает «строка без своей первой ячейки».
    function firstColumnSpans(rows) {
        var spans = rows.map(function () { return 0; });
        var head = -1;
        rows.forEach(function (row, i) {
            var key = cellKey(row && row[0]);
            if (head >= 0 && key && key === cellKey(rows[head][0])) {
                spans[head]++;
                return;
            }
            head = i;
            spans[i] = 1;
        });
        return spans;
    }

    function renderTable(block) {
        var wrap = SP.el('div', 'sp-table-wrap');
        var table = SP.el('table', 'sp-table');
        if (block.head && block.head.length) {
            var thead = SP.el('thead');
            var hr = SP.el('tr');
            block.head.forEach(function (cell) { SP.renderSpans(hr.appendChild(SP.el('th')), cell); });
            thead.appendChild(hr);
            table.appendChild(thead);
        }
        var rows = block.rows || [];
        var spans = firstColumnSpans(rows);
        var tbody = SP.el('tbody');
        rows.forEach(function (row, i) {
            var tr = SP.el('tr');
            row.forEach(function (cell, col) {
                if (col === 0) {
                    if (!spans[i]) return;
                    var td = SP.el('td');
                    if (spans[i] > 1) td.rowSpan = spans[i];
                    SP.renderSpans(tr.appendChild(td), cell);
                    return;
                }
                SP.renderSpans(tr.appendChild(SP.el('td')), cell);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        wrap.appendChild(table);
        return wrap;
    }

    /* ---------- rules diagrams ---------- */

    // A fork: the choice a rule comes down to, as two or three columns instead
    // of a table whose first column repeated the key on every row. A column is
    // its head word plus the sense it carries; a row is the same {es, ru, frame}
    // shape the patterns and the usage examples use, so the highlight is free.
    // The palette lives in CSS, keyed by the column's place — never in JSON.
    function forkBlock(block) {
        var root = SP.el('div', 'sp-fork');
        if (block.q) root.appendChild(SP.el('p', 'sp-fork-q', block.q));
        var cols = SP.el('div', 'sp-fork-cols');
        (block.cols || []).forEach(function (col) {
            var card = SP.el('div', 'sp-fork-col');
            var head = SP.el('div', 'sp-fork-head');
            head.appendChild(SP.el('span', 'sp-fork-key', col.es));
            // One speaker per column, on the head word: what a fork teaches is
            // the choice between those words, and a speaker on each of nine
            // rows would turn a narrow column into a list of buttons.
            var speak = SP.speakButton(col.es);
            if (speak) head.appendChild(speak);
            card.appendChild(head);
            if (col.hint) card.appendChild(SP.el('p', 'sp-fork-hint', col.hint));
            var rows = SP.el('div', 'sp-fork-rows');
            (col.rows || []).forEach(function (line) {
                var row = SP.el('div', 'sp-fork-row');
                if (line.label) row.appendChild(SP.el('span', 'sp-fork-label', line.label));
                SP.renderFramed(row.appendChild(SP.el('span', 'sp-fork-es')), line);
                row.appendChild(SP.el('span', 'sp-fork-ru', line.ru));
                rows.appendChild(row);
            });
            card.appendChild(rows);
            cols.appendChild(card);
        });
        root.appendChild(cols);
        return root;
    }

    // A cell of a conjugation grid is either a stem plus an ending or a whole
    // irregular form. Either way the part that changes goes into .sp-conj-end,
    // so one rule lights it, hides it and groups it with its twins. The key of
    // the group is `hl` when the file names it — a group like the -go of hago,
    // pongo, salgo is not something an ending can be read off.
    function conjCell(col, cell) {
        var raw = (cell && typeof cell === 'object') ? cell : { f: cell };
        var stem = raw.s !== undefined ? raw.s : col.stem;
        var end = (raw.f === undefined || raw.f === null) ? '' : String(raw.f);
        stem = stem || '';
        return { stem: stem, end: end, hl: raw.hl || (stem ? end : ''), form: stem + end };
    }

    function conjBlock(block) {
        var root = SP.el('div', 'sp-conj');
        var cols = block.cols || [];

        // Chips pick one verb at a time on a phone. They earn their place only
        // when the columns name verbs: where they name persons, the point is
        // seeing the whole set at once and the table's sideways scroll is right.
        var picky = cols.length > 1 && cols.every(function (col) { return !!col.inf; });
        if (picky) {
            root.classList.add('is-picky');
            root.dataset.pick = '0';
        }

        var tools = SP.el('div', 'sp-conj-tools');
        if (picky) {
            var chips = SP.el('div', 'sp-conj-chips');
            cols.forEach(function (col, i) {
                var chip = SP.el('button', 'sp-btn' + (i === 0 ? ' active' : ''), col.head);
                chip.type = 'button';
                chip.dataset.pick = String(i);
                chip.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
                chips.appendChild(chip);
            });
            chips.addEventListener('click', function (e) {
                var chip = e.target.closest && e.target.closest('.sp-btn');
                if (!chip || !chips.contains(chip)) return;
                root.dataset.pick = chip.dataset.pick;
                Array.prototype.forEach.call(chips.children, function (node) {
                    var on = node === chip;
                    node.classList.toggle('active', on);
                    node.setAttribute('aria-pressed', on ? 'true' : 'false');
                });
            });
            tools.appendChild(chips);
        }
        if (block.hide) {
            // The label comes from the file: it is honestly different from one
            // grid to the next — endings here, whole forms there.
            var toggle = SP.el('button', 'sp-btn', block.hide);
            toggle.type = 'button';
            toggle.setAttribute('aria-pressed', 'false');
            toggle.addEventListener('click', function () {
                var on = !root.classList.contains('is-hiding');
                root.classList.toggle('is-hiding', on);
                toggle.classList.toggle('active', on);
                toggle.setAttribute('aria-pressed', on ? 'true' : 'false');
                Array.prototype.forEach.call(root.querySelectorAll('.sp-conj-cell.is-shown'), function (node) {
                    node.classList.remove('is-shown');
                });
            });
            tools.appendChild(toggle);
        }
        if (tools.firstChild) root.appendChild(tools);

        var wrap = SP.el('div', 'sp-table-wrap');
        var table = SP.el('table', 'sp-table sp-conj-table');
        var thead = SP.el('thead');
        var hr = SP.el('tr');
        hr.appendChild(SP.el('th', null, block.rowsHead || ''));
        cols.forEach(function (col, i) {
            var th = SP.el('th', 'sp-c' + i);
            th.appendChild(SP.el('span', 'sp-conj-head-name', col.head));
            if (col.inf) th.appendChild(SP.el('span', 'sp-conj-head-inf', col.inf));
            var speak = SP.speakButton(col.inf);
            if (speak) th.appendChild(speak);
            hr.appendChild(th);
        });
        thead.appendChild(hr);
        table.appendChild(thead);

        var tbody = SP.el('tbody');
        (block.rows || []).forEach(function (row) {
            var tr = SP.el('tr');
            if (row.band !== undefined) {
                var band = SP.el('td', 'sp-conj-band', row.band);
                band.colSpan = cols.length + 1;
                tr.appendChild(band);
                tbody.appendChild(tr);
                return;
            }
            var label = SP.el('td');
            label.appendChild(SP.el('span', 'sp-conj-label', row.label));
            // The gloss rides under the label instead of taking a column of
            // its own: one column fewer is what fits a phone.
            if (row.ru) label.appendChild(SP.el('span', 'sp-conj-gloss', row.ru));
            tr.appendChild(label);
            cols.forEach(function (col, i) {
                var td = SP.el('td', 'sp-conj-td sp-c' + i);
                var parts = conjCell(col, (row.cells || [])[i]);
                var btn = SP.el('button', 'sp-conj-cell');
                btn.type = 'button';
                btn.setAttribute('aria-pressed', 'false');
                if (parts.hl) btn.dataset.hl = parts.hl;
                btn.dataset.form = parts.form;
                if (parts.stem) btn.appendChild(SP.el('span', 'sp-conj-stem', parts.stem));
                btn.appendChild(SP.el('span', 'sp-conj-end', parts.end));
                td.appendChild(btn);
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        wrap.appendChild(table);
        root.appendChild(wrap);

        // One tap answers "tell me about this form": it says the form out loud
        // and lights every other cell built the same way.
        root.addEventListener('click', function (e) {
            var cell = e.target.closest && e.target.closest('.sp-conj-cell');
            if (!cell || !root.contains(cell)) return;
            if (root.classList.contains('is-hiding') && !cell.classList.contains('is-shown')) {
                cell.classList.add('is-shown');
                SP.tts.speak(cell.dataset.form);
                return;
            }
            var key = cell.dataset.hl || '';
            var lit = cell.classList.contains('is-lit');
            Array.prototype.forEach.call(root.querySelectorAll('.sp-conj-cell'), function (node) {
                var on = !lit && !!key && node.dataset.hl === key;
                node.classList.toggle('is-lit', on);
                node.setAttribute('aria-pressed', on ? 'true' : 'false');
            });
            SP.tts.speak(cell.dataset.form);
        });
        return root;
    }

    // The time axis: past, now and ahead, one verb across all of them. An item
    // either points at the section that teaches it or is marked as still to
    // come — never both, so the reader sees at a glance where the ground ends.
    function axisBlock(block) {
        var root = SP.el('div', 'sp-axis');
        (block.zones || []).forEach(function (zone) {
            var box = SP.el('div', 'sp-axis-zone');
            box.appendChild(SP.el('div', 'sp-axis-title', zone.title));
            var items = SP.el('div', 'sp-axis-items');
            (zone.items || []).forEach(function (item) {
                var node = item.ref ? SP.el('a', 'sp-axis-item') : SP.el('div', 'sp-axis-item is-next');
                if (item.ref) node.href = '#' + item.ref;
                node.appendChild(SP.el('span', 'sp-axis-es', item.es));
                node.appendChild(SP.el('span', 'sp-axis-ru', item.ru));
                items.appendChild(node);
            });
            box.appendChild(items);
            root.appendChild(box);
        });
        return root;
    }

    SP.renderBlocks = function (parent, blocks) {
        (blocks || []).forEach(function (block) {
            if (!block) return;
            if (block.k === 'p') {
                SP.renderSpans(parent.appendChild(SP.el('p')), block.spans);
            } else if (block.k === 'note') {
                SP.renderSpans(parent.appendChild(SP.el('p', 'sp-callout')), block.spans);
            } else if (block.k === 'ul' || block.k === 'ol') {
                var list = SP.el(block.k === 'ul' ? 'ul' : 'ol');
                (block.items || []).forEach(function (item) {
                    SP.renderSpans(list.appendChild(SP.el('li')), item.spans);
                });
                parent.appendChild(list);
            } else if (block.k === 'table') {
                parent.appendChild(renderTable(block));
            } else if (block.k === 'fork') {
                parent.appendChild(forkBlock(block));
            } else if (block.k === 'conj') {
                parent.appendChild(conjBlock(block));
            } else if (block.k === 'axis') {
                parent.appendChild(axisBlock(block));
            }
        });
        return parent;
    };

    SP.renderNote = function (note) {
        var box = SP.el('div', 'sp-note');
        if (note.title) box.appendChild(SP.el('h4', null, note.title));
        SP.renderBlocks(box, note.blocks);
        return box;
    };

    /* ---------- chip index with scroll spy ---------- */

    // Shared by the reference pages and by the Rules tab on the hub: one chip
    // strip per entry.row, with an observer that keeps the visible section lit.
    SP.buildIndex = function (bar, entries, mainOnly) {
        var rows = {};
        if (mainOnly) entries = entries.filter(function (e) { return e.row === 'main'; });
        entries.forEach(function (entry) {
            if (!rows[entry.row]) {
                rows[entry.row] = SP.el('div', 'sp-chips');
                bar.appendChild(rows[entry.row]);
            }
            var chip = SP.el('a', 'sp-chip');
            chip.appendChild(SP.el('span', 'sp-chip-label', entry.label));
            chip.href = '#' + entry.target;
            chip.title = entry.label;
            chip.dataset.target = entry.target;
            rows[entry.row].appendChild(chip);
            entry.chip = chip;
        });

        if (!('IntersectionObserver' in window)) return null;

        var byTarget = {};
        entries.forEach(function (e) { byTarget[e.target] = e; });

        var observer = new IntersectionObserver(function (records) {
            records.forEach(function (record) {
                var entry = byTarget[record.target.id];
                if (!entry || !record.isIntersecting) return;
                entries.forEach(function (other) {
                    if (other.row === entry.row) other.chip.classList.toggle('active', other === entry);
                });
                // Keep the highlighted chip reachable without hunting for it.
                var strip = entry.chip.parentNode;
                var left = entry.chip.offsetLeft - strip.clientWidth / 2 + entry.chip.clientWidth / 2;
                strip.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
            });
        }, { rootMargin: '-88px 0px -70% 0px', threshold: 0 });

        entries.forEach(function (entry) {
            var node = document.getElementById(entry.target);
            if (node) observer.observe(node);
        });

        // Handed back so a page that rebuilds its index — a stage page does,
        // on every search — can disconnect the one it is replacing.
        return observer;
    };

    /* ---------- what to learn first ---------- */

    // The rules and the patterns each pick the entries to start with. The
    // pick is marked twice: a star with the rank on the entry itself, and a
    // numbered list closing the panel.

    // An example lights up the words that carry the point, so the sentence
    // shows the frame your own words go into. `line.frame` lists them in
    // order, each matched as a whole word — the "a" of "prefiero … a …" is not
    // the one in "playa". resources/spanish/verify.js runs the same search
    // over the files, so a frame that lights nothing fails there.
    var LETTER = /[A-Za-z\u00C0-\u024F]/;

    function findWord(text, word, from) {
        var at = text.indexOf(word, from);
        while (at !== -1) {
            if (!LETTER.test(text.charAt(at - 1)) && !LETTER.test(text.charAt(at + word.length))) return at;
            at = text.indexOf(word, at + 1);
        }
        return -1;
    }

    SP.renderFramed = function (node, line) {
        var text = line.es;
        var pos = 0;
        (line.frame || []).forEach(function (word) {
            var at = findWord(text, word, pos);
            if (at === -1) return;
            if (at > pos) node.appendChild(document.createTextNode(text.slice(pos, at)));
            node.appendChild(SP.el('span', 'sp-frame', word));
            pos = at + word.length;
        });
        if (pos < text.length) node.appendChild(document.createTextNode(text.slice(pos)));
        return node;
    };

    // One example under a parent entry — a pattern's formula or a word of the
    // lists. The Spanish over the Russian on a phone, side by side from 700px
    // up, with whatever tail the caller hands it: a lone speaker for a pattern,
    // nothing at all under a word, where the lines are plain text on the full
    // width and the row above them carries the controls.
    SP.exampleLine = function (line, tools) {
        var row = SP.el('div', 'sp-exline');
        SP.renderFramed(row.appendChild(SP.el('div', 'sp-exline-es')), line);
        row.appendChild(SP.el('div', 'sp-exline-ru', line.ru));
        if (tools) row.appendChild(tools);
        return row;
    };

    // ★ N — the entry's place among the `total` to learn first.
    SP.topBadge = function (rank, total) {
        var badge = SP.el('span', 'sp-badge is-top', '★ ' + rank);
        badge.title = 'ТОП-' + total + ', №' + rank + ' — учить первыми';
        badge.setAttribute('aria-label', badge.title);
        return badge;
    };

    // One row per entry, in rank order: its name (a link to it when `href` is
    // given) → what it comes down to → one short example, which can be heard.
    // rows: [{ name: Node, href?, meaning, short: {es, ru, frame} }]
    SP.renderTopList = function (rows) {
        var list = SP.el('ol', 'sp-top');
        rows.forEach(function (row) {
            var li = SP.el('li', 'sp-top-row');
            var text = SP.el('div', 'sp-top-text');
            var name = row.name;
            if (row.href) {
                var link = SP.el('a', 'sp-top-link');
                link.href = row.href;
                link.appendChild(name);
                name = link;
            }
            text.appendChild(name);
            text.appendChild(SP.el('span', 'sp-top-meaning', row.meaning));
            var example = text.appendChild(SP.el('span', 'sp-top-ex'));
            SP.renderFramed(example.appendChild(SP.el('span', 'sp-top-es')), row.short);
            example.appendChild(SP.el('span', 'sp-top-ru', row.short.ru));
            li.appendChild(text);
            var speak = SP.speakButton(row.short.es);
            if (speak) li.appendChild(speak);
            list.appendChild(li);
        });
        return list;
    };

    /* ---------- rules (phonetics and grammar) ---------- */

    // Rendered both as its own page and as a tab on the hub. It carries no title
    // of its own: on the page the breadcrumb and the tab say what this is, and
    // inside the hub panel a heading only repeated the Rules chip above it.
    // The single option is opts.mainOnly, which keeps the chip index to one row.
    // The sections to learn first carry a `top` rank: a star beside their
    // title, and a list of them — each with its gist and a short example —
    // closing the page, reachable from its own chip.
    // The map of the rules, by layer. It is built here rather than as a block
    // because every tile needs the number, the title and the star of a section,
    // and renderBlocks never sees the file those live in — the same reason the
    // top list is synthesised here too.
    function mapSection(map, sections, topTotal) {
        var byId = {};
        sections.forEach(function (section) { byId[section.id] = section; });
        var block = SP.el('section', 'sp-group');
        block.id = 'esr-map';
        block.appendChild(SP.el('h3', 'sp-group-title', map.title));
        var layers = SP.el('div', 'sp-map');
        (map.layers || []).forEach(function (layer) {
            var box = SP.el('div', 'sp-map-layer');
            box.appendChild(SP.el('div', 'sp-map-title', layer.title));
            if (layer.hint) box.appendChild(SP.el('div', 'sp-map-hint', layer.hint));
            var tiles = SP.el('div', 'sp-map-tiles');
            (layer.ids || []).forEach(function (id) {
                var section = byId[id];
                if (!section) return;
                var tile = SP.el('a', 'sp-chip sp-map-tile');
                tile.href = '#' + id;
                tile.title = section.no + '. ' + section.title;
                tile.appendChild(SP.el('span', 'sp-map-no', section.no + '.'));
                tile.appendChild(SP.el('span', 'sp-chip-label', section.title));
                if (section.top) tile.appendChild(SP.topBadge(section.top, topTotal));
                tiles.appendChild(tile);
            });
            box.appendChild(tiles);
            layers.appendChild(box);
        });
        block.appendChild(layers);
        return block;
    }

    SP.renderRules = function (host, rules, options) {
        var opts = options || {};
        var index = [];
        SP.clear(host);

        var head = SP.el('header');
        SP.renderBlocks(head, rules.intro);
        host.appendChild(head);

        var bar = SP.el('div', 'sp-bar');
        host.appendChild(bar);

        var body = SP.el('div');
        host.appendChild(body);

        var top = rules.sections.filter(function (section) { return section.top; })
            .sort(function (a, b) { return a.top - b.top; });

        // Map first, top list last: what is here → the material → where to start.
        if (rules.map && rules.map.layers && rules.map.layers.length) {
            body.appendChild(mapSection(rules.map, rules.sections, top.length));
            index.push({ row: 'main', label: rules.map.chip || rules.map.title, target: 'esr-map' });
        }

        rules.sections.forEach(function (section) {
            var block = SP.el('section', 'sp-group');
            block.id = section.id;
            var title = block.appendChild(SP.el('h3', 'sp-group-title', section.no + '. ' + section.title));
            if (section.top) title.appendChild(SP.topBadge(section.top, top.length));
            SP.renderBlocks(block, section.blocks);
            (section.parts || []).forEach(function (part) {
                block.appendChild(SP.el('h4', null, part.title));
                SP.renderBlocks(block, part.blocks);
            });
            body.appendChild(block);
            index.push({ row: 'main', label: section.no + '. ' + section.title, target: section.id });
        });

        if (top.length) {
            var label = 'ТОП-' + top.length;
            var first = SP.el('section', 'sp-group');
            first.id = 'esr-top';
            first.appendChild(SP.el('h3', 'sp-group-title', label + ': выучить первыми'));
            first.appendChild(SP.renderTopList(top.map(function (section) {
                return {
                    name: SP.el('span', 'sp-top-title', section.no + '. ' + section.title),
                    href: '#' + section.id,
                    meaning: section.gist,
                    short: section.short
                };
            })));
            body.appendChild(first);
            index.push({ row: 'main', label: label, target: first.id });
        }

        SP.buildIndex(bar, index, opts.mainOnly);
    };

    /* ---------- item rows ---------- */

    // `mark` is the optional learned-toggle built by SP.markButton — every
    // browsable list passes one, the flashcard face does not.
    // A word that carries examples gets a chevron at the head of its tools and
    // a panel under it. A word without them is built exactly as before: no
    // control, and no third button narrowing the text line on a phone.
    var exSeq = 0;

    function examplesToggle(item, row) {
        var panel = SP.el('div', 'sp-exlines');
        panel.id = 'sp-ex-' + (exSeq += 1);
        panel.hidden = true;
        // The lines carry no controls of their own. They are illustrations of
        // the word above them, not entries: the word's own row already holds
        // the speaker and the question, and a tail on every line turned a
        // three-line panel into a column of buttons.
        panel.fill = function () {
            item.ex.forEach(function (line) {
                panel.appendChild(SP.exampleLine(line));
            });
        };

        var btn = SP.el('button', 'sp-ex-toggle');
        btn.type = 'button';
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-controls', panel.id);
        exampleTitle(btn, false);
        btn.appendChild(chevronIcon());
        // The click has to stop here: the whole row is a reveal toggle, and the
        // panel does its own revealing.
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            e.preventDefault();
            SP.setExamplesOpen(row, !row.classList.contains('is-open'));
        });
        return { button: btn, panel: panel };
    }

    SP.renderLexRow = function (item, mark) {
        var row = SP.el('div', 'sp-lex-row' + (item.type === 'pair' ? ' is-pair' : ''));
        var ex = item.ex && item.ex.length ? examplesToggle(item, row) : null;

        // On a phone the four texts read as one wrapping line — "y (и) — and /
        // и" — so they sit in a box of their own; from 700px up that box is
        // display:contents and they go back to being four grid columns.
        // A field is left out when it is empty rather than added blank: the
        // brackets and dashes between them are drawn by CSS from what is there.
        var text = SP.el('div', 'sp-lex-text');
        text.appendChild(SP.el('div', 'sp-lex-es', item.es));
        if (item.tr) text.appendChild(SP.el('div', 'sp-lex-tr', item.tr));
        if (item.en) text.appendChild(SP.el('div', 'sp-lex-en', item.en));
        if (item.ru) text.appendChild(SP.el('div', 'sp-lex-ru', item.ru));
        row.appendChild(text);

        var halves = item.type === 'pair' && item.a && item.b && item.a.es && item.b.es
            ? [item.a.es, item.b.es]
            : null;
        row.appendChild(SP.rowTools(item.es, 'word', ex && ex.button, halves));
        if (ex) row.appendChild(ex.panel);
        return SP.attachMark(row, mark);
    };

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

    window.SP = SP;
})();
