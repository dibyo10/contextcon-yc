import { randomUUID } from "crypto";
import { Worker } from "bullmq";
import IORedis from "ioredis";
import { Step } from "./step.js";
import { crustdataQueue } from "../../queue/crustdataQueue.js";
import { logError, logInfo } from "../../utils/errorLogger.js";

const CONTACT_LOOKUP_TIMEOUT_MS = Number(
    process.env.CONTACT_LOOKUP_TIMEOUT_MS || 120_000
);

export class HunterStep extends Step {
    constructor() {
        super("ContactLookupStep");
    }

    async run(context, emit = () => { }) {
        if (!context.newCompanies.length) {
            logInfo(this.name, "No new domains. Skipping contact lookup.");
            return context;
        }

        const runId = randomUUID();
        logInfo(this.name, "Enqueuing companies for Crustdata + Hunter lookup.", {
            runId,
            companiesCount: context.newCompanies.length,
        });

        for (const { domain, companyName } of context.newCompanies) {
            logInfo(this.name, "Enqueuing Crustdata lookup.", { runId, domain, companyName });
            await crustdataQueue.add("lookupImportantPeople", {
                domain,
                companyName,
                runId,
                crustdataApiKey: process.env.CRUSTDATA_API_KEY,
                hunterApiKey: process.env.HUNTER_API_KEY,
            });
        }

        context.contactLookupResults = await this._collectLeads(
            context.newCompanies.length,
            runId,
            emit
        );
        context.leads = context.contactLookupResults.filter(
            (r) => r.emails?.length
        );

        logInfo(this.name, "Contact lookup completed.", {
            runId,
            leadsCount: context.leads.length,
            completedLookupsCount: context.contactLookupResults.length,
            expectedCompaniesCount: context.newCompanies.length,
        });

        return context;
    }

    async _collectLeads(expected, runId, emit = () => { }) {
        const leads = [];
        const connection = new IORedis({ maxRetriesPerRequest: null });
        const timeoutMs = Math.max(
            CONTACT_LOOKUP_TIMEOUT_MS,
            Math.ceil(expected / 15) * 60_000 + 60_000
        );

        logInfo(this.name, "Waiting for contact lookup results from leadQueue.", {
            runId,
            expected,
            timeoutMs,
        });

        return new Promise((resolve, reject) => {
            let settled = false;
            let worker;
            let timeout;

            const finish = async () => {
                if (settled) return;
                settled = true;
                clearTimeout(timeout);
                logInfo(this.name, "Stopping contact lookup result collector.", {
                    runId,
                    collected: leads.length,
                    expected,
                });
                try {
                    if (worker) await worker.close();
                    await connection.quit();
                    resolve(leads);
                } catch (error) {
                    logError("contactLookup.collect.close", error, { runId });
                    reject(error);
                }
            };

            timeout = setTimeout(finish, timeoutMs);

            worker = new Worker(
                "leadQueue",
                async (job) => {
                    if (job.data.runId !== runId) return;

                    leads.push(job.data);

                    logInfo(this.name, "Received contact lookup result.", {
                        runId,
                        collected: leads.length,
                        expected,
                        domain: job.data.domain,
                        status: job.data.status,
                        peopleCount: job.data.people?.length || 0,
                        emailsCount: job.data.emails?.length || 0,
                    });

                    // Emit each lead as it arrives — dashboard lights up in real time
                    emit("lead_found", {
                        domain: job.data.domain,
                        status: job.data.status,
                        peopleCount: job.data.people?.length || 0,
                        emailsCount: job.data.emails?.length || 0,
                    });

                    if (leads.length >= expected) setTimeout(finish, 0);
                },
                { connection }
            );

            worker.on("failed", (job, error) => {
                logError("contactLookup.collect.job", error, { runId, jobId: job?.id });
            });
            worker.on("error", (error) => {
                logError("contactLookup.collect.worker", error, { runId });
            });
        });
    }
}