$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [Environment]::GetFolderPath("Desktop")
$ShortcutPath = Join-Path $DesktopPath "Bumble Simulator.lnk"
$TargetDir = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $TargetDir) { $TargetDir = "D:\TANGAISIM" }

$Shortcut = $WshShell.CreateShortcut($ShortcutPath)
if (Test-Path "$TargetDir\BumbleSimulator.exe") {
    $Shortcut.TargetPath = "$TargetDir\BumbleSimulator.exe"
} elseif (Test-Path "$TargetDir\dist\BumbleSimulator.exe") {
    $Shortcut.TargetPath = "$TargetDir\dist\BumbleSimulator.exe"
} else {
    $Shortcut.TargetPath = "$TargetDir\Chay_Bumble_Sim.bat"
}
$Shortcut.WorkingDirectory = $TargetDir
$Shortcut.Description = "Bumble Dating Simulator - TANGAISIM (Cinema View 9:16)"
$Shortcut.Save()

Write-Host "✅ Đã tạo shortcut 'Bumble Simulator' ra màn hình Desktop thành công!" -ForegroundColor Green
