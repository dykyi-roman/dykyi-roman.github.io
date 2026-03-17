/* ===== Factory Method Pattern ===== */

PV['factory-method'] = {};

PV['factory-method'].modes = [
    { id: 'logistics', label: 'Logistics', desc: 'Logistics app where each transport type has its own creator subclass implementing createTransport(). The parent Logistics class defines planDelivery() which calls the abstract createTransport() — each subclass decides which Transport to instantiate.' }
];

PV['factory-method'].depRules = [
    { name: 'Creator (Abstract)', role: 'Declares the factory method returning a Product; may provide default implementation' },
    { name: 'Concrete Creator', role: 'Overrides factory method to return specific Product type' },
    { name: 'Product (Interface)', role: 'Common interface for all objects the factory method creates' },
    { name: 'Concrete Product', role: 'Implements the Product interface' }
];

/* ===== Render: Logistics ===== */
function renderFactoryMethodLogistics() {
    var canvas = document.getElementById('pv-canvas');
    canvas.innerHTML =
        '<div class="layout-pattern-hierarchy" style="gap: 45px; padding: 30px 20px;">' +
            /* Row 1: Abstract Creator + Product Interface */
            '<div class="pv-hierarchy-row" style="gap: 140px;">' +
                PV.renderClass('fm-logistics', 'Logistics', {
                    stereotype: 'abstract',
                    methods: ['<em>createTransport(): Transport</em>', 'planDelivery()'],
                    tooltip: I18N.t('factory-method.tooltip.logistics', null, 'Abstract creator that declares the factory method createTransport() and uses it inside planDelivery()')
                }) +
                PV.renderClass('fm-transport', 'Transport', {
                    stereotype: 'interface',
                    methods: ['deliver()'],
                    tooltip: I18N.t('factory-method.tooltip.transport', null, 'Product interface defining the contract all concrete transports must implement')
                }) +
            '</div>' +
            /* Row 2: Creators with instances (left) | Products (right) */
            '<div style="display: flex; gap: 30px; justify-content: center; align-items: flex-start; margin-top: 60px;">' +
                /* SeaLogistics + :Ship */
                '<div style="display: flex; flex-direction: column; align-items: center; gap: 20px;">' +
                    PV.renderClass('fm-sea-logistics', 'SeaLogistics', {
                        methods: ['createTransport(): Ship'],
                        tooltip: I18N.t('factory-method.tooltip.sea-logistics', null, 'Concrete creator that overrides createTransport() to return a Ship instance')
                    }) +
                    PV.renderObject('obj-fm-ship', ':Ship', { tooltip: I18N.t('factory-method.tooltip.obj-ship', null, 'Runtime Ship instance created by SeaLogistics') }) +
                '</div>' +
                /* RoadLogistics + :Truck */
                '<div style="display: flex; flex-direction: column; align-items: center; gap: 20px;">' +
                    PV.renderClass('fm-road-logistics', 'RoadLogistics', {
                        methods: ['createTransport(): Truck'],
                        tooltip: I18N.t('factory-method.tooltip.road-logistics', null, 'Concrete creator that overrides createTransport() to return a Truck instance')
                    }) +
                    PV.renderObject('obj-fm-truck', ':Truck', { tooltip: I18N.t('factory-method.tooltip.obj-truck', null, 'Runtime Truck instance created by RoadLogistics') }) +
                '</div>' +
                /* Spacer */
                '<div style="width: 60px;"></div>' +
                /* Truck */
                PV.renderClass('fm-truck', 'Truck', {
                    methods: ['deliver()'],
                    tooltip: I18N.t('factory-method.tooltip.truck', null, 'Concrete product implementing Transport — delivers goods by road')
                }) +
                /* Ship */
                PV.renderClass('fm-ship', 'Ship', {
                    methods: ['deliver()'],
                    tooltip: I18N.t('factory-method.tooltip.ship', null, 'Concrete product implementing Transport — delivers goods by sea')
                }) +
            '</div>' +
            /* Legend */
            '<div class="pv-flow-legend">' +
                '<div class="legend-item"><span class="legend-line-sync"></span> ' + I18N.t('ui.legend.flow', null, 'Flow') + '</div>' +
                '<div class="legend-item"><span class="legend-line-create"></span> ' + I18N.t('ui.legend.create', null, 'Create') + '</div>' +
                '<div class="legend-item"><span class="legend-line-response"></span> ' + I18N.t('ui.legend.response', null, 'Response') + '</div>' +
                '<div class="legend-item"><span class="legend-line-inherit"></span> ' + I18N.t('ui.legend.inherit', null, 'Inherit') + '</div>' +
                '<div class="legend-item"><span class="legend-line-depend"></span> ' + I18N.t('ui.legend.uses', null, 'Uses') + '</div>' +
                '<div class="legend-item"><span style="display:inline-block;width:20px;height:14px;border:2px dashed var(--pv-accent);border-radius:2px;background:var(--pv-accent-bg);"></span> ' + I18N.t('ui.legend.object', null, 'Object') + '</div>' +
                '<div class="legend-item"><span style="color:#10B981;font-weight:bold;font-size:13px;">✓</span> ' + I18N.t('ui.legend.property', null, 'Property') + '</div>' +
            '</div>' +
        '</div>';

    setTimeout(function() {
        PV.renderRelation('fm-road-logistics', 'fm-logistics', 'inherit');
        PV.renderRelation('fm-sea-logistics', 'fm-logistics', 'inherit');
        PV.renderRelation('fm-truck', 'fm-transport', 'inherit');
        PV.renderRelation('fm-ship', 'fm-transport', 'inherit');
        PV.renderRelation('fm-logistics', 'fm-transport', 'depend');
    }, 50);
}

