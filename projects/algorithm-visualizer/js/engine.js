/* ===== Algorithm Visualizer Engine ===== */

var AV = window.AV || {};
window.AV = AV;

AV.state = {
    algorithm: 'bubble-sort',
    mode: null,
    running: false,
    paused: false,
    _pauseResolve: null,
    stepIndex: 0,
    stepDelay: 600,
    comparisons: 0,
    swaps: 0,
    array: [],
    _initialArray: [],
    sortedIndices: []
};

/* ===== Event Log ===== */
AV.log = function(type, text) {
    var logEl = document.getElementById('event-log');
    if (!logEl) return;
    var now = new Date();
    var ts = now.toTimeString().slice(0, 8) + '.' + String(now.getMilliseconds()).padStart(3, '0');
    var entry = document.createElement('div');
    entry.className = 'log-entry';

    var timeSpan = document.createElement('span');
    timeSpan.className = 'log-time';
    timeSpan.textContent = ts;

    var typeSpan = document.createElement('span');
    typeSpan.className = 'log-type ' + type;
    typeSpan.textContent = (window.I18N && I18N.t) ? I18N.t('ui.log.type.' + type, {}, type) : type;

    var textSpan = document.createElement('span');
    textSpan.className = 'log-text';
    textSpan.textContent = text;

    entry.appendChild(timeSpan);
    entry.appendChild(typeSpan);
    entry.appendChild(textSpan);
    logEl.appendChild(entry);
    logEl.scrollTop = logEl.scrollHeight;
};

AV.clearLog = function() {
    var logEl = document.getElementById('event-log');
    if (logEl) logEl.innerHTML = '';
};

AV.copyLog = function() {
    var logEl = document.getElementById('event-log');
    if (!logEl) return;
    var entries = logEl.querySelectorAll('.log-entry');
    var lines = Array.from(entries).map(function(e) {
        var time = e.querySelector('.log-time');
        var type = e.querySelector('.log-type');
        var text = e.querySelector('.log-text');
        return (time ? time.textContent : '') + ' ' + (type ? type.textContent : '') + ' ' + (text ? text.textContent : '');
    });
    navigator.clipboard.writeText(lines.join('\n')).then(function() {
        var btn = document.getElementById('btn-copy-log');
        if (!btn) return;
        btn.textContent = I18N.t('ui.btn.copied', null, 'Copied!');
        setTimeout(function() { btn.textContent = I18N.t('ui.btn.copy', null, 'Copy'); }, 1500);
    });
};

/* ===== Stats ===== */
AV.updateStats = function() {
    var s = AV.state;
    var cmpEl = document.getElementById('stat-comparisons');
    var swpEl = document.getElementById('stat-swaps');
    if (cmpEl) cmpEl.textContent = s.comparisons;
    if (swpEl) swpEl.textContent = s.swaps;
};

AV.resetStats = function() {
    var s = AV.state;
    s.comparisons = 0;
    s.swaps = 0;
    s.stepIndex = 0;
    s.running = false;
    s.sortedIndices = [];
    AV.updateStats();
};

/* ===== Helpers ===== */
AV.sleep = async function(ms) {
    await new Promise(function(r) { setTimeout(r, ms); });
    while (AV.state.paused) {
        await new Promise(function(r) { AV.state._pauseResolve = r; });
    }
};

AV.pause = function() {
    AV.state.paused = true;
};

AV.resume = function() {
    AV.state.paused = false;
    if (AV.state._pauseResolve) {
        AV.state._pauseResolve();
        AV.state._pauseResolve = null;
    }
};

/* ===== Array Generation ===== */
AV.generateRandomArray = function(size, min, max) {
    var arr = [];
    for (var i = 0; i < size; i++) {
        arr.push(Math.floor(Math.random() * (max - min + 1)) + min);
    }
    return arr;
};

/* ===== Array Rendering ===== */
AV.renderArray = function(arr) {
    var canvas = document.getElementById('av-canvas');
    if (!canvas) return;

    AV.state.array = arr.slice();
    var maxVal = Math.max.apply(null, arr);
    var containerHeight = 400;

    var html = '<div class="av-bar-container">';
    for (var i = 0; i < arr.length; i++) {
        var height = Math.max(8, (arr[i] / maxVal) * containerHeight);
        html += '<div class="av-bar" data-index="' + i + '" data-value="' + arr[i] + '" style="height:' + height + 'px">' +
            '<span class="av-bar-value">' + arr[i] + '</span></div>';
    }
    html += '</div>';
    canvas.innerHTML = html;
};

