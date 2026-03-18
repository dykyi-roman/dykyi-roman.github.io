/* ===== Visitor Pattern ===== */

PV['visitor'] = {};

PV['visitor'].modes = [
    { id: 'export', label: 'Export', desc: 'Shape export to different formats: XMLExportVisitor and JSONExportVisitor traverse shapes (Circle, Rectangle) via accept(visitor), producing XML or JSON output without modifying shape classes.' }
];

PV['visitor'].depRules = [
    { name: 'Client', role: 'Creates visitors, iterates shapes, and calls accept(visitor) on each' },
    { name: 'Visitor (interface)', role: 'Declares visit methods for each concrete element type (visitCircle, visitRectangle)' },
    { name: 'XMLExportVisitor', role: 'Exports shapes to XML format by implementing each visit method' },
    { name: 'JSONExportVisitor', role: 'Exports shapes to JSON format by implementing each visit method' },
    { name: 'Shape (interface)', role: 'Declares accept(visitor) method — entry point for double dispatch' },
    { name: 'Circle', role: 'Concrete shape with radius; delegates to visitor.visitCircle(this) in accept()' },
    { name: 'Rectangle', role: 'Concrete shape with width and height; delegates to visitor.visitRectangle(this) in accept()' }
];

/* ---------- Shared render functions ---------- */

