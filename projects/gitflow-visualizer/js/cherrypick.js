/* ===== Cherry-pick Flow ===== */

var GFV = window.GFV || {};
window.GFV = GFV;

GFV.cherrypick = {};

/* ===== Modes ===== */
GFV.cherrypick.modes = [
    { id: 'backport', label: 'Backport Fix', desc: 'A bug fix is committed on main and cherry-picked to older release branches. Each release receives a patch tag. This keeps all supported versions in sync without merging entire branches.' },
    { id: 'forward', label: 'Forward Port', desc: 'A fix is committed on an older release branch and cherry-picked forward to main. This ensures urgent fixes land in the current release while preserving the fix in the older version.' },
    { id: 'multi', label: 'Multi-version', desc: 'A security fix is committed on main and cherry-picked to all supported release branches. Each release is tagged independently, enabling parallel version maintenance.' }
];

/* ===== Branch Rules ===== */
GFV.cherrypick.branchRules = [
    { from: 'main', to: 'release/*', allowed: true },
    { from: 'release/*', to: 'main', allowed: true },
    { from: 'release/*', to: 'release/*', allowed: true },
    { from: 'release/*', to: 'release/* (direct merge)', allowed: false }
];

/* ===== Details ===== */
GFV.cherrypick.details = {
    backport: {
        principles: [
            'Fix once in main, cherry-pick to all supported release branches',
            'Backport critical fixes to older versions still in production',
            'Maintain multiple release versions independently',
            'Each release branch receives its own patch tag after cherry-pick'
        ],
        concepts: [
            { term: 'Cherry-pick', definition: 'Apply a specific commit from one branch to another without merging the entire branch history. Creates a new commit with the same changes.' },
            { term: 'Backport', definition: 'Porting a fix from a newer version (main) to an older supported release branch. Ensures older versions receive critical patches.' },
            { term: 'Patch Tag', definition: 'A version tag (e.g., v1.0.1) applied to a release branch after a cherry-picked fix. Marks a point-release for that version.' }
        ],
        tradeoffs: {
            pros: [
                'Targeted fixes with minimal risk to each release',
                'Each version stays isolated — no unintended changes leak across',
                'Clear patch history per release via tags',
                'Fix is authored and tested once on main'
            ],
            cons: [
                'Easy to miss a cherry-pick to one of several release branches',
                'Cherry-picked commits create divergent history across branches',
                'Manual tracking required to know which fixes reached which releases'
            ],
            whenToUse: 'Libraries and frameworks with multiple supported versions, long-term support (LTS) releases, and products running different versions in production simultaneously.'
        }
    },
    forward: {
        principles: [
            'Fix urgent issues directly on the affected release branch',
            'Forward port the fix to main so it is included in future releases',
            'Tag the release branch immediately for rapid deployment',
            'Keep main up to date with all production fixes'
        ],
        concepts: [
            { term: 'Forward Port', definition: 'Cherry-picking a fix from an older release branch into main or a newer branch. Ensures the fix is not lost in future versions.' },
            { term: 'Release Tag', definition: 'A tag applied to the release branch after the fix, enabling immediate deployment of the patched version.' },
            { term: 'Cherry-pick to main', definition: 'Applying the release fix commit to main so that the next major version includes the same fix.' }
        ],
        tradeoffs: {
            pros: [
                'Urgent fix lands on the affected version immediately',
                'Main stays synchronized with production fixes',
                'No need to wait for a full release cycle to fix older versions',
                'Version isolation — fix does not pull in unreleased features'
            ],
            cons: [
                'Risk of forgetting to forward port the fix',
                'Cherry-pick may conflict with newer code on main',
                'Divergent commit history between release and main'
            ],
            whenToUse: 'When a critical bug is found in a deployed release and the fix must ship immediately, while also ensuring main does not regress in future releases.'
        }
    },
    multi: {
        principles: [
            'Fix security issues once on main, propagate to all supported versions',
            'Cherry-pick to every active release branch systematically',
            'Tag each release independently after applying the fix',
            'Maintain a clear record of which versions received the patch'
        ],
        concepts: [
            { term: 'Multi-version Support', definition: 'Maintaining multiple release branches in parallel, each receiving critical fixes independently via cherry-pick.' },
            { term: 'Security Fix Propagation', definition: 'Systematically cherry-picking a security patch from main to all supported release branches to close vulnerabilities across versions.' },
            { term: 'Release Matrix', definition: 'The set of currently supported release branches. Each must be evaluated for cherry-pick applicability when a fix lands on main.' }
        ],
        tradeoffs: {
            pros: [
                'All supported versions patched consistently',
                'Each version tagged and deployable independently',
                'Minimal risk — only the specific fix is applied',
                'Clear audit trail of security patches per version'
            ],
            cons: [
                'Scales poorly as the number of supported versions grows',
                'Cherry-pick conflicts increase with version divergence',
                'Requires tooling or discipline to track propagation status'
            ],
            whenToUse: 'Open-source libraries with multiple active major versions, enterprise software with contractual LTS obligations, and any system where multiple production versions must be patched simultaneously.'
        }
    }
};

