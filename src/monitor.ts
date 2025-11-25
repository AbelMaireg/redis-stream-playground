import Redis from "ioredis";
import { STREAM, GROUP } from "./config.js";
import chalk from "chalk";

const redis = new Redis();

setInterval(async () => {
    try {
        const len = await redis.xlen(STREAM);

        const groups: any = await redis.xinfo("GROUPS", STREAM);
        const groupInfo = groups.find((g: string[]) => g[1] === GROUP);

        if (!groupInfo) {
            console.log(chalk.yellow(`No consumer group '${GROUP}' found`));
            return;
        }

        const pending = Number(groupInfo[groupInfo.indexOf("pending") + 1]);
        const lastId = Number(
            groupInfo[groupInfo.indexOf("last-delivered-id") + 1],
        );
        const consumers = (await redis.xinfo(
            "CONSUMERS",
            STREAM,
            GROUP,
        )) as string[][];

        // Fetch processed counters for all consumers in parallel
        const consumerNames = consumers.map(
            (c: string | string[]) => c[c.indexOf("name") + 1],
        );
        const processedCounts =
            consumerNames.length > 0
                ? await redis.mget(
                      ...consumerNames.map(
                          (name: any) => `stats:processed:${GROUP}:${name}`,
                      ),
                  )
                : [];

        console.clear();
        console.log(chalk.cyan("=== Redis Streams Live Dashboard ==="));
        console.log(`Stream length     : ${len.toLocaleString()} entries`);
        console.log(`Group             : ${GROUP}`);
        console.log(`Pending messages  : ${pending}`);
        console.log(`Last delivered ID : ${lastId}`);
        console.log(`Active consumers  : ${consumers.length}`);
        console.log(chalk.cyan("\n--- Consumer Stats ---\n"));

        if (consumers.length === 0) {
            console.log(chalk.yellow("No active consumers"));
        } else {
            // Sort by processed count (descending)
            const stats = consumers
                .map((c: string | string[], i: string | number) => {
                    const name = c[c.indexOf("name") + 1] as string;
                    const pend = Number(c[c.indexOf("pending") + 1]);
                    const idle = Math.round(
                        Number(c[c.indexOf("idle") + 1]) / 1000,
                    );
                    const processed = processedCounts[i as number]
                        ? Number(processedCounts[i as number]) || 0
                        : 0;
                    return { name, pend, idle, processed };
                })
                .sort(
                    (a: { processed: number }, b: { processed: number }) =>
                        b.processed - a.processed,
                );

            const maxName = Math.max(
                ...stats.map((s: { name: string | any[] }) => s.name.length),
                12,
            );

            console.log(
                chalk.yellow(
                    `Consumer${" ".repeat(maxName - 8)} │ Processed │ Pending │ Idle (s)`,
                ),
            );
            console.log(chalk.yellow("─".repeat(maxName + 35)));

            for (const { name, processed, pend, idle } of stats) {
                const namePad = name.padEnd(maxName);
                console.log(
                    `${chalk.green(namePad)} │ ${chalk.blue(
                        processed.toString().padStart(9),
                    )} │ ${chalk.red(pend.toString().padStart(7))} │ ${chalk.magenta(
                        idle.toString().padStart(6),
                    )}`,
                );
            }
        }

        console.log(
            `\n${chalk.cyan("Updated:")} ${new Date().toLocaleTimeString()}`,
        );
    } catch (err: any) {
        console.error(chalk.red("Error fetching stats:"), err);
    }
}, 1000);
