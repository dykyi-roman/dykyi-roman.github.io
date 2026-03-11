/* ===== Forking Workflow ===== */

var GFV = window.GFV || {};
window.GFV = GFV;

GFV.forking = {};

GFV.forking.modes = [
    { id: 'contribute', label: 'Fork + PR', desc: 'Fork upstream, sync origin, create feature branch, commit, open PR to upstream, merge, sync back, clean up.' },
    { id: 'sync', label: 'Sync Fork', desc: 'Upstream advances while fork is outdated, then contributor syncs fork with upstream.' },
    { id: 'review', label: 'Maintainer Review', desc: 'Contributor opens PR from fork, maintainer reviews with comments, contributor updates, maintainer merges, contributor syncs.' }
];

GFV.forking.branchRules = [
    { from: 'origin/*', to: 'upstream/main', allowed: true, note: 'Via Pull Request only' },
    { from: 'upstream/main', to: 'origin/main', allowed: true, note: 'Sync / fetch upstream' },
    { from: 'Direct push', to: 'upstream/main', allowed: false, note: 'Forbidden for contributors' },
    { from: 'feature/*', to: 'upstream/main', allowed: true, note: 'Via Pull Request' }
];

GFV.forking.details = {
    contribute: {
        principles: [
            'Contributors don\'t have write access to the upstream repository',
            'All changes are proposed via fork + Pull Request',
            'Maintainers review and merge contributions into upstream',
            'Contributors must keep their fork in sync with upstream'
        ],
        concepts: [
            { term: 'upstream', definition: 'The original repository owned by the project maintainers' },
            { term: 'origin', definition: 'The contributor\'s personal fork (full copy of the repo)' },
            { term: 'fork', definition: 'A complete copy of a repository under a different owner' },
            { term: 'Pull Request', definition: 'A cross-repo merge request from fork to upstream' },
            { term: 'sync', definition: 'Fetching upstream changes into the fork to stay up to date' }
        ],
        tradeoffs: {
            pros: [
                'No write access needed to the upstream repo',
                'Safe for open-source — contributors work in isolation',
                'Clear ownership and authorship of changes'
            ],
            cons: [
                'Sync overhead — fork can drift out of date',
                'PR review bottleneck for maintainers',
                'More complex workflow compared to shared-repo models'
            ],
            whenToUse: 'Open-source projects, external contributors, environments with untrusted contributors where upstream write access must be restricted.'
        }
    },
    sync: {
        principles: [
            'Forks must be regularly synced with upstream to avoid drift',
            'Use git fetch upstream + merge or rebase to incorporate changes',
            'Resolve conflicts locally before pushing to origin',
            'Sync before starting any new feature branch'
        ],
        concepts: [
            { term: 'upstream remote', definition: 'A git remote pointing to the original repository' },
            { term: 'fetch', definition: 'Download commits from upstream without merging them' },
            { term: 'merge upstream', definition: 'Integrate upstream changes into the local fork branch' },
            { term: 'drift', definition: 'Divergence between fork and upstream over time' }
        ],
        tradeoffs: {
            pros: [
                'Keeps fork up to date and reduces merge conflicts',
                'Ensures feature branches start from latest upstream state',
                'Prevents large, painful merges later'
            ],
            cons: [
                'Requires manual effort to sync regularly',
                'Merge conflicts may arise during sync',
                'Contributors must understand multiple remotes'
            ],
            whenToUse: 'Whenever contributing to an active upstream repository where new commits land frequently.'
        }
    },
    review: {
        principles: [
            'Maintainers gate all changes via code review before merging',
            'Contributors address review feedback by pushing new commits to the PR',
            'PRs are the single entry point for changes into upstream',
            'After merge, contributors sync their fork to stay current'
        ],
        concepts: [
            { term: 'code review', definition: 'Maintainer inspection of proposed changes before merge' },
            { term: 'review comments', definition: 'Feedback left on specific lines or overall PR by reviewers' },
            { term: 'PR update', definition: 'Pushing additional commits to an open PR to address feedback' },
            { term: 'approval', definition: 'Maintainer sign-off indicating the PR is ready to merge' }
        ],
        tradeoffs: {
            pros: [
                'Ensures code quality through maintainer oversight',
                'Knowledge sharing between contributor and maintainer',
                'Catches bugs and design issues before they reach upstream'
            ],
            cons: [
                'Review turnaround can slow down contribution velocity',
                'Maintainer bandwidth becomes a bottleneck',
                'Back-and-forth cycles can be frustrating for contributors'
            ],
            whenToUse: 'All open-source projects and any team where code quality gates and maintainer approval are required before merging.'
        }
    }
};

