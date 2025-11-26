import chalk from "chalk";
import { type ConsumerConfig } from "./types";

export function parseConsumerArgs(args: string[]): ConsumerConfig {
    const config: Partial<ConsumerConfig> = {};

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
        } else if (arg.startsWith("--group") || arg.startsWith("-g")) {
            if (config.group) {
                console.error("Error: --group specified multiple times");
                showProducerHelp();
                process.exit(1);
            }
            if (i + 1 >= args.length) {
                console.error("Error: --group requires a value");
                showProducerHelp();
                process.exit(1);
            }
            config.group = args[++i];
        } else if (arg === "--name" || arg === "-n") {
            if (config.name) {
                console.error("Error: --name specified multiple times");
                showProducerHelp();
                process.exit(1);
            }
            if (i + 1 >= args.length) {
                console.error("Error: --name requires a value");
                showProducerHelp();
                process.exit(1);
            }
            config.name = args[++i];
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

    return config as ConsumerConfig;
}

function showProducerHelp() {
    console.log(
        chalk.yellow(`
Usage: bun producer.ts --stream <stream-name> --group <group-name> [options]

Options:
  --stream <stream-name>       -s   Name of the Redis Stream (required)
  --group <group-name>        -g   Name of the consumer group (required)
  --name <consumer-name>      -n   Name of the consumer (optional, default: random)
Example:
  bun producer.ts --stream payment --count 500

Description:
  Publishes test messages to a Redis Stream for load testing and monitoring.
  The consumer group is used only for context (e.g., naming stats keys).
`),
    );
}
