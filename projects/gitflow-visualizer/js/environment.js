/* ===== Environment Branching ===== */

var GFV = window.GFV || {};
window.GFV = GFV;

GFV.environment = {};

/* ===== Modes ===== */
GFV.environment.modes = [
    { id: 'promote', label: 'Full Promotion', desc: 'Code promotes forward through environment branches: develop to qa to staging to production. Each environment has its own long-lived branch. Deployments happen when code is merged into an environment branch.' },
    { id: 'hotfix', label: 'Production Hotfix', desc: 'An emergency fix is committed directly to the production branch, deployed immediately, then synced back to develop so future promotions include the fix.' },
    { id: 'rollback', label: 'Rollback', desc: 'A bad deployment to production is reverted by applying a revert commit on the production branch, redeploying the previous known-good state, and tagging the rollback.' }
];

/* ===== Branch Rules ===== */
GFV.environment.branchRules = [
    { from: 'develop', to: 'qa', allowed: true },
    { from: 'qa', to: 'staging', allowed: true },
    { from: 'staging', to: 'production', allowed: true },
    { from: 'production', to: 'develop', allowed: true, note: 'Hotfix sync only' },
    { from: 'production', to: 'staging', allowed: false },
    { from: 'qa', to: 'develop', allowed: false }
];

/* ===== Details ===== */
GFV.environment.details = {
    promote: {
        principles: [
            'Each environment has its own long-lived branch',
            'Code promotes forward only: develop \u2192 qa \u2192 staging \u2192 production',
            'All changes enter through develop \u2014 never commit directly to environment branches',
            'Never merge backward (except hotfix sync from production to develop)',
            'Deploying means merging into the target environment branch',
            'Every promotion is an auditable merge commit'
        ],
        concepts: [
            { term: 'develop', definition: 'Active development branch where new features land. Starting point of the promotion pipeline. All fixes and changes must be committed here first.' },
            { term: 'qa', definition: 'Quality assurance branch. Receives merges from develop only \u2014 never direct commits. If a QA issue is found, the fix goes through develop and is re-promoted.' },
            { term: 'staging', definition: 'Pre-production environment. Receives merges from qa only \u2014 never direct commits. Config changes must flow from develop through the pipeline.' },
            { term: 'production', definition: 'Live environment branch. Only receives merges from staging (or hotfix commits in emergencies).' },
            { term: 'Promotion', definition: 'Forward merge from one environment branch to the next. The mechanism by which code advances toward production.' }
        ],
        tradeoffs: {
            pros: [
                'Clear mapping between branches and environments',
                'Full audit trail of what was deployed and when',
                'Each environment can be inspected independently',
                'Simple deployment model: merge = deploy'
            ],
            cons: [
                'Many long-lived branches to maintain',
                'Complex merges as environments drift apart',
                'Risk of environment drift if promotions are infrequent',
                'Overhead of managing promotion pipeline'
            ],
            whenToUse: 'Regulated industries, organizations with multiple deployment environments, teams that require compliance and audit trails for every promotion.'
        }
    },
    hotfix: {
        principles: [
            'Emergency fixes go directly on the production branch',
            'Hotfix is deployed immediately after commit',
            'Production is synced back to develop to propagate the fix',
            'Hotfix sync is the only allowed backward merge',
            'Patch tags mark every hotfix deployment'
        ],
        concepts: [
            { term: 'production', definition: 'Live branch that receives the emergency fix directly, bypassing the normal promotion pipeline.' },
            { term: 'develop', definition: 'Receives a sync merge from production after the hotfix to keep future promotions consistent.' },
            { term: 'Hotfix Sync', definition: 'A backward merge from production to develop. The only exception to the forward-only rule.' }
        ],
        tradeoffs: {
            pros: [
                'Fastest path to fix a production issue',
                'Fix is immediately reflected in the live branch',
                'Sync merge ensures develop stays consistent',
                'Clear patch versioning via tags'
            ],
            cons: [
                'Bypasses qa and staging validation',
                'Risk of introducing regressions without full testing',
                'Backward merge can cause conflicts on develop',
                'Requires discipline to limit scope to true emergencies'
            ],
            whenToUse: 'Critical production outages, security vulnerabilities, or data-integrity issues that cannot wait for a full promotion cycle.'
        }
    },
    rollback: {
        principles: [
            'Rollback is a revert commit on the production branch, not a branch reset',
            'The bad deployment is recorded in history, then undone',
            'A new deployment restores the previous known-good state',
            'Rollback tags mark the recovery point',
            'No history rewriting — the audit trail is preserved'
        ],
        concepts: [
            { term: 'staging', definition: 'Source of the bad merge that was promoted to production.' },
            { term: 'production', definition: 'Live branch where the revert commit is applied to undo the bad deployment.' },
            { term: 'Revert Commit', definition: 'A commit that undoes the changes of a previous merge. Preserves full history while restoring the prior state.' }
        ],
        tradeoffs: {
            pros: [
                'Fast recovery without history rewriting',
                'Full audit trail of the incident and rollback',
                'Production branch remains linear and clean',
                'Easy to re-promote once the issue is fixed'
            ],
            cons: [
                'Revert commit adds noise to the git log',
                'Re-promoting the same code later requires reverting the revert',
                'Does not address the root cause — only restores state',
                'Staging and qa branches may still contain the bad code'
            ],
            whenToUse: 'Failed deployments that cause user-facing issues, performance regressions detected after go-live, or any situation requiring immediate rollback to a known-good state.'
        }
    }
};

