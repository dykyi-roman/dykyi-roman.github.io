/* ===== OneFlow ===== */

var GFV = window.GFV || {};
window.GFV = GFV;

GFV.oneflow = {};

/* ===== Modes ===== */
GFV.oneflow.modes = [
    { id: 'release', label: 'Release via Rebase', desc: 'A release branch is created from main, stabilized with fixes, then rebased onto main and fast-forward merged to preserve a linear history. The release branch is deleted after tagging.' },
    { id: 'hotfix',  label: 'Hotfix Cherry-pick', desc: 'A hotfix is committed on main and cherry-picked to the active release branch. This allows targeted backporting of critical fixes without merging unrelated changes.' },
    { id: 'feature', label: 'Feature Rebase',     desc: 'A feature branch is created from main, developed in isolation, then rebased onto main and fast-forward merged. This keeps the commit history linear and avoids merge commits.' }
];

/* ===== Branch Rules ===== */
GFV.oneflow.branchRules = [
    { from: 'feature/*',  to: 'main',      allowed: true,  note: 'via rebase + fast-forward merge' },
    { from: 'release/*',  to: 'main',      allowed: true,  note: 'via rebase + fast-forward merge' },
    { from: 'main',       to: 'release/*', allowed: true,  note: 'cherry-pick hotfixes' },
    { from: 'any',        to: 'any',       allowed: false, note: 'merge commits discouraged — use rebase' }
];

/* ===== Details (keyed by mode id) ===== */
GFV.oneflow.details = {
    release: {
        principles: [
            'Single main branch — the only long-lived branch',
            'No develop branch — simplicity over ceremony',
            'Rebase instead of merge commits — keep history linear',
            'Release branches are short-lived stabilization branches',
            'Linear history is the primary goal'
        ],
        concepts: [
            { term: 'main',              definition: 'The only long-lived branch; always deployable' },
            { term: 'release/*',         definition: 'Short-lived branch for release stabilization; rebased onto main before fast-forward merge' },
            { term: 'rebase',            definition: 'Replay commits on top of another branch tip to maintain linear history' },
            { term: 'fast-forward merge', definition: 'Moves branch pointer forward without a merge commit — preserves linear history' }
        ],
        tradeoffs: {
            pros: [
                'Clean, linear commit history',
                'Simpler than Classic GitFlow — fewer long-lived branches',
                'Fewer branches to manage and reason about'
            ],
            cons: [
                'Rebase requires discipline and understanding',
                'Force-push needed after rebase on shared branches',
                'Harder for beginners compared to merge-based flows'
            ],
            whenToUse: 'Teams wanting a clean, linear history with a single deployable branch and the discipline to rebase consistently.'
        }
    },
    hotfix: {
        principles: [
            'Single main branch — the only long-lived branch',
            'Hotfixes are committed on main and cherry-picked to release branches',
            'Cherry-pick allows selective backporting without full merges',
            'Release branches receive only targeted fixes',
            'Linear history is the primary goal'
        ],
        concepts: [
            { term: 'main',        definition: 'The only long-lived branch; all new work lands here first' },
            { term: 'cherry-pick', definition: 'Selective backport of individual commits between branches without merging entire histories' },
            { term: 'release/*',   definition: 'Stabilization branch that receives cherry-picked hotfixes from main' },
            { term: 'version tag', definition: 'A git tag marking a patch release on the release branch after a hotfix' }
        ],
        tradeoffs: {
            pros: [
                'Hotfixes land on main first — single source of truth',
                'Cherry-pick avoids pulling unrelated changes into release',
                'Patch releases are straightforward and isolated'
            ],
            cons: [
                'Cherry-pick can cause conflicts if commits depend on other changes',
                'Requires careful tracking of which fixes have been backported',
                'Manual cherry-pick process does not scale well with many release branches'
            ],
            whenToUse: 'Teams maintaining one or more release branches that need targeted hotfixes without merging all recent main development.'
        }
    },
    feature: {
        principles: [
            'Single main branch — the only long-lived branch',
            'No develop branch — simplicity over ceremony',
            'Feature branches rebase onto main before fast-forward merge',
            'Rebase instead of merge commits — keep history linear',
            'Linear history is the primary goal'
        ],
        concepts: [
            { term: 'main',              definition: 'The only long-lived branch; always deployable' },
            { term: 'feature/*',         definition: 'Short-lived branch for isolated feature development; rebased onto main when complete' },
            { term: 'rebase',            definition: 'Replay commits on top of another branch tip to maintain linear history' },
            { term: 'fast-forward merge', definition: 'Moves branch pointer forward without a merge commit — preserves linear history' }
        ],
        tradeoffs: {
            pros: [
                'Clean, linear commit history with no merge commits',
                'Simple mental model — only main and short-lived feature branches',
                'Easy to bisect and review history'
            ],
            cons: [
                'Rebase requires discipline and understanding',
                'Force-push needed after rebase if feature branch was shared',
                'Harder for beginners compared to merge-based flows'
            ],
            whenToUse: 'Small to medium teams that value a linear commit history and are comfortable with interactive rebase workflows.'
        }
    }
};

