// Learn page: Daily 10, Flashcards (Leitner), Quiz, Browse over the hand-curated
// knowledge base in resources/knowledge.json.

// ---------- Helpers ----------

function mulberry32(seed) {
    return function () {
        seed |= 0;
        seed = seed + 0x6D2B79F5 | 0;
        let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

function shuffleCopy(items, rng) {
    const random = rng || Math.random;
    const result = items.slice();
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

function formatDate(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function todayStr() {
    return formatDate(new Date());
}

function todaySeed() {
    return Number(todayStr().replace(/-/g, ''));
}

function dateInDays(days) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return formatDate(d);
}

function loadState(key, version) {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return null;
        const state = JSON.parse(raw);
        return state && state.v === (version || 1) ? state : null;
    } catch (e) {
        return null;
    }
}

function saveState(key, state) {
    try {
        localStorage.setItem(key, JSON.stringify(state));
    } catch (e) {
        console.warn('Could not save state to localStorage:', e);
    }
}

function normalizeQuery(text) {
    return text.toLowerCase().replace(/ё/g, 'е');
}

// ---------- Data loading ----------

const KNOWLEDGE_URL = '../resources/knowledge.json';

let KNOWLEDGE_META = null;
let KNOWLEDGE_DATA = [];

// Grouped-by-source file -> the flat array and source map the rest of this file expects.
// Throws on any structural defect so a bad hand edit surfaces as the error banner
// instead of a half-rendered page.
function buildKnowledge(file) {
    if (!file || !Array.isArray(file.sources) || !file.sources.length) {
        throw new Error('knowledge.json: sources[] is missing or empty');
    }
    const sources = {};
    const items = [];
    const seen = {};
    file.sources.forEach(source => {
        if (!source || !source.id || !source.kind || !source.title || !source.url
            || !Array.isArray(source.items)) {
            throw new Error('knowledge.json: incomplete source ' + (source && source.id));
        }
        if (sources[source.id]) {
            throw new Error('knowledge.json: duplicate source ' + source.id);
        }
        const entry = { kind: source.kind, title: source.title, url: source.url };
        if (source.author) entry.author = source.author;
        sources[source.id] = entry;
        source.items.forEach(item => {
            if (!item || !item.id || !item.type || !item.text) {
                throw new Error('knowledge.json: incomplete item in ' + source.id);
            }
            if (seen[item.id]) {
                throw new Error('knowledge.json: duplicate id ' + item.id);
            }
            seen[item.id] = true;
            item.src = source.id;
            items.push(item);
        });
    });
    if (!items.length) throw new Error('knowledge.json: no items');

    const counts = { total: items.length, principle: 0, term: 0, quote: 0, insight: 0 };
    items.forEach(item => {
        counts[item.type] = (counts[item.type] || 0) + 1;
    });

    KNOWLEDGE_DATA = items;
    KNOWLEDGE_META = {
        version: file.version,
        updated: file.updated,
        counts: counts,
        sources: sources
    };
}

async function loadKnowledge() {
    // no-cache forces revalidation: GitHub Pages serves max-age=600, so without it a
    // freshly published knowledge base stays invisible for ten minutes.
    const response = await fetch(KNOWLEDGE_URL, { cache: 'no-cache' });
    if (!response.ok) {
        throw new Error('HTTP ' + response.status + ' for ' + KNOWLEDGE_URL);
    }
    buildKnowledge(await response.json());
}

// ---------- Data access ----------

const TYPE_LABELS = { principle: 'Principle', term: 'Term', quote: 'Quote', insight: 'Insight' };

function sourceOf(item) {
    return KNOWLEDGE_META.sources[item.src] || { title: item.src, url: '#' };
}

function anchorFor(item) {
    if (item.type === 'principle') {
        return 'principles.html' + (item.ref ? '#' + item.ref : '');
    }
    const anchors = { term: '#vocabulary-section', quote: '#notes-section', insight: '#review-section' };
    return sourceOf(item).url + (anchors[item.type] || '');
}

function contextOf(item) {
    if (item.type === 'principle') {
        return item.subcategory ? `${item.category} · ${item.subcategory}` : (item.category || '');
    }
    return sourceOf(item).title;
}

function cardEligible(item) {
    return item.type === 'term' || ((item.type === 'principle' || item.type === 'insight') && item.title);
}

// An insight makes a fair "name this idea" question only when its title fits on an option
// button and its text is substantial enough to identify but short enough to read as a prompt.
// Items titled "… — пример" are excluded: that title differs from its parent block's by the
// suffix alone, so both would be defensible answers to the same question.
const INSIGHT_TITLE_MAX = 100;
const INSIGHT_TEXT_MIN = 60;
const INSIGHT_TEXT_MAX = 700;
const INSIGHT_EXAMPLE_TITLE = /\s+—\s*пример\s*$/;

function insightQuizEligible(item) {
    return item.type === 'insight'
        && !!item.title
        && item.title.length <= INSIGHT_TITLE_MAX
        && !INSIGHT_EXAMPLE_TITLE.test(item.title)
        && item.text.length >= INSIGHT_TEXT_MIN
        && item.text.length <= INSIGHT_TEXT_MAX;
}

let CARD_POOL = [];
let TERMS = [];
let QUOTES = [];
let INSIGHTS = [];
let CATEGORIZED_PRINCIPLES = [];
let CATEGORIES = [];

// ---------- Card rendering (Daily, Browse) ----------

function renderCard(item) {
    const card = document.createElement('article');
    card.className = 'k-card';

    const head = document.createElement('div');
    head.className = 'k-head';
    const badge = document.createElement('span');
    badge.className = 'k-badge k-badge--' + item.type;
    badge.textContent = TYPE_LABELS[item.type] || item.type;
    head.appendChild(badge);
    const source = document.createElement('a');
    source.className = 'k-source';
    source.href = anchorFor(item);
    source.textContent = contextOf(item);
    head.appendChild(source);

    card.appendChild(head);

    if (item.title) {
        const title = document.createElement('div');
        title.className = 'k-title';
        title.textContent = item.title;
        card.appendChild(title);
    }
    const text = document.createElement('div');
    text.className = 'k-text';
    text.textContent = item.text;
    card.appendChild(text);
    return card;
}

// ---------- Tabs ----------

const MODES = ['daily', 'cards', 'quiz', 'browse'];

function switchMode(mode) {
    if (MODES.indexOf(mode) === -1) mode = 'daily';
    document.querySelectorAll('.learn-tab').forEach(tab => {
        const active = tab.dataset.mode === mode;
        tab.classList.toggle('active', active);
        tab.setAttribute('aria-selected', String(active));
    });
    MODES.forEach(name => {
        document.getElementById('panel-' + name).hidden = name !== mode;
    });
    history.replaceState(null, '', '#' + mode);
}

function initTabs() {
    document.querySelectorAll('.learn-tab').forEach(tab => {
        tab.addEventListener('click', () => switchMode(tab.dataset.mode));
    });
    window.addEventListener('hashchange', () => switchMode(location.hash.slice(1)));
    switchMode(location.hash.slice(1) || 'daily');
}

// ---------- Daily 10 ----------

let dailyShown = 10;
let dailyOrder = [];

function initDaily() {
    dailyOrder = shuffleCopy(KNOWLEDGE_DATA, mulberry32(todaySeed()));
    document.getElementById('daily-more').addEventListener('click', () => {
        dailyShown = Math.min(dailyShown + 10, dailyOrder.length);
        renderDaily();
    });
    renderDaily();
}

function renderDaily() {
    const list = document.getElementById('daily-list');
    list.textContent = '';
    const fragment = document.createDocumentFragment();
    const shown = dailyOrder.slice(0, dailyShown);
    shown.forEach(item => fragment.appendChild(renderCard(item)));
    list.appendChild(fragment);
    document.getElementById('daily-stats').textContent =
        `${todayStr()} · showing ${shown.length} of ${dailyOrder.length}`;
    document.getElementById('daily-more').hidden = dailyShown >= dailyOrder.length;
}

// ---------- Flashcards (Leitner) ----------

const BOX_INTERVALS = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 21 };
let cardsState = null;
let cardsQueue = [];
let cardsIndex = 0;
let cardsRevealed = false;

function initCards() {
    // v:2 — item ids moved from content hashes to stable hand-assigned ones, so any
    // pre-existing progress is unmappable. The prune keeps the count honest afterwards,
    // when individual items are edited away.
    cardsState = loadState('learnCardsState', 2) || { v: 2, cards: {} };
    const live = {};
    CARD_POOL.forEach(item => { live[item.id] = true; });
    Object.keys(cardsState.cards).forEach(id => {
        if (!live[id]) delete cardsState.cards[id];
    });
    buildCardsQueue();
    document.getElementById('cards-reveal').addEventListener('click', revealCard);
    document.getElementById('cards-again').addEventListener('click', () => answerCard(false));
    document.getElementById('cards-good').addEventListener('click', () => answerCard(true));
    document.getElementById('cards-new10').addEventListener('click', addNewCards);
    document.getElementById('cards-ahead').addEventListener('click', practiceAhead);
    document.addEventListener('keydown', event => {
        if (document.getElementById('panel-cards').hidden) return;
        const target = event.target;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'TEXTAREA')) return;
        if (event.code === 'Space' && !cardsRevealed && cardsIndex < cardsQueue.length) {
            event.preventDefault();
            revealCard();
        } else if (cardsRevealed && event.key === '1') {
            answerCard(false);
        } else if (cardsRevealed && event.key === '2') {
            answerCard(true);
        }
    });
    showCurrentCard();
}