/* ===== Promote Mode ===== */
GFV.environment.promote = {
    init: function() {
        GFV.initGraph(['develop', 'qa', 'staging', 'production']);
    },
    steps: function() {
        return [
            { op: 'commit', branch: 'develop', label: 'Feature A', description: 'New user notifications feature committed to develop \u2014 ready to begin the promotion pipeline', logType: 'COMMIT' },
            { op: 'commit', branch: 'develop', label: 'Feature B', description: 'Database query optimizer committed to develop \u2014 two features batched for downstream promotion', logType: 'COMMIT' },
            { op: 'merge', fromBranch: 'develop', toBranch: 'qa', label: 'Promote', description: 'Promote develop to QA \u2014 merging 2 features into the QA branch for automated and manual testing', logType: 'MERGE' },
            { op: 'deploy', branch: 'qa', envName: 'QA', description: 'Deploy to QA environment \u2014 running full regression suite, API contract tests, and manual exploratory testing', logType: 'DEPLOY' },
            { op: 'merge', fromBranch: 'qa', toBranch: 'staging', label: 'Promote', description: 'Promote QA to staging \u2014 all QA tests pass, moving to pre-production for final validation with production-like data', logType: 'MERGE' },
            { op: 'deploy', branch: 'staging', envName: 'Staging', description: 'Deploy to staging environment \u2014 running load tests and verifying with production database snapshot', logType: 'DEPLOY' },
            { op: 'merge', fromBranch: 'staging', toBranch: 'production', label: 'Release', description: 'Promote staging to production \u2014 all environments validated, final approval received from release manager', logType: 'MERGE' },
            { op: 'tag', branch: 'production', tagName: 'v2.0', description: 'Tag production release v2.0 \u2014 marking the auditable deployment point before going live', logType: 'TAG' },
            { op: 'deploy', branch: 'production', envName: 'Production', description: 'Deploy tagged v2.0 to production \u2014 both features are now live for all end users', logType: 'DEPLOY' }
        ];
    },
    stepOptions: function() {
        return { requestLabel: 'Full Promotion: develop \u2192 qa \u2192 staging \u2192 production', _initFn: GFV.environment.promote.init };
    },
    run: function() {
        GFV.environment.promote.init();
        GFV.animateFlow(GFV.environment.promote.steps(), GFV.environment.promote.stepOptions());
    }
};

