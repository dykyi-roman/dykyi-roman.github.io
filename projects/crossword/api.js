// API adapter layer for fetching words with definitions (Datamuse only)

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
}

/**
 * Fetch words with definitions from Datamuse API.
 * @param {number} count - Number of words to fetch
 * @returns {Promise<Array<{word: string, definition: string}>>}
 */
export async function fetchWordsWithDefinitions(count) {
    const lengths = [4, 5, 6, 7, 8];
    const perLength = Math.ceil(count * 3 / lengths.length);

    const requests = lengths.map(len => {
        const pattern = encodeURIComponent('?'.repeat(len));
        const url = `https://api.datamuse.com/words?sp=${pattern}&md=df&max=${perLength}`;
        return fetch(url)
            .then(r => {
                if (!r.ok) throw new Error(`Datamuse: ${r.status}`);
                return r.json();
            })
            .catch(() => []);
    });

    const results = await Promise.all(requests);
    const words = [];

    for (const batch of results) {
        for (const item of batch) {
            if (!item.defs || item.defs.length === 0) continue;
            const word = item.word.toUpperCase();
            if (!/^[A-Z]+$/.test(word)) continue;
            const rawDef = item.defs[0];
            const defText = rawDef.includes('\t') ? rawDef.split('\t')[1] : rawDef;
            const definition = defText.trim();
            if (!definition) continue;
            words.push({ word, definition });
        }
    }

    shuffle(words);
    return words.slice(0, count);
}
