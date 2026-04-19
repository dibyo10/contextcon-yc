const ResearchPrompt = `You are given a company domain.

Your job is to extract structured signals about the company.

Return:
- category (AI, fintech, devtools, SaaS, etc.)
- whether the company is technical (engineering-heavy)
- company stage (early/mid/large/unknown)
- hiring signal (yes/no/unknown)
- confidence (0 to 1)

Rules:
- Be concise and structured
- If unsure, return "unknown"
- Do NOT guess aggressively
- Prefer conservative outputs`

export default ResearchPrompt;