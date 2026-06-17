// Input validation utilities for sensitive data

/**
 * Validates Brazilian CPF format (XXX.XXX.XXX-XX or XXXXXXXXXXX)
 */
export function isValidCPF(cpf: string | null | undefined): boolean {
  if (!cpf) return true; // Allow empty
  
  const cleaned = cpf.replace(/[^\\d]/g, '');
  
  if (cleaned.length !== 11) return false;
  
  // Check for known invalid patterns
  if (/^(\d)\1+$/.test(cleaned)) return false;
  
  // Validate check digits
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.charAt(9))) return false;
  
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.charAt(10))) return false;
  
  return true;
}

/**
 * Validates Brazilian phone format
 * Accepts: (XX) XXXXX-XXXX, (XX) XXXX-XXXX, or just digits
 */
export function isValidPhone(phone: string | null | undefined): boolean {
  if (!phone) return true; // Allow empty
  
  const cleaned = phone.replace(/[^\\d]/g, '');
  return cleaned.length >= 10 && cleaned.length <= 11;
}

/**
 * Validates email format
 */
export function isValidEmail(email: string | null | undefined): boolean {
  if (!email) return true; // Allow empty
  
  const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Sanitizes string input to prevent XSS
 * Removes potentially dangerous HTML characters
 */
export function sanitizeInput(input: string | null | undefined): string {
  if (!input) return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Validates and sanitizes data for database insertion
 * Returns sanitized data or throws error with validation issues
 */
export function validateAndSanitizeRecord(
  data: Record<string, unknown>,
  rules: {
    cpfFields?: string[];
    phoneFields?: string[];
    emailFields?: string[];
    maxLengths?: Record<string, number>;
  } = {}
): { isValid: boolean; errors: string[]; sanitizedData: Record<string, unknown> } {
  const errors: string[] = [];
  const sanitizedData: Record<string, unknown> = {};
  
  const { cpfFields = [], phoneFields = [], emailFields = [], maxLengths = {} } = rules;
  
  for (const [key, value] of Object.entries(data)) {
    let sanitizedValue = value;
    
    // Only sanitize strings
    if (typeof value === 'string') {
      // Check max length
      if (maxLengths[key] && value.length > maxLengths[key]) {
        errors.push(`Campo \"${key}\" excede o tamanho máximo de ${maxLengths[key]} caracteres`);
        continue;
      }
      
      // Validate CPF fields
      if (cpfFields.includes(key) && !isValidCPF(value)) {
        errors.push(`CPF inválido no campo \"${key}\"`);
      }
      
      // Validate phone fields
      if (phoneFields.includes(key) && !isValidPhone(value)) {
        errors.push(`Telefone inválido no campo \"${key}\"`);
      }
      
      // Validate email fields
      if (emailFields.includes(key) && !isValidEmail(value)) {
        errors.push(`Email inválido no campo \"${key}\"`);
      }
      
      // Sanitize to prevent XSS (but keep original for valid fields)
      sanitizedValue = value.trim();
    }
    
    sanitizedData[key] = sanitizedValue;
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData
  };
}

/**
 * Formats CPF for display (XXX.XXX.XXX-XX)
 */
export function formatCPF(cpf: string | null | undefined): string {
  if (!cpf) return '';
  
  const cleaned = cpf.replace(/[^\\d]/g, '');
  if (cleaned.length !== 11) return cpf;
  
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formats phone for display
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '';
  
  const cleaned = phone.replace(/[^\\d]/g, '');
  
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 10) {
    return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  }
  
  return phone;
}

/**
 * Masks sensitive data for display (shows only last 4 digits)
 */
export function maskSensitiveData(data: string | null | undefined, showLastN: number = 4): string {
  if (!data) return '';
  
  if (data.length <= showLastN) return data;
  
  const masked = '*'.repeat(data.length - showLastN);
  return masked + data.slice(-showLastN);
}
