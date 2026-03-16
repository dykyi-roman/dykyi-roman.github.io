/* ===== Decorator Pattern ===== */

PV['decorator'] = {};

PV['decorator'].modes = [
    { id: 'coffee', label: 'Coffee Shop', desc: 'MilkDecorator and SugarDecorator wrap a SimpleCoffee to add behavior dynamically. Each decorator implements the Beverage interface and delegates to the wrapped object, adding its own cost and description. Decorators can be stacked in any order.' }
];

PV['decorator'].depRules = [
    { name: 'Component (Beverage)', role: 'Interface for objects that can have responsibilities added dynamically' },
    { name: 'ConcreteComponent (SimpleCoffee)', role: 'The base object that can be decorated' },
    { name: 'Decorator (BeverageDecorator)', role: 'Abstract class wrapping a Component, forwarding requests' },
    { name: 'ConcreteDecorators (MilkDecorator, SugarDecorator)', role: 'Add specific responsibilities to the component' }
];

/* ---------- Shared render functions ---------- */

function renderDecoratorCoffee() {
    var canvas = document.getElementById('pv-canvas');
    canvas.innerHTML =
        '<div class="layout-pattern-hierarchy">' +
            /* Row 1: Beverage interface */
            '<div class="pv-hierarchy-row">' +
                PV.renderClass('cls-dc-component', 'Beverage', {
                    stereotype: 'interface',
                    methods: ['cost(): float', 'description(): string'],
                    tooltip: I18N.t('decorator.tooltip.component', null, 'Component interface — declares operations that can be dynamically extended by decorators')
                }) +
            '</div>' +
            PV.renderArrowConnector(I18N.t('ui.legend.inherit', null, 'implements')) +
            /* Row 2: SimpleCoffee + BeverageDecorator */
            '<div class="pv-hierarchy-row" style="gap: 80px;">' +
                PV.renderClass('cls-dc-concrete', 'SimpleCoffee', {
                    methods: ['cost(): float', 'description(): string'],
                    tooltip: I18N.t('decorator.tooltip.concrete', null, 'ConcreteComponent — base coffee with no extras ($1.00)')
                }) +
                PV.renderClass('cls-dc-decorator', 'BeverageDecorator', {
                    stereotype: 'abstract',
                    fields: ['wrappee: Beverage'],
                    methods: ['cost(): float', 'description(): string'],
                    tooltip: I18N.t('decorator.tooltip.decorator', null, 'Decorator base — holds a reference to a Beverage and delegates calls')
                }) +
            '</div>' +
            PV.renderArrowConnector(I18N.t('ui.legend.inherit', null, 'extends')) +
            /* Row 3: MilkDecorator + SugarDecorator */
            '<div class="pv-hierarchy-row" style="gap: 80px;">' +
                PV.renderClass('cls-dc-milk', 'MilkDecorator', {
                    methods: ['cost(): float', 'description(): string'],
                    tooltip: I18N.t('decorator.tooltip.milk', null, 'ConcreteDecorator — adds milk ($0.50) and delegates to wrappee')
                }) +
                PV.renderClass('cls-dc-sugar', 'SugarDecorator', {
                    methods: ['cost(): float', 'description(): string'],
                    tooltip: I18N.t('decorator.tooltip.sugar', null, 'ConcreteDecorator — adds sugar ($0.25) and delegates to wrappee')
                }) +
            '</div>' +
            /* Row 4: Chain of runtime objects */
            '<div class="pv-hierarchy-row" style="gap: 60px; margin-top: 30px;">' +
                '<div style="font-size:11px;color:var(--pv-text-light);font-weight:600;text-transform:uppercase;letter-spacing:0.5px;align-self:center;margin-right:10px;">' + I18N.t('ui.label.chain', null, 'Decorator Chain') + '</div>' +
                PV.renderObject('obj-coffee', ':SimpleCoffee', { tooltip: I18N.t('decorator.tooltip.obj-coffee', null, 'Runtime base coffee object — $1.00') }) +
                '<span style="font-size:18px;color:var(--pv-text-light);align-self:center;">&rarr;</span>' +
                PV.renderObject('obj-sugar', ':SugarDecorator', { tooltip: I18N.t('decorator.tooltip.obj-sugar', null, 'Wraps SimpleCoffee — adds $0.25') }) +
                '<span style="font-size:18px;color:var(--pv-text-light);align-self:center;">&rarr;</span>' +
                PV.renderObject('obj-milk', ':MilkDecorator', { tooltip: I18N.t('decorator.tooltip.obj-milk', null, 'Wraps SugarDecorator — adds $0.50, total $1.75') }) +
            '</div>' +
            '<div class="pv-flow-legend">' +
                '<div class="legend-item"><span class="legend-line-sync"></span> ' + I18N.t('ui.legend.flow', null, 'Flow') + '</div>' +
                '<div class="legend-item"><span class="legend-line-create"></span> ' + I18N.t('ui.legend.create', null, 'Create') + '</div>' +
                '<div class="legend-item"><span class="legend-line-response"></span> ' + I18N.t('ui.legend.response', null, 'Response') + '</div>' +
                '<div class="legend-item"><span class="legend-line-inherit"></span> ' + I18N.t('ui.legend.inherit', null, 'Inherit') + '</div>' +
                '<div class="legend-item"><span class="legend-line-depend"></span> ' + I18N.t('ui.legend.compose', null, 'Compose') + '</div>' +
                '<div class="legend-item"><span style="display:inline-block;width:20px;height:14px;border:2px dashed var(--pv-accent);border-radius:2px;background:var(--pv-accent-bg);"></span> ' + I18N.t('ui.legend.object', null, 'Object') + '</div>' +
            '</div>' +
        '</div>';

    setTimeout(function() {
        PV.renderRelation('cls-dc-concrete', 'cls-dc-component', 'inherit');
        PV.renderRelation('cls-dc-decorator', 'cls-dc-component', 'inherit');
        PV.renderRelation('cls-dc-decorator', 'cls-dc-component', 'compose');
        PV.renderRelation('cls-dc-milk', 'cls-dc-decorator', 'inherit');
        PV.renderRelation('cls-dc-sugar', 'cls-dc-decorator', 'inherit');
    }, 50);
}

