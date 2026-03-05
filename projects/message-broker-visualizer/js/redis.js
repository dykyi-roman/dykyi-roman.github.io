/* ===== Redis Pub/Sub, Pattern Pub/Sub, Streams, Event Sourcing ===== */

MBV.redis = {};

MBV.redis.modes = [
    { id: 'pubsub', label: 'Pub/Sub', desc: 'Redis Pub/Sub \u2014 fire-and-forget. Messages are not stored. If a subscriber is disconnected at the time of sending, it will not receive the message. Suitable for realtime events without guarantees.' },
    { id: 'pattern', label: 'Pattern Sub', desc: 'Redis PSUBSCRIBE matches channels by glob patterns: * (any chars), ? (one char), [abc] (one of). Allows subscribing to multiple channels at once.' },
    { id: 'streams', label: 'Streams', desc: 'Redis Streams \u2014 persistent event log with consumer groups. Unlike Pub/Sub, messages are stored and available for re-reading. Supports XACK for at-least-once guarantees.' },
    { id: 'eventsourcing', label: 'Event Sourcing', desc: 'Event Sourcing: system state is not stored directly \u2014 it is reconstructed by replaying events. Redis Stream stores an immutable log. Rebuild replays the full history.' },
];

MBV.redis.state = {
    channels: ['notifications', 'chat:room1', 'alerts', 'events:created'],
    subscribers: [],
    streamEntries: [],
    streamNextId: 1,
    esState: { orders: 0, totalAmount: 0, lastEvent: 'none', activeOrders: [] },
};

