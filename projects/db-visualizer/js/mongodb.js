/* ===== MongoDB Index Modes ===== */

DBIV.mongodb = {};

DBIV.mongodb.modes = [
    { id: 'single', label: 'Single Field', desc: 'B-Tree index on a single document field. Supports equality, range, and sort queries. MongoDB automatically creates an index on _id.' },
    { id: 'compound', label: 'Compound Index', desc: 'Multi-key compound index with prefix rule and sort optimization. Index {a:1, b:1, c:1} supports queries on (a), (a,b), (a,b,c).' },
    { id: 'multikey', label: 'Multikey Index', desc: 'When indexed field contains an array, MongoDB creates separate index entries for each element. One document \u2192 multiple index entries.' },
    { id: 'text', label: 'Text Index', desc: 'Text index with stemming, stop word removal, and TF-IDF scoring. Supports $text queries with $search, $language, $caseSensitive.' },
];

DBIV.mongodb.details = {
    single: {
        principles: [
            'MongoDB uses B-Tree indexes on individual document fields for efficient equality, range, and sort queries',
            'Every collection automatically has a unique index on the _id field — this cannot be dropped',
            'Index entries store the field value and a pointer to the document location on disk (RecordId)',
            'Queries that match the index order can avoid an in-memory sort (index provides natural ordering)',
            'Sparse indexes skip documents where the indexed field is missing, saving space and improving selectivity'
        ],
        concepts: [
            { term: 'RecordId', definition: 'Internal document locator. The index leaf stores field value + RecordId to find the document on disk.' },
            { term: 'Selectivity', definition: 'How many distinct values exist relative to total documents. High selectivity = better index performance.' },
            { term: 'Sparse Index', definition: 'Only indexes documents that contain the indexed field. Useful for optional fields to reduce index size.' },
            { term: 'Index Scan', definition: 'Query reads from the index in order. If the query needs only indexed fields, it becomes a covered query (no document fetch).' },
            { term: 'Collection Scan', definition: 'Full scan of every document when no suitable index exists. Shown as COLLSCAN in explain output.' }
        ]
    },
    compound: {
        principles: [
            'Compound index {a:1, b:1, c:1} supports prefix queries: (a), (a,b), (a,b,c), but NOT (b,c) alone',
            'The ESR rule (Equality, Sort, Range) determines optimal field order in compound indexes',
            'Sort direction in the index matters: {a:1, b:-1} can serve sort({a:1, b:-1}) but NOT sort({a:1, b:1})',
            'A compound index can satisfy queries and sorts simultaneously if field order and directions align',
            'Index intersection (using multiple single-field indexes) is generally slower than a well-designed compound index'
        ],
        concepts: [
            { term: 'Prefix Rule', definition: 'Only the leftmost fields of a compound index can be used. {a,b,c} supports queries on (a), (a,b), (a,b,c).' },
            { term: 'ESR Rule', definition: 'Place Equality fields first, then Sort fields, then Range fields for optimal compound index performance.' },
            { term: 'Sort Direction', definition: 'Index {a:1, b:-1} sorts a ascending, b descending. The index can serve the exact or fully reversed direction.' },
            { term: 'Index Bounds', definition: 'The range of index keys to scan. Tighter bounds = fewer keys examined = faster query.' },
            { term: 'Covered Query', definition: 'Query whose projection only includes indexed fields. MongoDB returns results directly from the index without fetching documents.' }
        ]
    },
    multikey: {
        principles: [
            'When an indexed field contains an array, MongoDB creates separate index entries for each array element',
            'One document with N array elements produces N index entries — the index can be significantly larger than the collection',
            'A compound index can have at most one array field (multikey); two array fields in the same compound index are not allowed',
            'Multikey indexes cannot be used as shard keys and have restrictions on covered queries',
            'MongoDB tracks which fields are multikey in the index metadata to adjust query planning'
        ],
        concepts: [
            { term: 'Array Expansion', definition: 'Each element of the array field gets its own index entry. A document with tags:[a,b,c] creates 3 index entries.' },
            { term: 'Multikey Flag', definition: 'Index metadata marking which fields are multikey. Affects query planner decisions and index bounds calculation.' },
            { term: 'Compound Multikey', definition: 'Compound index where one field is an array. At most one field can be multikey — two array fields is prohibited.' },
            { term: '$elemMatch', definition: 'Query operator for matching array elements. With multikey indexes, ensures conditions are applied to the same array element.' },
            { term: 'Index Size', definition: 'Multikey indexes can grow much larger than the collection due to entry-per-element expansion. Monitor with collStats.' }
        ]
    },
    text: {
        principles: [
            'Text index tokenizes string fields into stems, removes stopwords, and builds an inverted index of terms',
            'Each document gets a relevance score based on term frequency and inverse document frequency (TF-IDF)',
            'A collection can have at most one text index, but it can cover multiple string fields with different weights',
            'Text search supports language-specific stemming (e.g., "running" matches "run") and stopword lists',
            'The $text query operator with $meta: "textScore" returns and sorts results by relevance score'
        ],
        concepts: [
            { term: 'Stemming', definition: 'Reduces words to their root form: "running" -> "run", "better" -> "good". Language-specific rules are applied.' },
            { term: 'Stopwords', definition: 'Common words excluded from indexing (the, and, is). Language-specific lists. Can be customized per index.' },
            { term: 'Term Weight', definition: 'Each field in a compound text index can have a weight (default 1). Higher weight increases that field\'s impact on relevance scoring.' },
            { term: 'Text Score', definition: 'TF-IDF based relevance score. Access via $meta: "textScore" in projection. Higher score = better match.' },
            { term: 'Wildcard Text', definition: '$** text index covers all string fields in the document. Useful for collections with dynamic or unknown schema.' }
        ]
    }
};

