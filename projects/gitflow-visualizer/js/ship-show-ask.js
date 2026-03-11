/* ===== Ship / Show / Ask ===== */

var GFV = window.GFV || {};
window.GFV = GFV;

GFV['ship-show-ask'] = {};

GFV['ship-show-ask'].modes = [
    { id: 'ship', label: 'Ship (Direct Merge)', desc: 'Low-risk change: branch from main, commit fix, merge directly (no PR), deploy.' },
    { id: 'show', label: 'Show (PR, No Block)', desc: 'Medium-risk change: branch from main, work on feature, open non-blocking PR for visibility, merge, deploy.' },
    { id: 'ask', label: 'Ask (PR + Review)', desc: 'High-risk change: branch from main, work on feature, open blocking PR, address review, merge, deploy.' }
];

GFV['ship-show-ask'].branchRules = [
    { from: 'feature/*', to: 'main', allowed: true, note: 'Ship: direct merge, no PR' },
    { from: 'feature/*', to: 'main', allowed: true, note: 'Show: PR for visibility, non-blocking' },
    { from: 'feature/*', to: 'main', allowed: true, note: 'Ask: PR with blocking review required' },
    { from: 'All changes', to: 'merge', allowed: true, note: 'Must be categorized before merge' }
];

GFV['ship-show-ask'].details = {
    ship: {
        principles: [
            'Low-risk, trivial changes merged directly to main',
            'No PR required — trust the developer\'s judgment',
            'Fastest path to production for safe changes'
        ],
        concepts: [
            { term: 'Ship', definition: 'Trivial or low-risk changes merged directly to main without a PR' },
            { term: 'Direct merge', definition: 'Push or merge to main without opening a pull request' },
            { term: 'Trust-based workflow', definition: 'Engineers classify their own changes; the team trusts individual judgment' }
        ],
        tradeoffs: {
            pros: [
                'Fastest delivery — no review overhead for trivial changes',
                'Reduces bottlenecks and keeps velocity high',
                'Empowers developers with autonomy'
            ],
            cons: [
                'No review safety net for shipped changes',
                'Risky if a change is misclassified as low-risk',
                'Less formal audit trail'
            ],
            whenToUse: 'Trivial changes like typo fixes, config tweaks, or minor documentation updates where the risk of breakage is negligible.'
        }
    },
    show: {
        principles: [
            'Medium-risk changes opened as a non-blocking PR for team visibility',
            'Merge proceeds without waiting for review approval',
            'Team stays informed without slowing down delivery'
        ],
        concepts: [
            { term: 'Show', definition: 'Informational PR opened for visibility; merge proceeds without blocking on review' },
            { term: 'Non-blocking PR', definition: 'A pull request that serves as notification, not a gate — merge is allowed without approval' },
            { term: 'Visibility', definition: 'Keeping the team aware of changes without requiring formal sign-off' }
        ],
        tradeoffs: {
            pros: [
                'Team awareness without delivery delays',
                'Creates a record of changes for future reference',
                'Encourages knowledge sharing across the team'
            ],
            cons: [
                'Reviews may never happen if not prioritized',
                'Issues discovered post-merge require follow-up work',
                'Requires discipline to actually review "show" PRs'
            ],
            whenToUse: 'Medium-risk refactors, internal module changes, or improvements where team awareness is valuable but blocking review would slow delivery unnecessarily.'
        }
    },
    ask: {
        principles: [
            'High-risk or complex changes require a blocking PR with review',
            'Merge is gated on explicit approval from reviewers',
            'Ensures quality and shared understanding for critical changes'
        ],
        concepts: [
            { term: 'Ask', definition: 'PR with a blocking review required before the change can be merged' },
            { term: 'Blocking review', definition: 'Merge is not permitted until one or more reviewers approve the change' },
            { term: 'Review feedback', definition: 'Reviewers may request changes that must be addressed before approval' }
        ],
        tradeoffs: {
            pros: [
                'Catches issues before they reach production',
                'Builds shared understanding of complex changes',
                'Provides a strong audit trail for critical work'
            ],
            cons: [
                'Slower delivery due to review wait times',
                'Can become a bottleneck if reviewers are unavailable',
                'May discourage small iterative changes'
            ],
            whenToUse: 'High-risk changes like authentication rewrites, database migrations, API contract changes, or any work that could significantly impact users or system stability.'
        }
    }
};

/* ===== Ship Mode (Direct Merge) ===== */
GFV['ship-show-ask'].ship = {
    label: 'Ship (Direct Merge)',
    description: 'Low-risk change: branch from main, commit fix, merge directly (no PR), deploy.',

    init: function() {
        this._b = 'feature/' + GFV.jira();
        GFV.initGraph(['main', this._b]);
    },

    steps: function() {
        var b = this._b;
        return [
            { op: 'branch', branch: b, fromBranch: 'main', label: 'branch', description: 'Create ' + b + ' from main — even trivial changes get a branch for clean git history', logType: 'BRANCH' },
            { op: 'commit', branch: b, label: 'fix-typo', description: 'Fix typo in README — corrected "authentification" to "authentication" in the API section', logType: 'COMMIT' },
            { op: 'merge', fromBranch: b, toBranch: 'main', label: 'merge', description: 'Merge directly to main without opening a PR — developer judges this as zero-risk, no review needed', logType: 'MERGE' },
            { op: 'badge', branch: 'main', label: 'SHIP', color: '#a6e3a1', logType: 'FLOW', description: 'Categorized as SHIP — trivial documentation fix, fastest path to production with no ceremony' },
            { op: 'deploy', branch: 'main', envName: 'production', description: 'Deploy main to production — typo fix is live, no review overhead for a one-word change', logType: 'DEPLOY' },
            { op: 'delete-branch', branch: b, label: 'cleanup', description: 'Delete ' + b + ' branch — shipped directly, keeping the repository clean', logType: 'BRANCH' }
        ];
    },

    stepOptions: function() {
        return {
            requestLabel: 'Ship/Show/Ask: Ship (Direct Merge)',
            _initFn: GFV['ship-show-ask'].ship.init
        };
    },

    run: function() {
        GFV['ship-show-ask'].ship.init();
        GFV.animateFlow(GFV['ship-show-ask'].ship.steps(), GFV['ship-show-ask'].ship.stepOptions());
    }
};

