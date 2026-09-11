/* The Spanish trainer on pages/spanish.html.
   A stage chip picks the pool; five modes work over it — a browsable list,
   Leitner flashcards, a multiple-choice quiz, a listening drill and the
   phonetics/grammar rules, rendered in place rather than on their own page.
   Progress lives under its own localStorage keys and never touches the ones
   resources/learn.js owns. */

(function () {
    'use strict';

    var SP = window.SP;

    var MODES = ['browse', 'cards', 'quiz', 'listen', 'rules'];   // the browse list leads and opens by default
    var BOX_INTERVALS = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 21 };
    var NEW_PER_BATCH = 10;
    var QUIZ_LENGTH = 10;
    var BROWSE_PAGE = 100;
    var BROWSE_STEP = 200;

    // Inside one topic the entries read words first, then pairs, then live
    // phrases and dialogues, with the drills last.
    var TYPE_ORDER = { vocab: 0, pair: 1, phrase: 2, exchange: 3, drill: 4 };

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

    function loadScope() {
        return SP.loadStages(selectedEntries()).then(function (stages) {
            rebuildPools(stages);
            return stages;
        });
    }

    /* ---------- chips and tabs ---------- */

    function renderStageChips() {
        var strip = byId('sp-stages');
        SP.clear(strip);

        // Rules are reference rather than a study scope, but they keep the slot
        // they have always had at the head of the row — now a button that opens
        // the panel in place instead of a link off the page.
        if (manifest.rules) {
            var rulesChip = SP.el('button', 'sp-chip');
            rulesChip.type = 'button';
            rulesChip.id = 'sp-rules-chip';
            rulesChip.title = manifest.rules.titleRu;
            var rulesIcon = SP.iconSpan(manifest.rules.icon);
            if (rulesIcon) rulesChip.appendChild(rulesIcon);
            rulesChip.appendChild(SP.el('span', 'sp-chip-label', 'Rules'));
            rulesChip.addEventListener('click', function () { enterMode('rules'); });
            strip.appendChild(rulesChip);
        }

        // The stages follow and "All stages" closes the row: it is the widest
        // scope, not the starting point.
        var options = manifest.stages.map(function (s) {
            var n = 0;
            Object.keys(s.counts).forEach(function (k) { n += s.counts[k]; });
            return { key: String(s.no), label: s.title, sub: String(n), icon: s.icon, no: s.no };
        }).concat([{ key: 'all', label: 'All stages', sub: '' }]);

        options.forEach(function (option) {
            var chip = SP.el('button', 'sp-chip');
            chip.type = 'button';
            chip.dataset.stage = option.key;
            var icon = SP.iconSpan(option.icon);
            if (icon) chip.appendChild(icon);
            chip.appendChild(SP.el('span', 'sp-chip-label', option.label));
            if (option.sub) chip.appendChild(SP.el('small', null, ' ' + option.sub));
            if (option.no) {
                chip.setAttribute('aria-label',
                    'Stage ' + option.no + ': ' + option.label + ', ' + option.sub + ' entries');
            }
            chip.addEventListener('click', function () {
                if (prefs.stage === option.key) return;
                prefs.stage = option.key;
                savePrefs();
                renderStageChips();
                // Picking a scope means you want to study it, so step out of
                // the rules — otherwise the click would change nothing on screen.
                var next = currentMode === 'rules' ? 'browse' : currentMode;
                loadScope().then(function () { enterMode(next, true); })
                    .catch(function (e) { SP.showError('sp-error', e); });
            });
            strip.appendChild(chip);
        });

        syncChipActive();
    }

    // One highlight per row: reading the rules is not a scope, so while that
    // panel is open the stage chips stay quiet and Rules carries the mark.
    function syncChipActive() {
        var readingRules = currentMode === 'rules';
        var rules = byId('sp-rules-chip');
        if (rules) rules.classList.toggle('active', readingRules);
        document.querySelectorAll('#sp-stages .sp-chip[data-stage]').forEach(function (chip) {
            chip.classList.toggle('active', !readingRules && chip.dataset.stage === String(prefs.stage));
        });
    }

    function renderModeTabs() {
        var strip = byId('sp-modes');
        SP.clear(strip);
        var labels = { browse: 'Browse', cards: 'Flashcards', quiz: 'Quiz', listen: 'Listening' };
        MODES.forEach(function (mode) {
            if (mode === 'rules') return;          // its button sits in the chip row
            if (mode === 'listen' && !SP.tts.available()) return;
            var tab = SP.el('button', 'sp-tab', labels[mode]);
            tab.type = 'button';
            tab.dataset.mode = mode;
            tab.setAttribute('role', 'tab');
            strip.appendChild(tab);
            tab.addEventListener('click', function () { enterMode(mode); });
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

        var speakHost = byId('sp-card-speak');
        SP.clear(speakHost);
        var speak = SP.speakButton(item.es, 'Listen to the Spanish');
        if (speak) speakHost.appendChild(speak);
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
        card.addEventListener('click', function (e) {
            if (e.target.closest('.sp-speak')) return;
            revealCard();
        });

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
            speak: item.es,
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
            speak: item.es,
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
            speak: entry.cue,
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
            speak: null,
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
        var phrases = pool.filter(function (i) { return i.type === 'phrase' || i.type === 'exchange'; });
        var pairs = pairEntries();
        var drills = allItems.filter(function (i) { return i.type === 'drill' && i.kind === 'choice'; });

        var generators = [];
        if (words.length >= 4) {
            generators.push({ weight: words.length, make: function () { return makeMeaningQuestion(SP.pick(words), words); } });
            generators.push({ weight: words.length, make: function () { return makeProductionQuestion(SP.pick(words), words); } });
        }
        if (phrases.length >= 4) {
            generators.push({ weight: phrases.length, make: function () { return makeMeaningQuestion(SP.pick(phrases), phrases); } });
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
        if (question.speak) {
            var speak = SP.speakButton(question.speak, 'Listen');
            if (speak) {
                var row = SP.el('div');
                row.style.marginTop = 'var(--spacing-sm)';
                row.appendChild(speak);
                host.appendChild(row);
            }
        }

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

        var host = byId('sp-listen-word');
        SP.clear(host);
        var speak = SP.speakButton(item.es, 'Play the word again');
        if (speak) host.appendChild(speak);

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

    function initListenControls() {
        byId('sp-listen-next').addEventListener('click', nextListen);
        byId('sp-listen-slow').addEventListener('click', function () {
            if (listenQuestion) SP.tts.speak(listenQuestion.item.es, { rate: 0.6 });
        });
    }

    /* ---------- browse ---------- */

    var browseShown = BROWSE_PAGE;
    var browseFiltered = [];

    function initBrowse() {
        // Topic names are unique across the stages, so the option value is the
        // bare name; the optgroup only says where it comes from, which matters
        // once the scope is "All stages" and the list runs to 45 topics.
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

        // allItems keeps the file order, which interleaves a few exchanges
        // among the phrases; sorting by type makes every topic read the same
        // way. The original index is the tie-breaker, so the sort is stable.
        browseFiltered = allItems
            .filter(function (item) { return !group || item.group === group; })
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

    function renderBrowse() {
        var list = byId('sp-browse-list');
        SP.clear(list);
        byId('sp-browse-empty').hidden = browseFiltered.length !== 0;

        var slice = browseFiltered.slice(0, browseShown);
        var frag = document.createDocumentFragment();
        slice.forEach(function (item) {
            if (item.type === 'drill') {
                var row = SP.el('div', 'sp-ex-row');
                row.appendChild(SP.el('div', 'sp-ex-es', item.prompt));
                row.appendChild(SP.el('div', 'sp-ex-ru', item.answer));
                var speak = SP.speakButton(item.answer);
                if (speak) row.appendChild(speak);
                frag.appendChild(row);
            } else if (item.type === 'phrase' || item.type === 'exchange') {
                frag.appendChild(SP.renderExRow(item));
            } else {
                frag.appendChild(SP.renderLexRow(item));
            }
        });
        list.appendChild(frag);

        var more = byId('sp-browse-more');
        if (browseShown >= browseFiltered.length) {
            more.hidden = true;
        } else {
            more.hidden = false;
            more.textContent = 'Show ' + Math.min(BROWSE_STEP, browseFiltered.length - browseShown) +
                ' more (' + (browseFiltered.length - browseShown) + ' left)';
        }
    }

    function exportCsv() {
        var head = ['id', 'stage', 'type', 'group', 'es', 'en', 'ru', 'tr'];
        var lines = [head.join(',')];
        browseFiltered.forEach(function (item) {
            lines.push(head.map(function (key) {
                var value = item[key] === undefined || item[key] === null ? '' : String(item[key]);
                return '"' + value.replace(/"/g, '""') + '"';
            }).join(','));
        });
        // The BOM keeps Excel from reading the Cyrillic as mojibake.
        var blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv' });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        link.href = url;
        link.download = 'spanish-' + SP.todayStr() + '.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    }

    function initBrowseControls() {
        byId('sp-browse-group').addEventListener('change', applyBrowse);
        byId('sp-browse-reset').addEventListener('click', function () {
            byId('sp-browse-group').value = '';
            applyBrowse();
        });
        byId('sp-browse-more').addEventListener('click', function () {
            browseShown += BROWSE_STEP;
            renderBrowse();
        });
        byId('sp-browse-csv').addEventListener('click', exportCsv);
    }

    /* ---------- rules ---------- */

    var rulesRendered = false;

    function initRules() {
        if (rulesRendered) return;
        SP.loadRules().then(function (rules) {
            // h3, because the page already spends its h2 on the "Spanish" title.
            SP.renderRules(byId('panel-rules'), rules, { heading: 'h3', icon: manifest.rules.icon });
            rulesRendered = true;
        }).catch(function (e) { SP.showError('sp-error', e); });
    }

    /* ---------- boot ---------- */

    function boot() {
        var root = byId('sp-app');
        if (!root || !SP) return;
        SP.base = root.dataset.base || '../resources/spanish/';

        initCardControls();
        initQuizControls();
        initListenControls();
        initBrowseControls();

        SP.loadManifest().then(function (data) {
            manifest = data;
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
