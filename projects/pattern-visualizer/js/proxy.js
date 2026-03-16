/* ===== Proxy Pattern ===== */

PV['proxy'] = {};

PV['proxy'].modes = [
    { id: 'caching', label: 'Database Caching', desc: 'CachingProxy intercepts SQL queries and caches results. On cache miss, it delegates to RealDatabase and stores the result. On cache hit, it returns the cached result without touching the database — improving performance for repeated queries.' }
];

PV['proxy'].depRules = [
    { name: 'Subject (DatabaseQuery)', role: 'Interface for both the real service and the proxy' },
    { name: 'RealSubject (RealDatabase)', role: 'The actual service that performs expensive operations' },
    { name: 'Proxy (CachingProxy)', role: 'Controls access to the RealSubject and adds caching behavior' },
    { name: 'Client', role: 'Works with the Subject interface, unaware of the proxy' }
];

/* ---------- Shared render functions ---------- */

function renderProxyCaching() {
    var canvas = document.getElementById('pv-canvas');
    canvas.innerHTML =
        '<div class="layout-pattern-hierarchy">' +
            /* Row 1: Client */
            '<div class="pv-hierarchy-row">' +
                PV.renderClass('cls-px-client', 'Client', {
                    methods: ['executeQuery(sql)'],
                    tooltip: I18N.t('proxy.tooltip.client', null, 'Client calls query() through the DatabaseQuery interface, unaware whether it talks to a proxy or the real database')
                }) +
            '</div>' +
            PV.renderArrowConnector(I18N.t('ui.legend.uses', null, 'uses')) +
            /* Row 2: DatabaseQuery interface */
            '<div class="pv-hierarchy-row">' +
                PV.renderClass('cls-px-subject', 'DatabaseQuery', {
                    stereotype: 'interface',
                    methods: ['query(sql): ResultSet'],
                    tooltip: I18N.t('proxy.tooltip.subject', null, 'Subject interface — both CachingProxy and RealDatabase implement this, making them interchangeable')
                }) +
            '</div>' +
            PV.renderArrowConnector(I18N.t('ui.legend.inherit', null, 'implements')) +
            /* Row 3: CachingProxy + RealDatabase */
            '<div class="pv-hierarchy-row" style="gap: 60px;">' +
                PV.renderClass('cls-px-proxy', 'CachingProxy', {
                    fields: ['cache: Map', 'realDb: RealDatabase'],
                    methods: ['query(sql): ResultSet'],
                    tooltip: I18N.t('proxy.tooltip.proxy', null, 'Proxy that intercepts queries — checks cache first, delegates to RealDatabase on miss, stores result for future hits')
                }) +
                PV.renderClass('cls-px-real', 'RealDatabase', {
                    methods: ['query(sql): ResultSet'],
                    tooltip: I18N.t('proxy.tooltip.real', null, 'Real service that executes SQL queries against the actual database — expensive operation')
                }) +
            '</div>' +
            /* Row 4: Objects */
            '<div class="pv-hierarchy-row" style="gap: 60px; margin-top: 30px;">' +
                PV.renderObject('obj-cache', ':Cache', { tooltip: I18N.t('proxy.tooltip.obj-cache', null, 'In-memory cache storing previously fetched ResultSets keyed by SQL query string') }) +
                PV.renderObject('obj-result', ':ResultSet', { tooltip: I18N.t('proxy.tooltip.obj-result', null, 'Query result returned from the database — cached for subsequent identical queries') }) +
            '</div>' +
            '<div class="pv-flow-legend">' +
                '<div class="legend-item"><span class="legend-line-sync"></span> ' + I18N.t('ui.legend.flow', null, 'Flow') + '</div>' +
                '<div class="legend-item"><span class="legend-line-create"></span> ' + I18N.t('ui.legend.create', null, 'Create') + '</div>' +
                '<div class="legend-item"><span class="legend-line-response"></span> ' + I18N.t('ui.legend.response', null, 'Response') + '</div>' +
                '<div class="legend-item"><span class="legend-line-inherit"></span> ' + I18N.t('ui.legend.inherit', null, 'Inherit') + '</div>' +
                '<div class="legend-item"><span class="legend-line-compose legend-line-compose-diamond"></span> ' + I18N.t('ui.legend.compose', null, 'Compose') + '</div>' +
                '<div class="legend-item"><span class="legend-line-depend"></span> ' + I18N.t('ui.legend.uses', null, 'Uses') + '</div>' +
                '<div class="legend-item"><span style="display:inline-block;width:20px;height:14px;border:2px dashed var(--pv-accent);border-radius:2px;background:var(--pv-accent-bg);"></span> ' + I18N.t('ui.legend.object', null, 'Object') + '</div>' +
            '</div>' +
        '</div>';

    setTimeout(function() {
        PV.renderRelation('cls-px-proxy', 'cls-px-subject', 'inherit');
        PV.renderRelation('cls-px-real', 'cls-px-subject', 'inherit');
        PV.renderRelation('cls-px-proxy', 'cls-px-real', 'compose');
        PV.renderRelation('cls-px-client', 'cls-px-subject', 'depend');
    }, 50);
}

