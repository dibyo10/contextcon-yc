import {Agent} from '@openai/agents';
import {z} from 'zod';
import emailAgentPrompt from '../constants/prompts/emailAgentPrompt.js';

const outputSchema = z.object({
    subject: z.string(),
    body: z.string()
})

const EmailAgent = new Agent({
    name:"Email Agent",
    instructions: emailAgentPrompt,
    outputType: outputSchema,
})

export default EmailAgent;
