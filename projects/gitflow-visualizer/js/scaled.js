/* ===== Scaled GitFlow / SAFe ===== */

var GFV = window.GFV || {};
window.GFV = GFV;

GFV.scaled = {};

/* ===== Modes ===== */
GFV.scaled.modes = [
    { id: 'team', label: 'Team Branch Flow', desc: 'A team branch is created from develop for isolated team-level work. Multiple commits happen on the team branch, then it is merged back into develop. Develop is eventually merged into main and tagged for release.' },
    { id: 'program', label: 'Program Integration', desc: 'Multiple team branches are created from develop for parallel team work. Each team merges into develop independently. Once all teams have integrated, develop is merged into main, tagged, and deployed as a program increment.' },
    { id: 'release', label: 'Scaled Release', desc: 'A release branch (program increment) is cut from develop for stabilization. Bug fixes go into the release branch, which is then merged into main with a version tag and back into develop to preserve fixes.' }
];

/* ===== Branch Rules ===== */
GFV.scaled.branchRules = [
    { from: 'team/*', to: 'develop', allowed: true },
    { from: 'develop', to: 'release/*', allowed: true },
    { from: 'release/*', to: 'main', allowed: true },
    { from: 'release/*', to: 'develop', allowed: true },
    { from: 'team/*', to: 'main', allowed: false },
    { from: 'team/*', to: 'team/*', allowed: false }
];

/* ===== Details ===== */
GFV.scaled.details = {
    team: {
        principles: [
            'Team branches provide isolation for team-level work without affecting other teams',
            'Program increment integration happens through the shared develop branch',
            'Release trains coordinate delivery across multiple teams on a schedule',
            'Multiple teams contribute to a shared develop branch as the integration point'
        ],
        concepts: [
            { term: 'team/*', definition: 'Team-level isolation branch. Created from develop, used for a single team\'s work during a program increment. Merged back into develop when complete.' },
            { term: 'Program Increment (PI)', definition: 'A scheduled integration cycle (typically 8-12 weeks) where all teams plan, develop, and integrate their work into a shared codebase.' },
            { term: 'Release Train', definition: 'A coordinated release mechanism that aligns multiple teams to deliver on a fixed cadence, regardless of individual team completion.' },
            { term: 'develop', definition: 'The integration point where all team branches converge. Serves as the source of truth for the next release.' }
        ],
        tradeoffs: {
            pros: [
                'Scales to large organizations with many teams',
                'Team isolation prevents cross-team interference',
                'Coordinated releases ensure predictable delivery',
                'Clear integration points reduce last-minute surprises'
            ],
            cons: [
                'High complexity in branch management and merge coordination',
                'Merge conflicts escalate when many teams integrate simultaneously',
                'Requires significant tooling and process discipline'
            ],
            whenToUse: 'Large enterprises adopting SAFe or scaled agile frameworks, organizations with 5+ teams contributing to the same product, and systems requiring coordinated release trains.'
        }
    },
    program: {
        principles: [
            'Team branches provide isolation for team-level work without affecting other teams',
            'Program increment integration happens through the shared develop branch',
            'Release trains coordinate delivery across multiple teams on a schedule',
            'Multiple teams contribute to a shared develop branch as the integration point'
        ],
        concepts: [
            { term: 'team/*', definition: 'Team-level isolation branch. Created from develop, used for a single team\'s work during a program increment. Merged back into develop when complete.' },
            { term: 'Program Increment (PI)', definition: 'A scheduled integration cycle (typically 8-12 weeks) where all teams plan, develop, and integrate their work into a shared codebase.' },
            { term: 'Release Train', definition: 'A coordinated release mechanism that aligns multiple teams to deliver on a fixed cadence, regardless of individual team completion.' },
            { term: 'develop', definition: 'The integration point where all team branches converge. Serves as the source of truth for the next release.' }
        ],
        tradeoffs: {
            pros: [
                'Scales to large organizations with many teams',
                'Team isolation prevents cross-team interference',
                'Coordinated releases ensure predictable delivery',
                'Clear integration points reduce last-minute surprises'
            ],
            cons: [
                'High complexity in branch management and merge coordination',
                'Merge conflicts escalate when many teams integrate simultaneously',
                'Requires significant tooling and process discipline'
            ],
            whenToUse: 'Large enterprises adopting SAFe or scaled agile frameworks, organizations with 5+ teams contributing to the same product, and systems requiring coordinated release trains.'
        }
    },
    release: {
        principles: [
            'Team branches provide isolation for team-level work without affecting other teams',
            'Program increment integration happens through the shared develop branch',
            'Release trains coordinate delivery across multiple teams on a schedule',
            'Multiple teams contribute to a shared develop branch as the integration point'
        ],
        concepts: [
            { term: 'team/*', definition: 'Team-level isolation branch. Created from develop, used for a single team\'s work during a program increment. Merged back into develop when complete.' },
            { term: 'Program Increment (PI)', definition: 'A scheduled integration cycle (typically 8-12 weeks) where all teams plan, develop, and integrate their work into a shared codebase.' },
            { term: 'Release Train', definition: 'A coordinated release mechanism that aligns multiple teams to deliver on a fixed cadence, regardless of individual team completion.' },
            { term: 'develop', definition: 'The integration point where all team branches converge. Serves as the source of truth for the next release.' }
        ],
        tradeoffs: {
            pros: [
                'Scales to large organizations with many teams',
                'Team isolation prevents cross-team interference',
                'Coordinated releases ensure predictable delivery',
                'Clear integration points reduce last-minute surprises'
            ],
            cons: [
                'High complexity in branch management and merge coordination',
                'Merge conflicts escalate when many teams integrate simultaneously',
                'Requires significant tooling and process discipline'
            ],
            whenToUse: 'Large enterprises adopting SAFe or scaled agile frameworks, organizations with 5+ teams contributing to the same product, and systems requiring coordinated release trains.'
        }
    }
};

