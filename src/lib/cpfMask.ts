/**
 * Mascara um CPF para exibição na tabela
 * Formato: ***.XXX.XXX-XX onde apenas os últimos 5 dígitos são visíveis
 */
export function maskCpf(cpf: string | null | undefined): string {
  if (!cpf) return "-";
  
  // Remove caracteres não numéricos
  const digits = cpf.replace(/\D/g, "");
  
  if (digits.length < 11) {
    // CPF incompleto - mascara parcialmente
    if (digits.length <= 3) return "***";
    if (digits.length <= 6) return `***.${digits.slice(3)}`;
    return `***.***.*${digits.slice(7)}`;
  }
  
  // CPF completo: mostra apenas os últimos 5 dígitos
  // Formato: ***.***.**X-XX
  const lastTwo = digits.slice(9);
  const beforeLast = digits.slice(8, 9);
  
  return `***.***.**${beforeLast}-${lastTwo}`;
}

/**
 * Formata um CPF para exibição completa
 */
export function formatCpf(cpf: string | null | undefined): string {
  if (!cpf) return "-";
  
  const digits = cpf.replace(/\D/g, "");
  
  if (digits.length !== 11) return cpf;
  
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}
