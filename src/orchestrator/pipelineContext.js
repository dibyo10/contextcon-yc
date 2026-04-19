/**
 * PipelineContext is the single shared data structure passed through all steps.
 * Steps read from it and write to it. No step imports another step.
 *
 * Shape evolves as the pipeline progresses:
 *   - After DomainStep:   context.companies       CompanyTarget[]
 *   - After FilterStep:   context.newCompanies    CompanyTarget[]
 *   - After HunterStep:   context.leads           Lead[] with Crustdata people + Hunter emails
 *   - After ResearchStep: context.leads[].research CompanyResearch
 *   - After ScoringStep:  context.leads[].score    ScoredLead
 *   - After EmailStep:    context.leads[].email    EmailDraft
 *   - After SendStep:     context.results          SendResult[]
 */

export class PipelineContext {
    constructor(){

        /** @type {string[]} */
        this.domains = [];

        /** @type {Array<{ companyName: string, domain: string }>} */
        this.companies = [];

        /** @type {string[]} */
        this.newDomains = [];

        /** @type {Array<{ companyName: string, domain: string }>} */
        this.newCompanies = [];

        /** @type {Array<{ domain: string, companyName: string, status: string, people?: unknown[], emails?: unknown[] }>} */
        this.contactLookupResults = [];

        /**
         * @type {Array<{
         *   domain: string,
         *   companyName?: string,
         *   people?: Array<{
         *     fullName: string,
         *     firstName: string,
         *     lastName: string,
         *     linkedinUrl: string,
         *     linkedinHandle?: string,
         *     title: string,
         *   }>,
         *   emails: import('./steps/hunterStep.js').HunterEmail[],
         *   research?: import('./steps/researchStep.js').CompanyResearch,
         *   score?: number,
         *   scoreReason?: string,
         *   accepted?: boolean,
         *   emailDraft?: { subject: string, body: string },
         * }>}
         */

        this.leads = [];

        /** @type {Array<{ domain: string, success: boolean, messageId?: string, error?: string }>} */

        this.results = [];



    }
}
