/* ===== GitHub Flow ===== */

var GFV = window.GFV || {};
window.GFV = GFV;

GFV.github = {};

GFV.github.modes = [
    { id: 'feature', label: 'Feature + PR', desc: 'Branch from main, open a Pull Request, merge and deploy — the standard GitHub Flow cycle' },
    { id: 'deploy', label: 'Deploy from Main', desc: 'Merge to main triggers CI/CD pipeline — tests run, build completes, auto-deploy to production' },
    { id: 'hotfix', label: 'Quick Fix', desc: 'Create a short-lived fix branch, patch the issue via PR, merge and deploy immediately' }
];

GFV.github.branchRules = [
    { from: 'feature/*', to: 'main', allowed: true, note: 'Via Pull Request' },
    { from: 'fix/*', to: 'main', allowed: true, note: 'Via Pull Request' },
    { from: 'main', to: 'production', allowed: true, note: 'Deploy' },
    { from: 'feature/*', to: 'feature/*', allowed: false, note: 'Forbidden' },
    { from: 'Direct push', to: 'main', allowed: false, note: 'Forbidden' }
];

GFV.github.details = {
    feature: {
        principles: [
            'Anything in <code>main</code> is always deployable',
            'Branch off <code>main</code> for every piece of work',
            'Open a Pull Request for code review before merging',
            'Deploy immediately after merge to <code>main</code>'
        ],
        concepts: [
            { term: 'main', definition: 'Single long-lived branch, always in a deployable state' },
            { term: 'Feature branches', definition: 'Short-lived branches created from main for each task' },
            { term: 'Pull Request', definition: 'Code review gate before merging into main' },
            { term: 'Continuous Deployment', definition: 'Every merge to main triggers an automatic deploy' }
        ],
        tradeoffs: {
            pros: [
                'Simple and easy to understand',
                'Fast iteration with minimal overhead',
                'CI/CD friendly — deploy on every merge',
                'Encourages small, frequent pull requests'
            ],
            cons: [
                'No dedicated staging or release branches',
                'Risky for complex releases requiring coordination',
                'Rollback relies on reverting commits or re-deploying'
            ],
            whenToUse: 'Small teams, web applications, SaaS products, and projects practicing continuous deployment where main should always be production-ready.'
        }
    },
    deploy: {
        principles: [
            'Every merge to <code>main</code> triggers an automatic deploy to production',
            'No staging branch gate — CI/CD pipeline is the quality gate',
            'Tests, builds, and deploys are automated pipeline steps, not manual processes',
            'Tag releases after successful production deployment'
        ],
        concepts: [
            { term: 'main', definition: 'Single long-lived branch, always in a deployable state' },
            { term: 'CI/CD Pipeline', definition: 'Automated gate that runs tests, builds, and deploys on every merge to main' },
            { term: 'Auto-deploy', definition: 'Production deployment triggered automatically — no manual promotion or staging branch' },
            { term: 'Release tagging', definition: 'Git tags mark specific deployments as versioned releases' }
        ],
        tradeoffs: {
            pros: [
                'Zero manual deployment steps — fully automated pipeline',
                'Fast feedback loop — code reaches production within minutes',
                'No environment branch drift — main is always production',
                'Simple rollback via revert commit + automatic redeploy'
            ],
            cons: [
                'Requires robust test suite — no staging safety net',
                'Pipeline failures block all deployments',
                'Feature flags needed for partially-complete work'
            ],
            whenToUse: 'Teams with strong CI/CD culture, comprehensive automated tests, and applications where every merge should go live immediately without manual gates.'
        }
    },
    hotfix: {
        principles: [
            'Anything in <code>main</code> is always deployable',
            'Branch off <code>main</code> for every piece of work',
            'Open a Pull Request for code review before merging',
            'Deploy immediately after merge to <code>main</code>'
        ],
        concepts: [
            { term: 'main', definition: 'Single long-lived branch, always in a deployable state' },
            { term: 'Feature branches', definition: 'Short-lived branches created from main for each task' },
            { term: 'Pull Request', definition: 'Code review gate before merging into main' },
            { term: 'Continuous Deployment', definition: 'Every merge to main triggers an automatic deploy' }
        ],
        tradeoffs: {
            pros: [
                'Simple and easy to understand',
                'Fast iteration with minimal overhead',
                'CI/CD friendly — deploy on every merge',
                'Encourages small, frequent pull requests'
            ],
            cons: [
                'No dedicated staging or release branches',
                'Risky for complex releases requiring coordination',
                'Rollback relies on reverting commits or re-deploying'
            ],
            whenToUse: 'Small teams, web applications, SaaS products, and projects practicing continuous deployment where main should always be production-ready.'
        }
    }
};

