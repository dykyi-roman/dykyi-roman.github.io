/* ===== PostgreSQL Index Modes ===== */

DBIV.postgresql = {};

DBIV.postgresql.modes = [
    { id: 'btree', label: 'B-Tree', desc: 'PostgreSQL B-Tree with MVCC visibility. Each tuple has xmin/xmax transaction IDs. Dead tuples from old transactions remain until VACUUM.' },
    { id: 'hash', label: 'Hash Index', desc: 'PostgreSQL Hash Index uses a 4-page structure: meta page, bucket pages, overflow pages, bitmap pages. O(1) lookup for equality only.' },
    { id: 'gin', label: 'GIN Index', desc: 'Generalized Inverted Index for JSONB, arrays, and full-text search. Maps each key/element to a posting list of heap TIDs.' },
    { id: 'gist', label: 'GiST Index', desc: 'Generalized Search Tree for geometric and range data. Uses bounding boxes in a tree structure. Supports contains, overlaps, nearest-neighbor.' },
    { id: 'brin', label: 'BRIN Index', desc: 'Block Range Index stores min/max per block range. Extremely small index, best for naturally ordered (correlated) data like timestamps.' },
];

DBIV.postgresql._queryCard = DBIV.mysql._queryCard;
DBIV.postgresql._setupQueryCard = DBIV.mysql._setupQueryCard;

