// Main crossword orchestrator

import { fetchWordsWithDefinitions } from './api.js';
import { generateCrossword } from './generator.js';

const DOM = {
    levelRange: document.getElementById('level-range'),
    levelValue: document.getElementById('level-value'),
    generateBtn: document.getElementById('btn-generate'),
    checkBtn: document.getElementById('btn-check'),
    gameArea: document.getElementById('game-area'),
    gridWrapper: document.getElementById('grid-wrapper'),
    grid: document.getElementById('crossword-grid'),
    cluesAcross: document.getElementById('clues-across'),
    cluesDown: document.getElementById('clues-down'),
    stats: document.getElementById('cw-stats'),
    wordsPlaced: document.getElementById('words-placed'),
    wordsSolved: document.getElementById('words-solved'),
};

let state = {
    crossword: null,
    cells: new Map(),
    activeWordId: null,
    solvedIds: new Set(),
};

// Level slider
DOM.levelRange.addEventListener('input', () => {
    DOM.levelValue.textContent = DOM.levelRange.value;
});

// Generate button
DOM.generateBtn.addEventListener('click', handleGenerate);

// Check button
DOM.checkBtn.addEventListener('click', handleCheck);

async function handleGenerate() {
    const count = parseInt(DOM.levelRange.value, 10);

    DOM.generateBtn.disabled = true;
    DOM.checkBtn.hidden = true;
    DOM.gameArea.hidden = true;
    DOM.grid.innerHTML = '';
    DOM.cluesAcross.innerHTML = '';
    DOM.cluesDown.innerHTML = '';
    DOM.stats.hidden = true;

    // Remove previous completion banner if any
    DOM.gameArea.querySelector('.cw-complete')?.remove();

    const loading = document.createElement('div');
    loading.className = 'cw-loading';
    loading.innerHTML = '<div class="cw-spinner"></div><span>Fetching words...</span>';
    DOM.gameArea.before(loading);

    try {
        const words = await fetchWordsWithDefinitions(count);

        if (words.length < 2) {
            throw new Error('Not enough words found. Try a different API source or lower the level.');
        }

        loading.querySelector('span').textContent = 'Building crossword...';

        // Small delay so the UI updates
        await new Promise(r => setTimeout(r, 50));

        const crossword = generateCrossword(words);
        state.crossword = crossword;
        state.cells.clear();
        state.activeWordId = null;
        state.solvedIds.clear();

        renderGrid(crossword);
        renderClues(crossword);
        updateStats();

        DOM.gameArea.hidden = false;
        DOM.stats.hidden = false;
        DOM.checkBtn.hidden = false;
    } catch (err) {
        const errEl = document.createElement('div');
        errEl.className = 'cw-error';
        errEl.textContent = err.message || 'Failed to generate crossword.';
        DOM.gameArea.before(errEl);
        setTimeout(() => errEl.remove(), 5000);
    } finally {
        loading.remove();
        DOM.generateBtn.disabled = false;
    }
}

function renderGrid(crossword) {
    const { grid, rows, cols } = crossword;

    DOM.grid.style.gridTemplateColumns = `repeat(${cols}, var(--cw-cell-size))`;
    DOM.grid.style.gridTemplateRows = `repeat(${rows}, var(--cw-cell-size))`;
    DOM.grid.innerHTML = '';

    for (const [key, cell] of grid.entries()) {
        const [r, c] = key.split(',').map(Number);

        const cellDiv = document.createElement('div');
        cellDiv.className = 'cw-cell';
        cellDiv.style.gridRow = r + 1;
        cellDiv.style.gridColumn = c + 1;
        cellDiv.dataset.row = r;
        cellDiv.dataset.col = c;

        if (cell.number) {
            const numSpan = document.createElement('span');
            numSpan.className = 'cw-cell-number';
            numSpan.textContent = cell.number;
            cellDiv.appendChild(numSpan);
        }

        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'cw-cell-input';
        input.maxLength = 1;
        input.autocomplete = 'off';
        input.setAttribute('aria-label', `Row ${r + 1}, Column ${c + 1}`);

        input.addEventListener('input', (e) => handleInput(e, r, c));
        input.addEventListener('keydown', (e) => handleKeydown(e, r, c));
        input.addEventListener('focus', () => handleFocus(r, c));

        cellDiv.appendChild(input);
        DOM.grid.appendChild(cellDiv);

        state.cells.set(key, { element: cellDiv, input, cell });
    }
}

