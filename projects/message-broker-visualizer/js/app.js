/* ===== Main App: Broker Switching, Mode Tabs, Controls ===== */

(function() {
    'use strict';

    const brokerConfigs = {
        rabbitmq: {
            name: 'RabbitMQ',
            modes: MBV.rabbitmq.modes,
            initMode: function(modeId) {
                const modeMap = {
                    'hello': MBV.rabbitmq.hello,
                    'work': MBV.rabbitmq.work,
                    'pubsub': MBV.rabbitmq.pubsub,
                    'routing': MBV.rabbitmq.routing,
                    'topics': MBV.rabbitmq.topics,
                    'rpc': MBV.rabbitmq.rpc,
                    'confirms': MBV.rabbitmq.confirms,
                };
                if (modeMap[modeId]) modeMap[modeId].init();
            }
        },
        kafka: {
            name: 'Apache Kafka',
            modes: MBV.kafka.modes,
            initMode: function(modeId) {
                const modeMap = {
                    'partitions': MBV.kafka.partitions,
                    'consumer-groups': MBV.kafka.consumerGroups,
                    'retention': MBV.kafka.retention,
                    'exactly-once': MBV.kafka.exactlyOnce,
                };
                if (modeMap[modeId]) modeMap[modeId].init();
            }
        },
        redis: {
            name: 'Redis',
            modes: MBV.redis.modes,
            initMode: function(modeId) {
                const modeMap = {
                    'pubsub': MBV.redis.pubsub,
                    'pattern': MBV.redis.pattern,
                    'streams': MBV.redis.streams,
                    'eventsourcing': MBV.redis.eventsourcing,
                };
                if (modeMap[modeId]) modeMap[modeId].init();
            }
        }
    };

    function updateHash(brokerId, modeId) {
        history.replaceState(null, '', '#' + brokerId + '/' + modeId);
    }

    function readHash() {
        const hash = location.hash.replace('#', '');
        if (!hash) return null;
        const parts = hash.split('/');
        if (parts.length === 2 && brokerConfigs[parts[0]]) {
            const config = brokerConfigs[parts[0]];
            if (config.modes.some(m => m.id === parts[1])) {
                return { broker: parts[0], mode: parts[1] };
            }
        }
        return null;
    }

    function switchBroker(brokerId, modeId) {
        MBV.state.broker = brokerId;
        MBV.setAccentColors(brokerId);

        // Update broker tabs
        document.querySelectorAll('.broker-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.broker === brokerId);
            tab.setAttribute('aria-selected', tab.dataset.broker === brokerId);
        });

        // Update broker header
        const config = brokerConfigs[brokerId];
        document.getElementById('broker-name').textContent = config.name;
        document.getElementById('broker-status').textContent = 'live';
        document.getElementById('broker-status').className = 'broker-status live';

        // Confirm toggle visibility
        const confirmWrap = document.getElementById('confirm-toggle-wrap');
        confirmWrap.style.display = brokerId === 'rabbitmq' ? 'flex' : 'none';

        // Reset state
        MBV.clearAnimations();
        MBV.clearLog();
        MBV.resetStats();

        // Render mode tabs
        renderModeTabs(brokerId);
        switchMode(brokerId, modeId || config.modes[0].id);
    }

    function renderModeTabs(brokerId) {
        const config = brokerConfigs[brokerId];
        const tabsEl = document.getElementById('mode-tabs');
        tabsEl.innerHTML = config.modes.map(m =>
            `<button class="mode-tab" data-mode="${m.id}" role="tab">${m.label}</button>`
        ).join('');

        tabsEl.querySelectorAll('.mode-tab').forEach(tab => {
            tab.onclick = () => switchMode(brokerId, tab.dataset.mode);
        });
    }

    function switchMode(brokerId, modeId) {
        MBV.state.mode = modeId;
        updateHash(brokerId, modeId);
        const config = brokerConfigs[brokerId];
        const modeConfig = config.modes.find(m => m.id === modeId);

        // Update tab active state
        document.querySelectorAll('.mode-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === modeId);
        });

        // Update pattern description
        document.getElementById('pattern-desc').textContent = modeConfig ? modeConfig.desc : '';

        // Reset animations
        MBV.clearAnimations();
        MBV.resetStats();
        MBV.clearLog();

        // Confirm toggle state for confirms mode
        if (brokerId === 'rabbitmq') {
            const toggle = document.getElementById('toggle-confirms');
            if (modeId === 'confirms') {
                toggle.checked = true;
                toggle.disabled = true;
                MBV.state.confirmsEnabled = true;
            } else {
                toggle.disabled = false;
            }
        }

        // Init mode
        config.initMode(modeId);
    }

    function setupControls() {
        // Burst
        document.getElementById('btn-burst').onclick = () => {
            const brokerId = MBV.state.broker;
            const modeId = MBV.state.mode;
            // Find all send buttons and click them
            const sendBtns = document.querySelectorAll('.card-send-btn');
            let delay = 0;
            for (let i = 0; i < 5; i++) {
                sendBtns.forEach(btn => {
                    setTimeout(() => btn.click(), delay);
                });
                delay += 200;
            }
        };

        // Simulate Error
        document.getElementById('btn-error').onclick = () => {
            MBV.state.simulateError = true;
            MBV.log('ERROR', 'Next message will trigger broker error (NACK)');
            const statusEl = document.getElementById('broker-status');
            statusEl.textContent = 'error';
            statusEl.className = 'broker-status error';
            setTimeout(() => {
                statusEl.textContent = 'live';
                statusEl.className = 'broker-status live';
            }, 2000);
        };

        // Pause/Resume
        document.getElementById('btn-pause').onclick = () => {
            MBV.state.paused = !MBV.state.paused;
            const btn = document.getElementById('btn-pause');
            btn.textContent = MBV.state.paused ? '\u25B6 Resume' : '\u23F8 Pause';
            const statusEl = document.getElementById('broker-status');
            if (MBV.state.paused) {
                statusEl.textContent = 'paused';
                statusEl.className = 'broker-status paused';
                MBV.log('ERROR', 'Broker paused \u2014 consumers stopped');
            } else {
                statusEl.textContent = 'live';
                statusEl.className = 'broker-status live';
                MBV.log('ACK', 'Broker resumed \u2014 delivering queued messages');
                MBV.flushDeliveryQueue();
            }
        };

        // Reset
        document.getElementById('btn-reset').onclick = () => {
            switchBroker(MBV.state.broker);
            MBV.log('ACK', 'State reset');
        };

        // Copy / Clear Log
        document.getElementById('btn-copy-log').onclick = () => MBV.copyLog();
        document.getElementById('btn-clear-log').onclick = () => MBV.clearLog();

        // Publisher Confirms toggle
        document.getElementById('toggle-confirms').onchange = (e) => {
            MBV.state.confirmsEnabled = e.target.checked;
            MBV.log(e.target.checked ? 'CONFIRM' : 'ACK', `Publisher Confirms: ${e.target.checked ? 'ON' : 'OFF'}`);
        };

        // Broker tabs
        document.querySelectorAll('.broker-tab').forEach(tab => {
            tab.onclick = () => switchBroker(tab.dataset.broker);
        });
    }

    // Init
    document.addEventListener('DOMContentLoaded', () => {
        setupControls();
        MBV.startThroughputTracker();
        const saved = readHash();
        if (saved) {
            switchBroker(saved.broker, saved.mode);
        } else {
            switchBroker('rabbitmq');
        }
    });

    window.addEventListener('hashchange', () => {
        const saved = readHash();
        if (saved && (saved.broker !== MBV.state.broker || saved.mode !== MBV.state.mode)) {
            switchBroker(saved.broker, saved.mode);
        }
    });

    /* ===== Sticky Panel (fixed on scroll) ===== */
    document.addEventListener('DOMContentLoaded', function() {
        var panel = document.getElementById('sticky-panel');
        var placeholder = document.getElementById('sticky-placeholder');
        if (!panel || !placeholder) return;

        var panelTop = 0;
        var panelHeight = 0;

        function measure() {
            if (!panel.classList.contains('is-fixed')) {
                panelTop = panel.offsetTop;
                panelHeight = panel.offsetHeight;
            }
        }

        function onScroll() {
            if (window.scrollY >= panelTop) {
                if (!panel.classList.contains('is-fixed')) {
                    placeholder.style.height = panelHeight + 'px';
                    placeholder.classList.add('is-active');
                    panel.classList.add('is-fixed');
                }
            } else {
                if (panel.classList.contains('is-fixed')) {
                    panel.classList.remove('is-fixed');
                    placeholder.classList.remove('is-active');
                    placeholder.style.height = '0';
                }
            }
        }

        measure();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', function() { measure(); onScroll(); });
    });
})();
