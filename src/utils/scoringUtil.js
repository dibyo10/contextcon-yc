export function shouldAcceptLead(result) {
    return result.score >= 0.65 && result.decision === "ACCEPT";
}