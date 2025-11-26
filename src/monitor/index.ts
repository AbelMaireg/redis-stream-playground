import { parseArgs } from "./args.js";
import { monitorStreams } from "./stream-monitor";

const args = parseArgs(process.argv.slice(2));
monitorStreams(args);