/* ===== Release via Rebase ===== */

GFV.oneflow.release = {
    init: function() {
        GFV.initGraph(['main', 'release/1.0']);
    },

    steps: function() {
        return [
            { op: 'branch',        fromBranch: 'main',    branch: 'release/1.0',     logType: 'BRANCH',  description: 'Create release/1.0 branch from main — entering stabilization phase for the upcoming release', descriptionKey: 'gfv.oneflow.release.0' },
            { op: 'commit',        branch: 'release/1.0', label: 'fix: typo',        logType: 'COMMIT',  description: 'Fix typo in API documentation on release branch — minor correction found during final review', descriptionKey: 'gfv.oneflow.release.1' },
            { op: 'commit',        branch: 'release/1.0', label: 'docs: changelog',  logType: 'COMMIT',  description: 'Update CHANGELOG.md with v1.0 release notes — documenting all features and fixes included', descriptionKey: 'gfv.oneflow.release.2' },
            { op: 'commit',        branch: 'main',        label: 'feat: new',        logType: 'COMMIT',  description: 'Meanwhile, new feature work lands on main — development does not stop during release stabilization', descriptionKey: 'gfv.oneflow.release.3' },
            { op: 'rebase',        fromBranch: 'release/1.0', toBranch: 'main', count: 2, logType: 'REBASE', description: 'Rebase release/1.0 onto main — replay release commits on top of latest main to maintain linear history', descriptionKey: 'gfv.oneflow.release.4' },
            { op: 'merge',         fromBranch: 'release/1.0', toBranch: 'main', label: 'ff-merge', logType: 'MERGE', description: 'Fast-forward merge release/1.0 into main — no merge commit created, history stays perfectly linear', descriptionKey: 'gfv.oneflow.release.5' },
            { op: 'tag',           branch: 'main',        tagName: 'v1.0',           logType: 'TAG',     description: 'Tag v1.0 on main — marking the exact production-ready commit for this release', descriptionKey: 'gfv.oneflow.release.6' },
            { op: 'delete-branch', branch: 'release/1.0',                            logType: 'DELETE',  description: 'Delete release/1.0 branch — release finalized, only main remains as the long-lived branch', descriptionKey: 'gfv.oneflow.release.7' }
        ];
    },

    run: function() {
        this.init();
        GFV.animateFlow(this.steps(), {
            requestLabel: GFV._t('gfv.request.oneflow.release', null, 'OneFlow — Release via Rebase')
        });
    }
};

/* ===== Hotfix Cherry-pick ===== */

