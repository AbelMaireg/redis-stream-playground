import Redis from "ioredis";
import { MAX_STREAM_LENGTH } from "../config";
import { type Item } from "../types";
import { faker } from "@faker-js/faker";
import chalk from "chalk";
import { parseProducerArgs } from "./args";

const redis = new Redis();
const config = parseProducerArgs(process.argv.slice(2));

/**
 * @description Produces a specified number of orders and adds them to the Redis stream.
 * @param count - The number of orders to produce.
 */
async function produceOrders(stream: string, count: number) {
    for (let i = 1; i <= count; i++) {
        let r = Math.random() * 225;
        let g = Math.random() * 225;
        let b = Math.random() * 225;
        let formatter = chalk.rgb(r, g, b);

        const item: Item = {
            id: faker.string.alphanumeric({
                length: 10,
                casing: "lower",
            }),
            customer: faker.person.fullName(),
            name: faker.commerce.productName(),
            amount: faker.number.int({ min: 1, max: 1000 }),
            timestamp: faker.date.recent(),
        };

        await redis.xadd(
            stream,
            "MAXLEN",
            "~",
            MAX_STREAM_LENGTH,
            "*",
            "data",
            JSON.stringify(item),
        );

        console.log(formatter(`Produced order ${item.id}`));
        console.log(formatter(`\t ${item.customer}`));
        console.log(formatter(`\t ${item.name}`));
        console.log(formatter(`\t ${item.amount}`));

        await new Promise((r) => setTimeout(r, 50));
    }

    console.log(chalk.green(`Finished producing ${count} orders.`));
    await redis.quit();
}

produceOrders(config.stream, config.count).catch(console.error);
