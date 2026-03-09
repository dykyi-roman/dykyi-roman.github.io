/* ===== Event Sourcing ===== */

ARCHV.eventsourcing = {};

ARCHV.eventsourcing.modes = [
    { id: 'http', label: 'HTTP Request', desc: 'Command arrives via HTTP. Instead of updating state directly, the aggregate emits domain events. Events are stored in the Event Store as the single source of truth. State is rebuilt by replaying events.' },
    { id: 'console', label: 'Rebuild State', desc: 'Demonstrates state reconstruction: all events from the Event Store are replayed in order to rebuild the current aggregate state. This is the core advantage of Event Sourcing.' },
    { id: 'message', label: 'Projection Update', desc: 'Events from the Event Store are projected into read-optimized views (projections). Each projection can build a different representation of the same event stream.' }
];

ARCHV.eventsourcing.depRules = [
    { from: 'Command', to: 'Aggregate (Load)', allowed: true },
    { from: 'Aggregate (Load)', to: 'Event Store', allowed: true },
    { from: 'Aggregate (Apply)', to: 'Event Store', allowed: true },
    { from: 'Event Store', to: 'Event Bus', allowed: true },
    { from: 'Event Bus', to: 'Projections', allowed: true },
    { from: 'Projections', to: 'Event Store', allowed: false },
    { from: 'Aggregate', to: 'Projections', allowed: false },
    { from: 'Projections', to: 'Aggregate', allowed: false }
];

function renderEventSourcing() {
    var canvas = document.getElementById('archv-canvas');
    canvas.innerHTML =
        '<div class="layout-timeline">' +
            '<div class="archv-phase-label" id="phase-es-1">Load (replay events)</div>' +
            '<div class="archv-layer" id="layer-es-command">' +
                '<div class="archv-layer-name">Command Processing</div>' +
                '<div class="archv-components">' +
                    ARCHV.renderComponent('comp-es-command', 'Command', '&#x1F4DD;', 'Intent to change state, triggers event emission from the aggregate') +
                    ARCHV.renderComponent('comp-es-handler', 'Handler', '&#x2699;', 'Routes command to the appropriate aggregate for processing') +
                    ARCHV.renderComponent('comp-es-aggregate-load', 'Aggregate (Load)', '&#x1F504;', 'Loads aggregate state by replaying events from the Event Store') +
                '</div>' +
            '</div>' +
            ARCHV.renderArrowConnector('reads events') +
            '<div class="archv-layer" id="layer-es-store">' +
                '<div class="archv-layer-name">Event Store (Append-Only Source of Truth)</div>' +
                '<div class="archv-timeline-events" id="es-timeline">' +
                    '<div class="archv-event-card" id="comp-es-evt1" data-tooltip="Immutable event: order was created with initial data"><span class="archv-event-seq">#1</span><span class="archv-event-name">OrderCreated</span></div>' +
                    '<span class="archv-timeline-arrow">&#x2192;</span>' +
                    '<div class="archv-event-card" id="comp-es-evt2" data-tooltip="Immutable event: an item was added to the order"><span class="archv-event-seq">#2</span><span class="archv-event-name">ItemAdded</span></div>' +
                    '<span class="archv-timeline-arrow">&#x2192;</span>' +
                    '<div class="archv-event-card" id="comp-es-evt3" data-tooltip="Immutable event: another item was added to the order"><span class="archv-event-seq">#3</span><span class="archv-event-name">ItemAdded</span></div>' +
                    '<span class="archv-timeline-arrow">&#x2192;</span>' +
                    '<div class="archv-event-card" id="comp-es-evt4" data-tooltip="Immutable event: order was confirmed by the customer"><span class="archv-event-seq">#4</span><span class="archv-event-name">OrderConfirmed</span></div>' +
                    '<span class="archv-timeline-arrow">&#x2192;</span>' +
                    '<div class="archv-event-card" id="comp-es-evt5" data-tooltip="Immutable event: payment was received for the order"><span class="archv-event-seq">#5</span><span class="archv-event-name">PaymentReceived</span></div>' +
                    '<span class="archv-timeline-arrow">&#x2192;</span>' +
                    '<div class="archv-event-card" id="comp-es-new" data-tooltip="Next event to be appended to the stream" style="border-style:dashed;opacity:0.5;"><span class="archv-event-seq">#6</span><span class="archv-event-name">new event</span></div>' +
                '</div>' +
            '</div>' +
            '<div class="archv-phase-label" id="phase-es-2">Phase 2 &mdash; Execute (apply command, emit event)</div>' +
            '<div class="archv-layer" id="layer-es-execute">' +
                '<div class="archv-layer-name">Aggregate Decision</div>' +
                '<div class="archv-components">' +
                    ARCHV.renderComponent('comp-es-aggregate-apply', 'Aggregate (Apply)', '&#x1F4E6;', 'State rebuilt, applies new command and emits a new domain event') +
                '</div>' +
            '</div>' +
            ARCHV.renderArrowConnector('appends event (write)') +
            '<div class="archv-phase-label" id="phase-es-3">Project (async via Event Bus)</div>' +
            '<div class="archv-event-bus" id="comp-es-eventbus" data-tooltip="Publishes committed events to downstream consumers asynchronously">&#x1F4E1; Event Bus<span class="archv-async-badge">async</span></div>' +
            '<div class="archv-layer" id="layer-es-projections">' +
                '<div class="archv-layer-name">Projections (Read Models)</div>' +
                '<div class="archv-projections">' +
                    '<div class="archv-projection" id="comp-es-proj-list" data-tooltip="Read model: flat list of orders optimized for listing and filtering"><span>&#x1F4CB;</span><span>Order List</span></div>' +
                    '<div class="archv-projection" id="comp-es-proj-detail" data-tooltip="Read model: detailed order view with all items and status history"><span>&#x1F4CA;</span><span>Order Detail</span></div>' +
                    '<div class="archv-projection" id="comp-es-proj-stats" data-tooltip="Read model: aggregated statistics like revenue, counts, averages"><span>&#x1F4C8;</span><span>Statistics</span></div>' +
                    '<div class="archv-projection" id="comp-es-proj-search" data-tooltip="Read model: full-text search index for fast order lookup"><span>&#x1F50D;</span><span>Search Index</span></div>' +
                '</div>' +
            '</div>' +
            '<div class="archv-flow-legend">' +
                '<div class="legend-item"><span class="legend-line-replay"></span> Read (replay)</div>' +
                '<div class="legend-item"><span class="legend-line-write"></span> Write (append)</div>' +
                '<div class="legend-item"><span class="legend-line-async"></span> Async</div>' +
                '<div class="legend-item"><span class="legend-line-sync"></span> Sync</div>' +
            '</div>' +
        '</div>';
}

