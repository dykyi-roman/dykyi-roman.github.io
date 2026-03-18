/* ===== Observer Pattern ===== */

PV['observer'] = {};

PV['observer'].modes = [
    { id: 'events', label: 'Event Notification', desc: 'EventManager maintains a list of subscribers and broadcasts events to all registered observers. When an event like "order.placed" fires, each observer (EmailListener, LoggingListener, SlackListener) receives the update independently without knowing about each other.' }
];

PV['observer'].depRules = [
    { name: 'EventManager (Subject)', role: 'Manages subscriber list and broadcasts events' },
    { name: 'Observer (interface)', role: 'Defines the update(event) contract' },
    { name: 'EmailListener', role: 'Sends email on event' },
    { name: 'LoggingListener', role: 'Logs event to file' },
    { name: 'SlackListener', role: 'Posts to Slack channel' }
];

/* ---------- Shared render functions ---------- */

function renderObserverEvents() {
    var canvas = document.getElementById('pv-canvas');
    canvas.innerHTML =
        '<div class="layout-pattern-hierarchy" style="gap: 50px; padding: 30px 20px;">' +
            /* Row 1: EventManager */
            '<div class="pv-hierarchy-row" style="justify-content: center;">' +
                PV.renderClass('cls-ob-subject', 'EventManager', {
                    fields: ['subscribers: Map<string, Observer[]>'],
                    methods: ['subscribe(event, observer)', 'unsubscribe(event, observer)', 'notify(event, data)'],
                    tooltip: I18N.t('observer.tooltip.subject', null, 'Subject — maintains a map of event names to observer lists, iterates and calls update() on each subscriber when an event fires')
                }) +
            '</div>' +
            PV.renderArrowConnector(I18N.t('ui.legend.notifies', null, 'notifies')) +
            /* Row 2: Observer interface */
            '<div class="pv-hierarchy-row" style="justify-content: center;">' +
                PV.renderClass('cls-ob-observer', 'Observer', {
                    stereotype: 'interface',
                    methods: ['update(event, data): void'],
                    tooltip: I18N.t('observer.tooltip.observer', null, 'Observer interface — defines the update(event, data) contract that all concrete observers must implement')
                }) +
            '</div>' +
            /* Row 3: Concrete observers */
            '<div class="pv-hierarchy-row" style="gap: 60px; margin-top: 40px;">' +
                PV.renderClass('cls-ob-email', 'EmailListener', {
                    methods: ['update(event, data): void'],
                    tooltip: I18N.t('observer.tooltip.email', null, 'Concrete Observer — sends a confirmation email when notified of an event')
                }) +
                PV.renderClass('cls-ob-logging', 'LoggingListener', {
                    methods: ['update(event, data): void'],
                    tooltip: I18N.t('observer.tooltip.logging', null, 'Concrete Observer — writes event details to a log file for auditing')
                }) +
                PV.renderClass('cls-ob-slack', 'SlackListener', {
                    methods: ['update(event, data): void'],
                    tooltip: I18N.t('observer.tooltip.slack', null, 'Concrete Observer — posts a notification to a Slack channel when an event occurs')
                }) +
            '</div>' +
            /* Row 4: Object instances */
            '<div class="pv-hierarchy-row" style="gap: 60px; margin-top: 20px;">' +
                PV.renderObject('obj-email', ':EmailListener', { tooltip: I18N.t('observer.tooltip.obj-email', null, 'Runtime instance of EmailListener handling the event') }) +
                PV.renderObject('obj-logging', ':LoggingListener', { tooltip: I18N.t('observer.tooltip.obj-logging', null, 'Runtime instance of LoggingListener handling the event') }) +
                PV.renderObject('obj-slack', ':SlackListener', { tooltip: I18N.t('observer.tooltip.obj-slack', null, 'Runtime instance of SlackListener handling the event') }) +
            '</div>' +
            /* Flow Legend */
            '<div class="pv-flow-legend">' +
                '<div class="legend-item"><span class="legend-line-sync"></span> ' + I18N.t('ui.legend.flow', null, 'Flow') + '</div>' +
                '<div class="legend-item"><span class="legend-line-create"></span> ' + I18N.t('ui.legend.create', null, 'Create') + '</div>' +
                '<div class="legend-item"><span class="legend-line-response"></span> ' + I18N.t('ui.legend.response', null, 'Response') + '</div>' +
                '<div class="legend-item"><span class="legend-line-inherit"></span> ' + I18N.t('ui.legend.inherit', null, 'Inherit') + '</div>' +
                '<div class="legend-item"><span class="legend-line-aggregate"></span> ' + I18N.t('ui.legend.aggregate', null, 'Aggregate') + '</div>' +
                '<div class="legend-item"><span class="legend-line-depend"></span> ' + I18N.t('ui.legend.uses', null, 'Uses') + '</div>' +
                '<div class="legend-item"><span style="display:inline-block;width:20px;height:14px;border:2px dashed var(--pv-accent);border-radius:2px;background:var(--pv-accent-bg);"></span> ' + I18N.t('ui.legend.object', null, 'Object') + '</div>' +
            '</div>' +
        '</div>';

    setTimeout(function() {
        PV.renderRelation('cls-ob-email', 'cls-ob-observer', 'inherit');
        PV.renderRelation('cls-ob-logging', 'cls-ob-observer', 'inherit', -6);
        PV.renderRelation('cls-ob-slack', 'cls-ob-observer', 'inherit');
        PV.renderRelation('cls-ob-subject', 'cls-ob-observer', 'aggregate');
    }, 50);
}

