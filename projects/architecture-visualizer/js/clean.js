/* ===== Clean Architecture ===== */

ARCHV.clean = {};

ARCHV.clean.modes = [
    { id: 'http', label: 'HTTP Request', desc: 'Request flows inward through concentric rings: Frameworks & Drivers → Interface Adapters → Use Cases → Entities. The response flows back outward through OutputBoundary and Presenter. Dependencies always point inward — the Dependency Rule is the overriding principle.' },
    { id: 'console', label: 'Console Command', desc: 'Console command enters through the outermost ring (Frameworks) and flows inward through adapters, InputBoundary, and use cases to entities. The same Dependency Rule applies — inner layers never reference outer layers.' },
    { id: 'message', label: 'Message Consumer', desc: 'Async message arrives at the Frameworks ring, flows through Interface Adapters and InputBoundary to Use Cases and Entities. Output returns via OutputBoundary and Presenter through the outer rings.' }
];

ARCHV.clean.depRules = [
    { from: 'Frameworks & Drivers', to: 'Interface Adapters', allowed: true },
    { from: 'Interface Adapters', to: 'Use Cases', allowed: true },
    { from: 'Use Cases', to: 'Entities', allowed: true },
    { from: 'Entities', to: 'Use Cases', allowed: false },
    { from: 'Use Cases', to: 'Interface Adapters', allowed: false },
    { from: 'Interface Adapters', to: 'Frameworks & Drivers', allowed: false },
    { from: 'Entities', to: 'Frameworks & Drivers', allowed: false }
];

