# HR-TAG — Play Store release (Windows)

Param(
  [switch]$SkipPrebuild,
  [switch]$SkipKeystore
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "== HR-TAG Play Store build ==" -ForegroundColor Cyan

$KeystorePath = Join-Path $Root "hr-tag-upload.keystore"
$PropsPath = Join-Path $Root "android\keystore.properties"
$PropsExample = Join-Path $Root "android\keystore.properties.example"

if (-not $SkipKeystore) {
  if (-not (Test-Path $KeystorePath)) {
    Write-Host "Membuat upload keystore..." -ForegroundColor Yellow
    $dname = "CN=HR-TAG, OU=Mobile, O=TAG, L=Jakarta, ST=Jakarta, C=ID"
    keytool -genkeypair -v -storetype PKCS12 `
      -keystore $KeystorePath `
      -alias hr-tag `
      -keyalg RSA -keysize 2048 -validity 10000 `
      -storepass "HrTagPlayStore2026!" `
      -keypass "HrTagPlayStore2026!" `
      -dname $dname
    Write-Host "Keystore dibuat: $KeystorePath" -ForegroundColor Green
    Write-Host "SIMPAN file keystore dan password dengan aman!" -ForegroundColor Red
  }

  if (-not (Test-Path $PropsPath)) {
    Copy-Item $PropsExample $PropsPath
    $content = (Get-Content $PropsPath -Raw) -replace "GANTI_PASSWORD_ANDA", "HrTagPlayStore2026!"
    $utf8NoBom = New-Object System.Text.UTF8Encoding $false
    [System.IO.File]::WriteAllText($PropsPath, $content, $utf8NoBom)
    Write-Host "keystore.properties dibuat dari template." -ForegroundColor Green
  }
}

if (-not $SkipPrebuild) {
  Write-Host "Menjalankan expo prebuild..." -ForegroundColor Yellow
  npm install
  npx expo prebuild --platform android --clean
}

$PropsPath = Join-Path $Root "android\keystore.properties"
if (Test-Path $KeystorePath) {
  $propsContent = @"
storeFile=../../hr-tag-upload.keystore
storePassword=HrTagPlayStore2026!
keyAlias=hr-tag
keyPassword=HrTagPlayStore2026!
"@
  $utf8NoBom = New-Object System.Text.UTF8Encoding $false
  [System.IO.File]::WriteAllText($PropsPath, $propsContent + [Environment]::NewLine, $utf8NoBom)
  Write-Host "keystore.properties ditulis ke android/" -ForegroundColor Green
}

$sdkPath = $env:ANDROID_HOME
if (-not $sdkPath -and (Test-Path "$env:LOCALAPPDATA\Android\Sdk")) {
  $sdkPath = "$env:LOCALAPPDATA\Android\Sdk"
}
if (-not $sdkPath) {
  throw "Android SDK tidak ditemukan. Set ANDROID_HOME atau install Android Studio."
}
$localProps = Join-Path $Root "android\local.properties"
$sdkLine = "sdk.dir=$($sdkPath -replace '\\','/')"
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($localProps, $sdkLine + [Environment]::NewLine, $utf8NoBom)
Write-Host "local.properties -> $sdkPath" -ForegroundColor Cyan

$gradleProps = Join-Path $Root "android\app\build.gradle"
if (-not (Test-Path $gradleProps)) {
  throw "android/app/build.gradle tidak ditemukan. Jalankan prebuild dulu."
}

$appId = Select-String -Path $gradleProps -Pattern "applicationId\s+['`"]([^'`"]+)['`"]" |
  ForEach-Object { $_.Matches[0].Groups[1].Value }
Write-Host "applicationId: $appId" -ForegroundColor Cyan

Write-Host "Membangun AAB release..." -ForegroundColor Yellow
Push-Location (Join-Path $Root "android")
try {
  .\gradlew.bat bundleRelease
} finally {
  Pop-Location
}

$aab = Join-Path $Root "android\app\build\outputs\bundle\release\app-release.aab"
if (Test-Path $aab) {
  $size = [math]::Round((Get-Item $aab).Length / 1MB, 2)
  Write-Host ""
  Write-Host "AAB siap upload:" -ForegroundColor Green
  Write-Host "  $aab ($size MB)"
  Write-Host ""
  Write-Host "Langkah Play Console (manual):" -ForegroundColor Cyan
  Write-Host "  1. https://play.google.com/console — Create app HR-TAG"
  Write-Host "  2. Package name harus: id.co.tag.hrmobile"
  Write-Host '  3. Lengkapi store listing, privacy policy, data safety, app access demo'
  Write-Host '  4. Release - Testing - Internal testing - Upload AAB'
  Write-Host "  5. Aktifkan Play App Signing saat diminta"
  Write-Host "  6. Submit review"
} else {
  throw "Build gagal — app-release.aab tidak ditemukan."
}