/* ---------- 1. B-Tree with MVCC ---------- */
DBIV.postgresql.btree = {
    tuples: [],

    init() {
        this.tuples = DBIV.sampleData.users.map((u, i) => ({
            ...u,
            xmin: 100 + i,
            xmax: (i % 4 === 0 && i > 0) ? 110 + i : null,
            dead: i % 4 === 0 && i > 0,
        }));

        const presets = [
            'SELECT * FROM users WHERE id = 5',
            'SELECT * FROM users WHERE id = 9',
            'SELECT * FROM users WHERE id BETWEEN 3 AND 7',
        ];

        document.getElementById('query-col').innerHTML = DBIV.postgresql._queryCard(presets[0], presets);
        document.getElementById('index-name').textContent = 'B-Tree + MVCC';

        const tree = DBIV.sampleData.btreeFromField(this.tuples, 'id');
        DBIV.renderBTree(document.getElementById('index-body'), tree);

        let resultsHtml = '<div class="data-page"><div class="data-page-header">Heap Tuples</div>';
        this.tuples.forEach(t => {
            const deadClass = t.dead ? 'style="opacity:0.4;text-decoration:line-through;"' : '';
            resultsHtml += `<div class="data-row" id="pgtuple-${t.id}" ${deadClass}>`;
            resultsHtml += `<span class="data-row-id">${t.id}</span>`;
            resultsHtml += `<span class="data-row-value">${t.name} <span style="font-size:9px;color:var(--dbiv-text-light)">xmin:${t.xmin}${t.xmax ? ' xmax:' + t.xmax : ''}</span></span>`;
            resultsHtml += '</div>';
        });
        resultsHtml += '</div>';

        resultsHtml += `<div class="result-card" style="margin-top:6px;">
            <div class="result-card-header">MVCC Info</div>
            <div style="font-size:10px;font-family:monospace;color:var(--dbiv-text-light);">
                <div>Current TxID: <span style="color:var(--dbiv-accent)" id="pg-txid">150</span></div>
                <div>Dead tuples: <span style="color:#f38ba8">${this.tuples.filter(t => t.dead).length}</span></div>
                <div style="margin-top:4px;font-size:9px;">Crossed-out rows = dead tuples (need VACUUM)</div>
            </div>
        </div>`;
        document.getElementById('results-col').innerHTML = resultsHtml;

        document.getElementById('extra-panels').innerHTML = '';
        DBIV.postgresql._setupQueryCard(() => this.run());
    },

    async run() {
        const query = document.getElementById('query-input').value;
        const qid = DBIV.nextQueryId();
        DBIV.log('QUERY', `Q${qid}: ${query}`);

        const match = query.match(/WHERE\s+id\s*=\s*(\d+)/i);
        const rangeMatch = query.match(/WHERE\s+id\s+BETWEEN\s+(\d+)\s+AND\s+(\d+)/i);
        const targetId = match ? parseInt(match[1]) : null;

        const statusEl = document.getElementById('index-status');
        statusEl.textContent = 'scanning';
        statusEl.className = 'index-status scanning';

        const treeNodes = document.querySelectorAll('.tree-node');
        const searchVal = targetId || (rangeMatch ? parseInt(rangeMatch[1]) : 1);
        const path = DBIV.findPathInTree(searchVal, treeNodes);

        await DBIV.animateTreeTraversal(path);
        DBIV.log('LOOKUP', `Q${qid}: B-Tree traversal: ${path.length} nodes`);

        if (targetId) {
            const tuple = this.tuples.find(t => t.id === targetId);
            const row = document.getElementById('pgtuple-' + targetId);
            if (row) {
                if (tuple && tuple.dead) {
                    row.classList.add('scanned');
                    DBIV.log('SCAN', `Q${qid}: Tuple id=${targetId} is dead (xmax=${tuple.xmax}) - visibility check failed`);
                    await DBIV.sleep(500);
                    row.classList.remove('scanned');
                } else {
                    row.classList.add('matched');
                    DBIV.log('FETCH', `Q${qid}: Tuple id=${targetId} visible (xmin=${tuple ? tuple.xmin : '?'})`);
                    setTimeout(() => row.classList.remove('matched'), 1500);
                }
            }
            DBIV.addStats(1 + path.length, 1, path.length, 3);
            DBIV.log('RESULT', `Q${qid}: ${tuple && !tuple.dead ? '1 row' : '0 rows (dead tuple)'}`);
        } else if (rangeMatch) {
            const low = parseInt(rangeMatch[1]);
            const high = parseInt(rangeMatch[2]);
            let count = 0;
            let visible = 0;
            this.tuples.forEach(t => {
                if (t.id >= low && t.id <= high) {
                    count++;
                    const row = document.getElementById('pgtuple-' + t.id);
                    if (row) {
                        if (t.dead) {
                            row.classList.add('scanned');
                            setTimeout(() => row.classList.remove('scanned'), 1500);
                        } else {
                            row.classList.add('matched');
                            setTimeout(() => row.classList.remove('matched'), 1500);
                            visible++;
                        }
                    }
                }
            });
            DBIV.log('FETCH', `Q${qid}: Leaf scan for range [${low}, ${high}]`);
            DBIV.addStats(1 + path.length, count, path.length, 4);
            DBIV.log('RESULT', `Q${qid}: ${visible} visible row(s), ${count - visible} dead tuple(s)`);
        } else {
            DBIV.addStats(1 + path.length, 0, path.length, 2);
        }

        if (DBIV.state.comparisonMode) {
            const totalTuples = this.tuples.length;
            DBIV.showComparison(
                { pages: 1 + path.length, rows: targetId ? 1 : (rangeMatch ? parseInt(rangeMatch[2]) - parseInt(rangeMatch[1]) + 1 : 0), time: 3 },
                { pages: 3, rows: totalTuples, time: totalTuples * 2 }
            );
        }

        statusEl.textContent = 'ready';
        statusEl.className = 'index-status ready';
    }
};

