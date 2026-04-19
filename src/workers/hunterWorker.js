import { Worker } from "bullmq";
import IORedis from "ioredis";
import { findHunterEmailsForPeople } from "../services/hunterService.js";
import { leadQueue } from "../queue/leadQueue.js";
import {
    attachWorkerErrorLogging,
    attachWorkerLifecycleLogging,
    logInfo,
} from "../utils/errorLogger.js";

const connection = new IORedis({ maxRetriesPerRequest: null });

const worker = new Worker(
    "hunterQueue",
    async (job) => {
        const {
            domain,
            companyName,
            runId,
            people = [],
            hunterApiKey = process.env.HUNTER_API_KEY,
        } = job.data;

        logInfo("hunterQueue.job", "Hunter lookup started.", {
            jobId: job.id,
            runId,
            domain,
            companyName,
            peopleCount: people.length,
        });

        if (!people.length) {
            logInfo("hunterQueue.job", "No people provided. Lead result skipped.", {
                jobId: job.id,
                runId,
                domain,
                companyName,
            });
            return;
        }

        const emails = await findHunterEmailsForPeople({
            people,
            domain,
            companyName,
            apiKey: hunterApiKey,
        });

        if(!emails.length) {
            await leadQueue.add("contactLookupResult", {
                domain,
                companyName,
                runId,
                status: "no_emails",
                people,
                emails: [],
            });

            logInfo("hunterQueue.job", "No emails found. Lead result skipped.", {
                jobId: job.id,
                runId,
                domain,
                companyName,
            });
            return;
        }

        await leadQueue.add("contactLookupResult",{
            domain,
            companyName,
            runId,
            status: "emails_found",
            people,
            emails,
        });

        logInfo("hunterQueue.job", "Lead result enqueued.", {
            jobId: job.id,
            runId,
            domain,
            companyName,
            emailsCount: emails.length,
        });
    },
    {
        connection,
        limiter: { 
            max: 5,
            duration: 1000,
        },
    }
);

attachWorkerErrorLogging(worker, "hunterQueue");
attachWorkerLifecycleLogging(worker, "hunterQueue");
