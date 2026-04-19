import axios from "axios";
import { isFounderRole } from "../utils/roleFilter.js";
import emailSchema from "../utils/emailSchema.js";
import { logError, logInfo } from "../utils/errorLogger.js";

const HUNTER_BASE_URL = "https://api.hunter.io/v2";

function isValidEmail(email) {
    return emailSchema.safeParse(email).success;
}

async function FinHunterEmails(domain, apiKey) {
    try {
        logInfo("hunter.domainSearch", "Calling Hunter domain search.", { domain });
        const response = await axios.get(
            `${HUNTER_BASE_URL}/domain-search`,
            {
                params: { domain, api_key: apiKey },
            }
        );

        const emails = response.data.data.emails || [];
        logInfo("hunter.domainSearch", "Hunter domain search completed.", {
            domain,
            rawEmailsCount: emails.length,
        });

        return emails.filter((email) => {
                if (!email.value) return false;
                const isValid = emailSchema.safeParse(email.value).success;

                if (!isValid) return false;

                return (
                    email.confidence > 70 && isFounderRole(email.position)
                );
            })
            .map((email) => ({
                email: email.value,
                confidence: email.confidence,
                position: email.position,
            }));

    } catch (error) {
        logError("hunter.domainSearch", error, { domain });
        return [];
    }
}

export async function findHunterEmailForPerson(person, apiKey, { domain, companyName } = {}) {
    if (!apiKey) {
        throw new Error("Hunter Email Finder requires HUNTER_API_KEY.");
    }

    const hasName = Boolean(
        (person.firstName && person.lastName) || person.fullName
    );

    if (!domain && !companyName && !person.linkedinHandle) {
        return null;
    }

    if (!hasName && !person.linkedinHandle) {
        return null;
    }

    try {
        logInfo("hunter.emailFinder", "Calling Hunter email finder.", {
            domain,
            companyName,
            person: {
                fullName: person.fullName,
                firstName: person.firstName,
                lastName: person.lastName,
                linkedinHandle: person.linkedinHandle,
            },
        });

        const params = {
            api_key: apiKey,
            max_duration: 10,
        };

        if (domain) params.domain = domain;
        if (!domain && companyName) params.company = companyName;

        if (person.firstName && person.lastName) {
            params.first_name = person.firstName;
            params.last_name = person.lastName;
        } else if (person.fullName) {
            params.full_name = person.fullName;
        }

        if (person.linkedinHandle) {
            params.linkedin_handle = person.linkedinHandle;
        }

        const response = await axios.get(`${HUNTER_BASE_URL}/email-finder`, {
            params,
        });

        const result = response.data?.data;

        if (!result?.email || !isValidEmail(result.email)) {
            logInfo("hunter.emailFinder", "Hunter email finder returned no valid email.", {
                domain,
                companyName,
                fullName: person.fullName,
            });
            return null;
        }

        logInfo("hunter.emailFinder", "Hunter email finder found email.", {
            domain,
            companyName,
            fullName: person.fullName,
            confidence: result.score || 0,
        });

        return {
            email: result.email,
            confidence: result.score || 0,
            position: result.position || person.title,
            firstName: result.first_name || person.firstName,
            lastName: result.last_name || person.lastName,
            fullName: person.fullName,
            linkedinUrl: result.linkedin_url || person.linkedinUrl,
            source: "hunter_email_finder",
        };
    } catch (error) {
        logError("hunter.emailFinder", error, {
            domain,
            companyName,
            person: {
                fullName: person.fullName,
                firstName: person.firstName,
                lastName: person.lastName,
                linkedinHandle: person.linkedinHandle,
            },
        });
        return null;
    }
}

export async function findHunterEmailsForPeople({
    people,
    apiKey,
    domain,
    companyName,
    minConfidence = 70,
}) {
    const emails = [];
    logInfo("hunter.emailFinder", "Starting Hunter email lookup for people.", {
        domain,
        companyName,
        peopleCount: people.length,
        minConfidence,
    });

    for (const person of people) {
        const result = await findHunterEmailForPerson(person, apiKey, {
            domain,
            companyName,
        });

        if (result && result.confidence >= minConfidence) {
            emails.push(result);
        }
    }

    logInfo("hunter.emailFinder", "Hunter email lookup for people completed.", {
        domain,
        companyName,
        emailsCount: emails.length,
    });

    return emails;
}

export default FinHunterEmails;
