$baseUrl = "http://192.168.4.4:4060/api"

function Get-ApiData {
    param($url)
    try {
        return Invoke-RestMethod -Uri $url -Method Get
    } catch {
        Write-Error "API Error at $url : $_"
        return $null
    }
}

# 1. Fetch save_noise_logs
$snlData = Get-ApiData "$baseUrl/settings/save_noise_logs"
$saveNoiseLogs = $null
if ($null -ne $snlData) {
    if ($snlData.PSObject.Properties.Name -contains "value") {
        $saveNoiseLogs = $snlData.value
    } else {
        $saveNoiseLogs = $snlData
    }
}

# 2. Paginate patterns
$limit = 1000
$offset = 0
$allPatterns = @()
$fetching = $true

while ($fetching) {
    $resp = Get-ApiData "$baseUrl/patterns?limit=$limit&offset=$offset"
    if ($null -eq $resp) { break }
    
    $items = @()
    if ($resp -is [Array]) { $items = $resp }
    elseif ($resp.items -is [Array]) { $items = $resp.items }
    else { break }
    
    if ($items.Count -eq 0) { break }
    
    $allPatterns += $items
    $offset += $limit
    if ($items.Count -lt $limit) { $fetching = $false }
}

# 3. Compute stats
$totalRows = $allPatterns.Count
[long]$totalHitCount = 0
[long]$totalExclNoise = 0

foreach ($p in $allPatterns) {
    $hc = 0
    if ($null -ne $p.hit_count) { $hc = [long]$p.hit_count }
    $totalHitCount += $hc
    
    $class = ""
    if ($null -ne $p.effective_classification) { $class = $p.effective_classification.ToString() }
    elseif ($null -ne $p.classification) { $class = $p.classification.ToString() }
    
    if ($class.ToLower() -ne "noise") {
        $totalExclNoise += $hc
    }
}

# 4. Logic for UI display
$uiDisplayTotal = if ($saveNoiseLogs -eq $true) { $totalHitCount } else { $totalExclNoise }

# 5. Outputs
Write-Host "Setting 'save_noise_logs': $saveNoiseLogs"
Write-Host "UI Display Total: $uiDisplayTotal"
Write-Host "Total Pattern Rows: $totalRows"
Write-Host "Total Hit Count (All): $totalHitCount"
Write-Host "Total Hit Count (No Noise): $totalExclNoise"

Write-Host "`nTop 5 Highest-Hit Patterns (Sanity Check):"
$allPatterns | Sort-Object -Property @{Expression={[long]$_.hit_count}; Descending=$true} | Select-Object -First 5 | ForEach-Object {
    $c = if ($null -ne $_.effective_classification) { $_.effective_classification } else { $_.classification }
    Write-Host "ID: $($_.id) | Hits: $($_.hit_count) | Class: $c"
}
