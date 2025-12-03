param location string
param appName string
param environmentId string
param acrLoginServer string
param acrName string
@secure()
param acrPassword string
param openAiEndpoint string
param cosmosEndpoint string
param cosmosDatabaseName string
@secure()
param shopifyAccessToken string
param shopifyShopName string

resource containerApp 'Microsoft.App/containerApps@2023-05-01' = {
  name: appName
  location: location
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    managedEnvironmentId: environmentId
    configuration: {
      ingress: {
        external: true
        targetPort: 3000
      }
      secrets: [
        {
          name: 'acr-password'
          value: acrPassword
        }
        {
          name: 'shopify-token'
          value: shopifyAccessToken
        }
      ]
      registries: [
        {
          server: acrLoginServer
          username: acrName
          passwordSecretRef: 'acr-password'
        }
      ]
    }
    template: {
      containers: [
        {
          name: 'main'
          image: 'mcr.microsoft.com/azuredocs/containerapps-helloworld:latest'
          env: [
            {
              name: 'AZURE_OPENAI_ENDPOINT'
              value: openAiEndpoint
            }
            {
              name: 'AZURE_OPENAI_DEPLOYMENT_NAME'
              value: 'gpt-4o'
            }
            {
              name: 'AZURE_COSMOS_ENDPOINT'
              value: cosmosEndpoint
            }
            {
              name: 'AZURE_COSMOS_DB_NAME'
              value: cosmosDatabaseName
            }
            {
              name: 'SHOPIFY_SHOP_NAME'
              value: shopifyShopName
            }
            {
              name: 'SHOPIFY_ACCESS_TOKEN'
              secretRef: 'shopify-token'
            }
          ]
          resources: {
            cpu: json('0.5')
            memory: '1.0Gi'
          }
        }
      ]
    }
  }
}

output name string = containerApp.name
output fqdn string = containerApp.properties.configuration.ingress.fqdn