function renderVisitorExport() {
    var canvas = document.getElementById('pv-canvas');
    canvas.innerHTML =
        '<div class="layout-pattern-hierarchy" style="gap: 50px; padding: 30px 20px;">' +
            /* Row 1: Client + Visitor interface + Shape interface */
            '<div class="pv-hierarchy-row" style="gap: 80px;">' +
                PV.renderClass('cls-vs-client', 'Client', {
                    methods: ['exportShapes(shapes)'],
                    tooltip: I18N.t('visitor.tooltip.client', null, 'Client — creates visitors, iterates shapes, and calls accept(visitor) on each')
                }) +
                PV.renderClass('cls-vs-visitor', 'Visitor', {
                    stereotype: 'interface',
                    methods: ['visitCircle(c)', 'visitRectangle(r)'],
                    tooltip: I18N.t('visitor.tooltip.visitor', null, 'Visitor interface — declares a visit method per concrete element type, enabling double dispatch')
                }) +
                PV.renderClass('cls-vs-shape', 'Shape', {
                    stereotype: 'interface',
                    methods: ['accept(visitor)'],
                    tooltip: I18N.t('visitor.tooltip.shape', null, 'Element interface — each shape accepts a visitor and calls the appropriate visit method on it')
                }) +
            '</div>' +
            /* Row 2: Concrete visitors + Concrete shapes */
            '<div class="pv-hierarchy-row" style="gap: 60px; margin-top: 40px;">' +
                PV.renderClass('cls-vs-xml', 'XMLExportVisitor', {
                    methods: ['visitCircle(c)', 'visitRectangle(r)'],
                    tooltip: I18N.t('visitor.tooltip.xml', null, 'Concrete Visitor that serializes each shape to XML format')
                }) +
                PV.renderClass('cls-vs-json', 'JSONExportVisitor', {
                    methods: ['visitCircle(c)', 'visitRectangle(r)'],
                    tooltip: I18N.t('visitor.tooltip.json', null, 'Concrete Visitor that serializes each shape to JSON format')
                }) +
                PV.renderClass('cls-vs-circle', 'Circle', {
                    fields: ['radius: float'],
                    methods: ['accept(v)'],
                    tooltip: I18N.t('visitor.tooltip.circle', null, 'Concrete element — accept(v) calls v.visitCircle(this), enabling the visitor to access radius')
                }) +
                PV.renderClass('cls-vs-rect', 'Rectangle', {
                    fields: ['width: float', 'height: float'],
                    methods: ['accept(v)'],
                    tooltip: I18N.t('visitor.tooltip.rect', null, 'Concrete element — accept(v) calls v.visitRectangle(this), enabling the visitor to access width and height')
                }) +
            '</div>' +
            /* Row 3: Object instances */
            '<div class="pv-hierarchy-row" style="gap: 80px; margin-top: 20px;">' +
                PV.renderObject('obj-xml', ':XMLExportVisitor', { tooltip: I18N.t('visitor.tooltip.obj-xml', null, 'Instance of XMLExportVisitor — visits shapes and produces XML output') }) +
                PV.renderObject('obj-json', ':JSONExportVisitor', { tooltip: I18N.t('visitor.tooltip.obj-json', null, 'Instance of JSONExportVisitor — visits shapes and produces JSON output') }) +
                PV.renderObject('obj-circle', ':Circle', { tooltip: I18N.t('visitor.tooltip.obj-circle', null, 'Circle instance exported by the visitor') }) +
                PV.renderObject('obj-rect', ':Rectangle', { tooltip: I18N.t('visitor.tooltip.obj-rect', null, 'Rectangle instance exported by the visitor') }) +
            '</div>' +
            '<div class="pv-flow-legend">' +
                '<div class="legend-item"><span class="legend-line-sync"></span> ' + I18N.t('ui.legend.flow', null, 'Flow') + '</div>' +
                '<div class="legend-item"><span class="legend-line-create"></span> ' + I18N.t('ui.legend.create', null, 'Create') + '</div>' +
                '<div class="legend-item"><span class="legend-line-response"></span> ' + I18N.t('ui.legend.response', null, 'Response') + '</div>' +
                '<div class="legend-item"><span class="legend-line-inherit"></span> ' + I18N.t('ui.legend.inherit', null, 'Inherit') + '</div>' +
                '<div class="legend-item"><span class="legend-line-depend"></span> ' + I18N.t('ui.legend.uses', null, 'Uses') + '</div>' +
                '<div class="legend-item"><span style="display:inline-block;width:20px;height:14px;border:2px dashed var(--pv-accent);border-radius:2px;background:var(--pv-accent-bg);"></span> ' + I18N.t('ui.legend.object', null, 'Object') + '</div>' +
            '</div>' +
        '</div>';

    setTimeout(function() {
        PV.renderRelation('cls-vs-xml', 'cls-vs-visitor', 'inherit');
        PV.renderRelation('cls-vs-json', 'cls-vs-visitor', 'inherit');
        PV.renderRelation('cls-vs-circle', 'cls-vs-shape', 'inherit');
        PV.renderRelation('cls-vs-rect', 'cls-vs-shape', 'inherit');
        PV.renderRelation('cls-vs-shape', 'cls-vs-visitor', 'depend');
        PV.renderRelation('cls-vs-client', 'cls-vs-shape', 'depend');
    }, 100);
}

/* ---------- Details ---------- */

PV['visitor'].details = {
    export: {
        principles: [
            'Separate algorithms from the objects they operate on — adding new export formats requires no changes to shape classes',
            'Double Dispatch: the element calls the correct visit method on the visitor, resolving both the element and visitor types at runtime',
            'Open/Closed Principle: new visitors (e.g., SVGExportVisitor) can be added without modifying existing elements or visitors',
            'Single Responsibility: each visitor encapsulates one operation (XML export, JSON export) across all element types',
            'Element stability assumption: the pattern works best when the element hierarchy changes rarely, since adding a new element requires updating all visitors'
        ],
        concepts: [
            { term: 'Client / Object Structure', definition: 'The client creates a visitor, holds a collection of elements (shapes), and iterates them calling accept(visitor) on each — driving the double dispatch process.' },
            { term: 'Visitor', definition: 'An interface declaring a visit method for each concrete element type. Each concrete visitor implements these methods with operation-specific logic.' },
            { term: 'Element', definition: 'An object (Shape) that exposes an accept(visitor) method. Inside accept(), it calls the visitor\'s type-specific method (e.g., visitor.visitCircle(this)).' },
            { term: 'Double Dispatch', definition: 'The technique where accept() delegates to the visitor, which then calls back the correct visit method — resolving both the element type and the visitor type dynamically.' }
        ],
        tradeoffs: {
            pros: [
                'New operations can be added without modifying element classes — just create a new visitor',
                'Related behaviors are gathered in one visitor class instead of scattered across element classes',
                'A visitor can accumulate state as it traverses the object structure (e.g., building an XML document)',
                'Works well with Composite: visitors can walk tree structures and process each node'
            ],
            cons: [
                'Adding a new element type (e.g., Triangle) requires updating every visitor implementation',
                'Visitors may need access to element internals, potentially breaking encapsulation',
                'Double dispatch adds indirection that can be confusing for developers unfamiliar with the pattern',
                'Overkill when the element hierarchy changes frequently or when only one or two operations are needed'
            ],
            whenToUse: 'Use when you need to perform many unrelated operations on a stable set of element types, and you want to keep those operations separate from the element classes — for example, exporting, rendering, validation, or analysis passes over a document or AST.'
        }
    }
};