/* ---------- 2. Hash Index ---------- */
DBIV.postgresql.hash = {
    init() {
        const presets = [
            'SELECT * FROM users WHERE email = "bob@mail.com"',
            'SELECT * FROM users WHERE email = "eve@mail.com"',
            'SELECT * FROM users WHERE email > "c"',
        ];

        document.getElementById('query-col').innerHTML = DBIV.postgresql._queryCard(presets[0], presets);
        document.getElementById('index-name').textContent = 'Hash Index (4-page)';

        const data = DBIV.sampleData.users;
        const numBuckets = 4;
        const buckets = Array.from({ length: numBuckets }, () => []);
        data.forEach(u => {
            const b = DBIV.hashKey(u.email) % numBuckets;
            buckets[b].push(u);
        });

        let bodyHtml = '<div class="hash-container">';
        bodyHtml += '<div class="hash-bucket" style="border-color:var(--dbiv-accent);margin-bottom:8px;"><span class="hash-bucket-id" style="color:var(--dbiv-accent)">META</span><div style="font-size:10px;color:var(--dbiv-text-light)">ntuples: ' + data.length + ' | nbuckets: ' + numBuckets + '</div></div>';
        bodyHtml += '<div class="hash-function" id="pg-hash-fn">hashfunc(key) mod ' + numBuckets + '</div>';
        buckets.forEach((bucket, i) => {
            bodyHtml += `<div class="hash-bucket" id="pg-hbucket-${i}">`;
            bodyHtml += `<span class="hash-bucket-id">B${i}</span>`;
            bodyHtml += '<div class="hash-bucket-items">';
            bucket.forEach(u => {
                bodyHtml += `<span class="hash-item" data-email="${u.email}">${u.email.split('@')[0]}</span>`;
            });
            if (bucket.length > 2) {
                bodyHtml += `<span class="hash-item" style="border-style:dashed;color:var(--dbiv-text-light)">overflow \u2192</span>`;
            }
            bodyHtml += '</div></div>';
        });
        bodyHtml += '<div class="hash-bucket" style="opacity:0.5;"><span class="hash-bucket-id">BMP</span><div style="font-size:10px;color:var(--dbiv-text-light)">Bitmap: tracks overflow pages</div></div>';
        bodyHtml += '</div>';
        document.getElementById('index-body').innerHTML = bodyHtml;

        const pages = DBIV.sampleData.toPages(data, 4);
        DBIV.renderDataPages(document.getElementById('results-col'), pages);
        document.getElementById('extra-panels').innerHTML = '';
        DBIV.postgresql._setupQueryCard(() => this.run());
    },

    async run() {
        const query = document.getElementById('query-input').value;
        const qid = DBIV.nextQueryId();
        DBIV.log('QUERY', `Q${qid}: ${query}`);

        const eqMatch = query.match(/email\s*=\s*"([^"]+)"/i);
        const rangeMatch = query.match(/email\s*>\s*"([^"]+)"/i);

        const statusEl = document.getElementById('index-status');
        statusEl.textContent = 'scanning';
        statusEl.className = 'index-status scanning';

        if (rangeMatch) {
            DBIV.log('MISS', `Q${qid}: Hash index does NOT support range queries`);
            DBIV.flashCard(document.getElementById('query-card'), 'red');
            const rows = document.querySelectorAll('.data-row');
            await DBIV.animateFullScan(Array.from(rows));
            DBIV.addStats(3, rows.length, 0, 40);

            if (DBIV.state.comparisonMode) {
                DBIV.showComparison(
                    { pages: 3, rows: rows.length, time: 40 },
                    { pages: 3, rows: rows.length, time: 40 }
                );
            }
        } else if (eqMatch) {
            const email = eqMatch[1];
            const bucketIdx = DBIV.hashKey(email) % 4;

            DBIV.log('HASH', `Q${qid}: Read meta page \u2192 nbuckets=4`);
            await DBIV.sleep(300);

            await DBIV.animateHash(email, document.getElementById('pg-hbucket-' + bucketIdx), document.getElementById('pg-hash-fn'));
            DBIV.log('HASH', `Q${qid}: hashfunc("${email}") \u2192 bucket ${bucketIdx}`);

            const items = document.querySelectorAll(`#pg-hbucket-${bucketIdx} .hash-item`);
            let found = false;
            items.forEach(item => {
                if (item.dataset.email === email) {
                    item.classList.add('matched');
                    setTimeout(() => item.classList.remove('matched'), 1500);
                    found = true;
                }
            });

            DBIV.addStats(2, found ? 1 : 0, 1, 2);
            DBIV.log('RESULT', `Q${qid}: ${found ? '1 row found' : 'not found'} via hash lookup`);

            if (DBIV.state.comparisonMode) {
                const rows = document.querySelectorAll('.data-row');
                DBIV.showComparison(
                    { pages: 2, rows: found ? 1 : 0, time: 2 },
                    { pages: 3, rows: rows.length, time: 40 }
                );
            }

            setTimeout(() => {
                document.querySelectorAll('.hash-bucket').forEach(b => b.classList.remove('targeted'));
            }, 1500);
        }

        statusEl.textContent = 'ready';
        statusEl.className = 'index-status ready';
    }
};

