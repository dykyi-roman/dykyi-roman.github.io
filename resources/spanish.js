/* The Spanish trainer on pages/spanish.html.
   A stage chip picks the pool; four modes work over it — a browsable list,
   Leitner flashcards, a multiple-choice quiz and a listening drill. Two more
   are reference and stand outside any scope: the phonetics/grammar rules and
   the conversational patterns, each rendered in place behind a chip of its
   own. Progress lives under its own localStorage keys and never touches the
   ones resources/learn.js owns. */

(function () {
    'use strict';

    var SP = window.SP;

    var MODES = ['browse', 'cards', 'quiz', 'listen', 'rules', 'patterns'];   // the browse list leads and opens by default

    // The modes read rather than studied. Their buttons head the chip row, not
    // the tab strip, and while one is open no stage chip is lit.
    var REFERENCE_MODES = { rules: true, patterns: true };

    var BOX_INTERVALS = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 21 };
    var NEW_PER_BATCH = 10;
    var QUIZ_LENGTH = 10;
    var BROWSE_PAGE = 100;
    var BROWSE_STEP = 200;

    // Inside one topic the entries read words first, then pairs, then live
    // then the drills last.
    var TYPE_ORDER = { vocab: 0, pair: 1, drill: 2 };

    // What a run of one type is called where it starts. The browse list is one
    // flat list, so without these the words simply turn into sentences
    // somewhere in the middle with nothing to mark the seam.
    var RUN_LABEL = { vocab: 'Words', pair: 'Pairs', drill: 'Drills' };

    function typeRank(type) {
        return TYPE_ORDER[type] === undefined ? 9 : TYPE_ORDER[type];
    }

    var PREFS_KEY = 'spanishPrefs';
    var CARDS_KEY = 'spanishCards';
    var QUIZ_KEY = 'spanishQuiz';

    // Only the scope and the card direction are remembered; the mode is not,
    // so every visit opens on the browse list unless the hash asks otherwise.
    var saved = SP.loadState(PREFS_KEY, 1) || {};
    var prefs = { v: 1, stage: saved.stage || 'all', dir: saved.dir || 'es-ru', rate: saved.rate || 1 };
    var currentMode = MODES[0];
    var manifest = null;
    var pool = [];          // studyable items of the selected stages
    var allItems = [];      // everything, drills included (browse)

    function savePrefs() { SP.saveState(PREFS_KEY, prefs); }
    function byId(id) { return document.getElementById(id); }

    /* ---------- stage scope ---------- */

    function selectedEntries() {
        if (prefs.stage === 'all') return manifest.stages;
        return manifest.stages.filter(function (s) { return String(s.no) === String(prefs.stage); });
    }

    function rebuildPools(stages) {
        allItems = [];
        stages.forEach(function (stage) {
            stage.items.forEach(function (item) { allItems.push(item); });
        });
        pool = allItems.filter(SP.isStudyable);
    }

    // Every scope switch takes a ticket. A stage body can come back after a
    // later click has already moved the chips on — two fetches of the same
    // file can land out of order — and the stale one would then rebuild the
    // list from a scope nobody is looking at any more: the All chip lit, the
    // list still one stage. Such a load is dropped, and its caller is told so.
    var scopeSeq = 0;

    function loadScope() {
        var ticket = (scopeSeq += 1);
        return SP.loadStages(selectedEntries()).then(function (stages) {
            if (ticket !== scopeSeq) return false;
            rebuildPools(stages);
            return true;
        });
    }

    /* ---------- chips and tabs ---------- */

    // A chip that opens a reference panel in place rather than a scope.
    function referenceChip(mode, entry, label) {
        var chip = SP.el('button', 'sp-chip');
        chip.type = 'button';
        chip.id = 'sp-' + mode + '-chip';
        chip.title = entry.titleRu;
        // In portrait the label is hidden and only the icon is left, so the
        // name has to be spelled out for anything that reads the page.
        chip.setAttribute('aria-label', label);
        var icon = SP.iconSpan(entry.icon);
        if (icon) chip.appendChild(icon);
        chip.appendChild(SP.el('span', 'sp-chip-label', label));
        chip.addEventListener('click', function () { enterMode(mode); });
        return chip;
    }

    function renderStageChips() {
        var strip = byId('sp-stages');
        SP.clear(strip);

        // "All" opens the row rather than closing it: it is the scope most
        // often wanted — the search works across every stage — and at the tail
        // of seven chips it took a sideways scroll to reach on a phone. Its
        // chip is labelled like the stages behind it, one word, and since it is
        // the one chip with no icon it carries a short label for the portrait
        // row and spells itself out in its aria-label.
        strip.appendChild(stageChip({ key: 'all', label: 'All', short: 'All', sub: '', aria: 'All stages' }));

        // Rules and the patterns are reference rather than a study scope, and
        // they keep their slots at the head of the row, now behind All — each a
        // button that opens its panel in place instead of a link off the page.
        if (manifest.rules) strip.appendChild(referenceChip('rules', manifest.rules, 'Rules'));
        if (manifest.patterns) strip.appendChild(referenceChip('patterns', manifest.patterns, 'Patterns'));

        manifest.stages.forEach(function (s) {
            var n = 0;
            Object.keys(s.counts).forEach(function (k) { n += s.counts[k]; });
            strip.appendChild(stageChip({ key: String(s.no), label: s.title, sub: String(n), icon: s.icon, no: s.no }));
        });

        syncChipActive();
    }

    function stageChip(option) {
        var chip = SP.el('button', 'sp-chip');
        chip.type = 'button';
        chip.dataset.stage = option.key;
        var icon = SP.iconSpan(option.icon);
        if (icon) chip.appendChild(icon);
        chip.appendChild(SP.el('span', 'sp-chip-label', option.label));
        // "All" is the one chip with no icon to fall back on, so it
        // carries a short label for the portrait row instead.
        if (option.short) chip.appendChild(SP.el('span', 'sp-chip-short', option.short));
        if (option.sub) chip.appendChild(SP.el('small', null, ' ' + option.sub));
        if (option.no) {
            chip.setAttribute('aria-label',
                'Stage ' + option.no + ': ' + option.label + ', ' + option.sub + ' entries');
        } else {
            chip.setAttribute('aria-label', option.aria || option.label);
        }
        chip.addEventListener('click', function () {
            // The scope is already the one selected, so there is nothing to
            // load — but while the rules or the patterns are open the chip
            // still means "back to the list", the way the Browse tab does.
            // Without this the chip of the current scope is a dead button
            // there, and All, being the default scope, is the one it hits.
            if (prefs.stage === option.key) {
                if (REFERENCE_MODES[currentMode]) {
                    if (searchReturn) searchReturn.mode = 'browse';
                    enterMode('browse', true);
                }
                return;
            }
            // Picking a stage by hand is a decision of its own: the search
            // no longer has a scope to hand back.
            searchReturn = null;
            prefs.stage = option.key;
            savePrefs();
            renderStageChips();
            // Picking a scope means you want to study it, so step out of
            // the rules or the patterns — otherwise the click would change
            // nothing on screen.
            var next = REFERENCE_MODES[currentMode] ? 'browse' : currentMode;
            loadScope().then(function (fresh) { if (fresh) enterMode(next, true); })
                .catch(function (e) { SP.showError('sp-error', e); });
        });
        return chip;
    }

    // One highlight per row: reading the rules or the patterns is not a scope,
    // so while such a panel is open the stage chips stay quiet and its own
    // chip carries the mark.
    function syncChipActive() {
        var reading = !!REFERENCE_MODES[currentMode];
        Object.keys(REFERENCE_MODES).forEach(function (mode) {
            var chip = byId('sp-' + mode + '-chip');
            if (chip) chip.classList.toggle('active', currentMode === mode);
        });
        document.querySelectorAll('#sp-stages .sp-chip[data-stage]').forEach(function (chip) {
            chip.classList.toggle('active', !reading && chip.dataset.stage === String(prefs.stage));
        });
    }

    function renderModeTabs() {
        var strip = byId('sp-modes');
        SP.clear(strip);
        var labels = { browse: 'Browse', cards: 'Flashcards', quiz: 'Quiz', listen: 'Listening' };
        MODES.forEach(function (mode) {
            if (REFERENCE_MODES[mode]) return;     // its button sits in the chip row
            if (mode === 'listen' && !SP.tts.available()) return;
            var tab = SP.el('button', 'sp-tab', labels[mode]);
            tab.type = 'button';
            tab.dataset.mode = mode;
            tab.setAttribute('role', 'tab');
            strip.appendChild(tab);
            tab.addEventListener('click', function () {
                if (searchReturn) searchReturn.mode = mode;   // this is where to come back to now
                enterMode(mode);
            });
        });
    }

    function enterMode(mode, force) {
        if (MODES.indexOf(mode) === -1) mode = 'browse';
        if (mode === 'listen' && !SP.tts.available()) mode = 'browse';
        if (currentMode === mode && !force) { /* still re-render below */ }
        currentMode = mode;

        document.querySelectorAll('#sp-modes .sp-tab').forEach(function (tab) {
            var active = tab.dataset.mode === mode;
            tab.classList.toggle('active', active);
            tab.setAttribute('aria-selected', String(active));
        });
        syncChipActive();
        if (coverSwitch) coverSwitch.hidden = mode !== 'browse';
        MODES.forEach(function (name) {
            var panel = byId('panel-' + name);
            if (panel) panel.hidden = name !== mode;
        });
        if (location.hash.slice(1) !== mode) history.replaceState(null, '', '#' + mode);

        SP.tts.stop();
        if (mode === 'browse') initBrowse();
        else if (mode === 'quiz') initQuiz();
        else if (mode === 'listen') initListen();
        else if (mode === 'rules') initRules();
        else if (mode === 'patterns') initPatterns();
        else initCards();
    }

    /* ---------- flashcards ---------- */

    var cardsState = null;
    var cardsQueue = [];
    var cardsIndex = 0;

    function cardFront(item) {
        return prefs.dir === 'es-ru' ? item.es : SP.meaningOf(item);
    }

    function cardBack(item) {
        if (prefs.dir === 'es-ru') {
            var back = SP.meaningOf(item);
            if (item.en) back += '\n' + item.en;
            return back;
        }
        return item.es;
    }

    function initCards() {
        // Deliberately no pruning of unknown ids: a stage that is not in the
        // current scope is not loaded, so pruning would wipe its progress.
        cardsState = SP.loadState(CARDS_KEY, 1) || { v: 1, cards: {} };
        buildCardsQueue();
        showCard();
    }

    function dueCards() {
        var today = SP.todayStr();
        return pool.filter(function (item) {
            var record = cardsState.cards[item.id];
            return record && record.due <= today;
        }).sort(function (a, b) {
            return (cardsState.cards[a.id].b || 0) - (cardsState.cards[b.id].b || 0);
        });
    }

    function freshCards(limit) {
        var out = [];
        for (var i = 0; i < pool.length && out.length < limit; i++) {
            if (!cardsState.cards[pool[i].id]) out.push(pool[i]);
        }
        return SP.shuffleCopy(out);
    }

    function buildCardsQueue() {
        cardsQueue = dueCards().concat(freshCards(NEW_PER_BATCH));
        cardsIndex = 0;
    }

    function showCard() {
        var card = byId('sp-card');
        var empty = byId('sp-cards-empty');

        var item = cardsQueue[cardsIndex];
        if (!item) {
            card.hidden = true;
            empty.hidden = false;
            byId('sp-card-reveal').disabled = true;
            byId('sp-card-again').disabled = true;
            byId('sp-card-good').disabled = true;
            return;
        }

        empty.hidden = true;
        card.hidden = false;
        card.classList.remove('revealed', 'swipe-good', 'swipe-again');
        byId('sp-card-reveal').disabled = false;
        byId('sp-card-again').disabled = true;
        byId('sp-card-good').disabled = true;

        var record = cardsState.cards[item.id];
        byId('sp-card-meta').textContent =
            'Stage ' + item.stage + ' · ' + (SP.TYPE_LABEL[item.type] || item.type) +
            (item.group ? ' · ' + item.group : '') +
            (record ? ' · box ' + record.b : ' · new');

        byId('sp-card-front').textContent = cardFront(item);
        var tr = byId('sp-card-tr');
        tr.textContent = prefs.dir === 'es-ru' && item.tr ? item.tr : '';
        tr.hidden = !tr.textContent;
        byId('sp-card-back').textContent = cardBack(item);
    }

    function revealCard() {
        var card = byId('sp-card');
        if (card.hidden || card.classList.contains('revealed')) return;
        card.classList.add('revealed');
        byId('sp-card-again').disabled = false;
        byId('sp-card-good').disabled = false;
    }

    function answerCard(good) {
        var item = cardsQueue[cardsIndex];
        if (!item) return;
        var record = cardsState.cards[item.id] || { b: 0, due: SP.todayStr(), ok: 0, ko: 0 };
        if (good) {
            record.b = Math.min(5, (record.b || 0) + 1);
            record.due = SP.dateInDays(BOX_INTERVALS[record.b]);
            record.ok += 1;
        } else {
            record.b = 1;
            record.due = SP.todayStr();
            record.ko += 1;
            cardsQueue.push(item);      // comes back before the round ends
        }
        cardsState.cards[item.id] = record;
        SP.saveState(CARDS_KEY, cardsState);
        cardsIndex += 1;
        showCard();
    }

    function addFreshCards() {
        var extra = freshCards(NEW_PER_BATCH * 3).filter(function (item) {
            return cardsQueue.indexOf(item) === -1;
        }).slice(0, NEW_PER_BATCH);
        if (!extra.length) return;
        cardsQueue = cardsQueue.slice(0, cardsIndex).concat(extra, cardsQueue.slice(cardsIndex));
        showCard();
    }

    function practiceAhead() {
        var today = SP.todayStr();
        var ahead = pool.filter(function (item) {
            var record = cardsState.cards[item.id];
            return record && record.due > today;
        }).sort(function (a, b) {
            return cardsState.cards[a.id].due < cardsState.cards[b.id].due ? -1 : 1;
        }).slice(0, NEW_PER_BATCH);
        if (!ahead.length) return;
        cardsQueue = cardsQueue.slice(0, cardsIndex).concat(ahead, cardsQueue.slice(cardsIndex));
        showCard();
    }

    function initCardControls() {
        byId('sp-card-reveal').addEventListener('click', revealCard);
        byId('sp-card-again').addEventListener('click', function () { answerCard(false); });
        byId('sp-card-good').addEventListener('click', function () { answerCard(true); });
        byId('sp-card-new').addEventListener('click', addFreshCards);
        byId('sp-card-ahead').addEventListener('click', practiceAhead);

        byId('sp-dir').addEventListener('click', function () {
            prefs.dir = prefs.dir === 'es-ru' ? 'ru-es' : 'es-ru';
            savePrefs();
            updateDirLabel();
            showCard();
        });

        var card = byId('sp-card');
        card.addEventListener('click', function () { revealCard(); });

        // Swipe: left = Again, right = Good. Buttons stay the primary path.
        var startX = 0, startY = 0, tracking = false;
        card.addEventListener('touchstart', function (e) {
            if (e.touches.length !== 1) return;
            tracking = true;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }, { passive: true });

        card.addEventListener('touchmove', function (e) {
            if (!tracking || !card.classList.contains('revealed')) return;
            var dx = e.touches[0].clientX - startX;
            var dy = e.touches[0].clientY - startY;
            if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) {
                card.classList.remove('swipe-good', 'swipe-again');
                return;
            }
            card.classList.toggle('swipe-good', dx > 0);
            card.classList.toggle('swipe-again', dx < 0);
        }, { passive: true });

        card.addEventListener('touchend', function (e) {
            if (!tracking) return;
            tracking = false;
            var wasGood = card.classList.contains('swipe-good');
            var wasAgain = card.classList.contains('swipe-again');
            card.classList.remove('swipe-good', 'swipe-again');
            if (wasGood) answerCard(true);
            else if (wasAgain) answerCard(false);
        });

        document.addEventListener('keydown', function (e) {
            var panel = byId('panel-cards');
            if (!panel || panel.hidden) return;
            var tag = document.activeElement && document.activeElement.tagName;
            if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;
            if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); revealCard(); }
            else if (e.key === '1') { e.preventDefault(); if (!byId('sp-card-again').disabled) answerCard(false); }
            else if (e.key === '2') { e.preventDefault(); if (!byId('sp-card-good').disabled) answerCard(true); }
        });

        updateDirLabel();
    }

    function updateDirLabel() {
        byId('sp-dir').textContent = prefs.dir === 'es-ru' ? 'ES → RU' : 'RU → ES';
    }

    /* ---------- question building (shared by quiz and listening) ---------- */

    function pickDistinct(source, count, exclude, keyFn) {
        var taken = {};
        (exclude || []).forEach(function (v) { taken[keyFn(v)] = true; });
        var out = [];
        var guard = 0;
        while (out.length < count && guard < 500 && source.length) {
            guard += 1;
            var candidate = SP.pick(source);
            var key = keyFn(candidate);
            if (!key || taken[key]) continue;
            taken[key] = true;
            out.push(candidate);
        }
        return out;
    }

    var esKey = function (i) { return i.es; };
    var ruKey = function (i) { return SP.meaningOf(i); };

    function makeMeaningQuestion(item, source) {
        var others = pickDistinct(source, 3, [item], ruKey);
        if (others.length < 3) return null;
        var answer = SP.meaningOf(item);
        return {
            kind: 'meaning',
            prompt: 'What does this mean?',
            spanish: item.es,
            transcription: item.tr || '',
            options: SP.shuffleCopy([answer].concat(others.map(ruKey))),
            answer: answer,
            item: item
        };
    }

    function makeProductionQuestion(item, source) {
        var others = pickDistinct(source, 3, [item], esKey);
        if (others.length < 3) return null;
        return {
            kind: 'production',
            prompt: 'How do you say this in Spanish?',
            russian: SP.meaningOf(item),
            options: SP.shuffleCopy([item.es].concat(others.map(esKey))),
            answer: item.es,
            item: item
        };
    }

    // Ambiguous members (salida belongs to two pairs) would give two defensible
    // answers, so they are excluded when the pool is built.
    function makePairQuestion(entry, pairSource) {
        var others = pickDistinct(pairSource, 3, [entry], function (e) { return e.answer; });
        if (others.length < 3) return null;
        return {
            kind: 'pair',
            prompt: entry.pairKind === 'opposite' ? 'What is the opposite?' : 'What is the other half of the pair?',
            spanish: entry.cue,
            transcription: entry.cueTr || '',
            options: SP.shuffleCopy([entry.answer].concat(others.map(function (e) { return e.answer; }))),
            answer: entry.answer,
            item: entry.item
        };
    }

    function makeDrillQuestion(item) {
        if (!item.options || item.options.length < 2) return null;
        return {
            kind: 'drill',
            prompt: 'Pick the right word',
            spanish: item.prompt,
            options: SP.shuffleCopy(item.options.slice()),
            answer: item.answer,
            item: item
        };
    }

    function pairEntries() {
        var pairs = pool.filter(function (i) { return i.type === 'pair' && i.a && i.b; });
        var seen = {};
        pairs.forEach(function (p) {
            seen[p.a.es] = (seen[p.a.es] || 0) + 1;
            seen[p.b.es] = (seen[p.b.es] || 0) + 1;
        });
        var entries = [];
        pairs.forEach(function (p) {
            if (seen[p.a.es] === 1 && seen[p.b.es] === 1) {
                entries.push({ cue: p.a.es, cueTr: p.a.tr, answer: p.b.es, pairKind: p.pairKind, item: p });
                entries.push({ cue: p.b.es, cueTr: p.b.tr, answer: p.a.es, pairKind: p.pairKind, item: p });
            }
        });
        return entries;
    }

    function makeQuestions(count) {
        var words = pool.filter(function (i) { return i.type === 'vocab' || i.type === 'pair'; });
        var pairs = pairEntries();
        var drills = allItems.filter(function (i) { return i.type === 'drill' && i.kind === 'choice'; });

        var generators = [];
        if (words.length >= 4) {
            generators.push({ weight: words.length, make: function () { return makeMeaningQuestion(SP.pick(words), words); } });
            generators.push({ weight: words.length, make: function () { return makeProductionQuestion(SP.pick(words), words); } });
        }
        if (pairs.length >= 4) {
            generators.push({ weight: pairs.length, make: function () { return makePairQuestion(SP.pick(pairs), pairs); } });
        }
        if (drills.length) {
            generators.push({ weight: drills.length * 4, make: function () { return makeDrillQuestion(SP.pick(drills)); } });
        }
        if (!generators.length) return [];

        var total = generators.reduce(function (sum, g) { return sum + g.weight; }, 0);
        var questions = [];
        var used = {};
        var guard = 0;

        while (questions.length < count && guard < count * 40) {
            guard += 1;
            var roll = Math.random() * total;
            var generator = generators.filter(function (g) { return (roll -= g.weight) < 0; })[0] || generators[0];
            var question = generator.make();
            if (!question) continue;
            var key = question.kind + '|' + (question.item ? question.item.id : question.answer) + '|' + question.answer;
            if (used[key]) continue;
            // A question whose options are not all distinct has two right answers.
            var distinct = {};
            var ok = true;
            question.options.forEach(function (o) { if (distinct[o]) ok = false; distinct[o] = true; });
            if (!ok) continue;
            used[key] = true;
            questions.push(question);
        }
        return questions;
    }

    /* ---------- quiz ---------- */

    var quizStats = null;
    var quizQuestions = [];
    var quizIndex = 0;
    var quizCorrect = 0;

    function initQuiz() {
        quizStats = SP.loadState(QUIZ_KEY, 1) || { v: 1, rounds: 0, answered: 0, correct: 0 };
        byId('sp-quiz-start').hidden = false;
        byId('sp-quiz-round').hidden = true;
        byId('sp-quiz-done').hidden = true;
        byId('sp-quiz-empty').hidden = true;
    }

    function startQuiz() {
        quizQuestions = makeQuestions(QUIZ_LENGTH);
        if (!quizQuestions.length) {
            byId('sp-quiz-empty').hidden = false;
            return;
        }
        quizIndex = 0;
        quizCorrect = 0;
        quizStats.rounds += 1;
        SP.saveState(QUIZ_KEY, quizStats);
        byId('sp-quiz-start').hidden = true;
        byId('sp-quiz-done').hidden = true;
        byId('sp-quiz-round').hidden = false;
        showQuestion();
    }

    function renderQuestion(hostId, optionsId, question, onAnswer) {
        var host = byId(hostId);
        SP.clear(host);
        host.appendChild(SP.el('div', 'sp-progress', question.prompt));
        if (question.spanish) host.appendChild(SP.el('div', 'sp-es', question.spanish));
        if (question.transcription) {
            var tr = SP.el('div', null, question.transcription);
            tr.style.color = 'var(--color-text-light)';
            tr.style.fontSize = 'var(--font-size-small)';
            host.appendChild(tr);
        }
        if (question.russian) host.appendChild(SP.el('div', null, question.russian));

        var box = byId(optionsId);
        SP.clear(box);
        question.options.forEach(function (option) {
            var btn = SP.el('button', 'sp-option', option);
            btn.type = 'button';
            btn.addEventListener('click', function () {
                if (btn.disabled) return;
                var correct = option === question.answer;
                box.querySelectorAll('.sp-option').forEach(function (other) {
                    other.disabled = true;
                    if (other.textContent === question.answer) other.classList.add('correct');
                });
                if (!correct) btn.classList.add('wrong');
                onAnswer(correct);
            });
            box.appendChild(btn);
        });
    }

    function showQuestion() {
        var question = quizQuestions[quizIndex];
        if (!question) return finishQuiz();
        byId('sp-quiz-progress').textContent =
            'Question ' + (quizIndex + 1) + ' of ' + quizQuestions.length + ' · ' + quizCorrect + ' correct';
        byId('sp-quiz-next').hidden = true;
        renderQuestion('sp-quiz-question', 'sp-quiz-options', question, function (correct) {
            if (correct) quizCorrect += 1;
            quizStats.answered += 1;
            if (correct) quizStats.correct += 1;
            SP.saveState(QUIZ_KEY, quizStats);
            byId('sp-quiz-next').hidden = false;
            byId('sp-quiz-next').focus();
        });
    }

    function finishQuiz() {
        byId('sp-quiz-round').hidden = true;
        byId('sp-quiz-done').hidden = false;
        byId('sp-quiz-score').textContent = quizCorrect + ' of ' + quizQuestions.length + ' correct';
    }

    function initQuizControls() {
        byId('sp-quiz-begin').addEventListener('click', startQuiz);
        byId('sp-quiz-again').addEventListener('click', startQuiz);
        byId('sp-quiz-next').addEventListener('click', function () {
            quizIndex += 1;
            showQuestion();
        });
    }

    /* ---------- listening ---------- */

    var listenQuestion = null;

    function initListen() {
        nextListen();
    }

    function nextListen() {
        var spoken = pool.filter(function (i) { return i.es; });
        if (spoken.length < 4) {
            byId('sp-listen-empty').hidden = false;
            byId('sp-listen-body').hidden = true;
            return;
        }
        byId('sp-listen-empty').hidden = true;
        byId('sp-listen-body').hidden = false;

        var item = SP.pick(spoken);
        var others = pickDistinct(spoken, 3, [item], ruKey);
        if (others.length < 3) return;

        listenQuestion = {
            answer: SP.meaningOf(item),
            options: SP.shuffleCopy([SP.meaningOf(item)].concat(others.map(ruKey))),
            item: item
        };

        byId('sp-listen-answer').hidden = true;
        byId('sp-listen-answer').textContent = '';
        byId('sp-listen-next').hidden = true;

        var box = byId('sp-listen-options');
        SP.clear(box);
        listenQuestion.options.forEach(function (option) {
            var btn = SP.el('button', 'sp-option', option);
            btn.type = 'button';
            btn.addEventListener('click', function () {
                if (btn.disabled) return;
                box.querySelectorAll('.sp-option').forEach(function (other) {
                    other.disabled = true;
                    if (other.textContent === listenQuestion.answer) other.classList.add('correct');
                });
                if (option !== listenQuestion.answer) btn.classList.add('wrong');
                var reveal = byId('sp-listen-answer');
                reveal.textContent = listenQuestion.item.es +
                    (listenQuestion.item.tr ? '  [' + listenQuestion.item.tr + ']' : '');
                reveal.hidden = false;
                byId('sp-listen-next').hidden = false;
            });
            box.appendChild(btn);
        });

        SP.tts.speak(item.es);
    }

    // The word plays itself when the question is drawn; these two say it
    // again, at speed and slowly. They are words rather than a speaker glyph —
    // the section draws none anywhere.
    function initListenControls() {
        byId('sp-listen-next').addEventListener('click', nextListen);
        byId('sp-listen-again').addEventListener('click', function () {
            if (listenQuestion) SP.tts.speak(listenQuestion.item.es);
        });
        byId('sp-listen-slow').addEventListener('click', function () {
            if (listenQuestion) SP.tts.speak(listenQuestion.item.es, { rate: 0.6 });
        });
    }

    /* ---------- browse ---------- */

    var browseShown = BROWSE_PAGE;
    var browseFiltered = [];
    var browseSearch = null;

    function initBrowse() {
        // Topic names are unique across the stages, so the option value is the
        // bare name; the optgroup only says where it comes from, which matters
        // once the scope is "All" and the list runs to 45 topics.
        var seen = {};
        var byStage = [];
        allItems.forEach(function (item) {
            if (!item.group || seen[item.group]) return;
            seen[item.group] = true;
            var bucket = byStage.filter(function (b) { return b.stage === item.stage; })[0];
            if (!bucket) { bucket = { stage: item.stage, names: [] }; byStage.push(bucket); }
            bucket.names.push(item.group);
        });

        var groupSelect = byId('sp-browse-group');
        var previous = groupSelect.value;
        SP.clear(groupSelect);
        var allOption = SP.el('option', null, 'All topics');
        allOption.value = '';
        groupSelect.appendChild(allOption);
        byStage.forEach(function (bucket) {
            var host = groupSelect;
            if (byStage.length > 1) {
                host = SP.el('optgroup');
                host.label = 'Stage ' + bucket.stage;
                groupSelect.appendChild(host);
            }
            bucket.names.forEach(function (name) {
                var option = SP.el('option', null, name);
                option.value = name;
                host.appendChild(option);
            });
        });
        groupSelect.value = seen[previous] ? previous : '';

        applyBrowse();
    }

    function applyBrowse() {
        var group = byId('sp-browse-group').value;
        var query = browseSearch ? browseSearch.query() : '';

        // allItems keeps the file order; sorting by type makes every topic read
        // the same
        // way. The original index is the tie-breaker, so the sort is stable.
        browseFiltered = allItems
            .filter(function (item) { return (!group || item.group === group) && SP.matches(item, query); })
            .map(function (item, i) { return { item: item, i: i }; })
            .sort(function (a, b) {
                if (a.item.stage !== b.item.stage) return a.item.stage - b.item.stage;
                var rank = typeRank(a.item.type) - typeRank(b.item.type);
                return rank !== 0 ? rank : a.i - b.i;
            })
            .map(function (row) { return row.item; });

        browseShown = BROWSE_PAGE;
        renderBrowse();
    }

    // A word or a pair is drawn by the shared renderer; a drill browses as its
    // prompt with the answer beside it, in a row shape of its own. `mark` is the
    // learned toggle. A drill covers its answer whichever side is picked: its
    // prompt is the question, Russian or Spanish. `query` is what the list was
    // filtered by, painted wherever the row carries it.
    function browseRow(item, mark, query) {
        if (item.type !== 'drill') return SP.renderLexRow(item, mark, query);

        var row = SP.el('div', 'sp-drill-row');
        row.appendChild(SP.hilite(SP.el('div', 'sp-drill-es', item.prompt), query));
        row.appendChild(SP.hilite(SP.el('div', 'sp-drill-ru', item.answer), query));
        row.appendChild(SP.rowTools(SP.spokenText(item), 'phrase'));
        return SP.attachMark(row, mark);
    }

    // Two kinds of seam in the sorted list. The heavier one opens a stage and
    // names it — with a search running, results come from anywhere, so this is
    // what says where a match was found. The lighter one marks where one run of
    // entries turns into the next inside that stage.
    function stageInfo(no) {
        return (manifest.stages || []).filter(function (st) { return st.no === no; })[0];
    }

    function stageDivider(item) {
        var stage = stageInfo(item.stage);
        var node = SP.el('div', 'sp-divider is-quiet is-sub is-stage');
        var icon = SP.iconSpan(stage && stage.icon);
        if (icon) node.appendChild(icon);
        node.appendChild(SP.el('span', 'sp-divider-label',
            'Stage ' + item.stage + (stage ? ' · ' + stage.title : '')));
        return node;
    }

    function runDivider(item) {
        return SP.quietDivider(RUN_LABEL[item.type] || SP.TYPE_LABEL[item.type] || item.type);
    }

    // Puts `node` right after `ref` inside `parent` and hands it back, so a
    // run of rows can follow the tiles of its stage while another stage's
    // tiles already stand below them.
    function insertAfter(parent, node, ref) {
        parent.insertBefore(node, ref.nextSibling);
        return node;
    }

    function runKey(item) { return item.stage + '/' + typeRank(item.type); }

    // One stage in scope that gives its topics an icon opens on their tiles,
    // the way Reference opens on its tables — and only then: under All the
    // list runs across the stages, and with a topic picked the tiles would
    // repeat the filter. The stage is read off the filtered rows: the scope
    // chips are one way to a single stage, but a topic of it picked under All
    // is another, and that one is the filter, not a tiled list.
    function tiledStage() {
        if (byId('sp-browse-group').value) return null;
        var id = null;
        for (var i = 0; i < browseFiltered.length; i++) {
            if (id === null) id = browseFiltered[i].stageId;
            else if (browseFiltered[i].stageId !== id) return null;
        }
        var stage = id === null ? null : SP.stages[id];
        return stage && SP.topicIcons(stage) ? stage : null;
    }

    // The rows of one section of a tiled stage, in runs by topic in the order
    // the stage declares its topics: [{key, icon, name, items}]. The drills
    // carry no topic and so have no tile: a tiled list is the stage's words,
    // and its drills stay on the stage page, in a search and in the CSV.
    function topicRuns(stage, items) {
        var icons = SP.topicIcons(stage);
        var order = {};
        (stage.groups || []).forEach(function (g, i) { order[g.name] = i; });
        var runs = {};
        items.forEach(function (item) {
            var name = item.group;
            if (!name) return;
            if (!runs[name]) runs[name] = { key: SP.topicKey(stage, name), icon: icons[name], name: name, items: [] };
            runs[name].items.push(item);
        });
        return Object.keys(runs).sort(function (a, b) {
            return (a in order ? order[a] : 1e9) - (b in order ? order[b] : 1e9);
        }).map(function (name) { return runs[name]; });
    }

    // An open topic's rows run under its name and picture, as a table of
    // Reference runs under its name.
    function topicDivider(run) {
        var node = SP.quietDivider(run.name);
        var icon = SP.iconSpan(run.icon);
        if (icon) node.insertBefore(icon, node.firstChild);
        return node;
    }

    // What a search leaves, drawn as the three zones of SP.renderZoneList:
    // the word itself first, then the words that merely begin with it, then
    // the words that carry it in an example — with NO EXACT MATCH said in
    // capitals above the rest when the first zone is empty. The four sections
    // step aside for it: each row still wears its list as a tag, and the order
    // that matters while searching is how close the match is.
    function renderBrowseZones(list, query) {
        var stages = {};
        browseFiltered.forEach(function (item) { stages[item.stage] = true; });
        // Flat means flat — but a match can come from any stage, and with two
        // of them on screen the row alone does not say which.
        var nameStages = Object.keys(stages).length > 1;

        var res = SP.renderZoneList(list, browseFiltered, query, browseShown, {
            row: browseRow,
            zoneFor: function () { return SP.el('div', 'sp-lex'); },
            seam: function (prev, item) {
                return nameStages && (!prev || prev.stage !== item.stage) ? stageDivider(item) : null;
            },
            onMark: syncExportButtons
        });
        syncExportButtons();

        var more = byId('sp-browse-more');
        var left = res.total - res.drawn;
        more.hidden = left <= 0;
        if (left > 0) more.textContent = 'Show ' + Math.min(BROWSE_STEP, left) + ' more (' + left + ' left)';
    }

    // The list is the same four sections a stage page shows, behind the same
    // strip of tabs, over the same lists: the tables of the stage's sets,
    // Learned from the file, Pending from this browser, then the rest.
    // `browseFiltered` keeps the plain (stage, type, file) order, so the CSV
    // export is unaffected and the split is recomputed on every render, stars
    // included. A section not on show is left undrawn rather than hidden, so
    // a page is never spent on rows nobody sees.
    function renderBrowse() {
        var list = byId('sp-browse-list');
        SP.clear(list);
        var empty = byId('sp-browse-empty');
        empty.hidden = browseFiltered.length !== 0;
        empty.textContent = browseSearch && browseSearch.query() ? 'Nothing matches that search.' : 'Nothing matches.';

        var searching = browseSearch ? browseSearch.query() : '';
        if (searching) return renderBrowseZones(list, searching);

        // A tiled stage (below) lists its words alone, so its drills stay out
        // of the buckets: the tabs then count what the list can show. The
        // exports and the copy read browseFiltered and keep them.
        var tiled = tiledStage();
        var buckets = {};
        SP.SECTIONS.forEach(function (kind) { buckets[kind] = []; });
        browseFiltered.forEach(function (item) {
            if (tiled && !item.group) return;
            buckets[SP.sectionOf(item)].push(item);
        });
        // Reference reads table by table. Learned comes in this page load's
        // order, still a run at a time, so the seams below go on marking the
        // stages and the types.
        buckets.reference = SP.orderBySet(buckets.reference);
        // Pinned first, the rest in this page load's shuffle — which does not
        // move, so unpinning drops a word back exactly where it was.
        buckets.learned = SP.pin.first(SP.learned.shuffle(buckets.learned, runKey));

        var tabs = SP.sectionTabs();
        list.appendChild(tabs.node);
        var counts = {};
        var zones = {};
        SP.SECTIONS.forEach(function (kind) {
            counts[kind] = buckets[kind].length;
            zones[kind] = SP.el('div', 'sp-lex');
            list.appendChild(zones[kind]);
        });
        var section = SP.sectionShown(counts);

        function sync() {
            tabs.sync(counts);
            syncExportButtons();
        }

        function makeRow(item) {
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
                counts.pending += on ? 1 : -1;
                counts.left += on ? -1 : 1;
                // Marked goes to the end of Pending, unmarked to the top of the
                // rest — the closest spot on the other side of the header. With
                // Pending folded there is nowhere to move to, so the row simply
                // leaves.
                if (on && section !== 'pending') row.remove();
                else if (on) zones.pending.appendChild(row);
                else zones.left.insertBefore(row, zones.left.firstChild);
                sync();
            });
            // No query here: a search is drawn by renderBrowseZones, which
            // paints the match, opens the panel holding it and tags the row.
            row = browseRow(item, mark);
            SP.setRowState(row, kind === 'learned', kind === 'pending');
            return row;
        }

        // A stage is named whenever the list can hold more than one of them.
        // (A search names them too — that is renderBrowseZones' seam.)
        var stages = {};
        browseFiltered.forEach(function (item) { stages[item.stage] = true; });
        var nameStages = Object.keys(stages).length > 1;

        // Reference opens on its tiles — a grid per stage, under the stage's
        // seam — and a table's rows are drawn only while its tile is open,
        // right after that stage's grid. The seams and the grids come from the
        // whole bucket rather than the plan: with every table closed the plan
        // holds no row of the stage to draw them from.
        var plan = [];
        var tail = {};   // stage -> the last node drawn under its tiles
        if (section === 'reference') {
            buckets.reference.forEach(function (item) {
                if (!tail[item.stage]) {
                    if (nameStages) zones.reference.appendChild(stageDivider(item));
                    tail[item.stage] = zones.reference.appendChild(SP.setTiles(buckets.reference.filter(function (other) {
                        return other.stage === item.stage;
                    })));
                }
                if (SP.tables.isOpen(item)) plan.push({ item: item, kind: 'reference' });
            });
        }
        // A tiled stage opens on its topics: the grid at the head of the
        // section on show, one tile per topic that has rows there, and under
        // it the rows of the open topics alone, each run under its own name.
        // Like the tables, it rebuilds on every tap (SP.topics.onChange in
        // initBrowseControls), since a closed topic's rows are not drawn.
        if (tiled && section !== 'reference') {
            var runs = topicRuns(tiled, buckets[section]);
            zones[section].appendChild(SP.tileGrid(runs.map(function (run) {
                return { key: run.key, icon: run.icon, name: run.name, count: run.items.length };
            }), { state: SP.topics, what: 'topic', kind: 'topic' }).node);
            runs.forEach(function (run) {
                if (!SP.topics.isOpen(run.key)) return;
                run.items.forEach(function (item) { plan.push({ item: item, kind: section, topic: run }); });
            });
        }
        SP.SECTIONS.forEach(function (kind) {
            if (kind === 'reference' || kind !== section || tiled) return;   // a tiled section was planned above
            buckets[kind].forEach(function (item) { plan.push({ item: item, kind: kind }); });
        });

        var previous = {};
        var previousTopic = null;
        plan.slice(0, browseShown).forEach(function (entry) {
            var zone = zones[entry.kind];
            var prev = previous[entry.kind];
            if (entry.kind === 'reference') {
                // Under its stage's tiles, and every table under its own name,
                // the first one too: the header above names the section.
                var stage = entry.item.stage;
                if (!prev || prev.stage !== stage || prev.set !== entry.item.set) {
                    tail[stage] = insertAfter(zone, SP.quietDivider(entry.item.set), tail[stage]);
                }
                tail[stage] = insertAfter(zone, makeRow(entry.item), tail[stage]);
                previous.reference = entry.item;
                return;
            }
            if (entry.topic) {
                // The tile names the run; the type seams inside it would only
                // split a topic's words from its pairs.
                if (entry.topic !== previousTopic) zone.appendChild(topicDivider(entry.topic));
                previousTopic = entry.topic;
            } else {
                var newStage = nameStages && (!prev || prev.stage !== entry.item.stage);
                if (newStage) zone.appendChild(stageDivider(entry.item));
                else if (prev && runKey(prev) !== runKey(entry.item)) zone.appendChild(runDivider(entry.item));
            }
            zone.appendChild(makeRow(entry.item));
            previous[entry.kind] = entry.item;
        });
        sync();

        var more = byId('sp-browse-more');
        if (browseShown >= plan.length) {
            more.hidden = true;
        } else {
            more.hidden = false;
            more.textContent = 'Show ' + Math.min(BROWSE_STEP, plan.length - browseShown) +
                ' more (' + (plan.length - browseShown) + ' left)';
        }
    }

    /* ---------- CSV export ---------- */

    // Three slices of whatever the filters currently show: everything, only
    // what is marked as learned, only what is left. All three follow the stage
    // scope and the topic filter — the buttons say how many rows that is. The
    // words of a Reference table live in that section alone, so only the
    // first slice carries them.
    var EXPORTS = {
        all: { label: 'All', rows: function () { return browseFiltered; } },
        learned: { label: 'Learned', rows: function () { return bySection('learned'); } },
        left: { label: 'Left', rows: function () { return bySection('left'); } }
    };

    function bySection(kind) {
        return browseFiltered.filter(function (item) { return SP.sectionOf(item) === kind; });
    }

    function syncExportButtons() {
        Object.keys(EXPORTS).forEach(function (key) {
            var btn = byId('sp-browse-csv-' + key);
            if (!btn) return;
            var n = EXPORTS[key].rows().length;
            // The three slices sit on one line with the filters, the topic
            // select and the copy button, so they carry a download icon and
            // the name alone; that the file is a CSV, and how many rows each
            // holds, is in the tooltip and the accessible name. Only the name
            // is written — textContent on the button would take the icon too.
            var name = btn.querySelector('.sp-export-name');
            if (name) name.textContent = EXPORTS[key].label;
            btn.title = (btn.dataset.title || btn.title) + ' — ' + n +
                (n === 1 ? ' entry' : ' entries');
            btn.setAttribute('aria-label', 'Download ' + EXPORTS[key].label + ' as CSV, ' + n +
                (n === 1 ? ' entry' : ' entries'));
            btn.disabled = n === 0;
        });

        // Left alone while it is showing what just happened. Only the label
        // beside the icon is written, never the button itself — textContent
        // would take the icon with it.
        var copy = byId('sp-browse-copy');
        if (copy && !copyTimer) {
            var marked = bySection('pending').length;
            copyLabel('Pending (' + marked + ')');
            copy.setAttribute('aria-label',
                'Copy the pending list to the clipboard, ' + marked + (marked === 1 ? ' entry' : ' entries'));
            copy.disabled = marked === 0;
        }
    }

    /* ---------- the pending list to the clipboard ---------- */

    // The pending list is not a file to keep but a handful of entries to take
    // somewhere else — a note, a chat, a prompt — so it is copied as plain
    // lines rather than downloaded as a table.
    var copyTimer = null;

    function pendingText() {
        return bySection('pending').map(function (item) {
            if (item.type === 'drill') return item.prompt + ' — ' + item.answer;
            return item.es + (item.ru ? ' — ' + item.ru : '');
        }).join('\n');
    }

    function copyText(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(text);
        // Older browsers, and any context where the async clipboard is blocked.
        return new Promise(function (resolve, reject) {
            var area = document.createElement('textarea');
            area.value = text;
            area.setAttribute('readonly', '');
            area.style.position = 'fixed';
            area.style.top = '0';
            area.style.opacity = '0';
            document.body.appendChild(area);
            area.select();
            var ok = false;
            try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
            document.body.removeChild(area);
            if (ok) resolve(); else reject(new Error('copy was refused'));
        });
    }

    // Copying leaves no trace on screen, so the button says what happened and
    // goes back to its label a moment later.
    function copyLabel(text) {
        var label = document.querySelector('#sp-browse-copy .sp-copy-label');
        if (label) label.textContent = text;
    }

    function flashCopy(message) {
        if (!byId('sp-browse-copy')) return;
        clearTimeout(copyTimer);
        copyLabel(message);
        copyTimer = setTimeout(function () { copyTimer = null; syncExportButtons(); }, 1800);
    }

    function copyPending() {
        var rows = bySection('pending');
        if (!rows.length) return;
        copyText(pendingText())
            .then(function () { flashCopy('Copied ' + rows.length); })
            .catch(function () { flashCopy('Could not copy'); });
    }

    function exportCsv(which) {
        var rows = (EXPORTS[which] || EXPORTS.all).rows();
        if (!rows.length) return;
        // Both lists ride along as the last two columns, so an exported "all"
        // says which of its rows are learned and which are pending; the four
        // lexicon keys keep the order they have in the JSON.
        var head = ['id', 'stage', 'type', 'group', 'es', 'en', 'ru', 'tr', 'learned', 'pending', 'examples'];
        var lines = [head.join(',')];
        rows.forEach(function (item) {
            lines.push(head.map(function (key) {
                var value = item[key];
                // The examples are the only place the old phrase rows survive,
                // so they go out in a column of their own rather than not at
                // all. It goes last: the ten columns before it keep the index
                // any script reading this file by position already expects.
                if (key === 'examples') value = (item.ex || []).map(function (line) {
                    return line.es + ' \u2014 ' + line.ru;
                }).join(' | ');
                if (key === 'learned') value = SP.learned.has(item.id) ? 'yes' : '';
                if (key === 'pending') value = SP.pending.has(item.id) ? 'yes' : '';
                if (value === undefined || value === null) value = '';
                return '"' + String(value).replace(/"/g, '""') + '"';
            }).join(','));
        });
        // The BOM keeps Excel from reading the Cyrillic as mojibake.
        var blob = new Blob(['\ufeff' + lines.join('\r\n')], { type: 'text/csv' });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url;
        link.download = 'spanish-' + which + '-' + SP.todayStr() + '.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }

    function initBrowseControls() {
        // Registered once: the section on show is page-wide, and re-registering
        // on every render would redraw the list as many times as it had been drawn.
        SP.view.onSection(function () {
            browseShown = BROWSE_PAGE;
            renderBrowse();
        });
        // Pinning reorders the Learned section, so the list is drawn again —
        // registered once here, as the fold is, and keeping the page the reader
        // has already asked for.
        SP.pin.onChange(renderBrowse);
        // A tile of Reference opened or closed changes which rows are drawn;
        // the page the reader has already asked for is kept, as with a pin.
        SP.tables.onChange(renderBrowse);
        // A topic tile likewise: the rows of a closed topic are not drawn.
        SP.topics.onChange(renderBrowse);
        byId('sp-browse-group').addEventListener('change', applyBrowse);
        byId('sp-browse-reset').addEventListener('click', function () {
            byId('sp-browse-group').value = '';
            browseSearch.clear();
            applyBrowse();
        });
        byId('sp-browse-more').addEventListener('click', function () {
            browseShown += BROWSE_STEP;
            renderBrowse();
        });
        Object.keys(EXPORTS).forEach(function (key) {
            var btn = byId('sp-browse-csv-' + key);
            if (!btn) return;
            btn.dataset.title = btn.title;      // the count is appended to this, not to itself
            btn.insertBefore(SP.icon.download(), btn.firstChild);
            btn.addEventListener('click', function () { exportCsv(key); });
        });
        var copy = byId('sp-browse-copy');
        copy.insertBefore(SP.icon.copy(), copy.firstChild);
        copy.addEventListener('click', copyPending);
    }

    /* ---------- search across every stage ---------- */

    // The field sits above the stage chips, not inside the browse filters,
    // because it is not a filter of the current scope but a way out of it:
    // a search looks through every stage at once. Rules and patterns are
    // reference, not entries, and stay out of it.
    // Where the search took over from, so closing the field can hand it back.
    var searchReturn = null;

    function initSearch() {
        browseSearch = SP.searchBox('Search every stage', onSearch);
        byId('sp-search-host').appendChild(browseSearch.node);
        // The ✕ reports through onSearch itself, but Esc empties the field too,
        // and Safari tells of that with `search` alone — no `input` event.
        browseSearch.input.addEventListener('search', onSearch);
    }

    function goTo(stage, mode) {
        if (prefs.stage === stage) { enterMode(mode, true); return; }
        prefs.stage = stage;
        savePrefs();
        renderStageChips();
        loadScope()
            .then(function (fresh) { if (fresh) enterMode(mode, true); })
            .catch(function (e) { SP.showError('sp-error', e); });
    }

    function onSearch() {
        var query = browseSearch.query();

        if (query && !searchReturn) searchReturn = { stage: prefs.stage, mode: currentMode };

        // Closing the field puts back the stage and the mode the search took
        // over from, rather than leaving the reader in All / Browse.
        if (!query && searchReturn) {
            var back = searchReturn;
            searchReturn = null;
            goTo(back.stage, back.mode);
            return;
        }

        // Searching widens the scope rather than searching inside it, and the
        // chips say so. Loading the stages that were never fetched is what
        // makes the search global, so the list waits for them. Results live in
        // the browse list, so typing brings it forward.
        if (query && (prefs.stage !== 'all' || currentMode !== 'browse')) {
            goTo('all', 'browse');
            return;
        }

        applyBrowse();
    }

    /* ---------- the side a covered row hides ---------- */

    // It shares the strip with the search, so it stays in reach however far
    // the list is scrolled, and it shows only over the browse list: no other
    // mode has rows to cover, and the flashcards keep a direction of their own.
    var coverSwitch = null;

    function initCoverSwitch() {
        coverSwitch = SP.coverSwitch();
        byId('sp-search-host').appendChild(coverSwitch);
    }

    /* ---------- rules ---------- */

    var rulesRendered = false;

    function initRules() {
        if (rulesRendered) return;
        SP.loadRules().then(function (rules) {
            SP.renderRules(byId('panel-rules'), rules);
            rulesRendered = true;
        }).catch(function (e) { SP.showError('sp-error', e); });
    }

    /* ---------- patterns ---------- */

    // Conversational patterns — no …, sino …; acabar de + глагол — kept in
    // patterns.json and read like the rules: theme by theme, each pattern a
    // card, then the look-alike patterns side by side and the ones to learn
    // first. A chip index of the themes heads the panel.
    var patternsRendered = false;

    function initPatterns() {
        if (patternsRendered) return;
        SP.loadPatterns().then(function (data) {
            renderPatterns(byId('panel-patterns'), data);
            patternsRendered = true;
        }).catch(function (e) { SP.showError('sp-error', e); });
    }

    // A formula reads as fixed Spanish with slots in it: "no + A, sino + B",
    // "llevar + время + -ando / -iendo". A slot is a lone capital letter or a
    // Cyrillic word; the Spanish around it is what gets learned as it is, so
    // that is the part lit up. The joiners and brackets stay plain.
    var FORMULA_WORD = /([^\s+,.…¿?¡!\/()]+)/;
    var SLOT = /^(?:[A-Z]|[\u0400-\u04FF][\u0400-\u04FF-]*)$/;

    function renderFormula(node, text) {
        // split() with a capture puts the words at the odd places.
        String(text).split(FORMULA_WORD).forEach(function (part, i) {
            if (!part) return;
            if (i % 2 === 0) node.appendChild(document.createTextNode(part));
            else node.appendChild(SP.el('span', SLOT.test(part) ? 'sp-slot' : 'sp-fixed', part));
        });
        return node;
    }

    // One pattern as a card: the formula and its meaning on top, the trap where
    // Russian logic leads astray, then the two examples, folded behind the
    // chevron at the end of the head as a word's are. The file's how and lit
    // stay there for whoever edits it and are not drawn. The id is what the
    // top list links to.
    function patternCard(item, topTotal, shelf) {
        var card = SP.el('div', 'sp-pat');
        card.id = item.id;

        // The pattern being practised goes to the head of the panel and back:
        // the cards are drawn once, so the pin moves the card itself. The pin
        // leads the head, as it leads a learned word in the lists; the end of
        // the line is the chevron's.
        var head = SP.el('div', 'sp-pat-head');
        head.appendChild(SP.pinButton(item.id, { node: card, host: shelf }));
        var main = head.appendChild(SP.el('div', 'sp-pat-main'));
        renderFormula(main.appendChild(SP.el('div', 'sp-pat-es')), item.es);
        main.appendChild(SP.el('div', 'sp-pat-ru', item.ru));
        if (item.top) main.appendChild(SP.topBadge(item.top, topTotal));
        card.appendChild(head);

        if (item.trap) card.appendChild(SP.el('p', 'sp-pat-trap', item.trap));

        SP.exampleDrawer(card, head, item.ex || []);
        return card;
    }

    function patternSection(id, title) {
        var section = SP.el('section', 'sp-group');
        section.id = id;
        section.appendChild(SP.el('h3', 'sp-group-title', title));
        return section;
    }

    // No intro above the index: the chip that opens the panel already names
    // it, and the marks explain themselves in their tooltips.
    function renderPatterns(host, data) {
        var index = [];
        SP.clear(host);

        var bar = SP.el('div', 'sp-bar');
        host.appendChild(bar);

        var body = SP.el('div');
        host.appendChild(body);

        // Where a pinned card is carried: a shelf at the head of the panel,
        // a .sp-lex of its own so the cards on it keep the gap they have in a
        // theme. It takes no room while nothing sits on it.
        var shelf = SP.el('div', 'sp-lex sp-pin-host');
        body.appendChild(shelf);
        var pins = [];      // {key, node} of every card, for the restore below

        // The top list is gathered first: every star on a card names its place
        // out of how many.
        var top = [];
        data.themes.forEach(function (theme) {
            theme.items.forEach(function (item) { if (item.top) top.push(item); });
        });
        top.sort(function (a, b) { return a.top - b.top; });

        data.themes.forEach(function (theme) {
            var label = theme.no + '. ' + theme.title;
            var section = patternSection(theme.id, label);
            var cards = SP.el('div', 'sp-lex');
            theme.items.forEach(function (item) {
                var card = patternCard(item, top.length, shelf);
                cards.appendChild(card);
                pins.push({ key: item.id, node: card });
            });
            section.appendChild(cards);
            body.appendChild(section);
            index.push({ row: 'main', label: label, target: theme.id });
        });

        if (data.contrasts && data.contrasts.length) {
            var contrasts = patternSection('esp-contrasts', 'Похожие шаблоны: в чём разница');
            data.contrasts.forEach(function (note) { contrasts.appendChild(SP.renderNote(note)); });
            body.appendChild(contrasts);
            index.push({ row: 'main', label: 'Сравнения', target: contrasts.id });
        }

        if (top.length) {
            var topLabel = 'ТОП-' + top.length;
            var topSection = patternSection('esp-top', topLabel + ': выучить первыми');
            topSection.appendChild(SP.renderTopList(top.map(function (item) {
                return {
                    name: renderFormula(SP.el('span', 'sp-pat-es'), item.es),
                    href: '#' + item.id,
                    meaning: item.ru,
                    short: item.short
                };
            })));
            body.appendChild(topSection);
            index.push({ row: 'main', label: topLabel, target: topSection.id });
        }

        // What was pinned on an earlier visit goes up before the index is
        // built, so the observer watches the cards where they now stand.
        SP.pin.pickPinned(pins).forEach(function (entry) { SP.pin.raise(entry.node, shelf); });

        SP.buildIndex(bar, index, true);
    }

    /* ---------- boot ---------- */

    function boot() {
        var root = byId('sp-app');
        if (!root || !SP) return;
        SP.base = root.dataset.base || '../resources/spanish/';

        initSearch();
        initCoverSwitch();
        initCardControls();
        initQuizControls();
        initListenControls();
        initBrowseControls();

        // The learned list and the verb forms are both wanted before the first
        // row is drawn and belong to no stage, so they ride with the manifest.
        Promise.all([SP.loadManifest(), SP.loadLearned(), SP.loadVerbs()]).then(function (loaded) {
            manifest = loaded[0];
            renderStageChips();
            renderModeTabs();
            return loadScope();
        }).then(function () {
            root.hidden = false;
            var fromHash = location.hash.slice(1);
            enterMode(MODES.indexOf(fromHash) !== -1 ? fromHash : 'browse', true);
        }).catch(function (e) {
            SP.showError('sp-error', e);
        });

        window.addEventListener('hashchange', function () {
            var mode = location.hash.slice(1);
            if (MODES.indexOf(mode) !== -1 && mode !== currentMode) enterMode(mode);
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
    else boot();
})();
