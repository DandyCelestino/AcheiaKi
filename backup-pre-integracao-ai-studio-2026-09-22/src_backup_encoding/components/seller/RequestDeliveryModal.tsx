import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Order, Merchant } from '../../types';
import { calculateDeliveryDistance, estimateDeliveryFare } from '../../services/distanceService';
import {
  Bike,
  MapPin,
  Store,
  Navigation,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  X,
  Clock,
  ShieldCheck
} from 'lucide-react';

interface RequestDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  merchant: Merchant;
}

const CACHOEIRAS_NEIGHBORHOODS = [
  'Centro',
  'Japuíba',
  'Papucaia',
  'Guapiaçu',
  'Maraporã',
  'Valério',
  'Funchal',
  'Ribeira',
  'Ganguri',
  'São José da Boa Morte',
  'Campo Grande',
  'Torrinhas'
];

export const RequestDeliveryModal: React.FC<RequestDeliveryModalProps> = ({
  isOpen,
  onClose,
  order,
  merchant
}) => {
  const { createDeliveryRide, systemSettings } = useApp();

  const [originAddress, setOriginAddress] = useState(merchant.address || 'Centro, Cachoeiras de Macacu - RJ');
  const [originNeighborhood, setOriginNeighborhood] = useState('Centro');
  const [destinationAddress, setDestinationAddress] = useState(order.deliveryAddress || 'Papucaia, Cachoeiras de Macacu - RJ');
  const [destinationNeighborhood, setDestinationNeighborhood] = useState('Papucaia');
  const [calculatedDistance, setCalculatedDistance] = useState<number>(3.0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Recalcular distância sempre que bairros mudarem
  useEffect(() => {
    const distCalc = calculateDeliveryDistance(
      `${originAddress} ${originNeighborhood}`,
      `${destinationAddress} ${destinationNeighborhood}`
    );
    setCalculatedDistance(distCalc.distanceKm);
  }, [originAddress, originNeighborhood, destinationAddress, destinationNeighborhood]);

  if (!isOpen) return null;

  const ratePerKm = systemSettings?.deliveryRatePerKm ?? 1.0;
  const platformFee = systemSettings?.deliveryPlatformFee ?? 2.0;
  const fare = estimateDeliveryFare(calculatedDistance, ratePerKm, platformFee);

  const handleConfirmRequest = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const res = await createDeliveryRide({
      orderId: order.id,
      originAddress,
      originNeighborhood,
      destinationAddress,
      destinationNeighborhood,
      customDistanceKm: calculatedDistance
    });

    setIsSubmitting(false);
    if (res.success) {
      onClose();
    } else {
      setErrorMessage(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-900 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300">
              <Bike className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-black text-base">Solicitar Delivery Achei Aqui</h3>
              <p className="text-xs text-emerald-200">
                Pedido {order.orderNumber || order.code} • Cachoeiras de Macacu, RJ
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

        <div className="p-6 space-y-5 text-xs text-slate-700">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Origem: Loja */}
          <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 font-bold text-[11px]">
              <span className="flex items-center space-x-1.5">
                <Store className="w-3.5 h-3.5 text-amber-600" />
                <span>PONTO DE COLETA (SEU ESTABELECIMENTO)</span>
              </span>
              <span className="text-[10px] text-slate-400">Origem</span>
            </div>
            <input
              type="text"
              value={originAddress}
              onChange={(e) => setOriginAddress(e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 outline-none focus:border-emerald-500 text-xs"
              placeholder="Endereço da Loja"
            />
            <div className="flex items-center space-x-2 pt-1">
              <span className="text-[10px] text-slate-500 font-semibold">Bairro:</span>
              <select
                value={originNeighborhood}
                onChange={(e) => setOriginNeighborhood(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-300 rounded-md text-xs font-bold text-slate-800 outline-none"
              >
                {CACHOEIRAS_NEIGHBORHOODS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Destino: Cliente */}
          <div className="space-y-1.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between text-slate-500 font-bold text-[11px]">
              <span className="flex items-center space-x-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>DESTINO DA ENTREGA (CLIENTE)</span>
              </span>
              <span className="text-[10px] text-slate-400">Destino</span>
            </div>
            <input
              type="text"
              value={destinationAddress}
              onChange={(e) => setDestinationAddress(e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 outline-none focus:border-emerald-500 text-xs"
              placeholder="Endereço Completo do Cliente"
            />
            <div className="flex items-center space-x-2 pt-1">
              <span className="text-[10px] text-slate-500 font-semibold">Bairro:</span>
              <select
                value={destinationNeighborhood}
                onChange={(e) => setDestinationNeighborhood(e.target.value)}
                className="px-2 py-1 bg-white border border-slate-300 rounded-md text-xs font-bold text-slate-800 outline-none"
              >
                {CACHOEIRAS_NEIGHBORHOODS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Detalhe do Cálculo de Tarifa Oficial V1 */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-950 flex items-center space-x-1">
                <Navigation className="w-3.5 h-3.5 text-emerald-700" />
                <span>Distância Estimada:</span>
              </span>
              <span className="font-black text-emerald-900 text-sm">
                {calculatedDistance.toFixed(1)} km
              </span>
            </div>

            <div className="border-t border-emerald-200/80 pt-2 space-y-1 text-[11px]">
              <div className="flex items-center justify-between text-slate-600">
                <span>Remuneração Entregador (R$ {ratePerKm.toFixed(2)}/km):</span>
                <span className="font-bold text-slate-900">
                  R$ {fare.driverEarnings.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Taxa de Intermediação Achei Aqui:</span>
                <span className="font-bold text-slate-900">
                  R$ {fare.platformFee.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-emerald-300 text-xs font-black text-emerald-950">
                <span>Total do Delivery:</span>
                <span className="text-sm font-black text-emerald-700">
                  R$ {fare.totalFare.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start space-x-2 text-[11px] text-blue-900">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              <strong>Segurança Operacional V1:</strong> A corrida será imediatamente disponibilizada aos entregadores credenciados online. A finalização da entrega exigirá validação por código único de 4 dígitos informado pelo comprador.
            </p>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs"
            >
              Cancelar
            </button>
            <button
              id="btn-confirm-delivery-request"
              type="button"
              onClick={handleConfirmRequest}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-600/30 flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Bike className="w-4 h-4" />
              <span>{isSubmitting ? 'Chamando Entregadores...' : 'Confirmar & Chamar Entregador'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