/* ---------- Details ---------- */

PV['decorator'].details = {
    coffee: {
        principles: [
            'Attach new behavior to objects at runtime without altering their structure',
            'Favor composition over inheritance — decorators wrap objects instead of extending classes',
            'Open/Closed Principle: add new decorators without modifying existing component or decorator code',
            'Single Responsibility: each decorator handles exactly one added behavior (milk, sugar, etc.)',
            'Transparent to the client: decorated objects share the same interface as the original component'
        ],
        concepts: [
            { term: 'Component', definition: 'The Beverage interface that both concrete components and decorators implement. The client interacts only with this interface, unaware of decoration.' },
            { term: 'Decorator', definition: 'BeverageDecorator is an abstract wrapper that holds a reference to a Beverage and forwards calls, allowing subclasses to add behavior before or after delegation.' },
            { term: 'Wrapping', definition: 'Each decorator wraps another Beverage object. MilkDecorator wraps a SugarDecorator, which wraps a SimpleCoffee — forming a chain of responsibility.' },
            { term: 'Recursive Composition', definition: 'Decorators can be stacked in any order and quantity: new MilkDecorator(new SugarDecorator(new SimpleCoffee())). Each layer adds its own behavior and delegates to the next.' }
        ],
        tradeoffs: {
            pros: [
                'Add responsibilities dynamically at runtime without subclassing',
                'Multiple decorators can be combined in any order for flexible behavior composition',
                'Each decorator class is small and focused — easy to test and maintain',
                'Avoids feature-laden base classes: use decorators instead of a monolithic class with all features'
            ],
            cons: [
                'Many small decorator classes can be hard to manage and understand in aggregate',
                'Removing a specific decorator from the middle of a chain is difficult',
                'Debugging can be challenging — stack traces traverse multiple wrapper layers',
                'Order of decoration can matter, leading to subtle bugs if decorators are stacked incorrectly'
            ],
            whenToUse: 'Use when you need to add behavior to individual objects without affecting others of the same class, when extension by subclassing would lead to a combinatorial explosion of classes, or when responsibilities should be added and removed dynamically at runtime.'
        }
    }
};

/* ---------- Mode: coffee ---------- */

