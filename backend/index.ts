import express from "express";
import Anthropic from "@anthropic-ai/sdk";
import dotenv from "dotenv";
import { tavily } from "@tavily/core";
import { PROMPT_TEMPLATE, SYSTEM_PROMPT } from "./prompt";
import { prisma } from "./db";
import { middleware, guestMiddleware } from "./middleware";
import cors from "cors";
import crypto from "crypto";

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

const tavilyClient = tavily({
    apiKey: process.env.TAVILY_API_KEY,
});


function generateSlug(query: string): string {
    const base = query
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60);
    const suffix = crypto.randomUUID().slice(0, 8);
    return `${base}-${suffix}`;
}

app.get("/conversations", middleware, async (req, res) => {
    try {
        const userId: string = req.userId;

        const conversations = await prisma.conversation.findMany({
            where: { userId },
            orderBy: { messages: { _count: "desc" } },
            include: {
                messages: {
                    orderBy: { createdAt: "desc" },
                    take: 1,
                },
                _count: { select: { messages: true } },
            },
        });

        res.json({ conversations });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Internal Server Error",
            error: error instanceof Error ? error.message : "Unknown Error",
        });
    }
});


app.get("/conversation/:conversationId", middleware, async (req, res) => {
    try {
        //@ts-ignor
        const userId: string = req.userId;
        const { conversationId } = req.params;

        const conversation = await prisma.conversation.findFirst({
            where: {
                //@ts-ignore
                OR: [{ id: conversationId }, { slug: conversationId }],
                userId,
            },
            include: {
                messages: {
                    orderBy: { createdAt: "asc" },
                },
            },
        });

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        res.json({ conversation });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Internal Server Error",
            error: error instanceof Error ? error.message : "Unknown Error",
        });
    }
});

app.post("/veridian_ask", guestMiddleware, async (req, res) => {
    try {
        //@ts-ignore
        const userId: string | null = req.userId;
        const { query } = req.body;

        if (!query) {
            return res.status(400).json({ message: "Query is required" });
        }

        // SSE headers
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders();

        // Only persist to DB for authenticated users
        let conversationId: string | null = null;
        let conversationSlug: string | null = null;

        if (userId) {
            const slug = generateSlug(query);
            const conversation = await prisma.conversation.create({
                data: {
                    title: query.slice(0, 200),
                    slug,
                    userId,
                    messages: {
                        create: [{ content: query, role: "User" }],
                    },
                },
            });
            conversationId = conversation.id;
            conversationSlug = conversation.slug;
        }

        // Send meta event (conversationId will be null for guests)
        res.write(`data: ${JSON.stringify({ type: "meta", conversationId, slug: conversationSlug, guest: !userId })}\n\n`);

        const searchResponse = await tavilyClient.search(query, {
            searchDepth: "advanced",
        });
        const webSearchResults = searchResponse.results;

        // Send sources event
        const sources = webSearchResults.map((result, index) => ({
            index: index + 1,
            title: result.title,
            url: result.url,
        }));
        res.write(`data: ${JSON.stringify({ type: "sources", sources })}\n\n`);

        const prompt = PROMPT_TEMPLATE.replace(
            "{{WEB_SEARCH_RESULTS}}",
            JSON.stringify(webSearchResults, null, 2)
        ).replace("{{USER_QUERY}}", query);

        // Stream the LLM response
        let fullAnswer = "";
        const stream = anthropic.messages.stream({
            model: "claude-haiku-4-5",
            max_tokens: 2048,
            system: SYSTEM_PROMPT,
            messages: [{ role: "user", content: prompt }],
        });

        stream.on("text", (text) => {
            fullAnswer += text;
            res.write(`data: ${JSON.stringify({ type: "text_delta", delta: text })}\n\n`);
        });

        await stream.finalMessage();

        // Save to DB only for authenticated users
        if (conversationId) {
            const sourcesText = webSearchResults
                .map((result, index) => `${index + 1}. ${result.title}\n${result.url}`)
                .join("\n\n");
            const finalResponse = `${fullAnswer}------------SOURCES-------------${sourcesText}`;

            await prisma.message.create({
                data: {
                    content: finalResponse,
                    role: "Assistant",
                    conversationId,
                },
            });
        }

        res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
        res.end();
    } catch (error) {
        console.error(error);
        if (res.headersSent) {
            res.write(`data: ${JSON.stringify({ type: "error", message: error instanceof Error ? error.message : "Unknown Error" })}\n\n`);
            res.end();
        } else {
            res.status(500).json({
                message: "Internal Server Error",
                error: error instanceof Error ? error.message : "Unknown Error",
            });
        }
    }
});


app.post("/veridian_ask/follow_up", middleware, async (req, res) => {
    try {
        //@ts-ignore
        const userId: string = req.userId;
        const { query, conversationId } = req.body;

        if (!query || !conversationId) {
            return res.status(400).json({
                message: "Both 'query' and 'conversationId' are required",
            });
        }

        const conversation = await prisma.conversation.findFirst({
            where: {
                OR: [{ id: conversationId }, { slug: conversationId }],
                userId,
            },
            include: {
                messages: {
                    orderBy: { createdAt: "asc" },
                },
            },
        });

        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        await prisma.message.create({
            data: {
                content: query,
                role: "User",
                conversationId: conversation.id,
            },
        });

        // SSE headers
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders();

        res.write(`data: ${JSON.stringify({ type: "meta", conversationId: conversation.id, slug: conversation.slug })}\n\n`);

        const history: Anthropic.MessageParam[] = conversation.messages.map(
            (msg) => ({
                role: msg.role === "User" ? ("user" as const) : ("assistant" as const),
                content: msg.content,
            })
        );

        const searchResponse = await tavilyClient.search(query, {
            searchDepth: "advanced",
        });
        const webSearchResults = searchResponse.results;

        // Send sources event
        const sources = webSearchResults.map((result, index) => ({
            index: index + 1,
            title: result.title,
            url: result.url,
        }));
        res.write(`data: ${JSON.stringify({ type: "sources", sources })}\n\n`);

        const prompt = PROMPT_TEMPLATE.replace(
            "{{WEB_SEARCH_RESULTS}}",
            JSON.stringify(webSearchResults, null, 2)
        ).replace("{{USER_QUERY}}", query);

        history.push({ role: "user", content: prompt });

        // Stream the LLM response
        let fullAnswer = "";
        const stream = anthropic.messages.stream({
            model: "claude-haiku-4-5",
            max_tokens: 2048,
            system: SYSTEM_PROMPT,
            messages: history,
        });

        stream.on("text", (text) => {
            fullAnswer += text;
            res.write(`data: ${JSON.stringify({ type: "text_delta", delta: text })}\n\n`);
        });

        await stream.finalMessage();

        // Build full response for DB storage
        const sourcesText = webSearchResults
            .map((result, index) => `${index + 1}. ${result.title}\n${result.url}`)
            .join("\n\n");
        const finalResponse = `${fullAnswer}------------SOURCES-------------${sourcesText}`;

        await prisma.message.create({
            data: {
                content: finalResponse,
                role: "Assistant",
                conversationId: conversation.id,
            },
        });

        res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
        res.end();
    } catch (error) {
        console.error(error);
        if (res.headersSent) {
            res.write(`data: ${JSON.stringify({ type: "error", message: error instanceof Error ? error.message : "Unknown Error" })}\n\n`);
            res.end();
        } else {
            res.status(500).json({
                message: "Internal Server Error",
                error: error instanceof Error ? error.message : "Unknown Error",
            });
        }
    }
});


app.listen(3001, () => {
    console.log("Server running on port 3001");
});