/* ===== Team Mode ===== */
GFV.scaled.team = {
    init: function() {
        this._b = 'team/' + GFV.jira();
        GFV.initGraph(['main', 'develop', this._b]);
    },
    steps: function() {
        var b = this._b;
        return [
            { op: 'commit', branch: 'main', label: 'v2.9', description: 'Previous release v2.9 on main — starting point for the new Program Increment cycle', logType: 'COMMIT' },
            { op: 'branch', branch: 'develop', fromBranch: 'main', label: 'develop', description: 'Create develop branch from main — shared integration branch for all teams during this PI', logType: 'BRANCH' },
            { op: 'commit', branch: 'develop', label: 'PI planning', description: 'PI planning artifacts committed — sprint goals, dependency mapping, and capacity allocation for all teams', logType: 'COMMIT' },
            { op: 'branch', branch: b, fromBranch: 'develop', label: b, description: 'Branch ' + b + ' from develop — team begins isolated work on their PI objectives', logType: 'BRANCH' },
            { op: 'commit', branch: b, label: 'UI redesign', description: 'Implement new UI components — redesigned navigation bar, updated color scheme, and responsive sidebar', logType: 'COMMIT' },
            { op: 'commit', branch: b, label: 'Add tests', description: 'Add frontend integration tests — Cypress E2E tests for the new navigation flow and visual regression suite', logType: 'COMMIT' },
            { op: 'merge', fromBranch: b, toBranch: 'develop', label: 'Integrate', description: 'Merge ' + b + ' into develop — team\'s work integrated into the shared branch for cross-team testing', logType: 'MERGE' },
            { op: 'commit', branch: 'develop', label: 'Stabilize', description: 'Integration stabilization on develop — resolving cross-team conflicts and running full regression suite', logType: 'COMMIT' },
            { op: 'merge', fromBranch: 'develop', toBranch: 'main', label: 'Release', description: 'Merge develop into main — PI complete, all team contributions integrated and validated', logType: 'MERGE' },
            { op: 'tag', branch: 'main', tagName: 'v3.0', description: 'Tag v3.0 on main — marking the Program Increment delivery milestone', logType: 'TAG' },
            { op: 'delete-branch', branch: b, label: 'Cleanup', description: 'Delete ' + b + ' branch — PI delivered, team branch served its purpose', logType: 'DELETE' }
        ];
    },
    stepOptions: function() {
        return { requestLabel: 'Team Branch Flow: ' + this._b, _initFn: GFV.scaled.team.init };
    },
    run: function() {
        GFV.scaled.team.init();
        GFV.animateFlow(GFV.scaled.team.steps(), GFV.scaled.team.stepOptions());
    }
};

