import { BigQuery } from "@google-cloud/bigquery";

const PROJECT_ID = process.env.GCP_PROJECT_ID;
const JOB_LOCATION = process.env.BQ_LOCATION || "US";

if (!PROJECT_ID) {
  // Warn but don't crash immediately on import, allows for graceful failure in non-live modes
  console.warn("Missing env var GCP_PROJECT_ID. BigQuery operations will fail.");
}

export const bigquery = new BigQuery({
  projectId: PROJECT_ID,
  // Auth will use GOOGLE_APPLICATION_CREDENTIALS automatically if set.
});

export async function runQuery<T = any>(
  query: string,
  params: Record<string, any> = {}
): Promise<T[]> {
  if (!PROJECT_ID) {
      throw new Error("GCP_PROJECT_ID is not set.");
  }
  
  const options = {
    query,
    location: JOB_LOCATION,
    params,
  };

  try {
    const [job] = await bigquery.createQueryJob(options);
    const [rows] = await job.getQueryResults();
    return rows as T[];
  } catch (error) {
    console.error("BigQuery Query Failed:", error);
    throw error;
  }
}
