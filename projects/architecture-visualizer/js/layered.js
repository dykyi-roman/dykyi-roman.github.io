/* ===== Layered Architecture ===== */

ARCHV.layered = {};

ARCHV.layered.modes = [
    { id: 'http', label: 'HTTP Request', desc: 'HTTP request enters through Controller in Presentation layer. Controller passes Request DTO to UseCase. UseCase creates a Command, delegates to AppService and domain services. After persistence, UseCase dispatches domain events through EventDispatcher interface (Domain), resolved to implementation in Infrastructure.' },
    { id: 'console', label: 'Console Command', desc: 'Console command enters through CLI handler, delegates to AppService which orchestrates UseCase directly (no CommandBus). Infrastructure handles persistence. Dependencies always point inward.' },
    { id: 'message', label: 'Message Consumer', desc: 'Async message enters through a message consumer, AppService handles orchestration, UseCase executes domain logic. After persistence, UseCase dispatches domain events through EventDispatcher interface in Domain layer.' }
];

ARCHV.layered.depRules = [
    { from: 'Presentation', to: 'Application', allowed: true },
    { from: 'Application', to: 'Domain', allowed: true },
    { from: 'Infrastructure', to: 'Domain', allowed: true },
    { from: 'Infrastructure', to: 'Application', allowed: false },
    { from: 'Domain', to: 'Infrastructure', allowed: false },
    { from: 'Domain', to: 'Presentation', allowed: false },
    { from: 'Application', to: 'Presentation', allowed: false },
    { from: 'Infrastructure', to: 'Presentation', allowed: false }
];

function renderLayered(entryIcon, entryLabel) {
    var canvas = document.getElementById('archv-canvas');
    canvas.innerHTML =
        '<div class="layout-vertical">' +
            '<div class="archv-layer" id="layer-presentation">' +
                '<div class="archv-layer-name">Presentation Layer</div>' +
                '<div class="archv-components">' +
                    ARCHV.renderComponent('comp-entry', entryLabel, entryIcon) +
                    ARCHV.renderComponent('comp-request-dto', 'Request DTO', '&#x1F4E6;') +
                    ARCHV.renderComponent('comp-response-dto', 'Response DTO', '&#x1F4E4;') +
                '</div>' +
            '</div>' +
            ARCHV.renderArrowConnector('depends on') +
            '<div class="archv-layer" id="layer-application">' +
                '<div class="archv-layer-name">Application Layer</div>' +
                '<div class="archv-components">' +
                    ARCHV.renderComponent('comp-usecase', 'UseCase', '&#x2699;') +
                    ARCHV.renderComponent('comp-app-service', 'AppService', '&#x1F527;') +
                    ARCHV.renderComponent('comp-command', 'Command', '&#x1F4DD;') +
                '</div>' +
            '</div>' +
            ARCHV.renderArrowConnector('depends on') +
            '<div class="archv-layer" id="layer-domain">' +
                '<div class="archv-layer-name">Domain Layer</div>' +
                '<div class="archv-components">' +
                    ARCHV.renderComponent('comp-domain-service', 'DomainService', '&#x1F3AF;') +
                    ARCHV.renderComponent('comp-entity', 'Entity', '&#x1F4CB;') +
                    ARCHV.renderComponent('comp-value-object', 'ValueObject', '&#x1F4CE;') +
                    ARCHV.renderComponent('comp-repo-interface', 'Repository (I)', '&#x1F4C2;') +
                    ARCHV.renderComponent('comp-event-dispatcher-interface', 'EventDispatcher (I)', '&#x1F4E1;') +
                    ARCHV.renderComponent('comp-domain-event', 'DomainEvent', '&#x1F514;') +
                '</div>' +
            '</div>' +
            ARCHV.renderArrowConnector('implements') +
            '<div class="archv-layer" id="layer-infrastructure">' +
                '<div class="archv-layer-name">Infrastructure Layer</div>' +
                '<div class="archv-components">' +
                    ARCHV.renderComponent('comp-repo-impl', 'RepositoryImpl', '&#x1F5C4;') +
                    ARCHV.renderComponent('comp-db-adapter', 'DatabaseAdapter', '&#x1F4BE;') +
                    ARCHV.renderComponent('comp-cache-adapter', 'CacheAdapter', '&#x26A1;') +
                    ARCHV.renderComponent('comp-event-dispatcher', 'EventDispatcher', '&#x1F4E1;') +
                '</div>' +
            '</div>' +
        '</div>';
}

