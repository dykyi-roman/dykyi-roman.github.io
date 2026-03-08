/* ===== Domain-Driven Design ===== */

ARCHV.ddd = {};

ARCHV.ddd.modes = [
    { id: 'http', label: 'HTTP Request', desc: 'HTTP request enters the Bounded Context through the Application layer. The Anti-Corruption Layer protects context boundaries. Domain Events propagate between contexts through the Shared Kernel or messaging.' },
    { id: 'console', label: 'Console Command', desc: 'Console command triggers a use case within a Bounded Context. Domain logic stays isolated inside the context boundary, communicating with other contexts via Domain Events.' },
    { id: 'message', label: 'Message (Cross-Context)', desc: 'Domain Event from another Bounded Context arrives through the Anti-Corruption Layer, gets translated, and processed within the local context. This demonstrates context mapping.' }
];

ARCHV.ddd.depRules = [
    { from: 'Presentation', to: 'Application', allowed: true },
    { from: 'Application', to: 'Domain', allowed: true },
    { from: 'Infrastructure', to: 'Domain', allowed: true },
    { from: 'Context A', to: 'ACL', allowed: true },
    { from: 'ACL', to: 'Context B', allowed: true },
    { from: 'Domain', to: 'Infrastructure', allowed: false },
    { from: 'Domain', to: 'Presentation', allowed: false },
    { from: 'Context A', to: 'Context B (direct)', allowed: false }
];

function renderDDD() {
    var canvas = document.getElementById('archv-canvas');
    canvas.innerHTML =
        '<div class="layout-vertical">' +
            '<div class="archv-bounded-context" id="ctx-order">' +
                '<span class="archv-context-label">Order Context</span>' +
                '<div class="archv-layer" id="layer-ddd-presentation">' +
                    '<div class="archv-layer-name">Presentation</div>' +
                    '<div class="archv-components">' +
                        ARCHV.renderComponent('comp-ddd-controller', 'Controller', '&#x1F310;') +
                        ARCHV.renderComponent('comp-ddd-dto', 'DTO', '&#x1F4E6;') +
                    '</div>' +
                '</div>' +
                ARCHV.renderArrowConnector() +
                '<div class="archv-layer" id="layer-ddd-application">' +
                    '<div class="archv-layer-name">Application</div>' +
                    '<div class="archv-components">' +
                        ARCHV.renderComponent('comp-ddd-usecase', 'UseCase', '&#x2699;') +
                        ARCHV.renderComponent('comp-ddd-appservice', 'AppService', '&#x1F527;') +
                    '</div>' +
                '</div>' +
                ARCHV.renderArrowConnector() +
                '<div class="archv-layer" id="layer-ddd-domain">' +
                    '<div class="archv-layer-name">Domain</div>' +
                    '<div class="archv-components">' +
                        ARCHV.renderComponent('comp-ddd-aggregate', 'Aggregate', '&#x1F4E6;') +
                        ARCHV.renderComponent('comp-ddd-entity', 'Entity', '&#x1F4CB;') +
                        ARCHV.renderComponent('comp-ddd-vo', 'ValueObject', '&#x1F4CE;') +
                        ARCHV.renderComponent('comp-ddd-domservice', 'DomainService', '&#x1F3AF;') +
                        ARCHV.renderComponent('comp-ddd-event', 'DomainEvent', '&#x1F514;') +
                        ARCHV.renderComponent('comp-ddd-spec', 'Specification', '&#x1F50D;') +
                    '</div>' +
                '</div>' +
                ARCHV.renderArrowConnector() +
                '<div class="archv-layer" id="layer-ddd-infra">' +
                    '<div class="archv-layer-name">Infrastructure</div>' +
                    '<div class="archv-components">' +
                        ARCHV.renderComponent('comp-ddd-repo', 'Repository', '&#x1F5C4;') +
                        ARCHV.renderComponent('comp-ddd-eventbus', 'EventBus', '&#x1F4E8;') +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="archv-acl" id="comp-ddd-acl">&#x1F6E1; Anti-Corruption Layer</div>' +
            '<div class="archv-bounded-context" id="ctx-payment">' +
                '<span class="archv-context-label">Payment Context</span>' +
                '<div class="archv-layer" id="layer-ddd-pay">' +
                    '<div class="archv-components">' +
                        ARCHV.renderComponent('comp-ddd-pay-handler', 'EventHandler', '&#x1F4E5;') +
                        ARCHV.renderComponent('comp-ddd-pay-service', 'PaymentService', '&#x1F4B3;') +
                        ARCHV.renderComponent('comp-ddd-pay-entity', 'Payment', '&#x1F4CB;') +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';
}

