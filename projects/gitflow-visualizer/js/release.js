/* ===== Release Branching ===== */

GFV.release = {};

GFV.release.modes = [
    { id: 'create', label: 'Create Release', desc: 'Develop on main, branch release/1.0 for stabilization, fix bugs, merge back, tag, and clean up. The release branch isolates stabilization from ongoing feature work.' },
    { id: 'patch', label: 'Patch Release', desc: 'Start from a tagged release, create a release branch for a targeted patch fix, merge back into main, tag the patch version, and clean up.' },
    { id: 'parallel', label: 'Parallel Releases', desc: 'Maintain two release branches simultaneously from main. Each release stabilizes independently, merges and tags on its own schedule.' }
];

GFV.release.branchRules = [
    { from: 'main', to: 'release/*', allowed: true, note: 'Branch off for stabilization' },
    { from: 'release/*', to: 'main', allowed: true, note: 'Merge back after release' },
    { from: 'release/*', to: 'release/*', allowed: false, note: 'No cross-merge between releases' },
    { from: 'Direct commit', to: 'main', allowed: true, note: 'New features and development' }
];

GFV.release.details = {
    create: {
        principles: [
            'Release branches isolate stabilization work from ongoing development',
            '<code>main</code> continues to receive new features while a release stabilizes',
            'Bug fixes during stabilization go to the release branch, not directly to <code>main</code>',
            'After merge, the release branch is deleted to keep the repository clean'
        ],
        concepts: [
            { term: 'Release branch', definition: 'A branch created from main to stabilize a specific version before shipping. Only bug fixes and stabilization commits are allowed.' },
            { term: 'Stabilization', definition: 'The process of hardening a release candidate by fixing bugs and running final QA, without new feature work.' },
            { term: 'Version tag', definition: 'A git tag (e.g., v1.0) applied to main after the release branch is merged. Marks the exact production-ready commit.' },
            { term: 'Merge back', definition: 'After release, the release branch is merged into main so that stabilization fixes are included in future development.' }
        ],
        tradeoffs: {
            pros: [
                'Isolates stabilization without blocking new development on main',
                'Clear release lifecycle: branch, stabilize, tag, delete',
                'Easy to identify which commits belong to a specific release',
                'Supports standard semantic versioning workflow'
            ],
            cons: [
                'Merge conflicts can occur when merging release back into main',
                'Requires discipline to avoid adding features to the release branch',
                'Short-lived but adds branching overhead compared to trunk-based development'
            ],
            whenToUse: 'Projects that ship distinct releases with a stabilization phase — mobile apps, libraries, desktop software, and any team that needs a dedicated pre-release hardening period.'
        }
    },
    patch: {
        principles: [
            'Patches are applied to a release branch created from the tagged version',
            'Only targeted bug fixes go into the patch — no new features',
            'The patch is merged back into main and tagged with a new patch version (e.g., v1.0.1)',
            'The release branch is deleted after the patch is merged and tagged'
        ],
        concepts: [
            { term: 'Patch', definition: 'A bug fix applied to an existing release after the initial version has shipped. Results in a new patch version tag.' },
            { term: 'Cherry-pick', definition: 'Selectively applying specific commits from one branch to another, often used to port fixes between release branches.' },
            { term: 'Patch tag', definition: 'A version tag (e.g., v1.0.1) applied after a patch fix. Follows semantic versioning for the patch segment.' },
            { term: 'Release branch (patch)', definition: 'A branch recreated from the original release tag specifically to apply and test a patch fix in isolation.' }
        ],
        tradeoffs: {
            pros: [
                'Targeted fixes without disrupting ongoing development',
                'Clear audit trail of what changed in each patch',
                'Semantic versioning makes patch releases easy to track',
                'Minimal risk — only the specific fix is applied'
            ],
            cons: [
                'Requires careful cherry-picking or selective merging',
                'Older releases may diverge significantly from current main',
                'Multiple patches can create complex merge histories'
            ],
            whenToUse: 'Any versioned software that needs to ship urgent bug fixes for already-released versions — security patches, critical bug fixes, compliance updates.'
        }
    },
    parallel: {
        principles: [
            'Multiple release branches can coexist for parallel version support',
            'Each release branch stabilizes and ships independently',
            'Main continues to receive new features while releases are maintained',
            'Cross-merging between release branches is not allowed — fixes flow through main'
        ],
        concepts: [
            { term: 'Parallel releases', definition: 'Multiple release branches maintained simultaneously for different versions, each with its own stabilization and release cycle.' },
            { term: 'Version isolation', definition: 'Each release branch is isolated from others, ensuring changes in one version do not affect another.' },
            { term: 'Independent tagging', definition: 'Each release branch merges and tags independently — v1.0 and v2.0 can ship on different schedules.' },
            { term: 'Long-term support (LTS)', definition: 'A release branch kept alive for extended maintenance, receiving only critical fixes while newer versions are developed.' }
        ],
        tradeoffs: {
            pros: [
                'Supports parallel version maintenance for different customers or platforms',
                'Each release has its own stabilization timeline',
                'Well-suited for libraries and frameworks with multiple supported versions',
                'Clear separation between major version lines'
            ],
            cons: [
                'Increased merge complexity with multiple long-lived branches',
                'Risk of divergent branches over time',
                'Requires discipline and tooling to keep releases in sync with main',
                'Higher maintenance burden for the team'
            ],
            whenToUse: 'Libraries, frameworks, and enterprise software that must maintain multiple major versions simultaneously — e.g., supporting v1.x and v2.x customers in parallel.'
        }
    }
};

