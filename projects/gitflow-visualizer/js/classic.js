/* ===== Classic GitFlow (Driessen Model) ===== */

var GFV = window.GFV || {};
window.GFV = GFV;

GFV.classic = {};

/* ===== Modes ===== */
GFV.classic.modes = [
    { id: 'feature', label: 'Feature Flow', desc: 'A feature branch is created from develop, work is done in isolation, then merged back into develop via pull request. Feature branches never touch main directly.' },
    { id: 'release', label: 'Release Flow', desc: 'A release branch is cut from develop for stabilization. Bug fixes go into the release branch, which is then merged into both main (with a version tag) and back into develop.' },
    { id: 'hotfix', label: 'Hotfix Flow', desc: 'A hotfix branch is created directly from main to address a critical production bug. After the fix, it is merged into both main (with a patch tag) and develop.' }
];

/* ===== Branch Rules ===== */
GFV.classic.branchRules = [
    { from: 'feature/*', to: 'develop', allowed: true },
    { from: 'develop', to: 'release/*', allowed: true },
    { from: 'release/*', to: 'main', allowed: true },
    { from: 'release/*', to: 'develop', allowed: true },
    { from: 'hotfix/*', to: 'main', allowed: true },
    { from: 'hotfix/*', to: 'develop', allowed: true },
    { from: 'feature/*', to: 'main', allowed: false },
    { from: 'develop', to: 'main', allowed: false }
];

/* ===== Details ===== */
GFV.classic.details = {
    feature: {
        principles: [
            'Strict branch hierarchy: main > develop > feature branches',
            'Develop is the integration branch where all features converge',
            'Feature branches are short-lived and isolated from other work',
            'Merges to develop happen via pull request with code review',
            'Feature branches never merge directly into main'
        ],
        concepts: [
            { term: 'main', definition: 'Production-ready branch. Only receives merges from release and hotfix branches. Every commit on main is a release.' },
            { term: 'develop', definition: 'Integration branch for the next release. All feature branches are merged here. Serves as the base for release branches.' },
            { term: 'feature/*', definition: 'Short-lived branch for isolated feature development. Created from develop, merged back into develop when complete.' }
        ],
        tradeoffs: {
            pros: [
                'Clear structure with well-defined branch purposes',
                'Parallel feature development without interference',
                'Code review enforced through pull requests',
                'Easy to track what is in progress vs. completed'
            ],
            cons: [
                'Can be complex for small teams or simple projects',
                'Merge conflicts accumulate if feature branches live too long',
                'Overhead of branch management for minor changes'
            ],
            whenToUse: 'Teams with multiple developers working on features in parallel, projects that require code review before integration, and codebases where isolation of in-progress work is important.'
        }
    },
    release: {
        principles: [
            'Release branches allow stabilization without blocking new feature work on develop',
            'Only bug fixes and release preparation go into a release branch',
            'Release branch merges into main for production and back into develop to preserve fixes',
            'Version tags on main mark each production release',
            'No new features are added to a release branch after it is cut'
        ],
        concepts: [
            { term: 'release/*', definition: 'Stabilization branch cut from develop. Receives only bug fixes and version bumps. Merged into main and develop when ready.' },
            { term: 'Version Tag', definition: 'A git tag (e.g., v1.0) applied to main after a release merge. Marks the exact commit deployed to production.' },
            { term: 'Merge Back', definition: 'After merging release into main, the release branch is also merged back into develop to ensure fixes are not lost.' }
        ],
        tradeoffs: {
            pros: [
                'Develop remains open for new features while release stabilizes',
                'Clear separation between feature work and release preparation',
                'Version history is explicit through tags on main',
                'Bug fixes during stabilization propagate to both main and develop'
            ],
            cons: [
                'Two merges required for every release (main + develop)',
                'Merge conflicts possible when merging back to develop',
                'Extra branch management overhead for frequent releases'
            ],
            whenToUse: 'Projects with scheduled release cycles, teams that need a stabilization period before production, and systems where release preparation (version bumps, changelog) is a distinct phase.'
        }
    },
    hotfix: {
        principles: [
            'Hotfix branches are created directly from main to fix critical production issues',
            'Hotfixes bypass the normal develop-release cycle for speed',
            'After fixing, hotfix merges into both main (with a patch tag) and develop',
            'Hotfix branches are deleted immediately after merging',
            'Only emergency fixes go through the hotfix flow — not planned work'
        ],
        concepts: [
            { term: 'hotfix/*', definition: 'Emergency branch created from main. Contains only the critical fix. Merged into main and develop, then deleted.' },
            { term: 'Patch Tag', definition: 'A version tag (e.g., v1.0.1) applied to main after a hotfix merge. Indicates a patch release.' },
            { term: 'Dual Merge', definition: 'Hotfix merges into both main (for immediate deployment) and develop (so the fix is included in future releases).' }
        ],
        tradeoffs: {
            pros: [
                'Fast path to production for critical fixes',
                'Does not disrupt ongoing feature or release work',
                'Fix automatically propagates to develop branch',
                'Clear audit trail with patch version tags'
            ],
            cons: [
                'Risk of conflicts when merging hotfix back into develop',
                'Can be abused for non-emergency changes, eroding process discipline',
                'Requires discipline to keep hotfix scope minimal'
            ],
            whenToUse: 'Critical production bugs that cannot wait for the next release cycle. Security vulnerabilities, data corruption issues, or service outages requiring immediate patch deployment.'
        }
    }
};

