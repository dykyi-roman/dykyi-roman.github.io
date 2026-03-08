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
                        ARCHV.renderComponent('comp-cqrs-command', 'Command', '&#x1F4DD;', 'Immutable object representing an intent to change state') +
                    '</div>' +
                '</div>' +
                ARCHV.renderArrowConnector() +
                '<div class="archv-layer" id="layer-cqrs-cmd-bus">' +
                    '<div class="archv-components">' +
                        ARCHV.renderComponent('comp-cqrs-cmdbus', 'CommandBus', '&#x1F4E8;', 'Dispatches commands to appropriate handlers with middleware support') +
                    '</div>' +
                '</div>' +
                ARCHV.renderArrowConnector() +
                '<div class="archv-layer" id="layer-cqrs-cmd-handler">' +
                    '<div class="archv-components">' +
                        ARCHV.renderComponent('comp-cqrs-cmdhandler', 'CommandHandler', '&#x2699;', 'Processes a command: loads aggregate, executes domain logic, stores events') +
                    '</div>' +
                '</div>' +
                ARCHV.renderArrowConnector() +
                '<div class="archv-layer" id="layer-cqrs-aggregate">' +
                    '<div class="archv-components">' +
                        ARCHV.renderComponent('comp-cqrs-aggregate', 'Aggregate', '&#x1F4E6;', 'Domain object enforcing business rules on the write side') +
                    '</div>' +
                '</div>' +
                ARCHV.renderArrowConnector() +
                '<div class="archv-layer" id="layer-cqrs-eventstore">' +
                    '<div class="archv-components">' +
                        ARCHV.renderComponent('comp-cqrs-eventstore', 'EventStore', '&#x1F4BE;', 'Append-only storage for domain events, the source of truth') +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="archv-split-side" id="side-query">' +
                '<div class="archv-split-title">Query Side (Read)</div>' +
                '<div class="archv-layer" id="layer-cqrs-query">' +
                    '<div class="archv-components">' +
                        ARCHV.renderComponent('comp-cqrs-query', 'Query', '&#x1F50D;', 'Read-only request for data that does not modify state') +
                    '</div>' +
                '</div>' +
                ARCHV.renderArrowConnector() +
                '<div class="archv-layer" id="layer-cqrs-qbus">' +
                    '<div class="archv-components">' +
                        ARCHV.renderComponent('comp-cqrs-querybus', 'QueryBus', '&#x1F4E8;', 'Routes queries to specialized handlers with middleware') +
                    '</div>' +
                '</div>' +
                ARCHV.renderArrowConnector() +
                '<div class="archv-layer" id="layer-cqrs-qhandler">' +
                    '<div class="archv-components">' +
                        ARCHV.renderComponent('comp-cqrs-queryhandler', 'QueryHandler', '&#x2699;', 'Reads from optimized read model, never modifies write-side state') +
                    '</div>' +
                '</div>' +
                ARCHV.renderArrowConnector() +
                '<div class="archv-layer" id="layer-cqrs-readmodel">' +
                    '<div class="archv-components">' +
                        ARCHV.renderComponent('comp-cqrs-readmodel', 'ReadModel', '&#x1F4CA;', 'Denormalized projection optimized for specific query patterns') +
                    '</div>' +
                '</div>' +
                ARCHV.renderArrowConnector() +
                '<div class="archv-layer" id="layer-cqrs-readdb">' +
                    '<div class="archv-components">' +
                        ARCHV.renderComponent('comp-cqrs-readdb', 'Read DB', '&#x1F4BE;', 'Database optimized for read queries, separate from write store') +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="archv-bridge-arrows">' +
                '<div class="archv-bridge-arrow">' +
                    '<span class="bridge-label">EventStore</span>' +
                    '<span class="bridge-line"></span>' +
                    '<span>&#x25B6;</span>' +
                '</div>' +
                '<span class="bridge-label">Event Bus</span>' +
                '<div class="archv-bridge-arrow">' +
                    '<span>&#x25B6;</span>' +
                    '<span class="bridge-line"></span>' +
                    '<span class="bridge-label">ReadModel</span>' +
                '</div>' +
            '</div>' +
            '<div class="archv-event-bus" id="comp-cqrs-eventbus" data-tooltip="Routes events from write side to projection consumers for read model updates">&#x1F4E1; Event Bus (Projections)<span class="archv-async-badge">async</span></div>' +
        '</div>';
}

