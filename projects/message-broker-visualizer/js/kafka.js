/* ===== Apache Kafka Core Concepts ===== */

MBV.kafka = {};

MBV.kafka.modes = [
    { id: 'partitions', label: 'Partitions', desc: 'Kafka distributes messages across partitions. Strategies: Round-Robin (no key), Key-Based (hash), or Manual. Messages within a partition are strictly ordered.' },
    { id: 'consumer-groups', label: 'Consumer Groups', desc: 'Each partition is consumed by exactly one consumer in a group. Groups are independent. Offset is tracked per-group.' },
    { id: 'retention', label: 'Retention & Replay', desc: 'Kafka stores messages in an ordered log. Consumer group reads independently and can seek offset back for replay. Messages are not deleted after reading.' },
    { id: 'exactly-once', label: 'Exactly-Once', desc: 'Delivery guarantees: at-most-once (acks=0, may lose), at-least-once (acks=1, may duplicate), exactly-once (idempotent producer, no loss or dups).' },
];

MBV.kafka.state = {
    numPartitions: 3,
    replicationFactor: 1,
    partitionStrategy: 'round-robin',
    deliveryMode: 'at-least-once',
    partitions: [],
    rrIndex: 0,
    groups: [],
    retentionSize: 8,
    seqNum: 0,
};

MBV.kafka._resetPartitions = function() {
    const s = MBV.kafka.state;
    s.partitions = [];
    for (let i = 0; i < s.numPartitions; i++) {
        s.partitions.push({ id: i, messages: [], nextOffset: 0 });
    }
    s.rrIndex = 0;
    s.seqNum = 0;
};

MBV.kafka._renderBrokerBody = function() {
    const s = MBV.kafka.state;
    let html = `<div style="margin-bottom:8px;font-size:13px;font-weight:700;color:var(--mbv-accent)">Topic: events</div>`;
    s.partitions.forEach((p, i) => {
        html += `<div class="partition-row" id="partition-${i}">
            <span class="partition-label">P${i}</span>
            <div class="partition-cells" id="pcells-${i}">`;
        const startOffset = Math.max(0, p.nextOffset - s.retentionSize);
        for (let j = 0; j < s.retentionSize; j++) {
            const offset = startOffset + j;
            const msg = p.messages.find(m => m.offset === offset);
            const filled = msg ? 'filled' : '';
            const text = msg ? offset : '';
            html += `<div class="partition-cell ${filled}" id="cell-${i}-${offset % s.retentionSize}">${text}</div>`;
        }
        html += `</div></div>`;
    });
    document.getElementById('broker-body').innerHTML = html;
};

MBV.kafka._addToPartition = function(partIdx, msgId, key) {
    const s = MBV.kafka.state;
    const p = s.partitions[partIdx];
    const offset = p.nextOffset++;
    p.messages.push({ offset, msgId, key });
    if (p.messages.length > s.retentionSize) {
        p.messages = p.messages.slice(-s.retentionSize);
    }
    MBV.kafka._renderBrokerBody();
    if (s.groups) MBV.kafka._renderGroupOffsets();
    // Highlight cell
    const cellId = `cell-${partIdx}-${offset % MBV.kafka.state.retentionSize}`;
    const cell = document.getElementById(cellId);
    if (cell) {
        cell.classList.add('highlight');
        setTimeout(() => cell.classList.remove('highlight'), 600);
    }
    return offset;
};

