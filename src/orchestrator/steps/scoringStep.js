import { run } from "@openai/agents";
import { Step } from "./step.js";
import ScoringAgent from "../../agents/scoringAgent.js";
import { shouldAcceptLead } from "../../utils/scoringUtil.js";
import { logInfo } from "../../utils/errorLogger.js";

export class ScoringStep extends Step {
    constructor() {
        super("ScoringStep");
    }

    async run(context, emit = () => { }) {
        logInfo(this.name, "Scoring leads.", { leadsCount: context.leads.length });

        await Promise.all(
            context.leads.map(async (lead) => {
                logInfo(this.name, "Scoring started for lead.", { domain: lead.domain });

                const result = await run(
                    ScoringAgent,
                    JSON.stringify({ domain: lead.domain, research: lead.research })
                );
                lead.score = result.finalOutput.score;
                lead.scoreReason = result.finalOutput.reason;
                lead.accepted = shouldAcceptLead(result.finalOutput);

                logInfo(this.name, "Scoring completed for lead.", {
                    domain: lead.domain,
                    score: lead.score,
                    decision: result.finalOutput.decision,
                    accepted: lead.accepted,
                });

                emit("lead_scored", {
                    domain: lead.domain,
                    score: lead.score,
                    accepted: lead.accepted,
                    reason: lead.scoreReason,
                });
            })
        );

        const accepted = context.leads.filter((l) => l.accepted).length;
        logInfo(this.name, "Lead scoring completed.", {
            accepted,
            total: context.leads.length,
        });

        return context;
    }
}