/* ===== Command Pattern ===== */

PV['command'] = {};

PV['command'].modes = [
    { id: 'remote', label: 'Remote', desc: 'Smart home remote control: RemoteControl stores a Command and maintains an undo history. Pressing a button executes the command on the Light receiver; pressing undo reverses the last action.' }
];

PV['command'].depRules = [
    { name: 'RemoteControl (Invoker)', role: 'Stores and executes commands, maintains undo history' },
    { name: 'Command (Interface)', role: 'Declares execute() and undo() methods' },
    { name: 'TurnOnCommand', role: 'Encapsulates turning a device on' },
    { name: 'TurnOffCommand', role: 'Encapsulates turning a device off' },
    { name: 'Light (Receiver)', role: 'The actual device being controlled' }
];

/* ---------- Shared render functions ---------- */

function renderCommandRemote() {
    var canvas = document.getElementById('pv-canvas');
    canvas.innerHTML =
        '<div class="layout-pattern-hierarchy" style="gap: 50px; padding: 30px 20px;">' +
            /* Row 1: Client + RemoteControl + Command side by side */
            '<div class="pv-hierarchy-row" style="justify-content: center; gap: 60px;">' +
                PV.renderClass('cls-cm-client', 'Client', {
                    methods: ['main()'],
                    tooltip: I18N.t('command.tooltip.client', null, 'Client — creates receiver, commands, and wires them to the invoker')
                }) +
                PV.renderClass('cls-cm-invoker', 'RemoteControl', {
                    fields: ['command: Command', 'history: Command[]'],
                    methods: ['setCommand(cmd)', 'pressButton()', 'pressUndo()'],
                    tooltip: I18N.t('command.tooltip.invoker', null, 'Invoker — stores the current command and maintains a history stack for undo operations')
                }) +
                PV.renderClass('cls-cm-command', 'Command', {
                    stereotype: 'interface',
                    methods: ['execute(): void', 'undo(): void'],
                    tooltip: I18N.t('command.tooltip.command', null, 'Command interface — declares execute() and undo() methods that all concrete commands must implement')
                }) +
            '</div>' +
            /* Row 3: Concrete Commands + Receiver */
            '<div class="pv-hierarchy-row" style="gap: 60px; margin-top: 40px;">' +
                PV.renderClass('cls-cm-on', 'TurnOnCommand', {
                    fields: ['light: Light'],
                    methods: ['execute(): void', 'undo(): void'],
                    tooltip: I18N.t('command.tooltip.turnon', null, 'Concrete command — encapsulates the action of turning the light on; undo turns it off')
                }) +
                PV.renderClass('cls-cm-receiver', 'Light', {
                    fields: ['isOn: bool'],
                    methods: ['turnOn(): void', 'turnOff(): void'],
                    tooltip: I18N.t('command.tooltip.light', null, 'Receiver — the actual device that performs the work when a command is executed')
                }) +
                PV.renderClass('cls-cm-off', 'TurnOffCommand', {
                    fields: ['light: Light'],
                    methods: ['execute(): void', 'undo(): void'],
                    tooltip: I18N.t('command.tooltip.turnoff', null, 'Concrete command — encapsulates the action of turning the light off; undo turns it on')
                }) +
            '</div>' +
            /* Row 5: Object instances */
            '<div class="pv-hierarchy-row" style="gap: 80px; margin-top: 20px;">' +
                PV.renderObject('obj-on', ':TurnOnCommand', { tooltip: I18N.t('command.tooltip.obj-on', null, 'Runtime TurnOnCommand instance pushed to history after execution') }) +
                PV.renderObject('obj-off', ':TurnOffCommand', { tooltip: I18N.t('command.tooltip.obj-off', null, 'Runtime TurnOffCommand instance — result of undo operation') }) +
                PV.renderObject('obj-light', ':Light', { tooltip: I18N.t('command.tooltip.obj-light', null, 'Runtime Light instance — its state changes as commands execute and undo') }) +
            '</div>' +
            /* Legend */
            '<div class="pv-flow-legend">' +
                '<div class="legend-item"><span class="legend-line-sync"></span> ' + I18N.t('ui.legend.flow', null, 'Flow') + '</div>' +
                '<div class="legend-item"><span class="legend-line-create"></span> ' + I18N.t('ui.legend.create', null, 'Create') + '</div>' +
                '<div class="legend-item"><span class="legend-line-response"></span> ' + I18N.t('ui.legend.response', null, 'Response') + '</div>' +
                '<div class="legend-item"><span class="legend-line-inherit"></span> ' + I18N.t('ui.legend.inherit', null, 'Inherit') + '</div>' +
                '<div class="legend-item"><span class="legend-line-compose"></span> ' + I18N.t('ui.legend.compose', null, 'Compose') + '</div>' +
                '<div class="legend-item"><span class="legend-line-depend"></span> ' + I18N.t('ui.legend.uses', null, 'Uses') + '</div>' +
                '<div class="legend-item"><span style="display:inline-block;width:20px;height:14px;border:2px dashed var(--pv-accent);border-radius:2px;background:var(--pv-accent-bg);"></span> ' + I18N.t('ui.legend.object', null, 'Object') + '</div>' +
                '<div class="legend-item"><span style="color:#10B981;font-weight:bold;font-size:13px;">✓</span> ' + I18N.t('ui.legend.property', null, 'Property') + '</div>' +
            '</div>' +
        '</div>';

    setTimeout(function() {
        PV.renderRelation('cls-cm-client', 'cls-cm-invoker', 'sync');
        PV.renderRelation('cls-cm-on', 'cls-cm-command', 'inherit');
        PV.renderRelation('cls-cm-off', 'cls-cm-command', 'inherit');
        PV.renderRelation('cls-cm-invoker', 'cls-cm-command', 'compose');
        PV.renderRelation('cls-cm-on', 'cls-cm-receiver', 'depend');
        PV.renderRelation('cls-cm-off', 'cls-cm-receiver', 'depend');
    }, 50);
}