ARCHV.cqrs.details = {
    http: {
        principles: [
            'Command Side handles all writes through CommandBus and CommandHandlers',
            'Events are the bridge between write and read sides',
            'Read models are eventually consistent projections of write-side events',
            'Write model is optimized for business rules; read model is optimized for queries'
        ],
        concepts: [
            { term: 'Command', definition: 'An immutable object representing an intent to change state. Dispatched via CommandBus to the appropriate handler.' },
            { term: 'CommandHandler', definition: 'Processes a specific command, loads the aggregate, executes domain logic, and stores resulting events.' },
            { term: 'EventStore', definition: 'Append-only storage for domain events. The source of truth for the write side.' },
            { term: 'ReadModel', definition: 'A denormalized projection optimized for specific query patterns, rebuilt from events.' }
        ],
        tradeoffs: {
            pros: [
                'Independent scaling of reads and writes',
                'Read models optimized for specific query patterns',
                'Natural fit for event-driven architectures',
                'Clear separation between command and query responsibilities'
            ],
            cons: [
                'Increased system complexity and more moving parts',
                'Eventual consistency between write and read models',
                'Data duplication across read models',
                'More infrastructure to manage (event bus, projections, multiple databases)'
            ],
            whenToUse: 'Best for systems with high-read/low-write ratio, when read and write models have fundamentally different shapes, or when complex query patterns demand denormalized views.'
        }
    },
    console: {
        principles: [
            'Query Side serves reads from optimized, denormalized models',
            'QueryBus routes queries to specialized handlers',
            'Read models can be rebuilt entirely from the event stream',
            'Different read models can serve different query patterns from the same events'
        ],
        concepts: [
            { term: 'Query', definition: 'A request for data that does not modify state. Routed via QueryBus to the appropriate handler.' },
            { term: 'QueryHandler', definition: 'Reads from the optimized read model and returns a result. Never modifies write-side state.' },
            { term: 'QueryBus', definition: 'Dispatches queries to the correct handler. Enables middleware (caching, logging, authorization).' }
        ],
        tradeoffs: {
            pros: [
                'Independent scaling of reads and writes',
                'Read models optimized for specific query patterns',
                'Natural fit for event-driven architectures',
                'Clear separation between command and query responsibilities'
            ],
            cons: [
                'Increased system complexity and more moving parts',
                'Eventual consistency between write and read models',
                'Data duplication across read models',
                'More infrastructure to manage (event bus, projections, multiple databases)'
            ],
            whenToUse: 'Best for systems with high-read/low-write ratio, when read and write models have fundamentally different shapes, or when complex query patterns demand denormalized views.'
        }
    },
    message: {
        principles: [
            'Events from external systems can trigger commands on the write side',
            'Projection updates happen asynchronously after events are stored',
            'Eventual consistency is embraced as a design trade-off for scalability',
            'The event bus decouples event producers from projection consumers'
        ],
        concepts: [
            { term: 'Projection', definition: 'The process of transforming events into read model state. Can be replayed to rebuild read models.' },
            { term: 'Eventual Consistency', definition: 'Read models may lag behind the write model. The system guarantees convergence, not immediate consistency.' }
        ],
        tradeoffs: {
            pros: [
                'Independent scaling of reads and writes',
                'Read models optimized for specific query patterns',
                'Natural fit for event-driven architectures',
                'Clear separation between command and query responsibilities'
            ],
            cons: [
                'Increased system complexity and more moving parts',
                'Eventual consistency between write and read models',
                'Data duplication across read models',
                'More infrastructure to manage (event bus, projections, multiple databases)'
            ],
            whenToUse: 'Best for systems with high-read/low-write ratio, when read and write models have fundamentally different shapes, or when complex query patterns demand denormalized views.'
        }
    }
};