ARCHV.layered.details = {
    http: {
        principles: [
            'Strict top-down dependency: each layer depends only on the layer directly below it',
            'Separation of Concerns: Presentation handles I/O, Application orchestrates, Domain owns rules, Infrastructure persists',
            'Domain Layer is independent: no references to frameworks, databases, or transport',
            'Dependency Inversion: Domain defines interfaces (Repository, EventDispatcher), Infrastructure implements them',
            'Each layer can be replaced independently without affecting the others'
        ],
        concepts: [
            { term: 'Controller', definition: 'Entry point in the Presentation layer. Receives HTTP request, maps input to DTO, delegates to UseCase, returns Response.' },
            { term: 'UseCase', definition: 'Application layer orchestrator. Receives a DTO, creates a Command, coordinates domain services and persistence.' },
            { term: 'Command', definition: 'Immutable data object representing an intent to change state. Created by UseCase from the incoming DTO.' },
            { term: 'DomainEvent', definition: 'Record of something that happened in the domain. Dispatched after persistence through the EventDispatcher interface.' },
            { term: 'Repository (I)', definition: 'Interface defined in Domain layer. Abstracts persistence so domain logic never depends on storage details.' }
        ]
    },
    console: {
        principles: [
            'Strict top-down dependency: each layer depends only on the layer directly below it',
            'Separation of Concerns: Presentation handles I/O, Application orchestrates, Domain owns rules, Infrastructure persists',
            'Domain Layer is independent: no references to frameworks, databases, or transport',
            'Console and HTTP share the same Application and Domain layers — only Presentation differs',
            'Value Objects enforce business constraints at the domain boundary, not in the UI layer'
        ],
        concepts: [
            { term: 'ConsoleCommand', definition: 'Presentation layer entry point for CLI. Parses arguments, builds DTO, delegates to AppService.' },
            { term: 'AppService', definition: 'Application layer service that orchestrates UseCase execution and cross-cutting concerns.' },
            { term: 'ValueObject', definition: 'Immutable domain object defined by its attributes. Encapsulates validation and equality logic.' },
            { term: 'CacheAdapter', definition: 'Infrastructure component that implements caching. Domain and Application layers never reference it directly.' }
        ]
    },
    message: {
        principles: [
            'Strict top-down dependency: each layer depends only on the layer directly below it',
            'Separation of Concerns: Presentation handles I/O, Application orchestrates, Domain owns rules, Infrastructure persists',
            'Domain Layer is independent: no references to frameworks, databases, or transport',
            'Asynchronous entry points follow the same layered flow as synchronous ones',
            'Domain events are dispatched through an interface defined in the Domain layer, resolved in Infrastructure'
        ],
        concepts: [
            { term: 'MessageConsumer', definition: 'Presentation layer handler for async messages. Deserializes payload into a DTO and delegates to AppService.' },
            { term: 'DomainService', definition: 'Stateless service in the Domain layer that coordinates logic spanning multiple Entities or Value Objects.' },
            { term: 'EventDispatcher (I)', definition: 'Interface in the Domain layer for publishing domain events. Infrastructure provides the concrete implementation.' },
            { term: 'EventDispatcher', definition: 'Infrastructure implementation that delivers domain events to subscribers (queue, bus, or in-process handlers).' }
        ]
    }
};

ARCHV.layered.http = {
    init: function() {
        renderLayered('&#x1F310;', 'Controller');
    },
    run: function() {
        ARCHV.animateFlow([
            { elementId: 'comp-entry', label: 'Controller', description: 'HTTP request received', logType: 'REQUEST', layerId: 'layer-presentation' },
            { elementId: 'comp-request-dto', label: 'Request DTO', description: 'Map input to typed DTO', logType: 'LAYER', layerId: 'layer-presentation' },
            { elementId: 'comp-usecase', label: 'UseCase', description: 'Receive DTO, create command', logType: 'LAYER', layerId: 'layer-application' },
            { elementId: 'comp-command', label: 'Command', description: 'CreateOrderCommand created from DTO', logType: 'COMMAND', layerId: 'layer-application' },
            { elementId: 'comp-app-service', label: 'AppService', description: 'Delegate to domain services', logType: 'LAYER', layerId: 'layer-application' },
            { elementId: 'comp-domain-service', label: 'DomainService', description: 'Coordinate domain logic', logType: 'LAYER', layerId: 'layer-domain' },
            { elementId: 'comp-entity', label: 'Entity', description: 'Apply business rules, collect events', logType: 'LAYER', layerId: 'layer-domain' },
            { elementId: 'comp-repo-interface', label: 'Repository (I)', description: 'Call repository interface', logType: 'LAYER', layerId: 'layer-domain' },
            { elementId: 'comp-repo-impl', label: 'RepositoryImpl', description: 'Persist via implementation', logType: 'LAYER', layerId: 'layer-infrastructure' },
            { elementId: 'comp-db-adapter', label: 'DatabaseAdapter', description: 'Execute SQL query', logType: 'LAYER', layerId: 'layer-infrastructure' },
            { elementId: 'comp-usecase', label: 'UseCase', description: 'Collect domain events from Entity', logType: 'LAYER', layerId: 'layer-application' },
            { elementId: 'comp-event-dispatcher-interface', label: 'EventDispatcher (I)', description: 'Dispatch events via domain interface', logType: 'EVENT', layerId: 'layer-domain' },
            { elementId: 'comp-event-dispatcher', label: 'EventDispatcher', description: 'Infrastructure dispatches domain events', logType: 'EVENT', layerId: 'layer-infrastructure' },
            { elementId: 'comp-usecase', label: 'UseCase', description: 'Return operation result', logType: 'RESPONSE', layerId: 'layer-application' },
            { elementId: 'comp-entry', label: 'Controller', description: 'Map result to response', logType: 'RESPONSE', layerId: 'layer-presentation' },
            { elementId: 'comp-response-dto', label: 'Response DTO', description: 'Build HTTP response body', logType: 'RESPONSE', layerId: 'layer-presentation' }
        ], { requestLabel: 'HTTP POST /api/orders' });
    }
};