/* ---------- Details ---------- */

PV['command'].details = {
    remote: {
        principles: [
            'Encapsulate a request as an object — each action (turn on, turn off) becomes a self-contained Command with execute() and undo()',
            'Decouple invoker from receiver — RemoteControl knows nothing about Light; it only calls execute() and undo() on the Command interface',
            'Command history enables undo/redo — the invoker maintains a stack of executed commands, allowing any action to be reversed',
            'Single Responsibility Principle — each concrete command encapsulates exactly one action on the receiver',
            'Open/Closed Principle — new commands (e.g., DimCommand, ColorCommand) can be added without modifying RemoteControl or Light'
        ],
        concepts: [
            { term: 'Command', definition: 'An object that encapsulates all information needed to perform an action: the receiver, the method to invoke, and the arguments. Decouples the object that invokes the operation from the one that performs it.' },
            { term: 'Invoker', definition: 'The object (RemoteControl) that triggers command execution. It stores a reference to a Command and calls execute() without knowing what the command actually does.' },
            { term: 'Receiver', definition: 'The object (Light) that contains the actual business logic. Commands delegate work to the receiver by calling its methods (turnOn, turnOff).' },
            { term: 'Undo/Redo', definition: 'By storing executed commands in a history stack, the invoker can reverse actions by calling undo() on the last command. Redo re-executes the undone command.' }
        ],
        tradeoffs: {
            pros: [
                'Complete decoupling between invoker and receiver — RemoteControl works with any Command implementation',
                'Undo/redo is trivial — each command knows how to reverse itself',
                'Commands can be queued, logged, or serialized for deferred execution',
                'Easy to add new commands without changing existing invoker or receiver code'
            ],
            cons: [
                'Increases class count — every action requires its own Command class',
                'Simple operations become over-engineered when undo/redo is not needed',
                'Command objects add a layer of indirection between the invoker and receiver',
                'Maintaining consistent undo state can be complex when commands have side effects or depend on external state'
            ],
            whenToUse: 'Use when you need to parameterize objects with operations, queue or schedule requests for later execution, support undo/redo, or log and replay sequences of operations.'
        }
    }
};

/* =================================================================
   MODE: remote
   ================================================================= */

