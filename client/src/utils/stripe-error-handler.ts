// Stripe Error Handler - Enhanced protection against 429 and iframe issues
export class StripeErrorHandler {
  private static rateLimitCount = 0;
  private static lastRateLimitTime = 0;
  private static readonly RATE_LIMIT_COOLDOWN = 30000; // 30 seconds

  static checkIframeWarning(): void {
    // Check if running in iframe (potential security issue)
    if (window.self !== window.top) {
      console.warn('[StripeFix] WARNING: Payment form detected in iframe - this may restrict payment methods');
      console.warn('[StripeFix] Recommendation: Load payment page directly (not in iframe) for best compatibility');
    }
  }

  static handleRateLimit(): boolean {
    const now = Date.now();
    const timeSinceLastLimit = now - this.lastRateLimitTime;

    if (timeSinceLastLimit < this.RATE_LIMIT_COOLDOWN) {
      console.warn(`[StripeFix] Rate limit cooldown active. Wait ${Math.ceil((this.RATE_LIMIT_COOLDOWN - timeSinceLastLimit) / 1000)}s before retry`);
      return false; // Don't allow request
    }

    this.rateLimitCount++;
    this.lastRateLimitTime = now;
    console.log(`[StripeFix] Rate limit handled (count: ${this.rateLimitCount})`);
    return true; // Allow request
  }

  static handleApiError(error: any): {
    shouldRetry: boolean;
    retryDelay: number;
    userMessage: string;
  } {
    const errorMessage = error?.message || error?.toString() || 'Unknown error';

    // Handle 429 Too Many Requests
    if (errorMessage.includes('429') || errorMessage.includes('Too Many Requests')) {
      return {
        shouldRetry: this.handleRateLimit(),
        retryDelay: 3000,
        userMessage: 'Système temporairement occupé. Nouvelle tentative en cours...'
      };
    }

    // Handle 402 Payment Required
    if (errorMessage.includes('402') || errorMessage.includes('Payment Required')) {
      return {
        shouldRetry: false,
        retryDelay: 0,
        userMessage: 'Erreur de configuration du paiement. Veuillez contacter le support.'
      };
    }

    // Handle network errors
    if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
      return {
        shouldRetry: true,
        retryDelay: 2000,
        userMessage: 'Problème de connexion. Nouvelle tentative...'
      };
    }

    // Default error handling
    return {
      shouldRetry: false,
      retryDelay: 0,
      userMessage: 'Une erreur est survenue lors du traitement du paiement.'
    };
  }

  static logStripeConfig(): void {
    console.log('[StripeFix] Stripe configuration check:');
    console.log('- Public key configured:', !!import.meta.env.VITE_STRIPE_PUBLIC_KEY);
    console.log('- Running in iframe:', window.self !== window.top);
    console.log('- Current domain:', window.location.hostname);
    console.log('- Rate limit count:', this.rateLimitCount);
  }
}