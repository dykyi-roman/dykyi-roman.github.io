/* ===== Hexagonal Architecture (Ports & Adapters) ===== */

ARCHV.hexagonal = {};

ARCHV.hexagonal.modes = [
    { id: 'http', label: 'HTTP Request', desc: 'HTTP adapter (driving) receives request, calls input port, domain processes logic, output port delegates to driven adapter (database). Ports define the interface, adapters implement it.' },
    { id: 'console', label: 'Console Command', desc: 'CLI adapter (driving) triggers the same input port. The domain core is completely agnostic to whether it was triggered by HTTP, CLI, or message.' },
    { id: 'message', label: 'Message Consumer', desc: 'Message adapter (driving) consumes from queue. The hexagonal core processes identically - only the driving adapter differs.' }
];

ARCHV.hexagonal.depRules = [
    { from: 'HTTP Adapter', to: 'Input Port (I)', allowed: true },
    { from: 'CLI Adapter', to: 'Input Port (I)', allowed: true },
    { from: 'Message Adapter', to: 'Input Port (I)', allowed: true },
    { from: 'UseCase', to: 'Input Port (I)', allowed: true },
    { from: 'UseCase', to: 'DomainService', allowed: true },
    { from: 'Domain', to: 'Output Port (I)', allowed: true },
    { from: 'DB Adapter', to: 'Output Port (I)', allowed: true },
    { from: 'Email Adapter', to: 'Output Port (I)', allowed: true },
    { from: 'Domain', to: 'HTTP Adapter', allowed: false },
    { from: 'Domain', to: 'DB Adapter', allowed: false },
    { from: 'DB Adapter', to: 'Domain', allowed: false }
];

function renderHexagonal(activeAdapter) {
    var canvas = document.getElementById('archv-canvas');
    canvas.innerHTML =
        '<div class="layout-hexagonal">' +
            '<div class="archv-hex-side" id="side-driving">' +
                '<div class="archv-hex-side-label">Driving (Left)</div>' +
                ARCHV.renderComponent('comp-hex-http', 'HTTP Adapter', '&#x1F310;', 'Receives HTTP requests and translates them into port calls') +
                ARCHV.renderComponent('comp-hex-cli', 'CLI Adapter', '&#x1F4BB;', 'Converts CLI commands into port method invocations') +
                ARCHV.renderComponent('comp-hex-msg', 'Message Adapter', '&#x1F4E9;', 'Consumes messages from queue and calls input ports') +
            '</div>' +
            '<div class="archv-hex-core" id="hex-core">' +
                '<div class="archv-hex-core-inner">' +
                    '<div class="archv-hex-core-label">Domain Core</div>' +
                    ARCHV.renderComponent('comp-hex-usecase', 'UseCase', '&#x1F4E6;', 'Application layer: orchestrates the use case, calls domain services and entities') +
                    '<div class="archv-hex-ports-row">' +
                        '<div class="archv-port" id="comp-hex-input-port" data-tooltip="Interface for incoming requests. Driving adapters depend on this port.">Input Port (I)</div>' +
                        ARCHV.renderComponent('comp-hex-service', 'DomainService', '&#x1F3AF;', 'Domain logic coordination. Depends on: Entity, Output Port (I)') +
                        '<div class="archv-port" id="comp-hex-output-port" data-tooltip="Interface for outgoing operations. Driven adapters implement this port.">Output Port (I)</div>' +
                    '</div>' +
                    ARCHV.renderComponent('comp-hex-entity', 'Entity', '&#x1F4CB;', 'Core business object with identity and business rules') +
                '</div>' +
            '</div>' +
            '<div class="archv-hex-side" id="side-driven">' +
                '<div class="archv-hex-side-label">Driven (Right)</div>' +
                ARCHV.renderComponent('comp-hex-queue', 'Queue Adapter', '&#x1F4E8;', 'Implements output port for publishing messages to queue') +
                ARCHV.renderComponent('comp-hex-db', 'DB Adapter', '&#x1F4BE;', 'Implements output port for database persistence') +
                ARCHV.renderComponent('comp-hex-cache', 'Cache Adapter', '&#x26A1;', 'Implements output port for cache read/write operations') +
                ARCHV.renderComponent('comp-hex-email', 'Email Adapter', '&#x1F4E7;', 'Implements output port for sending emails and notifications') +
                ARCHV.renderComponent('comp-hex-api', 'External API', '&#x1F30D;', 'Implements output port for calling external services') +
            '</div>' +
        '</div>';
}