/* ---------- Partitions mode ---------- */
MBV.kafka.partitions = {
    init() {
        MBV.kafka._resetPartitions();
        const s = MBV.kafka.state;

        let prodHtml = '';
        ['kafka-prod-a', 'kafka-prod-b'].forEach((pId, i) => {
            const name = i === 0 ? 'Producer A' : 'Producer B';
            prodHtml += `
            <div class="card" id="card-${pId}">
                <span class="port port-right" id="port-${pId}"></span>
                <div class="card-header">
                    <span class="card-icon">\uD83D\uDCE4</span>
                    <span class="card-name">${name}</span>
                </div>
                <div class="mode-switch" id="strategy-switch-${pId}">
                    <button class="mode-switch-btn ${s.partitionStrategy === 'round-robin' ? 'active' : ''}" data-strategy="round-robin">Round-Robin</button>
                    <button class="mode-switch-btn ${s.partitionStrategy === 'key-based' ? 'active' : ''}" data-strategy="key-based">Key-Based</button>
                    <button class="mode-switch-btn ${s.partitionStrategy === 'manual' ? 'active' : ''}" data-strategy="manual">Manual</button>
                </div>
                <div id="key-input-${pId}" style="display:${s.partitionStrategy === 'key-based' ? 'block' : 'none'}">
                    <input type="text" id="pkey-${pId}" placeholder="partition key" value="user_id=1" style="width:100%;padding:4px;font-size:11px;font-family:monospace;border:1px solid var(--mbv-border);border-radius:4px;margin-bottom:2px;">
                    <div class="quick-keys">
                        <button class="quick-key-btn" data-key="user_id=1" data-prod="${pId}">user_id=1</button>
                        <button class="quick-key-btn" data-key="user_id=2" data-prod="${pId}">user_id=2</button>
                        <button class="quick-key-btn" data-key="region=eu" data-prod="${pId}">region=eu</button>
                    </div>
                </div>
                <div id="manual-input-${pId}" style="display:${s.partitionStrategy === 'manual' ? 'block' : 'none'}">
                    <select id="manual-part-${pId}" style="width:100%;padding:4px;font-size:11px;border:1px solid var(--mbv-border);border-radius:4px;margin-bottom:2px;">
                        ${Array.from({length: s.numPartitions}, (_, i) => `<option value="${i}">Partition ${i}</option>`).join('')}
                    </select>
                </div>
                <button class="card-send-btn" id="send-${pId}">Send</button>
                <div class="card-stats">Sent: <span id="sent-${pId}">0</span></div>
            </div>`;
        });
        document.getElementById('producers-col').innerHTML = prodHtml;

        // Settings
        document.getElementById('extra-panels').innerHTML = `
        <div class="kafka-settings">
            <label>Partitions: <select id="kafka-num-parts">${[1,2,3,4].map(n => `<option value="${n}" ${n === s.numPartitions ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
            <label>Replication: <select id="kafka-repl">${[1,2,3].map(n => `<option value="${n}" ${n === s.replicationFactor ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
        </div>`;

        document.getElementById('kafka-num-parts').onchange = (e) => {
            s.numPartitions = parseInt(e.target.value);
            MBV.kafka._resetPartitions();
            this.init();
        };

        MBV.kafka._renderBrokerBody();

        // Simple consumers (no groups in partition mode)
        document.getElementById('consumers-col').innerHTML = `
        <div class="card" id="card-kafka-cons">
            <span class="port port-left" id="port-kafka-cons"></span>
            <div class="card-header">
                <span class="card-icon">\uD83D\uDCE5</span>
                <span class="card-name">Consumer</span>
            </div>
            <div class="card-stats">Received: <span id="count-kafka-cons">0</span></div>
        </div>`;

        // Strategy switching
        document.querySelectorAll('.mode-switch-btn[data-strategy]').forEach(btn => {
            btn.onclick = () => {
                s.partitionStrategy = btn.dataset.strategy;
                document.querySelectorAll('.mode-switch-btn[data-strategy]').forEach(b => b.classList.remove('active'));
                document.querySelectorAll(`.mode-switch-btn[data-strategy="${s.partitionStrategy}"]`).forEach(b => b.classList.add('active'));
                ['kafka-prod-a', 'kafka-prod-b'].forEach(pId => {
                    document.getElementById('key-input-' + pId).style.display = s.partitionStrategy === 'key-based' ? 'block' : 'none';
                    document.getElementById('manual-input-' + pId).style.display = s.partitionStrategy === 'manual' ? 'block' : 'none';
                });
            };
        });

        // Quick keys
        document.querySelectorAll('.quick-key-btn[data-key]').forEach(btn => {
            btn.onclick = () => {
                const input = document.getElementById('pkey-' + btn.dataset.prod);
                if (input) input.value = btn.dataset.key;
            };
        });

        ['kafka-prod-a', 'kafka-prod-b'].forEach(pId => {
            document.getElementById('send-' + pId).onclick = () => this.send(pId);
        });
    },

    async send(prodId) {
        const isError = MBV.state.simulateError;
        if (isError) MBV.state.simulateError = false;

        const s = MBV.kafka.state;
        const id = MBV.nextMsgId();
        let partIdx;
        let keyLabel = '';

        if (s.partitionStrategy === 'round-robin') {
            partIdx = s.rrIndex % s.numPartitions;
            s.rrIndex++;
            keyLabel = `RR\u2192P${partIdx}`;
        } else if (s.partitionStrategy === 'key-based') {
            const key = document.getElementById('pkey-' + prodId).value || 'default';
            partIdx = MBV.hashKey(key) % s.numPartitions;
            keyLabel = `${key}\u2192P${partIdx}`;
        } else {
            partIdx = parseInt(document.getElementById('manual-part-' + prodId).value);
            keyLabel = `P${partIdx}`;
        }

        MBV.state.sent++;
        const sentEl = document.getElementById('sent-' + prodId);
        sentEl.textContent = parseInt(sentEl.textContent) + 1;
        MBV.log('SEND', `msg_id=${id} ${keyLabel} \u2192 topic events`);
        MBV.updateStats();

        const prodPort = document.getElementById('port-' + prodId);
        const partRow = document.getElementById('partition-' + partIdx);
        await MBV.animateDot(prodPort, partRow, { label: keyLabel, duration: 450 });

        const offset = MBV.kafka._addToPartition(partIdx, id, keyLabel);
        MBV.state.queued++;
        MBV.updateStats();
        MBV.log('ROUTE', `msg_id=${id} \u2192 P${partIdx} offset=${offset}`);

        await MBV.animateInsideQueue(document.getElementById('partition-' + partIdx), { label: `P${partIdx}:${offset}`, duration: 550 });

        const deliver = async () => {
            MBV.state.queued--;
            MBV.updateStats();
            const pRow = document.getElementById('partition-' + partIdx);
            const consPort = document.getElementById('port-kafka-cons');
            if (pRow && consPort) {
                await MBV.animateDot(pRow, consPort, { label: `P${partIdx}:${offset}`, duration: 400 });
                if (isError) {
                    const card = document.getElementById('card-kafka-cons');
                    MBV.flashCard(card, 'red');
                    MBV.addBadge(card, `FAIL P${partIdx}:${offset}`, 'nack');
                    MBV.log('ERROR', `msg_id=${id} P${partIdx}:${offset} consumer FAILED \u2014 offset not advanced`);
                    MBV.updateStats();
                } else {
                    MBV.state.delivered++;
                    const countEl = document.getElementById('count-kafka-cons');
                    if (countEl) countEl.textContent = parseInt(countEl.textContent) + 1;
                    MBV.log('RECV', `msg_id=${id} P${partIdx}:${offset} delivered`);
                    MBV.updateStats();
                }
            }
        };

        if (MBV.state.paused) {
            MBV.enqueueDelivery(deliver);
        } else {
            await deliver();
        }
    }
};

/* ---------- Consumer Groups mode ---------- */
MBV.kafka.consumerGroups = {
    groups: [
        { id: 'ga', name: 'Group A', color: '#0078D4', consumers: ['ga-c1', 'ga-c2', 'ga-c3'], assignment: {}, offsets: {} },
        { id: 'gb', name: 'Group B', color: '#6c5ce7', consumers: ['gb-c1', 'gb-c2'], assignment: {}, offsets: {} },
    ],

    init() {
        MBV.kafka._resetPartitions();
        MBV.kafka.state.groups = this.groups;

        // Producers
        document.getElementById('producers-col').innerHTML = `
        <div class="card" id="card-kgp-prod">
            <span class="port port-right" id="port-kgp-prod"></span>
            <div class="card-header">
                <span class="card-icon">\uD83D\uDCE4</span>
                <span class="card-name">Producer</span>
            </div>
            <button class="card-send-btn" id="send-kgp-prod">Send</button>
            <div class="card-stats">Sent: <span id="sent-kgp-prod">0</span></div>
        </div>`;

        MBV.kafka._renderBrokerBody();

        // Assign partitions to consumers
        this._rebalance();

        // Consumer groups
        let consumersHtml = '';
        this.groups.forEach(g => {
            consumersHtml += `<div class="consumer-group" style="border-color:${g.color}">
                <div class="consumer-group-header">
                    <span>${g.name}</span>
                    <button class="rebalance-btn" data-group="${g.id}">Rebalance</button>
                </div>`;
            g.consumers.forEach((cId, ci) => {
                const assigned = Object.entries(g.assignment).filter(([, v]) => v === ci).map(([k]) => 'P' + k).join(', ') || 'none';
                consumersHtml += `
                <div class="card" id="card-${cId}">
                    <span class="port port-left" id="port-${cId}"></span>
                    <div class="card-header">
                        <span class="card-icon">\uD83D\uDCE5</span>
                        <span class="card-name">${cId}</span>
                    </div>
                    <div class="consumer-assignment" id="assign-${cId}">[${assigned}]</div>
                    <div class="card-stats">Received: <span id="count-${cId}">0</span></div>
                </div>`;
            });
            consumersHtml += '</div>';
        });
        document.getElementById('consumers-col').innerHTML = consumersHtml;

        // Lag display
        let extraHtml = `<div class="kafka-settings">`;
        this.groups.forEach(g => {
            extraHtml += `<span style="color:${g.color};font-weight:700;font-size:12px">${g.name} lag: <span id="lag-${g.id}">0</span></span>`;
        });
        extraHtml += `</div>`;
        document.getElementById('extra-panels').innerHTML = extraHtml;

        // Events
        document.getElementById('send-kgp-prod').onclick = () => this.send();
        document.querySelectorAll('.rebalance-btn').forEach(btn => {
            btn.onclick = () => this.triggerRebalance(btn.dataset.group);
        });
    },

    _rebalance() {
        const s = MBV.kafka.state;
        this.groups.forEach(g => {
            g.assignment = {};
            g.offsets = {};
            for (let i = 0; i < s.numPartitions; i++) {
                g.assignment[i] = i % g.consumers.length;
                g.offsets[i] = 0;
            }
        });
    },

    triggerRebalance(groupId) {
        const g = this.groups.find(gr => gr.id === groupId);
        if (!g) return;
        g.consumers.forEach(cId => {
            const card = document.getElementById('card-' + cId);
            if (card) card.classList.add('rebalancing');
            setTimeout(() => card && card.classList.remove('rebalancing'), 1500);
        });

        // Shuffle assignment
        const s = MBV.kafka.state;
        const shuffled = [...Array(s.numPartitions).keys()].sort(() => Math.random() - 0.5);
        shuffled.forEach((pi, i) => {
            g.assignment[pi] = i % g.consumers.length;
        });

        MBV.log('ROUTE', `[REBALANCE] ${g.name} partitions reassigned`);

        // Update labels
        setTimeout(() => {
            g.consumers.forEach((cId, ci) => {
                const assigned = Object.entries(g.assignment).filter(([, v]) => v === ci).map(([k]) => 'P' + k).join(', ') || 'none';
                const el = document.getElementById('assign-' + cId);
                if (el) el.textContent = '[' + assigned + ']';
            });
        }, 500);
    },

    async send() {
        const isError = MBV.state.simulateError;
        if (isError) MBV.state.simulateError = false;

        const s = MBV.kafka.state;
        const id = MBV.nextMsgId();
        const partIdx = s.rrIndex % s.numPartitions;
        s.rrIndex++;

        MBV.state.sent++;
        const sentEl = document.getElementById('sent-kgp-prod');
        sentEl.textContent = parseInt(sentEl.textContent) + 1;
        MBV.log('SEND', `msg_id=${id} \u2192 P${partIdx}`);
        MBV.updateStats();

        const prodPort = document.getElementById('port-kgp-prod');
        const partRow = document.getElementById('partition-' + partIdx);
        await MBV.animateDot(prodPort, partRow, { label: `#${id}`, duration: 400 });

        const offset = MBV.kafka._addToPartition(partIdx, id, '');
        MBV.state.queued++;
        MBV.updateStats();
        MBV.log('ROUTE', `msg_id=${id} \u2192 P${partIdx} offset=${offset}`);

        const failGroupIdx = isError ? Math.floor(Math.random() * this.groups.length) : -1;

        const deliver = async () => {
            MBV.state.queued--;
            MBV.updateStats();
            for (let gi = 0; gi < this.groups.length; gi++) {
                const g = this.groups[gi];
                const consIdx = g.assignment[partIdx];
                if (consIdx === undefined) continue;
                const cId = g.consumers[consIdx];

                await MBV.sleep(200);
                /* Fetch elements AFTER sleep — concurrent sends may re-render partitions */
                const consPort = document.getElementById('port-' + cId);
                const pRow = document.getElementById('partition-' + partIdx);
                if (!consPort || !pRow) continue;

                await MBV.animateDot(pRow, consPort, { label: `P${partIdx}:${offset}`, color: g.color, duration: 350 });

                if (gi === failGroupIdx) {
                    const card = document.getElementById('card-' + cId);
                    MBV.flashCard(card, 'red');
                    MBV.addBadge(card, `FAIL P${partIdx}:${offset}`, 'nack');
                    MBV.log('ERROR', `msg_id=${id} \u2192 ${g.name}/${cId} FAILED \u2014 offset not advanced, lag increases`);
                    MBV.updateStats();
                    continue;
                }

                g.offsets[partIdx] = offset + 1;
                MBV.state.delivered++;
                const countEl = document.getElementById('count-' + cId);
                if (countEl) countEl.textContent = parseInt(countEl.textContent) + 1;
                MBV.log('RECV', `msg_id=${id} \u2192 ${g.name}/${cId}`);
                MBV.updateStats();
            }
            MBV.kafka._renderGroupOffsets();
        };

        if (MBV.state.paused) {
            MBV.enqueueDelivery(deliver);
        } else {
            await deliver();
        }
    }
};

MBV.kafka._renderGroupOffsets = function() {
    const s = MBV.kafka.state;
    if (!s.groups) return;
    let totalLag = {};
    s.groups.forEach(g => {
        totalLag[g.id] = 0;
        s.partitions.forEach((p, i) => {
            const groupOffset = (g.offsets && g.offsets[i]) || 0;
            const lag = p.nextOffset - groupOffset;
            totalLag[g.id] += lag;
        });
        const lagEl = document.getElementById('lag-' + g.id);
        if (lagEl) {
            lagEl.textContent = totalLag[g.id];
            lagEl.parentElement.className = totalLag[g.id] > 5 ? 'lag-indicator warning' : '';
        }
    });
};

/* ---------- Retention & Replay mode ---------- */
MBV.kafka.retention = {
    init() {
        MBV.kafka._resetPartitions();
        MBV.kafka.state.groups = MBV.kafka.consumerGroups.groups;
        MBV.kafka.consumerGroups._rebalance();

        document.getElementById('producers-col').innerHTML = `
        <div class="card" id="card-ret-prod">
            <span class="port port-right" id="port-ret-prod"></span>
            <div class="card-header">
                <span class="card-icon">\uD83D\uDCE4</span>
                <span class="card-name">Producer</span>
            </div>
            <button class="card-send-btn" id="send-ret-prod">Send</button>
            <div class="card-stats">Sent: <span id="sent-ret-prod">0</span></div>
        </div>`;

        MBV.kafka._renderBrokerBody();

        let consumersHtml = '';
        MBV.kafka.state.groups.forEach(g => {
            consumersHtml += `<div class="consumer-group" style="border-color:${g.color}">
                <div class="consumer-group-header">
                    <span>${g.name}</span>
                    <button class="replay-btn" data-group="${g.id}">\u23EE Replay from offset</button>
                </div>`;
            g.consumers.forEach(cId => {
                consumersHtml += `
                <div class="card" id="card-${cId}">
                    <span class="port port-left" id="port-${cId}"></span>
                    <div class="card-header">
                        <span class="card-icon">\uD83D\uDCE5</span>
                        <span class="card-name">${cId}</span>
                    </div>
                    <div class="card-stats">Received: <span id="count-${cId}">0</span></div>
                </div>`;
            });
            consumersHtml += '</div>';
        });
        document.getElementById('consumers-col').innerHTML = consumersHtml;

        document.getElementById('extra-panels').innerHTML = `
        <div class="kafka-settings">
            <div class="retention-controls">
                <button class="retention-btn" id="ret-decrease">- Retention</button>
                <span id="ret-size">${MBV.kafka.state.retentionSize}</span>
                <button class="retention-btn" id="ret-increase">+ Retention</button>
            </div>
        </div>`;

        document.getElementById('ret-decrease').onclick = () => {
            if (MBV.kafka.state.retentionSize > 4) {
                MBV.kafka.state.retentionSize--;
                document.getElementById('ret-size').textContent = MBV.kafka.state.retentionSize;
                MBV.kafka._renderBrokerBody();
            }
        };
        document.getElementById('ret-increase').onclick = () => {
            if (MBV.kafka.state.retentionSize < 16) {
                MBV.kafka.state.retentionSize++;
                document.getElementById('ret-size').textContent = MBV.kafka.state.retentionSize;
                MBV.kafka._renderBrokerBody();
            }
        };

        document.getElementById('send-ret-prod').onclick = () => this.send();

        document.querySelectorAll('.replay-btn').forEach(btn => {
            btn.onclick = () => this.replay(btn.dataset.group);
        });
    },

    async send() {
        const isError = MBV.state.simulateError;
        if (isError) MBV.state.simulateError = false;

        const s = MBV.kafka.state;
        const id = MBV.nextMsgId();
        const partIdx = s.rrIndex % s.numPartitions;
        s.rrIndex++;

        MBV.state.sent++;
        const sentEl = document.getElementById('sent-ret-prod');
        sentEl.textContent = parseInt(sentEl.textContent) + 1;
        MBV.updateStats();

        const prodPort = document.getElementById('port-ret-prod');
        const partRow = document.getElementById('partition-' + partIdx);
        await MBV.animateDot(prodPort, partRow, { label: `#${id}`, duration: 400 });

        const offset = MBV.kafka._addToPartition(partIdx, id, '');
        MBV.state.queued++;
        MBV.updateStats();
        MBV.log('ROUTE', `msg_id=${id} \u2192 P${partIdx} offset=${offset}`);

        const failGroupIdx = isError ? Math.floor(Math.random() * s.groups.length) : -1;

        const deliver = async () => {
            MBV.state.queued--;
            MBV.updateStats();
            for (let gi = 0; gi < s.groups.length; gi++) {
                const g = s.groups[gi];
                const consIdx = g.assignment[partIdx];
                if (consIdx === undefined) continue;
                const cId = g.consumers[consIdx];
                const consPort = document.getElementById('port-' + cId);
                const pRow = document.getElementById('partition-' + partIdx);
                if (!consPort || !pRow) continue;
                await MBV.animateDot(pRow, consPort, { label: `P${partIdx}:${offset}`, color: g.color, duration: 350 });
                if (gi === failGroupIdx) {
                    const card = document.getElementById('card-' + cId);
                    MBV.flashCard(card, 'red');
                    MBV.addBadge(card, `FAIL P${partIdx}:${offset}`, 'nack');
                    MBV.log('ERROR', `msg_id=${id} ${g.name}/${cId} FAILED \u2014 offset not committed`);
                    MBV.updateStats();
                    continue;
                }
                g.offsets[partIdx] = offset + 1;
                MBV.state.delivered++;
                const countEl = document.getElementById('count-' + cId);
                if (countEl) countEl.textContent = parseInt(countEl.textContent) + 1;
                MBV.updateStats();
            }
            MBV.kafka._renderGroupOffsets();
        };

        if (MBV.state.paused) {
            MBV.enqueueDelivery(deliver);
        } else {
            await deliver();
        }
    },

    async replay(groupId) {
        const s = MBV.kafka.state;
        const g = s.groups.find(gr => gr.id === groupId);
        if (!g) return;
        const offsetStr = prompt('Enter offset to replay from (0 = beginning):', '0');
        if (offsetStr === null) return;
        const targetOffset = parseInt(offsetStr) || 0;

        // Reset offsets
        for (let i = 0; i < s.numPartitions; i++) {
            g.offsets[i] = targetOffset;
        }
        MBV.log('SEEK', `${g.name} seeking all partitions to offset ${targetOffset}`);

        // Replay messages from that offset
        for (let pi = 0; pi < s.numPartitions; pi++) {
            const p = s.partitions[pi];
            const consIdx = g.assignment[pi];
            if (consIdx === undefined) continue;
            const cId = g.consumers[consIdx];
            const consPort = document.getElementById('port-' + cId);
            const partRow = document.getElementById('partition-' + pi);
            if (!consPort || !partRow) continue;

            for (let oi = targetOffset; oi < p.nextOffset; oi++) {
                await MBV.sleep(200);
                await MBV.animateDot(partRow, consPort, { label: `P${pi}:${oi}`, color: g.color, duration: 300 });
                g.offsets[pi] = oi + 1;
                MBV.state.delivered++;
                const countEl = document.getElementById('count-' + cId);
                if (countEl) countEl.textContent = parseInt(countEl.textContent) + 1;
                MBV.updateStats();
            }
        }
        MBV.kafka._renderGroupOffsets();
        MBV.log('SEEK', `${g.name} replay complete`);
    }
};

/* ---------- Exactly-Once mode ---------- */
MBV.kafka.exactlyOnce = {
    init() {
        MBV.kafka._resetPartitions();
        const s = MBV.kafka.state;
        s.deliveryMode = 'at-most-once';

        document.getElementById('producers-col').innerHTML = `
        <div class="card" id="card-eo-prod">
            <span class="port port-right" id="port-eo-prod"></span>
            <div class="card-header">
                <span class="card-icon">\uD83D\uDCE4</span>
                <span class="card-name">Producer</span>
            </div>
            <div class="mode-switch">
                <button class="mode-switch-btn active" data-delivery="at-most-once">At-Most-Once</button>
                <button class="mode-switch-btn" data-delivery="at-least-once">At-Least-Once</button>
                <button class="mode-switch-btn" data-delivery="exactly-once">Exactly-Once</button>
            </div>
            <button class="card-send-btn" id="send-eo-prod">Send</button>
            <div class="card-stats">Sent: <span id="sent-eo-prod">0</span> | Lost: <span id="lost-eo-prod">0</span> | Dups: <span id="dups-eo-prod">0</span></div>
        </div>`;

        MBV.kafka._renderBrokerBody();

        document.getElementById('consumers-col').innerHTML = `
        <div class="card" id="card-eo-cons">
            <span class="port port-left" id="port-eo-cons"></span>
            <div class="card-header">
                <span class="card-icon">\uD83D\uDCE5</span>
                <span class="card-name">Consumer</span>
            </div>
            <div class="card-stats">Received: <span id="count-eo-cons">0</span></div>
        </div>`;

        document.getElementById('extra-panels').innerHTML = '';

        document.querySelectorAll('.mode-switch-btn[data-delivery]').forEach(btn => {
            btn.onclick = () => {
                s.deliveryMode = btn.dataset.delivery;
                document.querySelectorAll('.mode-switch-btn[data-delivery]').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            };
        });

        document.getElementById('send-eo-prod').onclick = () => this.send();
    },

    async send() {
        const isError = MBV.state.simulateError;
        if (isError) MBV.state.simulateError = false;

        const s = MBV.kafka.state;
        const id = MBV.nextMsgId();
        s.seqNum++;
        const seqNum = s.seqNum;
        const partIdx = s.rrIndex % s.numPartitions;
        s.rrIndex++;
        const deliveryMode = s.deliveryMode;

        MBV.state.sent++;
        const sentEl = document.getElementById('sent-eo-prod');
        sentEl.textContent = parseInt(sentEl.textContent) + 1;
        MBV.updateStats();

        const prodPort = document.getElementById('port-eo-prod');
        const partRow = document.getElementById('partition-' + partIdx);

        // Determine loss/dup before animation
        const lost = deliveryMode === 'at-most-once' && Math.random() < 0.2;
        const dup = deliveryMode === 'at-least-once' && Math.random() < 0.2;
        const seqLabel = `seq:${seqNum}`;
        const label = deliveryMode === 'exactly-once' ? `#${id} ${seqLabel}` : `#${id}`;

        await MBV.animateDot(prodPort, partRow, { label, duration: 400 });

        if (isError) {
            const card = document.getElementById('card-eo-prod');
            MBV.flashCard(card, 'red');
            MBV.addBadge(card, `REJECTED #${id}`, 'nack');
            MBV.log('ERROR', `msg_id=${id} broker REJECTED write \u2014 message NOT committed`);
            return;
        }

        if (lost) {
            const lostEl = document.getElementById('lost-eo-prod');
            if (lostEl) lostEl.textContent = parseInt(lostEl.textContent) + 1;
            MBV.log('ERROR', `msg_id=${id} LOST (acks=0, no confirmation)`);
            return;
        }

        if (deliveryMode === 'exactly-once') {
            MBV.kafka._addToPartition(partIdx, id, seqLabel);
        } else {
            MBV.kafka._addToPartition(partIdx, id, '');
        }

        MBV.state.queued++;
        MBV.updateStats();

        const deliver = async () => {
            MBV.state.queued--;
            MBV.updateStats();
            const pRow = document.getElementById('partition-' + partIdx);
            const consPort = document.getElementById('port-eo-cons');
            if (!pRow || !consPort) return;

            await MBV.animateDot(pRow, consPort, { label, duration: 350 });
            MBV.state.delivered++;

            if (deliveryMode === 'exactly-once') {
                MBV.log('ACK', `msg_id=${id} ${seqLabel} exactly-once delivery`);
            }

            if (dup) {
                const dupsEl = document.getElementById('dups-eo-prod');
                if (dupsEl) dupsEl.textContent = parseInt(dupsEl.textContent) + 1;
                MBV.log('ROUTE', `msg_id=${id} DUPLICATE (retry delivered twice)`);
                await MBV.sleep(300);
                await MBV.animateDot(pRow, consPort, { label: `#${id} dup`, color: '#e67e22', duration: 350 });
                MBV.state.delivered++;
            }

            const countEl = document.getElementById('count-eo-cons');
            if (countEl) countEl.textContent = parseInt(countEl.textContent) + 1;
            MBV.log('RECV', `msg_id=${id} delivered to consumer`);
            MBV.updateStats();
        };

        if (MBV.state.paused) {
            MBV.enqueueDelivery(deliver);
        } else {
            await deliver();
        }
    }
};
