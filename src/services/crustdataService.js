import axios from "axios";
import { logError, logInfo } from "../utils/errorLogger.js";

const CRUSTDATA_PERSON_SEARCH_URL = "https://api.crustdata.com/person/search";
const CRUSTDATA_API_VERSION = "2025-11-01";
const FLEXIBLE_TITLE_REGEX =
    "\\b(founder|co\\s*[- ]?founder|chief\\s+[a-z]+\\s+officer|c[etpimrso]\\s*o|ceo|cto|cpo|cmo|cro|coo|cio|ciso|vp|v\\.?p\\.?|svp|evp|director|head\\s+of|principal|staff|partner|owner|president|managing\\s+director|general\\s+manager|engineering\\s+manager|product\\s+manager|research\\s+scientist|architect|tech\\s+lead|lead\\s+engineer|lead\\s+data\\s+scientist|head\\s+of\\s+(engineering|ai|ml|data|platform|infrastructure|security|product|research)|director\\s+of\\s+(engineering|ai|ml|data|platform|infrastructure|security|product|research)|vp\\s+of\\s+(engineering|ai|ml|data|platform|infrastructure|security|product|research))\\b";

const DEFAULT_IMPORTANT_TITLE_REGEX =
    process.env.CRUSTDATA_TITLE_REGEX || FLEXIBLE_TITLE_REGEX;

const COMPANY_ONLY_FALLBACK_MULTIPLIER = 5;

function splitName(fullName = "") {
    const parts = fullName
        .replace(/\s+/g, " ")
        .trim()
        .split(" ")
        .filter(Boolean);

    if (!parts.length) {
        return { firstName: "", lastName: "" };
    }

    return {
        firstName: parts[0],
        lastName: parts.length > 1 ? parts.slice(1).join(" ") : "",
    };
}

function getLinkedInHandle(profileUrl = "") {
    if (!profileUrl) return "";

    try {
        const url = new URL(profileUrl);
        const parts = url.pathname.split("/").filter(Boolean);
        const inIndex = parts.indexOf("in");

        if (inIndex !== -1 && parts[inIndex + 1]) {
            return parts[inIndex + 1];
        }

        return parts.at(-1) || "";
    } catch {
        return profileUrl.split("/").filter(Boolean).at(-1) || "";
    }
}

function normalizeCompanyName(companyName = "") {
    return companyName
        .toLowerCase()
        .replace(/\b(inc|llc|ltd|corp|co|technologies|technology|labs|ai|hq)\b/g, "")
        .replace(/[^a-z0-9]/g, "")
        .trim();
}

function companyNamesMatch(candidate = "", target = "") {
    const normalizedCandidate = normalizeCompanyName(candidate);
    const normalizedTarget = normalizeCompanyName(target);

    if (!normalizedCandidate || !normalizedTarget) return false;

    return (
        normalizedCandidate === normalizedTarget ||
        normalizedCandidate.includes(normalizedTarget) ||
        normalizedTarget.includes(normalizedCandidate)
    );
}

function isImportantTitle(title = "", titleRegex = DEFAULT_IMPORTANT_TITLE_REGEX) {
    if (!title) return false;

    try {
        return new RegExp(titleRegex, "i").test(title);
    } catch {
        return new RegExp(DEFAULT_IMPORTANT_TITLE_REGEX, "i").test(title);
    }
}

/**
 * Looks for the target company in both current and past roles.
 * Returns the matching role with an added isCurrent flag.
 *
 * NOTE — Crustdata has two different field names for company:
 *   Filter query uses:  "experience.employment_details.company_name"
 *   Response object has: role.name
 * These are intentionally different. Do not confuse them.
 */
function findEmploymentAtCompany(profile, companyName) {
    const current = profile.experience?.employment_details?.current || [];
    const past = profile.experience?.employment_details?.past || [];

    const currentMatch = current.find((role) =>
        companyNamesMatch(role?.name, companyName)
    );

    if (currentMatch) {
        return { ...currentMatch, isCurrent: true };
    }

    const pastMatch = past.find((role) =>
        companyNamesMatch(role?.name, companyName)
    );

    if (pastMatch) {
        return { ...pastMatch, isCurrent: false };
    }

    return null;
}

