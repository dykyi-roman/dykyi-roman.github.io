/* ===== Canary Deployment ===== */

DV['canary'] = {};

DV['canary'].modes = [
    { id: 'success' },
    { id: 'migration-fail' },
    { id: 'app-fail' }
];

DV['canary'].properties = [
    { nameKey: 'dv.prop.downtime',  valueKey: 'dv.canary.prop.downtime',  type: 'good' },
    { nameKey: 'dv.prop.rollback',  valueKey: 'dv.canary.prop.rollback',  type: 'good' },
    { nameKey: 'dv.prop.cost',      valueKey: 'dv.canary.prop.cost',      type: 'info' },
    { nameKey: 'dv.prop.risk',      valueKey: 'dv.canary.prop.risk',      type: 'good' },
    { nameKey: 'dv.prop.migration', valueKey: 'dv.canary.prop.migration', type: 'info' }
];

(function() {
    function board() {
        return {
            stages: ['build', 'migrate-expand', 'deploy', 'health', 'traffic', 'observe', 'migrate-contract', 'done'],
            groups: cn(DV.fleet('v1', 'healthy', 4), []),
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
    function cn(stable, canary) {
        return [
            { labelKey: 'dv.group.stable', version: 'v1', instances: stable },
            { labelKey: 'dv.group.canary', version: 'v2', instances: canary }
        ];
    }
    var F = DV.fleet;
    var I = function(v, h) { return { v: v, h: h }; };
    var K = 'dv.s.canary.';

    /* ----- Success ----- */
    function successSteps() {
        return [
            { stage: 'build', logType: 'PIPELINE', descKey: K + 'success.0',
              desc: 'CI builds v2 and runs the test suite.' },
            { stage: 'migrate-expand', logType: 'MIGRATE',
              services: { db: { schema: 'orders <b>v1</b> (+v2 cols)', migration: 'expand: ADD COLUMN (nullable)', io: 'write', pulse: 'write', status: 'ok' } },
              descKey: K + 'success.1',
              desc: 'Run the backward-compatible expand migration — stable and canary will share this schema.' },
            { stage: 'deploy', logType: 'DEPLOY',
              instances: cn(F('v1', 'healthy', 4), [I('v2', 'starting')]),
              descKey: K + 'success.2',
              desc: 'Deploy a single canary instance running v2 next to the stable pool.' },
            { stage: 'health', logType: 'HEALTH',
              instances: cn(F('v1', 'healthy', 4), [I('v2', 'healthy')]),
              descKey: K + 'success.3',
              desc: 'The canary passes its readiness probe and joins the load balancer.' },
            { stage: 'traffic', logType: 'TRAFFIC', traffic: { v1: 95, v2: 5 },
              descKey: K + 'success.4',
              desc: 'Route just 5% of users to the canary — the blast radius is capped at 5%.' },
            { logType: 'DB',
              services: { db: { io: 'rw', pulse: 'write', status: 'warn' } },
              descKey: K + 'success.5',
              desc: 'The canary dual-writes — it fills both old and new columns so stable instances stay correct.' },
            { logType: 'CACHE',
              services: { cache: { keys: 'v1 + v2', io: 'miss', pulse: 'miss', status: 'warn' } },
              descKey: K + 'success.6',
              desc: 'The canary uses v2-namespaced cache keys — cold misses for now, with no clash against stable.' },
            { logType: 'QUEUE',
              services: { queue: { consumers: 'v1 &times;4 + v2 &times;1', io: 'consume', pulse: 'consume', status: 'warn' } },
              descKey: K + 'success.7',
              desc: 'The Kafka consumer group now has one v2 consumer — message payloads must stay compatible.' },
            { logType: 'SEARCH',
              services: { search: { reindex: '100% &#x2713;', io: 'reindex', pulse: 'reindex', status: 'warn' } },
              descKey: K + 'success.8',
              desc: 'v2 dual-writes documents to Elasticsearch; searches are still served by the idx_v1 alias.' },
            { stage: 'observe', logType: 'OBSERVE',
              descKey: K + 'success.9',
              desc: 'Watch the canary’s error rate and p99 latency for several minutes — the metrics look healthy.' },
            { logType: 'TRAFFIC', traffic: { v1: 75, v2: 25 },
              descKey: K + 'success.10',
              desc: 'Metrics are good — widen the canary to 25% of traffic.' },
            { logType: 'TRAFFIC', traffic: { v1: 50, v2: 50 },
              instances: cn(F('v1', 'healthy', 2), F('v2', 'healthy', 2)),
              descKey: K + 'success.11',
              desc: 'Still healthy — scale the canary pool up and shift to a 50 / 50 split.' },
            { logType: 'TRAFFIC', traffic: { v1: 0, v2: 100 },
              instances: cn([], F('v2', 'healthy', 4)),
              services: { queue: { consumers: 'v2 &times;4', status: 'ok' }, search: { index: 'idx_v2', status: 'ok', io: 'idle' }, cache: { keys: 'v2', state: 'warm', status: 'ok' } },
              descKey: K + 'success.12',
              desc: 'All metrics green — promote v2 to 100% and retire the stable v1 pool.' },
            { stage: 'migrate-contract', logType: 'MIGRATE',
              services: { db: { schema: 'orders <b>v2</b>', migration: 'contract: DROP old columns', io: 'write', pulse: 'write', status: 'ok' } },
              descKey: K + 'success.13',
              desc: 'No v1 code is left — run the contract migration to drop the old columns.' },
            { stage: 'done', logType: 'DONE',
              descKey: K + 'success.14',
              desc: 'Canary complete — zero downtime, and never more than 5% of users exposed to an untested change.' }
        ];
    }

    /* ----- Migration failure ----- */
    function migrationFailSteps() {
        return [
            { stage: 'build', logType: 'PIPELINE', descKey: K + 'migration-fail.0',
              desc: 'CI builds v2; tests pass.' },
            { stage: 'migrate-expand', logType: 'MIGRATE',
              services: { db: { migration: 'DROP COLUMN&hellip;', io: 'lock', pulse: 'lock', status: 'warn', schema: 'orders v1 &#x2192; v2 (breaking)' } },
              descKey: K + 'migration-fail.1',
              desc: 'A destructive migration is run on the shared database — a mistake instead of an additive one.' },
            { logType: 'DB',
              services: { db: { schema: 'orders v2', migration: 'breaking change applied', io: 'error', pulse: 'error', status: 'err' } },
              descKey: K + 'migration-fail.2',
              desc: 'The old columns are gone — and the stable v1 pool reads this exact same database.' },
            { stageFail: 'deploy', logType: 'FAIL', addErrors: 5000,
              instances: cn(F('v1', 'unhealthy', 4), []),
              services: { queue: { status: 'err' }, cache: { status: 'warn' } },
              descKey: K + 'migration-fail.3',
              desc: 'All four stable v1 instances break instantly — and the canary was not even deployed yet.' },
            { logType: 'FAIL', addErrors: 4100,
              descKey: K + 'migration-fail.4',
              desc: '100% of users get errors. A canary cannot contain a destructive migration — the DB is shared by all.' },
            { rollback: true, logType: 'ROLLBACK',
              services: { db: { migration: 'restoring backup&hellip;', io: 'write', pulse: 'write', status: 'warn' } },
              descKey: K + 'migration-fail.5',
              desc: 'Restore PostgreSQL from the pre-deploy backup.' },
            { logType: 'DB',
              instances: cn(F('v1', 'starting', 4), []),
              services: { db: { schema: 'orders <b>v1</b>', migration: 'restored &#x2713;', io: 'idle', status: 'ok' } },
              descKey: K + 'migration-fail.6',
              desc: 'Schema restored to v1; the stable pool restarts.' },
            { logType: 'HEALTH',
              instances: cn(F('v1', 'healthy', 4), []),
              traffic: { v1: 100, v2: 0 },
              services: { queue: { consumers: 'v1 &times;4', status: 'ok' }, cache: { status: 'ok' } },
              descKey: K + 'migration-fail.7',
              desc: 'The stable pool recovers — but only after a full-site outage.' },
            { logType: 'OBSERVE',
              descKey: K + 'migration-fail.8',
              desc: 'Lesson: Canary limits the blast radius of bad code, not of a bad shared-DB migration. Migrations must still be expand-only.' }
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
              desc: 'Run the additive expand migration — it succeeds and is safe for both versions.' },
            { stage: 'deploy', logType: 'DEPLOY',
              instances: cn(F('v1', 'healthy', 4), [I('v2', 'starting')]),
              descKey: K + 'app-fail.2',
              desc: 'Deploy one canary instance running v2.' },
            { stage: 'health', logType: 'HEALTH',
              instances: cn(F('v1', 'healthy', 4), [I('v2', 'healthy')]),
              descKey: K + 'app-fail.3',
              desc: 'The canary passes its readiness probe and joins the pool.' },
            { stage: 'traffic', logType: 'TRAFFIC', traffic: { v1: 95, v2: 5 },
              services: { db: { io: 'rw', pulse: 'write', status: 'warn' } },
              descKey: K + 'app-fail.4',
              desc: 'Route 5% of users to the canary and start measuring.' },
            { stage: 'observe', logType: 'OBSERVE',
              descKey: K + 'app-fail.5',
              desc: 'Watch the canary’s error rate and latency against the stable baseline.' },
            { stageFail: 'observe', logType: 'FAIL', addErrors: 340,
              instances: cn(F('v1', 'healthy', 4), [I('v2', 'unhealthy')]),
              descKey: K + 'app-fail.6',
              desc: 'The canary’s error rate spikes to 30% — a null-pointer bug on a path the tests missed.' },
            { logType: 'TRAFFIC',
              descKey: K + 'app-fail.7',
              desc: 'Only the 5% of users on the canary are affected — the other 95% on stable v1 see nothing wrong.' },
            { rollback: true, logType: 'ROLLBACK', traffic: { v1: 100, v2: 0 },
              descKey: K + 'app-fail.8',
              desc: 'Automated rollback fires: the router pulls all traffic back to the stable v1 pool.' },
            { logType: 'DEPLOY',
              instances: cn(F('v1', 'healthy', 4), [I('v2', 'stopped')]),
              descKey: K + 'app-fail.9',
              desc: 'Remove the failed canary instance — stable v1 serves 100% again, seconds after detection.' },
            { logType: 'DB',
              services: { db: { migration: 'expand cols kept (harmless)', status: 'ok' } },
              descKey: K + 'app-fail.10',
              desc: 'The expand columns stay in place — harmless and ready for a fixed v2.' },
            { logType: 'OBSERVE',
              descKey: K + 'app-fail.11',
              desc: 'Lesson: Canary caught the bug with only ~5% of users briefly hit — the smallest blast radius of any rollout.' }
        ];
    }

    DV['canary'].success = DV.mkMode(init, successSteps, 'dv.canary.mode.success.start');
    DV['canary']['migration-fail'] = DV.mkMode(init, migrationFailSteps, 'dv.canary.mode.migration-fail.start');
    DV['canary']['app-fail'] = DV.mkMode(init, appFailSteps, 'dv.canary.mode.app-fail.start');
})();
