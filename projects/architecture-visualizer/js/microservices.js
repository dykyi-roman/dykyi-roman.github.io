/* ===== Microservices Architecture ===== */

ARCHV.microservices = {};

ARCHV.microservices.modes = [
    { id: 'sync', label: 'Sync (REST/gRPC)', desc: 'Synchronous request flows through the API Gateway to individual services. The gateway authenticates, routes, and aggregates responses. Services communicate via REST or gRPC through the gateway — never directly.' },
    { id: 'async', label: 'Async (Events)', desc: 'Event-driven communication between services via a Message Bus. Services publish domain events after state changes. Other services consume relevant events and react independently. No direct service-to-service calls.' },
    { id: 'saga', label: 'Saga Pattern', desc: 'Distributed transaction coordinated by a Saga Orchestrator. Each step is a local transaction in a service. On failure, compensating transactions are executed in reverse order to maintain data consistency.' }
];

ARCHV.microservices.depRules = [
    { from: 'API Gateway', to: 'Any Service', allowed: true },
    { from: 'Service', to: 'Service (via Gateway)', allowed: true },
    { from: 'Service', to: 'Service (direct)', allowed: false },
    { from: 'Service', to: 'Database (own)', allowed: true },
    { from: 'Service', to: 'Database (other)', allowed: false }
];

function renderMicroservices(mode) {
    var canvas = document.getElementById('archv-canvas');
    var meshLabel = mode === 'sync' ? 'Service Mesh' : 'Message Bus';
    var meshIcon = mode === 'sync' ? '&#x1F310;' : '&#x1F4E1;';

    canvas.innerHTML =
        '<div class="layout-microservices">' +
            '<div class="archv-ms-gateway" id="ms-gateway-area">' +
                ARCHV.renderComponent('comp-ms-gateway', 'API Gateway', '&#x1F6E1;', 'Single entry point for all client requests. Handles routing, authentication, rate limiting, and response aggregation.') +
            '</div>' +
            '<div class="archv-ms-mesh" id="ms-mesh">' +
                ARCHV.renderComponent('comp-ms-mesh', meshLabel, meshIcon, mode === 'sync' ? 'Service discovery, load balancing, circuit breaking, and observability between services.' : 'Asynchronous message routing between services. Ensures decoupling and reliable event delivery.') +
            '</div>' +
            '<div class="archv-ms-services" id="ms-services">' +
                '<div class="archv-ms-service-box" id="svc-user">' +
                    '<div class="archv-ms-service-label">User Service</div>' +
                    '<div class="archv-ms-service-components">' +
                        ARCHV.renderComponent('comp-ms-user-svc', 'User Service', '&#x1F464;', 'Manages user accounts, authentication, and profile data. Owns its own user database.') +
                    '</div>' +
                '</div>' +
                '<div class="archv-ms-service-box" id="svc-order">' +
                    '<div class="archv-ms-service-label">Order Service</div>' +
                    '<div class="archv-ms-service-components">' +
                        ARCHV.renderComponent('comp-ms-order-svc', 'Order Service', '&#x1F6D2;', 'Handles order creation, status tracking, and order lifecycle management. Owns the orders database.') +
                    '</div>' +
                '</div>' +
                '<div class="archv-ms-service-box" id="svc-payment">' +
                    '<div class="archv-ms-service-label">Payment Service</div>' +
                    '<div class="archv-ms-service-components">' +
                        ARCHV.renderComponent('comp-ms-payment-svc', 'Payment Service', '&#x1F4B3;', 'Processes payments, manages transactions, and handles refunds. Owns the payments database.') +
                    '</div>' +
                '</div>' +
                '<div class="archv-ms-service-box" id="svc-notification">' +
                    '<div class="archv-ms-service-label">Notification Service</div>' +
                    '<div class="archv-ms-service-components">' +
                        ARCHV.renderComponent('comp-ms-notification-svc', 'Notification Service', '&#x1F514;', 'Sends emails, SMS, and push notifications. Reacts to domain events from other services.') +
                    '</div>' +
                '</div>' +
                '<div class="archv-ms-service-box" id="svc-inventory">' +
                    '<div class="archv-ms-service-label">Inventory Service</div>' +
                    '<div class="archv-ms-service-components">' +
                        ARCHV.renderComponent('comp-ms-inventory-svc', 'Inventory Service', '&#x1F4E6;', 'Manages product stock levels, reservations, and warehouse operations. Owns the inventory database.') +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';
}

