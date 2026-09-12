/* Renders the Spanish reference pages from JSON:
   - a stage page when #sp-root carries data-stage="N"
   - the phonetics/grammar page when it carries data-rules
   Both get a sticky two-row chip index that stays put on a phone instead of
   collapsing into a floating overlay; the index and the rules renderer itself
   live in spanish-core.js, because the hub renders the rules in a tab too. */

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

    /* ---------- lazily rendered list ---------- */

    function renderList(parent, items, makeRow) {
        var list = SP.el('div', 'sp-lex');
        parent.appendChild(list);
        var shown = 0;

        var more = SP.el('button', 'sp-btn');
        more.type = 'button';

        function draw() {
            var next = Math.min(items.length, shown + (shown === 0 ? PAGE_SIZE : PAGE_STEP));
            var frag = document.createDocumentFragment();
            for (var i = shown; i < next; i++) frag.appendChild(makeRow(items[i]));
            list.appendChild(frag);
            shown = next;
            if (shown >= items.length) {
                more.hidden = true;
            } else {
                more.hidden = false;
                more.textContent = 'Show ' + Math.min(PAGE_STEP, items.length - shown) + ' more (' + (items.length - shown) + ' left)';
            }
        }

        more.addEventListener('click', draw);
        draw();
        if (!more.hidden) parent.appendChild(more);
    }

    /* ---------- stage page ---------- */

    function renderStage(root, stage) {
        var index = [];
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

        var bar = SP.el('div', 'sp-bar');
        root.appendChild(bar);

        var body = SP.el('div');
        root.appendChild(body);

        /* lexicon */
        var lex = stage.items.filter(function (i) { return i.type === 'vocab' || i.type === 'pair'; });
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
                renderList(block, byGroup[name], SP.renderLexRow);
                if (notesByGroup[name]) block.appendChild(SP.renderNote(notesByGroup[name]));
                lexSection.appendChild(block);
            });

            (stage.notes || []).forEach(function (note) {
                if (note.section === 'vocab' && !note.group) lexSection.appendChild(SP.renderNote(note));
            });
            body.appendChild(lexSection);
        }

        /* examples */
        var ex = stage.items.filter(function (i) { return i.type === 'phrase' || i.type === 'exchange'; });
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
                var list = SP.el('div', 'sp-ex');
                exByGroup[name].forEach(function (item) { list.appendChild(SP.renderExRow(item)); });
                block.appendChild(list);
                if (exNotes[name]) block.appendChild(SP.renderNote(exNotes[name]));
                exSection.appendChild(block);
            });
            body.appendChild(exSection);
        }

        /* drills */
        var drills = stage.items.filter(function (i) { return i.type === 'drill'; });
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
                var list = SP.el('ol');
                list.style.paddingLeft = '1.4em';
                byBlock[key].forEach(function (item) {
                    var li = SP.el('li');
                    li.style.marginBottom = 'var(--spacing-sm)';
                    li.appendChild(SP.el('span', null, item.prompt));

                    if (item.kind === 'choice' && item.options) {
                        li.appendChild(document.createTextNode(' '));
                        li.appendChild(SP.el('span', 'sp-es', '(' + item.options.join(' / ') + ')'));
                    }

                    var answer = SP.el('div', 'sp-es');
                    answer.textContent = item.answer;
                    answer.hidden = true;
                    answer.style.marginTop = '4px';

                    var reveal = SP.el('button', 'sp-btn', 'Show answer');
                    reveal.type = 'button';
                    reveal.style.marginTop = '6px';
                    reveal.addEventListener('click', function () {
                        answer.hidden = !answer.hidden;
                        reveal.textContent = answer.hidden ? 'Show answer' : 'Hide answer';
                    });

                    var row = SP.el('div');
                    row.style.display = 'flex';
                    row.style.alignItems = 'center';
                    row.style.gap = 'var(--spacing-xs)';
                    row.appendChild(reveal);
                    var speak = SP.speakButton(item.answer, 'Listen to the answer');
                    if (speak) row.appendChild(speak);

                    li.appendChild(answer);
                    li.appendChild(row);
                    list.appendChild(li);
                });
                group.appendChild(list);
                drillSection.appendChild(group);
            });
            body.appendChild(drillSection);
        }

        /* notes */
        var generalNotes = (stage.notes || []).filter(function (n) { return n.section === 'notes'; });
        if (generalNotes.length) {
            var noteSection = sectionShell('sec-notes', 'Что надо запомнить', generalNotes.length);
            index.push({ row: 'main', label: 'Заметки', target: 'sec-notes' });
            generalNotes.forEach(function (note) { noteSection.appendChild(SP.renderNote(note)); });
            body.appendChild(noteSection);
        }

        /* exclusions */
        if (stage.excluded && stage.excluded.length) {
            var exclSection = sectionShell('sec-excluded', 'Что сознательно не входит в этап', stage.excluded.length);
            index.push({ row: 'main', label: 'Не входит', target: 'sec-excluded' });
            var ul = SP.el('ul', 'sp-excluded');
            stage.excluded.forEach(function (text) { ul.appendChild(SP.el('li', null, text)); });
            exclSection.appendChild(ul);
            body.appendChild(exclSection);
        }

        SP.buildIndex(bar, index, root.dataset.index === 'sections');
        document.title = 'Stage ' + stage.no + ': ' + stage.title + ' - Spanish | Dykyi Roman';
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
        SP.loadManifest().then(function (manifest) {
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
