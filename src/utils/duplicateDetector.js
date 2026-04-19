import Domain from "../db/models/domain.js";

export async function filterNewDomains(domains) {
    const existing = await Domain.find({
        domain: { $in: domains },
    }).select("domain");

    const existingSet = new Set(existing.map(d => d.domain));

    return domains.filter(d => !existingSet.has(d));
}