/* ===== Mediator Pattern ===== */

PV['mediator'] = {};

PV['mediator'].modes = [
    { id: 'chatroom', label: 'Chat Room', desc: 'A ChatRoom mediator coordinates communication between users. Instead of users talking directly to each other, they send messages through the ChatRoom, which broadcasts to all other participants. This decouples users from one another — they only know the mediator.' }
];

PV['mediator'].depRules = [
    { name: 'Mediator (Interface)', role: 'Defines the sendMessage(message, sender) contract for colleague communication' },
    { name: 'ChatRoom', role: 'Concrete mediator that manages users and routes messages to all except the sender' },
    { name: 'User', role: 'Colleague class that communicates with other users exclusively through the mediator' },
    { name: 'Alice, Bob, Charlie', role: 'Concrete user instances that send and receive messages via the ChatRoom' }
];

/* ---------- Shared render functions ---------- */

function renderMediatorChatroom() {
    var canvas = document.getElementById('pv-canvas');
    canvas.innerHTML =
        '<div class="layout-pattern-hierarchy" style="gap: 50px; padding: 30px 20px;">' +
            /* Row 1: Mediator interface */
            '<div class="pv-hierarchy-row">' +
                PV.renderClass('cls-md-mediator', 'Mediator', {
                    stereotype: 'interface',
                    methods: ['sendMessage(msg, sender)'],
                    tooltip: I18N.t('mediator.tooltip.mediator', null, 'Mediator interface — defines the contract for routing messages between colleagues')
                }) +
            '</div>' +
            PV.renderArrowConnector(I18N.t('ui.legend.inherit', null, 'implements')) +
            /* Row 2: ChatRoom */
            '<div class="pv-hierarchy-row">' +
                PV.renderClass('cls-md-chatroom', 'ChatRoom', {
                    fields: ['users: User[]'],
                    methods: ['sendMessage(msg, sender)', 'addUser(user)'],
                    tooltip: I18N.t('mediator.tooltip.chatroom', null, 'Concrete mediator — manages registered users and broadcasts messages to all except the sender')
                }) +
            '</div>' +
            PV.renderArrowConnector(I18N.t('mediator.arrow.mediates', null, 'mediates')) +
            /* Row 3: User class */
            '<div class="pv-hierarchy-row">' +
                PV.renderClass('cls-md-user', 'User', {
                    fields: ['name: string', 'mediator: Mediator'],
                    methods: ['send(msg)', 'receive(msg, from)'],
                    tooltip: I18N.t('mediator.tooltip.user', null, 'Colleague class — communicates with other users exclusively through the mediator, never directly')
                }) +
            '</div>' +
            /* Row 4: Concrete user instances */
            '<div class="pv-hierarchy-row" style="gap: 60px; margin-top: 20px;">' +
                PV.renderObject('obj-alice', 'Alice', { tooltip: I18N.t('mediator.tooltip.obj-alice', null, 'Concrete user instance — sends and receives messages through the ChatRoom mediator') }) +
                PV.renderObject('obj-bob', 'Bob', { tooltip: I18N.t('mediator.tooltip.obj-bob', null, 'Concrete user instance — receives broadcast messages from the ChatRoom') }) +
                PV.renderObject('obj-charlie', 'Charlie', { tooltip: I18N.t('mediator.tooltip.obj-charlie', null, 'Concrete user instance — receives broadcast messages from the ChatRoom') }) +
            '</div>' +
            '<div class="pv-flow-legend">' +
                '<div class="legend-item"><span class="legend-line-sync"></span> ' + I18N.t('ui.legend.flow', null, 'Flow') + '</div>' +
                '<div class="legend-item"><span class="legend-line-create"></span> ' + I18N.t('ui.legend.create', null, 'Create') + '</div>' +
                '<div class="legend-item"><span class="legend-line-response"></span> ' + I18N.t('ui.legend.response', null, 'Response') + '</div>' +
                '<div class="legend-item"><span class="legend-line-inherit"></span> ' + I18N.t('ui.legend.inherit', null, 'Inherit') + '</div>' +
                '<div class="legend-item"><span class="legend-line-compose"></span> ' + I18N.t('ui.legend.aggregate', null, 'Aggregate') + '</div>' +
                '<div class="legend-item"><span class="legend-line-depend"></span> ' + I18N.t('ui.legend.depend', null, 'Depend') + '</div>' +
                '<div class="legend-item"><span style="display:inline-block;width:20px;height:14px;border:2px dashed var(--pv-accent);border-radius:2px;background:var(--pv-accent-bg);"></span> ' + I18N.t('ui.legend.object', null, 'Object') + '</div>' +
            '</div>' +
        '</div>';

    setTimeout(function() {
        PV.renderRelation('cls-md-chatroom', 'cls-md-mediator', 'inherit');
        PV.renderRelation('cls-md-chatroom', 'cls-md-user', 'aggregate');
        PV.renderRelation('cls-md-user', 'cls-md-mediator', 'depend');
    }, 50);
}

