# ─── Oh My Posh ───────────────────────────────────────────────────────────────
$env:PATH += ";C:\Users\ejuqu\AppData\Local\Programs\oh-my-posh\bin"
oh-my-posh init pwsh --config "$env:POSH_THEMES_PATH\robbyrussell.omp.json" | Invoke-Expression

# ─── Zoxide (smart cd) ────────────────────────────────────────────────────────
Invoke-Expression (& { (zoxide init powershell | Out-String) })

# ─── Better aliases ───────────────────────────────────────────────────────────
Set-Alias cat bat
Set-Alias ls eza
Set-Alias grep rg

# ─── Git delta ────────────────────────────────────────────────────────────────
$env:GIT_PAGER = "delta"

# ─── Autocomplétion comme Mac/Zsh ─────────────────────────────────────────────
Set-PSReadLineOption -PredictionSource History
Set-PSReadLineOption -PredictionViewStyle ListView
Set-PSReadLineKeyHandler -Key Tab -Function MenuComplete
Set-PSReadLineKeyHandler -Key UpArrow -Function HistorySearchBackward
Set-PSReadLineKeyHandler -Key DownArrow -Function HistorySearchForward

# ─── fzf history search (Ctrl+R) ──────────────────────────────────────────────
Set-PSReadLineKeyHandler -Key ctrl+r -ScriptBlock {
    $command = Get-Content (Get-PSReadlineOption).HistorySavePath | fzf
    if ($command) { [Microsoft.PowerShell.PSConsoleReadLine]::Insert($command) }
}

# ─── cd - pour revenir au dossier précédent ───────────────────────────────────
$global:OLDPWD = $PWD
function Set-LocationWithHistory {
    param($Path)
    $global:OLDPWD = $PWD
    Set-Location $Path
}
Set-Alias -Name cd -Value Set-LocationWithHistory -Force -Option AllScope
function cd- { Set-Location $global:OLDPWD }

# ─── Mac-like commands ────────────────────────────────────────────────────────
function open { explorer $args }
function pbcopy { $input | clip }
function pbpaste { Get-Clipboard }
function touch { New-Item -ItemType File $args }
function which { Get-Command $args | Select-Object -ExpandProperty Source }

$env:BROWSER = "C:\Program Files\Google\Chrome\Application\chrome.exe"