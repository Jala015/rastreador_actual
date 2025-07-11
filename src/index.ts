import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import api from "@actual-app/api";

const app = new Hono()

app.get('/', async (c) => {
  let b = await getBudget()
    return c.json(b)
})

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`Server is running on http://localhost:${info.port}`)
})


async function getBudget() {
    try {

        await api.init({
            dataDir: "./actual-data",
            serverURL: process.env.ACTUAL_URL,
            password: process.env.ACTUAL_PASSWORD,
        });

        await api.downloadBudget(process.env.ACTUAL_BUDGET_SYNC_CODE);

        let budget = await api.getBudgetMonth("2025-07");

        await api.shutdown();
        return budget
    } catch (error) {
        console.error(error)
    }

}