/* ---------- Details ---------- */

PV['observer'].details = {
    events: {
        principles: [
            'Loose coupling: subjects and observers interact through an abstract interface, neither depends on concrete implementations',
            'Open/Closed Principle: new observers can be added without modifying the EventManager or existing observers',
            'One-to-many dependency: one subject notifies many observers, keeping the broadcast logic centralized',
            'Event-driven architecture: components react to events rather than polling for changes, improving responsiveness',
            'Single Responsibility: each observer handles exactly one concern (email, logging, Slack) independently'
        ],
        concepts: [
            { term: 'Subject (EventManager)', definition: 'Maintains a registry of observers keyed by event name. When an event fires, it iterates through all registered observers for that event and calls their update() method.' },
            { term: 'Observer', definition: 'An interface with a single update(event, data) method. Concrete observers implement this to define their reaction to events. The subject knows observers only through this interface.' },
            { term: 'Event', definition: 'A named signal (e.g., "order.placed") that carries optional data. Events decouple the sender from the receivers — the subject does not know what observers will do with the event.' },
            { term: 'Push vs Pull', definition: 'In Push model, the subject sends event data directly to observers via update(). In Pull model, observers query the subject for state after being notified. Push is simpler; Pull gives observers more control over what data they access.' }
        ],
        tradeoffs: {
            pros: [
                'Loose coupling — subject and observers can vary independently without affecting each other',
                'Open/Closed — add new observers (e.g., WebhookNotifier) without modifying EventManager',
                'Broadcast communication — one event triggers multiple independent reactions',
                'Runtime flexibility — observers can subscribe and unsubscribe dynamically at runtime'
            ],
            cons: [
                'Unexpected updates — observers may be notified in unpredictable order',
                'Memory leaks — forgotten subscriptions keep observers alive (lapsed listener problem)',
                'Performance — notifying many observers synchronously can block the main thread',
                'Debugging difficulty — tracing the flow through multiple observers is harder than direct calls'
            ],
            whenToUse: 'Use when a change in one object requires notifying an unknown or dynamic set of other objects, when you need broadcast-style communication, or when you want to decouple event producers from consumers in an event-driven system.'
        }
    }
};

/* ---------- Mode: events ---------- */

PV['observer'].events = {
    init: function() {
        renderObserverEvents();
    },
    steps: function() {
        return [
            { elementId: 'cls-ob-subject', label: 'EventManager', description: 'User triggers "order.placed" event', descriptionKey: 'observer.step.events.0', logType: 'REQUEST' },
            { elementId: 'cls-ob-observer', label: 'Observer', description: 'EventManager looks up subscribers for "order.placed"', descriptionKey: 'observer.step.events.1', logType: 'FLOW' },
            { elementId: 'cls-ob-email', label: 'EmailListener', description: 'Notify EmailListener.update()', descriptionKey: 'observer.step.events.2', logType: 'FLOW' },
            { elementId: 'obj-email', label: ':EmailListener', description: 'EmailListener sends confirmation email', descriptionKey: 'observer.step.events.3', logType: 'CREATE', spawnId: 'obj-email' },
            { elementId: 'cls-ob-logging', label: 'LoggingListener', description: 'Notify LoggingListener.update()', descriptionKey: 'observer.step.events.4', logType: 'FLOW', arrowFromId: 'cls-ob-subject' },
            { elementId: 'obj-logging', label: ':LoggingListener', description: 'LoggingListener writes to log file', descriptionKey: 'observer.step.events.5', logType: 'CREATE', spawnId: 'obj-logging' },
            { elementId: 'cls-ob-slack', label: 'SlackListener', description: 'Notify SlackListener.update()', descriptionKey: 'observer.step.events.6', logType: 'FLOW', arrowFromId: 'cls-ob-subject' },
            { elementId: 'obj-slack', label: ':SlackListener', description: 'SlackListener posts to #orders channel', descriptionKey: 'observer.step.events.7', logType: 'RESPONSE', spawnId: 'obj-slack' }
        ];
    },
    stepOptions: function() { return { requestLabel: I18N.t('observer.stepLabel.events', null, 'Broadcast event via Observer pattern') }; },
    run: function() {
        PV.animateFlow(PV['observer'].events.steps(), PV['observer'].events.stepOptions());
    }
};

