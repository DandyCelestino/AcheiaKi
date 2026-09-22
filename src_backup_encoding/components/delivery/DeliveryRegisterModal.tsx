import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DeliveryVehicleType } from '../../types';
import {
  Bike,
  User,
  Mail,
  Lock,
  Phone,
  CreditCard,
  Car,
  MapPin,
  CheckCircle2,
  AlertCircle,
  X,
  FileText
} from 'lucide-react';

interface DeliveryRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin?: () => void;
}

export const DeliveryRegisterModal: React.FC<DeliveryRegisterModalProps> = ({
  isOpen,
  onClose,
  onSuccessLogin
}) => {
  const { registerDeliveryDriver, triggerToast } = useApp();

  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [cnhNumber, setCnhNumber] = useState('');
  const [cnhCategory, setCnhCategory] = useState<'A' | 'B' | 'AB'>('A');
  const [vehicleType, setVehicleType] = useState<DeliveryVehicleType>('MOTO');
  const [vehicleModel, setVehicleModel] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [pixKey, setPixKey] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name || !cpf || !email || !password || !phone || !cnhNumber || !vehicleModel || !vehiclePlate) {
      setErrorMessage('Por favor, preencha todos os campos obrigatÃ³rios do credenciamento.');
      return;
    }

    setIsSubmitting(true);
    const res = await registerDeliveryDriver({
      name,
      cpf,
      email,
      password,
      phone,
      address,
      cnhNumber,
      cnhCategory,
      vehicleType,
      vehicleModel,
      vehiclePlate: vehiclePlate.toUpperCase(),
      vehicleColor,
      pixKey: pixKey || cpf
    });
    setIsSubmitting(false);

    if (res.success) {
      setIsSubmittedSuccess(true);
      triggerToast('Cadastro enviado para anÃ¡lise com sucesso!');
    } else {
      setErrorMessage(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base text-white">Quero ser Entregador Parceiro</h3>
              <p className="text-xs text-emerald-300">
                Achei Aqui Delivery â€¢ Cachoeiras de Macacu, RJ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {isSubmittedSuccess ? (
            <div className="p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-lg font-black text-slate-900">
                Cadastro Enviado com Sucesso!
              </h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Seus dados e documentos foram enviados para anÃ¡lise da equipe Master Achei Aqui. Assim que seus documentos forem conferidos e aprovados, vocÃª poderÃ¡ fazer login e ficar <strong>ONLINE</strong> para aceitar corridas remuneradas em Cachoeiras de Macacu.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onSuccessLogin) onSuccessLogin();
                  }}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs shadow-md shadow-emerald-600/30"
                >
                  Entendi, ir para o Login
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-950">
                <strong>Ganhos Claros na V1:</strong> VocÃª recebe R$ 1,00 por KM rodado com repasse direto via PIX. A plataforma conecta vocÃª aos lojistas da cidade.
              </div>

              {/* Dados Pessoais */}
              <div className="space-y-3">
                <span className="text-[11px] font-black text-slate-900 uppercase block border-b border-slate-100 pb-1">
                  1. Dados Pessoais
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Nome Completo *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Carlos Eduardo da Silva"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">CPF *</label>
                    <input
                      type="text"
                      required
                      value={cpf}
                      onChange={(e) => setCpf(e.target.value)}
                      placeholder="000.000.000-00"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">E-mail para Login *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="carlos@exemplo.com"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Senha de Acesso *</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="MÃ­nimo 6 caracteres"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Telefone WhatsApp *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="(21) 99999-9999"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">EndereÃ§o Residencial</label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Centro, Cachoeiras de Macacu"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* HabilitaÃ§Ã£o & VeÃ­culo */}
              <div className="space-y-3 pt-2">
                <span className="text-[11px] font-black text-slate-900 uppercase block border-b border-slate-100 pb-1">
                  2. DocumentaÃ§Ã£o & VeÃ­culo
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">NÃºmero CNH *</label>
                    <input
                      type="text"
                      required
                      value={cnhNumber}
                      onChange={(e) => setCnhNumber(e.target.value)}
                      placeholder="Registro CNH"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Categoria CNH</label>
                    <select
                      value={cnhCategory}
                      onChange={(e) => setCnhCategory(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold outline-none"
                    >
                      <option value="A">Categoria A (Moto)</option>
                      <option value="B">Categoria B (Carro)</option>
                      <option value="AB">Categoria AB (Moto e Carro)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Tipo de VeÃ­culo</label>
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value as any)}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold outline-none"
                    >
                      <option value="MOTO">Motocicleta</option>
                      <option value="CARRO">Carro</option>
                      <option value="BICICLETA">Bicicleta</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Modelo do VeÃ­culo *</label>
                    <input
                      type="text"
                      required
                      value={vehicleModel}
                      onChange={(e) => setVehicleModel(e.target.value)}
                      placeholder="Ex: Honda CG 160 Fan"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Placa do VeÃ­culo *</label>
                    <input
                      type="text"
                      required
                      value={vehiclePlate}
                      onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                      placeholder="ABC1D23"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-sans font-bold uppercase outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Cor do VeÃ­culo</label>
                    <input
                      type="text"
                      value={vehicleColor}
                      onChange={(e) => setVehicleColor(e.target.value)}
                      placeholder="Ex: Vermelha"
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Chave PIX */}
              <div className="space-y-2 pt-2">
                <span className="text-[11px] font-black text-slate-900 uppercase block border-b border-slate-100 pb-1">
                  3. Dados para Pagamento
                </span>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                    Chave PIX para Receber Repasses (R$ 1,00 / km)
                  </label>
                  <input
                    type="text"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    placeholder="Chave PIX (CPF, Celular, E-mail ou AleatÃ³ria)"
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium outline-none focus:border-emerald-600 font-sans"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-black text-xs shadow-md shadow-emerald-600/30 flex items-center space-x-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isSubmitting ? 'Cadastrando...' : 'Finalizar & Enviar Cadastro'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

