param(
  [string]$ProjectName = "arpage",
  [string]$ProductionBranch = "master",
  [string]$KvBinding = "BOOKMARKS"
)

$ErrorActionPreference = "Stop"

function Run-Step {
  param(
    [string]$Title,
    [scriptblock]$Action
  )

  Write-Host ""
  Write-Host "==> $Title" -ForegroundColor Cyan
  & $Action
}

function Get-WranglerToml {
  return Get-Content -Raw -Encoding UTF8 "wrangler.toml"
}

function Get-KvId {
  param([string]$Field)

  $toml = Get-WranglerToml
  $pattern = '(?m)^\s*' + [regex]::Escape($Field) + '\s*=\s*"([^"]+)"'
  $match = [regex]::Match($toml, $pattern)
  if (!$match.Success) { return $null }

  $value = $match.Groups[1].Value
  if ($value -like "REPLACE_WITH_*") { return $null }
  return $value
}

function New-KvNamespace {
  param([string]$Name)

  $output = npx wrangler kv namespace create $Name 2>&1
  $output | Write-Host

  $match = [regex]::Match(($output -join "`n"), 'id\s*=\s*"([^"]+)"')
  if (!$match.Success) {
    throw "Failed to parse KV id from Wrangler output: $Name"
  }

  return $match.Groups[1].Value
}

function Update-WranglerKvIds {
  param(
    [string]$Id,
    [string]$PreviewId
  )

  $toml = Get-WranglerToml
  $toml = [regex]::Replace($toml, '(?m)^binding\s*=\s*"[^"]+"', 'binding = "' + $KvBinding + '"')
  $toml = [regex]::Replace($toml, '(?m)^id\s*=\s*"[^"]+"', 'id = "' + $Id + '"')
  $toml = [regex]::Replace($toml, '(?m)^preview_id\s*=\s*"[^"]+"', 'preview_id = "' + $PreviewId + '"')
  Set-Content -Encoding UTF8 -NoNewline -Path "wrangler.toml" -Value $toml
}

Run-Step "Check Wrangler login" {
  npx wrangler whoami
}

Run-Step "Create or reuse Cloudflare Pages project" {
  $projects = npx wrangler pages project list 2>&1
  $projectExists = ($projects -join "`n") -match "(?m)\b$([regex]::Escape($ProjectName))\b"

  if ($projectExists) {
    Write-Host "Pages project already exists: $ProjectName"
  } else {
    npx wrangler pages project create $ProjectName --production-branch $ProductionBranch
  }
}

$kvId = Get-KvId "id"
$previewKvId = Get-KvId "preview_id"

if (!$kvId) {
  Run-Step "Create production KV: $KvBinding" {
    $script:kvId = New-KvNamespace $KvBinding
  }
} else {
  Write-Host "Reuse production KV: $kvId"
}

if (!$previewKvId) {
  Run-Step "Create preview KV: ${KvBinding}_PREVIEW" {
    $script:previewKvId = New-KvNamespace "${KvBinding}_PREVIEW"
  }
} else {
  Write-Host "Reuse preview KV: $previewKvId"
}

Run-Step "Update KV binding in wrangler.toml" {
  Update-WranglerKvIds -Id $kvId -PreviewId $previewKvId
}

Run-Step "Build frontend" {
  npm run build
}

Run-Step "Deploy to Cloudflare Pages" {
  npx wrangler pages deploy --project-name $ProjectName --commit-dirty=true
}

Write-Host ""
Write-Host "Deploy flow completed." -ForegroundColor Green
Write-Host "If secrets are not set yet, run:"
Write-Host "npx wrangler pages secret put PASSWORD --project-name $ProjectName"
Write-Host "npx wrangler pages secret put AUTH_SECRET --project-name $ProjectName"
