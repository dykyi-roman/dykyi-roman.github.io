/* ===== Bridge Pattern ===== */

PV['bridge'] = {};

PV['bridge'].modes = [
    { id: 'remote', label: 'Remote Control', desc: 'RemoteControl (abstraction) is separated from Device (implementation). AdvancedRemote extends the abstraction, while TV and Radio provide concrete implementations. The bridge allows both hierarchies to vary independently.' }
];

PV['bridge'].depRules = [
    { name: 'Abstraction (RemoteControl)', role: 'Defines the control interface and holds a reference to a Device' },
    { name: 'RefinedAbstraction (AdvancedRemote)', role: 'Extends the abstraction with additional operations' },
    { name: 'Implementor (Device)', role: 'Interface for implementation classes' },
    { name: 'ConcreteImplementor (TV, Radio)', role: 'Provide concrete implementations of the Device interface' }
];

/* ---------- Details per mode ---------- */

PV['bridge'].details = {
    remote: {
        principles: [
            'Separate abstraction from implementation so both can vary independently',
            'Composition over inheritance: RemoteControl holds a Device reference instead of subclassing concrete devices',
            'Open/Closed Principle: new remote types and new devices can be added without modifying existing code',
            'Single Responsibility: the abstraction handles high-level control logic, while the implementation handles device-specific behavior',
            'Dependency Inversion: the abstraction depends on the Device interface, not on concrete TV or Radio classes'
        ],
        concepts: [
            { term: 'Abstraction', definition: 'The high-level control layer (RemoteControl) that delegates work to the implementation object. It defines the interface clients interact with.' },
            { term: 'Implementor', definition: 'The interface (Device) that defines primitive operations (enable, disable, setVolume). Concrete implementations provide device-specific behavior.' },
            { term: 'Bridge', definition: 'The composition link between the abstraction and its implementation. RemoteControl holds a Device reference, forming the bridge that decouples the two hierarchies.' },
            { term: 'Orthogonal Hierarchies', definition: 'Abstraction hierarchy (RemoteControl, AdvancedRemote) and implementation hierarchy (TV, Radio) evolve independently. Adding a new remote does not require changes to devices, and vice versa.' }
        ],
        tradeoffs: {
            pros: [
                'Decouples abstraction from implementation — both hierarchies evolve independently',
                'Avoids class explosion: M abstractions x N implementations require only M + N classes instead of M x N',
                'Open/Closed Principle — add new remotes or devices without modifying existing code',
                'Runtime flexibility — swap implementations dynamically by changing the device reference'
            ],
            cons: [
                'Increases overall complexity with additional abstraction layers',
                'Can be over-engineered when the implementation is unlikely to change',
                'Adds indirection that can make debugging and code navigation harder',
                'Requires careful identification of orthogonal dimensions to apply correctly'
            ],
            whenToUse: 'Use when you want to split a monolithic class that has several variants of some functionality, when you need to extend a class in multiple independent dimensions, or when you want to switch implementations at runtime.'
        }
    }
};

/* =================================================================
   MODE: remote
   ================================================================= */

