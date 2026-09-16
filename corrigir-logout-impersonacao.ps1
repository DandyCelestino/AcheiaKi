$path = ".\src\context\AppContext.tsx"
$texto = Get-Content $path -Raw -Encoding UTF8

$alvo = @"
  const logout = () => {
    if (currentUser) {
"@

$substituto = @"
  const logout = () => {
    sessionStorage.removeItem('acheiaki_impersonating_user');

    if (currentUser) {
"@

if (-not $texto.Contains($alvo)) {
    Write-Host "ERRO: inicio da funcao logout nao encontrado." -ForegroundColor Red
    Read-Host "Pressione ENTER para fechar"
    exit 1
}

$texto = $texto.Replace($alvo, $substituto)

Set-Content $path $texto -Encoding UTF8

Write-Host ""
Write-Host "CORRECAO APLICADA: marcador de impersonacao removido no logout." -ForegroundColor Green
Write-Host ""

Read-Host "Pressione ENTER para fechar"