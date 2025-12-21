import 'dotenv/config';

console.log('AZURE_OPENAI_ENDPOINT:', process.env.AZURE_OPENAI_ENDPOINT);
console.log('AZURE_OPENAI_KEY:', process.env.AZURE_OPENAI_KEY ? '****' : 'MISSING');
console.log('SERPAPI_KEY:', process.env.SERPAPI_KEY ? '****' : 'MISSING');
console.log('META_ACCESS_TOKEN:', process.env.META_ACCESS_TOKEN ? '****' : 'MISSING');

