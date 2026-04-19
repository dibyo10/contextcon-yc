import { PipelineContext } from "./pipelineContext.js";
import { logError, logInfo } from "../utils/errorLogger.js";

export class Pipeline {
    /**
     * @param {import('./steps/step.js').Step[]} steps
     */
    constructor(steps) {
        this.steps = steps;
    }

    /**
     * @param {Function} emit  - SSE emitter from server.js, or no-op when running CLI
     * @returns {Promise<PipelineContext>}
     */
    async run(emit = () => { }) {
        const context = new PipelineContext();
        logInfo("pipeline", "Pipeline started.", {
            steps: this.steps.map((step) => step.name),
        });

        for (const step of this.steps) {
            const startedAt = Date.now();
            logInfo("pipeline.step", "Step started.", { step: step.name });

            emit("step_started", { step: step.name });

            try {
                await step.run(context, emit);

                const durationMs = Date.now() - startedAt;
                const summary = {
                    step: step.name,
                    durationMs,
                    companiesCount: context.companies.length,
                    newCompaniesCount: context.newCompanies.length,
                    domainsCount: context.domains.length,
                    newDomainsCount: context.newDomains.length,
                    leadsCount: context.leads.length,
                    resultsCount: context.results.length,
                    accepted: context.leads.filter((l) => l.accepted).length,
                    sent: context.results.filter((r) => r.success).length,
                };

                logInfo("pipeline.step", "Step completed.", summary);
                emit("step_completed", summary);
            } catch (error) {
                logError("pipeline.step", error, { step: step.name });
                emit("step_error", { step: step.name, message: error.message });
                throw error;
            }
        }

        const final = {
            companiesCount: context.companies.length,
            newCompaniesCount: context.newCompanies.length,
            domainsCount: context.domains.length,
            newDomainsCount: context.newDomains.length,
            leadsCount: context.leads.length,
            resultsCount: context.results.length,
        };
        logInfo("pipeline", "Pipeline completed.", final);

        return context;
    }
}