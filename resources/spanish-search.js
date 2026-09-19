/* Search over the Spanish lists: what a query matches, where it was found
   and how the three zones a search leaves are drawn.
   Part of the Spanish section, which loads four files in this order:
   spanish-core.js -> spanish-search.js -> spanish-prose.js -> spanish-rows.js.
   Everything is built with createElement + textContent — the JSON carries no
   markup, and nothing here ever assigns innerHTML.
   Extends window.SP. */

(function () {
    'use strict';

    var SP = window.SP;
    /* ---------- search ---------- */

    // Accents are a spelling detail, not a search term: "esta" has to find
    // "está" and "solo" has to find "sólo", so both sides are folded down to
    // bare letters before they meet.
    SP.normalize = function (text) {
        return String(text === undefined || text === null ? '' : text)
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    };

    // What the row itself prints, folded once and kept on the item: the pool is
    // rebuilt on every keystroke, and 1552 items would otherwise be re-folded
    // each time. The topic and the table name are folded apart from it — they
    // are searched too, but they are not the word, and a search now says which
    // of the two it found (SP.hitRank).
    function searchOwn(item) {
        if (item._searchOwn === undefined) {
            item._searchOwn = SP.normalize([
                item.es, item.tr, item.en, item.ru, item.prompt, item.answer
            ].filter(Boolean).join(' '));
        }
        return item._searchOwn;
    }

    function searchMeta(item) {
        if (item._searchMeta === undefined) {
            item._searchMeta = SP.normalize([item.group, item.set].filter(Boolean).join(' '));
        }
        return item._searchMeta;
    }

    // The examples are searched apart from the rest. They are what the phrase
    // items became, so this is the only place that text still lives — and the
    // hub needs to know a match came from here alone, to open the drawer that
    // holds it. Folded once and kept, like the line above.
    function exampleText(item) {
        if (item._searchEx === undefined) {
            item._searchEx = SP.normalize((item.ex || []).map(function (line) {
                return line.es + ' ' + line.ru;
            }).join(' '));
        }
        return item._searchEx;
    }

    // A query lands on the start of a word and never in the middle of one:
    // `hora` is `la hora` and must not drag in `ahora`, the way `час` must not
    // drag in `сейчас`. The far end is left open on purpose — the field
    // searches as it is typed, so `hab` still has to reach `hablar`, and a stem
    // is how a word is looked for anyway. Both sides are folded by then, so a
    // word is bare lowercase letters and digits.
    var WORD = /[0-9a-zа-я]/;

    // `whole` asks for the far boundary too — the query is the word and not
    // just its start, which is what the first zone of a search is made of.
    function indexOfWord(text, query, from, whole) {
        var at = text.indexOf(query, from);
        while (at !== -1) {
            // charAt(-1) is '', which no letter matches — so the first word of
            // a text is a word start like any other.
            if (!WORD.test(text.charAt(at - 1)) && !(whole && WORD.test(text.charAt(at + query.length)))) return at;
            at = text.indexOf(query, at + 1);
        }
        return -1;
    }

    // `query` must come from SP.normalize — the caller folds it once per pass
    // rather than once per item.
    SP.matches = function (item, query) {
        if (!query) return true;
        return SP.matchesOwn(item, query) || SP.matchesExample(item, query);
    };

    // True when the query is found in what the row itself carries — its texts,
    // its topic or the table it belongs to. Anything else is in the examples.
    SP.matchesOwn = function (item, query) {
        if (!query) return true;
        return indexOfWord(searchOwn(item), query, 0, false) !== -1 ||
            indexOfWord(searchMeta(item), query, 0, false) !== -1;
    };

    // True when the query is found in the examples of a word. The caller uses
    // it to tell a row that matched on its own text from one that matched on
    // something folded away inside it.
    SP.matchesExample = function (item, query) {
        if (!query || !item.ex || !item.ex.length) return false;
        return indexOfWord(exampleText(item), query, 0, false) !== -1;
    };

    // The same fold as SP.normalize, kept character by character: `map[i]` is
    // the source character the i-th folded one came from, so a hit found among
    // bare letters can be pointed back at the accented ones on the screen. The
    // closing entry is the length of the text itself — that way a hit running
    // to the last letter has a bound, and a combining mark the fold dropped
    // rides inside the hit with the letter it belongs to.
    function foldMap(text) {
        var out = '';
        var map = [];
        for (var i = 0; i < text.length; i++) {
            var piece = SP.normalize(text.charAt(i));
            for (var j = 0; j < piece.length; j++) map.push(i);
            out += piece;
        }
        map.push(text.length);
        return { text: out, map: map };
    }

    // Every place the query sits in one piece of text, in that text's own
    // indexes: [{start, end}]. Only the rows a search has already found are
    // walked this way, so nothing here is cached.
    SP.findHits = function (text, query) {
        var hits = [];
        if (!query || !text) return hits;
        var folded = foldMap(String(text));
        var at = 0;
        while ((at = indexOfWord(folded.text, query, at, false)) !== -1) {
            hits.push({ start: folded.map[at], end: folded.map[at + query.length] });
            at += query.length;
        }
        return hits;
    };

    // A search field that reports every change, settled so a fast typist does
    // not redraw a long list on every letter.
    // It draws its own ✕. The one a type="search" field comes with shows only
    // while the field has the focus or the pointer — on a phone, only while the
    // keyboard is up, so once that is put away the results have nothing left
    // to close them with. This one stays for as long as there is text (the CSS
    // hides it by :placeholder-shown), and the native one is hidden.
    SP.searchBox = function (placeholder, onChange) {
        var box = SP.el('div', 'sp-search-box');
        var input = SP.el('input', 'sp-search');
        input.type = 'search';
        input.placeholder = placeholder;
        input.setAttribute('aria-label', placeholder);
        var timer = null;
        input.addEventListener('input', function () {
            clearTimeout(timer);
            timer = setTimeout(onChange, 140);
        });

        var clearBtn = SP.el('button', 'sp-search-clear');
        clearBtn.type = 'button';
        clearBtn.title = 'Clear the search';
        clearBtn.setAttribute('aria-label', 'Clear the search');
        clearBtn.appendChild(SP.icon.cross());

        // A tap leaves the focus where it was: with the keyboard up it stays up
        // for the next word, and once put away it is not brought back.
        var hadFocus = false;
        clearBtn.addEventListener('pointerdown', function () { hadFocus = document.activeElement === input; });
        clearBtn.addEventListener('mousedown', function (e) { e.preventDefault(); });
        clearBtn.addEventListener('click', function (e) {
            clearTimeout(timer);
            input.value = '';
            // Pressed from the keyboard (detail 0), the button has just hidden
            // itself from under the focus, so the focus goes back to the field.
            if (hadFocus || e.detail === 0) input.focus();
            hadFocus = false;
            onChange();
        });

        box.appendChild(input);
        box.appendChild(clearBtn);
        return {
            node: box,
            input: input,
            query: function () { return SP.normalize(input.value.trim()); },
            clear: function () { input.value = ''; }
        };
    };

    /* ---------- painting what matched ---------- */

    SP.hilite = function (node, query) {
        if (!node || !query) return node;
        walkText(node, function (text) { splitHits(text, query); });
        return node;
    };

    function walkText(node, fn) {
        // The next sibling is taken before the callback runs: a hit replaces
        // the text node it was found in with a fragment.
        for (var child = node.firstChild; child;) {
            var next = child.nextSibling;
            if (child.nodeType === 3) fn(child);
            else if (child.nodeType === 1) walkText(child, fn);
            child = next;
        }
    }

    function splitHits(text, query) {
        var value = text.nodeValue;
        var hits = SP.findHits(value, query);
        if (!hits.length) return;
        var frag = document.createDocumentFragment();
        var pos = 0;
        hits.forEach(function (hit) {
            if (hit.start > pos) frag.appendChild(document.createTextNode(value.slice(pos, hit.start)));
            frag.appendChild(SP.el('span', 'sp-hit', value.slice(hit.start, hit.end)));
            pos = hit.end;
        });
        if (pos < value.length) frag.appendChild(document.createTextNode(value.slice(pos)));
        text.parentNode.replaceChild(frag, text);
    }

    // A stage's thematic mark. Decoration only — the title beside it already
    // says which stage this is — so it is hidden from assistive tech.
    /* ---------- what a search leaves: three zones ---------- */

    // A search answers a different question than browsing does. Browsing asks
    // which of my lists a word is in, and the four sections answer it; a search
    // asks whether this is the word I typed. So what a query leaves is split in
    // three, in the order they are wanted: the word itself, a longer word that
    // begins with it (`hora` → `horario`), and a word that carries it only in
    // the examples folded under it. The sections step aside while a query is
    // live — every found row already wears the list it is in (SP.tagRow), so
    // nothing is lost by drawing the zones flat.
    SP.ZONES = ['exact', 'partial', 'example'];
    SP.ZONE_LABEL = {
        exact: 'Exact match',
        partial: 'Part of another word',
        example: 'Only in examples'
    };

    // Which zone an entry belongs to, or null when it does not match at all.
    // `query` is folded, as everywhere else.
    SP.hitRank = function (item, query) {
        if (!query) return null;
        var own = searchOwn(item);
        if (indexOfWord(own, query, 0, true) !== -1) return 'exact';
        if (indexOfWord(own, query, 0, false) !== -1) return 'partial';
        // Found by its topic or its table, a word is not the word either — it
        // is a neighbour of it, which is what the middle zone holds.
        if (indexOfWord(searchMeta(item), query, 0, false) !== -1) return 'partial';
        return SP.matchesExample(item, query) ? 'example' : null;
    };

    SP.splitZones = function (items, query) {
        var zones = {};
        SP.ZONES.forEach(function (kind) { zones[kind] = []; });
        items.forEach(function (item) {
            var kind = SP.hitRank(item, query);
            if (kind) zones[kind].push(item);
        });
        return zones;
    };

    // The header of a zone: the section line without the fold. A zone is what
    // this query left, so there is nothing to keep folded away between two
    // keystrokes.
    SP.zoneDivider = function (kind, count) {
        var node = SP.el('div', 'sp-divider is-zone');
        node.appendChild(SP.el('span', 'sp-divider-label', SP.ZONE_LABEL[kind] + ' · ' + count));
        return node;
    };

    // Said in capitals because it is the answer to the question that was asked:
    // the word itself is in none of the lists, and everything below it is
    // somewhere the letters merely turned up.
    SP.noExactNote = function () {
        return SP.el('p', 'sp-noexact', 'NO EXACT MATCH');
    };

    // Draws what a search found as those three zones, flat: no section headers
    // and no topic blocks. `limit` is how many rows this pass may draw in all —
    // the caller owns the "show more" button, since the hub and a stage page
    // each have their own — and what comes back says how far it got.
    //
    // opts.row(item, mark, query) -> the row element
    // opts.zoneFor(item)          -> a fresh container for rows of its kind
    // opts.key(item)              -> which container an item belongs in
    // opts.seam(prev, item)       -> an optional divider before a row (prev is
    //                                null for the first row of a zone)
    // opts.onMark(on)             -> after a checkbox is toggled
    SP.renderZoneList = function (parent, items, query, limit, opts) {
        var zones = SP.splitZones(items, query);
        var total = SP.ZONES.reduce(function (n, kind) { return n + zones[kind].length; }, 0);
        var drawn = 0;
        var index = [];

        function zoneRow(item) {
            var row, tag;
            var kind = SP.sectionOf(item);
            // As in a browsing list: a table row and a learned row cannot move,
            // so neither carries the checkbox that would move it.
            var fixed = kind === 'reference' || kind === 'learned';
            var mark = fixed ? null : SP.markButton(item, function (on) {
                SP.setRowState(row, false, on);
                SP.setSectionTag(tag, on ? 'pending' : 'left');
                if (opts.onMark) opts.onMark(on);
            });
            row = opts.row(item, mark, query);
            SP.setRowState(row, kind === 'learned', kind === 'pending');
            // Found by an example alone, the row would come up with nothing on
            // it that matches — so the drawer holding the match opens itself.
            if (!SP.matchesOwn(item, query) && SP.matchesExample(item, query)) {
                SP.setDrawerOpen(row, true);
            }
            // A zone says how the word was found, never which list it is in.
            tag = SP.tagRow(row, kind);
            return row;
        }

        SP.ZONES.forEach(function (kind) {
            var list = zones[kind];
            // The answer to the question, said once and above everything the
            // search did find rather than beside the rows that are not it.
            if (kind === 'exact' && !list.length && total) parent.appendChild(SP.noExactNote());
            if (!list.length || drawn >= limit) return;

            var head = SP.zoneDivider(kind, list.length);
            head.id = 'sp-zone-' + kind;
            parent.appendChild(head);
            index.push({ row: 'main', label: SP.ZONE_LABEL[kind], target: head.id });

            var box = null;
            var boxKey = null;
            var prev = null;
            for (var i = 0; i < list.length && drawn < limit; i++) {
                var item = list[i];
                var key = opts.key ? opts.key(item) : '';
                // Words and drills are different lists in the markup — one a
                // div, one an ol — so a zone holding both opens a container per
                // run rather than one for the zone.
                if (!box || key !== boxKey) {
                    box = opts.zoneFor(item);
                    boxKey = key;
                    parent.appendChild(box);
                }
                var seam = opts.seam ? opts.seam(prev, item) : null;
                if (seam) box.appendChild(seam);
                box.appendChild(zoneRow(item));
                prev = item;
                drawn += 1;
            }
        });

        return { drawn: drawn, total: total, index: index };
    };

    // Opens a row with the checkbox and flags the row so the CSS gives its grid
    // the extra control column. The checkbox leads the row, in the DOM as on the
    // screen, as far from the speak button as the row allows: side by side at
    // the tail, a tap meant for the speaker could unmark the word.
    // A learned row and a row of a Reference table pass no checkbox and get no
    // column: there is nothing to tick, and an empty cell only pushed the text
    // away from the edge. Every list row is still a row you can test yourself
    // on, so the reveal listener goes on regardless — it does nothing until the
    // row is in Learned or Pending, and the mark and speak buttons stop the
    // click before it reaches the row.
})();
