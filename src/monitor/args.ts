import { type StreamConfig } from "./types";

export function parseArgs(args: string[]): StreamConfig[] {
    const configs: StreamConfig[] = [];
    let current: StreamConfig | null = null;

    for (let i = 0; i < args.length; i++) {
        const arg = args[i] as string;

        if (arg === "--stream") {
            if (current) configs.push(current);
            current = { stream: args[++i] as string, groups: [] };
        } else if (arg === "--group") {
            if (!current) {
                console.error("Error: --group must come after --stream");
                process.exit(1);
            }
            while (
                i + 1 < args.length &&
                !(args[i + 1] as string).startsWith("--")
            ) {
                current.groups.push(args[++i] as string);
            }
        } else if (arg.startsWith("--")) {
            console.error(`Unknown option: ${arg}`);
            process.exit(1);
        } else {
            console.error(
                `Unexpected argument: ${arg}. Did you forget --group?`,
            );
            process.exit(1);
        }
    }

    if (current) configs.push(current);

    if (configs.length === 0 || configs.some((c) => c.groups.length === 0)) {
        console.error("Each --stream must be followed by at least one --group");
        process.exit(1);
    }

    return configs;
}
