/* ===== Memento Pattern ===== */

PV['memento'] = {};

PV['memento'].modes = [
    { id: 'editor', label: 'Editor', desc: 'A text editor with undo: the Editor (Originator) creates immutable EditorState snapshots (Mementos) after each change. The History (Caretaker) stores these snapshots on a stack. When undo is requested, History pops the last state and the Editor restores from it.' }
];

PV['memento'].depRules = [
    { name: 'Editor (Originator)', role: 'Creates and restores from mementos' },
    { name: 'EditorState (Memento)', role: 'Immutable snapshot of editor content' },
    { name: 'History (Caretaker)', role: 'Stores and manages memento stack' }
];

/* ---------- Shared render functions ---------- */

function renderMementoEditor() {
    var canvas = document.getElementById('pv-canvas');
    canvas.innerHTML =
        '<div class="layout-pattern-hierarchy" style="gap:50px;padding:30px 20px;">' +
            /* Row 1: Editor */
            '<div class="pv-hierarchy-row">' +
                PV.renderClass('cls-mm-editor', 'Editor', {
                    fields: ['content: string'],
                    methods: ['type(text)', 'save(): EditorState', 'restore(state)'],
                    tooltip: I18N.t('memento.tooltip.editor', null, 'Originator — creates snapshots of its internal state and can restore from them')
                }) +
            '</div>' +
            PV.renderArrowConnector(I18N.t('ui.legend.creates', null, 'creates')) +
            /* Row 2: EditorState */
            '<div class="pv-hierarchy-row">' +
                PV.renderClass('cls-mm-memento', 'EditorState', {
                    fields: ['content: string', 'timestamp: Date'],
                    methods: ['getContent(): string'],
                    tooltip: I18N.t('memento.tooltip.memento', null, 'Memento — immutable snapshot storing the editor content at a point in time')
                }) +
            '</div>' +
            PV.renderArrowConnector(I18N.t('ui.legend.stored_in', null, 'stored in')) +
            /* Row 3: History */
            '<div class="pv-hierarchy-row">' +
                PV.renderClass('cls-mm-history', 'History', {
                    fields: ['states: EditorState[]'],
                    methods: ['push(state)', 'pop(): EditorState'],
                    tooltip: I18N.t('memento.tooltip.history', null, 'Caretaker — maintains a stack of mementos without examining their contents')
                }) +
            '</div>' +
            /* Row 4: Objects */
            '<div class="pv-hierarchy-row" style="gap:50px;margin-top:20px;">' +
                PV.renderObject('obj-state1', 'State: "Hello"', { tooltip: I18N.t('memento.tooltip.obj-state1', null, 'Snapshot after typing "Hello" — pushed onto History stack') }) +
                PV.renderObject('obj-state2', 'State: "Hello World"', { tooltip: I18N.t('memento.tooltip.obj-state2', null, 'Snapshot after typing " World" — pushed onto History stack') }) +
                PV.renderObject('obj-state3', 'State: "Hello"', { tooltip: I18N.t('memento.tooltip.obj-state3', null, 'State restored from History after undo') }) +
                PV.renderObject('obj-editor', ':Editor', { tooltip: I18N.t('memento.tooltip.obj-editor', null, 'Editor instance with content restored to "Hello"') }) +
            '</div>' +
            /* Flow legend */
            '<div class="pv-flow-legend">' +
                '<div class="legend-item"><span class="legend-line-sync"></span> ' + I18N.t('ui.legend.flow', null, 'Flow') + '</div>' +
                '<div class="legend-item"><span class="legend-line-create"></span> ' + I18N.t('ui.legend.create', null, 'Create') + '</div>' +
                '<div class="legend-item"><span class="legend-line-response"></span> ' + I18N.t('ui.legend.response', null, 'Response') + '</div>' +
                '<div class="legend-item"><span class="legend-line-compose"></span> ' + I18N.t('ui.legend.compose', null, 'Compose') + '</div>' +
                '<div class="legend-item"><span class="legend-line-depend"></span> ' + I18N.t('ui.legend.uses', null, 'Uses') + '</div>' +
                '<div class="legend-item"><span style="display:inline-block;width:20px;height:14px;border:2px dashed var(--pv-accent);border-radius:2px;background:var(--pv-accent-bg);"></span> ' + I18N.t('ui.legend.object', null, 'Object') + '</div>' +
                '<div class="legend-item"><span style="color:#10B981;font-weight:bold;font-size:13px;">&#x2713;</span> ' + I18N.t('ui.legend.property', null, 'Property') + '</div>' +
            '</div>' +
        '</div>';

    setTimeout(function() {
        PV.renderRelation('cls-mm-history', 'cls-mm-memento', 'compose');
        PV.renderRelation('cls-mm-editor', 'cls-mm-memento', 'depend');
    }, 50);
}

