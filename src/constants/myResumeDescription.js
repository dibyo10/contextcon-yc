const MyResume = `
Identity:
I am Dibyo Chakraborty, a backend and AI systems engineer focused on building production-grade LLM systems under real-world constraints. I care about correctness, reliability, and observability over flashy demos.

Education:
- BSc Computer Science (2024–2028), BITS Pilani
- CGPA: 9.3/10 :contentReference[oaicite:0]{index=0}

Current Role:
Software Engineer Intern at Neeto (BigBinary) (Feb 2026 – Present, Remote)
- Working in a large Ruby on Rails monolith with React frontend
- Shipping production features in an opinionated, convention-driven codebase
- Designing REST APIs and backend logic with strong emphasis on maintainability
- Optimizing PostgreSQL queries and enforcing data integrity constraints :contentReference[oaicite:1]{index=1}

Previous Experience:
Founding AI Engineer Intern at HandaUncle (Nov 2025 – Jan 2026)
- Took product from 0 → 1, scaling to 2k+ daily active users .
- Built chat.handauncle.com: multi-agent LLM system handling 10k+ real user conversations.

Key System Contributions:
- Designed multi-agent architecture with tool-grounded reasoning
- Enforced correctness via deterministic tools (calculator, retrieval, web search)
- Reduced calculation errors by 90% using tool-based execution :contentReference[oaicite:4]{index=4}
- Built LLM failure detection pipeline:
  - RoBERTa-based sentiment analysis for dissatisfaction detection
  - Embedding-based clustering (DBSCAN) for failure pattern discovery
- Improved debugging velocity by identifying recurring failure modes automatically
- Eliminated N+1 queries in MongoDB using batching + indexing:
  - Reduced DB calls by 65%
  - Reduced latency by 60% under concurrent load :contentReference[oaicite:5]{index=5}

Projects:
Cold Outreach Agent (multi-agent system)
- Separate agents for discovery, research, and messaging
- Deterministic orchestrator for agent control flow
- Rejection-heavy scoring pipeline for lead qualification
- Distributed execution using BullMQ (Redis-backed queue) with workers
- Designed for rate-limited APIs and scalable outbound workflows :contentReference[oaicite:6]{index=6}

Core Technical Strengths:
- Backend systems: Go, Python, TypeScript
- API design: REST, gRPC
- Concurrency and distributed systems (worker queues, async pipelines)
- Databases: PostgreSQL, MongoDB, Neo4j
- Vector DBs: Pinecone, FAISS, Qdrant
- LLM systems:
  - RAG pipelines
  - tool-calling agents
  - LangChain / LangGraph / MCP
  - embeddings + retrieval systems
- ML fundamentals:
  - classical models (SVM, trees, boosting)
  - neural networks, LSTMs, transformers

Infrastructure & Tooling:
- Redis, BullMQ
- Docker
- AWS, GCP
- HuggingFace ecosystem

Achievements:
- Google BigCode Prelims: Top 15,000 / 400,000+
- Meta × HuggingFace Hackathon: Rank 158 / 15,000+ :contentReference[oaicite:7]{index=7}

Engineering Philosophy:
- I prioritize correctness over raw model output
- I design systems with explicit failure detection and monitoring
- I avoid prompt-only solutions in favor of tool-grounded execution
- I care about regression safety, observability, and production reliability

Positioning:
I am best suited for:
- Backend-heavy roles
- AI infrastructure / LLM systems engineering
- Systems where reliability, scale, and correctness matter

I am NOT a frontend-heavy or purely UI-focused engineer.

Communication Guidelines for Outreach Agent:
- Be specific and evidence-driven (use metrics, scale, and concrete systems)
- Avoid generic phrases like "passionate" or "hardworking"
- Emphasize production experience, not just projects
- Highlight 0→1 ownership and real user impact
- Tailor messaging based on company (infra vs AI vs product)
- Prefer sharp, concise, high-signal writing over long paragraphs
`;
export default MyResume;