/* ===== Contribute Mode (Fork + PR) ===== */
GFV.forking.contribute = {
    label: 'Fork + PR',
    description: 'Fork upstream, sync origin, create feature branch, commit, open PR to upstream, merge, sync back, clean up.',

    init: function() {
        this._b = 'feature/' + GFV.jira();
        GFV.initGraph(['upstream/main', 'origin/main', this._b], { height: 260 });
        var g = GFV.graph;
        var upstreamY = g.branches['upstream/main'].y;
        var originY = g.branches['origin/main'].y;
        var separatorY = Math.round((upstreamY + originY) / 2);
        GFV.addZoneSeparator(separatorY, 'Fork boundary');
    },

    steps: function() {
        var b = this._b;
        return [
            { op: 'commit', branch: 'upstream/main', label: 'v1.0', description: 'Upstream repository has existing commits — this is the original project owned by maintainers', logType: 'COMMIT' },
            { op: 'commit', branch: 'origin/main', label: 'sync', description: 'Sync personal fork with upstream (git fetch upstream && git merge) — ensuring fork is up to date before starting work', logType: 'COMMIT' },
            { op: 'branch', branch: b, fromBranch: 'origin/main', label: 'branch', description: 'Create ' + b + ' from origin/main — working in the contributor\'s own fork, not the upstream repo', logType: 'BRANCH' },
            { op: 'commit', branch: b, label: 'fix-1', description: 'First commit: add input validation for the search query parameter — preventing SQL injection', logType: 'COMMIT' },
            { op: 'commit', branch: b, label: 'fix-2', description: 'Second commit: add unit tests for the new validation logic and update API documentation', logType: 'COMMIT' },
            { op: 'pr', fromBranch: b, toBranch: 'upstream/main', label: 'PR #1', description: 'Open cross-repo PR: ' + b + ' → upstream/main — proposing the contribution for maintainer review', logType: 'PR' },
            { op: 'merge', fromBranch: b, toBranch: 'upstream/main', label: 'merge', description: 'Maintainer reviews, approves, and merges the PR into upstream/main — contribution accepted', logType: 'MERGE' },
            { op: 'merge', fromBranch: 'upstream/main', toBranch: 'origin/main', label: 'sync', description: 'Sync origin/main with upstream (git pull upstream main) — pulling back the merged contribution plus any other new commits', logType: 'MERGE' },
            { op: 'delete-branch', branch: b, label: 'cleanup', description: 'Delete ' + b + ' branch from fork — contribution merged, keeping the fork clean for the next task', logType: 'BRANCH' }
        ];
    },

    stepOptions: function() {
        return {
            requestLabel: 'Forking Workflow: Fork + PR',
            _initFn: GFV.forking.contribute.init
        };
    },

    run: function() {
        GFV.forking.contribute.init();
        GFV.animateFlow(GFV.forking.contribute.steps(), GFV.forking.contribute.stepOptions());
    }
};

