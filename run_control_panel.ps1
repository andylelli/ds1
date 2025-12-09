Write-Host "Starting DS1 Control Panel..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Building application..." -ForegroundColor Green
npm run build

Write-Host ""
Write-Host "Starting server..." -ForegroundColor Green
Write-Host "Control Panel: http://localhost:3000" -ForegroundColor Green
Write-Host ""

npm start
