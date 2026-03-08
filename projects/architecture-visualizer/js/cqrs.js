/* ===== CQRS ===== */

ARCHV.cqrs = {};

ARCHV.cqrs.modes = [
    { id: 'http', label: 'HTTP (Command)', desc: 'HTTP write request enters the Command Side: Command -> CommandBus -> CommandHandler -> Aggregate -> EventStore. Events are projected to the Read Model. Query Side serves reads from optimized read models.' },
    { id: 'console', label: 'Console (Query)', desc: 'Console query goes through the Query Side: Query -> QueryBus -> QueryHandler -> ReadModel -> Database. Read models are optimized for specific query patterns.' },
    { id: 'message', label: 'Message (Event)', desc: 'Domain event is consumed and triggers both a Command on the write side and a projection update on the read side. Shows how CQRS handles eventual consistency.' }
];

ARCHV.cqrs.depRules = [
    { from: 'Controller', to: 'CommandBus', allowed: true },
    { from: 'Controller', to: 'QueryBus', allowed: true },
    { from: 'CommandHandler', to: 'Aggregate', allowed: true },
    { from: 'QueryHandler', to: 'ReadModel', allowed: true },
    { from: 'EventBus', to: 'Projector', allowed: true },
    { from: 'CommandHandler', to: 'ReadModel', allowed: false },
    { from: 'QueryHandler', to: 'Aggregate', allowed: false },
    { from: 'Query Side', to: 'Write DB', allowed: false }
];

function renderCQRS() {
    var canvas = document.getElementById('archv-canvas');
    canvas.innerHTML =
        '<div class="layout-split">' +
            '<div class="archv-split-side" id="side-command">' +
                '<div class="archv-split-title">Command Side (Write)</div>' +
                '<div class="archv-layer" id="layer-cqrs-cmd-entry">' +
                    '<div class="archv-components">' +
                        ARCHV.renderComponent('comp-cqrs-command', 'Command', '&#x1F4DD;') +
                    '</div>' +
                '</div>' +
                ARCHV.renderArrowConnector() +
                '<div class="archv-layer" id="layer-cqrs-cmd-bus">' +
                    '<div class="archv-components">' +
                        ARCHV.renderComponent('comp-cqrs-cmdbus', 'CommandBus', '&#x1F4E8;') +
                    '</div>' +
                '</div>' +
                ARCHV.renderArrowConnector() +
                '<div class="archv-layer" id="layer-cqrs-cmd-handler">' +
                    '<div class="archv-components">' +
                        ARCHV.renderComponent('comp-cqrs-cmdhandler', 'CommandHandler', '&#x2699;') +
                    '</div>' +
                '</div>' +
                ARCHV.renderArrowConnector() +
                '<div class="archv-layer" id="layer-cqrs-aggregate">' +
                    '<div class="archv-components">' +
                        ARCHV.renderComponent('comp-cqrs-aggregate', 'Aggregate', '&#x1F4E6;') +
                    '</div>' +
                '</div>' +
                ARCHV.renderArrowConnector() +
                '<div class="archv-layer" id="layer-cqrs-eventstore">' +
                    '<div class="archv-components">' +
                        ARCHV.renderComponent('comp-cqrs-eventstore', 'EventStore', '&#x1F4BE;') +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="archv-split-side" id="side-query">' +
                '<div class="archv-split-title">Query Side (Read)</div>' +
                '<div class="archv-layer" id="layer-cqrs-query">' +
                    '<div class="archv-components">' +
                        ARCHV.renderComponent('comp-cqrs-query', 'Query', '&#x1F50D;') +
                    '</div>' +
                '</div>' +
                ARCHV.renderArrowConnector() +
                '<div class="archv-layer" id="layer-cqrs-qbus">' +
                    '<div class="archv-components">' +
                        ARCHV.renderComponent('comp-cqrs-querybus', 'QueryBus', '&#x1F4E8;') +
                    '</div>' +
                '</div>' +
                ARCHV.renderArrowConnector() +
                '<div class="archv-layer" id="layer-cqrs-qhandler">' +
                    '<div class="archv-components">' +
                        ARCHV.renderComponent('comp-cqrs-queryhandler', 'QueryHandler', '&#x2699;') +
                    '</div>' +
                '</div>' +
                ARCHV.renderArrowConnector() +
                '<div class="archv-layer" id="layer-cqrs-readmodel">' +
                    '<div class="archv-components">' +
                        ARCHV.renderComponent('comp-cqrs-readmodel', 'ReadModel', '&#x1F4CA;') +
                    '</div>' +
                '</div>' +
                ARCHV.renderArrowConnector() +
                '<div class="archv-layer" id="layer-cqrs-readdb">' +
                    '<div class="archv-components">' +
                        ARCHV.renderComponent('comp-cqrs-readdb', 'Read DB', '&#x1F4BE;') +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="archv-event-bus" id="comp-cqrs-eventbus">&#x1F4E1; Event Bus (Projections)</div>' +
        '</div>';
}