/* ---------- Details ---------- */

PV['mediator'].details = {
    chatroom: {
        principles: [
            'Centralize communication: colleagues never reference each other directly — all interaction flows through the mediator',
            'Single Responsibility: the mediator encapsulates the interaction protocol, keeping colleagues focused on their own behavior',
            'Open/Closed Principle: new colleagues can join without modifying existing ones — only the mediator needs awareness',
            'Loose coupling: colleagues depend on the mediator abstraction, not on concrete peers, making the system easier to evolve',
            'Replace many-to-many relationships with one-to-many: each colleague communicates only with the mediator, reducing the overall coupling graph'
        ],
        concepts: [
            { term: 'Mediator', definition: 'An interface declaring the communication contract (sendMessage). Colleagues hold a reference to this abstraction, not to each other.' },
            { term: 'Concrete Mediator', definition: 'The ChatRoom implements the Mediator interface, maintaining a list of registered users and routing messages to all participants except the sender.' },
            { term: 'Colleague', definition: 'The User class that communicates through the mediator. It calls send() which delegates to mediator.sendMessage(), and exposes receive() for incoming messages.' },
            { term: 'Message', definition: 'The data payload routed by the mediator. The mediator decides who receives it based on the routing policy (broadcast, targeted, filtered).' }
        ],
        tradeoffs: {
            pros: [
                'Decouples colleagues from each other — they only know the mediator interface',
                'Centralizes complex communication logic in one place, making it easier to understand and maintain',
                'Adding new colleagues requires no changes to existing ones — just register with the mediator',
                'Simplifies many-to-many relationships into manageable one-to-many connections'
            ],
            cons: [
                'The mediator can become a God Object if it absorbs too much logic from colleagues',
                'Single point of failure — if the mediator breaks, all communication stops',
                'Indirection makes it harder to trace message flow during debugging',
                'Performance overhead for high-frequency messaging due to the routing layer'
            ],
            whenToUse: 'Use when a set of objects communicate in complex, hard-to-maintain ways with many-to-many dependencies. The mediator simplifies the interaction by centralizing the communication protocol, especially in chat systems, UI component coordination, or event-driven architectures.'
        }
    }
};

/* ---------- Mode: chatroom ---------- */

PV['mediator'].chatroom = {
    init: function() {
        renderMediatorChatroom();
    },
    steps: function() {
        return [
            { elementId: 'cls-md-chatroom', label: 'ChatRoom', description: 'Users join the chat room', descriptionKey: 'mediator.step.chatroom.0', logType: 'REQUEST' },
            { elementId: 'obj-alice', label: 'Alice', description: 'Alice joins ChatRoom', descriptionKey: 'mediator.step.chatroom.1', logType: 'CREATE', spawnId: 'obj-alice' },
            { elementId: 'obj-bob', label: 'Bob', description: 'Bob joins ChatRoom', descriptionKey: 'mediator.step.chatroom.2', logType: 'CREATE', spawnId: 'obj-bob' },
            { elementId: 'obj-charlie', label: 'Charlie', description: 'Charlie joins ChatRoom', descriptionKey: 'mediator.step.chatroom.3', logType: 'CREATE', spawnId: 'obj-charlie' },
            { elementId: 'cls-md-user', label: 'User', description: 'Alice calls send("Hello everyone!")', descriptionKey: 'mediator.step.chatroom.4', logType: 'FLOW', arrowFromId: 'obj-alice' },
            { elementId: 'cls-md-chatroom', label: 'ChatRoom', description: 'ChatRoom broadcasts to all except sender', descriptionKey: 'mediator.step.chatroom.5', logType: 'FLOW' },
            { elementId: 'obj-bob', label: 'Bob', description: 'Bob.receive("Hello everyone!", Alice)', descriptionKey: 'mediator.step.chatroom.6', logType: 'RESPONSE', arrowFromId: 'cls-md-chatroom' },
            { elementId: 'obj-charlie', label: 'Charlie', description: 'Charlie.receive("Hello everyone!", Alice)', descriptionKey: 'mediator.step.chatroom.7', logType: 'RESPONSE', arrowFromId: 'cls-md-chatroom' }
        ];
    },
    stepOptions: function() { return { requestLabel: I18N.t('mediator.stepLabel.chatroom', null, 'Chat room communication via Mediator') }; },
    run: function() {
        PV.animateFlow(PV['mediator'].chatroom.steps(), PV['mediator'].chatroom.stepOptions());
    }
};