/* ===== Hotfix Mode ===== */
GFV.environment.hotfix = {
    init: function() {
        GFV.initGraph(['production', 'develop']);
    },
    steps: function() {
        return [
            { op: 'commit', branch: 'production', label: 'v2.0', description: 'Production is running v2.0 — stable release serving live customer traffic', logType: 'COMMIT' },
            { op: 'commit', branch: 'develop', label: 'WIP', description: 'Normal development continues on develop — team is working on v2.1 features', logType: 'COMMIT' },
            { op: 'commit', branch: 'production', label: 'Emergency fix', description: 'EMERGENCY: Apply fix directly on production — critical data corruption bug causing incorrect user balances', logType: 'COMMIT' },
            { op: 'tag', branch: 'production', tagName: 'v2.0.1', description: 'Tag hotfix release v2.0.1 — documenting the emergency patch for audit trail and rollback reference', logType: 'TAG' },
            { op: 'deploy', branch: 'production', envName: 'Production', description: 'Deploy tagged v2.0.1 to production — bypassing QA and staging due to severity, balance corruption stopped', logType: 'DEPLOY' },
            { op: 'merge', fromBranch: 'production', toBranch: 'develop', label: 'Sync fix', description: 'Sync hotfix back to develop (backward merge) — ensuring the fix is not lost when the next promotion happens', logType: 'MERGE' },
            { op: 'commit', branch: 'develop', label: 'Continue', description: 'Development continues on develop with the hotfix included — next promotion will carry the fix forward naturally', logType: 'COMMIT' }
        ];
    },
    stepOptions: function() {
        return { requestLabel: 'Production Hotfix: emergency fix on production', _initFn: GFV.environment.hotfix.init };
    },
    run: function() {
        GFV.environment.hotfix.init();
        GFV.animateFlow(GFV.environment.hotfix.steps(), GFV.environment.hotfix.stepOptions());
    }
};

/* ===== Rollback Mode ===== */
GFV.environment.rollback = {
    init: function() {
        GFV.initGraph(['develop', 'staging', 'production']);
    },
    steps: function() {
        return [
            { op: 'commit', branch: 'staging', label: 'Bad build', description: 'Staging contains a build with a hidden regression — memory leak not caught by automated tests', logType: 'COMMIT' },
            { op: 'merge', fromBranch: 'staging', toBranch: 'production', label: 'Promote', description: 'Promote staging to production — the memory leak was not detected during pre-production validation', logType: 'MERGE' },
            { op: 'deploy', branch: 'production', envName: 'Production', description: 'Deploy to production — within minutes, monitoring alerts fire as memory usage climbs steadily', logType: 'DEPLOY' },
            { op: 'commit', branch: 'production', label: 'Revert', description: 'Revert the bad merge on production — git revert creates a new commit that undoes the problematic changes while preserving history', logType: 'COMMIT' },
            { op: 'deploy', branch: 'production', envName: 'Rollback', description: 'Redeploy production with reverted state — service restored to the previous known-good configuration', logType: 'DEPLOY' },
            { op: 'tag', branch: 'production', tagName: 'v2.0.2', description: 'Tag rollback release v2.0.2 — marking the recovery point for incident report and audit trail', logType: 'TAG' },
            { op: 'merge', fromBranch: 'production', toBranch: 'develop', label: 'Sync revert', description: 'Sync revert commit back to develop — prevents the reverted bug from returning on the next promotion cycle', logType: 'MERGE' }
        ];
    },
    stepOptions: function() {
        return { requestLabel: 'Rollback: revert bad deployment on production', _initFn: GFV.environment.rollback.init };
    },
    run: function() {
        GFV.environment.rollback.init();
        GFV.animateFlow(GFV.environment.rollback.steps(), GFV.environment.rollback.stepOptions());
    }
};
