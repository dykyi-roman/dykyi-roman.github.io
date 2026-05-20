/* ===== Rolling Deployment ===== */

DV['rolling'] = {};

DV['rolling'].modes = [
    { id: 'success' },
    { id: 'migration-fail' },
    { id: 'app-fail' }
];

DV['rolling'].properties = [
    { nameKey: 'dv.prop.downtime',  valueKey: 'dv.rolling.prop.downtime',  type: 'good' },
    { nameKey: 'dv.prop.rollback',  valueKey: 'dv.rolling.prop.rollback',  type: 'info' },
    { nameKey: 'dv.prop.cost',      valueKey: 'dv.rolling.prop.cost',      type: 'good' },
    { nameKey: 'dv.prop.risk',      valueKey: 'dv.rolling.prop.risk',      type: 'info' },
    { nameKey: 'dv.prop.migration', valueKey: 'dv.rolling.prop.migration', type: 'info' }
];

(function() {
    function board() {
        return {
            stages: ['build', 'migrate-expand', 'deploy', 'health', 'traffic', 'migrate-contract', 'done'],
            groups: [{ labelKey: 'dv.group.fleet', version: 'v1', instances: DV.fleet('v1', 'healthy', 4) }],
            router: { v1: 100, v2: 0 },
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
    function mix(arr) {
        return [{ labelKey: 'dv.group.fleet', version: 'v2', instances: arr }];
    }
    var I = function(v, h) { return { v: v, h: h }; };
    var K = 'dv.s.rolling.';

    /* ----- Success ----- */
    function successSteps() {
        return [
            { stage: 'build', logType: 'PIPELINE', descKey: K + 'success.0',
              desc: 'CI builds v2 and runs the test suite.' },
            { stage: 'migrate-expand', logType: 'MIGRATE',
              services: { db: { schema: 'orders <b>v1</b> (+v2 cols)', migration: 'expand: ADD COLUMN (nullable)', io: 'write', pulse: 'write', status: 'ok' } },
              descKey: K + 'success.1',
              desc: 'Run the expand migration first: add new nullable columns. It is backward-compatible — v1 ignores them.' },
            { stage: 'deploy', logType: 'DEPLOY',
              descKey: K + 'success.2',
              desc: 'Start the rolling deploy — replace instances one batch at a time, never all at once.' },
            { logType: 'DEPLOY',
              instances: mix([I('v2', 'starting'), I('v2', 'starting'), I('v1', 'healthy'), I('v1', 'healthy')]),
              descKey: K + 'success.3',
              desc: 'Take batch 1 out of the load balancer, drain its in-flight requests, and start it on v2.' },
            { stage: 'health', logType: 'HEALTH',
              instances: mix([I('v2', 'healthy'), I('v2', 'healthy'), I('v1', 'healthy'), I('v1', 'healthy')]),
              traffic: { v1: 50, v2: 50 },
              descKey: K + 'success.4',
              desc: 'Batch 1 passes readiness and rejoins the pool — now v1 and v2 serve users side by side.' },
            { stage: 'traffic', logType: 'DB',
              services: { db: { io: 'rw', pulse: 'write', status: 'warn' } },
              descKey: K + 'success.5',
              desc: 'Both versions read and write PostgreSQL at once — exactly why the migration had to be additive.' },
            { logType: 'QUEUE',
              services: { queue: { consumers: 'v1 + v2', io: 'consume', pulse: 'consume', status: 'warn' } },
              descKey: K + 'success.6',
              desc: 'The Kafka consumer group now mixes v1 and v2 consumers — message payloads must stay compatible.' },
            { logType: 'CACHE',
              services: { cache: { keys: 'v1 + v2', state: 'mixed', io: 'read', pulse: 'read', status: 'warn' } },
              descKey: K + 'success.7',
              desc: 'v2 writes version-namespaced cache keys so it never reads v1-shaped data, and vice versa.' },
            { logType: 'SEARCH',
              services: { search: { reindex: '70%', io: 'reindex', pulse: 'reindex', status: 'warn' } },
              descKey: K + 'success.8',
              desc: 'v2 dual-writes documents to Elasticsearch while a background reindex builds idx_v2.' },
            { logType: 'DEPLOY',
              instances: mix([I('v2', 'healthy'), I('v2', 'healthy'), I('v2', 'starting'), I('v2', 'starting')]),
              descKey: K + 'success.9',
              desc: 'Replace batch 2 the same way — drain, restart on v2, wait for readiness.' },
            { logType: 'HEALTH',
              instances: mix([I('v2', 'healthy'), I('v2', 'healthy'), I('v2', 'healthy'), I('v2', 'healthy')]),
              traffic: { v1: 0, v2: 100 },
              descKey: K + 'success.10',
              desc: 'Batch 2 is healthy — the whole fleet now runs v2 with zero downtime at any point.' },
            { logType: 'SEARCH',
              services: { queue: { consumers: 'v2 &times;4', status: 'ok' }, search: { index: 'idx_v2', reindex: '100% &#x2713;', status: 'ok', io: 'idle' }, cache: { keys: 'v2', state: 'warm', status: 'ok' } },
              descKey: K + 'success.11',
              desc: 'All consumers are v2, the search alias swaps to idx_v2, and the cache settles on v2 keys.' },
            { stage: 'migrate-contract', logType: 'MIGRATE',
              services: { db: { schema: 'orders <b>v2</b>', migration: 'contract: DROP old columns', io: 'write', pulse: 'write', status: 'ok' } },
              descKey: K + 'success.12',
              desc: 'No v1 code is left — run the contract migration to drop the old columns and finish the change.' },
            { stage: 'done', logType: 'DONE',
              descKey: K + 'success.13',
              desc: 'Rolling deploy complete — zero downtime, gradual, and no extra servers needed.' }
        ];
    }

    /* ----- Migration failure ----- */
    function migrationFailSteps() {
        return [
            { stage: 'build', logType: 'PIPELINE', descKey: K + 'migration-fail.0',
              desc: 'CI builds v2; tests pass.' },
            { stage: 'migrate-expand', logType: 'MIGRATE',
              services: { db: { migration: 'RENAME COLUMN&hellip;', io: 'lock', pulse: 'lock', status: 'warn', schema: 'orders v1 &#x2192; v2 (breaking)' } },
              descKey: K + 'migration-fail.1',
              desc: 'Mistake: instead of an additive expand migration, a destructive RENAME is run while v1 is still live.' },
            { logType: 'DB',
              services: { db: { schema: 'orders v2', migration: 'breaking change applied', io: 'error', pulse: 'error', status: 'err' } },
              descKey: K + 'migration-fail.2',
              desc: 'The migration succeeds — but the columns the running v1 code reads no longer exist.' },
            { stageFail: 'deploy', logType: 'FAIL', addErrors: 4200,
              instances: grp('v1', DV.fleet('v1', 'unhealthy', 4)),
              services: { queue: { status: 'err', io: 'error', pulse: 'error' }, cache: { status: 'warn' } },
              descKey: K + 'migration-fail.3',
              desc: 'Every live v1 instance breaks instantly — its SQL references missing columns. v2 is not even deployed yet.' },
            { logType: 'FAIL', addErrors: 5100,
              descKey: K + 'migration-fail.4',
              desc: 'Users get 500s across the whole site — the destructive migration took down the live fleet.' },
            { rollback: true, logType: 'ROLLBACK',
              services: { db: { migration: 'restoring backup&hellip;', io: 'write', pulse: 'write', status: 'warn' } },
              descKey: K + 'migration-fail.5',
              desc: 'Restore PostgreSQL from backup to bring the v1 schema back.' },
            { logType: 'DB',
              instances: grp('v1', DV.fleet('v1', 'starting', 4)),
              services: { db: { schema: 'orders <b>v1</b>', migration: 'restored &#x2713;', io: 'idle', status: 'ok' } },
              descKey: K + 'migration-fail.6',
              desc: 'Schema restored to v1; the crashed instances restart.' },
            { logType: 'HEALTH',
              instances: grp('v1', DV.fleet('v1', 'healthy', 4)),
              traffic: { v1: 100, v2: 0 },
              services: { queue: { consumers: 'v1 &times;4', status: 'ok', io: 'idle' }, cache: { status: 'ok' } },
              descKey: K + 'migration-fail.7',
              desc: 'v1 recovers — but only after a partial outage and thousands of failed requests.' },
            { logType: 'OBSERVE',
              descKey: K + 'migration-fail.8',
              desc: 'Lesson: rolling deploys run old and new code together — migrations must be expand-only. A destructive change breaks the live fleet.' }
        ];
    }

    /* ----- Application failure ----- */
    function appFailSteps() {
        return [
            { stage: 'build', logType: 'PIPELINE', descKey: K + 'app-fail.0',
              desc: 'CI builds v2; tests pass.' },
            { stage: 'migrate-expand', logType: 'MIGRATE',
              services: { db: { schema: 'orders <b>v1</b> (+v2 cols)', migration: 'expand: ADD COLUMN (nullable)', io: 'write', pulse: 'write', status: 'ok' } },
              descKey: K + 'app-fail.1',
              desc: 'Run the additive expand migration — backward-compatible, so the half-deployed state stays safe.' },
            { stage: 'deploy', logType: 'DEPLOY',
              descKey: K + 'app-fail.2',
              desc: 'Begin the rolling deploy, batch by batch.' },
            { logType: 'DEPLOY',
              instances: mix([I('v2', 'starting'), I('v2', 'starting'), I('v1', 'healthy'), I('v1', 'healthy')]),
              descKey: K + 'app-fail.3',
              desc: 'Drain batch 1 and start it on v2.' },
            { stage: 'health', stageFail: 'health', logType: 'FAIL', addErrors: 0,
              instances: mix([I('v2', 'unhealthy'), I('v2', 'unhealthy'), I('v1', 'healthy'), I('v1', 'healthy')]),
              descKey: K + 'app-fail.4',
              desc: 'The new v2 instances fail readiness — a missing env var. They never enter the load balancer.' },
            { logType: 'OBSERVE',
              services: { cache: { status: 'warn' } },
              descKey: K + 'app-fail.5',
              desc: 'The orchestrator halts the rollout automatically: it will not drain more v1 while the new batch is unhealthy.' },
            { logType: 'TRAFFIC',
              descKey: K + 'app-fail.6',
              desc: 'No user ever reached v2 — unhealthy instances get no traffic — but capacity is down 50%.' },
            { rollback: true, logType: 'ROLLBACK',
              instances: mix([I('v1', 'starting'), I('v1', 'starting'), I('v1', 'healthy'), I('v1', 'healthy')]),
              descKey: K + 'app-fail.7',
              desc: 'Roll back only the failed batch — redeploy v1 onto those two instances.' },
            { logType: 'HEALTH',
              instances: grp('v1', DV.fleet('v1', 'healthy', 4)),
              traffic: { v1: 100, v2: 0 },
              services: { cache: { status: 'ok' } },
              descKey: K + 'app-fail.8',
              desc: 'All four instances are healthy v1 again — full capacity restored, no data lost.' },
            { logType: 'DB',
              services: { db: { migration: 'expand cols kept (harmless)', status: 'ok' } },
              descKey: K + 'app-fail.9',
              desc: 'The expand columns stay in place — nullable and harmless — ready for the next attempt.' },
            { logType: 'OBSERVE',
              descKey: K + 'app-fail.10',
              desc: 'Lesson: rolling deploys fail safely — a bad batch halts the rollout and only that batch is rolled back.' }
        ];
    }

    DV['rolling'].success = DV.mkMode(init, successSteps, 'dv.rolling.mode.success.start');
    DV['rolling']['migration-fail'] = DV.mkMode(init, migrationFailSteps, 'dv.rolling.mode.migration-fail.start');
    DV['rolling']['app-fail'] = DV.mkMode(init, appFailSteps, 'dv.rolling.mode.app-fail.start');
})();