/* ===== Backport Mode ===== */
GFV.cherrypick.backport = {
    init: function() {
        GFV.initGraph(['main', 'release/2.0', 'release/1.0']);
    },
    steps: function() {
        return [
            { op: 'commit', branch: 'main', label: 'v3.0-dev', description: 'Active development on main targeting v3.0 — new features being built for the next major release', logType: 'COMMIT' },
            { op: 'commit', branch: 'release/2.0', label: 'v2.0', description: 'Release/2.0 is in production — enterprise customers are running this version', logType: 'COMMIT' },
            { op: 'commit', branch: 'release/1.0', label: 'v1.0', description: 'Release/1.0 is still supported — legacy customers on LTS contracts depend on this version', logType: 'COMMIT' },
            { op: 'commit', branch: 'main', label: 'Bug fix', description: 'Fix critical memory leak in the connection pool — affects all versions, fixed on main first', logType: 'COMMIT' },
            { op: 'cherry-pick', fromBranch: 'main', toBranch: 'release/2.0', label: 'Bug fix', description: 'Cherry-pick the connection pool fix from main to release/2.0 — backporting to currently deployed version', logType: 'CHERRY-PICK' },
            { op: 'cherry-pick', fromBranch: 'main', toBranch: 'release/1.0', label: 'Bug fix', description: 'Cherry-pick the same fix to release/1.0 — LTS customers also need the memory leak resolved', logType: 'CHERRY-PICK' },
            { op: 'tag', branch: 'release/2.0', tagName: 'v2.0.1', description: 'Tag patch release v2.0.1 on release/2.0 — enterprise customers can now upgrade to the patched version', logType: 'TAG' },
            { op: 'tag', branch: 'release/1.0', tagName: 'v1.0.1', description: 'Tag patch release v1.0.1 on release/1.0 — LTS customers receive the fix without upgrading major version', logType: 'TAG' },
            { op: 'commit', branch: 'main', label: 'Continue', description: 'Development resumes on main — the fix is already integrated here, no additional action needed', logType: 'COMMIT' }
        ];
    },
    stepOptions: function() {
        return { requestLabel: 'Cherry-pick Flow: Backport Fix', _initFn: GFV.cherrypick.backport.init };
    },
    run: function() {
        GFV.cherrypick.backport.init();
        GFV.animateFlow(GFV.cherrypick.backport.steps(), GFV.cherrypick.backport.stepOptions());
    }
};

