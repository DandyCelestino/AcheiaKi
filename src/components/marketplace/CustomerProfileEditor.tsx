import React, { useState, useEffect } from 'react';
import {
  User,
  MapPin,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Phone,
  Mail,
  Bell,
  Shield,
  KeyRound,
  FileText,
  Shirt,
  Sparkles,
  Save,
  Clock,
  Heart,
  Home,
  Briefcase,
  Navigation,
  Check,
  X,
  Lock,
  Download,
  Eye,
  EyeOff,
  Camera
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CustomerAddress, VipMeasurements, CustomerPreferences, EmergencyContact } from '../../types';
import { ImageUploadDropzone } from '../common/ImageUploadDropzone';

// Bairros reconhecidos de Cachoeiras de Macacu - RJ
export const MACACU_NEIGHBORHOODS = [
  'Centro',
  'CastÃ¡lia',
  'Papucaia',
  'JapuÃ­ba',
  'GuapiaÃ§u',
  'Funchal',
  'Boa Vista',
  'Gangazes',
  'Ribeira',
  'ValÃ©rio',
  'Boca do Mato',
  'Agulhas',
  'Vila Macuco',
  'Parque Santo AntÃ´nio',
  'Campo do Prado',
  'Santa Dalila',
  'SÃ£o Francisco de Assis',
  'Outro Bairro'
];

const PREDEFINED_AVATARS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
];

const STYLE_OPTIONS = [
  'Casual',
  'Casual Elegante',
  'Social / Alfaiataria',
  'Esportivo / Fitness',
  'Moda Praia',
  'Streetwear',
  'RomÃ¢ntico / Boho',
  'Minimalista'
];

