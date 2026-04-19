const MyResume = `
I am an AI systems engineer focused on building reliable, production-grade LLM applications, not just prototypes.

I specialize in designing agentic systems where correctness, observability, and failure detection matter more than raw model output. My work emphasizes deterministic safeguards, tool-grounded reasoning, and regression-safe architectures over prompt-only solutions.

I have built and operated real-world LLM systems with live users, including a personal finance chatbot that handled 10,000+ conversations. In that system, I enforced correctness through tool usage (web search, calculators, retrieval), preventing hallucinated or stale outputs.

I also designed an LLM quality monitoring and failure analysis pipeline that detects:
- incorrect calculations
- hallucinations
- tool misuse
- user frustration signals

This included:
- RoBERTa-based sentiment analysis with caching for low-latency inference
- embedding-based clustering to identify recurring failure patterns
- dashboards to track failure rates and regressions over time

On the backend side, I am strong in building scalable and predictable systems. I have optimized database access patterns (batching, caching, indexing), eliminated N+1 queries, and handled concurrent traffic in production environments.

Currently, I work as a Software Engineer Intern at Neeto (BigBinary), where I build production applications using Ruby on Rails and React in a large, opinionated codebase, focusing on clean abstractions, maintainability, and shipping regression-safe features.

My core strengths:
- backend and systems engineering (Go, Python, Node.js, SQL)
- LLM systems (RAG, tool-calling, agent control flow)
- reliability engineering (monitoring, failure detection, evaluation)
- building real-world systems with actual users, not just demos

I am best suited for roles involving backend systems, AI infrastructure, or LLM-powered applications where correctness and system design matter.
`;

export default MyResume;