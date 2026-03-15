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
                    tooltip: I18N.t('singleton.tooltip.client1', null, 'First client — calls getInstance() which triggers instance creation')
                }) +
                PV.renderClass('cls-s-client2', 'Client 2', {
                    methods: ['useDatabase()'],
                    tooltip: I18N.t('singleton.tooltip.client2', null, 'Second client — calls getInstance() and receives the same instance')
                }) +
                PV.renderClass('cls-s-client3', 'Client 3', {
                    methods: ['useDatabase()'],
                    tooltip: I18N.t('singleton.tooltip.client3', null, 'Third client — calls getInstance() and receives the same instance again')
                }) +
            '</div>' +
            '<div style="display:flex;flex-direction:column;gap:40px;align-items:center">' +
                PV.renderClass('cls-s-singleton', 'DatabaseConnection', {
                    fields: ['-instance: DatabaseConnection', '-host: string', '-port: number'],
                    methods: ['+getInstance(): DatabaseConnection', '+query(sql): Result', '+connect()', '-constructor()'],
                    tooltip: I18N.t('singleton.tooltip.singleton', null, 'Singleton class — stores its own unique instance in a static field and provides global access via getInstance()')
                }) +
                PV.renderObject('obj-s-instance', ':DatabaseConnection', { tooltip: I18N.t('singleton.tooltip.obj-instance', null, 'The single shared instance — created on first call to getInstance()') }) +
            '</div>' +
        '</div>' +
        '<div class="pv-flow-legend">' +
            '<div class="legend-item"><span class="legend-line-sync"></span> ' + I18N.t('ui.legend.get_instance', null, 'getInstance()') + '</div>' +
            '<div class="legend-item"><span class="legend-line-create"></span> ' + I18N.t('ui.legend.creates', null, 'Creates') + '</div>' +
            '<div class="legend-item"><span class="legend-line-response"></span> ' + I18N.t('ui.legend.returns_same', null, 'Returns same instance') + '</div>' +
            '<div class="legend-item"><span class="legend-line-depend"></span> ' + I18N.t('ui.legend.uses', null, 'Uses') + '</div>' +
            '<div class="legend-item"><span style="display:inline-block;width:20px;height:14px;border:2px dashed var(--pv-accent);border-radius:2px;background:var(--pv-accent-bg);"></span> ' + I18N.t('ui.legend.object', null, 'Object') + '</div>' +
            '<div class="legend-item"><span style="color:#10B981;font-weight:bold;font-size:13px;">✓</span> ' + I18N.t('ui.legend.property', null, 'Property') + '</div>' +
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
            { elementId: 'cls-s-client1', label: 'Client 1 requests', description: 'Client 1 needs a database connection — calls DatabaseConnection.getInstance()', descriptionKey: 'singleton.step.database.0', logType: 'REQUEST' },
            { elementId: 'cls-s-singleton', label: 'getInstance()', description: 'Singleton checks static instance field', descriptionKey: 'singleton.step.database.1', logType: 'FLOW' },
            { elementId: 'cls-s-singleton', label: 'Check instance', description: 'instance == null? Yes — first call, must create new instance', descriptionKey: 'singleton.step.database.2', logType: 'FLOW', noArrowFromPrev: true, badgePosition: 'right' },
            { elementId: 'obj-s-instance', label: 'Instance created', description: 'new DatabaseConnection() — private constructor called, singleton instance stored in static field', descriptionKey: 'singleton.step.database.3', logType: 'CREATE', spawnId: 'obj-s-instance', spawnLabel: 'DatabaseConnection instance' },
            { elementId: 'cls-s-client1', label: 'Receives instance', description: 'Client 1 receives the singleton DatabaseConnection instance', descriptionKey: 'singleton.step.database.4', logType: 'RESPONSE', arrowFromId: 'obj-s-instance' },
            { elementId: 'cls-s-client2', label: 'Client 2 requests', description: 'Client 2 needs a database connection — calls DatabaseConnection.getInstance()', descriptionKey: 'singleton.step.database.5', logType: 'REQUEST', noArrowFromPrev: true, badgePosition: 'left' },
            { elementId: 'cls-s-singleton', label: 'getInstance()', description: 'Singleton checks static instance field again', descriptionKey: 'singleton.step.database.6', logType: 'FLOW' },
            { elementId: 'cls-s-singleton', label: 'Check instance', description: 'instance == null? No — instance already exists, reuse it', descriptionKey: 'singleton.step.database.7', logType: 'FLOW', noArrowFromPrev: true, badgePosition: 'right' },
            { elementId: 'cls-s-client2', label: 'Same instance returned', description: 'Client 2 receives the exact same DatabaseConnection object — no new instance created', descriptionKey: 'singleton.step.database.8', logType: 'RESPONSE', arrowFromId: 'obj-s-instance' },
            { elementId: 'cls-s-client3', label: 'Client 3 requests', description: 'Client 3 needs a database connection — calls DatabaseConnection.getInstance()', descriptionKey: 'singleton.step.database.9', logType: 'REQUEST', noArrowFromPrev: true, badgePosition: 'left' },
            { elementId: 'cls-s-singleton', label: 'getInstance()', description: 'Singleton checks static instance field once more', descriptionKey: 'singleton.step.database.10', logType: 'FLOW' },
            { elementId: 'cls-s-singleton', label: 'Check instance', description: 'instance == null? No — still the same instance', descriptionKey: 'singleton.step.database.11', logType: 'FLOW', noArrowFromPrev: true, badgePosition: 'right' },
            { elementId: 'cls-s-client3', label: 'Same instance returned', description: 'Client 3 receives the same DatabaseConnection — all three clients share one instance', descriptionKey: 'singleton.step.database.12', logType: 'RESPONSE', arrowFromId: 'obj-s-instance' }
        ];
    },
    stepOptions: function() { return { requestLabel: I18N.t('singleton.stepLabel.database', null, 'Three clients share one DB connection') }; },
    run: function() {
        PV.animateFlow(PV['singleton'].database.steps(), PV['singleton'].database.stepOptions());
    }
};

