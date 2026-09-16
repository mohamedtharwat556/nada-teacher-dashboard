$path = 'c:\Users\yas\Downloads\nada th\index.html'
$content = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)

# Replace U+FFFD or space + missing letter combinations
# Let's just use string literal replacements.
$content = $content.Replace("ت اصيل", "تفاصيل")
$content = $content.Replace("ت اصيل", "تفاصيل")
$content = $content.Replace("ابنك  ي", "ابنك في")
$content = $content.Replace("ابنك  ي", "ابنك في")
$content = $content.Replace("مصاري ", "مصاريف")
$content = $content.Replace("مصاري ", "مصاريف")
$content = $content.Replace("ص و ", "صفوف")
$content = $content.Replace("ص و ", "صفوف")
$content = $content.Replace("الكاش ", "الكاشف")
$content = $content.Replace("الكاش ", "الكاشف")
$content = $content.Replace("سي ", "سيف")
$content = $content.Replace("سي ", "سيف")
$content = $content.Replace("الص ", "الصف")
$content = $content.Replace("الص ", "الصف")
$content = $content.Replace("بال هم", "بالفهم")
$content = $content.Replace("بال هم", "بالفهم")
$content = $content.Replace("مح وظة", "محفوظة")
$content = $content.Replace("مح وظة", "محفوظة")
$content = $content.Replace(" قط", "فقط")
$content = $content.Replace(" قط", "فقط")
$content = $content.Replace("أستاذة ?د? ?"" .تابعة", "أستاذة ندى — متابعة")
$content = $content.Replace("أستاذة ?د? ?"" .تابعة", "أستاذة ندى — متابعة")
$content = $content.Replace("<title>أستاذة ?د? ?"" .تابعة ا""ط""اب</title>", "<title>أستاذة ندى — متابعة الطلاب</title>")
$content = $content.Replace("<title>أستاذة ?د? ?"" .تابعة ا""ط""اب</title>", "<title>أستاذة ندى — متابعة الطلاب</title>")

[System.IO.File]::WriteAllText($path, $content, [System.Text.Encoding]::UTF8)
Write-Output "Replacements applied"