function normalizeCrustdataProfile(profile, companyName, titleRegex) {
    const fullName = profile.basic_profile?.name || "";
    const { firstName, lastName } = splitName(fullName);
    const linkedinUrl =
        profile.social_handles?.professional_network_identifier?.profile_url || "";

    const employment = findEmploymentAtCompany(profile, companyName);

    return {
        crustdataPersonId: profile.crustdata_person_id,
        fullName,
        firstName,
        lastName,
        linkedinUrl,
        linkedinHandle: getLinkedInHandle(linkedinUrl),
        title: employment?.title || "",
        companyName: employment?.name || "",
        currentAtTargetCompany: employment?.isCurrent ?? false,
        importantTitle: isImportantTitle(employment?.title, titleRegex),
        location: profile.basic_profile?.location?.full_location || "",
    };
}

function buildCrustdataFilters(companyName, titleRegex) {
    const conditions = [
        {
            field: "experience.employment_details.company_name",
            type: "in",
            value: [companyName],
        },
    ];

    if (titleRegex) {
        conditions.push({
            field: "experience.employment_details.title",
            type: "(.)",
            value: titleRegex,
        });
    }

    return {
        op: "and",
        conditions,
    };
}

async function searchCrustdataProfiles({
    companyName,
    apiKey,
    limit,
    titleRegex,
    searchMode,
}) {
    logInfo("crustdata.personSearch", "Calling Crustdata person search.", {
        companyName,
        limit,
        titleRegex,
        searchMode,
    });

    const response = await axios.post(
        CRUSTDATA_PERSON_SEARCH_URL,
        {
            filters: buildCrustdataFilters(companyName, titleRegex),
            limit,
        },
        {
            headers: {
                authorization: `Bearer ${apiKey}`,
                "content-type": "application/json",
                "x-api-version": CRUSTDATA_API_VERSION,
            },
        }
    );

    const profiles = response.data?.profiles || [];

    logInfo("crustdata.personSearch", "Crustdata person search completed.", {
        companyName,
        profilesCount: profiles.length,
        totalCount: response.data?.total_count,
        hasNextCursor: Boolean(response.data?.next_cursor),
        searchMode,
    });

    return profiles;
}

export async function findImportantPeopleByCompany(
    companyName,
    apiKey,
    { limit = 5, titleRegex = DEFAULT_IMPORTANT_TITLE_REGEX } = {}
) {
    if (!companyName) {
        throw new Error("Crustdata person search requires a companyName.");
    }

    if (!apiKey) {
        throw new Error("Crustdata person search requires CRUSTDATA_API_KEY.");
    }

    try {
        let profiles = await searchCrustdataProfiles({
            companyName,
            apiKey,
            limit,
            titleRegex,
        });

        if (!profiles.length) {
            logInfo("crustdata.personSearch", "Strict title search returned no profiles. Retrying company-only search.", {
                companyName,
                titleRegex,
            });

            profiles = await searchCrustdataProfiles({
                companyName,
                apiKey,
                limit: limit * COMPANY_ONLY_FALLBACK_MULTIPLIER,
                titleRegex: null,
                searchMode: "company_only_fallback",
            });
        }

        const people = profiles
            .map((profile) => normalizeCrustdataProfile(profile, companyName, titleRegex))
            .filter(
                (person) =>
                    person.importantTitle &&
                    person.fullName &&
                    (person.linkedinUrl || person.firstName)
            )
            .slice(0, limit);

        logInfo("crustdata.personSearch", "Crustdata profiles normalized.", {
            companyName,
            rawProfilesCount: profiles.length,
            peopleCount: people.length,
        });

        return people;
    } catch (error) {
        logError("crustdata.personSearch", error, {
            companyName,
            limit,
            titleRegex,
        });
        return [];
    }
}