PV['singleton'].codeExamples = {
    database: {
        php: `<?php
declare(strict_types=1);

class DatabaseConnection
{
    private static ?self $instance = null;

    private function __construct(
        private readonly string $host,
        private readonly int $port,
    ) {
        $this->connect();
    }

    public static function getInstance(): self
    {
        return self::$instance ??= new self('localhost', 5432);
    }

    private function connect(): void
    {
        // establish connection
    }

    public function query(string $sql): array
    {
        return ['result' => "Executed: {$sql}"];
    }

    private function __clone(): void {}
    public function __wakeup(): never { throw new \\Exception('Cannot unserialize'); }
}

// Three clients share one connection
$conn1 = DatabaseConnection::getInstance();
$conn2 = DatabaseConnection::getInstance();
$conn3 = DatabaseConnection::getInstance();
var_dump($conn1 === $conn2); // true
var_dump($conn2 === $conn3); // true
$conn1->query('SELECT * FROM users');`,

        go: `package main

import (
	"fmt"
	"sync"
)

type DatabaseConnection struct {
	Host string
	Port int
}

func (db *DatabaseConnection) connect() {
	// establish connection
}

func (db *DatabaseConnection) Query(sql string) string {
	return fmt.Sprintf("Executed: %s", sql)
}

var (
	instance *DatabaseConnection
	once     sync.Once
)

func GetInstance() *DatabaseConnection {
	once.Do(func() {
		instance = &DatabaseConnection{Host: "localhost", Port: 5432}
		instance.connect()
	})
	return instance
}

func main() {
	conn1 := GetInstance()
	conn2 := GetInstance()
	conn3 := GetInstance()
	fmt.Println(conn1 == conn2) // true
	fmt.Println(conn2 == conn3) // true
	fmt.Println(conn1.Query("SELECT * FROM users"))
}`,

        python: `from threading import Lock
from typing import Self


class DatabaseConnection:
    _instance: Self | None = None
    _lock: Lock = Lock()

    def __init__(self, host: str, port: int) -> None:
        self.host = host
        self.port = port
        self._connect()

    def __new__(cls, *args: object, **kwargs: object) -> Self:
        raise RuntimeError("Use getInstance() instead")

    @classmethod
    def get_instance(cls) -> Self:
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    instance = object.__new__(cls)
                    instance.host = "localhost"
                    instance.port = 5432
                    instance._connect()
                    cls._instance = instance
        return cls._instance

    def _connect(self) -> None:
        pass  # establish connection

    def query(self, sql: str) -> dict:
        return {"result": f"Executed: {sql}"}


# Three clients share one connection
conn1 = DatabaseConnection.get_instance()
conn2 = DatabaseConnection.get_instance()
conn3 = DatabaseConnection.get_instance()
print(conn1 is conn2)  # True
print(conn2 is conn3)  # True
print(conn1.query("SELECT * FROM users"))`,

        rust: `use std::sync::OnceLock;
use std::fmt;

struct DatabaseConnection {
    host: String,
    port: u16,
}

impl DatabaseConnection {
    fn connect(host: &str, port: u16) -> Self {
        Self { host: host.to_string(), port }
    }

    fn query(&self, sql: &str) -> String {
        format!("Executed on {}:{}: {}", self.host, self.port, sql)
    }
}

impl fmt::Display for DatabaseConnection {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "DB({}:{})", self.host, self.port)
    }
}

static INSTANCE: OnceLock<DatabaseConnection> = OnceLock::new();

fn get_instance() -> &'static DatabaseConnection {
    INSTANCE.get_or_init(|| {
        DatabaseConnection::connect("localhost", 5432)
    })
}

fn main() {
    let conn1 = get_instance();
    let conn2 = get_instance();
    let conn3 = get_instance();
    // All three are the same reference
    assert!(std::ptr::eq(conn1, conn2));
    assert!(std::ptr::eq(conn2, conn3));
    println!("{}", conn1.query("SELECT * FROM users"));
}`
    }
}
