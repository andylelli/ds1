$appName = "github-actions-ds1"
$org = "andylelli"
$repo = "ds1"
$branch = "main"

Write-Host "🔍 Looking for App Registration: $appName..." -ForegroundColor Cyan
$appId = az ad app list --display-name $appName --query "[0].appId" -o tsv

if (-not $appId) {
    Write-Error "❌ Could not find App Registration named '$appName'. Please ensure you created it."
    exit 1
}

Write-Host "✅ Found App ID: $appId" -ForegroundColor Green
Write-Host "🚀 Creating Federated Credential for $org/$repo ($branch)..." -ForegroundColor Cyan

# JSON payload for the credential
$credentialName = "github-actions-main-$(Get-Random)"
$parameters = @{
    name = $credentialName
    issuer = "https://token.actions.githubusercontent.com"
    subject = "repo:$org/$repo:ref:refs/heads/$branch"
    description = "GitHub Actions for main branch"
    audiences = @("api://AzureADTokenExchange")
} | ConvertTo-Json -Compress

# Create the credential
az ad app federated-credential create --id $appId --parameters $parameters

if ($LASTEXITCODE -eq 0) {
    Write-Host "Federated Credential created successfully!" -ForegroundColor Green
    Write-Host "You can now re-run the GitHub Action." -ForegroundColor Yellow
} else {
    Write-Error "Failed to create credential."
}
