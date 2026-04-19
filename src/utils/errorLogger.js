function serializeError(error) {
    if (!error) {
        return {};
    }

    return {
        name: error.name,
        message: error.message,
        stack: error.stack,
        status: error.response?.status,
        responseData: error.response?.data,
        code: error.code,
    };
}

function shouldRedactKey(key = "") {
    return /api[_-]?key|token|authorization|password|secret|credential/i.test(key);
}

function redactValue(value) {
    if (Array.isArray(value)) {
        return value.map(redactValue);
    }

    if (value && typeof value === "object") {
        return Object.fromEntries(
            Object.entries(value).map(([key, nestedValue]) => [
                key,
                shouldRedactKey(key) ? "[REDACTED]" : redactValue(nestedValue),
            ])
        );
    }

    return value;
}

function safeContext(context = {}) {
    return Object.fromEntries(
        Object.entries(context)
            .filter(([, value]) => value !== undefined)
            .map(([key, value]) => [
                key,
                shouldRedactKey(key) ? "[REDACTED]" : redactValue(value),
            ])
    );
}

export function logError(scope, error, context = {}) {
    const payload = {
        level: "error",
        timestamp: new Date().toISOString(),
        scope,
        ...safeContext(context),
        error: serializeError(error),
    };

    console.error(JSON.stringify(payload, null, 2));
}

export function logInfo(scope, message, context = {}) {
    const payload = {
        level: "info",
        timestamp: new Date().toISOString(),
        scope,
        message,
        ...safeContext(context),
    };

    console.log(JSON.stringify(payload, null, 2));
}

export function logWorkerError(workerName, job, error, context = {}) {
    logError(`${workerName}.job`, error, {
        queue: workerName,
        jobId: job?.id,
        jobName: job?.name,
        attemptsMade: job?.attemptsMade,
        data: job?.data,
        ...context,
    });
}

export function attachWorkerErrorLogging(worker, workerName) {
    worker.on("failed", (job, error) => {
        logWorkerError(workerName, job, error);
    });

    worker.on("error", (error) => {
        logError(`${workerName}.worker`, error);
    });
}

export function attachWorkerLifecycleLogging(worker, workerName) {
    worker.on("ready", () => {
        logInfo(`${workerName}.worker`, "Worker ready.");
    });

    worker.on("active", (job) => {
        logInfo(`${workerName}.job`, "Job started.", {
            jobId: job?.id,
            jobName: job?.name,
            data: job?.data,
        });
    });

    worker.on("completed", (job) => {
        logInfo(`${workerName}.job`, "Job completed.", {
            jobId: job?.id,
            jobName: job?.name,
        });
    });
}