/* ===== Forward Port Mode ===== */
GFV.cherrypick.forward = {
    init: function() {
        GFV.initGraph(['main', 'release/2.0']);
    },
    steps: function() {
        return [
            { op: 'commit', branch: 'main', label: 'v3.0-dev', description: 'Active v3.0 development on main — new microservices architecture being implemented', logType: 'COMMIT' },
            { op: 'commit', branch: 'release/2.0', label: 'v2.0', description: 'Release/2.0 is running in production — serving live customer traffic', logType: 'COMMIT' },
            { op: 'commit', branch: 'release/2.0', label: 'Fix', description: 'URGENT: Fix authentication bypass vulnerability discovered in production — patched directly on release/2.0 for fastest response', logType: 'COMMIT' },
            { op: 'tag', branch: 'release/2.0', tagName: 'v2.0.1', description: 'Tag patch release v2.0.1 — security fix immediately available for production deployment', logType: 'TAG' },
            { op: 'cherry-pick', fromBranch: 'release/2.0', toBranch: 'main', label: 'Fix', description: 'Forward-port: cherry-pick the security fix from release/2.0 to main — ensuring v3.0 is not vulnerable', logType: 'CHERRY-PICK' },
            { op: 'commit', branch: 'main', label: 'Continue', description: 'Development resumes on main with the security fix included — no regression in the v3.0 codebase', logType: 'COMMIT' },
            { op: 'tag', branch: 'main', tagName: 'v3.0', description: 'Tag next major release v3.0 — includes the forward-ported security fix plus all new v3.0 features', logType: 'TAG' }
        ];
    },
    stepOptions: function() {
        return { requestLabel: 'Cherry-pick Flow: Forward Port', _initFn: GFV.cherrypick.forward.init };
    },
    run: function() {
        GFV.cherrypick.forward.init();
        GFV.animateFlow(GFV.cherrypick.forward.steps(), GFV.cherrypick.forward.stepOptions());
    }
};

/* ===== Multi-version Mode ===== */
GFV.cherrypick.multi = {
    init: function() {
        GFV.initGraph(['main', 'release/3.0', 'release/2.0', 'release/1.0']);
    },
    steps: function() {
        return [
            { op: 'commit', branch: 'main', label: 'v4.0-dev', description: 'Active v4.0 development on main — next-generation platform features in progress', logType: 'COMMIT' },
            { op: 'commit', branch: 'release/2.0', label: 'v2.0', description: 'Release/2.0 is in production for standard-tier customers — actively supported', logType: 'COMMIT' },
            { op: 'commit', branch: 'release/1.0', label: 'v1.0', description: 'Release/1.0 is in LTS mode — critical patches only, legacy customers still on contract', logType: 'COMMIT' },
            { op: 'branch', branch: 'release/3.0', fromBranch: 'main', label: 'release/3.0', description: 'Branch release/3.0 from main — preparing the latest major version for enterprise customers', logType: 'BRANCH' },
            { op: 'commit', branch: 'main', label: 'Security fix', description: 'CRITICAL: Fix XSS vulnerability in user-generated content renderer — affects ALL supported versions', logType: 'COMMIT' },
            { op: 'cherry-pick', fromBranch: 'main', toBranch: 'release/3.0', label: 'Security fix', description: 'Cherry-pick XSS fix to release/3.0 — patching the newest supported version first', logType: 'CHERRY-PICK' },
            { op: 'cherry-pick', fromBranch: 'main', toBranch: 'release/2.0', label: 'Security fix', description: 'Cherry-pick XSS fix to release/2.0 — standard-tier customers need the security patch', logType: 'CHERRY-PICK' },
            { op: 'cherry-pick', fromBranch: 'main', toBranch: 'release/1.0', label: 'Security fix', description: 'Cherry-pick XSS fix to release/1.0 — even LTS versions must receive critical security patches', logType: 'CHERRY-PICK' },
            { op: 'tag', branch: 'release/3.0', tagName: 'v3.0.1', description: 'Tag v3.0.1 — enterprise customers can upgrade to the patched version immediately', logType: 'TAG' },
            { op: 'tag', branch: 'release/2.0', tagName: 'v2.0.1', description: 'Tag v2.0.1 — standard-tier patch release with the XSS vulnerability resolved', logType: 'TAG' },
            { op: 'tag', branch: 'release/1.0', tagName: 'v1.0.1', description: 'Tag v1.0.1 — LTS patch release, maintaining security compliance for legacy deployments', logType: 'TAG' },
            { op: 'commit', branch: 'main', label: 'Continue', description: 'Development resumes on main — all 3 supported versions are now patched against the vulnerability', logType: 'COMMIT' }
        ];
    },
    stepOptions: function() {
        return { requestLabel: 'Cherry-pick Flow: Multi-version', _initFn: GFV.cherrypick.multi.init };
    },
    run: function() {
        GFV.cherrypick.multi.init();
        GFV.animateFlow(GFV.cherrypick.multi.steps(), GFV.cherrypick.multi.stepOptions());
    }
};
