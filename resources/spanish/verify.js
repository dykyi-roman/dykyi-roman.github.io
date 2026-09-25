'use strict';
/* Invariant checks for the Spanish knowledge base.
   Run from anywhere:  node resources/spanish/verify.js
   The JSON files are the source of truth (no generator), so this is the only
   thing standing between a hand edit and a page that fails quietly. */

const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const problems = [];
const notes = [];

function fail(msg) { problems.push(msg); }
function read(file) {
    const full = path.join(DIR, file);
    if (!fs.existsSync(full)) { fail('missing file: ' + file); return null; }
    try { return JSON.parse(fs.readFileSync(full, 'utf8')); }
    catch (e) { fail(file + ': invalid JSON — ' + e.message); return null; }
}

const TEXT_KEYS = ['es', 'en', 'ru', 'tr', 'prompt', 'answer', 'title', 'titleRu', 'goal', 't', 'set', 'name',
    'how', 'lit', 'trap', 'introTitle',
    // the rules diagrams — a fork and a conjugation grid — and a rule's examples
    'label', 'hint', 'q', 'head', 'inf', 'f', 'stem', 'band', 'hl', 'sound'];
// A single asterisk counts too: "*th*" left over from the markdown is shown
// to the reader as it is, stars and all. Emphasis is a span with s: 'b'.
const BAD_MARKUP = /<[a-z/!][^>]*>|&[a-zA-Z]+;|&#x?[0-9a-fA-F]+;|\*/;
const CYRILLIC = /[Ѐ-ӿ]/;
// What counts as being inside a word, for findWord below. It lives up here
// because checkLine is called from the item loop as well as from the rules and
// the patterns, and a const declared further down is not in scope by then.
const LETTER = /[A-Za-z\u00C0-\u024F]/;

// Walk every string in a structure and reject HTML, entities and stray markdown.
function checkStrings(node, where) {
    if (node === null || node === undefined) return;
    if (typeof node === 'string') {
        if (BAD_MARKUP.test(node)) fail(where + ': markup leaked into text — ' + JSON.stringify(node.slice(0, 80)));
        return;
    }
    if (Array.isArray(node)) { node.forEach((v, i) => checkStrings(v, where + '[' + i + ']')); return; }
    if (typeof node === 'object') {
        Object.keys(node).forEach(k => {
            if (TEXT_KEYS.indexOf(k) !== -1 || typeof node[k] === 'object') checkStrings(node[k], where + '.' + k);
        });
    }
}

// The stages have been renumbered twice, and every "Stage 3" written into the
// prose went on pointing at whatever took that number. Prose names a stage by
// its title instead, which survives a renumbering.
function checkStageNumbers(node, where) {
    if (node === null || node === undefined) return;
    if (typeof node === 'string') {
        if (/\bStage\s*\d/.test(node)) fail(where + ': names a stage by its number — ' + JSON.stringify(node.slice(0, 80)));
        return;
    }
    if (Array.isArray(node)) { node.forEach((v, i) => checkStageNumbers(v, where + '[' + i + ']')); return; }
    if (typeof node === 'object') Object.keys(node).forEach(k => checkStageNumbers(node[k], where + '.' + k));
}

// The kinds SP.renderBlocks knows. A block whose `k` is none of them is
// appended nowhere: a typo drops it off the page and nothing says so, which
// is why an unknown kind is an error rather than a shrug.
const BLOCK_KINDS = ['p', 'note', 'ul', 'ol', 'table', 'fork', 'conj'];

// A filled string, the thing most of the new fields have to be.
function text(value) { return typeof value === 'string' && value.trim() !== ''; }

function checkBlocks(blocks, at) {
    if (blocks === undefined || blocks === null) return;
    if (!Array.isArray(blocks)) { fail(at + ': blocks is not an array'); return; }
    blocks.forEach((block, i) => {
        const where = at + '[' + i + ']';
        if (!block || typeof block !== 'object') { fail(where + ': not a block'); return; }
        if (BLOCK_KINDS.indexOf(block.k) === -1) {
            fail(where + ': unknown block kind ' + JSON.stringify(block.k));
            return;
        }
        if (block.k === 'p' || block.k === 'note') {
            if (!Array.isArray(block.spans) || block.spans.length === 0) fail(where + ': ' + block.k + ' carries no spans');
            if (block.k === 'p') checkExamples(block.ex, where);
            else if (block.ex !== undefined) fail(where + ': a note carries no examples — the renderer draws none under it');
        } else if (block.k === 'ul' || block.k === 'ol') {
            if (!Array.isArray(block.items) || block.items.length === 0) { fail(where + ': ' + block.k + ' carries no items'); return; }
            // A grid of forms (venir → ven) is read at a glance; its examples
            // go together under the «Примеры:» line after it, never per cell.
            if (block.grid !== undefined && block.grid !== true) fail(where + ': "grid" is true or absent');
            block.items.forEach((item, j) => {
                if (!item || !Array.isArray(item.spans) || item.spans.length === 0) fail(where + ' item ' + j + ': carries no spans');
                if (item && block.grid && item.ex !== undefined) fail(where + ' item ' + j + ': a cell of a grid keeps no examples — they go under the «Примеры:» line after it');
                else if (item) checkExamples(item.ex, where + ' item ' + j);
            });
        } else if (block.k === 'fork') {
            checkFork(block, where);
        } else if (block.k === 'conj') {
            checkConj(block, where);
        } else if (block.k === 'table') {
            if (!Array.isArray(block.head) || block.head.length === 0) fail(where + ': table has no head');
            if (!Array.isArray(block.rows) || block.rows.length === 0) { fail(where + ': table has no rows'); return; }
            block.rows.forEach((row, j) => {
                if (!Array.isArray(row)) { fail(where + ' row ' + j + ': is not a row'); return; }
                // A short row leaves a hole the reader reads as a missing answer.
                if (Array.isArray(block.head) && row.length !== block.head.length) {
                    fail(where + ' row ' + j + ': ' + row.length + ' cells, but the head has ' + block.head.length);
                }
            });
        }
    });
}