ARCHV.cqrs.http = {
    init: function() { renderCQRS(); },
    steps: function() {
        return [
            { elementId: 'comp-cqrs-command', label: 'Command', description: 'CreateOrder command created', logType: 'COMMAND', layerId: 'layer-cqrs-cmd-entry' },
            { elementId: 'comp-cqrs-cmdbus', label: 'CommandBus', description: 'Dispatch to handler', logType: 'COMMAND', layerId: 'layer-cqrs-cmd-bus' },
            { elementId: 'comp-cqrs-cmdhandler', label: 'CommandHandler', description: 'Handle create order', logType: 'LAYER', layerId: 'layer-cqrs-cmd-handler' },
            { elementId: 'comp-cqrs-aggregate', label: 'Aggregate', description: 'Order aggregate applies rules', logType: 'LAYER', layerId: 'layer-cqrs-aggregate' },
            { elementId: 'comp-cqrs-eventstore', label: 'EventStore', description: 'Store OrderCreated event', logType: 'EVENT', layerId: 'layer-cqrs-eventstore' },
            { elementId: 'comp-cqrs-eventbus', label: 'Event Bus', description: 'Publish for projections', logType: 'EVENT' },
            { elementId: 'comp-cqrs-readmodel', label: 'ReadModel', description: 'Project to read model', logType: 'LAYER', layerId: 'layer-cqrs-readmodel' },
            { elementId: 'comp-cqrs-readdb', label: 'Read DB', description: 'Update read database', logType: 'LAYER', layerId: 'layer-cqrs-readdb' }
        ];
    },
    stepOptions: function() { return { requestLabel: 'HTTP POST /api/orders (write)' }; },
    run: function() {
        ARCHV.animateFlow(ARCHV.cqrs.http.steps(), ARCHV.cqrs.http.stepOptions());
    }
};

ARCHV.cqrs.console = {
    init: function() { renderCQRS(); },
    steps: function() {
        return [
            { elementId: 'comp-cqrs-query', label: 'Query', description: 'GetOrderDetails query', logType: 'QUERY', layerId: 'layer-cqrs-query' },
            { elementId: 'comp-cqrs-querybus', label: 'QueryBus', description: 'Dispatch to handler', logType: 'QUERY', layerId: 'layer-cqrs-qbus' },
            { elementId: 'comp-cqrs-queryhandler', label: 'QueryHandler', description: 'Handle query', logType: 'LAYER', layerId: 'layer-cqrs-qhandler' },
            { elementId: 'comp-cqrs-readmodel', label: 'ReadModel', description: 'Read from optimized model', logType: 'LAYER', layerId: 'layer-cqrs-readmodel' },
            { elementId: 'comp-cqrs-readdb', label: 'Read DB', description: 'Fetch from read database', logType: 'LAYER', layerId: 'layer-cqrs-readdb' }
        ];
    },
    stepOptions: function() { return { requestLabel: 'CLI: order:details --id=42' }; },
    run: function() {
        ARCHV.animateFlow(ARCHV.cqrs.console.steps(), ARCHV.cqrs.console.stepOptions());
    }
};

ARCHV.cqrs.message = {
    init: function() { renderCQRS(); },
    steps: function() {
        return [
            { elementId: 'comp-cqrs-eventbus', label: 'Event Bus', description: 'PaymentReceived event arrives', logType: 'EVENT' },
            { elementId: 'comp-cqrs-command', label: 'Command', description: 'Create ConfirmOrder command', logType: 'COMMAND', layerId: 'layer-cqrs-cmd-entry' },
            { elementId: 'comp-cqrs-cmdbus', label: 'CommandBus', description: 'Dispatch command', logType: 'COMMAND', layerId: 'layer-cqrs-cmd-bus' },
            { elementId: 'comp-cqrs-cmdhandler', label: 'CommandHandler', description: 'Confirm order', logType: 'LAYER', layerId: 'layer-cqrs-cmd-handler' },
            { elementId: 'comp-cqrs-aggregate', label: 'Aggregate', description: 'Update aggregate state', logType: 'LAYER', layerId: 'layer-cqrs-aggregate' },
            { elementId: 'comp-cqrs-eventstore', label: 'EventStore', description: 'Store OrderConfirmed', logType: 'EVENT', layerId: 'layer-cqrs-eventstore' },
            { elementId: 'comp-cqrs-eventbus', label: 'Event Bus', description: 'Project event', logType: 'EVENT' },
            { elementId: 'comp-cqrs-readmodel', label: 'ReadModel', description: 'Update read model', logType: 'LAYER', layerId: 'layer-cqrs-readmodel' },
            { elementId: 'comp-cqrs-readdb', label: 'Read DB', description: 'Sync read database', logType: 'LAYER', layerId: 'layer-cqrs-readdb' }
        ];
    },
    stepOptions: function() { return { requestLabel: 'Message: payment.received' }; },
    run: function() {
        ARCHV.animateFlow(ARCHV.cqrs.message.steps(), ARCHV.cqrs.message.stepOptions());
    }
};
