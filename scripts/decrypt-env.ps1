param(
  [Parameter(Mandatory = $true)]
  [string]$Password,

  [string]$InputPath = ".env.enc",
  [string]$OutputPath = ".env"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $InputPath)) {
  throw "Encrypted env file not found: $InputPath"
}

$bytes = [System.IO.File]::ReadAllBytes((Resolve-Path -LiteralPath $InputPath))
$magic = [System.Text.Encoding]::ASCII.GetBytes("BUREAUENV1")

if ($bytes.Length -lt ($magic.Length + 32)) {
  throw "Encrypted env file is too small or invalid."
}

for ($i = 0; $i -lt $magic.Length; $i++) {
  if ($bytes[$i] -ne $magic[$i]) {
    throw "Encrypted env file has an invalid header."
  }
}

$offset = $magic.Length
$salt = $bytes[$offset..($offset + 15)]
$offset += 16
$iv = $bytes[$offset..($offset + 15)]
$offset += 16
$cipherText = $bytes[$offset..($bytes.Length - 1)]

$derive = [System.Security.Cryptography.Rfc2898DeriveBytes]::new(
  $Password,
  [byte[]]$salt,
  200000,
  [System.Security.Cryptography.HashAlgorithmName]::SHA256
)

$aes = [System.Security.Cryptography.Aes]::Create()
$aes.Mode = [System.Security.Cryptography.CipherMode]::CBC
$aes.Padding = [System.Security.Cryptography.PaddingMode]::PKCS7
$aes.Key = $derive.GetBytes(32)
$aes.IV = [byte[]]$iv

$decryptor = $aes.CreateDecryptor()
$plain = $decryptor.TransformFinalBlock([byte[]]$cipherText, 0, $cipherText.Length)
[System.IO.File]::WriteAllBytes($OutputPath, $plain)

Write-Host "Created $OutputPath"
