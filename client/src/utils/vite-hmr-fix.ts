// Fix for Vite HMR WebSocket errors on Replit
// This prevents the "localhost:undefined" WebSocket error from breaking the app

// Intercept WebSocket errors and handle them gracefully
if (typeof window !== 'undefined') {
  // Catch unhandled promise rejections from WebSocket
  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason && event.reason.toString().includes('WebSocket') && event.reason.toString().includes('localhost:undefined')) {
      console.warn('[Vite WS fallback] Caught WebSocket promise rejection, continuing without HMR');
      event.preventDefault(); // Prevent unhandled rejection error
    }
  });

  // Override console.error to filter WebSocket errors
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    if (message.includes('WebSocket') && message.includes('localhost:undefined')) {
      console.warn('[Vite WS fallback] WebSocket connection failed, continuing without HMR');
      return;
    }
    originalError.apply(console, args);
  };
}

export {};