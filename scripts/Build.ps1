param([switch]$NoRestore)
$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$client=Join-Path $projectRoot 'src/ThreeBeatFreight.Client'
foreach($name in @('engine.mjs','content.mjs','rival.mjs')){Copy-Item -LiteralPath (Join-Path $projectRoot "game/$name") -Destination (Join-Path $client "wwwroot/assets/$name") -Force}
$argsList=@('publish',(Join-Path $client 'ThreeBeatFreight.Client.csproj'),'-c','Release','-o',(Join-Path $projectRoot 'artifacts/publish'),'--nologo')
if($NoRestore){$argsList+='--no-restore'}
& dotnet @argsList
if($LASTEXITCODE -ne 0){throw 'Client publication failed.'}
New-Item -ItemType Directory -Force -Path (Join-Path $projectRoot 'artifacts/site') | Out-Null
Copy-Item -Path (Join-Path $projectRoot 'artifacts/publish/wwwroot/*') -Destination (Join-Path $projectRoot 'artifacts/site') -Recurse -Force
foreach($name in @('engine.mjs','content.mjs','rival.mjs')){if((Get-FileHash -LiteralPath (Join-Path $projectRoot "game/$name")).Hash -ne (Get-FileHash -LiteralPath (Join-Path $projectRoot "artifacts/site/assets/$name")).Hash){throw 'Shared engine copy differs from its source.'}}
Write-Output 'Built Blazor client; browser game modules match server source.'