/* ===== Bar Highlighting ===== */
AV.highlightBars = function(indices, className) {
    var bars = document.querySelectorAll('.av-bar');
    indices.forEach(function(idx) {
        if (bars[idx]) bars[idx].classList.add(className);
    });
};

AV.clearHighlights = function() {
    document.querySelectorAll('.av-bar').forEach(function(bar) {
        bar.classList.remove('av-comparing', 'av-swapping', 'av-examined');
    });
};

AV.markSorted = function(index) {
    var bars = document.querySelectorAll('.av-bar');
    if (bars[index]) {
        bars[index].classList.add('av-sorted');
    }
    if (AV.state.sortedIndices.indexOf(index) === -1) {
        AV.state.sortedIndices.push(index);
    }
};

/* ===== Swap Animation ===== */
AV.animateSwap = function(i, j) {
    return new Promise(function(resolve) {
        var container = document.querySelector('.av-bar-container');
        if (!container) { resolve(); return; }
        var bars = container.children;
        var barI = bars[i];
        var barJ = bars[j];
        if (!barI || !barJ) { resolve(); return; }

        var rectI = barI.getBoundingClientRect();
        var rectJ = barJ.getBoundingClientRect();
        var distance = rectJ.left - rectI.left;

        barI.style.transition = 'transform 0.3s ease';
        barJ.style.transition = 'transform 0.3s ease';
        barI.style.transform = 'translateX(' + distance + 'px)';
        barJ.style.transform = 'translateX(' + (-distance) + 'px)';

        setTimeout(function() {
            barI.style.transition = '';
            barJ.style.transition = '';
            barI.style.transform = '';
            barJ.style.transform = '';

            /* Swap DOM positions */
            if (i < j) {
                container.insertBefore(barJ, barI);
            } else {
                container.insertBefore(barI, barJ);
            }

            resolve();
        }, 320);
    });
};

/* ===== Accent Colors ===== */
AV.setAccentColors = function(algorithmId) {
    var root = document.documentElement.style;
    var themes = {
        'bubble-sort': { accent: '#3B82F6', bg: '#0d1630', light: '#152048' },
        'linear-search': { accent: '#8B5CF6', bg: '#1a0d30', light: '#221548' }
    };
    var t = themes[algorithmId] || themes['bubble-sort'];
    root.setProperty('--av-accent', t.accent);
    root.setProperty('--av-accent-bg', t.bg);
    root.setProperty('--av-accent-light', t.light);
};

/* ===== Trade-offs Rendering ===== */
AV.showTradeoffs = function(tradeoffs, i18nPrefix) {
    var container = document.getElementById('tradeoffs-panel');
    var body = document.getElementById('tradeoffs-body');
    var toggle = document.getElementById('tradeoffs-toggle');
    if (!container || !body || !toggle) return;

    if (!tradeoffs) {
        container.style.display = 'none';
        body.classList.remove('expanded');
        toggle.setAttribute('aria-expanded', 'false');
        return;
    }

    var pros = i18nPrefix ? I18N.ta(i18nPrefix + '.tradeoffs.pros', tradeoffs.pros || []) : (tradeoffs.pros || []);
    var cons = i18nPrefix ? I18N.ta(i18nPrefix + '.tradeoffs.cons', tradeoffs.cons || []) : (tradeoffs.cons || []);
    var whenToUse = i18nPrefix ? I18N.t(i18nPrefix + '.tradeoffs.whenToUse', null, tradeoffs.whenToUse || '') : (tradeoffs.whenToUse || '');

    var html = '<div class="tradeoffs-grid">';
    html += '<div class="tradeoffs-col"><div class="tradeoffs-col-title pros">&#x2705; ' + I18N.t('ui.tradeoffs.pros', null, 'Pros') + '</div>';
    pros.forEach(function(p) {
        html += '<div class="tradeoffs-item pro">' + p + '</div>';
    });
    html += '</div>';
    html += '<div class="tradeoffs-col"><div class="tradeoffs-col-title cons">&#x274C; ' + I18N.t('ui.tradeoffs.cons', null, 'Cons') + '</div>';
    cons.forEach(function(c) {
        html += '<div class="tradeoffs-item con">' + c + '</div>';
    });
    html += '</div></div>';

    if (whenToUse) {
        html += '<div class="tradeoffs-when">' +
            '<div class="tradeoffs-when-title">' + I18N.t('ui.tradeoffs.when', null, 'When to Use') + '</div>' +
            whenToUse + '</div>';
    }

    body.innerHTML = html;
    body.classList.remove('expanded');
    toggle.setAttribute('aria-expanded', 'false');
    container.style.display = 'block';
};