/* ===== Show Mode (PR, No Block) ===== */
GFV['ship-show-ask'].show = {
    label: 'Show (PR, No Block)',
    description: 'Medium-risk change: branch from main, work on feature, open non-blocking PR for visibility, merge, deploy.',

    init: function() {
        this._b = 'feature/' + GFV.jira();
        GFV.initGraph(['main', this._b]);
    },

    steps: function() {
        var b = this._b;
        return [
            { op: 'branch', branch: b, fromBranch: 'main', label: 'branch', description: 'Create ' + b + ' from main — starting a medium-risk refactoring task', logType: 'BRANCH' },
            { op: 'commit', branch: b, label: 'refactor-1', description: 'Extract date formatting logic into a shared DateHelper module — reducing duplication across 5 controllers', logType: 'COMMIT' },
            { op: 'commit', branch: b, label: 'refactor-2', description: 'Update all imports to use the new DateHelper module and adjust unit tests for the extracted logic', logType: 'COMMIT' },
            { op: 'pr', fromBranch: b, toBranch: 'main', label: 'PR #1', description: 'Open non-blocking PR for team visibility — teammates can see the refactoring, but merge is not gated on approval', logType: 'PR' },
            { op: 'badge', branch: b, label: 'SHOW', color: '#f9e2af', logType: 'FLOW', description: 'Categorized as SHOW — internal refactoring with tests, team should be aware but no blocking review needed' },
            { op: 'merge', fromBranch: b, toBranch: 'main', label: 'merge', description: 'Merge to main without waiting for review — developer is confident in the change, team can review async', logType: 'MERGE' },
            { op: 'deploy', branch: 'main', envName: 'production', description: 'Deploy main to production — refactored date handling is now live, team notified via the open PR', logType: 'DEPLOY' },
            { op: 'delete-branch', branch: b, label: 'cleanup', description: 'Delete ' + b + ' branch — refactoring shipped, PR remains as documentation of the change', logType: 'BRANCH' }
        ];
    },

    stepOptions: function() {
        return {
            requestLabel: 'Ship/Show/Ask: Show (PR, No Block)',
            _initFn: GFV['ship-show-ask'].show.init
        };
    },

    run: function() {
        GFV['ship-show-ask'].show.init();
        GFV.animateFlow(GFV['ship-show-ask'].show.steps(), GFV['ship-show-ask'].show.stepOptions());
    }
};

/* ===== Ask Mode (PR + Review) ===== */
GFV['ship-show-ask'].ask = {
    label: 'Ask (PR + Review)',
    description: 'High-risk change: branch from main, work on feature, open blocking PR, address review, merge, deploy.',

    init: function() {
        this._b = 'feature/' + GFV.jira();
        GFV.initGraph(['main', this._b]);
    },

    steps: function() {
        var b = this._b;
        return [
            { op: 'branch', branch: b, fromBranch: 'main', label: 'branch', description: 'Create ' + b + ' from main — starting a high-risk authentication rewrite that requires team review', logType: 'BRANCH' },
            { op: 'commit', branch: b, label: 'auth-1', description: 'Rewrite authentication module — replacing custom JWT handling with industry-standard OAuth2 library', logType: 'COMMIT' },
            { op: 'commit', branch: b, label: 'auth-2', description: 'Add OAuth2 provider support for Google, GitHub, and Microsoft — including token refresh and session management', logType: 'COMMIT' },
            { op: 'pr', fromBranch: b, toBranch: 'main', label: 'PR #2', description: 'Open blocking PR — security-critical change requires explicit approval from at least 2 reviewers before merge', logType: 'PR' },
            { op: 'badge', branch: b, label: 'ASK', color: '#f38ba8', logType: 'FLOW', description: 'Categorized as ASK — authentication touches every user session, blocking review is mandatory' },
            { op: 'commit', branch: b, label: 'review-fix', description: 'Address review feedback — add PKCE for public clients, fix token expiry edge case, improve error logging', logType: 'COMMIT' },
            { op: 'merge', fromBranch: b, toBranch: 'main', label: 'merge', description: 'Merge to main after 2 approvals received — security team and backend lead both signed off', logType: 'MERGE' },
            { op: 'deploy', branch: 'main', envName: 'production', description: 'Deploy main to production — new OAuth2 authentication is now live for all users', logType: 'DEPLOY' },
            { op: 'delete-branch', branch: b, label: 'cleanup', description: 'Delete ' + b + ' branch — high-risk change safely shipped after thorough review process', logType: 'BRANCH' }
        ];
    },

    stepOptions: function() {
        return {
            requestLabel: 'Ship/Show/Ask: Ask (PR + Review)',
            _initFn: GFV['ship-show-ask'].ask.init
        };
    },

    run: function() {
        GFV['ship-show-ask'].ask.init();
        GFV.animateFlow(GFV['ship-show-ask'].ask.steps(), GFV['ship-show-ask'].ask.stepOptions());
    }
};
