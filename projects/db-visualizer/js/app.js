/* ===== Main App: DB Switching, Mode Tabs, Controls ===== */

(function() {
    'use strict';

    const dbConfigs = {
        mysql: {
            name: 'MySQL',
            modes: DBIV.mysql.modes,
            initMode: function(modeId) {
                const map = {
                    'btree': DBIV.mysql.btree,
                    'hash': DBIV.mysql.hash,
                    'composite': DBIV.mysql.composite,
                    'fulltext': DBIV.mysql.fulltext,
                    'explain': DBIV.mysql.explain,
                };
                if (map[modeId]) map[modeId].init();
            }
        },
        postgresql: {
            name: 'PostgreSQL',
            modes: DBIV.postgresql.modes,
            initMode: function(modeId) {
                const map = {
                    'btree': DBIV.postgresql.btree,
                    'hash': DBIV.postgresql.hash,
                    'gin': DBIV.postgresql.gin,
                    'gist': DBIV.postgresql.gist,
                    'brin': DBIV.postgresql.brin,
                };
                if (map[modeId]) map[modeId].init();
            }
        },
        mongodb: {
            name: 'MongoDB',
            modes: DBIV.mongodb.modes,
            initMode: function(modeId) {
                const map = {
                    'single': DBIV.mongodb.single,
                    'compound': DBIV.mongodb.compound,
                    'multikey': DBIV.mongodb.multikey,
                    'text': DBIV.mongodb.text,
                };
                if (map[modeId]) map[modeId].init();
            }
        },
        redis: {
            name: 'Redis',
            modes: DBIV.redis.modes,
            initMode: function(modeId) {
                const map = {
                    'zset': DBIV.redis.zset,
                    'hash-index': DBIV.redis.hashIndex,
                    'secondary': DBIV.redis.secondary,
                };
                if (map[modeId]) map[modeId].init();
            }
        }
    };

    function updateHash(dbId, modeId) {
        history.replaceState(null, '', '#' + dbId + '/' + modeId);
    }

    function readHash() {
        const hash = location.hash.replace('#', '');
        if (!hash) return null;
        const parts = hash.split('/');
        if (parts.length === 2 && dbConfigs[parts[0]]) {
            const config = dbConfigs[parts[0]];
            if (config.modes.some(m => m.id === parts[1])) {
                return { db: parts[0], mode: parts[1] };
            }
        }
        return null;
    }

    function switchDb(dbId, modeId) {
        DBIV.state.db = dbId;
        DBIV.setAccentColors(dbId);

        document.querySelectorAll('.db-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.db === dbId);
            tab.setAttribute('aria-selected', tab.dataset.db === dbId);
        });

        const config = dbConfigs[dbId];
        document.getElementById('index-name').textContent = config.name;
        document.getElementById('index-status').textContent = 'ready';
        document.getElementById('index-status').className = 'index-status ready';

        DBIV.clearAnimations();
        DBIV.clearLog();
        DBIV.resetStats();
        DBIV.hideComparison();

        renderModeTabs(dbId);
        switchMode(dbId, modeId || config.modes[0].id);
    }

    function renderModeTabs(dbId) {
        const config = dbConfigs[dbId];
        const tabsEl = document.getElementById('mode-tabs');
        tabsEl.innerHTML = config.modes.map(m =>
            `<button class="mode-tab" data-mode="${m.id}" role="tab">${m.label}</button>`
        ).join('');

        tabsEl.querySelectorAll('.mode-tab').forEach(tab => {
            tab.onclick = () => switchMode(dbId, tab.dataset.mode);
        });
    }

    function switchMode(dbId, modeId) {
        DBIV.state.mode = modeId;
        DBIV.state.simulateError = false;
        updateHash(dbId, modeId);
        const config = dbConfigs[dbId];
        const modeConfig = config.modes.find(m => m.id === modeId);

        document.querySelectorAll('.mode-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.mode === modeId);
        });

        document.getElementById('pattern-desc').textContent = modeConfig ? modeConfig.desc : '';

        DBIV.clearAnimations();
        DBIV.resetStats();
        DBIV.clearLog();
        DBIV.hideComparison();

        config.initMode(modeId);
    }

    function getCurrentMode() {
        const dbId = DBIV.state.db;
        const modeId = DBIV.state.mode;
        const config = dbConfigs[dbId];
        if (!config) return null;

        const modeMap = {
            mysql: { btree: DBIV.mysql.btree, hash: DBIV.mysql.hash, composite: DBIV.mysql.composite, fulltext: DBIV.mysql.fulltext, explain: DBIV.mysql.explain },
            postgresql: { btree: DBIV.postgresql.btree, hash: DBIV.postgresql.hash, gin: DBIV.postgresql.gin, gist: DBIV.postgresql.gist, brin: DBIV.postgresql.brin },
            mongodb: { single: DBIV.mongodb.single, compound: DBIV.mongodb.compound, multikey: DBIV.mongodb.multikey, text: DBIV.mongodb.text },
            redis: { zset: DBIV.redis.zset, 'hash-index': DBIV.redis.hashIndex, secondary: DBIV.redis.secondary },
        };

        return modeMap[dbId] && modeMap[dbId][modeId] ? modeMap[dbId][modeId] : null;
    }

    function setupControls() {
        // Run Query
        document.getElementById('btn-run').onclick = () => {
            const mode = getCurrentMode();
            if (mode && mode.run) mode.run();
        };

        // Burst
        document.getElementById('btn-burst').onclick = () => {
            const mode = getCurrentMode();
            if (mode && mode.run) {
                (async () => {
                    for (let i = 0; i < 5; i++) {
                        await mode.run();
                        await DBIV.sleep(200);
                    }
                })();
            }
        };

        // Index Miss
        document.getElementById('btn-miss').onclick = () => {
            DBIV.state.simulateError = true;
            DBIV.log('MISS', 'Next query will bypass index (full table scan)');
            const statusEl = document.getElementById('index-status');
            statusEl.textContent = 'miss';
            statusEl.className = 'index-status miss';
            setTimeout(() => {
                statusEl.textContent = 'ready';
                statusEl.className = 'index-status ready';
            }, 2000);
        };

        // Reset
        document.getElementById('btn-reset').onclick = () => {
            switchDb(DBIV.state.db);
            DBIV.log('QUERY', 'State reset');
        };

        // Copy / Clear Log
        document.getElementById('btn-copy-log').onclick = () => DBIV.copyLog();
        document.getElementById('btn-clear-log').onclick = () => DBIV.clearLog();

        // Compare toggle
        document.getElementById('toggle-compare').onchange = (e) => {
            DBIV.state.comparisonMode = e.target.checked;
            if (!e.target.checked) DBIV.hideComparison();
        };

        // DB tabs
        document.querySelectorAll('.db-tab').forEach(tab => {
            tab.onclick = () => switchDb(tab.dataset.db);
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
        setupControls();
        const saved = readHash();
        if (saved) {
            switchDb(saved.db, saved.mode);
        } else {
            switchDb('mysql');
        }
    });

    window.addEventListener('hashchange', () => {
        const saved = readHash();
        if (saved && (saved.db !== DBIV.state.db || saved.mode !== DBIV.state.mode)) {
            switchDb(saved.db, saved.mode);
        }
    });
})();
