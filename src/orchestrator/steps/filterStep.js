import { Step } from "./step.js";
import { filterNewDomains } from "../../utils/duplicateDetector.js";
import Domain from "../../db/models/domain.js";
import { logInfo } from "../../utils/errorLogger.js";

/**
 * Filters out domains already stored in MongoDB.
 * Saves new domains to the DB so future runs skip them.
 * Reads:  context.companies, context.domains
 * Writes: context.newCompanies, context.newDomains
 */
export class FilterStep extends Step {
    constructor() {
        super("FilterStep");
    }

    async run(context) {
        logInfo(this.name, "Filtering domains against MongoDB.", {
            domainsCount: context.domains.length,
        });

        context.newDomains = await filterNewDomains(context.domains);
        const newDomainSet = new Set(context.newDomains);
        context.newCompanies = context.companies.filter((company) =>
            newDomainSet.has(company.domain)
        );

        if (context.newDomains.length) {
            logInfo(this.name, "Persisting new domains.", {
                newDomainsCount: context.newDomains.length,
            });
            await Domain.insertMany(
                context.newDomains.map((domain) => ({ domain })),
                { ordered: false }
            );
        }

        logInfo(this.name, "Domain filtering completed.", {
            newCompaniesCount: context.newCompanies.length,
            newDomainsCount: context.newDomains.length,
            skippedDomainsCount: context.domains.length - context.newDomains.length,
        });
        return context;
    }
}
