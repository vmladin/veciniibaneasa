# Fix mojibake in admin page using char codes only (no literal emoji in this script)
$cp1252 = [System.Text.Encoding]::GetEncoding(1252)
$utf8   = [System.Text.Encoding]::UTF8

function Get-Corrupted([string]$s) {
    $bytes = $utf8.GetBytes($s)
    $out = New-Object System.Text.StringBuilder
    foreach ($b in $bytes) {
        if ($b -lt 0x80) {
            [void]$out.Append([char]$b)
        } elseif ($b -in @(0x81,0x8D,0x8F,0x90,0x9D)) {
            [void]$out.Append([char]([int]$b))
        } else {
            [void]$out.Append($cp1252.GetString([byte[]]@($b)))
        }
    }
    return $out.ToString()
}

# Build correct strings from code points (avoids literal emoji encoding issues)
function U([int[]]$codepoints) {
    $sb = New-Object System.Text.StringBuilder
    foreach ($cp in $codepoints) {
        if ($cp -gt 0xFFFF) {
            [void]$sb.Append([System.Char]::ConvertFromUtf32($cp))
        } else {
            [void]$sb.Append([char]$cp)
        }
    }
    return $sb.ToString()
}

$corrections = @(
    (U @(0x1F6CB, 0xFE0F)),  # sofa + variation selector
    (U @(0x26A1)),            # lightning
    (U @(0x1F4BB)),           # laptop
    (U @(0x1F457)),           # dress
    (U @(0x1F4DA)),           # books
    (U @(0x1F3C3)),           # runner
    (U @(0x1F476)),           # baby
    (U @(0x1F331)),           # seedling
    (U @(0x1F697)),           # car
    (U @(0x1F43E)),           # paw prints
    (U @(0x1F527)),           # wrench
    (U @(0x1F4E6)),           # package
    (U @(0x2014)),            # em dash
    (U @(0x2726)),            # black four-pointed star
    (U @(0x27F5)),            # long leftwards arrow
    (U @(0x1F5BC, 0xFE0F)),   # frame with picture
    (U @(0x2713)),            # check mark
    (U @(0x1F4C5)),           # calendar
    (U @(0x1F4E2)),           # megaphone
    (U @(0x2715)),            # multiplication x (close button)
    (U @(0x2714)),            # heavy check mark
    (U @(0x1F4CB)),           # clipboard
    (U @(0x1F5D1, 0xFE0F)),   # wastebasket
    (U @(0x270F, 0xFE0F)),    # pencil
    (U @(0x1F6A9)),           # triangular flag
    (U @(0x26A0)),            # warning sign
    (U @(0x2610)),            # ballot box
    (U @(0x2611)),            # ballot box with check
    (U @(0x1F4CD))            # round pushpin
)

$file = 'D:\Vecinii Baneasa\app\admin-vb-secret\page.tsx'
$content = [System.IO.File]::ReadAllText($file, $utf8)

$count = 0
foreach ($correct in $corrections) {
    $corrupted = Get-Corrupted $correct
    if ($corrupted -ne $correct -and $content.Contains($corrupted)) {
        $n = ($content.Split($corrupted)).Count - 1
        $content = $content.Replace($corrupted, $correct)
        Write-Host ("Fixed " + $n + "x: [" + $corrupted + "] -> [" + $correct + "]")
        $count += $n
    }
}

[System.IO.File]::WriteAllText($file, $content, (New-Object System.Text.UTF8Encoding $false))
Write-Host ("Done. " + $count + " total replacements.")
