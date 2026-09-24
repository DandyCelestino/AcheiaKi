import React from 'react';
import { PwaInstallButton } from '../common/PwaInstallButton';
import {
  Store,
  ShoppingBag,
  Briefcase,
  MapPin,
  Download,
  ArrowRight,
  Sparkles,
  Search,
  Heart,
  ShieldCheck
} from 'lucide-react';

interface InitialLandingPanelProps {
  onEnterMarketplace: () => void;
  onInstallApp?: () => void;
}

export function InitialLandingPanel({
  onEnterMarketplace,
  onInstallApp
}: InitialLandingPanelProps) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -left-24 bottom-0 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="relative mx-auto flex min-h-[82vh] max-w-6xl flex-col px-5 py-8 sm:px-8 lg:px-12">
          <header className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-black tracking-tight sm:text-3xl">
                Acheia<span className="text-emerald-400">Ki</span>
              </div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-400">
                Cachoeiras de Macacu
              </div>
            </div>

            <button
              type="button"
              onClick={onEnterMarketplace}
              className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold text-white backdrop-blur transition hover:bg-white/15"
            >
              Entrar
            </button>
          </header>

          <div className="flex flex-1 items-center py-12">
            <div className="grid w-full items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
                  <Sparkles className="h-3.5 w-3.5" />
                  Seu marketplace local
                </div>

                <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                  O que você procura pode estar mais perto do que imagina.
                </h1>

                <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
                  Encontre lojas, produtos, serviços e oportunidades da sua região
                  em um só lugar. Descubra algo novo hoje e tenha o AcheiaKi
                  sempre por perto.
                </p>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={onEnterMarketplace}
                    className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-950/30 transition hover:bg-emerald-400"
                  >
                    Explorar o AcheiaKi
                    <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                  </button>

                  <div className="[&>div]:flex [&>div]:items-center [&>div]:gap-0 [&_button:first-child]:rounded-2xl [&_button:first-child]:border [&_button:first-child]:border-white/15 [&_button:first-child]:bg-white/10 [&_button:first-child]:px-6 [&_button:first-child]:py-3.5 [&_button:first-child]:text-sm [&_button:first-child]:font-bold [&_button:first-child]:text-white [&_button:first-child]:backdrop-blur [&_button:first-child]:hover:bg-white/15 [&_button:last-child]:hidden">
                    <PwaInstallButton />
                  </div>
                </div>

                <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-400">
                  <span className="inline-flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                    Acesso fácil
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-emerald-400" />
                    Comércio local
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Heart className="h-4 w-4 text-emerald-400" />
                    Feito para descobrir
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-md transition hover:-translate-y-1 hover:bg-white/15">
                  <Store className="h-8 w-8 text-emerald-400" />
                  <h2 className="mt-5 text-lg font-black">Lojas</h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    Descubra estabelecimentos e negócios perto de você.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-md transition hover:-translate-y-1 hover:bg-white/15">
                  <ShoppingBag className="h-8 w-8 text-blue-400" />
                  <h2 className="mt-5 text-lg font-black">Produtos</h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    Encontre produtos e oportunidades em poucos toques.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-md transition hover:-translate-y-1 hover:bg-white/15">
                  <Briefcase className="h-8 w-8 text-violet-400" />
                  <h2 className="mt-5 text-lg font-black">Serviços</h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    Encontre profissionais e serviços para o que você precisa.
                  </p>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-md transition hover:-translate-y-1 hover:bg-white/15">
                  <Search className="h-8 w-8 text-amber-400" />
                  <h2 className="mt-5 text-lg font-black">Descobertas</h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-400">
                    Entre para procurar. Fique para descobrir.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-5 text-center text-xs text-slate-500">
            <span className="font-semibold text-slate-400">Seu próximo achado pode estar aqui.</span>
            {' '}Comece a descobrir.
          </div>
        </div>
      </section>
    </main>
  );
}



