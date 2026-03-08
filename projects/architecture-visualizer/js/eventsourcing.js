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
                    ARCHV.renderComponent('comp-es-command', 'Command', '&#x1F4DD;') +
                    ARCHV.renderComponent('comp-es-handler', 'Handler', '&#x2699;') +
                    ARCHV.renderComponent('comp-es-aggregate', 'Aggregate', '&#x1F4E6;') +
                '</div>' +
            '</div>' +
            ARCHV.renderArrowConnector('emits events') +
            '<div class="archv-layer" id="layer-es-store">' +
                '<div class="archv-layer-name">Event Store (Source of Truth)</div>' +
                '<div class="archv-timeline-events" id="es-timeline">' +
                    '<div class="archv-event-card" id="comp-es-evt1"><span class="archv-event-seq">#1</span><span class="archv-event-name">OrderCreated</span></div>' +
                    '<span class="archv-timeline-arrow">&#x2192;</span>' +
                    '<div class="archv-event-card" id="comp-es-evt2"><span class="archv-event-seq">#2</span><span class="archv-event-name">ItemAdded</span></div>' +
                    '<span class="archv-timeline-arrow">&#x2192;</span>' +
                    '<div class="archv-event-card" id="comp-es-evt3"><span class="archv-event-seq">#3</span><span class="archv-event-name">ItemAdded</span></div>' +
                    '<span class="archv-timeline-arrow">&#x2192;</span>' +
                    '<div class="archv-event-card" id="comp-es-evt4"><span class="archv-event-seq">#4</span><span class="archv-event-name">OrderConfirmed</span></div>' +
                    '<span class="archv-timeline-arrow">&#x2192;</span>' +
                    '<div class="archv-event-card" id="comp-es-evt5"><span class="archv-event-seq">#5</span><span class="archv-event-name">PaymentReceived</span></div>' +
                    '<span class="archv-timeline-arrow">&#x2192;</span>' +
                    '<div class="archv-event-card" id="comp-es-new" style="border-style:dashed;opacity:0.5;"><span class="archv-event-seq">#6</span><span class="archv-event-name">new event</span></div>' +
                '</div>' +
            '</div>' +
            ARCHV.renderArrowConnector('projects to') +
            '<div class="archv-layer" id="layer-es-projections">' +
                '<div class="archv-layer-name">Projections (Read Models)</div>' +
                '<div class="archv-projections">' +
                    '<div class="archv-projection" id="comp-es-proj-list"><span>&#x1F4CB;</span><span>Order List</span></div>' +
                    '<div class="archv-projection" id="comp-es-proj-detail"><span>&#x1F4CA;</span><span>Order Detail</span></div>' +
                    '<div class="archv-projection" id="comp-es-proj-stats"><span>&#x1F4C8;</span><span>Statistics</span></div>' +
                    '<div class="archv-projection" id="comp-es-proj-search"><span>&#x1F50D;</span><span>Search Index</span></div>' +
                '</div>' +
            '</div>' +
        '</div>';
}

ARCHV.eventsourcing.http = {
    init: function() { renderEventSourcing(); },
    run: function() {
        ARCHV.animateFlow([
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
        ], { requestLabel: 'HTTP POST /api/orders/42/items' });
    }
};

ARCHV.eventsourcing.console = {
    init: function() { renderEventSourcing(); },
    run: function() {
        ARCHV.animateFlow([
            { elementId: 'comp-es-aggregate', label: 'Aggregate', description: 'Rebuild state from scratch', logType: 'COMMAND', layerId: 'layer-es-command' },
            { elementId: 'comp-es-evt1', label: 'Event #1', description: 'Apply OrderCreated', logType: 'EVENT', layerId: 'layer-es-store' },
            { elementId: 'comp-es-evt2', label: 'Event #2', description: 'Apply ItemAdded', logType: 'EVENT', layerId: 'layer-es-store' },
            { elementId: 'comp-es-evt3', label: 'Event #3', description: 'Apply ItemAdded', logType: 'EVENT', layerId: 'layer-es-store' },
            { elementId: 'comp-es-evt4', label: 'Event #4', description: 'Apply OrderConfirmed', logType: 'EVENT', layerId: 'layer-es-store' },
            { elementId: 'comp-es-evt5', label: 'Event #5', description: 'Apply PaymentReceived', logType: 'EVENT', layerId: 'layer-es-store' },
            { elementId: 'comp-es-aggregate', label: 'Aggregate', description: 'State fully rebuilt: confirmed, paid, 2 items', logType: 'RESPONSE', layerId: 'layer-es-command' }
        ], { requestLabel: 'Rebuild: Order #42 state' });
    }
};

ARCHV.eventsourcing.message = {
    init: function() { renderEventSourcing(); },
    run: function() {
        ARCHV.animateFlow([
            { elementId: 'comp-es-evt4', label: 'Event #4', description: 'OrderConfirmed event published', logType: 'EVENT', layerId: 'layer-es-store' },
            { elementId: 'comp-es-proj-list', label: 'Order List', description: 'Update status in list view', logType: 'FLOW', layerId: 'layer-es-projections' },
            { elementId: 'comp-es-proj-detail', label: 'Order Detail', description: 'Update detail view', logType: 'FLOW', layerId: 'layer-es-projections' },
            { elementId: 'comp-es-proj-stats', label: 'Statistics', description: 'Increment confirmed count', logType: 'FLOW', layerId: 'layer-es-projections' },
            { elementId: 'comp-es-proj-search', label: 'Search Index', description: 'Re-index order', logType: 'FLOW', layerId: 'layer-es-projections' },
            { elementId: 'comp-es-evt5', label: 'Event #5', description: 'PaymentReceived next', logType: 'EVENT', layerId: 'layer-es-store' },
            { elementId: 'comp-es-proj-stats', label: 'Statistics', description: 'Update revenue stats', logType: 'FLOW', layerId: 'layer-es-projections' },
            { elementId: 'comp-es-proj-detail', label: 'Order Detail', description: 'Mark as paid', logType: 'FLOW', layerId: 'layer-es-projections' }
        ], { requestLabel: 'Projection rebuild from events' });
    }
};
