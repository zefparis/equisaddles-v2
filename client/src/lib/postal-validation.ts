// Validation des codes postaux par pays
export const POSTAL_CODE_PATTERNS = {
  // Europe
  BE: { pattern: /^\d{4}$/, length: 4, example: "1000" }, // Belgique
  FR: { pattern: /^\d{5}$/, length: 5, example: "75001" }, // France
  DE: { pattern: /^\d{5}$/, length: 5, example: "10115" }, // Allemagne
  NL: { pattern: /^\d{4}\s?[A-Z]{2}$/i, length: 7, example: "1012 AB" }, // Pays-Bas
  LU: { pattern: /^\d{4}$/, length: 4, example: "1234" }, // Luxembourg
  ES: { pattern: /^\d{5}$/, length: 5, example: "28001" }, // Espagne
  IT: { pattern: /^\d{5}$/, length: 5, example: "00118" }, // Italie
  AT: { pattern: /^\d{4}$/, length: 4, example: "1010" }, // Autriche
  CH: { pattern: /^\d{4}$/, length: 4, example: "8001" }, // Suisse
  GB: { pattern: /^[A-Z]{1,2}\d{1,2}\s?\d[A-Z]{2}$/i, length: 8, example: "SW1A 1AA" }, // Royaume-Uni
  IE: { pattern: /^[A-Z]\d{2}\s?[A-Z0-9]{4}$/i, length: 8, example: "D02 XY45" }, // Irlande
  
  // Nordique
  DK: { pattern: /^\d{4}$/, length: 4, example: "1000" }, // Danemark
  SE: { pattern: /^\d{3}\s?\d{2}$/, length: 6, example: "123 45" }, // Suède
  NO: { pattern: /^\d{4}$/, length: 4, example: "0001" }, // Norvège
  FI: { pattern: /^\d{5}$/, length: 5, example: "00100" }, // Finlande
  
  // Europe de l'Est
  PL: { pattern: /^\d{2}-\d{3}$/, length: 6, example: "00-001" }, // Pologne
  CZ: { pattern: /^\d{3}\s?\d{2}$/, length: 6, example: "100 00" }, // République tchèque
  SK: { pattern: /^\d{3}\s?\d{2}$/, length: 6, example: "811 01" }, // Slovaquie
  HU: { pattern: /^\d{4}$/, length: 4, example: "1011" }, // Hongrie
  
  // International
  US: { pattern: /^\d{5}(-\d{4})?$/, length: 10, example: "10001" }, // États-Unis
  CA: { pattern: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i, length: 7, example: "K1A 0A6" }, // Canada
  AU: { pattern: /^\d{4}$/, length: 4, example: "2000" }, // Australie
  JP: { pattern: /^\d{3}-\d{4}$/, length: 8, example: "100-0001" }, // Japon
  
  // Défaut pour autres pays
  DEFAULT: { pattern: /^.{3,10}$/, length: 10, example: "12345" }
};

export function validatePostalCode(country: string, postalCode: string): boolean {
  const countryPattern = POSTAL_CODE_PATTERNS[country as keyof typeof POSTAL_CODE_PATTERNS] || POSTAL_CODE_PATTERNS.DEFAULT;
  return countryPattern.pattern.test(postalCode.trim());
}

export function getPostalCodeExample(country: string): string {
  const countryPattern = POSTAL_CODE_PATTERNS[country as keyof typeof POSTAL_CODE_PATTERNS] || POSTAL_CODE_PATTERNS.DEFAULT;
  return countryPattern.example;
}

export function getPostalCodeMaxLength(country: string): number {
  const countryPattern = POSTAL_CODE_PATTERNS[country as keyof typeof POSTAL_CODE_PATTERNS] || POSTAL_CODE_PATTERNS.DEFAULT;
  return countryPattern.length;
}

export function formatPostalCode(country: string, postalCode: string): string {
  const trimmed = postalCode.trim().toUpperCase();
  
  switch (country) {
    case 'NL':
      // Format: 1234 AB
      if (trimmed.length >= 4) {
        return trimmed.slice(0, 4) + (trimmed.length > 4 ? ' ' + trimmed.slice(4, 6) : '');
      }
      return trimmed;
    
    case 'GB':
      // Format: SW1A 1AA
      if (trimmed.length > 4) {
        return trimmed.slice(0, -3) + ' ' + trimmed.slice(-3);
      }
      return trimmed;
    
    case 'PL':
      // Format: 12-345
      if (trimmed.length >= 2) {
        return trimmed.slice(0, 2) + (trimmed.length > 2 ? '-' + trimmed.slice(2, 5) : '');
      }
      return trimmed;
    
    case 'SE':
    case 'CZ':
    case 'SK':
      // Format: 123 45
      if (trimmed.length >= 3) {
        return trimmed.slice(0, 3) + (trimmed.length > 3 ? ' ' + trimmed.slice(3, 5) : '');
      }
      return trimmed;
    
    case 'CA':
      // Format: K1A 0A6
      if (trimmed.length >= 3) {
        return trimmed.slice(0, 3) + (trimmed.length > 3 ? ' ' + trimmed.slice(3, 6) : '');
      }
      return trimmed;
    
    case 'JP':
      // Format: 100-0001
      if (trimmed.length >= 3) {
        return trimmed.slice(0, 3) + (trimmed.length > 3 ? '-' + trimmed.slice(3, 7) : '');
      }
      return trimmed;
    
    default:
      return trimmed;
  }
}