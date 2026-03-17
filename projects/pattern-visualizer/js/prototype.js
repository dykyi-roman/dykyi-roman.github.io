/* ===== Prototype Pattern ===== */

PV['prototype'] = {};

PV['prototype'].modes = [
    { id: 'shapes', label: 'Shapes', desc: 'Clone geometric shapes (Circle, Rectangle, Triangle) without depending on their concrete classes. The client calls clone() on an existing shape object, and a deep copy spawns alongside the original — fully independent and ready to mutate.' },
    { id: 'registry', label: 'Registry', desc: 'Prototype Registry stores pre-configured shape prototypes. The client requests a shape by key, the registry returns a clone — no direct class references needed.' }
];

PV['prototype'].depRules = [
    { name: 'Prototype (Interface)', role: 'Declares the clone() method' },
    { name: 'Concrete Prototype', role: 'Implements clone() creating a copy of itself' },
    { name: 'Client', role: 'Creates new objects by asking prototypes to clone themselves' },
    { name: 'Prototype Registry', role: 'Stores pre-configured prototypes and returns clones on demand by key' }
];

/* ---------- Shared render functions ---------- */

function renderPrototypeShapes() {
    var canvas = document.getElementById('pv-canvas');
    canvas.innerHTML =
        '<div class="layout-pattern-hierarchy">' +
            /* Row 1: Client (left) + Shape interface (right) */
            '<div class="pv-hierarchy-row" style="justify-content: space-between; width: 100%; padding: 0 40px;">' +
                PV.renderClass('cls-p-client', 'Client', {
                    methods: ['cloneShape(shape)'],
                    tooltip: I18N.t('prototype.tooltip.client', null, 'Client clones shapes through the Prototype interface without knowing concrete types')
                }) +
                PV.renderClass('cls-p-shape', 'Shape', {
                    stereotype: 'interface',
                    methods: ['clone(): Shape', 'draw()'],
                    tooltip: I18N.t('prototype.tooltip.shape', null, 'Prototype interface declaring clone() — all concrete shapes implement this to produce copies of themselves')
                }) +
            '</div>' +
            PV.renderArrowConnector(I18N.t('ui.legend.inherit', null, 'implements')) +
            /* Row 2: Concrete prototypes */
            '<div class="pv-hierarchy-row" style="gap: 60px;">' +
                PV.renderClass('cls-p-circle', 'Circle', {
                    fields: ['radius', 'color'],
                    methods: ['clone(): Circle', 'draw()'],
                    tooltip: I18N.t('prototype.tooltip.circle', null, 'Concrete prototype that can clone itself, producing a deep copy with the same radius and color')
                }) +
                PV.renderClass('cls-p-rect', 'Rectangle', {
                    fields: ['width', 'height', 'color'],
                    methods: ['clone(): Rectangle', 'draw()'],
                    tooltip: I18N.t('prototype.tooltip.rectangle', null, 'Concrete prototype that clones itself with all dimension and color data')
                }) +
                PV.renderClass('cls-p-tri', 'Triangle', {
                    fields: ['base', 'height', 'color'],
                    methods: ['clone(): Triangle', 'draw()'],
                    tooltip: I18N.t('prototype.tooltip.triangle', null, 'Concrete prototype that produces an independent copy via clone()')
                }) +
            '</div>' +
            PV.renderArrowConnector('clone()') +
            /* Row 3: Original and clone objects */
            '<div class="layout-pattern-flow">' +
                '<div style="display:flex;flex-direction:column;align-items:center;gap:10px;">' +
                    '<div style="font-size:11px;color:var(--pv-text-light);font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">' + I18N.t('ui.label.originals', null, 'Originals') + '</div>' +
                    PV.renderObject('obj-p-circle-orig', ':Circle (original)', { visible: true, tooltip: I18N.t('prototype.tooltip.obj-circle-orig', null, 'Original Circle prototype instance — the source for cloning') }) +
                    PV.renderObject('obj-p-rect-orig', ':Rectangle (original)', { visible: true, tooltip: I18N.t('prototype.tooltip.obj-rect-orig', null, 'Original Rectangle prototype instance') }) +
                '</div>' +
                '<div style="display:flex;flex-direction:column;align-items:center;gap:10px;">' +
                    '<div style="font-size:11px;color:var(--pv-text-light);font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">' + I18N.t('ui.label.clones', null, 'Clones') + '</div>' +
                    PV.renderObject('obj-p-circle-clone', ':Circle (clone)', { tooltip: I18N.t('prototype.tooltip.obj-circle-clone', null, 'Deep copy of Circle — independent from the original') }) +
                    PV.renderObject('obj-p-rect-clone', ':Rectangle (clone)', { tooltip: I18N.t('prototype.tooltip.obj-rect-clone', null, 'Deep copy of Rectangle — independent from the original') }) +
                '</div>' +
            '</div>' +
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
        var shapeEl = document.getElementById('cls-p-shape');
        if (shapeEl) shapeEl.style.minWidth = '320px';
        PV.renderRelation('cls-p-client', 'cls-p-shape', 'depend');
        PV.renderRelation('cls-p-circle', 'cls-p-shape', 'inherit');
        PV.renderRelation('cls-p-rect', 'cls-p-shape', 'inherit');
        PV.renderRelation('cls-p-tri', 'cls-p-shape', 'inherit');
    }, 50);
}

