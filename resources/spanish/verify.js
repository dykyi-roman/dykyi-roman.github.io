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

const TEXT_KEYS = ['es', 'en', 'ru', 'tr', 'prompt', 'answer', 'title', 'titleRu', 'goal', 't'];
const BAD_MARKUP = /<[a-z/!][^>]*>|&[a-zA-Z]+;|&#x?[0-9a-fA-F]+;|\*\*/;

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

const REQUIRED = {
    vocab: ['es', 'en', 'ru', 'tr'],
    pair: ['es', 'en', 'ru', 'tr'],
    phrase: ['es', 'ru'],
    exchange: ['es', 'ru'],
    drill: ['prompt', 'answer']
};

const manifest = read('index.json');
if (!manifest) { report(); return; }

if (!Array.isArray(manifest.stages) || manifest.stages.length === 0) fail('index.json: no stages');

const seenIds = Object.create(null);
const itemEs = Object.create(null);   // id -> its Spanish, for the learned.json cross-check
let totalItems = 0;

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
    if (!Array.isArray(stage.items) || stage.items.length === 0) fail(entry.file + ': no items');

    const counts = {};
    const groups = {};
    (stage.groups || []).forEach(g => { groups[g.name] = true; });

    (stage.items || []).forEach((item, i) => {
        const at = entry.file + ' item ' + (item.id || '#' + i);

        if (!item.id) { fail(at + ': no id'); return; }
        if (!item.type) { fail(at + ': no type'); return; }
        if (seenIds[item.id]) { fail('duplicate id ' + item.id + ' (' + seenIds[item.id] + ' and ' + entry.file + ')'); }
        seenIds[item.id] = entry.file;
        itemEs[item.id] = item.es || item.prompt || '';

        if (item.id.indexOf(stage.prefix + '-') !== 0) fail(at + ': id does not start with prefix "' + stage.prefix + '-"');
        if (item.stage !== undefined) fail(at + ': "stage" must not be stored per item — the loader injects it');

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
        }

        if (item.type === 'drill') {
            if (item.kind === 'choice') {
                if (!Array.isArray(item.options) || item.options.length < 2) fail(at + ': choice drill needs at least 2 options');
                else if (item.options.indexOf(item.answer) === -1) fail(at + ': answer "' + item.answer + '" is not among its options');
                if (item.prompt.indexOf('___') === -1) fail(at + ': choice drill prompt has no ___ gap');
            } else if (item.kind !== 'open') {
                fail(at + ': unknown drill kind "' + item.kind + '"');
            }
        }

        if (item.type === 'exchange' && item.es.indexOf(' — ') === -1) {
            fail(at + ': exchange has no " — " turn separator — it is probably a plain phrase');
        }
        if (item.type === 'phrase' && item.es.indexOf(' — ') !== -1) {
            fail(at + ': phrase contains " — " — it is probably an exchange');
        }

        if (item.group && !groups[item.group]) fail(at + ': group "' + item.group + '" is not declared in stage.groups');

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

    (stage.notes || []).forEach((note, i) => {
        const at = entry.file + ' note ' + (note.id || '#' + i);
        if (!note.id) fail(at + ': no id');
        else if (seenIds[note.id]) fail('duplicate id ' + note.id);
        else seenIds[note.id] = entry.file;
        if (!Array.isArray(note.blocks) || note.blocks.length === 0) fail(at + ': no blocks');
    });

    checkStrings(stage, entry.file);
});

const rules = read(manifest.rules ? manifest.rules.file : 'rules.json');
if (rules) {
    if (!Array.isArray(rules.sections) || rules.sections.length === 0) fail('rules.json: no sections');
    (rules.sections || []).forEach(section => {
        if (!section.id) fail('rules.json: section without id');
        else if (seenIds[section.id]) fail('duplicate id ' + section.id);
        else seenIds[section.id] = 'rules.json';
        if (!section.title) fail('rules.json: section ' + section.id + ' has no title');
        const body = (section.blocks || []).length + (section.parts || []).length;
        if (body === 0) fail('rules.json: section ' + section.id + ' is empty');
    });
    if (manifest.rules && manifest.rules.sections !== rules.sections.length) {
        fail('index.json: rules count ' + manifest.rules.sections + ' but rules.json has ' + rules.sections.length);
    }
    checkStrings(rules, 'rules.json');
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
        });
        checkStrings(learned, 'learned.json');
        notes.push(learnedIds.length + ' learned');
    }
}

notes.push(totalItems + ' items, ' + Object.keys(seenIds).length + ' unique ids across ' + manifest.stages.length + ' stages + rules');

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