/* ---------- Details ---------- */

PV['proxy'].details = {
    caching: {
        principles: [
            'The Proxy and RealSubject share the same interface — the client never knows it is talking to a proxy',
            'Single Responsibility: caching logic lives in the Proxy, not in the RealSubject or the client',
            'Open/Closed Principle: add new proxy behaviors (logging, access control, lazy loading) without modifying the RealSubject',
            'Indirection enables cross-cutting concerns: caching, logging, metrics, and access control can all be layered via proxies',
            'Composition over inheritance: the Proxy holds a reference to the RealSubject rather than extending it'
        ],
        concepts: [
            { term: 'Virtual Proxy', definition: 'Delays creation of an expensive object until it is actually needed. The proxy stands in until the real object is accessed for the first time.' },
            { term: 'Protection Proxy', definition: 'Controls access to the real object by checking permissions or credentials before forwarding the request.' },
            { term: 'Caching Proxy', definition: 'Stores results of expensive operations and returns cached data for repeated requests, reducing load on the real service.' },
            { term: 'Smart Reference', definition: 'Adds additional behavior when the object is accessed — such as reference counting, logging, or thread-safety wrappers.' }
        ],
        tradeoffs: {
            pros: [
                'Transparent to the client — no code changes needed to introduce caching, logging, or access control',
                'Reduces load on expensive services by caching repeated queries',
                'Separates cross-cutting concerns (caching, security) from business logic',
                'Can be layered: CachingProxy wrapping a LoggingProxy wrapping the RealDatabase'
            ],
            cons: [
                'Adds an extra layer of indirection — slightly increases latency for uncached requests',
                'Cache invalidation is hard: stale data can lead to incorrect results',
                'Increases the number of classes in the system',
                'Debugging through proxies can be confusing — the call stack is deeper'
            ],
            whenToUse: 'Use when you need to control access to an object without changing its interface — for caching, lazy initialization, access control, logging, or rate limiting of expensive operations.'
        }
    }
};

/* ---------- Mode: caching ---------- */