/* ---------- Details ---------- */

PV['prototype'].details = {
    registry: {
        principles: [
            'Registry acts as a catalog — clients reference prototypes by key, not by class',
            'Each get() call returns a fresh clone, never the stored original',
            'Adding new prototypes requires only registering them, not changing client code',
            'Registry + Prototype together decouple object creation from both class hierarchy and construction details'
        ],
        concepts: [
            { term: 'ShapeRegistry', definition: 'Stores pre-built Shape prototypes keyed by name. On get(key), clones and returns the stored prototype.' },
            { term: 'Registration', definition: 'Prototypes are registered once at startup. The registry holds the "master copies" that never leave the catalog.' },
            { term: 'Keyed Access', definition: 'Client asks for "circle" or "rectangle" — no import of Circle/Rectangle classes needed.' }
        ],
        tradeoffs: {
            pros: [
                'Client is fully decoupled from concrete prototype classes',
                'Easy to add/remove/replace prototypes at runtime',
                'Centralized configuration of all available prototypes'
            ],
            cons: [
                'Registry is an extra component to maintain',
                'All prototypes must be pre-registered before use',
                'Key-based lookup loses compile-time type safety'
            ],
            whenToUse: 'Use when you have many pre-configured prototypes and clients should not know or depend on concrete classes — common in plugin systems, game engines, and document editors.'
        }
    },
    shapes: {
        principles: [
            'Clone objects without coupling to their concrete classes — the client only knows the Prototype interface',
            'Avoid costly initialization: cloning bypasses complex constructor logic and expensive resource setup',
            'Program to an interface (Shape.clone()), not an implementation (new Circle(...))',
            'Each prototype is self-contained: it knows how to copy itself, preserving encapsulation',
            'Open/Closed Principle: add new shape types without modifying client cloning code'
        ],
        concepts: [
            { term: 'Prototype Interface', definition: 'Declares clone() method that all concrete prototypes must implement. The client calls clone() without knowing the concrete type.' },
            { term: 'Deep Copy', definition: 'clone() produces a fully independent object — changing the clone does not affect the original, and vice versa.' },
            { term: 'Concrete Prototype', definition: 'A class (Circle, Rectangle, Triangle) that implements clone() by copying all its internal state into a new instance.' },
            { term: 'Prototype Registry', definition: 'An optional catalog of pre-built prototypes that clients can look up by key and clone on demand, avoiding direct class references.' }
        ],
        tradeoffs: {
            pros: [
                'Eliminates the need for complex class hierarchies of factories',
                'Cloning complex objects is faster than creating them from scratch',
                'Client code is decoupled from concrete classes entirely',
                'Adding new prototypes requires no changes to existing code'
            ],
            cons: [
                'Deep copying complex objects with circular references can be tricky',
                'Each concrete prototype must implement its own clone() correctly',
                'Cloned objects share no identity — may need careful tracking',
                'Some languages make deep copy harder than others (e.g., shallow copy pitfalls)'
            ],
            whenToUse: 'Best when creating objects is expensive (complex initialization, database reads, network calls) and you have a set of pre-configured objects that can serve as templates for new instances.'
        }
    }
};

