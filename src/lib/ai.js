import { AzureOpenAI } from "openai";
import { DefaultAzureCredential, getBearerTokenProvider } from "@azure/identity";

// Helper to get the OpenAI client
// Supports both Key-based (dev) and Managed Identity (prod)
export function getOpenAIClient() {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  
  if (!endpoint) {
    throw new Error("AZURE_OPENAI_ENDPOINT is not set");
  }

  // Option 1: API Key (Good for local dev)
  if (process.env.AZURE_OPENAI_KEY) {
    return new AzureOpenAI({ 
      endpoint, 
      apiKey: process.env.AZURE_OPENAI_KEY, 
      apiVersion: "2024-05-01-preview" 
    });
  }

  // Option 2: Managed Identity (Best for Azure Container Apps)
  const credential = new DefaultAzureCredential();
  const scope = "https://cognitiveservices.azure.com/.default";
  const azureADTokenProvider = getBearerTokenProvider(credential, scope);
  
  return new AzureOpenAI({ 
    endpoint, 
    azureADTokenProvider, 
    apiVersion: "2024-05-01-preview" 
  });
}

export const DEPLOYMENT_NAME = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o";
