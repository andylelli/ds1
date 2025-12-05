import { AzureOpenAI } from "openai";
import { DefaultAzureCredential, getBearerTokenProvider } from "@azure/identity";
export class OpenAIService {
    client = null;
    deploymentName;
    constructor() {
        this.deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o";
    }
    getClient() {
        if (!this.client) {
            this.client = this.createClient();
        }
        return this.client;
    }
    createClient() {
        const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
        if (!endpoint) {
            throw new Error("AZURE_OPENAI_ENDPOINT is not set");
        }
        if (process.env.AZURE_OPENAI_KEY) {
            return new AzureOpenAI({
                endpoint,
                apiKey: process.env.AZURE_OPENAI_KEY,
                apiVersion: "2024-05-01-preview"
            });
        }
        const credential = new DefaultAzureCredential();
        const scope = "https://cognitiveservices.azure.com/.default";
        const azureADTokenProvider = getBearerTokenProvider(credential, scope);
        return new AzureOpenAI({
            endpoint,
            azureADTokenProvider,
            apiVersion: "2024-05-01-preview"
        });
    }
}
export const openAIService = new OpenAIService();