/* ===== Details ===== */
PV['factory-method'].details = {
    logistics: {
        principles: [
            'The Creator class declares a factory method that subclasses override to produce different Products',
            'Client code works with the abstract Creator and Product types — never depends on concrete classes',
            'Open/Closed Principle: new transport types are added by creating new creator subclasses without modifying existing code',
            'Single Responsibility: each Concrete Creator is responsible for exactly one product type',
            'planDelivery() in the Creator relies on the factory method — the Template Method pattern cooperates with Factory Method'
        ],
        concepts: [
            { term: 'Factory Method', definition: 'An abstract method declared in the Creator that returns a Product. Each Concrete Creator provides its own implementation.' },
            { term: 'Creator', definition: 'Abstract class containing the factory method and business logic (planDelivery) that depends on the product returned by the factory method.' },
            { term: 'Concrete Creator', definition: 'Subclass of Creator that overrides the factory method to return a specific Concrete Product (e.g., RoadLogistics returns Truck).' },
            { term: 'Product', definition: 'Interface or abstract class that declares the operations all concrete products must implement (e.g., deliver()).' }
        ],
        tradeoffs: {
            pros: [
                'Eliminates tight coupling between Creator and Concrete Products',
                'Open/Closed Principle — extend without modifying existing code',
                'Single Responsibility — each creator handles one product type',
                'Supports the Dependency Inversion Principle — high-level code depends on abstractions'
            ],
            cons: [
                'Requires a parallel class hierarchy (creator per product), increasing class count',
                'More indirection than direct construction — harder to trace which object is created',
                'Overkill if the product family is small and unlikely to grow',
                'Subclassing solely for object creation can feel heavyweight'
            ],
            whenToUse: 'Use when the exact type of object to create is determined by subclasses, when you want to provide a hook for extensions, or when a class delegates instantiation responsibility to one of several helper subclasses.'
        }
    }
};

/* ===== Mode: logistics ===== */
PV['factory-method'].logistics = {
    init: function() {
        renderFactoryMethodLogistics();
    },
    steps: function() {
        return [
            { elementId: 'fm-logistics', label: 'Client calls planDelivery()', description: 'Client invokes planDelivery() on the abstract Logistics reference', descriptionKey: 'factory-method.step.logistics.0', logType: 'REQUEST', badgePosition: 'top' },
            { elementId: 'fm-logistics', label: 'Logistics.planDelivery()', description: 'planDelivery() internally calls the abstract createTransport() factory method', descriptionKey: 'factory-method.step.logistics.1', logType: 'FLOW', noArrowFromPrev: true, badgePosition: 'left' },
            { elementId: 'fm-road-logistics', label: 'RoadLogistics.createTransport()', description: 'Concrete creator overrides createTransport() to instantiate a Truck', descriptionKey: 'factory-method.step.logistics.2', logType: 'FLOW', arrowFromId: 'fm-logistics' },
            { elementId: 'fm-truck', label: 'new Truck()', description: 'Truck constructor is invoked by RoadLogistics', descriptionKey: 'factory-method.step.logistics.3', logType: 'CREATE', spawnId: 'obj-fm-truck', spawnLabel: ':Truck', arrowFromId: 'fm-road-logistics' },
            { elementId: 'obj-fm-truck', label: ':Truck', description: 'Truck instance is returned to planDelivery()', descriptionKey: 'factory-method.step.logistics.4', logType: 'FLOW', noArrowFromPrev: true, badgePosition: 'right' },
            { elementId: 'fm-transport', label: 'Transport.deliver()', description: 'planDelivery() calls deliver() on the returned Transport reference', descriptionKey: 'factory-method.step.logistics.5', logType: 'FLOW', arrowFromId: 'fm-logistics', badgePosition: 'top' },
            { elementId: 'obj-fm-truck', label: 'Truck.deliver()', description: 'Concrete Truck executes delivery by road', descriptionKey: 'factory-method.step.logistics.6', logType: 'FLOW', arrowFromId: 'fm-transport' },
            { elementId: 'fm-logistics', label: 'Delivery complete', description: 'planDelivery() finishes — goods delivered by Truck', descriptionKey: 'factory-method.step.logistics.7', logType: 'RESPONSE', arrowFromId: 'obj-fm-truck' }
        ];
    },
    stepOptions: function() { return { requestLabel: I18N.t('factory-method.stepLabel.logistics', null, 'Plan delivery — subclass selects transport') }; },
    run: function() {
        PV.animateFlow(PV['factory-method'].logistics.steps(), PV['factory-method'].logistics.stepOptions());
    }
};

