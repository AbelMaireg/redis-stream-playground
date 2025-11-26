import Redis from "ioredis";
import { renderDashboard } from "./dashboard";
import type { StreamGroupData, StreamConfig } from "./types";

const redis = new Redis();

export async function fetchGroupStats(
    stream: string,
    group: string,
): Promise<StreamGroupData["info"]> {
    const [streamLength, groupsRaw, consumersRaw] = await Promise.all([
        redis.xlen(stream),
        redis.xinfo("GROUPS", stream).catch(() => []),
        redis.xinfo("CONSUMERS", stream, group).catch(() => []),
    ]);

    const groups = groupsRaw as string[][];
    const groupInfo = groups.find((g) => g[g.indexOf("name") + 1] === group);

    if (!groupInfo) {
        throw new Error(`Group ${group} not found in stream ${stream}`);
    }

    const pending = Number(groupInfo[groupInfo.indexOf("pending") + 1]);
    const lastDeliveredId = groupInfo[
        groupInfo.indexOf("last-delivered-id") + 1
    ] as string;

    const consumerNames = (consumersRaw as string[][]).map(
        (c) => c[c.indexOf("name") + 1] as string,
    );

    const processedCounts =
        consumerNames.length > 0
            ? await redis.mget(
                  ...consumerNames.map(
                      (name) => `stats:processed:${group}:${name}`,
                  ),
              )
            : [];

    const consumers = (consumersRaw as string[][]).map((c, i) => ({
        name: c[c.indexOf("name") + 1] as string,
        pending: Number(c[c.indexOf("pending") + 1]),
        idle: Number(c[c.indexOf("idle") + 1]),
        processed: processedCounts[i] ? Number(processedCounts[i]) || 0 : 0,
    }));

    return {
        streamLength,
        pending,
        lastDeliveredId,
        consumers,
    };
}

export async function monitorStreams(configs: StreamConfig[]) {
    const tasks = configs.flatMap(({ stream, groups }) =>
        groups.map(
            (group) => async (): Promise<StreamGroupData> => ({
                stream,
                group,
                info: await fetchGroupStats(stream, group).catch((err) => {
                    console.error(
                        `Failed to fetch ${stream}:${group}:`,
                        err.message,
                    );
                    return {
                        streamLength: -1,
                        pending: -1,
                        lastDeliveredId: "N/A",
                        consumers: [],
                    };
                }),
            }),
        ),
    );

    setInterval(async () => {
        try {
            const results = await Promise.all(tasks.map((t) => t()));
            renderDashboard(results.filter((r) => r.info.streamLength >= 0));
        } catch (err) {
            console.error("Fatal error in monitor loop:", err);
        }
    }, 1000);
}
