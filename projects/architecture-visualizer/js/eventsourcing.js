/* ===== Event Sourcing ===== */

ARCHV.eventsourcing = {};

ARCHV.eventsourcing.modes = [
    { id: 'http', label: 'HTTP Request', desc: 'Command arrives via HTTP. Instead of updating state directly, the aggregate emits domain events. Events are stored in the Event Store as the single source of truth. State is rebuilt by replaying events.' },
    { id: 'console', label: 'Rebuild State', desc: 'Demonstrates state reconstruction: all events from the Event Store are replayed in order to rebuild the current aggregate state. This is the core advantage of Event Sourcing.' },
    { id: 'message', label: 'Projection Update', desc: 'Events from the Event Store are projected into read-optimized views (projections). Each projection can build a different representation of the same event stream.' }
];

ARCHV.eventsourcing.depRules = [
    { from: 'Command', to: 'Aggregate', allowed: true },
    { from: 'Aggregate', to: 'Event Store', allowed: true },
    { from: 'Event Store', to: 'Projector', allowed: true },
    { from: 'Projector', to: 'Read Model', allowed: true },
    { from: 'Read Model', to: 'Event Store', allowed: false },
    { from: 'Aggregate', to: 'Read Model', allowed: false },
    { from: 'Read Model', to: 'Aggregate', allowed: false }
];

function renderEventSourcing() {
    var canvas = document.getElementById('archv-canvas');
    canvas.innerHTML =
        '<div class="layout-timeline">' +
            '<div class="archv-layer" id="layer-es-command">' +
                '<div class="archv-layer-name">Command Processing</div>' +
                '<div class="archv-components">' +
                    ARCHV.renderComponent('comp-es-command', 'Command', '&#x1F4DD;', 'Intent to change state, triggers event emission from the aggregate') +
                    ARCHV.renderComponent('comp-es-handler', 'Handler', '&#x2699;', 'Routes command to the appropriate aggregate for processing') +
                    ARCHV.renderComponent('comp-es-aggregate', 'Aggregate', '&#x1F4E6;', 'Domain object whose state is rebuilt by replaying its event stream') +
                '</div>' +
            '</div>' +
            ARCHV.renderArrowConnector('emits events') +
            '<div class="archv-layer" id="layer-es-store">' +
                '<div class="archv-layer-name">Event Store (Source of Truth)</div>' +
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
            ARCHV.renderArrowConnector('projects to') +
            '<div class="archv-layer" id="layer-es-projections">' +
                '<div class="archv-layer-name">Projections (Read Models)</div>' +
                '<div class="archv-projections">' +
                    '<div class="archv-projection" id="comp-es-proj-list" data-tooltip="Read model: flat list of orders optimized for listing and filtering"><span>&#x1F4CB;</span><span>Order List</span></div>' +
                    '<div class="archv-projection" id="comp-es-proj-detail" data-tooltip="Read model: detailed order view with all items and status history"><span>&#x1F4CA;</span><span>Order Detail</span></div>' +
                    '<div class="archv-projection" id="comp-es-proj-stats" data-tooltip="Read model: aggregated statistics like revenue, counts, averages"><span>&#x1F4C8;</span><span>Statistics</span></div>' +
                    '<div class="archv-projection" id="comp-es-proj-search" data-tooltip="Read model: full-text search index for fast order lookup"><span>&#x1F50D;</span><span>Search Index</span></div>' +
                '</div>' +
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
            { elementId: 'comp-es-command', label: 'Command', description: 'AddItem command received', logType: 'COMMAND', layerId: 'layer-es-command' },
            { elementId: 'comp-es-handler', label: 'Handler', description: 'Route to handler', logType: 'LAYER', layerId: 'layer-es-command' },
            { elementId: 'comp-es-aggregate', label: 'Aggregate', description: 'Load from event stream', logType: 'LAYER', layerId: 'layer-es-command' },
            { elementId: 'comp-es-evt1', label: 'Replay #1', description: 'OrderCreated applied', logType: 'EVENT', layerId: 'layer-es-store' },
            { elementId: 'comp-es-evt2', label: 'Replay #2', description: 'ItemAdded applied', logType: 'EVENT', layerId: 'layer-es-store' },
            { elementId: 'comp-es-evt3', label: 'Replay #3', description: 'ItemAdded applied', logType: 'EVENT', layerId: 'layer-es-store' },
            { elementId: 'comp-es-aggregate', label: 'Aggregate', description: 'State rebuilt, apply new command', logType: 'LAYER', layerId: 'layer-es-command' },
            { elementId: 'comp-es-new', label: 'New Event', description: 'ItemAdded #6 emitted & stored', logType: 'EVENT', layerId: 'layer-es-store' },
            { elementId: 'comp-es-proj-list', label: 'Order List', description: 'Update list projection', logType: 'FLOW', layerId: 'layer-es-projections' },
            { elementId: 'comp-es-proj-detail', label: 'Order Detail', description: 'Update detail projection', logType: 'FLOW', layerId: 'layer-es-projections' }
        ];
    },
    stepOptions: function() { return { requestLabel: 'HTTP POST /api/orders/42/items' }; },
    run: function() {
        ARCHV.animateFlow(ARCHV.eventsourcing.http.steps(), ARCHV.eventsourcing.http.stepOptions());
    }
};