PV['observer'].codeExamples = {
    events: {
        php: `<?php
declare(strict_types=1);

interface Observer
{
    public function update(string $event, array $data): void;
}

final class EventManager
{
    /** @var array<string, Observer[]> */
    private array $subscribers = [];

    public function subscribe(string $event, Observer $observer): void
    {
        $this->subscribers[$event][] = $observer;
    }

    public function unsubscribe(string $event, Observer $observer): void
    {
        if (!isset($this->subscribers[$event])) {
            return;
        }

        $this->subscribers[$event] = array_filter(
            $this->subscribers[$event],
            static fn(Observer $o): bool => $o !== $observer,
        );
    }

    public function notify(string $event, array $data = []): void
    {
        foreach ($this->subscribers[$event] ?? [] as $observer) {
            $observer->update($event, $data);
        }
    }
}

readonly class EmailListener implements Observer
{
    public function __construct(
        private string $adminEmail,
    ) {}

    public function update(string $event, array $data): void
    {
        echo sprintf(
            "Email to %s: [%s] Order #%s\\n",
            $this->adminEmail,
            $event,
            $data['orderId'] ?? 'unknown',
        );
    }
}

readonly class LoggingListener implements Observer
{
    public function __construct(
        private string $logFile,
    ) {}

    public function update(string $event, array $data): void
    {
        $line = date('c') . " [{$event}] " . json_encode($data) . PHP_EOL;
        file_put_contents($this->logFile, $line, FILE_APPEND);
    }
}

readonly class SlackListener implements Observer
{
    public function __construct(
        private string $channel,
    ) {}

    public function update(string $event, array $data): void
    {
        echo sprintf(
            "Slack #%s: [%s] Order #%s placed\\n",
            $this->channel,
            $event,
            $data['orderId'] ?? 'unknown',
        );
    }
}

// Client
$manager = new EventManager();

$manager->subscribe('order.placed', new EmailListener('admin@shop.com'));
$manager->subscribe('order.placed', new LoggingListener('/var/log/orders.log'));
$manager->subscribe('order.placed', new SlackListener('orders'));

$manager->notify('order.placed', ['orderId' => 'ORD-1042', 'total' => 259.90]);`,

        go: `package main

import "fmt"

type Observer interface {
	Update(event string, data map[string]any)
}

type EventManager struct {
	subscribers map[string][]Observer
}

func NewEventManager() *EventManager {
	return &EventManager{subscribers: make(map[string][]Observer)}
}

func (em *EventManager) Subscribe(event string, o Observer) {
	em.subscribers[event] = append(em.subscribers[event], o)
}

func (em *EventManager) Unsubscribe(event string, o Observer) {
	subs := em.subscribers[event]
	for i, sub := range subs {
		if sub == o {
			em.subscribers[event] = append(subs[:i], subs[i+1:]...)
			return
		}
	}
}

func (em *EventManager) Notify(event string, data map[string]any) {
	for _, o := range em.subscribers[event] {
		o.Update(event, data)
	}
}

type EmailListener struct {
	AdminEmail string
}

func (e *EmailListener) Update(event string, data map[string]any) {
	fmt.Printf("Email to %s: [%s] Order #%v\\n", e.AdminEmail, event, data["orderId"])
}

type LoggingListener struct {
	LogFile string
}

func (l *LoggingListener) Update(event string, data map[string]any) {
	fmt.Printf("Log %s: [%s] %v\\n", l.LogFile, event, data)
}

type SlackListener struct {
	Channel string
}

func (s *SlackListener) Update(event string, data map[string]any) {
	fmt.Printf("Slack #%s: [%s] Order #%v placed\\n", s.Channel, event, data["orderId"])
}

func main() {
	manager := NewEventManager()

	manager.Subscribe("order.placed", &EmailListener{AdminEmail: "admin@shop.com"})
	manager.Subscribe("order.placed", &LoggingListener{LogFile: "/var/log/orders.log"})
	manager.Subscribe("order.placed", &SlackListener{Channel: "orders"})

	manager.Notify("order.placed", map[string]any{
		"orderId": "ORD-1042",
		"total":   259.90,
	})
}`,

        python: `from abc import ABC, abstractmethod
from typing import override


class Observer(ABC):
    @abstractmethod
    def update(self, event: str, data: dict) -> None: ...


class EventManager:
    def __init__(self) -> None:
        self._subscribers: dict[str, list[Observer]] = {}

    def subscribe(self, event: str, observer: Observer) -> None:
        self._subscribers.setdefault(event, []).append(observer)

    def unsubscribe(self, event: str, observer: Observer) -> None:
        if event in self._subscribers:
            self._subscribers[event] = [
                o for o in self._subscribers[event] if o is not observer
            ]

    def notify(self, event: str, data: dict | None = None) -> None:
        for observer in self._subscribers.get(event, []):
            observer.update(event, data or {})


class EmailListener(Observer):
    def __init__(self, admin_email: str) -> None:
        self._admin_email = admin_email

    @override
    def update(self, event: str, data: dict) -> None:
        order_id = data.get("orderId", "unknown")
        print(f"Email to {self._admin_email}: [{event}] Order #{order_id}")


class LoggingListener(Observer):
    def __init__(self, log_file: str) -> None:
        self._log_file = log_file

    @override
    def update(self, event: str, data: dict) -> None:
        print(f"Log {self._log_file}: [{event}] {data}")


class SlackListener(Observer):
    def __init__(self, channel: str) -> None:
        self._channel = channel

    @override
    def update(self, event: str, data: dict) -> None:
        order_id = data.get("orderId", "unknown")
        print(f"Slack #{self._channel}: [{event}] Order #{order_id} placed")


# Client
manager = EventManager()

manager.subscribe("order.placed", EmailListener("admin@shop.com"))
manager.subscribe("order.placed", LoggingListener("/var/log/orders.log"))
manager.subscribe("order.placed", SlackListener("orders"))

manager.notify("order.placed", {"orderId": "ORD-1042", "total": 259.90})`,

        rust: `use std::collections::HashMap;

trait Observer {
    fn update(&self, event: &str, data: &HashMap<String, String>);
}

struct EventManager {
    subscribers: HashMap<String, Vec<Box<dyn Observer>>>,
}

impl EventManager {
    fn new() -> Self {
        Self {
            subscribers: HashMap::new(),
        }
    }

    fn subscribe(&mut self, event: &str, observer: Box<dyn Observer>) {
        self.subscribers
            .entry(event.to_string())
            .or_default()
            .push(observer);
    }

    fn notify(&self, event: &str, data: &HashMap<String, String>) {
        if let Some(observers) = self.subscribers.get(event) {
            for observer in observers {
                observer.update(event, data);
            }
        }
    }
}

struct EmailListener {
    admin_email: String,
}

impl EmailListener {
    fn new(admin_email: &str) -> Self {
        Self {
            admin_email: admin_email.to_string(),
        }
    }
}

impl Observer for EmailListener {
    fn update(&self, event: &str, data: &HashMap<String, String>) {
        let order_id = data.get("orderId").map_or("unknown", |v| v.as_str());
        println!(
            "Email to {}: [{}] Order #{}",
            self.admin_email, event, order_id
        );
    }
}

struct LoggingListener {
    log_file: String,
}

impl LoggingListener {
    fn new(log_file: &str) -> Self {
        Self {
            log_file: log_file.to_string(),
        }
    }
}

impl Observer for LoggingListener {
    fn update(&self, event: &str, data: &HashMap<String, String>) {
        println!("Log {}: [{}] {:?}", self.log_file, event, data);
    }
}

struct SlackListener {
    channel: String,
}

impl SlackListener {
    fn new(channel: &str) -> Self {
        Self {
            channel: channel.to_string(),
        }
    }
}

impl Observer for SlackListener {
    fn update(&self, event: &str, data: &HashMap<String, String>) {
        let order_id = data.get("orderId").map_or("unknown", |v| v.as_str());
        println!(
            "Slack #{}: [{}] Order #{} placed",
            self.channel, event, order_id
        );
    }
}

fn main() {
    let mut manager = EventManager::new();

    manager.subscribe("order.placed", Box::new(EmailListener::new("admin@shop.com")));
    manager.subscribe("order.placed", Box::new(LoggingListener::new("/var/log/orders.log")));
    manager.subscribe("order.placed", Box::new(SlackListener::new("orders")));

    let mut data = HashMap::new();
    data.insert("orderId".to_string(), "ORD-1042".to_string());
    data.insert("total".to_string(), "259.90".to_string());

    manager.notify("order.placed", &data);
}`
    }
};
