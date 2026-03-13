/* ===== Main App: Pattern Switching, Mode Tabs, Controls ===== */

(function() {
    'use strict';

    var patternConfigs = {
        'simple-factory': {
            name: 'Simple Factory',
            modes: PV['simple-factory'].modes,
            initMode: function(modeId) {
                var p = PV['simple-factory'];
                if (p[modeId]) p[modeId].init();
            },
            depRules: PV['simple-factory'].depRules
        },
        'static-factory': {
            name: 'Static Factory',
            modes: PV['static-factory'].modes,
            initMode: function(modeId) {
                var p = PV['static-factory'];
                if (p[modeId]) p[modeId].init();
            },
            depRules: PV['static-factory'].depRules
        },
        'factory-method': {
            name: 'Factory Method',
            modes: PV['factory-method'].modes,
            initMode: function(modeId) {
                var p = PV['factory-method'];
                if (p[modeId]) p[modeId].init();
            },
            depRules: PV['factory-method'].depRules
        },
        'abstract-factory': {
            name: 'Abstract Factory',
            modes: PV['abstract-factory'].modes,
            initMode: function(modeId) {
                var p = PV['abstract-factory'];
                if (p[modeId]) p[modeId].init();
            },
            depRules: PV['abstract-factory'].depRules
        },
        'builder': {
            name: 'Builder',
            modes: PV['builder'].modes,
            initMode: function(modeId) {
                var p = PV['builder'];
                if (p[modeId]) p[modeId].init();
            },
            depRules: PV['builder'].depRules
        },
        'prototype': {
            name: 'Prototype',
            modes: PV['prototype'].modes,
            initMode: function(modeId) {
                var p = PV['prototype'];
                if (p[modeId]) p[modeId].init();
            },
            depRules: PV['prototype'].depRules
        },
        'singleton': {
            name: 'Singleton',
            modes: PV['singleton'].modes,
            initMode: function(modeId) {
                var p = PV['singleton'];
                if (p[modeId]) p[modeId].init();
            },
            depRules: PV['singleton'].depRules
        },
        'pool': {
            name: 'Object Pool',
            modes: PV['pool'].modes,
            initMode: function(modeId) {
                var p = PV['pool'];
                if (p[modeId]) p[modeId].init();
            },
            depRules: PV['pool'].depRules
        }
    };

    function updateHash(patternId, modeId) {
        history.replaceState(null, '', '#' + patternId + '/' + modeId);
    }

    function readHash() {
        var hash = location.hash.replace('#', '');
        if (!hash) return null;
        var parts = hash.split('/');
        if (parts.length === 2 && patternConfigs[parts[0]]) {
            var config = patternConfigs[parts[0]];
            if (config.modes.some(function(m) { return m.id === parts[1]; })) {
                return { pattern: parts[0], mode: parts[1] };
            }
        }
        return null;
    }

    function switchPattern(patternId, modeId) {
        PV.state.pattern = patternId;
        PV.setAccentColors(patternId);

        document.querySelectorAll('.pv-tab').forEach(function(tab) {
            tab.classList.toggle('active', tab.dataset.pattern === patternId);
            tab.setAttribute('aria-selected', tab.dataset.pattern === patternId);
        });

        PV.clearAnimations();
        PV.clearLog();
        PV.resetStats();
        if (PV.stepMode.active) PV.exitStepMode();

        var config = patternConfigs[patternId];
        renderModeTabs(patternId);
        switchMode(patternId, modeId || config.modes[0].id);

        if (config.depRules) {
            PV.showParticipants(config.depRules);
        }
    }

    function renderModeTabs(patternId) {
        var config = patternConfigs[patternId];
        var tabsEl = document.getElementById('mode-tabs');
        tabsEl.style.display = config.modes.length <= 1 ? 'none' : '';
        tabsEl.innerHTML = config.modes.map(function(m) {
            return '<button class="mode-tab" data-mode="' + m.id + '" role="tab">' + m.label + '</button>';
        }).join('');

        tabsEl.querySelectorAll('.mode-tab').forEach(function(tab) {
            tab.onclick = function() { switchMode(patternId, tab.dataset.mode); };
        });
    }

    function switchMode(patternId, modeId) {
        PV.state.mode = modeId;
        updateHash(patternId, modeId);
        var config = patternConfigs[patternId];
        var modeConfig = config.modes.find(function(m) { return m.id === modeId; });

        document.querySelectorAll('.mode-tab').forEach(function(tab) {
            tab.classList.toggle('active', tab.dataset.mode === modeId);
        });

        document.getElementById('pattern-desc').textContent = modeConfig ? modeConfig.desc : '';

        updatePatternDetails(patternId, modeId);

        PV.clearAnimations();
        PV.resetStats();
        PV.clearLog();
        if (PV.stepMode.active) PV.exitStepMode();

        config.initMode(modeId);
    }

    function getCurrentMode() {
        var patternId = PV.state.pattern;
        var modeId = PV.state.mode;
        var p = PV[patternId];
        return p && p[modeId] ? p[modeId] : null;
    }

    function updatePatternDetails(patternId, modeId) {
        var container = document.getElementById('pattern-details');
        var body = document.getElementById('pattern-details-body');
        var toggle = document.getElementById('pattern-details-toggle');
        if (!container || !body || !toggle) return;

        var patternObj = PV[patternId];
        var details = patternObj && patternObj.details && patternObj.details[modeId];
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
        PV.showTradeoffs(tradeoffs);
    }

    function setupControls() {
        var pauseBtn = document.getElementById('btn-pause');

        document.getElementById('btn-run').onclick = function() {
            var mode = getCurrentMode();
            if (mode && mode.run) {
                PV.state.paused = false;
                pauseBtn.disabled = false;
                pauseBtn.innerHTML = '&#x23F8; Pause';
                mode.run();
            }
        };

        pauseBtn.onclick = function() {
            if (!PV.state.running) return;
            if (PV.state.paused) {
                PV.resume();
                pauseBtn.innerHTML = '&#x23F8; Pause';
            } else {
                PV.pause();
                pauseBtn.innerHTML = '&#x25B6; Resume';
            }
        };

        document.getElementById('btn-reset').onclick = function() {
            PV.state.paused = false;
            pauseBtn.disabled = true;
            pauseBtn.innerHTML = '&#x23F8; Pause';
            switchPattern(PV.state.pattern);
            PV.log('REQUEST', 'State reset');
        };

        document.getElementById('btn-copy-log').onclick = function() {
            PV.copyLog();
        };
        document.getElementById('btn-clear-log').onclick = function() {
            PV.clearLog();
        };

        var speedRange = document.getElementById('speed-range');
        var speedValue = document.getElementById('speed-value');
        function updateSpeedLabel(val) {
            var v = parseInt(val);
            PV.state.stepDelay = 1300 - v;
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
            if (PV.state.running && PV.state.paused) {
                PV.switchToStepMode();
                return;
            }
            if (PV.stepMode.active) {
                PV.exitStepMode();
                PV.clearAnimations(true);
                return;
            }
            var mode = getCurrentMode();
            if (!mode || !mode.run) return;
            var steps = mode.steps ? mode.steps() : null;
            if (!steps) return;
            PV.startStepMode(steps, mode.stepOptions ? mode.stepOptions() : {});
        };

        document.getElementById('btn-step-fwd').onclick = function() { PV.stepForward(); };
        document.getElementById('btn-step-back').onclick = function() { PV.stepBack(); };

        document.querySelectorAll('.pv-tab').forEach(function(tab) {
            tab.onclick = function() { switchPattern(tab.dataset.pattern); };
        });
    }

    document.addEventListener('DOMContentLoaded', function() {
        setupControls();
        PV.ensureTooltips();
        PV._updateStepButtons();
        var saved = readHash();
        if (saved) {
            switchPattern(saved.pattern, saved.mode);
        } else {
            switchPattern('simple-factory');
        }
    });

    window.addEventListener('hashchange', function() {
        var saved = readHash();
        if (saved && (saved.pattern !== PV.state.pattern || saved.mode !== PV.state.mode)) {
            switchPattern(saved.pattern, saved.mode);
        }
    });

    /* ===== Sticky Global Controls ===== */
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