ARCHV.eventsourcing.console = {
    init: function() { renderEventSourcing(); },
    steps: function() {
        return [
            { elementId: 'comp-es-aggregate', label: 'Aggregate', description: 'Rebuild state from scratch', logType: 'COMMAND', layerId: 'layer-es-command' },
            { elementId: 'comp-es-evt1', label: 'Event #1', description: 'Apply OrderCreated', logType: 'EVENT', layerId: 'layer-es-store' },
            { elementId: 'comp-es-evt2', label: 'Event #2', description: 'Apply ItemAdded', logType: 'EVENT', layerId: 'layer-es-store' },
            { elementId: 'comp-es-evt3', label: 'Event #3', description: 'Apply ItemAdded', logType: 'EVENT', layerId: 'layer-es-store' },
            { elementId: 'comp-es-evt4', label: 'Event #4', description: 'Apply OrderConfirmed', logType: 'EVENT', layerId: 'layer-es-store' },
            { elementId: 'comp-es-evt5', label: 'Event #5', description: 'Apply PaymentReceived', logType: 'EVENT', layerId: 'layer-es-store' },
            { elementId: 'comp-es-aggregate', label: 'Aggregate', description: 'State fully rebuilt: confirmed, paid, 2 items', logType: 'RESPONSE', layerId: 'layer-es-command' }
        ];
    },
    stepOptions: function() { return { requestLabel: 'Rebuild: Order #42 state' }; },
    run: function() {
        ARCHV.animateFlow(ARCHV.eventsourcing.console.steps(), ARCHV.eventsourcing.console.stepOptions());
    }
};

ARCHV.eventsourcing.message = {
    init: function() { renderEventSourcing(); },
    steps: function() {
        return [
            { elementId: 'comp-es-evt4', label: 'Event #4', description: 'OrderConfirmed event published', logType: 'EVENT', layerId: 'layer-es-store' },
            { elementId: 'comp-es-proj-list', label: 'Order List', description: 'Update status in list view', logType: 'FLOW', layerId: 'layer-es-projections' },
            { elementId: 'comp-es-proj-detail', label: 'Order Detail', description: 'Update detail view', logType: 'FLOW', layerId: 'layer-es-projections' },
            { elementId: 'comp-es-proj-stats', label: 'Statistics', description: 'Increment confirmed count', logType: 'FLOW', layerId: 'layer-es-projections' },
            { elementId: 'comp-es-proj-search', label: 'Search Index', description: 'Re-index order', logType: 'FLOW', layerId: 'layer-es-projections' },
            { elementId: 'comp-es-evt5', label: 'Event #5', description: 'PaymentReceived next', logType: 'EVENT', layerId: 'layer-es-store' },
            { elementId: 'comp-es-proj-stats', label: 'Statistics', description: 'Update revenue stats', logType: 'FLOW', layerId: 'layer-es-projections' },
            { elementId: 'comp-es-proj-detail', label: 'Order Detail', description: 'Mark as paid', logType: 'FLOW', layerId: 'layer-es-projections' }
        ];
    },
    stepOptions: function() { return { requestLabel: 'Projection rebuild from events' }; },
    run: function() {
        ARCHV.animateFlow(ARCHV.eventsourcing.message.steps(), ARCHV.eventsourcing.message.stepOptions());
    }
};
