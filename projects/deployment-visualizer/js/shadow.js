/* ===== Shadow Deployment ===== */

DV['shadow'] = {};

DV['shadow'].modes = [
    { id: 'success' },
    { id: 'migration-fail' },
    { id: 'app-fail' }
];

DV['shadow'].properties = [
    { nameKey: 'dv.prop.downtime',  valueKey: 'dv.shadow.prop.downtime',  type: 'good' },
    { nameKey: 'dv.prop.rollback',  valueKey: 'dv.shadow.prop.rollback',  type: 'good' },
    { nameKey: 'dv.prop.cost',      valueKey: 'dv.shadow.prop.cost',      type: 'bad' },
    { nameKey: 'dv.prop.risk',      valueKey: 'dv.shadow.prop.risk',      type: 'good' },
    { nameKey: 'dv.prop.migration', valueKey: 'dv.shadow.prop.migration', type: 'info' }
];

(function() {
    function board() {
        return {
            stages: ['build', 'migrate-expand', 'deploy', 'mirror', 'observe', 'promote', 'done'],
            groups: sh(DV.fleet('v1', 'healthy', 4), []),
            router: { v1: 100, v2: 0 },
            services: {
                db: { schema: 'prod <b>v1</b>', migration: '&mdash;', io: 'idle', status: 'idle' },
                cache: { keys: 'v1', state: 'warm', io: 'idle', status: 'idle' },
                queue: { consumers: 'v1 &times;4', messages: '0', io: 'idle', status: 'idle' },
                search: { index: 'idx_v1', reindex: '&mdash;', io: 'idle', status: 'idle' }
            }
        };
    }
    function init() { DV.renderBoard(board()); }
    function sh(live, shadow) {
        return [
            { labelKey: 'dv.group.live', version: 'v1', instances: live },
            { labelKey: 'dv.group.shadow', version: 'v2', instances: shadow }
        ];
    }
    var F = DV.fleet;
    var K = 'dv.s.shadow.';

    /* ----- Success ----- */
    function successSteps() {
        return [
            { stage: 'build', logType: 'PIPELINE', descKey: K + 'success.0',
              desc: 'CI builds v2 so it can be tested against real production traffic — safely.' },
            { stage: 'migrate-expand', logType: 'MIGRATE',
              services: { db: { schema: 'prod <b>v1</b> &middot; clone v2', migration: 'expand applied on DB clone', io: 'write', pulse: 'write', status: 'ok' } },
              descKey: K + 'success.1',
              desc: 'Provision a shadow database (a clone) and run the v2 migration there — production’s schema is untouched.' },
            { stage: 'deploy', logType: 'DEPLOY',
              instances: sh(F('v1', 'healthy', 4), F('v2', 'starting', 2)),
              descKey: K + 'success.2',
              desc: 'Deploy v2 as a separate shadow fleet, wired to the cloned data stores — not to production’s.' },
            { logType: 'HEALTH',
              instances: sh(F('v1', 'healthy', 4), F('v2', 'healthy', 2)),
              descKey: K + 'success.3',
              desc: 'The shadow fleet boots and passes health checks — it serves no real users.' },
            { stage: 'mirror', logType: 'TRAFFIC', traffic: { v1: 100, v2: 0, mirror: true },
              descKey: K + 'success.4',
              desc: 'Start mirroring: the router sends every live request to v1 and a copy of it to the shadow fleet.' },
            { logType: 'TRAFFIC',
              descKey: K + 'success.5',
              desc: 'Users only ever get v1’s response — the shadow fleet computes its answer and then discards it.' },
            { logType: 'DB',
              services: { db: { io: 'read', pulse: 'read', status: 'ok' } },
              descKey: K + 'success.6',
              desc: 'v2 reads production data read-only for realism — but its writes go to the DB clone, never to prod.' },
            { logType: 'CACHE',
              services: { cache: { keys: 'v1 &middot; shadow ns', io: 'read', pulse: 'read', status: 'ok' } },
              descKey: K + 'success.7',
              desc: 'The shadow fleet uses its own cache namespace so it cannot evict or poison production’s cache.' },
            { logType: 'QUEUE',
              services: { queue: { consumers: 'v1 &times;4 &middot; shadow &times;2', io: 'consume', pulse: 'consume', status: 'warn' } },
              descKey: K + 'success.8',
              desc: 'Shadow consumers read mirrored messages but never commit offsets or trigger real side effects.' },
            { logType: 'SEARCH',
              services: { search: { index: 'idx_v1 &middot; shadow idx', io: 'write', pulse: 'write', status: 'ok' } },
              descKey: K + 'success.9',
              desc: 'v2 indexes documents into a shadow Elasticsearch index — production search is unaffected.' },
            { stage: 'observe', logType: 'OBSERVE',
              descKey: K + 'success.10',
              desc: 'Compare v2 to v1 under real load — latency, error rate, response diffs. v2 holds up well.' },
            { stage: 'promote', logType: 'TRAFFIC', traffic: { v1: 100, v2: 0, mirror: false },
              instances: sh(F('v1', 'healthy', 4), F('v2', 'stopped', 2)),
              services: { queue: { consumers: 'v1 &times;4', status: 'ok', io: 'idle' } },
              descKey: K + 'success.11',
              desc: 'Shadow testing passed — promote v2 with a real strategy (Canary or Blue-Green) and tear down the shadow fleet.' },
            { stage: 'done', logType: 'DONE',
              descKey: K + 'success.12',
              desc: 'Shadow complete — v2 was validated against real production traffic with zero risk to users.' }
        ];
    }

    /* ----- Migration failure ----- */
    function migrationFailSteps() {
        return [
            { stage: 'build', logType: 'PIPELINE', descKey: K + 'migration-fail.0',
              desc: 'CI builds v2 for a shadow test run.' },
            { stage: 'migrate-expand', logType: 'MIGRATE',
              services: { db: { schema: 'prod <b>v1</b> &middot; clone&hellip;', migration: 'expand running on DB clone&hellip;', io: 'lock', pulse: 'lock', status: 'warn' } },
              descKey: K + 'migration-fail.1',
              desc: 'Run the v2 migration on the shadow database clone.' },
            { stageFail: 'migrate-expand', logType: 'FAIL',
              services: { db: { schema: 'prod <b>v1</b> OK &middot; clone failed', migration: 'FAILED &#x2715; on clone', io: 'error', pulse: 'error', status: 'err' } },
              descKey: K + 'migration-fail.2',
              desc: 'The migration fails on the clone — the snapshot was stale and a constraint now conflicts.' },
            { logType: 'FAIL',
              instances: sh(F('v1', 'healthy', 4), []),
              descKey: K + 'migration-fail.3',
              desc: 'The shadow fleet cannot start — but this is the shadow environment. Production’s database was never touched.' },
            { logType: 'TRAFFIC',
              descKey: K + 'migration-fail.4',
              desc: 'Not a single user is affected — mirroring never even started.' },
            { rollback: true, logType: 'ROLLBACK',
              services: { db: { schema: 'prod <b>v1</b>', migration: 'broken clone discarded', io: 'idle', status: 'ok' } },
              descKey: K + 'migration-fail.5',
              desc: 'Simply discard the broken clone — there is nothing to restore, production was never involved.' },
            { logType: 'OBSERVE',
              descKey: K + 'migration-fail.6',
              desc: 'Take a fresh snapshot of production, fix the migration, and retry the shadow run.' },
            { logType: 'OBSERVE',
              descKey: K + 'migration-fail.7',
              desc: 'Lesson: Shadow runs in a fully isolated environment — even a failed migration there has zero production impact.' }
        ];
    }

    /* ----- Application failure ----- */
    function appFailSteps() {
        return [
            { stage: 'build', logType: 'PIPELINE', descKey: K + 'app-fail.0',
              desc: 'CI builds v2 for a shadow test run.' },
            { stage: 'migrate-expand', logType: 'MIGRATE',
              services: { db: { schema: 'prod <b>v1</b> &middot; clone v2', migration: 'expand applied on DB clone', io: 'write', pulse: 'write', status: 'ok' } },
              descKey: K + 'app-fail.1',
              desc: 'Run the v2 migration on the database clone — it succeeds.' },
            { stage: 'deploy', logType: 'DEPLOY',
              instances: sh(F('v1', 'healthy', 4), F('v2', 'starting', 2)),
              descKey: K + 'app-fail.2',
              desc: 'Deploy v2 as an isolated shadow fleet.' },
            { logType: 'HEALTH',
              instances: sh(F('v1', 'healthy', 4), F('v2', 'healthy', 2)),
              descKey: K + 'app-fail.3',
              desc: 'The shadow fleet boots and passes its health checks.' },
            { stage: 'mirror', logType: 'TRAFFIC', traffic: { v1: 100, v2: 0, mirror: true },
              descKey: K + 'app-fail.4',
              desc: 'Start mirroring live production traffic to the shadow fleet.' },
            { stage: 'observe', logType: 'OBSERVE',
              services: { db: { io: 'read', pulse: 'read', status: 'ok' } },
              descKey: K + 'app-fail.5',
              desc: 'Compare v2 against v1 on the mirrored request stream.' },
            { stageFail: 'observe', logType: 'FAIL',
              instances: sh(F('v1', 'healthy', 4), F('v2', 'unhealthy', 2)),
              descKey: K + 'app-fail.6',
              desc: 'v2 throws exceptions on 8% of mirrored requests — a request shape production sees that tests missed.' },
            { logType: 'TRAFFIC',
              descKey: K + 'app-fail.7',
              desc: 'Those errors happened only on shadow traffic — users got v1’s correct responses the whole time.' },
            { rollback: true, logType: 'ROLLBACK', traffic: { v1: 100, v2: 0, mirror: false },
              instances: sh(F('v1', 'healthy', 4), F('v2', 'stopped', 2)),
              descKey: K + 'app-fail.8',
              desc: 'Stop mirroring and tear down the shadow fleet — there is nothing to roll back on the live side.' },
            { logType: 'OBSERVE',
              descKey: K + 'app-fail.9',
              desc: 'Fix the bug, rebuild, and run the shadow test again before attempting any real rollout.' },
            { logType: 'OBSERVE',
              descKey: K + 'app-fail.10',
              desc: 'Lesson: Shadow surfaces real-world bugs before users are ever exposed — the safest pre-release test.' }
        ];
    }

    DV['shadow'].success = DV.mkMode(init, successSteps, 'dv.shadow.mode.success.start');
    DV['shadow']['migration-fail'] = DV.mkMode(init, migrationFailSteps, 'dv.shadow.mode.migration-fail.start');
    DV['shadow']['app-fail'] = DV.mkMode(init, appFailSteps, 'dv.shadow.mode.app-fail.start');
})();
