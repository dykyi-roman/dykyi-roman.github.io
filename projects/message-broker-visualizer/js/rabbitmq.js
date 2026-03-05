/* ===== RabbitMQ Tutorials 1-7 ===== */

MBV.rabbitmq = {};

MBV.rabbitmq.modes = [
    { id: 'hello', label: '1. Hello World', desc: 'P \u2192 Queue \u2192 C. Producer writes to a named queue, Consumer reads from it. One to one.' },
    { id: 'work', label: '2. Work Queues', desc: 'Work Queue distributes tasks among workers via round-robin. Each message is processed by exactly one worker. Used for parallel processing of heavy tasks.' },
    { id: 'pubsub', label: '3. Pub/Sub', desc: 'Fanout Exchange broadcasts every message to all subscribers simultaneously. Used for logging, cache invalidation, realtime updates.' },
    { id: 'routing', label: '4. Routing', desc: 'Direct Exchange delivers messages only to queues with exact binding key match. Routing key is set by the producer.' },
    { id: 'topics', label: '5. Topics', desc: 'Topic Exchange matches routing key by patterns: * \u2014 exactly one word, # \u2014 any number of words. Flexible event filtering by hierarchy.' },
    { id: 'rpc', label: '6. RPC', desc: 'RPC over queue: client sends a request with correlation_id and reply_to queue. Server processes and replies. Client waits for response in its temporary queue.' },
    { id: 'confirms', label: '7. Confirms', desc: 'Publisher Confirms \u2014 broker acknowledges each message write via ACK/NACK. Guarantees at-least-once delivery on the producer side.' },
];

/* ---------- Tutorial 1: Hello World ---------- */
MBV.rabbitmq.hello = {
    workers: [],
    queueMessages: 0,

    init() {
        this.queueMessages = 0;
        this.workers = [];

        document.getElementById('producers-col').innerHTML = MBV.rabbitmq._producerCard('sender', 'Sender', '\uD83D\uDCE4');
        document.getElementById('broker-body').innerHTML = `
            <div class="queue-node" id="queue-hello">
                <span class="port port-left" id="q-hello-port-l"></span>
                <span class="queue-name">hello</span>
                <span class="queue-count" id="q-hello-count">0</span>
                <span class="port port-right" id="q-hello-port-r"></span>
            </div>`;
        document.getElementById('consumers-col').innerHTML = MBV.rabbitmq._consumerCard('receiver', 'Receiver', '\uD83D\uDCE5');
        document.getElementById('extra-panels').innerHTML = '';

        document.getElementById('send-sender').onclick = () => this.send();
    },

    async send() {
        const id = MBV.nextMsgId();
        MBV.state.sent++;
        MBV.log('SEND', `msg_id=${id} \u2192 queue "hello"`);
        MBV.updateStats();

        const prodPort = document.getElementById('port-sender');
        const qPortL = document.getElementById('q-hello-port-l');

        await MBV.animateDot(prodPort, qPortL, { label: `#${id}`, duration: 450 });

        this.queueMessages++;
        MBV.state.queued++;
        document.getElementById('q-hello-count').textContent = this.queueMessages;
        MBV.updateStats();
        MBV.log('ROUTE', `msg_id=${id} enqueued in "hello" (${this.queueMessages} pending)`);

        if (MBV.state.confirmsEnabled) {
            MBV.rabbitmq._sendConfirm(prodPort, id);
        }

        const deliver = async () => {
            await MBV.sleep(300);
            this.queueMessages--;
            MBV.state.queued--;
            const countEl = document.getElementById('q-hello-count');
            if (countEl) countEl.textContent = this.queueMessages;

            const qPortR = document.getElementById('q-hello-port-r');
            const consPort = document.getElementById('port-receiver');
            if (!qPortR || !consPort) return;
            await MBV.animateDot(qPortR, consPort, { label: `#${id}`, duration: 450 });
            MBV.state.delivered++;
            MBV.log('RECV', `msg_id=${id} delivered to Receiver`);
            MBV.updateStats();
        };

        if (MBV.state.paused) {
            MBV.enqueueDelivery(deliver);
        } else {
            await deliver();
        }
    }
};

