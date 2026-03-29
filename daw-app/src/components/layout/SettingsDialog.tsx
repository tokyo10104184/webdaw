import { X, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const { t, i18n } = useTranslation();

  if (!isOpen) return null;

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'ja' : 'en';
    i18n.changeLanguage(nextLang);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950">
          <h2 className="text-sm font-semibold text-zinc-200 uppercase tracking-wider">{t('Settings')}</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">

          {/* Language Setting */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">{t('Language')}</h3>
            <div className="flex items-center justify-between bg-zinc-800/50 rounded-md p-3 border border-zinc-700/50">
              <div className="flex items-center space-x-3">
                <Globe size={18} className="text-blue-400" />
                <span className="text-sm text-zinc-300">
                  {i18n.language === 'ja' ? '日本語' : 'English'}
                </span>
              </div>
              <button
                onClick={toggleLanguage}
                className="px-3 py-1.5 text-xs font-medium bg-zinc-700 hover:bg-zinc-600 text-white rounded transition-colors"
              >
                {t('Switch')}
              </button>
            </div>
          </div>

          {/* Add more settings here in the future */}

        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-950 flex justify-end">
           <button
             onClick={onClose}
             className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors font-medium"
           >
             {t('Done')}
           </button>
        </div>

      </div>
    </div>
  );
}