/* ---------- 3. GIN Index ---------- */
DBIV.postgresql.gin = {
    documents: [
        { id: 1, jsonb: { tags: ['web', 'api'], lang: 'go' } },
        { id: 2, jsonb: { tags: ['web', 'frontend'], lang: 'js' } },
        { id: 3, jsonb: { tags: ['api', 'grpc'], lang: 'go' } },
        { id: 4, jsonb: { tags: ['web', 'api', 'rest'], lang: 'python' } },
        { id: 5, jsonb: { tags: ['mobile', 'ios'], lang: 'swift' } },
        { id: 6, jsonb: { tags: ['api', 'graphql'], lang: 'js' } },
    ],

    init() {
        const invertedIndex = {};
        this.documents.forEach(doc => {
            doc.jsonb.tags.forEach(tag => {
                if (!invertedIndex[tag]) invertedIndex[tag] = [];
                invertedIndex[tag].push(doc.id);
            });
            const lang = doc.jsonb.lang;
            const lk = 'lang:' + lang;
            if (!invertedIndex[lk]) invertedIndex[lk] = [];
            invertedIndex[lk].push(doc.id);
        });
        this._index = invertedIndex;

        const presets = [
            "SELECT * FROM docs WHERE data @> '{\"tags\": [\"api\"]}'",
            "SELECT * FROM docs WHERE data @> '{\"lang\": \"go\"}'",
            "SELECT * FROM docs WHERE data @> '{\"tags\": [\"web\"]}'",
        ];

        document.getElementById('query-col').innerHTML = DBIV.postgresql._queryCard(presets[0], presets);
        document.getElementById('index-name').textContent = 'GIN (JSONB)';

        let bodyHtml = '<div class="gin-container">';
        Object.keys(invertedIndex).sort().forEach(token => {
            const docIds = invertedIndex[token];
            bodyHtml += `<div class="gin-entry" id="gin-${token.replace(/[^a-z0-9]/gi, '_')}" data-token="${token}">`;
            bodyHtml += `<span class="gin-token">${token}</span>`;
            bodyHtml += '<div class="gin-posting-list">';
            docIds.forEach(id => {
                bodyHtml += `<span class="gin-doc-ref" data-docid="${id}">tid(${Math.floor((id-1)/3)},${((id-1)%3)+1})</span>`;
            });
            bodyHtml += '</div></div>';
        });
        bodyHtml += '</div>';
        document.getElementById('index-body').innerHTML = bodyHtml;

        let resultsHtml = '<div class="data-page"><div class="data-page-header">JSONB Documents</div>';
        this.documents.forEach(doc => {
            resultsHtml += `<div class="data-row" id="gindoc-${doc.id}">`;
            resultsHtml += `<span class="data-row-id">${doc.id}</span>`;
            resultsHtml += `<span class="data-row-value">${JSON.stringify(doc.jsonb).slice(0, 35)}</span>`;
            resultsHtml += '</div>';
        });
        resultsHtml += '</div>';
        document.getElementById('results-col').innerHTML = resultsHtml;

        document.getElementById('extra-panels').innerHTML = '';
        DBIV.postgresql._setupQueryCard(() => this.run());
    },

    async run() {
        const query = document.getElementById('query-input').value;
        const qid = DBIV.nextQueryId();
        DBIV.log('QUERY', `Q${qid}: ${query}`);

        const statusEl = document.getElementById('index-status');
        statusEl.textContent = 'scanning';
        statusEl.className = 'index-status scanning';

        let searchKey = null;
        const tagsMatch = query.match(/tags.*\["([^"]+)"\]/);
        const langMatch = query.match(/lang.*"([^"]+)"/);

        if (tagsMatch) searchKey = tagsMatch[1];
        else if (langMatch) searchKey = 'lang:' + langMatch[1];

        if (searchKey && this._index[searchKey]) {
            const entryId = 'gin-' + searchKey.replace(/[^a-z0-9]/gi, '_');
            const entry = document.getElementById(entryId);
            if (entry) {
                entry.classList.add('matched');
                const docIds = this._index[searchKey];
                DBIV.log('LOOKUP', `Q${qid}: GIN entry "${searchKey}" \u2192 posting list: [${docIds.map(id => 'tid(' + Math.floor((id-1)/3) + ',' + (((id-1)%3)+1) + ')').join(', ')}]`);

                entry.querySelectorAll('.gin-doc-ref').forEach(ref => ref.classList.add('matched'));
                await DBIV.sleep(500);

                docIds.forEach(id => {
                    const row = document.getElementById('gindoc-' + id);
                    if (row) {
                        row.classList.add('matched');
                        setTimeout(() => row.classList.remove('matched'), 1500);
                    }
                });

                DBIV.addStats(1, docIds.length, 1, 2);
                DBIV.log('RESULT', `Q${qid}: ${docIds.length} document(s) found via GIN`);

                if (DBIV.state.comparisonMode) {
                    DBIV.showComparison(
                        { pages: 1, rows: docIds.length, time: 2 },
                        { pages: 2, rows: this.documents.length, time: this.documents.length * 2 }
                    );
                }

                setTimeout(() => {
                    document.querySelectorAll('.gin-entry').forEach(e => e.classList.remove('matched'));
                    document.querySelectorAll('.gin-doc-ref').forEach(e => e.classList.remove('matched'));
                }, 2000);
            }
        } else {
            DBIV.log('MISS', `Q${qid}: Key not found in GIN index`);
            DBIV.addStats(1, 0, 1, 1);
        }

        statusEl.textContent = 'ready';
        statusEl.className = 'index-status ready';
    }
};