function buildCardsQueue() {
    const today = todayStr();
    const due = CARD_POOL
        .filter(item => cardsState.cards[item.id] && cardsState.cards[item.id].due <= today)
        .sort((a, b) => cardsState.cards[a.id].b - cardsState.cards[b.id].b);
    const fresh = CARD_POOL.filter(item => !cardsState.cards[item.id]).slice(0, 10);
    cardsQueue = due.concat(fresh);
    cardsIndex = 0;
}

function addNewCards() {
    const queued = new Set(cardsQueue.slice(cardsIndex).map(item => item.id));
    const fresh = CARD_POOL
        .filter(item => !cardsState.cards[item.id] && !queued.has(item.id))
        .slice(0, 10);
    cardsQueue = cardsQueue.slice(cardsIndex).concat(fresh);
    cardsIndex = 0;
    showCurrentCard();
}

function practiceAhead() {
    const today = todayStr();
    cardsQueue = CARD_POOL
        .filter(item => cardsState.cards[item.id] && cardsState.cards[item.id].due > today)
        .sort((a, b) => cardsState.cards[a.id].due < cardsState.cards[b.id].due ? -1 : 1)
        .slice(0, 10);
    cardsIndex = 0;
    showCurrentCard();
}

function revealCard() {
    cardsRevealed = true;
    document.getElementById('flashcard').classList.add('revealed');
    document.getElementById('cards-reveal').hidden = true;
    document.getElementById('cards-again').hidden = false;
    document.getElementById('cards-good').hidden = false;
}

