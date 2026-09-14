import React, { useState, useMemo } from 'react';
import {
  Package,
  Search,
  Filter,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Star,
  CheckCircle,
  PauseCircle,
  Archive,
  AlertTriangle,
  Tag,
  DollarSign,
  Layers,
  X,
  Save,
  Store,
  Sparkles,
  CalendarCheck2,
  Clock
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Product, ServiceItem } from '../../types';

export const MasterCatalogView: React.FC = () => {
  const {
    products,
    services,
    merchants,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductStatus,
    toggleProductFeatured,
    addService,
    updateService,
    deleteService,
    triggerToast
  } = useApp();

  const [activeTab, setActiveTab] = useState<'products' | 'services'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [merchantFilter, setMerchantFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');

  // Modals
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [showNewServiceModal, setShowNewServiceModal] = useState(false);

  // Form State for Product
  const [productForm, setProductForm] = useState<Partial<Product>>({});
  
  // Form State for Service
  const [serviceForm, setServiceForm] = useState<Partial<ServiceItem>>({});

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(q) ||
        p.merchantName.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q));

      const matchesMerchant = merchantFilter === 'ALL' || p.merchantId === merchantFilter;
      const matchesStatus = statusFilter === 'ALL' || (p.status || 'active') === statusFilter;

      let matchesStock = true;
      const stock = p.stock ?? 10;
      if (stockFilter === 'OUT_OF_STOCK') matchesStock = stock === 0;
      if (stockFilter === 'LOW_STOCK') matchesStock = stock > 0 && stock <= 5;
      if (stockFilter === 'IN_STOCK') matchesStock = stock > 0;

      return matchesSearch && matchesMerchant && matchesStatus && matchesStock;
    });
  }, [products, searchQuery, merchantFilter, statusFilter, stockFilter]);

  // Filtered Services
  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      const q = searchQuery.toLowerCase();
      return (
        s.title.toLowerCase().includes(q) ||
        s.providerName.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q)
      );
    });
  }, [services, searchQuery]);

  const handleOpenEditProduct = (p: Product) => {
    setEditingProduct(p);
    setProductForm({ ...p });
  };

  const handleSaveProductEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    updateProduct(editingProduct.id, productForm);
    setEditingProduct(null);
  };

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price || !productForm.merchantId) {
      triggerToast('Preencha os campos obrigatórios do produto.');
      return;
    }

    const selMerchant = merchants.find((m) => m.id === productForm.merchantId);

    addProduct({
      name: productForm.name,
      merchantId: productForm.merchantId,
      merchantName: selMerchant?.name || 'Loja Macacu',
      price: Number(productForm.price),
      oldPrice: productForm.oldPrice ? Number(productForm.oldPrice) : undefined,
      description: productForm.description || '',
      category: productForm.category || 'Geral',
      image:
        productForm.image ||
        'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
      stock: Number(productForm.stock ?? 10),
      featured: productForm.featured ?? false,
      status: (productForm.status as any) || 'active'
    });

    setShowNewProductModal(false);
    setProductForm({});
  };

  const handleSaveServiceEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingService) return;
    updateService(editingService.id, serviceForm);
    setEditingService(null);
  };

  const handleCreateService = (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceForm.title || !serviceForm.price) {
      triggerToast('Preencha os campos obrigatórios do serviço.');
      return;
    }

    addService({
      title: serviceForm.title,
      providerName: serviceForm.providerName || 'Profissional Local',
      category: serviceForm.category || 'Serviços & Beleza',
      price: Number(serviceForm.price),
      duration: serviceForm.duration || '60 min',
      rating: 5.0,
      image:
        serviceForm.image ||
        'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=500&auto=format&fit=crop&q=80',
      availableDays: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    });

    setShowNewServiceModal(false);
    setServiceForm({});
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                Catálogo Global Unificado
              </h2>
              <p className="text-xs text-slate-500">
                Auditoria, moderação e edição direta de todos os produtos e serviços cadastrados em Cachoeiras de Macacu.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Sub-tab Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('products')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'products'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Produtos ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'services'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Serviços & Agendamentos ({services.length})
            </button>
          </div>

          {activeTab === 'products' ? (
            <button
              onClick={() => {
                setProductForm({ merchantId: merchants[0]?.id, stock: 10, status: 'active' });
                setShowNewProductModal(true);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Produto</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setServiceForm({ duration: '45 min' });
                setShowNewServiceModal(true);
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Serviço</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'products'
                ? 'Buscar por nome do item, loja parceira, categoria...'
                : 'Buscar por título do serviço, profissional...'
            }
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 focus:bg-white transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {activeTab === 'products' && (
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <select
              value={merchantFilter}
              onChange={(e) => setMerchantFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="ALL">Todas as Lojas</option>
              {merchants.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>

            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="ALL">Todos os Estoques</option>
              <option value="IN_STOCK">Em Estoque (&gt;0)</option>
              <option value="LOW_STOCK">Baixo Estoque (1 a 5)</option>
              <option value="OUT_OF_STOCK">Esgotados (0)</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="ALL">Todos os Status</option>
              <option value="active">Ativos</option>
              <option value="paused">Pausados</option>
              <option value="draft">Rascunhos</option>
              <option value="archived">Arquivados</option>
            </select>
          </div>
        )}
      </div>

      {/* PRODUCTS TAB VIEW */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="px-4 py-3.5">Produto & Imagem</th>
                  <th className="px-4 py-3.5">Estabelecimento / Loja</th>
                  <th className="px-4 py-3.5">Preço & Promoção</th>
                  <th className="px-4 py-3.5">Estoque</th>
                  <th className="px-4 py-3.5">Destaque & Status</th>
                  <th className="px-4 py-3.5 text-right">Ações Master</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const stock = p.stock ?? 10;
                  const status = p.status || 'active';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center space-x-3">
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-2xs"
                          />
                          <div>
                            <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                              <span>{p.name}</span>
                              {p.featured && (
                                <span className="p-0.5 bg-amber-100 text-amber-600 rounded" title="Destaque na Home">
                                  <Star className="w-3 h-3 fill-amber-500" />
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500">{p.category}</div>
                            <div className="text-[10px] text-slate-400">ID: {p.id}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-800 flex items-center space-x-1">
                          <Store className="w-3.5 h-3.5 text-slate-400" />
                          <span>{p.merchantName}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="space-y-0.5">
                          <div className="font-bold text-slate-900 text-sm">
                            R$ {(p.price ?? 0).toFixed(2)}
                          </div>
                          {(p.originalPrice || p.oldPrice) && (
                            <div className="text-[10px] text-slate-400 line-through">
                              R$ {(p.originalPrice ?? p.oldPrice ?? 0).toFixed(2)}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            stock === 0
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : stock <= 5
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {stock === 0 ? 'Esgotado' : `${stock} un.`}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="space-y-1">
                          <div>
                            <button
                              onClick={() => toggleProductFeatured(p.id)}
                              className={`px-2 py-0.5 rounded text-[10px] font-bold border transition-colors flex items-center space-x-1 ${
                                p.featured
                                  ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                              }`}
                              title="Clique para alternar destaque na Home"
                            >
                              <Star className={`w-3 h-3 ${p.featured ? 'fill-amber-500' : ''}`} />
                              <span>{p.featured ? 'Destacado' : 'Normal'}</span>
                            </button>
                          </div>
                          <div>
                            <span
                              className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                                status === 'active'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : status === 'paused'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {status}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          {/* Alternar Status (Ativo / Pausado) */}
                          <button
                            onClick={() =>
                              toggleProductStatus(p.id, status === 'active' ? 'paused' : 'active')
                            }
                            title={status === 'active' ? 'Pausar Vendas' : 'Ativar Vendas'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              status === 'active'
                                ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {status === 'active' ? (
                              <PauseCircle className="w-3.5 h-3.5" />
                            ) : (
                              <CheckCircle className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Editar */}
                          <button
                            onClick={() => handleOpenEditProduct(p)}
                            title="Editar Produto"
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Excluir */}
                          <button
                            onClick={() => {
                              if (window.confirm(`Excluir o produto "${p.name}" do catálogo?`)) {
                                deleteProduct(p.id);
                              }
                            }}
                            title="Excluir Produto"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SERVICES TAB VIEW */}
      {activeTab === 'services' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 text-slate-600 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-200/80">
                <tr>
                  <th className="px-4 py-3.5">Serviço</th>
                  <th className="px-4 py-3.5">Prestador / Profissional</th>
                  <th className="px-4 py-3.5">Valor</th>
                  <th className="px-4 py-3.5">Duração Média</th>
                  <th className="px-4 py-3.5">Avaliação</th>
                  <th className="px-4 py-3.5 text-right">Ações Master</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredServices.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-3">
                        <img
                          src={s.image}
                          alt={s.title}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 shadow-2xs"
                        />
                        <div>
                          <div className="font-bold text-slate-900">{s.title}</div>
                          <div className="text-[11px] text-slate-500">{s.category}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-800">{s.providerName}</div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 text-sm">
                        R$ {(s.price ?? 0).toFixed(2)}
                      </div>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center space-x-1 text-slate-600 font-medium">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{s.duration}</span>
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-amber-600 font-bold">
                      ★ {s.rating}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => {
                            setEditingService(s);
                            setServiceForm({ ...s });
                          }}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Excluir o serviço "${s.title}"?`)) {
                              deleteService(s.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR PRODUTO */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Editar Produto: {editingProduct.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProductEdit} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Título do Produto *</label>
                <input
                  type="text"
                  required
                  value={productForm.name || ''}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Preço Atual (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.price ?? 0}
                    onChange={(e) =>
                      setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Preço De/Original (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.oldPrice ?? ''}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        oldPrice: e.target.value ? parseFloat(e.target.value) : undefined
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estoque</label>
                  <input
                    type="number"
                    value={productForm.stock ?? 10}
                    onChange={(e) =>
                      setProductForm({ ...productForm, stock: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoria</label>
                  <input
                    type="text"
                    value={productForm.category || ''}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status</label>
                  <select
                    value={productForm.status || 'active'}
                    onChange={(e) => setProductForm({ ...productForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  >
                    <option value="active">Ativo (Publicado)</option>
                    <option value="paused">Pausado</option>
                    <option value="draft">Rascunho</option>
                    <option value="archived">Arquivado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">URL da Imagem</label>
                <input
                  type="text"
                  value={productForm.image || ''}
                  onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descrição do Produto</label>
                <textarea
                  rows={3}
                  value={productForm.description || ''}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Salvar Alterações</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CRIAR NOVO PRODUTO */}
      {showNewProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-2">
                <Plus className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Adicionar Produto ao Catálogo
                </h3>
              </div>
              <button
                onClick={() => setShowNewProductModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Loja Proprietária *</label>
                <select
                  required
                  value={productForm.merchantId || merchants[0]?.id}
                  onChange={(e) => setProductForm({ ...productForm, merchantId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                >
                  {merchants.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Título do Produto *</label>
                <input
                  type="text"
                  required
                  value={productForm.name || ''}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="Ex: Pastel Especial de Carne com Queijo"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Preço (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.price || ''}
                    onChange={(e) =>
                      setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })
                    }
                    placeholder="25.00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Preço Promocional (De)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={productForm.oldPrice || ''}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        oldPrice: e.target.value ? parseFloat(e.target.value) : undefined
                      })
                    }
                    placeholder="30.00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estoque</label>
                  <input
                    type="number"
                    value={productForm.stock ?? 10}
                    onChange={(e) =>
                      setProductForm({ ...productForm, stock: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">URL da Foto</label>
                <input
                  type="text"
                  value={productForm.image || ''}
                  onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowNewProductModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Publicar no Catálogo</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