ARCHV.eventsourcing.details = {
    http: {
        principles: [
            'Events are the single source of truth — state is derived, never stored directly',
            'Aggregates are loaded by replaying their event stream',
            'New state changes produce new events appended to the store',
            'Projections transform events into query-optimized read models'
        ],
        concepts: [
            { term: 'Event Store', definition: 'An append-only log of domain events. The authoritative source of truth for all state changes.' },
            { term: 'Event Replay', definition: 'The process of rebuilding aggregate state by sequentially applying all events from the stream.' },
            { term: 'Aggregate', definition: 'A domain object whose state is rebuilt from events rather than loaded from a mutable row in a database.' }
        ],
        tradeoffs: {
            pros: [
                'Complete audit trail — every state change is recorded as an immutable event',
                'Time-travel and replay — reconstruct state at any point in history',
                'Event-driven by nature — downstream systems react to events',
                'No data loss — events are append-only, nothing is overwritten'
            ],
            cons: [
                'Query complexity — cannot simply SELECT current state from a table',
                'Schema evolution is hard — changing event structure affects replay',
                'Storage growth — event streams grow indefinitely without snapshotting',
                'Steep learning curve — fundamentally different from CRUD mental model'
            ],
            whenToUse: 'Best for domains requiring a complete audit trail, the ability to replay or project events, and financial or compliance-driven systems where data loss is unacceptable.'
        }
    },
    console: {
        principles: [
            'State is never stored — it is always rebuilt from events',
            'Replay applies events in order to reconstruct aggregate state',
            'Snapshots can optimize replay for long event streams',
            'The event stream is the single source of truth'
        ],
        concepts: [
            { term: 'State Reconstruction', definition: 'Rebuilding the current state of an aggregate by replaying all its events from the beginning.' },
            { term: 'Snapshot', definition: 'A periodic checkpoint of aggregate state to avoid replaying the entire event stream on every load.' }
        ],
        tradeoffs: {
            pros: [
                'Complete audit trail — every state change is recorded as an immutable event',
                'Time-travel and replay — reconstruct state at any point in history',
                'Event-driven by nature — downstream systems react to events',
                'No data loss — events are append-only, nothing is overwritten'
            ],
            cons: [
                'Query complexity — cannot simply SELECT current state from a table',
                'Schema evolution is hard — changing event structure affects replay',
                'Storage growth — event streams grow indefinitely without snapshotting',
                'Steep learning curve — fundamentally different from CRUD mental model'
            ],
            whenToUse: 'Best for domains requiring a complete audit trail, the ability to replay or project events, and financial or compliance-driven systems where data loss is unacceptable.'
        }
    },
    message: {
        principles: [
            'Projections build different read representations from the same event stream',
            'Each projection can focus on a specific query pattern or view',
            'Projections are disposable — they can be deleted and rebuilt from events',
            'Multiple projections can process the same events independently'
        ],
        concepts: [
            { term: 'Projection', definition: 'A process that reads events and builds a read-optimized view (list, detail, statistics, search index).' },
            { term: 'Read Model', definition: 'A denormalized data structure built by a projection, optimized for a specific query pattern.' }
        ],
        tradeoffs: {
            pros: [
                'Complete audit trail — every state change is recorded as an immutable event',
                'Time-travel and replay — reconstruct state at any point in history',
                'Event-driven by nature — downstream systems react to events',
                'No data loss — events are append-only, nothing is overwritten'
            ],
            cons: [
                'Query complexity — cannot simply SELECT current state from a table',
                'Schema evolution is hard — changing event structure affects replay',
                'Storage growth — event streams grow indefinitely without snapshotting',
                'Steep learning curve — fundamentally different from CRUD mental model'
            ],
            whenToUse: 'Best for domains requiring a complete audit trail, the ability to replay or project events, and financial or compliance-driven systems where data loss is unacceptable.'
        }
    }
};

