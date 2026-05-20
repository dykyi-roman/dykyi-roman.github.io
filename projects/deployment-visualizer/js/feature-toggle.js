/* ===== Feature Toggle Deployment ===== */

DV['feature-toggle'] = {};

DV['feature-toggle'].modes = [
    { id: 'success' },
    { id: 'migration-fail' },
    { id: 'app-fail' }
];

DV['feature-toggle'].properties = [
    { nameKey: 'dv.prop.downtime',  valueKey: 'dv.feature-toggle.prop.downtime',  type: 'good' },
    { nameKey: 'dv.prop.rollback',  valueKey: 'dv.feature-toggle.prop.rollback',  type: 'good' },
    { nameKey: 'dv.prop.cost',      valueKey: 'dv.feature-toggle.prop.cost',      type: 'good' },
    { nameKey: 'dv.prop.risk',      valueKey: 'dv.feature-toggle.prop.risk',      type: 'good' },
    { nameKey: 'dv.prop.migration', valueKey: 'dv.feature-toggle.prop.migration', type: 'info' }
];

(function() {
    function board() {
        return {
            stages: ['build', 'migrate-expand', 'deploy', 'health', 'toggle', 'observe', 'migrate-contract', 'done'],
            groups: [{ labelKey: 'dv.group.fleet', version: 'v1', instances: DV.fleet('v1', 'healthy', 4) }],
            router: { v1: 100, v2: 0 },
            flag: { state: 'off', pct: 0 },
            services: {
                db: { schema: 'orders <b>v1</b>', migration: '&mdash;', io: 'idle', status: 'idle' },
                cache: { keys: 'v1', state: 'warm', io: 'idle', status: 'idle' },
                queue: { consumers: 'v1 &times;4', messages: '0', io: 'idle', status: 'idle' },
                search: { index: 'idx_v1', reindex: '&mdash;', io: 'idle', status: 'idle' }
            }
        };
    }
    function init() { DV.renderBoard(board()); }
    function grp(version, instances) {
        return [{ labelKey: 'dv.group.fleet', version: version, instances: instances }];
    }
    var F = DV.fleet;
    var K = 'dv.s.feature-toggle.';

    /* ----- Success ----- */
    function successSteps() {
        return [
            { stage: 'build', logType: 'PIPELINE', descKey: K + 'success.0',
              desc: 'CI builds v2 — the new feature is included but wrapped in an OFF feature flag.' },
            { stage: 'migrate-expand', logType: 'MIGRATE',
              services: { db: { schema: 'orders <b>v1</b> (+feature cols)', migration: 'expand: ADD COLUMN (nullable)', io: 'write', pulse: 'write', status: 'ok' } },
              descKey: K + 'success.1',
              desc: 'Run the expand migration: the feature’s columns are added, nullable and unused for now.' },
            { stage: 'deploy', logType: 'DEPLOY',
              instances: grp('v2', F('v2', 'starting', 4)),
              flag: { state: 'off', pct: 0 },
              descKey: K + 'success.2',
              desc: 'Deploy v2 to the whole fleet. With the flag OFF, v2 behaves exactly like v1.' },
            { stage: 'health', logType: 'HEALTH',
              instances: grp('v2', F('v2', 'healthy', 4)),
              traffic: { v1: 0, v2: 100 },
              descKey: K + 'success.3',
              desc: 'The fleet is healthy on v2 — but users notice nothing, the feature is still dark.' },
            { logType: 'OBSERVE',
              descKey: K + 'success.4',
              desc: 'Deploy is done; release has not started. The flag decouples shipping code from exposing it.' },
            { stage: 'toggle', logType: 'FLAG',
              flag: { state: 'on', pct: 1 },
              descKey: K + 'success.5',
              desc: 'Turn the flag ON for 1% of users — the first real exposure of the new feature.' },
            { logType: 'DB',
              services: { db: { io: 'rw', pulse: 'write', status: 'warn' } },
              descKey: K + 'success.6',
              desc: 'Flagged users exercise the new code path, which writes the new columns.' },
            { logType: 'CACHE',
              services: { cache: { keys: 'v2 + feature', io: 'read', pulse: 'read', status: 'ok' } },
              descKey: K + 'success.7',
              desc: 'The new path uses its own cache keys, so the 99% of flag-off users are unaffected.' },
            { stage: 'observe', logType: 'OBSERVE',
              descKey: K + 'success.8',
              desc: 'Watch metrics for the 1% — error rate and latency look fine.' },
            { logType: 'FLAG',
              flag: { state: 'on', pct: 10 },
              services: { queue: { consumers: 'v2 &times;4', io: 'consume', pulse: 'consume', status: 'ok' } },
              descKey: K + 'success.9',
              desc: 'Ramp the flag to 10%. The new path emits new Kafka events, which consumers already understand.' },
            { logType: 'FLAG',
              flag: { state: 'on', pct: 50 },
              services: { search: { index: 'idx_v2', io: 'write', pulse: 'write', status: 'ok' } },
              descKey: K + 'success.10',
              desc: 'Ramp to 50% — the feature writes searchable documents into Elasticsearch.' },
            { logType: 'FLAG',
              flag: { state: 'on', pct: 100 },
              descKey: K + 'success.11',
              desc: 'Ramp the flag to 100% — the feature is fully released, with no redeploy at any point.' },
            { stage: 'migrate-contract', logType: 'MIGRATE',
              services: { db: { schema: 'orders <b>v2</b>', migration: 'contract: DROP old columns', io: 'write', pulse: 'write', status: 'ok' } },
              descKey: K + 'success.12',
              desc: 'After the flag has held at 100% and proven stable, run the contract migration.' },
            { stage: 'done', logType: 'DONE',
              descKey: K + 'success.13',
              desc: 'Feature Toggle complete — deploy and release stayed separate, and the rollout used zero redeploys.' }
        ];
    }

    /* ----- Migration failure ----- */
    function migrationFailSteps() {
        return [
            { stage: 'build', logType: 'PIPELINE', descKey: K + 'migration-fail.0',
              desc: 'CI builds v2 with the new feature behind an OFF flag.' },
            { stage: 'migrate-expand', logType: 'MIGRATE',
              services: { db: { migration: 'ADD COLUMN running&hellip;', io: 'lock', pulse: 'lock', status: 'warn' } },
              descKey: K + 'migration-fail.1',
              desc: 'Run the expand migration that the new feature depends on.' },
            { stageFail: 'migrate-expand', logType: 'FAIL',
              services: { db: { migration: 'FAILED &#x2715; (disk full)', io: 'error', pulse: 'error', status: 'err' } },
              descKey: K + 'migration-fail.2',
              desc: 'The migration fails — the database volume runs out of disk space mid-statement.' },
            { logType: 'FAIL',
              descKey: K + 'migration-fail.3',
              desc: 'The pipeline stops here. The flag is still OFF and v2 was never shipped to the fleet.' },
            { logType: 'TRAFFIC',
              descKey: K + 'migration-fail.4',
              desc: 'Users are entirely unaffected — they run v1, and the feature does not exist for anyone.' },
            { rollback: true, logType: 'ROLLBACK',
              services: { db: { migration: 'rolled back &#x2713;', schema: 'orders <b>v1</b>', io: 'idle', status: 'ok' } },
              descKey: K + 'migration-fail.5',
              desc: 'The migration rolled back inside its transaction — the schema is a clean v1.' },
            { logType: 'OBSERVE',
              descKey: K + 'migration-fail.6',
              desc: 'Free up disk, fix the migration, retry. Even after a retry, the feature stays OFF until you choose.' },
            { logType: 'OBSERVE',
              descKey: K + 'migration-fail.7',
              desc: 'Lesson: with the migration gated before deploy and the flag OFF, a migration failure exposes nothing.' }
        ];
    }

    /* ----- Application failure ----- */
    function appFailSteps() {
        return [
            { stage: 'build', logType: 'PIPELINE', descKey: K + 'app-fail.0',
              desc: 'CI builds v2 with the new feature behind an OFF flag.' },
            { stage: 'migrate-expand', logType: 'MIGRATE',
              services: { db: { schema: 'orders <b>v1</b> (+feature cols)', migration: 'expand: ADD COLUMN (nullable)', io: 'write', pulse: 'write', status: 'ok' } },
              descKey: K + 'app-fail.1',
              desc: 'Run the additive expand migration — it succeeds.' },
            { stage: 'deploy', logType: 'DEPLOY',
              instances: grp('v2', F('v2', 'starting', 4)),
              flag: { state: 'off', pct: 0 },
              descKey: K + 'app-fail.2',
              desc: 'Deploy v2 to the whole fleet with the flag OFF.' },
            { stage: 'health', logType: 'HEALTH',
              instances: grp('v2', F('v2', 'healthy', 4)),
              traffic: { v1: 0, v2: 100 },
              descKey: K + 'app-fail.3',
              desc: 'v2 is deployed and healthy — the feature is still dark for everyone.' },
            { stage: 'toggle', logType: 'FLAG',
              flag: { state: 'on', pct: 10 },
              descKey: K + 'app-fail.4',
              desc: 'Turn the flag ON for 10% of users.' },
            { stage: 'observe', stageFail: 'observe', logType: 'FAIL', addErrors: 280,
              services: { db: { io: 'error', pulse: 'error', status: 'warn' } },
              descKey: K + 'app-fail.5',
              desc: 'Within minutes the new code path throws errors for flagged users — an unhandled edge case.' },
            { logType: 'OBSERVE',
              descKey: K + 'app-fail.6',
              desc: 'Only the 10% with the flag on are hit — and the app itself is fine, just the new path is broken.' },
            { rollback: true, logType: 'FLAG',
              flag: { state: 'off', pct: 0 },
              descKey: K + 'app-fail.7',
              desc: 'Flip the flag OFF. No deploy, no restart — the fix takes effect within seconds.' },
            { logType: 'DB',
              services: { db: { io: 'idle', status: 'ok' } },
              descKey: K + 'app-fail.8',
              desc: 'Errors stop immediately — every user is back on the safe v1 code path, while v2 stays deployed.' },
            { logType: 'DB',
              services: { db: { migration: 'expand cols kept (harmless)', status: 'ok' } },
              descKey: K + 'app-fail.9',
              desc: 'The expand columns and the deployed v2 build all stay in place — only the flag changed.' },
            { logType: 'OBSERVE',
              descKey: K + 'app-fail.10',
              desc: 'Lesson: a feature flag is the fastest rollback there is — a config change, not a redeploy.' }
        ];
    }

    DV['feature-toggle'].success = DV.mkMode(init, successSteps, 'dv.feature-toggle.mode.success.start');
    DV['feature-toggle']['migration-fail'] = DV.mkMode(init, migrationFailSteps, 'dv.feature-toggle.mode.migration-fail.start');
    DV['feature-toggle']['app-fail'] = DV.mkMode(init, appFailSteps, 'dv.feature-toggle.mode.app-fail.start');
})();
