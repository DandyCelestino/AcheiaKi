$path = ".\src\context\AppContext.tsx"

$lines = Get-Content $path -Encoding UTF8

$start = -1
$end = -1

for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "const resetUserPasswordByMaster =") {
        $start = $i
        break
    }
}

if ($start -lt 0) {
    Write-Host "ERRO: funcao resetUserPasswordByMaster nao encontrada." -ForegroundColor Red
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
"  const resetUserPasswordByMaster = (userId: string): string => {"
"    addAuditLog("
"      'MASTER_PASSWORD_RESET_BLOCKED',"
"      `"Tentativa bloqueada: o Master nao pode alterar ou resetar a senha do usuario ID `${userId}.`","
"      {"
"        entityType: 'USER',"
"        entityId: userId"
"      }"
"    );"
""
"    triggerToast('Operacao bloqueada. Somente o proprio usuario pode alterar ou redefinir sua senha.');"
""
"    return '';"
"  };"
)

$before = if ($start -gt 0) { $lines[0..($start - 1)] } else { @() }
$after = if ($end + 1 -lt $lines.Count) { $lines[($end + 1)..($lines.Count - 1)] } else { @() }

$result = @($before) + $newFunction + @($after)

Set-Content $path $result -Encoding UTF8

Write-Host ""
Write-Host "CORRECAO APLICADA COM SUCESSO." -ForegroundColor Green
Write-Host "resetUserPasswordByMaster agora esta bloqueada." -ForegroundColor Green
Write-Host ""

Read-Host "Pressione ENTER para fechar"