ARCHV.microservices.details = {
    sync: {
        principles: [
            'API Gateway is the single entry point — clients never call services directly',
            'Each service owns its data store (Database per Service pattern)',
            'Service Mesh handles cross-cutting concerns: discovery, load balancing, circuit breaking',
            'Synchronous calls create temporal coupling — caller waits for response',
            'Use timeouts, retries, and circuit breakers to handle failures gracefully'
        ],
        concepts: [
            { term: 'API Gateway', definition: 'Reverse proxy that routes requests to appropriate services, handles authentication, rate limiting, and response aggregation.' },
            { term: 'Service Mesh', definition: 'Infrastructure layer (e.g., Istio, Linkerd) managing service-to-service communication: discovery, load balancing, TLS, observability.' },
            { term: 'Circuit Breaker', definition: 'Pattern that prevents cascading failures by detecting failures and short-circuiting calls to unhealthy services.' },
            { term: 'Database per Service', definition: 'Each microservice owns its private database. No direct database sharing between services.' }
        ],
        tradeoffs: {
            pros: [
                'Simple request-response model, easy to understand and debug',
                'Strong consistency within a single request chain',
                'Familiar HTTP/gRPC tooling and infrastructure',
                'Straightforward error handling with status codes'
            ],
            cons: [
                'Temporal coupling — caller is blocked until all downstream services respond',
                'Cascading failures if one service is slow or unavailable',
                'Increased latency with each hop in the call chain',
                'Tight coupling through API contracts'
            ],
            whenToUse: 'Best for queries and operations that need immediate, consistent responses. Use when the client expects a synchronous result and the call chain is short (2-3 hops max).'
        }
    },
    async: {
        principles: [
            'Services communicate via events — no direct service-to-service calls',
            'Message Bus ensures reliable delivery and decouples producers from consumers',
            'Each service reacts to events it cares about independently',
            'Eventual consistency — state converges over time, not immediately',
            'Events are immutable facts describing what happened, not commands'
        ],
        concepts: [
            { term: 'Domain Event', definition: 'An immutable record of something that happened in a service (e.g., OrderCreated, PaymentProcessed).' },
            { term: 'Message Bus', definition: 'Infrastructure (e.g., Kafka, RabbitMQ) that routes events from producers to interested consumers.' },
            { term: 'Eventual Consistency', definition: 'Data across services will become consistent over time as events are processed, but may be temporarily inconsistent.' },
            { term: 'Idempotency', definition: 'Consumers must handle duplicate events safely. Processing the same event twice should produce the same result.' }
        ],
        tradeoffs: {
            pros: [
                'Loose coupling — services are fully independent',
                'High resilience — failures in one service do not cascade',
                'Better scalability — services process events at their own pace',
                'Natural audit trail from event streams'
            ],
            cons: [
                'Eventual consistency makes reasoning about state harder',
                'Debugging distributed event flows is challenging',
                'Message ordering and duplicate handling add complexity',
                'No immediate response to the caller'
            ],
            whenToUse: 'Best for workflows where services can react independently and immediate consistency is not required. Ideal for high-throughput systems with varying processing speeds.'
        }
    },
    saga: {
        principles: [
            'Distributed transactions are broken into a sequence of local transactions',
            'Each step has a compensating transaction to undo its effects on failure',
            'Saga Orchestrator coordinates the sequence and handles failures',
            'No distributed locks — each service commits locally',
            'Compensations must be idempotent and safe to retry'
        ],
        concepts: [
            { term: 'Saga Orchestrator', definition: 'Central coordinator that manages the saga workflow: sends commands, waits for replies, triggers compensations on failure.' },
            { term: 'Compensating Transaction', definition: 'An operation that semantically undoes a previously committed transaction (e.g., refund payment, release inventory).' },
            { term: 'Local Transaction', definition: 'Each service commits changes to its own database independently, without a global distributed transaction.' },
            { term: 'Saga Step', definition: 'A single local transaction in the saga sequence. Each step has a corresponding compensation action.' }
        ],
        tradeoffs: {
            pros: [
                'Maintains data consistency across services without distributed locks',
                'Clear workflow visibility through the orchestrator',
                'Each service remains autonomous with local transactions',
                'Failure handling is explicit and well-defined'
            ],
            cons: [
                'Complex to implement — each step needs a compensating action',
                'Eventual consistency during saga execution',
                'Orchestrator can become a single point of failure',
                'Debugging failed sagas across multiple services is difficult'
            ],
            whenToUse: 'Best for business operations that span multiple services and require data consistency (e.g., order fulfillment, booking). Use when two-phase commit is not feasible.'
        }
    }
};

