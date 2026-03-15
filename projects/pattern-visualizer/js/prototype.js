/* ===== Prototype Pattern ===== */

PV['prototype'] = {};

PV['prototype'].modes = [
    { id: 'shapes', label: 'Shapes', desc: 'Clone geometric shapes (Circle, Rectangle, Triangle) without depending on their concrete classes. The client calls clone() on an existing shape object, and a deep copy spawns alongside the original — fully independent and ready to mutate.' }
];

PV['prototype'].depRules = [
    { name: 'Prototype (Interface)', role: 'Declares the clone() method' },
    { name: 'Concrete Prototype', role: 'Implements clone() creating a copy of itself' },
    { name: 'Client', role: 'Creates new objects by asking prototypes to clone themselves' }
];

/* ---------- Shared render functions ---------- */

function renderPrototypeShapes() {
    var canvas = document.getElementById('pv-canvas');
    canvas.innerHTML =
        '<div class="layout-pattern-hierarchy">' +
            /* Row 1: Prototype interface */
            '<div class="pv-hierarchy-row">' +
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
                '<div class="legend-item"><span style="display:inline-block;width:20px;height:14px;border:2px dashed var(--pv-accent);border-radius:2px;background:var(--pv-accent-bg);"></span> ' + I18N.t('ui.legend.object', null, 'Object') + '</div>' +
                '<div class="legend-item"><span style="color:#10B981;font-weight:bold;font-size:13px;">✓</span> ' + I18N.t('ui.legend.property', null, 'Property') + '</div>' +
            '</div>' +
        '</div>';

    setTimeout(function() {
        var shapeEl = document.getElementById('cls-p-shape');
        if (shapeEl) shapeEl.style.minWidth = '320px';
        PV.renderRelation('cls-p-circle', 'cls-p-shape', 'inherit');
        PV.renderRelation('cls-p-rect', 'cls-p-shape', 'inherit');
        PV.renderRelation('cls-p-tri', 'cls-p-shape', 'inherit');
    }, 50);
}

/* ---------- Details ---------- */

PV['prototype'].details = {
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

/* ---------- Mode: shapes ---------- */

PV['prototype'].shapes = {
    init: function() {
        renderPrototypeShapes();
    },
    steps: function() {
        return [
            { elementId: 'obj-p-circle-orig', label: 'Original Circle', description: 'Client has a reference to the original Circle object', descriptionKey: 'prototype.step.shapes.0', logType: 'REQUEST' },
            { elementId: 'cls-p-shape', label: 'Shape.clone()', description: 'Client calls clone() through the Prototype interface', descriptionKey: 'prototype.step.shapes.1', logType: 'FLOW', arrowFromId: 'obj-p-circle-orig', arrowFromOffset: {x: -0.6} },
            { elementId: 'cls-p-circle', label: 'Circle.clone()', description: 'Circle implements clone() — copies radius and color into new instance', descriptionKey: 'prototype.step.shapes.2', logType: 'CLONE' },
            { elementId: 'obj-p-circle-clone', label: 'Circle clone spawns', description: 'Deep copy of Circle created — independent from original', descriptionKey: 'prototype.step.shapes.3', logType: 'CREATE', spawnId: 'obj-p-circle-clone', spawnLabel: ':Circle (clone)' },
            { elementId: 'obj-p-circle-clone', label: 'Clone is independent', description: 'Modifying clone.color does not affect original', descriptionKey: 'prototype.step.shapes.4', logType: 'FLOW', noArrowFromPrev: true, badgePosition: 'right' },
            { elementId: 'obj-p-rect-orig', label: 'Original Rectangle', description: 'Client now needs a copy of Rectangle', descriptionKey: 'prototype.step.shapes.5', logType: 'REQUEST', noArrowFromPrev: true, badgePosition: 'left' },
            { elementId: 'cls-p-shape', label: 'Shape.clone()', description: 'Client calls clone() on Rectangle through Prototype interface', descriptionKey: 'prototype.step.shapes.6', logType: 'FLOW', arrowFromId: 'obj-p-rect-orig', arrowFromOffset: {x: 0.6} },
            { elementId: 'cls-p-rect', label: 'Rectangle.clone()', description: 'Rectangle copies width, height, and color into new instance', descriptionKey: 'prototype.step.shapes.7', logType: 'CLONE' },
            { elementId: 'obj-p-rect-clone', label: 'Rectangle clone spawns', description: 'Deep copy of Rectangle created — fully independent', descriptionKey: 'prototype.step.shapes.8', logType: 'CREATE', spawnId: 'obj-p-rect-clone', spawnLabel: ':Rectangle (clone)' },
            { elementId: 'cls-p-shape', label: 'Prototype Pattern', description: 'Both clones exist independently — pattern complete', descriptionKey: 'prototype.step.shapes.9', logType: 'RESPONSE', arrowFromId: 'obj-p-rect-clone' }
        ];
    },
    stepOptions: function() { return { requestLabel: I18N.t('prototype.stepLabel.shapes', null, 'Clone shapes via Prototype interface') }; },
    run: function() {
        PV.animateFlow(PV['prototype'].shapes.steps(), PV['prototype'].shapes.stepOptions());
    }
};

PV['prototype'].codeExamples = {
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
