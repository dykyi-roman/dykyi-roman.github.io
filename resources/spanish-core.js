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

    /* ---------- search ---------- */

    // Fold case, ё→е and Spanish accents so "donde" finds "dónde".
    SP.normalizeQuery = function (text) {
        var s = String(text == null ? '' : text).toLowerCase().replace(/ё/g, 'е');
        if (String.prototype.normalize) s = s.normalize('NFD').replace(/[̀-ͯ]/g, '');
        return s;
    };

    /* ---------- data loading ---------- */

    SP.base = '../resources/spanish/';   // overridden by each page before load()
    SP.manifest = null;
    SP.stages = {};                      // id -> parsed stage, cached in memory

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
        return fetchJson(SP.base + 'rules.json');
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
        var tbody = SP.el('tbody');
        (block.rows || []).forEach(function (row) {
            var tr = SP.el('tr');
            row.forEach(function (cell) { SP.renderSpans(tr.appendChild(SP.el('td')), cell); });
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

    /* ---------- item rows ---------- */

    SP.renderLexRow = function (item) {
        var row = SP.el('div', 'sp-lex-row' + (item.type === 'pair' ? ' is-pair' : ''));
        row.appendChild(SP.el('div', 'sp-lex-es', item.es));
        row.appendChild(SP.el('div', 'sp-lex-tr', item.tr || ''));
        row.appendChild(SP.el('div', 'sp-lex-ru', item.ru || ''));
        row.appendChild(SP.el('div', 'sp-lex-en', item.en || ''));
        var speak = SP.speakButton(item.es);
        if (speak) row.appendChild(speak);
        return row;
    };

    SP.renderExRow = function (item) {
        var row = SP.el('div', 'sp-ex-row' + (item.type === 'exchange' ? ' is-exchange' : ''));
        row.appendChild(SP.el('div', 'sp-ex-es', item.es));
        row.appendChild(SP.el('div', 'sp-ex-ru', item.ru || ''));
        var speak = SP.speakButton(item.es);
        if (speak) row.appendChild(speak);
        return row;
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