// A fork draws the choice a rule comes down to. Two or three branches, no
// more: CSS holds exactly three accents, and stacked on a phone a fourth card
// stops reading as a choice at all. A row is the {es, ru, frame} of a usage
// example, so checkLine already knows how to judge it.
function checkFork(block, at) {
    if (!text(block.q)) fail(at + ': a fork needs a "q" — the question it answers');
    if (!Array.isArray(block.cols) || block.cols.length < 2 || block.cols.length > 3) {
        fail(at + ': a fork needs 2 or 3 columns');
        return;
    }
    block.cols.forEach((col, i) => {
        const where = at + ' col ' + (col && col.es ? JSON.stringify(col.es) : '#' + i);
        if (!col || typeof col !== 'object') { fail(where + ': not a column'); return; }
        if (!text(col.es)) fail(where + ': no head word');
        if (!text(col.hint)) fail(where + ': no hint — the sense the branch carries');
        if (!Array.isArray(col.rows) || col.rows.length === 0 || col.rows.length > 6) {
            fail(where + ': a branch needs 1 to 6 rows');
            return;
        }
        col.rows.forEach((row, j) => {
            checkLine(row, where + ' row ' + j, true);
            if (row && row.label !== undefined && !text(row.label)) fail(where + ' row ' + j + ': empty "label"');
        });
    });
}

// A conjugation grid. A cell is an ending under a column that carries a stem,
// or a whole form under one that does not; either way a row must fill every
// column, because a short row leaves a hole that reads as a missing form.
function checkConj(block, at) {
    if (block.rowsHead !== undefined && !text(block.rowsHead)) fail(at + ': empty "rowsHead"');
    if (block.hide !== undefined && !text(block.hide)) fail(at + ': empty "hide" — it is the toggle\'s label');
    if (!Array.isArray(block.cols) || block.cols.length === 0 || block.cols.length > 5) {
        fail(at + ': a grid needs 1 to 5 columns');
        return;
    }
    block.cols.forEach((col, i) => {
        const where = at + ' col ' + (col && col.head ? JSON.stringify(col.head) : '#' + i);
        if (!col || typeof col !== 'object') { fail(where + ': not a column'); return; }
        if (!text(col.head)) fail(where + ': no head');
        ['inf', 'stem'].forEach(k => {
            if (col[k] !== undefined && !text(col[k])) fail(where + ': empty "' + k + '"');
        });
    });
    if (!Array.isArray(block.rows) || block.rows.length === 0 || block.rows.length > 14) {
        fail(at + ': a grid needs 1 to 14 rows');
        return;
    }
    block.rows.forEach((row, j) => {
        const where = at + ' row ' + j;
        if (!row || typeof row !== 'object') { fail(where + ': not a row'); return; }
        // A band names the group the rows under it share; it carries no cells.
        if (row.band !== undefined) {
            if (!text(row.band)) fail(where + ': empty "band"');
            if (row.cells !== undefined) fail(where + ': a band carries no cells');
            return;
        }
        if (!text(row.label)) fail(where + ': no label');
        if (row.ru !== undefined && !text(row.ru)) fail(where + ': empty "ru"');
        if (!Array.isArray(row.cells) || row.cells.length !== block.cols.length) {
            fail(where + ': ' + ((row.cells || []).length) + ' cells, but the grid has ' + block.cols.length + ' columns');
            return;
        }
        row.cells.forEach((cell, i) => {
            const col = block.cols[i];
            const spot = where + ' cell ' + i;
            const raw = (cell && typeof cell === 'object') ? cell : { f: cell };
            if (!text(raw.f)) { fail(spot + ': no form'); return; }
            ['s', 'hl'].forEach(k => {
                if (raw[k] !== undefined && !text(raw[k])) fail(spot + ': empty "' + k + '"');
            });
            // The commonest way to fill such a grid wrong: writing "hablo"
            // where the column already carries "habl" and wants the ending.
            const stem = raw.s !== undefined ? raw.s : col.stem;
            if (text(stem) && raw.f.indexOf(stem) === 0) {
                fail(spot + ': ' + JSON.stringify(raw.f) + ' repeats the stem ' + JSON.stringify(stem) + ' — the cell holds the ending alone');
            }
        });
    });
}

// The rules sections, by id — filled once rules.json is read, for the map
// and for the tenses of verbs.json, which name the section that teaches them.
const ruleIds = Object.create(null);

// The examples a line of a rule keeps under it, behind the chevron at its
// end: the {es, ru, frame?} of a usage example, plus how a reading rule's
// example sounds and the caption over a run of them. Three at the least: a
// chevron that opens on a single line is a button pressed for nothing, and a
// list of forms with one example each becomes a grid with its examples
// together instead. A field the renderer does not know is one the reader
// never sees.
const EX_FIELDS = ['es', 'ru', 'sound', 'label', 'frame'];
const EX_MIN = 3;

function checkExamples(ex, at) {
    if (ex === undefined) return;
    if (!Array.isArray(ex) || ex.length === 0) { fail(at + ': "ex" holds no examples — leave it out instead'); return; }
    if (ex.length < EX_MIN) fail(at + ': ' + ex.length + ' example(s) — a line of a rule keeps at least ' + EX_MIN);
    ex.forEach((line, i) => {
        const where = at + ' ex ' + i;
        checkLine(line, where, true);
        if (!line || typeof line !== 'object') return;
        Object.keys(line).forEach(k => {
            if (EX_FIELDS.indexOf(k) === -1) fail(where + ': unknown field ' + JSON.stringify(k));
        });
        ['sound', 'label'].forEach(k => {
            if (line[k] !== undefined && !text(line[k])) fail(where + ': empty "' + k + '"');
        });
        // The brackets round a sound are drawn by CSS, as the lexicon's are.
        if (text(line.sound) && /^\[|\]$/.test(line.sound.trim())) fail(where + ': "sound" carries its own brackets — the page draws them');
    });
}

// Where a note can be drawn. The Живые примеры section is gone, so a note
// either belongs to a topic of the lexicon or stands on its own at the end.
const NOTE_SECTIONS = ['vocab', 'notes'];

const REQUIRED = {
    vocab: ['es', 'en', 'ru', 'tr'],
    pair: ['es', 'en', 'ru', 'tr'],
    drill: ['prompt', 'answer']
};

const manifest = read('index.json');
if (!manifest) { report(); return; }

if (!Array.isArray(manifest.stages) || manifest.stages.length === 0) fail('index.json: no stages');

const seenIds = Object.create(null);
const itemEs = Object.create(null);   // id -> its Spanish, for the learned.json cross-check
const setEs = Object.create(null);    // id -> its Spanish, for every word of a Reference table
const lexIds = Object.create(null);   // Spanish word -> ids of the lexicon entries that carry it
const groupFile = Object.create(null); // topic name -> the stage file that declares it
const lexForms = Object.create(null);  // normalized word of a lexicon entry -> ids
const exLines = Object.create(null);   // normalized usage example -> ids of the words carrying it
const meanings = Object.create(null);  // normalized Russian side -> ids
const infinitives = Object.create(null); // infinitive -> the ids that carry it, for verbs.json
let totalItems = 0;
let totalWords = 0;      // vocab and pair, the entries a panel of examples can hang under
let wordsWithEx = 0;
let wordsWithThree = 0;