function renderBridgeRemote() {
    var canvas = document.getElementById('pv-canvas');
    canvas.innerHTML =
        '<div class="layout-pattern-hierarchy" style="gap: 40px; padding: 30px 20px;">' +
            /* Row 1: RemoteControl (Abstraction) */
            '<div class="pv-hierarchy-row" style="justify-content: center;">' +
                PV.renderClass('cls-br-abstraction', 'RemoteControl', {
                    fields: ['device: Device'],
                    methods: ['togglePower()', 'volumeUp()', 'volumeDown()'],
                    tooltip: I18N.t('bridge.tooltip.abstraction', null, 'Abstraction: defines the control interface and holds a reference to a Device implementation')
                }) +
            '</div>' +
            /* Row 2: AdvancedRemote + Device interface */
            '<div class="pv-hierarchy-row" style="gap: 100px;">' +
                PV.renderClass('cls-br-refined', 'AdvancedRemote', {
                    methods: ['mute()'],
                    tooltip: I18N.t('bridge.tooltip.refined', null, 'Refined Abstraction: extends RemoteControl with mute() — still delegates to Device')
                }) +
                PV.renderClass('cls-br-impl', 'Device', {
                    stereotype: 'interface',
                    methods: ['enable()', 'disable()', 'setVolume(vol)'],
                    tooltip: I18N.t('bridge.tooltip.impl', null, 'Implementor interface: declares primitive device operations that concrete devices must implement')
                }) +
            '</div>' +
            /* Row 3: TV + Radio */
            '<div class="pv-hierarchy-row" style="gap: 100px;">' +
                PV.renderClass('cls-br-tv', 'TV', {
                    methods: ['enable()', 'disable()', 'setVolume(vol)'],
                    tooltip: I18N.t('bridge.tooltip.tv', null, 'Concrete Implementor: TV-specific implementation of the Device interface')
                }) +
                PV.renderClass('cls-br-radio', 'Radio', {
                    methods: ['enable()', 'disable()', 'setVolume(vol)'],
                    tooltip: I18N.t('bridge.tooltip.radio', null, 'Concrete Implementor: Radio-specific implementation of the Device interface')
                }) +
            '</div>' +
            /* Row 4: Object instances */
            '<div class="pv-hierarchy-row" style="gap: 100px; margin-top: 20px;">' +
                PV.renderObject('obj-remote', ':AdvancedRemote', { tooltip: I18N.t('bridge.tooltip.obj-remote', null, 'Runtime instance of AdvancedRemote controlling a TV device') }) +
                PV.renderObject('obj-tv', ':TV', { tooltip: I18N.t('bridge.tooltip.obj-tv', null, 'Runtime instance of TV receiving commands via the bridge') }) +
            '</div>' +
            /* Flow Legend */
            '<div class="pv-flow-legend">' +
                '<div class="legend-item"><span class="legend-line-sync"></span> ' + I18N.t('ui.legend.flow', null, 'Flow') + '</div>' +
                '<div class="legend-item"><span class="legend-line-create"></span> ' + I18N.t('ui.legend.create', null, 'Create') + '</div>' +
                '<div class="legend-item"><span class="legend-line-response"></span> ' + I18N.t('ui.legend.response', null, 'Response') + '</div>' +
                '<div class="legend-item"><span class="legend-line-inherit"></span> ' + I18N.t('ui.legend.inherit', null, 'Inherit') + '</div>' +
                '<div class="legend-item"><span class="legend-line-compose"></span> ' + I18N.t('ui.legend.compose', null, 'Compose') + '</div>' +
                '<div class="legend-item"><span style="display:inline-block;width:20px;height:14px;border:2px dashed var(--pv-accent);border-radius:2px;background:var(--pv-accent-bg);"></span> ' + I18N.t('ui.legend.object', null, 'Object') + '</div>' +
            '</div>' +
        '</div>';

    setTimeout(function() {
        PV.renderRelation('cls-br-refined', 'cls-br-abstraction', 'inherit');
        PV.renderRelation('cls-br-tv', 'cls-br-impl', 'inherit');
        PV.renderRelation('cls-br-radio', 'cls-br-impl', 'inherit');
        PV.renderRelation('cls-br-abstraction', 'cls-br-impl', 'compose');
    }, 100);
}

PV['bridge'].remote = {
    init: function() {
        renderBridgeRemote();
    },
    steps: function() {
        return [
            {
                elementId: 'cls-br-refined',
                label: 'AdvancedRemote',
                description: 'Create AdvancedRemote with TV',
                descriptionKey: 'bridge.step.remote.0',
                logType: 'REQUEST'
            },
            {
                elementId: 'obj-remote',
                label: ':AdvancedRemote',
                description: ':AdvancedRemote created',
                descriptionKey: 'bridge.step.remote.1',
                logType: 'CREATE',
                spawnId: 'obj-remote'
            },
            {
                elementId: 'obj-tv',
                label: ':TV',
                description: ':TV created as implementation',
                descriptionKey: 'bridge.step.remote.2',
                logType: 'CREATE',
                spawnId: 'obj-tv',
                arrowFromId: 'obj-remote'
            },
            {
                elementId: 'cls-br-abstraction',
                label: 'RemoteControl',
                description: 'remote.togglePower()',
                descriptionKey: 'bridge.step.remote.3',
                logType: 'FLOW',
                arrowFromId: 'obj-remote'
            },
            {
                elementId: 'cls-br-tv',
                label: 'TV',
                description: 'Delegates device.enable()',
                descriptionKey: 'bridge.step.remote.4',
                logType: 'FLOW'
            },
            {
                elementId: 'obj-tv',
                label: ':TV',
                description: 'TV.enable() — TV is now ON',
                descriptionKey: 'bridge.step.remote.5',
                logType: 'RESPONSE',
                arrowFromId: 'cls-br-tv'
            },
            {
                elementId: 'cls-br-refined',
                label: 'AdvancedRemote',
                description: 'remote.mute() calls device.setVolume(0)',
                descriptionKey: 'bridge.step.remote.6',
                logType: 'FLOW',
                arrowFromId: 'obj-remote'
            },
            {
                elementId: 'obj-tv',
                label: ':TV',
                description: 'TV volume = 0',
                descriptionKey: 'bridge.step.remote.7',
                logType: 'RESPONSE',
                arrowFromId: 'cls-br-refined'
            }
        ];
    },
    stepOptions: function() {
        return { requestLabel: I18N.t('bridge.stepLabel.remote', null, 'Control device via Bridge pattern') };
    },
    run: function() {
        PV.animateFlow(PV['bridge'].remote.steps(), PV['bridge'].remote.stepOptions());
    }
};

