import "dotenv/config";
import express from "express";
import cors from "cors";
import { runPipeline } from "./index.js";
import { logInfo, logError } from "./utils/errorLogger.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));



const app = express();
const PORT = process.env.DASHBOARD_PORT || 3001;

app.use(cors());


let isRunning = false;

/**
 * GET /run
 * Triggers the pipeline and streams events back via Server-Sent Events.
 * The frontend connects here and listens for named events.
 */
app.get("/", (req, res) => {
    res.sendFile(path.resolve(__dirname, "cold_email_agent/../../dashboard.html"));
});
app.get("/run", async (req, res) => {
    if (isRunning) {
        res.status(409).json({ error: "Pipeline already running." });
        return;
    }

    isRunning = true;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    /**
     * Sends a named SSE event to the connected frontend.
     * @param {string} event
     * @param {object} data
     */
    const emit = (event, data) => {
        res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    logInfo("server", "Pipeline run requested via dashboard.");

    try {
        await runPipeline(emit);
        emit("done", { message: "Pipeline complete." });
        logInfo("server", "Pipeline run completed via dashboard.");
    } catch (error) {
        logError("server", error);
        emit("error", { message: error.message });
    } finally {
        isRunning = false;
        res.end();
    }
});


app.get("/status", (req, res) => {
    res.json({ ok: true, running: isRunning });
});

app.listen(PORT, () => {
    logInfo("server", `Dashboard server running.`, { port: PORT });
    console.log(`Dashboard server on http://localhost:${PORT}`);
});