PV['command'].remote = {
    init: function() {
        renderCommandRemote();
    },
    steps: function() {
        return [
            {
                elementId: 'cls-cm-client',
                label: 'Client',
                description: 'Client creates Light, wraps it in TurnOnCommand, and wires to RemoteControl',
                descriptionKey: 'command.step.remote.0',
                logType: 'REQUEST'
            },
            {
                elementId: 'cls-cm-invoker',
                label: 'RemoteControl',
                description: 'setCommand(new TurnOnCommand(light)) — store command reference',
                descriptionKey: 'command.step.remote.1',
                logType: 'REQUEST',
                badgePosition: 'right'
            },
            {
                elementId: 'cls-cm-command',
                label: 'Command',
                description: 'pressButton() invokes command.execute() through the Command interface',
                descriptionKey: 'command.step.remote.2',
                logType: 'FLOW'
            },
            {
                elementId: 'cls-cm-on',
                label: 'TurnOnCommand',
                description: 'TurnOnCommand.execute() called — delegates to receiver',
                descriptionKey: 'command.step.remote.3',
                logType: 'FLOW'
            },
            {
                elementId: 'cls-cm-receiver',
                label: 'Light',
                description: 'Light.turnOn() called — isOn = true',
                descriptionKey: 'command.step.remote.4',
                logType: 'FLOW'
            },
            {
                elementId: 'obj-light',
                label: ':Light',
                description: 'Light is now ON — state changed successfully',
                descriptionKey: 'command.step.remote.5',
                logType: 'CREATE',
                spawnId: 'obj-light'
            },
            {
                elementId: 'obj-on',
                label: ':TurnOnCommand',
                description: 'Push TurnOnCommand to history stack for future undo',
                descriptionKey: 'command.step.remote.6',
                logType: 'CREATE',
                spawnId: 'obj-on'
            },
            {
                elementId: 'cls-cm-invoker',
                label: 'RemoteControl',
                description: 'pressUndo() — pop last command from history and call command.undo()',
                descriptionKey: 'command.step.remote.7',
                logType: 'REQUEST',
                badgePosition: 'left'
            },
            {
                elementId: 'obj-off',
                label: ':TurnOffCommand',
                description: 'Undo: TurnOnCommand.undo() calls Light.turnOff() — isOn = false',
                descriptionKey: 'command.step.remote.8',
                logType: 'RESPONSE',
                spawnId: 'obj-off',
                arrowFromId: 'cls-cm-receiver'
            }
        ];
    },
    stepOptions: function() {
        return { requestLabel: I18N.t('command.stepLabel.remote', null, 'Smart home remote — execute and undo') };
    },
    run: function() {
        PV.animateFlow(PV['command'].remote.steps(), PV['command'].remote.stepOptions());
    }
};