/* ---------- Render: Registry ---------- */

function renderPrototypeRegistry() {
    var canvas = document.getElementById('pv-canvas');
    canvas.innerHTML =
        '<div class="layout-pattern-hierarchy">' +
            /* Row 0: Client (left) + ShapeRegistry (right) */
            '<div class="pv-hierarchy-row" style="justify-content: space-between; width: 100%; padding: 0 40px;">' +
                PV.renderClass('cls-pr-client', 'Client', {
                    methods: ['orderShape(type)'],
                    tooltip: I18N.t('prototype.tooltip.registry-client', null, 'Client requests shapes by key from the registry — no direct class references needed')
                }) +
                PV.renderClass('cls-pr-registry', 'ShapeRegistry', {
                    methods: ['register(key, shape)', 'get(key): Shape'],
                    tooltip: I18N.t('prototype.tooltip.registry', null, 'Stores pre-built prototypes keyed by name. get() clones and returns a copy, never the original')
                }) +
            '</div>' +
            /* Row 1: Shape interface */
            '<div class="pv-hierarchy-row">' +
                PV.renderClass('cls-pr-shape', 'Shape', {
                    stereotype: 'interface',
                    methods: ['clone(): Shape', 'draw()'],
                    tooltip: I18N.t('prototype.tooltip.shape', null, 'Prototype interface declaring clone() — all concrete shapes implement this to produce copies of themselves')
                }) +
            '</div>' +
            PV.renderArrowConnector(I18N.t('ui.legend.inherit', null, 'implements')) +
            /* Row 2: Concrete prototypes */
            '<div class="pv-hierarchy-row" style="gap: 60px;">' +
                PV.renderClass('cls-pr-circle', 'Circle', {
                    fields: ['radius', 'color'],
                    methods: ['clone(): Circle', 'draw()'],
                    tooltip: I18N.t('prototype.tooltip.circle', null, 'Concrete prototype that can clone itself, producing a deep copy with the same radius and color')
                }) +
                PV.renderClass('cls-pr-rect', 'Rectangle', {
                    fields: ['width', 'height', 'color'],
                    methods: ['clone(): Rectangle', 'draw()'],
                    tooltip: I18N.t('prototype.tooltip.rectangle', null, 'Concrete prototype that clones itself with all dimension and color data')
                }) +
                PV.renderClass('cls-pr-tri', 'Triangle', {
                    fields: ['base', 'height', 'color'],
                    methods: ['clone(): Triangle', 'draw()'],
                    tooltip: I18N.t('prototype.tooltip.triangle', null, 'Concrete prototype that produces an independent copy via clone()')
                }) +
            '</div>' +
            PV.renderArrowConnector('clone()') +
            /* Row 3: Original and clone objects */
            '<div class="layout-pattern-flow">' +
                '<div style="display:flex;flex-direction:column;align-items:center;gap:10px;">' +
                    '<div style="font-size:11px;color:var(--pv-text-light);font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">' + I18N.t('ui.label.originals', null, 'Originals') + '</div>' +
                    PV.renderObject('obj-pr-circle-orig', ':Circle (original)', { visible: true, tooltip: I18N.t('prototype.tooltip.obj-circle-orig', null, 'Original Circle prototype instance — the source for cloning') }) +
                    PV.renderObject('obj-pr-rect-orig', ':Rectangle (original)', { visible: true, tooltip: I18N.t('prototype.tooltip.obj-rect-orig', null, 'Original Rectangle prototype instance') }) +
                '</div>' +
                '<div style="display:flex;flex-direction:column;align-items:center;gap:10px;">' +
                    '<div style="font-size:11px;color:var(--pv-text-light);font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">' + I18N.t('ui.label.clones', null, 'Clones') + '</div>' +
                    PV.renderObject('obj-pr-circle-clone', ':Circle (clone)', { tooltip: I18N.t('prototype.tooltip.obj-circle-clone', null, 'Deep copy of Circle — independent from the original') }) +
                    PV.renderObject('obj-pr-rect-clone', ':Rectangle (clone)', { tooltip: I18N.t('prototype.tooltip.obj-rect-clone', null, 'Deep copy of Rectangle — independent from the original') }) +
                '</div>' +
            '</div>' +
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
        var shapeEl = document.getElementById('cls-pr-shape');
        if (shapeEl) shapeEl.style.minWidth = '320px';
        PV.renderRelation('cls-pr-client', 'cls-pr-registry', 'depend');
        PV.renderRelation('cls-pr-registry', 'cls-pr-shape', 'depend');
        PV.renderRelation('cls-pr-circle', 'cls-pr-shape', 'inherit');
        PV.renderRelation('cls-pr-rect', 'cls-pr-shape', 'inherit');
        PV.renderRelation('cls-pr-tri', 'cls-pr-shape', 'inherit');
    }, 50);
}