DBIV.mongodb._queryCard = function(query, presets) {
    const headerLabel = I18N.t('db.query_card.query', null, 'Query');
    const runLabel = I18N.t('ui.btn.run.query', null, 'Run Query');
    return `
    <div class="query-card" id="query-card">
        <span class="port port-right" id="port-query"></span>
        <div class="query-card-header">
            <span class="query-card-icon">&#x1F343;</span>
            <span class="query-card-name">${headerLabel}</span>
        </div>
        <textarea class="query-input" id="query-input">${query}</textarea>
        <div class="preset-buttons">
            ${presets.map(p => `<button class="preset-btn" data-query="${p.replace(/"/g, '&quot;')}">${p.length > 32 ? p.slice(0, 32) + '...' : p}</button>`).join('')}
        </div>
        <button class="card-send-btn" id="btn-run-query">${runLabel}</button>
    </div>`;
};

DBIV.mongodb._setupQueryCard = DBIV.mysql._setupQueryCard;

DBIV.mongodb._docs = [
    { _id: 1, name: 'Alice', age: 28, city: 'NYC', tags: ['admin', 'user'], bio: 'Senior developer working on cloud systems' },
    { _id: 2, name: 'Bob', age: 35, city: 'LA', tags: ['user'], bio: 'Database administrator and systems architect' },
    { _id: 3, name: 'Carol', age: 22, city: 'NYC', tags: ['user', 'editor'], bio: 'Frontend developer building web applications' },
    { _id: 4, name: 'Dave', age: 31, city: 'SF', tags: ['admin'], bio: 'DevOps engineer managing cloud infrastructure' },
    { _id: 5, name: 'Eve', age: 27, city: 'LA', tags: ['user', 'moderator'], bio: 'Full-stack developer and team lead' },
    { _id: 6, name: 'Frank', age: 42, city: 'NYC', tags: ['admin', 'user', 'owner'], bio: 'CTO with extensive database experience' },
    { _id: 7, name: 'Grace', age: 19, city: 'SF', tags: ['user'], bio: 'Junior developer learning web development' },
    { _id: 8, name: 'Hank', age: 38, city: 'LA', tags: ['editor', 'user'], bio: 'Technical writer and documentation specialist' },
];

/* ---------- 1. Single Field Index ---------- */
DBIV.mongodb.single = {
    init() {
        const presets = [
            'db.users.find({ age: 28 })',
            'db.users.find({ age: { $gt: 30 } })',
            'db.users.find({ age: { $gte: 25, $lte: 35 } })',
            'db.users.find({ name: "Alice" })',
        ];

        document.getElementById('query-col').innerHTML = DBIV.mongodb._queryCard(presets[0], presets);
        DBIV.setIndexName('db.index.mongodb.single', 'B-Tree (age)');

        const tree = DBIV.sampleData.btreeFromField(DBIV.mongodb._docs, 'age');
        DBIV.renderBTree(document.getElementById('index-body'), tree);

        const docsHeader = I18N.t('db.data_page.documents', null, 'Documents');
        let resultsHtml = `<div class="data-page"><div class="data-page-header">${docsHeader}</div>`;
        DBIV.mongodb._docs.forEach(doc => {
            resultsHtml += `<div class="data-row" id="mdoc-${doc._id}">`;
            resultsHtml += `<span class="data-row-id">${doc._id}</span>`;
            resultsHtml += `<span class="data-row-value">${doc.name}, age:${doc.age}, ${doc.city}</span>`;
            resultsHtml += '</div>';
        });
        resultsHtml += '</div>';
        document.getElementById('results-col').innerHTML = resultsHtml;

        document.getElementById('extra-panels').innerHTML = '';
        DBIV.mongodb._setupQueryCard(() => this.run());
    },

    async run() {
        const query = document.getElementById('query-input').value;
        const qid = DBIV.nextQueryId();
        DBIV.log('QUERY', `Q${qid}: ${query}`);

        const isMiss = DBIV.state.simulateError;
        if (isMiss) DBIV.state.simulateError = false;

        DBIV.setIndexStatus('scanning');

        const eqMatch = query.match(/age:\s*(\d+)/);
        const gtMatch = query.match(/\$gt:\s*(\d+)/);
        const gteMatch = query.match(/\$gte:\s*(\d+)/);
        const lteMatch = query.match(/\$lte:\s*(\d+)/);
        const nameMatch = query.match(/name:\s*"([^"]+)"/);

        if (isMiss) {
            DBIV.log('MISS', `Q${qid}: Index not used - collection scan`);
            const rows = document.querySelectorAll('.data-row');
            await DBIV.animateFullScan(Array.from(rows));
            let results = DBIV.mongodb._docs;
            if (eqMatch) results = results.filter(d => d.age === parseInt(eqMatch[1]));
            else if (gteMatch && lteMatch) results = results.filter(d => d.age >= parseInt(gteMatch[1]) && d.age <= parseInt(lteMatch[1]));
            else if (gtMatch) results = results.filter(d => d.age > parseInt(gtMatch[1]));
            else if (nameMatch) results = results.filter(d => d.name === nameMatch[1]);
            results.forEach(d => {
                const row = document.getElementById('mdoc-' + d._id);
                if (row) { row.classList.add('matched'); setTimeout(() => row.classList.remove('matched'), 1500); }
            });
            DBIV.addStats(2, rows.length, 0, 15);
            const docUnit = DBIV.getUnitLabel('documents', results.length);
            DBIV.logMessage('RESULT', 'db.log.mongodb.collscan', { qid: qid, count: results.length, unit: docUnit }, `Q${qid}: ${results.length} doc(s) via COLLSCAN`);
            if (DBIV.state.comparisonMode) {
                DBIV.showComparison(
                    { pages: 2, rows: rows.length, time: 15 },
                    { pages: 2, rows: rows.length, time: 15 }
                );
            }
        } else if (nameMatch) {
            DBIV.log('MISS', `Q${qid}: No index on "name" - collection scan`);
            const rows = document.querySelectorAll('.data-row');
            await DBIV.animateFullScan(Array.from(rows));
            const matched = DBIV.mongodb._docs.filter(d => d.name === nameMatch[1]);
            matched.forEach(d => {
                const row = document.getElementById('mdoc-' + d._id);
                if (row) { row.classList.add('matched'); setTimeout(() => row.classList.remove('matched'), 1500); }
            });
            DBIV.addStats(2, rows.length, 0, 15);
            const docUnitMatch = DBIV.getUnitLabel('documents', matched.length);
            DBIV.logMessage('RESULT', 'db.log.mongodb.collscan', { qid: qid, count: matched.length, unit: docUnitMatch }, `Q${qid}: ${matched.length} doc(s) via COLLSCAN`);

            if (DBIV.state.comparisonMode) {
                DBIV.showComparison(
                    { pages: 2, rows: rows.length, time: 15 },
                    { pages: 2, rows: rows.length, time: 15 }
                );
            }
        } else {
            const treeNodes = document.querySelectorAll('.tree-node');
            const searchAge = eqMatch ? parseInt(eqMatch[1]) : (gteMatch ? parseInt(gteMatch[1]) : (gtMatch ? parseInt(gtMatch[1]) + 1 : 1));
            const path = DBIV.findPathInTree(searchAge, treeNodes);

            await DBIV.animateTreeTraversal(path);
            DBIV.log('LOOKUP', `Q${qid}: B-Tree traversal: ${path.length} nodes`);

            let results;
            if (eqMatch) {
                const age = parseInt(eqMatch[1]);
                results = DBIV.mongodb._docs.filter(d => d.age === age);
            } else if (gteMatch && lteMatch) {
                const lo = parseInt(gteMatch[1]), hi = parseInt(lteMatch[1]);
                results = DBIV.mongodb._docs.filter(d => d.age >= lo && d.age <= hi);
            } else if (gtMatch) {
                const gt = parseInt(gtMatch[1]);
                results = DBIV.mongodb._docs.filter(d => d.age > gt);
            } else {
                results = [];
            }

            results.forEach(d => {
                const row = document.getElementById('mdoc-' + d._id);
                if (row) { row.classList.add('matched'); setTimeout(() => row.classList.remove('matched'), 1500); }
            });

            DBIV.addStats(1 + path.length, results.length, path.length, 2);
            const docUnitIx = DBIV.getUnitLabel('documents', results.length);
            DBIV.logMessage('RESULT', 'db.log.mongodb.ixscan', { qid: qid, count: results.length, unit: docUnitIx }, `Q${qid}: ${results.length} doc(s) via IXSCAN`);

            if (DBIV.state.comparisonMode) {
                DBIV.showComparison(
                    { pages: 1 + path.length, rows: results.length, time: 2 },
                    { pages: 2, rows: DBIV.mongodb._docs.length, time: 15 }
                );
            }
        }

        DBIV.setIndexStatus('ready');
    }
};

/* ---------- 2. Compound Index ---------- */
DBIV.mongodb.compound = {
    init() {
        const presets = [
            'db.users.find({ city: "NYC" })',
            'db.users.find({ city: "NYC", age: 28 })',
            'db.users.find({ age: 28 })',
            'db.users.find({ city: "LA" }).sort({ age: 1 })',
        ];

        document.getElementById('query-col').innerHTML = DBIV.mongodb._queryCard(presets[0], presets);
        DBIV.setIndexName('db.index.mongodb.compound', 'Compound (city, age)');

        const sorted = [...DBIV.mongodb._docs].sort((a, b) => a.city.localeCompare(b.city) || a.age - b.age);
        const tree = {
            levels: [
                [{ keys: ['NYC', 'SF'], pointers: true }],
                [
                    { keys: sorted.filter(d => d.city === 'LA').map(d => String(d.age)) },
                    { keys: sorted.filter(d => d.city === 'NYC').map(d => String(d.age)) },
                    { keys: sorted.filter(d => d.city === 'SF').map(d => String(d.age)) },
                ]
            ]
        };
        DBIV.renderBTree(document.getElementById('index-body'), tree);

        const docsHeader = I18N.t('db.data_page.documents', null, 'Documents');
        let resultsHtml = `<div class="data-page"><div class="data-page-header">${docsHeader}</div>`;
        sorted.forEach(doc => {
            resultsHtml += `<div class="data-row" id="cdoc-${doc._id}">`;
            resultsHtml += `<span class="data-row-id">${doc._id}</span>`;
            resultsHtml += `<span class="data-row-value">${doc.city}, age:${doc.age}, ${doc.name}</span>`;
            resultsHtml += '</div>';
        });
        resultsHtml += '</div>';
        document.getElementById('results-col').innerHTML = resultsHtml;

        const compoundTitle = I18N.t('db.mongodb.compound.panel.title', null, 'Prefix Rule:');
        const compoundDesc = I18N.t('db.mongodb.compound.panel.desc', null,
            'Index {city:1, age:1} supports: <span style="color:#6fcf97">{city}</span>, <span style="color:#6fcf97">{city, age}</span>, <span style="color:#6fcf97">{city}.sort({age})</span>. <span style="color:#f38ba8">NOT {age} alone</span>.');
        document.getElementById('extra-panels').innerHTML = `
        <div style="padding:8px 12px;background:var(--dbiv-card-bg);border:1px solid var(--dbiv-border);border-radius:6px;font-size:12px;color:var(--dbiv-text-light);">
            <strong style="color:var(--dbiv-text)">${compoundTitle}</strong>
            ${compoundDesc}
        </div>`;

        DBIV.mongodb._setupQueryCard(() => this.run());
    },

    async run() {
        const query = document.getElementById('query-input').value;
        const qid = DBIV.nextQueryId();
        const isMiss = DBIV.state.simulateError;
        if (isMiss) DBIV.state.simulateError = false;
        DBIV.log('QUERY', `Q${qid}: ${query}`);

        const cityMatch = query.match(/city:\s*"([^"]+)"/);
        const ageMatch = query.match(/age:\s*(\d+)/);
        const sortMatch = query.match(/sort\(\s*\{\s*age:\s*1\s*\}/);

        DBIV.setIndexStatus('scanning');

        if (isMiss) {
            DBIV.log('MISS', `Q${qid}: Index not used - collection scan`);
            DBIV.flashCard(document.getElementById('query-card'), 'red');
            const rows = document.querySelectorAll('.data-row');
            await DBIV.animateFullScan(Array.from(rows));
            DBIV.addStats(2, rows.length, 0, 18);
            if (DBIV.state.comparisonMode) {
                DBIV.showComparison(
                    { pages: 2, rows: rows.length, time: 18 },
                    { pages: 2, rows: rows.length, time: 18 }
                );
            }
        } else if (!cityMatch && ageMatch) {
            DBIV.log('MISS', `Q${qid}: Cannot use compound index - prefix field "city" missing`);
            DBIV.flashCard(document.getElementById('query-card'), 'red');
            const rows = document.querySelectorAll('.data-row');
            await DBIV.animateFullScan(Array.from(rows));
            DBIV.addStats(2, rows.length, 0, 18);

            if (DBIV.state.comparisonMode) {
                DBIV.showComparison(
                    { pages: 2, rows: rows.length, time: 18 },
                    { pages: 2, rows: rows.length, time: 18 }
                );
            }
        } else {
            const treeNodes = document.querySelectorAll('.tree-node');
            const path = [treeNodes[0]];
            if (cityMatch) {
                const cityChildMap = { 'LA': 0, 'NYC': 1, 'SF': 2 };
                const idx = cityChildMap[cityMatch[1]];
                if (idx !== undefined && treeNodes[idx + 1]) path.push(treeNodes[idx + 1]);

                const rootKeys = treeNodes[0].querySelectorAll('.tree-key');
                rootKeys.forEach(k => {
                    if (k.dataset.key === cityMatch[1]) k.classList.add('active');
                    else k.classList.add('compared');
                    setTimeout(() => { k.classList.remove('active', 'compared'); }, 1200);
                });
            }

            await DBIV.animateTreeTraversal(path);

            let results = DBIV.mongodb._docs;
            if (cityMatch) results = results.filter(d => d.city === cityMatch[1]);
            if (ageMatch) results = results.filter(d => d.age === parseInt(ageMatch[1]));
            if (sortMatch && cityMatch) {
                DBIV.log('INDEX', `Q${qid}: Sort covered by index (no in-memory sort)`);
            }

            results.forEach(d => {
                const row = document.getElementById('cdoc-' + d._id);
                if (row) { row.classList.add('matched'); setTimeout(() => row.classList.remove('matched'), 1500); }
            });

            DBIV.addStats(1 + path.length, results.length, path.length, 2);
            const docUnitIx2 = DBIV.getUnitLabel('documents', results.length);
            DBIV.logMessage('RESULT', 'db.log.mongodb.ixscan', { qid: qid, count: results.length, unit: docUnitIx2 }, `Q${qid}: ${results.length} doc(s) via IXSCAN`);

            if (DBIV.state.comparisonMode) {
                DBIV.showComparison(
                    { pages: 1 + path.length, rows: results.length, time: 2 },
                    { pages: 2, rows: DBIV.mongodb._docs.length, time: 18 }
                );
            }
        }

        DBIV.setIndexStatus('ready');
    }
};

/* ---------- 3. Multikey Index ---------- */
DBIV.mongodb.multikey = {
    init() {
        const presets = [
            'db.users.find({ tags: "admin" })',
            'db.users.find({ tags: "user" })',
            'db.users.find({ tags: { $all: ["admin", "user"] } })',
            'db.users.find({ tags: "editor" })',
        ];

        document.getElementById('query-col').innerHTML = DBIV.mongodb._queryCard(presets[0], presets);
        DBIV.setIndexName('db.index.mongodb.multikey', 'Multikey (tags)');

        const invertedIndex = {};
        DBIV.mongodb._docs.forEach(doc => {
            doc.tags.forEach(tag => {
                if (!invertedIndex[tag]) invertedIndex[tag] = [];
                invertedIndex[tag].push(doc._id);
            });
        });

        let bodyHtml = '<div class="gin-container">';
        bodyHtml += '<div style="font-size:10px;color:var(--dbiv-text-light);margin-bottom:6px;">One doc with array \u2192 multiple index entries</div>';
        Object.keys(invertedIndex).sort().forEach(tag => {
            bodyHtml += `<div class="gin-entry" id="mk-${tag}" data-token="${tag}">`;
            bodyHtml += `<span class="gin-token">"${tag}"</span>`;
            bodyHtml += '<div class="gin-posting-list">';
            invertedIndex[tag].forEach(id => {
                bodyHtml += `<span class="gin-doc-ref" data-docid="${id}">_id:${id}</span>`;
            });
            bodyHtml += '</div></div>';
        });
        bodyHtml += '</div>';
        document.getElementById('index-body').innerHTML = bodyHtml;
        this._index = invertedIndex;

        const docsHeader = I18N.t('db.data_page.documents', null, 'Documents');
        let resultsHtml = `<div class="data-page"><div class="data-page-header">${docsHeader}</div>`;
        DBIV.mongodb._docs.forEach(doc => {
            resultsHtml += `<div class="data-row" id="mkdoc-${doc._id}">`;
            resultsHtml += `<span class="data-row-id">${doc._id}</span>`;
            resultsHtml += `<span class="data-row-value">${doc.name} [${doc.tags.join(',')}]</span>`;
            resultsHtml += '</div>';
        });
        resultsHtml += '</div>';
        document.getElementById('results-col').innerHTML = resultsHtml;

        document.getElementById('extra-panels').innerHTML = '';
        DBIV.mongodb._setupQueryCard(() => this.run());
    },

    async run() {
        const query = document.getElementById('query-input').value;
        const qid = DBIV.nextQueryId();
        DBIV.log('QUERY', `Q${qid}: ${query}`);

        const isMiss = DBIV.state.simulateError;
        if (isMiss) DBIV.state.simulateError = false;

        const singleMatch = query.match(/tags:\s*"([^"]+)"/);
        const allMatch = query.match(/\$all:\s*\[([^\]]+)\]/);

        DBIV.setIndexStatus('scanning');

        if (isMiss) {
            DBIV.log('MISS', `Q${qid}: Index not used - collection scan`);
            const allRows = [];
            DBIV.mongodb._docs.forEach(doc => {
                const row = document.getElementById('mkdoc-' + doc._id);
                if (row) allRows.push(row);
            });
            await DBIV.animateFullScan(allRows);
            let searchTags = [];
            if (allMatch) searchTags = allMatch[1].match(/"([^"]+)"/g).map(s => s.replace(/"/g, ''));
            else if (singleMatch) searchTags = [singleMatch[1]];
            const results = DBIV.mongodb._docs.filter(d =>
                searchTags.every(tag => d.tags.includes(tag))
            );
            results.forEach(d => {
                const row = document.getElementById('mkdoc-' + d._id);
                if (row) { row.classList.add('matched'); setTimeout(() => row.classList.remove('matched'), 1500); }
            });
            DBIV.addStats(2, DBIV.mongodb._docs.length, 0, DBIV.mongodb._docs.length * 2);
            const docUnitColl = DBIV.getUnitLabel('documents', results.length);
            DBIV.logMessage('RESULT', 'db.log.mongodb.collscan', { qid: qid, count: results.length, unit: docUnitColl }, `Q${qid}: ${results.length} doc(s) via COLLSCAN`);
            if (DBIV.state.comparisonMode) {
                DBIV.showComparison(
                    { pages: 2, rows: DBIV.mongodb._docs.length, time: DBIV.mongodb._docs.length * 2 },
                    { pages: 2, rows: DBIV.mongodb._docs.length, time: DBIV.mongodb._docs.length * 2 }
                );
            }
            DBIV.setIndexStatus('ready');
            return;
        }

        let searchTags = [];
        if (allMatch) {
            searchTags = allMatch[1].match(/"([^"]+)"/g).map(s => s.replace(/"/g, ''));
        } else if (singleMatch) {
            searchTags = [singleMatch[1]];
        }

        let resultIds = null;
        for (const tag of searchTags) {
            const entry = document.getElementById('mk-' + tag);
            if (entry) {
                entry.classList.add('matched');
                entry.querySelectorAll('.gin-doc-ref').forEach(r => r.classList.add('matched'));
                DBIV.log('LOOKUP', `Q${qid}: Multikey entry "${tag}" \u2192 [${(this._index[tag] || []).join(', ')}]`);
                await DBIV.sleep(400);

                const ids = new Set(this._index[tag] || []);
                if (resultIds === null) resultIds = ids;
                else resultIds = new Set([...resultIds].filter(id => ids.has(id)));
            } else {
                DBIV.log('LOOKUP', `Q${qid}: Multikey entry "${tag}" not found`);
                resultIds = new Set();
            }
        }

        const finalIds = resultIds || new Set();
        finalIds.forEach(id => {
            const row = document.getElementById('mkdoc-' + id);
            if (row) { row.classList.add('matched'); setTimeout(() => row.classList.remove('matched'), 1500); }
        });

        DBIV.addStats(searchTags.length, finalIds.size, searchTags.length, 2);
        const docUnitMatched = DBIV.getUnitLabel('documents', finalIds.size);
        DBIV.logMessage('RESULT', 'db.log.docs.matched', { qid: qid, count: finalIds.size, unit: docUnitMatched }, `Q${qid}: ${finalIds.size} doc(s) matched`);

        if (DBIV.state.comparisonMode) {
            DBIV.showComparison(
                { pages: searchTags.length, rows: finalIds.size, time: 2 },
                { pages: 2, rows: DBIV.mongodb._docs.length, time: DBIV.mongodb._docs.length * 2 }
            );
        }

        setTimeout(() => {
            document.querySelectorAll('.gin-entry').forEach(e => e.classList.remove('matched'));
            document.querySelectorAll('.gin-doc-ref').forEach(e => e.classList.remove('matched'));
        }, 2000);

        DBIV.setIndexStatus('ready');
    }
};

/* ---------- 4. Text Index ---------- */
DBIV.mongodb.text = {
    init() {
        const stopWords = ['and', 'the', 'for', 'a', 'an', 'on', 'with'];
        const invertedIndex = {};

        DBIV.mongodb._docs.forEach(doc => {
            const tokens = doc.bio.toLowerCase().split(/\s+/)
                .map(t => t.replace(/[^a-z]/g, ''))
                .filter(t => t.length > 2 && !stopWords.includes(t));

            const uniqueTokens = [...new Set(tokens)];
            uniqueTokens.forEach(token => {
                if (!invertedIndex[token]) invertedIndex[token] = [];
                const tf = tokens.filter(t => t === token).length / tokens.length;
                invertedIndex[token].push({ id: doc._id, tf: Math.round(tf * 100) / 100 });
            });
        });
        this._index = invertedIndex;

        const presets = [
            'db.users.find({ $text: { $search: "developer" } })',
            'db.users.find({ $text: { $search: "cloud database" } })',
            'db.users.find({ $text: { $search: "web" } })',
            'db.users.find({ $text: { $search: "team lead" } })',
        ];

        document.getElementById('query-col').innerHTML = DBIV.mongodb._queryCard(presets[0], presets);
        DBIV.setIndexName('db.index.mongodb.text', 'Text Index (bio)');

        let bodyHtml = '<div class="gin-container">';
        const sortedTokens = Object.keys(invertedIndex).sort().slice(0, 14);
        sortedTokens.forEach(token => {
            bodyHtml += `<div class="gin-entry" id="txt-${token}" data-token="${token}">`;
            bodyHtml += `<span class="gin-token">${token}</span>`;
            bodyHtml += '<div class="gin-posting-list">';
            invertedIndex[token].forEach(entry => {
                bodyHtml += `<span class="gin-doc-ref" data-docid="${entry.id}">_id:${entry.id} (tf:${entry.tf})</span>`;
            });
            bodyHtml += '</div></div>';
        });
        bodyHtml += '</div>';
        document.getElementById('index-body').innerHTML = bodyHtml;

        const docsHeader = I18N.t('db.data_page.documents', null, 'Documents');
        let resultsHtml = `<div class="data-page"><div class="data-page-header">${docsHeader}</div>`;
        DBIV.mongodb._docs.forEach(doc => {
            resultsHtml += `<div class="data-row" id="txtdoc-${doc._id}">`;
            resultsHtml += `<span class="data-row-id">${doc._id}</span>`;
            resultsHtml += `<span class="data-row-value">${doc.bio.slice(0, 35)}...</span>`;
            resultsHtml += '</div>';
        });
        resultsHtml += '</div>';
        document.getElementById('results-col').innerHTML = resultsHtml;

        document.getElementById('extra-panels').innerHTML = '';
        DBIV.mongodb._setupQueryCard(() => this.run());
    },

    async run() {
        const query = document.getElementById('query-input').value;
        const qid = DBIV.nextQueryId();
        DBIV.log('QUERY', `Q${qid}: ${query}`);

        const searchMatch = query.match(/\$search:\s*"([^"]+)"/);
        if (!searchMatch) {
            DBIV.log('MISS', `Q${qid}: Invalid $text.$search syntax`);
            return;
        }

        const isMiss = DBIV.state.simulateError;
        if (isMiss) DBIV.state.simulateError = false;

        const terms = searchMatch[1].toLowerCase().split(/\s+/).filter(t => t.length > 1);

        DBIV.setIndexStatus('scanning');

        if (isMiss) {
            DBIV.log('MISS', `Q${qid}: Text index not used - collection scan`);
            DBIV.flashCard(document.getElementById('query-card'), 'red');
            const allRows = [];
            DBIV.mongodb._docs.forEach(doc => {
                const row = document.getElementById('txtdoc-' + doc._id);
                if (row) allRows.push(row);
            });
            await DBIV.animateFullScan(allRows);
            const matched = DBIV.mongodb._docs.filter(doc =>
                terms.some(term => doc.bio.toLowerCase().includes(term))
            );
            matched.forEach(doc => {
                const row = document.getElementById('txtdoc-' + doc._id);
                if (row) { row.classList.add('matched'); setTimeout(() => row.classList.remove('matched'), 1500); }
            });
            DBIV.addStats(2, DBIV.mongodb._docs.length, 0, DBIV.mongodb._docs.length * 2);
            const docUnitTextScan = DBIV.getUnitLabel('documents', matched.length);
            DBIV.logMessage('RESULT', 'db.log.mongodb.collscan', { qid: qid, count: matched.length, unit: docUnitTextScan }, `Q${qid}: ${matched.length} doc(s) via COLLSCAN`);
            if (DBIV.state.comparisonMode) {
                DBIV.showComparison(
                    { pages: 2, rows: DBIV.mongodb._docs.length, time: DBIV.mongodb._docs.length * 2 },
                    { pages: 2, rows: DBIV.mongodb._docs.length, time: DBIV.mongodb._docs.length * 2 }
                );
            }
            DBIV.setIndexStatus('ready');
            return;
        }

        const scores = {};
        for (const term of terms) {
            const entry = document.getElementById('txt-' + term);
            if (entry && this._index[term]) {
                entry.classList.add('matched');
                entry.querySelectorAll('.gin-doc-ref').forEach(r => r.classList.add('matched'));

                const idf = Math.log(DBIV.mongodb._docs.length / this._index[term].length);
                this._index[term].forEach(e => {
                    scores[e.id] = (scores[e.id] || 0) + e.tf * idf;
                });

                const docUnitLookup = DBIV.getUnitLabel('documents', this._index[term].length);
                DBIV.log('LOOKUP', `Q${qid}: "${term}" \u2192 ${this._index[term].length} ${docUnitLookup}, IDF=${idf.toFixed(2)}`);
                await DBIV.sleep(400);
            } else {
                DBIV.log('LOOKUP', `Q${qid}: "${term}" not in text index`);
            }
        }

        const sortedResults = Object.entries(scores).sort((a, b) => b[1] - a[1]);
        sortedResults.forEach(([id]) => {
            const row = document.getElementById('txtdoc-' + id);
            if (row) { row.classList.add('matched'); setTimeout(() => row.classList.remove('matched'), 2000); }
        });

        DBIV.addStats(terms.length, sortedResults.length, terms.length, 3);
        const docUnitRanked = DBIV.getUnitLabel('documents', sortedResults.length);
        DBIV.logMessage('RESULT', 'db.log.mongodb.text_ranked', { qid: qid, count: sortedResults.length, unit: docUnitRanked }, `Q${qid}: ${sortedResults.length} doc(s) matched, ranked by TF-IDF score`);

        if (DBIV.state.comparisonMode) {
            DBIV.showComparison(
                { pages: terms.length, rows: sortedResults.length, time: 3 },
                { pages: 2, rows: DBIV.mongodb._docs.length, time: DBIV.mongodb._docs.length * 2 }
            );
        }

        setTimeout(() => {
            document.querySelectorAll('.gin-entry').forEach(e => e.classList.remove('matched'));
            document.querySelectorAll('.gin-doc-ref').forEach(e => e.classList.remove('matched'));
        }, 2000);

        DBIV.setIndexStatus('ready');
    }
};
