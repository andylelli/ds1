import { BigQuery } from "@google-cloud/bigquery";
let bigqueryInstance = null;
function getBigQueryClient() {
    if (bigqueryInstance)
        return bigqueryInstance;
    const PROJECT_ID = process.env.GCP_PROJECT_ID;
    if (!PROJECT_ID) {
        console.warn("Missing env var GCP_PROJECT_ID. BigQuery operations will fail.");
    }
    bigqueryInstance = new BigQuery({
        projectId: PROJECT_ID,
        // Auth will use GOOGLE_APPLICATION_CREDENTIALS automatically if set.
    });
    return bigqueryInstance;
}
export async function runQuery(query, params = {}) {
    const PROJECT_ID = process.env.GCP_PROJECT_ID;
    const JOB_LOCATION = process.env.BQ_LOCATION || "US";
    if (!PROJECT_ID) {
        throw new Error("GCP_PROJECT_ID is not set in your .env file. This is required to bill the compute for BigQuery (even for public datasets).");
    }
    const options = {
        query,
        location: JOB_LOCATION,
        params,
    };
    try {
        const client = getBigQueryClient();
        const [job] = await client.createQueryJob(options);
        const [rows] = await job.getQueryResults();
        return rows;
    }
    catch (error) {
        console.error("BigQuery Query Failed:", error);
        throw error;
    }
}