/* ---------- Pub/Sub mode ---------- */
MBV.redis.pubsub = {
    subs: [
        { id: 'rsub1', name: 'Sub 1', icon: '\uD83D\uDCE5', channel: 'notifications', connected: true, received: 0 },
        { id: 'rsub2', name: 'Sub 2', icon: '\uD83D\uDCE5', channel: 'chat:room1', connected: true, received: 0 },
        { id: 'rsub3', name: 'Sub 3', icon: '\uD83D\uDCE5', channel: 'alerts', connected: true, received: 0 },
        { id: 'rsub4', name: 'Sub 4', icon: '\uD83D\uDCE5', channel: 'events:created', connected: true, received: 0 },
    ],

    init() {
        this.subs.forEach(s => { s.connected = true; s.received = 0; });
        const channels = MBV.redis.state.channels;

        // Producers
        let prodHtml = '';
        ['rpub1', 'rpub2', 'rpub3'].forEach((pId, i) => {
            prodHtml += `
            <div class="card" id="card-${pId}">
                <span class="port port-right" id="port-${pId}"></span>
                <div class="card-header">
                    <span class="card-icon">\uD83D\uDCE4</span>
                    <span class="card-name">Publisher ${i+1}</span>
                </div>
                <div class="routing-selector">
                    <select id="chan-${pId}">
                        ${channels.map(c => `<option value="${c}">${c}</option>`).join('')}
                    </select>
                </div>
                <button class="card-send-btn" id="send-${pId}">PUBLISH</button>
                <div class="card-stats">Sent: <span id="sent-${pId}">0</span></div>
            </div>`;
        });
        document.getElementById('producers-col').innerHTML = prodHtml;

        // Channels in broker
        let brokerHtml = '';
        channels.forEach(ch => {
            const subsCount = this.subs.filter(s => s.channel === ch && s.connected).length;
            brokerHtml += `
            <div class="channel-row" id="channel-${ch.replace(/[^a-z0-9]/gi,'_')}">
                <span class="port port-left" id="ch-${ch.replace(/[^a-z0-9]/gi,'_')}-port-l"></span>
                <span class="channel-name">${ch}</span>
                <span class="channel-subs-count" id="chcount-${ch.replace(/[^a-z0-9]/gi,'_')}">${subsCount} subs</span>
                <span class="port port-right" id="ch-${ch.replace(/[^a-z0-9]/gi,'_')}-port-r"></span>
            </div>`;
        });
        document.getElementById('broker-body').innerHTML = brokerHtml;

        // Subscribers
        let consumersHtml = '';
        this.subs.forEach(s => {
            consumersHtml += `
            <div class="card ${s.connected ? '' : 'disconnected'}" id="card-${s.id}">
                <span class="port port-left" id="port-${s.id}"></span>
                <div class="card-header">
                    <span class="card-icon">${s.icon}</span>
                    <span class="card-name">${s.name}</span>
                    <button class="toggle-connect-btn ${s.connected ? '' : 'disconnected'}" id="toggle-${s.id}">${s.connected ? 'Disconnect' : 'Connect'}</button>
                </div>
                <div class="card-meta">SUBSCRIBE <span class="key-label">${s.channel}</span></div>
                <div class="card-stats">Received: <span id="count-${s.id}">0</span></div>
                <div class="card-badges" id="badges-${s.id}"></div>
            </div>`;
        });
        document.getElementById('consumers-col').innerHTML = consumersHtml;
        document.getElementById('extra-panels').innerHTML = '';

        // Connect/Disconnect
        this.subs.forEach(s => {
            document.getElementById('toggle-' + s.id).onclick = () => {
                s.connected = !s.connected;
                const card = document.getElementById('card-' + s.id);
                const btn = document.getElementById('toggle-' + s.id);
                card.classList.toggle('disconnected', !s.connected);
                btn.classList.toggle('disconnected', !s.connected);
                btn.textContent = s.connected ? 'Disconnect' : 'Connect';
                this._updateChannelCounts();
            };
        });

        // Send buttons
        ['rpub1', 'rpub2', 'rpub3'].forEach(pId => {
            document.getElementById('send-' + pId).onclick = () => this.send(pId);
        });
    },

    _updateChannelCounts() {
        MBV.redis.state.channels.forEach(ch => {
            const subsCount = this.subs.filter(s => s.channel === ch && s.connected).length;
            const el = document.getElementById('chcount-' + ch.replace(/[^a-z0-9]/gi, '_'));
            if (el) el.textContent = subsCount + ' subs';
        });
    },

    async send(prodId) {
        const channel = document.getElementById('chan-' + prodId).value;
        const chKey = channel.replace(/[^a-z0-9]/gi, '_');
        const id = MBV.nextMsgId();
        MBV.state.sent++;
        const sentEl = document.getElementById('sent-' + prodId);
        sentEl.textContent = parseInt(sentEl.textContent) + 1;
        MBV.log('SEND', `msg_id=${id} PUBLISH "${channel}"`);
        MBV.updateStats();

        const prodPort = document.getElementById('port-' + prodId);
        const chPortL = document.getElementById('ch-' + chKey + '-port-l');
        await MBV.animateDot(prodPort, chPortL, { label: channel, duration: 300 });

        const activeSubs = this.subs.filter(s => s.channel === channel && s.connected);

        if (activeSubs.length === 0) {
            MBV.log('ERROR', `msg_id=${id} no subscribers on "${channel}" \u2014 message lost \uD83D\uDDD1`);
            return;
        }

        MBV.state.queued++;
        MBV.updateStats();

        const deliver = async () => {
            MBV.state.queued--;
            MBV.updateStats();
            const chPortR = document.getElementById('ch-' + chKey + '-port-r');
            if (!chPortR) return;
            const promises = activeSubs.map(async s => {
                const consPort = document.getElementById('port-' + s.id);
                if (!consPort) return;
                await MBV.animateDot(chPortR, consPort, { label: `#${id}`, duration: 350 });
                s.received++;
                MBV.state.delivered++;
                const countEl = document.getElementById('count-' + s.id);
                if (countEl) countEl.textContent = s.received;
                MBV.log('RECV', `msg_id=${id} \u2192 ${s.name} (${channel})`);
                MBV.updateStats();
            });
            await Promise.all(promises);
        };

        if (MBV.state.paused) {
            MBV.enqueueDelivery(deliver);
        } else {
            await deliver();
        }
    }
};

