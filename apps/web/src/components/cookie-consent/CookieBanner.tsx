import { useCookieConsent } from './CookieConsentProvider';
import { CookieSettingsModal } from './CookieSettingsModal';

export function CookieBanner() {
  const { hasAnswered, acceptAll, rejectAll, setIsSettingsOpen } = useCookieConsent();

  if (hasAnswered) return <CookieSettingsModal />;

  return (
    <>
      <div className="fixed bottom-0 right-0 z-[100] p-4 sm:p-6 pointer-events-none flex justify-end">
        <div className="pointer-events-auto max-w-sm w-full bg-background/95 backdrop-blur-sm border shadow-xl rounded-xl p-6 flex flex-col gap-5">
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Nós usamos cookies 🍪</h3>
            <p className="text-sm text-muted-foreground">
              Utilizamos cookies para melhorar a sua experiência, analisar o tráfego do site e personalizar conteúdo. 
              Ao clicar em "Aceitar Todos", concorda com a utilização de todos os cookies.
            </p>
          </div>
          <div className="flex flex-col gap-2.5 w-full shrink-0">
            <button 
              onClick={acceptAll}
              className="px-4 py-2.5 w-full text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors"
            >
              Aceitar Todos
            </button>
            <button 
              onClick={rejectAll}
              className="px-4 py-2.5 w-full text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
            >
              Rejeitar Não Essenciais
            </button>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="px-4 py-2.5 w-full text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
            >
              Personalizar
            </button>
          </div>
        </div>
      </div>
      <CookieSettingsModal />
    </>
  );
}