function renderClues(crossword) {
    const across = crossword.placed.filter(w => w.direction === 'across')
        .sort((a, b) => a.number - b.number);
    const down = crossword.placed.filter(w => w.direction === 'down')
        .sort((a, b) => a.number - b.number);

    DOM.cluesAcross.innerHTML = '';
    DOM.cluesDown.innerHTML = '';

    for (const word of across) {
        DOM.cluesAcross.appendChild(createClueItem(word));
    }
    for (const word of down) {
        DOM.cluesDown.appendChild(createClueItem(word));
    }
}

function createClueItem(word) {
    const li = document.createElement('li');
    li.className = 'cw-clue-item';
    li.dataset.wordId = word.id;
    li.innerHTML = `<span class="cw-clue-number">${word.number}.</span>${escapeHtml(word.definition)}`;

    li.addEventListener('click', () => {
        activateWord(word.id);
        focusFirstEmptyCell(word);
    });

    return li;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function handleInput(e, row, col) {
    const input = e.target;
    const value = input.value.replace(/[^a-zA-Z]/g, '').toUpperCase();
    input.value = value;

    // Clear check highlights on this cell when user types
    const key = `${row},${col}`;
    const cellData = state.cells.get(key);
    if (cellData) cellData.element.classList.remove('correct', 'wrong');

    if (value) {
        checkWords(row, col);
        moveToNextCell(row, col);
    }
}

function handleKeydown(e, row, col) {
    const activeWord = getActiveWord();

    switch (e.key) {
        case 'ArrowRight':
            e.preventDefault();
            moveFocus(row, col + 1);
            break;
        case 'ArrowLeft':
            e.preventDefault();
            moveFocus(row, col - 1);
            break;
        case 'ArrowDown':
            e.preventDefault();
            moveFocus(row + 1, col);
            break;
        case 'ArrowUp':
            e.preventDefault();
            moveFocus(row - 1, col);
            break;
        case 'Backspace':
            if (!e.target.value && activeWord) {
                e.preventDefault();
                moveToPrevCell(row, col, activeWord);
            }
            break;
        case 'Tab':
            e.preventDefault();
            moveToNextWord(e.shiftKey);
            break;
    }
}

function handleFocus(row, col) {
    const key = `${row},${col}`;
    const cellData = state.cells.get(key);
    if (!cellData) return;

    // Find word containing this cell, prefer keeping current direction
    const words = getWordsAtCell(row, col);
    if (words.length === 0) return;

    let word = words[0];
    if (state.activeWordId !== null) {
        const currentWord = state.crossword.placed.find(w => w.id === state.activeWordId);
        if (currentWord) {
            const sameDir = words.find(w => w.direction === currentWord.direction);
            if (sameDir) word = sameDir;
        }
    }

    activateWord(word.id);
}

function activateWord(wordId) {
    state.activeWordId = wordId;

    // Clear active classes
    for (const [, cellData] of state.cells) {
        cellData.element.classList.remove('active-word');
    }

    // Clear active clue
    document.querySelectorAll('.cw-clue-item.active').forEach(el => el.classList.remove('active'));

    const word = state.crossword.placed.find(w => w.id === wordId);
    if (!word) return;

    // Highlight word cells
    const wordCells = getWordCells(word);
    for (const key of wordCells) {
        const cellData = state.cells.get(key);
        if (cellData) cellData.element.classList.add('active-word');
    }

    // Highlight clue
    const clueItem = document.querySelector(`.cw-clue-item[data-word-id="${wordId}"]`);
    if (clueItem) {
        clueItem.classList.add('active');
        clueItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
}

function getWordCells(word) {
    const cells = [];
    const dr = word.direction === 'down' ? 1 : 0;
    const dc = word.direction === 'across' ? 1 : 0;
    for (let i = 0; i < word.word.length; i++) {
        cells.push(`${word.row + dr * i},${word.col + dc * i}`);
    }
    return cells;
}

function getWordsAtCell(row, col) {
    return state.crossword.placed.filter(w => {
        const cells = getWordCells(w);
        return cells.includes(`${row},${col}`);
    });
}

function getActiveWord() {
    if (state.activeWordId === null) return null;
    return state.crossword.placed.find(w => w.id === state.activeWordId) || null;
}

function moveFocus(row, col) {
    const key = `${row},${col}`;
    const cellData = state.cells.get(key);
    if (cellData) cellData.input.focus();
}

function moveToNextCell(row, col) {
    const word = getActiveWord();
    if (!word) return;

    const dr = word.direction === 'down' ? 1 : 0;
    const dc = word.direction === 'across' ? 1 : 0;
    moveFocus(row + dr, col + dc);
}

function moveToPrevCell(row, col, word) {
    const dr = word.direction === 'down' ? 1 : 0;
    const dc = word.direction === 'across' ? 1 : 0;
    const prevKey = `${row - dr},${col - dc}`;
    const cellData = state.cells.get(prevKey);
    if (cellData) {
        cellData.input.focus();
        cellData.input.value = '';
    }
}

function focusFirstEmptyCell(word) {
    const cells = getWordCells(word);
    for (const key of cells) {
        const cellData = state.cells.get(key);
        if (cellData && !cellData.input.value) {
            cellData.input.focus();
            return;
        }
    }
    // All filled — focus first cell
    const first = state.cells.get(cells[0]);
    if (first) first.input.focus();
}

function moveToNextWord(reverse) {
    const placed = state.crossword.placed;
    if (placed.length === 0) return;

    const currentIdx = placed.findIndex(w => w.id === state.activeWordId);
    let nextIdx;
    if (reverse) {
        nextIdx = currentIdx <= 0 ? placed.length - 1 : currentIdx - 1;
    } else {
        nextIdx = currentIdx >= placed.length - 1 ? 0 : currentIdx + 1;
    }

    const nextWord = placed[nextIdx];
    activateWord(nextWord.id);
    focusFirstEmptyCell(nextWord);
}

function checkWords(row, col) {
    const words = getWordsAtCell(row, col);

    for (const word of words) {
        if (state.solvedIds.has(word.id)) continue;

        const cells = getWordCells(word);
        let complete = true;
        let userWord = '';

        for (const key of cells) {
            const cellData = state.cells.get(key);
            const val = cellData?.input.value.toUpperCase() || '';
            if (!val) {
                complete = false;
                break;
            }
            userWord += val;
        }

        if (complete && userWord === word.word) {
            state.solvedIds.add(word.id);

            for (const key of cells) {
                const cellData = state.cells.get(key);
                if (cellData) {
                    cellData.element.classList.add('solved');
                    cellData.input.readOnly = true;
                }
            }

            const clueItem = document.querySelector(`.cw-clue-item[data-word-id="${word.id}"]`);
            if (clueItem) clueItem.classList.add('solved');

            updateStats();

            if (state.solvedIds.size === state.crossword.placed.length) {
                showCompletion();
            }
        }
    }
}

function handleCheck() {
    if (!state.crossword) return;

    // Clear previous check highlights
    for (const [, cellData] of state.cells) {
        cellData.element.classList.remove('correct', 'wrong');
    }

    // Check each cell that has input
    for (const [key, cellData] of state.cells) {
        if (cellData.element.classList.contains('solved')) continue;

        const userVal = cellData.input.value.toUpperCase();
        if (!userVal) continue;

        const expected = cellData.cell.letter;
        if (userVal === expected) {
            cellData.element.classList.add('correct');
        } else {
            cellData.element.classList.add('wrong');
        }
    }

    // Check each word: mark solved or show correct answer
    for (const word of state.crossword.placed) {
        if (state.solvedIds.has(word.id)) continue;

        const cells = getWordCells(word);
        let allCorrect = true;

        for (let i = 0; i < cells.length; i++) {
            const cellData = state.cells.get(cells[i]);
            const val = cellData?.input.value.toUpperCase() || '';
            if (val !== word.word[i]) {
                allCorrect = false;
                break;
            }
        }

        const clueItem = document.querySelector(`.cw-clue-item[data-word-id="${word.id}"]`);

        if (allCorrect) {
            state.solvedIds.add(word.id);
            for (const key of cells) {
                const cellData = state.cells.get(key);
                if (cellData) {
                    cellData.element.classList.remove('correct', 'wrong');
                    cellData.element.classList.add('solved');
                    cellData.input.readOnly = true;
                }
            }
            if (clueItem) clueItem.classList.add('solved');
        } else if (clueItem) {
            // Show the correct answer next to the clue
            let answer = clueItem.querySelector('.cw-clue-answer');
            if (!answer) {
                answer = document.createElement('span');
                answer.className = 'cw-clue-answer';
                clueItem.appendChild(answer);
            }
            answer.textContent = ` [${word.word}]`;
        }
    }

    updateStats();

    if (state.solvedIds.size === state.crossword.placed.length) {
        showCompletion();
    }
}

function updateStats() {
    if (!state.crossword) return;
    DOM.wordsPlaced.textContent = state.crossword.placed.length;
    DOM.wordsSolved.textContent = state.solvedIds.size;
}

function showCompletion() {
    const banner = document.createElement('div');
    banner.className = 'cw-complete';
    banner.style.cssText = `
        text-align: center;
        padding: var(--spacing-md);
        color: var(--color-success);
        font-size: var(--font-size-large);
        font-weight: 700;
        margin-top: var(--spacing-sm);
    `;
    banner.textContent = 'Congratulations! Crossword completed!';
    DOM.gameArea.appendChild(banner);
}
