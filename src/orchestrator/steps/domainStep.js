import { run } from "@openai/agents";
import { Step } from "./step.js";
import DomainFinderAgent from "../../agents/domainAgent.js";
import { logInfo } from "../../utils/errorLogger.js";

export class DomainStep extends Step {
    constructor() {
        super("DomainStep");
    }

    async run(context, emit = () => { }) {
        logInfo(this.name, "Discovering domains with DomainFinderAgent.");

        const result = await run(
            DomainFinderAgent,
            "Find relevant startup companies for outreach according to my Resume."
        );
        context.companies = result.finalOutput.companies;
        context.domains = context.companies.map((c) => c.domain);

        logInfo(this.name, "Domain discovery completed.", {
            companiesCount: context.companies.length,
            domainsCount: context.domains.length,
            companies: context.companies,
        });

        emit("companies_found", {
            companies: context.companies,
            count: context.companies.length,
        });

        return context;
    }
}