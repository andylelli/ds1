import { Order } from '../types/Order.js';

export interface ProblemEvent {
    id: string;
    orderId: string;
    type: string;
    description: string;
    agent: string;
    customer: string;
}

const PROBLEM_TYPES = [
    {
        type: 'LOST_PACKAGE',
        description: 'Customer claims package never arrived despite tracking saying delivered.',
        probability: 0.25,
        agent: 'Operations'
    },
    {
        type: 'PRODUCT_DEFECT',
        description: 'Product arrived broken or not working.',
        probability: 0.15,
        agent: 'CustomerService'
    },
    {
        type: 'SHIPPING_DELAY',
        description: 'Tracking has not updated in 10 days. Customer is angry.',
        probability: 0.30,
        agent: 'CustomerService'
    },
    {
        type: 'REFUND_REQUEST',
        description: 'Customer changed mind and wants to return the item.',
        probability: 0.20,
        agent: 'CustomerService'
    }
];

export function generateProblemEvents(orders: Order[]): ProblemEvent[] {
    const problems: ProblemEvent[] = [];

    orders.forEach(order => {
        // Roll for a problem
        const rand = Math.random();
        let cumulativeProb = 0;

        for (const problem of PROBLEM_TYPES) {
            cumulativeProb += problem.probability;
            if (rand < cumulativeProb) {
                // Problem occurred!
                problems.push({
                    id: `TICKET-${Math.floor(Math.random() * 90000) + 10000}`,
                    orderId: order.id,
                    type: problem.type,
                    description: problem.description,
                    agent: problem.agent,
                    customer: `Customer_${order.id.split('-')[1] || 'Unknown'}`
                });
                break; // Only one problem per order for simplicity
            }
        }
    });

    return problems;
}