/* ---------- Pattern Pub/Sub (PSUBSCRIBE) ---------- */
MBV.redis.pattern = {
    subs: [
        { id: 'psub1', name: 'Sub 1', icon: '\uD83D\uDCE5', mode: 'subscribe', pattern: 'notifications', connected: true, received: 0 },
        { id: 'psub2', name: 'Sub 2', icon: '\uD83D\uDCE5', mode: 'psubscribe', pattern: 'chat:*', connected: true, received: 0 },
        { id: 'psub3', name: 'Sub 3', icon: '\uD83D\uDCE5', mode: 'psubscribe', pattern: 'events:*', connected: true, received: 0 },
        { id: 'psub4', name: 'Sub 4', icon: '\uD83D\uDCE5', mode: 'psubscribe', pattern: '*', connected: true, received: 0 },
    ],

    init() {
        this.subs.forEach(s => { s.connected = true; s.received = 0; });
        const channels = MBV.redis.state.channels;

        // Producers
        let prodHtml = '';
        ['rppub1', 'rppub2'].forEach((pId, i) => {
            prodHtml += `
            <div class="card" id="card-${pId}">
                <span class="port port-right" id="port-${pId}"></span>
                <div class="card-header">
                    <span class="card-icon">\uD83D\uDCE4</span>
                    <span class="card-name">Publisher ${i+1}</span>
                </div>
                <div class="routing-selector">
                    <input type="text" id="chan-${pId}" placeholder="channel name" value="${channels[i]}">
                    <div class="quick-keys">
                        ${channels.map(c => `<button class="quick-key-btn" data-key="${c}" data-prod="${pId}">${c}</button>`).join('')}
                    </div>
                </div>
                <button class="card-send-btn" id="send-${pId}">PUBLISH</button>
                <div class="card-stats">Sent: <span id="sent-${pId}">0</span></div>
            </div>`;
        });
        document.getElementById('producers-col').innerHTML = prodHtml;

        // Channels
        let brokerHtml = '';
        channels.forEach(ch => {
            brokerHtml += `
            <div class="channel-row" id="channel-${ch.replace(/[^a-z0-9]/gi,'_')}">
                <span class="port port-left" id="ch-${ch.replace(/[^a-z0-9]/gi,'_')}-port-l"></span>
                <span class="channel-name">${ch}</span>
                <span class="port port-right" id="ch-${ch.replace(/[^a-z0-9]/gi,'_')}-port-r"></span>
            </div>`;
        });
        document.getElementById('broker-body').innerHTML = brokerHtml;

        // Subscribers with pattern editing
        let consumersHtml = '';
        this.subs.forEach(s => {
            consumersHtml += `
            <div class="card ${s.connected ? '' : 'disconnected'}" id="card-${s.id}">
                <span class="port port-left" id="port-${s.id}"></span>
                <div class="card-header">
                    <span class="card-icon">${s.icon}</span>
                    <span class="card-name">${s.name}</span>
                    <button class="toggle-connect-btn ${s.connected ? '' : 'disconnected'}" id="toggle-${s.id}">${s.connected ? 'Disconnect' : 'Connect'}</button>
                </div>
                <div class="mode-switch" style="margin-bottom:4px">
                    <button class="mode-switch-btn ${s.mode === 'subscribe' ? 'active' : ''}" data-sub="${s.id}" data-mode="subscribe">SUBSCRIBE</button>
                    <button class="mode-switch-btn ${s.mode === 'psubscribe' ? 'active' : ''}" data-sub="${s.id}" data-mode="psubscribe">PSUBSCRIBE</button>
                </div>
                <div class="card-subs">
                    <span class="sub-tag" id="pattern-tag-${s.id}">${s.pattern}</span>
                </div>
                <input type="text" id="pattern-input-${s.id}" value="${s.pattern}" style="width:100%;padding:3px;font-size:10px;font-family:monospace;border:1px solid var(--mbv-border);border-radius:3px;margin-top:2px;">
                <div class="quick-keys" style="margin-top:2px">
                    ${['chat:*', 'events:*:created', 'alerts:?', '*'].map(p => `<button class="quick-key-btn" data-key="${p}" data-sub="${s.id}">${p}</button>`).join('')}
                </div>
                <div class="card-stats">Received: <span id="count-${s.id}">0</span></div>
                <div class="card-badges" id="badges-${s.id}"></div>
            </div>`;
        });
        document.getElementById('consumers-col').innerHTML = consumersHtml;
        document.getElementById('extra-panels').innerHTML = '';

        // Pattern input change
        this.subs.forEach(s => {
            document.getElementById('pattern-input-' + s.id).onchange = (e) => {
                s.pattern = e.target.value;
                document.getElementById('pattern-tag-' + s.id).textContent = s.pattern;
            };
        });

        // Quick pattern buttons
        document.querySelectorAll('.quick-key-btn[data-sub]').forEach(btn => {
            btn.onclick = () => {
                const sId = btn.dataset.sub;
                if (btn.dataset.key) {
                    const sub = this.subs.find(s => s.id === sId);
                    if (sub) {
                        sub.pattern = btn.dataset.key;
                        const input = document.getElementById('pattern-input-' + sId);
                        if (input) input.value = sub.pattern;
                        document.getElementById('pattern-tag-' + sId).textContent = sub.pattern;
                    }
                }
            };
        });

        // Mode switch
        document.querySelectorAll('.mode-switch-btn[data-mode]').forEach(btn => {
            btn.onclick = () => {
                const sId = btn.dataset.sub;
                const sub = this.subs.find(s => s.id === sId);
                if (sub) sub.mode = btn.dataset.mode;
                document.querySelectorAll(`.mode-switch-btn[data-sub="${sId}"]`).forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            };
        });

        // Connect/Disconnect
        this.subs.forEach(s => {
            document.getElementById('toggle-' + s.id).onclick = () => {
                s.connected = !s.connected;
                const card = document.getElementById('card-' + s.id);
                const btn = document.getElementById('toggle-' + s.id);
                card.classList.toggle('disconnected', !s.connected);
                btn.classList.toggle('disconnected', !s.connected);
                btn.textContent = s.connected ? 'Disconnect' : 'Connect';
            };
        });

        // Quick channel buttons for producers
        document.querySelectorAll('.quick-key-btn[data-prod]').forEach(btn => {
            btn.onclick = () => {
                const input = document.getElementById('chan-' + btn.dataset.prod);
                if (input) input.value = btn.dataset.key;
            };
        });

        ['rppub1', 'rppub2'].forEach(pId => {
            document.getElementById('send-' + pId).onclick = () => this.send(pId);
        });
    },

    async send(prodId) {
        const channel = document.getElementById('chan-' + prodId).value.trim();
        if (!channel) return;
        const id = MBV.nextMsgId();
        MBV.state.sent++;
        const sentEl = document.getElementById('sent-' + prodId);
        sentEl.textContent = parseInt(sentEl.textContent) + 1;
        MBV.log('SEND', `msg_id=${id} PUBLISH "${channel}"`);
        MBV.updateStats();

        const prodPort = document.getElementById('port-' + prodId);
        let chKey = channel.replace(/[^a-z0-9]/gi, '_');
        let chEl = document.getElementById('ch-' + chKey + '-port-l');
        if (!chEl) {
            chEl = document.getElementById('broker-body');
        }
        await MBV.animateDot(prodPort, chEl, { label: channel, duration: 300 });

        // Match subscribers
        const matched = this.subs.filter(s => {
            if (!s.connected) return false;
            if (s.mode === 'subscribe') return s.pattern === channel;
            return MBV.matchGlob(s.pattern, channel);
        });

        const unmatched = this.subs.filter(s => s.connected && !matched.includes(s));

        unmatched.forEach(s => {
            const card = document.getElementById('card-' + s.id);
            if (card) { card.style.opacity = '0.4'; setTimeout(() => { card.style.opacity = '1'; }, 600); }
        });

        // Highlight matched tags immediately
        matched.forEach(s => {
            const tag = document.getElementById('pattern-tag-' + s.id);
            if (tag) {
                tag.classList.add('matched');
                setTimeout(() => tag.classList.remove('matched'), 1000);
            }
            if (s.mode === 'psubscribe') {
                MBV.log('PMATCH', `"${channel}" \u2192 pattern "${s.pattern}" matched ${s.name}`);
            }
        });

        if (matched.length === 0) {
            MBV.log('ERROR', `msg_id=${id} no matching subscribers for "${channel}"`);
            return;
        }

        MBV.state.queued++;
        MBV.updateStats();

        const deliver = async () => {
            MBV.state.queued--;
            MBV.updateStats();
            let chPortR = document.getElementById('ch-' + chKey + '-port-r') || document.getElementById('broker-body');

            const promises = matched.map(async s => {
                const consPort = document.getElementById('port-' + s.id);
                if (!consPort || !chPortR) return;
                await MBV.animateDot(chPortR, consPort, { label: `#${id}`, duration: 350 });
                s.received++;
                MBV.state.delivered++;
                const countEl = document.getElementById('count-' + s.id);
                if (countEl) countEl.textContent = s.received;
                MBV.log('RECV', `msg_id=${id} \u2192 ${s.name}`);
                MBV.updateStats();
            });
            await Promise.all(promises);
        };

        if (MBV.state.paused) {
            MBV.enqueueDelivery(deliver);
        } else {
            await deliver();
        }
    }
};