ARCHV.ddd.http = {
    init: function() { renderDDD(); },
    run: function() {
        ARCHV.animateFlow([
            { elementId: 'comp-ddd-controller', label: 'Controller', description: 'HTTP request enters Order Context', logType: 'REQUEST', layerId: 'layer-ddd-presentation' },
            { elementId: 'comp-ddd-dto', label: 'DTO', description: 'Map to command DTO', logType: 'LAYER', layerId: 'layer-ddd-presentation' },
            { elementId: 'comp-ddd-usecase', label: 'UseCase', description: 'CreateOrder use case', logType: 'COMMAND', layerId: 'layer-ddd-application' },
            { elementId: 'comp-ddd-spec', label: 'Specification', description: 'Check order spec rules', logType: 'LAYER', layerId: 'layer-ddd-domain' },
            { elementId: 'comp-ddd-aggregate', label: 'Aggregate', description: 'Create Order aggregate', logType: 'LAYER', layerId: 'layer-ddd-domain' },
            { elementId: 'comp-ddd-entity', label: 'Entity', description: 'Add OrderLine entities', logType: 'LAYER', layerId: 'layer-ddd-domain' },
            { elementId: 'comp-ddd-vo', label: 'ValueObject', description: 'Validate Money, Address VOs', logType: 'LAYER', layerId: 'layer-ddd-domain' },
            { elementId: 'comp-ddd-event', label: 'DomainEvent', description: 'Raise OrderCreated event', logType: 'EVENT', layerId: 'layer-ddd-domain' },
            { elementId: 'comp-ddd-repo', label: 'Repository', description: 'Persist Order aggregate', logType: 'LAYER', layerId: 'layer-ddd-infra' },
            { elementId: 'comp-ddd-eventbus', label: 'EventBus', description: 'Publish OrderCreated to bus', logType: 'EVENT', layerId: 'layer-ddd-infra' },
            { elementId: 'comp-ddd-acl', label: 'ACL', description: 'Translate event for Payment Context', logType: 'FLOW' },
            { elementId: 'comp-ddd-pay-handler', label: 'EventHandler', description: 'Payment context receives event', logType: 'EVENT', layerId: 'layer-ddd-pay' },
            { elementId: 'comp-ddd-pay-service', label: 'PaymentService', description: 'Process payment', logType: 'LAYER', layerId: 'layer-ddd-pay' },
            { elementId: 'comp-ddd-pay-entity', label: 'Payment', description: 'Create Payment entity', logType: 'LAYER', layerId: 'layer-ddd-pay' }
        ], { requestLabel: 'HTTP POST /api/orders' });
    }
};

ARCHV.ddd.console = {
    init: function() { renderDDD(); },
    run: function() {
        ARCHV.animateFlow([
            { elementId: 'comp-ddd-controller', label: 'Controller', description: 'CLI command enters context', logType: 'REQUEST', layerId: 'layer-ddd-presentation' },
            { elementId: 'comp-ddd-dto', label: 'DTO', description: 'Parse arguments', logType: 'LAYER', layerId: 'layer-ddd-presentation' },
            { elementId: 'comp-ddd-appservice', label: 'AppService', description: 'Coordinate operation', logType: 'LAYER', layerId: 'layer-ddd-application' },
            { elementId: 'comp-ddd-domservice', label: 'DomainService', description: 'Complex domain logic', logType: 'LAYER', layerId: 'layer-ddd-domain' },
            { elementId: 'comp-ddd-aggregate', label: 'Aggregate', description: 'Modify aggregate', logType: 'LAYER', layerId: 'layer-ddd-domain' },
            { elementId: 'comp-ddd-event', label: 'DomainEvent', description: 'Emit event', logType: 'EVENT', layerId: 'layer-ddd-domain' },
            { elementId: 'comp-ddd-repo', label: 'Repository', description: 'Persist changes', logType: 'LAYER', layerId: 'layer-ddd-infra' }
        ], { requestLabel: 'CLI: order:recalculate' });
    }
};

ARCHV.ddd.message = {
    init: function() { renderDDD(); },
    run: function() {
        ARCHV.animateFlow([
            { elementId: 'comp-ddd-pay-handler', label: 'EventHandler', description: 'External event received', logType: 'REQUEST', layerId: 'layer-ddd-pay' },
            { elementId: 'comp-ddd-acl', label: 'ACL', description: 'Translate to local language', logType: 'FLOW' },
            { elementId: 'comp-ddd-usecase', label: 'UseCase', description: 'Handle translated event', logType: 'LAYER', layerId: 'layer-ddd-application' },
            { elementId: 'comp-ddd-aggregate', label: 'Aggregate', description: 'Update Order status', logType: 'LAYER', layerId: 'layer-ddd-domain' },
            { elementId: 'comp-ddd-entity', label: 'Entity', description: 'Mark as paid', logType: 'LAYER', layerId: 'layer-ddd-domain' },
            { elementId: 'comp-ddd-event', label: 'DomainEvent', description: 'OrderPaid event', logType: 'EVENT', layerId: 'layer-ddd-domain' },
            { elementId: 'comp-ddd-repo', label: 'Repository', description: 'Persist updated state', logType: 'LAYER', layerId: 'layer-ddd-infra' },
            { elementId: 'comp-ddd-eventbus', label: 'EventBus', description: 'Publish OrderPaid', logType: 'EVENT', layerId: 'layer-ddd-infra' }
        ], { requestLabel: 'Message: payment.completed' });
    }
};
