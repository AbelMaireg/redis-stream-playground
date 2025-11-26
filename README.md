# redis-stream-playground

A compact playground showcasing a Redis Streams–powered work queue with a producer, multiple worker consumers, and a live monitoring dashboard.
Each message represents a synthetic order/payment entry generated with **faker**, processed by workers, and acknowledged (`XACK`) after simulated work.

---

## **Overview**

This project demonstrates:

* **Producer**
  Generates JSON-encoded items and appends them to a Redis Stream with an approximate maximum length (`MAXLEN ~ N`).

* **Worker Consumers**
  Read new messages using `XREADGROUP >`, perform simulated processing, and acknowledge them.
  Each worker maintains its own processed-items counter.

* **Stale Message Recovery**
  Workers periodically run `XAUTOCLAIM` to recover messages idle longer than `RECLAIM_IDLE_MS`.

* **Live Monitoring Dashboard**
  Displays real-time stream metrics, pending counts, and per-consumer stats (processed, pending, idle).
  Refreshes every second.

* **Configurable via Environment Variables**
  Sensible defaults provided for a smooth start.

* **Monitoring Streams and Groups Dynamically with Argumented Environments**
  Workers auto-create the consumer group on first run if it doesn't exist.

---

## **Prerequisites**

* **Redis 7+** running locally
  Default URI: `redis://localhost:6379`
* **Bun** (recommended)
  or Node.js + `ts-node`/`tsx` for direct TypeScript execution

---

## **Environment Variables**

| Variable            | Default                  | Description                                    |
| ------------------- | ------------------------ | ---------------------------------------------- |
| `STREAM`            | `orders:stream`          | Redis stream key                               |
| `GROUP`             | `payment-workers`        | Consumer group name                            |
| `REDIS_URL`         | `redis://localhost:6379` | Redis connection string                        |
| `MAX_STREAM_LENGTH` | `10000`                  | Stream length cap using `XADD MAXLEN ~`        |
| `RECLAIM_IDLE_MS`   | `120000`                 | Idle time before a message becomes reclaimable |

---


## **Installation**

```bash
bun install
# or
npm install
```

> Bun is preferred; the repository includes a `bun.lock` file.

---

## **Running Redis (example)**

```bash
docker run --rm -p 6379:6379 redis:latest
```

---

## **Producing Messages**

Generate *N* messages (default: 100):

```bash
bun run src/producer.ts 500
```

Example output:

```
Produced order ab12cd34ef
  Jane Doe
  Awesome Steel Chair
  257
Finished producing 500 orders.
```

---

## **Starting Workers**

Run one or more worker consumers:

```bash
bun run src/worker.ts 1
bun run src/worker.ts 2
bun run src/worker.ts 3
```

Example:

```
Starting consumer 'worker-1' in group 'payment-workers'
    1    Rustic Granite Keyboard
    2    Intelligent Cotton Gloves
```

Workers automatically create the consumer group on first startup.

---

## **Live Monitoring Dashboard**

Start the dashboard:

```bash
bun run src/monitor.ts --stream orders:stream --group payment-workers logging
```

Sample excerpt:

```
=== Redis Streams Multi-Group Dashboard ===

orders:stream → Group: payment-workers
Stream Length       : 1,048
Pending Messages    : 0
Last Delivered ID   : 1764144879753-0
Active Consumers    : 2

   --- Consumer Stats ---

   Consumer     │ Processed │ Pending │ Idle (s)
   ───────────────────────────────────────────────
   worker-2     │       527 │       0 │      3
   worker-1     │       521 │       0 │      3

orders:stream → Group: logging
Stream Length       : 1,048
Pending Messages    : 0
Last Delivered ID   : 1764144879753-0
Active Consumers    : 2

   --- Consumer Stats ---

   Consumer     │ Processed │ Pending │ Idle (s)
   ───────────────────────────────────────────────
   worker-4     │       531 │       0 │      2
   worker-3     │       514 │       0 │      3

Updated: 11:20:24 AM
```

---

## **How the System Works**

1. The producer writes entries using `XADD MAXLEN ~`, storing `data=<json>` per item.
2. The first worker invokes `XGROUP CREATE` (`ensureConsumerGroup`) with `MKSTREAM` to auto-create the stream if missing.
3. Workers continuously:

   * Reclaim idle messages via `XAUTOCLAIM`
   * Block on `XREADGROUP` to fetch new entries
4. Each message is deserialized, processed with a random delay, protected against duplicates, and acknowledged with `XACK`.
5. Worker counters are recorded at:
   `stats:processed:<GROUP>:<consumer-name>`
6. The monitor collects data via `XLEN`, `XINFO GROUPS`, `XINFO CONSUMERS`, and `MGET`, then renders the dashboard.

---

## **Adjusting Load**

* Increase the producer message count or run multiple producers.
* Add more workers to increase throughput.
* Tweak `RECLAIM_IDLE_MS` to adjust recovery of stalled workers.

---

## **Resetting the Environment**

Clear the stream and all processing stats:

```bash
redis-cli DEL orders:stream $(redis-cli KEYS 'stats:processed:payment-workers:*')
```

---

## **Troubleshooting**

* **“No consumer group found”**
  Start any worker first—it automatically creates the group.

* **High pending count**
  Add workers or decrease simulated processing time.

* **Messages not reclaimed**
  Confirm `RECLAIM_IDLE_MS` is below the actual processing time of failed/slow workers.

---

## **Possible Extensions**

* Persist processed items to **Postgres** (hinted by the repo name).
* Add a **dead-letter stream** for repeated failures.
* Integrate **Prometheus metrics** or an HTTP status endpoint.

---

## **License**

Open playground code — free to use and modify.
