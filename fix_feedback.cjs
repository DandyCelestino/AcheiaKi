const fs = require('fs');
const file = 'd:/APLICATIVOS CRIADOS/AcheiaKi/cronagem/V.1.1.3.14.09.26/src/components/marketplace/CustomerProfileEditor.tsx';
let content = fs.readFileSync(file, 'utf8');

// Normaliza para LF
const wasCRLF = content.includes('\r\n');
content = content.replace(/\r\n/g, '\n');

// ====== HANDLER 1: handleSavePersonalInfo ======
const old1 = `  const handleSavePersonalInfo = async (e: React.FormEvent) => {
        e.preventDefault();
        /* VALIDACAO_CADASTRO_PESSOAL_20260926 */
    if (!name.trim()) {
      alert('Cadastro incompleto: informe seu nome completo para salvar.');
      return;
    }

    if (!email.trim()) {
      alert('Cadastro incompleto: informe seu e-mail.');
      return;
    }

    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email.trim())) {
      alert('E-mail inv?lido: corrija o endere?o de e-mail antes de salvar.');
      return;
    }

    if (!phone.trim()) {
      alert('Cadastro incompleto: informe seu telefone principal.');
      return;
    }

    if (phone.replace(/\\\\D/g, '').length < 10) {
      alert('Telefone inv?lido: informe um telefone com DDD v?lido.');
      return;
    }

    if (cpf.trim() && !isValidCustomerCpf(cpf.trim())) {
      alert('CPF inv?lido: confira o n?mero informado antes de salvar.');
      return;
    }

        if (!name.trim()) {
      alert('Por favor, informe seu nome completo.');
      return;
    }

    const emergencyContact: EmergencyContact | undefined =
      emergencyName.trim() || emergencyPhone.trim()
        ? {
            name: emergencyName.trim(),
            relationship: emergencyRel.trim() || 'Contato',
            phone: emergencyPhone.trim()
          }
        : undefined;

    let saved;
    try {
      saved = await updateUserProfile({
      name: name.trim(),
      nickname: nickname.trim() || undefined,
      email: email.trim(),
      phone: phone.trim(),
      secondaryPhone: secondaryPhone.trim() || undefined,
      cpf: cpf.trim() || undefined,
      birthDate: birthDate || undefined,
      gender: gender as any,
      avatar: avatar.trim(),
      generalNotes: generalNotes.trim() || undefined,
      emergencyContact
    });


    } catch (error) {
      console.error('Erro ao salvar dados pessoais:', error);
      alert('ERRO REAL AO SALVAR: ' + (error instanceof Error ? error.message : String(error)));
      return;
    }
    if (saved) {
      alert('Cadastro salvo com sucesso.');
    }
  };`;

const new1 = `  const handleSavePersonalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    /* VALIDACAO_CADASTRO_PESSOAL_20260926 */

    // Cenário 3 — Validação de campos obrigatórios
    if (!name.trim() || !email.trim() || !phone.trim()) {
      triggerToast('Preencha todos os campos obrigatórios.');
      return;
    }

    if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email.trim())) {
      triggerToast('E-mail inválido: corrija o endereço de e-mail antes de salvar.');
      return;
    }

    if (phone.replace(/\\D/g, '').length < 10) {
      triggerToast('Telefone inválido: informe um telefone com DDD válido.');
      return;
    }

    if (cpf.trim() && !isValidCustomerCpf(cpf.trim())) {
      triggerToast('CPF inválido: confira o número informado antes de salvar.');
      return;
    }

    const emergencyContact: EmergencyContact | undefined =
      emergencyName.trim() || emergencyPhone.trim()
        ? {
            name: emergencyName.trim(),
            relationship: emergencyRel.trim() || 'Contato',
            phone: emergencyPhone.trim()
          }
        : undefined;

    let saved;
    try {
      saved = await updateUserProfile({
        name: name.trim(),
        nickname: nickname.trim() || undefined,
        email: email.trim(),
        phone: phone.trim(),
        secondaryPhone: secondaryPhone.trim() || undefined,
        cpf: cpf.trim() || undefined,
        birthDate: birthDate || undefined,
        gender: gender as any,
        avatar: avatar.trim(),
        generalNotes: generalNotes.trim() || undefined,
        emergencyContact
      });
    } catch (error) {
      // Cenário 2 — Erro de gravação
      console.error('Erro ao salvar dados pessoais:', error);
      triggerToast('Erro ao salvar os dados. Tente novamente.');
      return;
    }

    // Cenário 1 — Sucesso
    if (saved) {
      triggerToast('Dados salvos com sucesso!');
    } else {
      triggerToast('Erro ao salvar os dados. Tente novamente.');
    }
  };`;

if (!content.includes(old1)) {
  console.error('ERRO: old1 não encontrado no arquivo!');
  process.exit(1);
}
content = content.replace(old1, new1);
console.log('Handler 1 (Personal) substituído com sucesso.');