PV['proxy'].caching = {
    init: function() {
        renderProxyCaching();
    },
    steps: function() {
        return [
            {
                elementId: 'cls-px-client',
                label: 'Client',
                description: 'Client calls proxy.query("SELECT * FROM users")',
                descriptionKey: 'proxy.step.caching.0',
                logType: 'REQUEST'
            },
            {
                elementId: 'cls-px-proxy',
                label: 'CachingProxy',
                description: 'CachingProxy receives query',
                descriptionKey: 'proxy.step.caching.1',
                logType: 'FLOW'
            },
            {
                elementId: 'obj-cache',
                label: 'Cache',
                description: 'Check cache — MISS',
                descriptionKey: 'proxy.step.caching.2',
                logType: 'CACHE',
                spawnId: 'obj-cache'
            },
            {
                elementId: 'cls-px-real',
                label: 'RealDatabase',
                description: 'Delegate to realDb.query()',
                descriptionKey: 'proxy.step.caching.3',
                logType: 'FLOW',
                arrowFromId: 'cls-px-proxy'
            },
            {
                elementId: 'cls-px-real',
                label: 'RealDatabase',
                description: 'RealDatabase executes SQL query',
                descriptionKey: 'proxy.step.caching.4',
                logType: 'FLOW',
                noArrowFromPrev: true,
                badgePosition: 'right'
            },
            {
                elementId: 'obj-result',
                label: 'ResultSet',
                description: 'ResultSet created with query results',
                descriptionKey: 'proxy.step.caching.5',
                logType: 'CREATE',
                spawnId: 'obj-result'
            },
            {
                elementId: 'obj-cache',
                label: 'Cache',
                description: 'Store result in cache',
                descriptionKey: 'proxy.step.caching.6',
                logType: 'CACHE',
                arrowFromId: 'obj-result'
            },
            {
                elementId: 'cls-px-client',
                label: 'Client',
                description: 'Return ResultSet to client',
                descriptionKey: 'proxy.step.caching.7',
                logType: 'RESPONSE',
                arrowFromId: 'cls-px-proxy'
            },
            {
                elementId: 'cls-px-client',
                label: 'Client',
                description: 'Client sends same query again',
                descriptionKey: 'proxy.step.caching.8',
                logType: 'REQUEST',
                noArrowFromPrev: true,
                badgePosition: 'top'
            },
            {
                elementId: 'cls-px-proxy',
                label: 'CachingProxy',
                description: 'CachingProxy receives query',
                descriptionKey: 'proxy.step.caching.9',
                logType: 'FLOW'
            },
            {
                elementId: 'obj-cache',
                label: 'Cache',
                description: 'Check cache — HIT',
                descriptionKey: 'proxy.step.caching.10',
                logType: 'CACHE',
                arrowFromId: 'cls-px-proxy'
            },
            {
                elementId: 'cls-px-client',
                label: 'Client',
                description: 'Cached ResultSet returned (no DB call)',
                descriptionKey: 'proxy.step.caching.11',
                logType: 'RESPONSE',
                arrowFromId: 'obj-cache'
            }
        ];
    },
    stepOptions: function() {
        return { requestLabel: I18N.t('proxy.stepLabel.caching', null, 'Database query with Caching Proxy') };
    },
    run: function() {
        PV.animateFlow(PV['proxy'].caching.steps(), PV['proxy'].caching.stepOptions());
    }
};

/* ---------- Code Examples ---------- */

