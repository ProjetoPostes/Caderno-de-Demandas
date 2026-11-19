/**
 * Exibe o CPF completo formatado (000.000.000-00).
 * Mantido com este nome para compatibilidade com as telas existentes.
 */
export function maskCpf(cpf: string | null | undefined): string {
  return formatCpf(cpf);
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
