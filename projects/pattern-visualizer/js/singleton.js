/* ===== Singleton Pattern ===== */

PV['singleton'] = {};

PV['singleton'].modes = [
    { id: 'database', label: 'Database', desc: 'A DatabaseConnection singleton ensures only one connection instance exists. Multiple clients call getInstance() — the first call creates the connection, subsequent calls return the same instance. All clients share a single connection object.' }
];

PV['singleton'].depRules = [
    { name: 'Singleton', role: 'Stores its own unique instance; provides global access via static getInstance()' },
    { name: 'Client', role: 'Accesses the singleton exclusively through getInstance(), never via constructor' }
];

/* ---------- Shared render functions ---------- */

function renderSingletonDatabase() {
    var canvas = document.getElementById('pv-canvas');
    canvas.innerHTML =
        '<div class="layout-pattern-flow">' +
            '<div style="display:flex;flex-direction:column;gap:15px;align-items:center;margin-right:60px;">' +
                PV.renderClass('cls-s-client1', 'Client 1', {
                    methods: ['useDatabase()'],
                    tooltip: 'First client — calls getInstance() which triggers instance creation'
                }) +
                PV.renderClass('cls-s-client2', 'Client 2', {
                    methods: ['useDatabase()'],
                    tooltip: 'Second client — calls getInstance() and receives the same instance'
                }) +
                PV.renderClass('cls-s-client3', 'Client 3', {
                    methods: ['useDatabase()'],
                    tooltip: 'Third client — calls getInstance() and receives the same instance again'
                }) +
            '</div>' +
            '<div style="display:flex;flex-direction:column;gap:40px;align-items:center">' +
                PV.renderClass('cls-s-singleton', 'DatabaseConnection', {
                    fields: ['-instance: DatabaseConnection', '-host: string', '-port: number'],
                    methods: ['+getInstance(): DatabaseConnection', '+query(sql): Result', '+connect()', '-constructor()'],
                    tooltip: 'Singleton class — stores its own unique instance in a static field and provides global access via getInstance()'
                }) +
                PV.renderObject('obj-s-instance', ':DatabaseConnection', { tooltip: 'The single shared instance — created on first call to getInstance()' }) +
            '</div>' +
        '</div>' +
        '<div class="pv-flow-legend">' +
            '<div class="legend-item"><span class="legend-line-sync"></span> getInstance()</div>' +
            '<div class="legend-item"><span class="legend-line-create"></span> Creates</div>' +
            '<div class="legend-item"><span class="legend-line-response"></span> Returns same instance</div>' +
            '<div class="legend-item"><span class="legend-line-depend"></span> Uses</div>' +
            '<div class="legend-item"><span style="display:inline-block;width:20px;height:14px;border:2px dashed var(--pv-accent);border-radius:2px;background:var(--pv-accent-bg);"></span> Object</div>' +
            '<div class="legend-item"><span style="color:#10B981;font-weight:bold;font-size:13px;">✓</span> Property</div>' +
        '</div>';

    setTimeout(function() {
        PV.renderRelation('cls-s-client1', 'cls-s-singleton', 'depend');
        PV.renderRelation('cls-s-client2', 'cls-s-singleton', 'depend');
        PV.renderRelation('cls-s-client3', 'cls-s-singleton', 'depend');
    }, 50);
}

/* ---------- Details ---------- */

