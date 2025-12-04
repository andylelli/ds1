
/**
 * Problem Event Generator
 * 
 * Simulates post-purchase issues like refunds, lost packages, and complaints.
 * These events trigger the Customer Service and Operations agents.
 */

const PROBLEM_TYPES = [
    {
        type: 'LOST_PACKAGE',
        description: 'Customer claims package never arrived despite tracking saying delivered.',
        probability: 0.05, // 5% chance
        agent: 'Operations'
    },
    {
        type: 'PRODUCT_DEFECT',
        description: 'Product arrived broken or not working.',
        probability: 0.03, // 3% chance
        agent: 'CustomerService'
    },
    {
        type: 'SHIPPING_DELAY',
        description: 'Tracking has not updated in 10 days. Customer is angry.',
        probability: 0.08, // 8% chance
        agent: 'CustomerService'
    },
    {
        type: 'REFUND_REQUEST',
        description: 'Customer changed mind and wants to return the item.',
        probability: 0.04, // 4% chance
        agent: 'CustomerService'
    }
];

/**
 * Generates problems for a batch of orders.
 * @param {Array} orders - List of orders from the current simulation run.
 * @returns {Array} - List of problem events.
 */
export function generateProblemEvents(orders) {
    const problems = [];

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
                    customer: `Customer_${order.id.split('-')[1]}` // Mock customer name
                });
                break; // Only one problem per order for simplicity
            }
        }
    });

    return problems;
}