/* ---------- Tutorial 2: Work Queues ---------- */
MBV.rabbitmq.work = {
    workers: [
        { id: 'w1', name: 'Worker 1', busy: false, processed: 0 },
        { id: 'w2', name: 'Worker 2', busy: false, processed: 0 },
        { id: 'w3', name: 'Worker 3', busy: false, processed: 0 },
    ],
    queueMessages: 0,
    pendingQueue: [],

    init() {
        this.queueMessages = 0;
        this.pendingQueue = [];
        this.workers.forEach(w => { w.busy = false; w.processed = 0; });

        document.getElementById('producers-col').innerHTML = MBV.rabbitmq._producerCard('taskprod', 'Task Producer', '\uD83D\uDCCB');
        document.getElementById('broker-body').innerHTML = `
            <div class="queue-node" id="queue-task">
                <span class="port port-left" id="q-task-port-l"></span>
                <span class="queue-name">task_queue</span>
                <span class="queue-count" id="q-task-count">0</span>
                <span class="port port-right" id="q-task-port-r"></span>
            </div>`;

        let consumersHtml = '';
        this.workers.forEach((w, i) => {
            consumersHtml += `
            <div class="card" id="card-${w.id}" style="position:relative;">
                <span class="rr-indicator" id="rr-${w.id}">\u25B6</span>
                <span class="port port-left" id="port-${w.id}"></span>
                <div class="card-header">
                    <span class="card-icon">\u2699\uFE0F</span>
                    <span class="card-name">${w.name}</span>
                </div>
                <div class="card-stats"><span class="card-status ready" id="status-${w.id}">ready</span> Processed: <span id="count-${w.id}">0</span></div>
                <div class="card-progress"><div class="card-progress-fill" id="progress-${w.id}"></div></div>
                <div class="card-badges" id="badges-${w.id}"></div>
            </div>`;
        });
        document.getElementById('consumers-col').innerHTML = consumersHtml;
        document.getElementById('extra-panels').innerHTML = '';

        document.getElementById('send-taskprod').onclick = () => this.send();
        this._highlightNextWorker();
        MBV.onResume = () => this._processQueue();
    },

    _highlightNextWorker() {
        this.workers.forEach(w => {
            const el = document.getElementById('rr-' + w.id);
            if (el) el.classList.remove('active');
        });
        const next = this.workers[MBV.state.roundRobinIndex % this.workers.length];
        const el = document.getElementById('rr-' + next.id);
        if (el) el.classList.add('active');
    },

    _getNextWorker() {
        const start = MBV.state.roundRobinIndex;
        for (let i = 0; i < this.workers.length; i++) {
            const idx = (start + i) % this.workers.length;
            if (!this.workers[idx].busy) {
                MBV.state.roundRobinIndex = idx + 1;
                this._highlightNextWorker();
                return this.workers[idx];
            }
        }
        return null;
    },

    _processQueue() {
        if (MBV.state.paused) return;
        if (this.pendingQueue.length === 0) return;
        const worker = this._getNextWorker();
        if (!worker) return;

        const msgId = this.pendingQueue.shift();
        this.queueMessages--;
        MBV.state.queued--;
        document.getElementById('q-task-count').textContent = this.queueMessages;
        MBV.updateStats();

        this._deliverToWorker(worker, msgId);
    },

    async _deliverToWorker(worker, msgId) {
        worker.busy = true;
        const statusEl = document.getElementById('status-' + worker.id);
        const progressEl = document.getElementById('progress-' + worker.id);
        statusEl.textContent = 'busy';
        statusEl.className = 'card-status busy';

        const qPortR = document.getElementById('q-task-port-r');
        const consPort = document.getElementById('port-' + worker.id);
        await MBV.animateDot(qPortR, consPort, { label: `#${msgId}`, duration: 400 });

        MBV.state.delivered++;
        MBV.log('RECV', `msg_id=${msgId} \u2192 ${worker.name}`);
        MBV.updateStats();

        const processingTime = 1200 + Math.random() * 800;
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const pct = Math.min(elapsed / processingTime, 1) * 100;
            progressEl.style.width = pct + '%';
            if (pct < 100) requestAnimationFrame(animate);
            else {
                worker.busy = false;
                worker.processed++;
                statusEl.textContent = 'ready';
                statusEl.className = 'card-status ready';
                document.getElementById('count-' + worker.id).textContent = worker.processed;
                progressEl.style.width = '0%';
                this._processQueue();
            }
        };
        requestAnimationFrame(animate);
    },

    async send() {
        const id = MBV.nextMsgId();
        MBV.state.sent++;
        MBV.log('SEND', `msg_id=${id} \u2192 task_queue`);
        MBV.updateStats();

        const prodPort = document.getElementById('port-taskprod');
        const qPortL = document.getElementById('q-task-port-l');
        await MBV.animateDot(prodPort, qPortL, { label: `#${id}`, duration: 450 });

        this.queueMessages++;
        MBV.state.queued++;
        document.getElementById('q-task-count').textContent = this.queueMessages;
        MBV.updateStats();
        MBV.log('ROUTE', `msg_id=${id} enqueued (${this.queueMessages} pending)`);

        if (MBV.state.confirmsEnabled) {
            MBV.rabbitmq._sendConfirm(prodPort, id);
        }

        this.pendingQueue.push(id);
        if (!MBV.state.paused) {
            this._processQueue();
        }
    }
};

