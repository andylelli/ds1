import { logger } from '../../infra/logging/LoggerService.js';
export class WorkflowManager {
    eventBus;
    config;
    agentLookup;
    constructor(eventBus, config, agentLookup) {
        this.eventBus = eventBus;
        this.config = config;
        this.agentLookup = agentLookup;
    }
    registerSubscriptions() {
        if (!this.config.subscriptions) {
            logger.warn('No subscriptions found in workflow config.');
            return;
        }
        for (const sub of this.config.subscriptions) {
            logger.info(`Wiring: ${sub.event} -> ${sub.subscriber}.${sub.action}`);
            this.eventBus.subscribe(sub.event, sub.subscriber, async (payload) => {
                const agent = this.agentLookup(sub.subscriber);
                if (!agent) {
                    logger.error(`Workflow Error: Subscriber '${sub.subscriber}' not found for event '${sub.event}'`);
                    return;
                }
                // 1. Try specific method
                if (typeof agent[sub.action] === 'function') {
                    try {
                        logger.info(`Executing ${sub.subscriber}.${sub.action} for event ${sub.event}`);
                        await agent[sub.action](payload);
                    }
                    catch (error) {
                        logger.error(`Error executing ${sub.subscriber}.${sub.action}: ${error.message}`);
                    }
                }
                // 2. Try generic handleEvent
                else if (typeof agent.handleEvent === 'function') {
                    try {
                        logger.info(`Delegating ${sub.event} to ${sub.subscriber}.handleEvent('${sub.action}')`);
                        await agent.handleEvent(sub.event, sub.action, payload);
                    }
                    catch (error) {
                        logger.error(`Error in ${sub.subscriber}.handleEvent: ${error.message}`);
                    }
                }
                else {
                    logger.warn(`Agent '${sub.subscriber}' has no method '${sub.action}' and no 'handleEvent' method.`);
                }
            });
        }
    }
}
