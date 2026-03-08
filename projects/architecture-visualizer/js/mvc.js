/* ===== MVC / MVP / MVVM ===== */

ARCHV.mvc = {};

ARCHV.mvc.modes = [
    { id: 'mvc', label: 'MVC', desc: 'Model-View-Controller: Controller receives user input, updates the Model, and the View observes Model changes. The Controller does NOT update the View directly - the View pulls data from the Model.' },
    { id: 'mvp', label: 'MVP', desc: 'Model-View-Presenter: The Presenter acts as a mediator. View delegates all user input to the Presenter. Presenter updates the Model and explicitly updates the View. View is passive (no logic).' },
    { id: 'mvvm', label: 'MVVM', desc: 'Model-View-ViewModel: ViewModel exposes data and commands via data binding. View binds to ViewModel properties. When ViewModel changes, View updates automatically. Two-way binding keeps them in sync.' }
];

ARCHV.mvc.depRules = [
    { from: 'Controller', to: 'Model', allowed: true },
    { from: 'View', to: 'Model (observer)', allowed: true },
    { from: 'Presenter', to: 'View', allowed: true },
    { from: 'Presenter', to: 'Model', allowed: true },
    { from: 'View', to: 'ViewModel (binding)', allowed: true },
    { from: 'ViewModel', to: 'Model', allowed: true },
    { from: 'Controller', to: 'View (direct)', allowed: false },
    { from: 'Model', to: 'Controller', allowed: false }
];

function renderMVC() {
    var canvas = document.getElementById('archv-canvas');
    canvas.innerHTML =
        '<div class="layout-triad">' +
            '<div class="archv-triad-box" id="comp-mvc-view">' +
                '<div class="archv-triad-label">View</div>' +
                '<div class="archv-triad-desc">Displays data to user. Observes Model for changes. Sends user actions to Controller.</div>' +
                '<div class="archv-components archv-components-col">' +
                    ARCHV.renderComponent('comp-mvc-render', 'Renderer', '&#x1F3A8;') +
                    ARCHV.renderComponent('comp-mvc-template', 'Template', '&#x1F5A5;') +
                '</div>' +
            '</div>' +
            '<div class="archv-triad-box" id="comp-mvc-controller">' +
                '<div class="archv-triad-label">Controller</div>' +
                '<div class="archv-triad-desc">Handles user input. Updates Model. Selects View. Does NOT directly update View content.</div>' +
                '<div class="archv-components archv-components-col">' +
                    ARCHV.renderComponent('comp-mvc-router', 'Router', '&#x1F6E4;') +
                    ARCHV.renderComponent('comp-mvc-handler', 'InputHandler', '&#x1F3AE;') +
                '</div>' +
            '</div>' +
            '<div class="archv-triad-box" id="comp-mvc-model">' +
                '<div class="archv-triad-label">Model</div>' +
                '<div class="archv-triad-desc">Business logic and data. Notifies observers (View) when state changes. Independent of UI.</div>' +
                '<div class="archv-components archv-components-col">' +
                    ARCHV.renderComponent('comp-mvc-logic', 'Logic', '&#x2699;') +
                    ARCHV.renderComponent('comp-mvc-data', 'Data', '&#x1F4CB;') +
                '</div>' +
            '</div>' +
        '</div>';
}

function renderMVP() {
    var canvas = document.getElementById('archv-canvas');
    canvas.innerHTML =
        '<div class="layout-triad">' +
            '<div class="archv-triad-box" id="comp-mvp-view">' +
                '<div class="archv-triad-label">View</div>' +
                '<div class="archv-triad-desc">Passive view. Delegates ALL input to Presenter. Has no logic. Implements a View interface.</div>' +
                '<div class="archv-components archv-components-col">' +
                    ARCHV.renderComponent('comp-mvp-ui', 'UI Components', '&#x1F5A5;') +
                    ARCHV.renderComponent('comp-mvp-iface', 'IView', '&#x1F4DC;') +
                '</div>' +
            '</div>' +
            '<div class="archv-triad-box" id="comp-mvp-presenter">' +
                '<div class="archv-triad-label">Presenter</div>' +
                '<div class="archv-triad-desc">Mediator between View and Model. Contains presentation logic. Explicitly updates View through interface.</div>' +
                '<div class="archv-components archv-components-col">' +
                    ARCHV.renderComponent('comp-mvp-preslogic', 'PresenterLogic', '&#x1F527;') +
                    ARCHV.renderComponent('comp-mvp-format', 'Formatter', '&#x1F4CA;') +
                '</div>' +
            '</div>' +
            '<div class="archv-triad-box" id="comp-mvp-model">' +
                '<div class="archv-triad-label">Model</div>' +
                '<div class="archv-triad-desc">Business data and rules. Presenter reads/writes Model. Model has no knowledge of Presenter or View.</div>' +
                '<div class="archv-components archv-components-col">' +
                    ARCHV.renderComponent('comp-mvp-data', 'Data', '&#x1F4CB;') +
                    ARCHV.renderComponent('comp-mvp-logic', 'Logic', '&#x2699;') +
                '</div>' +
            '</div>' +
        '</div>';
}

