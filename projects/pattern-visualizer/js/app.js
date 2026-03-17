/* ===== Main App: Pattern Switching, Mode Tabs, Controls ===== */

(function() {
    'use strict';

    var categoryPatterns = {
        creational: ['simple-factory', 'static-factory', 'factory-method', 'abstract-factory', 'builder', 'prototype', 'singleton', 'pool'],
        structural: ['adapter', 'bridge', 'composite', 'decorator', 'facade', 'flyweight', 'proxy'],
        behavioral: ['observer', 'strategy', 'command', 'state', 'chain-of-responsibility', 'iterator', 'mediator', 'memento', 'template-method', 'visitor']
    };

    var activeCategory = 'creational';

    var patternNames = {
        'simple-factory': 'Simple Factory', 'static-factory': 'Static Factory',
        'factory-method': 'Factory Method', 'abstract-factory': 'Abstract Factory',
        'builder': 'Builder', 'prototype': 'Prototype', 'singleton': 'Singleton', 'pool': 'Object Pool',
        'adapter': 'Adapter', 'bridge': 'Bridge', 'composite': 'Composite', 'decorator': 'Decorator',
        'facade': 'Facade', 'flyweight': 'Flyweight', 'proxy': 'Proxy',
        'observer': 'Observer', 'strategy': 'Strategy', 'command': 'Command', 'state': 'State',
        'chain-of-responsibility': 'Chain of Responsibility', 'iterator': 'Iterator', 'mediator': 'Mediator',
        'memento': 'Memento', 'template-method': 'Template Method', 'visitor': 'Visitor'
    };

    function buildPatternConfig(id) {
        return {
            name: patternNames[id] || id,
            modes: PV[id].modes,
            initMode: function(modeId) {
                var p = PV[id];
                if (p[modeId]) p[modeId].init();
            },
            depRules: PV[id].depRules
        };
    }

    var patternConfigs = {};
    Object.keys(categoryPatterns).forEach(function(cat) {
        categoryPatterns[cat].forEach(function(id) {
            if (PV[id]) patternConfigs[id] = buildPatternConfig(id);
        });
    });

    function getCategoryForPattern(patternId) {
        var cats = Object.keys(categoryPatterns);
        for (var i = 0; i < cats.length; i++) {
            if (categoryPatterns[cats[i]].indexOf(patternId) !== -1) return cats[i];
        }
        return 'creational';
    }

    function switchCategory(category) {
        activeCategory = category;

        document.querySelectorAll('.pv-category').forEach(function(btn) {
            var isCurrent = btn.dataset.category === category;
            btn.classList.toggle('active', isCurrent);
            btn.setAttribute('aria-selected', isCurrent);
        });

        var patterns = categoryPatterns[category] || [];
        var nav = document.getElementById('pv-nav');
        nav.innerHTML = patterns.map(function(id, idx) {
            var cls = 'pv-tab' + (idx === 0 ? ' active' : '');
            return '<button class="' + cls + '" data-pattern="' + id + '" role="tab" aria-selected="' + (idx === 0) + '" data-i18n="' + id + '.name">' +
                I18N.t(id + '.name', null, patternConfigs[id] ? patternConfigs[id].name : id) + '</button>';
        }).join('');

        nav.querySelectorAll('.pv-tab').forEach(function(tab) {
            tab.onclick = function() { switchPattern(tab.dataset.pattern); };
        });

        if (patterns.length > 0 && patternConfigs[patterns[0]]) {
            switchPattern(patterns[0]);
        }
    }

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
            PV.showParticipants(config.depRules, patternId + '.depRules');
        }
    }

    function renderModeTabs(patternId) {
        var config = patternConfigs[patternId];
        var tabsEl = document.getElementById('mode-tabs');
        tabsEl.style.display = config.modes.length <= 1 ? 'none' : '';
        tabsEl.innerHTML = config.modes.map(function(m) {
            var label = I18N.t(patternId + '.modes.' + m.id + '.label', null, m.label);
            return '<button class="mode-tab" data-mode="' + m.id + '" role="tab">' + label + '</button>';
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

        var descText = modeConfig ? I18N.t(patternId + '.modes.' + modeId + '.desc', null, modeConfig.desc) : '';
        document.getElementById('pattern-desc').textContent = descText;

        updatePatternDetails(patternId, modeId);

        PV.clearAnimations();
        PV.resetStats();
        PV.clearLog();
        if (PV.stepMode.active) PV.exitStepMode();

        config.initMode(modeId);

        var patternObj = PV[patternId];
        var modeCodeExamples = patternObj && patternObj.codeExamples && patternObj.codeExamples[modeId];
        PV.showCodeExamples(modeCodeExamples || null);

        if (config.depRules) {
            PV.showParticipants(config.depRules, patternId + '.depRules');
        }
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

        var i18nPrefix = patternId + '.details.' + modeId;
        var principles = I18N.ta(i18nPrefix + '.principles', details.principles);
        var concepts = I18N.to(i18nPrefix + '.concepts', details.concepts);

        var html = '';
        if (principles && principles.length) {
            html += '<div class="pattern-details-section">' +
                '<div class="pattern-details-section-title">' + I18N.t('ui.details.principles', null, 'Principles') + '</div>' +
                '<ul class="pattern-details-list">' +
                principles.map(function(p) { return '<li>' + p + '</li>'; }).join('') +
                '</ul></div>';
        }
        if (concepts && concepts.length) {
            html += '<div class="pattern-details-section">' +
                '<div class="pattern-details-section-title">' + I18N.t('ui.details.concepts', null, 'Key Concepts') + '</div>' +
                '<div class="pattern-concepts-grid">' +
                concepts.map(function(c) {
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
        PV.showTradeoffs(tradeoffs, i18nPrefix);
    }

    function setupControls() {
        var pauseBtn = document.getElementById('btn-pause');

        document.getElementById('btn-run').onclick = function() {
            var mode = getCurrentMode();
            if (mode && mode.run) {
                PV.state.paused = false;
                pauseBtn.disabled = false;
                pauseBtn.innerHTML = '&#x23F8; ' + I18N.t('ui.btn.pause', null, 'Pause');
                mode.run();
            }
        };

        pauseBtn.onclick = function() {
            if (!PV.state.running) return;
            if (PV.state.paused) {
                PV.resume();
                pauseBtn.innerHTML = '&#x23F8; ' + I18N.t('ui.btn.pause', null, 'Pause');
            } else {
                PV.pause();
                pauseBtn.innerHTML = '&#x25B6; ' + I18N.t('ui.btn.resume', null, 'Resume');
            }
        };

        document.getElementById('btn-reset').onclick = function() {
            PV.state.paused = false;
            pauseBtn.disabled = true;
            pauseBtn.innerHTML = '&#x23F8; ' + I18N.t('ui.btn.pause', null, 'Pause');
            switchPattern(PV.state.pattern);
            PV.log('REQUEST', I18N.t('ui.log.reset', null, 'State reset'));
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
            if (v <= 300) speedRange.title = I18N.t('ui.speed.slow', null, 'Slow');
            else if (v <= 700) speedRange.title = I18N.t('ui.speed.normal', null, 'Normal');
            else if (v <= 1000) speedRange.title = I18N.t('ui.speed.fast', null, 'Fast');
            else speedRange.title = I18N.t('ui.speed.ultra', null, 'Ultra');
        }
        speedRange.oninput = function() { updateSpeedLabel(this.value); I18N.saveSpeed(this.value); };
        var savedSpeed = I18N.loadSpeed();
        if (savedSpeed) { speedRange.value = savedSpeed; }
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

        document.getElementById('code-examples-toggle').onclick = function() {
            var body = document.getElementById('code-examples-body');
            var expanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !expanded);
            body.classList.toggle('expanded');
        };

        document.getElementById('code-copy-btn').onclick = function() {
            PV.copyCode();
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

        /* Category buttons */
        document.querySelectorAll('.pv-category').forEach(function(btn) {
            if (btn.disabled) return;
            btn.onclick = function() { switchCategory(btn.dataset.category); };
        });
    }

    document.addEventListener('DOMContentLoaded', function() {
        I18N.onReady(function() {
            setupControls();
            PV.ensureTooltips();
            PV._updateStepButtons();
            I18N.applyToDOM();
            var saved = readHash();
            if (saved) {
                var cat = getCategoryForPattern(saved.pattern);
                if (cat !== activeCategory) {
                    activeCategory = cat;
                    document.querySelectorAll('.pv-category').forEach(function(btn) {
                        var isCurrent = btn.dataset.category === cat;
                        btn.classList.toggle('active', isCurrent);
                        btn.setAttribute('aria-selected', isCurrent);
                    });
                    var patterns = categoryPatterns[cat] || [];
                    var nav = document.getElementById('pv-nav');
                    nav.innerHTML = patterns.map(function(id) {
                        return '<button class="pv-tab" data-pattern="' + id + '" role="tab" aria-selected="false" data-i18n="' + id + '.name">' +
                            I18N.t(id + '.name', null, patternConfigs[id] ? patternConfigs[id].name : id) + '</button>';
                    }).join('');
                    nav.querySelectorAll('.pv-tab').forEach(function(tab) {
                        tab.onclick = function() { switchPattern(tab.dataset.pattern); };
                    });
                }
                switchPattern(saved.pattern, saved.mode);
            } else {
                switchPattern('simple-factory');
            }
        });
    });

    window.addEventListener('hashchange', function() {
        var saved = readHash();
        if (saved && (saved.pattern !== PV.state.pattern || saved.mode !== PV.state.mode)) {
            var cat = getCategoryForPattern(saved.pattern);
            if (cat !== activeCategory) {
                activeCategory = cat;
                document.querySelectorAll('.pv-category').forEach(function(btn) {
                    var isCurrent = btn.dataset.category === cat;
                    btn.classList.toggle('active', isCurrent);
                    btn.setAttribute('aria-selected', isCurrent);
                });
                var patterns = categoryPatterns[cat] || [];
                var nav = document.getElementById('pv-nav');
                nav.innerHTML = patterns.map(function(id) {
                    return '<button class="pv-tab" data-pattern="' + id + '" role="tab" aria-selected="false" data-i18n="' + id + '.name">' +
                        I18N.t(id + '.name', null, patternConfigs[id] ? patternConfigs[id].name : id) + '</button>';
                }).join('');
                nav.querySelectorAll('.pv-tab').forEach(function(tab) {
                    tab.onclick = function() { switchPattern(tab.dataset.pattern); };
                });
            }
            switchPattern(saved.pattern, saved.mode);
        }
    });

    /* ===== i18n Refresh ===== */
    window.PV_refresh = function() {
        /* Re-translate category buttons */
        document.querySelectorAll('.pv-category[data-i18n]').forEach(function(btn) {
            btn.textContent = I18N.t(btn.getAttribute('data-i18n'), null, btn.textContent);
        });
        /* Re-translate pattern tabs */
        document.querySelectorAll('.pv-tab[data-i18n]').forEach(function(tab) {
            tab.textContent = I18N.t(tab.getAttribute('data-i18n'), null, tab.textContent);
        });
        switchPattern(PV.state.pattern, PV.state.mode);
        /* Re-apply speed label */
        var sr = document.getElementById('speed-range');
        if (sr) {
            var v = parseInt(sr.value);
            if (v <= 300) sr.title = I18N.t('ui.speed.slow', null, 'Slow');
            else if (v <= 700) sr.title = I18N.t('ui.speed.normal', null, 'Normal');
            else if (v <= 1000) sr.title = I18N.t('ui.speed.fast', null, 'Fast');
            else sr.title = I18N.t('ui.speed.ultra', null, 'Ultra');
        }
        PV._updateStepButtons();
    };

    /* ===== Sticky Global Controls ===== */
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
