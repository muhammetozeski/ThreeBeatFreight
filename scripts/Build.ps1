param(
 [switch]$NoRestore,
 [ValidatePattern('^/(?:[a-z0-9][a-z0-9-]*/)*$')][string]$BasePath='/',
 [string]$Destination=''
)
$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$client=Join-Path $projectRoot 'src/ThreeBeatFreight.Client'
$site=if([string]::IsNullOrWhiteSpace($Destination)){Join-Path $projectRoot 'artifacts/site'}elseif([IO.Path]::IsPathRooted($Destination)){[IO.Path]::GetFullPath($Destination)}else{[IO.Path]::GetFullPath((Join-Path $projectRoot $Destination))}
foreach($name in @('engine.mjs','content.mjs','rival.mjs')){Copy-Item -LiteralPath (Join-Path $projectRoot "game/$name") -Destination (Join-Path $client "wwwroot/assets/$name") -Force}
$argsList=@('publish',(Join-Path $client 'ThreeBeatFreight.Client.csproj'),'-c','Release','-o',(Join-Path $projectRoot 'artifacts/publish'),'--nologo')
if($NoRestore){$argsList+='--no-restore'}
& dotnet @argsList
if($LASTEXITCODE -ne 0){throw 'Client publication failed.'}
New-Item -ItemType Directory -Force -Path $site | Out-Null
Copy-Item -Path (Join-Path $projectRoot 'artifacts/publish/wwwroot/*') -Destination $site -Recurse -Force
foreach($name in @('engine.mjs','content.mjs','rival.mjs')){if((Get-FileHash -LiteralPath (Join-Path $projectRoot "game/$name")).Hash -ne (Get-FileHash -LiteralPath (Join-Path $site "assets/$name")).Hash){throw 'Shared engine copy differs from its source.'}}
$indexPath=Join-Path $site 'index.html'
$index=Get-Content -Raw -LiteralPath $indexPath
if(!$index.Contains('<base href="/">')){throw 'The source index needs its expected root base element.'}
[IO.File]::WriteAllText($indexPath,$index.Replace('<base href="/">','<base href="'+$BasePath+'">'))
if($BasePath -ne '/'){
 $headerPath=Join-Path $site '_headers'
 $headers=foreach($line in @(Get-Content -LiteralPath $headerPath)){if($line.StartsWith('/')){$BasePath+$line.TrimStart('/')}else{$line}}
 [IO.File]::WriteAllText($headerPath,($headers -join "`n")+"`n")
 [IO.File]::WriteAllText((Join-Path $site '_routes.json'),(@{version=1;include=@($BasePath+'api/*');exclude=@()}|ConvertTo-Json -Compress))
}
Write-Output 'Built Blazor client; browser game modules match server source.'
Write-Output ('Application base: '+$BasePath)