GFV.oneflow.hotfix = {
    init: function() {
        GFV.initGraph(['main', 'release/1.0']);
    },

    steps: function() {
        return [
            { op: 'tag',         branch: 'main',        tagName: 'v1.0',        logType: 'TAG',         description: 'Tag v1.0 on main — marking the initial production release point', descriptionKey: 'gfv.oneflow.hotfix.0' },
            { op: 'branch',      fromBranch: 'main',    branch: 'release/1.0',  logType: 'BRANCH',      description: 'Create release/1.0 from main at the v1.0 tag — this branch will receive targeted hotfixes only', descriptionKey: 'gfv.oneflow.hotfix.1' },
            { op: 'commit',      branch: 'main',        label: 'feat: next',    logType: 'COMMIT',      description: 'New feature development continues on main — unrelated to the released v1.0 version', descriptionKey: 'gfv.oneflow.hotfix.2' },
            { op: 'commit',      branch: 'main',        label: 'fix: hotfix',   logType: 'COMMIT',      description: 'Critical hotfix committed on main first — fixing a null pointer exception in the payment module', descriptionKey: 'gfv.oneflow.hotfix.3' },
            { op: 'cherry-pick', fromBranch: 'main',    toBranch: 'release/1.0', label: 'hotfix', logType: 'CHERRY_PICK', description: 'Cherry-pick the hotfix commit from main to release/1.0 — backporting only the specific fix, not other new work', descriptionKey: 'gfv.oneflow.hotfix.4' },
            { op: 'tag',         branch: 'release/1.0', tagName: 'v1.0.1',      logType: 'TAG',         description: 'Tag v1.0.1 on the release branch — patch version for customers running the v1.0 line', descriptionKey: 'gfv.oneflow.hotfix.5' },
            { op: 'merge',       fromBranch: 'release/1.0', toBranch: 'main', label: 'sync', logType: 'MERGE', description: 'Merge release/1.0 back to main — synchronizing to ensure no fixes are lost in future releases', descriptionKey: 'gfv.oneflow.hotfix.6' }
        ];
    },

    run: function() {
        this.init();
        GFV.animateFlow(this.steps(), {
            requestLabel: GFV._t('gfv.request.oneflow.hotfix', null, 'OneFlow — Hotfix Cherry-pick')
        });
    }
};

/* ===== Feature Rebase ===== */

GFV.oneflow.feature = {
    init: function() {
        this._b = 'feature/' + GFV.jira();
        GFV.initGraph(['main', this._b]);
    },
    steps: function() {
        var b = this._b;
        return [
            { op: 'branch', fromBranch: 'main', branch: b, logType: 'BRANCH', description: 'Create ' + b + ' from main — starting isolated feature development', descriptionKey: 'gfv.oneflow.feature.0' },
            { op: 'commit', branch: b, label: 'feat: endpoint', logType: 'COMMIT', description: 'Add REST API endpoint for user preferences — GET/PUT /api/v1/users/{id}/preferences', descriptionKey: 'gfv.oneflow.feature.1' },
            { op: 'commit', branch: b, label: 'test: api', logType: 'COMMIT', description: 'Add API tests covering validation, authorization, and edge cases for the preferences endpoint', descriptionKey: 'gfv.oneflow.feature.2' },
            { op: 'commit', branch: 'main', label: 'feat: other', logType: 'COMMIT', description: 'Meanwhile, another developer\'s work lands on main — main has moved ahead since we branched', descriptionKey: 'gfv.oneflow.feature.3' },
            { op: 'rebase', fromBranch: b, toBranch: 'main', count: 2, logType: 'REBASE', description: 'Rebase ' + b + ' onto latest main — replaying our 2 commits on top of the updated main tip', descriptionKey: 'gfv.oneflow.feature.4' },
            { op: 'merge', fromBranch: b, toBranch: 'main', label: 'ff-merge', logType: 'MERGE', description: 'Fast-forward merge ' + b + ' into main — no merge commit needed thanks to the rebase', descriptionKey: 'gfv.oneflow.feature.5' },
            { op: 'delete-branch', branch: b, logType: 'DELETE', description: 'Delete ' + b + ' branch — feature integrated, keeping a clean linear history on main', descriptionKey: 'gfv.oneflow.feature.6' }
        ];
    },
    run: function() {
        this.init();
        GFV.animateFlow(this.steps(), {
            requestLabel: GFV._t('gfv.request.oneflow.feature', null, 'OneFlow — Feature Rebase')
        });
    }
};