/* ---------- Mode: registry ---------- */

PV['prototype'].registry = {
    init: function() {
        renderPrototypeRegistry();
    },
    steps: function() {
        return [
            { elementId: 'cls-pr-registry', label: 'Client.orderShape("circle")', description: 'Client asks registry for a circle — no Circle class imported', descriptionKey: 'prototype.step.registry.0', logType: 'REQUEST', arrowFromId: 'cls-pr-client' },
            { elementId: 'obj-pr-circle-orig', label: 'registry.get("circle")', description: 'Registry looks up the stored Circle prototype by key', descriptionKey: 'prototype.step.registry.1', logType: 'FLOW', arrowFromId: 'cls-pr-registry' },
            { elementId: 'cls-pr-shape', label: 'Shape.clone()', description: 'Registry calls clone() through the Prototype interface', descriptionKey: 'prototype.step.registry.2', logType: 'FLOW', arrowFromId: 'obj-pr-circle-orig', arrowFromOffset: {x: -0.6} },
            { elementId: 'cls-pr-circle', label: 'Circle.clone()', description: 'Circle copies radius and color into a new instance', descriptionKey: 'prototype.step.registry.3', logType: 'CLONE' },
            { elementId: 'obj-pr-circle-clone', label: ':Circle (clone) spawns', description: 'Deep copy created — original stays safe in the registry', descriptionKey: 'prototype.step.registry.4', logType: 'CREATE', spawnId: 'obj-pr-circle-clone', spawnLabel: ':Circle (clone)' },
            { elementId: 'cls-pr-client', label: 'Clone delivered', description: 'Circle clone returned to client — fully independent', descriptionKey: 'prototype.step.registry.5', logType: 'RESPONSE', arrowFromId: 'obj-pr-circle-clone' },
            { elementId: 'cls-pr-registry', label: 'Client.orderShape("rectangle")', description: 'Client now asks for a rectangle by key', descriptionKey: 'prototype.step.registry.6', logType: 'REQUEST', arrowFromId: 'cls-pr-client' },
            { elementId: 'obj-pr-rect-orig', label: 'registry.get("rectangle")', description: 'Registry finds the stored Rectangle prototype', descriptionKey: 'prototype.step.registry.7', logType: 'FLOW', arrowFromId: 'cls-pr-registry' },
            { elementId: 'cls-pr-shape', label: 'Shape.clone()', description: 'Registry calls clone() on Rectangle through interface', descriptionKey: 'prototype.step.registry.8', logType: 'FLOW', arrowFromId: 'obj-pr-rect-orig', arrowFromOffset: {x: 0.6} },
            { elementId: 'cls-pr-rect', label: 'Rectangle.clone()', description: 'Rectangle copies width, height, and color into new instance', descriptionKey: 'prototype.step.registry.9', logType: 'CLONE' },
            { elementId: 'obj-pr-rect-clone', label: ':Rectangle (clone) spawns', description: 'Deep copy created — registry master copy untouched', descriptionKey: 'prototype.step.registry.10', logType: 'CREATE', spawnId: 'obj-pr-rect-clone', spawnLabel: ':Rectangle (clone)' },
            { elementId: 'cls-pr-client', label: 'Clones delivered', description: 'Both clones delivered to client — no concrete class dependencies', descriptionKey: 'prototype.step.registry.11', logType: 'RESPONSE', arrowFromId: 'obj-pr-rect-clone' }
        ];
    },
    stepOptions: function() { return { requestLabel: I18N.t('prototype.stepLabel.registry', null, 'Clone shapes via Prototype Registry') }; },
    run: function() {
        PV.animateFlow(PV['prototype'].registry.steps(), PV['prototype'].registry.stepOptions());
    }
};