/* ---------- Streams mode ---------- */
MBV.redis.streams = {
    groups: [
        { id: 'sg-a', name: 'Group A', color: '#DC382D', consumers: ['sga-c1', 'sga-c2'], offsets: {}, pending: {} },
        { id: 'sg-b', name: 'Group B', color: '#8b5cf6', consumers: ['sgb-c1'], offsets: {}, pending: {} },
    ],
    rrIndex: {},

    init() {
        MBV.redis.state.streamEntries = [];
        MBV.redis.state.streamNextId = 1;
        this.groups.forEach(g => {
            g.offsets = { 0: 0 };
            g.pending = {};
            g.consumers.forEach(c => { g.pending[c] = []; });
        });
        this.rrIndex = {};
        this.groups.forEach(g => { this.rrIndex[g.id] = 0; });

        // Producer
        document.getElementById('producers-col').innerHTML = `
        <div class="card" id="card-stream-prod">
            <span class="port port-right" id="port-stream-prod"></span>
            <div class="card-header">
                <span class="card-icon">\uD83D\uDCE4</span>
                <span class="card-name">Producer (XADD)</span>
            </div>
            <button class="card-send-btn" id="send-stream-prod">XADD</button>
            <div class="card-stats">Sent: <span id="sent-stream-prod">0</span></div>
        </div>`;

        this._renderStream();

        // Consumer groups
        let consumersHtml = '';
        this.groups.forEach(g => {
            consumersHtml += `<div class="consumer-group" style="border-color:${g.color}">
                <div class="consumer-group-header">
                    <span>${g.name}</span>
                    <button class="replay-btn" data-group="${g.id}">XREAD from 0</button>
                </div>`;
            g.consumers.forEach(cId => {
                consumersHtml += `
                <div class="card" id="card-${cId}">
                    <span class="port port-left" id="port-${cId}"></span>
                    <div class="card-header">
                        <span class="card-icon">\uD83D\uDCE5</span>
                        <span class="card-name">${cId}</span>
                    </div>
                    <div class="card-stats">Received: <span id="count-${cId}">0</span> | Pending: <span id="pending-${cId}">0</span></div>
                    <button class="xack-btn" id="xack-${cId}" data-consumer="${cId}">XACK</button>
                </div>`;
            });
            consumersHtml += '</div>';
        });
        document.getElementById('consumers-col').innerHTML = consumersHtml;
        document.getElementById('extra-panels').innerHTML = '';

        // Events
        document.getElementById('send-stream-prod').onclick = () => this.send();

        document.querySelectorAll('.xack-btn').forEach(btn => {
            btn.onclick = () => this.xack(btn.dataset.consumer);
        });

        document.querySelectorAll('.replay-btn').forEach(btn => {
            btn.onclick = () => this.replay(btn.dataset.group);
        });
    },

    _renderStream() {
        const entries = MBV.redis.state.streamEntries;
        const visible = entries.slice(-10);
        let html = '<div class="stream-log" id="stream-log">';
        visible.forEach(e => {
            const pendingClass = e.pending ? 'pending' : '';
            html += `<div class="stream-entry ${pendingClass}" id="se-${e.id}">
                <div class="stream-entry-id">${e.id}</div>
                <div class="stream-entry-data">${e.data}</div>
            </div>`;
        });
        html += '</div>';
        document.getElementById('broker-body').innerHTML = `
            <div style="margin-bottom:6px;font-size:13px;font-weight:700;color:var(--mbv-accent)">Stream: events</div>
            ${html}`;
    },

    async send() {
        const id = MBV.nextMsgId();
        const streamId = MBV.redis.state.streamNextId++;
        const entryId = `${Date.now()}-${streamId}`.slice(-12);

        MBV.state.sent++;
        const sentEl = document.getElementById('sent-stream-prod');
        sentEl.textContent = parseInt(sentEl.textContent) + 1;
        MBV.log('SEND', `XADD events ${entryId} msg_id=${id}`);
        MBV.updateStats();

        const entry = { id: entryId, data: `msg#${id}`, msgId: id, pending: true, seqIdx: streamId - 1 };
        MBV.redis.state.streamEntries.push(entry);

        const prodPort = document.getElementById('port-stream-prod');
        const brokerBody = document.getElementById('broker-body');
        await MBV.animateDot(prodPort, brokerBody, { label: entryId, duration: 350 });

        this._renderStream();

        MBV.state.queued++;
        MBV.updateStats();

        // Pre-calculate consumer assignments
        const assignments = this.groups.map(g => {
            const consIdx = this.rrIndex[g.id] % g.consumers.length;
            this.rrIndex[g.id]++;
            return { group: g, cId: g.consumers[consIdx] };
        });

        const deliver = async () => {
            MBV.state.queued--;
            MBV.updateStats();
            const bBody = document.getElementById('broker-body');
            for (const { group: g, cId } of assignments) {
                const consPort = document.getElementById('port-' + cId);
                if (!consPort || !bBody) continue;

                await MBV.animateDot(bBody, consPort, { label: entryId, color: g.color, duration: 350 });

                g.pending[cId] = g.pending[cId] || [];
                g.pending[cId].push(entryId);
                MBV.state.delivered++;
                const countEl = document.getElementById('count-' + cId);
                if (countEl) countEl.textContent = parseInt(countEl.textContent) + 1;
                const pendEl = document.getElementById('pending-' + cId);
                if (pendEl) pendEl.textContent = g.pending[cId].length;
                MBV.log('RECV', `XREADGROUP ${g.name}/${cId} \u2192 ${entryId}`);
                MBV.updateStats();
            }
        };

        if (MBV.state.paused) {
            MBV.enqueueDelivery(deliver);
        } else {
            await deliver();
        }
    },

    xack(consumerId) {
        for (const g of this.groups) {
            if (g.pending[consumerId] && g.pending[consumerId].length > 0) {
                const acked = g.pending[consumerId].shift();
                const pendEl = document.getElementById('pending-' + consumerId);
                pendEl.textContent = g.pending[consumerId].length;
                MBV.log('ACK', `XACK ${g.name}/${consumerId} ${acked}`);

                // Un-highlight entry
                const seEl = document.getElementById('se-' + acked);
                if (seEl) seEl.classList.remove('pending');
            }
        }
    },

    async replay(groupId) {
        const g = this.groups.find(gr => gr.id === groupId);
        if (!g) return;
        MBV.log('SEEK', `XREAD from 0 for ${g.name}`);

        const entries = MBV.redis.state.streamEntries;
        for (const entry of entries) {
            const consIdx = this.rrIndex[g.id] % g.consumers.length;
            this.rrIndex[g.id]++;
            const cId = g.consumers[consIdx];
            const consPort = document.getElementById('port-' + cId);
            const brokerBody = document.getElementById('broker-body');
            if (!consPort || !brokerBody) continue;

            await MBV.sleep(200);
            await MBV.animateDot(brokerBody, consPort, { label: entry.id, color: g.color, duration: 250 });

            MBV.state.delivered++;
            const countEl = document.getElementById('count-' + cId);
            countEl.textContent = parseInt(countEl.textContent) + 1;
            MBV.updateStats();
        }
        MBV.log('SEEK', `${g.name} replay complete`);
    }
};