PV['mediator'].codeExamples = {
    chatroom: {
        php: `<?php
declare(strict_types=1);

interface Mediator
{
    public function sendMessage(string $message, User $sender): void;
}

class ChatRoom implements Mediator
{
    /** @var list<User> */
    private array $users = [];

    public function addUser(User $user): void
    {
        $this->users[] = $user;
    }

    public function sendMessage(string $message, User $sender): void
    {
        foreach ($this->users as $user) {
            if ($user !== $sender) {
                $user->receive($message, $sender->getName());
            }
        }
    }
}

class User
{
    public function __construct(
        private readonly string $name,
        private readonly Mediator $mediator,
    ) {}

    public function getName(): string
    {
        return $this->name;
    }

    public function send(string $message): void
    {
        echo "{$this->name} sends: {$message}\\n";
        $this->mediator->sendMessage($message, $this);
    }

    public function receive(string $message, string $from): void
    {
        echo "{$this->name} received from {$from}: {$message}\\n";
    }
}

// Client
$chatRoom = new ChatRoom();

$alice   = new User('Alice', $chatRoom);
$bob     = new User('Bob', $chatRoom);
$charlie = new User('Charlie', $chatRoom);

$chatRoom->addUser($alice);
$chatRoom->addUser($bob);
$chatRoom->addUser($charlie);

$alice->send('Hello everyone!');`,

        go: `package main

import "fmt"

type Mediator interface {
	SendMessage(message string, sender *User)
}

type ChatRoom struct {
	users []*User
}

func (c *ChatRoom) AddUser(user *User) {
	c.users = append(c.users, user)
}

func (c *ChatRoom) SendMessage(message string, sender *User) {
	for _, user := range c.users {
		if user != sender {
			user.Receive(message, sender.Name)
		}
	}
}

type User struct {
	Name     string
	mediator Mediator
}

func NewUser(name string, mediator Mediator) *User {
	return &User{Name: name, mediator: mediator}
}

func (u *User) Send(message string) {
	fmt.Printf("%s sends: %s\\n", u.Name, message)
	u.mediator.SendMessage(message, u)
}

func (u *User) Receive(message, from string) {
	fmt.Printf("%s received from %s: %s\\n", u.Name, from, message)
}

func main() {
	chatRoom := &ChatRoom{}

	alice := NewUser("Alice", chatRoom)
	bob := NewUser("Bob", chatRoom)
	charlie := NewUser("Charlie", chatRoom)

	chatRoom.AddUser(alice)
	chatRoom.AddUser(bob)
	chatRoom.AddUser(charlie)

	alice.Send("Hello everyone!")
}`,

        python: `from abc import ABC, abstractmethod
from typing import override


class Mediator(ABC):
    @abstractmethod
    def send_message(self, message: str, sender: "User") -> None: ...


class ChatRoom(Mediator):
    def __init__(self) -> None:
        self._users: list[User] = []

    def add_user(self, user: "User") -> None:
        self._users.append(user)

    @override
    def send_message(self, message: str, sender: "User") -> None:
        for user in self._users:
            if user is not sender:
                user.receive(message, sender.name)


class User:
    def __init__(self, name: str, mediator: Mediator) -> None:
        self.name = name
        self._mediator = mediator

    def send(self, message: str) -> None:
        print(f"{self.name} sends: {message}")
        self._mediator.send_message(message, self)

    def receive(self, message: str, from_user: str) -> None:
        print(f"{self.name} received from {from_user}: {message}")


# Client
chat_room = ChatRoom()

alice = User("Alice", chat_room)
bob = User("Bob", chat_room)
charlie = User("Charlie", chat_room)

chat_room.add_user(alice)
chat_room.add_user(bob)
chat_room.add_user(charlie)

alice.send("Hello everyone!")`,

        rust: `use std::cell::RefCell;
use std::rc::Rc;

trait Mediator {
    fn send_message(&self, message: &str, sender_name: &str);
}

struct ChatRoom {
    users: RefCell<Vec<Rc<User>>>,
}

impl ChatRoom {
    fn new() -> Rc<Self> {
        Rc::new(Self {
            users: RefCell::new(Vec::new()),
        })
    }

    fn add_user(&self, user: Rc<User>) {
        self.users.borrow_mut().push(user);
    }
}

impl Mediator for ChatRoom {
    fn send_message(&self, message: &str, sender_name: &str) {
        for user in self.users.borrow().iter() {
            if user.name != sender_name {
                user.receive(message, sender_name);
            }
        }
    }
}

struct User {
    name: String,
    mediator: Rc<dyn Mediator>,
}

impl User {
    fn new(name: &str, mediator: Rc<dyn Mediator>) -> Rc<Self> {
        Rc::new(Self {
            name: name.to_string(),
            mediator: mediator.clone(),
        })
    }

    fn send(&self, message: &str) {
        println!("{} sends: {}", self.name, message);
        self.mediator.send_message(message, &self.name);
    }

    fn receive(&self, message: &str, from: &str) {
        println!("{} received from {}: {}", self.name, from, message);
    }
}

fn main() {
    let chat_room = ChatRoom::new();

    let alice = User::new("Alice", chat_room.clone());
    let bob = User::new("Bob", chat_room.clone());
    let charlie = User::new("Charlie", chat_room.clone());

    chat_room.add_user(alice.clone());
    chat_room.add_user(bob.clone());
    chat_room.add_user(charlie.clone());

    alice.send("Hello everyone!");
}`
    }
};