/* ===== Program Mode ===== */
GFV.scaled.program = {
    init: function() {
        this._b1 = 'team/' + GFV.jira();
        this._b2 = 'team/' + GFV.jira();
        GFV.initGraph(['main', 'develop', this._b1, this._b2], { commitSpacing: 60 });
    },
    steps: function() {
        var b1 = this._b1, b2 = this._b2;
        return [
            { op: 'commit', branch: 'main', label: 'v2.9', description: 'Previous release v2.9 on main — baseline for the multi-team Program Increment', logType: 'COMMIT' },
            { op: 'branch', branch: 'develop', fromBranch: 'main', label: 'develop', description: 'Create develop branch from main — integration point where both teams will converge their work', logType: 'BRANCH' },
            { op: 'branch', branch: b1, fromBranch: 'develop', label: b1, description: 'Frontend team branches ' + b1 + ' from develop — working on the new customer dashboard UI', logType: 'BRANCH' },
            { op: 'branch', branch: b2, fromBranch: 'develop', label: b2, description: 'Backend team branches ' + b2 + ' from develop — building the REST API that powers the new dashboard', logType: 'BRANCH' },
            { op: 'commit', branch: b1, label: 'UI work', description: 'Frontend team implements dashboard components — charts, data tables, and real-time WebSocket updates', logType: 'COMMIT' },
            { op: 'commit', branch: b2, label: 'API work', description: 'Backend team implements API endpoints — /api/v2/dashboard with filtering, sorting, and pagination', logType: 'COMMIT' },
            { op: 'commit', branch: b1, label: 'UI tests', description: 'Frontend team adds E2E tests — Cypress tests for dashboard rendering, data binding, and error states', logType: 'COMMIT' },
            { op: 'commit', branch: b2, label: 'API tests', description: 'Backend team adds API tests — integration tests for endpoint responses, auth, and rate limiting', logType: 'COMMIT' },
            { op: 'merge', fromBranch: b1, toBranch: 'develop', label: 'Integrate FE', description: 'Merge ' + b1 + ' into develop — frontend work integrated, ready for cross-team testing with backend', logType: 'MERGE' },
            { op: 'merge', fromBranch: b2, toBranch: 'develop', label: 'Integrate BE', description: 'Merge ' + b2 + ' into develop — backend integrated, full-stack feature now assembled on develop', logType: 'MERGE' },
            { op: 'commit', branch: 'develop', label: 'Stabilize', description: 'Integration stabilization on develop — verifying FE + BE compatibility, running full-stack regression and contract tests', logType: 'COMMIT' },
            { op: 'merge', fromBranch: 'develop', toBranch: 'main', label: 'PI Release', description: 'Merge develop into main — both teams\' work validated together, Program Increment complete', logType: 'MERGE' },
            { op: 'tag', branch: 'main', tagName: 'v3.0-PI', description: 'Tag v3.0-PI on main — marking the coordinated Program Increment delivery milestone', logType: 'TAG' },
            { op: 'deploy', branch: 'main', envName: 'production', description: 'Deploy Program Increment to production — dashboard feature from both teams is now live', logType: 'DEPLOY' },
            { op: 'delete-branch', branch: b1, label: 'Cleanup', description: 'Delete ' + b1 + ' branch — frontend team work delivered, branch no longer needed', logType: 'DELETE' },
            { op: 'delete-branch', branch: b2, label: 'Cleanup', description: 'Delete ' + b2 + ' branch — backend team work delivered, branch no longer needed', logType: 'DELETE' }
        ];
    },
    stepOptions: function() {
        return { requestLabel: 'Program Integration: multi-team PI', _initFn: GFV.scaled.program.init };
    },
    run: function() {
        GFV.scaled.program.init();
        GFV.animateFlow(GFV.scaled.program.steps(), GFV.scaled.program.stepOptions());
    }
};

/* ===== Release Mode ===== */
GFV.scaled.release = {
    init: function() {
        GFV.initGraph(['main', 'develop', 'release/PI-1']);
    },
    steps: function() {
        return [
            { op: 'commit', branch: 'main', label: 'v2.9', description: 'Previous release v2.9 on main — starting the release train for the next Program Increment', logType: 'COMMIT' },
            { op: 'branch', branch: 'develop', fromBranch: 'main', label: 'develop', description: 'Create develop from main — integration branch where all teams merge their PI work', logType: 'BRANCH' },
            { op: 'commit', branch: 'develop', label: 'Team A', description: 'Team A (Payments) merges their work to develop — new payment gateway integration complete', logType: 'COMMIT' },
            { op: 'commit', branch: 'develop', label: 'Team B', description: 'Team B (Platform) merges their work to develop — infrastructure upgrades and monitoring dashboards', logType: 'COMMIT' },
            { op: 'branch', branch: 'release/PI-1', fromBranch: 'develop', label: 'release/PI-1', description: 'Cut release/PI-1 from develop — all teams have integrated, entering release stabilization phase', logType: 'BRANCH' },
            { op: 'commit', branch: 'release/PI-1', label: 'Stabilize', description: 'Stabilize release candidate — performance testing, security scan, and final QA verification across all team deliverables', logType: 'COMMIT' },
            { op: 'commit', branch: 'release/PI-1', label: 'Fix defect', description: 'Fix critical defect found in QA — payment webhook handler timing out under load, adjusted connection pool', logType: 'COMMIT' },
            { op: 'merge', fromBranch: 'release/PI-1', toBranch: 'main', label: 'Release', description: 'Merge release/PI-1 into main — stabilization complete, all defects resolved, release ready', logType: 'MERGE' },
            { op: 'tag', branch: 'main', tagName: 'v3.0', description: 'Tag v3.0 on main — official Program Increment release coordinated across all teams', logType: 'TAG' },
            { op: 'merge', fromBranch: 'release/PI-1', toBranch: 'develop', label: 'Merge back', description: 'Merge release fixes back into develop — QA defect fixes preserved for the next PI cycle', logType: 'MERGE' },
            { op: 'deploy', branch: 'main', envName: 'production', description: 'Deploy v3.0 to production — release train delivers the coordinated multi-team increment to users', logType: 'DEPLOY' },
            { op: 'delete-branch', branch: 'release/PI-1', label: 'Cleanup', description: 'Delete release/PI-1 branch — PI shipped successfully, release branch no longer needed', logType: 'DELETE' }
        ];
    },
    stepOptions: function() {
        return { requestLabel: 'Scaled Release: release/PI-1', _initFn: GFV.scaled.release.init };
    },
    run: function() {
        GFV.scaled.release.init();
        GFV.animateFlow(GFV.scaled.release.steps(), GFV.scaled.release.stepOptions());
    }
};
