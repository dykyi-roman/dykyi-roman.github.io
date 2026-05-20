/* ===== Main App: Strategy Switching, Mode Tabs, Controls ===== */

(function() {
    'use strict';

    var STRATEGIES = ['big-bang', 'rolling', 'blue-green', 'canary', 'feature-toggle', 'shadow'];

    function strategyObj(id) { return DV[id]; }
    function currentStrategy() { return DV[DV.state.strategy]; }
    function currentMode() {
        var s = currentStrategy();
        return s ? s[DV.state.mode] : null;
    }

    /* ===== Hash navigation ===== */
    function updateHash(strategyId, modeId) {
        history.replaceState(null, '', '#' + strategyId + '/' + modeId);
    }

    function readHash() {
        var hash = location.hash.replace('#', '');
        if (!hash) return null;
        var parts = hash.split('/');
        if (parts.length === 2 && DV[parts[0]] && DV[parts[0]][parts[1]]) {
            return { strategy: parts[0], mode: parts[1] };
        }
        return null;
    }

    /* ===== Strategy switching ===== */
    function switchStrategy(strategyId, modeId) {
        if (!DV[strategyId]) strategyId = 'big-bang';
        DV.state.strategy = strategyId;
        DV.setAccentColors(strategyId);

        document.querySelectorAll('.dv-strategy-tab').forEach(function(tab) {
            var on = tab.dataset.strategy === strategyId;
            tab.classList.toggle('active', on);
            tab.setAttribute('aria-selected', on);
        });

        if (DV.stepMode.active) DV.exitStepMode();
        DV.clearLog();
        DV.resetStats();

        var strategy = DV[strategyId];
        renderModeTabs(strategyId);
        switchMode(strategyId, modeId || strategy.modes[0].id);

        DV.showProperties(strategy.properties);
        DV.showDetails(strategyId);
        DV.showTradeoffs(strategyId);
    }

    function renderModeTabs(strategyId) {
        var strategy = DV[strategyId];
        var tabsEl = document.getElementById('mode-tabs');
        tabsEl.innerHTML = strategy.modes.map(function(m) {
            var label = I18N.t('dv.' + strategyId + '.mode.' + m.id + '.name', null, m.id);
            return '<button class="mode-tab" data-mode="' + m.id + '" role="tab">' + label + '</button>';
        }).join('');
        tabsEl.querySelectorAll('.mode-tab').forEach(function(tab) {
            tab.onclick = function() { switchMode(strategyId, tab.dataset.mode); };
        });
    }

    function switchMode(strategyId, modeId) {
        DV.state.mode = modeId;
        updateHash(strategyId, modeId);

        document.querySelectorAll('.mode-tab').forEach(function(tab) {
            tab.classList.toggle('active', tab.dataset.mode === modeId);
        });

        var descText = I18N.t('dv.' + strategyId + '.mode.' + modeId + '.desc', null, '');
        document.getElementById('pattern-desc').textContent = descText;

        if (DV.stepMode.active) DV.exitStepMode();
        DV.state.running = false;
        DV.state.paused = false;
        DV.resetStats();
        DV.clearLog();

        var mode = DV[strategyId][modeId];
        if (mode && mode.init) mode.init();
        DV._updateStepButtons();
    }

    /* ===== Controls ===== */
    function setupControls() {
        var pauseBtn = document.getElementById('btn-pause');

        document.getElementById('btn-run').onclick = function() {
            var mode = currentMode();
            if (mode && mode.run) {
                DV.state.paused = false;
                pauseBtn.disabled = false;
                pauseBtn.innerHTML = '&#x23F8; ' + I18N.t('ui.btn.pause', null, 'Pause');
                mode.run();
            }
        };

        pauseBtn.onclick = function() {
            if (!DV.state.running) return;
            if (DV.state.paused) {
                DV.resume();
                pauseBtn.innerHTML = '&#x23F8; ' + I18N.t('ui.btn.pause', null, 'Pause');
            } else {
                DV.pause();
                pauseBtn.innerHTML = '&#x25B6; ' + I18N.t('ui.btn.resume', null, 'Resume');
            }
        };

        document.getElementById('btn-reset').onclick = function() {
            DV.state.paused = false;
            DV.state.running = false;
            pauseBtn.disabled = true;
            pauseBtn.innerHTML = '&#x23F8; ' + I18N.t('ui.btn.pause', null, 'Pause');
            switchStrategy(DV.state.strategy, DV.state.mode);
            DV.log('INFO', I18N.t('ui.log.reset', null, 'State reset'));
        };

        document.getElementById('btn-copy-log').onclick = function() { DV.copyLog(); };
        document.getElementById('btn-clear-log').onclick = function() { DV.clearLog(); };

        var speedRange = document.getElementById('speed-range');
        var speedValue = document.getElementById('speed-value');
        function updateSpeedLabel(val) {
            var v = parseInt(val, 10);
            DV.state.stepDelay = 1300 - v;
            var label;
            if (v <= 300) label = I18N.t('ui.speed.slow', null, 'Slow');
            else if (v <= 700) label = I18N.t('ui.speed.normal', null, 'Normal');
            else if (v <= 1000) label = I18N.t('ui.speed.fast', null, 'Fast');
            else label = I18N.t('ui.speed.ultra', null, 'Ultra');
            speedValue.textContent = label;
        }
        speedRange.oninput = function() { updateSpeedLabel(this.value); I18N.saveSpeed(this.value); };
        var savedSpeed = I18N.loadSpeed();
        if (savedSpeed) speedRange.value = savedSpeed;
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
            if (DV.stepMode.active) {
                DV.exitStepMode();
                var m0 = currentMode();
                if (m0 && m0.init) m0.init();
                return;
            }
            if (DV.state.running) return;
            var mode = currentMode();
            if (!mode || !mode.steps) return;
            DV.startStepMode(mode.steps(), mode.stepOptions ? mode.stepOptions() : {}, mode.init);
        };

        document.getElementById('btn-step-fwd').onclick = function() { DV.stepForward(); };
        document.getElementById('btn-step-back').onclick = function() { DV.stepBack(); };

        document.querySelectorAll('.dv-strategy-tab').forEach(function(tab) {
            tab.onclick = function() { switchStrategy(tab.dataset.strategy); };
        });
    }

    /* ===== Bootstrap ===== */
    document.addEventListener('DOMContentLoaded', function() {
        I18N.onReady(function() {
            setupControls();
            DV.ensureTooltips();
            DV._updateStepButtons();
            I18N.applyToDOM();
            var saved = readHash();
            if (saved) {
                switchStrategy(saved.strategy, saved.mode);
            } else {
                switchStrategy('big-bang');
            }
        });
    });

    window.addEventListener('hashchange', function() {
        var saved = readHash();
        if (saved && (saved.strategy !== DV.state.strategy || saved.mode !== DV.state.mode)) {
            switchStrategy(saved.strategy, saved.mode);
        }
    });

    /* ===== i18n refresh ===== */
    window.DV_refresh = function() {
        switchStrategy(DV.state.strategy, DV.state.mode);
    };

    /* ===== Sticky global controls on scroll ===== */
    document.addEventListener('DOMContentLoaded', function() {
        var controls = document.getElementById('global-controls');
        var placeholder = document.getElementById('controls-placeholder');
        if (!controls || !placeholder) return;
        var marginBottom = 10;

        function onScroll() {
            if (controls.classList.contains('is-fixed')) {
                var phRect = placeholder.getBoundingClientRect();
                if (phRect.top >= 0) {
                    controls.classList.remove('is-fixed');
                    placeholder.classList.remove('is-active');
                    placeholder.style.height = '0';
                }
            } else {
                var rect = controls.getBoundingClientRect();
                if (rect.top <= 0) {
                    placeholder.style.height = (controls.offsetHeight + marginBottom) + 'px';
                    placeholder.classList.add('is-active');
                    controls.classList.add('is-fixed');
                }
            }
        }
        window.addEventListener('scroll', onScroll, { passive: true });
    });
})();