/* ===== Feature Mode ===== */
GFV.classic.feature = {
    init: function() {
        this._b = 'feature/' + GFV.jira();
        GFV.initGraph(['main', 'develop', this._b]);
    },
    steps: function() {
        var b = this._b;
        return [
            {
                op: 'branch',
                branch: b,
                fromBranch: 'develop',
                label: b,
                description: 'Create feature branch ' + b + ' from develop to isolate new work from the integration branch',
                descriptionKey: 'gfv.classic.feature.branch',
                descriptionParams: { branch: b },
                logType: 'BRANCH'
            },
            {
                op: 'commit',
                branch: b,
                label: 'Auth UI',
                description: 'Implement login form UI components — input fields, validation messages, and submit button with responsive layout',
                descriptionKey: 'gfv.classic.feature.auth_ui',
                logType: 'COMMIT'
            },
            {
                op: 'commit',
                branch: b,
                label: 'Auth API',
                description: 'Wire up authentication API call with JWT token handling, error responses, and session management',
                descriptionKey: 'gfv.classic.feature.auth_api',
                logType: 'COMMIT'
            },
            {
                op: 'commit',
                branch: b,
                label: 'Tests',
                description: 'Add unit and integration tests for the login flow — covering valid credentials, invalid input, and API failure scenarios',
                descriptionKey: 'gfv.classic.feature.tests',
                logType: 'COMMIT'
            },
            {
                op: 'pr',
                fromBranch: b,
                toBranch: 'develop',
                label: 'PR #1',
                description: 'Open pull request from ' + b + ' to develop — requesting code review before integration',
                descriptionKey: 'gfv.classic.feature.pr',
                descriptionParams: { branch: b },
                logType: 'PR'
            },
            {
                op: 'merge',
                fromBranch: b,
                toBranch: 'develop',
                label: 'Merge PR',
                description: 'PR approved and merged — ' + b + ' changes are now integrated into the develop branch',
                descriptionKey: 'gfv.classic.feature.merge',
                descriptionParams: { branch: b },
                logType: 'MERGE'
            },
            {
                op: 'delete-branch',
                branch: b,
                label: 'Cleanup',
                description: 'Delete ' + b + ' branch — feature is fully merged, keeping the repository clean',
                descriptionKey: 'gfv.classic.feature.cleanup',
                descriptionParams: { branch: b },
                logType: 'DELETE'
            }
        ];
    },
    stepOptions: function() {
        return {
            requestLabel: GFV._t('gfv.request.classic.feature', { branch: this._b }, 'Feature Flow: ' + this._b),
            _initFn: GFV.classic.feature.init
        };
    },
    run: function() {
        GFV.classic.feature.init();
        GFV.animateFlow(GFV.classic.feature.steps(), GFV.classic.feature.stepOptions());
    }
};

