param location string
param suffix string

resource cosmos 'Microsoft.DocumentDB/databaseAccounts@2023-04-15' = {
  name: 'cosmos-${suffix}'
  location: location
  kind: 'GlobalDocumentDB'
  properties: {
    databaseAccountOfferType: 'Standard'
    locations: [
      {
        locationName: location
        failoverPriority: 0
      }
    ]
    capabilities: [
      {
        name: 'EnableServerless'
      }
    ]
  }
}

resource database 'Microsoft.DocumentDB/databaseAccounts/sqlDatabases@2023-04-15' = {
  parent: cosmos
  name: 'DropShipDB'
  properties: {
    resource: {
      id: 'DropShipDB'
    }
  }
}

output endpoint string = cosmos.properties.documentEndpoint
output databaseName string = database.name
