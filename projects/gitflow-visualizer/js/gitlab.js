/* ===== GitLab Flow ===== */

(function() {
    var GFV = window.GFV;

    /* ----- Mode definitions ----- */
    var modes = [
        { id: 'feature',    label: 'Feature to Main',       desc: 'Feature branch is created from main, developed, reviewed via merge request, and merged back. The feature branch is deleted after merge.' },
        { id: 'staging',    label: 'Promote to Staging',     desc: 'Commits accumulated on main are promoted to the staging environment branch for integration testing before production.' },
        { id: 'production', label: 'Promote to Production',  desc: 'After staging validation, the staging branch is promoted to the production branch, tagged, and deployed to the live environment.' }
    ];

    /* ----- Branch rules ----- */
    var branchRules = [
        { from: 'feature/*', to: 'main',       allowed: true },
        { from: 'main',      to: 'staging',     allowed: true },
        { from: 'staging',   to: 'production',  allowed: true },
        { from: 'production',to: 'main',        allowed: false },
        { from: 'feature/*', to: 'staging',     allowed: false }
    ];

    /* ----- Details (per-mode) ----- */
    var details = {
        feature: {
            principles: [
                'Upstream first — fixes always land on main, then promote downstream',
                'Environment branches represent deployment targets, not development stages',
                'Merge only downstream: main → staging → production'
            ],
            concepts: [
                { term: 'main',                  definition: 'Primary development branch; all features merge here first' },
                { term: 'staging',               definition: 'Pre-production environment branch for integration testing' },
                { term: 'production',            definition: 'Live environment branch; represents what is deployed to users' },
                { term: 'Upstream first policy',  definition: 'Bugs are fixed on main and promoted down — never patch production directly' }
            ],
            tradeoffs: {
                pros: [
                    'Clear environment tracking — each branch mirrors a deployment target',
                    'Simple promotion path: main → staging → production',
                    'Upstream first policy prevents drift between environments'
                ],
                cons: [
                    'More long-lived branches to maintain',
                    'Merge overhead when promoting through multiple environments',
                    'Environment branches can diverge if promotion is delayed'
                ],
                whenToUse: 'Teams that maintain multiple deployment environments (staging, QA, production) and need a clear, auditable promotion path with staged deployments.'
            }
        },
        staging: {
            principles: [
                'Upstream first — fixes always land on main, then promote downstream',
                'Environment branches represent deployment targets, not development stages',
                'Merge only downstream: main → staging → production'
            ],
            concepts: [
                { term: 'main',                  definition: 'Primary development branch; all features merge here first' },
                { term: 'staging',               definition: 'Pre-production environment branch for integration testing' },
                { term: 'production',            definition: 'Live environment branch; represents what is deployed to users' },
                { term: 'Upstream first policy',  definition: 'Bugs are fixed on main and promoted down — never patch production directly' }
            ],
            tradeoffs: {
                pros: [
                    'Clear environment tracking — each branch mirrors a deployment target',
                    'Simple promotion path: main → staging → production',
                    'Upstream first policy prevents drift between environments'
                ],
                cons: [
                    'More long-lived branches to maintain',
                    'Merge overhead when promoting through multiple environments',
                    'Environment branches can diverge if promotion is delayed'
                ],
                whenToUse: 'Teams that maintain multiple deployment environments (staging, QA, production) and need a clear, auditable promotion path with staged deployments.'
            }
        },
        production: {
            principles: [
                'Upstream first — fixes always land on main, then promote downstream',
                'Environment branches represent deployment targets, not development stages',
                'Merge only downstream: main → staging → production'
            ],
            concepts: [
                { term: 'main',                  definition: 'Primary development branch; all features merge here first' },
                { term: 'staging',               definition: 'Pre-production environment branch for integration testing' },
                { term: 'production',            definition: 'Live environment branch; represents what is deployed to users' },
                { term: 'Upstream first policy',  definition: 'Bugs are fixed on main and promoted down — never patch production directly' }
            ],
            tradeoffs: {
                pros: [
                    'Clear environment tracking — each branch mirrors a deployment target',
                    'Simple promotion path: main → staging → production',
                    'Upstream first policy prevents drift between environments'
                ],
                cons: [
                    'More long-lived branches to maintain',
                    'Merge overhead when promoting through multiple environments',
                    'Environment branches can diverge if promotion is delayed'
                ],
                whenToUse: 'Teams that maintain multiple deployment environments (staging, QA, production) and need a clear, auditable promotion path with staged deployments.'
            }
        }
    };

    /* ========== feature mode ========== */
    var feature = {};

    feature.init = function() {
        feature._b = 'feature/' + GFV.jira();
        GFV.initGraph(['main', feature._b]);
    };

    feature.steps = function() {
        var b = feature._b;
        return [
            { op: 'branch',        fromBranch: 'main',  branch: b,  label: b,          logType: 'BRANCH',  description: 'Create feature branch ' + b + ' from main — isolating search feature development' },
            { op: 'commit',        branch: b,           label: 'F1',                    logType: 'COMMIT',  description: 'Implement Elasticsearch search index — define mappings, configure analyzers, add indexing pipeline' },
            { op: 'commit',        branch: b,           label: 'F2',                    logType: 'COMMIT',  description: 'Add search UI component — autocomplete dropdown, result highlighting, and pagination controls' },
            { op: 'pr',            fromBranch: b,       toBranch: 'main', label: 'MR !42', logType: 'MR',   description: 'Open Merge Request !42: ' + b + ' → main — requesting review from the backend team' },
            { op: 'merge',         fromBranch: b,       toBranch: 'main', label: 'Merge MR', logType: 'MERGE', description: 'MR approved and merged — ' + b + ' integrated into main, search feature ready for promotion' },
            { op: 'delete-branch', branch: b,           label: 'delete',                logType: 'DELETE',  description: 'Delete feature branch ' + b + ' — merged successfully, keeping repository clean' }
        ];
    };

    feature.run = function() {
        feature.init();
        GFV.animateFlow(feature.steps(), { requestLabel: 'GitLab Flow — Feature to Main' });
    };

    /* ========== staging mode ========== */
    var staging = {};

    staging.init = function() {
        GFV.initGraph(['main', 'staging']);
    };

    staging.steps = function() {
        return [
            { op: 'commit', branch: 'main',    label: 'M1',            logType: 'COMMIT', description: 'Feature A (dashboard widgets) merged to main via MR — ready for downstream promotion' },
            { op: 'commit', branch: 'main',    label: 'M2',            logType: 'COMMIT', description: 'Feature B (export to CSV) merged to main — second feature accumulated for promotion batch' },
            { op: 'commit', branch: 'main',    label: 'M3',            logType: 'COMMIT', description: 'Bug fix for timezone handling merged to main — resolving reports showing incorrect dates' },
            { op: 'merge',  fromBranch: 'main', toBranch: 'staging', label: 'Promote', logType: 'MERGE', description: 'Promote main to staging — batch of 3 changes (2 features + 1 fix) pushed to pre-production for testing' },
            { op: 'deploy', branch: 'staging', envName: 'staging',     logType: 'DEPLOY', description: 'Deploy staging environment — running integration tests and manual QA on the promoted changes' },
            { op: 'commit', branch: 'main',    label: 'M4',            logType: 'COMMIT', description: 'Development continues on main — new work is independent of the staging promotion' }
        ];
    };

    staging.run = function() {
        staging.init();
        GFV.animateFlow(staging.steps(), { requestLabel: 'GitLab Flow — Promote to Staging' });
    };

    /* ========== production mode ========== */
    var production = {};

    production.init = function() {
        GFV.initGraph(['main', 'staging', 'production']);
    };

    production.steps = function() {
        return [
            { op: 'commit', branch: 'main',       label: 'M1',            logType: 'COMMIT', description: 'New user onboarding flow merged to main — multi-step wizard with progress tracking' },
            { op: 'commit', branch: 'main',       label: 'M2',            logType: 'COMMIT', description: 'Email template improvements merged to main — responsive design for mobile clients' },
            { op: 'merge',  fromBranch: 'main',    toBranch: 'staging',   label: 'Promote',   logType: 'MERGE',  description: 'Promote main to staging — pushing accumulated changes for pre-production validation' },
            { op: 'deploy', branch: 'staging',     envName: 'staging',    logType: 'DEPLOY',  description: 'Deploy to staging environment — running full test suite and manual QA verification' },
            { op: 'merge',  fromBranch: 'staging', toBranch: 'production', label: 'Promote',  logType: 'MERGE',  description: 'Promote staging to production — QA passed, changes approved for live deployment' },
            { op: 'deploy', branch: 'production',  envName: 'production', logType: 'DEPLOY',  description: 'Deploy to production environment — changes are now live for all end users' },
            { op: 'tag',    branch: 'production',  tagName: 'v1.0.0',     logType: 'TAG',     description: 'Tag production release v1.0.0 — official version marker for this deployment' }
        ];
    };

    production.run = function() {
        production.init();
        GFV.animateFlow(production.steps(), { requestLabel: 'GitLab Flow — Promote to Production' });
    };

    /* ----- Register on GFV namespace ----- */
    GFV.gitlab = {
        modes: modes,
        branchRules: branchRules,
        details: details,
        feature: feature,
        staging: staging,
        production: production
    };
})();