/* ===== Complexity Panel ===== */
AV.showComplexity = function(rules, i18nKey) {
    var body = document.getElementById('dep-rules-body');
    if (!body) return;

    var translated = i18nKey ? I18N.to(i18nKey, rules) : rules;
    var html = '';
    translated.forEach(function(r) {
        var cls = r.type === 'good' ? 'allowed' : (r.type === 'bad' ? 'forbidden' : 'info');
        var icon = r.type === 'good' ? '&#x2705;' : (r.type === 'bad' ? '&#x274C;' : '&#x1F539;');
        html += '<div class="dep-rule ' + cls + '">' +
            '<span class="dep-rule-icon">' + icon + '</span>' +
            '<span><strong>' + r.name + '</strong> — ' + r.role + '</span>' +
            '</div>';
    });

    body.innerHTML = html;
};

/* ===== Animate Algorithm Flow ===== */
AV.animateFlow = async function(steps, options) {
    if (AV.state.running) return;

    if (AV.stepMode.active) {
        AV.exitStepMode();
    }

    AV.state.comparisons = 0;
    AV.state.swaps = 0;
    AV.state.sortedIndices = [];
    AV.updateStats();
    AV.state.stepIndex = 0;
    AV.state._flowSteps = steps;
    AV.state._flowOptions = options;
    AV.state.running = true;

    var opts = options || {};
    AV.log('REQUEST', opts.requestLabel || I18N.t('av.log.started', null, 'Algorithm started'));
    var startTime = performance.now();

    for (var i = 0; i < steps.length; i++) {
        if (!AV.state.running) break;
        AV.state.stepIndex = i;

        var step = steps[i];

        if (step.type === 'COMPARE') {
            AV.clearHighlights();
            AV.highlightBars(step.indices, 'av-comparing');
            AV.state.comparisons++;
            AV.updateStats();
            AV.log('COMPARE', I18N.t('av.log.compare', { a: step.values[0], b: step.values[1], i: step.indices[0], j: step.indices[1] },
                'Compare arr[' + step.indices[0] + ']=' + step.values[0] + ' with arr[' + step.indices[1] + ']=' + step.values[1]));
            await AV.sleep(AV.state.stepDelay);
        } else if (step.type === 'SWAP') {
            AV.clearHighlights();
            AV.highlightBars(step.indices, 'av-swapping');
            AV.state.swaps++;
            AV.updateStats();
            AV.log('SWAP', I18N.t('av.log.swap', { a: step.values[0], b: step.values[1], i: step.indices[0], j: step.indices[1] },
                'Swap arr[' + step.indices[0] + ']=' + step.values[0] + ' \u2194 arr[' + step.indices[1] + ']=' + step.values[1]));
            await AV.animateSwap(step.indices[0], step.indices[1]);
            await AV.sleep(AV.state.stepDelay * 0.5);
        } else if (step.type === 'SORTED') {
            AV.clearHighlights();
            AV.markSorted(step.index);
            AV.log('SORTED', I18N.t('av.log.sorted', { index: step.index, value: step.value },
                'Position ' + step.index + ' (value=' + step.value + ') is sorted'));
            await AV.sleep(AV.state.stepDelay * 0.3);
        } else if (step.type === 'PASS') {
            AV.clearHighlights();
            AV.log('PASS', I18N.t('av.log.pass', { n: step.pass },
                'Pass ' + step.pass + ' begins'));
            await AV.sleep(AV.state.stepDelay * 0.3);
        } else if (step.type === 'SCAN') {
            AV.clearHighlights();
            var bars = document.querySelectorAll('.av-bar');
            for (var ei = 0; ei < step.index; ei++) {
                if (bars[ei]) bars[ei].classList.add('av-examined');
            }
            AV.highlightBars([step.index], 'av-comparing');
            AV.state.comparisons++;
            AV.updateStats();
            AV.log('SCAN', I18N.t('av.log.scan', { index: step.index, value: step.value, target: step.target },
                'Scan arr[' + step.index + ']=' + step.value + ' vs target=' + step.target));
            await AV.sleep(AV.state.stepDelay);
        } else if (step.type === 'FOUND') {
            AV.clearHighlights();
            var barsF = document.querySelectorAll('.av-bar');
            for (var fi = 0; fi < step.index; fi++) {
                if (barsF[fi]) barsF[fi].classList.add('av-examined');
            }
            AV.highlightBars([step.index], 'av-sorted');
            AV.log('FOUND', I18N.t('av.log.found', { index: step.index, value: step.value },
                'Found ' + step.value + ' at index ' + step.index));
            await AV.sleep(AV.state.stepDelay);
        } else if (step.type === 'DONE') {
            AV.clearHighlights();
            if (step.found === false) {
                document.querySelectorAll('.av-bar').forEach(function(bar) { bar.classList.add('av-examined'); });
            } else {
                document.querySelectorAll('.av-bar').forEach(function(bar) { bar.classList.add('av-sorted'); });
            }
        }
    }

    var elapsed = Math.round(performance.now() - startTime);
    if (AV.state.running) {
        if (AV.state._searchTarget !== undefined) {
            AV.log('DONE', I18N.t('av.log.done_search', { time: elapsed, comparisons: AV.state.comparisons },
                'Completed in ' + elapsed + 'ms (' + AV.state.comparisons + ' comparisons)'));
        } else {
            AV.log('DONE', I18N.t('av.log.done', { time: elapsed, comparisons: AV.state.comparisons, swaps: AV.state.swaps },
                'Completed in ' + elapsed + 'ms (' + AV.state.comparisons + ' comparisons, ' + AV.state.swaps + ' swaps)'));
        }
    }
    AV.state.running = false;
    AV.state.paused = false;
    AV.state._flowSteps = null;
    AV.state._flowOptions = null;
    var pauseBtn = document.getElementById('btn-pause');
    if (pauseBtn) {
        pauseBtn.disabled = true;
        pauseBtn.innerHTML = '&#x23F8; ' + I18N.t('ui.btn.pause', null, 'Pause');
    }
};

