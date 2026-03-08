# Message Broker Visualizer

Interactive visualizer for three message brokers — **RabbitMQ**, **Apache Kafka**, and **Redis Pub/Sub**. Built with pure HTML5, CSS3, and vanilla JavaScript — no frameworks, no dependencies.

![Preview](img.png)

## Live Demo

[https://dykyi-roman.github.io/projects/message-broker-visualizer/](https://dykyi-roman.github.io/projects/message-broker-visualizer/)

## Features

### RabbitMQ (7 Tutorials)

| # | Mode | Pattern | Description |
|---|------|---------|-------------|
| 1 | **Direct Queue** | P -> Queue -> C | Producer writes to a named queue, Consumer reads from it. One to one |
| 2 | **Round-Robin** | Competing Consumers | Queue distributes tasks among workers via round-robin. Each message is processed by exactly one worker |
| 3 | **Pub/Sub** | Fanout Exchange | Broadcasts every message to all subscribers simultaneously. Used for logging, cache invalidation, realtime updates |
| 4 | **Routing** | Direct Exchange | Delivers messages only to queues with exact binding key match. Routing key is set by the producer |
| 5 | **Topics** | Topic Exchange | Matches routing key by patterns: `*` (exactly one word), `#` (any number of words). Flexible event filtering by hierarchy |
| 6 | **RPC** | Request/Reply | Client sends a request with `correlation_id` and `reply_to` queue. Server processes and replies. Client waits for response in its temporary queue |
| 7 | **Confirms** | ACK/NACK | Publisher Confirms — broker acknowledges each message write via ACK/NACK. Guarantees at-least-once delivery on the producer side |

### Apache Kafka (4 Modes)

| Mode | Description |
|------|-------------|
| **Partitions** | Distributes messages across partitions. Three strategies: Round-Robin (no key), Key-Based (hash), Manual. Messages within a partition are strictly ordered |
| **Consumer Groups** | Each partition is consumed by exactly one consumer in a group. Groups are independent. Offset is tracked per-group. Supports rebalancing |
| **Retention & Replay** | Stores messages in an ordered log. Consumer group reads independently and can seek offset back for replay. Messages are not deleted after reading. Configurable retention size |
| **Exactly-Once** | Delivery guarantees comparison: at-most-once (acks=0, may lose), at-least-once (acks=1, may duplicate), exactly-once (idempotent producer with sequence numbers, no loss or dups) |

### Redis (4 Modes)

| Mode | Description |
|------|-------------|
| **Pub/Sub** | Fire-and-forget channel messaging. Messages are not stored — if a subscriber is disconnected, it will not receive the message. Connect/disconnect simulation |
| **Pattern Sub** | PSUBSCRIBE with glob patterns: `*` (any chars), `?` (one char), `[abc]` (one of). Editable patterns per subscriber, mode switch between SUBSCRIBE and PSUBSCRIBE |
| **Streams** | Persistent event log with consumer groups. Unlike Pub/Sub, messages are stored and available for re-reading. Supports XREADGROUP, XACK, and pending entry list (PEL) |
| **Event Sourcing** | State reconstruction by replaying events from an immutable stream log. Supports order lifecycle events (created, paid, shipped, cancelled) and full state rebuild |

### Common Controls

- **Burst** — send 5 messages rapidly from all producers
- **Simulate Error** — next message triggers a broker NACK
- **Pause / Resume** — freeze all animations and queue processing; queued deliveries flush on resume
- **Reset** — clear all state, counters, and logs
- **Publisher Confirms toggle** — enable ACK/NACK feedback on any RabbitMQ mode (auto-enabled in Confirms tutorial)

### Visualization Engine

- Animated message dots flying along cubic Bezier curves between producers, broker, and consumers
- SVG pipe paths drawn along flight trajectories with flow animation
- Queue dot accumulation — messages visually stack inside queue nodes
- Inside-queue traversal animation showing message passing through the queue
- Real-time throughput chart (canvas-based, last 24 seconds)
- Color-coded event log with millisecond timestamps (SEND, ROUTE, RECV, ACK, NACK, ERROR, REPLY, CONFIRM, SEEK, PMATCH)
- Live stats bar: Sent, Delivered, In Queue, msg/sec
- Broker-specific color themes (RabbitMQ orange, Kafka blue, Redis red)

## Project Structure

```
message-broker-visualizer/
├── index.html          # Main page with all UI markup
├── css/
│   └── style.css       # All visualizer styles (~1470 lines), dark theme, responsive
├── js/
│   ├── engine.js       # Animation engine, SVG pipes, queue dots, event log, stats, helpers
│   ├── rabbitmq.js     # RabbitMQ tutorials 1-7 implementation
│   ├── kafka.js        # Kafka partitions, consumer groups, retention, exactly-once
│   ├── redis.js        # Redis Pub/Sub, pattern matching, streams, event sourcing
│   └── app.js          # Broker switching, mode tabs, global controls, DOMContentLoaded bootstrap
├── img.png             # Project preview image
└── tasks/
    └── message-broker-visualizer-full-tasks.md  # Full specification
```

## Tech Stack

- **HTML5** — semantic markup with ARIA attributes for accessibility
- **CSS3** — custom properties (`--mbv-*`), grid layout, flexbox, CSS animations (shake, pulse, fade)
- **Vanilla JavaScript** — IIFE modules, global `MBV` namespace, `requestAnimationFrame` for animations, Canvas API for throughput chart, SVG for pipe paths
- **No dependencies** — zero npm packages, zero CDN libraries

## Architecture

Global namespace object `MBV` on `window`. Each broker file registers `MBV.{broker}.modes` (tab definitions) and `MBV.{broker}.{mode}` objects with `init()` methods. `engine.js` provides shared rendering, animation helpers, topic/glob matching, and logging. `app.js` wires broker tabs to `switchBroker()` and mode tabs to `switchMode()` which call `init()` on the selected mode.

## Running Locally

```bash
# Any local HTTP server (required for fetch-based header loading)
python -m http.server 8000

# Then open
# http://localhost:8000/projects/message-broker-visualizer/
```

## Responsive Design

- **> 900px** — full 3-column grid (producers | broker | consumers)
- **< 900px** — single column, horizontal card layout, connection ports hidden
- **< 600px** — stacked broker tabs, wrapped stats bar

## Author

**Dykyi Roman** — Software Engineer

- Website: [dykyi-roman.github.io](https://dykyi-roman.github.io/)
- GitHub: [dykyi-roman](https://github.com/dykyi-roman)
