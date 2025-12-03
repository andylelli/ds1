targetScope = 'resourceGroup'

@description('The name of the environment (e.g. "dev", "prod")')
param environmentName string = 'dev'

@description('The location for all resources')
param location string = resourceGroup().location

@secure()
param shopifyAccessToken string = ''
param shopifyShopName string = ''

var appName = 'ds1-agent-${environmentName}'
var uniqueSuffix = uniqueString(resourceGroup().id)

// 1. ACR
module acr 'modules/acr.bicep' = {
  name: 'acrDeploy'
  params: {
    location: location
    suffix: uniqueSuffix
  }
}

// 2. OpenAI
module openai 'modules/openai.bicep' = {
  name: 'openaiDeploy'
  params: {
    location: location
    suffix: uniqueSuffix
  }
}

// 3. Cosmos DB
module cosmos 'modules/cosmos.bicep' = {
  name: 'cosmosDeploy'
  params: {
    location: location
    suffix: uniqueSuffix
  }
}

// 4. Host (Container Apps Env)
module host 'modules/host.bicep' = {
  name: 'hostDeploy'
  params: {
    location: location
    suffix: uniqueSuffix
  }
}

// 5. App
module app 'modules/app.bicep' = {
  name: 'appDeploy'
  params: {
    location: location
    appName: appName
    environmentId: host.outputs.id
    acrLoginServer: acr.outputs.loginServer
    acrName: acr.outputs.name
    acrPassword: acr.outputs.adminPassword
    openAiEndpoint: openai.outputs.endpoint
    cosmosEndpoint: cosmos.outputs.endpoint
    cosmosDatabaseName: cosmos.outputs.databaseName
    shopifyAccessToken: shopifyAccessToken
    shopifyShopName: shopifyShopName
  }
}

output appUrl string = app.outputs.fqdn