PV['singleton'].details = {
    database: {
        principles: [
            'Ensure a class has only one instance — the constructor is private, getInstance() is the sole entry point',
            'Lazy initialization: the instance is created only when first requested, not at application startup',
            'Thread safety: in concurrent environments, getInstance() must handle race conditions (double-checked locking, volatile, enum, or synchronized block)',
            'Global state risk: while Singleton provides controlled access, the shared mutable state can lead to unexpected side effects across the system',
            'Single Responsibility tension: the class manages both its business logic (query, connect) and its own lifecycle (instance creation and storage)'
        ],
        concepts: [
            { term: 'Lazy Initialization', definition: 'The instance is not created until the first call to getInstance(), saving resources if the singleton is never used during the application lifecycle.' },
            { term: 'Double-Checked Locking', definition: 'A thread-safety optimization: check if instance is null without synchronization first, then synchronize only for the creation block — avoids lock overhead on every call.' },
            { term: 'Registry of Singletons', definition: 'A pattern where multiple singleton classes register themselves in a central registry, allowing lookup by name or type — useful when multiple controlled-instance classes coexist.' },
            { term: 'Private Constructor', definition: 'The constructor is made private to prevent external instantiation. Only the static getInstance() method can create the object, enforcing the single-instance guarantee.' }
        ],
        tradeoffs: {
            pros: [
                'Guarantees exactly one instance — prevents resource conflicts (e.g., multiple DB connections competing for the same port)',
                'Global access without global variables — cleaner than static fields scattered across code',
                'Lazy initialization saves resources when the instance is not always needed',
                'Easy to implement in most languages with minimal boilerplate'
            ],
            cons: [
                'Violates Single Responsibility Principle — the class manages its own lifecycle and business logic',
                'Makes unit testing harder — difficult to mock or replace the singleton in test environments',
                'Introduces hidden dependencies — any class can call getInstance() without declaring the dependency in its constructor or interface',
                'Thread safety adds complexity and potential performance overhead in concurrent environments'
            ],
            whenToUse: 'Use when exactly one instance of a class is needed system-wide (e.g., database connection pool, hardware interface), and you want controlled, lazy access to that instance.'
        }
    }
};

/* ---------- Mode: database ---------- */

PV['singleton'].database = {
    init: function() {
        renderSingletonDatabase();
    },
    steps: function() {
        return [
            { elementId: 'cls-s-client1', label: 'Client 1 requests', description: 'Client 1 needs a database connection — calls DatabaseConnection.getInstance()', logType: 'REQUEST' },
            { elementId: 'cls-s-singleton', label: 'getInstance()', description: 'Singleton checks static instance field', logType: 'FLOW' },
            { elementId: 'cls-s-singleton', label: 'Check instance', description: 'instance == null? Yes — first call, must create new instance', logType: 'FLOW', noArrowFromPrev: true, badgePosition: 'right' },
            { elementId: 'obj-s-instance', label: 'Instance created', description: 'new DatabaseConnection() — private constructor called, singleton instance stored in static field', logType: 'CREATE', spawnId: 'obj-s-instance', spawnLabel: 'DatabaseConnection instance' },
            { elementId: 'cls-s-client1', label: 'Receives instance', description: 'Client 1 receives the singleton DatabaseConnection instance', logType: 'RESPONSE', arrowFromId: 'obj-s-instance' },
            { elementId: 'cls-s-client2', label: 'Client 2 requests', description: 'Client 2 needs a database connection — calls DatabaseConnection.getInstance()', logType: 'REQUEST', noArrowFromPrev: true, badgePosition: 'left' },
            { elementId: 'cls-s-singleton', label: 'getInstance()', description: 'Singleton checks static instance field again', logType: 'FLOW' },
            { elementId: 'cls-s-singleton', label: 'Check instance', description: 'instance == null? No — instance already exists, reuse it', logType: 'FLOW', noArrowFromPrev: true, badgePosition: 'right' },
            { elementId: 'cls-s-client2', label: 'Same instance returned', description: 'Client 2 receives the exact same DatabaseConnection object — no new instance created', logType: 'RESPONSE', arrowFromId: 'obj-s-instance' },
            { elementId: 'cls-s-client3', label: 'Client 3 requests', description: 'Client 3 needs a database connection — calls DatabaseConnection.getInstance()', logType: 'REQUEST', noArrowFromPrev: true, badgePosition: 'left' },
            { elementId: 'cls-s-singleton', label: 'getInstance()', description: 'Singleton checks static instance field once more', logType: 'FLOW' },
            { elementId: 'cls-s-singleton', label: 'Check instance', description: 'instance == null? No — still the same instance', logType: 'FLOW', noArrowFromPrev: true, badgePosition: 'right' },
            { elementId: 'cls-s-client3', label: 'Same instance returned', description: 'Client 3 receives the same DatabaseConnection — all three clients share one instance', logType: 'RESPONSE', arrowFromId: 'obj-s-instance' }
        ];
    },
    stepOptions: function() { return { requestLabel: 'Clients: DatabaseConnection.getInstance()' }; },
    run: function() {
        PV.animateFlow(PV['singleton'].database.steps(), PV['singleton'].database.stepOptions());
    }
};
