import chalk from "chalk";
import { type StreamGroupData } from "./types";

export function renderDashboard(data: StreamGroupData[]) {
    console.clear();

    console.log(
        chalk.bold.cyan("=== Redis Streams Multi-Group Dashboard ===\n"),
    );

    for (const { stream, group, info } of data) {
        console.log(chalk.underline.bold(`${stream} → Group: ${group}`));
        console.log(
            `Stream Length       : ${info.streamLength.toLocaleString()}`,
        );
        console.log(`Pending Messages    : ${info.pending}`);
        console.log(`Last Delivered ID   : ${info.lastDeliveredId}`);
        console.log(`Active Consumers    : ${info.consumers.length}`);

        if (info.consumers.length === 0) {
            console.log(chalk.yellow("   No active consumers\n"));
            continue;
        }

        const stats = info.consumers
            .map((c) => ({
                name: c.name,
                pending: c.pending,
                idle: Math.round(c.idle / 1000),
                processed: c.processed || 0,
            }))
            .sort((a, b) => b.processed - a.processed);

        const maxName = Math.max(...stats.map((s) => s.name.length), 12);

        console.log(chalk.cyan("\n   --- Consumer Stats ---\n"));
        console.log(
            chalk.yellow(
                `   Consumer${" ".repeat(maxName - 8)} │ Processed │ Pending │ Idle (s)`,
            ),
        );
        console.log(chalk.yellow("   " + "─".repeat(maxName + 35)));

        for (const { name, processed, pending, idle } of stats) {
            const namePad = name.padEnd(maxName);
            console.log(
                `   ${chalk.green(namePad)} │ ${chalk.blue(
                    processed.toString().padStart(9),
                )} │ ${chalk.red(pending.toString().padStart(7))} │ ${chalk.magenta(
                    idle.toString().padStart(6),
                )}`,
            );
        }
        console.log();
    }

    console.log(`${chalk.cyan("Updated:")} ${new Date().toLocaleTimeString()}`);
}
