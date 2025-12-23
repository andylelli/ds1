import util from 'util';
const _SHOW_DEBUG_ENV = process.env.DEBUG_ENV === 'true';
function _mask(v) {
    if (!v)
        return '<unset>';
    if (v.length <= 8)
        return '****';
    return `${v.slice(0, 4)}...${v.slice(-4)}`;
}
if (_SHOW_DEBUG_ENV) {
    // Only print endpoint (safe) and a simple module-loaded marker. Never print the client
    console.log('OpenAIService ENV (endpoint):', process.env.AZURE_OPENAI_ENDPOINT);
    console.log('[OpenAIService] Module loaded (masked output)');
}
import { AzureOpenAI } from "openai";
import { DefaultAzureCredential, getBearerTokenProvider } from "@azure/identity";
import { PROMPT_THEME_CLUSTERING, PROMPT_DEEP_VALIDATION, PROMPT_CONCEPT_GENERATION } from "../../../core/prompts.js";
export class OpenAIService {
    client = null;
    deploymentName;
    constructor() {
        this.deploymentName = process.env.AZURE_OPENAI_DEPLOYMENT_NAME || "gpt-4o";
    }
    async generateThemes(signals) {
        const client = this.getClient();
        // Limit signals to avoid token limits if necessary, or just pass them all
        // For now, we assume the list isn't massive.
        const prompt = PROMPT_THEME_CLUSTERING + "\n\nSIGNALS:\n" + JSON.stringify(signals, null, 2);
        try {
            const completion = await client.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: this.deploymentName,
                response_format: { type: "json_object" },
                temperature: 0.7,
            });
            const content = completion.choices[0].message.content;
            if (!content)
                return [];
            const result = JSON.parse(content);
            return result.themes || [];
        }
        catch (error) {
            console.error("Error generating themes:", error);
            return [];
        }
    }
    async validateTheme(theme) {
        const client = this.getClient();
        const prompt = PROMPT_DEEP_VALIDATION + "\n\nTHEME:\n" + JSON.stringify({
            name: theme.name,
            description: theme.description,
            rationale: theme.rationale
        }, null, 2);
        try {
            const completion = await client.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: this.deploymentName,
                response_format: { type: "json_object" },
                temperature: 0.7,
            });
            const content = completion.choices[0].message.content;
            if (!content)
                return null;
            return JSON.parse(content);
        }
        catch (error) {
            console.error("Error validating theme:", error);
            return null;
        }
    }
    async generateConcept(theme, validationData) {
        const client = this.getClient();
        const prompt = PROMPT_CONCEPT_GENERATION + "\n\nTHEME:\n" + JSON.stringify({
            name: theme.name,
            description: theme.description
        }, null, 2) + "\n\nVALIDATION DATA:\n" + JSON.stringify(validationData, null, 2);
        try {
            const completion = await client.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: this.deploymentName,
                response_format: { type: "json_object" },
                temperature: 0.7,
            });
            const content = completion.choices[0].message.content;
            if (!content)
                return null;
            return JSON.parse(content);
        }
        catch (error) {
            console.error("Error generating concept:", error);
            return null;
        }
    }
    getClient() {
        if (!this.client) {
            this.client = this.createClient();
        }
        return this.client;
    }
    createClient() {
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
                    content.split(/\r?\n/).forEach((line) => {
                        const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*)\s*$/);
                        if (m) {
                            const k = m[1];
                            let v = m[2] || '';
                            // Strip surrounding quotes
                            if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
                                v = v.slice(1, -1);
                            }
                            if (k === 'AZURE_OPENAI_ENDPOINT' && !endpoint)
                                endpoint = v;
                            if (k === 'AZURE_OPENAI_KEY' && !apiKey)
                                apiKey = v;
                        }
                    });
                }
            }
            catch (err) {
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
                apiVersion: "2024-05-01-preview",
                timeout: 30000 // 30 seconds timeout
            });
        }
        const credential = new DefaultAzureCredential();
        const scope = "https://cognitiveservices.azure.com/.default";
        const azureADTokenProvider = getBearerTokenProvider(credential, scope);
        return new AzureOpenAI({
            endpoint,
            azureADTokenProvider,
            apiVersion: "2024-05-01-preview",
            timeout: 30000 // 30 seconds timeout
        });
    }
}
export const openAIService = new OpenAIService();
// Protect against accidental inspection/logging of the internal client which may contain secrets.
// Node's util.inspect uses the special Symbol, so provide a safe override.
openAIService[util.inspect.custom] = function (depth, opts) {
    try {
        const c = this.client;
        const baseURL = c && c._options && c._options.baseURL ? c._options.baseURL : '<unset>';
        return `<OpenAIService deployment=${this.deploymentName} baseURL=${baseURL}>`;
    }
    catch (e) {
        return `<OpenAIService deployment=${this.deploymentName}>`;
    }
};
// Ensure JSON serialization doesn't leak client internals
openAIService.toJSON = function () {
    return { deploymentName: this.deploymentName };
};
