param(
 [ValidateSet('EnablePolar','DisablePolar','SetAds','DisableAds')][string]$Action='DisableAds',
 [ValidateSet('sandbox','production')][string]$BillingMode='sandbox',
 [ValidateRange(100,10000)][int]$MonthlyCents=300,
 [string]$PolarProductId,
 [string]$AdSenseClient,
 [string]$AdSenseSlot
)
$ErrorActionPreference='Stop'
$projectRoot=Split-Path $PSScriptRoot -Parent
$hosting=Get-Content -Raw -LiteralPath (Join-Path $projectRoot 'docs/hosting.json')|ConvertFrom-Json
function Read-SecretValue([string]$Name){$value=[Environment]::GetEnvironmentVariable($Name);if($value){return $value};$secure=Read-Host $Name -AsSecureString;$pointer=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure);try{return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)}finally{[Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)}}
function Send-Json([string]$Uri,[string]$Method,[hashtable]$Headers,$Data){try{if($null -eq $Data){return Invoke-RestMethod -Uri $Uri -Method $Method -Headers $Headers};return Invoke-RestMethod -Uri $Uri -Method $Method -Headers $Headers -ContentType 'application/json' -Body ($Data|ConvertTo-Json -Depth 12)}catch{throw "Configuration request failed at $(([Uri]$Uri).Host). Check account permissions and provider response in its dashboard."}}
$cloudflareToken=Read-SecretValue 'CLOUDFLARE_API_TOKEN'
$settings=@{};$newPublic=$null;$oldPublic=$null
$publicPath=Join-Path $projectRoot 'docs/revenue-public.json'
if(Test-Path -LiteralPath $publicPath){$oldPublic=Get-Content -Raw -LiteralPath $publicPath|ConvertFrom-Json}
switch($Action){
 'DisableAds'{$settings.ADSENSE_CLIENT=$null;$settings.ADSENSE_SLOT=$null;$settings.ADSENSE_CONSENT_READY=$null}
 'SetAds'{if($AdSenseClient -notmatch '^ca-pub-\d{16}$' -or $AdSenseSlot -notmatch '^\d{10}$'){throw 'Provide a real ca-pub- publisher ID and ten-digit ad slot.'};$settings.ADSENSE_CLIENT=@{type='secret_text';value=$AdSenseClient};$settings.ADSENSE_SLOT=@{type='secret_text';value=$AdSenseSlot};$settings.ADSENSE_CONSENT_READY=@{type='secret_text';value='false'}}
 'DisablePolar'{foreach($name in @('POLAR_ACCESS_TOKEN','POLAR_PRODUCT_ID','POLAR_WEBHOOK_SECRET','POLAR_MODE')){$settings[$name]=$null}}
 'EnablePolar'{
  $polarToken=Read-SecretValue 'POLAR_ACCESS_TOKEN';$base=if($BillingMode -eq 'sandbox'){'https://sandbox-api.polar.sh/v1'}else{'https://api.polar.sh/v1'};$headers=@{Authorization="Bearer $polarToken";'Polar-Version'='2026-10'}
  if(!$PolarProductId -and $oldPublic -and $oldPublic.mode -eq $BillingMode){$PolarProductId=$oldPublic.productId}
  if(!$PolarProductId){$product=Send-Json "$base/products/" 'Post' $headers @{name='Three Beat Freight Yard Locker Plus';description='40 private cloud arena slots. The complete current game, local editor and portable files remain free. No gameplay advantage.';recurring_interval='month';recurring_interval_count=1;prices=@(@{amount_type='fixed';price_amount=$MonthlyCents;price_currency='usd'});metadata=@{application='three-beat-freight';feature='yard-locker'}};$PolarProductId=$product.id}
  if($PolarProductId -notmatch '^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$'){throw 'Polar did not return a product UUID.'}
  $endpoint=Send-Json "$base/webhooks/endpoints" 'Post' $headers @{url=($hosting.siteUrl.TrimEnd('/')+'/api/billing/webhook');format='raw';api_version='2026-10';events=@('customer.state_changed');name='Three Beat Freight locker'}
  if(!$endpoint.uses_standard_webhook_signature -or $endpoint.secret -notmatch '^whsec_'){throw 'A current Standard Webhooks signing secret is required.'}
  foreach($pair in @(@('POLAR_ACCESS_TOKEN',$polarToken),@('POLAR_PRODUCT_ID',$PolarProductId),@('POLAR_WEBHOOK_SECRET',$endpoint.secret),@('POLAR_MODE',$BillingMode))){$settings[$pair[0]]=@{type='secret_text';value=$pair[1]}}
  $newPublic=@{provider='polar';mode=$BillingMode;productId=$PolarProductId;webhookId=$endpoint.id;apiVersion='2026-10'}
 }
}
$patched=Send-Json "https://api.cloudflare.com/client/v4/accounts/$($hosting.accountId)/pages/projects/$($hosting.projectName)" 'Patch' @{Authorization="Bearer $cloudflareToken"} @{deployment_configs=@{production=@{env_vars=$settings}}}
if(!$patched.success){throw 'Cloudflare did not confirm the configuration.'}
if($newPublic){$newPublic|ConvertTo-Json|Set-Content -LiteralPath $publicPath -Encoding utf8;if($oldPublic -and $oldPublic.mode -eq $BillingMode -and $oldPublic.webhookId -and $oldPublic.webhookId -ne $newPublic.webhookId){$null=Send-Json "$base/webhooks/endpoints/$($oldPublic.webhookId)" 'Patch' $headers @{enabled=$false}}}
Write-Output "Configured $Action. Redeploy the current main branch to apply it. No credential was written to the repository."