// Spelled the same once case, punctuation and a leading article are set aside.
// Brackets stay: "el cajero (automático)" is not the "cajero" of a till.
function spanishKey(text) {
    return String(text || '').toLowerCase()
        .replace(/[¿?¡!.,…:;«»"]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/^(el|la|los|las|un|una|unos|unas) /, '');
}

function meaningKey(text) {
    return String(text || '').toLowerCase().replace(/[?!.…]+$/g, '').replace(/\s+/g, ' ').trim();
}

function remember(map, key, id) {
    if (!key) return;
    (map[key] = map[key] || []).push(id);
}

// The transcription follows the rules page: "э" for e, a hard "л", the stress
// marked with U+0301 on every word of two syllables or more. A word whose two
// vowels stand apart, or that has three, is sure to have two syllables; two
// vowels side by side may be one (pues, cuál), so those are let through.
const TR_VOWEL = /[аэиоуыеёяю]/;

function checkTranscription(tr, at) {
    if (typeof tr !== 'string' || !tr) return;
    if (/[A-Za-z¿?¡!*]/.test(tr)) fail(at + ': transcription carries Latin letters or punctuation — ' + JSON.stringify(tr));
    if (/[бвгджзклмнпрстфхцчшщ]е/.test(tr)) fail(at + ': transcription writes "е" after a consonant, where it takes "э" — ' + JSON.stringify(tr));
    // "ль" before a vowel is l gliding into i (julio — ху́льо), not a soft l.
    if (/ль(?![яеёиюо])/.test(tr)) fail(at + ': transcription softens l into "ль" — ' + JSON.stringify(tr));
    tr.split(/[\s/]+/).filter(Boolean).forEach(token => {
        const plain = token.replace(/́/g, '');
        const marks = (token.match(/́/g) || []).length;
        const vowels = [];
        Array.from(plain).forEach((ch, i) => { if (TR_VOWEL.test(ch)) vowels.push(i); });
        const syllables = vowels.length >= 3 || (vowels.length === 2 && vowels[1] - vowels[0] > 1);
        if (syllables && marks === 0) fail(at + ': "' + token + '" has no stress mark');
        if (marks > 1) fail(at + ': "' + token + '" has more than one stress mark');
    });
}

function wordKey(es) { return es.trim().toLowerCase(); }

// A lone word ending in -ar/-er/-ir, optionally reflexive. Anything the corpus
// spells that way is a verb and must carry its forms; these are the exceptions.
const INFINITIVE = /^[a-záéíóúüñ]*(?:ar|er|ir|ír)(?:se)?$/i;   // the star, not a plus: `ir` is all ending
const NOT_VERBS = ['ayer'];

(manifest.stages || []).forEach(entry => {
    ['id', 'prefix', 'no', 'title', 'titleRu', 'url', 'file', 'counts'].forEach(k => {
        if (entry[k] === undefined || entry[k] === null || entry[k] === '') {
            fail('index.json: stage ' + entry.id + ' misses "' + k + '"');
        }
    });

    const stage = read(entry.file);
    if (!stage) return;

    if (stage.id !== entry.id) fail(entry.file + ': id "' + stage.id + '" does not match manifest "' + entry.id + '"');
    if (stage.prefix !== entry.prefix) fail(entry.file + ': prefix mismatch');

    // The presentation of a stage is written twice — in the manifest, which
    // draws the hub's chips, and in the stage file itself, which is what a
    // stage page prints in its h2 and title. Renaming or renumbering one and
    // not the other leaves the chip and the page disagreeing, and nothing else
    // notices, so it is checked here.
    ['no', 'title', 'titleRu', 'url'].forEach(k => {
        if (stage[k] !== entry[k]) {
            fail(entry.file + ': "' + k + '" is ' + JSON.stringify(stage[k]) +
                ' but index.json says ' + JSON.stringify(entry[k]));
        }
    });
    // The goal and the number of notes are mirrored into the manifest as well.
    if (stage.goal !== entry.goal) {
        fail(entry.file + ': "goal" is ' + JSON.stringify(stage.goal) + ' but index.json says ' + JSON.stringify(entry.goal));
    }
    if ((stage.notes || []).length !== entry.notes) {
        fail(entry.file + ': has ' + (stage.notes || []).length + ' notes but index.json says ' + entry.notes);
    }
    if (!Array.isArray(stage.items) || stage.items.length === 0) fail(entry.file + ': no items');

    const counts = {};
    const usedGroups = {};
    const usedSets = {};
    const groups = {};
    (stage.groups || []).forEach(g => { groups[g.name] = true; });

    // A stage that gives its topics an icon opens its lexicon on their tiles,
    // one per topic, so it is all or nothing: a topic without one would be a
    // tile with no picture, and a stage with icons on some topics a grid with
    // tiles missing. A word of such a stage that carries no topic has no tile
    // to open under, which the item loop below checks.
    const iconed = (stage.groups || []).filter(g => g && g.icon !== undefined);
    const tiled = iconed.length > 0;
    if (tiled && iconed.length !== (stage.groups || []).length) {
        fail(entry.file + ': some topics carry an icon and some do not — the tiles are all or nothing');
    }
    iconed.forEach(g => {
        if (typeof g.icon !== 'string' || g.icon.trim() === '') fail(entry.file + ': topic "' + g.name + '" has an empty icon');
    });

    // The hub's topic filter keys its options by the bare name, so a name two
    // stages share would fold two topics into one option.
    Object.keys(groups).forEach(name => {
        if (groupFile[name] && groupFile[name] !== entry.file) {
            fail(entry.file + ': topic "' + name + '" is also declared in ' + groupFile[name]);
        }
        groupFile[name] = entry.file;
    });

    // The closed sets Reference draws as tables. Declared once, like the
    // groups, and the order they are declared in is the order they are drawn.
    const sets = {};
    (stage.sets || []).forEach((set, i) => {
        if (!set || typeof set.name !== 'string' || set.name.trim() === '') fail(entry.file + ': set #' + i + ' has no name');
        else if (sets[set.name]) fail(entry.file + ': set "' + set.name + '" is declared twice');
        else sets[set.name] = true;
        // Reference draws every table as a tile, and the tile is its picture.
        if (set && set.name && (typeof set.icon !== 'string' || set.icon.trim() === '')) {
            fail(entry.file + ': set "' + set.name + '" has no icon');
        }
    });

    (stage.items || []).forEach((item, i) => {
        const at = entry.file + ' item ' + (item.id || '#' + i);

        if (!item.id) { fail(at + ': no id'); return; }
        if (!item.type) { fail(at + ': no type'); return; }
        if (seenIds[item.id]) { fail('duplicate id ' + item.id + ' (' + seenIds[item.id] + ' and ' + entry.file + ')'); }
        seenIds[item.id] = entry.file;
        itemEs[item.id] = item.es || item.prompt || '';

        if (item.id.indexOf(stage.prefix + '-') !== 0) fail(at + ': id does not start with prefix "' + stage.prefix + '-"');
        if (item.stage !== undefined) fail(at + ': "stage" must not be stored per item — the loader injects it');
        if (item.setRank !== undefined) fail(at + ': "setRank" must not be stored per item — the loader injects it');

        const required = REQUIRED[item.type];
        if (!required) { fail(at + ': unknown type "' + item.type + '"'); return; }
        required.forEach(k => {
            if (typeof item[k] !== 'string' || item[k].trim() === '') fail(at + ' (' + item.type + '): "' + k + '" is empty');
        });

        if (item.type === 'pair') {
            ['a', 'b'].forEach(side => {
                if (!item[side] || !item[side].es || !item[side].ru) fail(at + ': pair side "' + side + '" is incomplete');
            });
            if (item.a && item.b && item.a.es === item.b.es) fail(at + ': both pair sides are the same word');
            if (!item.pairKind) fail(at + ': pair has no pairKind');

            // The halves are the whole pair cut at " / ". A bracket holding a
            // slash of its own ("врач (м / ж)") is cut in two that way, and each
            // half then reads as nonsense wherever it is shown on its own.
            if (item.a && item.b) {
                ['es', 'en', 'ru', 'tr'].forEach(k => {
                    if (item[k] !== item.a[k] + ' / ' + item.b[k]) {
                        fail(at + ': "' + k + '" is not a.' + k + ' + " / " + b.' + k);
                    }
                    [item.a[k], item.b[k]].forEach(half => {
                        if (typeof half !== 'string') return;
                        const open = (half.match(/\(/g) || []).length;
                        const close = (half.match(/\)/g) || []).length;
                        if (open !== close || half.trim().charAt(0) === '(') {
                            fail(at + ': half "' + k + '" is a broken piece of the pair — ' + JSON.stringify(half));
                        }
                    });
                });
            }
        }

        if (item.type === 'drill') {
            if (item.kind === 'choice') {
                if (!Array.isArray(item.options) || item.options.length < 2) fail(at + ': choice drill needs at least 2 options');
                else if (item.options.indexOf(item.answer) === -1) fail(at + ': answer "' + item.answer + '" is not among its options');
                if (item.prompt.indexOf('___') === -1) fail(at + ': choice drill prompt has no ___ gap');
            } else if (item.kind !== 'open') {
                fail(at + ': unknown drill kind "' + item.kind + '"');
            }
            // A drill is spoken from whichever side is Spanish — the answer of a
            // Russian prompt, the prompt of a Russian answer — so one must be.
            if (CYRILLIC.test(item.prompt) && CYRILLIC.test(item.answer)) {
                fail(at + ': both the prompt and the answer are Russian, so there is nothing to speak');
            }
        }

        if (item.group && !groups[item.group]) fail(at + ': group "' + item.group + '" is not declared in stage.groups');
        if (item.set && !sets[item.set]) fail(at + ': set "' + item.set + '" is not declared in stage.sets');
        if (tiled && (item.type === 'vocab' || item.type === 'pair') && !item.set && !item.group) {
            fail(at + ': carries no topic, and on a stage drawn as tiles that leaves it no tile to open under');
        }
        if (item.group) usedGroups[item.group] = true;
        if (item.set) usedSets[item.set] = true;

        // The usage examples nested under a word — the {es, ru, frame} line the
        // patterns already use, with the frame left optional. They are
        // illustrations, not entries: they carry no id, they never become a
        // card, and they deliberately stay out of `meanings` and `lexForms`
        // below, where three thousand of them would collide on the first day.
        if (item.ex !== undefined) {
            if (item.type !== 'vocab' && item.type !== 'pair') fail(at + ': only a word carries "ex"');
            else if (!Array.isArray(item.ex) || item.ex.length === 0) fail(at + ': "ex" must list between one and three examples');
            else if (item.ex.length > 3) fail(at + ': "ex" has ' + item.ex.length + ' examples — three is the most the panel shows');
            else {
                const ownKey = spanishKey(item.es);
                const here = {};
                item.ex.forEach((line, k) => {
                    checkLine(line, at + ' ex[' + k + ']', true);
                    const key = spanishKey(line && line.es);
                    if (!key) return;
                    if (key === ownKey) fail(at + ' ex[' + k + ']: the example is the word itself, not a use of it');
                    if (here[key] !== undefined) fail(at + ' ex[' + k + ']: repeats ex[' + here[key] + ']');
                    else here[key] = k;
                    remember(exLines, key, item.id);
                });
                wordsWithEx += 1;
                if (item.ex.length === 3) wordsWithThree += 1;
            }
        }
        if (item.type === 'vocab' || item.type === 'pair') totalWords += 1;

        // Every Spanish word a lexicon entry stands for, a pair's halves
        // included — what a word of a set must not share with anything else.
        if (item.type === 'vocab' || item.type === 'pair') {
            [item.es, item.a && item.a.es, item.b && item.b.es].forEach(es => {
                if (typeof es !== 'string' || !es.trim()) return;
                const key = wordKey(es);
                (lexIds[key] = lexIds[key] || []).push(item.id);
            });
        }
        if (item.set) setEs[item.id] = item.es || '';

        if (item.type === 'vocab') checkTranscription(item.tr, at);
        if (item.type === 'pair') [item.a, item.b].forEach(half => checkTranscription(half && half.tr, at));

        // What the duplicate checks below compare: every word a lexicon entry
        // stands for, and the Russian a card is answered with.
        if (item.type === 'vocab') String(item.es || '').split(' / ').forEach(form => remember(lexForms, spanishKey(form), item.id));
        if (item.type === 'pair') [item.a && item.a.es, item.b && item.b.es].forEach(form => remember(lexForms, spanishKey(form), item.id));
        if (item.type === 'vocab' || item.type === 'pair') remember(meanings, meaningKey(item.ru), item.id);

        // Every word that looks like an infinitive, so verbs.json can be
        // checked against the corpus in both directions. A noun carries its
        // article (el lugar, la mujer), which is what keeps this heuristic
        // honest — NOT_VERBS below holds the handful that slip through.
        if (item.type === 'vocab' || item.type === 'pair') {
            [item.es, item.a && item.a.es, item.b && item.b.es].forEach(es => {
                if (typeof es !== 'string') return;
                const word = es.trim();
                if (INFINITIVE.test(word)) remember(infinitives, word, item.id);
            });
        }

        counts[item.type] = (counts[item.type] || 0) + 1;
        totalItems += 1;
    });

    Object.keys(entry.counts).forEach(type => {
        const declared = entry.counts[type];
        const actual = counts[type] || 0;
        if (declared !== actual) fail(entry.file + ': manifest says ' + declared + ' ' + type + ', file has ' + actual);
    });
    Object.keys(counts).forEach(type => {
        if (entry.counts[type] === undefined) fail('index.json: stage ' + entry.id + ' does not count type "' + type + '"');
    });

    // The other direction of the group check above. A topic nobody carries
    // draws no heading and fills no option in the hub's filter — it is simply
    // rot, and it is exactly what a stage is left with when its phrases move
    // into the words they illustrate and take their topics with them.
    Object.keys(groups).forEach(name => {
        if (!usedGroups[name]) fail(entry.file + ': topic "' + name + '" is declared but no item carries it');
    });
    Object.keys(sets).forEach(name => {
        if (!usedSets[name]) fail(entry.file + ': set "' + name + '" is declared but no item carries it');
    });

    (stage.notes || []).forEach((note, i) => {
        const at = entry.file + ' note ' + (note.id || '#' + i);
        if (!note.id) fail(at + ': no id');
        else if (seenIds[note.id]) fail('duplicate id ' + note.id);
        else seenIds[note.id] = entry.file;
        if (!Array.isArray(note.blocks) || note.blocks.length === 0) fail(at + ': no blocks');
        else checkBlocks(note.blocks, at);
        // A note is drawn by its section, and an unknown one is drawn nowhere:
        // it leaves the page without anything being reported.
        if (NOTE_SECTIONS.indexOf(note.section) === -1) fail(at + ': unknown section ' + JSON.stringify(note.section));
        if (note.group && !groups[note.group]) fail(at + ': group "' + note.group + '" is not declared in stage.groups');
    });

    checkBlocks(stage.intro, entry.file + ' intro');
    checkStrings(stage, entry.file);
    checkStageNumbers({ goal: stage.goal, intro: stage.intro, notes: stage.notes, excluded: stage.excluded }, entry.file);
});

/* ---------- what to learn first: the top ranks and their examples ---------- */

// The rules and the patterns each mark the entries to start with by a `top`
// rank, drawn as a star on the entry and on its link in the map. The star
// names its place out of how many, so the ranks run from 1 with no gap.
// An example's `frame` names the words it lights up. Those words must really
// be in it — in order and as whole words, the same search the page runs — or
// the highlight silently lights nothing.

function findWord(text, word, from) {
    let at = text.indexOf(word, from);
    while (at !== -1) {
        if (!LETTER.test(text.charAt(at - 1)) && !LETTER.test(text.charAt(at + word.length))) return at;
        at = text.indexOf(word, at + 1);
    }
    return -1;
}

// `frameOptional` is for the usage examples of a word: a pattern is built from
// fixed words that are always literally in its examples, but a word is not —
// a verb is conjugated ("ser" is nowhere in "Ella es alta"), and an entry like
// "nosotros / nosotras" has two forms and no single one to point at. Where the
// learned word does appear as written, the frame lights it up; where it does
// not, the line goes without rather than not being written at all.
function checkLine(line, at, frameOptional) {
    if (!line || typeof line.es !== 'string' || !line.es.trim() || typeof line.ru !== 'string' || !line.ru.trim()) {
        fail(at + ': needs both "es" and "ru"');
        return;
    }
    if (line.frame === undefined && frameOptional) return;
    if (!Array.isArray(line.frame) || line.frame.length === 0) { fail(at + ': "frame" lists no words'); return; }
    let pos = 0;
    line.frame.forEach(word => {
        const found = typeof word === 'string' && word ? findWord(line.es, word, pos) : -1;
        if (found === -1) fail(at + ': frame word ' + JSON.stringify(word) + ' is not in ' + JSON.stringify(line.es) + ' (in order, as a whole word)');
        else pos = found + word.length;
    });
}

// `ranks` maps a rank to the id holding it, filled by claimRank.
function claimRank(ranks, entry, at) {
    if (!Number.isInteger(entry.top) || entry.top < 1) { fail(at + ': "top" must be a rank from 1'); return; }
    if (ranks[entry.top]) fail(at + ': top rank ' + entry.top + ' is also held by ' + ranks[entry.top]);
    else ranks[entry.top] = entry.id;
}

function checkRanks(ranks, file) {
    const sorted = Object.keys(ranks).map(Number).sort((a, b) => a - b);
    const gap = sorted.findIndex((rank, i) => rank !== i + 1);
    if (gap !== -1) fail(file + ': top ranks must run 1..' + sorted.length + ' — ' + (gap + 1) + ' is missing');
    return sorted.length;
}

// Anchors renderRules synthesises: the key to the transcription and the map.
const RULES_PANEL_IDS = ['esr-key', 'esr-map'];

// The map says which layer each section belongs to. It is one field rather
// than a `layer` on all 39 sections, so the one thing that can go wrong is
// coverage — and that is exactly what a comparison of the two sets catches.
function checkMap(map, sections) {
    const at = 'rules.json map';
    if (!text(map.title)) fail(at + ': no title');
    if (map.chip !== undefined) fail(at + ': "chip" is left over — the rules have no chip index any more');
    if (!Array.isArray(map.layers) || map.layers.length < 2) { fail(at + ': needs at least 2 layers'); return; }
    const placed = Object.create(null);
    map.layers.forEach((layer, i) => {
        const where = at + ' layer ' + (layer && layer.title ? JSON.stringify(layer.title) : '#' + i);
        if (!layer || typeof layer !== 'object') { fail(where + ': not a layer'); return; }
        if (!text(layer.title)) fail(where + ': no title');
        if (layer.hint !== undefined && !text(layer.hint)) fail(where + ': empty "hint"');
        if (!Array.isArray(layer.ids) || layer.ids.length === 0) { fail(where + ': no ids'); return; }
        layer.ids.forEach(id => {
            if (!ruleIds[id]) fail(where + ': no section with id ' + JSON.stringify(id));
            else if (placed[id]) fail(at + ': section ' + id + ' is in two layers — ' + placed[id] + ' and ' + layer.title);
            else placed[id] = layer.title;
        });
    });
    sections.forEach(section => {
        if (section.id && !placed[section.id]) fail(at + ': section ' + section.id + ' (' + section.no + '. ' + section.title + ') is in no layer');
    });
    return Object.keys(placed).length;
}

// A table in a rules section is a reference — the genders, the pronouns, the
// stems. A table with a column of translations is a run of examples, and those
// live under the line they illustrate, behind its chevron, where the reader
// opens them one line at a time.
function checkNoExampleTables(blocks, at) {
    (blocks || []).forEach((block, i) => {
        if (!block || block.k !== 'table' || !Array.isArray(block.head)) return;
        const heads = block.head.map(cell => (cell || []).map(span => span && span.t).join(''));
        if (heads.indexOf('Перевод') !== -1) {
            fail(at + '[' + i + ']: a table of examples (' + heads.join(' | ') + ') — move its rows into "ex" under the line they illustrate');
        }
    });
}

// The key to the transcription: a row per reading rule — the letters, an
// example, how the lists transcribe it, how it sounds. The transcription is
// held to the same rules as every `tr` of the lists, since it is what teaches
// them to read one.
function checkKey(rules) {
    if (rules.intro === undefined) return;
    if (!text(rules.introTitle)) fail('rules.json: "introTitle" is missing — the folded key has nothing to say what it is');
    const table = (rules.intro || []).find(block => block && block.k === 'table');
    if (!table) { fail('rules.json intro: the key is not a table'); return; }
    const col = (table.head || []).findIndex(cell => (cell || []).map(span => span && span.t).join('') === 'Транскрипция');
    if (col === -1) { fail('rules.json intro: the key has no "Транскрипция" column'); return; }
    (table.rows || []).forEach((row, i) => {
        const cell = (row && row[col]) || [];
        checkTranscription(cell.map(span => span && span.t).join(''), 'rules.json intro key row ' + i);
    });
}

const rules = read(manifest.rules ? manifest.rules.file : 'rules.json');
if (rules) {
    const topRanks = {};
    (rules.sections || []).forEach(section => { if (section && section.id) ruleIds[section.id] = true; });
    checkBlocks(rules.intro, 'rules.json intro');
    checkKey(rules);
    if (rules.tables !== undefined) fail('rules.json: "tables" is left over — the examples fold it captioned is gone');
    if (!Array.isArray(rules.sections) || rules.sections.length === 0) fail('rules.json: no sections');
    (rules.sections || []).forEach(section => {
        if (!section.id) fail('rules.json: section without id');
        else if (seenIds[section.id]) fail('duplicate id ' + section.id);
        else seenIds[section.id] = 'rules.json';
        if (RULES_PANEL_IDS.indexOf(section.id) !== -1) fail('rules.json: id "' + section.id + '" is taken by an anchor the renderer draws itself');
        if (!section.title) fail('rules.json: section ' + section.id + ' has no title');
        const body = (section.blocks || []).length + (section.parts || []).length;
        if (body === 0) fail('rules.json: section ' + section.id + ' is empty');
        checkBlocks(section.blocks, 'rules.json section ' + section.id + ' blocks');
        checkNoExampleTables(section.blocks, 'rules.json section ' + section.id + ' blocks');
        (section.parts || []).forEach((part, i) => {
            const partAt = 'rules.json section ' + section.id + ' part ' + (part && part.title ? JSON.stringify(part.title) : '#' + i);
            if (!part || !part.title) fail(partAt + ': no title');
            if (!part || !Array.isArray(part.blocks) || part.blocks.length === 0) fail(partAt + ': no blocks');
            else {
                checkBlocks(part.blocks, partAt);
                checkNoExampleTables(part.blocks, partAt);
            }
        });

        // A section to learn first wears a star with its rank, beside its title
        // and on the map. The list that once closed the page — each section with
        // a gist and a short example — is gone, and so are the two fields.
        const at = 'rules.json section ' + section.id;
        if (section.top !== undefined) claimRank(topRanks, section, at);
        if (section.gist !== undefined || section.short !== undefined) {
            fail(at + ': "gist" and "short" are left over — the rules draw no top list any more');
        }
    });
    const ranked = checkRanks(topRanks, 'rules.json');
    if (manifest.rules && manifest.rules.sections !== rules.sections.length) {
        fail('index.json: rules count ' + manifest.rules.sections + ' but rules.json has ' + rules.sections.length);
    }
    if (rules.map) {
        const placed = checkMap(rules.map, rules.sections || []);
        if (placed) notes.push('the map covers ' + placed + ' rules in ' + rules.map.layers.length + ' layers');
    }
    checkStrings(rules, 'rules.json');
    checkStageNumbers(rules, 'rules.json');
    if (ranked) notes.push(ranked + ' rules starred to learn first');
    let ruleLines = 0;
    let ruleExamples = 0;
    const countEx = blocks => (blocks || []).forEach(block => {
        if (!block) return;
        if (block.k === 'p' && block.ex) { ruleLines += 1; ruleExamples += block.ex.length; }
        (block.items || []).forEach(item => { if (item && item.ex) { ruleLines += 1; ruleExamples += item.ex.length; } });
    });
    (rules.sections || []).forEach(section => {
        countEx(section.blocks);
        (section.parts || []).forEach(part => countEx(part && part.blocks));
    });
    notes.push(ruleLines + ' lines of the rules keep ' + ruleExamples + ' examples behind a chevron');
}

/* ---------- patterns.json: the conversational patterns ---------- */

// Reference like the rules, read theme by theme in the hub's Patterns panel.
// Each pattern is a formula with its meaning, an explanation and exactly two
// examples, each lighting up the words of the formula it contains.
const PANEL_IDS = ['esp-map', 'esp-contrasts'];   // anchors the panel draws for itself

const patterns = manifest.patterns ? read(manifest.patterns.file) : null;
if (patterns) {
    const claim = (id, at) => {
        if (!id) { fail(at + ': no id'); return; }
        if (seenIds[id]) fail('duplicate id ' + id + ' (' + seenIds[id] + ' and patterns.json)');
        else seenIds[id] = 'patterns.json';
        if (id.indexOf('esp-') !== 0) fail(at + ': id does not start with "esp-"');
        if (PANEL_IDS.indexOf(id) !== -1) fail(at + ': id "' + id + '" is taken by an anchor of the panel');
    };
    let count = 0;
    const topRanks = {};

    if (!Array.isArray(patterns.themes) || patterns.themes.length === 0) fail('patterns.json: no themes');
    (patterns.themes || []).forEach((theme, t) => {
        const at = 'patterns.json theme ' + (theme.id || '#' + t);
        claim(theme.id, at);
        if (!theme.title) fail(at + ': no title');
        if (theme.no !== t + 1) fail(at + ': "no" is ' + theme.no + ' but the theme is #' + (t + 1));
        if (!Array.isArray(theme.items) || theme.items.length === 0) { fail(at + ': no items'); return; }

        theme.items.forEach((item, i) => {
            const where = 'patterns.json item ' + (item.id || theme.id + '#' + i);
            claim(item.id, where);
            count += 1;
            ['es', 'ru', 'how'].forEach(k => {
                if (typeof item[k] !== 'string' || item[k].trim() === '') fail(where + ': "' + k + '" is empty');
            });
            ['lit', 'trap'].forEach(k => {
                if (item[k] !== undefined && (typeof item[k] !== 'string' || item[k].trim() === '')) fail(where + ': "' + k + '" is empty');
            });
            if (!Array.isArray(item.ex) || item.ex.length !== 2) fail(where + ': needs exactly two examples in "ex"');
            else item.ex.forEach((line, n) => checkLine(line, where + ' ex[' + n + ']'));

            if (item.top !== undefined) claimRank(topRanks, item, where);
            // The panel closed with a top list once, a short example to each
            // ranked pattern; the list is gone, and the field with it.
            if (item.short !== undefined) fail(where + ': "short" is left over — the patterns draw no top list any more');
        });
    });
    const ranked = checkRanks(topRanks, 'patterns.json');

    (patterns.contrasts || []).forEach((note, i) => {
        const at = 'patterns.json contrast ' + (note.id || '#' + i);
        claim(note.id, at);
        if (!note.title) fail(at + ': no title');
        if (!Array.isArray(note.blocks) || note.blocks.length === 0) fail(at + ': no blocks');
        else checkBlocks(note.blocks, at);
    });

    if (manifest.patterns.count !== count) {
        fail('index.json: patterns count ' + manifest.patterns.count + ' but patterns.json has ' + count);
    }
    ['title', 'titleRu'].forEach(k => {
        if (patterns[k] !== manifest.patterns[k]) {
            fail('patterns.json: "' + k + '" is ' + JSON.stringify(patterns[k]) + ' but index.json says ' + JSON.stringify(manifest.patterns[k]));
        }
    });
    checkStrings(patterns, 'patterns.json');
    checkStageNumbers(patterns, 'patterns.json');
    notes.push(count + ' patterns, ' + ranked + ' ranked to learn first');
}

/* ---------- a word of a set lives in its table and nowhere else ---------- */

// Reference gathers the closed sets — days, months, numbers — into tables so
// that their words are not also scattered through the lists. The same Spanish
// in another entry, or in either half of a pair, in any stage, is a duplicate.
const setIds = Object.keys(setEs);
setIds.forEach(id => {
    const others = (lexIds[wordKey(setEs[id])] || []).filter(other => other !== id);
    if (others.length) fail(id + ' ("' + setEs[id] + '") is in a set but also lives in ' + others.join(', '));
});
if (setIds.length) notes.push(setIds.length + ' in sets');

/* ---------- no entry twice ---------- */

// The same word in two cards splits its progress between two Leitner boxes,
// and two cards with the same Russian cannot be answered from the Russian
// side: "там" is ahí and allí alike. Homonyms — one spelling, two words — are
// the exception, and are listed by name.
const HOMONYMS = ['claro', 'salida', 'verdad', 'cómo', 'perdón', 'no', 'este', 'caja', 'comedor',
    'primero', 'segundo', 'cuarto', 'tirar', 'seco'];

// And so are the six question words, which are taught twice on purpose: as
// words of Bind, where the stage teaches asking, and again as the contrast
// pairs of Pairs — что/кто, где/когда, как/почему — which is the one thing a
// pair does that a word cannot. Two entries mean two Leitner boxes, and that
// is both the price and the point: the word and the contrast are learnt apart.
// Nothing else may be doubled. A word that turns up twice without being named
// here is a mistake, not an entry.
const ECHOES = ['qué', 'quién', 'dónde', 'cuándo', 'cómo', 'por qué'];

function distinct(ids) { return ids.filter((id, i) => ids.indexOf(id) === i); }

Object.keys(lexForms).forEach(key => {
    const ids = distinct(lexForms[key]);
    if (ids.length > 1 && HOMONYMS.indexOf(key) === -1 && ECHOES.indexOf(key) === -1) {
        fail('"' + key + '" is a word of more than one entry: ' + ids.join(', '));
    }
});
// An echo is exactly two entries — the word and the pair. One means the pair
// has gone and the exemption is now covering nothing; three means the escape
// hatch is being leant on.
ECHOES.forEach(key => {
    const ids = distinct(lexForms[key] || []);
    if (ids.length !== 2) fail('"' + key + '" is listed as taught twice but has ' + ids.length + ': ' + (ids.join(', ') || 'none'));
});
// No sentence is written twice. Three thousand usage examples put in by hand
// repeat themselves otherwise, and one sentence illustrating two words teaches
// neither of them.
Object.keys(exLines).forEach(key => {
    const ids = distinct(exLines[key]);
    if (ids.length > 1) fail('the example "' + key + '" is used by more than one word: ' + ids.join(', '));
});
Object.keys(meanings).forEach(key => {
    const ids = distinct(meanings[key]);
    if (ids.length > 1) fail('"' + key + '" is the Russian of more than one entry: ' + ids.join(', '));
});

/* ---------- verbs.json: three tenses of every verb in the corpus ---------- */

// Checked against the corpus in both directions: a verb with no forms would
// draw an empty fold, and forms for a word that has left the files would sit
// there unread. The key is the infinitive exactly as the entry spells it, so a
// reflexive carries its -se here and its pronoun in every form.
const REFLEXIVE_PRONOUNS = ['me', 'te', 'se', 'nos', 'os', 'se'];
const SPANISH_FORM = /^[a-záéíóúüñ]+(?: [a-záéíóúüñ]+)?$/;

const verbsEntry = manifest.verbs;
if (!verbsEntry) {
    fail('index.json: no "verbs" entry — the forms would never load');
} else {
    const verbs = read(verbsEntry.file);
    if (verbs) {
        ['title', 'titleRu'].forEach(k => {
            if (verbs[k] !== verbsEntry[k]) {
                fail(verbsEntry.file + ': "' + k + '" is ' + JSON.stringify(verbs[k]) +
                    ' but index.json says ' + JSON.stringify(verbsEntry[k]));
            }
        });

        const persons = verbs.persons || [];
        if (persons.length !== 6) fail(verbsEntry.file + ': needs 6 persons, has ' + persons.length);
        persons.forEach((person, i) => {
            ['short', 'full'].forEach(k => {
                if (!text(person[k])) fail(verbsEntry.file + ': person ' + (i + 1) + ' has no "' + k + '"');
            });
        });

        // A tense names the rules section that teaches it, so a table of forms
        // can never get ahead of what the rules cover.
        const tenses = verbs.tenses || [];
        if (tenses.length !== 3) fail(verbsEntry.file + ': needs 3 tenses, has ' + tenses.length);
        tenses.forEach(tense => {
            ['key', 'ru', 'es', 'hint', 'ref'].forEach(k => {
                if (!text(tense[k])) fail(verbsEntry.file + ': tense ' + JSON.stringify(tense.key) + ' has no "' + k + '"');
            });
            if (tense.ref && !ruleIds[tense.ref]) {
                fail(verbsEntry.file + ': tense ' + JSON.stringify(tense.key) + ' points at ' + tense.ref + ', which is not a rules section');
            }
        });

        const kinds = Object.create(null);
        (verbs.kinds || []).forEach(kind => {
            ['key', 'ru', 'hint'].forEach(k => {
                if (!text(kind[k])) fail(verbsEntry.file + ': a kind has no "' + k + '"');
            });
            if (kinds[kind.key]) fail(verbsEntry.file + ': kind ' + kind.key + ' is declared twice');
            kinds[kind.key] = true;
        });

        const list = verbs.verbs || [];
        if (list.length !== verbsEntry.count) {
            fail('index.json says ' + verbsEntry.count + ' verbs, ' + verbsEntry.file + ' has ' + list.length);
        }

        const seenVerbs = Object.create(null);
        const usedKinds = Object.create(null);
        let previous = '';
        list.forEach(verb => {
            const es = verb.es;
            const at = verbsEntry.file + ' (' + (es || '?') + ')';
            if (!text(es)) { fail(at + ': no "es"'); return; }
            if (seenVerbs[es]) { fail(at + ': listed twice'); return; }
            seenVerbs[es] = true;
            // Alphabetical, so a hand edit has one obvious place to go and a
            // verb cannot be added twice under two different spellings.
            if (previous && es.localeCompare(previous, 'es') < 0) {
                fail(at + ': out of alphabetical order — comes after "' + previous + '"');
            }
            previous = es;

            if (!INFINITIVE.test(es)) fail(at + ': not an infinitive');
            if (!kinds[verb.kind]) fail(at + ': unknown kind ' + JSON.stringify(verb.kind));
            usedKinds[verb.kind] = true;

            if (!infinitives[es]) {
                fail(at + ': no entry in any stage carries this word');
            }

            const reflexive = es.endsWith('se') && es !== 'ser';
            tenses.forEach(tense => {
                const forms = verb[tense.key];
                if (!Array.isArray(forms) || forms.length !== 6) {
                    fail(at + ': "' + tense.key + '" must be 6 forms, has ' + (Array.isArray(forms) ? forms.length : 'none'));
                    return;
                }
                forms.forEach((form, i) => {
                    if (!text(form)) { fail(at + ': "' + tense.key + '" form ' + (i + 1) + ' is empty'); return; }
                    if (!SPANISH_FORM.test(form)) fail(at + ': "' + form + '" is not a Spanish form');
                    // A reflexive is stored with its pronoun and nothing else
                    // is, so neither can be written the other way by mistake.
                    const pronoun = REFLEXIVE_PRONOUNS[i] + ' ';
                    if (reflexive && form.slice(0, pronoun.length) !== pronoun) {
                        fail(at + ': "' + form + '" should start with "' + pronoun + '"');
                    }
                    if (!reflexive && form.indexOf(' ') !== -1) fail(at + ': "' + form + '" is two words but the verb is not reflexive');
                });
            });
        });

        // A kind nobody uses is a label that never reaches the screen.
        Object.keys(kinds).forEach(key => {
            if (!usedKinds[key]) fail(verbsEntry.file + ': kind ' + key + ' is declared but carried by no verb');
        });

        // The other direction: every infinitive in the stages has its forms.
        Object.keys(infinitives).forEach(es => {
            if (seenVerbs[es] || NOT_VERBS.indexOf(es) !== -1) return;
            fail(verbsEntry.file + ': "' + es + '" (' + distinct(infinitives[es]).join(', ') + ') has no forms');
        });

        checkStrings(verbs, verbsEntry.file);
        notes.push(list.length + ' verbs with forms (' +
            Object.keys(kinds).map(key => list.filter(v => v.kind === key).length + ' ' + key).join(', ') + ')');
    }
}

/* ---------- learned.json: the hand-kept list of what is learned ---------- */

// It holds ids, not words, so a word can be reworded without losing its place
// in the list. The value beside each id is the Spanish it points at — there to
// be read by a human, and checked here so the two cannot drift apart.
const learned = read('learned.json');
if (learned) {
    if (!learned.ids || typeof learned.ids !== 'object' || Array.isArray(learned.ids)) {
        fail('learned.json: "ids" must be an object of id -> Spanish');
    } else {
        const learnedIds = Object.keys(learned.ids);
        learnedIds.forEach(id => {
            if (!seenIds[id]) { fail('learned.json: unknown id ' + id); return; }
            const es = learned.ids[id];
            if (typeof es !== 'string' || !es) { fail('learned.json: ' + id + ' has no Spanish beside it'); return; }
            if (es !== itemEs[id]) {
                fail('learned.json: ' + id + ' says ' + JSON.stringify(es) + ' but the item is ' + JSON.stringify(itemEs[id]));
            }
            if (setEs[id] !== undefined) {
                fail('learned.json: ' + id + ' belongs to a set — Reference wins, so it would never show as learned');
            }
        });
        checkStrings(learned, 'learned.json');
        notes.push(learnedIds.length + ' learned');
    }
}

notes.push(wordsWithEx + ' of ' + totalWords + ' words carry examples (' + wordsWithThree +
    ' with three), ' + Object.keys(exLines).length + ' example sentences');
notes.push(totalItems + ' items, ' + Object.keys(seenIds).length + ' unique ids across ' + manifest.stages.length +
    ' stages + rules' + (patterns ? ' + patterns' : ''));

function report() {
    notes.forEach(n => console.log('  ' + n));
    if (problems.length === 0) {
        console.log('OK — all invariants hold');
        process.exit(0);
    }
    console.error('\n' + problems.length + ' problem(s):');
    problems.forEach(p => console.error('  - ' + p));
    process.exit(1);
}

report();
