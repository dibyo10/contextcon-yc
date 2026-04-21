import {tool} from '@openai/agents'
import OpenAI from "openai"
import { z } from 'zod'

let client;

function getClient() {
    client ||= new OpenAI();
    return client;
}


const WebSearchTool = tool({
    name: "web_search_tool",
    description: "This tool can be used to search the web",
    parameters: z.object({
        searchQuery: z.string().describe("The search query to search the web"),
    }),
    execute: async function ({ searchQuery }) {

        const response = await getClient().responses.create({
            model: "gpt-5.2",
            tools: [
                { type: "web_search" },
            ],
            input: searchQuery,
        });

        return response.output_text;

    }
})

export default WebSearchTool
