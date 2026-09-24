import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

export function PwaInstallButton() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event);
      setVisible(true);
    };

    const handleAppInstalled = () => {
      setInstalled(true);
      setVisible(false);
      setInstallPrompt(null);
    };

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) {
      alert('Para instalar o AcheiaKi, use o menu do Chrome e escolha "Instalar AcheiaKi".');
      return;
    }

    installPrompt.prompt();

    const result = await installPrompt.userChoice;

    if (result?.outcome === 'accepted') {
      try {
        localStorage.setItem('acheiaki_pwa_installed', 'true');
      } catch {
        // Mantém o funcionamento mesmo se o armazenamento local estiver indisponível.
      }
      setInstalled(true);
    }

    setInstallPrompt(null);
    setVisible(false);
  };

  if (installed || !visible) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleInstall}
        className="flex items-center gap-2 rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:bg-gray-800 whitespace-nowrap"
      >
        <Download size={18} />
        Instalar AcheiaKi
      </button>

      <button
        type="button"
        onClick={() => setVisible(false)}
        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
        aria-label="Fechar"
      >
        <X size={18} />
      </button>
    </div>
  );
}






