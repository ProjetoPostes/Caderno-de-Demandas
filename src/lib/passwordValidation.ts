/**
 * Validação de força de senha
 * Implementa requisitos de segurança para senhas fortes
 */

export interface PasswordStrength {
  score: number; // 0-4
  label: 'muito_fraca' | 'fraca' | 'razoavel' | 'forte' | 'muito_forte';
  color: string;
  feedback: string[];
}

export interface PasswordRequirements {
  minLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  noSequences: boolean;
}

/**
 * Verifica os requisitos mínimos da senha
 */
export function checkPasswordRequirements(password: string): PasswordRequirements {
  const hasSequences = /(.)\1{2,}/.test(password) || /(?:abc|bcd|cde|123|234|345|456|567|678|789)/i.test(password);
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
    noSequences: !hasSequences,
  };
}

/**
 * Calcula a força da senha
 */
export function calculatePasswordStrength(password: string): PasswordStrength {
  const requirements = checkPasswordRequirements(password);
  const feedback: string[] = [];
  let score = 0;
  
  // Pontuação por requisitos atendidos
  if (requirements.minLength) score++;
  else feedback.push('Mínimo 8 caracteres');
  
  if (requirements.hasUppercase) score++;
  else feedback.push('Adicione letras maiúsculas');
  
  if (requirements.hasLowercase) score++;
  else feedback.push('Adicione letras minúsculas');
  
  if (requirements.hasNumber) score++;
  else feedback.push('Adicione números');
  
  if (requirements.hasSpecial) score++;
  else feedback.push('Adicione caracteres especiais (!@#$%...)');
  
  // Penalizar senhas comuns
  const commonPasswords = [
    '12345678', '123456789', 'password', 'senha123', 'qwerty123',
    'abc12345', 'admin123', 'user1234', 'password1', 'letmein1'
  ];
  if (commonPasswords.includes(password.toLowerCase())) {
    score = Math.max(0, score - 3);
    feedback.push('Senha muito comum');
  }
  
  // Penalizar sequências
  if (/(.)\1{2,}/.test(password)) {
    score = Math.max(0, score - 1);
    feedback.push('Evite caracteres repetidos');
  }
  
  // Penalizar sequências numéricas ou alfabéticas
  if (/(?:abc|bcd|cde|123|234|345|456|567|678|789)/i.test(password)) {
    score = Math.max(0, score - 1);
    feedback.push('Evite sequências previsíveis');
  }
  
  // Normalizar score para 0-4
  const normalizedScore = Math.min(4, Math.max(0, score - 1));
  
  const labels: Array<'muito_fraca' | 'fraca' | 'razoavel' | 'forte' | 'muito_forte'> = 
    ['muito_fraca', 'fraca', 'razoavel', 'forte', 'muito_forte'];
  const colors = ['bg-destructive', 'bg-destructive', 'bg-warning', 'bg-primary', 'bg-green-500'];
  
  return {
    score: normalizedScore,
    label: labels[normalizedScore],
    color: colors[normalizedScore],
    feedback: feedback.slice(0, 3), // Limitar a 3 sugestões
  };
}

/**
 * Verifica se a senha é forte o suficiente
 */
export function isPasswordStrong(password: string): boolean {
  const strength = calculatePasswordStrength(password);
  return strength.score >= 2; // Mínimo "razoável"
}

/**
 * Lista de senhas comuns para verificação (subset)
 * Em produção, usar uma API de verificação de senhas vazadas
 */
const COMMON_PASSWORDS = new Set([
  '123456', '123456789', '12345678', 'password', '12345', 
  '1234567', '1234567890', 'qwerty', 'abc123', 'monkey',
  'senha', 'senha123', 'admin', 'administrator', 'root',
  'letmein', 'welcome', 'login', 'master', 'dragon',
  'passw0rd', 'password1', 'password123', 'qwerty123',
  'admin123', 'user', 'user123', 'guest', 'guest123',
  'test', 'test123', '123qwe', 'qwe123', 'zxcvbn'
]);

/**
 * Verifica se a senha está na lista de senhas comuns
 */
export function isCommonPassword(password: string): boolean {
  return COMMON_PASSWORDS.has(password.toLowerCase());
}

/**
 * Obtém mensagem de força da senha em português
 */
export function getStrengthLabel(label: PasswordStrength['label']): string {
  const labels: Record<PasswordStrength['label'], string> = {
    muito_fraca: 'Muito Fraca',
    fraca: 'Fraca',
    razoavel: 'Razoável',
    forte: 'Forte',
    muito_forte: 'Muito Forte',
  };
  return labels[label];
}
