$cp1252 = [System.Text.Encoding]::GetEncoding(1252)
$utf8   = [System.Text.Encoding]::UTF8

function Get-Corrupted([string]$s) {
    $bytes = $utf8.GetBytes($s)
    $out = New-Object System.Text.StringBuilder
    foreach ($b in $bytes) {
        if ($b -lt 0x80) { [void]$out.Append([char]$b) }
        elseif ($b -in @(0x81,0x8D,0x8F,0x90,0x9D)) { [void]$out.Append([char]([int]$b)) }
        else { [void]$out.Append($cp1252.GetString([byte[]]@($b))) }
    }
    return $out.ToString()
}

$correct   = [System.Char]::ConvertFromUtf32(0x1F5BC)  # 🖼 without variation selector
$corrupted = Get-Corrupted $correct
Write-Host ("Corrupted form: [" + $corrupted + "]")

$file = 'D:\Vecinii Baneasa\app\admin-vb-secret\page.tsx'
$content = [System.IO.File]::ReadAllText($file, $utf8)

if ($content.Contains($corrupted)) {
    $content = $content.Replace($corrupted, $correct)
    [System.IO.File]::WriteAllText($file, $content, (New-Object System.Text.UTF8Encoding $false))
    Write-Host "Fixed picture frame emoji"
} else {
    Write-Host "Pattern not found in file"
}
