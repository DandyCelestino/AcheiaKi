$path = ".\src\context\AppContext.tsx"
$texto = Get-Content $path -Raw -Encoding UTF8

$alvo = @"
  const updateUserPassword = (newPassword: string): boolean => {
    if (!currentUser) {
      return false;
    }
"@

$substituto = @"
  const updateUserPassword = (newPassword: string): boolean => {
    if (!currentUser) {
      return false;
    }

    if (sessionStorage.getItem('acheiaki_impersonating_user') === 'true') {
      addAuditLog(
        'PASSWORD_UPDATE_BLOCKED',
        'Tentativa bloqueada: alteração de senha durante impersonação administrativa.',
        {
          entityType: 'USER',
          entityId: currentUser.id
        }
      );
      triggerToast('Operação bloqueada. O administrador não pode alterar a senha de outro usuário.');
      return false;
    }
"@

if (-not $texto.Contains($alvo)) {
    Write-Host "ERRO: trecho de updateUserPassword nao encontrado." -ForegroundColor Red
    Read-Host "Pressione ENTER para fechar"
    exit 1
}

$texto = $texto.Replace($alvo, $substituto)

Set-Content $path $texto -Encoding UTF8

Write-Host ""
Write-Host "CORRECAO APLICADA: alteracao de senha bloqueada durante impersonacao." -ForegroundColor Green
Write-Host ""

Read-Host "Pressione ENTER para fechar"