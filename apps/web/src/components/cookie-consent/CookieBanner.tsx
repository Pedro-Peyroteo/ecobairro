import { useCookieConsent } from './CookieConsentProvider';
import { CookieSettingsModal } from './CookieSettingsModal';

export function CookieBanner() {
  const { hasAnswered, acceptAll, rejectAll, setIsSettingsOpen } = useCookieConsent();

  if (hasAnswered) return <CookieSettingsModal />;

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 sm:p-6 md:p-8 pointer-events-none flex justify-center">
        <div className="pointer-events-auto max-w-4xl w-full bg-background/95 backdrop-blur-sm border shadow-lg rounded-xl p-6 flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1 space-y-2 text-center md:text-left">
            <h3 className="font-semibold text-lg">Nós usamos cookies 🍪</h3>
            <p className="text-sm text-muted-foreground">
              Utilizamos cookies e tecnologias semelhantes para melhorar a sua experiência, analisar o tráfego do site e personalizar conteúdo. 
              Ao clicar em "Aceitar Todos", concorda com a utilização de todos os cookies. Pode personalizar as suas preferências a qualquer momento.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="px-4 py-2 text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
            >
              Personalizar
            </button>
            <button 
              onClick={rejectAll}
              className="px-4 py-2 text-sm font-medium border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
            >
              Rejeitar Não Essenciais
            </button>
            <button 
              onClick={acceptAll}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors"
            >
              Aceitar Todos
            </button>
          </div>
        </div>
      </div>
      <CookieSettingsModal />
    </>
  );
}
