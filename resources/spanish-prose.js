/* Prose and reference rendering: the block arrays the JSON carries, the three
   rules diagrams, the chip index and the rules page itself.
   Part of the Spanish section, which loads four files in this order:
   spanish-core.js -> spanish-search.js -> spanish-prose.js -> spanish-rows.js.
   Everything is built with createElement + textContent — the JSON carries no
   markup, and nothing here ever assigns innerHTML.
   Extends window.SP. */

(function () {
    'use strict';

    var SP = window.SP;
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

    function cellKey(cell) {
        return (cell || []).map(function (span) {
            if (!span || span.t === undefined) return '';
            return (span.s || '') + '\u0001' + span.t;
        }).join('\u0002');
    }

    // Ключ правила повторяется в каждой строке своих примеров — на экране он нужен один раз.
    // Считаем, сколько строк подряд делят первую ячейку: 0 означает «строка без своей первой ячейки».
    function firstColumnSpans(rows) {
        var spans = rows.map(function () { return 0; });
        var head = -1;
        rows.forEach(function (row, i) {
            var key = cellKey(row && row[0]);
            if (head >= 0 && key && key === cellKey(rows[head][0])) {
                spans[head]++;
                return;
            }
            head = i;
            spans[i] = 1;
        });
        return spans;
    }

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
        var rows = block.rows || [];
        var spans = firstColumnSpans(rows);
        var tbody = SP.el('tbody');
        rows.forEach(function (row, i) {
            var tr = SP.el('tr');
            row.forEach(function (cell, col) {
                if (col === 0) {
                    if (!spans[i]) return;
                    var td = SP.el('td');
                    if (spans[i] > 1) td.rowSpan = spans[i];
                    SP.renderSpans(tr.appendChild(td), cell);
                    return;
                }
                SP.renderSpans(tr.appendChild(SP.el('td')), cell);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        wrap.appendChild(table);
        return wrap;
    }

    /* ---------- what waits behind a chevron ---------- */

    // A rule states itself in a line and keeps its examples under that line,
    // out of sight until the chevron at the line's end is pressed — the drawer
    // a word opens in the lists, down to the button and its titles. A rule is
    // read for what it says; a page that showed every example at once was a
    // wall of tables between one rule and the next, and on a phone each of
    // them scrolled sideways. The state is not remembered: a rules section is
    // read through, not worked with over days like a list of words.
    //
    // `box` gets the drawer after everything already in it, and is-open while
    // the drawer is out; `head` gets the chevron at its end; `fill` puts in
    // what the drawer holds, and `what` names it for the button. The drawer is
    // filled at once rather than on the first open: a rules page holds a couple
    // of hundred short lines, and a page drawn whole can still be searched and
    // printed from the browser.
    var drawerSeq = 0;

    SP.drawer = function (box, head, fill, what) {
        var drawer = SP.el('div', 'sp-drawer');
        drawer.id = 'sp-drawer-x' + (drawerSeq += 1);
        drawer.hidden = true;
        fill(drawer);

        var btn = SP.el('button', 'sp-drawer-toggle');
        btn.type = 'button';
        btn.setAttribute('aria-controls', drawer.id);
        btn.appendChild(SP.icon.chevron());

        function sync(open) {
            var label = (open ? 'Hide ' : 'Show ') + what;
            btn.title = label;
            btn.setAttribute('aria-label', label);
            btn.setAttribute('aria-expanded', open ? 'true' : 'false');
            box.classList.toggle('is-open', open);
        }
        sync(false);

        btn.addEventListener('click', function () {
            var open = drawer.hidden;
            drawer.hidden = !open;
            sync(open);
        });

        head.appendChild(btn);
        box.appendChild(drawer);
        return drawer;
    };

    // The examples of one line. A line may carry a label — the case a run of
    // examples illustrates (-ar, ser, «Перед глаголом») — drawn once, above
    // the run it opens.
    SP.exampleDrawer = function (box, head, lines) {
        return SP.drawer(box, head, function (drawer) {
            (lines || []).forEach(function (line) {
                if (line.label) drawer.appendChild(SP.el('div', 'sp-exline-label', line.label));
                drawer.appendChild(SP.exampleLine(line));
            });
        }, 'the examples');
    };

    // A line of a rule: its text, the chevron at the end of it when it has
    // examples, and the drawer under both. A list any of whose lines carries
    // examples draws every line this way, so a line without them keeps the
    // shape of its neighbours and simply has no button.
    function ruleLine(tag, textTag, spans, lines) {
        var box = SP.el(tag, 'sp-rule');
        var head = box.appendChild(SP.el('div', 'sp-rule-head'));
        SP.renderSpans(head.appendChild(SP.el(textTag, 'sp-rule-text')), spans);
        if (lines && lines.length) SP.exampleDrawer(box, head, lines);
        return box;
    }

    /* ---------- rules diagrams ---------- */

    // A fork: the choice a rule comes down to, as two or three columns instead
    // of a table whose first column repeated the key on every row. A column is
    // its head word plus the sense it carries; a row is the same {es, ru, frame}
    // shape the patterns and the usage examples use, so the highlight is free.
    // The palette lives in CSS, keyed by the column's place — never in JSON.
    function forkBlock(block) {
        var root = SP.el('div', 'sp-fork');
        if (block.q) root.appendChild(SP.el('p', 'sp-fork-q', block.q));
        var cols = SP.el('div', 'sp-fork-cols');
        (block.cols || []).forEach(function (col) {
            var card = SP.el('div', 'sp-fork-col');
            var head = SP.el('div', 'sp-fork-head');
            head.appendChild(SP.el('span', 'sp-fork-key', col.es));
            card.appendChild(head);
            if (col.hint) card.appendChild(SP.el('p', 'sp-fork-hint', col.hint));
            var rows = SP.el('div', 'sp-fork-rows');
            (col.rows || []).forEach(function (line) {
                var row = SP.el('div', 'sp-fork-row');
                if (line.label) row.appendChild(SP.el('span', 'sp-fork-label', line.label));
                SP.renderFramed(row.appendChild(SP.el('span', 'sp-fork-es')), line);
                row.appendChild(SP.el('span', 'sp-fork-ru', line.ru));
                rows.appendChild(row);
            });
            card.appendChild(rows);
            cols.appendChild(card);
        });
        root.appendChild(cols);
        return root;
    }

    // A cell of a conjugation grid is either a stem plus an ending or a whole
    // irregular form. Either way the part that changes goes into .sp-conj-end,
    // so one rule lights it, hides it and groups it with its twins. The key of
    // the group is `hl` when the file names it — a group like the -go of hago,
    // pongo, salgo is not something an ending can be read off.
    function conjCell(col, cell) {
        var raw = (cell && typeof cell === 'object') ? cell : { f: cell };
        var stem = raw.s !== undefined ? raw.s : col.stem;
        var end = (raw.f === undefined || raw.f === null) ? '' : String(raw.f);
        stem = stem || '';
        return { stem: stem, end: end, hl: raw.hl || (stem ? end : ''), form: stem + end };
    }

    function conjBlock(block) {
        var root = SP.el('div', 'sp-conj');
        var cols = block.cols || [];

        // Chips pick one verb at a time on a phone. They earn their place only
        // when the columns name verbs: where they name persons, the point is
        // seeing the whole set at once and the table's sideways scroll is right.
        var picky = cols.length > 1 && cols.every(function (col) { return !!col.inf; });
        if (picky) {
            root.classList.add('is-picky');
            root.dataset.pick = '0';
        }

        var tools = SP.el('div', 'sp-conj-tools');
        if (picky) {
            var chips = SP.el('div', 'sp-conj-chips');
            cols.forEach(function (col, i) {
                var chip = SP.el('button', 'sp-btn' + (i === 0 ? ' active' : ''), col.head);
                chip.type = 'button';
                chip.dataset.pick = String(i);
                chip.setAttribute('aria-pressed', i === 0 ? 'true' : 'false');
                chips.appendChild(chip);
            });
            chips.addEventListener('click', function (e) {
                var chip = e.target.closest && e.target.closest('.sp-btn');
                if (!chip || !chips.contains(chip)) return;
                root.dataset.pick = chip.dataset.pick;
                Array.prototype.forEach.call(chips.children, function (node) {
                    var on = node === chip;
                    node.classList.toggle('active', on);
                    node.setAttribute('aria-pressed', on ? 'true' : 'false');
                });
            });
            tools.appendChild(chips);
        }
        if (block.hide) {
            // The label comes from the file: it is honestly different from one
            // grid to the next — endings here, whole forms there.
            var toggle = SP.el('button', 'sp-btn', block.hide);
            toggle.type = 'button';
            toggle.setAttribute('aria-pressed', 'false');
            toggle.addEventListener('click', function () {
                var on = !root.classList.contains('is-hiding');
                root.classList.toggle('is-hiding', on);
                toggle.classList.toggle('active', on);
                toggle.setAttribute('aria-pressed', on ? 'true' : 'false');
                Array.prototype.forEach.call(root.querySelectorAll('.sp-conj-cell.is-shown'), function (node) {
                    node.classList.remove('is-shown');
                });
            });
            tools.appendChild(toggle);
        }
        if (tools.firstChild) root.appendChild(tools);

        var wrap = SP.el('div', 'sp-table-wrap');
        var table = SP.el('table', 'sp-table sp-conj-table');
        var thead = SP.el('thead');
        var hr = SP.el('tr');
        hr.appendChild(SP.el('th', null, block.rowsHead || ''));
        cols.forEach(function (col, i) {
            var th = SP.el('th', 'sp-c' + i);
            th.appendChild(SP.el('span', 'sp-conj-head-name', col.head));
            if (col.inf) th.appendChild(SP.el('span', 'sp-conj-head-inf', col.inf));
            hr.appendChild(th);
        });
        thead.appendChild(hr);
        table.appendChild(thead);

        var tbody = SP.el('tbody');
        (block.rows || []).forEach(function (row) {
            var tr = SP.el('tr');
            if (row.band !== undefined) {
                var band = SP.el('td', 'sp-conj-band', row.band);
                band.colSpan = cols.length + 1;
                tr.appendChild(band);
                tbody.appendChild(tr);
                return;
            }
            var label = SP.el('td');
            label.appendChild(SP.el('span', 'sp-conj-label', row.label));
            // The gloss rides under the label instead of taking a column of
            // its own: one column fewer is what fits a phone.
            if (row.ru) label.appendChild(SP.el('span', 'sp-conj-gloss', row.ru));
            tr.appendChild(label);
            cols.forEach(function (col, i) {
                var td = SP.el('td', 'sp-conj-td sp-c' + i);
                var parts = conjCell(col, (row.cells || [])[i]);
                var btn = SP.el('button', 'sp-conj-cell');
                btn.type = 'button';
                btn.setAttribute('aria-pressed', 'false');
                if (parts.hl) btn.dataset.hl = parts.hl;
                btn.dataset.form = parts.form;
                if (parts.stem) btn.appendChild(SP.el('span', 'sp-conj-stem', parts.stem));
                btn.appendChild(SP.el('span', 'sp-conj-end', parts.end));
                td.appendChild(btn);
                tr.appendChild(td);
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        wrap.appendChild(table);
        root.appendChild(wrap);

        // One tap answers "tell me about this form": it says the form out loud
        // and lights every other cell built the same way.
        root.addEventListener('click', function (e) {
            var cell = e.target.closest && e.target.closest('.sp-conj-cell');
            if (!cell || !root.contains(cell)) return;
            if (root.classList.contains('is-hiding') && !cell.classList.contains('is-shown')) {
                cell.classList.add('is-shown');
                SP.tts.speak(cell.dataset.form);
                return;
            }
            var key = cell.dataset.hl || '';
            var lit = cell.classList.contains('is-lit');
            Array.prototype.forEach.call(root.querySelectorAll('.sp-conj-cell'), function (node) {
                var on = !lit && !!key && node.dataset.hl === key;
                node.classList.toggle('is-lit', on);
                node.setAttribute('aria-pressed', on ? 'true' : 'false');
            });
            SP.tts.speak(cell.dataset.form);
        });
        return root;
    }

    // A paragraph or a list line with `ex` keeps its examples behind a chevron
    // (see ruleLine above). Only the rules carry them; a note or a stage's
    // intro is drawn as it always was.
    SP.renderBlocks = function (parent, blocks) {
        (blocks || []).forEach(function (block) {
            if (!block) return;
            if (block.k === 'p') {
                if (block.ex && block.ex.length) parent.appendChild(ruleLine('div', 'p', block.spans, block.ex));
                else SP.renderSpans(parent.appendChild(SP.el('p')), block.spans);
            } else if (block.k === 'note') {
                SP.renderSpans(parent.appendChild(SP.el('p', 'sp-callout')), block.spans);
            } else if (block.k === 'ul' || block.k === 'ol') {
                var items = block.items || [];
                var ruled = items.some(function (item) { return item.ex && item.ex.length; });
                var list = SP.el(block.k === 'ul' ? 'ul' : 'ol', ruled ? 'sp-rules' : null);
                items.forEach(function (item) {
                    if (ruled) list.appendChild(ruleLine('li', 'div', item.spans, item.ex));
                    else SP.renderSpans(list.appendChild(SP.el('li')), item.spans);
                });
                parent.appendChild(list);
            } else if (block.k === 'table') {
                parent.appendChild(renderTable(block));
            } else if (block.k === 'fork') {
                parent.appendChild(forkBlock(block));
            } else if (block.k === 'conj') {
                parent.appendChild(conjBlock(block));
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

    /* ---------- chip index with scroll spy ---------- */

    // Shared by the reference pages and by the Rules tab on the hub: one chip
    // strip per entry.row, with an observer that keeps the visible section lit.
    SP.buildIndex = function (bar, entries, mainOnly) {
        var rows = {};
        if (mainOnly) entries = entries.filter(function (e) { return e.row === 'main'; });
        entries.forEach(function (entry) {
            if (!rows[entry.row]) {
                rows[entry.row] = SP.el('div', 'sp-chips');
                bar.appendChild(rows[entry.row]);
            }
            var chip = SP.el('a', 'sp-chip');
            chip.appendChild(SP.el('span', 'sp-chip-label', entry.label));
            chip.href = '#' + entry.target;
            chip.title = entry.label;
            chip.dataset.target = entry.target;
            rows[entry.row].appendChild(chip);
            entry.chip = chip;
        });

        if (!('IntersectionObserver' in window)) return null;

        var byTarget = {};
        entries.forEach(function (e) { byTarget[e.target] = e; });

        var observer = new IntersectionObserver(function (records) {
            records.forEach(function (record) {
                var entry = byTarget[record.target.id];
                if (!entry || !record.isIntersecting) return;
                entries.forEach(function (other) {
                    if (other.row === entry.row) other.chip.classList.toggle('active', other === entry);
                });
                // Keep the highlighted chip reachable without hunting for it.
                var strip = entry.chip.parentNode;
                var left = entry.chip.offsetLeft - strip.clientWidth / 2 + entry.chip.clientWidth / 2;
                strip.scrollTo({ left: Math.max(0, left), behavior: 'smooth' });
            });
        }, { rootMargin: '-88px 0px -70% 0px', threshold: 0 });

        entries.forEach(function (entry) {
            var node = document.getElementById(entry.target);
            if (node) observer.observe(node);
        });

        // Handed back so a page that rebuilds its index — a stage page does,
        // on every search — can disconnect the one it is replacing.
        return observer;
    };

    /* ---------- what to learn first ---------- */

    // The rules and the patterns each pick the entries to start with, and a
    // star with the rank marks each on the entry itself. The patterns close
    // their panel with a numbered list of them as well; the rules do not.

    // An example lights up the words that carry the point, so the sentence
    // shows the frame your own words go into. `line.frame` lists them in
    // order, each matched as a whole word — the "a" of "prefiero … a …" is not
    // the one in "playa". resources/spanish/verify.js runs the same search
    // over the files, so a frame that lights nothing fails there.
    var LETTER = /[A-Za-z\u00C0-\u024F]/;

    function findWord(text, word, from) {
        var at = text.indexOf(word, from);
        while (at !== -1) {
            if (!LETTER.test(text.charAt(at - 1)) && !LETTER.test(text.charAt(at + word.length))) return at;
            at = text.indexOf(word, at + 1);
        }
        return -1;
    }

    SP.renderFramed = function (node, line) {
        var text = line.es;
        var pos = 0;
        (line.frame || []).forEach(function (word) {
            var at = findWord(text, word, pos);
            if (at === -1) return;
            if (at > pos) node.appendChild(document.createTextNode(text.slice(pos, at)));
            node.appendChild(SP.el('span', 'sp-frame', word));
            pos = at + word.length;
        });
        if (pos < text.length) node.appendChild(document.createTextNode(text.slice(pos)));
        return node;
    };

    // One example under a parent entry — a pattern's formula, a line of a rule
    // or a word of the lists. The Spanish over the Russian on a phone, side by
    // side from 700px up, with whatever tail the caller hands it — nothing at
    // all under a word, where the lines are plain text on the full width and
    // the row above them carries the controls. An example of a reading rule
    // says how it sounds, after the Spanish: cena [θэна].
    SP.exampleLine = function (line, tools) {
        var row = SP.el('div', 'sp-exline');
        var es = SP.renderFramed(row.appendChild(SP.el('div', 'sp-exline-es')), line);
        if (line.sound) es.appendChild(SP.el('span', 'sp-exline-sound', line.sound));
        row.appendChild(SP.el('div', 'sp-exline-ru', line.ru));
        if (tools) row.appendChild(tools);
        return row;
    };

    // ★ N — the entry's place among the `total` to learn first.
    SP.topBadge = function (rank, total) {
        var badge = SP.el('span', 'sp-badge is-top', '★ ' + rank);
        badge.title = 'ТОП-' + total + ', №' + rank + ' — учить первыми';
        badge.setAttribute('aria-label', badge.title);
        return badge;
    };

    // One row per entry, in rank order: its name (a link to it when `href` is
    // given) → what it comes down to → one short example.
    // rows: [{ name: Node, href?, meaning, short: {es, ru, frame} }]
    SP.renderTopList = function (rows) {
        var list = SP.el('ol', 'sp-top');
        rows.forEach(function (row) {
            var li = SP.el('li', 'sp-top-row');
            var text = SP.el('div', 'sp-top-text');
            var name = row.name;
            if (row.href) {
                var link = SP.el('a', 'sp-top-link');
                link.href = row.href;
                link.appendChild(name);
                name = link;
            }
            text.appendChild(name);
            text.appendChild(SP.el('span', 'sp-top-meaning', row.meaning));
            var example = text.appendChild(SP.el('span', 'sp-top-ex'));
            SP.renderFramed(example.appendChild(SP.el('span', 'sp-top-es')), row.short);
            example.appendChild(SP.el('span', 'sp-top-ru', row.short.ru));
            li.appendChild(text);
            list.appendChild(li);
        });
        return list;
    };

    /* ---------- rules (phonetics and grammar) ---------- */

    // The map of the rules, by layer: the way into them, since the rules carry
    // no chip index of their own. A layer is a short column of links — the
    // number, the title and the star of each section — and the layers flow
    // into as many columns as the width holds, so the whole map is one glance
    // on a wide screen rather than a wall of tiles. It is built here rather
    // than as a block because every link needs the number, the title and the
    // star of a section, and renderBlocks never sees the file those live in.
    function mapSection(map, sections, topTotal) {
        var byId = {};
        sections.forEach(function (section) { byId[section.id] = section; });
        var block = SP.el('section', 'sp-group');
        block.id = 'esr-map';
        block.appendChild(SP.el('h3', 'sp-group-title', map.title));
        var layers = SP.el('div', 'sp-map');
        (map.layers || []).forEach(function (layer) {
            var box = SP.el('div', 'sp-map-layer');
            box.appendChild(SP.el('div', 'sp-map-title', layer.title));
            if (layer.hint) box.appendChild(SP.el('div', 'sp-map-hint', layer.hint));
            var list = SP.el('ul', 'sp-map-list');
            (layer.ids || []).forEach(function (id) {
                var section = byId[id];
                if (!section) return;
                var link = SP.el('a', 'sp-map-link');
                link.href = '#' + id;
                link.appendChild(SP.el('span', 'sp-map-no', String(section.no)));
                // The star rides at the end of the title's last line, wherever
                // the title wraps, rather than at the edge of the column.
                var name = link.appendChild(SP.el('span', 'sp-map-name', section.title));
                if (section.top) name.appendChild(SP.topBadge(section.top, topTotal));
                list.appendChild(SP.el('li')).appendChild(link);
            });
            box.appendChild(list);
            layers.appendChild(box);
        });
        block.appendChild(layers);
        return block;
    }

    // Rendered both as its own page and as a tab on the hub. It carries no title
    // of its own: on the page the breadcrumb and the tab say what this is, and
    // inside the hub panel a heading only repeated the Rules chip above it.
    // First the key to the transcription, folded to its heading — a table of a
    // row per reading rule that is looked up, not read on arrival — then the
    // map, then the sections. The sections to learn first carry a `top` rank,
    // a star beside their title and on the map.
    SP.renderRules = function (host, rules) {
        SP.clear(host);

        if (rules.intro && rules.intro.length) {
            var key = SP.el('section', 'sp-group sp-key');
            key.id = 'esr-key';
            var keyHead = key.appendChild(SP.el('h3', 'sp-group-title has-toggle', rules.introTitle || ''));
            SP.drawer(key, keyHead, function (drawer) { SP.renderBlocks(drawer, rules.intro); }, 'the key');
            host.appendChild(key);
        }

        var body = SP.el('div');
        host.appendChild(body);

        // Where a pinned section is carried: a shelf of its own at the head of
        // the body, above the map. A section keeps its margins there, and the
        // shelf takes no room while nothing sits on it.
        var shelf = SP.el('div', 'sp-pin-host');
        body.appendChild(shelf);
        var pins = [];      // {key, node} of every section, for the restore below

        var topTotal = rules.sections.filter(function (section) { return section.top; }).length;

        if (rules.map && rules.map.layers && rules.map.layers.length) {
            body.appendChild(mapSection(rules.map, rules.sections, topTotal));
        }

        rules.sections.forEach(function (section) {
            var block = SP.el('section', 'sp-group');
            block.id = section.id;
            var title = block.appendChild(SP.el('h3', 'sp-group-title has-pin'));
            // The rule being worked on goes to the top of the page and back:
            // the sections are drawn once, so the pin moves the node itself.
            // It leads the heading, as it leads a learned word in the lists —
            // the end of the line is where the chevrons of the lines below it
            // stand. The star rides at the end of the title's last line, as it
            // does on the map.
            title.appendChild(SP.pinButton(section.id, { node: block, host: shelf }));
            var name = title.appendChild(SP.el('span', 'sp-group-name', section.no + '. ' + section.title));
            if (section.top) name.appendChild(SP.topBadge(section.top, topTotal));
            pins.push({ key: section.id, node: block });
            SP.renderBlocks(block, section.blocks);
            (section.parts || []).forEach(function (part) {
                block.appendChild(SP.el('h4', null, part.title));
                SP.renderBlocks(block, part.blocks);
            });
            body.appendChild(block);
        });

        // What was pinned on an earlier visit goes up as the page is drawn.
        SP.pin.pickPinned(pins).forEach(function (entry) { SP.pin.raise(entry.node, shelf); });
    };
})();
