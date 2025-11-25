/**
 * @description Type for an item in the system
 * @fields id - Unique identifier for the item
 * @fields customer - Name of the customer
 * @fields name - Name of the item
 * @fields amount - Amount of the item
 * @fields timestamp - Timestamp when the item was created
 */
export interface Item {
    id: string;
    customer: string;
    name: string;
    amount: number;
    timestamp: Date;
}

/**
 * @description Type for a single entry in a Redis stream
 * @field id - The ID of the stream entry
 * @field fields - The fields of the stream entry as an array of strings
 */
export type StreamEntry = [id: string, fields: string[]];

/**
 * @description Type for the response of XREAD or XREADGROUP commands
 * @field stream - The name of the stream
 * @field entries - An array of stream entries
 */
export type StreamResponse = [stream: string, entries: StreamEntry[]][];

/**
 * @description Type for the response of XAUTOCLAIM command
 * @field nextId - The ID to use for the next claim
 * @field claimedEntries - An array of claimed stream entries
 */
export type XAutoClaimResponse = [
    nextId: string,
    claimedEntries: StreamEntry[],
];
