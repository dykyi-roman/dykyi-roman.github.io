/* ===== Object Pool Pattern ===== */

PV['pool'] = {};

PV['pool'].modes = [
    { id: 'connections', label: 'Database', desc: 'A ConnectionPool manages a fixed set of reusable database connections. Clients call acquire() to get a connection and release() to return it. Connections move between "Available" and "In Use" pools without being created or destroyed each time.' }
];

PV['pool'].depRules = [
    { name: 'Object Pool', role: 'Manages a collection of reusable objects, handling acquire and release operations' },
    { name: 'Reusable Object', role: 'Expensive-to-create object that is pooled and recycled instead of destroyed' },
    { name: 'Client', role: 'Acquires objects from the pool, uses them, and releases them back when done' }
];

/* ---------- Shared render functions ---------- */

function renderPoolConnections() {
    var canvas = document.getElementById('pv-canvas');
    canvas.innerHTML =
        '<div class="layout-pool">' +
            '<div style="grid-column: 1 / -1; text-align: center;">' +
                PV.renderClass('cls-pool-pool', 'ConnectionPool', {
                    fields: ['-available: List', '-inUse: List', '-maxSize: int'],
                    methods: ['+acquire(): Connection', '+release(conn)', '+size(): int', '+available(): int'],
                    tooltip: 'Manages a fixed-size pool of reusable Connection objects — acquire() lends one out, release() takes it back'
                }) +
            '</div>' +
            '<div>' +
                '<div class="pv-pool-label">Available</div>' +
                '<div class="pv-pool-area available" id="pool-available">' +
                    PV.renderObject('obj-pool-a1', 'Conn #1', { visible: true, tooltip: 'Idle connection ready to be acquired by a client' }) +
                    PV.renderObject('obj-pool-a2', 'Conn #2', { visible: true, tooltip: 'Idle connection ready to be acquired by a client' }) +
                    PV.renderObject('obj-pool-a3', 'Conn #3', { visible: true, tooltip: 'Idle connection ready to be acquired by a client' }) +
                    PV.renderObject('obj-pool-a4', 'Conn #4', { visible: true, tooltip: 'Idle connection ready to be acquired by a client' }) +
                '</div>' +
            '</div>' +
            '<div>' +
                '<div class="pv-pool-label">In Use</div>' +
                '<div class="pv-pool-area in-use" id="pool-in-use">' +
                    PV.renderObject('obj-pool-u1', 'Conn #1 [active]', { tooltip: 'Connection currently executing a query for a client' }) +
                    PV.renderObject('obj-pool-u2', 'Conn #2 [active]', { tooltip: 'Connection currently executing a query for a client' }) +
                '</div>' +
            '</div>' +
            '<div style="grid-column: 1 / -1; text-align: center;">' +
                PV.renderClass('cls-pool-conn', 'Connection', {
                    fields: ['id: string', 'status: string'],
                    methods: ['+execute(sql): Result', '+isValid(): boolean'],
                    tooltip: 'A reusable database connection object — created once, recycled many times through the pool'
                }) +
            '</div>' +
            '<div class="pv-flow-legend" style="grid-column: 1 / -1;">' +
                '<div class="legend-item"><span class="legend-line-sync"></span> Flow</div>' +
                '<div class="legend-item"><span class="legend-line-create"></span> Create</div>' +
                '<div class="legend-item"><span class="legend-line-response"></span> Response</div>' +
                '<div class="legend-item"><span class="legend-line-compose legend-line-compose-diamond"></span> Compose</div>' +
                '<div class="legend-item"><span style="display:inline-block;width:20px;height:14px;border:2px dashed var(--pv-accent);border-radius:2px;background:var(--pv-accent-bg);"></span> Object</div>' +
                '<div class="legend-item"><span style="color:#10B981;font-weight:bold;font-size:13px;">✓</span> Property</div>' +
            '</div>' +
        '</div>';

    setTimeout(function() {
        PV.renderRelation('cls-pool-pool', 'cls-pool-conn', 'compose');
    }, 50);
}

/* ---------- Details ---------- */

