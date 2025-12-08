const _SHOW_DEBUG_ENV = process.env.DEBUG_ENV === 'true';
function _mask(v?: string) {
  if (!v) return '<unset>';
  if (v.length <= 8) return '****';
  return `${v.slice(0, 4)}...${v.slice(-4)}`;
}
if (_SHOW_DEBUG_ENV) {
  console.log('OpenAIService ENV:', process.env.AZURE_OPENAI_ENDPOINT);
  console.log('[OpenAIService] Module loaded');
}
import { AzureOpenAI } from "openai";
import { DefaultAzureCredential, getBearerTokenProvider } from "@azure/identity";

export class OpenAIService {
  private client: AzureOpenAI | null = null;
  public deploymentName: string;

  constructor() {
    this.deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o";
  }

  public getClient(): AzureOpenAI {
    if (!this.client) {
      this.client = this.createClient();
    }
    return this.client;
  }

  private createClient(): AzureOpenAI {
    let endpoint = process.env.AZURE_OPENAI_ENDPOINT;
    let apiKey = process.env.AZURE_OPENAI_KEY;

    // Do not hardcode credentials or endpoints here. Prefer env vars or Azure AD.

    // Fallback: try to read .env file directly if variables are missing
    if (!endpoint || !apiKey) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const fs = require('fs');
        const envPath = require('path').resolve(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
          const content = fs.readFileSync(envPath, 'utf8');
          content.split(/\r?\n/).forEach((line: string) => {
            const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
            if (m) {
              const k = m[1];
              let v = m[2] || '';
              // Strip surrounding quotes
              if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
                v = v.slice(1, -1);
              }
              if (k === 'AZURE_OPENAI_ENDPOINT' && !endpoint) endpoint = v;
              if (k === 'AZURE_OPENAI_KEY' && !apiKey) apiKey = v;
            }
          });
        }
      } catch (err) {
        // ignore
      }
    }

    // DEBUG: print both env and resolved values (gated)
    if (_SHOW_DEBUG_ENV) {
      console.log('[OpenAIService] createClient() process.env.AZURE_OPENAI_ENDPOINT=', process.env.AZURE_OPENAI_ENDPOINT);
      console.log('[OpenAIService] createClient() endpoint variable=', endpoint);
    }

    if (!endpoint) {
      console.error('[OpenAIService] AZURE_OPENAI_ENDPOINT is not set!');
      throw new Error("AZURE_OPENAI_ENDPOINT is not set");
    }

    if (apiKey) {
      return new AzureOpenAI({
        endpoint,
        apiKey: apiKey,
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