/* ===== Step Mode ===== */
AV.stepMode = {
    active: false,
    steps: null,
    index: 0,
    options: null,
    arraySnapshots: null
};

AV._computeSnapshots = function(initialArray, steps) {
    var arr = initialArray.slice();
    var sorted = [];
    var snapshots = [{ arr: arr.slice(), sorted: sorted.slice() }];

    for (var i = 0; i < steps.length; i++) {
        var step = steps[i];
        if (step.type === 'SWAP') {
            var tmp = arr[step.indices[0]];
            arr[step.indices[0]] = arr[step.indices[1]];
            arr[step.indices[1]] = tmp;
        } else if (step.type === 'SORTED') {
            sorted = sorted.concat([step.index]);
        } else if (step.type === 'FOUND') {
            sorted = sorted.concat([step.index]);
        } else if (step.type === 'DONE') {
            if (step.found !== false) {
                sorted = [];
                for (var k = 0; k < arr.length; k++) sorted.push(k);
            }
        }
        snapshots.push({ arr: arr.slice(), sorted: sorted.slice() });
    }
    return snapshots;
};

AV.startStepMode = function(steps, options, initialArray, resumeFromIndex) {
    var snapshots = AV._computeSnapshots(initialArray, steps);

    if (resumeFromIndex > 0) {
        /* Resume from current animation position — keep stats and log */
        AV.state.running = false;

        AV.stepMode.active = true;
        AV.stepMode.steps = steps;
        AV.stepMode.index = resumeFromIndex;
        AV.stepMode.options = options || {};
        AV.stepMode.arraySnapshots = snapshots;

        /* Render the snapshot at the current position */
        var snapshot = snapshots[resumeFromIndex];
        AV.renderArray(snapshot.arr);
        snapshot.sorted.forEach(function(idx) { AV.markSorted(idx); });

        /* Re-inject target line for search algorithms after renderArray */
        if (AV.state._searchTarget !== undefined && AV['linear-search'] && AV['linear-search']._injectTargetLine) {
            AV['linear-search']._injectTargetLine(snapshot.arr, AV.state._searchTarget);
        }

        /* Restore highlight from the last executed step */
        if (resumeFromIndex > 0) {
            var lastStep = steps[resumeFromIndex - 1];
            if (lastStep.type === 'COMPARE') AV.highlightBars(lastStep.indices, 'av-comparing');
            else if (lastStep.type === 'SWAP') AV.highlightBars(lastStep.indices, 'av-swapping');
            else if (lastStep.type === 'SCAN') {
                var bars = document.querySelectorAll('.av-bar');
                for (var ei = 0; ei < lastStep.index; ei++) {
                    if (bars[ei]) bars[ei].classList.add('av-examined');
                }
                AV.highlightBars([lastStep.index], 'av-comparing');
            } else if (lastStep.type === 'FOUND') {
                var barsF = document.querySelectorAll('.av-bar');
                for (var fi = 0; fi < lastStep.index; fi++) {
                    if (barsF[fi]) barsF[fi].classList.add('av-examined');
                }
                AV.highlightBars([lastStep.index], 'av-sorted');
            }
        }

        AV.log('PASS', I18N.t('ui.log.step_mode_resume', { step: resumeFromIndex },
            'Step mode from step ' + resumeFromIndex));
    } else {
        /* Fresh start */
        AV.resetStats();
        AV.clearLog();
        AV.state.running = false;

        AV.stepMode.active = true;
        AV.stepMode.steps = steps;
        AV.stepMode.index = 0;
        AV.stepMode.options = options || {};
        AV.stepMode.arraySnapshots = snapshots;

        AV.log('REQUEST', options && options.requestLabel ? options.requestLabel : I18N.t('ui.log.step_mode_start', null, 'Step mode started'));
    }
    AV._updateStepButtons();
};