/* =================================================================
   MODE: export
   ================================================================= */

PV['visitor'].export = {
    init: function() {
        renderVisitorExport();
    },
    steps: function() {
        return [
            {
                elementId: 'cls-vs-client',
                label: 'Client',
                description: 'Client creates XMLExportVisitor',
                descriptionKey: 'visitor.step.export.0',
                logType: 'REQUEST'
            },
            {
                elementId: 'obj-xml',
                label: ':XMLExportVisitor',
                description: 'XMLExportVisitor instantiated',
                descriptionKey: 'visitor.step.export.1',
                logType: 'CREATE',
                spawnId: 'obj-xml'
            },
            {
                elementId: 'cls-vs-circle',
                label: 'Circle',
                description: 'circle.accept(xmlVisitor)',
                descriptionKey: 'visitor.step.export.2',
                logType: 'FLOW',
                arrowFromId: 'cls-vs-client'
            },
            {
                elementId: 'cls-vs-xml',
                label: 'XMLExportVisitor',
                description: 'visitCircle(circle) \u2192 "<circle r=5/>"',
                descriptionKey: 'visitor.step.export.3',
                logType: 'FLOW',
                badgePosition: 'right'
            },
            {
                elementId: 'cls-vs-rect',
                label: 'Rectangle',
                description: 'rectangle.accept(xmlVisitor)',
                descriptionKey: 'visitor.step.export.4',
                logType: 'FLOW',
                arrowFromId: 'cls-vs-client'
            },
            {
                elementId: 'cls-vs-xml',
                label: 'XMLExportVisitor',
                description: 'visitRectangle(rect) \u2192 "<rect w=10 h=5/>"',
                descriptionKey: 'visitor.step.export.5',
                logType: 'FLOW',
                badgePosition: 'left'
            },
            {
                elementId: 'obj-circle',
                label: ':Circle',
                description: 'Circle exported to XML',
                descriptionKey: 'visitor.step.export.6',
                logType: 'CREATE',
                spawnId: 'obj-circle',
                arrowFromId: 'cls-vs-circle'
            },
            {
                elementId: 'obj-rect',
                label: ':Rectangle',
                description: 'Rectangle exported to XML',
                descriptionKey: 'visitor.step.export.7',
                logType: 'CREATE',
                spawnId: 'obj-rect',
                arrowFromId: 'cls-vs-rect'
            },
            {
                elementId: 'cls-vs-json',
                label: 'JSONExportVisitor',
                description: 'Client swaps to JSONExportVisitor',
                descriptionKey: 'visitor.step.export.8',
                logType: 'FLOW',
                arrowFromId: 'cls-vs-client'
            },
            {
                elementId: 'obj-json',
                label: ':JSONExportVisitor',
                description: 'All shapes exported \u2014 no shape code changed',
                descriptionKey: 'visitor.step.export.9',
                logType: 'RESPONSE',
                spawnId: 'obj-json'
            }
        ];
    },
    stepOptions: function() {
        return { requestLabel: I18N.t('visitor.stepLabel.export', null, 'Export shapes to XML and JSON via Visitor') };
    },
    run: function() {
        PV.animateFlow(PV['visitor'].export.steps(), PV['visitor'].export.stepOptions());
    }
};

