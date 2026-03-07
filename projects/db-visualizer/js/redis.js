/* ===== Redis Index Modes ===== */

DBIV.redis = {};

DBIV.redis.modes = [
    { id: 'zset', label: 'Sorted Set (ZSET)', desc: 'Skip list + hash table. ZADD inserts with score, ZRANGE returns by rank, ZRANGEBYSCORE by score range. O(log n) insert/lookup.' },
    { id: 'hash-index', label: 'Hash (Rehashing)', desc: 'Progressive rehashing: Redis uses two hash tables. During resize, entries migrate bucket-by-bucket from ht[0] to ht[1] on each operation.' },
    { id: 'secondary', label: 'Secondary Index', desc: 'Redis has no built-in secondary indexes. Pattern: use Sorted Sets as indexes \u2014 ZRANGEBYSCORE for numeric ranges, ZRANGEBYLEX for string prefixes.' },
];

DBIV.redis._queryCard = function(query, presets) {
    return `
    <div class="query-card" id="query-card">
        <span class="port port-right" id="port-query"></span>
        <div class="query-card-header">
            <span class="query-card-icon">&#x26A1;</span>
            <span class="query-card-name">Command</span>
        </div>
        <textarea class="query-input" id="query-input">${query}</textarea>
        <div class="preset-buttons">
            ${presets.map(p => `<button class="preset-btn" data-query="${p.replace(/"/g, '&quot;')}">${p.length > 30 ? p.slice(0, 30) + '...' : p}</button>`).join('')}
        </div>
        <button class="card-send-btn" id="btn-run-query">Execute</button>
    </div>`;
};

DBIV.redis._setupQueryCard = DBIV.mysql._setupQueryCard;

/* ---------- 1. Sorted Set (ZSET) - Skip List ---------- */
DBIV.redis.zset = {
    members: [
        { member: 'alice', score: 100, level: 3 },
        { member: 'bob', score: 200, level: 1 },
        { member: 'carol', score: 350, level: 2 },
        { member: 'dave', score: 500, level: 1 },
        { member: 'eve', score: 650, level: 4 },
        { member: 'frank', score: 800, level: 2 },
        { member: 'grace', score: 950, level: 1 },
    ],

    init() {
        const presets = [
            'ZRANGEBYSCORE leaderboard 200 600',
            'ZADD leaderboard 425 hank',
            'ZRANGE leaderboard 0 2',
            'ZRANGEBYSCORE leaderboard 100 350',
        ];

        document.getElementById('query-col').innerHTML = DBIV.redis._queryCard(presets[0], presets);
        document.getElementById('index-name').textContent = 'Skip List (ZSET)';

        DBIV.renderSkipList(document.getElementById('index-body'), {
            maxLevel: 4,
            nodes: this.members,
        });

        let resultsHtml = '<div class="data-page"><div class="data-page-header">ZSET Members</div>';
        this.members.forEach((m, i) => {
            resultsHtml += `<div class="data-row" id="zrow-${m.member}">`;
            resultsHtml += `<span class="data-row-id">#${i}</span>`;
            resultsHtml += `<span class="data-row-value">${m.member}: ${m.score}</span>`;
            resultsHtml += '</div>';
        });
        resultsHtml += '</div>';
        document.getElementById('results-col').innerHTML = resultsHtml;

        document.getElementById('extra-panels').innerHTML = '';
        DBIV.redis._setupQueryCard(() => this.run());
    },

    async run() {
        const query = document.getElementById('query-input').value;
        const qid = DBIV.nextQueryId();
        DBIV.log('QUERY', `Q${qid}: ${query}`);

        const statusEl = document.getElementById('index-status');
        statusEl.textContent = 'scanning';
        statusEl.className = 'index-status scanning';

        const scoreRangeMatch = query.match(/ZRANGEBYSCORE\s+\S+\s+(\d+)\s+(\d+)/i);
        const rankRangeMatch = query.match(/ZRANGE\s+\S+\s+(\d+)\s+(\d+)/i);
        const zaddMatch = query.match(/ZADD\s+\S+\s+(\d+)\s+(\S+)/i);

        if (scoreRangeMatch) {
            const low = parseInt(scoreRangeMatch[1]);
            const high = parseInt(scoreRangeMatch[2]);

            DBIV.log('LOOKUP', `Q${qid}: Skip list search for score range [${low}, ${high}]`);

            const sortedScores = this.members.map(m => m.score).sort((a, b) => a - b);

            for (let level = 3; level >= 0; level--) {
                for (const score of sortedScores) {
                    const node = document.getElementById(`sl-${level}-${score}`);
                    if (!node) continue;

                    node.classList.add('highlighted');
                    await DBIV.sleep(150);

                    if (score < low) {
                        node.classList.remove('highlighted');
                        DBIV.log('SCAN', `Q${qid}: L${level} skip ${score} < ${low}, move right`);
                    } else {
                        DBIV.log('SCAN', `Q${qid}: L${level} score ${score} >= ${low}, drop down`);
                        if (level > 0) node.classList.remove('highlighted');
                        break;
                    }
                }
            }

            for (const score of sortedScores) {
                if (score >= low && score <= high) {
                    const node = document.getElementById(`sl-0-${score}`);
                    if (node) node.classList.add('highlighted');
                }
            }

            const matched = this.members.filter(m => m.score >= low && m.score <= high);
            matched.forEach(m => {
                const row = document.getElementById('zrow-' + m.member);
                if (row) { row.classList.add('matched'); setTimeout(() => row.classList.remove('matched'), 1500); }
            });

            DBIV.addStats(1, matched.length, 4, 1);
            DBIV.log('RESULT', `Q${qid}: ${matched.length} member(s) in range [${low}, ${high}]`);

            if (DBIV.state.comparisonMode) {
                DBIV.showComparison(
                    { pages: 1, rows: matched.length, time: 1 },
                    { pages: 1, rows: this.members.length, time: this.members.length }
                );
            }

            setTimeout(() => {
                document.querySelectorAll('.skiplist-node').forEach(n => n.classList.remove('highlighted'));
            }, 2000);
        } else if (rankRangeMatch) {
            const start = parseInt(rankRangeMatch[1]);
            const stop = parseInt(rankRangeMatch[2]);

            DBIV.log('LOOKUP', `Q${qid}: ZRANGE by rank [${start}, ${stop}]`);

            const slice = this.members.slice(start, stop + 1);
            for (const m of slice) {
                const row = document.getElementById('zrow-' + m.member);
                if (row) { row.classList.add('matched'); setTimeout(() => row.classList.remove('matched'), 1500); }

                for (let level = 0; level < 4; level++) {
                    const node = document.getElementById(`sl-${level}-${m.score}`);
                    if (node) node.classList.add('highlighted');
                }
                await DBIV.sleep(200);
            }

            DBIV.addStats(1, slice.length, 1, 1);
            DBIV.log('RESULT', `Q${qid}: ${slice.length} member(s) at ranks [${start}, ${stop}]`);

            if (DBIV.state.comparisonMode) {
                DBIV.showComparison(
                    { pages: 1, rows: slice.length, time: 1 },
                    { pages: 1, rows: this.members.length, time: this.members.length }
                );
            }

            setTimeout(() => {
                document.querySelectorAll('.skiplist-node').forEach(n => n.classList.remove('highlighted'));
            }, 2000);
        } else if (zaddMatch) {
            const score = parseInt(zaddMatch[1]);
            const member = zaddMatch[2];

            DBIV.log('LOOKUP', `Q${qid}: Skip list insert "${member}" with score ${score}`);

            for (let level = 3; level >= 0; level--) {
                const nodes = document.querySelectorAll(`.skiplist-node[id^="sl-${level}-"]`);
                for (const node of nodes) {
                    const ns = parseInt(node.dataset.score);
                    if (ns <= score) {
                        node.classList.add('highlighted');
                        await DBIV.sleep(150);
                        node.classList.remove('highlighted');
                    }
                }
            }

            let newLevel = 1;
            while (Math.random() < 0.25 && newLevel < 4) newLevel++;
            this.members.push({ member, score, level: newLevel });
            this.members.sort((a, b) => a.score - b.score);

            DBIV.renderSkipList(document.getElementById('index-body'), {
                maxLevel: 4,
                nodes: this.members,
            });

            let resultsHtml = '<div class="data-page"><div class="data-page-header">ZSET Members</div>';
            this.members.forEach((m, i) => {
                resultsHtml += `<div class="data-row" id="zrow-${m.member}">`;
                resultsHtml += `<span class="data-row-id">#${i}</span>`;
                resultsHtml += `<span class="data-row-value">${m.member}: ${m.score}</span>`;
                resultsHtml += '</div>';
            });
            resultsHtml += '</div>';
            document.getElementById('results-col').innerHTML = resultsHtml;

            const newRow = document.getElementById('zrow-' + member);
            if (newRow) { newRow.classList.add('matched'); setTimeout(() => newRow.classList.remove('matched'), 1500); }

            DBIV.addStats(1, 0, newLevel, 1);
            DBIV.log('RESULT', `Q${qid}: Inserted "${member}" at score ${score}, level ${newLevel}`);
        }

        statusEl.textContent = 'ready';
        statusEl.className = 'index-status ready';
    }
};

