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
    // Which tables of Reference are open, kept for this page load alone: a
    // table is looked up, not worked through over days, so a fresh page opens
    // on the tiles. Keyed by stage and name — a set's name is unique within
    // its stage, and two stages may one day call a table the same thing.
    var openTables = Object.create(null);
    var tableListeners = [];
    function tableKey(item) { return item.stage + ':' + item.set; }
    SP.tables = {
        isOpen: function (item) { return !!openTables[tableKey(item)]; },
        setOpen: function (item, on) {
            openTables[tableKey(item)] = !!on;
            tableListeners.forEach(function (fn) { fn(); });
        },
        onChange: function (fn) { tableListeners.push(fn); }
    };

    // Reference opens on its tiles: one per table, in the order the stage
    // declares its sets, each a button carrying the table's picture (the
    // set's icon), its name and its size. A tap unfolds the table below the
    // grid and a second tap folds it back; the rows of a closed table are not
    // drawn at all, so a page of a long list is never spent on them. `items`
    // are the Reference rows of one stage, already through SP.orderBySet, so
    // every table is one run of them.
    SP.setTiles = function (items) {
        var grid = SP.el('div', 'sp-set-grid');
        var tables = [];
        items.forEach(function (item) {
            var last = tables[tables.length - 1];
            if (last && last.item.set === item.set) { last.count++; return; }
            tables.push({ item: item, count: 1 });
        });
        tables.forEach(function (table) {
            var tile = SP.el('button', 'sp-set-tile');
            tile.type = 'button';
            var pic = SP.iconSpan(table.item.setIcon);
            if (pic) { pic.classList.add('sp-set-icon'); tile.appendChild(pic); }
            tile.appendChild(SP.el('span', 'sp-set-name', table.item.set));
            tile.appendChild(SP.el('span', 'sp-set-count', table.count));
            tile.appendChild(SP.icon.chevron());
            var open = SP.tables.isOpen(table.item);
            tile.setAttribute('aria-expanded', open ? 'true' : 'false');
            tile.title = (open ? 'Hide' : 'Show') + ' the table';
            tile.addEventListener('click', function () {
                SP.tables.setOpen(table.item, !SP.tables.isOpen(table.item));
            });
            grid.appendChild(tile);
        });
        return grid;
    };

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
    // Opening also reveals the row. The examples spell out the Spanish and the
    // Russian alike, so leaving the word itself under a bar would be hiding an
    // answer that is already on the screen.
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
        if (on && covered(row)) row.classList.add('is-revealed');
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
        tenses.forEach(function (tense) {
            var th = SP.el('th');
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
            tenses.forEach(function (tense) {
                var form = (verb[tense.key] || [])[i] || '';
                var td = SP.el('td');
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
            SP.tts.speak(cell.dataset.form);
        });
        return wrap;
    }

    // `named` spells the infinitive out on the head line. A word has it written
    // directly above; a pair is two verbs, and without the name neither column
    // of forms says which half it belongs to.
    function formsBlock(verb, named) {
        var box = SP.el('div', 'sp-forms');
        var grid = SP.el('div', 'sp-forms-grid');
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
            if (on && !grid.firstChild) grid.appendChild(formsTable(verb));
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

    function lexEs(es) {
        var box = SP.el('div', 'sp-lex-es');
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
        head.appendChild(lexEs(part.es));
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
        if (ex) row.appendChild(ex.drawer);
        // The mark leads a word's first line, inside its head; a pair keeps it
        // on the row, in a column of its own, so the two halves start level.
        return SP.attachMark(row, mark, halves ? null : head);
    };
})();
