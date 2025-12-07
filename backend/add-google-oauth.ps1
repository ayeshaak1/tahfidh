# PowerShell script to add Google OAuth credentials to backend/.env

$envFile = "backend\.env"

if (-not (Test-Path $envFile)) {
    Write-Host "Error: backend\.env file not found!" -ForegroundColor Red
    exit 1
}

Write-Host "Adding Google OAuth credentials to backend\.env..." -ForegroundColor Green

# Read current .env file
$content = Get-Content $envFile -Raw

# Check if Google OAuth credentials already exist
if ($content -match "GOOGLE_CLIENT_ID") {
    Write-Host "Google OAuth credentials already exist in .env file." -ForegroundColor Yellow
    Write-Host "Do you want to update them? (y/N): " -NoNewline
    $response = Read-Host
    if ($response -ne "y" -and $response -ne "Y") {
        Write-Host "Cancelled." -ForegroundColor Yellow
        exit 0
    }
    # Remove existing Google OAuth lines
    $content = $content -replace "(?m)^GOOGLE_CLIENT_ID=.*$", ""
    $content = $content -replace "(?m)^GOOGLE_CLIENT_SECRET=.*$", ""
    $content = $content -replace "(?m)^GOOGLE_CALLBACK_URL=.*$", ""
    $content = $content -replace "(?m)^FRONTEND_URL=.*$", ""
    $content = $content -replace "(?m)^SESSION_SECRET=.*$", ""
    $content = $content -replace "(?m)^\s*$[\r\n]+", "`r`n"  # Remove extra blank lines
}

# Add Google OAuth credentials
$googleOAuth = @"

# Google OAuth Credentials
GOOGLE_CLIENT_ID=419219087780-n6badp54fuit0c32c657nej2pnu7gd0f.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# OAuth URLs (update for production after deployment)
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback
FRONTEND_URL=http://localhost:3000

# Session Secret (can use same as JWT_SECRET)
SESSION_SECRET=
"@

# Append to content
$content = $content.TrimEnd() + "`r`n" + $googleOAuth

# Write back to file
Set-Content -Path $envFile -Value $content -NoNewline

Write-Host "`n✅ Google OAuth credentials added successfully!" -ForegroundColor Green
Write-Host "`n⚠️  Don't forget to:" -ForegroundColor Yellow
Write-Host "   1. Set SESSION_SECRET (can use same value as JWT_SECRET)" -ForegroundColor Yellow
Write-Host "   2. Update URLs for production after deployment" -ForegroundColor Yellow