/* ---------- 2. Hash Index (Progressive Rehashing) ---------- */
DBIV.redis.hashIndex = {
    ht0: [],
    ht1: [],
    rehashIdx: -1,
    numBuckets0: 4,
    numBuckets1: 8,

    _entries: [
        { key: 'user:1', value: 'Alice' },
        { key: 'user:2', value: 'Bob' },
        { key: 'user:3', value: 'Carol' },
        { key: 'user:4', value: 'Dave' },
        { key: 'user:5', value: 'Eve' },
        { key: 'user:6', value: 'Frank' },
        { key: 'user:7', value: 'Grace' },
    ],

    init() {
        this.ht0 = Array.from({ length: this.numBuckets0 }, () => []);
        this.ht1 = Array.from({ length: this.numBuckets1 }, () => []);
        this.rehashIdx = -1;

        this._entries.forEach(e => {
            const b = DBIV.hashKey(e.key) % this.numBuckets0;
            this.ht0[b].push(e);
        });

        const presets = [
            'HGET user:3',
            'HSET user:8 Hank',
            'TRIGGER REHASH',
            'HGET user:5',
        ];

        document.getElementById('query-col').innerHTML = DBIV.redis._queryCard(presets[0], presets);
        document.getElementById('index-name').textContent = 'Hash (rehashing)';

        this._render();

        document.getElementById('results-col').innerHTML = `
        <div class="result-card">
            <div class="result-card-header">Rehash Status</div>
            <div id="rehash-info" style="font-size:10px;font-family:monospace;color:var(--dbiv-text-light);">
                <div>ht[0] buckets: ${this.numBuckets0}</div>
                <div>ht[1] buckets: ${this.numBuckets1}</div>
                <div>Rehash index: <span id="rehash-idx">inactive</span></div>
                <div>Load factor: <span id="load-factor">${(this._entries.length / this.numBuckets0).toFixed(2)}</span></div>
            </div>
        </div>`;

        document.getElementById('extra-panels').innerHTML = '';
        DBIV.redis._setupQueryCard(() => this.run());
    },

    _render() {
        let html = '<div class="hash-container">';
        html += '<div style="font-size:11px;font-weight:700;color:var(--dbiv-accent);margin-bottom:4px;">ht[0]</div>';
        this.ht0.forEach((bucket, i) => {
            const migrated = this.rehashIdx >= 0 && i < this.rehashIdx;
            html += `<div class="hash-bucket ${migrated ? 'targeted' : ''}" id="ht0-${i}" style="${migrated ? 'opacity:0.3;' : ''}">`;
            html += `<span class="hash-bucket-id">B${i}</span>`;
            html += '<div class="hash-bucket-items">';
            bucket.forEach(e => {
                html += `<span class="hash-item" data-key="${e.key}">${e.key}</span>`;
            });
            html += '</div></div>';
        });

        if (this.rehashIdx >= 0) {
            html += '<div style="font-size:11px;font-weight:700;color:var(--dbiv-accent);margin:8px 0 4px;">ht[1] (new)</div>';
            this.ht1.forEach((bucket, i) => {
                html += `<div class="hash-bucket" id="ht1-${i}">`;
                html += `<span class="hash-bucket-id">B${i}</span>`;
                html += '<div class="hash-bucket-items">';
                bucket.forEach(e => {
                    html += `<span class="hash-item" data-key="${e.key}">${e.key}</span>`;
                });
                html += '</div></div>';
            });
        }
        html += '</div>';
        document.getElementById('index-body').innerHTML = html;
    },

    async run() {
        const query = document.getElementById('query-input').value;
        const qid = DBIV.nextQueryId();
        DBIV.log('QUERY', `Q${qid}: ${query}`);

        const statusEl = document.getElementById('index-status');
        statusEl.textContent = 'scanning';
        statusEl.className = 'index-status scanning';

        const hgetMatch = query.match(/HGET\s+(\S+)/i);
        const hsetMatch = query.match(/HSET\s+(\S+)\s+(\S+)/i);
        const rehashMatch = /TRIGGER\s+REHASH/i.test(query);

        if (rehashMatch) {
            if (this.rehashIdx < 0) this.rehashIdx = 0;

            DBIV.log('HASH', `Q${qid}: Starting progressive rehash`);

            for (let step = 0; step < this.numBuckets0 && this.rehashIdx < this.numBuckets0; step++) {
                const bucket = this.ht0[this.rehashIdx];
                const entries = [...bucket];

                DBIV.log('HASH', `Q${qid}: Rehashing bucket ${this.rehashIdx} (${entries.length} entries)`);

                for (const entry of entries) {
                    const newBucket = DBIV.hashKey(entry.key) % this.numBuckets1;
                    this.ht1[newBucket].push(entry);
                }
                this.ht0[this.rehashIdx] = [];
                this.rehashIdx++;

                this._render();
                document.getElementById('rehash-idx').textContent = this.rehashIdx + '/' + this.numBuckets0;
                await DBIV.sleep(500);
            }

            if (this.rehashIdx >= this.numBuckets0) {
                this.ht0 = this.ht1;
                this.ht1 = Array.from({ length: this.numBuckets1 * 2 }, () => []);
                this.numBuckets0 = this.numBuckets1;
                this.numBuckets1 = this.numBuckets1 * 2;
                this.rehashIdx = -1;
                this._render();
                document.getElementById('rehash-idx').textContent = 'complete';
                DBIV.log('RESULT', `Q${qid}: Rehash complete, new size: ${this.numBuckets0} buckets`);
            }

            DBIV.addStats(this.numBuckets0, 0, this.numBuckets0, this.numBuckets0);
        } else if (hgetMatch) {
            const key = hgetMatch[1];

            if (this.rehashIdx >= 0) {
                const b0 = DBIV.hashKey(key) % (this.numBuckets0);
                const isInHt0 = b0 >= this.rehashIdx;

                if (isInHt0) {
                    DBIV.log('HASH', `Q${qid}: Bucket ${b0} not yet rehashed, lookup in ht[0]`);
                    const el = document.getElementById('ht0-' + b0);
                    if (el) { el.classList.add('targeted'); setTimeout(() => el.classList.remove('targeted'), 1000); }
                } else {
                    const b1 = DBIV.hashKey(key) % this.numBuckets1;
                    DBIV.log('HASH', `Q${qid}: Bucket ${b0} already rehashed, lookup in ht[1] bucket ${b1}`);
                    const el = document.getElementById('ht1-' + b1);
                    if (el) { el.classList.add('targeted'); setTimeout(() => el.classList.remove('targeted'), 1000); }
                }
            } else {
                const b = DBIV.hashKey(key) % this.numBuckets0;
                DBIV.log('HASH', `Q${qid}: hash("${key}") \u2192 bucket ${b}`);
                const el = document.getElementById('ht0-' + b);
                if (el) { el.classList.add('targeted'); setTimeout(() => el.classList.remove('targeted'), 1000); }
            }

            const found = this._entries.find(e => e.key === key);
            await DBIV.sleep(500);
            DBIV.addStats(1, found ? 1 : 0, 1, 1);
            DBIV.log('RESULT', `Q${qid}: ${found ? '"' + found.value + '"' : '(nil)'}`);
        } else if (hsetMatch) {
            const key = hsetMatch[1];
            const value = hsetMatch[2];

            this._entries.push({ key, value });

            if (this.rehashIdx >= 0) {
                const b1 = DBIV.hashKey(key) % this.numBuckets1;
                this.ht1[b1].push({ key, value });
                DBIV.log('HASH', `Q${qid}: Insert into ht[1] bucket ${b1} (rehashing active, all new keys go to ht[1])`);
            } else {
                const b = DBIV.hashKey(key) % this.numBuckets0;
                this.ht0[b].push({ key, value });
                DBIV.log('HASH', `Q${qid}: Insert into ht[0] bucket ${b}`);
            }

            this._render();
            const loadFactor = this._entries.length / this.numBuckets0;
            document.getElementById('load-factor').textContent = loadFactor.toFixed(2);

            if (loadFactor > 1.0 && this.rehashIdx < 0) {
                DBIV.log('HASH', `Q${qid}: Load factor ${loadFactor.toFixed(2)} > 1.0 \u2014 rehash recommended`);
            }

            DBIV.addStats(1, 0, 1, 1);
            DBIV.log('RESULT', `Q${qid}: OK`);
        }

        statusEl.textContent = 'ready';
        statusEl.className = 'index-status ready';
    }
};