PV['proxy'].codeExamples = {
    caching: {
        php: `<?php
declare(strict_types=1);

interface DatabaseQuery
{
    public function query(string $sql): array;
}

class RealDatabase implements DatabaseQuery
{
    public function query(string $sql): array
    {
        // Expensive operation: execute SQL against real database
        return ['rows' => [['id' => 1, 'name' => 'Alice']], 'sql' => $sql];
    }
}

class CachingProxy implements DatabaseQuery
{
    /** @var array<string, array> */
    private array $cache = [];

    public function __construct(
        private readonly DatabaseQuery $realDb,
    ) {}

    public function query(string $sql): array
    {
        if (isset($this->cache[$sql])) {
            echo "Cache HIT: {$sql}\\n";
            return $this->cache[$sql];
        }

        echo "Cache MISS: {$sql}\\n";
        $result = $this->realDb->query($sql);
        $this->cache[$sql] = $result;

        return $result;
    }
}

// Client code — works with DatabaseQuery interface
$db = new CachingProxy(new RealDatabase());

$result1 = $db->query('SELECT * FROM users');  // MISS — hits real DB
$result2 = $db->query('SELECT * FROM users');  // HIT  — from cache
$result3 = $db->query('SELECT * FROM orders'); // MISS — different query`,

        go: `package main

import "fmt"

type DatabaseQuery interface {
	Query(sql string) map[string]interface{}
}

type RealDatabase struct{}

func (r *RealDatabase) Query(sql string) map[string]interface{} {
	// Expensive operation: execute SQL against real database
	return map[string]interface{}{
		"rows": []map[string]string{{"id": "1", "name": "Alice"}},
		"sql":  sql,
	}
}

type CachingProxy struct {
	realDb DatabaseQuery
	cache  map[string]map[string]interface{}
}

func NewCachingProxy(realDb DatabaseQuery) *CachingProxy {
	return &CachingProxy{
		realDb: realDb,
		cache:  make(map[string]map[string]interface{}),
	}
}

func (p *CachingProxy) Query(sql string) map[string]interface{} {
	if result, ok := p.cache[sql]; ok {
		fmt.Printf("Cache HIT: %s\\n", sql)
		return result
	}

	fmt.Printf("Cache MISS: %s\\n", sql)
	result := p.realDb.Query(sql)
	p.cache[sql] = result

	return result
}

func main() {
	db := NewCachingProxy(&RealDatabase{})

	db.Query("SELECT * FROM users")  // MISS
	db.Query("SELECT * FROM users")  // HIT
	db.Query("SELECT * FROM orders") // MISS
}`,

        python: `from abc import ABC, abstractmethod
from typing import override


class DatabaseQuery(ABC):
    @abstractmethod
    def query(self, sql: str) -> dict:
        ...


class RealDatabase(DatabaseQuery):
    @override
    def query(self, sql: str) -> dict:
        # Expensive operation: execute SQL against real database
        return {"rows": [{"id": 1, "name": "Alice"}], "sql": sql}


class CachingProxy(DatabaseQuery):
    def __init__(self, real_db: DatabaseQuery) -> None:
        self._real_db = real_db
        self._cache: dict[str, dict] = {}

    @override
    def query(self, sql: str) -> dict:
        if sql in self._cache:
            print(f"Cache HIT: {sql}")
            return self._cache[sql]

        print(f"Cache MISS: {sql}")
        result = self._real_db.query(sql)
        self._cache[sql] = result

        return result


# Client code — works with DatabaseQuery interface
db = CachingProxy(RealDatabase())

result1 = db.query("SELECT * FROM users")   # MISS
result2 = db.query("SELECT * FROM users")   # HIT
result3 = db.query("SELECT * FROM orders")  # MISS`,

        rust: `use std::collections::HashMap;

trait DatabaseQuery {
    fn query(&mut self, sql: &str) -> QueryResult;
}

#[derive(Clone, Debug)]
struct QueryResult {
    rows: Vec<Vec<String>>,
    sql: String,
}

struct RealDatabase;

impl DatabaseQuery for RealDatabase {
    fn query(&mut self, sql: &str) -> QueryResult {
        // Expensive operation: execute SQL against real database
        QueryResult {
            rows: vec![vec!["1".into(), "Alice".into()]],
            sql: sql.to_string(),
        }
    }
}

struct CachingProxy {
    real_db: Box<dyn DatabaseQuery>,
    cache: HashMap<String, QueryResult>,
}

impl CachingProxy {
    fn new(real_db: Box<dyn DatabaseQuery>) -> Self {
        Self {
            real_db,
            cache: HashMap::new(),
        }
    }
}

impl DatabaseQuery for CachingProxy {
    fn query(&mut self, sql: &str) -> QueryResult {
        if let Some(cached) = self.cache.get(sql) {
            println!("Cache HIT: {sql}");
            return cached.clone();
        }

        println!("Cache MISS: {sql}");
        let result = self.real_db.query(sql);
        self.cache.insert(sql.to_string(), result.clone());

        result
    }
}

fn main() {
    let mut db = CachingProxy::new(Box::new(RealDatabase));

    db.query("SELECT * FROM users");  // MISS
    db.query("SELECT * FROM users");  // HIT
    db.query("SELECT * FROM orders"); // MISS
}`
    }
};