/* ---------- Mode: shapes ---------- */

PV['prototype'].shapes = {
    init: function() {
        renderPrototypeShapes();
    },
    steps: function() {
        return [
            { elementId: 'obj-p-circle-orig', label: 'Original Circle', description: 'Client has a reference to the original Circle object', descriptionKey: 'prototype.step.shapes.0', logType: 'REQUEST', arrowFromId: 'cls-p-client' },
            { elementId: 'cls-p-shape', label: 'Shape.clone()', description: 'Client calls clone() through the Prototype interface', descriptionKey: 'prototype.step.shapes.1', logType: 'FLOW', arrowFromId: 'obj-p-circle-orig', arrowFromOffset: {x: -0.6} },
            { elementId: 'cls-p-circle', label: 'Circle.clone()', description: 'Circle implements clone() — copies radius and color into new instance', descriptionKey: 'prototype.step.shapes.2', logType: 'CLONE' },
            { elementId: 'obj-p-circle-clone', label: 'Circle clone spawns', description: 'Deep copy of Circle created — independent from original', descriptionKey: 'prototype.step.shapes.3', logType: 'CREATE', spawnId: 'obj-p-circle-clone', spawnLabel: ':Circle (clone)' },
            { elementId: 'obj-p-circle-clone', label: 'Clone is independent', description: 'Modifying clone.color does not affect original', descriptionKey: 'prototype.step.shapes.4', logType: 'FLOW', noArrowFromPrev: true, badgePosition: 'right' },
            { elementId: 'obj-p-rect-orig', label: 'Original Rectangle', description: 'Client now needs a copy of Rectangle', descriptionKey: 'prototype.step.shapes.5', logType: 'REQUEST', arrowFromId: 'cls-p-client', badgePosition: 'left' },
            { elementId: 'cls-p-shape', label: 'Shape.clone()', description: 'Client calls clone() on Rectangle through Prototype interface', descriptionKey: 'prototype.step.shapes.6', logType: 'FLOW', arrowFromId: 'obj-p-rect-orig', arrowFromOffset: {x: 0.6} },
            { elementId: 'cls-p-rect', label: 'Rectangle.clone()', description: 'Rectangle copies width, height, and color into new instance', descriptionKey: 'prototype.step.shapes.7', logType: 'CLONE' },
            { elementId: 'obj-p-rect-clone', label: 'Rectangle clone spawns', description: 'Deep copy of Rectangle created — fully independent', descriptionKey: 'prototype.step.shapes.8', logType: 'CREATE', spawnId: 'obj-p-rect-clone', spawnLabel: ':Rectangle (clone)' },
            { elementId: 'cls-p-client', label: 'Clones ready', description: 'Both clones returned to client — independent from originals', descriptionKey: 'prototype.step.shapes.9', logType: 'RESPONSE', arrowFromId: 'obj-p-rect-clone' }
        ];
    },
    stepOptions: function() { return { requestLabel: I18N.t('prototype.stepLabel.shapes', null, 'Clone shapes via Prototype interface') }; },
    run: function() {
        PV.animateFlow(PV['prototype'].shapes.steps(), PV['prototype'].shapes.stepOptions());
    }
};

