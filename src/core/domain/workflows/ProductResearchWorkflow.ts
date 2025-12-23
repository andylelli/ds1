
export interface WorkflowStep {
    id: number;
    name: string;
    description: string;
    logPattern: string; // Regex or string to match in logs
}

export const ProductResearchWorkflow: WorkflowStep[] = [
    { id: 0, name: "Dependencies", description: "Loading Strategy Profile and Configs", logPattern: "Step 0" },
    { id: 1, name: "Request Intake", description: "Creating Research Brief & Normalizing Request", logPattern: "Step 1" },
    { id: 2, name: "Prior Knowledge", description: "Ingesting Past Learnings & Risk Adjustments", logPattern: "Step 2" },
    { id: 3, name: "Signal Discovery", description: "Collecting Multi-Source Signals (Search, Social, Competitor)", logPattern: "Step 3" },
    { id: 4, name: "Theme Generation", description: "Clustering Signals into Themes", logPattern: "Step 4" },
    { id: 5, name: "Gating", description: "Filtering by Risk & Strategy Constraints", logPattern: "Step 5" },
    { id: 6, name: "Scoring", description: "Ranking Themes by Demand, Trend, & Competition", logPattern: "Step 6" },
    { id: 7, name: "Time Fitness", description: "Checking Seasonality & Trend Shape", logPattern: "Step 7" },
    { id: 8, name: "Deep Validation", description: "Validating Top Candidates with AI", logPattern: "Step 8" },
    { id: 9, name: "Productization", description: "Creating Offer Concepts", logPattern: "Step 9" },
    { id: 10, name: "Brief Creation", description: "Finalizing Opportunity Briefs", logPattern: "Step 10" },
    { id: 11, name: "Handoff", description: "Triggering Supplier & Marketing Agents", logPattern: "Step 11" }
];