/* ---------- Details ---------- */

PV['memento'].details = {
    editor: {
        principles: [
            'Capture and externalize an object\'s internal state without violating encapsulation — only the Originator knows how to serialize and deserialize itself',
            'The Memento is opaque to the Caretaker — it stores and returns mementos but never inspects or modifies their contents',
            'Single Responsibility: the Editor handles editing, EditorState holds snapshots, History manages the stack — each has one job',
            'Immutability of snapshots: once created, an EditorState cannot be modified, preventing accidental corruption of saved state',
            'The Caretaker decides when to save and restore, while the Originator decides what to save — clear separation of concerns'
        ],
        concepts: [
            { term: 'Originator', definition: 'The object whose state needs to be saved and restored. It creates a memento containing a snapshot of its current internal state and can restore itself from a memento.' },
            { term: 'Memento', definition: 'An immutable value object that stores a snapshot of the Originator\'s state. It provides no setters — only the Originator can read its internals.' },
            { term: 'Caretaker', definition: 'Manages the collection of mementos (typically a stack or list). It requests saves from the Originator and passes mementos back for restoration, but never examines memento contents.' },
            { term: 'Snapshot', definition: 'A frozen copy of the Originator\'s state at a specific moment. Multiple snapshots can coexist, enabling multi-level undo and state history navigation.' }
        ],
        tradeoffs: {
            pros: [
                'Preserves encapsulation — the Caretaker never accesses the Originator\'s internal fields directly',
                'Simplifies the Originator by offloading state history management to the Caretaker',
                'Enables multi-level undo/redo with a simple stack-based approach',
                'Snapshots are immutable, preventing accidental state corruption'
            ],
            cons: [
                'Memory consumption grows with each saved snapshot — frequent saves of large state can be expensive',
                'If the Originator\'s state is complex, creating deep copies for each memento adds overhead',
                'Caretaker must manage memento lifecycle — without cleanup, old mementos leak memory',
                'In dynamically typed languages, enforcing memento opacity (preventing external access) requires extra discipline'
            ],
            whenToUse: 'Use when you need to implement undo/redo, checkpoint/rollback, or state history for an object, and you want to preserve encapsulation by keeping the saved state opaque to external objects.'
        }
    }
};

/* =================================================================
   MODE: editor
   ================================================================= */

