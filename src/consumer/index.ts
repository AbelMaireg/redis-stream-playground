import Redis from "ioredis";
import { RECLAIM_IDLE_MS } from "../config";
import {
    type Item,
    type StreamResponse,
    type XAutoClaimResponse,
} from "../types";
import chalk from "chalk";
import { parseConsumerArgs } from "./args";

const redis = new Redis();
const args = process.argv.slice(2);
const config = parseConsumerArgs(args);

console.log(
    chalk.cyan(`Starting consumer`),
    chalk.cyan(`'${config.name}' in group '${config.group}'`),
);

/**
 * @description Ensures that the consumer group exists; creates it if it doesn't.
 */
async function ensureConsumerGroup() {
    try {
        await redis.xgroup(
            "CREATE",
            config.stream,
            config.group,
            "$",
            "MKSTREAM",
        );
        console.log(chalk.green(`Consumer group '${config.group}' created.`));
    } catch (err: any) {
        if (!err.message.includes("BUSYGROUP")) throw err;
    }
}

/**
 * @description Processes a single message from the stream.
 * @param id - The ID of the message.
 * @param fields - The fields of the message.
 */
async function processMessage(id: string, fields: Record<string, string>) {
    const raw = fields.data;
    if (!raw) throw new Error("Missing data field");

    const item: Item = JSON.parse(raw);

    await new Promise((r) => setTimeout(r, Math.random() * 300 + 100));

    const processedKey = `processed:${id}`;
    const exists = await redis.exists(processedKey);
    if (exists) {
        console.log(chalk.yellow(`Skipping duplicate payment: ${item.id}`));
        await redis.xack(config.stream, config.group, id);
        return;
    }

    const index = await redis.incr(
        `stats:processed:${config.group}:${config.name}`,
    );

    console.log(
        chalk.green(`#${index}`.padEnd(6)),
        chalk.italic.yellow(`${item.name}`).padEnd(30),
    );

    await redis.xack(config.stream, config.group, id);
}

/**
 * @description Reclaims stale messages that have been idle for longer than RECLAIM_IDLE_MS.
 */
async function reclaimStaleMessages() {
    const result = (await redis.xautoclaim(
        config.stream,
        config.group,
        config.name,
        RECLAIM_IDLE_MS,
        "0-0",
        "COUNT",
        50,
    )) as XAutoClaimResponse;

    const reclaimed = result[1];
    if (reclaimed.length == 0) return;

    for (const [id, fieldsArr] of reclaimed) {
        const fields = {} as Record<string, string>;

        for (let i = 0; i < fieldsArr.length; i += 2) {
            const key = fieldsArr[i] as string;
            const value = fieldsArr[i + 1] as string;
            fields[key] = value;
        }

        await processMessage(id, fields).catch(console.error);
    }
}

/**
 * @description Main processing loop for the consumer.
 */
async function mainLoop() {
    await ensureConsumerGroup();

    while (true) {
        try {
            await reclaimStaleMessages();

            const result = (await redis.xreadgroup(
                "GROUP",
                config.group,
                config.name,
                "COUNT",
                10,
                "BLOCK",
                5000,
                "STREAMS",
                config.stream,
                ">",
            )) as StreamResponse;

            if (!result) continue;

            for (const [_stream, entries] of result) {
                for (const [id, fieldsArr] of entries) {
                    const fields = {} as Record<string, string>;

                    for (let i = 0; i < fieldsArr.length; i += 2) {
                        const key = fieldsArr[i] as string;
                        const value = fieldsArr[i + 1] as string;
                        fields[key] = value;
                    }

                    await processMessage(id, fields).catch((err) => {
                        console.log(
                            chalk.red(`Error processing message ${id}: ${err}`),
                        );
                    });
                }
            }
        } catch (err) {
            console.log(chalk.red(`Worker error: ${err}`));
            await new Promise((r) => setTimeout(r, 1000));
        }
    }
}

process.on("SIGINT", async () => {
    console.log("\nShutting down gracefully...");
    await redis.quit();
    process.exit(0);
});

mainLoop().catch(console.error);
