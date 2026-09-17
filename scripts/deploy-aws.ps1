<#
.SYNOPSIS
    Deploys Bisync POS directly to AWS S3 + CloudFront.

.DESCRIPTION
    Checks prerequisites, provisions the CloudFormation stack, uploads production assets to S3,
    and invalidates the CloudFront cache.
#>

[CmdletBinding()]
param (
    [string]$Region = "ap-southeast-1",
    [string]$StackName = "bisync-pos-stack",
    [string]$ProjectName = "bisync-pos"
)

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "   Bisync POS - AWS Deployment Script    " -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 1. Check AWS CLI
if (-not (Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Error @"
AWS CLI is not installed on this system.
Please install it via:
  winget install --id Amazon.AWSCLI -e
Or download from: https://aws.amazon.com/cli/
"@
}

# 2. Check AWS Credentials
try {
    $identity = aws sts get-caller-identity --output json | ConvertFrom-Json
    Write-Host "Authenticated as AWS Account: $($identity.Account) ($($identity.Arn))" -ForegroundColor Green
} catch {
    Write-Error @"
Not authenticated to AWS. Please run:
  aws configure
And enter your AWS Access Key ID, Secret Access Key, and default region.
"@
}

# 3. Deploy CloudFormation Stack
Write-Host "`nDeploying CloudFormation stack '$StackName' in region '$Region'..." -ForegroundColor Yellow
aws cloudformation deploy `
    --template-file "$PSScriptRoot\..\aws\cloudformation.yml" `
    --stack-name $StackName `
    --region $Region `
    --parameter-overrides ProjectName=$ProjectName `
    --no-fail-on-empty-changeset

# 4. Fetch Outputs
Write-Host "`nFetching stack resource outputs..." -ForegroundColor Yellow
$bucket = aws cloudformation describe-stacks `
    --stack-name $StackName `
    --region $Region `
    --query "Stacks[0].Outputs[?OutputKey=='S3BucketName'].OutputValue" `
    --output text

$distId = aws cloudformation describe-stacks `
    --stack-name $StackName `
    --region $Region `
    --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" `
    --output text

$url = aws cloudformation describe-stacks `
    --stack-name $StackName `
    --region $Region `
    --query "Stacks[0].Outputs[?OutputKey=='WebsiteURL'].OutputValue" `
    --output text

Write-Host "Target S3 Bucket: $bucket" -ForegroundColor Cyan
Write-Host "CloudFront ID:    $distId" -ForegroundColor Cyan
Write-Host "Live Website URL: $url" -ForegroundColor Green

# 5. Check if dist/ exists or prompt to build
$distPath = "$PSScriptRoot\..\dist"
if (-not (Test-Path $distPath)) {
    Write-Host "`nBuilding production assets (npm run build)..." -ForegroundColor Yellow
    npm run build
}

# 6. Sync to S3
Write-Host "`nUploading assets to S3 bucket '$bucket'..." -ForegroundColor Yellow
aws s3 sync $distPath "s3://$bucket/" `
    --delete `
    --cache-control "public, max-age=31536000, immutable" `
    --exclude "index.html"

aws s3 cp "$distPath\index.html" "s3://$bucket/index.html" `
    --cache-control "public, max-age=0, must-revalidate"

# 7. Invalidate CloudFront Cache
Write-Host "`nInvalidating CloudFront CDN cache..." -ForegroundColor Yellow
aws cloudfront create-invalidation `
    --distribution-id $distId `
    --paths "/*" | Out-Null

Write-Host "`n=========================================" -ForegroundColor Green
Write-Host " Deployment Complete!" -ForegroundColor Green
Write-Host " Website URL: $url" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