function answerCard(good) {
    const item = cardsQueue[cardsIndex];
    if (!item) return;
    // A new card starts in box 1: Good moves it to box 2 (due tomorrow), Again
    // keeps it in box 1 and brings it back this round. Starting at 0, Good only
    // reached box 1, due today with nothing to bring it back, while Again then
    // Good reached box 2 — a card known at once came round later than a miss.
    const record = cardsState.cards[item.id] || { b: 1, due: todayStr(), ok: 0, ko: 0 };
    if (good) {
        record.b = Math.min(5, (record.b || 0) + 1);
        record.due = dateInDays(BOX_INTERVALS[record.b]);
        record.ok += 1;
    } else {
        record.b = 1;
        record.due = todayStr();
        record.ko += 1;
        cardsQueue.push(item);
    }
    cardsState.cards[item.id] = record;
    saveState('learnCardsState', cardsState);
    cardsIndex += 1;
    showCurrentCard();
}

function showCurrentCard() {
    cardsRevealed = false;
    const flashcard = document.getElementById('flashcard');
    const empty = document.getElementById('cards-empty');
    const item = cardsQueue[cardsIndex];
    flashcard.classList.remove('revealed');
    document.getElementById('cards-reveal').hidden = !item;
    document.getElementById('cards-again').hidden = true;
    document.getElementById('cards-good').hidden = true;
    document.getElementById('cards-new10').hidden = false;
    flashcard.hidden = !item;
    empty.hidden = Boolean(item);
    if (item) {
        document.getElementById('flashcard-meta').textContent =
            `${TYPE_LABELS[item.type]} · ${contextOf(item)}`;
        document.getElementById('flashcard-front').textContent = item.title;
        document.getElementById('flashcard-back').textContent = item.text;
    }
    const today = todayStr();
    const tracked = Object.keys(cardsState.cards).length;
    const dueCount = CARD_POOL.filter(it =>
        cardsState.cards[it.id] && cardsState.cards[it.id].due <= today).length;
    document.getElementById('cards-stats').textContent =
        `Left in session: ${Math.max(0, cardsQueue.length - cardsIndex)} · Due: ${dueCount} · ` +
        `Started: ${tracked}/${CARD_POOL.length}`;
}