/* ---------- Event Sourcing mode ---------- */
MBV.redis.eventsourcing = {
    eventTypes: ['order.created', 'order.paid', 'order.shipped', 'order.cancelled'],
    eventLog: [],

    init() {
        this.eventLog = [];
        MBV.redis.state.esState = { orders: 0, totalAmount: 0, lastEvent: 'none', activeOrders: [] };
        MBV.redis.state.streamEntries = [];
        MBV.redis.state.streamNextId = 1;

        // Producer with event type selector
        document.getElementById('producers-col').innerHTML = `
        <div class="card" id="card-es-prod">
            <span class="port port-right" id="port-es-prod"></span>
            <div class="card-header">
                <span class="card-icon">\uD83D\uDCE4</span>
                <span class="card-name">Event Producer</span>
            </div>
            <div class="routing-selector">
                <select id="event-type-select">
                    ${this.eventTypes.map(t => `<option value="${t}">${t}</option>`).join('')}
                </select>
            </div>
            <button class="card-send-btn" id="send-es-prod">Emit Event</button>
            <div class="card-stats">Events: <span id="sent-es-prod">0</span></div>
        </div>`;

        this._renderStream();

        // Consumer + State View
        document.getElementById('consumers-col').innerHTML = `
        <div class="card" id="card-es-cons">
            <span class="port port-left" id="port-es-cons"></span>
            <div class="card-header">
                <span class="card-icon">\u2699\uFE0F</span>
                <span class="card-name">Event Processor</span>
            </div>
            <div class="card-stats">Processed: <span id="count-es-cons">0</span></div>
        </div>
        <div class="state-view" id="state-view">
            <h4>Current State</h4>
            <div class="state-entries" id="state-entries">
                <div class="state-entry"><span>orders</span><span id="sv-orders">0</span></div>
                <div class="state-entry"><span>total_amount</span><span id="sv-total">$0</span></div>
                <div class="state-entry"><span>last_event</span><span id="sv-last">none</span></div>
                <div class="state-entry"><span>active_orders</span><span id="sv-active">[]</span></div>
            </div>
        </div>`;

        document.getElementById('extra-panels').innerHTML = `
            <button class="rebuild-btn" id="btn-rebuild">Rebuild State</button>`;

        document.getElementById('send-es-prod').onclick = () => this.send();
        document.getElementById('btn-rebuild').onclick = () => this.rebuildState();
    },

    _renderStream() {
        const entries = MBV.redis.state.streamEntries;
        const visible = entries.slice(-10);
        let html = '<div class="stream-log" id="stream-log">';
        visible.forEach(e => {
            html += `<div class="stream-entry" id="se-${e.id}">
                <div class="stream-entry-id">${e.id}</div>
                <div class="stream-entry-data">${e.data}</div>
            </div>`;
        });
        html += '</div>';
        document.getElementById('broker-body').innerHTML = `
            <div style="margin-bottom:6px;font-size:13px;font-weight:700;color:var(--mbv-accent)">Stream: events</div>
            ${html}`;
    },

    _applyEvent(eventType) {
        const s = MBV.redis.state.esState;
        const orderId = 'ORD-' + (s.orders + 1);

        if (eventType === 'order.created') {
            s.orders++;
            const amount = Math.floor(50 + Math.random() * 200);
            s.totalAmount += amount;
            s.activeOrders.push(orderId);
        } else if (eventType === 'order.paid') {
            // Mark latest as paid (no visible change to active list)
        } else if (eventType === 'order.shipped') {
            // Mark latest as shipped
        } else if (eventType === 'order.cancelled') {
            if (s.activeOrders.length > 0) {
                s.activeOrders.pop();
                s.orders = Math.max(0, s.orders - 1);
            }
        }
        s.lastEvent = eventType;
        this._renderState();
    },

    _renderState() {
        const s = MBV.redis.state.esState;
        document.getElementById('sv-orders').textContent = s.orders;
        document.getElementById('sv-total').textContent = '$' + s.totalAmount;
        document.getElementById('sv-last').textContent = s.lastEvent;
        document.getElementById('sv-active').textContent = s.activeOrders.length > 3 ? `[${s.activeOrders.slice(-3).join(', ')}...]` : `[${s.activeOrders.join(', ')}]`;
    },

    async send() {
        const eventType = document.getElementById('event-type-select').value;
        const id = MBV.nextMsgId();
        const streamId = MBV.redis.state.streamNextId++;
        const entryId = `${streamId}`;

        MBV.state.sent++;
        const sentEl = document.getElementById('sent-es-prod');
        sentEl.textContent = parseInt(sentEl.textContent) + 1;
        MBV.log('SEND', `XADD events ${entryId} type=${eventType}`);
        MBV.updateStats();

        const entry = { id: entryId, data: eventType, type: eventType };
        MBV.redis.state.streamEntries.push(entry);
        this.eventLog.push(entry);

        const prodPort = document.getElementById('port-es-prod');
        const brokerBody = document.getElementById('broker-body');
        await MBV.animateDot(prodPort, brokerBody, { label: eventType, duration: 350 });
        this._renderStream();

        MBV.state.queued++;
        MBV.updateStats();

        const deliver = async () => {
            MBV.state.queued--;
            MBV.updateStats();
            const bBody = document.getElementById('broker-body');
            const consPort = document.getElementById('port-es-cons');
            if (!bBody || !consPort) return;
            await MBV.animateDot(bBody, consPort, { label: eventType, duration: 350 });

            MBV.state.delivered++;
            const countEl = document.getElementById('count-es-cons');
            if (countEl) countEl.textContent = parseInt(countEl.textContent) + 1;
            MBV.updateStats();

            this._applyEvent(eventType);
            MBV.log('RECV', `Event ${eventType} applied to state`);
        };

        if (MBV.state.paused) {
            MBV.enqueueDelivery(deliver);
        } else {
            await deliver();
        }
    },

    async rebuildState() {
        // Reset state
        MBV.redis.state.esState = { orders: 0, totalAmount: 0, lastEvent: 'none', activeOrders: [] };
        this._renderState();
        MBV.log('SEEK', 'Rebuilding state from event log...');

        for (const entry of this.eventLog) {
            await MBV.sleep(400);
            this._applyEvent(entry.type);

            const seEl = document.getElementById('se-' + entry.id);
            if (seEl) {
                seEl.style.background = '#d4edda';
                setTimeout(() => { seEl.style.background = ''; }, 600);
            }
        }

        MBV.log('SEEK', `State rebuilt from ${this.eventLog.length} events`);
    }
};
