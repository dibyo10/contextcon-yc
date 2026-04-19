import "dotenv/config";
import { fileURLToPath } from "url";
import { Pipeline } from "./orchestrator/Pipeline.js";
import { DomainStep } from "./orchestrator/steps/domainStep.js";
import { FilterStep } from "./orchestrator/steps/filterStep.js";
import { HunterStep } from "./orchestrator/steps/hunterStep.js";
import { ResearchStep } from "./orchestrator/steps/researchStep.js";
import { ScoringStep } from "./orchestrator/steps/scoringStep.js";
import { EmailStep } from "./orchestrator/steps/emailStep.js";
import { SendStep } from "./orchestrator/steps/sendStep.js";
import { connectDB } from "./db/mongo.js";
import { logError, logInfo } from "./utils/errorLogger.js";

/**
 * Core pipeline runner. Accepts an optional emit function for SSE streaming.
 * When called from CLI, emit is a no-op and nothing changes.
 *
 * @param {Function} emit
 */
export async function runPipeline(emit = () => { }) {
    logInfo("app.start", "Starting cold email pipeline.");
    await connectDB();
    logInfo("app.start", "MongoDB connection established.");

    const pipeline = new Pipeline([
        new DomainStep(),
        new FilterStep(),
        new HunterStep(),
        new ResearchStep(),
        new ScoringStep(),
        new EmailStep(),
        new SendStep(),
    ]);

    const context = await pipeline.run(emit);

    logInfo("app.start", "Pipeline run finished.", {
        companies: context.companies.length,
        domains: context.domains.length,
        newCompanies: context.newCompanies.length,
        newDomains: context.newDomains.length,
        leads: context.leads.length,
        results: context.results.length,
    });

    return context;
}

// Only runs when invoked directly: node src/index.js
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    runPipeline().catch((error) => {
        logError("app.start", error);
        process.exitCode = 1;
    });
}