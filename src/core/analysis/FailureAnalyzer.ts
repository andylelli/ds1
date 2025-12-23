
export interface FailureAnalysis {
    rootCause: string;
    details: string;
    recommendation: string;
}

export class FailureAnalyzer {
    static analyze(logs: any[]): FailureAnalysis | null {
        // Look for failed status or error level logs
        // Also check for 'Error' action which we used in the test script
        const errorLogs = logs.filter(l => 
            l.status === 'failed' || 
            l.level === 'error' || 
            l.action === 'Pipeline Failed' ||
            l.action === 'Error'
        );
        
        if (errorLogs.length === 0) return null;

        // Analyze the most recent error
        const lastError = errorLogs[errorLogs.length - 1];
        const msg = (lastError.message || lastError.details?.error || JSON.stringify(lastError)).toLowerCase();

        // 1. Rate Limits
        if (msg.includes('ratelimit') || msg.includes('429') || msg.includes('quota')) {
            return {
                rootCause: "API Rate Limit Exceeded",
                details: "We hit a limit with one of our external data providers (likely OpenAI or Google Trends).",
                recommendation: "Wait for the quota to reset (usually 1-2 minutes) and try again."
            };
        }

        // 2. No Signals
        if (msg.includes('no signals collected') || msg.includes('no data found')) {
            return {
                rootCause: "Insufficient Market Data",
                details: "The research agents could not find enough valid signals (trends, competitors) to form a conclusion.",
                recommendation: "Try a broader category name or different keywords."
            };
        }

        // 3. Alignment
        if (msg.includes('aligned poorly') || msg.includes('strategy')) {
            return {
                rootCause: "Strategic Misalignment",
                details: "The product idea was rejected because it conflicts with our current Strategy Profile.",
                recommendation: "Review the Strategy Profile and propose products that fit our brand."
            };
        }

        // 4. Dependencies
        if (msg.includes('dependencies') || msg.includes('module')) {
            return {
                rootCause: "System Dependency Failure",
                details: "A required internal component failed to load.",
                recommendation: "Check system health and restart the application."
            };
        }

        // Default
        return {
            rootCause: "Unexpected System Error",
            details: `The pipeline encountered an error: "${lastError.message}"`,
            recommendation: "Check the technical logs for a stack trace."
        };
    }
}