/* ---------- Tutorial 3: Publish/Subscribe (Fanout) ---------- */
MBV.rabbitmq.pubsub = {
    consumers: [
        { id: 'log-svc', name: 'Log Service', icon: '\uD83D\uDCDD' },
        { id: 'cache-svc', name: 'Cache Service', icon: '\uD83D\uDCBE' },
        { id: 'notify-svc', name: 'Notification Service', icon: '\uD83D\uDD14' },
        { id: 'analytics-svc', name: 'Analytics Service', icon: '\uD83D\uDCC8' },
    ],

    init() {
        let prodHtml = MBV.rabbitmq._producerCard('pub1', 'Publisher 1', '\uD83D\uDCE4');
        prodHtml += MBV.rabbitmq._producerCard('pub2', 'Publisher 2', '\uD83D\uDCE4');
        document.getElementById('producers-col').innerHTML = prodHtml;

        let brokerHtml = `
            <div class="exchange-node" id="exchange-fanout">
                <span class="port port-left" id="ex-fanout-port-l"></span>
                <div class="exchange-type">fanout</div>
                <div class="exchange-name">logs</div>
                <span class="port port-right" id="ex-fanout-port-r"></span>
            </div>`;

        this.consumers.forEach(c => {
            brokerHtml += `
            <div class="queue-node" id="queue-${c.id}" style="margin-left:20px;">
                <span class="port port-left" id="q-${c.id}-port-l"></span>
                <span class="queue-name">amq.gen-${c.id.slice(0,4)}</span>
                <span class="queue-count" id="q-${c.id}-count">0</span>
                <span class="port port-right" id="q-${c.id}-port-r"></span>
            </div>`;
        });
        document.getElementById('broker-body').innerHTML = brokerHtml;

        let consumersHtml = '';
        this.consumers.forEach(c => {
            consumersHtml += `
            <div class="card" id="card-${c.id}">
                <span class="port port-left" id="port-${c.id}"></span>
                <div class="card-header">
                    <span class="card-icon">${c.icon}</span>
                    <span class="card-name">${c.name}</span>
                </div>
                <div class="card-stats">Received: <span id="count-${c.id}">0</span></div>
                <div class="card-progress"><div class="card-progress-fill" id="progress-${c.id}"></div></div>
                <div class="card-badges" id="badges-${c.id}"></div>
            </div>`;
        });
        document.getElementById('consumers-col').innerHTML = consumersHtml;
        document.getElementById('extra-panels').innerHTML = '';

        document.getElementById('send-pub1').onclick = () => this.send('pub1');
        document.getElementById('send-pub2').onclick = () => this.send('pub2');
    },

    async send(prodId) {
        const id = MBV.nextMsgId();
        MBV.state.sent++;
        MBV.log('SEND', `msg_id=${id} from ${prodId} \u2192 fanout exchange`);
        MBV.updateStats();

        const prodPort = document.getElementById('port-' + prodId);
        const exPortL = document.getElementById('ex-fanout-port-l');
        await MBV.animateDot(prodPort, exPortL, { label: `#${id}`, duration: 400 });

        if (MBV.state.confirmsEnabled) {
            MBV.rabbitmq._sendConfirm(prodPort, id);
        }

        MBV.state.queued++;
        MBV.updateStats();
        MBV.log('ROUTE', `msg_id=${id} broadcast to ${this.consumers.length} queues`);

        const deliver = async () => {
            MBV.state.queued--;
            MBV.updateStats();
            const promises = this.consumers.map(async c => {
                const qPortL = document.getElementById('q-' + c.id + '-port-l');
                const exPortR = document.getElementById('ex-fanout-port-r');
                if (!qPortL || !exPortR) return;
                await MBV.animateDot(exPortR, qPortL, { label: `#${id}`, duration: 300 });

                const qPortR = document.getElementById('q-' + c.id + '-port-r');
                const consPort = document.getElementById('port-' + c.id);
                if (!qPortR || !consPort) return;
                await MBV.animateDot(qPortR, consPort, { label: `#${id}`, duration: 350 });

                MBV.state.delivered++;
                const countEl = document.getElementById('count-' + c.id);
                if (countEl) countEl.textContent = parseInt(countEl.textContent) + 1;
                MBV.log('RECV', `msg_id=${id} \u2192 ${c.name}`);
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

/* ---------- Tutorial 4: Routing (Direct Exchange) ---------- */
MBV.rabbitmq.routing = {
    consumers: [
        { id: 'err-handler', name: 'Error Handler', icon: '\u274C', binding: 'error' },
        { id: 'warn-monitor', name: 'Warning Monitor', icon: '\u26A0\uFE0F', binding: 'warning' },
        { id: 'info-logger', name: 'Info Logger', icon: '\u2139\uFE0F', binding: 'info' },
    ],
    routingKeys: ['error', 'warning', 'info'],

    init() {
        let prodHtml = '';
        ['app-logger', 'db-logger'].forEach((pId, i) => {
            const name = i === 0 ? 'App Logger' : 'DB Logger';
            prodHtml += `
            <div class="card" id="card-${pId}">
                <span class="port port-right" id="port-${pId}"></span>
                <div class="card-header">
                    <span class="card-icon">\uD83D\uDCE4</span>
                    <span class="card-name">${name}</span>
                </div>
                <div class="routing-selector">
                    <select id="rkey-${pId}">
                        ${this.routingKeys.map(k => `<option value="${k}">${k}</option>`).join('')}
                    </select>
                </div>
                <button class="card-send-btn" id="send-${pId}">Send</button>
                <div class="card-stats">Sent: <span id="sent-${pId}">0</span></div>
                <div class="card-badges" id="badges-${pId}"></div>
            </div>`;
        });
        document.getElementById('producers-col').innerHTML = prodHtml;

        let brokerHtml = `
            <div class="exchange-node" id="exchange-direct">
                <span class="port port-left" id="ex-direct-port-l"></span>
                <div class="exchange-type">direct</div>
                <div class="exchange-name">logs_direct</div>
                <span class="port port-right" id="ex-direct-port-r"></span>
            </div>`;

        this.consumers.forEach(c => {
            brokerHtml += `
            <div class="queue-node" id="queue-${c.id}" style="margin-left:20px;">
                <span class="port port-left" id="q-${c.id}-port-l"></span>
                <span class="queue-name">${c.binding}_queue</span>
                <span class="queue-binding">${c.binding}</span>
                <span class="queue-count" id="q-${c.id}-count">0</span>
                <span class="port port-right" id="q-${c.id}-port-r"></span>
            </div>`;
        });
        document.getElementById('broker-body').innerHTML = brokerHtml;

        let consumersHtml = '';
        this.consumers.forEach(c => {
            consumersHtml += `
            <div class="card" id="card-${c.id}">
                <span class="port port-left" id="port-${c.id}"></span>
                <div class="card-header">
                    <span class="card-icon">${c.icon}</span>
                    <span class="card-name">${c.name}</span>
                </div>
                <div class="card-meta">binding: <span class="key-label">${c.binding}</span></div>
                <div class="card-stats">Received: <span id="count-${c.id}">0</span></div>
                <div class="card-badges" id="badges-${c.id}"></div>
            </div>`;
        });
        document.getElementById('consumers-col').innerHTML = consumersHtml;
        document.getElementById('extra-panels').innerHTML = '';

        ['app-logger', 'db-logger'].forEach(pId => {
            document.getElementById('send-' + pId).onclick = () => this.send(pId);
        });
    },

    async send(prodId) {
        const rkey = document.getElementById('rkey-' + prodId).value;
        const id = MBV.nextMsgId();
        MBV.state.sent++;
        const sentEl = document.getElementById('sent-' + prodId);
        sentEl.textContent = parseInt(sentEl.textContent) + 1;
        MBV.log('SEND', `msg_id=${id} routing_key="${rkey}" \u2192 direct exchange`);
        MBV.updateStats();

        const prodPort = document.getElementById('port-' + prodId);
        const exPortL = document.getElementById('ex-direct-port-l');
        await MBV.animateDot(prodPort, exPortL, { label: rkey, duration: 400 });

        if (MBV.state.confirmsEnabled) {
            MBV.rabbitmq._sendConfirm(prodPort, id);
        }

        const matched = this.consumers.filter(c => c.binding === rkey);
        const unmatched = this.consumers.filter(c => c.binding !== rkey);

        unmatched.forEach(c => {
            const card = document.getElementById('card-' + c.id);
            if (card) { card.style.opacity = '0.4'; setTimeout(() => { card.style.opacity = '1'; }, 600); }
        });

        matched.forEach(c => {
            const bindingEl = document.querySelector(`#queue-${c.id} .queue-binding`);
            if (bindingEl) {
                bindingEl.style.background = '#d4edda';
                bindingEl.style.color = '#155724';
                setTimeout(() => { bindingEl.style.background = ''; bindingEl.style.color = ''; }, 800);
            }
            MBV.log('ROUTE', `msg_id=${id} matched binding="${c.binding}"`);
        });

        MBV.state.queued++;
        MBV.updateStats();

        const deliver = async () => {
            MBV.state.queued--;
            MBV.updateStats();
            for (const c of matched) {
                const exPortR = document.getElementById('ex-direct-port-r');
                const qPortL = document.getElementById('q-' + c.id + '-port-l');
                if (!exPortR || !qPortL) continue;
                await MBV.animateDot(exPortR, qPortL, { label: rkey, duration: 300 });

                const qPortR = document.getElementById('q-' + c.id + '-port-r');
                const consPort = document.getElementById('port-' + c.id);
                if (!qPortR || !consPort) continue;
                await MBV.animateDot(qPortR, consPort, { label: `#${id}`, duration: 350 });

                MBV.state.delivered++;
                const countEl = document.getElementById('count-' + c.id);
                if (countEl) countEl.textContent = parseInt(countEl.textContent) + 1;
                MBV.log('RECV', `msg_id=${id} \u2192 ${c.name}`);
                MBV.updateStats();
            }
        };

        if (MBV.state.paused) {
            MBV.enqueueDelivery(deliver);
        } else {
            await deliver();
        }
    }
};

/* ---------- Tutorial 5: Topics ---------- */
MBV.rabbitmq.topics = {
    consumers: [
        { id: 'inventory', name: 'Inventory Service', icon: '\uD83D\uDCE6', patterns: ['orders.#', 'payments.#'] },
        { id: 'email', name: 'Email Worker', icon: '\uD83D\uDCE7', patterns: ['*.notifications', 'orders.created'] },
        { id: 'analytics', name: 'Analytics DB', icon: '\uD83D\uDCC8', patterns: ['#.tracked', 'payments.*'] },
        { id: 'audit', name: 'Audit Logger', icon: '\uD83D\uDD0D', patterns: ['#'] },
    ],
    quickKeys: ['orders.eu.created', 'payments.failed', 'user.login', 'orders.created', 'chat.notifications', 'payments.tracked'],

    init() {
        let prodHtml = '';
        ['topic-pub1', 'topic-pub2'].forEach((pId, i) => {
            const name = i === 0 ? 'Service A' : 'Service B';
            prodHtml += `
            <div class="card" id="card-${pId}">
                <span class="port port-right" id="port-${pId}"></span>
                <div class="card-header">
                    <span class="card-icon">\uD83D\uDCE4</span>
                    <span class="card-name">${name}</span>
                </div>
                <div class="routing-selector">
                    <input type="text" id="rkey-${pId}" placeholder="routing.key.here" value="orders.eu.created">
                </div>
                <div class="quick-keys">
                    ${this.quickKeys.map(k => `<button class="quick-key-btn" data-key="${k}" data-prod="${pId}">${k}</button>`).join('')}
                </div>
                <button class="card-send-btn" id="send-${pId}">Send</button>
                <div class="card-stats">Sent: <span id="sent-${pId}">0</span></div>
                <div class="card-badges" id="badges-${pId}"></div>
            </div>`;
        });
        document.getElementById('producers-col').innerHTML = prodHtml;

        document.getElementById('broker-body').innerHTML = `
            <div class="exchange-node" id="exchange-topic">
                <span class="port port-left" id="ex-topic-port-l"></span>
                <div class="exchange-type">topic</div>
                <div class="exchange-name">events_topic</div>
                <span class="port port-right" id="ex-topic-port-r"></span>
            </div>`;

        let consumersHtml = '';
        this.consumers.forEach(c => {
            const tags = c.patterns.map(p => `<span class="sub-tag" data-pattern="${p}" id="tag-${c.id}-${p.replace(/[^a-z0-9]/gi,'_')}">${p} <span class="remove-sub" data-consumer="${c.id}" data-pattern="${p}">\u00D7</span></span>`).join('');
            consumersHtml += `
            <div class="card" id="card-${c.id}">
                <span class="port port-left" id="port-${c.id}"></span>
                <div class="card-header">
                    <span class="card-icon">${c.icon}</span>
                    <span class="card-name">${c.name}</span>
                </div>
                <div class="card-subs" id="subs-${c.id}">${tags}<button class="add-sub-btn" data-consumer="${c.id}">+</button></div>
                <div class="card-stats">Received: <span id="count-${c.id}">0</span></div>
                <div class="card-badges" id="badges-${c.id}"></div>
            </div>`;
        });
        document.getElementById('consumers-col').innerHTML = consumersHtml;
        document.getElementById('extra-panels').innerHTML = '';

        // Quick key buttons
        document.querySelectorAll('.quick-key-btn').forEach(btn => {
            btn.onclick = () => {
                const input = document.getElementById('rkey-' + btn.dataset.prod);
                input.value = btn.dataset.key;
            };
        });

        // Remove subscription
        document.querySelectorAll('.remove-sub').forEach(btn => {
            btn.onclick = (e) => {
                e.stopPropagation();
                const cId = btn.dataset.consumer;
                const pat = btn.dataset.pattern;
                const consumer = this.consumers.find(c => c.id === cId);
                if (consumer) {
                    consumer.patterns = consumer.patterns.filter(p => p !== pat);
                    btn.parentElement.remove();
                }
            };
        });

        // Add subscription
        document.querySelectorAll('.add-sub-btn').forEach(btn => {
            btn.onclick = () => {
                const cId = btn.dataset.consumer;
                const pat = prompt('Enter pattern (e.g. orders.*)');
                if (!pat) return;
                const consumer = this.consumers.find(c => c.id === cId);
                if (consumer) {
                    consumer.patterns.push(pat);
                    const tag = document.createElement('span');
                    tag.className = 'sub-tag';
                    tag.dataset.pattern = pat;
                    tag.innerHTML = `${pat} <span class="remove-sub" data-consumer="${cId}" data-pattern="${pat}">\u00D7</span>`;
                    tag.querySelector('.remove-sub').onclick = (e) => {
                        e.stopPropagation();
                        consumer.patterns = consumer.patterns.filter(p => p !== pat);
                        tag.remove();
                    };
                    const subsEl = document.getElementById('subs-' + cId);
                    subsEl.insertBefore(tag, btn);
                }
            };
        });

        ['topic-pub1', 'topic-pub2'].forEach(pId => {
            document.getElementById('send-' + pId).onclick = () => this.send(pId);
        });
    },

    async send(prodId) {
        const rkey = document.getElementById('rkey-' + prodId).value.trim();
        if (!rkey || !/^[a-zA-Z0-9.*#]+(\.[a-zA-Z0-9.*#]+)*$/.test(rkey)) {
            MBV.log('ERROR', `Invalid routing key: "${rkey}"`);
            return;
        }
        const id = MBV.nextMsgId();
        MBV.state.sent++;
        const sentEl = document.getElementById('sent-' + prodId);
        sentEl.textContent = parseInt(sentEl.textContent) + 1;
        MBV.log('SEND', `msg_id=${id} routing_key="${rkey}" \u2192 topic exchange`);
        MBV.updateStats();

        const prodPort = document.getElementById('port-' + prodId);
        const exPortL = document.getElementById('ex-topic-port-l');
        await MBV.animateDot(prodPort, exPortL, { label: rkey, duration: 400 });

        if (MBV.state.confirmsEnabled) {
            MBV.rabbitmq._sendConfirm(prodPort, id);
        }

        const matchedConsumers = [];
        this.consumers.forEach(c => {
            let matched = false;
            c.patterns.forEach(p => {
                if (MBV.matchTopic(p, rkey)) {
                    matched = true;
                    const tagEl = document.querySelector(`#subs-${c.id} .sub-tag[data-pattern="${p}"]`);
                    if (tagEl) {
                        tagEl.classList.add('matched');
                        setTimeout(() => tagEl.classList.remove('matched'), 1000);
                    }
                }
            });
            if (matched) matchedConsumers.push(c);
            else {
                const card = document.getElementById('card-' + c.id);
                if (card) { card.style.opacity = '0.4'; setTimeout(() => { card.style.opacity = '1'; }, 600); }
            }
        });

        MBV.state.queued++;
        MBV.updateStats();
        MBV.log('ROUTE', `msg_id=${id} matched ${matchedConsumers.length} consumer(s)`);

        const deliver = async () => {
            MBV.state.queued--;
            MBV.updateStats();
            const promises = matchedConsumers.map(async c => {
                const exPortR = document.getElementById('ex-topic-port-r');
                const consPort = document.getElementById('port-' + c.id);
                if (!exPortR || !consPort) return;
                await MBV.animateDot(exPortR, consPort, { label: `#${id}`, duration: 450 });

                MBV.state.delivered++;
                const countEl = document.getElementById('count-' + c.id);
                if (countEl) countEl.textContent = parseInt(countEl.textContent) + 1;
                MBV.log('RECV', `msg_id=${id} \u2192 ${c.name}`);
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

/* ---------- Tutorial 6: RPC ---------- */
MBV.rabbitmq.rpc = {
    replies: 0,

    init() {
        this.replies = 0;
        document.getElementById('producers-col').innerHTML = `
        <div class="card" id="card-rpc-client">
            <span class="port port-right" id="port-rpc-client"></span>
            <div class="card-header">
                <span class="card-icon">\uD83D\uDCBB</span>
                <span class="card-name">RPC Client</span>
            </div>
            <button class="card-send-btn" id="send-rpc-client">Send Request</button>
            <div class="card-stats">Sent: <span id="sent-rpc-client">0</span> | Replies: <span id="replies-rpc-client">0</span></div>
            <div class="card-badges" id="badges-rpc-client"></div>
        </div>`;

        document.getElementById('broker-body').innerHTML = `
            <div class="queue-node" id="queue-rpc">
                <span class="port port-left" id="q-rpc-port-l"></span>
                <span class="queue-name">rpc_queue</span>
                <span class="queue-count" id="q-rpc-count">0</span>
                <span class="port port-right" id="q-rpc-port-r"></span>
            </div>`;

        document.getElementById('consumers-col').innerHTML = `
        <div class="card" id="card-rpc-server">
            <span class="port port-left" id="port-rpc-server"></span>
            <div class="card-header">
                <span class="card-icon">\u2699\uFE0F</span>
                <span class="card-name">RPC Server</span>
            </div>
            <div class="card-stats">Processed: <span id="count-rpc-server">0</span></div>
            <div class="card-progress"><div class="card-progress-fill" id="progress-rpc-server"></div></div>
            <div class="card-badges" id="badges-rpc-server"></div>
        </div>`;

        document.getElementById('extra-panels').innerHTML = '<div id="reply-queues"></div>';

        document.getElementById('send-rpc-client').onclick = () => this.send();
    },

    async send() {
        const id = MBV.nextMsgId();
        const corrId = Math.random().toString(16).slice(2, 6);
        MBV.state.sent++;
        const sentEl = document.getElementById('sent-rpc-client');
        sentEl.textContent = parseInt(sentEl.textContent) + 1;
        MBV.log('SEND', `msg_id=${id} corr_id=${corrId} \u2192 rpc_queue`);
        MBV.updateStats();

        // Create reply queue element
        const rqEl = document.createElement('div');
        rqEl.className = 'reply-queue-item';
        rqEl.id = 'rq-' + corrId;
        rqEl.innerHTML = `<span class="reply-queue-name">reply_queue \u00B7 ${corrId}</span><span class="reply-queue-status" id="rq-status-${corrId}">waiting...</span>`;
        const replyQueuesEl = document.getElementById('reply-queues');
        if (replyQueuesEl) replyQueuesEl.appendChild(rqEl);

        // Phase 1: Request to queue
        const clientPort = document.getElementById('port-rpc-client');
        const qPortL = document.getElementById('q-rpc-port-l');
        await MBV.animateDot(clientPort, qPortL, { label: `req \u00B7 ${corrId}`, duration: 400 });

        MBV.state.queued++;
        MBV.updateStats();

        const deliver = async () => {
            MBV.state.queued--;
            MBV.updateStats();

            const qPortR = document.getElementById('q-rpc-port-r');
            const serverPort = document.getElementById('port-rpc-server');
            if (!qPortR || !serverPort) return;
            await MBV.animateDot(qPortR, serverPort, { label: `req \u00B7 ${corrId}`, duration: 400 });

            // Phase 2: Processing
            const statusEl = document.getElementById('rq-status-' + corrId);
            if (statusEl) statusEl.textContent = 'processing...';
            MBV.log('ROUTE', `corr_id=${corrId} processing by RPC Server`);

            const progressEl = document.getElementById('progress-rpc-server');
            const card = document.getElementById('card-rpc-server');
            if (card) card.style.boxShadow = '0 0 10px rgba(0,120,212,0.3)';

            const procTime = 800 + Math.random() * 400;
            const startT = Date.now();
            await new Promise(resolve => {
                const anim = () => {
                    const pct = Math.min((Date.now() - startT) / procTime, 1) * 100;
                    if (progressEl) progressEl.style.width = pct + '%';
                    if (pct < 100) requestAnimationFrame(anim);
                    else resolve();
                };
                requestAnimationFrame(anim);
            });
            if (card) card.style.boxShadow = '';
            if (progressEl) progressEl.style.width = '0%';

            const countEl = document.getElementById('count-rpc-server');
            if (countEl) countEl.textContent = parseInt(countEl.textContent) + 1;

            // Phase 3: Reply
            if (statusEl) statusEl.textContent = 'reply received \u2713';
            const cPort = document.getElementById('port-rpc-client');
            if (serverPort && cPort) {
                await MBV.animateDot(serverPort, cPort, { label: `reply \u00B7 ${corrId}`, cssClass: 'reply-dot', duration: 500 });
            }

            this.replies++;
            const repliesEl = document.getElementById('replies-rpc-client');
            if (repliesEl) repliesEl.textContent = this.replies;
            MBV.state.delivered++;
            MBV.addBadge(document.getElementById('card-rpc-client'), `\u21A9 reply \u00B7 ${corrId} \u2713`, 'reply');
            MBV.log('REPLY', `corr_id=${corrId} reply delivered to RPC Client`);
            MBV.updateStats();

            // Fade out reply queue
            setTimeout(() => {
                rqEl.style.opacity = '0';
                setTimeout(() => rqEl.remove(), 500);
            }, 1500);
        };

        if (MBV.state.paused) {
            MBV.enqueueDelivery(deliver);
        } else {
            await deliver();
        }
    }
};

/* ---------- Tutorial 7: Publisher Confirms ---------- */
MBV.rabbitmq.confirms = {
    acks: 0,
    nacks: 0,

    init() {
        this.acks = 0;
        this.nacks = 0;

        document.getElementById('producers-col').innerHTML = `
        <div class="card" id="card-confirm-prod">
            <span class="port port-right" id="port-confirm-prod"></span>
            <div class="card-header">
                <span class="card-icon">\uD83D\uDCE4</span>
                <span class="card-name">Producer</span>
            </div>
            <button class="card-send-btn" id="send-confirm-prod">Send Message</button>
            <div class="card-stats">ACK: <span id="ack-count">0</span> | NACK: <span id="nack-count">0</span></div>
            <div class="card-badges" id="badges-confirm-prod"></div>
        </div>`;

        document.getElementById('broker-body').innerHTML = `
            <div class="queue-node" id="queue-confirm">
                <span class="port port-left" id="q-confirm-port-l"></span>
                <span class="queue-name">messages</span>
                <span class="queue-count" id="q-confirm-count">0</span>
                <span class="port port-right" id="q-confirm-port-r"></span>
            </div>`;

        document.getElementById('consumers-col').innerHTML = MBV.rabbitmq._consumerCard('confirm-cons', 'Consumer', '\uD83D\uDCE5');
        document.getElementById('extra-panels').innerHTML = '';

        // Force confirms on
        document.getElementById('toggle-confirms').checked = true;
        MBV.state.confirmsEnabled = true;

        document.getElementById('send-confirm-prod').onclick = () => this.send();
    },

    async send() {
        const id = MBV.nextMsgId();
        const isError = MBV.state.simulateError;
        if (isError) MBV.state.simulateError = false;

        MBV.state.sent++;
        MBV.log('SEND', `msg_id=${id} \u2192 queue "messages"`);
        MBV.updateStats();

        const prodPort = document.getElementById('port-confirm-prod');
        const qPortL = document.getElementById('q-confirm-port-l');
        const prodCard = document.getElementById('card-confirm-prod');

        await MBV.animateDot(prodPort, qPortL, { label: `#${id}`, duration: 450 });

        MBV.state.queued++;
        MBV.updateStats();

        const deliver = async () => {
            MBV.state.queued--;
            MBV.updateStats();
            await MBV.sleep(300);

            const pPort = document.getElementById('port-confirm-prod');
            const qL = document.getElementById('q-confirm-port-l');
            const pCard = document.getElementById('card-confirm-prod');

            if (isError) {
                // NACK
                this.nacks++;
                const nackEl = document.getElementById('nack-count');
                if (nackEl) nackEl.textContent = this.nacks;
                MBV.flashCard(pCard, 'red');
                MBV.addBadge(pCard, `NACK \u2717 #${id}`, 'nack');
                if (qL && pPort) await MBV.animateDot(qL, pPort, { label: 'NACK \u2717', cssClass: 'nack-dot', duration: 400 });
                MBV.log('CONFIRM', `msg_id=${id} \u2192 NACK \u2717 \u00B7 message dropped`);
                const statusEl = document.getElementById('broker-status');
                if (statusEl) {
                    statusEl.textContent = 'error';
                    statusEl.className = 'broker-status error';
                    setTimeout(() => { statusEl.textContent = 'live'; statusEl.className = 'broker-status live'; }, 1500);
                }
            } else {
                // ACK
                this.acks++;
                const ackEl = document.getElementById('ack-count');
                if (ackEl) ackEl.textContent = this.acks;
                MBV.flashCard(pCard, 'green');
                MBV.addBadge(pCard, `ACK \u2713 #${id}`, 'ack');
                if (qL && pPort) MBV.animateDot(qL, pPort, { label: 'ACK \u2713', cssClass: 'ack-dot', duration: 400 });
                MBV.log('CONFIRM', `msg_id=${id} \u2192 ACK \u2713`);

                // Deliver to consumer in parallel
                const qPortR = document.getElementById('q-confirm-port-r');
                const consPort = document.getElementById('port-confirm-cons');
                if (qPortR && consPort) {
                    await MBV.animateDot(qPortR, consPort, { label: `#${id}`, duration: 450 });
                    MBV.state.delivered++;
                    MBV.log('RECV', `msg_id=${id} \u2192 Consumer`);
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

/* ---------- Shared helpers ---------- */
MBV.rabbitmq._producerCard = function(id, name, icon) {
    return `
    <div class="card" id="card-${id}">
        <span class="port port-right" id="port-${id}"></span>
        <div class="card-header">
            <span class="card-icon">${icon}</span>
            <span class="card-name">${name}</span>
        </div>
        <button class="card-send-btn" id="send-${id}">Send</button>
        <div class="card-stats">Sent: <span id="sent-${id}">0</span></div>
        <div class="card-badges" id="badges-${id}"></div>
    </div>`;
};

MBV.rabbitmq._consumerCard = function(id, name, icon) {
    return `
    <div class="card" id="card-${id}">
        <span class="port port-left" id="port-${id}"></span>
        <div class="card-header">
            <span class="card-icon">${icon}</span>
            <span class="card-name">${name}</span>
        </div>
        <div class="card-stats">Received: <span id="count-${id}">0</span></div>
        <div class="card-progress"><div class="card-progress-fill" id="progress-${id}"></div></div>
        <div class="card-badges" id="badges-${id}"></div>
    </div>`;
};

MBV.rabbitmq._sendConfirm = async function(prodPort, msgId) {
    if (!MBV.state.confirmsEnabled) return;
    if (MBV.state.mode === 'confirms') return; // confirms mode handles its own
    const broker = document.getElementById('q-hello-port-l') || document.getElementById('ex-fanout-port-l') || document.getElementById('ex-direct-port-l') || document.getElementById('ex-topic-port-l') || document.getElementById('q-task-port-l') || document.getElementById('q-rpc-port-l');
    if (!broker) return;
    await MBV.sleep(300);
    const prodCard = prodPort.closest('.card');
    MBV.flashCard(prodCard, 'green');
    MBV.addBadge(prodCard, `ACK \u2713 #${msgId}`, 'ack');
    MBV.animateDot(broker, prodPort, { label: 'ACK \u2713', cssClass: 'ack-dot', duration: 400 });
    MBV.log('CONFIRM', `msg_id=${msgId} \u2192 ACK \u2713`);
};
