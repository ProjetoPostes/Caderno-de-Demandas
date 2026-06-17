/**
 * Mapeamento de erros do banco de dados para mensagens amigáveis ao usuário
 * Evita exposição de detalhes técnicos que poderiam ajudar atacantes
 */

interface DetailedError {
  userMessage: string;
  technicalDetails?: string;
  code?: string;
}

export function mapDatabaseError(error: unknown, includeDetails = false): string {
  const errorObj = error as { message?: string; code?: string; details?: string; hint?: string };
  const message = errorObj?.message?.toLowerCase() || '';
  const code = errorObj?.code || '';
  
  let result: DetailedError = {
    userMessage: 'Erro ao processar solicitação. Tente novamente.',
  };
  
  // Erros de RLS (Row Level Security)
  if (message.includes('row-level security') || message.includes('rls') || code === '42501') {
    result = {
      userMessage: 'Você não tem permissão para realizar esta operação.',
      code: 'RLS_VIOLATION',
      technicalDetails: includeDetails ? `Política RLS bloqueou a operação. Verifique as permissões do usuário.` : undefined,
    };
  }
  // Erros de permissão
  else if (message.includes('permission denied') || code === '42501') {
    result = {
      userMessage: 'Acesso negado. Verifique suas permissões.',
      code: 'PERMISSION_DENIED',
      technicalDetails: includeDetails ? `Permissão negada: ${errorObj?.hint || 'sem detalhes'}` : undefined,
    };
  }
  // Erros de duplicação
  else if (message.includes('duplicate key') || message.includes('already exists') || code === '23505') {
    result = {
      userMessage: 'Este registro já existe no sistema.',
      code: 'DUPLICATE_KEY',
      technicalDetails: includeDetails ? `Violação de chave única: ${errorObj?.details || 'campo duplicado'}` : undefined,
    };
  }
  // Erros de chave estrangeira
  else if (message.includes('foreign key') || message.includes('violates foreign key') || code === '23503') {
    result = {
      userMessage: 'Não é possível completar. Existem registros relacionados.',
      code: 'FOREIGN_KEY_VIOLATION',
      technicalDetails: includeDetails ? `Referência inválida: ${errorObj?.details || 'registro relacionado não encontrado'}` : undefined,
    };
  }
  // Erros de constraint
  else if (message.includes('violates check constraint') || code === '23514') {
    result = {
      userMessage: 'Dados inválidos. Verifique os valores informados.',
      code: 'CHECK_VIOLATION',
      technicalDetails: includeDetails ? `Constraint violada: ${errorObj?.details || 'valor fora do permitido'}` : undefined,
    };
  }
  // Erros de not null
  else if (message.includes('not-null constraint') || message.includes('null value') || code === '23502') {
    result = {
      userMessage: 'Campos obrigatórios não preenchidos.',
      code: 'NOT_NULL_VIOLATION',
      technicalDetails: includeDetails ? `Campo obrigatório: ${errorObj?.details || 'valor nulo não permitido'}` : undefined,
    };
  }
  // Erros de tipo de dados
  else if (message.includes('invalid input syntax') || code === '22P02') {
    result = {
      userMessage: 'Formato de dados inválido. Verifique os campos preenchidos.',
      code: 'INVALID_INPUT',
      technicalDetails: includeDetails ? `Tipo inválido: ${errorObj?.details || 'formato incorreto'}` : undefined,
    };
  }
  // Erros de conexão
  else if (message.includes('network') || message.includes('connection') || message.includes('fetch')) {
    result = {
      userMessage: 'Erro de conexão. Verifique sua internet e tente novamente.',
      code: 'NETWORK_ERROR',
      technicalDetails: includeDetails ? 'Falha na conexão com o servidor.' : undefined,
    };
  }
  // Erros de timeout
  else if (message.includes('timeout') || code === '57014') {
    result = {
      userMessage: 'Operação demorou muito. Tente novamente.',
      code: 'TIMEOUT',
      technicalDetails: includeDetails ? 'A consulta excedeu o tempo limite.' : undefined,
    };
  }
  // Erros de autenticação
  else if (message.includes('jwt') || message.includes('token') || message.includes('unauthorized') || code === 'PGRST301') {
    result = {
      userMessage: 'Sessão expirada. Faça login novamente.',
      code: 'AUTH_ERROR',
      technicalDetails: includeDetails ? 'Token de autenticação inválido ou expirado.' : undefined,
    };
  }
  // Erros de limite de taxa
  else if (message.includes('rate limit') || message.includes('too many requests') || code === '429') {
    result = {
      userMessage: 'Muitas requisições. Aguarde um momento e tente novamente.',
      code: 'RATE_LIMIT',
      technicalDetails: includeDetails ? 'Limite de requisições excedido.' : undefined,
    };
  }
  // Erro genérico
  else {
    console.error('Database error:', error);
  }
  
  // Retorna mensagem simples ou com detalhes técnicos
  if (includeDetails && result.technicalDetails) {
    return `${result.userMessage} [${result.code}] ${result.technicalDetails}`;
  }
  
  return result.userMessage;
}

/**
 * Mapeia erros com mais detalhes para administradores
 */
export function mapDatabaseErrorDetailed(error: unknown): string {
  return mapDatabaseError(error, true);
}

/**
 * Valida CPF brasileiro
 */
export function isValidCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1+$/.test(cleanCPF)) return false;
  
  // Valida primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCPF[i]) * (10 - i);
  }
  let remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF[9])) return false;
  
  // Valida segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleanCPF[i]) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF[10])) return false;
  
  return true;
}

/**
 * Valida email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Valida telefone brasileiro
 */
export function isValidPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\D/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 11;
}
