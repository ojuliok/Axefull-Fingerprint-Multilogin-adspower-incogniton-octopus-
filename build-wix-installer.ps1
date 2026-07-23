# Script de build para gerar o instalador MSI usando o WiX Toolset v3.14 (instalado em Program Files)

$unpackedDir = "C:\Users\FAGNER\fingerprint-release\win-unpacked"
$wixBinDir = "C:\Program Files (x86)\WiX Toolset v3.14\bin"
$outputMsi = "C:\Users\FAGNER\fingerprint-release\AxeAgentSetup.msi"
$wxsFile = "$PSScriptRoot\Product.wxs"

Write-Host "Verificando diretorio descompactado do Electron..." -ForegroundColor Cyan
if (-not (Test-Path "$unpackedDir\Axe Agent.exe")) {
    Write-Error "O executavel Axe Agent.exe nao foi encontrado em $unpackedDir. Execute 'npx electron-builder --win dir' primeiro."
    exit 1
}

Write-Host "Gerando definicao do WiX (Product.wxs)..." -ForegroundColor Cyan

# Escanear recursivamente todos os arquivos e subpastas para gerar componentes do WiX
$files = Get-ChildItem -Path $unpackedDir -Recurse -File

$fileComponentsXml = ""
$componentRefsXml = ""
$fileCounter = 1

foreach ($file in $files) {
    $fileId = "File_$fileCounter"
    $compId = "Comp_$fileCounter"
    $guid = [System.Guid]::NewGuid().ToString().ToUpper()
    $sourcePath = $file.FullName

    if ($file.Name -eq "Axe Agent.exe" -and $file.DirectoryName -eq $unpackedDir) {
        # Executavel Principal com Atalhos e Registro do Protocolo axeagent://
        $fileComponentsXml += @"
        <Component Id="Comp_MainExe" Guid="A1B2C3D4-E5F6-7890-ABCD-123456789012">
          <File Id="File_MainExe" Source="$sourcePath" KeyPath="yes">
            <Shortcut Id="DesktopShortcut" Directory="DesktopFolder" Name="Axe Agent" WorkingDirectory="INSTALLFOLDER" Advertise="no" />
            <Shortcut Id="StartMenuShortcut" Directory="ApplicationProgramsFolder" Name="Axe Agent" WorkingDirectory="INSTALLFOLDER" Advertise="no" />
          </File>
          <!-- Registro do protocolo axeagent:// -->
          <RegistryValue Root="HKCR" Key="axeagent" Type="string" Value="URL:axeagent Protocol" KeyPath="no"/>
          <RegistryValue Root="HKCR" Key="axeagent" Name="URL Protocol" Type="string" Value="" KeyPath="no"/>
          <RegistryValue Root="HKCR" Key="axeagent\shell\open\command" Type="string" Value="&quot;[INSTALLFOLDER]Axe Agent.exe&quot; &quot;%1&quot;" KeyPath="no"/>
        </Component>
"@
        $componentRefsXml += "      <ComponentRef Id=`"Comp_MainExe`" />`n"
    } else {
        # Arquivos normais / dependencias
        $fileComponentsXml += @"
        <Component Id="$compId" Guid="$guid">
          <File Id="$fileId" Source="$sourcePath" KeyPath="yes" />
        </Component>
"@
        $componentRefsXml += "      <ComponentRef Id=`"$compId`" />`n"
    }
    $fileCounter++
}

# Template do arquivo Product.wxs
$wxsContent = @"
<?xml version="1.0" encoding="UTF-8"?>
<Wix xmlns="http://schemas.microsoft.com/wix/2006/wi">
  <Product Id="*" Name="Axe Agent" Language="1033" Version="1.0.0" Manufacturer="Axefull" UpgradeCode="B5C3D4E5-F6A7-8901-BCDE-234567890123">
    <Package InstallerVersion="200" Compressed="yes" InstallScope="perMachine" />
    <MediaTemplate EmbedCab="yes" />

    <!-- Acao Personalizada para Executar o App apos instalacao -->
    <SetProperty Id="WixShellExecTarget" Value="[#File_MainExe]" After="CostFinalize" />
    <CustomAction Id="LaunchApplication" BinaryKey="WixCA" DllEntry="WixShellExec" Impersonate="yes" />

    <Directory Id="TARGETDIR" Name="SourceDir">
      <Directory Id="ProgramFilesFolder">
        <Directory Id="INSTALLFOLDER" Name="Axe Agent" />
      </Directory>
      <Directory Id="ProgramMenuFolder">
        <Directory Id="ApplicationProgramsFolder" Name="Axe Agent" />
      </Directory>
      <Directory Id="DesktopFolder" Name="Desktop" />
    </Directory>

    <DirectoryRef Id="INSTALLFOLDER">
$fileComponentsXml
    </DirectoryRef>

    <DirectoryRef Id="ApplicationProgramsFolder">
      <Component Id="Comp_FolderCleanup" Guid="C6D4E5F6-A7B8-9012-CDEF-345678901234">
        <RemoveFolder Id="ApplicationProgramsFolder" On="uninstall"/>
        <RegistryValue Root="HKCU" Key="Software\Axefull\AxeAgent" Name="installed" Type="integer" Value="1" KeyPath="yes"/>
      </Component>
    </DirectoryRef>

    <Feature Id="MainFeature" Title="Axe Agent" Level="1">
$componentRefsXml
      <ComponentRef Id="Comp_FolderCleanup" />
    </Feature>

    <InstallExecuteSequence>
      <Custom Action="LaunchApplication" After="InstallFinalize">NOT Installed</Custom>
    </InstallExecuteSequence>
  </Product>
</Wix>
"@

$wxsContent | Out-File -FilePath $wxsFile -Encoding utf8

Write-Host "Compilando com WiX candle.exe..." -ForegroundColor Cyan
& "$wixBinDir\candle.exe" -ext WixUtilExtension "$wxsFile" -out "$PSScriptRoot\Product.wixobj"
if ($LASTEXITCODE -ne 0) {
    Write-Error "Falha ao compilar o arquivo Product.wxs"
    exit 1
}

Write-Host "Gerando MSI com WiX light.exe..." -ForegroundColor Cyan
& "$wixBinDir\light.exe" -ext WixUtilExtension "$PSScriptRoot\Product.wixobj" -out "$outputMsi" -sval
if ($LASTEXITCODE -ne 0) {
    Write-Error "Falha ao gerar o MSI"
    exit 1
}

Write-Host "SUCESSO! O instalador MSI foi criado em: $outputMsi" -ForegroundColor Green