/* ===== Create Release Mode ===== */
GFV.release.create = {
    label: 'Create Release',
    description: 'Develop on main, branch release/1.0 for stabilization, fix, merge back, tag, and clean up.',

    init: function() {
        GFV.initGraph(['main', 'release/1.0']);
    },

    steps: function() {
        return [
            { op: 'commit', branch: 'main', label: 'feat-1', description: 'User dashboard feature merged to main — includes widgets, charts, and real-time notifications', logType: 'COMMIT' },
            { op: 'commit', branch: 'main', label: 'feat-2', description: 'API rate limiting feature merged to main — enough features accumulated, time to prepare a release', logType: 'COMMIT' },
            { op: 'branch', branch: 'release/1.0', fromBranch: 'main', label: 'branch', description: 'Create release/1.0 from main — entering feature freeze, only bug fixes and stabilization from here', logType: 'BRANCH' },
            { op: 'commit', branch: 'release/1.0', label: 'stabilize', description: 'Stabilize release candidate — update dependencies, run performance benchmarks, verify database migrations', logType: 'COMMIT' },
            { op: 'commit', branch: 'release/1.0', label: 'fix', description: 'Fix edge case found during QA — dashboard widget crashes when user has no historical data', logType: 'COMMIT' },
            { op: 'merge', fromBranch: 'release/1.0', toBranch: 'main', label: 'merge', description: 'Merge release/1.0 back into main — stabilization fixes are now part of the mainline codebase', logType: 'MERGE' },
            { op: 'tag', branch: 'main', tagName: 'v1.0', description: 'Tag release v1.0 on main — this exact commit is the official production-ready release', logType: 'TAG' },
            { op: 'delete-branch', branch: 'release/1.0', label: 'cleanup', description: 'Delete release/1.0 branch — release shipped, branch served its stabilization purpose', logType: 'BRANCH' }
        ];
    },

    stepOptions: function() {
        return {
            requestLabel: 'Release Branching: Create Release',
            _initFn: GFV.release.create.init
        };
    },

    run: function() {
        GFV.release.create.init();
        GFV.animateFlow(GFV.release.create.steps(), GFV.release.create.stepOptions());
    }
};

