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
                    tooltip: I18N.t('pool.tooltip.pool', null, 'Manages a fixed-size pool of reusable Connection objects — acquire() lends one out, release() takes it back')
                }) +
            '</div>' +
            '<div>' +
                '<div class="pv-pool-label">' + I18N.t('ui.label.available', null, 'Available') + '</div>' +
                '<div class="pv-pool-area available" id="pool-available">' +
                    PV.renderObject('obj-pool-a1', 'Conn #1', { visible: true, tooltip: I18N.t('pool.tooltip.idle-conn', null, 'Idle connection ready to be acquired by a client') }) +
                    PV.renderObject('obj-pool-a2', 'Conn #2', { visible: true, tooltip: I18N.t('pool.tooltip.idle-conn', null, 'Idle connection ready to be acquired by a client') }) +
                    PV.renderObject('obj-pool-a3', 'Conn #3', { visible: true, tooltip: I18N.t('pool.tooltip.idle-conn', null, 'Idle connection ready to be acquired by a client') }) +
                    PV.renderObject('obj-pool-a4', 'Conn #4', { visible: true, tooltip: I18N.t('pool.tooltip.idle-conn', null, 'Idle connection ready to be acquired by a client') }) +
                '</div>' +
            '</div>' +
            '<div>' +
                '<div class="pv-pool-label">' + I18N.t('ui.label.in_use', null, 'In Use') + '</div>' +
                '<div class="pv-pool-area in-use" id="pool-in-use">' +
                    PV.renderObject('obj-pool-u1', 'Conn #1 [active]', { tooltip: I18N.t('pool.tooltip.active-conn', null, 'Connection currently executing a query for a client') }) +
                    PV.renderObject('obj-pool-u2', 'Conn #2 [active]', { tooltip: I18N.t('pool.tooltip.active-conn', null, 'Connection currently executing a query for a client') }) +
                '</div>' +
            '</div>' +
            '<div style="grid-column: 1 / -1; text-align: center;">' +
                PV.renderClass('cls-pool-conn', 'Connection', {
                    fields: ['id: string', 'status: string'],
                    methods: ['+execute(sql): Result', '+isValid(): boolean'],
                    tooltip: I18N.t('pool.tooltip.connection', null, 'A reusable database connection object — created once, recycled many times through the pool')
                }) +
            '</div>' +
            '<div class="pv-flow-legend" style="grid-column: 1 / -1;">' +
                '<div class="legend-item"><span class="legend-line-sync"></span> ' + I18N.t('ui.legend.flow', null, 'Flow') + '</div>' +
                '<div class="legend-item"><span class="legend-line-create"></span> ' + I18N.t('ui.legend.create', null, 'Create') + '</div>' +
                '<div class="legend-item"><span class="legend-line-response"></span> ' + I18N.t('ui.legend.response', null, 'Response') + '</div>' +
                '<div class="legend-item"><span class="legend-line-compose legend-line-compose-diamond"></span> ' + I18N.t('ui.legend.compose', null, 'Compose') + '</div>' +
                '<div class="legend-item"><span style="display:inline-block;width:20px;height:14px;border:2px dashed var(--pv-accent);border-radius:2px;background:var(--pv-accent-bg);"></span> ' + I18N.t('ui.legend.object', null, 'Object') + '</div>' +
                '<div class="legend-item"><span style="color:#10B981;font-weight:bold;font-size:13px;">✓</span> ' + I18N.t('ui.legend.property', null, 'Property') + '</div>' +
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
            { elementId: 'cls-pool-pool', label: 'Client requests', description: 'Client calls acquire() on the ConnectionPool', descriptionKey: 'pool.step.connections.0', logType: 'REQUEST', badgePosition: 'right' },
            { elementId: 'cls-pool-pool', label: 'Check available', description: 'Available: 4, checking for idle connection...', descriptionKey: 'pool.step.connections.1', logType: 'FLOW', noArrowFromPrev: true },
            { elementId: 'obj-pool-a1', label: 'Conn #1 acquired', description: 'Conn #1 moves from Available to In Use', descriptionKey: 'pool.step.connections.2', logType: 'POOL', arrowFromId: 'cls-pool-pool', arrowFromOffset: { x: 0, y: -0.3 }, arrowToOffset: { x: 0, y: -0.3 } },
            { elementId: 'obj-pool-u1', label: 'Conn #1 active', description: 'Connection #1 now active in the In Use pool', descriptionKey: 'pool.step.connections.3', logType: 'CREATE', spawnId: 'obj-pool-u1', spawnLabel: 'Connection #1 [active]', arrowFromId: 'obj-pool-a1' },
            { elementId: 'obj-pool-u1', label: 'Executing query', description: 'Client executes SQL query through Conn #1', descriptionKey: 'pool.step.connections.4', logType: 'FLOW', noArrowFromPrev: true, badgePosition: 'right' },
            { elementId: 'cls-pool-pool', label: 'Release called', description: 'Client calls release() for Conn #1', descriptionKey: 'pool.step.connections.5', logType: 'POOL', arrowFromId: 'obj-pool-u1' },
            { elementId: 'obj-pool-a1', label: 'Conn #1 returned', description: 'Conn #1 returned to Available pool — ready for reuse', descriptionKey: 'pool.step.connections.6', logType: 'RESPONSE', arrowFromId: 'cls-pool-pool', arrowFromOffset: { x: 0, y: 0.3 }, arrowToOffset: { x: 0, y: 0.3 } },
            { elementId: 'cls-pool-pool', label: 'Second client', description: 'Another client calls acquire()', descriptionKey: 'pool.step.connections.7', logType: 'REQUEST', noArrowFromPrev: true, badgePosition: 'top' },
            { elementId: 'obj-pool-a2', label: 'Conn #2 acquired', description: 'Conn #2 moves from Available to In Use', descriptionKey: 'pool.step.connections.8', logType: 'POOL', arrowFromId: 'cls-pool-pool' },
            { elementId: 'obj-pool-u2', label: 'Conn #2 active', description: 'Connection #2 now active in the In Use pool', descriptionKey: 'pool.step.connections.9', logType: 'CREATE', spawnId: 'obj-pool-u2', spawnLabel: 'Connection #2 [active]', arrowFromId: 'obj-pool-a2' }
        ];
    },
    stepOptions: function() { return { requestLabel: I18N.t('pool.stepLabel.connections', null, 'Acquire and release pooled connections') }; },
    run: function() {
        PV.animateFlow(PV['pool'].connections.steps(), PV['pool'].connections.stepOptions());
    }
};