ARCHV.eventsourcing.http = {
    init: function() { renderEventSourcing(); },
    steps: function() {
        return [
            { elementId: 'comp-es-command', label: 'Command', description: 'AddItem command received', logType: 'COMMAND', layerId: 'layer-es-command', phase: 1 },
            { elementId: 'comp-es-handler', label: 'Handler', description: 'Route to handler', logType: 'LAYER', layerId: 'layer-es-command', phase: 1 },
            { elementId: 'comp-es-aggregate-load', label: 'Aggregate (Load)', description: 'Load from event stream', logType: 'LAYER', layerId: 'layer-es-command', phase: 1 },
            { elementId: 'comp-es-evt1', label: 'Replay #1', description: 'OrderCreated applied', logType: 'REPLAY', layerId: 'layer-es-store', phase: 1 },
            { elementId: 'comp-es-evt2', label: 'Replay #2', description: 'ItemAdded applied', logType: 'REPLAY', layerId: 'layer-es-store', phase: 1 },
            { elementId: 'comp-es-evt3', label: 'Replay #3', description: 'ItemAdded applied', logType: 'REPLAY', layerId: 'layer-es-store', phase: 1 },
            { elementId: 'comp-es-aggregate-apply', label: 'Aggregate (Apply)', description: 'State rebuilt, apply new command', logType: 'LAYER', layerId: 'layer-es-execute', phase: 2 },
            { elementId: 'comp-es-new', label: 'New Event', description: 'ItemAdded #6 appended to store', logType: 'WRITE_EVENT', layerId: 'layer-es-store', phase: 2 },
            { elementId: 'comp-es-eventbus', label: 'Event Bus', description: 'Publish event to subscribers', logType: 'ASYNC', layerId: null, phase: 3 },
            { elementId: 'comp-es-proj-list', label: 'Order List', description: 'Update list projection', logType: 'ASYNC', layerId: 'layer-es-projections', phase: 3 },
            { elementId: 'comp-es-proj-detail', label: 'Order Detail', description: 'Update detail projection', logType: 'ASYNC', layerId: 'layer-es-projections', phase: 3 }
        ];
    },
    stepOptions: function() { return { requestLabel: 'HTTP POST /api/orders/42/items' }; },
    run: function() {
        ARCHV.animateFlow(ARCHV.eventsourcing.http.steps(), ARCHV.eventsourcing.http.stepOptions());
    }
};

