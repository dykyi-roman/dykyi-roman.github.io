/* ===== Main App: Flow Switching, Mode Tabs, Controls ===== */

(function() {
    'use strict';

    var flowConfigs = {
        classic: {
            name: 'Classic GitFlow',
            modes: GFV.classic.modes,
            initMode: function(modeId) {
                var map = { feature: GFV.classic.feature, release: GFV.classic.release, hotfix: GFV.classic.hotfix };
                if (map[modeId]) map[modeId].init();
            },
            branchRules: GFV.classic.branchRules
        },
        github: {
            name: 'GitHub Flow',
            modes: GFV.github.modes,
            initMode: function(modeId) {
                var map = { feature: GFV.github.feature, deploy: GFV.github.deploy, hotfix: GFV.github.hotfix };
                if (map[modeId]) map[modeId].init();
            },
            branchRules: GFV.github.branchRules
        },
        gitlab: {
            name: 'GitLab Flow',
            modes: GFV.gitlab.modes,
            initMode: function(modeId) {
                var map = { feature: GFV.gitlab.feature, staging: GFV.gitlab.staging, production: GFV.gitlab.production };
                if (map[modeId]) map[modeId].init();
            },
            branchRules: GFV.gitlab.branchRules
        },
        trunk: {
            name: 'Trunk-Based Development',
            modes: GFV.trunk.modes,
            initMode: function(modeId) {
                var map = { direct: GFV.trunk.direct, 'short-lived': GFV.trunk['short-lived'], flags: GFV.trunk.flags };
                if (map[modeId]) map[modeId].init();
            },
            branchRules: GFV.trunk.branchRules
        },
        oneflow: {
            name: 'OneFlow',
            modes: GFV.oneflow.modes,
            initMode: function(modeId) {
                var map = { release: GFV.oneflow.release, hotfix: GFV.oneflow.hotfix, feature: GFV.oneflow.feature };
                if (map[modeId]) map[modeId].init();
            },
            branchRules: GFV.oneflow.branchRules
        },
        environment: {
            name: 'Environment Branching',
            modes: GFV.environment.modes,
            initMode: function(modeId) {
                var map = { promote: GFV.environment.promote, hotfix: GFV.environment.hotfix, rollback: GFV.environment.rollback };
                if (map[modeId]) map[modeId].init();
            },
            branchRules: GFV.environment.branchRules
        },
        release: {
            name: 'Release Branching',
            modes: GFV.release.modes,
            initMode: function(modeId) {
                var map = { create: GFV.release.create, patch: GFV.release.patch, parallel: GFV.release.parallel };
                if (map[modeId]) map[modeId].init();
            },
            branchRules: GFV.release.branchRules
        },
        forking: {
            name: 'Forking Workflow',
            modes: GFV.forking.modes,
            initMode: function(modeId) {
                var map = { contribute: GFV.forking.contribute, sync: GFV.forking.sync, review: GFV.forking.review };
                if (map[modeId]) map[modeId].init();
            },
            branchRules: GFV.forking.branchRules
        },
        'ship-show-ask': {
            name: 'Ship / Show / Ask',
            modes: GFV['ship-show-ask'].modes,
            initMode: function(modeId) {
                var map = { ship: GFV['ship-show-ask'].ship, show: GFV['ship-show-ask'].show, ask: GFV['ship-show-ask'].ask };
                if (map[modeId]) map[modeId].init();
            },
            branchRules: GFV['ship-show-ask'].branchRules
        },
        scaled: {
            name: 'Scaled GitFlow',
            modes: GFV.scaled.modes,
            initMode: function(modeId) {
                var map = { team: GFV.scaled.team, program: GFV.scaled.program, release: GFV.scaled.release };
                if (map[modeId]) map[modeId].init();
            },
            branchRules: GFV.scaled.branchRules
        },
        cherrypick: {
            name: 'Cherry-pick Flow',
            modes: GFV.cherrypick.modes,
            initMode: function(modeId) {
                var map = { backport: GFV.cherrypick.backport, forward: GFV.cherrypick.forward, multi: GFV.cherrypick.multi };
                if (map[modeId]) map[modeId].init();
            },
            branchRules: GFV.cherrypick.branchRules
        }
    };

    function updateHash(flowId, modeId) {
        history.replaceState(null, '', '#' + flowId + '/' + modeId);
    }

    function readHash() {
        var hash = location.hash.replace('#', '');
        if (!hash) return null;
        var parts = hash.split('/');
        if (parts.length === 2 && flowConfigs[parts[0]]) {
            var config = flowConfigs[parts[0]];
            if (config.modes.some(function(m) { return m.id === parts[1]; })) {
                return { flow: parts[0], mode: parts[1] };
            }
        }
        return null;
    }

    function switchFlow(flowId, modeId) {
        GFV.state.flow = flowId;
        GFV.setAccentColors(flowId);

        document.querySelectorAll('.flow-tab').forEach(function(tab) {
            tab.classList.toggle('active', tab.dataset.flow === flowId);
            tab.setAttribute('aria-selected', tab.dataset.flow === flowId);
        });

        GFV.clearGraph();
        GFV.clearLog();
        GFV.resetStats();
        if (GFV.stepMode.active) GFV.exitStepMode();

        var config = flowConfigs[flowId];
        renderModeTabs(flowId);
        switchMode(flowId, modeId || config.modes[0].id);

        if (config.branchRules) {
            GFV.showBranchRules(config.branchRules);
        }
    }

    function renderModeTabs(flowId) {
        var config = flowConfigs[flowId];
        var tabsEl = document.getElementById('mode-tabs');
        tabsEl.innerHTML = config.modes.map(function(m) {
            var label = I18N.t(flowId + '.modes.' + m.id + '.label', null, m.label);
            return '<button class="mode-tab" data-mode="' + m.id + '" role="tab">' + label + '</button>';
        }).join('');

        tabsEl.querySelectorAll('.mode-tab').forEach(function(tab) {
            tab.onclick = function() { switchMode(flowId, tab.dataset.mode); };
        });
    }

    function switchMode(flowId, modeId) {
        GFV.state.mode = modeId;
        updateHash(flowId, modeId);
        var config = flowConfigs[flowId];
        var modeConfig = config.modes.find(function(m) { return m.id === modeId; });

        document.querySelectorAll('.mode-tab').forEach(function(tab) {
            tab.classList.toggle('active', tab.dataset.mode === modeId);
        });

        var descEl = document.getElementById('pattern-desc');
        var descText = modeConfig ? I18N.t(flowId + '.modes.' + modeId + '.desc', null, modeConfig.desc) : '';
        if (flowId === 'classic') {
            descEl.innerHTML = descText + ' <a href="https://nvie.com/posts/a-successful-git-branching-model/" target="_blank" rel="noopener noreferrer" class="pattern-desc-link">Read original article by Vincent Driessen</a>';
        } else if (flowId === 'trunk') {
            descEl.innerHTML = descText + ' <a href="https://trunkbaseddevelopment.com/" target="_blank" rel="noopener noreferrer" class="pattern-desc-link">Read Trunk Based Development guide</a>';
        } else if (flowId === 'github') {
            descEl.innerHTML = descText + ' <a href="https://docs.github.com/en/get-started/using-github/github-flow" target="_blank" rel="noopener noreferrer" class="pattern-desc-link">Read GitHub Flow documentation</a>';
        } else if (flowId === 'gitlab') {
            descEl.innerHTML = descText + ' <a href="https://about.gitlab.com/topics/version-control/what-is-gitlab-flow/" target="_blank" rel="noopener noreferrer" class="pattern-desc-link">Read GitLab Flow documentation</a>';
        } else {
            descEl.textContent = descText;
        }

        updatePatternDetails(flowId, modeId);

        GFV.clearGraph();
        GFV.resetStats();
        GFV.clearLog();
        if (GFV.stepMode.active) GFV.exitStepMode();

        config.initMode(modeId);
    }

    function getCurrentMode() {
        var flowId = GFV.state.flow;
        var modeId = GFV.state.mode;
        var flowObj = GFV[flowId] || GFV[flowId.replace(/-/g, '')];

        if (flowId === 'ship-show-ask') flowObj = GFV['ship-show-ask'];

        if (!flowObj) return null;
        return flowObj[modeId] || null;
    }

    function updatePatternDetails(flowId, modeId) {
        var container = document.getElementById('pattern-details');
        var body = document.getElementById('pattern-details-body');
        var toggle = document.getElementById('pattern-details-toggle');
        if (!container || !body || !toggle) return;

        var flowObj = GFV[flowId];
        if (flowId === 'ship-show-ask') flowObj = GFV['ship-show-ask'];

        var details = flowObj && flowObj.details && flowObj.details[modeId];
        if (!details) {
            container.style.display = 'none';
            body.classList.remove('expanded');
            toggle.setAttribute('aria-expanded', 'false');
            return;
        }

        var i18nPrefix = flowId + '.details.' + modeId;
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
        GFV.showTradeoffs(tradeoffs, i18nPrefix);
    }

    function setupControls() {
        var pauseBtn = document.getElementById('btn-pause');

        document.getElementById('btn-run').onclick = function() {
            var mode = getCurrentMode();
            if (mode && mode.run) {
                if (GFV.stepMode.active) GFV.exitStepMode();
                GFV.state.running = false;
                GFV.state.paused = false;
                GFV.resume();
                pauseBtn.disabled = false;
                pauseBtn.innerHTML = '&#x23F8; ' + I18N.t('ui.btn.pause', null, 'Pause');
                mode.run();
            }
        };

        pauseBtn.onclick = function() {
            if (!GFV.state.running) return;
            if (GFV.state.paused) {
                GFV.resume();
                pauseBtn.innerHTML = '&#x23F8; ' + I18N.t('ui.btn.pause', null, 'Pause');
            } else {
                GFV.pause();
                pauseBtn.innerHTML = '&#x25B6; ' + I18N.t('ui.btn.resume', null, 'Resume');
            }
        };

        document.getElementById('btn-reset').onclick = function() {
            GFV.state.paused = false;
            pauseBtn.disabled = true;
            pauseBtn.innerHTML = '&#x23F8; ' + I18N.t('ui.btn.pause', null, 'Pause');
            switchFlow(GFV.state.flow);
            GFV.log('REQUEST', I18N.t('ui.log.reset', null, 'State reset'));
        };

        document.getElementById('btn-copy-log').onclick = function() {
            GFV.copyLog();
        };
        document.getElementById('btn-clear-log').onclick = function() {
            GFV.clearLog();
        };

        var speedRange = document.getElementById('speed-range');
        var speedValue = document.getElementById('speed-value');
        function updateSpeedLabel(val) {
            var v = parseInt(val);
            GFV.state.stepDelay = 1300 - v;
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

        document.getElementById('btn-step-mode').onclick = function() {
            if (GFV.state.running && GFV.state.paused) {
                GFV.switchToStepMode();
                return;
            }
            if (GFV.stepMode.active) {
                GFV.exitStepMode();
                GFV.clearGraph();
                return;
            }
            var mode = getCurrentMode();
            if (!mode || !mode.steps) return;
            mode.init();
            var steps = mode.steps();
            if (!steps) return;
            var opts = mode.stepOptions ? mode.stepOptions() : {};
            opts._branchNames = Object.keys(GFV.graph.branches);
            GFV.startStepMode(steps, opts);
        };

        document.getElementById('btn-step-fwd').onclick = function() { GFV.stepForward(); };
        document.getElementById('btn-step-back').onclick = function() { GFV.stepBack(); };

        document.querySelectorAll('.flow-tab').forEach(function(tab) {
            tab.onclick = function() { switchFlow(tab.dataset.flow); };
        });
    }

    document.addEventListener('DOMContentLoaded', function() {
        I18N.onReady(function() {
            setupControls();
            GFV._updateStepButtons();
            I18N.applyToDOM();
            var saved = readHash();
            if (saved) {
                switchFlow(saved.flow, saved.mode);
            } else {
                switchFlow('classic');
            }
        });
    });

    window.addEventListener('hashchange', function() {
        var saved = readHash();
        if (saved && (saved.flow !== GFV.state.flow || saved.mode !== GFV.state.mode)) {
            switchFlow(saved.flow, saved.mode);
        }
    });

    /* ===== i18n Refresh ===== */
    window.GFV_refresh = function() {
        switchFlow(GFV.state.flow, GFV.state.mode);
        GFV._updateStepButtons();
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