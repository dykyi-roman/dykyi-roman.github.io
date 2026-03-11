/* ===== Trunk-Based Development ===== */

GFV.trunk = {};

GFV.trunk.modes = [
    { id: 'direct', label: 'Direct to Trunk', desc: 'All developers commit directly to main. No branches, no PRs — just frequent, small commits with CI running on every push. Deploys happen continuously from trunk.' },
    { id: 'short-lived', label: 'Short-lived Branch', desc: 'A short-lived feature branch is created, worked on for a few hours, merged back to main quickly, and deleted. Branch lifetime must stay under one day.' },
    { id: 'flags', label: 'Feature Flags', desc: 'Incomplete features are committed directly to trunk behind feature flags. Flags control gradual rollout: 0% → 10% → 100%. Once fully enabled, the flag code is removed.' }
];

GFV.trunk.branchRules = [
    { from: 'Direct commit', to: 'main', allowed: true },
    { from: 'Short-lived branch (< 1 day)', to: 'main', allowed: true },
    { from: 'Long-lived branch', to: 'main', allowed: false },
    { from: 'Feature branch > 2 days', to: 'main', allowed: false }
];

GFV.trunk.details = {
    direct: {
        principles: [
            'Everyone commits directly to trunk (main)',
            'Branches live less than one day',
            'No long-lived feature branches',
            'Feature flags hide incomplete work'
        ],
        concepts: [
            { term: 'Trunk', definition: 'Single source of truth; all code flows through main' },
            { term: 'Short-lived branches', definition: 'Hours, not days; merge early and often' },
            { term: 'Feature flags', definition: 'Decouple deployment from release; toggle features at runtime' },
            { term: 'Continuous Integration', definition: 'Commit frequently, run tests on every push' }
        ],
        tradeoffs: {
            pros: [
                'Minimal merge conflicts due to frequent integration',
                'Fast CI feedback — every commit is tested immediately',
                'Simple branching model — easy to understand and maintain'
            ],
            cons: [
                'Requires strong discipline and small, atomic commits',
                'Feature flags add complexity to codebase and configuration',
                'Risky without comprehensive test coverage and CI pipeline'
            ],
            whenToUse: 'Experienced teams with strong CI/CD pipelines, high trust, and fast automated tests. Used at Google, Facebook, and other large-scale engineering organizations.'
        }
    },
    'short-lived': {
        principles: [
            'Everyone commits to trunk (main)',
            'Branches live less than one day',
            'No long-lived feature branches',
            'Feature flags hide incomplete work'
        ],
        concepts: [
            { term: 'Trunk', definition: 'Single source of truth; all code flows through main' },
            { term: 'Short-lived branches', definition: 'Hours, not days; merge early and often' },
            { term: 'Feature flags', definition: 'Decouple deployment from release; toggle features at runtime' },
            { term: 'Continuous Integration', definition: 'Commit frequently, run tests on every push' }
        ],
        tradeoffs: {
            pros: [
                'Minimal merge conflicts due to frequent integration',
                'Fast CI feedback — every commit is tested immediately',
                'Simple branching model — easy to understand and maintain'
            ],
            cons: [
                'Requires strong discipline and small, atomic commits',
                'Feature flags add complexity to codebase and configuration',
                'Risky without comprehensive test coverage and CI pipeline'
            ],
            whenToUse: 'Experienced teams with strong CI/CD pipelines, high trust, and fast automated tests. Used at Google, Facebook, and other large-scale engineering organizations.'
        }
    },
    flags: {
        principles: [
            'Everyone commits directly to trunk (main)',
            'Branches live less than one day',
            'No long-lived feature branches',
            'Feature flags hide incomplete work'
        ],
        concepts: [
            { term: 'Trunk', definition: 'Single source of truth; all code flows through main' },
            { term: 'Short-lived branches', definition: 'Hours, not days; merge early and often' },
            { term: 'Feature flags', definition: 'Decouple deployment from release; toggle features at runtime' },
            { term: 'Continuous Integration', definition: 'Commit frequently, run tests on every push' }
        ],
        tradeoffs: {
            pros: [
                'Minimal merge conflicts due to frequent integration',
                'Fast CI feedback — every commit is tested immediately',
                'Simple branching model — easy to understand and maintain'
            ],
            cons: [
                'Requires strong discipline and small, atomic commits',
                'Feature flags add complexity to codebase and configuration',
                'Risky without comprehensive test coverage and CI pipeline'
            ],
            whenToUse: 'Experienced teams with strong CI/CD pipelines, high trust, and fast automated tests. Used at Google, Facebook, and other large-scale engineering organizations.'
        }
    }
};

/* ----- Mode: Direct to Trunk ----- */

GFV.trunk.direct = {};