export const CustomerProfileEditor: React.FC = () => {
  const {
    currentUser,
    updateUserProfile,
    addCustomerAddress,
    updateCustomerAddress,
    deleteCustomerAddress,
    setDefaultCustomerAddress,
    updateVipMeasurements,
    updateCustomerPreferences,
    updateUserPassword,
    toggleTwoFactor,
    resendEmailConfirmation,
    triggerToast
  } = useApp();

  const [activeSection, setActiveSection] = useState<'personal' | 'addresses' | 'vip' | 'preferences' | 'security'>('personal');

  // Personal Info Form State
  const [name, setName] = useState(currentUser?.name || '');
  const [nickname, setNickname] = useState(currentUser?.nickname || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [secondaryPhone, setSecondaryPhone] = useState(currentUser?.secondaryPhone || '');
  const [cpf, setCpf] = useState(currentUser?.cpf || '');
  const [birthDate, setBirthDate] = useState(currentUser?.birthDate || '');
  const [gender, setGender] = useState(currentUser?.gender || 'Prefiro nÃ£o informar');
  const [avatar, setAvatar] = useState(currentUser?.avatar || '');
  const [generalNotes, setGeneralNotes] = useState(currentUser?.generalNotes || '');
  const [emergencyName, setEmergencyName] = useState(currentUser?.emergencyContact?.name || '');
  const [emergencyRel, setEmergencyRel] = useState(currentUser?.emergencyContact?.relationship || '');
  const [emergencyPhone, setEmergencyPhone] = useState(currentUser?.emergencyContact?.phone || '');

  // Address Modal/Form State
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressLabel, setAddressLabel] = useState('Casa');
  const [addressStreet, setAddressStreet] = useState('');
  const [addressNumber, setAddressNumber] = useState('');
  const [addressComplement, setAddressComplement] = useState('');
  const [addressNeighborhood, setAddressNeighborhood] = useState('Centro');
  const [addressZip, setAddressZip] = useState('28680-000');
  const [addressRef, setAddressRef] = useState('');
  const [addressInstructions, setAddressInstructions] = useState('');
  const [addressIsDefault, setAddressIsDefault] = useState(false);

  // VIP Measurements Form State
  const [topSize, setTopSize] = useState(currentUser?.measurements?.topSize || 'M');
  const [bottomSize, setBottomSize] = useState(currentUser?.measurements?.bottomSize || '38');
  const [shoeSize, setShoeSize] = useState(currentUser?.measurements?.shoeSize || '37');
  const [height, setHeight] = useState(currentUser?.measurements?.height || '');
  const [weight, setWeight] = useState(currentUser?.measurements?.weight || '');
  const [preferredFit, setPreferredFit] = useState<'Ajustado' | 'Normal' | 'Solto' | 'Oversized'>(
    currentUser?.measurements?.preferredFit || 'Normal'
  );
  const [selectedStyles, setSelectedStyles] = useState<string[]>(
    currentUser?.measurements?.stylePreferences || ['Casual']
  );
  const [favoriteColorsInput, setFavoriteColorsInput] = useState(
    (currentUser?.measurements?.favoriteColors || []).join(', ')
  );
  const [avoidColorsInput, setAvoidColorsInput] = useState(
    (currentUser?.measurements?.avoidColors || []).join(', ')
  );
  const [fitNotes, setFitNotes] = useState(currentUser?.measurements?.fitNotes || '');

  // Preferences State
  const [receiveWhatsApp, setReceiveWhatsApp] = useState(
    currentUser?.preferences?.receiveWhatsApp ?? true
  );
  const [receiveEmail, setReceiveEmail] = useState(
    currentUser?.preferences?.receiveEmail ?? true
  );
  const [receiveSms, setReceiveSms] = useState(
    currentUser?.preferences?.receiveSms ?? true
  );
  const [receivePromoAlerts, setReceivePromoAlerts] = useState(
    currentUser?.preferences?.receivePromoAlerts ?? true
  );
  const [preferredModality, setPreferredModality] = useState<'DELIVERY' | 'RETIRADA' | 'EXPERIMENTAÃƒâ€¡ÃƒÆ’O'>(
    currentUser?.preferences?.preferredModality || 'DELIVERY'
  );
  const [dietaryRestrictions, setDietaryRestrictions] = useState(
    currentUser?.preferences?.dietaryRestrictions || ''
  );

  // Password Change State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Synchronize state if currentUser updates externally
  useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setNickname(currentUser.nickname || '');
      setEmail(currentUser.email || '');
      setPhone(currentUser.phone || '');
      setSecondaryPhone(currentUser.secondaryPhone || '');
      setCpf(currentUser.cpf || '');
      setBirthDate(currentUser.birthDate || '');
      setGender(currentUser.gender || 'Prefiro nÃ£o informar');
      setAvatar(currentUser.avatar || '');
      setGeneralNotes(currentUser.generalNotes || '');
      setEmergencyName(currentUser.emergencyContact?.name || '');
      setEmergencyRel(currentUser.emergencyContact?.relationship || '');
      setEmergencyPhone(currentUser.emergencyContact?.phone || '');

      if (currentUser.measurements) {
        setTopSize(currentUser.measurements.topSize || 'M');
        setBottomSize(currentUser.measurements.bottomSize || '38');
        setShoeSize(currentUser.measurements.shoeSize || '37');
        setHeight(currentUser.measurements.height || '');
        setWeight(currentUser.measurements.weight || '');
        setPreferredFit(currentUser.measurements.preferredFit || 'Normal');
        setSelectedStyles(currentUser.measurements.stylePreferences || ['Casual']);
        setFavoriteColorsInput((currentUser.measurements.favoriteColors || []).join(', '));
        setAvoidColorsInput((currentUser.measurements.avoidColors || []).join(', '));
        setFitNotes(currentUser.measurements.fitNotes || '');
      }

      if (currentUser.preferences) {
        setReceiveWhatsApp(currentUser.preferences.receiveWhatsApp ?? true);
        setReceiveEmail(currentUser.preferences.receiveEmail ?? true);
        setReceiveSms(currentUser.preferences.receiveSms ?? true);
        setReceivePromoAlerts(currentUser.preferences.receivePromoAlerts ?? true);
        setPreferredModality(currentUser.preferences.preferredModality || 'DELIVERY');
        setDietaryRestrictions(currentUser.preferences.dietaryRestrictions || '');
      }
    }
  }, [currentUser]);

  if (!currentUser) return null;

  // Calculate profile completeness score
  const calculateCompleteness = () => {
    let score = 0;
    const totalPoints = 8;

    if (currentUser.name) score += 1;
    if (currentUser.email) score += 1;
    if (currentUser.phone) score += 1;
    if (currentUser.cpf) score += 1;
    if (currentUser.birthDate) score += 1;
    if (currentUser.addresses && currentUser.addresses.length > 0) score += 1;
    if (currentUser.measurements?.topSize) score += 1;
    if (currentUser.avatar) score += 1;

    return Math.round((score / totalPoints) * 100);
  };

  const completeness = calculateCompleteness();

  // Handlers
  const isValidCustomerCpf = (value: string): boolean => {
    const cpf = value.replace(/\\D/g, '');

    if (!cpf) return true;
    if (cpf.length !== 11) return false;
    if (/^(\\d)\\1{10}$/.test(cpf)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += Number(cpf.charAt(i)) * (10 - i);
    }

    let digit = (sum * 10) % 11;
    if (digit === 10) digit = 0;
    if (digit !== Number(cpf.charAt(9))) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += Number(cpf.charAt(i)) * (11 - i);
    }

    digit = (sum * 10) % 11;
    if (digit === 10) digit = 0;

    return digit === Number(cpf.charAt(10));
  };

  const handleSavePersonalInfo = async (e: React.FormEvent) => {
        e.preventDefault();
        /* VALIDACAO_CADASTRO_PESSOAL_20260926 */
    if (!name.trim()) {
      alert('Cadastro incompleto: informe seu nome completo para salvar.');
      return;
    }

    if (!avatar.trim() || !avatar.trim().startsWith('data:image/')) {
      alert('Cadastro incompleto: envie uma foto de perfil v?lida para salvar.');
      return;
    }

    if (!email.trim()) {
      alert('Cadastro incompleto: informe seu e-mail.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      alert('E-mail inv?lido: corrija o endere?o de e-mail antes de salvar.');
      return;
    }

    if (!phone.trim()) {
      alert('Cadastro incompleto: informe seu telefone principal.');
      return;
    }

    if (phone.replace(/\\D/g, '').length < 10) {
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

    if (!avatar.trim() || !avatar.trim().startsWith('data:image/')) {
      alert('A foto de perfil Ã© obrigatÃ³ria. Envie uma foto real pelo computador ou pela cÃ¢mera do smartphone.');
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

    const saved = await updateUserProfile({
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

    if (saved) {
      alert('Cadastro salvo com sucesso.');
    }
  };

  const handleOpenNewAddressModal = () => {
    setEditingAddressId(null);
    setAddressLabel('Casa');
    setAddressStreet('');
    setAddressNumber('');
    setAddressComplement('');
    setAddressNeighborhood('Centro');
    setAddressZip('28680-000');
    setAddressRef('');
    setAddressInstructions('');
    setAddressIsDefault((currentUser.addresses?.length || 0) === 0);
    setIsAddressModalOpen(true);
  };

  const handleEditAddress = (addr: CustomerAddress) => {
    setEditingAddressId(addr.id);
    setAddressLabel(addr.label);
    setAddressStreet(addr.street);
    setAddressNumber(addr.number);
    setAddressComplement(addr.complement || '');
    setAddressNeighborhood(addr.neighborhood);
    setAddressZip(addr.zipCode || '28680-000');
    setAddressRef(addr.referencePoint || '');
    setAddressInstructions(addr.deliveryInstructions || '');
    setAddressIsDefault(addr.isDefault || false);
    setIsAddressModalOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
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

    if (addressZip.trim() && addressZip.replace(/\\D/g, '').length !== 8) {
      alert('CEP inv?lido: informe um CEP com 8 n?meros.');
      return;
    }

        if (!addressStreet.trim() || !addressNumber.trim() || !addressNeighborhood.trim()) {
      alert('Por favor, preencha a rua, o nÃºmero e o bairro.');
      return;
    }

    if (editingAddressId) {
      const saved = await updateCustomerAddress(editingAddressId, {
        label: addressLabel.trim() || 'EndereÃ§o',
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
        label: addressLabel.trim() || 'EndereÃ§o',
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
  };

  const handleSaveVip = async (e: React.FormEvent) => {
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

        const favColors = favoriteColorsInput
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const avoidColors = avoidColorsInput
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean);

    const measurements: VipMeasurements = {
      topSize,
      bottomSize,
      shoeSize,
      height: height.trim() || undefined,
      weight: weight.trim() || undefined,
      preferredFit,
      stylePreferences: selectedStyles,
      favoriteColors: favColors,
      avoidColors: avoidColors,
      fitNotes: fitNotes.trim() || undefined
    };

    const saved = await updateVipMeasurements(measurements);
    if (!saved) {
      alert('Dados não salvos. Não foi possível salvar a ficha de medidas.');
      return;
    }
    alert('Dados salvos com sucesso.');
  };

  const toggleStyleSelection = (styleName: string) => {
    setSelectedStyles((prev) =>
      prev.includes(styleName) ? prev.filter((s) => s !== styleName) : [...prev, styleName]
    );
  };

  const handleSavePreferences = async (e: React.FormEvent) => {
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
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      alert('A nova senha deve ter no mÃ­nimo 6 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('As senhas digitadas nÃ£o coincidem.');
      return;
    }

    const passwordResult = await updateUserPassword(newPassword);

    if (!passwordResult.success) {
      alert(passwordResult.message || 'Nao foi possivel alterar a senha.');
      return;
    }
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleExportData = () => {
    const dataStr = JSON.stringify(currentUser, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ficha-cadastral-${currentUser.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast('Download da sua ficha cadastral concluÃ­do!');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header with completeness badge */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 p-6 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="flex items-center space-x-4">
          <div className="relative group">
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                referrerPolicy="no-referrer"
                className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-400 shadow-md"
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-blue-600 text-white font-black text-3xl flex items-center justify-center border-2 border-blue-400">
                {name.charAt(0)}
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-full border-2 border-slate-900 text-white" title="Conta Verificada">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>

          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-black text-white">{name}</h2>
              {nickname && (
                <span className="text-xs bg-blue-500/30 text-blue-200 px-2 py-0.5 rounded-full font-medium">
                  ({nickname})
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              {email} Ã¢â‚¬Â¢ {phone}
            </p>
            <p className="text-[11px] text-blue-300 mt-1 flex items-center">
              <MapPin className="w-3.5 h-3.5 mr-1" />
              Cachoeiras de Macacu, RJ Ã¢â‚¬Â¢ Cliente cadastrado desde {(typeof currentUser.createdAt === 'string' ? currentUser.createdAt.split('T')[0] : currentUser.createdAt?.toDate ? currentUser.createdAt.toDate().toISOString().split('T')[0] : '') || '2026'}
            </p>
          </div>
        </div>

        {/* Completeness Bar */}
        <div className="bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/10 max-w-xs w-full">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-bold text-blue-200">Completude da Ficha:</span>
            <span className="font-black text-white">{completeness}%</span>
          </div>
          <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${completeness}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-300 mt-1.5">
            {completeness === 100
              ? 'Ã¢Å“Â¨ Sua ficha cadastral estÃ¡ 100% preenchida!'
              : 'Preencha seus dados de medidas e endereÃ§os para pedidos mais rÃ¡pidos.'}
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-200 bg-slate-50/70 p-2 gap-1.5 scrollbar-none text-xs font-bold">
        <button type="button"
          onClick={() => setActiveSection('personal')}
          className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center space-x-2 ${
            activeSection === 'personal'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Dados Pessoais & Contatos</span>
        </button>

        <button type="button"
          onClick={() => setActiveSection('addresses')}
          className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center space-x-2 ${
            activeSection === 'addresses'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Meus EndereÃ§os ({currentUser.addresses?.length || 0})</span>
        </button>

        <button type="button"
          onClick={() => setActiveSection('vip')}
          className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center space-x-2 ${
            activeSection === 'vip'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          <Shirt className="w-4 h-4" />
          <span>Provador VIP & Medidas</span>
        </button>

        <button type="button"
          onClick={() => setActiveSection('preferences')}
          className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center space-x-2 ${
            activeSection === 'preferences'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>PreferÃªncias & NotificaÃ§Ãµes</span>
        </button>

        <button type="button"
          onClick={() => setActiveSection('security')}
          className={`px-4 py-2.5 rounded-xl transition-all whitespace-nowrap flex items-center space-x-2 ${
            activeSection === 'security'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-200/60'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>SeguranÃ§a & LGPD</span>
        </button>
      </div>

      {/* SECTION 1: PERSONAL INFO */}
      {activeSection === 'personal' && (
        <form onSubmit={handleSavePersonalInfo} className="p-6 space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900">Dados Principais do Cliente</h3>
            <p className="text-xs text-slate-500">
              Modifique seus dados cadastrais. Essas informaÃ§Ãµes garantem a entrega precisa e comunicaÃ§Ã£o rÃ¡pida com os lojistas de Cachoeiras de Macacu.
            </p>
          </div>

          {/* Photo / Avatar Upload */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
            <div>
              <ImageUploadDropzone
                multiple={false}
                aspectRatio="circle"
                value={avatar}
                onChange={(img) => setAvatar(img as string)}
                label="Sua Foto de Perfil (Computador ou CÃ¢mera do Smartphone)"
                helperText="Envie uma foto do seu computador ou tire uma selfie com a cÃ¢mera do celular"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                placeholder="Ex: Mariana da Silva Ramos"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Como prefere ser chamado(a)?</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                placeholder="Ex: Mari, Carol, Beto"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">CPF / Documento</label>
              <input
                type="text"
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                placeholder="000.000.000-00"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">E-mail Principal *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                placeholder="seuemail@provedor.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp / Telefone Principal *</label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                placeholder="(21) 98765-4321"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Telefone SecundÃ¡rio / Recados</label>
              <input
                type="tel"
                value={secondaryPhone}
                onChange={(e) => setSecondaryPhone(e.target.value)}
                className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                placeholder="(21) 97777-6655"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Data de Nascimento</label>
              <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">GÃªnero / IdentificaÃ§Ã£o</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="Feminino">Feminino</option>
                <option value="Masculino">Masculino</option>
                <option value="NÃ£o-binÃ¡rio">NÃ£o-binÃ¡rio</option>
                <option value="Outro">Outro</option>
                <option value="Prefiro nÃ£o informar">Prefiro nÃ£o informar</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cidade Base</label>
              <input
                type="text"
                disabled
                value="Cachoeiras de Macacu, RJ"
                className="w-full px-3 py-2.5 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-bold"
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100 space-y-3">
            <h4 className="text-xs font-black text-blue-950 flex items-center">
              <Shield className="w-4 h-4 mr-1.5 text-blue-600" />
              Contato de EmergÃªncia / Autorizado para Retirada de Pedidos
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Nome do Contato</label>
                <input
                  type="text"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  placeholder="Ex: Carlos Silva"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Parentesco / RelaÃ§Ã£o</label>
                <input
                  type="text"
                  value={emergencyRel}
                  onChange={(e) => setEmergencyRel(e.target.value)}
                  placeholder="Ex: IrmÃ£o, CÃ´njuge, Vizinho"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">Telefone do Contato</label>
                <input
                  type="tel"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="(21) 98888-2233"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">ObservaÃ§Ãµes Gerais da Conta</label>
            <textarea
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
              placeholder="Ex: HorÃ¡rios preferenciais para contato, instruÃ§Ãµes fixas..."
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Dados Pessoais</span>
            </button>
          </div>
        </form>
      )}

      {/* SECTION 2: ADDRESSES */}
      {activeSection === 'addresses' && (
        <div className="p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900">Meus EndereÃ§os em Cachoeiras de Macacu</h3>
              <p className="text-xs text-slate-500">
                Acrescente, edite ou modifique mÃºltiplos endereÃ§os para entregas rÃ¡pidas ou recolhimento de malas do Provador VIP.
              </p>
            </div>
            <button type="button"
              onClick={handleOpenNewAddressModal}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center space-x-1.5 self-start"
            >
              <Plus className="w-4 h-4" />
              <span>Acrescentar Novo EndereÃ§o</span>
            </button>
          </div>

          {/* Addresses Grid */}
          {(!currentUser.addresses || currentUser.addresses.length === 0) ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 space-y-3">
              <MapPin className="w-12 h-12 text-slate-300 mx-auto" />
              <h4 className="text-sm font-bold text-slate-700">Nenhum endereÃ§o cadastrado ainda</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Cadastre seu primeiro endereÃ§o para receber compras via Delivery com rapidez.
              </p>
              <button type="button"
                onClick={handleOpenNewAddressModal}
                className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl"
              >
                Cadastrar EndereÃ§o
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentUser.addresses.map((addr) => (
                <div
                  key={addr.id}
                  className={`p-5 rounded-2xl border transition-all relative space-y-3 ${
                    addr.isDefault
                      ? 'bg-blue-50/40 border-blue-300 ring-1 ring-blue-300 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                        {addr.label.toLowerCase().includes('trab') ? (
                          <Briefcase className="w-4 h-4" />
                        ) : (
                          <Home className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-900">{addr.label}</h4>
                        <span className="text-[10px] text-slate-500">{addr.neighborhood}</span>
                      </div>
                    </div>

                    {addr.isDefault ? (
                      <span className="px-2.5 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center space-x-1">
                        <Check className="w-3 h-3" />
                        <span>Principal</span>
                      </span>
                    ) : (
                      <button type="button"
                        onClick={() => setDefaultCustomerAddress(addr.id)}
                        className="text-[10px] font-bold text-slate-500 hover:text-blue-600 transition-colors"
                      >
                        Tornar PadrÃ£o
                      </button>
                    )}
                  </div>

                  <div className="text-xs text-slate-700 space-y-0.5">
                    <p className="font-medium">
                      {addr.street}, {addr.number} {addr.complement && `(${addr.complement})`}
                    </p>
                    <p className="text-slate-500">
                      Bairro: {addr.neighborhood} Ã¢â‚¬Â¢ {addr.city} - {addr.state} Ã¢â‚¬Â¢ CEP: {addr.zipCode || '28680-000'}
                    </p>
                    {addr.referencePoint && (
                      <p className="text-[11px] text-blue-800 bg-blue-50/80 p-1.5 rounded-lg mt-1">
                        Ã°Å¸â€œÂ <strong>Ref:</strong> {addr.referencePoint}
                      </p>
                    )}
                    {addr.deliveryInstructions && (
                      <p className="text-[11px] text-slate-600 italic">
                        Ã°Å¸â€™Â¬ <strong>InstruÃ§Ã£o:</strong> {addr.deliveryInstructions}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end space-x-2">
                    <button type="button"
                      onClick={() => handleEditAddress(addr)}
                      className="px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 rounded-lg flex items-center space-x-1"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                      <span>Modificar</span>
                    </button>
                    <button type="button"
                      onClick={() => {
                        if (confirm(`Deseja realmente excluir o endereÃ§o "${addr.label}"?`)) {
                          deleteCustomerAddress(addr.id);
                        }
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal / Form para Adicionar ou Modificar EndereÃ§o */}
          {isAddressModalOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
                  <h3 className="text-sm font-black flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-blue-400" />
                    {editingAddressId ? 'Modificar EndereÃ§o' : 'Acrescentar Novo EndereÃ§o'}
                  </h3>
                  <button type="button"
                    onClick={() => setIsAddressModalOpen(false)}
                    className="text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveAddress} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Apelido do EndereÃ§o *
                      </label>
                      <input
                        type="text"
                        required
                        value={addressLabel}
                        onChange={(e) => setAddressLabel(e.target.value)}
                        placeholder="Ex: Casa, Trabalho, SÃ­tio"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>

                    <div className="col-span-2 sm:col-span-1">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Bairro em Cachoeiras de Macacu *
                      </label>
                      <select
                        value={addressNeighborhood}
                        onChange={(e) => setAddressNeighborhood(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      >
                        {MACACU_NEIGHBORHOODS.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2 sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Rua / Logradouro / Avenida *
                      </label>
                      <input
                        type="text"
                        required
                        value={addressStreet}
                        onChange={(e) => setAddressStreet(e.target.value)}
                        placeholder="Ex: Rua das Palmeiras ou Av. Beira Rio"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">NÃºmero *</label>
                      <input
                        type="text"
                        required
                        value={addressNumber}
                        onChange={(e) => setAddressNumber(e.target.value)}
                        placeholder="Ex: 142 ou S/N"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Complemento</label>
                      <input
                        type="text"
                        value={addressComplement}
                        onChange={(e) => setAddressComplement(e.target.value)}
                        placeholder="Ex: Apto 201, Bloco B, Casa 2"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">CEP</label>
                      <input
                        type="text"
                        value={addressZip}
                        onChange={(e) => setAddressZip(e.target.value)}
                        placeholder="28680-000"
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Cidade / UF</label>
                      <input
                        type="text"
                        disabled
                        value="Cachoeiras de Macacu - RJ"
                        className="w-full px-3 py-2 text-xs bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-bold"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Ponto de ReferÃªncia
                      </label>
                      <input
                        type="text"
                        value={addressRef}
                        onChange={(e) => setAddressRef(e.target.value)}
                        placeholder="Ex: Ao lado da padaria, em frente Ã  pracinha..."
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        InstruÃ§Ãµes para o Entregador
                      </label>
                      <input
                        type="text"
                        value={addressInstructions}
                        onChange={(e) => setAddressInstructions(e.target.value)}
                        placeholder="Ex: Tocar o interfone 102, portÃ£o azul..."
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>

                    <div className="col-span-2">
                      <label className="flex items-center space-x-2 text-xs font-bold text-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={addressIsDefault}
                          onChange={(e) => setAddressIsDefault(e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded-sm focus:ring-blue-500"
                        />
                        <span>Definir este endereÃ§o como meu endereÃ§o padrÃ£o de entrega</span>
                      </label>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsAddressModalOpen(false)}
                      className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs"
                    >
                      {editingAddressId ? 'Salvar ModificaÃ§Ãµes' : 'Salvar Novo EndereÃ§o'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: VIP PROVADOR & MEASUREMENTS */}
      {activeSection === 'vip' && (
        <form onSubmit={handleSaveVip} className="p-6 space-y-6">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1 bg-purple-100 text-purple-700 rounded-lg">
                <Shirt className="w-5 h-5" />
              </span>
              <h3 className="text-base font-black text-slate-900">
                Ficha de Medidas & Provador VIP em DomicÃ­lio
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Configure suas numeraÃ§Ãµes e preferÃªncias de caimento. Quando vocÃª solicitar uma mala de Provador VIP ou comprar roupas e calÃ§ados no comÃ©rcio de Cachoeiras de Macacu, as lojas jÃ¡ saberÃ£o o seu tamanho ideal.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tamanho de Blusa / Camisa / Casaco
              </label>
              <select
                value={topSize}
                onChange={(e) => setTopSize(e.target.value)}
                className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
              >
                {['PP', 'P', 'M', 'G', 'GG', 'XGG', 'G1', 'G2', 'G3', 'Sob Medida'].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                NumeraÃ§Ã£o de CalÃ§a / Bermuda / Saia
              </label>
              <select
                value={bottomSize}
                onChange={(e) => setBottomSize(e.target.value)}
                className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
              >
                {['34', '36', '38', '40', '42', '44', '46', '48', '50', '52', '54', '56+'].map(
                  (n) => (
                    <option key={n} value={n}>
                      Tamanho {n}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                NumeraÃ§Ã£o de CalÃ§ados
              </label>
              <select
                value={shoeSize}
                onChange={(e) => setShoeSize(e.target.value)}
                className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
              >
                {['33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'].map(
                  (num) => (
                    <option key={num} value={num}>
                      NÂº {num}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Altura Aproximada</label>
              <input
                type="text"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="Ex: 1.68m"
                className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Peso Aproximado</label>
              <input
                type="text"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="Ex: 65kg"
                className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                PreferÃªncia de Modelagem / Caimento
              </label>
              <select
                value={preferredFit}
                onChange={(e) => setPreferredFit(e.target.value as any)}
                className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
              >
                <option value="Ajustado">Ajustado ao Corpo (Slim)</option>
                <option value="Normal">Normal / ConfortÃ¡vel (Regular)</option>
                <option value="Solto">Solto / FluÃ­do</option>
                <option value="Oversized">Oversized (Amplo e despojado)</option>
              </select>
            </div>
          </div>

          {/* Style Tags */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              Estilos que mais combinam com vocÃª:
            </label>
            <div className="flex flex-wrap gap-2">
              {STYLE_OPTIONS.map((st) => {
                const isSelected = selectedStyles.includes(st);
                return (
                  <button
                    type="button"
                    key={st}
                    onClick={() => toggleStyleSelection(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {isSelected ? 'Ã¢Å“â€œ ' : '+ '} {st}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cores Favoritas (separadas por vÃ­rgula)
              </label>
              <input
                type="text"
                value={favoriteColorsInput}
                onChange={(e) => setFavoriteColorsInput(e.target.value)}
                placeholder="Ex: Azul Marinho, Preto, Branco, Verde Oliva"
                className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cores que VocÃª Evita / NÃ£o Gosta
              </label>
              <input
                type="text"
                value={avoidColorsInput}
                onChange={(e) => setAvoidColorsInput(e.target.value)}
                placeholder="Ex: Amarelo Neon, Rosa Choque"
                className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ObservaÃ§Ãµes Especiais para os Consultores de Moda
            </label>
            <textarea
              value={fitNotes}
              onChange={(e) => setFitNotes(e.target.value)}
              rows={2}
              placeholder="Ex: BraÃ§os compridos, prefiro tecidos naturais como linho e 100% algodÃ£o, evito estampas muito grandes..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-600 focus:outline-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-purple-600/20 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Salvar Ficha do Provador VIP</span>
            </button>
          </div>
        </form>
      )}

      {/* SECTION 4: PREFERENCES & NOTIFICATIONS */}
      {activeSection === 'preferences' && (
        <form onSubmit={handleSavePreferences} className="p-6 space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900">
              PreferÃªncias de Atendimento & Canais de NotificaÃ§Ã£o
            </h3>
            <p className="text-xs text-slate-500">
              Personalize como vocÃª deseja receber as mensagens do Achei Aqui e as atualizaÃ§Ãµes de seus pedidos.
            </p>
          </div>

          <div className="p-3.5 bg-blue-50/80 rounded-xl border border-blue-200 flex items-start space-x-3">
            <Bell className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <div className="text-xs text-blue-900">
              <span className="font-bold">Nova Matriz de Canais por Tipo de Alerta:</span> VocÃª tambÃ©m pode definir canais especÃ­ficos (Push, E-mail e WhatsApp) separados para <strong>Status de Pedido</strong>, <strong>Mensagens de Lojistas</strong> e <strong>Ofertas</strong> acessando a aba <strong>PreferÃªncias de NotificaÃ§Ã£o</strong> no menu superior.
            </div>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors">
              <div>
                <p className="text-xs font-bold text-slate-900">NotificaÃ§Ãµes por WhatsApp</p>
                <p className="text-[11px] text-slate-500">
                  Receba o status do pedido, cÃ³digo de retirada no balcÃ£o e avisos de rota de entrega diretamente no seu WhatsApp.
                </p>
              </div>
              <input
                type="checkbox"
                checked={receiveWhatsApp}
                onChange={(e) => setReceiveWhatsApp(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded-sm focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors">
              <div>
                <p className="text-xs font-bold text-slate-900">E-mails de Recibos & Comprovantes</p>
                <p className="text-[11px] text-slate-500">
                  Receba notas fiscais e comprovantes detalhados de cada compra realizada no comÃ©rcio local.
                </p>
              </div>
              <input
                type="checkbox"
                checked={receiveEmail}
                onChange={(e) => setReceiveEmail(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded-sm focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors">
              <div>
                <p className="text-xs font-bold text-slate-900">Avisos por SMS</p>
                <p className="text-[11px] text-slate-500">
                  Alertas rÃ¡pidos caso vocÃª esteja sem conexÃ£o de dados mÃ³veis no momento da entrega.
                </p>
              </div>
              <input
                type="checkbox"
                checked={receiveSms}
                onChange={(e) => setReceiveSms(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded-sm focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer hover:bg-slate-100/70 transition-colors">
              <div>
                <p className="text-xs font-bold text-slate-900">
                  PromoÃ§Ãµes & Ofertas Exclusivas do ComÃ©rcio de Macacu
                </p>
                <p className="text-[11px] text-slate-500">
                  Receba em primeira mÃ£o descontos relÃ¢mpago e novidades das lojas parceiras.
                </p>
              </div>
              <input
                type="checkbox"
                checked={receivePromoAlerts}
                onChange={(e) => setReceivePromoAlerts(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded-sm focus:ring-blue-500"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Modalidade de Compra Preferida
              </label>
              <select
                value={preferredModality}
                onChange={(e) => setPreferredModality(e.target.value as any)}
                className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="DELIVERY">Delivery / Entrega RÃ¡pida em DomicÃ­lio</option>
                <option value="RETIRADA">Retirada Express no BalcÃ£o da Loja</option>
                <option value="EXPERIMENTAÃƒâ€¡ÃƒÆ’O">Provador VIP em DomicÃ­lio (Mala de Roupas)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                RestriÃ§Ãµes Alimentares / ObservaÃ§Ãµes GastronÃ´micas
              </label>
              <input
                type="text"
                value={dietaryRestrictions}
                onChange={(e) => setDietaryRestrictions(e.target.value)}
                placeholder="Ex: Vegetariano, intolerÃ¢ncia a lactose, sem glÃºten..."
                className="w-full px-3 py-2.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-blue-600/20 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Salvar PreferÃªncias</span>
            </button>
          </div>
        </form>
      )}

      {/* SECTION 5: SECURITY & PRIVACY */}
      {activeSection === 'security' && (
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-base font-black text-slate-900">SeguranÃ§a da Conta & Controle de Dados</h3>
            <p className="text-xs text-slate-500">
              Gerencie a seguranÃ§a do seu login e exerÃ§a seus direitos de privacidade e portabilidade de dados.
            </p>
          </div>

          {/* Change Password */}
          <form onSubmit={handleUpdatePassword} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-black text-slate-900 flex items-center">
              <KeyRound className="w-4 h-4 mr-1.5 text-blue-600" />
              Alterar Senha de Acesso
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Nova Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="MÃ­nimo 6 dÃ­gitos"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Confirmar Nova Senha</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none bg-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!newPassword || newPassword !== confirmPassword}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              Atualizar Senha
            </button>
          </form>

          {/* 2FA Toggle */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-black text-slate-900">AutenticaÃ§Ã£o em 2 Etapas (2FA)</h4>
              </div>
              <p className="text-[11px] text-slate-500">
                Adicione uma camada extra de seguranÃ§a solicitando cÃ³digo via WhatsApp ao fazer login em novos navegadores.
              </p>
            </div>
            <button type="button"
              onClick={toggleTwoFactor}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                currentUser.twoFactorEnabled
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              {currentUser.twoFactorEnabled ? '2FA Ativado Ã¢Å“â€œ' : 'Ativar 2FA'}
            </button>
          </div>

          {/* Data Portability (LGPD) */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center space-x-2">
                <Download className="w-4 h-4 text-blue-600" />
                <h4 className="text-xs font-black text-slate-900">Exportar Ficha Cadastral (LGPD)</h4>
              </div>
              <p className="text-[11px] text-slate-500">
                Baixe uma cÃ³pia estruturada de todos os seus dados e endereÃ§os salvos na plataforma.
              </p>
            </div>
            <button type="button"
              onClick={handleExportData}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Meus Dados (.json)</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default CustomerProfileEditor;