// ---------- Quiz ----------

let quizStats = null;
let quizQuestions = [];
let quizIndex = 0;
let quizCorrect = 0;

function pickDistinct(pool, count, exclude, keyFn) {
    const taken = new Set(exclude);
    const result = [];
    let guard = 0;
    while (result.length < count && guard < 500) {
        guard += 1;
        const candidate = pool[Math.floor(Math.random() * pool.length)];
        const key = keyFn(candidate);
        if (taken.has(key)) continue;
        taken.add(key);
        result.push(candidate);
    }
    return result;
}

function makeTermQuestion(item) {
    const sameBook = TERMS.filter(t => t.src === item.src && t.id !== item.id);
    const pool = sameBook.length >= 3 ? sameBook : TERMS.filter(t => t.id !== item.id);
    const distractors = pickDistinct(pool, 3, [item.text], t => t.text).map(t => t.text);
    return {
        type: 'term',
        prompt: `What does “${item.title}” mean? (${sourceOf(item).title})`,
        options: shuffleCopy(distractors.concat(item.text)),
        answer: item.text
    };
}

function makeQuoteQuestion(item) {
    const bookIds = Object.keys(KNOWLEDGE_META.sources).filter(id =>
        KNOWLEDGE_META.sources[id].kind === 'book' && id !== item.src);
    const distractors = pickDistinct(bookIds, 3, [], id => id)
        .map(id => KNOWLEDGE_META.sources[id].title);
    return {
        type: 'quote',
        prompt: `Which book is this quote from?\n\n«${item.text}»`,
        options: shuffleCopy(distractors.concat(sourceOf(item).title)),
        answer: sourceOf(item).title
    };
}

// One title must never be a prefix of another among the options — "Речь Голта" and
// "Речь Голта — не отступление, а сам текст" would both answer the same prompt.
function titlesOverlap(a, b) {
    const x = normalizeQuery(a);
    const y = normalizeQuery(b);
    return x.indexOf(y) === 0 || y.indexOf(x) === 0;
}

function makeInsightQuestion(item) {
    const usable = other => other.id !== item.id && !titlesOverlap(other.title, item.title);
    const sameBook = INSIGHTS.filter(other => other.src === item.src && usable(other));
    const pool = sameBook.length >= 3 ? sameBook : INSIGHTS.filter(usable);
    const distractors = pickDistinct(pool, 3, [], other => normalizeQuery(other.title))
        .map(other => other.title);
    return {
        type: 'insight',
        prompt: `Which idea from “${sourceOf(item).title}” is this?\n\n${item.text}`,
        options: shuffleCopy(distractors.concat(item.title)),
        answer: item.title
    };
}

function makePrincipleQuestion(item) {
    const distractors = pickDistinct(
        CATEGORIES.filter(c => c !== item.category), 3, [], c => c);
    const text = item.title ? `${item.title}: ${item.text}` : item.text;
    return {
        type: 'principle',
        prompt: `Which category does this principle belong to?\n\n${text}`,
        options: shuffleCopy(distractors.concat(item.category)),
        answer: item.category
    };
}

