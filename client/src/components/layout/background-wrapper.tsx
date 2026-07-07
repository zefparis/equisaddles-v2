import { ReactNode } from "react";

interface BackgroundWrapperProps {
  children: ReactNode;
}

export default function BackgroundWrapper({ children }: BackgroundWrapperProps) {
  return (
    <div 
      className="min-h-screen relative overflow-x-hidden"
      style={{
        backgroundImage: `url('/images/fond%20background1.jpg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed',
        backgroundColor: '#6B4226' // Couleur de fallback
      }}
    >
      {/* Overlay très léger pour améliorer la lisibilité du contenu */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ 
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.2) 100%)',
          zIndex: 0 
        }}
      />
      
      {/* Contenu principal */}
      <div className="relative" style={{ zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
}