/* ---------- 3. Secondary Index Pattern ---------- */
DBIV.redis.secondary = {
    users: [
        { id: '1', name: 'Alice', age: 28, salary: 75000 },
        { id: '2', name: 'Bob', age: 35, salary: 95000 },
        { id: '3', name: 'Carol', age: 22, salary: 55000 },
        { id: '4', name: 'Dave', age: 31, salary: 82000 },
        { id: '5', name: 'Eve', age: 27, salary: 68000 },
        { id: '6', name: 'Frank', age: 42, salary: 120000 },
        { id: '7', name: 'Grace', age: 19, salary: 45000 },
        { id: '8', name: 'Hank', age: 38, salary: 98000 },
    ],

    init() {
        const presets = [
            'ZRANGEBYSCORE idx:age 25 35',
            'ZRANGEBYSCORE idx:salary 70000 100000',
            'ZRANGEBYLEX idx:name [A [D',
            'ZRANGEBYSCORE idx:age 30 50',
        ];

        document.getElementById('query-col').innerHTML = DBIV.redis._queryCard(presets[0], presets);
        document.getElementById('index-name').textContent = 'Secondary Indexes';

        const sortedByAge = [...this.users].sort((a, b) => a.age - b.age);
        const sortedBySalary = [...this.users].sort((a, b) => a.salary - b.salary);

        let bodyHtml = '<div style="width:100%">';
        bodyHtml += '<div style="font-size:11px;font-weight:700;color:var(--dbiv-accent);margin-bottom:4px;">idx:age (ZSET)</div>';
        bodyHtml += '<div class="hash-container" style="margin-bottom:12px">';
        sortedByAge.forEach(u => {
            bodyHtml += `<div class="hash-bucket" id="sidx-age-${u.id}" style="padding:3px 8px;">`;
            bodyHtml += `<span class="hash-bucket-id" style="min-width:40px">${u.age}</span>`;
            bodyHtml += `<span class="hash-item">user:${u.id}</span>`;
            bodyHtml += '</div>';
        });
        bodyHtml += '</div>';

        bodyHtml += '<div style="font-size:11px;font-weight:700;color:var(--dbiv-accent);margin-bottom:4px;">idx:salary (ZSET)</div>';
        bodyHtml += '<div class="hash-container">';
        sortedBySalary.forEach(u => {
            bodyHtml += `<div class="hash-bucket" id="sidx-sal-${u.id}" style="padding:3px 8px;">`;
            bodyHtml += `<span class="hash-bucket-id" style="min-width:60px">$${(u.salary / 1000).toFixed(0)}k</span>`;
            bodyHtml += `<span class="hash-item">user:${u.id}</span>`;
            bodyHtml += '</div>';
        });
        bodyHtml += '</div>';
        bodyHtml += '</div>';
        document.getElementById('index-body').innerHTML = bodyHtml;

        let resultsHtml = '<div class="data-page"><div class="data-page-header">HASH user:*</div>';
        this.users.forEach(u => {
            resultsHtml += `<div class="data-row" id="suser-${u.id}">`;
            resultsHtml += `<span class="data-row-id">${u.id}</span>`;
            resultsHtml += `<span class="data-row-value">${u.name}, ${u.age}, $${u.salary}</span>`;
            resultsHtml += '</div>';
        });
        resultsHtml += '</div>';
        document.getElementById('results-col').innerHTML = resultsHtml;

        document.getElementById('extra-panels').innerHTML = `
        <div style="padding:8px 12px;background:var(--dbiv-card-bg);border:1px solid var(--dbiv-border);border-radius:6px;font-size:12px;color:var(--dbiv-text-light);">
            <strong style="color:var(--dbiv-text)">Pattern:</strong>
            Store primary data in HASH (user:*). Create ZSET indexes with score=field_value, member=user:id.
            Query via ZRANGEBYSCORE \u2192 get user IDs \u2192 HGETALL for each.
        </div>`;

        DBIV.redis._setupQueryCard(() => this.run());
    },

    async run() {
        const query = document.getElementById('query-input').value;
        const qid = DBIV.nextQueryId();
        DBIV.log('QUERY', `Q${qid}: ${query}`);

        const statusEl = document.getElementById('index-status');
        statusEl.textContent = 'scanning';
        statusEl.className = 'index-status scanning';

        const ageMatch = query.match(/idx:age\s+(\d+)\s+(\d+)/i);
        const salaryMatch = query.match(/idx:salary\s+(\d+)\s+(\d+)/i);
        const lexMatch = query.match(/idx:name\s+\[(\w+)\s+\[(\w+)/i);

        let matchedUsers = [];
        let indexType = '';

        if (ageMatch) {
            const lo = parseInt(ageMatch[1]), hi = parseInt(ageMatch[2]);
            indexType = 'age';
            matchedUsers = this.users.filter(u => u.age >= lo && u.age <= hi);
            DBIV.log('LOOKUP', `Q${qid}: ZRANGEBYSCORE idx:age ${lo} ${hi}`);

            for (const u of this.users) {
                const el = document.getElementById('sidx-age-' + u.id);
                if (el) {
                    if (u.age >= lo && u.age <= hi) {
                        el.classList.add('targeted');
                    }
                }
            }
            await DBIV.sleep(500);
        } else if (salaryMatch) {
            const lo = parseInt(salaryMatch[1]), hi = parseInt(salaryMatch[2]);
            indexType = 'salary';
            matchedUsers = this.users.filter(u => u.salary >= lo && u.salary <= hi);
            DBIV.log('LOOKUP', `Q${qid}: ZRANGEBYSCORE idx:salary ${lo} ${hi}`);

            for (const u of this.users) {
                const el = document.getElementById('sidx-sal-' + u.id);
                if (el) {
                    if (u.salary >= lo && u.salary <= hi) {
                        el.classList.add('targeted');
                    }
                }
            }
            await DBIV.sleep(500);
        } else if (lexMatch) {
            const from = lexMatch[1], to = lexMatch[2];
            indexType = 'name';
            matchedUsers = this.users.filter(u => u.name >= from && u.name <= to);
            DBIV.log('LOOKUP', `Q${qid}: ZRANGEBYLEX idx:name [${from} [${to}`);
        }

        DBIV.log('FETCH', `Q${qid}: HGETALL for ${matchedUsers.length} user(s)`);
        for (const u of matchedUsers) {
            const row = document.getElementById('suser-' + u.id);
            if (row) {
                row.classList.add('matched');
                setTimeout(() => row.classList.remove('matched'), 1500);
            }
            await DBIV.sleep(150);
        }

        DBIV.addStats(1, matchedUsers.length, 1 + matchedUsers.length, 1 + matchedUsers.length);
        DBIV.log('RESULT', `Q${qid}: ${matchedUsers.length} user(s) found via secondary index`);

        if (DBIV.state.comparisonMode) {
            DBIV.showComparison(
                { pages: 1, rows: matchedUsers.length, time: 1 + matchedUsers.length },
                { pages: 1, rows: this.users.length, time: this.users.length }
            );
        }

        setTimeout(() => {
            document.querySelectorAll('.hash-bucket').forEach(b => b.classList.remove('targeted'));
        }, 1500);

        statusEl.textContent = 'ready';
        statusEl.className = 'index-status ready';
    }
};