PV['pool'].details = {
    connections: {
        principles: [
            'Reuse over recreation: acquiring a connection from the pool is orders of magnitude cheaper than opening a new TCP/database handshake',
            'Bounded resources: maxSize caps the number of concurrent connections, preventing resource exhaustion on the database server',
            'Lifecycle management: the pool handles connection creation, validation (isValid), and teardown — clients just acquire and release',
            'Fairness: when all connections are in use, new acquire() calls block or fail fast, preventing unbounded wait times',
            'Transparency: clients use a Connection object the same way whether it was freshly created or recycled from the pool'
        ],
        concepts: [
            { term: 'Resource Pool', definition: 'A container that holds pre-created objects (connections) and lends them out on demand. Avoids the cost of creating and destroying objects for each use.' },
            { term: 'Lazy vs Eager Init', definition: 'Eager: all connections created at startup. Lazy: connections created on first acquire() up to maxSize. Trade-off between startup time and first-request latency.' },
            { term: 'Max Pool Size', definition: 'Upper bound on the number of objects in the pool. Prevents resource exhaustion and ensures the system operates within capacity.' },
            { term: 'Health Check', definition: 'Before returning a connection from the pool, isValid() verifies it is still alive. Stale connections are discarded and replaced.' }
        ],
        tradeoffs: {
            pros: [
                'Drastically reduces connection creation overhead — reuse amortizes the cost',
                'Bounded resource usage prevents database server overload',
                'Centralized lifecycle management simplifies error handling and cleanup',
                'Clients are decoupled from connection creation logic'
            ],
            cons: [
                'Pool size tuning requires load testing — too small causes contention, too large wastes resources',
                'Leaked connections (not released) can exhaust the pool silently',
                'Added complexity: timeout handling, eviction policies, health checks',
                'Stale or broken connections must be detected and replaced'
            ],
            whenToUse: 'Use when creating objects is expensive (database connections, network sockets, heavyweight resources) and the same objects can be safely reused across multiple clients.'
        }
    }
};

/* ---------- Mode: connections ---------- */

PV['pool'].connections = {
    init: function() {
        renderPoolConnections();
    },
    steps: function() {
        return [
            { elementId: 'cls-pool-pool', label: 'Client requests', description: 'Client calls acquire() on the ConnectionPool', logType: 'REQUEST', badgePosition: 'right' },
            { elementId: 'cls-pool-pool', label: 'Check available', description: 'Available: 4, checking for idle connection...', logType: 'FLOW', noArrowFromPrev: true },
            { elementId: 'obj-pool-a1', label: 'Conn #1 acquired', description: 'Conn #1 moves from Available to In Use', logType: 'POOL', arrowFromId: 'cls-pool-pool', arrowFromOffset: { x: 0, y: -0.3 }, arrowToOffset: { x: 0, y: -0.3 } },
            { elementId: 'obj-pool-u1', label: 'Conn #1 active', description: 'Connection #1 now active in the In Use pool', logType: 'CREATE', spawnId: 'obj-pool-u1', spawnLabel: 'Connection #1 [active]', arrowFromId: 'obj-pool-a1' },
            { elementId: 'obj-pool-u1', label: 'Executing query', description: 'Client executes SQL query through Conn #1', logType: 'FLOW', noArrowFromPrev: true, badgePosition: 'right' },
            { elementId: 'cls-pool-pool', label: 'Release called', description: 'Client calls release() for Conn #1', logType: 'POOL', arrowFromId: 'obj-pool-u1' },
            { elementId: 'obj-pool-a1', label: 'Conn #1 returned', description: 'Conn #1 returned to Available pool — ready for reuse', logType: 'RESPONSE', arrowFromId: 'cls-pool-pool', arrowFromOffset: { x: 0, y: 0.3 }, arrowToOffset: { x: 0, y: 0.3 } },
            { elementId: 'cls-pool-pool', label: 'Second client', description: 'Another client calls acquire()', logType: 'REQUEST', noArrowFromPrev: true, badgePosition: 'top' },
            { elementId: 'obj-pool-a2', label: 'Conn #2 acquired', description: 'Conn #2 moves from Available to In Use', logType: 'POOL', arrowFromId: 'cls-pool-pool' },
            { elementId: 'obj-pool-u2', label: 'Conn #2 active', description: 'Connection #2 now active in the In Use pool', logType: 'CREATE', spawnId: 'obj-pool-u2', spawnLabel: 'Connection #2 [active]', arrowFromId: 'obj-pool-a2' }
        ];
    },
    stepOptions: function() { return { requestLabel: 'Clients: ConnectionPool.acquire() / release()' }; },
    run: function() {
        PV.animateFlow(PV['pool'].connections.steps(), PV['pool'].connections.stepOptions());
    }
};