PV['bridge'].codeExamples = {
    remote: {
        php: `<?php
declare(strict_types=1);

interface Device
{
    public function enable(): void;
    public function disable(): void;
    public function setVolume(int $volume): void;
    public function getVolume(): int;
    public function isEnabled(): bool;
}

class TV implements Device
{
    private bool $on = false;
    private int $volume = 50;

    public function enable(): void    { $this->on = true; }
    public function disable(): void   { $this->on = false; }
    public function isEnabled(): bool  { return $this->on; }
    public function getVolume(): int   { return $this->volume; }
    public function setVolume(int $volume): void
    {
        $this->volume = max(0, min(100, $volume));
    }
}

class Radio implements Device
{
    private bool $on = false;
    private int $volume = 30;

    public function enable(): void    { $this->on = true; }
    public function disable(): void   { $this->on = false; }
    public function isEnabled(): bool  { return $this->on; }
    public function getVolume(): int   { return $this->volume; }
    public function setVolume(int $volume): void
    {
        $this->volume = max(0, min(100, $volume));
    }
}

class RemoteControl
{
    public function __construct(
        protected Device $device,
    ) {}

    public function togglePower(): void
    {
        $this->device->isEnabled()
            ? $this->device->disable()
            : $this->device->enable();
    }

    public function volumeUp(): void
    {
        $this->device->setVolume($this->device->getVolume() + 10);
    }

    public function volumeDown(): void
    {
        $this->device->setVolume($this->device->getVolume() - 10);
    }
}

class AdvancedRemote extends RemoteControl
{
    public function mute(): void
    {
        $this->device->setVolume(0);
    }
}

// Client
$tv = new TV();
$remote = new AdvancedRemote($tv);
$remote->togglePower();  // TV is ON
$remote->volumeUp();     // volume = 60
$remote->mute();         // volume = 0`,

        go: `package main

import "fmt"

type Device interface {
	Enable()
	Disable()
	IsEnabled() bool
	GetVolume() int
	SetVolume(vol int)
}

type TV struct {
	on     bool
	volume int
}

func NewTV() *TV                  { return &TV{volume: 50} }
func (t *TV) Enable()             { t.on = true }
func (t *TV) Disable()            { t.on = false }
func (t *TV) IsEnabled() bool     { return t.on }
func (t *TV) GetVolume() int      { return t.volume }
func (t *TV) SetVolume(vol int) {
	if vol < 0 { vol = 0 }
	if vol > 100 { vol = 100 }
	t.volume = vol
}

type Radio struct {
	on     bool
	volume int
}

func NewRadio() *Radio             { return &Radio{volume: 30} }
func (r *Radio) Enable()           { r.on = true }
func (r *Radio) Disable()          { r.on = false }
func (r *Radio) IsEnabled() bool   { return r.on }
func (r *Radio) GetVolume() int    { return r.volume }
func (r *Radio) SetVolume(vol int) {
	if vol < 0 { vol = 0 }
	if vol > 100 { vol = 100 }
	r.volume = vol
}

type RemoteControl struct {
	device Device
}

func (rc *RemoteControl) TogglePower() {
	if rc.device.IsEnabled() {
		rc.device.Disable()
	} else {
		rc.device.Enable()
	}
}

func (rc *RemoteControl) VolumeUp()   { rc.device.SetVolume(rc.device.GetVolume() + 10) }
func (rc *RemoteControl) VolumeDown() { rc.device.SetVolume(rc.device.GetVolume() - 10) }

type AdvancedRemote struct {
	RemoteControl
}

func NewAdvancedRemote(d Device) *AdvancedRemote {
	return &AdvancedRemote{RemoteControl{device: d}}
}

func (ar *AdvancedRemote) Mute() { ar.device.SetVolume(0) }

func main() {
	tv := NewTV()
	remote := NewAdvancedRemote(tv)
	remote.TogglePower()
	remote.VolumeUp()
	remote.Mute()
	fmt.Printf("TV on=%v volume=%d\\n", tv.IsEnabled(), tv.GetVolume())
}`,

        python: `from abc import ABC, abstractmethod
from typing import override


class Device(ABC):
    @abstractmethod
    def enable(self) -> None: ...
    @abstractmethod
    def disable(self) -> None: ...
    @abstractmethod
    def is_enabled(self) -> bool: ...
    @abstractmethod
    def get_volume(self) -> int: ...
    @abstractmethod
    def set_volume(self, volume: int) -> None: ...


class TV(Device):
    def __init__(self) -> None:
        self._on = False
        self._volume = 50

    @override
    def enable(self) -> None:      self._on = True
    @override
    def disable(self) -> None:     self._on = False
    @override
    def is_enabled(self) -> bool:  return self._on
    @override
    def get_volume(self) -> int:   return self._volume
    @override
    def set_volume(self, volume: int) -> None:
        self._volume = max(0, min(100, volume))


class Radio(Device):
    def __init__(self) -> None:
        self._on = False
        self._volume = 30

    @override
    def enable(self) -> None:      self._on = True
    @override
    def disable(self) -> None:     self._on = False
    @override
    def is_enabled(self) -> bool:  return self._on
    @override
    def get_volume(self) -> int:   return self._volume
    @override
    def set_volume(self, volume: int) -> None:
        self._volume = max(0, min(100, volume))


class RemoteControl:
    def __init__(self, device: Device) -> None:
        self._device = device

    def toggle_power(self) -> None:
        if self._device.is_enabled():
            self._device.disable()
        else:
            self._device.enable()

    def volume_up(self) -> None:
        self._device.set_volume(self._device.get_volume() + 10)

    def volume_down(self) -> None:
        self._device.set_volume(self._device.get_volume() - 10)


class AdvancedRemote(RemoteControl):
    def mute(self) -> None:
        self._device.set_volume(0)


# Client
tv = TV()
remote = AdvancedRemote(tv)
remote.toggle_power()  # TV is ON
remote.volume_up()     # volume = 60
remote.mute()          # volume = 0
print(f"TV on={tv.is_enabled()} volume={tv.get_volume()}")`,

        rust: `trait Device {
    fn enable(&mut self);
    fn disable(&mut self);
    fn is_enabled(&self) -> bool;
    fn get_volume(&self) -> i32;
    fn set_volume(&mut self, vol: i32);
}

struct TV {
    on: bool,
    volume: i32,
}

impl TV {
    fn new() -> Self { Self { on: false, volume: 50 } }
}

impl Device for TV {
    fn enable(&mut self)           { self.on = true; }
    fn disable(&mut self)          { self.on = false; }
    fn is_enabled(&self) -> bool   { self.on }
    fn get_volume(&self) -> i32    { self.volume }
    fn set_volume(&mut self, vol: i32) {
        self.volume = vol.clamp(0, 100);
    }
}

struct Radio {
    on: bool,
    volume: i32,
}

impl Radio {
    fn new() -> Self { Self { on: false, volume: 30 } }
}

impl Device for Radio {
    fn enable(&mut self)           { self.on = true; }
    fn disable(&mut self)          { self.on = false; }
    fn is_enabled(&self) -> bool   { self.on }
    fn get_volume(&self) -> i32    { self.volume }
    fn set_volume(&mut self, vol: i32) {
        self.volume = vol.clamp(0, 100);
    }
}

struct RemoteControl {
    device: Box<dyn Device>,
}

impl RemoteControl {
    fn new(device: Box<dyn Device>) -> Self { Self { device } }

    fn toggle_power(&mut self) {
        if self.device.is_enabled() {
            self.device.disable();
        } else {
            self.device.enable();
        }
    }

    fn volume_up(&mut self) {
        let vol = self.device.get_volume() + 10;
        self.device.set_volume(vol);
    }

    fn volume_down(&mut self) {
        let vol = self.device.get_volume() - 10;
        self.device.set_volume(vol);
    }
}

struct AdvancedRemote {
    base: RemoteControl,
}

impl AdvancedRemote {
    fn new(device: Box<dyn Device>) -> Self {
        Self { base: RemoteControl::new(device) }
    }

    fn toggle_power(&mut self) { self.base.toggle_power(); }
    fn volume_up(&mut self)    { self.base.volume_up(); }
    fn volume_down(&mut self)  { self.base.volume_down(); }

    fn mute(&mut self) {
        self.base.device.set_volume(0);
    }
}

fn main() {
    let mut remote = AdvancedRemote::new(Box::new(TV::new()));
    remote.toggle_power();
    remote.volume_up();
    remote.mute();
    println!(
        "TV on={} volume={}",
        remote.base.device.is_enabled(),
        remote.base.device.get_volume()
    );
}`
    }
};