ARCHV.hexagonal.details = {
    http: {
        principles: [
            'Ports define interfaces; adapters implement them',
            'Domain core has zero knowledge of infrastructure',
            'Driving adapters call input ports; driven adapters implement output ports',
            'Symmetric: left side (driving) mirrors right side (driven)'
        ],
        concepts: [
            { term: 'Port', definition: 'An interface that defines how the application communicates with the outside world' },
            { term: 'Adapter', definition: 'A concrete implementation of a port for a specific technology (HTTP, CLI, DB)' },
            { term: 'UseCase', definition: 'Application layer component that implements Input Port and orchestrates domain objects to fulfill a business scenario' },
            { term: 'Driving', definition: 'Primary/left-side adapters that initiate interaction with the application' },
            { term: 'Driven', definition: 'Secondary/right-side adapters that the application uses to interact with external systems' }
        ],
        tradeoffs: {
            pros: [
                'Technology-agnostic domain core',
                'Easy to swap adapters (e.g., switch DB without touching domain)',
                'Naturally testable — mock ports for unit tests',
                'Clear separation between business logic and infrastructure'
            ],
            cons: [
                'More interfaces and classes than simpler architectures',
                'Can be overkill for CRUD-heavy applications',
                'Mapping between port DTOs and domain objects adds boilerplate'
            ],
            whenToUse: 'Best for applications with complex business logic that must remain independent of delivery mechanisms and infrastructure. Ideal when you need to support multiple entry points (HTTP, CLI, queue) or plan to change infrastructure components.'
        }
    },
    console: {
        principles: [
            'Same domain core, different driving adapter',
            'CLI adapter transforms terminal input into port calls',
            'Domain is completely agnostic to the trigger source'
        ],
        concepts: [
            { term: 'CLI Adapter', definition: 'A driving adapter that converts command-line arguments into port method calls' },
            { term: 'Symmetry', definition: 'Any driving adapter can trigger the same use case — the hexagon does not change' }
        ],
        tradeoffs: {
            pros: [
                'Proves the domain is truly infrastructure-agnostic',
                'Enables batch processing and cron jobs via CLI',
                'Same business rules enforced regardless of entry point'
            ],
            cons: [
                'Each new entry point requires a new adapter implementation',
                'Input validation logic may need duplication across adapters'
            ],
            whenToUse: 'When your application needs multiple entry points (web, CLI, queue consumer) that share the same business logic.'
        }
    },
    message: {
        principles: [
            'Message consumer is just another driving adapter',
            'Asynchronous processing with same domain guarantees',
            'Output can publish to a queue via driven adapter'
        ],
        concepts: [
            { term: 'Message Adapter', definition: 'A driving adapter that deserializes queue messages and calls input ports' },
            { term: 'Queue Adapter', definition: 'A driven adapter that publishes events/messages to an external queue' }
        ],
        tradeoffs: {
            pros: [
                'Enables async and event-driven processing',
                'Decouples services via message queues',
                'Same domain logic for sync and async flows'
            ],
            cons: [
                'Message serialization/deserialization adds complexity',
                'Error handling and retries need careful design',
                'Eventual consistency challenges'
            ],
            whenToUse: 'When you need asynchronous processing, event-driven communication between services, or want to decouple producers from consumers.'
        }
    }
};

ARCHV.hexagonal.http = {
    init: function() { renderHexagonal('http'); },
    steps: function() {
        return [
            { elementId: 'comp-hex-http', label: 'HTTP Adapter', description: 'Driving adapter receives HTTP request', logType: 'REQUEST', layerId: 'side-driving' },
            { elementId: 'comp-hex-input-port', label: 'Input Port (I)', description: 'Call input port interface', logType: 'FLOW', layerId: 'hex-core' },
            { elementId: 'comp-hex-usecase', label: 'UseCase', description: 'Execute application use case', logType: 'LAYER', layerId: 'hex-core' },
            { elementId: 'comp-hex-service', label: 'DomainService', description: 'Execute domain logic', logType: 'LAYER', layerId: 'hex-core' },
            { elementId: 'comp-hex-entity', label: 'Entity', description: 'Apply business rules', logType: 'LAYER', layerId: 'hex-core' },
            { elementId: 'comp-hex-output-port', label: 'Output Port (I)', description: 'Call output port interface', logType: 'FLOW', layerId: 'hex-core' },
            { elementId: 'comp-hex-db', label: 'DB Adapter', description: 'Driven adapter persists data', logType: 'LAYER', layerId: 'side-driven' },
            { elementId: 'comp-hex-cache', label: 'Cache Adapter', description: 'Update cache', logType: 'LAYER', layerId: 'side-driven' },
            { elementId: 'comp-hex-output-port', label: 'Output Port (I)', description: 'Return result through output port', logType: 'RESPONSE', layerId: 'hex-core' },
            { elementId: 'comp-hex-service', label: 'DomainService', description: 'Return result to use case', logType: 'RESPONSE', layerId: 'hex-core' },
            { elementId: 'comp-hex-usecase', label: 'UseCase', description: 'Return result from use case', logType: 'RESPONSE', layerId: 'hex-core' },
            { elementId: 'comp-hex-input-port', label: 'Input Port (I)', description: 'Return result through input port', logType: 'RESPONSE', layerId: 'hex-core' },
            { elementId: 'comp-hex-http', label: 'HTTP Adapter', description: 'Send HTTP response', logType: 'RESPONSE', layerId: 'side-driving' }
        ];
    },
    stepOptions: function() { return { requestLabel: 'HTTP PUT /api/products/42' }; },
    run: function() {
        ARCHV.animateFlow(ARCHV.hexagonal.http.steps(), { requestLabel: 'HTTP PUT /api/products/42' });
    }
};