/* ===== Sync Mode (Sync Fork) ===== */
GFV.forking.sync = {
    label: 'Sync Fork',
    description: 'Upstream advances while fork is outdated, then contributor syncs fork with upstream.',

    init: function() {
        GFV.initGraph(['upstream/main', 'origin/main'], { height: 200 });
        var g = GFV.graph;
        var upstreamY = g.branches['upstream/main'].y;
        var originY = g.branches['origin/main'].y;
        var separatorY = Math.round((upstreamY + originY) / 2);
        GFV.addZoneSeparator(separatorY, 'Fork boundary');
    },

    steps: function() {
        return [
            { op: 'commit', branch: 'upstream/main', label: 'feat-A', description: 'New feature (dark mode) merged to upstream by another contributor — upstream advances', logType: 'COMMIT' },
            { op: 'commit', branch: 'upstream/main', label: 'feat-B', description: 'Bug fix merged to upstream — the project is active, upstream keeps moving forward', logType: 'COMMIT' },
            { op: 'commit', branch: 'origin/main', label: 'old', description: 'Origin/main is now 2 commits behind upstream — fork has drifted and needs synchronization', logType: 'COMMIT' },
            { op: 'merge', fromBranch: 'upstream/main', toBranch: 'origin/main', label: 'sync', description: 'Fetch upstream changes and merge into fork (git fetch upstream && git merge upstream/main) — resolving any drift', logType: 'MERGE' },
            { op: 'commit', branch: 'origin/main', label: 'up-to-date', description: 'Origin/main is now in sync with upstream — safe to create new feature branches from this point', logType: 'COMMIT' }
        ];
    },

    stepOptions: function() {
        return {
            requestLabel: 'Forking Workflow: Sync Fork',
            _initFn: GFV.forking.sync.init
        };
    },

    run: function() {
        GFV.forking.sync.init();
        GFV.animateFlow(GFV.forking.sync.steps(), GFV.forking.sync.stepOptions());
    }
};

/* ===== Review Mode (Maintainer Review) ===== */
GFV.forking.review = {
    label: 'Maintainer Review',
    description: 'Contributor opens PR from fork, maintainer reviews with comments, contributor updates, maintainer merges, contributor syncs.',

    init: function() {
        GFV.initGraph(['upstream/main', 'origin/main'], { height: 200 });
        var g = GFV.graph;
        var upstreamY = g.branches['upstream/main'].y;
        var originY = g.branches['origin/main'].y;
        var separatorY = Math.round((upstreamY + originY) / 2);
        GFV.addZoneSeparator(separatorY, 'Fork boundary');
    },

    steps: function() {
        return [
            { op: 'commit', branch: 'origin/main', label: 'contrib', description: 'Contributor implements a new CSV export feature on their fork — ready for upstream review', logType: 'COMMIT' },
            { op: 'pr', fromBranch: 'origin/main', toBranch: 'upstream/main', label: 'PR #1', description: 'Open PR: origin/main → upstream/main — proposing the CSV export feature for inclusion in the project', logType: 'PR' },
            { op: 'commit', branch: 'origin/main', label: 'review-fix', description: 'Maintainer requests changes: add error handling for large files and improve column header naming', logType: 'COMMIT' },
            { op: 'commit', branch: 'origin/main', label: 'update', description: 'Push review fixes to the same PR — added file size limit check and renamed headers to match project conventions', logType: 'COMMIT' },
            { op: 'pr', fromBranch: 'origin/main', toBranch: 'upstream/main', label: 'PR #1 (updated)', description: 'PR automatically updated with the new commits — maintainer can see the addressed feedback', logType: 'PR' },
            { op: 'merge', fromBranch: 'origin/main', toBranch: 'upstream/main', label: 'merge', description: 'Maintainer approves the updated PR and merges into upstream — contribution accepted after review cycle', logType: 'MERGE' },
            { op: 'merge', fromBranch: 'upstream/main', toBranch: 'origin/main', label: 'sync', description: 'Contributor syncs fork with upstream after merge — pulling back the squashed commit and any other recent changes', logType: 'MERGE' }
        ];
    },

    stepOptions: function() {
        return {
            requestLabel: 'Forking Workflow: Maintainer Review',
            _initFn: GFV.forking.review.init
        };
    },

    run: function() {
        GFV.forking.review.init();
        GFV.animateFlow(GFV.forking.review.steps(), GFV.forking.review.stepOptions());
    }
};