PV['memento'].editor = {
    init: function() {
        renderMementoEditor();
    },
    steps: function() {
        return [
            {
                elementId: 'cls-mm-editor',
                label: 'Editor',
                description: 'Editor: type("Hello")',
                descriptionKey: 'memento.step.editor.0',
                logType: 'REQUEST'
            },
            {
                elementId: 'cls-mm-memento',
                label: 'EditorState',
                description: 'Editor.save() \u2192 create EditorState("Hello")',
                descriptionKey: 'memento.step.editor.1',
                logType: 'FLOW'
            },
            {
                elementId: 'obj-state1',
                label: 'State: "Hello"',
                description: 'Push EditorState to History',
                descriptionKey: 'memento.step.editor.2',
                logType: 'CREATE',
                spawnId: 'obj-state1'
            },
            {
                elementId: 'cls-mm-editor',
                label: 'Editor',
                description: 'Editor: type(" World") \u2192 content = "Hello World"',
                descriptionKey: 'memento.step.editor.3',
                logType: 'REQUEST',
                noArrowFromPrev: true,
                badgePosition: 'left'
            },
            {
                elementId: 'obj-state2',
                label: 'State: "Hello World"',
                description: 'Save() \u2192 push "Hello World" to History',
                descriptionKey: 'memento.step.editor.4',
                logType: 'CREATE',
                spawnId: 'obj-state2',
                arrowFromId: 'cls-mm-memento'
            },
            {
                elementId: 'cls-mm-history',
                label: 'History',
                description: 'Undo requested \u2192 History.pop()',
                descriptionKey: 'memento.step.editor.5',
                logType: 'FLOW',
                arrowFromId: 'cls-mm-history',
                noArrowFromPrev: true,
                badgePosition: 'left'
            },
            {
                elementId: 'cls-mm-editor',
                label: 'Editor',
                description: 'Editor.restore(state) \u2192 content = "Hello"',
                descriptionKey: 'memento.step.editor.6',
                logType: 'RESPONSE',
                arrowFromId: 'cls-mm-history'
            },
            {
                elementId: 'obj-editor',
                label: ':Editor',
                description: 'Editor restored to "Hello"',
                descriptionKey: 'memento.step.editor.7',
                logType: 'RESPONSE',
                spawnId: 'obj-editor'
            }
        ];
    },
    stepOptions: function() { return { requestLabel: I18N.t('memento.stepLabel.editor', null, 'Text editor with undo via Memento') }; },
    run: function() {
        PV.animateFlow(PV['memento'].editor.steps(), PV['memento'].editor.stepOptions());
    }
};

