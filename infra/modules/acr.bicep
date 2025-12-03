param location string
param suffix string

resource acr 'Microsoft.ContainerRegistry/registries@2023-01-01-preview' = {
  name: 'acr${suffix}'
  location: location
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: true
  }
}

output loginServer string = acr.properties.loginServer
output name string = acr.name
output id string = acr.id
output adminPassword string = acr.listCredentials().passwords[0].value

