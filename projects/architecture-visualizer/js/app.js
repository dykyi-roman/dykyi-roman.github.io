/* ===== Main App: Architecture Switching, Mode Tabs, Controls ===== */

(function() {
    'use strict';

    var archConfigs = {
        mvc: {
            name: 'MVC / MVP / MVVM',
            modes: ARCHV.mvc.modes,
            initMode: function(modeId) {
                var map = { mvc: ARCHV.mvc.mvcMode, mvp: ARCHV.mvc.mvpMode, mvvm: ARCHV.mvc.mvvmMode };
                if (map[modeId]) map[modeId].init();
            },
            depRules: ARCHV.mvc.depRules
        },
        layered: {
            name: 'Layered Architecture',
            modes: ARCHV.layered.modes,
            initMode: function(modeId) {
                var map = { http: ARCHV.layered.http, console: ARCHV.layered.console, message: ARCHV.layered.message };
                if (map[modeId]) map[modeId].init();
            },
            depRules: ARCHV.layered.depRules
        },
        clean: {
            name: 'Clean Architecture',
            modes: ARCHV.clean.modes,
            initMode: function(modeId) {
                var map = { http: ARCHV.clean.http, console: ARCHV.clean.console, message: ARCHV.clean.message };
                if (map[modeId]) map[modeId].init();
            },
            depRules: ARCHV.clean.depRules
        },
        hexagonal: {
            name: 'Hexagonal (Ports & Adapters)',
            modes: ARCHV.hexagonal.modes,
            initMode: function(modeId) {
                var map = { http: ARCHV.hexagonal.http, console: ARCHV.hexagonal.console, message: ARCHV.hexagonal.message };
                if (map[modeId]) map[modeId].init();
            },
            depRules: ARCHV.hexagonal.depRules
        },
        cqrs: {
            name: 'CQRS',
            modes: ARCHV.cqrs.modes,
            initMode: function(modeId) {
                var map = { http: ARCHV.cqrs.http, console: ARCHV.cqrs.console, message: ARCHV.cqrs.message };
                if (map[modeId]) map[modeId].init();
            },
            depRules: ARCHV.cqrs.depRules
        },
        eventsourcing: {
            name: 'Event Sourcing',
            modes: ARCHV.eventsourcing.modes,
            initMode: function(modeId) {
                var map = { http: ARCHV.eventsourcing.http, console: ARCHV.eventsourcing.console, message: ARCHV.eventsourcing.message };
                if (map[modeId]) map[modeId].init();
            },
            depRules: ARCHV.eventsourcing.depRules
        },
        eda: {
            name: 'Event-Driven Architecture',
            modes: ARCHV.eda.modes,
            initMode: function(modeId) {
                var map = { http: ARCHV.eda.http, choreography: ARCHV.eda.choreography, orchestration: ARCHV.eda.orchestration };
                if (map[modeId]) map[modeId].init();
            },
            depRules: ARCHV.eda.depRules
        },
        microservices: {
            name: 'Microservices Architecture',
            modes: ARCHV.microservices.modes,
            initMode: function(modeId) {
                var map = { sync: ARCHV.microservices.sync, async: ARCHV.microservices.async, saga: ARCHV.microservices.saga, 'saga-fail': ARCHV.microservices['saga-fail'] };
                if (map[modeId]) map[modeId].init();
            },
            depRules: ARCHV.microservices.depRules
        },
        ddd: {
            name: 'Domain-Driven Design',
            modes: ARCHV.ddd.modes,
            initMode: function(modeId) {
                var map = {
                    http: ARCHV.ddd.http,
                    console: ARCHV.ddd.console,
                    message: ARCHV.ddd.message,
                    'context-map': ARCHV.ddd['context-map'],
                    'open-host': ARCHV.ddd['open-host'],
                    saga: ARCHV.ddd.saga,
                    'saga-fail': ARCHV.ddd['saga-fail'],
                    'domain-events': ARCHV.ddd['domain-events']
                };
                if (map[modeId]) map[modeId].init();
            },
            depRules: ARCHV.ddd.depRules
        }
    };

    function updateHash(archId, modeId) {
        history.replaceState(null, '', '#' + archId + '/' + modeId);
    }

    function readHash() {
        var hash = location.hash.replace('#', '');
        if (!hash) return null;
        var parts = hash.split('/');
        if (parts.length === 2 && archConfigs[parts[0]]) {
            var config = archConfigs[parts[0]];
            if (config.modes.some(function(m) { return m.id === parts[1]; })) {
                return { arch: parts[0], mode: parts[1] };
            }
        }
        return null;
    }

    function switchArch(archId, modeId) {
        ARCHV.state.arch = archId;
        ARCHV.setAccentColors(archId);

        document.querySelectorAll('.arch-tab').forEach(function(tab) {
            tab.classList.toggle('active', tab.dataset.arch === archId);
            tab.setAttribute('aria-selected', tab.dataset.arch === archId);
        });

        ARCHV.clearAnimations();
        ARCHV.clearLog();
        ARCHV.resetStats();
        if (ARCHV.stepMode.active) ARCHV.exitStepMode();

        var config = archConfigs[archId];
        renderModeTabs(archId);
        switchMode(archId, modeId || config.modes[0].id);

        if (config.depRules) {
            ARCHV.showDependencyRules(config.depRules);
        }
    }

    function renderModeTabs(archId) {
        var config = archConfigs[archId];
        var tabsEl = document.getElementById('mode-tabs');
        tabsEl.innerHTML = config.modes.map(function(m) {
            return '<button class="mode-tab" data-mode="' + m.id + '" role="tab">' + m.label + '</button>';
        }).join('');

        tabsEl.querySelectorAll('.mode-tab').forEach(function(tab) {
            tab.onclick = function() { switchMode(archId, tab.dataset.mode); };
        });
    }

    function switchMode(archId, modeId) {
        ARCHV.state.mode = modeId;
        updateHash(archId, modeId);
        var config = archConfigs[archId];
        var modeConfig = config.modes.find(function(m) { return m.id === modeId; });

        document.querySelectorAll('.mode-tab').forEach(function(tab) {
            tab.classList.toggle('active', tab.dataset.mode === modeId);
        });

        document.getElementById('pattern-desc').textContent = modeConfig ? modeConfig.desc : '';

        updatePatternDetails(archId, modeId);

        ARCHV.clearAnimations();
        ARCHV.resetStats();
        ARCHV.clearLog();
        if (ARCHV.stepMode.active) ARCHV.exitStepMode();

        config.initMode(modeId);
    }

    function getCurrentMode() {
        var archId = ARCHV.state.arch;
        var modeId = ARCHV.state.mode;
        var modeMap = {
            layered: { http: ARCHV.layered.http, console: ARCHV.layered.console, message: ARCHV.layered.message },
            clean: { http: ARCHV.clean.http, console: ARCHV.clean.console, message: ARCHV.clean.message },
            hexagonal: { http: ARCHV.hexagonal.http, console: ARCHV.hexagonal.console, message: ARCHV.hexagonal.message },
            ddd: { http: ARCHV.ddd.http, console: ARCHV.ddd.console, message: ARCHV.ddd.message, 'context-map': ARCHV.ddd['context-map'], 'open-host': ARCHV.ddd['open-host'], saga: ARCHV.ddd.saga, 'saga-fail': ARCHV.ddd['saga-fail'], 'domain-events': ARCHV.ddd['domain-events'] },
            cqrs: { http: ARCHV.cqrs.http, console: ARCHV.cqrs.console, message: ARCHV.cqrs.message },
            eventsourcing: { http: ARCHV.eventsourcing.http, console: ARCHV.eventsourcing.console, message: ARCHV.eventsourcing.message },
            eda: { http: ARCHV.eda.http, choreography: ARCHV.eda.choreography, orchestration: ARCHV.eda.orchestration },
            microservices: { sync: ARCHV.microservices.sync, async: ARCHV.microservices.async, saga: ARCHV.microservices.saga, 'saga-fail': ARCHV.microservices['saga-fail'] },
            mvc: { mvc: ARCHV.mvc.mvcMode, mvp: ARCHV.mvc.mvpMode, mvvm: ARCHV.mvc.mvvmMode }
        };
        return modeMap[archId] && modeMap[archId][modeId] ? modeMap[archId][modeId] : null;
    }

    function updatePatternDetails(archId, modeId) {
        var container = document.getElementById('pattern-details');
        var body = document.getElementById('pattern-details-body');
        var toggle = document.getElementById('pattern-details-toggle');
        if (!container || !body || !toggle) return;

        var archObj = ARCHV[archId];
        var details = archObj && archObj.details && archObj.details[modeId];
        if (!details) {
            container.style.display = 'none';
            body.classList.remove('expanded');
            toggle.setAttribute('aria-expanded', 'false');
            return;
        }

        var html = '';
        if (details.principles) {
            html += '<div class="pattern-details-section">' +
                '<div class="pattern-details-section-title">Principles</div>' +
                '<ul class="pattern-details-list">' +
                details.principles.map(function(p) { return '<li>' + p + '</li>'; }).join('') +
                '</ul></div>';
        }
        if (details.concepts) {
            html += '<div class="pattern-details-section">' +
                '<div class="pattern-details-section-title">Key Concepts</div>' +
                '<div class="pattern-concepts-grid">' +
                details.concepts.map(function(c) {
                    return '<div class="pattern-concept">' +
                        '<span class="pattern-concept-term">' + c.term + '</span>' +
                        '<span class="pattern-concept-def">' + c.definition + '</span>' +
                        '</div>';
                }).join('') +
                '</div></div>';
        }

        body.innerHTML = html;
        body.classList.remove('expanded');
        toggle.setAttribute('aria-expanded', 'false');
        container.style.display = 'block';

        var tradeoffs = details.tradeoffs || null;
        ARCHV.showTradeoffs(tradeoffs);
    }

    function setupControls() {
        var pauseBtn = document.getElementById('btn-pause');

        document.getElementById('btn-run').onclick = function() {
            var mode = getCurrentMode();
            if (mode && mode.run) {
                ARCHV.state.paused = false;
                pauseBtn.disabled = false;
                pauseBtn.innerHTML = '&#x23F8; Pause';
                mode.run();
            }
        };

        pauseBtn.onclick = function() {
            if (!ARCHV.state.running) return;
            if (ARCHV.state.paused) {
                ARCHV.resume();
                pauseBtn.innerHTML = '&#x23F8; Pause';
            } else {
                ARCHV.pause();
                pauseBtn.innerHTML = '&#x25B6; Resume';
            }
        };

        document.getElementById('btn-reset').onclick = function() {
            ARCHV.state.paused = false;
            pauseBtn.disabled = true;
            pauseBtn.innerHTML = '&#x23F8; Pause';
            switchArch(ARCHV.state.arch);
            ARCHV.log('REQUEST', 'State reset');
        };

        document.getElementById('btn-copy-log').onclick = function() {
            ARCHV.copyLog();
        };
        document.getElementById('btn-clear-log').onclick = function() {
            ARCHV.clearLog();
        };

        var speedRange = document.getElementById('speed-range');
        var speedValue = document.getElementById('speed-value');
        function updateSpeedLabel(val) {
            var v = parseInt(val);
            ARCHV.state.stepDelay = 1300 - v;
            if (v <= 300) speedValue.textContent = 'Slow';
            else if (v <= 700) speedValue.textContent = 'Normal';
            else if (v <= 1000) speedValue.textContent = 'Fast';
            else speedValue.textContent = 'Ultra';
        }
        speedRange.oninput = function() { updateSpeedLabel(this.value); };
        updateSpeedLabel(speedRange.value);

        document.getElementById('pattern-details-toggle').onclick = function() {
            var body = document.getElementById('pattern-details-body');
            var expanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !expanded);
            body.classList.toggle('expanded');
        };

        document.getElementById('tradeoffs-toggle').onclick = function() {
            var body = document.getElementById('tradeoffs-body');
            var expanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !expanded);
            body.classList.toggle('expanded');
        };

        document.getElementById('btn-step-mode').onclick = function() {
            if (ARCHV.state.running && ARCHV.state.paused) {
                ARCHV.switchToStepMode();
                return;
            }
            if (ARCHV.stepMode.active) {
                ARCHV.exitStepMode();
                ARCHV.clearAnimations();
                return;
            }
            var mode = getCurrentMode();
            if (!mode || !mode.run) return;
            var steps = mode.steps ? mode.steps() : null;
            if (!steps) return;
            ARCHV.startStepMode(steps, mode.stepOptions ? mode.stepOptions() : {});
        };

        document.getElementById('btn-step-fwd').onclick = function() { ARCHV.stepForward(); };
        document.getElementById('btn-step-back').onclick = function() { ARCHV.stepBack(); };

        document.querySelectorAll('.arch-tab').forEach(function(tab) {
            tab.onclick = function() { switchArch(tab.dataset.arch); };
        });
    }

    document.addEventListener('DOMContentLoaded', function() {
        setupControls();
        ARCHV.ensureTooltips();
        ARCHV._updateStepButtons();
        var saved = readHash();
        if (saved) {
            switchArch(saved.arch, saved.mode);
        } else {
            switchArch('mvc');
        }
    });

    window.addEventListener('hashchange', function() {
        var saved = readHash();
        if (saved && (saved.arch !== ARCHV.state.arch || saved.mode !== ARCHV.state.mode)) {
            switchArch(saved.arch, saved.mode);
        }
    });

    /* ===== Sticky Global Controls (fixed on scroll) ===== */
    document.addEventListener('DOMContentLoaded', function() {
        var controls = document.getElementById('global-controls');
        var placeholder = document.getElementById('controls-placeholder');
        if (!controls || !placeholder) return;

        var controlsTop = 0;
        var controlsHeight = 0;
        var marginBottom = 10;
        var measured = false;

        function measure() {
            if (!controls.classList.contains('is-fixed')) {
                controlsTop = controls.offsetTop;
                controlsHeight = controls.offsetHeight;
                measured = controlsTop > 0;
            }
        }

        function onScroll() {
            if (!measured) { measure(); }
            if (!measured) return;
            if (window.scrollY >= controlsTop) {
                if (!controls.classList.contains('is-fixed')) {
                    placeholder.style.height = (controlsHeight + marginBottom) + 'px';
                    placeholder.classList.add('is-active');
                    controls.classList.add('is-fixed');
                }
            } else {
                if (controls.classList.contains('is-fixed')) {
                    controls.classList.remove('is-fixed');
                    placeholder.classList.remove('is-active');
                    placeholder.style.height = '0';
                }
            }
        }

        requestAnimationFrame(function() {
            measure();
            if (!measured) {
                setTimeout(measure, 300);
            }
        });
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', function() { measured = false; measure(); onScroll(); });
    });
})();