PV['memento'].codeExamples = {
    editor: {
        php: `<?php
declare(strict_types=1);

readonly class EditorState
{
    public function __construct(
        private string $content,
        private \\DateTimeImmutable $timestamp,
    ) {}

    public function getContent(): string
    {
        return $this->content;
    }

    public function getTimestamp(): \\DateTimeImmutable
    {
        return $this->timestamp;
    }
}

class Editor
{
    private string $content = '';

    public function type(string $text): void
    {
        $this->content .= $text;
    }

    public function getContent(): string
    {
        return $this->content;
    }

    public function save(): EditorState
    {
        return new EditorState($this->content, new \\DateTimeImmutable());
    }

    public function restore(EditorState $state): void
    {
        $this->content = $state->getContent();
    }
}

class History
{
    /** @var list<EditorState> */
    private array $states = [];

    public function push(EditorState $state): void
    {
        $this->states[] = $state;
    }

    public function pop(): EditorState
    {
        if (empty($this->states)) {
            throw new \\RuntimeException('History is empty');
        }

        return array_pop($this->states);
    }
}

// Client
$editor = new Editor();
$history = new History();

$editor->type('Hello');
$history->push($editor->save());
echo $editor->getContent(); // "Hello"

$editor->type(' World');
$history->push($editor->save());
echo $editor->getContent(); // "Hello World"

// Undo
$editor->restore($history->pop());
echo $editor->getContent(); // "Hello World" (last saved)

$editor->restore($history->pop());
echo $editor->getContent(); // "Hello"`,

        go: `package main

import (
	"fmt"
	"time"
)

type EditorState struct {
	content   string
	timestamp time.Time
}

func NewEditorState(content string) EditorState {
	return EditorState{content: content, timestamp: time.Now()}
}

func (s EditorState) GetContent() string { return s.content }

type Editor struct {
	content string
}

func (e *Editor) Type(text string) {
	e.content += text
}

func (e *Editor) GetContent() string {
	return e.content
}

func (e *Editor) Save() EditorState {
	return NewEditorState(e.content)
}

func (e *Editor) Restore(state EditorState) {
	e.content = state.GetContent()
}

type History struct {
	states []EditorState
}

func (h *History) Push(state EditorState) {
	h.states = append(h.states, state)
}

func (h *History) Pop() (EditorState, error) {
	if len(h.states) == 0 {
		return EditorState{}, fmt.Errorf("history is empty")
	}
	last := h.states[len(h.states)-1]
	h.states = h.states[:len(h.states)-1]
	return last, nil
}

func main() {
	editor := &Editor{}
	history := &History{}

	editor.Type("Hello")
	history.Push(editor.Save())
	fmt.Println(editor.GetContent()) // "Hello"

	editor.Type(" World")
	history.Push(editor.Save())
	fmt.Println(editor.GetContent()) // "Hello World"

	// Undo
	state, _ := history.Pop()
	editor.Restore(state)
	fmt.Println(editor.GetContent()) // "Hello World"

	state, _ = history.Pop()
	editor.Restore(state)
	fmt.Println(editor.GetContent()) // "Hello"
}`,

        python: `from dataclasses import dataclass, field
from datetime import datetime


@dataclass(frozen=True, slots=True)
class EditorState:
    content: str
    timestamp: datetime = field(default_factory=datetime.now)

    def get_content(self) -> str:
        return self.content


class Editor:
    def __init__(self) -> None:
        self._content: str = ""

    def type(self, text: str) -> None:
        self._content += text

    @property
    def content(self) -> str:
        return self._content

    def save(self) -> EditorState:
        return EditorState(content=self._content)

    def restore(self, state: EditorState) -> None:
        self._content = state.get_content()


class History:
    def __init__(self) -> None:
        self._states: list[EditorState] = []

    def push(self, state: EditorState) -> None:
        self._states.append(state)

    def pop(self) -> EditorState:
        if not self._states:
            raise RuntimeError("History is empty")
        return self._states.pop()


# Client
editor = Editor()
history = History()

editor.type("Hello")
history.push(editor.save())
print(editor.content)  # "Hello"

editor.type(" World")
history.push(editor.save())
print(editor.content)  # "Hello World"

# Undo
editor.restore(history.pop())
print(editor.content)  # "Hello World"

editor.restore(history.pop())
print(editor.content)  # "Hello"`,

        rust: `use std::time::Instant;

#[derive(Clone)]
struct EditorState {
    content: String,
    timestamp: Instant,
}

impl EditorState {
    fn new(content: &str) -> Self {
        Self {
            content: content.to_string(),
            timestamp: Instant::now(),
        }
    }

    fn get_content(&self) -> &str {
        &self.content
    }
}

struct Editor {
    content: String,
}

impl Editor {
    fn new() -> Self {
        Self { content: String::new() }
    }

    fn type_text(&mut self, text: &str) {
        self.content.push_str(text);
    }

    fn get_content(&self) -> &str {
        &self.content
    }

    fn save(&self) -> EditorState {
        EditorState::new(&self.content)
    }

    fn restore(&mut self, state: &EditorState) {
        self.content = state.get_content().to_string();
    }
}

struct History {
    states: Vec<EditorState>,
}

impl History {
    fn new() -> Self {
        Self { states: Vec::new() }
    }

    fn push(&mut self, state: EditorState) {
        self.states.push(state);
    }

    fn pop(&mut self) -> Option<EditorState> {
        self.states.pop()
    }
}

fn main() {
    let mut editor = Editor::new();
    let mut history = History::new();

    editor.type_text("Hello");
    history.push(editor.save());
    println!("{}", editor.get_content()); // "Hello"

    editor.type_text(" World");
    history.push(editor.save());
    println!("{}", editor.get_content()); // "Hello World"

    // Undo
    if let Some(state) = history.pop() {
        editor.restore(&state);
    }
    println!("{}", editor.get_content()); // "Hello World"

    if let Some(state) = history.pop() {
        editor.restore(&state);
    }
    println!("{}", editor.get_content()); // "Hello"
}`
    }
};