function renderMVVM() {
    var canvas = document.getElementById('archv-canvas');
    canvas.innerHTML =
        '<div class="layout-triad">' +
            '<div class="archv-triad-box" id="comp-mvvm-view">' +
                '<div class="archv-triad-label">View</div>' +
                '<div class="archv-triad-desc">Binds to ViewModel properties. Two-way data binding keeps UI in sync. Minimal code-behind.</div>' +
                '<div class="archv-components archv-components-col">' +
                    ARCHV.renderComponent('comp-mvvm-binding', 'DataBinding', '&#x1F517;') +
                    ARCHV.renderComponent('comp-mvvm-ui', 'UI Layer', '&#x1F5A5;') +
                '</div>' +
            '</div>' +
            '<div class="archv-triad-box" id="comp-mvvm-viewmodel">' +
                '<div class="archv-triad-label">ViewModel</div>' +
                '<div class="archv-triad-desc">Exposes observable properties and commands. View binds to these. Transforms Model data for display.</div>' +
                '<div class="archv-components archv-components-col">' +
                    ARCHV.renderComponent('comp-mvvm-observable', 'Observable', '&#x1F440;') +
                    ARCHV.renderComponent('comp-mvvm-commands', 'Commands', '&#x1F4DD;') +
                '</div>' +
            '</div>' +
            '<div class="archv-triad-box" id="comp-mvvm-model">' +
                '<div class="archv-triad-label">Model</div>' +
                '<div class="archv-triad-desc">Pure data and business logic. ViewModel reads/writes Model. No knowledge of View or ViewModel.</div>' +
                '<div class="archv-components archv-components-col">' +
                    ARCHV.renderComponent('comp-mvvm-data', 'Data', '&#x1F4CB;') +
                    ARCHV.renderComponent('comp-mvvm-logic', 'Logic', '&#x2699;') +
                '</div>' +
            '</div>' +
        '</div>';
}

ARCHV.mvc.details = {
    mvc: {
        principles: [
            'Separation of Concerns: each component has a single responsibility',
            'Observer Pattern: View subscribes to Model changes, not pushed by Controller',
            'Controller never updates View directly — only selects View and updates Model',
            'Model is completely independent of UI (no references to View or Controller)',
            'Multiple Views can observe the same Model simultaneously'
        ],
        concepts: [
            { term: 'Model', definition: 'Encapsulates application data and business rules. Notifies observers when state changes.' },
            { term: 'View', definition: 'Renders Model data to the user. Observes Model for changes. Forwards user input to Controller.' },
            { term: 'Controller', definition: 'Interprets user input, invokes Model methods, selects appropriate View.' },
            { term: 'Observer', definition: 'Design pattern where Model maintains a list of dependents (Views) and notifies them of state changes.' }
        ]
    },
    mvp: {
        principles: [
            'Passive View: View contains zero presentation logic, only UI rendering',
            'Presenter is the sole mediator between View and Model',
            'View communicates with Presenter through a well-defined interface (IView)',
            'Presenter explicitly updates View — no observer pattern, no data binding',
            'High testability: Presenter can be unit-tested with a mock View interface'
        ],
        concepts: [
            { term: 'Passive View', definition: 'View pattern where the View has no logic and delegates all decisions to the Presenter.' },
            { term: 'Presenter', definition: 'Contains all presentation logic. Reads Model, formats data, and explicitly pushes updates to View.' },
            { term: 'IView Interface', definition: 'Contract that View implements, allowing Presenter to update UI without knowing the concrete View.' },
            { term: 'Supervising Controller', definition: 'MVP variant where View handles simple data binding, and Presenter handles complex logic only.' }
        ]
    },
    mvvm: {
        principles: [
            'Two-way Data Binding: View and ViewModel stay in sync automatically',
            'ViewModel has no direct reference to View — communicates through bindings only',
            'Command Pattern: user actions are bound to ViewModel commands, not event handlers',
            'ViewModel transforms Model data into View-friendly format (presentation logic)',
            'Declarative UI: View declares bindings in markup, not imperative code'
        ],
        concepts: [
            { term: 'Data Binding', definition: 'Mechanism that connects View properties to ViewModel properties, syncing changes in both directions.' },
            { term: 'ViewModel', definition: 'Abstraction of the View that exposes observable properties and commands. Acts as data context.' },
            { term: 'Observable', definition: 'Property that notifies subscribers (bindings) when its value changes, triggering UI updates.' },
            { term: 'Command', definition: 'Object that encapsulates an action and its "can execute" logic, bound to UI elements like buttons.' }
        ]
    }
};

