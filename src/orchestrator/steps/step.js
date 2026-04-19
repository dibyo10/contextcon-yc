/**
 * Abstract base class for all pipeline steps.
 * Every step receives a mutable PipelineContext and returns it.
 * Steps must not depend on each other directly — only on context.
 */
export class Step {
    /**
     * @param {string} name - Human-readable step name for logging
     */
    constructor(name) {
        if (new.target === Step) {
            throw new Error("Step is abstract and cannot be instantiated directly.");
        }
        this.name = name;
    }

    /**
     * Execute this step.
     * @param {import('../pipelineContext.js').PipelineContext} context
     * @returns {Promise<import('../pipelineContext.js').PipelineContext>}
     */
    async run(context) {
        throw new Error(`Step "${this.name}" must implement run(context).`);
    }
}