/* ===== Release Mode ===== */
GFV.classic.release = {
    init: function() {
        GFV.initGraph(['main', 'develop', 'release/1.0']);
    },
    steps: function() {
        var f1 = 'JIRA-' + (Math.floor(Math.random() * 900) + 100);
        var f2 = 'JIRA-' + (Math.floor(Math.random() * 900) + 100);
        return [
            {
                op: 'commit',
                branch: 'develop',
                label: f1,
                description: 'Feature ' + f1 + ' (user profile page) merged to develop after code review and testing',
                descriptionKey: 'gfv.classic.release.feature1',
                descriptionParams: { issue: f1 },
                logType: 'COMMIT'
            },
            {
                op: 'commit',
                branch: 'develop',
                label: f2,
                description: 'Feature ' + f2 + ' (notification system) merged to develop — enough features accumulated for a release',
                descriptionKey: 'gfv.classic.release.feature2',
                descriptionParams: { issue: f2 },
                logType: 'COMMIT'
            },
            {
                op: 'branch',
                branch: 'release/1.0',
                fromBranch: 'develop',
                label: 'release/1.0',
                description: 'Cut release/1.0 from develop — freezing feature scope, only stabilization work allowed from here',
                descriptionKey: 'gfv.classic.release.cut',
                logType: 'BRANCH'
            },
            {
                op: 'commit',
                branch: 'release/1.0',
                label: 'Bump ver',
                description: 'Bump version number to 1.0 in package.json, update changelog with release notes',
                descriptionKey: 'gfv.classic.release.bump',
                logType: 'COMMIT'
            },
            {
                op: 'commit',
                branch: 'release/1.0',
                label: 'Fix typo',
                description: 'Fix documentation typo found during release review — minor copy correction in README',
                descriptionKey: 'gfv.classic.release.typo',
                logType: 'COMMIT'
            },
            {
                op: 'commit',
                branch: 'release/1.0',
                label: 'Fix bug',
                description: 'Fix regression found during QA testing — edge case in notification delivery timing',
                descriptionKey: 'gfv.classic.release.bug',
                logType: 'COMMIT'
            },
            {
                op: 'merge',
                fromBranch: 'release/1.0',
                toBranch: 'main',
                label: 'Release',
                description: 'Merge release/1.0 into main — all stabilization complete, release is production-ready',
                descriptionKey: 'gfv.classic.release.merge_main',
                logType: 'MERGE'
            },
            {
                op: 'tag',
                branch: 'main',
                tagName: 'v1.0',
                label: 'v1.0',
                description: 'Tag v1.0 on main — marking the exact commit that represents the production release',
                descriptionKey: 'gfv.classic.release.tag',
                logType: 'TAG'
            },
            {
                op: 'deploy',
                branch: 'main',
                envName: 'production',
                label: 'Deploy',
                description: 'Deploy v1.0 to production environment — release is now live for all users',
                descriptionKey: 'gfv.classic.release.deploy',
                logType: 'DEPLOY'
            },
            {
                op: 'merge',
                fromBranch: 'release/1.0',
                toBranch: 'develop',
                label: 'Merge back',
                description: 'Merge release/1.0 fixes back into develop — ensuring bug fixes are not lost in future development',
                descriptionKey: 'gfv.classic.release.merge_back',
                logType: 'MERGE'
            },
            {
                op: 'delete-branch',
                branch: 'release/1.0',
                label: 'Cleanup',
                description: 'Delete release/1.0 branch — release cycle complete, branch no longer needed',
                descriptionKey: 'gfv.classic.release.cleanup',
                logType: 'DELETE'
            }
        ];
    },
    stepOptions: function() {
        return {
            requestLabel: GFV._t('gfv.request.classic.release', null, 'Release Flow: release/1.0'),
            _initFn: GFV.classic.release.init
        };
    },
    run: function() {
        GFV.classic.release.init();
        GFV.animateFlow(GFV.classic.release.steps(), GFV.classic.release.stepOptions());
    }
};