PV['factory-method'].codeExamples = {
    logistics: {
        php: `<?php
declare(strict_types=1);

interface Transport
{
    public function deliver(): string;
}

readonly class Truck implements Transport
{
    public function deliver(): string
    {
        return 'Delivering by road';
    }
}

readonly class Ship implements Transport
{
    public function deliver(): string
    {
        return 'Delivering by sea';
    }
}

abstract class Logistics
{
    abstract protected function createTransport(): Transport;

    public function planDelivery(): string
    {
        $transport = $this->createTransport();
        return $transport->deliver();
    }
}

class RoadLogistics extends Logistics
{
    protected function createTransport(): Transport
    {
        return new Truck();
    }
}

class SeaLogistics extends Logistics
{
    protected function createTransport(): Transport
    {
        return new Ship();
    }
}

// Client
$logistics = new RoadLogistics();
echo $logistics->planDelivery();`,

        go: `package main

import "fmt"

type Transport interface {
	Deliver() string
}

type Truck struct{}

func (t Truck) Deliver() string { return "Delivering by road" }

type Ship struct{}

func (s Ship) Deliver() string { return "Delivering by sea" }

type Logistics interface {
	CreateTransport() Transport
}

func PlanDelivery(l Logistics) string {
	transport := l.CreateTransport()
	return transport.Deliver()
}

type RoadLogistics struct{}

func (r RoadLogistics) CreateTransport() Transport { return Truck{} }

type SeaLogistics struct{}

func (s SeaLogistics) CreateTransport() Transport { return Ship{} }

func main() {
	var logistics Logistics = RoadLogistics{}
	fmt.Println(PlanDelivery(logistics))
}`,

        python: `from abc import ABC, abstractmethod
from typing import override


class Transport(ABC):
    @abstractmethod
    def deliver(self) -> str: ...


class Truck(Transport):
    @override
    def deliver(self) -> str:
        return "Delivering by road"


class Ship(Transport):
    @override
    def deliver(self) -> str:
        return "Delivering by sea"


class Logistics(ABC):
    @abstractmethod
    def create_transport(self) -> Transport: ...

    def plan_delivery(self) -> str:
        transport = self.create_transport()
        return transport.deliver()


class RoadLogistics(Logistics):
    @override
    def create_transport(self) -> Transport:
        return Truck()


class SeaLogistics(Logistics):
    @override
    def create_transport(self) -> Transport:
        return Ship()


# Client
logistics: Logistics = RoadLogistics()
print(logistics.plan_delivery())`,

        rust: `use std::fmt;

trait Transport: fmt::Display {
    fn deliver(&self) -> &str;
}

struct Truck;
impl Transport for Truck {
    fn deliver(&self) -> &str { "Delivering by road" }
}
impl fmt::Display for Truck {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.deliver())
    }
}

struct Ship;
impl Transport for Ship {
    fn deliver(&self) -> &str { "Delivering by sea" }
}
impl fmt::Display for Ship {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.deliver())
    }
}

trait Logistics {
    fn create_transport(&self) -> Box<dyn Transport>;

    fn plan_delivery(&self) -> String {
        let transport = self.create_transport();
        transport.deliver().to_string()
    }
}

struct RoadLogistics;
impl Logistics for RoadLogistics {
    fn create_transport(&self) -> Box<dyn Transport> {
        Box::new(Truck)
    }
}

struct SeaLogistics;
impl Logistics for SeaLogistics {
    fn create_transport(&self) -> Box<dyn Transport> {
        Box::new(Ship)
    }
}

fn main() {
    let logistics: Box<dyn Logistics> = Box::new(RoadLogistics);
    println!("{}", logistics.plan_delivery());
}`
    }
}