PV['visitor'].codeExamples = {
    export: {
        php: `<?php
declare(strict_types=1);

interface Shape
{
    public function accept(ExportVisitor $visitor): string;
}

readonly class Circle implements Shape
{
    public function __construct(
        public float $radius,
    ) {}

    public function accept(ExportVisitor $visitor): string
    {
        return $visitor->visitCircle($this);
    }
}

readonly class Rectangle implements Shape
{
    public function __construct(
        public float $width,
        public float $height,
    ) {}

    public function accept(ExportVisitor $visitor): string
    {
        return $visitor->visitRectangle($this);
    }
}

interface ExportVisitor
{
    public function visitCircle(Circle $circle): string;
    public function visitRectangle(Rectangle $rectangle): string;
}

readonly class XMLExportVisitor implements ExportVisitor
{
    public function visitCircle(Circle $circle): string
    {
        return "<circle r=\\"{$circle->radius}\\"/>";
    }

    public function visitRectangle(Rectangle $rectangle): string
    {
        return "<rect w=\\"{$rectangle->width}\\" h=\\"{$rectangle->height}\\"/>";
    }
}

readonly class JSONExportVisitor implements ExportVisitor
{
    public function visitCircle(Circle $circle): string
    {
        return json_encode(['type' => 'circle', 'radius' => $circle->radius]);
    }

    public function visitRectangle(Rectangle $rectangle): string
    {
        return json_encode(['type' => 'rectangle', 'width' => $rectangle->width, 'height' => $rectangle->height]);
    }
}

// Client
$shapes = [new Circle(5.0), new Rectangle(10.0, 5.0)];

$xml = new XMLExportVisitor();
foreach ($shapes as $shape) {
    echo $shape->accept($xml) . PHP_EOL;
}
// <circle r="5"/>
// <rect w="10" h="5"/>

$json = new JSONExportVisitor();
foreach ($shapes as $shape) {
    echo $shape->accept($json) . PHP_EOL;
}
// {"type":"circle","radius":5}
// {"type":"rectangle","width":10,"height":5}`,

        go: `package main

import (
	"encoding/json"
	"fmt"
)

type Shape interface {
	Accept(v ExportVisitor) string
}

type Circle struct {
	Radius float64
}

func (c Circle) Accept(v ExportVisitor) string {
	return v.VisitCircle(c)
}

type Rectangle struct {
	Width, Height float64
}

func (r Rectangle) Accept(v ExportVisitor) string {
	return v.VisitRectangle(r)
}

type ExportVisitor interface {
	VisitCircle(c Circle) string
	VisitRectangle(r Rectangle) string
}

type XMLExportVisitor struct{}

func (x XMLExportVisitor) VisitCircle(c Circle) string {
	return fmt.Sprintf("<circle r=\\"%.0f\\"/>", c.Radius)
}

func (x XMLExportVisitor) VisitRectangle(r Rectangle) string {
	return fmt.Sprintf("<rect w=\\"%.0f\\" h=\\"%.0f\\"/>", r.Width, r.Height)
}

type JSONExportVisitor struct{}

func (j JSONExportVisitor) VisitCircle(c Circle) string {
	data, _ := json.Marshal(map[string]any{
		"type": "circle", "radius": c.Radius,
	})
	return string(data)
}

func (j JSONExportVisitor) VisitRectangle(r Rectangle) string {
	data, _ := json.Marshal(map[string]any{
		"type": "rectangle", "width": r.Width, "height": r.Height,
	})
	return string(data)
}

func main() {
	shapes := []Shape{Circle{Radius: 5}, Rectangle{Width: 10, Height: 5}}

	xml := XMLExportVisitor{}
	for _, s := range shapes {
		fmt.Println(s.Accept(xml))
	}

	jsonV := JSONExportVisitor{}
	for _, s := range shapes {
		fmt.Println(s.Accept(jsonV))
	}
}`,

        python: `from abc import ABC, abstractmethod
from dataclasses import dataclass
import json
from typing import override


class ExportVisitor(ABC):
    @abstractmethod
    def visit_circle(self, circle: "Circle") -> str: ...

    @abstractmethod
    def visit_rectangle(self, rect: "Rectangle") -> str: ...


class Shape(ABC):
    @abstractmethod
    def accept(self, visitor: ExportVisitor) -> str: ...


@dataclass(frozen=True, slots=True)
class Circle(Shape):
    radius: float

    @override
    def accept(self, visitor: ExportVisitor) -> str:
        return visitor.visit_circle(self)


@dataclass(frozen=True, slots=True)
class Rectangle(Shape):
    width: float
    height: float

    @override
    def accept(self, visitor: ExportVisitor) -> str:
        return visitor.visit_rectangle(self)


class XMLExportVisitor(ExportVisitor):
    @override
    def visit_circle(self, circle: Circle) -> str:
        return f'<circle r="{circle.radius}"/>'

    @override
    def visit_rectangle(self, rect: Rectangle) -> str:
        return f'<rect w="{rect.width}" h="{rect.height}"/>'


class JSONExportVisitor(ExportVisitor):
    @override
    def visit_circle(self, circle: Circle) -> str:
        return json.dumps({"type": "circle", "radius": circle.radius})

    @override
    def visit_rectangle(self, rect: Rectangle) -> str:
        return json.dumps({"type": "rectangle", "width": rect.width, "height": rect.height})


# Client
shapes: list[Shape] = [Circle(5.0), Rectangle(10.0, 5.0)]

xml = XMLExportVisitor()
for s in shapes:
    print(s.accept(xml))

json_v = JSONExportVisitor()
for s in shapes:
    print(s.accept(json_v))`,

        rust: `trait Shape {
    fn accept(&self, visitor: &dyn ExportVisitor) -> String;
}

struct Circle {
    radius: f64,
}

impl Shape for Circle {
    fn accept(&self, visitor: &dyn ExportVisitor) -> String {
        visitor.visit_circle(self)
    }
}

struct Rectangle {
    width: f64,
    height: f64,
}

impl Shape for Rectangle {
    fn accept(&self, visitor: &dyn ExportVisitor) -> String {
        visitor.visit_rectangle(self)
    }
}

trait ExportVisitor {
    fn visit_circle(&self, circle: &Circle) -> String;
    fn visit_rectangle(&self, rect: &Rectangle) -> String;
}

struct XMLExportVisitor;

impl ExportVisitor for XMLExportVisitor {
    fn visit_circle(&self, circle: &Circle) -> String {
        format!(r#"<circle r="{}"/>"#, circle.radius)
    }

    fn visit_rectangle(&self, rect: &Rectangle) -> String {
        format!(r#"<rect w="{}" h="{}"/>"#, rect.width, rect.height)
    }
}

struct JSONExportVisitor;

impl ExportVisitor for JSONExportVisitor {
    fn visit_circle(&self, circle: &Circle) -> String {
        format!(
            r#"{{"type":"circle","radius":{}}}"#,
            circle.radius
        )
    }

    fn visit_rectangle(&self, rect: &Rectangle) -> String {
        format!(
            r#"{{"type":"rectangle","width":{},"height":{}}}"#,
            rect.width, rect.height
        )
    }
}

fn main() {
    let shapes: Vec<Box<dyn Shape>> = vec![
        Box::new(Circle { radius: 5.0 }),
        Box::new(Rectangle { width: 10.0, height: 5.0 }),
    ];

    let xml = XMLExportVisitor;
    for s in &shapes {
        println!("{}", s.accept(&xml));
    }

    let json = JSONExportVisitor;
    for s in &shapes {
        println!("{}", s.accept(&json));
    }
}`
    }
};
