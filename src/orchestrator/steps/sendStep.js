import { Step } from "./step.js";
import { sendEmail } from "../../services/emailSender.js";
import { logInfo } from "../../utils/errorLogger.js";

export class SendStep extends Step {
    constructor() {
        super("SendStep");
    }

    async run(context, emit = () => { }) {
        const accepted = context.leads.filter((l) => l.accepted && l.emailDraft);
        const recipientsCount = accepted.reduce(
            (count, lead) => count + (lead.emails?.length || 0),
            0
        );
        logInfo(this.name, "Sending drafted emails.", {
            acceptedLeadsCount: accepted.length,
            recipientsCount,
        });

        const sends = accepted.flatMap((lead) =>
            lead.emails.map((contact) => {
                logInfo(this.name, "Sending email.", {
                    domain: lead.domain,
                    to: contact.email,
                    subject: lead.emailDraft.subject,
                });

                return sendEmail({
                    to: contact.email,
                    subject: lead.emailDraft.subject,
                    body: lead.emailDraft.body,
                }).then((result) => {
                    emit("email_sent", {
                        domain: lead.domain,
                        to: contact.email,
                        success: result.success,
                    });
                    return { domain: lead.domain, to: contact.email, ...result };
                });
            })
        );

        context.results = await Promise.allSettled(sends).then((settled) =>
            settled.map((s) =>
                s.status === "fulfilled"
                    ? s.value
                    : { success: false, error: s.reason?.message }
            )
        );

        const sent = context.results.filter((r) => r.success).length;
        logInfo(this.name, "Email sending completed.", {
            sent,
            total: context.results.length,
        });

        return context;
    }
}