$path = ".\src\context\AppContext.tsx"

$content = Get-Content $path -Raw

# ------------------------------------------------------------
# 1. Impede o Master de alterar password através de
#    updateUserByMaster()
# ------------------------------------------------------------

$old1 = @"
  const updateUserByMaster = (userId: string, updates: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = { ...u, ...updates, updatedAt: new Date().toISOString() };
          if (currentUser?.id === userId) {
            setCurrentUser(updated);
          }
          return updated;
        }
        return u;
      })
    );

    addAuditLog('MASTER_USER_UPDATE', `Administrador Master editou os dados do usuário ID ${userId}`);
    triggerToast('Cadastro de usuário atualizado com sucesso.');
  };
"@

$new1 = @"
  const updateUserByMaster = (userId: string, updates: Partial<User>) => {
    // SEGURANÇA:
    // Master/Admin pode editar dados administrativos do usuário,
    // mas NUNCA pode alterar ou fornecer uma senha de outro usuário.
    const { password: _blockedPassword, ...safeUpdates } = updates;

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const updated = {
            ...u,
            ...safeUpdates,
            updatedAt: new Date().toISOString()
          };

          if (currentUser?.id === userId) {
            setCurrentUser(updated);
          }

          return updated;
        }

        return u;
      })
    );

    addAuditLog(
      'MASTER_USER_UPDATE',
      `Administrador Master editou dados administrativos do usuário ID ${userId}. Alteração de senha bloqueada.`
    );

    triggerToast('Cadastro de usuário atualizado com sucesso. A senha não pode ser alterada pelo administrador.');
  };
"@

if (-not $content.Contains($old1)) {
    Write-Host "ERRO: updateUserByMaster não encontrado." -ForegroundColor Red
    exit 1
}

$content = $content.Replace($old1, $new1)

# ------------------------------------------------------------
# 2. Bloqueia definitivamente resetUserPasswordByMaster()
# ------------------------------------------------------------

$old2 = @"
  const resetUserPasswordByMaster = (userId: string): string => {
    const tempPass = `Macacu#${Math.floor(1000 + Math.random() * 9000)}`;
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          return { ...u, needsPasswordChange: true };
        }
        return u;
      })
    );
    addAuditLog('MASTER_PASSWORD_RESET', `Senha do usuário ID ${userId} resetada pelo Master. Nova provisória gerada.`);
    triggerToast(`Senha resetada! Nova senha provisória: ${tempPass}`);
    return tempPass;
  };
"@

$new2 = @"
  const resetUserPasswordByMaster = (userId: string): string => {
    // SEGURANÇA:
    // Administrador/Master NÃO pode resetar, gerar ou substituir
    // a senha de outro usuário.
    addAuditLog(
      'MASTER_PASSWORD_RESET_BLOCKED',
      `Tentativa bloqueada: Master tentou alterar a senha do usuário ID ${userId}.`
    );

    triggerToast(
      'Operação bloqueada. Somente o próprio usuário pode alterar sua senha.'
    );

    return '';
  };
"@

if (-not $content.Contains($old2)) {
    Write-Host "ERRO: resetUserPasswordByMaster não encontrado." -ForegroundColor Red
    exit 1
}

$content = $content.Replace($old2, $new2)

# ------------------------------------------------------------
# 3. Bloqueia troca de senha durante impersonação.
# ------------------------------------------------------------

$old3 = @"
  const updateUserPassword = (newPassword: string): boolean => {
    if (!currentUser) {
      return false;
    }
"@

$new3 = @"
  const updateUserPassword = (newPassword: string): boolean => {
    if (!currentUser) {
      return false;
    }

    // Segurança adicional: a função só pode ser usada pelo
    // usuário autenticado em sua própria sessão.
    if (sessionStorage.getItem('acheiaki_impersonating_user') === 'true') {
      addAuditLog(
        'PASSWORD_UPDATE_BLOCKED',
        `Tentativa de alteração de senha durante sessão de impersonação: ${currentUser.email}`
      );

      triggerToast(
        'Operação bloqueada. O administrador não pode alterar a senha de outro usuário.'
      );

      return false;
    }
"@

if (-not $content.Contains($old3)) {
    Write-Host "ERRO: updateUserPassword não encontrado." -ForegroundColor Red
    exit 1
}

$content = $content.Replace($old3, $new3)

# ------------------------------------------------------------
# 4. Marca a sessão quando Master usa impersonação.
# ------------------------------------------------------------

$old4 = @"
  const impersonateUser = (user: User) => {
    setCurrentUser(user);
    addAuditLog('MASTER_IMPERSONATE', `Master assumiu a sessão do usuário "${user.name}" (${user.role})`);
"@

$new4 = @"
  const impersonateUser = (user: User) => {
    sessionStorage.setItem('acheiaki_impersonating_user', 'true');
    setCurrentUser(user);
    addAuditLog('MASTER_IMPERSONATE', `Master assumiu a sessão do usuário "${user.name}" (${user.role})`);
"@

if (-not $content.Contains($old4)) {
    Write-Host "ERRO: impersonateUser não encontrado." -ForegroundColor Red
    exit 1
}

$content = $content.Replace($old4, $new4)

# ------------------------------------------------------------
# 5. Logout encerra também a marca de impersonação.
# ------------------------------------------------------------

$old5 = @"
  const logout = () => {
    if (currentUser) {
"@

$new5 = @"
  const logout = () => {
    sessionStorage.removeItem('acheiaki_impersonating_user');

    if (currentUser) {
"@

if (-not $content.Contains($old5)) {
    Write-Host "ERRO: logout não encontrado." -ForegroundColor Red
    exit 1
}

$content = $content.Replace($old5, $new5)

Set-Content -Path $path -Value $content -Encoding UTF8

Write-Host ""
Write-Host "=============================================" -ForegroundColor Green
Write-Host " SEGURANÇA DE SENHAS CORRIGIDA COM SUCESSO" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Master/Admin NÃO pode:" -ForegroundColor Yellow
Write-Host " - alterar senha de outro usuário"
Write-Host " - resetar senha de outro usuário"
Write-Host " - gerar senha provisória para outro usuário"
Write-Host " - alterar senha através de updateUserByMaster"
Write-Host " - alterar senha durante impersonação"
Write-Host ""
Write-Host "Somente o próprio usuário autenticado pode alterar sua senha." -ForegroundColor Cyan