PV['decorator'].coffee = {
    init: function() {
        renderDecoratorCoffee();
    },
    steps: function() {
        return [
            { elementId: 'cls-dc-concrete', label: 'SimpleCoffee', description: 'Create SimpleCoffee ($1.00)', descriptionKey: 'decorator.step.coffee.0', logType: 'REQUEST' },
            { elementId: 'obj-coffee', label: ':SimpleCoffee', description: ':SimpleCoffee spawned', descriptionKey: 'decorator.step.coffee.1', logType: 'CREATE', spawnId: 'obj-coffee' },
            { elementId: 'cls-dc-sugar', label: 'SugarDecorator', description: 'Wrap with SugarDecorator', descriptionKey: 'decorator.step.coffee.2', logType: 'FLOW', arrowFromId: 'obj-coffee' },
            { elementId: 'obj-sugar', label: ':SugarDecorator', description: ':SugarDecorator wrapping :SimpleCoffee', descriptionKey: 'decorator.step.coffee.3', logType: 'CREATE', spawnId: 'obj-sugar' },
            { elementId: 'cls-dc-milk', label: 'MilkDecorator', description: 'Wrap with MilkDecorator', descriptionKey: 'decorator.step.coffee.4', logType: 'FLOW', arrowFromId: 'obj-sugar' },
            { elementId: 'obj-milk', label: ':MilkDecorator', description: ':MilkDecorator wrapping :SugarDecorator', descriptionKey: 'decorator.step.coffee.5', logType: 'CREATE', spawnId: 'obj-milk' },
            { elementId: 'obj-milk', label: ':MilkDecorator', description: 'Client calls decorated.cost()', descriptionKey: 'decorator.step.coffee.6', logType: 'FLOW', noArrowFromPrev: true, badgePosition: 'top' },
            { elementId: 'obj-milk', label: ':MilkDecorator', description: 'MilkDecorator.cost() = $0.50 + wrappee.cost()', descriptionKey: 'decorator.step.coffee.7', logType: 'FLOW', noArrowFromPrev: true, badgePosition: 'right' },
            { elementId: 'obj-sugar', label: ':SugarDecorator', description: 'SugarDecorator.cost() = $0.25 + wrappee.cost()', descriptionKey: 'decorator.step.coffee.8', logType: 'FLOW' },
            { elementId: 'obj-coffee', label: ':SimpleCoffee', description: 'Total = $1.75 ($1.00 + $0.25 + $0.50)', descriptionKey: 'decorator.step.coffee.9', logType: 'RESPONSE' }
        ];
    },
    stepOptions: function() { return { requestLabel: I18N.t('decorator.stepLabel.coffee', null, 'Build decorated coffee with Decorator pattern') }; },
    run: function() {
        PV.animateFlow(PV['decorator'].coffee.steps(), PV['decorator'].coffee.stepOptions());
    }
};