// ====== HANDLER 2: handleSaveAddress ======
const old2 = `  const handleSaveAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        /* VALIDACAO_ENDERECO_CLIENTE_20260926 */
    if (!addressStreet.trim()) {
      alert('Endere?o incompleto: informe a rua ou logradouro.');
      return;
    }

    if (!addressNumber.trim()) {
      alert('Endere?o incompleto: informe o n?mero.');
      return;
    }

    if (!addressNeighborhood.trim()) {
      alert('Endere?o incompleto: informe o bairro.');
      return;
    }

    if (addressZip.trim() && addressZip.replace(/\\\\D/g, '').length !== 8) {
      alert('CEP inv?lido: informe um CEP com 8 n?meros.');
      return;
    }

        if (!addressStreet.trim() || !addressNumber.trim() || !addressNeighborhood.trim()) {
      alert('Por favor, preencha a rua, o número e o bairro.');
      return;
    }

    if (editingAddressId) {
      const saved = await updateCustomerAddress(editingAddressId, {
        label: addressLabel.trim() || 'Endereço',
        street: addressStreet.trim(),
        number: addressNumber.trim(),
        complement: addressComplement.trim() || undefined,
        neighborhood: addressNeighborhood.trim(),
        city: 'Cachoeiras de Macacu',
        state: 'RJ',
        zipCode: addressZip.trim() || '28680-000',
        referencePoint: addressRef.trim() || undefined,
        deliveryInstructions: addressInstructions.trim() || undefined,
        isDefault: addressIsDefault
      });
      if (!saved) {
        alert('Dados não salvos. Não foi possível atualizar o endereço.');
        return;
      }
      alert('Dados salvos com sucesso.');
    } else {
      await addCustomerAddress({
        label: addressLabel.trim() || 'Endereço',
        street: addressStreet.trim(),
        number: addressNumber.trim(),
        complement: addressComplement.trim() || undefined,
        neighborhood: addressNeighborhood.trim(),
        city: 'Cachoeiras de Macacu',
        state: 'RJ',
        zipCode: addressZip.trim() || '28680-000',
        referencePoint: addressRef.trim() || undefined,
        deliveryInstructions: addressInstructions.trim() || undefined,
        isDefault: addressIsDefault
      });
    }

    setIsAddressModalOpen(false);
  };`;

const new2 = `  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    /* VALIDACAO_ENDERECO_CLIENTE_20260926 */

    // Cenário 3 — Validação de campos obrigatórios
    if (!addressStreet.trim() || !addressNumber.trim() || !addressNeighborhood.trim()) {
      triggerToast('Preencha todos os campos obrigatórios.');
      return;
    }

    if (addressZip.trim() && addressZip.replace(/\\D/g, '').length !== 8) {
      triggerToast('CEP inválido: informe um CEP com 8 números.');
      return;
    }

    const addressData = {
      label: addressLabel.trim() || 'Endereço',
      street: addressStreet.trim(),
      number: addressNumber.trim(),
      complement: addressComplement.trim() || undefined,
      neighborhood: addressNeighborhood.trim(),
      city: 'Cachoeiras de Macacu',
      state: 'RJ',
      zipCode: addressZip.trim() || '28680-000',
      referencePoint: addressRef.trim() || undefined,
      deliveryInstructions: addressInstructions.trim() || undefined,
      isDefault: addressIsDefault
    };

    if (editingAddressId) {
      const saved = await updateCustomerAddress(editingAddressId, addressData);
      // Cenário 2 — Erro / Cenário 1 — Sucesso
      if (!saved) {
        triggerToast('Erro ao salvar os dados. Tente novamente.');
        return;
      }
      triggerToast('Dados salvos com sucesso!');
    } else {
      try {
        await addCustomerAddress(addressData);
        // Cenário 1 — Sucesso
        triggerToast('Dados salvos com sucesso!');
      } catch (error) {
        // Cenário 2 — Erro
        console.error('Erro ao adicionar endereço:', error);
        triggerToast('Erro ao salvar os dados. Tente novamente.');
        return;
      }
    }

    setIsAddressModalOpen(false);
  };`;

if (!content.includes(old2)) {
  console.error('ERRO: old2 não encontrado! Exibindo trecho próximo...');
  const idx = content.indexOf('handleSaveAddress');
  console.log(content.substring(idx, idx + 300));
  process.exit(1);
}
content = content.replace(old2, new2);
console.log('Handler 2 (Address) substituído com sucesso.');

// ====== HANDLER 3: handleSaveVip ======
const old3 = `  const handleSaveVip = async (e: React.FormEvent) => {
        e.preventDefault();
        /* VALIDACAO_MEDIDAS_VIP_20260926 */
    if (!topSize.trim()) {
      alert('Ficha VIP incompleta: informe sua numera??o de parte superior.');
      return;
    }

    if (!bottomSize.trim()) {
      alert('Ficha VIP incompleta: informe sua numera??o de parte inferior.');
      return;
    }

    if (!shoeSize.trim()) {
      alert('Ficha VIP incompleta: informe seu n?mero de cal?ado.');
      return;
    }

        const favColors = favoriteColorsInput`;

