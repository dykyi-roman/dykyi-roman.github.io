/* The rows of every list: the four sections they are split into, the pending
   checkbox, the covered side, a verb's forms and the drawer under a word.
   Part of the Spanish section, which loads four files in this order:
   spanish-core.js -> spanish-search.js -> spanish-prose.js -> spanish-rows.js.
   Everything is built with createElement + textContent — the JSON carries no
   markup, and nothing here ever assigns innerHTML.
   Extends window.SP. */

(function () {
    'use strict';

    var SP = window.SP;
    SP.SECTIONS = ['reference', 'learned', 'pending', 'left'];
    SP.SECTION_LABEL = { reference: 'Reference', learned: 'Learned', pending: 'Pending', left: 'Left' };
    SP.SECTION_ICON = { reference: '📖', learned: '✅', pending: '⏳', left: '📋' };

    // The section a list draws: the page-wide pick (SP.view), unless this
    // list has nothing in it — then the first section that has something, in
    // the order of what is most likely wanted. So a topic with no learned
    // word still shows its words while Learned is picked, and the block that
    // holds only the tables shows them whatever is picked; a list draws an
    // empty section only when it is empty through and through. The strip
    // lights the same tab, so the two never disagree.
    var FALLBACK = ['left', 'pending', 'learned', 'reference'];
    SP.sectionShown = function (counts) {
        var pick = SP.view.section();
        if (counts[pick] > 0) return pick;
        for (var i = 0; i < FALLBACK.length; i++) {
            if (counts[FALLBACK[i]] > 0) return FALLBACK[i];
        }
        return pick;
    };

    // The head of one list: a strip of tabs, one per section, in the shape of
    // the hub's mode tabs — the icon, the name and the count — with the one on
    // show lit. A section's rows are drawn only while its tab is lit; a tap
    // makes the page-wide pick (SP.view), and every list resolves it through
    // SP.sectionShown. A tab with nothing to show is hidden unless it is the
    // lit one, and the strip goes away when it would hold a single tab:
    // nothing to switch to, and the rows say by their edge which list they
    // are in. Returns the node plus the one call that keeps it true.
    SP.sectionTabs = function () {
        var strip = SP.el('div', 'sp-tabs sp-section-tabs');
        strip.setAttribute('role', 'tablist');
        var tabs = {};
        SP.SECTIONS.forEach(function (kind) {
            var tab = SP.el('button', 'sp-tab');
            tab.type = 'button';
            tab.setAttribute('role', 'tab');
            tab.dataset.section = kind;
            var icon = SP.iconSpan(SP.SECTION_ICON[kind]);
            if (icon) tab.appendChild(icon);
            tab.appendChild(SP.el('span', 'sp-tab-label', SP.SECTION_LABEL[kind]));
            var count = SP.el('small');
            tab.appendChild(count);
            tab.addEventListener('click', function () { SP.view.setSection(kind); });
            tabs[kind] = { node: tab, count: count };
            strip.appendChild(tab);
        });
        return {
            node: strip,
            sync: function (counts) {
                var current = SP.sectionShown(counts);
                var shown = 0;
                SP.SECTIONS.forEach(function (kind) {
                    var tab = tabs[kind];
                    var active = kind === current;
                    var name = SP.SECTION_LABEL[kind] + ' · ' + counts[kind];
                    tab.count.textContent = counts[kind];
                    tab.node.classList.toggle('active', active);
                    tab.node.setAttribute('aria-selected', active ? 'true' : 'false');
                    // The name is spelled out for a screen reader: held upright,
                    // a phone shows the icon and the count alone.
                    tab.node.setAttribute('aria-label', name);
                    tab.node.title = name;
                    tab.node.hidden = !active && counts[kind] === 0;
                    if (!tab.node.hidden) shown++;
                });
                strip.hidden = shown <= 1;
            }
        };
    };

    // The same line without the fold, naming what follows it: a table inside
    // Reference, or on the hub a run of one type of entry. A seam inside a
    // section rather than a header, and drawn as one (is-sub): pushed to the
    // left, so the centred header above reads as the whole and this as a part.
    SP.quietDivider = function (label) {
        var node = SP.el('div', 'sp-divider is-quiet is-sub');
        node.appendChild(SP.el('span', 'sp-divider-label', label));
        return node;
    };
    // Which tiles are open, kept for this page load alone — the tables of
    // Reference, and the topics of a stage that gives them an icon. A table
    // is looked up, not worked through over days, and a topic is one tap
    // away on a fresh page, where the grid is the overview of the stage; so
    // neither is remembered. One record per kind, keyed by stage and name: a
    // name is unique within its stage, and two stages may one day share one.
    function openState(keyOf) {
        var open = Object.create(null);
        var listeners = [];
        return {
            isOpen: function (key) { return !!open[keyOf(key)]; },
            setOpen: function (key, on) {
                open[keyOf(key)] = !!on;
                listeners.forEach(function (fn) { fn(); });
            },
            onChange: function (fn) { listeners.push(fn); }
        };
    }
    SP.tables = openState(function (item) { return item.stage + ':' + item.set; });
    SP.topics = openState(function (topic) { return topic.stage + ':' + topic.name; });

    // The pictures of a stage's topics, by name — or null when the stage
    // declares none, and its lexicon is drawn as plain blocks. It is all or
    // nothing, and verify.js holds the file to that. `SP.topicKey` is what
    // SP.topics is asked about.
    SP.topicIcons = function (stage) {
        var groups = stage.groups || [];
        if (!groups.length || !groups.every(function (g) { return g.icon; })) return null;
        var icons = {};
        groups.forEach(function (g) { icons[g.name] = g.icon; });
        return icons;
    };

    SP.topicKey = function (stage, name) { return { stage: stage.no, name: name }; };

    // A grid of tiles: one button per entry, carrying its picture, its name
    // and its size, in the order given. A tap opens what the tile stands for
    // below the grid and a second tap closes it; `state` is the record of
    // which are out (SP.tables, SP.topics), `what` names the thing a tile
    // opens for its tooltip, and `kind` marks the grid for CSS. `tiles` is
    // [{key, icon, name, count, what?, onOpen?}], `key` being what the state
    // is asked about; a tile that is not a list (the number calculator) has
    // no count, names itself in `what`, and may act once it is opened.
    // Returns the node and a sync that repaints the tiles from the state, for
    // a grid that stays on the page while what is under it comes and goes.
    SP.tileGrid = function (tiles, opts) {
        var grid = SP.el('div', 'sp-tile-grid' + (opts.kind ? ' is-' + opts.kind : ''));
        var buttons = [];
        function paint() {
            buttons.forEach(function (entry) {
                var open = opts.state.isOpen(entry.key);
                entry.tile.setAttribute('aria-expanded', open ? 'true' : 'false');
                entry.tile.title = (open ? 'Hide' : 'Show') + ' the ' + entry.what;
            });
        }
        tiles.forEach(function (entry) {
            var tile = SP.el('button', 'sp-tile');
            tile.type = 'button';
            var pic = SP.iconSpan(entry.icon);
            if (pic) { pic.classList.add('sp-tile-icon'); tile.appendChild(pic); }
            var name = SP.el('span', 'sp-tile-name', entry.name);
            // The names are Russian on a page that may be lang="en" (the hub),
            // and the syllable breaks of `hyphens: auto` follow the language.
            if (/[\u0400-\u04FF]/.test(entry.name)) name.lang = 'ru';
            tile.appendChild(name);
            // Empty, the count still holds its line (CSS), so the chevron
            // stands level with its neighbours'.
            tile.appendChild(SP.el('span', 'sp-tile-count', entry.count));
            tile.appendChild(SP.icon.chevron());
            tile.addEventListener('click', function () {
                var open = !opts.state.isOpen(entry.key);
                opts.state.setOpen(entry.key, open);
                if (open && entry.onOpen) entry.onOpen();
            });
            buttons.push({ key: entry.key, tile: tile, what: entry.what || opts.what });
            grid.appendChild(tile);
        });
        paint();
        return { node: grid, sync: paint };
    };

    // Reference opens on its tiles: one per table, in the order the stage
    // declares its sets. The rows of a closed table are not drawn at all, so
    // a page of a long list is never spent on them — which is why the list
    // rebuilds, grid and all, on every tap. `items` are the Reference rows of
    // one stage, already through SP.orderBySet, so every table is one run.
    //
    // A stage that declares a `calc` gets one more tile, ahead of the tables:
    // not a table but a field that spells a typed number, or a sum in euros,
    // out in words. It opens between the grid and the tables' rows, so what
    // comes back is a block holding both, not the bare grid.
    SP.setTiles = function (items) {
        var tables = [];
        items.forEach(function (item) {
            var last = tables[tables.length - 1];
            if (last && last.key.set === item.set) { last.count++; return; }
            tables.push({ key: item, icon: item.setIcon, name: item.set, count: 1 });
        });
        var stage = items.length ? SP.stages[items[0].stageId] : null;
        var calc = stage && stage.calc;
        // Keyed like a table, by stage and name; verify.js keeps the name off
        // the stage's sets, so the two never share a state.
        var key = calc && { stage: stage.no, set: calc.name };
        if (calc) tables.unshift({
            key: key, icon: calc.icon, name: calc.name, what: 'calculator',
            // The tile is tapped to type into the field, so it takes the focus.
            onOpen: function () {
                var input = document.querySelector('.sp-calc-input');
                if (input) input.focus();
            }
        });
        var block = SP.el('div', 'sp-set-tiles');
        block.appendChild(SP.tileGrid(tables, { state: SP.tables, what: 'table' }).node);
        if (calc && SP.tables.isOpen(key)) block.appendChild(calcPanel());
        return block;
    };

    // What was typed into the calculator, kept for the page load: the list
    // rebuilds on every tile tap, and opening a table beside the field should
    // not empty it.
    var calcTyped = '';
    var CALC_ERROR = {
        nan: 'A number like 10.24, or a sum like 4 euro 50',
        long: 'Up to 15 digits on each side of the point',
        cents: 'Cents run from 0 to 99'
    };

    // The field and what it says: the words in bold, their sound in orange
    // under them, and a tap on the line says them aloud (slower on a second
    // tap), as a line of examples does. All three are worked out as the
    // reader types, by SP.spellNumber, so nothing of it is stored.
    function calcPanel() {
        var box = SP.el('div', 'sp-calc');
        var input = SP.el('input', 'sp-search sp-calc-input');
        // The full keyboard rather than the number pad: a sum is typed with
        // `euro` or `€`, which the pad has no key for.
        input.type = 'text';
        input.autocomplete = 'off';
        input.autocapitalize = 'off';
        input.spellcheck = false;
        input.placeholder = '10.24 · 4 euro 50';
        input.setAttribute('aria-label', 'A number or a sum in euros, in digits');
        input.value = calcTyped;
        var out = SP.el('div', 'sp-calc-out');
        out.setAttribute('aria-live', 'polite');

        function paint() {
            calcTyped = input.value;
            SP.clear(out);
            var said = SP.spellNumber(input.value);
            if (!said) return;
            if (said.error) { out.appendChild(SP.el('div', 'sp-calc-error', CALC_ERROR[said.error])); return; }
            var line = SP.el('div', 'sp-calc-line');
            line.appendChild(SP.el('span', 'sp-calc-es', said.es));
            line.appendChild(SP.el('span', 'sp-calc-tr', said.tr));
            // The line writes the separator as a sign and says it as a word.
            if (SP.speakable(line, said.say).dataset.say) line.setAttribute('role', 'button');
            out.appendChild(line);
        }
        input.addEventListener('input', paint);
        paint();

        box.appendChild(input);
        box.appendChild(out);
        return box;
    }

    // `slot` is where the mark goes when it is not the row itself: a lexicon
    // row keeps it at the head of its first line, beside the Spanish, so the
    // gloss lines under it run the full width of a phone card — from 700px up
    // that head is display:contents and the mark is a grid cell of the row
    // again, in the column named for it.
    SP.attachMark = function (row, mark, slot) {
        attachReveal(row);
        if (!mark) return row;
        row.classList.add('has-mark');
        var host = slot || row;
        host.insertBefore(mark, host.firstChild);
        return row;
    };

    function covered(row) {
        return row.classList.contains('is-learned') || row.classList.contains('is-pending');
    }

    function revealTitle(row) {
        if (!covered(row)) { row.removeAttribute('title'); return; }
        // A drill covers its answer on either side; any other row, the side picked.
        var what = row.classList.contains('sp-drill-row') ? 'answer'
            : (SP.cover.side() === 'spanish' ? 'Spanish' : 'translation');
        row.title = (row.classList.contains('is-revealed') ? 'Hide the ' : 'Show the ') + what;
    }

    // A row with a drawer opens it wherever it is tapped, as the line of a
    // rule does: the chevron sits at the far edge of the card, and reaching
    // for it word after word was a chore. On a covered row that is still the
    // reveal — opening shows the hidden side and closing hides it again (see
    // SP.setDrawerOpen) — with the examples and the forms beside it. A learned
    // word is the exception: it is there to be recalled, so its tap is the
    // plain reveal and the drawer waits for the chevron; once the chevron has
    // opened it, a tap closes it and covers the word again. A row with no
    // drawer, a drill, keeps the plain reveal too. Another control in the
    // row keeps its own tap, a tap inside the open drawer is the drawer's, and
    // a drag that selected some text is not a tap at all.
    function attachReveal(row) {
        function toggle() {
            var recall = row.classList.contains('is-learned') && !row.classList.contains('is-open');
            if (!recall && row.querySelector('.sp-drawer-toggle')) {
                SP.setDrawerOpen(row, !row.classList.contains('is-open'));
                return true;
            }
            if (!covered(row)) return false;
            row.classList.toggle('is-revealed');
            revealTitle(row);
            return true;
        }
        row.addEventListener('click', function (e) {
            if (e.target.closest && e.target.closest('button, a, input, select, textarea, .sp-drawer')) return;
            var picked = window.getSelection && window.getSelection();
            if (picked && !picked.isCollapsed && row.contains(picked.anchorNode)) return;
            if (toggle()) e.preventDefault();
        });
        // Only while the row itself has the focus: Enter on a button inside it
        // is that button's.
        row.addEventListener('keydown', function (e) {
            if (e.target !== row) return;
            if ((e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') && toggle()) e.preventDefault();
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
            // open drawer writes out both sides, so a word just ticked into
            // Pending would move there with its answer still on the screen.
            SP.setDrawerOpen(row, false);
            row.classList.remove('is-revealed');
        } else {
            row.classList.remove('is-revealed');
            row.removeAttribute('tabindex');
        }
        revealTitle(row);
        return row;
    };

    // Opens or closes a word's examples — the one place that state is changed,
    // so the covered side and the checkbox can close a drawer without knowing
    // how it was opened. The drawer fills itself on the first open: a page holds
    // a hundred rows, and three speak buttons each for panels nobody opens is
    // three hundred listeners bought for nothing.
    //
    // Opening also reveals the row, and closing covers it again. The examples
    // spell out the Spanish and the Russian alike, so leaving the word itself
    // under a bar would be hiding an answer that is already on the screen; and
    // since a tap on the row opens the drawer (on any row but a learned one),
    // the same tap has to be the way back to the covered side.
    SP.setDrawerOpen = function (row, on) {
        if (!on && !row.classList.contains('is-open')) return;
        var btn = row.querySelector('.sp-drawer-toggle');
        var drawer = row.querySelector('.sp-drawer');
        if (!btn || !drawer) return;
        if (on && drawer.fill) { drawer.fill(); drawer.fill = null; }
        row.classList.toggle('is-open', on);
        btn.setAttribute('aria-expanded', on ? 'true' : 'false');
        drawer.hidden = !on;
        // Only a covered row has anything to reveal; on any other, the class
        // would be a leftover waiting to show a side that is about to be hidden.
        if (covered(row)) row.classList.toggle('is-revealed', on);
        drawerTitle(btn, on);
        revealTitle(row);
    };

    // The chevron names what is actually under it, which differs from word to
    // word: a verb of the Reference tables carries forms and no examples, and
    // most words the other way round.
    var PANEL_HOLDS = {
        forms: 'the forms',
        examples: 'the examples',
        formsexamples: 'the forms and examples'
    };

    function drawerTitle(btn, on) {
        var what = PANEL_HOLDS[btn.dataset.holds] || 'more';
        var label = (on ? 'Hide ' : 'Show ') + what;
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
    // touch target of .sp-ask at the other end of the row.
    SP.markButton = function (item, onChange) {
        var btn = SP.el('button', 'sp-mark');
        btn.type = 'button';
        btn.setAttribute('aria-label', 'Mark as pending');
        btn.appendChild(SP.icon.check());

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
        group.appendChild(SP.icon.eyeOff());

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

    // A change of side starts the round over, and what that costs the rows on
    // the screen is decided here rather than where the choice is stored: an
    // open drawer writes out both sides, so it closes, and every revealed row
    // goes back under its bar.
    SP.cover.onChange(function () {
        document.querySelectorAll('.sp-lex-row.is-open').forEach(function (row) {
            SP.setDrawerOpen(row, false);
        });
        document.querySelectorAll('.is-revealed').forEach(function (row) {
            row.classList.remove('is-revealed');
        });
        document.querySelectorAll(':is(.sp-lex-row, .sp-drill-row):is(.is-learned, .is-pending)').forEach(revealTitle);
    });

    /* ---------- item rows ---------- */

    /* ---------- a verb's forms ---------- */

    // The three tenses of one verb, as its own fold inside the row's drawer.
    // Folded it is still teaching: the first person of each tense side by side
    // — tengo · tuve · tendré — which is the shortest honest answer to "how
    // does this word change". Opened it is the full six persons.
    //
    // A second fold rather than a second chevron in the row's tools: four
    // controls already fill the tail of a pair on a phone, and a fifth would
    // take the line. It also keeps the choice where the reader is: someone
    // after the examples of `casa` never meets this at all.
    var formsSeq = 0;

    function formsTable(verb) {
        var wrap = SP.el('div', 'sp-table-wrap');
        var table = SP.el('table', 'sp-table sp-forms-table');
        var tenses = SP.verbs.tenses();

        var hr = SP.el('tr');
        hr.appendChild(SP.el('th', 'sp-forms-person', ''));
        // A tense's column is sp-cN, as a verb's column of a conjugation grid
        // in the rules is: on a phone the same rules show one at a time.
        tenses.forEach(function (tense, t) {
            var th = SP.el('th', 'sp-c' + t);
            th.appendChild(SP.el('span', 'sp-forms-tense', tense.ru));
            th.appendChild(SP.el('span', 'sp-forms-tense-es', tense.es));
            th.title = tense.es + ' — ' + tense.hint;
            hr.appendChild(th);
        });
        table.appendChild(SP.el('thead')).appendChild(hr);

        var tbody = SP.el('tbody');
        SP.verbs.persons().forEach(function (person, i) {
            var tr = SP.el('tr');
            var label = SP.el('td', 'sp-forms-person', person.short);
            label.title = person.full;
            tr.appendChild(label);
            tenses.forEach(function (tense, t) {
                var form = (verb[tense.key] || [])[i] || '';
                var td = SP.el('td', 'sp-c' + t);
                // A button, like a conjugation grid in the rules: one tap says
                // the form out loud, which is the one thing a table of forms
                // cannot do on paper. Under the form, in a quieter and smaller
                // line, how it sounds — derived by SP.translit rather than
                // stored, so it costs the files nothing. A second line inside
                // a cell that was already 40px tall; the table itself is a
                // fold inside a fold, so nothing above it moves.
                var btn = SP.el('button', 'sp-forms-cell');
                btn.type = 'button';
                btn.dataset.form = form;
                btn.appendChild(SP.el('span', 'sp-forms-form', form));
                var sound = SP.translit(form);
                if (sound) btn.appendChild(SP.el('span', 'sp-forms-tr', sound));
                td.appendChild(btn);
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        wrap.appendChild(table);

        wrap.addEventListener('click', function (e) {
            var cell = e.target.closest && e.target.closest('.sp-forms-cell');
            if (!cell || !wrap.contains(cell)) return;
            e.stopPropagation();
            e.preventDefault();
            SP.say(cell.dataset.form);      // a second tap says it slower
        });
        return wrap;
    }

    // A phone has room for one tense at a time: the persons and three columns
    // of forms ran off a 360px screen, and the future was reached only by
    // scrolling the table sideways. A row of the tense names picks the one
    // shown, as the verb chips over a conjugation grid of the rules do, and
    // the pick carries over to the next verb opened on the page, so a reader
    // going through the past stays in the past. From 700px up the three stand
    // side by side and the row is hidden (spanish.css, .sp-conj-chips).
    var formsPick = 0;

    function formsChips(grid) {
        var chips = SP.el('div', 'sp-conj-chips sp-forms-chips');
        SP.verbs.tenses().forEach(function (tense, t) {
            var chip = SP.el('button', 'sp-btn', tense.ru);
            chip.type = 'button';
            chip.dataset.pick = String(t);
            chip.title = tense.es;
            chips.appendChild(chip);
        });
        function paint(pick) {
            grid.dataset.pick = String(pick);
            Array.prototype.forEach.call(chips.children, function (chip) {
                var on = chip.dataset.pick === String(pick);
                chip.classList.toggle('active', on);
                chip.setAttribute('aria-pressed', on ? 'true' : 'false');
            });
        }
        chips.addEventListener('click', function (e) {
            var chip = e.target.closest && e.target.closest('.sp-btn');
            if (!chip || !chips.contains(chip)) return;
            e.stopPropagation();
            e.preventDefault();
            formsPick = Number(chip.dataset.pick);
            paint(formsPick);
        });
        paint(formsPick);
        return chips;
    }

    // `named` spells the infinitive out on the head line. A word has it written
    // directly above; a pair is two verbs, and without the name neither column
    // of forms says which half it belongs to.
    function formsBlock(verb, named) {
        var box = SP.el('div', 'sp-forms');
        var grid = SP.el('div', 'sp-forms-grid is-picky');
        grid.id = 'sp-forms-' + (formsSeq += 1);
        grid.hidden = true;

        var head = SP.el('button', 'sp-forms-head');
        head.type = 'button';
        head.setAttribute('aria-expanded', 'false');
        head.setAttribute('aria-controls', grid.id);
        if (named) head.appendChild(SP.el('span', 'sp-forms-inf', verb.es));
        var peek = head.appendChild(SP.el('span', 'sp-forms-peek'));
        SP.verbs.tenses().forEach(function (tense) {
            peek.appendChild(SP.el('span', 'sp-forms-peek-one', (verb[tense.key] || [])[0] || ''));
        });
        var kind = SP.verbs.kind(verb.kind);
        if (kind) {
            var badge = head.appendChild(SP.el('span', 'sp-badge is-verb is-' + verb.kind, kind.ru));
            badge.title = kind.hint;
        }
        head.appendChild(SP.icon.chevron());

        function label(on) {
            var text = (on ? 'Hide' : 'Show') + ' the forms of ' + verb.es;
            head.title = text;
            head.setAttribute('aria-label', text);
        }
        label(false);

        head.addEventListener('click', function (e) {
            // The row is a reveal toggle and the drawer above is another fold:
            // this click belongs to neither.
            e.stopPropagation();
            e.preventDefault();
            var on = grid.hidden;
            if (on && !grid.firstChild) {
                grid.appendChild(formsChips(grid));
                grid.appendChild(formsTable(verb));
            }
            grid.hidden = !on;
            box.classList.toggle('is-open', on);
            head.setAttribute('aria-expanded', on ? 'true' : 'false');
            label(on);
        });

        box.appendChild(head);
        box.appendChild(grid);
        return box;
    }

    /* ---------- the drawer under a row ---------- */

    // `mark` is the optional learned-toggle built by SP.markButton — every
    // browsable list passes one, the flashcard face does not.
    // A word with forms or examples gets a chevron at the end of its tools and
    // a drawer under it. A word with neither is built exactly as before: no
    // control, and no second button narrowing the text line on a phone.
    var drawerSeq = 0;

    function drawerToggle(item, row, query, verbs) {
        var drawer = SP.el('div', 'sp-drawer');
        drawer.id = 'sp-drawer-' + (drawerSeq += 1);
        drawer.hidden = true;
        var examples = item.ex || [];
        // The forms come first and the examples under them: the forms are the
        // word itself changing, the examples are it used. A pair names each of
        // its verbs, a word does not — its infinitive is the line above.
        // The examples carry no controls of their own. They are illustrations
        // of the word above them, not entries: the word's own row already holds
        // the speaker and the question, and a tail on every line turned a
        // three-line drawer into a column of buttons.
        // A word found by an example opens this drawer by itself, so the match
        // inside it is painted here as well — it is the only thing on the row
        // that carries what was searched for.
        drawer.fill = function () {
            verbs.forEach(function (verb) { drawer.appendChild(formsBlock(verb, verbs.length > 1)); });
            examples.forEach(function (line) {
                drawer.appendChild(SP.hilite(SP.exampleLine(line), query));
            });
        };

        var btn = SP.el('button', 'sp-drawer-toggle');
        btn.type = 'button';
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-controls', drawer.id);
        // What the drawer holds is what the chevron promises: a word may carry
        // forms, examples or both, and a label naming what is not there sends
        // the reader looking for it.
        btn.dataset.holds = (verbs.length ? 'forms' : '') + (examples.length ? 'examples' : '');
        drawerTitle(btn, false);
        btn.appendChild(SP.icon.chevron());
        // The click has to stop here: the whole row is a reveal toggle, and the
        // drawer does its own revealing.
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            e.preventDefault();
            SP.setDrawerOpen(row, !row.classList.contains('is-open'));
        });
        return { button: btn, drawer: drawer };
    }

    // `query` is the folded search the list was drawn for, if any: what it
    // matched is painted in the texts below. It arrives already folded, from
    // the same SP.normalize the filter used, so the row cannot light up
    // anything the filter would not have found.
    // The mark a verb wears beside the word itself. It answers two questions
    // at once: that this word has a table of forms under its chevron — every
    // verb carries one, so every verb carries a dot — and how much of that
    // table has to be memorised. The fill grows with the work: an empty green
    // ring for a regular verb, a ring with a centre for one whose root merely
    // alternates, a filled red disc for one that is irregular. Shape carries
    // what the colour carries, for whoever cannot tell the three apart, and
    // the title names the kind in words.
    function verbDot(verb) {
        if (!verb) return null;
        var kind = SP.verbs.kind(verb.kind);
        var dot = SP.el('span', 'sp-verb-dot is-' + verb.kind);
        dot.setAttribute('role', 'img');
        dot.title = verb.es + ' — ' + (kind ? kind.ru : verb.kind);
        dot.setAttribute('aria-label', dot.title);
        return dot;
    }

    // The Spanish of one entry — a word, or one half of a pair — with that
    // mark in it. A word and its dot are one thing and must not be split: the
    // Spanish cell is `overflow-wrap: anywhere`, which on a 360px phone happily
    // left the dot alone at the head of the second line. The longest
    // infinitive in the corpus is eleven letters, so nothing wrapped this way
    // can outgrow the cell and nothing needs the wrap opportunity given up.
    function wordWithDot(es, dot) {
        if (!dot) return document.createTextNode(es);
        var box = SP.el('span', 'sp-lex-word', es);
        box.appendChild(dot);
        return box;
    }

    // A colour of the colours table wears its own square ahead of the word
    // (`swatch` in the file): the word is learnt against the colour itself,
    // not against its name in another language. Decorative — the word says it.
    function lexEs(es, swatch) {
        var box = SP.el('div', 'sp-lex-es');
        if (swatch) {
            var chip = SP.el('span', 'sp-swatch');
            chip.style.backgroundColor = swatch;
            chip.setAttribute('aria-hidden', 'true');
            box.appendChild(chip);
        }
        box.appendChild(wordWithDot(es, verbDot(SP.verbs.get(es))));
        return box;
    }

    // The three lines of one entry, drawn into `parent`: the Spanish with its
    // transcription on a head line, then the English, then the Russian. A
    // field is left out when it is empty rather than added blank: the
    // brackets and dashes between them are drawn by CSS from what is there.
    // Returns the head, which is where the row's mark goes.
    function lexText(parent, part) {
        var head = SP.el('div', 'sp-lex-head');
        head.appendChild(lexEs(part.es, part.swatch));
        if (part.tr) head.appendChild(SP.el('div', 'sp-lex-tr', part.tr));
        parent.appendChild(head);
        if (part.en) parent.appendChild(SP.el('div', 'sp-lex-en', part.en));
        if (part.ru) parent.appendChild(SP.el('div', 'sp-lex-ru', part.ru));
        return head;
    }

    SP.renderLexRow = function (item, mark, query) {
        var row = SP.el('div', 'sp-lex-row' + (item.type === 'pair' ? ' is-pair' : ''));
        var verbs = SP.verbsOf(item);
        var ex = (item.ex && item.ex.length) || verbs.length ? drawerToggle(item, row, query, verbs) : null;

        // On a phone a word reads as three lines — "y (и)", "— [and]", "— [и]":
        // the Spanish and its transcription share a head that wraps when the
        // two do not fit, and the glosses take a line each. A pair is two such
        // entries side by side, each half in a column of its own with a rule
        // between them — its halves are exactly item.es/en/ru/tr split at the
        // " / ", which verify.js enforces. From 700px up every box here is
        // display:contents and the texts go back to being grid cells: a word
        // one line of four, a pair two such lines in one card.
        var text = SP.el('div', 'sp-lex-text');
        var halves = item.type === 'pair' && item.a && item.b ? [item.a, item.b] : null;
        var head;
        if (halves) {
            // A long half shrinks its type on a phone rather than breaking
            // its words: the tier is set here, off the longest word in the
            // pair, and spanish.css sizes the columns by it.
            var longest = 0;
            halves.forEach(function (half) {
                ['es', 'en', 'ru'].forEach(function (key) {
                    String(half[key] || '').split(/\s+/).forEach(function (word) {
                        longest = Math.max(longest, word.length);
                    });
                });
            });
            if (longest >= 12) row.classList.add('is-longer');
            else if (longest >= 9) row.classList.add('is-long');
            halves.forEach(function (half, i) {
                var box = SP.el('div', 'sp-lex-half ' + (i ? 'is-b' : 'is-a'));
                var h = lexText(box, half);
                if (!i) head = h;
                text.appendChild(box);
            });
        } else {
            head = lexText(text, item);
        }
        // Before the row goes on the page and before the section tag is hung
        // on the Spanish: the tag is added by the caller, and it is text too.
        SP.hilite(text, query);
        row.appendChild(text);

        row.appendChild(SP.rowTools(item.es, 'word', ex && ex.button));
        if (ex) {
            row.appendChild(ex.drawer);
            // The whole card opens the drawer (attachReveal), so it takes the
            // pointer — on a learned word it reveals instead, but a tap is a tap.
            row.classList.add('is-toggle');
        }
        // The mark leads a word's first line, inside its head; a pair keeps it
        // on the row, in a column of its own, so the two halves start level.
        return SP.attachMark(row, mark, halves ? null : head);
    };

    /* ---------- the legend ---------- */

    // What the icons and the marks mean, said once and in words. Held upright,
    // a phone shows the stage chips and the section tabs as icons alone, and
    // every mark of a row explains itself only in a tooltip — which a touch
    // screen never shows. A quiet button on the line of the page heading opens
    // it under the heading, so shut it costs the page no line of its own. On
    // the hub `opts.stages` and `opts.reference` explain the chip row and
    // `opts.stars` the ★ of the rules and the patterns; a stage page passes
    // nothing. What is Russian in it comes from the files, like everywhere.
    var SECTION_HINT = {
        reference: 'closed sets to look up: days, months, numbers, question frames. A tile opens its table',
        learned: 'the learned list. One side of every row is covered: recall it, then tap the row to check',
        pending: 'what you ticked to learn next, covered the same way',
        left: 'everything not learned yet'
    };
    var legendSeq = 0;

    function legendMark(cls, glyph) {
        var mark = SP.el('span', cls);
        mark.setAttribute('aria-hidden', 'true');
        if (glyph) mark.appendChild(glyph);
        return mark;
    }

    SP.legend = function (opts) {
        var options = opts || {};
        var body = SP.el('div', 'sp-legend');
        body.id = 'sp-legend-' + (legendSeq += 1);
        body.hidden = true;

        var toggle = SP.el('button', 'sp-btn quiet sp-legend-toggle', 'Legend');
        toggle.type = 'button';
        toggle.title = 'What the icons and the marks mean';
        toggle.setAttribute('aria-controls', body.id);
        toggle.setAttribute('aria-expanded', 'false');
        toggle.addEventListener('click', function () {
            var open = body.hidden;
            body.hidden = !open;
            toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            toggle.classList.toggle('active', open);
        });

        // One titled list of {marks, name, text}; a row may carry two marks
        // where a thing has two states, and an empty group draws nothing.
        function group(title, rows) {
            rows = rows.filter(Boolean);
            if (!rows.length) return;
            // One block per group, so the columns of a wide screen never part
            // a title from its list.
            var box = body.appendChild(SP.el('div', 'sp-legend-group'));
            box.appendChild(SP.el('h4', 'sp-legend-title', title));
            var list = SP.el('dl', 'sp-legend-list');
            rows.forEach(function (row) {
                var dt = SP.el('dt', 'sp-legend-mark');
                row.marks.forEach(function (mark) { if (mark) dt.appendChild(mark); });
                var dd = SP.el('dd', 'sp-legend-text');
                if (row.name) dd.appendChild(SP.el('b', null, row.name));
                if (row.name && row.text) dd.appendChild(document.createTextNode(' — '));
                if (row.text) {
                    var text = SP.el('span', null, row.text);
                    if (/[Ѐ-ӿ]/.test(row.text)) text.lang = 'ru';
                    dd.appendChild(text);
                }
                list.appendChild(dt);
                list.appendChild(dd);
            });
            box.appendChild(list);
        }

        group('Chips', (options.stages || []).map(function (stage) {
            return { marks: [SP.iconSpan(stage.icon)], name: stage.title, text: stage.titleRu };
        }).concat((options.reference || []).map(function (entry) {
            return { marks: [SP.iconSpan(entry.icon)], name: entry.name, text: entry.text };
        })));

        group('Lists', SP.SECTIONS.map(function (kind) {
            return { marks: [SP.iconSpan(SP.SECTION_ICON[kind])], name: SP.SECTION_LABEL[kind], text: SECTION_HINT[kind] };
        }).concat([{
            marks: [legendMark('sp-legend-edge is-learned'), legendMark('sp-legend-edge is-pending')],
            text: 'the edge of a row: green in Learned, orange in Pending'
        }]));

        group('Marks', [
            {
                marks: [legendMark('sp-mark', SP.icon.check()), legendMark('sp-mark is-on', SP.icon.check())],
                text: 'tick a word to put it in Pending, untick to take it out'
            },
            {
                marks: [legendMark('sp-pin', SP.icon.pin()), legendMark('sp-pin is-on', SP.icon.pin())],
                text: 'lift a learned word' + (options.stars ? ', a rule or a pattern' : '') +
                    ' to the top of its list; again to put it back'
            },
            {
                marks: [SP.icon.eyeOff()],
                name: 'ES · EN',
                text: 'the lit one is the side a covered row hides: ES the Spanish, EN the English and the Russian'
            },
            {
                marks: [legendMark('sp-legend-chevron', SP.icon.chevron())],
                text: 'a tap on a row opens its forms and examples, and on a covered row shows the hidden side'
            },
            {
                marks: [legendMark('sp-legend-sample', document.createTextNode('tengo'))],
                text: 'a tap on an example, a form or a Spanish cell of a table says it aloud; a second tap, slower'
            },
            { marks: [legendMark('sp-ask-icon')], text: 'ask ChatGPT about the word' },
            options.stars ? {
                marks: [legendMark('sp-badge is-top', document.createTextNode('★ 1'))],
                text: 'learn first: the place among the rules or the patterns to start with'
            } : null
        ]);

        // A dot beside a verb says how much of its table of forms is to learn.
        group('Verbs', ['regular', 'stem', 'irregular'].map(function (key) {
            var kind = SP.verbs.kind(key);
            return kind && { marks: [legendMark('sp-verb-dot is-' + key)], name: kind.ru, text: kind.hint };
        }));

        return { toggle: toggle, body: body };
    };
})();