AV.stepForward = function() {
    var sm = AV.stepMode;
    if (!sm.active || sm.index >= sm.steps.length) return;

    var step = sm.steps[sm.index];
    var snapshot = sm.arraySnapshots[sm.index + 1];

    AV.renderArray(snapshot.arr);
    snapshot.sorted.forEach(function(idx) { AV.markSorted(idx); });

    /* Re-inject target line for search algorithms after renderArray */
    if (AV.state._searchTarget !== undefined && AV['linear-search'] && AV['linear-search']._injectTargetLine) {
        AV['linear-search']._injectTargetLine(snapshot.arr, AV.state._searchTarget);
    }

    if (step.type === 'COMPARE') {
        AV.highlightBars(step.indices, 'av-comparing');
        AV.state.comparisons++;
        AV.log('COMPARE', 'Compare arr[' + step.indices[0] + ']=' + step.values[0] + ' with arr[' + step.indices[1] + ']=' + step.values[1]);
    } else if (step.type === 'SWAP') {
        AV.highlightBars(step.indices, 'av-swapping');
        AV.state.swaps++;
        AV.log('SWAP', 'Swap arr[' + step.indices[0] + ']=' + step.values[0] + ' \u2194 arr[' + step.indices[1] + ']=' + step.values[1]);
    } else if (step.type === 'SCAN') {
        var bars = document.querySelectorAll('.av-bar');
        for (var ei = 0; ei < step.index; ei++) {
            if (bars[ei]) bars[ei].classList.add('av-examined');
        }
        AV.highlightBars([step.index], 'av-comparing');
        AV.state.comparisons++;
        AV.log('SCAN', 'Scan arr[' + step.index + ']=' + step.value + ' vs target=' + step.target);
    } else if (step.type === 'FOUND') {
        var barsF = document.querySelectorAll('.av-bar');
        for (var fi = 0; fi < step.index; fi++) {
            if (barsF[fi]) barsF[fi].classList.add('av-examined');
        }
        AV.highlightBars([step.index], 'av-sorted');
        AV.log('FOUND', 'Found ' + step.value + ' at index ' + step.index);
    } else if (step.type === 'SORTED') {
        AV.log('SORTED', 'Position ' + step.index + ' is sorted');
    } else if (step.type === 'PASS') {
        AV.log('PASS', 'Pass ' + step.pass);
    } else if (step.type === 'DONE') {
        if (step.found === false) {
            document.querySelectorAll('.av-bar').forEach(function(bar) { bar.classList.add('av-examined'); });
            AV.log('DONE', I18N.t('av.log.not_found', null, 'Target not found'));
        } else if (AV.state._searchTarget !== undefined) {
            AV.log('DONE', I18N.t('av.log.done_step', null, 'Search complete'));
        } else {
            AV.log('DONE', I18N.t('av.log.done_step', null, 'Sorting complete'));
        }
    }

    AV.updateStats();
    sm.index++;
    AV._updateStepButtons();

    /* Auto-advance past non-visual steps (PASS) so each click shows a bar change */
    if (step.type === 'PASS' && sm.index < sm.steps.length) {
        AV.stepForward();
    }
};

