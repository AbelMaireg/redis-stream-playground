export interface StreamConfig {
    stream: string;
    groups: string[];
}

export interface ConsumerStat {
    name: string;
    pending: number;
    idle: number;
    processed: number;
}

export interface GroupInfo {
    streamLength: number;
    pending: number;
    lastDeliveredId: string;
    consumers: ConsumerStat[];
}

export interface StreamGroupData {
    stream: string;
    group: string;
    info: GroupInfo;
}