PV['prototype'].codeExamples = {
    registry: {
        php: `<?php
declare(strict_types=1);

interface Shape
{
    public function draw(): string;
}

class Circle implements Shape
{
    public function __construct(
        public readonly float $radius,
        public string $color,
    ) {}

    public function __clone(): void {}

    public function draw(): string
    {
        return "Circle(r={$this->radius}, {$this->color})";
    }
}

class Rectangle implements Shape
{
    public function __construct(
        public readonly float $width,
        public readonly float $height,
        public string $color,
    ) {}

    public function __clone(): void {}

    public function draw(): string
    {
        return "Rect({$this->width}x{$this->height}, {$this->color})";
    }
}

class ShapeRegistry
{
    /** @var array<string, Shape> */
    private array $prototypes = [];

    public function register(string $key, Shape $shape): void
    {
        $this->prototypes[$key] = $shape;
    }

    public function get(string $key): Shape
    {
        if (!isset($this->prototypes[$key])) {
            throw new \\InvalidArgumentException("No prototype: {$key}");
        }
        return clone $this->prototypes[$key];
    }
}

// Client — uses registry, never references concrete classes
$registry = new ShapeRegistry();
$registry->register('circle', new Circle(10.0, 'red'));
$registry->register('rectangle', new Rectangle(5.0, 8.0, 'blue'));

$c = $registry->get('circle');
$r = $registry->get('rectangle');
echo $c->draw(); // Circle(r=10, red)
echo $r->draw(); // Rect(5x8, blue)`,

        go: `package main

import "fmt"

type Shape interface {
	Clone() Shape
	Draw() string
}

type Circle struct {
	Radius float64
	Color  string
}

func (c Circle) Clone() Shape { return Circle{Radius: c.Radius, Color: c.Color} }
func (c Circle) Draw() string { return fmt.Sprintf("Circle(r=%.0f, %s)", c.Radius, c.Color) }

type Rectangle struct {
	Width, Height float64
	Color         string
}

func (r Rectangle) Clone() Shape {
	return Rectangle{Width: r.Width, Height: r.Height, Color: r.Color}
}
func (r Rectangle) Draw() string {
	return fmt.Sprintf("Rect(%.0fx%.0f, %s)", r.Width, r.Height, r.Color)
}

type ShapeRegistry struct {
	prototypes map[string]Shape
}

func NewRegistry() *ShapeRegistry {
	return &ShapeRegistry{prototypes: make(map[string]Shape)}
}

func (sr *ShapeRegistry) Register(key string, s Shape) {
	sr.prototypes[key] = s
}

func (sr *ShapeRegistry) Get(key string) Shape {
	p, ok := sr.prototypes[key]
	if !ok {
		panic("no prototype: " + key)
	}
	return p.Clone()
}

func main() {
	reg := NewRegistry()
	reg.Register("circle", Circle{Radius: 10, Color: "red"})
	reg.Register("rectangle", Rectangle{Width: 5, Height: 8, Color: "blue"})

	c := reg.Get("circle")
	r := reg.Get("rectangle")
	fmt.Println(c.Draw()) // Circle(r=10, red)
	fmt.Println(r.Draw()) // Rect(5x8, blue)
}`,

        python: `from abc import ABC, abstractmethod
from copy import deepcopy
from dataclasses import dataclass
from typing import Self, override


class Shape(ABC):
    @abstractmethod
    def clone(self) -> Self: ...

    @abstractmethod
    def draw(self) -> str: ...


@dataclass(slots=True)
class Circle(Shape):
    radius: float
    color: str

    @override
    def clone(self) -> Self:
        return deepcopy(self)

    @override
    def draw(self) -> str:
        return f"Circle(r={self.radius}, {self.color})"


@dataclass(slots=True)
class Rectangle(Shape):
    width: float
    height: float
    color: str

    @override
    def clone(self) -> Self:
        return deepcopy(self)

    @override
    def draw(self) -> str:
        return f"Rect({self.width}x{self.height}, {self.color})"


class ShapeRegistry:
    def __init__(self) -> None:
        self._prototypes: dict[str, Shape] = {}

    def register(self, key: str, shape: Shape) -> None:
        self._prototypes[key] = shape

    def get(self, key: str) -> Shape:
        if key not in self._prototypes:
            raise KeyError(f"No prototype: {key}")
        return self._prototypes[key].clone()


# Client — uses registry, never references concrete classes
registry = ShapeRegistry()
registry.register("circle", Circle(10.0, "red"))
registry.register("rectangle", Rectangle(5.0, 8.0, "blue"))

c = registry.get("circle")
r = registry.get("rectangle")
print(c.draw())  # Circle(r=10.0, red)
print(r.draw())  # Rect(5.0x8.0, blue)`,

        rust: `use std::collections::HashMap;
use std::fmt;

trait Shape: ShapeClone + fmt::Display {
    fn draw(&self) -> String;
}

trait ShapeClone {
    fn clone_shape(&self) -> Box<dyn Shape>;
}

impl<T: 'static + Shape + Clone> ShapeClone for T {
    fn clone_shape(&self) -> Box<dyn Shape> { Box::new(self.clone()) }
}

#[derive(Clone)]
struct Circle { radius: f64, color: String }

impl fmt::Display for Circle {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Circle(r={}, {})", self.radius, self.color)
    }
}
impl Shape for Circle { fn draw(&self) -> String { format!("{self}") } }

#[derive(Clone)]
struct Rectangle { width: f64, height: f64, color: String }

impl fmt::Display for Rectangle {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Rect({}x{}, {})", self.width, self.height, self.color)
    }
}
impl Shape for Rectangle { fn draw(&self) -> String { format!("{self}") } }

struct ShapeRegistry {
    prototypes: HashMap<String, Box<dyn Shape>>,
}

impl ShapeRegistry {
    fn new() -> Self { Self { prototypes: HashMap::new() } }

    fn register(&mut self, key: &str, shape: Box<dyn Shape>) {
        self.prototypes.insert(key.to_string(), shape);
    }

    fn get(&self, key: &str) -> Box<dyn Shape> {
        self.prototypes.get(key)
            .unwrap_or_else(|| panic!("no prototype: {key}"))
            .clone_shape()
    }
}

fn main() {
    let mut reg = ShapeRegistry::new();
    reg.register("circle", Box::new(Circle { radius: 10.0, color: "red".into() }));
    reg.register("rectangle", Box::new(Rectangle { width: 5.0, height: 8.0, color: "blue".into() }));

    let c = reg.get("circle");
    let r = reg.get("rectangle");
    println!("{}", c.draw()); // Circle(r=10, red)
    println!("{}", r.draw()); // Rect(5x8, blue)
}`
    },
    shapes: {
        php: `<?php
declare(strict_types=1);

interface Shape
{
    public function draw(): string;
}

class Circle implements Shape
{
    public function __construct(
        public readonly float $radius,
        public string $color,
    ) {}

    public function __clone(): void
    {
        // Deep copy — all properties are scalars here
    }

    public function draw(): string
    {
        return "Circle(r={$this->radius}, {$this->color})";
    }
}

class Rectangle implements Shape
{
    public function __construct(
        public readonly float $width,
        public readonly float $height,
        public string $color,
    ) {}

    public function __clone(): void {}

    public function draw(): string
    {
        return "Rect({$this->width}x{$this->height}, {$this->color})";
    }
}

class Triangle implements Shape
{
    public function __construct(
        public readonly float $base,
        public readonly float $height,
        public string $color,
    ) {}

    public function __clone(): void {}

    public function draw(): string
    {
        return "Triangle(b={$this->base}, h={$this->height}, {$this->color})";
    }
}

// Client — uses PHP's native clone keyword
$original = new Circle(10.0, 'red');
$clone = clone $original;
$clone->color = 'blue';
echo $original->draw(); // Circle(r=10, red)
echo $clone->draw();    // Circle(r=10, blue)`,

        go: `package main

import "fmt"

type Shape interface {
	Clone() Shape
	Draw() string
}

type Circle struct {
	Radius float64
	Color  string
}

func (c Circle) Clone() Shape { return Circle{Radius: c.Radius, Color: c.Color} }
func (c Circle) Draw() string { return fmt.Sprintf("Circle(r=%.0f, %s)", c.Radius, c.Color) }

type Rectangle struct {
	Width, Height float64
	Color         string
}

func (r Rectangle) Clone() Shape {
	return Rectangle{Width: r.Width, Height: r.Height, Color: r.Color}
}
func (r Rectangle) Draw() string {
	return fmt.Sprintf("Rect(%.0fx%.0f, %s)", r.Width, r.Height, r.Color)
}

type Triangle struct {
	Base, Height float64
	Color        string
}

func (t Triangle) Clone() Shape {
	return Triangle{Base: t.Base, Height: t.Height, Color: t.Color}
}
func (t Triangle) Draw() string {
	return fmt.Sprintf("Triangle(b=%.0f, h=%.0f, %s)", t.Base, t.Height, t.Color)
}

func main() {
	original := Circle{Radius: 10, Color: "red"}
	clone := original.Clone().(Circle)
	clone.Color = "blue"
	fmt.Println(original.Draw()) // Circle(r=10, red)
	fmt.Println(clone.Draw())    // Circle(r=10, blue)
}`,

        python: `from abc import ABC, abstractmethod
from copy import deepcopy
from dataclasses import dataclass
from typing import Self, override


class Shape(ABC):
    @abstractmethod
    def clone(self) -> Self: ...

    @abstractmethod
    def draw(self) -> str: ...


@dataclass(slots=True)
class Circle(Shape):
    radius: float
    color: str

    @override
    def clone(self) -> Self:
        return deepcopy(self)

    @override
    def draw(self) -> str:
        return f"Circle(r={self.radius}, {self.color})"


@dataclass(slots=True)
class Rectangle(Shape):
    width: float
    height: float
    color: str

    @override
    def clone(self) -> Self:
        return deepcopy(self)

    @override
    def draw(self) -> str:
        return f"Rect({self.width}x{self.height}, {self.color})"


@dataclass(slots=True)
class Triangle(Shape):
    base: float
    height: float
    color: str

    @override
    def clone(self) -> Self:
        return deepcopy(self)

    @override
    def draw(self) -> str:
        return f"Triangle(b={self.base}, h={self.height}, {self.color})"


# Client
original = Circle(10.0, "red")
clone = original.clone()
clone.color = "blue"
print(original.draw())  # Circle(r=10.0, red)
print(clone.draw())     # Circle(r=10.0, blue)`,

        rust: `use std::fmt;

#[derive(Clone)]
struct Circle { radius: f64, color: String }

impl fmt::Display for Circle {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Circle(r={}, {})", self.radius, self.color)
    }
}

#[derive(Clone)]
struct Rectangle { width: f64, height: f64, color: String }

impl fmt::Display for Rectangle {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Rect({}x{}, {})", self.width, self.height, self.color)
    }
}

#[derive(Clone)]
struct Triangle { base: f64, height: f64, color: String }

impl fmt::Display for Triangle {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "Triangle(b={}, h={}, {})", self.base, self.height, self.color)
    }
}

trait Shape: ShapeClone + fmt::Display {
    fn draw(&self) -> String;
}

trait ShapeClone {
    fn clone_shape(&self) -> Box<dyn Shape>;
}

impl<T: 'static + Shape + Clone> ShapeClone for T {
    fn clone_shape(&self) -> Box<dyn Shape> { Box::new(self.clone()) }
}

impl Shape for Circle    { fn draw(&self) -> String { format!("{self}") } }
impl Shape for Rectangle { fn draw(&self) -> String { format!("{self}") } }
impl Shape for Triangle  { fn draw(&self) -> String { format!("{self}") } }

fn main() {
    let original = Circle { radius: 10.0, color: "red".into() };
    let mut clone = original.clone();
    clone.color = "blue".into();
    println!("{original}"); // Circle(r=10, red)
    println!("{clone}");    // Circle(r=10, blue)
}`
    }
}
