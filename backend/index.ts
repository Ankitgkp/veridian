import express from 'express'
import z from 'zod';
import Anthropic from "@anthropic-ai/sdk";
import { tavily } from '@tavily/core'
import { PROMPT_TEMPLATE, SYSTEM_PROMPT } from './prompt';
const client = new Anthropic();


const webClient = tavily({ apiKey: process.env.TAVILY_API_KEY })

const app = express()
app.use(express.json())


app.post('/converstation', async (req, res) => {
    const query = req.body.query


    const webSearchResponse = webClient.search(query, {
        searchDepth: 'advanced'
    });

    const webSearchResults = (await webSearchResponse).results

    const prompt = PROMPT_TEMPLATE.replace("{{WEB_SEARCH_RESULTS}}", JSON.stringify(webSearchResults)).replace("{{USER_QUERY}}", query)


    const stream = client.messages.stream({
        model: "claude-haiku-4-5",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [
            {
                role: "user",
                content: prompt,
            },
        ],
    });

    stream.on("text", (text) => {
        process.stdout.write(text);
    });

    const finalMessage = await stream.finalMessage();

    res.write("------------SOURCES-------------\n")

    webSearchResults.forEach(result => res.write(JSON.stringify(result)))

    res.end();
})


app.listen(3000, () => {
    console.log("Listening on port 3000");
})