PV['decorator'].codeExamples = {
    coffee: {
        php: `<?php
declare(strict_types=1);

interface Beverage
{
    public function cost(): float;
    public function description(): string;
}

readonly class SimpleCoffee implements Beverage
{
    public function cost(): float
    {
        return 1.00;
    }

    public function description(): string
    {
        return 'Simple coffee';
    }
}

abstract readonly class BeverageDecorator implements Beverage
{
    public function __construct(
        protected Beverage $wrappee,
    ) {}

    public function cost(): float
    {
        return $this->wrappee->cost();
    }

    public function description(): string
    {
        return $this->wrappee->description();
    }
}

readonly class MilkDecorator extends BeverageDecorator
{
    public function cost(): float
    {
        return $this->wrappee->cost() + 0.50;
    }

    public function description(): string
    {
        return $this->wrappee->description() . ', milk';
    }
}

readonly class SugarDecorator extends BeverageDecorator
{
    public function cost(): float
    {
        return $this->wrappee->cost() + 0.25;
    }

    public function description(): string
    {
        return $this->wrappee->description() . ', sugar';
    }
}

// Client
$coffee = new SimpleCoffee();
$coffee = new SugarDecorator($coffee);
$coffee = new MilkDecorator($coffee);
echo $coffee->description(); // Simple coffee, sugar, milk
echo '$' . number_format($coffee->cost(), 2); // $1.75`,

        go: `package main

import "fmt"

type Beverage interface {
	Cost() float64
	Description() string
}

type SimpleCoffee struct{}

func (c SimpleCoffee) Cost() float64        { return 1.00 }
func (c SimpleCoffee) Description() string  { return "Simple coffee" }

type MilkDecorator struct {
	wrappee Beverage
}

func NewMilkDecorator(b Beverage) *MilkDecorator {
	return &MilkDecorator{wrappee: b}
}

func (m MilkDecorator) Cost() float64        { return m.wrappee.Cost() + 0.50 }
func (m MilkDecorator) Description() string  { return m.wrappee.Description() + ", milk" }

type SugarDecorator struct {
	wrappee Beverage
}

func NewSugarDecorator(b Beverage) *SugarDecorator {
	return &SugarDecorator{wrappee: b}
}

func (s SugarDecorator) Cost() float64        { return s.wrappee.Cost() + 0.25 }
func (s SugarDecorator) Description() string  { return s.wrappee.Description() + ", sugar" }

func main() {
	var coffee Beverage = SimpleCoffee{}
	coffee = NewSugarDecorator(coffee)
	coffee = NewMilkDecorator(coffee)
	fmt.Println(coffee.Description()) // Simple coffee, sugar, milk
	fmt.Printf("$%.2f\\n", coffee.Cost()) // $1.75
}`,

        python: `from abc import ABC, abstractmethod
from typing import override


class Beverage(ABC):
    @abstractmethod
    def cost(self) -> float: ...

    @abstractmethod
    def description(self) -> str: ...


class SimpleCoffee(Beverage):
    @override
    def cost(self) -> float:
        return 1.00

    @override
    def description(self) -> str:
        return "Simple coffee"


class BeverageDecorator(Beverage):
    def __init__(self, wrappee: Beverage) -> None:
        self._wrappee = wrappee

    @override
    def cost(self) -> float:
        return self._wrappee.cost()

    @override
    def description(self) -> str:
        return self._wrappee.description()


class MilkDecorator(BeverageDecorator):
    @override
    def cost(self) -> float:
        return self._wrappee.cost() + 0.50

    @override
    def description(self) -> str:
        return self._wrappee.description() + ", milk"


class SugarDecorator(BeverageDecorator):
    @override
    def cost(self) -> float:
        return self._wrappee.cost() + 0.25

    @override
    def description(self) -> str:
        return self._wrappee.description() + ", sugar"


# Client
coffee: Beverage = SimpleCoffee()
coffee = SugarDecorator(coffee)
coffee = MilkDecorator(coffee)
print(coffee.description())  # Simple coffee, sugar, milk
print("$%.2f" % coffee.cost())  # $1.75`,

        rust: `trait Beverage {
    fn cost(&self) -> f64;
    fn description(&self) -> String;
}

struct SimpleCoffee;

impl Beverage for SimpleCoffee {
    fn cost(&self) -> f64 { 1.00 }
    fn description(&self) -> String { "Simple coffee".into() }
}

struct MilkDecorator {
    wrappee: Box<dyn Beverage>,
}

impl MilkDecorator {
    fn new(wrappee: Box<dyn Beverage>) -> Self {
        Self { wrappee }
    }
}

impl Beverage for MilkDecorator {
    fn cost(&self) -> f64 {
        self.wrappee.cost() + 0.50
    }
    fn description(&self) -> String {
        format!("{}, milk", self.wrappee.description())
    }
}

struct SugarDecorator {
    wrappee: Box<dyn Beverage>,
}

impl SugarDecorator {
    fn new(wrappee: Box<dyn Beverage>) -> Self {
        Self { wrappee }
    }
}

impl Beverage for SugarDecorator {
    fn cost(&self) -> f64 {
        self.wrappee.cost() + 0.25
    }
    fn description(&self) -> String {
        format!("{}, sugar", self.wrappee.description())
    }
}

fn main() {
    let coffee: Box<dyn Beverage> = Box::new(SimpleCoffee);
    let coffee = Box::new(SugarDecorator::new(coffee));
    let coffee = Box::new(MilkDecorator::new(coffee));
    println!("{}", coffee.description()); // Simple coffee, sugar, milk
    println!("{:.2}", coffee.cost());    // 1.75
}`
    }
};
