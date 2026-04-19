import { run } from "@openai/agents";
import { Step } from "./step.js";
import EmailAgent from "../../agents/emailAgent.js";
import pickStyle from "../../utils/stylePicker.js";
import { logInfo } from "../../utils/errorLogger.js";

export class EmailStep extends Step {
    constructor() {
        super("EmailStep");
    }

    async run(context, emit = () => { }) {
        const accepted = context.leads.filter((l) => l.accepted);
        logInfo(this.name, "Drafting emails for accepted leads.", {
            acceptedCount: accepted.length,
        });

        await Promise.all(
            accepted.map(async (lead, index) => {
                const style = pickStyle(index);
                logInfo(this.name, "Email draft started.", {
                    domain: lead.domain,
                    emailsCount: lead.emails?.length || 0,
                });

                const prompt = JSON.stringify({
                    company: {
                        domain: lead.domain,
                        category: lead.research.category,
                        stage: lead.research.stage,
                        description_wrt_AI: lead.research.description_wrt_AI,
                    },
                    reason: lead.scoreReason,
                    style,
                });

                const result = await run(EmailAgent, prompt);
                lead.emailDraft = result.finalOutput;

                logInfo(this.name, "Email draft completed.", {
                    domain: lead.domain,
                    subject: lead.emailDraft.subject,
                });

                emit("email_drafted", {
                    domain: lead.domain,
                    subject: lead.emailDraft.subject,
                });
            })
        );

        return context;
    }
}