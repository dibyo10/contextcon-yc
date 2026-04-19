const founderKeywords = [
    "founder",
    "co-founder",
    "ceo",
    "cto",
    "owner",
    "director",
    "founding",
    "chief technology"
];

const negativeKeywords = [
    "intern",
    "marketing",
    "sales",
    "assistant",
];

export function isFounderRole(position = "") {
    const pos = position.toLowerCase();

    const positive = founderKeywords.some((k) => pos.includes(k));
    const negative = negativeKeywords.some((k) => pos.includes(k));

    return positive && !negative;
}