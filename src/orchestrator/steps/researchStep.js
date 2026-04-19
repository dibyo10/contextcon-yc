import { run } from "@openai/agents";
import { Step } from "./step.js";
import CompanyResearchAgent from "../../agents/companyReasearcherAgent.js";
import { logInfo } from "../../utils/errorLogger.js";

export class ResearchStep extends Step {
    constructor() {
        super("ResearchStep");
    }

    async run(context, emit = () => { }) {
        logInfo(this.name, "Researching companies.", {
            leadsCount: context.leads.length,
        });

        await Promise.all(
            context.leads.map(async (lead) => {
                logInfo(this.name, "Research started for company.", { domain: lead.domain });

                const result = await run(
                    CompanyResearchAgent,
                    `Research this company: ${lead.domain}`
                );
                lead.research = result.finalOutput;

                logInfo(this.name, "Research completed for company.", {
                    domain: lead.domain,
                    category: lead.research.category,
                    stage: lead.research.stage,
                    hiringSignal: lead.research.hiring_signal,
                    confidence: lead.research.confidence,
                });

                emit("lead_researched", {
                    domain: lead.domain,
                    category: lead.research.category,
                    stage: lead.research.stage,
                    hiringSignal: lead.research.hiring_signal,
                });
            })
        );

        return context;
    }
}