/* ---------- 4. GiST Index ---------- */
DBIV.postgresql.gist = {
    points: [
        { id: 1, x: 20, y: 30, label: 'A' },
        { id: 2, x: 60, y: 25, label: 'B' },
        { id: 3, x: 40, y: 70, label: 'C' },
        { id: 4, x: 80, y: 60, label: 'D' },
        { id: 5, x: 15, y: 80, label: 'E' },
        { id: 6, x: 70, y: 85, label: 'F' },
        { id: 7, x: 50, y: 45, label: 'G' },
        { id: 8, x: 90, y: 15, label: 'H' },
    ],

    init() {
        const presets = [
            "SELECT * FROM points WHERE pos <@ box '((30,20),(70,70))'",
            "SELECT * FROM points WHERE pos <@ box '((0,0),(50,50))'",
            "SELECT * FROM points WHERE pos <@ box '((60,50),(95,90))'",
        ];

        document.getElementById('query-col').innerHTML = DBIV.postgresql._queryCard(presets[0], presets);
        document.getElementById('index-name').textContent = 'GiST (R-Tree)';

        let bodyHtml = '<div class="gist-container" id="gist-canvas">';
        bodyHtml += '<div class="gist-box level-0" style="left:12%;top:27%;width:41%;height:56%;" id="gist-bb-left"></div>';
        bodyHtml += '<div class="gist-box level-0" style="left:57%;top:12%;width:36%;height:76%;" id="gist-bb-right"></div>';
        this.points.forEach(p => {
            bodyHtml += `<div class="gist-point" id="gist-p-${p.id}" style="left:${p.x}%;top:${p.y}%;" title="${p.label}(${p.x},${p.y})"></div>`;
        });
        bodyHtml += '<div class="gist-query-box" id="gist-query-box" style="display:none;"></div>';
        bodyHtml += '</div>';
        document.getElementById('index-body').innerHTML = bodyHtml;

        let resultsHtml = '<div class="data-page"><div class="data-page-header">Points</div>';
        this.points.forEach(p => {
            resultsHtml += `<div class="data-row" id="gist-row-${p.id}">`;
            resultsHtml += `<span class="data-row-id">${p.label}</span>`;
            resultsHtml += `<span class="data-row-value">(${p.x}, ${p.y})</span>`;
            resultsHtml += '</div>';
        });
        resultsHtml += '</div>';
        document.getElementById('results-col').innerHTML = resultsHtml;

        document.getElementById('extra-panels').innerHTML = '';
        DBIV.postgresql._setupQueryCard(() => this.run());
    },

    async run() {
        const query = document.getElementById('query-input').value;
        const qid = DBIV.nextQueryId();
        DBIV.log('QUERY', `Q${qid}: ${query}`);

        const boxMatch = query.match(/box\s*'\(\((\d+),(\d+)\),\((\d+),(\d+)\)\)'/i);
        if (!boxMatch) {
            DBIV.log('MISS', `Q${qid}: Invalid box syntax`);
            return;
        }

        const qx1 = parseInt(boxMatch[1]), qy1 = parseInt(boxMatch[2]);
        const qx2 = parseInt(boxMatch[3]), qy2 = parseInt(boxMatch[4]);

        const statusEl = document.getElementById('index-status');
        statusEl.textContent = 'scanning';
        statusEl.className = 'index-status scanning';

        const qbox = document.getElementById('gist-query-box');
        qbox.style.display = 'block';
        qbox.style.left = qx1 + '%';
        qbox.style.top = qy1 + '%';
        qbox.style.width = (qx2 - qx1) + '%';
        qbox.style.height = (qy2 - qy1) + '%';
        DBIV.log('SCAN', `Q${qid}: Query box: (${qx1},${qy1}) - (${qx2},${qy2})`);

        const leftBB = { x1: 12, y1: 27, x2: 53, y2: 83 };
        const rightBB = { x1: 57, y1: 12, x2: 93, y2: 88 };
        const overlapsLeft = qx1 <= leftBB.x2 && qx2 >= leftBB.x1 && qy1 <= leftBB.y2 && qy2 >= leftBB.y1;
        const overlapsRight = qx1 <= rightBB.x2 && qx2 >= rightBB.x1 && qy1 <= rightBB.y2 && qy2 >= rightBB.y1;

        const bbLeft = document.getElementById('gist-bb-left');
        const bbRight = document.getElementById('gist-bb-right');
        bbLeft.classList.add('highlighted');
        DBIV.log('LOOKUP', `Q${qid}: Check bounding box LEFT - overlaps? ${overlapsLeft ? 'YES' : 'NO'}`);
        await DBIV.sleep(500);
        bbLeft.classList.remove('highlighted');

        bbRight.classList.add('highlighted');
        DBIV.log('LOOKUP', `Q${qid}: Check bounding box RIGHT - overlaps? ${overlapsRight ? 'YES' : 'NO'}`);
        await DBIV.sleep(500);
        bbRight.classList.remove('highlighted');

        let matched = 0;
        this.points.forEach(p => {
            const inside = p.x >= qx1 && p.x <= qx2 && p.y >= qy1 && p.y <= qy2;
            const pointEl = document.getElementById('gist-p-' + p.id);
            const rowEl = document.getElementById('gist-row-' + p.id);
            if (inside) {
                if (pointEl) pointEl.classList.add('matched');
                if (rowEl) rowEl.classList.add('matched');
                matched++;
            }
        });

        DBIV.addStats(2, matched, 2, 3);
        DBIV.log('RESULT', `Q${qid}: ${matched} point(s) inside query box`);

        if (DBIV.state.comparisonMode) {
            DBIV.showComparison(
                { pages: 2, rows: matched, time: 3 },
                { pages: 1, rows: this.points.length, time: this.points.length * 2 }
            );
        }

        setTimeout(() => {
            qbox.style.display = 'none';
            this.points.forEach(p => {
                const pointEl = document.getElementById('gist-p-' + p.id);
                const rowEl = document.getElementById('gist-row-' + p.id);
                if (pointEl) pointEl.classList.remove('matched');
                if (rowEl) rowEl.classList.remove('matched');
            });
        }, 2500);

        statusEl.textContent = 'ready';
        statusEl.className = 'index-status ready';
    }
};

