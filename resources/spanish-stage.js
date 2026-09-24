/* Renders the Spanish reference pages from JSON:
   - a stage page when #sp-root carries data-stage="N"
   - the phonetics/grammar page when it carries data-rules
   Both get a sticky two-row chip index that stays put on a phone instead of
   collapsing into a floating overlay; the index and the rules renderer itself
   live in spanish-core.js, because the hub renders the rules in a tab too.
   Every list on a stage page — words, live examples and drills alike — is split
   into Reference, Learned, Pending and the rest, and every row below the first
   two carries the pending checkbox. Only a stage whose words belong to sets
   has anything in Reference. The rules page has no items and so has no
   checkboxes. */

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

    /* ---------- lists split into reference, learned, pending and the rest ---------- */

    // Every list is four sections behind one strip of tabs: the tables of
    // the stage's sets, what the learned list holds, what this browser has
    // marked as pending, then everything else. The section whose tab is lit
    // is the one drawn — Left, what is still to learn, unless the reader
    // picked another (SP.view, page-wide) — and Reference opens on its tiles,
    // one per table, a table's rows drawn only while its tile is open
    // (SP.tables). Marking a row moves it across on the spot — the order
    // holds without a reload — while a table row and a learned row do not move
    // at all. A section not on show is not drawn rather than hidden with CSS:
    // otherwise a page of a long list could be spent on rows nobody sees.
    // Long lists are still drawn a page at a time: stage 2 runs to 679 words.
    //
    // opts.zone  () -> the container for one section (div.sp-lex, div.sp-ex, ol)
    // opts.row   (item, mark) -> the row element
    // opts.pageSize / opts.pageStep  omitted means "draw everything at once"
    function renderMarkedList(parent, items, opts) {
        var pageSize = opts.pageSize || items.length;
        var pageStep = opts.pageStep || pageSize;

        var tabs = SP.sectionTabs();
        parent.appendChild(tabs.node);
        var zones = {};
        var counts = {};
        SP.SECTIONS.forEach(function (kind) {
            zones[kind] = opts.zone();
            counts[kind] = 0;
            parent.appendChild(zones[kind]);
        });

        var more = SP.el('button', 'sp-btn');
        more.type = 'button';
        parent.appendChild(more);

        var plan = [];        // [{item, kind}] — what this pass draws, in order
        var shown = 0;
        var lastSet = null;   // the table the last Reference row drawn belongs to
        var section = null;   // the section this list draws (SP.sectionShown)

        function sync() {
            tabs.sync(counts);
            // An ordered section (the drills) numbers what is on screen.
            SP.SECTIONS.forEach(function (kind) {
                if (zones[kind].tagName === 'OL') zones[kind].start = 1;
            });
        }

        function move(row, item, marked) {
            // A learned word stays put: the checkbox only decorates it.
            if (SP.learned.has(item.id)) return;
            counts.pending += marked ? 1 : -1;
            counts.left += marked ? -1 : 1;
            if (marked && section !== 'pending') row.remove();
            else if (marked) zones.pending.appendChild(row);
            else zones.left.insertBefore(row, zones.left.firstChild);
            sync();
        }

        function buildRow(item) {
            var row;
            var kind = SP.sectionOf(item);
            // A table row has nothing to tick and nothing to move: it is looked
            // up, not worked through. A learned row has nothing to tick either —
            // it is already learned — but the column it would have used carries
            // the pin that lifts it to the head of its section and back.
            var mark = null;
            if (kind === 'learned') mark = SP.pinButton(item.id);
            else if (kind !== 'reference') mark = SP.markButton(item, function (on) {
                SP.setRowState(row, false, on);
                move(row, item, on);
            });
            // No query reaches here: a search is drawn by renderFound as the
            // three zones, which paint the match, open the panel holding it and
            // tag the row with the list it comes from.
            row = opts.row(item, mark);
            SP.setRowState(row, kind === 'learned', kind === 'pending');
            return row;
        }

        // `plan` is a snapshot, so a row marked meanwhile does not disturb the
        // sections the remaining pages are drawn into.
        function draw() {
            var next = Math.min(plan.length, shown + (shown === 0 ? pageSize : pageStep));
            var frags = {};
            SP.SECTIONS.forEach(function (kind) { frags[kind] = document.createDocumentFragment(); });
            for (var i = shown; i < next; i++) {
                var entry = plan[i];
                // Every table of Reference opens under its own name.
                if (entry.kind === 'reference' && entry.item.set !== lastSet) {
                    lastSet = entry.item.set;
                    frags.reference.appendChild(SP.quietDivider(lastSet));
                }
                frags[entry.kind].appendChild(buildRow(entry.item));
            }
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
            var buckets = {};
            SP.SECTIONS.forEach(function (kind) { buckets[kind] = []; });
            items.forEach(function (item) { buckets[SP.sectionOf(item)].push(item); });
            // Reference reads table by table; Learned comes in the order this
            // page load dealt it, not the file's.
            buckets.reference = SP.orderBySet(buckets.reference);
            // Pinned first, the rest in the order this page load dealt them —
            // which does not move, so unpinning drops a word back where it was.
            buckets.learned = SP.pin.first(SP.learned.shuffle(buckets.learned));
            plan = [];
            SP.SECTIONS.forEach(function (kind) {
                SP.clear(zones[kind]);
                counts[kind] = buckets[kind].length;
            });
            section = SP.sectionShown(counts);
            SP.SECTIONS.forEach(function (kind) {
                if (kind !== section) return;
                if (kind === 'reference' && buckets.reference.length) zones.reference.appendChild(SP.setTiles(buckets.reference));
                buckets[kind].forEach(function (item) {
                    if (kind === 'reference' && !SP.tables.isOpen(item)) return;
                    plan.push({ item: item, kind: kind });
                });
            });
            shown = 0;
            lastSet = null;
            draw();
            sync();
        }

        more.addEventListener('click', draw);
        SP.view.onSection(build);
        // A tile opened or closed changes which rows Reference draws.
        SP.tables.onChange(build);
        // Pinning reorders the Learned section, so the list is built again.
        // Registered once per list, as the fold is.
        SP.pin.onChange(build);
        build();
    }

    function lexZone() { return SP.el('div', 'sp-lex'); }
    function drillZone() { return SP.el('ol', 'sp-drills'); }

    // A drill keeps its answer folded away; the learned checkbox joins the
    // buttons rather than the text, so the list marker and the prompt stay on
    // one line. It leads that row, the answer button next to it.
    function drillRow(item, mark, query) {
        var li = SP.el('li', 'sp-drill');
        li.appendChild(SP.hilite(SP.el('span', null, item.prompt), query));

        if (item.kind === 'choice' && item.options) {
            li.appendChild(document.createTextNode(' '));
            li.appendChild(SP.hilite(SP.el('span', 'sp-es', '(' + item.options.join(' / ') + ')'), query));
        }

        var answer = SP.el('div', 'sp-es sp-drill-answer');
        answer.textContent = item.answer;
        answer.hidden = true;
        SP.hilite(answer, query);

        var reveal = SP.el('button', 'sp-btn', 'Show answer');
        reveal.type = 'button';
        reveal.addEventListener('click', function () {
            answer.hidden = !answer.hidden;
            reveal.textContent = answer.hidden ? 'Show answer' : 'Hide answer';
        });

        var actions = SP.el('div', 'sp-drill-actions');
        if (mark) actions.appendChild(mark);
        actions.appendChild(reveal);
        var spoken = SP.spokenText(item);
        var ask = SP.askButton(spoken, 'phrase');
        if (ask) actions.appendChild(ask);

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
        // How many result rows a search is showing. It lives out here because
        // "show more" redraws the whole body: a later page can open a zone the
        // chips do not name yet, and rebuilding both together keeps them true.
        var shown = PAGE_SIZE;

        function draw(keepShown) {
            var query = search.query();
            if (!keepShown) shown = PAGE_SIZE;
            SP.clear(body);
            SP.clear(chips);
            if (spy) { spy.disconnect(); spy = null; }
            var index = renderSections(body, stage, query, {
                shown: shown,
                more: function () { shown += PAGE_STEP; draw(true); }
            });
            if (!index.length) {
                body.appendChild(SP.el('p', 'sp-empty', 'Nothing matches.'));
                return;
            }
            spy = SP.buildIndex(chips, index, root.dataset.index === 'sections');
        }

        draw();
        document.title = 'Stage ' + stage.no + ': ' + stage.title + ' - Spanish | Dykyi Roman';
    }

    // Words before pairs before drills, the file order breaking the ties — the
    // order a zone reads in, and the one that keeps each kind of row in one run
    // so a zone opens one container per kind instead of one per row.
    var TYPE_RANK = { vocab: 0, pair: 1, drill: 2 };

    function byType(items) {
        return items.map(function (item, i) { return { item: item, i: i }; })
            .sort(function (a, b) {
                var rank = (TYPE_RANK[a.item.type] || 0) - (TYPE_RANK[b.item.type] || 0);
                return rank !== 0 ? rank : a.i - b.i;
            })
            .map(function (entry) { return entry.item; });
    }

    // What a search leaves of the stage: one list of the three zones — the word
    // itself, the words that only begin with it, the words that carry it in an
    // example — flat, with NO EXACT MATCH said above the rest when the first
    // zone is empty. The topic blocks and the four sections are put away while
    // a query is live: a topic is not what was asked for, and every row wears
    // the list it is in as a tag.
    function renderFound(body, stage, query, search) {
        var items = byType(stage.items.filter(function (item) { return SP.matches(item, query); }));
        var res = SP.renderZoneList(body, items, query, search.shown, {
            row: function (item, mark, q) {
                return item.type === 'drill' ? drillRow(item, mark, q) : SP.renderLexRow(item, mark, q);
            },
            key: function (item) { return item.type === 'drill' ? 'drill' : 'lex'; },
            zoneFor: function (item) { return item.type === 'drill' ? drillZone() : lexZone(); }
        });

        var left = res.total - res.drawn;
        if (res.total && left > 0) {
            var more = SP.el('button', 'sp-btn');
            more.type = 'button';
            more.textContent = 'Show ' + Math.min(PAGE_STEP, left) + ' more (' + left + ' left)';
            more.addEventListener('click', search.more);
            body.appendChild(more);
        }
        return res.index;
    }

    // Everything below the header, for the whole stage or for what a search
    // leaves of it. Returns the chip index of the sections it drew.
    function renderSections(body, stage, query, search) {
        var index = [];
        if (query) return renderFound(body, stage, query, search);
        var items = stage.items;

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

            // A stage that gives every topic an icon opens on tiles, one per
            // topic, the way Reference opens on its tables: a topic's block is
            // on the page only while its tile is open (SP.topics), so the ten
            // topics of Situations read as a grid of pictures rather than a
            // wall of words. Unlike the tables, the blocks are all built — a
            // list of a hundred words is nothing the page cannot hold — and a
            // closed one is hidden, so a tap costs no rebuild. The tiles are
            // then the index of the topics, and no chip row names them again.
            var icons = SP.topicIcons(stage);
            var topicBlocks = {};   // by name — the drills below keep a `blocks` of their own
            if (icons) {
                var grid = SP.tileGrid(lexGroups.filter(Boolean).map(function (name) {
                    return { key: SP.topicKey(stage, name), icon: icons[name], name: name, count: byGroup[name].length };
                }), { state: SP.topics, what: 'topic', kind: 'topic' });
                lexSection.appendChild(grid.node);
                SP.topics.onChange(function () {
                    grid.sync();
                    Object.keys(topicBlocks).forEach(function (name) {
                        topicBlocks[name].hidden = !SP.topics.isOpen(SP.topicKey(stage, name));
                    });
                });
            }

            lexGroups.forEach(function (name, i) {
                var block = SP.el('div', 'sp-group');
                if (name) {
                    block.id = 'lex-' + i;
                    var title = SP.el('h4', 'sp-group-title');
                    if (icons) {
                        // The block wears its tile's picture, so an open topic
                        // under the grid is known at a glance.
                        title.appendChild(SP.iconSpan(icons[name]));
                        title.appendChild(document.createTextNode(' '));
                        topicBlocks[name] = block;
                        block.hidden = !SP.topics.isOpen(SP.topicKey(stage, name));
                    } else {
                        index.push({ row: 'sub', label: name, target: block.id });
                    }
                    title.appendChild(document.createTextNode(name + ' '));
                    title.appendChild(SP.el('span', null, byGroup[name].length));
                    block.appendChild(title);
                }
                renderMarkedList(block, byGroup[name], {
                    zone: lexZone,
                    row: SP.renderLexRow,
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
                renderMarkedList(group, byBlock[key], { zone: drillZone, row: drillRow });
                drillSection.appendChild(group);
            });
            body.appendChild(drillSection);
        }

        /* notes — prose, not entries; a search never reaches here at all */
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
        // The learned list and the verb forms are needed before the first row
        // is drawn, so they go alongside the manifest rather than after it.
        Promise.all([SP.loadManifest(), SP.loadLearned(), SP.loadVerbs()]).then(function (loaded) {
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
