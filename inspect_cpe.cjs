const fs = require('fs');
const file = 'd:/APLICATIVOS CRIADOS/AcheiaKi/cronagem/V.1.1.3.14.09.26/src/components/marketplace/CustomerProfileEditor.tsx';
let content = fs.readFileSync(file, 'utf8');

// Normaliza para LF
content = content.replace(/\r\n/g, '\n');

console.log('Has alert:', content.includes("alert('Cadastro incompleto"));
console.log('Has triggerToast already:', content.includes("triggerToast('Dados salvos com sucesso!'));"));

const lines = content.split('\n');
console.log('--- Lines 259-333 ---');
for (let i = 258; i < 334; i++) {
  process.stdout.write((i+1) + ': ' + lines[i] + '\n');
}
