# TODO: Pertahankan input password tersembunyi dan jangan menambahkan transkrip kredensial.
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$nodeBinary = (Get-Command node -ErrorAction Stop).Source
$helperPath = Join-Path $PSScriptRoot 'reset-staff-password.mjs'
$staffEmail = Read-Host 'Email akun admin atau mentor general yang akan direset'
& $nodeBinary $helperPath --check $staffEmail
if ($LASTEXITCODE -ne 0) { throw 'Pemeriksaan akun gagal. Password belum diubah.' }
$confirmation = Read-Host 'Ketik RESET untuk mengganti password akun tersebut'
if ($confirmation -cne 'RESET') { Write-Host 'Dibatalkan. Password belum diubah.'; return }
$securePassword = Read-Host 'Password baru (minimal 8 karakter)' -AsSecureString
$secureConfirmation = Read-Host 'Ulangi password baru' -AsSecureString
$plainPassword = [System.Net.NetworkCredential]::new('', $securePassword).Password
$plainConfirmation = [System.Net.NetworkCredential]::new('', $secureConfirmation).Password
try {
 if ($plainPassword -cne $plainConfirmation) { throw 'Kedua password tidak sama. Password belum diubah.' }
 if ($plainPassword.Length -lt 8 -or $plainPassword.Length -gt 1024) { throw 'Password harus berisi 8–1024 karakter.' }
 $payload = @{ email = $staffEmail; password = $plainPassword } | ConvertTo-Json -Compress
 Push-Location -LiteralPath $projectRoot
 try {
  $previousEncoding = $OutputEncoding
  try {
   $OutputEncoding = [System.Text.UTF8Encoding]::new($false)
   $payload | & $nodeBinary $helperPath --reset
  } finally { $OutputEncoding = $previousEncoding }
  if ($LASTEXITCODE -ne 0) { throw 'Reset gagal. Periksa akun, konfigurasi, atau kebijakan password Supabase.' }
 } finally { Pop-Location }
} finally {
 $plainPassword = $null
 $plainConfirmation = $null
 $payload = $null
 $securePassword.Dispose()
 $secureConfirmation.Dispose()
}
