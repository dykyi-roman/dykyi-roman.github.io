/* Renders the Spanish reference pages from JSON:
   - a stage page when #sp-root carries data-stage="N"
   - the phonetics/grammar page when it carries data-rules
   Both get a sticky two-row chip index that stays put on a phone instead of
   collapsing into a floating overlay; the index and the rules renderer itself
   live in spanish-core.js, because the hub renders the rules in a tab too.
   Every list on a stage page — words, live examples and drills alike — carries
   the pending checkbox and is split into Learned, Pending and the rest.
   The rules page has no items and so has no checkboxes. */

(function () {
    'use strict';

    var SP = window.SP;
    var PAGE_SIZE = 100;
    var PAGE_STEP = 200;

    function sectionShell(id, title, count) {
        var section = SP.el('section', 'sp-section');
        section.id = id;
        var h = SP.el('h3', null, title);
        if (count) {
            var badge = SP.el('span', null, ' (' + count + ')');
            badge.style.color = 'var(--color-text-light)';
            badge.style.fontWeight = 'normal';
            badge.style.fontSize = '0.7em';
            h.appendChild(badge);
        }
        section.appendChild(h);
        return section;
    }

    /* ---------- lists split into learned, pending and the rest ---------- */

    // Every list is drawn as three sections in the same order: what the learned
    // list holds, what this browser has marked as pending, then everything
    // else. Each section has a header naming it and counting it, and the first
    // two fold. Marking a row moves it across on the spot — the order holds
    // without a reload — and a learned row does not move at all, because it is
    // already above. Folded, a section is not drawn rather than hidden with CSS:
    // otherwise a page of a long list could be spent on rows nobody sees.
    // Long lists are still drawn a page at a time: stage 2 runs to 634 words.
    //
    // opts.zone  () -> the container for one section (div.sp-lex, div.sp-ex, ol)
    // opts.row   (item, mark) -> the row element
    // opts.pageSize / opts.pageStep  omitted means "draw everything at once"
    function renderMarkedList(parent, items, opts) {
        var pageSize = opts.pageSize || items.length;
        var pageStep = opts.pageStep || pageSize;

        var heads = {};
        var zones = {};
        SP.SECTIONS.forEach(function (kind) {
            heads[kind] = SP.sectionDivider(kind);
            zones[kind] = opts.zone();
            parent.appendChild(heads[kind].node);
            parent.appendChild(zones[kind]);
        });

        var more = SP.el('button', 'sp-btn');
        more.type = 'button';
        parent.appendChild(more);

        var counts = { learned: 0, pending: 0, left: 0 };
        var plan = [];        // [{item, kind}] — what this pass draws, in order
        var shown = 0;

        function sync() {
            var above = counts.learned + counts.pending;
            SP.SECTIONS.forEach(function (kind) {
                heads[kind].sync(counts[kind]);
                // An empty section needs no header, and the rest of the list
                // needs one only once something sits above it.
                heads[kind].node.hidden = kind === 'left' ? above === 0 : counts[kind] === 0;
            });
            // An ordered section (the drills) numbers what is on screen, running
            // on from one section into the next.
            var n = 1;
            SP.SECTIONS.forEach(function (kind) {
                if (zones[kind].tagName === 'OL') zones[kind].start = n;
                if (!SP.view.folded(kind)) n += counts[kind];
            });
        }

        function move(row, item, marked) {
            // A learned word stays put: the checkbox only decorates it.
            if (SP.learned.has(item.id)) return;
            counts.pending += marked ? 1 : -1;
            counts.left += marked ? -1 : 1;
            if (marked && SP.view.folded('pending')) row.remove();
            else if (marked) zones.pending.appendChild(row);
            else zones.left.insertBefore(row, zones.left.firstChild);
            sync();
        }

        function buildRow(item) {
            var row, tag;
            var learned = SP.learned.has(item.id);
            var mark = learned ? SP.markSpacer() : SP.markButton(item, function (on) {
                SP.setRowState(row, learned, on);
                SP.setSectionTag(tag, on ? 'pending' : 'left');
                move(row, item, on);
            });
            row = opts.row(item, mark);
            SP.setRowState(row, learned, SP.pending.has(item.id));
            // Only in a search: browsing whole, the header above the row says
            // the same thing and the tag would just repeat it on every line.
            if (opts.tagged) {
                tag = SP.tagRow(row, learned ? 'learned' : (SP.pending.has(item.id) ? 'pending' : 'left'));
            }
            return row;
        }

        // `plan` is a snapshot, so a row marked meanwhile does not disturb the
        // sections the remaining pages are drawn into.
        function draw() {
            var next = Math.min(plan.length, shown + (shown === 0 ? pageSize : pageStep));
            var frags = {};
            SP.SECTIONS.forEach(function (kind) { frags[kind] = document.createDocumentFragment(); });
            for (var i = shown; i < next; i++) frags[plan[i].kind].appendChild(buildRow(plan[i].item));
            SP.SECTIONS.forEach(function (kind) { zones[kind].appendChild(frags[kind]); });
            shown = next;
            if (shown >= plan.length) {
                more.hidden = true;
            } else {
                more.hidden = false;
                more.textContent = 'Show ' + Math.min(pageStep, plan.length - shown) + ' more (' + (plan.length - shown) + ' left)';
            }
        }

        // A full redraw from the lists as they stand — the first render and
        // every fold after it.
        function build() {
            var buckets = { learned: [], pending: [], left: [] };
            items.forEach(function (item) {
                var kind = SP.learned.has(item.id) ? 'learned'
                    : (SP.pending.has(item.id) ? 'pending' : 'left');
                buckets[kind].push(item);
            });
            plan = [];
            SP.SECTIONS.forEach(function (kind) {
                SP.clear(zones[kind]);
                counts[kind] = buckets[kind].length;
                if (SP.view.folded(kind)) return;
                buckets[kind].forEach(function (item) { plan.push({ item: item, kind: kind }); });
            });
            shown = 0;
            draw();
            sync();
        }

        more.addEventListener('click', draw);
        SP.view.onFold(build);
        build();
    }

    function lexZone() { return SP.el('div', 'sp-lex'); }
    function exZone() { return SP.el('div', 'sp-ex'); }
    function drillZone() { return SP.el('ol', 'sp-drills'); }

    // A drill keeps its answer folded away; the learned checkbox joins the
    // answer and speak buttons rather than the text, so the list marker and
    // the prompt stay on one line.
    function drillRow(item, mark) {
        var li = SP.el('li', 'sp-drill');
        li.appendChild(SP.el('span', null, item.prompt));

        if (item.kind === 'choice' && item.options) {
            li.appendChild(document.createTextNode(' '));
            li.appendChild(SP.el('span', 'sp-es', '(' + item.options.join(' / ') + ')'));
        }

        var answer = SP.el('div', 'sp-es sp-drill-answer');
        answer.textContent = item.answer;
        answer.hidden = true;

        var reveal = SP.el('button', 'sp-btn', 'Show answer');
        reveal.type = 'button';
        reveal.addEventListener('click', function () {
            answer.hidden = !answer.hidden;
            reveal.textContent = answer.hidden ? 'Show answer' : 'Hide answer';
        });

        var actions = SP.el('div', 'sp-drill-actions');
        actions.appendChild(reveal);
        var speak = SP.speakButton(item.answer, 'Listen to the answer');
        if (speak) actions.appendChild(speak);
        if (mark) actions.appendChild(mark);

        li.appendChild(answer);
        li.appendChild(actions);
        return li;
    }

    /* ---------- stage page ---------- */

    function renderStage(root, stage) {
        SP.clear(root);

        var head = SP.el('header');
        var title = SP.el('h2');
        var icon = SP.iconSpan(stage.icon);
        if (icon) title.appendChild(icon);
        title.appendChild(document.createTextNode('Stage ' + stage.no + ' — ' + stage.title));
        head.appendChild(title);
        head.appendChild(SP.el('p', 'sp-intro', stage.titleRu));
        if (stage.goal) head.appendChild(SP.el('p', 'sp-intro', 'Цель: ' + stage.goal));
        SP.renderBlocks(head, stage.intro);
        root.appendChild(head);

        // The search shares its strip with the switch of the side a covered
        // row hides, as it does on the hub — every list on the page has rows
        // to cover, and the bar is where the switch stays in reach.
        var bar = SP.el('div', 'sp-bar');
        var search = SP.searchBox('Search this stage', draw);
        var searchRow = SP.el('div', 'sp-search-row');
        var chips = SP.el('div');
        searchRow.appendChild(search.node);
        searchRow.appendChild(SP.coverSwitch());
        bar.appendChild(searchRow);
        bar.appendChild(chips);
        root.appendChild(bar);

        var body = SP.el('div');
        root.appendChild(body);

        // The chip index is rebuilt with the body, so the strip always names
        // the sections that are actually on screen; the observer of the index
        // it replaces is disconnected rather than left watching removed nodes.
        var spy = null;

        function draw() {
            var query = search.query();
            SP.clear(body);
            SP.clear(chips);
            if (spy) { spy.disconnect(); spy = null; }
            var index = renderSections(body, stage, query);
            if (!index.length) {
                body.appendChild(SP.el('p', 'sp-empty', 'Nothing matches.'));
                return;
            }
            spy = SP.buildIndex(chips, index, root.dataset.index === 'sections');
        }

        draw();
        document.title = 'Stage ' + stage.no + ': ' + stage.title + ' - Spanish | Dykyi Roman';
    }

    // Everything below the header, for the whole stage or for what a search
    // leaves of it. Returns the chip index of the sections it drew.
    function renderSections(body, stage, query) {
        var index = [];
        var items = stage.items.filter(function (item) { return SP.matches(item, query); });

        /* lexicon */
        var lex = items.filter(function (i) { return i.type === 'vocab' || i.type === 'pair'; });
        if (lex.length) {
            var lexSection = sectionShell('sec-lex', 'Лексика', lex.length);
            index.push({ row: 'main', label: 'Лексика', target: 'sec-lex' });

            var lexGroups = [];
            var byGroup = {};
            lex.forEach(function (item) {
                var key = item.group || '';
                if (!byGroup[key]) { byGroup[key] = []; lexGroups.push(key); }
                byGroup[key].push(item);
            });

            var notesByGroup = {};
            (stage.notes || []).forEach(function (note) {
                if (note.section === 'vocab' && note.group) notesByGroup[note.group] = note;
            });

            lexGroups.forEach(function (name, i) {
                var block = SP.el('div', 'sp-group');
                if (name) {
                    block.id = 'lex-' + i;
                    var title = SP.el('h4', 'sp-group-title', name + ' ');
                    title.appendChild(SP.el('span', null, byGroup[name].length));
                    block.appendChild(title);
                    index.push({ row: 'sub', label: name, target: block.id });
                }
                renderMarkedList(block, byGroup[name], {
                    zone: lexZone,
                    row: SP.renderLexRow,
                    tagged: !!query,
                    pageSize: PAGE_SIZE,
                    pageStep: PAGE_STEP
                });
                if (notesByGroup[name]) block.appendChild(SP.renderNote(notesByGroup[name]));
                lexSection.appendChild(block);
            });

            (stage.notes || []).forEach(function (note) {
                if (note.section === 'vocab' && !note.group) lexSection.appendChild(SP.renderNote(note));
            });
            body.appendChild(lexSection);
        }

        /* examples */
        var ex = items.filter(function (i) { return i.type === 'phrase' || i.type === 'exchange'; });
        if (ex.length) {
            var exSection = sectionShell('sec-ex', 'Живые примеры', ex.length);
            index.push({ row: 'main', label: 'Примеры', target: 'sec-ex' });

            var exGroups = [];
            var exByGroup = {};
            ex.forEach(function (item) {
                var key = item.group || '';
                if (!exByGroup[key]) { exByGroup[key] = []; exGroups.push(key); }
                exByGroup[key].push(item);
            });

            var exNotes = {};
            (stage.notes || []).forEach(function (note) {
                if (note.section === 'example') exNotes[note.title] = note;
            });

            exGroups.forEach(function (name, i) {
                var block = SP.el('div', 'sp-group');
                if (name) {
                    block.id = 'ex-' + i;
                    var title = SP.el('h4', 'sp-group-title', name + ' ');
                    title.appendChild(SP.el('span', null, exByGroup[name].length));
                    block.appendChild(title);
                    var listed = index.some(function (e) { return e.row === 'sub' && e.label === name; });
                    if (!listed) index.push({ row: 'sub', label: name, target: block.id });
                }
                renderMarkedList(block, exByGroup[name], { zone: exZone, row: SP.renderExRow, tagged: !!query });
                if (exNotes[name]) block.appendChild(SP.renderNote(exNotes[name]));
                exSection.appendChild(block);
            });
            body.appendChild(exSection);
        }

        /* drills */
        var drills = items.filter(function (i) { return i.type === 'drill'; });
        if (drills.length) {
            var drillSection = sectionShell('sec-drills', 'Закрепление', drills.length);
            index.push({ row: 'main', label: 'Закрепление', target: 'sec-drills' });

            var blocks = [];
            var byBlock = {};
            drills.forEach(function (item) {
                if (!byBlock[item.block]) { byBlock[item.block] = []; blocks.push(item.block); }
                byBlock[item.block].push(item);
            });

            blocks.forEach(function (key) {
                var group = SP.el('div', 'sp-group');
                group.appendChild(SP.el('h4', 'sp-group-title', key + ' ' + byBlock[key][0].blockTitle));
                renderMarkedList(group, byBlock[key], { zone: drillZone, row: drillRow, tagged: !!query });
                drillSection.appendChild(group);
            });
            body.appendChild(drillSection);
        }

        /* notes — prose, not entries, so a search leaves them out */
        var generalNotes = query ? [] : (stage.notes || []).filter(function (n) { return n.section === 'notes'; });
        if (generalNotes.length) {
            var noteSection = sectionShell('sec-notes', 'Что надо запомнить', generalNotes.length);
            index.push({ row: 'main', label: 'Заметки', target: 'sec-notes' });
            generalNotes.forEach(function (note) { noteSection.appendChild(SP.renderNote(note)); });
            body.appendChild(noteSection);
        }

        /* exclusions */
        if (!query && stage.excluded && stage.excluded.length) {
            var exclSection = sectionShell('sec-excluded', 'Что сознательно не входит в этап', stage.excluded.length);
            index.push({ row: 'main', label: 'Не входит', target: 'sec-excluded' });
            var ul = SP.el('ul', 'sp-excluded');
            stage.excluded.forEach(function (text) { ul.appendChild(SP.el('li', null, text)); });
            exclSection.appendChild(ul);
            body.appendChild(exclSection);
        }

        return index;
    }

    /* ---------- boot ---------- */

    function boot() {
        var root = document.getElementById('sp-root');
        if (!root || !SP) return;

        SP.base = root.dataset.base || '../../resources/spanish/';

        if (root.dataset.rules !== undefined) {
            SP.loadRules().then(function (rules) {
                SP.renderRules(root, rules, { mainOnly: root.dataset.index === 'sections' });
            }).catch(function (e) { SP.showError('sp-error', e); });
            return;
        }

        var no = Number(root.dataset.stage);
        // The learned list is needed before the first row is drawn, so it goes
        // alongside the manifest rather than after it.
        Promise.all([SP.loadManifest(), SP.loadLearned()]).then(function (loaded) {
            var manifest = loaded[0];
            var entry = manifest.stages.filter(function (s) { return s.no === no; })[0];
            if (!entry) throw new Error('stage ' + no + ' is not in index.json');
            return SP.loadStage(entry);
        }).then(function (stage) {
            renderStage(root, stage);
        }).catch(function (e) { SP.showError('sp-error', e); });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