/* ---------- 5. BRIN Index ---------- */
DBIV.postgresql.brin = {
    blocks: [],

    init() {
        this.blocks = [];
        for (let i = 0; i < 8; i++) {
            const min = i * 100 + 1;
            const max = (i + 1) * 100;
            this.blocks.push({ id: i, min, max, label: `Block ${i}`, rows: 100 });
        }

        const presets = [
            'SELECT * FROM events WHERE ts BETWEEN 201 AND 350',
            'SELECT * FROM events WHERE ts BETWEEN 1 AND 100',
            'SELECT * FROM events WHERE ts BETWEEN 500 AND 700',
            'SELECT * FROM events WHERE ts = 450',
        ];

        document.getElementById('query-col').innerHTML = DBIV.postgresql._queryCard(presets[0], presets);
        document.getElementById('index-name').textContent = 'BRIN (min/max)';

        let bodyHtml = '<div style="margin-bottom:8px;font-size:11px;color:var(--dbiv-text-light)">Block Ranges (pages_per_range=100)</div>';
        bodyHtml += '<div class="block-range">';
        this.blocks.forEach(b => {
            bodyHtml += `<div class="block-cell" id="brin-block-${b.id}">`;
            bodyHtml += `<div class="block-cell-label">Block ${b.id}</div>`;
            bodyHtml += `<div class="block-cell-range">${b.min}-${b.max}</div>`;
            bodyHtml += '</div>';
        });
        bodyHtml += '</div>';
        document.getElementById('index-body').innerHTML = bodyHtml;

        let resultsHtml = `<div class="result-card">
            <div class="result-card-header">Table: events</div>
            <div style="font-size:10px;font-family:monospace;color:var(--dbiv-text-light);">
                <div>Total rows: 800</div>
                <div>Blocks: 8</div>
                <div>Correlation: 0.98 (well-ordered)</div>
                <div style="margin-top:4px">BRIN index size: <span style="color:#6fcf97">24 KB</span></div>
                <div>B-Tree index size: <span style="color:#f38ba8">6.4 MB</span></div>
            </div>
        </div>`;
        document.getElementById('results-col').innerHTML = resultsHtml;

        document.getElementById('extra-panels').innerHTML = '';
        DBIV.postgresql._setupQueryCard(() => this.run());
    },

    async run() {
        const query = document.getElementById('query-input').value;
        const qid = DBIV.nextQueryId();
        DBIV.log('QUERY', `Q${qid}: ${query}`);

        const betweenMatch = query.match(/BETWEEN\s+(\d+)\s+AND\s+(\d+)/i);
        const eqMatch = query.match(/ts\s*=\s*(\d+)/i);

        let low, high;
        if (betweenMatch) {
            low = parseInt(betweenMatch[1]);
            high = parseInt(betweenMatch[2]);
        } else if (eqMatch) {
            low = high = parseInt(eqMatch[1]);
        } else {
            DBIV.log('MISS', `Q${qid}: Cannot parse WHERE clause`);
            return;
        }

        const statusEl = document.getElementById('index-status');
        statusEl.textContent = 'scanning';
        statusEl.className = 'index-status scanning';

        let scannedBlocks = 0;
        let matchedBlocks = 0;
        let skippedBlocks = 0;

        for (const block of this.blocks) {
            const el = document.getElementById('brin-block-' + block.id);
            if (!el) continue;

            el.classList.add('scanned');
            await DBIV.sleep(200);
            el.classList.remove('scanned');

            const overlaps = block.min <= high && block.max >= low;
            if (overlaps) {
                el.classList.add('matched');
                matchedBlocks++;
                DBIV.log('SCAN', `Q${qid}: Block ${block.id} [${block.min}-${block.max}] \u2192 SCAN (overlaps range)`);
            } else {
                el.classList.add('skipped');
                skippedBlocks++;
                DBIV.log('SCAN', `Q${qid}: Block ${block.id} [${block.min}-${block.max}] \u2192 SKIP`);
            }
            scannedBlocks++;
        }

        const estimatedRows = matchedBlocks * 100;
        const actualRows = Math.min(high - low + 1, estimatedRows);
        DBIV.addStats(matchedBlocks, actualRows, scannedBlocks, matchedBlocks * 2);
        DBIV.log('RESULT', `Q${qid}: Scanned ${matchedBlocks}/${this.blocks.length} blocks, skipped ${skippedBlocks}`);

        if (DBIV.state.comparisonMode) {
            DBIV.showComparison(
                { pages: matchedBlocks, rows: actualRows, time: matchedBlocks * 2 },
                { pages: this.blocks.length, rows: 800, time: 16 }
            );
        }

        setTimeout(() => {
            this.blocks.forEach(b => {
                const el = document.getElementById('brin-block-' + b.id);
                if (el) el.classList.remove('matched', 'skipped');
            });
        }, 2500);

        statusEl.textContent = 'ready';
        statusEl.className = 'index-status ready';
    }
};