function renderCleanComponent(id, name, icon, angleDeg, ringSize, tooltip) {
    var rad = angleDeg * Math.PI / 180;
    var r = (ringSize / 2) - 30;
    var cx = ringSize / 2;
    var cy = ringSize / 2;
    var px = cx + r * Math.cos(rad);
    var py = cy + r * Math.sin(rad);
    var leftPct = (px / ringSize * 100).toFixed(1);
    var topPct = (py / ringSize * 100).toFixed(1);
    return '<span class="archv-component archv-ring-component" id="' + id + '" ' +
        (tooltip ? 'data-tooltip="' + tooltip.replace(/"/g, '&quot;') + '" ' : '') +
        'style="left:' + leftPct + '%;top:' + topPct + '%;">' +
        (icon ? '<span class="comp-icon">' + icon + '</span>' : '') +
        name + '</span>';
}

function renderClean(entryIcon, entryLabel, outputLabel, outputIcon) {
    var outLabel = outputLabel || 'Web/UI';
    var outIcon = outputIcon || '&#x1F5A5;';
    var canvas = document.getElementById('archv-canvas');
    canvas.innerHTML =
        '<div class="layout-concentric">' +
            '<div class="archv-ring ring-3" id="ring-frameworks">' +
                '<span class="archv-ring-label">Frameworks & Drivers</span>' +
                renderCleanComponent('comp-cl-framework', entryLabel, entryIcon, 205, 520, 'Outermost ring: frameworks and drivers are thin glue code, easily replaceable') +
                renderCleanComponent('comp-cl-db', 'Database', '&#x1F4BE;', 60, 520, 'External storage detail in the outermost ring, accessed only through Gateways') +
                renderCleanComponent('comp-cl-ui', outLabel, outIcon, 310, 520, 'Output delivery mechanism in the outermost ring, renders ViewModel data') +
            '</div>' +
            '<div class="archv-ring ring-2" id="ring-adapters">' +
                '<span class="archv-ring-label">Interface Adapters</span>' +
                renderCleanComponent('comp-cl-controller', 'Controller', '&#x1F3AE;', 185, 410, 'Adapter translating input into request DTOs and calling InputBoundary') +
                renderCleanComponent('comp-cl-presenter', 'Presenter', '&#x1F4CA;', 310, 410, 'Adapter implementing OutputBoundary, converts use case output to ViewModel') +
                renderCleanComponent('comp-cl-viewmodel', 'ViewModel', '&#x1F4CB;', 345, 410, 'Plain data structure with display-ready data, no business logic') +
                renderCleanComponent('comp-cl-gateway', 'Gateway', '&#x1F6AA;', 95, 410, 'Adapter implementing repository interfaces for data access operations') +
            '</div>' +
            '<div class="archv-ring ring-1" id="ring-usecases">' +
                '<span class="archv-ring-label">Use Cases</span>' +
                renderCleanComponent('comp-cl-input-boundary', 'InputBoundary (I)', '&#x1F6E1;', 150, 290, 'Interface for incoming requests. Controllers call this to invoke use cases.') +
                renderCleanComponent('comp-cl-usecase', 'UseCase', '&#x2699;', 90, 290, 'Application-specific business logic orchestrator at the center') +
                renderCleanComponent('comp-cl-output-boundary', 'OutputBoundary (I)', '&#x1F4E4;', 10, 290, 'Interface for outgoing results. UseCase calls this to pass data outward.') +
            '</div>' +
            '<div class="archv-ring ring-0" id="ring-entities">' +
                '<span class="archv-ring-label">Entities</span>' +
                '<span class="archv-component archv-ring-component" id="comp-cl-entity" ' +
                    'data-tooltip="Enterprise-wide business rules at the innermost core, independent of everything" ' +
                    'style="left:50%;top:45%;">' +
                    '<span class="comp-icon">&#x1F4CB;</span>Entity</span>' +
            '</div>' +
            '<span class="archv-dep-direction" style="position:absolute;bottom:-20px;left:50%;transform:translateX(-50%);font-size:10px;color:#8892a4;letter-spacing:0.5px;white-space:nowrap;">' +
                '&#x27A1; Dependencies point INWARD &#x2B05;' +
            '</span>' +
        '</div>';
}

ARCHV.clean.details = {
    http: {
        principles: [
            'The Dependency Rule: source code dependencies must point only inward — inner rings never reference outer rings',
            'Entities encapsulate enterprise-wide business rules, independent of any application or framework',
            'Use Cases contain application-specific business rules and orchestrate data flow to and from Entities',
            'Interface Adapters convert data between the format used by Use Cases/Entities and the format needed by external agents (DB, Web, UI)',
            'Frameworks & Drivers are the outermost ring — they are kept as thin as possible and serve as glue code',
            'Boundaries are crossed via interfaces (InputBoundary, OutputBoundary) so inner layers stay decoupled from outer layers'
        ],
        concepts: [
            { term: 'InputBoundary', definition: 'Interface defined in the Use Cases ring. Controllers call this interface to invoke a use case, ensuring the adapter layer never leaks into business logic.' },
            { term: 'OutputBoundary', definition: 'Interface defined in the Use Cases ring. UseCase calls this to pass results outward, so it never depends on Presenter or UI details.' },
            { term: 'Presenter', definition: 'Interface Adapter that implements OutputBoundary. Converts use case output into a ViewModel suitable for the view layer.' },
            { term: 'Gateway', definition: 'Interface Adapter implementing repository interfaces defined by Use Cases. Translates between domain objects and database operations.' },
            { term: 'ViewModel', definition: 'Plain data structure created by the Presenter. Contains only display-ready data — no business logic, no framework dependencies.' }
        ],
        tradeoffs: {
            pros: [
                'Highly testable — business logic is isolated from frameworks and infrastructure',
                'Framework-independent — swap frameworks without touching domain or use cases',
                'Domain-focused — entities and use cases are at the center, not infrastructure',
                'Clear dependency rules make it easy to reason about code boundaries'
            ],
            cons: [
                'More code and abstractions (boundaries, presenters, gateways) than simpler architectures',
                'Mapping overhead between layers (DTOs, ViewModels, domain objects)',
                'Can feel over-engineered for simple CRUD applications',
                'Steeper onboarding curve for developers unfamiliar with the pattern'
            ],
            whenToUse: 'Best for long-lived projects where framework independence matters, complex domains requiring thorough testing, and systems where you expect the delivery mechanism or infrastructure to change over time.'
        }
    },
    console: {
        principles: [
            'The Dependency Rule: source code dependencies must point only inward — inner rings never reference outer rings',
            'Console and HTTP share the same Use Cases and Entities — only the outer rings differ',
            'The CLI Framework is a detail in the outermost ring, easily replaceable without touching business logic',
            'InputBoundary ensures that the Controller (adapter) never couples to the concrete UseCase implementation',
            'OutputBoundary allows the UseCase to return results without knowing whether output goes to a terminal, web page, or file'
        ],
        concepts: [
            { term: 'CLI Framework', definition: 'Outermost ring component (Frameworks & Drivers). Provides argument parsing, command routing, and I/O — treated as a replaceable detail.' },
            { term: 'Controller', definition: 'Interface Adapter that translates CLI arguments into a request DTO and calls InputBoundary. Decouples the framework from application logic.' },
            { term: 'UseCase', definition: 'Application-specific business rule orchestrator. Receives input via InputBoundary, interacts with Entities, and returns results via OutputBoundary.' },
            { term: 'Entity', definition: 'Enterprise-wide business object at the core. Contains critical business rules that are the least likely to change when something external changes.' }
        ],
        tradeoffs: {
            pros: [
                'Highly testable — business logic is isolated from frameworks and infrastructure',
                'Framework-independent — swap frameworks without touching domain or use cases',
                'Domain-focused — entities and use cases are at the center, not infrastructure',
                'Clear dependency rules make it easy to reason about code boundaries'
            ],
            cons: [
                'More code and abstractions (boundaries, presenters, gateways) than simpler architectures',
                'Mapping overhead between layers (DTOs, ViewModels, domain objects)',
                'Can feel over-engineered for simple CRUD applications',
                'Steeper onboarding curve for developers unfamiliar with the pattern'
            ],
            whenToUse: 'Best for long-lived projects where framework independence matters, complex domains requiring thorough testing, and systems where you expect the delivery mechanism or infrastructure to change over time.'
        }
    },
    message: {
        principles: [
            'The Dependency Rule: source code dependencies must point only inward — inner rings never reference outer rings',
            'Async message processing follows the same ring structure as synchronous requests — transport is a detail',
            'The Queue Driver is a framework detail in the outermost ring, interchangeable without modifying business logic',
            'Boundaries (InputBoundary, OutputBoundary) ensure that messaging infrastructure never leaks into Use Cases or Entities',
            'Entities remain pure regardless of whether they are invoked by HTTP, CLI, or message — that is the power of the Dependency Rule'
        ],
        concepts: [
            { term: 'Queue Driver', definition: 'Outermost ring component that receives messages from a broker (RabbitMQ, Kafka, SQS). A framework detail, easily swappable.' },
            { term: 'InputBoundary', definition: 'Interface in the Use Cases ring. The message Controller calls this to trigger use case logic, keeping the queue driver decoupled.' },
            { term: 'OutputBoundary', definition: 'Interface in the Use Cases ring. UseCase pushes results outward through this boundary — the Presenter decides how to format the acknowledgment.' },
            { term: 'Presenter', definition: 'Interface Adapter that formats the use case output into an acknowledgment or event payload, without the UseCase knowing the delivery mechanism.' }
        ],
        tradeoffs: {
            pros: [
                'Highly testable — business logic is isolated from frameworks and infrastructure',
                'Framework-independent — swap frameworks without touching domain or use cases',
                'Domain-focused — entities and use cases are at the center, not infrastructure',
                'Clear dependency rules make it easy to reason about code boundaries'
            ],
            cons: [
                'More code and abstractions (boundaries, presenters, gateways) than simpler architectures',
                'Mapping overhead between layers (DTOs, ViewModels, domain objects)',
                'Can feel over-engineered for simple CRUD applications',
                'Steeper onboarding curve for developers unfamiliar with the pattern'
            ],
            whenToUse: 'Best for long-lived projects where framework independence matters, complex domains requiring thorough testing, and systems where you expect the delivery mechanism or infrastructure to change over time.'
        }
    }
};

ARCHV.clean.http = {
    init: function() { renderClean('&#x1F310;', 'HTTP Server'); },
    steps: function() {
        return [
            { elementId: 'comp-cl-framework', label: 'HTTP Server', description: 'Request enters framework layer', logType: 'REQUEST', layerId: 'ring-frameworks' },
            { elementId: 'comp-cl-controller', label: 'Controller', description: 'Parse input, create Request DTO', logType: 'LAYER', layerId: 'ring-adapters' },
            { elementId: 'comp-cl-input-boundary', label: 'InputBoundary', description: 'Cross boundary via interface (Controller → UseCase)', logType: 'LAYER', layerId: 'ring-usecases' },
            { elementId: 'comp-cl-usecase', label: 'UseCase', description: 'Execute application logic', logType: 'LAYER', layerId: 'ring-usecases' },
            { elementId: 'comp-cl-entity', label: 'Entity', description: 'Apply enterprise business rules', logType: 'LAYER', layerId: 'ring-entities' },
            { elementId: 'comp-cl-gateway', label: 'Gateway', description: 'Persist via repository interface', logType: 'LAYER', layerId: 'ring-adapters' },
            { elementId: 'comp-cl-db', label: 'Database', description: 'Save to database', logType: 'LAYER', layerId: 'ring-frameworks' },
            { elementId: 'comp-cl-usecase', label: 'UseCase', description: 'Receive result, call OutputBoundary', logType: 'RESPONSE', layerId: 'ring-usecases' },
            { elementId: 'comp-cl-output-boundary', label: 'OutputBoundary', description: 'Cross boundary via interface (UseCase → Presenter)', logType: 'RESPONSE', layerId: 'ring-usecases' },
            { elementId: 'comp-cl-presenter', label: 'Presenter', description: 'Format output into ViewModel', logType: 'RESPONSE', layerId: 'ring-adapters' },
            { elementId: 'comp-cl-viewmodel', label: 'ViewModel', description: 'Data structure for view rendering', logType: 'RESPONSE', layerId: 'ring-adapters' },
            { elementId: 'comp-cl-ui', label: 'Web/UI', description: 'Render ViewModel response', logType: 'RESPONSE', layerId: 'ring-frameworks' }
        ];
    },
    stepOptions: function() { return { requestLabel: 'HTTP GET /api/users/1' }; },
    run: function() {
        ARCHV.animateFlow(ARCHV.clean.http.steps(), ARCHV.clean.http.stepOptions());
    }
};

ARCHV.clean.console = {
    init: function() { renderClean('&#x1F4BB;', 'CLI Framework', 'Console', '&#x1F4BB;'); },
    steps: function() {
        return [
            { elementId: 'comp-cl-framework', label: 'CLI Framework', description: 'Console command received', logType: 'REQUEST', layerId: 'ring-frameworks' },
            { elementId: 'comp-cl-controller', label: 'Controller', description: 'Parse CLI arguments', logType: 'LAYER', layerId: 'ring-adapters' },
            { elementId: 'comp-cl-input-boundary', label: 'InputBoundary', description: 'Cross boundary via interface', logType: 'LAYER', layerId: 'ring-usecases' },
            { elementId: 'comp-cl-usecase', label: 'UseCase', description: 'Execute use case logic', logType: 'LAYER', layerId: 'ring-usecases' },
            { elementId: 'comp-cl-entity', label: 'Entity', description: 'Apply business rules', logType: 'LAYER', layerId: 'ring-entities' },
            { elementId: 'comp-cl-gateway', label: 'Gateway', description: 'Data access via interface', logType: 'LAYER', layerId: 'ring-adapters' },
            { elementId: 'comp-cl-db', label: 'Database', description: 'Query database', logType: 'LAYER', layerId: 'ring-frameworks' },
            { elementId: 'comp-cl-usecase', label: 'UseCase', description: 'Receive result, call OutputBoundary', logType: 'RESPONSE', layerId: 'ring-usecases' },
            { elementId: 'comp-cl-output-boundary', label: 'OutputBoundary', description: 'Cross boundary via interface', logType: 'RESPONSE', layerId: 'ring-usecases' },
            { elementId: 'comp-cl-presenter', label: 'Presenter', description: 'Format CLI output', logType: 'RESPONSE', layerId: 'ring-adapters' },
            { elementId: 'comp-cl-viewmodel', label: 'ViewModel', description: 'Data structure for CLI display', logType: 'RESPONSE', layerId: 'ring-adapters' },
            { elementId: 'comp-cl-ui', label: 'Console', description: 'Print output to console', logType: 'RESPONSE', layerId: 'ring-frameworks' }
        ];
    },
    stepOptions: function() { return { requestLabel: 'CLI: migrate:run' }; },
    run: function() {
        ARCHV.animateFlow(ARCHV.clean.console.steps(), ARCHV.clean.console.stepOptions());
    }
};

ARCHV.clean.message = {
    init: function() { renderClean('&#x1F4E9;', 'Queue Driver', 'Queue ACK', '&#x2705;'); },
    steps: function() {
        return [
            { elementId: 'comp-cl-framework', label: 'Queue Driver', description: 'Message from queue', logType: 'REQUEST', layerId: 'ring-frameworks' },
            { elementId: 'comp-cl-controller', label: 'Controller', description: 'Deserialize message payload', logType: 'LAYER', layerId: 'ring-adapters' },
            { elementId: 'comp-cl-input-boundary', label: 'InputBoundary', description: 'Cross boundary via interface', logType: 'LAYER', layerId: 'ring-usecases' },
            { elementId: 'comp-cl-usecase', label: 'UseCase', description: 'Handle async task', logType: 'LAYER', layerId: 'ring-usecases' },
            { elementId: 'comp-cl-entity', label: 'Entity', description: 'Apply domain logic', logType: 'LAYER', layerId: 'ring-entities' },
            { elementId: 'comp-cl-gateway', label: 'Gateway', description: 'Persist changes via interface', logType: 'LAYER', layerId: 'ring-adapters' },
            { elementId: 'comp-cl-db', label: 'Database', description: 'Write to storage', logType: 'LAYER', layerId: 'ring-frameworks' },
            { elementId: 'comp-cl-usecase', label: 'UseCase', description: 'Receive result, call OutputBoundary', logType: 'RESPONSE', layerId: 'ring-usecases' },
            { elementId: 'comp-cl-output-boundary', label: 'OutputBoundary', description: 'Cross boundary via interface', logType: 'RESPONSE', layerId: 'ring-usecases' },
            { elementId: 'comp-cl-presenter', label: 'Presenter', description: 'Format acknowledgment', logType: 'RESPONSE', layerId: 'ring-adapters' },
            { elementId: 'comp-cl-viewmodel', label: 'ViewModel', description: 'Data structure for response output', logType: 'RESPONSE', layerId: 'ring-adapters' },
            { elementId: 'comp-cl-ui', label: 'Queue ACK', description: 'Acknowledge message to broker', logType: 'RESPONSE', layerId: 'ring-frameworks' }
        ];
    },
    stepOptions: function() { return { requestLabel: 'Message: user.registered' }; },
    run: function() {
        ARCHV.animateFlow(ARCHV.clean.message.steps(), ARCHV.clean.message.stepOptions());
    }
};