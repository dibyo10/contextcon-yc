import {Agent} from '@openai/agents';
import {z} from 'zod';
import MyResume from '../constants/myResumeDescription.js'
import ScoringAgentPrompt from '../constants/prompts/scoringAgentPrompt.js'

const outputSchema = z.object({
    score: z.number(),
    reason: z.string(),
    decision: z.enum(["ACCEPT", "REJECT"])
})

const ScoringAgent = new Agent({
    name:"Scoring Agent",
    instructions: ScoringAgentPrompt + MyResume,
    outputType : outputSchema
})

export default ScoringAgent;