const new3 = `  const handleSaveVip = async (e: React.FormEvent) => {
    e.preventDefault();
    /* VALIDACAO_MEDIDAS_VIP_20260926 */

    // Cenário 3 — Validação de campos obrigatórios
    if (!topSize.trim() || !bottomSize.trim() || !shoeSize.trim()) {
      triggerToast('Preencha todos os campos obrigatórios.');
      return;
    }

        const favColors = favoriteColorsInput`;

if (!content.includes(old3)) {
  console.error('ERRO: old3 não encontrado!');
  process.exit(1);
}
content = content.replace(old3, new3);
console.log('Handler 3 (VIP) substituído com sucesso.');

// ====== HANDLER 3b: VIP - success/error ======
const old3b = `    const saved = await updateVipMeasurements(measurements);
    if (!saved) {
      alert('Dados não salvos. Não foi possível salvar a ficha de medidas.');
      return;
    }
    alert('Dados salvos com sucesso.');
  };

  const toggleStyleSelection`;

const new3b = `    const saved = await updateVipMeasurements(measurements);
    // Cenário 2 — Erro / Cenário 1 — Sucesso
    if (!saved) {
      triggerToast('Erro ao salvar os dados. Tente novamente.');
      return;
    }
    triggerToast('Dados salvos com sucesso!');
  };

  const toggleStyleSelection`;

if (!content.includes(old3b)) {
  console.error('ERRO: old3b não encontrado!');
  process.exit(1);
}
content = content.replace(old3b, new3b);
console.log('Handler 3b (VIP success/error) substituído com sucesso.');

// ====== HANDLER 4: handleSavePreferences ======
const old4 = `  const handleSavePreferences = async (e: React.FormEvent) => {
        e.preventDefault();
        /* VALIDACAO_PREFERENCIAS_CLIENTE_20260926 */
    if (!preferredModality) {
      alert('Prefer?ncias incompletas: selecione sua modalidade de prefer?ncia antes de salvar.');
      return;
    }

        const prefs: CustomerPreferences = {
      ...(currentUser?.preferences || {}),
      receiveWhatsApp,
      receiveEmail,
      receiveSms,
      receivePromoAlerts,
      preferredModality,
      dietaryRestrictions: dietaryRestrictions.trim() || '',
      notificationChannels: currentUser?.preferences?.notificationChannels || currentUser?.notificationPreferences
    };

    const saved = await updateCustomerPreferences(prefs);
    if (!saved) {
      alert('Dados não salvos. Não foi possível salvar as preferências.');
      return;
    }
    alert('Dados salvos com sucesso.');
  };`;

const new4 = `  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    /* VALIDACAO_PREFERENCIAS_CLIENTE_20260926 */

    // Cenário 3 — Validação de campos obrigatórios
    if (!preferredModality) {
      triggerToast('Preencha todos os campos obrigatórios.');
      return;
    }

    const prefs: CustomerPreferences = {
      ...(currentUser?.preferences || {}),
      receiveWhatsApp,
      receiveEmail,
      receiveSms,
      receivePromoAlerts,
      preferredModality,
      dietaryRestrictions: dietaryRestrictions.trim() || '',
      notificationChannels: currentUser?.preferences?.notificationChannels || currentUser?.notificationPreferences
    };

    const saved = await updateCustomerPreferences(prefs);
    // Cenário 2 — Erro / Cenário 1 — Sucesso
    if (!saved) {
      triggerToast('Erro ao salvar os dados. Tente novamente.');
      return;
    }
    triggerToast('Dados salvos com sucesso!');
  };`;

if (!content.includes(old4)) {
  console.error('ERRO: old4 não encontrado!');
  process.exit(1);
}
content = content.replace(old4, new4);
console.log('Handler 4 (Preferences) substituído com sucesso.');

// ====== HANDLER 5: handleUpdatePassword ======
const old5 = `  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      alert('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('As senhas digitadas não coincidem.');
      return;
    }

    const passwordResult = await updateUserPassword(newPassword);

    if (!passwordResult.success) {
      alert(passwordResult.message || 'Nao foi possivel alterar a senha.');
      return;
    }
    setNewPassword('');
    setConfirmPassword('');
  };`;

const new5 = `  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Cenário 3 — Validação de campos obrigatórios
    if (!newPassword || !confirmPassword) {
      triggerToast('Preencha todos os campos obrigatórios.');
      return;
    }
    if (newPassword.length < 6) {
      triggerToast('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      triggerToast('As senhas digitadas não coincidem.');
      return;
    }

    const passwordResult = await updateUserPassword(newPassword);

    // Cenário 2 — Erro / Cenário 1 — Sucesso
    if (!passwordResult.success) {
      triggerToast(passwordResult.message || 'Erro ao salvar os dados. Tente novamente.');
      return;
    }
    triggerToast('Dados salvos com sucesso!');
    setNewPassword('');
    setConfirmPassword('');
  };`;

if (!content.includes(old5)) {
  console.error('ERRO: old5 não encontrado!');
  process.exit(1);
}
content = content.replace(old5, new5);
console.log('Handler 5 (Password) substituído com sucesso.');

// Restaura CRLF se o arquivo original tinha
if (wasCRLF) {
  content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync(file, content, 'utf8');
console.log('\n✅ Arquivo salvo com sucesso! Todos os alert() foram substituídos por triggerToast().');