ARCHV.hexagonal.console = {
    init: function() { renderHexagonal('cli'); },
    steps: function() {
        return [
            { elementId: 'comp-hex-cli', label: 'CLI Adapter', description: 'CLI command received', logType: 'REQUEST', layerId: 'side-driving' },
            { elementId: 'comp-hex-input-port', label: 'Input Port (I)', description: 'Call input port', logType: 'FLOW', layerId: 'hex-core' },
            { elementId: 'comp-hex-usecase', label: 'UseCase', description: 'Execute use case', logType: 'LAYER', layerId: 'hex-core' },
            { elementId: 'comp-hex-service', label: 'DomainService', description: 'Domain logic', logType: 'LAYER', layerId: 'hex-core' },
            { elementId: 'comp-hex-entity', label: 'Entity', description: 'Business rules', logType: 'LAYER', layerId: 'hex-core' },
            { elementId: 'comp-hex-output-port', label: 'Output Port (I)', description: 'Output port call', logType: 'FLOW', layerId: 'hex-core' },
            { elementId: 'comp-hex-db', label: 'DB Adapter', description: 'Persist to database', logType: 'LAYER', layerId: 'side-driven' },
            { elementId: 'comp-hex-output-port', label: 'Output Port (I)', description: 'Return result through output port', logType: 'RESPONSE', layerId: 'hex-core' },
            { elementId: 'comp-hex-service', label: 'DomainService', description: 'Return result to use case', logType: 'RESPONSE', layerId: 'hex-core' },
            { elementId: 'comp-hex-usecase', label: 'UseCase', description: 'Return result from use case', logType: 'RESPONSE', layerId: 'hex-core' },
            { elementId: 'comp-hex-input-port', label: 'Input Port (I)', description: 'Return result through input port', logType: 'RESPONSE', layerId: 'hex-core' },
            { elementId: 'comp-hex-cli', label: 'CLI Adapter', description: 'Print CLI output', logType: 'RESPONSE', layerId: 'side-driving' }
        ];
    },
    stepOptions: function() { return { requestLabel: 'CLI: product:import' }; },
    run: function() {
        ARCHV.animateFlow(ARCHV.hexagonal.console.steps(), { requestLabel: 'CLI: product:import' });
    }
};

ARCHV.hexagonal.message = {
    init: function() { renderHexagonal('msg'); },
    steps: function() {
        return [
            { elementId: 'comp-hex-msg', label: 'Message Adapter', description: 'Message consumed from queue', logType: 'REQUEST', layerId: 'side-driving' },
            { elementId: 'comp-hex-input-port', label: 'Input Port (I)', description: 'Call input port', logType: 'FLOW', layerId: 'hex-core' },
            { elementId: 'comp-hex-usecase', label: 'UseCase', description: 'Execute use case', logType: 'LAYER', layerId: 'hex-core' },
            { elementId: 'comp-hex-service', label: 'DomainService', description: 'Process domain logic', logType: 'LAYER', layerId: 'hex-core' },
            { elementId: 'comp-hex-entity', label: 'Entity', description: 'Apply rules', logType: 'LAYER', layerId: 'hex-core' },
            { elementId: 'comp-hex-output-port', label: 'Output Port (I)', description: 'Output port call', logType: 'FLOW', layerId: 'hex-core' },
            { elementId: 'comp-hex-db', label: 'DB Adapter', description: 'Save to storage', logType: 'LAYER', layerId: 'side-driven' },
            { elementId: 'comp-hex-queue', label: 'Queue Adapter', description: 'Publish result event', logType: 'EVENT', layerId: 'side-driven' },
            { elementId: 'comp-hex-output-port', label: 'Output Port (I)', description: 'Return result through output port', logType: 'RESPONSE', layerId: 'hex-core' },
            { elementId: 'comp-hex-service', label: 'DomainService', description: 'Return result to use case', logType: 'RESPONSE', layerId: 'hex-core' },
            { elementId: 'comp-hex-usecase', label: 'UseCase', description: 'Return result from use case', logType: 'RESPONSE', layerId: 'hex-core' },
            { elementId: 'comp-hex-input-port', label: 'Input Port (I)', description: 'Return through input port', logType: 'RESPONSE', layerId: 'hex-core' },
            { elementId: 'comp-hex-msg', label: 'Message Adapter', description: 'Acknowledge message', logType: 'RESPONSE', layerId: 'side-driving' }
        ];
    },
    stepOptions: function() { return { requestLabel: 'Message: inventory.updated' }; },
    run: function() {
        ARCHV.animateFlow(ARCHV.hexagonal.message.steps(), { requestLabel: 'Message: inventory.updated' });
    }
};
