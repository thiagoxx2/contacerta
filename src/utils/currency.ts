/**
 * Utility functions for BRL currency formatting and parsing
 */

/**
 * Removes all non-digit characters from a string
 */
export function digitsOnly(str: string): string {
  return str.replace(/\D/g, '');
}

/**
 * Formats cents (integer) to BRL currency string
 */
export function formatCentsToBRL(cents: number | null): string {
  if (cents === null || cents === undefined) {
    return '';
  }
  
  const formatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
  
  return formatter.format(cents / 100);
}

/**
 * Parses a masked BRL string to cents (integer)
 */
export function parseToCentsFromMasked(str: string): number {
  const digits = digitsOnly(str);
  return digits ? parseInt(digits, 10) : 0;
}
