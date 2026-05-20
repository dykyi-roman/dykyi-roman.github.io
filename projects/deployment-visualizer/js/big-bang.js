/* ===== Big Bang Deployment ===== */

DV['big-bang'] = {};

DV['big-bang'].modes = [
    { id: 'success' },
    { id: 'migration-fail' },
    { id: 'app-fail' }
];

DV['big-bang'].properties = [
    { nameKey: 'dv.prop.downtime',  valueKey: 'dv.big-bang.prop.downtime',  type: 'bad' },
    { nameKey: 'dv.prop.rollback',  valueKey: 'dv.big-bang.prop.rollback',  type: 'bad' },
    { nameKey: 'dv.prop.cost',      valueKey: 'dv.big-bang.prop.cost',      type: 'good' },
    { nameKey: 'dv.prop.risk',      valueKey: 'dv.big-bang.prop.risk',      type: 'bad' },
    { nameKey: 'dv.prop.migration', valueKey: 'dv.big-bang.prop.migration', type: 'info' }
];

(function() {
    function board() {
        return {
            stages: ['build', 'stop', 'migrate', 'deploy', 'health', 'start', 'done'],
            groups: [{ labelKey: 'dv.group.fleet', version: 'v1', instances: DV.fleet('v1', 'healthy', 4) }],
            router: { v1: 100, v2: 0 },
            services: {
                db: { schema: 'orders <b>v1</b>', migration: '&mdash;', io: 'idle', status: 'idle' },
                cache: { keys: 'v1', state: 'warm', io: 'idle', status: 'idle' },
                queue: { consumers: 'v1 &times;2', messages: '0', io: 'idle', status: 'idle' },
                search: { index: 'idx_v1', reindex: '&mdash;', io: 'idle', status: 'idle' }
            }
        };
    }
    function init() { DV.renderBoard(board()); }
    function grp(version, instances) {
        return [{ labelKey: 'dv.group.fleet', version: version, instances: instances }];
    }
    var K = 'dv.s.big-bang.';

    /* ----- Success ----- */
    function successSteps() {
        return [
            { stage: 'build', logType: 'PIPELINE', descKey: K + 'success.0',
              desc: 'CI builds the v2 artifact and runs the full test suite.' },
            { stage: 'stop', logType: 'DEPLOY', outage: 'start',
              instances: grp('v1', DV.fleet('v1', 'stopped', 4)),
              services: { queue: { consumers: '&mdash;', messages: '14 &#x23F3;', status: 'warn' } },
              descKey: K + 'success.1',
              desc: 'Stop the entire v1 fleet at once — the application goes offline, downtime begins.' },
            { stage: 'migrate', logType: 'MIGRATE', addDowntime: 22,
              services: { db: { migration: 'ALTER TABLE running&hellip;', io: 'lock', pulse: 'lock', status: 'warn', schema: 'orders v1 &#x2192; v2' } },
              descKey: K + 'success.2',
              desc: 'Run the migration inside the downtime window — with no app running, a destructive change is safe.' },
            { logType: 'DB',
              services: { db: { schema: 'orders <b>v2</b>', migration: 'v2 applied &#x2713;', io: 'idle', status: 'ok' } },
              descKey: K + 'success.3',
              desc: 'Migration applied: columns renamed and old ones dropped in a single irreversible step.' },
            { stage: 'deploy', logType: 'DEPLOY',
              instances: grp('v2', DV.fleet('v2', 'starting', 4)),
              descKey: K + 'success.4',
              desc: 'Deploy the v2 build to every server simultaneously.' },
            { logType: 'CACHE',
              services: { cache: { keys: 'v2', state: 'flushed (cold)', io: 'flush', pulse: 'flush', status: 'warn' } },
              descKey: K + 'success.5',
              desc: 'Flush Redis — v1-shaped keys are stale against the new schema, so the cache starts cold.' },
            { logType: 'SEARCH',
              services: { search: { index: 'idx_v2', reindex: '0%', io: 'reindex', pulse: 'reindex', status: 'warn' } },
              descKey: K + 'success.6',
              desc: 'Start an Elasticsearch reindex into idx_v2 because the field mapping changed.' },
            { stage: 'health', logType: 'HEALTH', addDowntime: 9,
              descKey: K + 'success.7',
              desc: 'Readiness probes run against the freshly started v2 fleet.' },
            { logType: 'HEALTH',
              instances: grp('v2', DV.fleet('v2', 'healthy', 4)),
              services: { search: { reindex: '100% &#x2713;', status: 'ok', io: 'idle' }, queue: { consumers: 'v2 &times;2', status: 'ok' } },
              descKey: K + 'success.8',
              desc: 'All v2 instances pass the probe; the reindex finishes and the alias points to idx_v2.' },
            { stage: 'start', logType: 'TRAFFIC', outage: 'end', traffic: { v1: 0, v2: 100 },
              descKey: K + 'success.9',
              desc: 'Bring the fleet online — downtime ends and every user is now served by v2.' },
            { logType: 'QUEUE',
              services: { queue: { messages: 'draining&hellip;', io: 'consume', pulse: 'consume' } },
              descKey: K + 'success.10',
              desc: 'v2 consumers drain the 14 Kafka messages that piled up during the outage.' },
            { logType: 'CACHE',
              services: { queue: { messages: '0', io: 'idle', status: 'ok' }, cache: { state: 'warming', io: 'miss', pulse: 'miss' } },
              descKey: K + 'success.11',
              desc: 'First requests hit a cold cache — early users get cache misses and slower responses.' },
            { logType: 'DB',
              services: { cache: { state: 'warm', status: 'ok', io: 'read', pulse: 'read' }, db: { io: 'rw', pulse: 'write' } },
              descKey: K + 'success.12',
              desc: 'Cache is warm again; PostgreSQL serves v2 reads and writes normally.' },
            { stage: 'done', logType: 'DONE',
              descKey: K + 'success.13',
              desc: 'Deployment complete. Big Bang is simple, but it cost ~31s of total downtime.' }
        ];
    }

    /* ----- Migration failure ----- */
    function migrationFailSteps() {
        return [
            { stage: 'build', logType: 'PIPELINE', descKey: K + 'migration-fail.0',
              desc: 'CI builds the v2 artifact and runs the test suite.' },
            { stage: 'stop', logType: 'DEPLOY', outage: 'start',
              instances: grp('v1', DV.fleet('v1', 'stopped', 4)),
              services: { queue: { consumers: '&mdash;', messages: '11 &#x23F3;', status: 'warn' } },
              descKey: K + 'migration-fail.1',
              desc: 'Stop the whole v1 fleet — the application goes offline.' },
            { stage: 'migrate', logType: 'MIGRATE', addDowntime: 17,
              services: { db: { migration: 'ALTER TABLE running&hellip;', io: 'lock', pulse: 'lock', status: 'warn', schema: 'orders v1 &#x2192; v2' } },
              descKey: K + 'migration-fail.2',
              desc: 'Run the schema migration inside the downtime window.' },
            { stageFail: 'migrate', logType: 'FAIL', addErrors: 0,
              services: { db: { migration: 'FAILED &#x2715;', io: 'error', pulse: 'error', status: 'err', schema: 'orders v1 &#x2260; v2 (partial)' } },
              descKey: K + 'migration-fail.3',
              desc: 'The migration aborts halfway on a constraint violation — the schema is now half-applied.' },
            { logType: 'FAIL', addDowntime: 28,
              descKey: K + 'migration-fail.4',
              desc: 'Neither version can boot: v2 needs the new schema, v1 needs the old one, the DB matches neither.' },
            { rollback: true, logType: 'ROLLBACK', addDowntime: 33,
              services: { db: { migration: 'restoring backup&hellip;', io: 'write', pulse: 'write', status: 'warn' } },
              descKey: K + 'migration-fail.5',
              desc: 'Restore PostgreSQL from the pre-deploy backup — the only safe way out of a partial migration.' },
            { logType: 'DB',
              services: { db: { schema: 'orders <b>v1</b>', migration: 'restored &#x2713;', io: 'idle', status: 'ok' } },
              descKey: K + 'migration-fail.6',
              desc: 'Backup restored: the schema is back to a consistent v1 state.' },
            { logType: 'DEPLOY',
              instances: grp('v1', DV.fleet('v1', 'starting', 4)),
              descKey: K + 'migration-fail.7',
              desc: 'Redeploy the old v1 build that matches the restored schema.' },
            { logType: 'HEALTH', addDowntime: 12, outage: 'end',
              instances: grp('v1', DV.fleet('v1', 'healthy', 4)),
              traffic: { v1: 100, v2: 0 },
              services: { queue: { consumers: 'v1 &times;2', io: 'consume', pulse: 'consume', messages: 'draining&hellip;' } },
              descKey: K + 'migration-fail.8',
              desc: 'v1 is healthy again — but only after ~90s of outage, far longer than a normal release.' },
            { logType: 'QUEUE',
              services: { queue: { messages: '0', io: 'idle', status: 'ok' }, cache: { state: 'warm', status: 'ok' } },
              descKey: K + 'migration-fail.9',
              desc: 'Backlog drained, service restored to v1. The deploy never shipped.' },
            { logType: 'OBSERVE',
              descKey: K + 'migration-fail.10',
              desc: 'Lesson: a Big Bang migration failure means an extended outage and a full database restore.' }
        ];
    }

    /* ----- Application failure ----- */
    function appFailSteps() {
        return [
            { stage: 'build', logType: 'PIPELINE', descKey: K + 'app-fail.0',
              desc: 'CI builds the v2 artifact; tests are green.' },
            { stage: 'stop', logType: 'DEPLOY', outage: 'start',
              instances: grp('v1', DV.fleet('v1', 'stopped', 4)),
              services: { queue: { consumers: '&mdash;', messages: '9 &#x23F3;', status: 'warn' } },
              descKey: K + 'app-fail.1',
              desc: 'Stop the entire v1 fleet — application offline.' },
            { stage: 'migrate', logType: 'MIGRATE', addDowntime: 18,
              services: { db: { migration: 'DROP COLUMN&hellip;', io: 'lock', pulse: 'lock', status: 'warn', schema: 'orders v1 &#x2192; v2' } },
              descKey: K + 'app-fail.2',
              desc: 'Run a destructive migration — old columns are dropped because no app needs them now.' },
            { logType: 'DB',
              services: { db: { schema: 'orders <b>v2</b>', migration: 'v2 applied &#x2713;', io: 'idle', status: 'ok' } },
              descKey: K + 'app-fail.3',
              desc: 'Migration applied. The old v1 columns no longer exist in the database.' },
            { stage: 'deploy', logType: 'DEPLOY',
              instances: grp('v2', DV.fleet('v2', 'starting', 4)),
              services: { cache: { keys: 'v2', state: 'flushed (cold)', io: 'flush', pulse: 'flush', status: 'warn' } },
              descKey: K + 'app-fail.4',
              desc: 'Deploy v2 everywhere and flush the cache.' },
            { stage: 'health', logType: 'HEALTH', addDowntime: 9,
              descKey: K + 'app-fail.5',
              desc: 'Readiness probes start checking the v2 fleet.' },
            { stageFail: 'health', logType: 'FAIL',
              instances: grp('v2', DV.fleet('v2', 'unhealthy', 4)),
              descKey: K + 'app-fail.6',
              desc: 'v2 fails the probe — a bad config value makes the application crash on boot.' },
            { logType: 'FAIL', addDowntime: 22,
              descKey: K + 'app-fail.7',
              desc: 'The obvious fix is to roll back to v1 — but v1’s code expects the columns that were just dropped.' },
            { rollback: true, logType: 'ROLLBACK',
              instances: grp('v1', DV.fleet('v1', 'starting', 4)),
              descKey: K + 'app-fail.8',
              desc: 'Redeploy v1 anyway and hope it survives the v2 schema.' },
            { logType: 'FAIL', addErrors: 0,
              instances: grp('v1', DV.fleet('v1', 'unhealthy', 4)),
              services: { db: { io: 'error', pulse: 'error', status: 'err', schema: 'orders v2 &#x2715; v1 code' } },
              descKey: K + 'app-fail.9',
              desc: 'v1 crashes too: its queries reference dropped columns. The destructive migration trapped you.' },
            { logType: 'ROLLBACK', addDowntime: 34,
              services: { db: { migration: 'restoring backup&hellip;', io: 'write', pulse: 'write', status: 'warn' } },
              descKey: K + 'app-fail.10',
              desc: 'Restore the database from backup so the old v1 code has its schema back.' },
            { logType: 'DB', outage: 'end',
              instances: grp('v1', DV.fleet('v1', 'healthy', 4)),
              traffic: { v1: 100, v2: 0 },
              services: { db: { schema: 'orders <b>v1</b>', migration: 'restored &#x2713;', io: 'idle', status: 'ok' }, queue: { consumers: 'v1 &times;2', messages: '0', status: 'ok' } },
              descKey: K + 'app-fail.11',
              desc: 'v1 recovers after a DB restore. Lesson: a destructive Big Bang migration makes rollback impossible without it.' }
        ];
    }

    DV['big-bang'].success = DV.mkMode(init, successSteps, 'dv.big-bang.mode.success.start');
    DV['big-bang']['migration-fail'] = DV.mkMode(init, migrationFailSteps, 'dv.big-bang.mode.migration-fail.start');
    DV['big-bang']['app-fail'] = DV.mkMode(init, appFailSteps, 'dv.big-bang.mode.app-fail.start');
})();