ARCHV.cqrs.http = {
    init: function() { renderCQRS(); },
    run: function() {
        ARCHV.animateFlow([
            { elementId: 'comp-cqrs-command', label: 'Command', description: 'CreateOrder command created', logType: 'COMMAND', layerId: 'layer-cqrs-cmd-entry' },
            { elementId: 'comp-cqrs-cmdbus', label: 'CommandBus', description: 'Dispatch to handler', logType: 'COMMAND', layerId: 'layer-cqrs-cmd-bus' },
            { elementId: 'comp-cqrs-cmdhandler', label: 'CommandHandler', description: 'Handle create order', logType: 'LAYER', layerId: 'layer-cqrs-cmd-handler' },
            { elementId: 'comp-cqrs-aggregate', label: 'Aggregate', description: 'Order aggregate applies rules', logType: 'LAYER', layerId: 'layer-cqrs-aggregate' },
            { elementId: 'comp-cqrs-eventstore', label: 'EventStore', description: 'Store OrderCreated event', logType: 'EVENT', layerId: 'layer-cqrs-eventstore' },
            { elementId: 'comp-cqrs-eventbus', label: 'Event Bus', description: 'Publish for projections', logType: 'EVENT' },
            { elementId: 'comp-cqrs-readmodel', label: 'ReadModel', description: 'Project to read model', logType: 'LAYER', layerId: 'layer-cqrs-readmodel' },
            { elementId: 'comp-cqrs-readdb', label: 'Read DB', description: 'Update read database', logType: 'LAYER', layerId: 'layer-cqrs-readdb' }
        ], { requestLabel: 'HTTP POST /api/orders (write)' });
    }
};

ARCHV.cqrs.console = {
    init: function() { renderCQRS(); },
    run: function() {
        ARCHV.animateFlow([
            { elementId: 'comp-cqrs-query', label: 'Query', description: 'GetOrderDetails query', logType: 'QUERY', layerId: 'layer-cqrs-query' },
            { elementId: 'comp-cqrs-querybus', label: 'QueryBus', description: 'Dispatch to handler', logType: 'QUERY', layerId: 'layer-cqrs-qbus' },
            { elementId: 'comp-cqrs-queryhandler', label: 'QueryHandler', description: 'Handle query', logType: 'LAYER', layerId: 'layer-cqrs-qhandler' },
            { elementId: 'comp-cqrs-readmodel', label: 'ReadModel', description: 'Read from optimized model', logType: 'LAYER', layerId: 'layer-cqrs-readmodel' },
            { elementId: 'comp-cqrs-readdb', label: 'Read DB', description: 'Fetch from read database', logType: 'LAYER', layerId: 'layer-cqrs-readdb' }
        ], { requestLabel: 'CLI: order:details --id=42' });
    }
};

ARCHV.cqrs.message = {
    init: function() { renderCQRS(); },
    run: function() {
        ARCHV.animateFlow([
            { elementId: 'comp-cqrs-eventbus', label: 'Event Bus', description: 'PaymentReceived event arrives', logType: 'EVENT' },
            { elementId: 'comp-cqrs-command', label: 'Command', description: 'Create ConfirmOrder command', logType: 'COMMAND', layerId: 'layer-cqrs-cmd-entry' },
            { elementId: 'comp-cqrs-cmdbus', label: 'CommandBus', description: 'Dispatch command', logType: 'COMMAND', layerId: 'layer-cqrs-cmd-bus' },
            { elementId: 'comp-cqrs-cmdhandler', label: 'CommandHandler', description: 'Confirm order', logType: 'LAYER', layerId: 'layer-cqrs-cmd-handler' },
            { elementId: 'comp-cqrs-aggregate', label: 'Aggregate', description: 'Update aggregate state', logType: 'LAYER', layerId: 'layer-cqrs-aggregate' },
            { elementId: 'comp-cqrs-eventstore', label: 'EventStore', description: 'Store OrderConfirmed', logType: 'EVENT', layerId: 'layer-cqrs-eventstore' },
            { elementId: 'comp-cqrs-eventbus', label: 'Event Bus', description: 'Project event', logType: 'EVENT' },
            { elementId: 'comp-cqrs-readmodel', label: 'ReadModel', description: 'Update read model', logType: 'LAYER', layerId: 'layer-cqrs-readmodel' },
            { elementId: 'comp-cqrs-readdb', label: 'Read DB', description: 'Sync read database', logType: 'LAYER', layerId: 'layer-cqrs-readdb' }
        ], { requestLabel: 'Message: payment.received' });
    }
};
