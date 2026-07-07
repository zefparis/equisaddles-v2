import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export function useInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Vérifier si l'app est déjà installée
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isInWebAppiOS);
    };

    checkIfInstalled();

    // Écouter l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Écouter l'événement appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
      setIsInstallable(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!installPrompt) {
      // Fallback pour les navigateurs qui ne supportent pas beforeinstallprompt
      const userAgent = navigator.userAgent.toLowerCase();
      const isMobile = /android|iphone|ipad|mobile/i.test(userAgent);
      let instructions = '';
      
      if (isMobile) {
        if (userAgent.includes('safari') || userAgent.includes('iphone') || userAgent.includes('ipad')) {
          // Instructions pour Safari iOS
          instructions = '📱 Sur iPhone/iPad :\n\n1. Cliquez sur le bouton Partager en bas de l\'écran\n2. Faites défiler et sélectionnez "Sur l\'écran d\'accueil"\n3. Confirmez en appuyant sur "Ajouter"';
        } else if (userAgent.includes('chrome') || userAgent.includes('android')) {
          // Instructions pour Chrome Android
          instructions = '📱 Sur Android :\n\n1. Cliquez sur les 3 points (⋮) en haut à droite\n2. Sélectionnez "Installer l\'application" ou "Ajouter à l\'écran d\'accueil"\n3. Confirmez l\'installation';
        } else {
          instructions = '📱 Pour installer sur mobile :\n\nUtilisez le menu de votre navigateur pour ajouter cette application à votre écran d\'accueil';
        }
      } else {
        // Instructions pour desktop
        if (userAgent.includes('chrome') || userAgent.includes('edge')) {
          instructions = '💻 Sur ordinateur :\n\nCliquez sur l\'icône d\'installation dans la barre d\'adresse ou utilisez le menu (⋮) > "Installer Equi Saddles"';
        } else {
          instructions = '💻 Sur ordinateur :\n\nUtilisez le menu de votre navigateur pour installer cette application';
        }
      }
      
      alert(`Installer l'app Equi Saddles\n\n${instructions}`);
      return;
    }

    try {
      await installPrompt.prompt();
      const choiceResult = await installPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('PWA installée avec succès');
      } else {
        console.log('Installation PWA annulée');
      }
      
      setInstallPrompt(null);
      setIsInstallable(false);
    } catch (error) {
      console.error('Erreur lors de l\'installation PWA:', error);
    }
  };

  return {
    isInstallable,
    isInstalled,
    promptInstall,
    canInstall: isInstallable && !isInstalled
  };
}