ARCHV.layered.console = {
    init: function() {
        renderLayered('&#x1F4BB;', 'ConsoleCommand');
    },
    run: function() {
        ARCHV.animateFlow([
            { elementId: 'comp-entry', label: 'ConsoleCommand', description: 'CLI command received', logType: 'REQUEST', layerId: 'layer-presentation' },
            { elementId: 'comp-request-dto', label: 'Request DTO', description: 'Parse CLI arguments to DTO', logType: 'LAYER', layerId: 'layer-presentation' },
            { elementId: 'comp-app-service', label: 'AppService', description: 'Orchestrate use case execution', logType: 'LAYER', layerId: 'layer-application' },
            { elementId: 'comp-usecase', label: 'UseCase', description: 'Execute business operation', logType: 'LAYER', layerId: 'layer-application' },
            { elementId: 'comp-entity', label: 'Entity', description: 'Apply business rules', logType: 'LAYER', layerId: 'layer-domain' },
            { elementId: 'comp-value-object', label: 'ValueObject', description: 'Validate value constraints', logType: 'LAYER', layerId: 'layer-domain' },
            { elementId: 'comp-repo-interface', label: 'Repository (I)', description: 'Call repository interface', logType: 'LAYER', layerId: 'layer-domain' },
            { elementId: 'comp-repo-impl', label: 'RepositoryImpl', description: 'Persist via implementation', logType: 'LAYER', layerId: 'layer-infrastructure' },
            { elementId: 'comp-cache-adapter', label: 'CacheAdapter', description: 'Update cache', logType: 'LAYER', layerId: 'layer-infrastructure' },
            { elementId: 'comp-usecase', label: 'UseCase', description: 'Return operation result', logType: 'RESPONSE', layerId: 'layer-application' },
            { elementId: 'comp-app-service', label: 'AppService', description: 'Return orchestrated result', logType: 'RESPONSE', layerId: 'layer-application' },
            { elementId: 'comp-entry', label: 'ConsoleCommand', description: 'Format output for console', logType: 'RESPONSE', layerId: 'layer-presentation' },
            { elementId: 'comp-response-dto', label: 'Response DTO', description: 'Print console output', logType: 'RESPONSE', layerId: 'layer-presentation' }
        ], { requestLabel: 'CLI: app:sync-users' });
    }
};

ARCHV.layered.message = {
    init: function() {
        renderLayered('&#x1F4E9;', 'MessageConsumer');
    },
    run: function() {
        ARCHV.animateFlow([
            { elementId: 'comp-entry', label: 'MessageConsumer', description: 'Message consumed from queue', logType: 'REQUEST', layerId: 'layer-presentation' },
            { elementId: 'comp-request-dto', label: 'Request DTO', description: 'Deserialize message payload', logType: 'LAYER', layerId: 'layer-presentation' },
            { elementId: 'comp-app-service', label: 'AppService', description: 'Handle async operation', logType: 'LAYER', layerId: 'layer-application' },
            { elementId: 'comp-usecase', label: 'UseCase', description: 'Execute business logic', logType: 'LAYER', layerId: 'layer-application' },
            { elementId: 'comp-app-service', label: 'AppService', description: 'Delegate to domain services', logType: 'LAYER', layerId: 'layer-application' },
            { elementId: 'comp-domain-service', label: 'DomainService', description: 'Coordinate domain logic', logType: 'LAYER', layerId: 'layer-domain' },
            { elementId: 'comp-entity', label: 'Entity', description: 'Process domain rules', logType: 'LAYER', layerId: 'layer-domain' },
            { elementId: 'comp-repo-interface', label: 'Repository (I)', description: 'Call repository', logType: 'LAYER', layerId: 'layer-domain' },
            { elementId: 'comp-repo-impl', label: 'RepositoryImpl', description: 'Save to database', logType: 'LAYER', layerId: 'layer-infrastructure' },
            { elementId: 'comp-usecase', label: 'UseCase', description: 'Collect domain events from Entity', logType: 'LAYER', layerId: 'layer-application' },
            { elementId: 'comp-event-dispatcher-interface', label: 'EventDispatcher (I)', description: 'Dispatch events via domain interface', logType: 'EVENT', layerId: 'layer-domain' },
            { elementId: 'comp-event-dispatcher', label: 'EventDispatcher', description: 'Infrastructure dispatches domain events', logType: 'EVENT', layerId: 'layer-infrastructure' }
        ], { requestLabel: 'Message: order.created' });
    }
};
