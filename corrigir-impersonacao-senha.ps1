$path = ".\src\context\AppContext.tsx"
$lines = Get-Content $path -Encoding UTF8

$start = -1
$end = -1

for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "const impersonateUser =") {
        $start = $i
        break
    }
}

if ($start -lt 0) {
    Write-Host "ERRO: funcao impersonateUser nao encontrada." -ForegroundColor Red
    Read-Host "Pressione ENTER para fechar"
    exit 1
}

for ($i = $start; $i -lt $lines.Count; $i++) {
    if ($i -gt $start -and $lines[$i] -match "^\s*\};\s*$") {
        $end = $i
        break
    }
}

if ($end -lt 0) {
    Write-Host "ERRO: final da funcao nao encontrado." -ForegroundColor Red
    Read-Host "Pressione ENTER para fechar"
    exit 1
}

$newFunction = @(
'  const impersonateUser = (user: User) => {'
"    sessionStorage.setItem('acheiaki_impersonating_user', 'true');"
'    setCurrentUser(user);'
'    addAuditLog(''MASTER_IMPERSONATE'', `Master assumiu a sessão do usuário "${user.name}" (${user.role})`);'
"    if (user.role === 'CLIENTE') {"
"      setCurrentEnvironment('MARKETPLACE');"
"    } else if (user.role === 'VENDEDOR') {"
"      setCurrentEnvironment('SELLER_PORTAL');"
"    } else if (user.role === 'MASTER') {"
"      setCurrentEnvironment('MASTER_PANEL');"
'    }'
'    triggerToast(`Navegando como: ${user.name} (${user.role})`);'
'  };'
)

$before = if ($start -gt 0) { $lines[0..($start - 1)] } else { @() }
$after = if ($end + 1 -lt $lines.Count) { $lines[($end + 1)..($lines.Count - 1)] } else { @() }

$result = @($before) + $newFunction + @($after)

Set-Content $path $result -Encoding UTF8

Write-Host ""
Write-Host "CORRECAO APLICADA: funcao impersonateUser restaurada e protegida." -ForegroundColor Green
Write-Host ""

Read-Host "Pressione ENTER para fechar"