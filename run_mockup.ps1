Write-Host "Starting DS1 in MOCK UP mode..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Environment: MOCK" -ForegroundColor Green
Write-Host "Database: sandbox_db.json" -ForegroundColor Green
Write-Host ""

$env:DS1_MODE = "mock"
node dist/index.js
