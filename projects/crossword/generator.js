// Crossword placement algorithm

/**
 * @typedef {Object} PlacedWord
 * @property {number} id
 * @property {string} word
 * @property {string} definition
 * @property {number} row
 * @property {number} col
 * @property {'across'|'down'} direction
 * @property {number} number - Display number for clues
 */

/**
 * Generate a dense crossword from word entries.
 * @param {Array<{word: string, definition: string}>} wordEntries
 * @returns {{grid: Map<string, {letter: string, wordIds: Set<number>, number: number|null}>, placed: PlacedWord[], rows: number, cols: number}}
 */
export function generateCrossword(wordEntries) {
    const sorted = [...wordEntries].sort((a, b) => b.word.length - a.word.length);

    const grid = new Map();
    const placed = [];
    let nextId = 0;

    function key(r, c) {
        return `${r},${c}`;
    }

    function getCell(r, c) {
        return grid.get(key(r, c)) || null;
    }

    function setCell(r, c, letter, wordId) {
        const k = key(r, c);
        const existing = grid.get(k);
        if (existing) {
            existing.wordIds.add(wordId);
        } else {
            grid.set(k, { letter, wordIds: new Set([wordId]), number: null });
        }
    }

    function canPlace(word, row, col, direction) {
        const dr = direction === 'down' ? 1 : 0;
        const dc = direction === 'across' ? 1 : 0;
        let intersections = 0;

        // Check cell before the word is empty
        const beforeR = row - dr;
        const beforeC = col - dc;
        if (getCell(beforeR, beforeC)) return -1;

        // Check cell after the word is empty
        const afterR = row + dr * word.length;
        const afterC = col + dc * word.length;
        if (getCell(afterR, afterC)) return -1;

        for (let i = 0; i < word.length; i++) {
            const r = row + dr * i;
            const c = col + dc * i;
            const cell = getCell(r, c);

            if (cell) {
                if (cell.letter !== word[i]) return -1;
                intersections++;
            } else {
                // Check parallel adjacency (sides of the word)
                const sideA = direction === 'across'
                    ? getCell(r - 1, c)
                    : getCell(r, c - 1);
                const sideB = direction === 'across'
                    ? getCell(r + 1, c)
                    : getCell(r, c + 1);
                if (sideA || sideB) return -1;
            }
        }

        return intersections;
    }

    function placeWord(entry, row, col, direction) {
        const id = nextId++;
        const dr = direction === 'down' ? 1 : 0;
        const dc = direction === 'across' ? 1 : 0;

        for (let i = 0; i < entry.word.length; i++) {
            setCell(row + dr * i, col + dc * i, entry.word[i], id);
        }

        placed.push({
            id,
            word: entry.word,
            definition: entry.definition,
            row,
            col,
            direction,
            number: 0
        });
    }

    // Place first word horizontally at origin
    if (sorted.length > 0) {
        placeWord(sorted[0], 0, 0, 'across');
    }

    // Place remaining words
    for (let wi = 1; wi < sorted.length; wi++) {
        const entry = sorted[wi];
        let bestScore = 0;
        let bestPlacement = null;

        // Try to intersect with each placed word
        for (const pw of placed) {
            const pdr = pw.direction === 'down' ? 1 : 0;
            const pdc = pw.direction === 'across' ? 1 : 0;
            const newDir = pw.direction === 'across' ? 'down' : 'across';

            for (let pi = 0; pi < pw.word.length; pi++) {
                const placedLetter = pw.word[pi];
                for (let ni = 0; ni < entry.word.length; ni++) {
                    if (entry.word[ni] !== placedLetter) continue;

                    const intersectR = pw.row + pdr * pi;
                    const intersectC = pw.col + pdc * pi;

                    let startR, startC;
                    if (newDir === 'down') {
                        startR = intersectR - ni;
                        startC = intersectC;
                    } else {
                        startR = intersectR;
                        startC = intersectC - ni;
                    }

                    const score = canPlace(entry.word, startR, startC, newDir);
                    if (score > bestScore) {
                        bestScore = score;
                        bestPlacement = { row: startR, col: startC, direction: newDir };
                    }
                }
            }
        }

        if (bestPlacement) {
            placeWord(entry, bestPlacement.row, bestPlacement.col, bestPlacement.direction);
        }
    }

    // Normalize grid coordinates to start at (0,0)
    let minRow = Infinity, minCol = Infinity;
    let maxRow = -Infinity, maxCol = -Infinity;

    for (const k of grid.keys()) {
        const [r, c] = k.split(',').map(Number);
        minRow = Math.min(minRow, r);
        minCol = Math.min(minCol, c);
        maxRow = Math.max(maxRow, r);
        maxCol = Math.max(maxCol, c);
    }

    if (minRow !== 0 || minCol !== 0) {
        const newGrid = new Map();
        for (const [k, v] of grid.entries()) {
            const [r, c] = k.split(',').map(Number);
            newGrid.set(`${r - minRow},${c - minCol}`, v);
        }
        grid.clear();
        for (const [k, v] of newGrid.entries()) {
            grid.set(k, v);
        }

        for (const pw of placed) {
            pw.row -= minRow;
            pw.col -= minCol;
        }

        maxRow -= minRow;
        maxCol -= minCol;
    }

    // Assign sequential numbers (top→bottom, left→right)
    const numberPositions = new Map();
    for (const pw of placed) {
        const k = key(pw.row, pw.col);
        if (!numberPositions.has(k)) {
            numberPositions.set(k, { row: pw.row, col: pw.col });
        }
    }

    const sortedPositions = [...numberPositions.entries()]
        .sort(([, a], [, b]) => a.row !== b.row ? a.row - b.row : a.col - b.col);

    let num = 1;
    const posToNumber = new Map();
    for (const [k] of sortedPositions) {
        posToNumber.set(k, num);
        const cell = grid.get(k);
        if (cell) cell.number = num;
        num++;
    }

    for (const pw of placed) {
        const k = key(pw.row, pw.col);
        pw.number = posToNumber.get(k) || 0;
    }

    return {
        grid,
        placed,
        rows: maxRow + 1,
        cols: maxCol + 1
    };
}