ARCHV.mvc.mvcMode = {
    init: function() { renderMVC(); },
    run: function() {
        ARCHV.animateFlow([
            { elementId: 'comp-mvc-router', label: 'Router', description: 'HTTP request received', logType: 'REQUEST' },
            { elementId: 'comp-mvc-handler', label: 'InputHandler', description: 'Controller handles input', logType: 'FLOW' },
            { elementId: 'comp-mvc-logic', label: 'Model Logic', description: 'Execute business logic', logType: 'LAYER' },
            { elementId: 'comp-mvc-data', label: 'Model Data', description: 'Update state', logType: 'LAYER' },
            { elementId: 'comp-mvc-render', label: 'Renderer', description: 'View observes Model change', logType: 'RESPONSE' },
            { elementId: 'comp-mvc-template', label: 'Template', description: 'Render HTML with new data', logType: 'RESPONSE' }
        ], { requestLabel: 'MVC: Request → Controller → Model → View' });
    }
};

ARCHV.mvc.mvpMode = {
    init: function() { renderMVP(); },
    run: function() {
        ARCHV.animateFlow([
            { elementId: 'comp-mvp-ui', label: 'View UI', description: 'User interacts with passive view', logType: 'REQUEST' },
            { elementId: 'comp-mvp-iface', label: 'IView', description: 'Delegate to Presenter via interface', logType: 'FLOW' },
            { elementId: 'comp-mvp-preslogic', label: 'Presenter', description: 'Presenter receives user action', logType: 'FLOW' },
            { elementId: 'comp-mvp-logic', label: 'Model Logic', description: 'Presenter calls Model: execute business rules', logType: 'LAYER' },
            { elementId: 'comp-mvp-data', label: 'Model Data', description: 'Model reads/writes data', logType: 'LAYER' },
            { elementId: 'comp-mvp-preslogic', label: 'Presenter', description: 'Presenter pulls result from Model', logType: 'RESPONSE' },
            { elementId: 'comp-mvp-format', label: 'Formatter', description: 'Presenter delegates formatting', logType: 'RESPONSE' },
            { elementId: 'comp-mvp-preslogic', label: 'Presenter', description: 'Presenter receives formatted data', logType: 'RESPONSE' },
            { elementId: 'comp-mvp-iface', label: 'IView', description: 'Presenter updates View via interface', logType: 'RESPONSE' },
            { elementId: 'comp-mvp-ui', label: 'View UI', description: 'Passive view renders update', logType: 'RESPONSE' }
        ], { requestLabel: 'MVP: Presenter-mediated flow' });
    }
};

ARCHV.mvc.mvvmMode = {
    init: function() { renderMVVM(); },
    run: function() {
        ARCHV.animateFlow([
            { elementId: 'comp-mvvm-ui', label: 'View UI', description: 'User types in input field', logType: 'REQUEST' },
            { elementId: 'comp-mvvm-binding', label: 'DataBinding', description: 'Two-way binding triggers', logType: 'FLOW' },
            { elementId: 'comp-mvvm-observable', label: 'Observable', description: 'ViewModel property updated', logType: 'FLOW' },
            { elementId: 'comp-mvvm-commands', label: 'Command', description: 'Execute save command', logType: 'COMMAND' },
            { elementId: 'comp-mvvm-logic', label: 'Model Logic', description: 'Validate and process', logType: 'LAYER' },
            { elementId: 'comp-mvvm-data', label: 'Model Data', description: 'Persist data', logType: 'LAYER' },
            { elementId: 'comp-mvvm-observable', label: 'Observable', description: 'Notify property changed', logType: 'FLOW' },
            { elementId: 'comp-mvvm-binding', label: 'DataBinding', description: 'Binding propagates change', logType: 'RESPONSE' },
            { elementId: 'comp-mvvm-ui', label: 'View UI', description: 'UI auto-updates', logType: 'RESPONSE' }
        ], { requestLabel: 'MVVM: Data binding flow' });
    }
};
