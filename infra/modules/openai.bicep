param location string
param suffix string

resource openai 'Microsoft.CognitiveServices/accounts@2023-05-01' = {
  name: 'openai-${suffix}'
  location: location
  kind: 'OpenAI'
  sku: {
    name: 'S0'
  }
  properties: {
    customSubDomainName: 'openai-${suffix}'
  }
}

resource gptDeployment 'Microsoft.CognitiveServices/accounts/deployments@2023-05-01' = {
  parent: openai
  name: 'gpt-4o'
  sku: {
    name: 'Standard'
    capacity: 10
  }
  properties: {
    model: {
      format: 'OpenAI'
      name: 'gpt-4o'
      version: '2024-05-13'
    }
  }
}

output endpoint string = openai.properties.endpoint
output name string = openai.name
