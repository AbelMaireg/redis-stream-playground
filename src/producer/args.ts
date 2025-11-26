import chalk from "chalk";
import { type ProducerConfig } from "./types";

export function parseProducerArgs(args: string[]): ProducerConfig {
    const config: Partial<ProducerConfig> = {};

    let i = 0;
    while (i < args.length) {
        const arg = args[i] as string;

        if (arg === "--stream" || arg === "-s") {
            if (config.stream) {
                console.error("Error: --stream specified multiple times");
                showProducerHelp();
                process.exit(1);
            }
            if (i + 1 >= args.length) {
                console.error("Error: --stream requires a value");
                showProducerHelp();
                process.exit(1);
            }
            config.stream = args[++i];
        } else if (arg.startsWith("--count") || arg.startsWith("-c")) {
            if (config.count) {
                console.error("Error: --count specified multiple times");
                showProducerHelp();
                process.exit(1);
            }
            if (i + 1 >= args.length) {
                console.error("Error: --count requires a value");
                showProducerHelp();
                process.exit(1);
            }
            const count = parseInt(args[++i] as string, 10);
            if (isNaN(count) || count <= 0) {
                console.error(
                    "Error: --count requires a positive integer value",
                );
                showProducerHelp();
                process.exit(1);
            }
            config.count = count;
        } else if (arg.startsWith("-")) {
            console.error(`Error: Unknown option: ${arg}`);
            showProducerHelp();
            process.exit(1);
        } else {
            console.error(`Error: Unexpected positional argument: ${arg}`);
            showProducerHelp();
            process.exit(1);
        }

        i++;
    }

    if (!config.stream) {
        console.error("Error: Missing required --stream argument");
        showProducerHelp();
        process.exit(1);
    }

    if (!config.count) {
        config.count = 100;
    }

    return config as ProducerConfig;
}

function showProducerHelp() {
    console.log(
        chalk.yellow(`
Usage: bun producer.ts --stream <stream-name> [--count <number-of-messages>]

Options:
  --stream <stream-name>       -s   Name of the Redis Stream to publish messages to (required)
  --count <number-of-messages> -c   Number of messages to produce (default: 100)

Example:
  bun producer.ts --stream payment --count 500

Description:
  Publishes test messages to a Redis Stream for load testing and monitoring.
  The consumer group is used only for context (e.g., naming stats keys).
`),
    );
}
