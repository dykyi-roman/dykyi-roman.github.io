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

    /* ---------- learned and favorites ---------- */

    // Two different things, deliberately apart:
    //   learned    a hand-kept list in resources/spanish/learned.json — the same
    //              kind of source the words themselves come from, so it reads
    //              the same on every device and is reviewable in the repo;
    //   favorites  what this browser has starred, in localStorage — private to
    //              the device, changed with one tap, gone with the site data.
    // Favorites were called "learned" before the list existed; a record left
    // under the old key is adopted once, so nobody loses their marks.
    var FAV_KEY = 'spanishFavorites';
    var LEGACY_FAV_KEY = 'spanishLearned';
    var favState = null;

    function favRecord() {
        if (!favState) {
            favState = SP.loadState(FAV_KEY, 1);
            if (!favState) {
                var legacy = SP.loadState(LEGACY_FAV_KEY, 1);
                favState = { v: 1, ids: (legacy && legacy.ids) || {}, fold: {} };
                if (legacy) SP.saveState(FAV_KEY, favState);
            }
            if (!favState.ids) favState.ids = {};
            if (!favState.fold) favState.fold = {};
        }
        return favState;
    }

    SP.favorites = {
        // Never pruned: a stage outside the current scope is not loaded, so
        // dropping ids unknown to the page would wipe what it did not fetch.
        has: function (id) { return !!favRecord().ids[id]; },

        // The value is the day it was starred. Nothing reads it yet, but it
        // costs what a boolean costs and answers "since when".
        set: function (id, on) {
            var ids = favRecord().ids;
            if (on) ids[id] = SP.todayStr();
            else delete ids[id];
            SP.saveState(FAV_KEY, favState);
            return on;
        },

        toggle: function (id) { return SP.favorites.set(id, !SP.favorites.has(id)); }
    };

    // Folding a section is one switch for the whole page: every list subscribes
    // and redraws itself, so no two lists can disagree about what is showing.
    var foldListeners = [];

    SP.view = {
        folded: function (kind) { return !!favRecord().fold[kind]; },

        setFolded: function (kind, on) {
            favRecord().fold[kind] = !!on;
            SP.saveState(FAV_KEY, favState);
            foldListeners.forEach(function (fn) { fn(kind, !!on); });
        },

        // Register once per list: a list that re-registers on every render
        // would pile up listeners and redraw itself many times over.
        onFold: function (fn) { foldListeners.push(fn); }
    };

    /* ---------- data loading ---------- */

    SP.base = '../resources/spanish/';   // overridden by each page before load()
    SP.manifest = null;
    SP.stages = {};                      // id -> parsed stage, cached in memory
    SP.rules = null;                     // parsed rules.json, cached in memory

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
        stage.items.forEach(function (item) {
            if (!item.id || !item.type) throw new Error(entry.file + ': incomplete item');
            if (seen[item.id]) throw new Error(entry.file + ': duplicate id ' + item.id);
            seen[item.id] = true;
            item.stage = stage.no;          // injected, never stored in the file
            item.stageId = stage.id;
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

    // The learned list is small, has no stage of its own and is wanted by every
    // page, so it loads beside the manifest rather than with a stage.
    var learnedIds = null;

    SP.loadLearned = function () {
        if (learnedIds) return Promise.resolve(learnedIds);
        return fetchJson(SP.base + 'learned.json').then(function (data) {
            learnedIds = (data && data.ids) || {};
            return learnedIds;
        }).catch(function (e) {
            // A progress file that failed to load must not take the page with
            // it: the words still read fine with an empty Learned section.
            console.error('learned.json did not load — ' + e.message);
            learnedIds = {};
            return learnedIds;
        });
    };

    SP.learned = {
        has: function (id) { return !!(learnedIds && learnedIds[id]); }
    };

    /* ---------- item helpers ---------- */

    SP.TYPE_LABEL = {
        vocab: 'Word',
        pair: 'Pair',
        phrase: 'Phrase',
        exchange: 'Exchange',
        drill: 'Drill'
    };

    // What gets spoken for an item — always the Spanish side.
    SP.spokenText = function (item) {
        if (!item) return '';
        if (item.type === 'drill') return item.answer || '';
        return item.es || '';
    };

    // The Russian side, used as the flashcard back and as a quiz option.
    SP.meaningOf = function (item) { return item.ru || ''; };

    // Items that make sense as a card or a quiz question.
    SP.isStudyable = function (item) {
        return item.type === 'vocab' || item.type === 'pair' || item.type === 'phrase' || item.type === 'exchange';
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

    /* ---------- section headers and the favorite star ---------- */

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

    // Every list is split into the same three sections, in this order.
    SP.SECTIONS = ['learned', 'favorites', 'left'];
    SP.SECTION_LABEL = { learned: 'Learned', favorites: 'Favorites', left: 'Left' };

    // The header of one section: a dashed line naming what follows and how much
    // of it there is. The first two fold — the rest of the list is what you are
    // working through, so it has nothing to fold away. Returns the node plus
    // the one call that keeps the caption true.
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

    // Closes a row with the checkbox, beside the speak button, and flags the row
    // so the CSS gives its grid the extra control column. Call it last: the
    // button goes at the tail of the row, in the DOM as on the screen.
    // A row that can be marked is also a row you can test yourself on, so the
    // reveal listener goes on here too — it does nothing until the row is in
    // one of the two top sections, and the mark and speak buttons stop the
    // click before it reaches the row.
    SP.attachMark = function (row, mark) {
        if (!mark) return row;
        row.classList.add('has-mark');
        row.appendChild(mark);
        attachReveal(row);
        return row;
    };

    function covered(row) {
        return row.classList.contains('is-learned') || row.classList.contains('is-favorite');
    }

    function revealTitle(row) {
        if (!covered(row)) { row.removeAttribute('title'); return; }
        row.title = row.classList.contains('is-revealed') ? 'Hide the translation' : 'Show the translation';
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

    // Which of the three sections a row belongs to, in one place: learned wins
    // over starred, so a word that is both shows once, at the top. A row in
    // either of them covers its translation until it is tapped, and takes the
    // focus so a keyboard can do the same.
    SP.setRowState = function (row, learned, favorite) {
        row.classList.toggle('is-learned', learned);
        row.classList.toggle('is-favorite', !learned && favorite);
        if (covered(row)) {
            row.tabIndex = 0;
        } else {
            row.classList.remove('is-revealed');
            row.removeAttribute('tabindex');
        }
        revealTitle(row);
        return row;
    };

    // A learned row carries no checkbox: it is already at the top, and marking
    // it as a favorite on top of that moves nothing. It keeps the column all
    // the same, so the table stays lined up across the sections.
    SP.markSpacer = function () {
        var span = SP.el('span', 'sp-mark is-empty');
        span.setAttribute('aria-hidden', 'true');
        return span;
    };

    // The 44px checkbox that puts an entry in favorites. A button with
    // aria-pressed rather than a real checkbox, so it sits beside .sp-speak
    // with the same shape and the same touch target.
    SP.markButton = function (item, onChange) {
        var btn = SP.el('button', 'sp-mark');
        btn.type = 'button';
        btn.setAttribute('aria-label', 'Add to favorites');
        btn.appendChild(checkIcon());

        function sync(on) {
            btn.classList.toggle('is-on', on);
            btn.setAttribute('aria-pressed', on ? 'true' : 'false');
            btn.title = on ? 'In favorites — click to remove' : 'Add to favorites';
        }

        sync(SP.favorites.has(item.id));
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            e.preventDefault();
            var on = SP.favorites.toggle(item.id);
            sync(on);
            if (onChange) onChange(on);
        });
        return btn;
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

        if (!('IntersectionObserver' in window)) return;

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
    };

    /* ---------- rules (phonetics and grammar) ---------- */

    // Rendered both as its own page and as a tab on the hub. It carries no title
    // of its own: on the page the breadcrumb and the tab say what this is, and
    // inside the hub panel a heading only repeated the Rules chip above it.
    // The single option is opts.mainOnly, which keeps the chip index to one row.
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

        rules.sections.forEach(function (section) {
            var block = SP.el('section', 'sp-group');
            block.id = section.id;
            block.appendChild(SP.el('h3', 'sp-group-title', section.no + '. ' + section.title));
            SP.renderBlocks(block, section.blocks);
            (section.parts || []).forEach(function (part) {
                block.appendChild(SP.el('h4', null, part.title));
                SP.renderBlocks(block, part.blocks);
            });
            body.appendChild(block);
            index.push({ row: 'main', label: section.no + '. ' + section.title, target: section.id });
        });

        SP.buildIndex(bar, index, opts.mainOnly);
    };

    /* ---------- item rows ---------- */

    // `mark` is the optional learned-toggle built by SP.markButton — every
    // browsable list passes one, the flashcard face does not.
    SP.renderLexRow = function (item, mark) {
        var row = SP.el('div', 'sp-lex-row' + (item.type === 'pair' ? ' is-pair' : ''));

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

        var speak = SP.speakButton(item.es);
        if (speak) row.appendChild(speak);
        return SP.attachMark(row, mark);
    };

    SP.renderExRow = function (item, mark) {
        var row = SP.el('div', 'sp-ex-row' + (item.type === 'exchange' ? ' is-exchange' : ''));
        row.appendChild(SP.el('div', 'sp-ex-es', item.es));
        row.appendChild(SP.el('div', 'sp-ex-ru', item.ru || ''));
        var speak = SP.speakButton(item.es);
        if (speak) row.appendChild(speak);
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