function makeQuestions() {
    const generators = [];
    if (TERMS.length >= 4) generators.push({ pool: TERMS, make: makeTermQuestion, weight: TERMS.length });
    if (QUOTES.length > 0) generators.push({ pool: QUOTES, make: makeQuoteQuestion, weight: QUOTES.length });
    if (INSIGHTS.length >= 4) generators.push({ pool: INSIGHTS, make: makeInsightQuestion, weight: INSIGHTS.length });
    if (CATEGORIZED_PRINCIPLES.length > 0 && CATEGORIES.length >= 4) {
        generators.push({ pool: CATEGORIZED_PRINCIPLES, make: makePrincipleQuestion, weight: CATEGORIZED_PRINCIPLES.length });
    }
    const totalWeight = generators.reduce((sum, g) => sum + g.weight, 0);
    const used = new Set();
    const questions = [];
    let guard = 0;
    while (questions.length < 10 && guard < 200) {
        guard += 1;
        let roll = Math.random() * totalWeight;
        const generator = generators.find(g => (roll -= g.weight) < 0) || generators[0];
        const item = generator.pool[Math.floor(Math.random() * generator.pool.length)];
        if (used.has(item.id)) continue;
        used.add(item.id);
        const question = generator.make(item);
        if (new Set(question.options).size === question.options.length) {
            questions.push(question);
        }
    }
    return questions;
}

function initQuiz() {
    quizStats = loadState('learnQuizStats') || {
        v: 1, rounds: 0, answered: 0, correct: 0,
        byType: {
            term: { a: 0, c: 0 }, quote: { a: 0, c: 0 },
            principle: { a: 0, c: 0 }, insight: { a: 0, c: 0 }
        }
    };
    document.getElementById('quiz-begin').addEventListener('click', startQuizRound);
    document.getElementById('quiz-again').addEventListener('click', startQuizRound);
    document.getElementById('quiz-next').addEventListener('click', nextQuizQuestion);
    renderQuizStart();
}

function renderQuizStart() {
    const accuracy = quizStats.answered
        ? Math.round(100 * quizStats.correct / quizStats.answered) : 0;
    document.getElementById('quiz-total-stats').textContent = quizStats.answered
        ? `Rounds: ${quizStats.rounds} · Answered: ${quizStats.answered} · Accuracy: ${accuracy}%`
        : 'Multiple-choice questions generated from your knowledge base.';
    document.getElementById('quiz-start').hidden = false;
    document.getElementById('quiz-round').hidden = true;
    document.getElementById('quiz-done').hidden = true;
}

function startQuizRound() {
    quizQuestions = makeQuestions();
    quizIndex = 0;
    quizCorrect = 0;
    document.getElementById('quiz-start').hidden = true;
    document.getElementById('quiz-done').hidden = true;
    document.getElementById('quiz-round').hidden = false;
    renderQuizQuestion();
}

function renderQuizQuestion() {
    const question = quizQuestions[quizIndex];
    document.getElementById('quiz-progress').textContent =
        `Question ${quizIndex + 1}/${quizQuestions.length} · Correct: ${quizCorrect}`;
    document.getElementById('quiz-question').textContent = question.prompt;
    document.getElementById('quiz-next').hidden = true;
    const container = document.getElementById('quiz-options');
    container.textContent = '';
    question.options.forEach(option => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'quiz-option';
        button.textContent = option;
        button.addEventListener('click', () => answerQuiz(question, option, container));
        container.appendChild(button);
    });
}

function answerQuiz(question, chosen, container) {
    const correct = chosen === question.answer;
    if (correct) quizCorrect += 1;
    quizStats.answered += 1;
    if (correct) quizStats.correct += 1;
    // Stats saved before a question type existed have no bucket for it — create it rather
    // than dropping the answer on the floor.
    if (!quizStats.byType[question.type]) {
        quizStats.byType[question.type] = { a: 0, c: 0 };
    }
    const byType = quizStats.byType[question.type];
    byType.a += 1;
    if (correct) byType.c += 1;
    saveState('learnQuizStats', quizStats);
    container.querySelectorAll('.quiz-option').forEach(button => {
        button.disabled = true;
        if (button.textContent === question.answer) button.classList.add('correct');
        else if (button.textContent === chosen) button.classList.add('wrong');
    });
    const next = document.getElementById('quiz-next');
    next.textContent = quizIndex + 1 < quizQuestions.length ? 'Next' : 'Finish';
    next.hidden = false;
}