GFV.trunk.direct.init = function() {
    GFV.initGraph(['main']);
};

GFV.trunk.direct.steps = function() {
    return [
        { op: 'commit', branch: 'main', label: 'Add feature A', logType: 'COMMIT', description: 'Developer commits feature A (search autocomplete) directly to trunk — no branch, no PR, small atomic change' },
        { op: 'commit', branch: 'main', label: 'Fix bug', logType: 'COMMIT', description: 'Bug fix committed directly to trunk — corrected off-by-one error in pagination, verified by existing tests' },
        { op: 'deploy', branch: 'main', envName: 'production', logType: 'DEPLOY', description: 'CI/CD pipeline automatically deploys trunk to production — every green commit goes live immediately' },
        { op: 'commit', branch: 'main', label: 'Add feature B', logType: 'COMMIT', description: 'Another developer commits feature B (email templates) directly to trunk — independent small change' },
        { op: 'deploy', branch: 'main', envName: 'production', logType: 'DEPLOY', description: 'Continuous deployment triggers again — trunk deployed to production, both features now live' }
    ];
};

GFV.trunk.direct.run = function() {
    GFV.trunk.direct.init();
    GFV.animateFlow(GFV.trunk.direct.steps(), {
        requestLabel: 'Trunk-Based: Direct to Trunk',
        _initFn: GFV.trunk.direct.init
    });
};

/* ----- Mode: Short-lived Branch ----- */

GFV.trunk['short-lived'] = {};

GFV.trunk['short-lived'].init = function() {
    GFV.trunk['short-lived']._b = 'feature/' + GFV.jira();
    GFV.initGraph(['main', GFV.trunk['short-lived']._b]);
};

GFV.trunk['short-lived'].steps = function() {
    var b = GFV.trunk['short-lived']._b;
    return [
        { op: 'branch', fromBranch: 'main', branch: b, logType: 'BRANCH', label: 'Branch ' + b, description: 'Create short-lived branch ' + b + ' from main — expected to live only a few hours, not days' },
        { op: 'commit', branch: b, label: 'Quick change', logType: 'COMMIT', description: 'Small, focused change — rename internal API method for clarity, update 3 call sites and their tests' },
        { op: 'merge', fromBranch: b, toBranch: 'main', label: 'Merge to main', logType: 'MERGE', description: 'Merge ' + b + ' back to trunk within hours — branch lifetime kept under 1 day as per trunk-based rules' },
        { op: 'delete-branch', branch: b, logType: 'BRANCH', label: 'Delete ' + b, description: 'Delete short-lived branch immediately after merge — no long-lived branches allowed in trunk-based development' },
        { op: 'deploy', branch: 'main', envName: 'production', logType: 'DEPLOY', description: 'Trunk deployed to production — change is live, continuous deployment handles the rest automatically' }
    ];
};

GFV.trunk['short-lived'].run = function() {
    GFV.trunk['short-lived'].init();
    GFV.animateFlow(GFV.trunk['short-lived'].steps(), {
        requestLabel: 'Trunk-Based: Short-lived Branch',
        _initFn: GFV.trunk['short-lived'].init
    });
};

/* ----- Mode: Feature Flags ----- */

GFV.trunk.flags = {};

GFV.trunk.flags.init = function() {
    GFV.initGraph(['main']);
};

GFV.trunk.flags.steps = function() {
    return [
        { op: 'commit', branch: 'main', label: 'Add flag: dark-mode', logType: 'COMMIT', description: 'Feature flag added to configuration (disabled by default)' },
        { op: 'commit', branch: 'main', label: 'Implement behind flag', logType: 'COMMIT', description: 'Dark-mode feature code committed, hidden behind flag' },
        { op: 'deploy', branch: 'main', envName: 'production', logType: 'DEPLOY', description: 'Code deployed — feature invisible to users (flag off)' },
        { op: 'commit', branch: 'main', label: 'Enable flag 10%', logType: 'COMMIT', description: 'Gradual rollout — flag enabled for 10% of users' },
        { op: 'commit', branch: 'main', label: 'Enable flag 100%', logType: 'COMMIT', description: 'Full rollout — flag enabled for all users' },
        { op: 'commit', branch: 'main', label: 'Remove flag code', logType: 'COMMIT', description: 'Flag and conditional logic removed — feature is permanent' },
        { op: 'deploy', branch: 'main', envName: 'production', logType: 'DEPLOY', description: 'Clean codebase deployed without feature flag overhead' }
    ];
};

GFV.trunk.flags.run = function() {
    GFV.trunk.flags.init();
    GFV.animateFlow(GFV.trunk.flags.steps(), {
        requestLabel: 'Trunk-Based: Feature Flags',
        _initFn: GFV.trunk.flags.init
    });
};