ARCHV.eventsourcing.console = {
    init: function() {
        renderEventSourcing();
        var phase2 = document.getElementById('phase-es-2');
        if (phase2) { phase2.textContent = 'State Ready'; }
        // Hide layers not participating in this flow
        ['phase-es-3', 'comp-es-eventbus', 'layer-es-projections'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
        // Hide the second arrow connector ("appends event (write)")
        var connectors = document.querySelectorAll('.archv-arrow-connector');
        if (connectors[1]) connectors[1].style.display = 'none';
        // Dim unused components
        ['comp-es-command', 'comp-es-handler', 'comp-es-new'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.style.opacity = '0.3';
        });
    },
    steps: function() {
        return [
            { elementId: 'comp-es-aggregate-load', label: 'Aggregate (Load)', description: 'Rebuild state from scratch', logType: 'LOAD', layerId: 'layer-es-command', phase: 1 },
            { elementId: 'comp-es-evt1', label: 'Event #1', description: 'Apply OrderCreated', logType: 'REPLAY', layerId: 'layer-es-store', phase: 1 },
            { elementId: 'comp-es-evt2', label: 'Event #2', description: 'Apply ItemAdded', logType: 'REPLAY', layerId: 'layer-es-store', phase: 1 },
            { elementId: 'comp-es-evt3', label: 'Event #3', description: 'Apply ItemAdded', logType: 'REPLAY', layerId: 'layer-es-store', phase: 1 },
            { elementId: 'comp-es-evt4', label: 'Event #4', description: 'Apply OrderConfirmed', logType: 'REPLAY', layerId: 'layer-es-store', phase: 1 },
            { elementId: 'comp-es-evt5', label: 'Event #5', description: 'Apply PaymentReceived', logType: 'REPLAY', layerId: 'layer-es-store', phase: 1 },
            { elementId: 'comp-es-aggregate-apply', label: 'Aggregate (Apply)', description: 'State fully rebuilt: confirmed, paid, 2 items', logType: 'RESPONSE', layerId: 'layer-es-execute', phase: 1 }
        ];
    },
    stepOptions: function() { return { requestLabel: 'Rebuild: Order #42 state' }; },
    run: function() {
        ARCHV.animateFlow(ARCHV.eventsourcing.console.steps(), ARCHV.eventsourcing.console.stepOptions());
    }
};

ARCHV.eventsourcing.message = {
    init: function() {
        renderEventSourcing();
        // Hide layers not participating in this flow (+ arrow connectors between them)
        ['phase-es-1', 'layer-es-command', 'phase-es-2', 'layer-es-execute'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
        // Hide arrow connectors ("reads events", "appends event (write)")
        var connectors = document.querySelectorAll('.archv-arrow-connector');
        connectors.forEach(function(c) { c.style.display = 'none'; });
        // Rename phase label — no phases in this flow
        var phase3 = document.getElementById('phase-es-3');
        if (phase3) phase3.textContent = 'Event Store \u2192 Event Bus \u2192 Projections';
        // Dim unused events in the timeline
        ['comp-es-evt1', 'comp-es-evt2', 'comp-es-evt3', 'comp-es-new'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.style.opacity = '0.3';
        });
    },
    steps: function() {
        return [
            { elementId: 'comp-es-evt4', label: 'Event #4', description: 'OrderConfirmed event published', logType: 'EVENT', layerId: 'layer-es-store', phase: 3 },
            { elementId: 'comp-es-eventbus', label: 'Event Bus', description: 'Route OrderConfirmed to consumers', logType: 'ASYNC', layerId: null, phase: 3 },
            { elementId: 'comp-es-proj-list', label: 'Order List', description: 'Update order status to confirmed', logType: 'ASYNC', layerId: 'layer-es-projections', phase: 3, arrowFromId: 'comp-es-eventbus' },
            { elementId: 'comp-es-proj-detail', label: 'Order Detail', description: 'Add confirmation timestamp', logType: 'ASYNC', layerId: 'layer-es-projections', phase: 3, arrowFromId: 'comp-es-eventbus' },
            { elementId: 'comp-es-evt5', label: 'Event #5', description: 'PaymentReceived event published', logType: 'EVENT', layerId: 'layer-es-store', phase: 3, noArrowFromPrev: true },
            { elementId: 'comp-es-eventbus', label: 'Event Bus', description: 'Route PaymentReceived to consumers', logType: 'ASYNC', layerId: null, phase: 3 },
            { elementId: 'comp-es-proj-stats', label: 'Statistics', description: 'Increment revenue counter', logType: 'ASYNC', layerId: 'layer-es-projections', phase: 3, arrowFromId: 'comp-es-eventbus' },
            { elementId: 'comp-es-proj-search', label: 'Search Index', description: 'Re-index order as paid', logType: 'ASYNC', layerId: 'layer-es-projections', phase: 3, arrowFromId: 'comp-es-eventbus' }
        ];
    },
    stepOptions: function() { return { requestLabel: 'Projection rebuild from events' }; },
    run: function() {
        ARCHV.animateFlow(ARCHV.eventsourcing.message.steps(), ARCHV.eventsourcing.message.stepOptions());
    }
};
