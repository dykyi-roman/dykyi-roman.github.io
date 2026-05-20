/* ===== Blue-Green Deployment ===== */

DV['blue-green'] = {};

DV['blue-green'].modes = [
    { id: 'success' },
    { id: 'migration-fail' },
    { id: 'app-fail' }
];

DV['blue-green'].properties = [
    { nameKey: 'dv.prop.downtime',  valueKey: 'dv.blue-green.prop.downtime',  type: 'good' },
    { nameKey: 'dv.prop.rollback',  valueKey: 'dv.blue-green.prop.rollback',  type: 'good' },
    { nameKey: 'dv.prop.cost',      valueKey: 'dv.blue-green.prop.cost',      type: 'bad' },
    { nameKey: 'dv.prop.risk',      valueKey: 'dv.blue-green.prop.risk',      type: 'good' },
    { nameKey: 'dv.prop.migration', valueKey: 'dv.blue-green.prop.migration', type: 'info' }
];

(function() {
    function board() {
        return {
            stages: ['build', 'migrate-expand', 'deploy', 'smoke', 'traffic', 'verify', 'migrate-contract', 'done'],
            groups: bg(DV.fleet('v1', 'healthy', 4), DV.fleet('v2', 'idle', 4)),
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
    function bg(blueInst, greenInst, blueDim, greenDim) {
        return [
            { labelKey: 'dv.group.blue', version: 'v1', instances: blueInst, dim: !!blueDim },
            { labelKey: 'dv.group.green', version: 'v2', instances: greenInst, dim: !!greenDim }
        ];
    }
    var F = DV.fleet;
    var K = 'dv.s.blue-green.';

    /* ----- Success ----- */
    function successSteps() {
        return [
            { stage: 'build', logType: 'PIPELINE', descKey: K + 'success.0',
              desc: 'CI builds v2 and runs the test suite.' },
            { stage: 'migrate-expand', logType: 'MIGRATE',
              services: { db: { schema: 'orders <b>v1</b> (+v2 cols)', migration: 'expand: ADD COLUMN (nullable)', io: 'write', pulse: 'write', status: 'ok' } },
              descKey: K + 'success.1',
              desc: 'Run the expand migration on the shared database — both Blue and Green will use this schema.' },
            { stage: 'deploy', logType: 'DEPLOY',
              instances: bg(F('v1', 'healthy', 4), F('v2', 'starting', 4)),
              descKey: K + 'success.2',
              desc: 'Deploy v2 to the idle Green environment. Blue keeps serving 100% of users.' },
            { logType: 'HEALTH',
              instances: bg(F('v1', 'healthy', 4), F('v2', 'healthy', 4)),
              descKey: K + 'success.3',
              desc: 'Green boots and passes its internal health checks — still receiving no user traffic.' },
            { stage: 'smoke', logType: 'HEALTH',
              descKey: K + 'success.4',
              desc: 'Run smoke tests against Green: real requests hit the v2 fleet directly.' },
            { logType: 'DB',
              services: { db: { io: 'rw', pulse: 'read', status: 'ok' } },
              descKey: K + 'success.5',
              desc: 'Green’s smoke tests read and write the shared PostgreSQL — safe, the schema fits both versions.' },
            { logType: 'CACHE',
              services: { cache: { keys: 'v1 + v2', io: 'read', pulse: 'read', status: 'warn' } },
              descKey: K + 'success.6',
              desc: 'Green uses v2-namespaced cache keys, so its traffic never pollutes Blue’s cached data.' },
            { logType: 'SEARCH',
              services: { search: { index: 'idx_v1 live / idx_v2 ready', reindex: '100% &#x2713;', io: 'reindex', pulse: 'reindex', status: 'warn' } },
              descKey: K + 'success.7',
              desc: 'A separate idx_v2 index is reindexed and kept ready; the live alias still points at idx_v1.' },
            { logType: 'HEALTH',
              descKey: K + 'success.8',
              desc: 'Smoke tests pass — Green is verified and ready to take production traffic.' },
            { stage: 'traffic', logType: 'TRAFFIC', traffic: { v1: 0, v2: 100 },
              instances: bg(F('v1', 'healthy', 4), F('v2', 'healthy', 4), true, false),
              descKey: K + 'success.9',
              desc: 'Flip the router from Blue to Green in one atomic switch — every user moves to v2 instantly.' },
            { logType: 'SEARCH',
              services: { search: { index: 'idx_v2', status: 'ok', io: 'idle' }, queue: { consumers: 'v2 &times;4', status: 'ok' }, cache: { keys: 'v2', status: 'ok' } },
              descKey: K + 'success.10',
              desc: 'Swap the search alias to idx_v2 and cut the Kafka consumers over to v2.' },
            { stage: 'verify', logType: 'OBSERVE',
              descKey: K + 'success.11',
              desc: 'Verify Green in production. Blue stays untouched — it is your instant rollback for a few minutes.' },
            { stage: 'migrate-contract', logType: 'MIGRATE',
              instances: bg(F('v1', 'stopped', 4), F('v2', 'healthy', 4), true, false),
              services: { db: { schema: 'orders <b>v2</b>', migration: 'contract: DROP old columns', io: 'write', pulse: 'write', status: 'ok' } },
              descKey: K + 'success.12',
              desc: 'Once Green is trusted, retire Blue and run the contract migration to drop the old columns.' },
            { stage: 'done', logType: 'DONE',
              descKey: K + 'success.13',
              desc: 'Blue-Green complete — zero downtime and an instant, atomic switch, at the cost of a second fleet.' }
        ];
    }

    /* ----- Migration failure ----- */
    function migrationFailSteps() {
        return [
            { stage: 'build', logType: 'PIPELINE', descKey: K + 'migration-fail.0',
              desc: 'CI builds v2; tests pass.' },
            { stage: 'migrate-expand', logType: 'MIGRATE',
              services: { db: { migration: 'ADD COLUMN running&hellip;', io: 'lock', pulse: 'lock', status: 'warn' } },
              descKey: K + 'migration-fail.1',
              desc: 'Run the expand migration on the shared database before touching Green.' },
            { stageFail: 'migrate-expand', logType: 'FAIL',
              services: { db: { migration: 'FAILED &#x2715; (lock timeout)', io: 'error', pulse: 'error', status: 'err' } },
              descKey: K + 'migration-fail.2',
              desc: 'The migration fails — a long-held row lock times out and the statement aborts.' },
            { logType: 'FAIL',
              instances: bg(F('v1', 'healthy', 4), F('v2', 'idle', 4)),
              descKey: K + 'migration-fail.3',
              desc: 'Green cannot be deployed: its v2 code needs the new columns. The pipeline stops at the migration.' },
            { logType: 'TRAFFIC',
              descKey: K + 'migration-fail.4',
              desc: 'Crucially, Blue was never touched — it kept serving 100% of users. Zero customer impact.' },
            { rollback: true, logType: 'ROLLBACK',
              services: { db: { migration: 'rolled back &#x2713;', schema: 'orders <b>v1</b>', io: 'idle', status: 'ok' } },
              descKey: K + 'migration-fail.5',
              desc: 'The migration rolled itself back in its own transaction — the schema is still a consistent v1.' },
            { logType: 'OBSERVE',
              descKey: K + 'migration-fail.6',
              desc: 'Fix the migration (split it, build the index CONCURRENTLY) and retry — Blue runs the whole time.' },
            { logType: 'OBSERVE',
              descKey: K + 'migration-fail.7',
              desc: 'Lesson: with Blue-Green a migration failure before the switch is a non-event — Blue absorbs everything.' }
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
              desc: 'Run the additive expand migration on the shared database — it succeeds.' },
            { stage: 'deploy', logType: 'DEPLOY',
              instances: bg(F('v1', 'healthy', 4), F('v2', 'starting', 4)),
              descKey: K + 'app-fail.2',
              desc: 'Deploy v2 to Green. Blue still serves every user.' },
            { logType: 'HEALTH',
              instances: bg(F('v1', 'healthy', 4), F('v2', 'healthy', 4)),
              descKey: K + 'app-fail.3',
              desc: 'Green’s processes start and the basic health checks pass.' },
            { stage: 'smoke', logType: 'HEALTH',
              services: { db: { io: 'rw', pulse: 'read' } },
              descKey: K + 'app-fail.4',
              desc: 'Run the smoke-test suite against Green before flipping any traffic.' },
            { stageFail: 'smoke', logType: 'FAIL',
              instances: bg(F('v1', 'healthy', 4), F('v2', 'unhealthy', 4)),
              descKey: K + 'app-fail.5',
              desc: 'Smoke tests fail — v2 returns wrong order totals at checkout. A logic bug slipped through.' },
            { logType: 'TRAFFIC',
              descKey: K + 'app-fail.6',
              desc: 'The router was never flipped — not one real user reached Green. Blue is still serving 100%.' },
            { rollback: true, logType: 'ROLLBACK',
              instances: bg(F('v1', 'healthy', 4), F('v2', 'stopped', 4)),
              descKey: K + 'app-fail.7',
              desc: 'Tear down the broken Green environment. No live rollback needed — Blue never moved.' },
            { logType: 'DB',
              services: { db: { migration: 'expand cols kept (harmless)', status: 'ok' } },
              descKey: K + 'app-fail.8',
              desc: 'The expand columns stay in the shared database — nullable and harmless — ready for the fixed v2.' },
            { logType: 'OBSERVE',
              descKey: K + 'app-fail.9',
              desc: 'Lesson: Blue-Green catches a bad release in Green, before the switch, with zero user impact.' }
        ];
    }

    DV['blue-green'].success = DV.mkMode(init, successSteps, 'dv.blue-green.mode.success.start');
    DV['blue-green']['migration-fail'] = DV.mkMode(init, migrationFailSteps, 'dv.blue-green.mode.migration-fail.start');
    DV['blue-green']['app-fail'] = DV.mkMode(init, appFailSteps, 'dv.blue-green.mode.app-fail.start');
})();