function nextQuizQuestion() {
    quizIndex += 1;
    if (quizIndex < quizQuestions.length) {
        renderQuizQuestion();
        return;
    }
    quizStats.rounds += 1;
    saveState('learnQuizStats', quizStats);
    document.getElementById('quiz-round').hidden = true;
    document.getElementById('quiz-score').textContent =
        `You scored ${quizCorrect}/${quizQuestions.length}.`;
    document.getElementById('quiz-done').hidden = false;
}

// ---------- Browse ----------

let browsePrefs = null;
let browseOrder = null;
let browseShown = 100;
let browseFiltered = [];
let browseDebounce = null;

function fillSelect(select, entries, selected) {
    select.textContent = '';
    entries.forEach(entry => {
        const option = document.createElement('option');
        option.value = entry.value;
        option.textContent = entry.label;
        select.appendChild(option);
    });
    select.value = selected;
    if (select.value !== selected) select.value = entries[0].value;
}

function initBrowse() {
    browsePrefs = loadState('learnBrowsePrefs') || { v: 1, src: 'all', type: 'all', category: 'all' };
    const bookEntries = Object.keys(KNOWLEDGE_META.sources)
        .filter(id => KNOWLEDGE_META.sources[id].kind === 'book')
        .sort((a, b) => KNOWLEDGE_META.sources[a].title.localeCompare(KNOWLEDGE_META.sources[b].title))
        .map(id => ({ value: id, label: KNOWLEDGE_META.sources[id].title }));
    fillSelect(document.getElementById('browse-src'),
        [{ value: 'all', label: 'All sources' }, { value: 'principles', label: 'Life Principles' }]
            .concat(bookEntries),
        browsePrefs.src);
    fillSelect(document.getElementById('browse-type'),
        [{ value: 'all', label: 'All types' }].concat(
            Object.keys(TYPE_LABELS).map(type => ({ value: type, label: TYPE_LABELS[type] + 's' }))),
        browsePrefs.type);
    fillSelect(document.getElementById('browse-category'),
        [{ value: 'all', label: 'All categories' }].concat(
            CATEGORIES.map(category => ({ value: category, label: category }))),
        browsePrefs.category);

    ['browse-src', 'browse-type', 'browse-category'].forEach(id => {
        document.getElementById(id).addEventListener('change', () => {
            browsePrefs = {
                v: 1,
                src: document.getElementById('browse-src').value,
                type: document.getElementById('browse-type').value,
                category: document.getElementById('browse-category').value
            };
            saveState('learnBrowsePrefs', browsePrefs);
            browseShown = 100;
            renderBrowse();
        });
    });
    document.getElementById('browse-search').addEventListener('input', () => {
        clearTimeout(browseDebounce);
        browseDebounce = setTimeout(() => {
            browseShown = 100;
            renderBrowse();
        }, 150);
    });
    document.getElementById('browse-shuffle').addEventListener('click', () => {
        browseOrder = shuffleCopy(KNOWLEDGE_DATA);
        browseShown = 100;
        renderBrowse();
    });
    document.getElementById('browse-reset').addEventListener('click', () => {
        browseOrder = null;
        browseShown = 100;
        browsePrefs = { v: 1, src: 'all', type: 'all', category: 'all' };
        saveState('learnBrowsePrefs', browsePrefs);
        document.getElementById('browse-search').value = '';
        document.getElementById('browse-src').value = 'all';
        document.getElementById('browse-type').value = 'all';
        document.getElementById('browse-category').value = 'all';
        renderBrowse();
    });
    document.getElementById('browse-more').addEventListener('click', () => {
        browseShown += 200;
        renderBrowse();
    });
    document.getElementById('browse-export-json').addEventListener('click', () => exportItems('json'));
    document.getElementById('browse-export-csv').addEventListener('click', () => exportItems('csv'));
    renderBrowse();
}

