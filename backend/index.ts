import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import { tavily } from "@tavily/core";
import { PROMPT_TEMPLATE, SYSTEM_PROMPT } from "./prompt";
import { prisma } from "./db";
import { middleware } from "./middleware";


dotenv.config();

const app = express();
app.use(express.json());

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

const tavilyClient = tavily({
    apiKey: process.env.TAVILY_API_KEY,
});




app.get('/conversation', middleware, (req, res) => {

})

app.get('/conversation/:converstaionId', middleware, (req, res) => {

})




app.post("/veridian_ask", middleware, async (req, res) => {
    try {
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({
                message: "Query is required",
            });
        }

        const searchResponse = await tavilyClient.search(query, {
            searchDepth: "advanced",
        });

        const webSearchResults = searchResponse.results;

        const prompt = PROMPT_TEMPLATE
            .replace(
                "{{WEB_SEARCH_RESULTS}}",
                JSON.stringify(webSearchResults, null, 2)
            )
            .replace("{{USER_QUERY}}", query);

        const response = await anthropic.messages.create({
            model: "claude-haiku-4-5",
            max_tokens: 2048,
            system: SYSTEM_PROMPT,
            messages: [
                {
                    role: "user",
                    content: prompt,
                },
            ],
        });

        const answer =
            response.content[0]?.type === "text"
                ? response.content[0].text
                : "";

        const sources = webSearchResults
            .map(
                (result, index) =>
                    `${index + 1}. ${result.title}\n${result.url}`
            )
            .join("\n\n");

        const finalResponse = `${answer}------------SOURCES-------------${sources}`;

        res.setHeader("Content-Type", "text/plain");
        res.send(finalResponse);
    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Internal Server Error",
            error: error instanceof Error ? error.message : "Unknown Error",
        });
    }
});


app.post('/veridian_ask/follow_up', middleware, async (req, res) => {

})



app.listen(3001, () => {
    console.log("Server running on port 3000");
});