/* ===== Hotfix Mode ===== */
GFV.classic.hotfix = {
    init: function() {
        this._b = 'hotfix/' + GFV.jira();
        GFV.initGraph(['main', 'develop', this._b]);
    },
    steps: function() {
        var b = this._b;
        return [
            {
                op: 'commit',
                branch: 'develop',
                label: 'WIP',
                description: 'Normal development continues on develop — team is working on the next release features',
                descriptionKey: 'gfv.classic.hotfix.develop_wip',
                logType: 'COMMIT'
            },
            {
                op: 'branch',
                branch: b,
                fromBranch: 'main',
                label: b,
                description: 'URGENT: Branch ' + b + ' directly from main — critical payment processing bug reported in production',
                descriptionKey: 'gfv.classic.hotfix.branch',
                descriptionParams: { branch: b },
                logType: 'BRANCH'
            },
            {
                op: 'commit',
                branch: b,
                label: 'Fix',
                description: 'Apply critical fix — resolve race condition in payment callback handler causing duplicate charges',
                descriptionKey: 'gfv.classic.hotfix.fix',
                logType: 'COMMIT'
            },
            {
                op: 'commit',
                branch: b,
                label: 'Test fix',
                description: 'Add regression test covering the concurrent payment scenario to prevent future recurrence',
                descriptionKey: 'gfv.classic.hotfix.test',
                logType: 'COMMIT'
            },
            {
                op: 'merge',
                fromBranch: b,
                toBranch: 'main',
                label: 'Hotfix',
                description: 'Merge ' + b + ' into main — fix verified, fast-tracking to production',
                descriptionKey: 'gfv.classic.hotfix.merge_main',
                descriptionParams: { branch: b },
                logType: 'MERGE'
            },
            {
                op: 'merge',
                fromBranch: b,
                toBranch: 'develop',
                label: 'Merge back',
                description: 'Merge ' + b + ' back into develop — ensuring the fix is included in the next release cycle',
                descriptionKey: 'gfv.classic.hotfix.merge_back',
                descriptionParams: { branch: b },
                logType: 'MERGE'
            },
            {
                op: 'tag',
                branch: 'main',
                tagName: 'v1.0.1',
                label: 'v1.0.1',
                description: 'Tag v1.0.1 patch release on main — marking the hotfix deployment point',
                descriptionKey: 'gfv.classic.hotfix.tag',
                logType: 'TAG'
            },
            {
                op: 'deploy',
                branch: 'main',
                envName: 'production',
                label: 'Deploy',
                description: 'Deploy hotfix v1.0.1 to production — payment issue resolved for all users',
                descriptionKey: 'gfv.classic.hotfix.deploy',
                logType: 'DEPLOY'
            },
            {
                op: 'delete-branch',
                branch: b,
                label: 'Cleanup',
                description: 'Delete ' + b + ' branch — hotfix complete, branch served its emergency purpose',
                descriptionKey: 'gfv.classic.hotfix.cleanup',
                descriptionParams: { branch: b },
                logType: 'DELETE'
            }
        ];
    },
    stepOptions: function() {
        return {
            requestLabel: GFV._t('gfv.request.classic.hotfix', { branch: this._b }, 'Hotfix Flow: ' + this._b),
            _initFn: GFV.classic.hotfix.init
        };
    },
    run: function() {
        GFV.classic.hotfix.init();
        GFV.animateFlow(GFV.classic.hotfix.steps(), GFV.classic.hotfix.stepOptions());
    }
};
