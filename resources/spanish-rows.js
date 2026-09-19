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
            node.appendChild(SP.icon.chevron());
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
    // touch target of .sp-speak at the other end of the row.
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
                // cannot do on paper.
                var btn = SP.el('button', 'sp-forms-cell', form);
                btn.type = 'button';
                btn.dataset.form = form;
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
    // A word with forms or examples gets a chevron at the head of its tools and
    // a drawer under it. A word with neither is built exactly as before: no
    // control, and no third button narrowing the text line on a phone.
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
    // The mark a verb wears beside the word itself, so its kind is legible
    // without opening anything: a filled dot for one that has forms to
    // memorise, a ring for one whose root merely alternates. A regular verb
    // gets none — what is marked here is what needs attention, and a dot on
    // two words in three would only be noise. Filled against hollow carries
    // the same thing as the colour does, for whoever cannot tell the two
    // apart; the title names the kind in words.
    function verbDot(verb) {
        if (!verb || verb.kind === 'regular') return null;
        var kind = SP.verbs.kind(verb.kind);
        var dot = SP.el('span', 'sp-verb-dot is-' + verb.kind);
        dot.setAttribute('role', 'img');
        dot.title = verb.es + ' — ' + (kind ? kind.ru : verb.kind);
        dot.setAttribute('aria-label', dot.title);
        return dot;
    }

    // The Spanish of a row, with those marks in it. A pair is two words with a
    // kind each, so its text is built from the halves rather than taken whole —
    // one dot at the end of the line could not say which half it belongs to.
    // The halves joined by " / " are exactly item.es, which verify.js enforces,
    // so nothing on the screen changes for a pair that carries no verb.
    // A word and its dot are one thing and must not be split: the Spanish cell
    // is `overflow-wrap: anywhere`, which on a 360px phone happily left the dot
    // alone at the head of the second line. The longest infinitive in the
    // corpus is eleven letters, so nothing wrapped this way can outgrow the
    // cell and nothing needs the wrap opportunity that is given up here.
    function wordWithDot(es, dot) {
        if (!dot) return document.createTextNode(es);
        var box = SP.el('span', 'sp-lex-word', es);
        box.appendChild(dot);
        return box;
    }

    function lexEs(item) {
        var box = SP.el('div', 'sp-lex-es');
        var halves = item.type === 'pair' && item.a && item.b ? [item.a, item.b] : null;
        var dots = halves ? halves.map(function (half) { return verbDot(SP.verbs.get(half.es)); }) : null;

        if (dots && (dots[0] || dots[1])) {
            halves.forEach(function (half, i) {
                if (i) box.appendChild(document.createTextNode(' / '));
                box.appendChild(wordWithDot(half.es, dots[i]));
            });
            return box;
        }

        var dot = halves ? null : verbDot(SP.verbs.get(item.es));
        box.appendChild(wordWithDot(item.es, dot));
        return box;
    }

    SP.renderLexRow = function (item, mark, query) {
        var row = SP.el('div', 'sp-lex-row' + (item.type === 'pair' ? ' is-pair' : ''));
        var verbs = SP.verbsOf(item);
        var ex = (item.ex && item.ex.length) || verbs.length ? drawerToggle(item, row, query, verbs) : null;

        // On a phone the four texts read as four lines — "y", "(и)", "— [and]",
        // "— [и]" — so they sit in a box of their own; from 700px up that box
        // is display:contents and they go back to being four grid columns.
        // A field is left out when it is empty rather than added blank: the
        // brackets and dashes between them are drawn by CSS from what is there.
        var text = SP.el('div', 'sp-lex-text');
        text.appendChild(lexEs(item));
        if (item.tr) text.appendChild(SP.el('div', 'sp-lex-tr', item.tr));
        if (item.en) text.appendChild(SP.el('div', 'sp-lex-en', item.en));
        if (item.ru) text.appendChild(SP.el('div', 'sp-lex-ru', item.ru));
        // Before the row goes on the page and before the section tag is hung
        // on the Spanish: the tag is added by the caller, and it is text too.
        SP.hilite(text, query);
        row.appendChild(text);

        var halves = item.type === 'pair' && item.a && item.b && item.a.es && item.b.es
            ? [item.a.es, item.b.es]
            : null;
        row.appendChild(SP.rowTools(item.es, 'word', ex && ex.button, halves));
        if (ex) row.appendChild(ex.drawer);
        return SP.attachMark(row, mark);
    };
})();
