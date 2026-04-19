import { Worker } from "bullmq";
import IORedis from "ioredis";
import { findImportantPeopleByCompany } from "../services/crustdataService.js";
import { hunterQueue } from "../queue/hunterQueue.js";
import { leadQueue } from "../queue/leadQueue.js";
import {
    attachWorkerErrorLogging,
    attachWorkerLifecycleLogging,
    logInfo,
} from "../utils/errorLogger.js";

const connection = new IORedis({ maxRetriesPerRequest: null });

const worker = new Worker(
    "crustdataQueue",
    async (job) => {
        const {
            domain,
            companyName,
            runId,
            crustdataApiKey = process.env.CRUSTDATA_API_KEY,
            hunterApiKey = process.env.HUNTER_API_KEY,
            peopleLimit = 5,
        } = job.data;

        logInfo("crustdataQueue.job", "Crustdata lookup started.", {
            jobId: job.id,
            runId,
            domain,
            companyName,
            peopleLimit,
        });

        const people = await findImportantPeopleByCompany(
            companyName,
            crustdataApiKey,
            { limit: peopleLimit }
        );

        if (!people.length) {
            await leadQueue.add("contactLookupResult", {
                domain,
                companyName,
                runId,
                status: "no_people",
                people: [],
                emails: [],
            });

            logInfo("crustdataQueue.job", "No people found. Hunter lookup skipped.", {
                jobId: job.id,
                runId,
                domain,
                companyName,
            });
            return;
        }

        await hunterQueue.add("lookupEmailsForPeople", {
            domain,
            companyName,
            runId,
            people,
            hunterApiKey,
        });

        logInfo("crustdataQueue.job", "Hunter lookup enqueued.", {
            jobId: job.id,
            runId,
            domain,
            companyName,
            peopleCount: people.length,
        });
    },
    {
        connection,
        limiter: {
            max: 15,
            duration: 60_000,
        },
    }
);

attachWorkerErrorLogging(worker, "crustdataQueue");
attachWorkerLifecycleLogging(worker, "crustdataQueue");