function applyBrowseFilters() {
    const src = document.getElementById('browse-src').value;
    const type = document.getElementById('browse-type').value;
    const category = document.getElementById('browse-category').value;
    const query = normalizeQuery(document.getElementById('browse-search').value.trim());
    const base = browseOrder || KNOWLEDGE_DATA;
    return base.filter(item => {
        if (src !== 'all' && item.src !== src) return false;
        if (type !== 'all' && item.type !== type) return false;
        if (category !== 'all' && item.category !== category) return false;
        if (query) {
            const haystack = normalizeQuery(
                (item.title || '') + '\n' + item.text + '\n' + sourceOf(item).title);
            if (haystack.indexOf(query) === -1) return false;
        }
        return true;
    });
}

function renderBrowse() {
    browseFiltered = applyBrowseFilters();
    const list = document.getElementById('browse-list');
    list.textContent = '';
    const fragment = document.createDocumentFragment();
    browseFiltered.slice(0, browseShown).forEach(item => fragment.appendChild(renderCard(item)));
    list.appendChild(fragment);
    document.getElementById('browse-count').textContent =
        `${browseFiltered.length} / ${KNOWLEDGE_META.counts.total}`;
    document.getElementById('browse-empty').hidden = browseFiltered.length > 0;
    document.getElementById('browse-more').hidden = browseFiltered.length <= browseShown;
}

function exportItems(format) {
    const items = browseFiltered.map(item => {
        const source = sourceOf(item);
        return {
            id: item.id,
            type: item.type,
            source: source.title,
            author: source.author || '',
            category: item.category || '',
            subcategory: item.subcategory || '',
            title: item.title || '',
            text: item.text
        };
    });
    let content;
    let mime;
    if (format === 'json') {
        content = JSON.stringify(items, null, 2);
        mime = 'application/json';
    } else {
        const columns = ['id', 'type', 'source', 'author', 'category', 'subcategory', 'title', 'text'];
        const escapeCsv = value => '"' + String(value).replace(/"/g, '""') + '"';
        content = '\uFEFF' + columns.map(escapeCsv).join(',') + '\r\n' +
            items.map(item => columns.map(column => escapeCsv(item[column])).join(',')).join('\r\n');
        mime = 'text/csv;charset=utf-8';
    }
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `knowledge-${todayStr()}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ---------- Init ----------

function startLearn() {
    CARD_POOL = KNOWLEDGE_DATA.filter(cardEligible);
    TERMS = KNOWLEDGE_DATA.filter(item => item.type === 'term');
    QUOTES = KNOWLEDGE_DATA.filter(item => item.type === 'quote');
    INSIGHTS = KNOWLEDGE_DATA.filter(insightQuizEligible);
    CATEGORIZED_PRINCIPLES = KNOWLEDGE_DATA.filter(item => item.type === 'principle' && item.category);
    CATEGORIES = [];
    CATEGORIZED_PRINCIPLES.forEach(item => {
        if (CATEGORIES.indexOf(item.category) === -1) CATEGORIES.push(item.category);
    });

    const counts = KNOWLEDGE_META.counts;
    const books = Object.keys(KNOWLEDGE_META.sources)
        .filter(id => KNOWLEDGE_META.sources[id].kind === 'book').length;
    document.getElementById('learn-intro').textContent =
        `${counts.total.toLocaleString('en-US')} knowledge units — ` +
        `${counts.principle} principles, ${counts.term} terms, ` +
        `${counts.quote} quotes and ${counts.insight} book insights, ` +
        `curated from Life Principles and ${books} book reviews. ` +
        `Updated ${KNOWLEDGE_META.updated}.`;

    initTabs();
    initDaily();
    initCards();
    initQuiz();
    initBrowse();
}

function showLoadError(error) {
    console.error('Knowledge data failed to load:', error);
    document.getElementById('learn-intro').textContent = '';
    document.getElementById('learn-error').hidden = false;
    document.querySelector('.learn-tabs').hidden = true;
    MODES.forEach(name => {
        document.getElementById('panel-' + name).hidden = true;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('learn-intro').textContent = 'Loading knowledge base…';
    loadKnowledge().then(startLearn).catch(showLoadError);
});
