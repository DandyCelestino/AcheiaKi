import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  Percent,
  CheckCircle2,
  Wallet,
  ShieldCheck,
  Zap,
  Calendar,
  Info,
  ShoppingBag,
  Filter
} from 'lucide-react';
import { SvgBarChart } from '../common/SvgCharts';
import { Order, StoreMerchant } from '../../types';

interface SellerFinancialBarChartProps {
  orders: Order[];
  currentStore?: StoreMerchant;
}

interface MonthlyData {
  periodKey: string;
  name: string;
  gross: number;
  commission: number;
  net: number;
  ordersCount: number;
}

export const SellerFinancialBarChart: React.FC<SellerFinancialBarChartProps> = ({
  orders,
  currentStore
}) => {
  // View mode: Monthly vs Per-Order
  const [viewMode, setViewMode] = useState<'monthly' | 'orders'>('monthly');
  // Filter status
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed_only'>('all');

  // Filter valid orders based on status
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      if (statusFilter === 'completed_only') {
        const isPaidOrCompleted =
          ord.status === 'Concluído' ||
          ord.status === 'Confirmado' ||
          ord.status === 'Pronto para Retirada' ||
          ord.paymentStatus === 'PAGO';
        return isPaidOrCompleted;
      }
      // 'all': Exclude only explicitly canceled or expired orders
      return ord.status !== 'Cancelado' && ord.paymentStatus !== 'EXPIRADO';
    });
  }, [orders, statusFilter]);

  // Overall Financial Totals
  const { totalGross, totalCommission, totalNet, totalCount, averageTicket } = useMemo(() => {
    let gross = 0;
    let commission = 0;

    filteredOrders.forEach((o) => {
      const orderAmount = Number(o.totalAmount || 0);
      gross += orderAmount;

      // 10% commission deduction rule
      const comm = o.commissionAmount !== undefined && o.commissionAmount !== null
        ? Number(o.commissionAmount)
        : orderAmount * 0.10;
      commission += comm;
    });

    const net = gross - commission;
    const count = filteredOrders.length;
    const avg = count > 0 ? gross / count : 0;

    return {
      totalGross: gross,
      totalCommission: commission,
      totalNet: net,
      totalCount: count,
      averageTicket: avg
    };
  }, [filteredOrders]);

  // Aggregate by Month for the Last 6 Months (Real Data)
  const monthlyData: MonthlyData[] = useMemo(() => {
    // 6-month timeline structure
    const months = [
      { key: '2026-04', name: 'Abr/26' },
      { key: '2026-05', name: 'Mai/26' },
      { key: '2026-06', name: 'Jun/26' },
      { key: '2026-07', name: 'Jul/26' },
      { key: '2026-08', name: 'Ago/26' },
      { key: '2026-09', name: 'Set/26 (Atual)' }
    ];

    return months.map((m) => {
      // Find orders belonging to this month
      const matchingOrders = filteredOrders.filter((ord) => {
        if (!ord.createdAt) return false;
        if (m.key === '2026-09') {
          return ord.createdAt.includes('Hoje') || ord.createdAt.includes('2026-09') || !ord.createdAt.includes('-');
        }
        return ord.createdAt.includes(m.key);
      });

      const grossVal = matchingOrders.reduce((sum, ord) => sum + Number(ord.totalAmount || 0), 0);
      const commissionVal = Math.round(grossVal * 0.10 * 100) / 100;
      const netVal = Math.round((grossVal - commissionVal) * 100) / 100;

      return {
        periodKey: m.key,
        name: m.name,
        gross: grossVal,
        commission: commissionVal,
        net: netVal,
        ordersCount: matchingOrders.length
      };
    });
  }, [filteredOrders]);

  // Data by Individual Recent Orders (Real Data)
  const ordersChartData = useMemo(() => {
    return filteredOrders.slice(0, 10).map((ord) => {
      const gross = Number(ord.totalAmount || 0);
      const commission = ord.commissionAmount !== undefined && ord.commissionAmount !== null
        ? Number(ord.commissionAmount)
        : Math.round(gross * 0.10 * 100) / 100;
      const net = Math.round((gross - commission) * 100) / 100;

      return {
        name: ord.orderNumber || (ord.code ? ord.code.slice(0, 8) : 'Pedido'),
        code: ord.code || '',
        gross,
        commission,
        net
      };
    });
  }, [filteredOrders]);

  const chartData = viewMode === 'monthly' ? monthlyData : ordersChartData;

  // Custom Recharts Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0]?.payload;
      const gross = dataPoint?.gross || 0;
      const commission = dataPoint?.commission || 0;
      const net = dataPoint?.net || 0;

      return (
        <div className="bg-slate-900/95 text-white p-3.5 rounded-xl shadow-xl border border-slate-700/80 backdrop-blur-md text-xs min-w-[220px]">
          <div className="flex items-center justify-between border-b border-slate-700/70 pb-2 mb-2">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-400" />
              {label}
            </span>
            {dataPoint?.ordersCount && (
              <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300">
                {dataPoint.ordersCount} pedidos
              </span>
            )}
          </div>

          <div className="space-y-2">
            {/* Gross Value */}
            <div className="flex items-center justify-between">
              <span className="text-slate-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 inline-block" />
                Valor Bruto (100%):
              </span>
              <span className="font-bold text-blue-400 font-sans">
                R$ {gross.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Platform Commission Deduction */}
            <div className="flex items-center justify-between">
              <span className="text-slate-300 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />
                Comissão Plataforma (10%):
              </span>
              <span className="font-bold text-amber-400 font-sans">
                - R$ {commission.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Net Amount to Seller */}
            <div className="pt-2 border-t border-slate-700/70 flex items-center justify-between">
              <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />
                Líquido Lojista (90%):
              </span>
              <span className="font-black text-emerald-400 font-sans text-sm">
                R$ {net.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div className="mt-2.5 pt-1.5 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
            <span>Split Asaas:</span>
            <span className="text-emerald-400 font-semibold">Repasse Automático 90%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 sm:p-6 space-y-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 mb-1.5">
            <Percent className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Split Automático & Conciliação Asaas</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
            Demonstrativo de Vendas: Bruto vs. Líquido (Comissão 10%)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Visualização comparativa entre o faturamento bruto vendido e a receita líquida do lojista (90%) após a dedução automática de 10% da plataforma.
          </p>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-700/60 rounded-xl">
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'monthly'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Por Mês
            </button>
            <button
              onClick={() => setViewMode('orders')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'orders'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Por Pedido
            </button>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'completed_only')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl border-none outline-none cursor-pointer transition-colors"
            >
              <option value="all">Todos os Pedidos</option>
              <option value="completed_only">Apenas Confirmados / Pagos</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Bruto */}
        <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Total Bruto Vendido</span>
              <div className="p-1.5 bg-blue-100 dark:bg-blue-950/60 rounded-lg">
                <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-2 font-sans">
              R$ {totalGross.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold mt-2 block">
            100% das vendas registradas
          </span>
        </div>

        {/* Dedução de Comissão (10%) */}
        <div className="bg-amber-50/60 dark:bg-amber-950/20 p-4 rounded-xl border border-amber-200/80 dark:border-amber-800/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-amber-800 dark:text-amber-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Comissão Plataforma (10%)</span>
              <div className="p-1.5 bg-amber-100 dark:bg-amber-900/60 rounded-lg">
                <Percent className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-amber-700 dark:text-amber-300 mt-2 font-sans">
              - R$ {totalCommission.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold mt-2 block">
            Dedução automática via split Asaas
          </span>
        </div>

        {/* Receita Líquida Lojista (90%) */}
        <div className="bg-emerald-50/70 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200/90 dark:border-emerald-800/40 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Receita Líquida Lojista</span>
              <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/60 rounded-lg">
                <Wallet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-2 font-sans">
              R$ {totalNet.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold mt-2 block flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            90% creditado na sua subconta
          </span>
        </div>

        {/* Informações da Subconta */}
        <div className="bg-slate-900 text-white p-4 rounded-xl border border-slate-700 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[11px] font-bold uppercase tracking-wider">Subconta & Repasse</span>
              <div className="p-1.5 bg-slate-800 rounded-lg">
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            <div className="mt-2 space-y-1">
              <p className="text-xs font-bold text-white truncate">
                {currentStore?.name || 'Sua Loja'}
              </p>
              <p className="text-[10px] text-slate-300 font-sans truncate">
                Wallet: {currentStore?.asaasWalletId || 'wallet_automatica_001'}
              </p>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            Split Imediato em cada venda
          </div>
        </div>
      </div>

      {/* RECHARTS BAR CHART */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            {viewMode === 'monthly' ? 'Evolução Mensal (Últimos 6 Meses)' : 'Comparativo dos Últimos Pedidos'}
          </span>

          {/* Custom Visual Legend */}
          <div className="flex items-center space-x-4 text-xs font-semibold">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-xs bg-blue-500 inline-block" />
              <span className="text-slate-700 dark:text-slate-300">Valor Bruto (100%)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-xs bg-amber-500 inline-block" />
              <span className="text-slate-700 dark:text-slate-300">Comissão Plataforma (10%)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block" />
              <span className="text-slate-700 dark:text-slate-300">Valor Líquido (90%)</span>
            </div>
          </div>
        </div>

        {viewMode === 'orders' && filteredOrders.length === 0 ? (
          <div className="h-[280px] flex flex-col items-center justify-center p-6 bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-center">
            <ShoppingBag className="w-10 h-10 text-slate-400 mb-2" />
            <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">Nenhum pedido registrado ainda</p>
            <p className="text-xs text-slate-500 max-w-md mt-1">
              Os novos pedidos do marketplace aparecerão aqui em tempo real, detalhando a comissão de 10% da plataforma e o valor líquido repassado (90%) para sua conta.
            </p>
          </div>
        ) : (
          <div className="w-full pt-2">
            <SvgBarChart
              data={chartData}
              xKey="name"
              height={300}
              showLegend={false}
              series={[
                { key: 'gross', name: 'Valor Bruto (100%)', color: '#3b82f6' },
                { key: 'commission', name: 'Comissão Plataforma (10%)', color: '#f59e0b' },
                { key: 'net', name: 'Valor Líquido (90%)', color: '#10b981' }
              ]}
              yFormatter={(value) => `R$ ${value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}`}
              tooltipFormatter={(val, key) =>
                `R$ ${Number(val).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              }
              labelFormatter={(item) =>
                viewMode === 'monthly'
                  ? `${item.name} (${item.ordersCount || 0} pedidos)`
                  : `Pedido: ${item.name}`
              }
            />
          </div>
        )}
      </div>

      {/* FOOTER EXPLANATION NOTE */}
      <div className="p-3.5 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong className="text-slate-900 dark:text-white">Regra de Split de Pagamento Automático: </strong>
          Todas as transações realizadas no marketplace (via Pix, Cartão ou Boleto pelo Asaas) aplicam automaticamente a dedução de 10% de comissão para manutenção e expansão da plataforma. Os 90% restantes entram como saldo líquido disponível diretamente na subconta vinculada ao seu CNPJ/CPF em Cachoeiras de Macacu.
        </div>
      </div>
    </div>
  );
};