PV['pool'].codeExamples = {
    connections: {
        php: `<?php
declare(strict_types=1);

class Connection
{
    public string $status = 'idle';

    public function __construct(public readonly string $id) {}

    public function execute(string $sql): array
    {
        $this->status = 'busy';
        $result = ['rows' => "Result of: {$sql}"];
        $this->status = 'idle';
        return $result;
    }

    public function isValid(): bool
    {
        return true; // health check
    }
}

class ConnectionPool
{
    /** @var list<Connection> */
    private array $available = [];
    /** @var list<Connection> */
    private array $inUse = [];

    public function __construct(private readonly int $maxSize)
    {
        for ($i = 1; $i <= $maxSize; $i++) {
            $this->available[] = new Connection("Conn #{$i}");
        }
    }

    public function acquire(): Connection
    {
        $conn = array_pop($this->available)
            ?? throw new \\RuntimeException('Pool exhausted');
        $conn->status = 'active';
        $this->inUse[] = $conn;
        return $conn;
    }

    public function release(Connection $conn): void
    {
        $this->inUse = array_values(array_filter($this->inUse, static fn(Connection $c) => $c !== $conn));
        $conn->status = 'idle';
        $this->available[] = $conn;
    }

    public function size(): int      { return count($this->available) + count($this->inUse); }
    public function available(): int { return count($this->available); }
}

// Client
$pool = new ConnectionPool(4);
$conn = $pool->acquire();
$conn->execute('SELECT * FROM users');
$pool->release($conn);`,

        go: `package main

import (
	"fmt"
	"sync"
)

type Connection struct {
	ID     string
	Status string
}

func (c *Connection) Execute(sql string) string {
	c.Status = "busy"
	result := fmt.Sprintf("Result of: %s", sql)
	c.Status = "idle"
	return result
}

func (c *Connection) IsValid() bool { return true }

type ConnectionPool struct {
	mu        sync.Mutex
	available []*Connection
	inUse     []*Connection
	maxSize   int
}

func NewConnectionPool(maxSize int) *ConnectionPool {
	pool := &ConnectionPool{maxSize: maxSize}
	for i := 1; i <= maxSize; i++ {
		pool.available = append(pool.available, &Connection{
			ID: fmt.Sprintf("Conn #%d", i), Status: "idle",
		})
	}
	return pool
}

func (p *ConnectionPool) Acquire() (*Connection, error) {
	p.mu.Lock()
	defer p.mu.Unlock()
	if len(p.available) == 0 {
		return nil, fmt.Errorf("pool exhausted")
	}
	conn := p.available[len(p.available)-1]
	p.available = p.available[:len(p.available)-1]
	conn.Status = "active"
	p.inUse = append(p.inUse, conn)
	return conn, nil
}

func (p *ConnectionPool) Release(conn *Connection) {
	p.mu.Lock()
	defer p.mu.Unlock()
	for i, c := range p.inUse {
		if c == conn {
			p.inUse = append(p.inUse[:i], p.inUse[i+1:]...)
			break
		}
	}
	conn.Status = "idle"
	p.available = append(p.available, conn)
}

func (p *ConnectionPool) Size() int      { return len(p.available) + len(p.inUse) }
func (p *ConnectionPool) Available() int { return len(p.available) }

func main() {
	pool := NewConnectionPool(4)
	conn, _ := pool.Acquire()
	fmt.Println(conn.Execute("SELECT * FROM users"))
	pool.Release(conn)
	fmt.Printf("Available: %d/%d\\n", pool.Available(), pool.Size())
}`,

        python: `from dataclasses import dataclass
from typing import Self


@dataclass(slots=True)
class Connection:
    id: str
    status: str = "idle"

    def execute(self, sql: str) -> dict:
        self.status = "busy"
        result = {"rows": f"Result of: {sql}"}
        self.status = "idle"
        return result

    def is_valid(self) -> bool:
        return True


class ConnectionPool:
    def __init__(self, max_size: int) -> None:
        self._max_size = max_size
        self._available: list[Connection] = [
            Connection(id=f"Conn #{i}") for i in range(1, max_size + 1)
        ]
        self._in_use: list[Connection] = []

    def acquire(self) -> Connection:
        if not self._available:
            raise RuntimeError("Pool exhausted")
        conn = self._available.pop()
        conn.status = "active"
        self._in_use.append(conn)
        return conn

    def release(self, conn: Connection) -> None:
        self._in_use.remove(conn)
        conn.status = "idle"
        self._available.append(conn)

    def size(self) -> int:
        return len(self._available) + len(self._in_use)

    def available(self) -> int:
        return len(self._available)


# Client
pool = ConnectionPool(max_size=4)
conn = pool.acquire()
print(conn.execute("SELECT * FROM users"))
pool.release(conn)
print(f"Available: {pool.available()}/{pool.size()}")`,

        rust: `use std::sync::Mutex;
use std::fmt;

struct Connection {
    id: String,
    status: String,
}

impl Connection {
    fn new(id: &str) -> Self {
        Self { id: id.to_string(), status: "idle".to_string() }
    }

    fn execute(&mut self, sql: &str) -> String {
        self.status = "busy".to_string();
        let result = format!("Result of: {sql}");
        self.status = "idle".to_string();
        result
    }

    fn is_valid(&self) -> bool { true }
}

impl fmt::Display for Connection {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}({})", self.id, self.status)
    }
}

struct ConnectionPool {
    available: Mutex<Vec<Connection>>,
    max_size: usize,
}

impl ConnectionPool {
    fn new(max_size: usize) -> Self {
        let conns = (1..=max_size)
            .map(|i| Connection::new(&format!("Conn #{i}")))
            .collect();
        Self { available: Mutex::new(conns), max_size }
    }

    fn acquire(&self) -> Option<Connection> {
        let mut pool = self.available.lock().unwrap();
        pool.pop().map(|mut c| { c.status = "active".into(); c })
    }

    fn release(&self, mut conn: Connection) {
        conn.status = "idle".into();
        self.available.lock().unwrap().push(conn);
    }

    fn available(&self) -> usize {
        self.available.lock().unwrap().len()
    }
}

fn main() {
    let pool = ConnectionPool::new(4);
    let mut conn = pool.acquire().expect("Pool exhausted");
    println!("{}", conn.execute("SELECT * FROM users"));
    pool.release(conn);
    println!("Available: {}", pool.available());
}`
    }
}