/* ===== Feature + PR Mode ===== */
GFV.github.feature = {
    label: 'Feature + PR',
    description: 'Branch from main, work in feature branch, open PR, merge, deploy, clean up.',

    init: function() {
        this._b = 'feature/' + GFV.jira();
        GFV.initGraph(['main', this._b]);
    },

    steps: function() {
        var b = this._b;
        return [
            { op: 'branch', branch: b, fromBranch: 'main', label: 'branch', description: 'Create ' + b + ' from main — starting isolated work on user authentication feature', logType: 'BRANCH' },
            { op: 'commit', branch: b, label: 'auth-1', description: 'Add login form with email/password fields, client-side validation, and accessible error messages', logType: 'COMMIT' },
            { op: 'commit', branch: b, label: 'auth-2', description: 'Add server-side validation logic — sanitize inputs, verify credentials against the user store, return JWT token', logType: 'COMMIT' },
            { op: 'pr', fromBranch: b, toBranch: 'main', label: 'PR #1', description: 'Open Pull Request: ' + b + ' → main — requesting team review before merging to the deployable branch', logType: 'PR' },
            { op: 'merge', fromBranch: b, toBranch: 'main', label: 'merge', description: 'PR approved and merged into main — CI pipeline passes, feature is now part of the deployable codebase', logType: 'MERGE' },
            { op: 'deploy', branch: 'main', envName: 'production', description: 'Automatically deploy main to production — every merge triggers a deploy in GitHub Flow', logType: 'DEPLOY' },
            { op: 'delete-branch', branch: b, label: 'cleanup', description: 'Delete ' + b + ' branch — feature shipped, branch no longer needed', logType: 'BRANCH' }
        ];
    },

    stepOptions: function() {
        return {
            requestLabel: 'GitHub Flow: Feature + PR',
            _initFn: GFV.github.feature.init
        };
    },

    run: function() {
        GFV.github.feature.init();
        GFV.animateFlow(GFV.github.feature.steps(), GFV.github.feature.stepOptions());
    }
};

/* ===== Deploy from Main Mode ===== */
GFV.github.deploy = {
    label: 'Deploy from Main',
    description: 'Feature merged to main, CI/CD runs tests and builds, auto-deploy to production, tag release.',

    init: function() {
        this._b = 'feature/' + GFV.jira();
        GFV.initGraph(['main', this._b]);
    },

    steps: function() {
        var b = this._b;
        return [
            { op: 'branch', branch: b, fromBranch: 'main', label: 'branch', description: 'Create ' + b + ' from main — starting work on new search feature', logType: 'BRANCH' },
            { op: 'commit', branch: b, label: 'search-1', description: 'Implement search API endpoint with Elasticsearch integration and pagination support', logType: 'COMMIT' },
            { op: 'pr', fromBranch: b, toBranch: 'main', label: 'PR #3', description: 'Open Pull Request: ' + b + ' → main — CI runs automated tests on the PR branch', logType: 'PR' },
            { op: 'merge', fromBranch: b, toBranch: 'main', label: 'merge', description: 'PR approved and merged — CI/CD pipeline triggers automatically on main', logType: 'MERGE' },
            { op: 'deploy', branch: 'main', envName: 'production', description: 'Auto-deploy main to production — every merge to main goes live immediately, no staging gate', logType: 'DEPLOY' },
            { op: 'tag', branch: 'main', tagName: 'v1.0.0', description: 'Tag release v1.0.0 — marking the deployment as a versioned release', logType: 'TAG' },
            { op: 'delete-branch', branch: b, label: 'cleanup', description: 'Delete ' + b + ' — feature deployed, branch no longer needed', logType: 'BRANCH' }
        ];
    },

    stepOptions: function() {
        return {
            requestLabel: 'GitHub Flow: Deploy from Main',
            _initFn: GFV.github.deploy.init
        };
    },

    run: function() {
        GFV.github.deploy.init();
        GFV.animateFlow(GFV.github.deploy.steps(), GFV.github.deploy.stepOptions());
    }
};

/* ===== Quick Fix Mode ===== */
GFV.github.hotfix = {
    label: 'Quick Fix',
    description: 'Branch fix from main, commit fix, open PR, merge, deploy, clean up.',

    init: function() {
        this._b = 'fix/' + GFV.jira();
        GFV.initGraph(['main', this._b]);
    },

    steps: function() {
        var b = this._b;
        return [
            { op: 'branch', branch: b, fromBranch: 'main', label: 'branch', description: 'Create ' + b + ' from main — small fix, but still using a branch for traceability', logType: 'BRANCH' },
            { op: 'commit', branch: b, label: 'fix-1', description: 'Fix broken pricing link on the landing page — incorrect href causing 404 for potential customers', logType: 'COMMIT' },
            { op: 'pr', fromBranch: b, toBranch: 'main', label: 'PR #2', description: 'Open PR: ' + b + ' → main — quick review requested for the one-line URL fix', logType: 'PR' },
            { op: 'merge', fromBranch: b, toBranch: 'main', label: 'merge', description: 'PR merged into main — fix verified, CI green, ready for immediate deployment', logType: 'MERGE' },
            { op: 'deploy', branch: 'main', envName: 'production', description: 'Deploy main to production — landing page fix is now live, broken link resolved', logType: 'DEPLOY' },
            { op: 'delete-branch', branch: b, label: 'cleanup', description: 'Delete ' + b + ' branch — fix shipped, cleaning up to keep repo tidy', logType: 'BRANCH' }
        ];
    },

    stepOptions: function() {
        return {
            requestLabel: 'GitHub Flow: Quick Fix',
            _initFn: GFV.github.hotfix.init
        };
    },

    run: function() {
        GFV.github.hotfix.init();
        GFV.animateFlow(GFV.github.hotfix.steps(), GFV.github.hotfix.stepOptions());
    }
};
