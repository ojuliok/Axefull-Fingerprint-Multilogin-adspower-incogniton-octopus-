$password = ConvertTo-SecureString -String "axefull123" -AsPlainText -Force
$pfxPath = Join-Path (Get-Location) "certs\self_signed.pfx"

# 1. Import to Current User stores (doesn't require admin, good for basic trust)
Import-PfxCertificate -FilePath $pfxPath -CertStoreLocation Cert:\CurrentUser\Root -Password $password
Import-PfxCertificate -FilePath $pfxPath -CertStoreLocation Cert:\CurrentUser\TrustedPublisher -Password $password

# 2. Import to Local Machine stores (requires admin, needed for WDAC/Smart App Control)
try {
    Import-PfxCertificate -FilePath $pfxPath -CertStoreLocation Cert:\LocalMachine\Root -Password $password
    Import-PfxCertificate -FilePath $pfxPath -CertStoreLocation Cert:\LocalMachine\TrustedPublisher -Password $password
    Write-Host "Self-signed certificate successfully imported to Local Machine stores."
} catch {
    Write-Warning "Failed to import to Local Machine. Please make sure this script is run as Administrator."
}