PV['command'].codeExamples = {
    remote: {
        php: `<?php
declare(strict_types=1);

interface Command
{
    public function execute(): void;
    public function undo(): void;
}

class Light
{
    private bool $isOn = false;

    public function turnOn(): void
    {
        $this->isOn = true;
        echo "Light is ON\\n";
    }

    public function turnOff(): void
    {
        $this->isOn = false;
        echo "Light is OFF\\n";
    }

    public function isOn(): bool
    {
        return $this->isOn;
    }
}

readonly class TurnOnCommand implements Command
{
    public function __construct(private Light $light) {}

    public function execute(): void
    {
        $this->light->turnOn();
    }

    public function undo(): void
    {
        $this->light->turnOff();
    }
}

readonly class TurnOffCommand implements Command
{
    public function __construct(private Light $light) {}

    public function execute(): void
    {
        $this->light->turnOff();
    }

    public function undo(): void
    {
        $this->light->turnOn();
    }
}

class RemoteControl
{
    private ?Command $command = null;
    /** @var list<Command> */
    private array $history = [];

    public function setCommand(Command $command): void
    {
        $this->command = $command;
    }

    public function pressButton(): void
    {
        $this->command?->execute();
        if ($this->command !== null) {
            $this->history[] = $this->command;
        }
    }

    public function pressUndo(): void
    {
        $last = array_pop($this->history);
        $last?->undo();
    }
}

// Client
$light = new Light();
$remote = new RemoteControl();

$remote->setCommand(new TurnOnCommand($light));
$remote->pressButton();  // Light is ON
$remote->pressUndo();    // Light is OFF

$remote->setCommand(new TurnOffCommand($light));
$remote->pressButton();  // Light is OFF
$remote->pressUndo();    // Light is ON`,

        go: `package main

import "fmt"

type Command interface {
	Execute()
	Undo()
}

type Light struct {
	IsOn bool
}

func (l *Light) TurnOn() {
	l.IsOn = true
	fmt.Println("Light is ON")
}

func (l *Light) TurnOff() {
	l.IsOn = false
	fmt.Println("Light is OFF")
}

type TurnOnCommand struct {
	light *Light
}

func (c *TurnOnCommand) Execute() { c.light.TurnOn() }
func (c *TurnOnCommand) Undo()    { c.light.TurnOff() }

type TurnOffCommand struct {
	light *Light
}

func (c *TurnOffCommand) Execute() { c.light.TurnOff() }
func (c *TurnOffCommand) Undo()    { c.light.TurnOn() }

type RemoteControl struct {
	command Command
	history []Command
}

func (r *RemoteControl) SetCommand(cmd Command) {
	r.command = cmd
}

func (r *RemoteControl) PressButton() {
	if r.command != nil {
		r.command.Execute()
		r.history = append(r.history, r.command)
	}
}

func (r *RemoteControl) PressUndo() {
	if n := len(r.history); n > 0 {
		last := r.history[n-1]
		r.history = r.history[:n-1]
		last.Undo()
	}
}

func main() {
	light := &Light{}
	remote := &RemoteControl{}

	remote.SetCommand(&TurnOnCommand{light: light})
	remote.PressButton() // Light is ON
	remote.PressUndo()   // Light is OFF

	remote.SetCommand(&TurnOffCommand{light: light})
	remote.PressButton() // Light is OFF
	remote.PressUndo()   // Light is ON
}`,

        python: `from abc import ABC, abstractmethod
from typing import override


class Command(ABC):
    @abstractmethod
    def execute(self) -> None: ...

    @abstractmethod
    def undo(self) -> None: ...


class Light:
    def __init__(self) -> None:
        self.is_on: bool = False

    def turn_on(self) -> None:
        self.is_on = True
        print("Light is ON")

    def turn_off(self) -> None:
        self.is_on = False
        print("Light is OFF")


class TurnOnCommand(Command):
    def __init__(self, light: Light) -> None:
        self._light = light

    @override
    def execute(self) -> None:
        self._light.turn_on()

    @override
    def undo(self) -> None:
        self._light.turn_off()


class TurnOffCommand(Command):
    def __init__(self, light: Light) -> None:
        self._light = light

    @override
    def execute(self) -> None:
        self._light.turn_off()

    @override
    def undo(self) -> None:
        self._light.turn_on()


class RemoteControl:
    def __init__(self) -> None:
        self._command: Command | None = None
        self._history: list[Command] = []

    def set_command(self, command: Command) -> None:
        self._command = command

    def press_button(self) -> None:
        if self._command is not None:
            self._command.execute()
            self._history.append(self._command)

    def press_undo(self) -> None:
        if self._history:
            last = self._history.pop()
            last.undo()


# Client
light = Light()
remote = RemoteControl()

remote.set_command(TurnOnCommand(light))
remote.press_button()  # Light is ON
remote.press_undo()    # Light is OFF

remote.set_command(TurnOffCommand(light))
remote.press_button()  # Light is OFF
remote.press_undo()    # Light is ON`,

        rust: `trait Command {
    fn execute(&self, light: &mut Light);
    fn undo(&self, light: &mut Light);
}

struct Light {
    is_on: bool,
}

impl Light {
    fn new() -> Self {
        Self { is_on: false }
    }

    fn turn_on(&mut self) {
        self.is_on = true;
        println!("Light is ON");
    }

    fn turn_off(&mut self) {
        self.is_on = false;
        println!("Light is OFF");
    }
}

struct TurnOnCommand;

impl Command for TurnOnCommand {
    fn execute(&self, light: &mut Light) {
        light.turn_on();
    }

    fn undo(&self, light: &mut Light) {
        light.turn_off();
    }
}

struct TurnOffCommand;

impl Command for TurnOffCommand {
    fn execute(&self, light: &mut Light) {
        light.turn_off();
    }

    fn undo(&self, light: &mut Light) {
        light.turn_on();
    }
}

struct RemoteControl {
    command: Option<Box<dyn Command>>,
    history: Vec<Box<dyn Command>>,
}

impl RemoteControl {
    fn new() -> Self {
        Self { command: None, history: Vec::new() }
    }

    fn set_command(&mut self, cmd: Box<dyn Command>) {
        self.command = Some(cmd);
    }

    fn press_button(&mut self, light: &mut Light) {
        if let Some(cmd) = self.command.take() {
            cmd.execute(light);
            self.history.push(cmd);
        }
    }

    fn press_undo(&mut self, light: &mut Light) {
        if let Some(cmd) = self.history.pop() {
            cmd.undo(light);
        }
    }
}

fn main() {
    let mut light = Light::new();
    let mut remote = RemoteControl::new();

    remote.set_command(Box::new(TurnOnCommand));
    remote.press_button(&mut light); // Light is ON
    remote.press_undo(&mut light);   // Light is OFF

    remote.set_command(Box::new(TurnOffCommand));
    remote.press_button(&mut light); // Light is OFF
    remote.press_undo(&mut light);   // Light is ON
}`
    }
}