ARCHV.microservices.sync = {
    init: function() { renderMicroservices('sync'); },
    steps: function() {
        return [
            { elementId: 'comp-ms-gateway', label: 'API Gateway', description: 'Client request received at gateway', logType: 'REQUEST', layerId: 'ms-gateway-area' },
            { elementId: 'comp-ms-user-svc', label: 'User Service', description: 'Authenticate user via REST', logType: 'FLOW', layerId: 'svc-user' },
            { elementId: 'comp-ms-gateway', label: 'API Gateway', description: 'Route to Order Service', logType: 'FLOW', layerId: 'ms-gateway-area' },
            { elementId: 'comp-ms-order-svc', label: 'Order Service', description: 'Create order', logType: 'COMMAND', layerId: 'svc-order' },
            { elementId: 'comp-ms-inventory-svc', label: 'Inventory Service', description: 'Check stock availability via REST', logType: 'FLOW', layerId: 'svc-inventory' },
            { elementId: 'comp-ms-payment-svc', label: 'Payment Service', description: 'Process payment via gRPC', logType: 'FLOW', layerId: 'svc-payment' },
            { elementId: 'comp-ms-order-svc', label: 'Order Service', description: 'Payment confirmed, finalize order', logType: 'RESPONSE', layerId: 'svc-order' },
            { elementId: 'comp-ms-gateway', label: 'API Gateway', description: 'Aggregate response', logType: 'RESPONSE', layerId: 'ms-gateway-area' }
        ];
    },
    stepOptions: function() { return { requestLabel: 'HTTP POST /api/orders (sync)' }; },
    run: function() {
        ARCHV.animateFlow(ARCHV.microservices.sync.steps(), ARCHV.microservices.sync.stepOptions());
    }
};

ARCHV.microservices.async = {
    init: function() { renderMicroservices('async'); },
    steps: function() {
        return [
            { elementId: 'comp-ms-order-svc', label: 'Order Service', description: 'Publish OrderCreated event', logType: 'EVENT', layerId: 'svc-order' },
            { elementId: 'comp-ms-mesh', label: 'Message Bus', description: 'Route event to subscribers', logType: 'FLOW', layerId: 'ms-mesh' },
            { elementId: 'comp-ms-inventory-svc', label: 'Inventory Service', description: 'Consume event, reserve stock', logType: 'EVENT', layerId: 'svc-inventory' },
            { elementId: 'comp-ms-payment-svc', label: 'Payment Service', description: 'Consume event, process payment', logType: 'EVENT', layerId: 'svc-payment' },
            { elementId: 'comp-ms-notification-svc', label: 'Notification Service', description: 'Consume event, send confirmation', logType: 'EVENT', layerId: 'svc-notification' },
            { elementId: 'comp-ms-mesh', label: 'Message Bus', description: 'Services publish completion events', logType: 'EVENT', layerId: 'ms-mesh' }
        ];
    },
    stepOptions: function() { return { requestLabel: 'Event: OrderCreated (async)' }; },
    run: function() {
        ARCHV.animateFlow(ARCHV.microservices.async.steps(), ARCHV.microservices.async.stepOptions());
    }
};

ARCHV.microservices.saga = {
    init: function() { renderMicroservices('saga'); },
    steps: function() {
        return [
            { elementId: 'comp-ms-gateway', label: 'Saga Orchestrator', description: 'Initiate order saga', logType: 'REQUEST', layerId: 'ms-gateway-area' },
            { elementId: 'comp-ms-inventory-svc', label: 'Inventory Service', description: 'Step 1: Reserve inventory', logType: 'COMMAND', layerId: 'svc-inventory' },
            { elementId: 'comp-ms-payment-svc', label: 'Payment Service', description: 'Step 2: Process payment', logType: 'COMMAND', layerId: 'svc-payment' },
            { elementId: 'comp-ms-order-svc', label: 'Order Service', description: 'Step 3: Confirm order', logType: 'COMMAND', layerId: 'svc-order' },
            { elementId: 'comp-ms-notification-svc', label: 'Notification Service', description: 'Step 4: Send notification', logType: 'COMMAND', layerId: 'svc-notification' },
            { elementId: 'comp-ms-gateway', label: 'Saga Orchestrator', description: 'If failure: compensating transactions', logType: 'ERROR', layerId: 'ms-gateway-area' },
            { elementId: 'comp-ms-gateway', label: 'Saga Orchestrator', description: 'Saga completed', logType: 'RESPONSE', layerId: 'ms-gateway-area' }
        ];
    },
    stepOptions: function() { return { requestLabel: 'Saga: Order fulfillment' }; },
    run: function() {
        ARCHV.animateFlow(ARCHV.microservices.saga.steps(), ARCHV.microservices.saga.stepOptions());
    }
};