AV.stepBack = function() {
    var sm = AV.stepMode;
    if (!sm.active || sm.index <= 0) return;

    sm.index--;
    var snapshot = sm.arraySnapshots[sm.index];

    var comparisons = 0;
    var swaps = 0;
    for (var i = 0; i < sm.index; i++) {
        if (sm.steps[i].type === 'COMPARE' || sm.steps[i].type === 'SCAN') comparisons++;
        if (sm.steps[i].type === 'SWAP') swaps++;
    }
    AV.state.comparisons = comparisons;
    AV.state.swaps = swaps;
    AV.updateStats();

    AV.renderArray(snapshot.arr);
    snapshot.sorted.forEach(function(idx) { AV.markSorted(idx); });

    /* Re-inject target line for search algorithms after renderArray */
    if (AV.state._searchTarget !== undefined && AV['linear-search'] && AV['linear-search']._injectTargetLine) {
        AV['linear-search']._injectTargetLine(snapshot.arr, AV.state._searchTarget);
    }

    if (sm.index > 0) {
        var prevStep = sm.steps[sm.index - 1];
        if (prevStep.type === 'COMPARE') AV.highlightBars(prevStep.indices, 'av-comparing');
        else if (prevStep.type === 'SWAP') AV.highlightBars(prevStep.indices, 'av-swapping');
        else if (prevStep.type === 'SCAN') {
            var bars = document.querySelectorAll('.av-bar');
            for (var ei = 0; ei < prevStep.index; ei++) {
                if (bars[ei]) bars[ei].classList.add('av-examined');
            }
            AV.highlightBars([prevStep.index], 'av-comparing');
        } else if (prevStep.type === 'FOUND') {
            var barsF = document.querySelectorAll('.av-bar');
            for (var fi = 0; fi < prevStep.index; fi++) {
                if (barsF[fi]) barsF[fi].classList.add('av-examined');
            }
            AV.highlightBars([prevStep.index], 'av-sorted');
        }
    }

    AV._updateStepButtons();
};

AV.exitStepMode = function() {
    AV.stepMode.active = false;
    AV.stepMode.steps = null;
    AV.stepMode.index = 0;
    AV.stepMode.arraySnapshots = null;
    AV._updateStepButtons();
};

AV.switchToStepMode = function() {
    if (!AV.state.running || !AV.state.paused) return;

    var steps = AV.state._flowSteps;
    var options = AV.state._flowOptions || {};
    var currentIndex = AV.state.stepIndex;
    var savedComparisons = AV.state.comparisons;
    var savedSwaps = AV.state.swaps;

    /* Stop the running animation */
    AV.state._flowSteps = null;
    AV.state._flowOptions = null;
    AV.state.running = false;
    AV.resume();

    var pauseBtn = document.getElementById('btn-pause');
    if (pauseBtn) {
        pauseBtn.disabled = true;
        pauseBtn.innerHTML = '&#x23F8; ' + I18N.t('ui.btn.pause', null, 'Pause');
    }

    if (steps) {
        AV.startStepMode(steps, options, AV.state._initialArray, currentIndex);
        /* Restore stats from animation */
        AV.state.comparisons = savedComparisons;
        AV.state.swaps = savedSwaps;
        AV.updateStats();
    }
};

AV._updateStepButtons = function() {
    var sm = AV.stepMode;
    var btnBack = document.getElementById('btn-step-back');
    var btnFwd = document.getElementById('btn-step-fwd');
    var btnStep = document.getElementById('btn-step-mode');
    if (!btnBack || !btnFwd || !btnStep) return;

    if (sm.active) {
        btnBack.disabled = sm.index <= 0;
        btnFwd.disabled = sm.index >= (sm.steps ? sm.steps.length : 0);
        btnBack.style.display = '';
        btnFwd.style.display = '';
        btnStep.classList.add('active');
        btnStep.innerHTML = '&#x23F9; ' + I18N.t('ui.btn.exit_steps', null, 'Exit Steps');
    } else {
        btnBack.style.display = 'none';
        btnFwd.style.display = 'none';
        btnStep.classList.remove('active');
        btnStep.innerHTML = '&#x23ED; ' + I18N.t('ui.btn.step_mode', null, 'Step Mode');
    }
};
