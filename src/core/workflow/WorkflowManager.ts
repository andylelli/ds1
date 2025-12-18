import { EventBusPort } from '../domain/ports/EventBusPort.js';
import { WorkflowsConfig } from '../bootstrap/ConfigTypes.js';
import { logger } from '../../infra/logging/LoggerService.js';

export class WorkflowManager {
    constructor(
        private eventBus: EventBusPort,
        private config: WorkflowsConfig,
        private agentLookup: (id: string) => any
    ) {}

    public registerSubscriptions() {
        if (!this.config.subscriptions) {
            logger.warn('No subscriptions found in workflow config.');
            return;
        }

        for (const sub of this.config.subscriptions) {
            logger.info(`Wiring: ${sub.event} -> ${sub.subscriber}.${sub.action}`);
            
            this.eventBus.subscribe(sub.event as any, sub.subscriber, async (event: any) => {
                const agent = this.agentLookup(sub.subscriber);
                if (!agent) {
                    logger.error(`Workflow Error: Subscriber '${sub.subscriber}' not found for event '${sub.event}'`);
                    return;
                }

                // 1. Try specific method
                if (typeof agent[sub.action] === 'function') {
                    try {
                        logger.info(`Executing ${sub.subscriber}.${sub.action} for event ${sub.event}`);
                        await agent[sub.action](event.payload);
                    } catch (error: any) {
                        logger.error(`Error executing ${sub.subscriber}.${sub.action}: ${error.message}`);
                    }
                } 
                // 2. Try generic handleEvent
                else if (typeof agent.handleEvent === 'function') {
                     try {
                        logger.info(`Delegating ${sub.event} to ${sub.subscriber}.handleEvent('${sub.action}')`);
                        await agent.handleEvent(sub.event, sub.action, event.payload);
                     } catch (error: any) {
                        logger.error(`Error in ${sub.subscriber}.handleEvent: ${error.message}`);
                     }
                } else {
                    logger.warn(`Agent '${sub.subscriber}' has no method '${sub.action}' and no 'handleEvent' method.`);
                }
            });
        }
    }
}