/* ===== Patch Release Mode ===== */
GFV.release.patch = {
    label: 'Patch Release',
    description: 'Start from tagged v1.0, branch release/1.0 for a patch, fix, merge back, tag v1.0.1, clean up.',

    init: function() {
        GFV.initGraph(['main', 'release/1.0']);
    },

    steps: function() {
        return [
            { op: 'commit', branch: 'main', label: 'v1.0', description: 'Main is at v1.0 — this version has been running in production, but a bug was reported by customers', logType: 'COMMIT' },
            { op: 'tag', branch: 'main', tagName: 'v1.0', description: 'Existing tag v1.0 marks the release point — we will branch from here to apply a targeted patch', logType: 'TAG' },
            { op: 'branch', branch: 'release/1.0', fromBranch: 'main', label: 'branch', description: 'Create release/1.0 from the v1.0 tag — isolating the patch work from any new development on main', logType: 'BRANCH' },
            { op: 'commit', branch: 'release/1.0', label: 'patch-fix', description: 'Apply targeted patch fix — correct currency rounding error causing incorrect invoice totals for EUR transactions', logType: 'COMMIT' },
            { op: 'merge', fromBranch: 'release/1.0', toBranch: 'main', label: 'merge', description: 'Merge patch back into main — ensuring the fix is included in all future releases', logType: 'MERGE' },
            { op: 'tag', branch: 'main', tagName: 'v1.0.1', description: 'Tag patch release v1.0.1 — semantic versioning patch increment for the targeted fix', logType: 'TAG' },
            { op: 'delete-branch', branch: 'release/1.0', label: 'cleanup', description: 'Delete release/1.0 branch — patch delivered, branch no longer needed', logType: 'BRANCH' }
        ];
    },

    stepOptions: function() {
        return {
            requestLabel: 'Release Branching: Patch Release',
            _initFn: GFV.release.patch.init
        };
    },

    run: function() {
        GFV.release.patch.init();
        GFV.animateFlow(GFV.release.patch.steps(), GFV.release.patch.stepOptions());
    }
};

/* ===== Parallel Releases Mode ===== */
GFV.release.parallel = {
    label: 'Parallel Releases',
    description: 'Maintain two release branches simultaneously from main, stabilize each, merge and tag independently.',

    init: function() {
        GFV.initGraph(['main', 'release/1.0', 'release/2.0']);
    },

    steps: function() {
        return [
            { op: 'commit', branch: 'main', label: 'feat-1', description: 'Core API refactoring committed to main — laying groundwork for both v1.0 and v2.0 releases', logType: 'COMMIT' },
            { op: 'commit', branch: 'main', label: 'feat-2', description: 'Authentication module committed to main — shared across both upcoming release versions', logType: 'COMMIT' },
            { op: 'branch', branch: 'release/1.0', fromBranch: 'main', label: 'branch', description: 'Create release/1.0 from main — v1.0 enters stabilization while v2.0 features continue on main', logType: 'BRANCH' },
            { op: 'commit', branch: 'release/1.0', label: 'stabilize', description: 'Stabilize release/1.0 — fix flaky tests, update documentation, finalize configuration defaults', logType: 'COMMIT' },
            { op: 'commit', branch: 'main', label: 'feat-3', description: 'Advanced analytics feature committed to main — this is v2.0-only functionality, not part of v1.0', logType: 'COMMIT' },
            { op: 'branch', branch: 'release/2.0', fromBranch: 'main', label: 'branch', description: 'Create release/2.0 from main — now two releases stabilize in parallel on independent schedules', logType: 'BRANCH' },
            { op: 'commit', branch: 'release/2.0', label: 'stabilize', description: 'Stabilize release/2.0 — performance tuning for analytics queries, load testing under production data volume', logType: 'COMMIT' },
            { op: 'merge', fromBranch: 'release/1.0', toBranch: 'main', label: 'merge', description: 'Merge release/1.0 into main — v1.0 stabilization fixes are now part of the mainline', logType: 'MERGE' },
            { op: 'tag', branch: 'main', tagName: 'v1.0', description: 'Tag release v1.0 — first version shipped to customers on the standard tier', logType: 'TAG' },
            { op: 'merge', fromBranch: 'release/2.0', toBranch: 'main', label: 'merge', description: 'Merge release/2.0 into main — may require conflict resolution if v1.0 stabilization touched the same files. Resolve, then v2.0 is ready for enterprise customers', logType: 'MERGE' },
            { op: 'tag', branch: 'main', tagName: 'v2.0', description: 'Tag release v2.0 — premium version with analytics shipped to enterprise tier', logType: 'TAG' }
        ];
    },

    stepOptions: function() {
        return {
            requestLabel: 'Release Branching: Parallel Releases',
            _initFn: GFV.release.parallel.init
        };
    },

    run: function() {
        GFV.release.parallel.init();
        GFV.animateFlow(GFV.release.parallel.steps(), GFV.release.parallel.stepOptions());
    }
};
