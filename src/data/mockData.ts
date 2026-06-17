// Mock data for the operational system

export interface DespachoOS {
  id: string;
  numos: string;
  diasParaDespacho: number;
  incons: string;
  nomelcd: string;
  regional: string;
  nomecli: string;
  numcpf: string;
  dthNascimento: string;
  responsavel: string;
  tratativa: string;
  motivoImprocedencia: string;
  base: string;
  familiaOs: string;
  telefone: string;
  email: string;
  complemento: string;
  dsclgrOs: string;
  statusTratativa: 'Pendente' | 'Concluído';
  dataConclusao: string;
}

export interface CadernoOS {
  id: string;
  numos: string;
  numobra: string;
  status: string;
  nomelcd: string;
  regional: string;
  controleOs: 'Aberta' | 'Cancelada' | 'Executada' | 'Impedida';
  origem: string;
  prazo: string;
  nomecli: string;
  numcpf: string;
  dthNascimento: string;
  email: string;
  numtel: string;
  numtel2: string;
  complemento: string;
  dsclgrOs: string;
  datasol: string;
  datacontab: string;
  dataprev: string;
  datatertrab: string;
  dthEnvioDineng: string;
  dthRetornoDineng: string;
  dthImpedimento: string;
  dscObservacaoExecucao: string;
  motivoImprocedencia: string;
  pendenciaObra: string;
  criterioEnquadramento: string;
  statusCarta: string;
  tipoCartaEnviada: string;
  base5311: string;
  tranche: string;
  responsavel: string;
  tipoPrioridade: string;
  campoLivre: string;
  empreiteira: string;
  dataEnvio: string;
  dataRecebimento: string;
  blocoCliente: string;
  familia: string;
}

const regionais = ['Norte', 'Sul', 'Leste', 'Oeste', 'Centro'];
const bases = ['Base A', 'Base B', 'Base C', 'Base D'];
const familiasOS = ['Manutenção', 'Instalação', 'Reparo', 'Inspeção', 'Vistoria'];
const tratativas = ['Pendente', 'Em Análise', 'Aprovado', 'Rejeitado', 'Finalizado'];
const controlesCaderno: Array<'Aberta' | 'Cancelada' | 'Executada' | 'Impedida'> = ['Aberta', 'Cancelada', 'Executada', 'Impedida'];
const tiposCarta = ['Carta A', 'Carta B', 'Carta C', 'Sem Carta'];
const tranches = ['Tranche 1', 'Tranche 2', 'Tranche 3'];
const prioridades = ['Alta', 'Média', 'Baixa'];
const empreiteiras = ['Empreiteira Alpha', 'Empreiteira Beta', 'Empreiteira Gamma'];
const responsaveis = ['João Silva', 'Maria Santos', 'Carlos Oliveira', 'Ana Costa', 'Pedro Lima'];

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(start: Date, end: Date): string {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  return date.toISOString().split('T')[0];
}

function generateCPF(): string {
  const nums = Array.from({ length: 11 }, () => Math.floor(Math.random() * 10));
  return `${nums.slice(0, 3).join('')}.${nums.slice(3, 6).join('')}.${nums.slice(6, 9).join('')}-${nums.slice(9).join('')}`;
}

function generatePhone(): string {
  const ddd = Math.floor(Math.random() * 90) + 10;
  const num = Math.floor(Math.random() * 900000000) + 100000000;
  return `(${ddd}) ${num.toString().slice(0, 5)}-${num.toString().slice(5)}`;
}

export function generateDespachoData(count: number): DespachoOS[] {
  return Array.from({ length: count }, (_, i) => {
    const isConcluido = Math.random() > 0.6;
    return {
      id: `despacho-${i + 1}`,
      numos: `OS${String(100000 + i).padStart(8, '0')}`,
      diasParaDespacho: Math.floor(Math.random() * 20),
      incons: Math.random() > 0.7 ? 'Sim' : 'Não',
      nomelcd: `LCD-${String(i + 1).padStart(4, '0')}`,
      regional: randomFrom(regionais),
      nomecli: `Cliente ${i + 1}`,
      numcpf: generateCPF(),
      dthNascimento: randomDate(new Date(1950, 0, 1), new Date(2000, 11, 31)),
      responsavel: randomFrom(responsaveis),
      tratativa: randomFrom(tratativas),
      motivoImprocedencia: Math.random() > 0.5 ? 'N/A' : 'Documentação incompleta',
      base: randomFrom(bases),
      familiaOs: randomFrom(familiasOS),
      telefone: generatePhone(),
      email: `cliente${i + 1}@email.com`,
      complemento: `Bloco ${String.fromCharCode(65 + Math.floor(Math.random() * 5))}, Apto ${Math.floor(Math.random() * 100) + 1}`,
      dsclgrOs: `Descrição da OS ${i + 1} - Serviço de ${randomFrom(familiasOS).toLowerCase()}`,
      statusTratativa: isConcluido ? 'Concluído' : 'Pendente',
      dataConclusao: isConcluido ? randomDate(new Date(2024, 0, 1), new Date(2024, 11, 31)) : '',
    };
  });
}

export function generateCadernoData(count: number): CadernoOS[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `caderno-${i + 1}`,
    numos: `OS${String(200000 + i).padStart(8, '0')}`,
    numobra: `OB${String(300000 + i).padStart(8, '0')}`,
    status: randomFrom(['Aberto', 'Em Andamento', 'Concluído', 'Cancelado', 'Suspenso']),
    nomelcd: `LCD-${String(i + 1).padStart(4, '0')}`,
    regional: randomFrom(regionais),
    controleOs: randomFrom(controlesCaderno),
    origem: `Sistema ${randomFrom(['A', 'B', 'C'])}`,
    prazo: `${Math.floor(Math.random() * 30) + 1} dias`,
    nomecli: `Cliente ${i + 1}`,
    numcpf: generateCPF(),
    dthNascimento: randomDate(new Date(1950, 0, 1), new Date(2000, 11, 31)),
    email: `cliente${i + 1}@email.com`,
    numtel: generatePhone(),
    numtel2: Math.random() > 0.5 ? generatePhone() : '',
    complemento: `Bloco ${String.fromCharCode(65 + Math.floor(Math.random() * 5))}, Apto ${Math.floor(Math.random() * 100) + 1}`,
    dsclgrOs: `Descrição da OS ${i + 1}`,
    datasol: randomDate(new Date(2024, 0, 1), new Date(2024, 11, 31)),
    datacontab: randomDate(new Date(2024, 0, 1), new Date(2024, 11, 31)),
    dataprev: randomDate(new Date(2024, 0, 1), new Date(2024, 11, 31)),
    datatertrab: randomDate(new Date(2024, 0, 1), new Date(2024, 11, 31)),
    dthEnvioDineng: randomDate(new Date(2024, 0, 1), new Date(2024, 11, 31)),
    dthRetornoDineng: randomDate(new Date(2024, 0, 1), new Date(2024, 11, 31)),
    dthImpedimento: Math.random() > 0.7 ? randomDate(new Date(2024, 0, 1), new Date(2024, 11, 31)) : '',
    dscObservacaoExecucao: `Observação ${i + 1}`,
    motivoImprocedencia: Math.random() > 0.5 ? 'N/A' : 'Documentação incompleta',
    pendenciaObra: Math.random() > 0.6 ? 'Sem pendência' : 'Aguardando material',
    criterioEnquadramento: `Critério ${randomFrom(['A', 'B', 'C'])}`,
    statusCarta: randomFrom(['Enviada', 'Pendente', 'Retornada']),
    tipoCartaEnviada: randomFrom(tiposCarta),
    base5311: randomFrom(bases),
    tranche: randomFrom(tranches),
    responsavel: randomFrom(responsaveis),
    tipoPrioridade: randomFrom(prioridades),
    campoLivre: '',
    empreiteira: randomFrom(empreiteiras),
    dataEnvio: randomDate(new Date(2024, 0, 1), new Date(2024, 11, 31)),
    dataRecebimento: randomDate(new Date(2024, 0, 1), new Date(2024, 11, 31)),
    blocoCliente: `Bloco ${String.fromCharCode(65 + Math.floor(Math.random() * 5))}`,
    familia: randomFrom(familiasOS),
  }));
}

// Pre-generated mock data
export const mockDespachoData = generateDespachoData(100);
export const mockCadernoData = generateCadernoData(100);

// Helper function to get month name
function getMonthName(monthIndex: number): string {
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  return months[monthIndex];
}

// Dashboard statistics for Despacho
export const despachoStats = {
  osAbertas: mockDespachoData.filter(d => d.statusTratativa === 'Pendente').length,
  osComInconsistenciaAbertas: mockDespachoData.filter(d => d.statusTratativa === 'Pendente' && d.incons === 'Sim').length,
  osPrazo0a5: mockDespachoData.filter(d => d.statusTratativa === 'Pendente' && d.diasParaDespacho >= 0 && d.diasParaDespacho <= 5).length,
  osPrazo6a10: mockDespachoData.filter(d => d.statusTratativa === 'Pendente' && d.diasParaDespacho >= 6 && d.diasParaDespacho <= 10).length,
  osPrazo11a15: mockDespachoData.filter(d => d.statusTratativa === 'Pendente' && d.diasParaDespacho >= 11 && d.diasParaDespacho <= 15).length,
  osNaoConcluidasPorFamilia: familiasOS.map(f => ({
    familia: f,
    count: mockDespachoData.filter(d => d.statusTratativa === 'Pendente' && d.familiaOs === f).length,
  })),
  osTotaisPorResponsavel: responsaveis.map(r => ({
    responsavel: r,
    count: mockDespachoData.filter(d => d.responsavel === r).length,
  })),
  osConcluidasPorMes: Array.from({ length: 12 }, (_, i) => ({
    mes: getMonthName(i),
    count: mockDespachoData.filter(d => {
      if (!d.dataConclusao) return false;
      const date = new Date(d.dataConclusao);
      return date.getMonth() === i;
    }).length,
  })),
  osTotaisPorDiaMesAtual: Array.from({ length: 31 }, (_, i) => ({
    dia: i + 1,
    count: Math.floor(Math.random() * 10) + 1,
  })),
};

// Dashboard statistics for Caderno
export const cadernoStats = {
  osTotal: mockCadernoData.length,
  osAberta: mockCadernoData.filter(c => c.controleOs === 'Aberta').length,
  osExecutada: mockCadernoData.filter(c => c.controleOs === 'Executada').length,
  osImpedida: mockCadernoData.filter(c => c.controleOs === 'Impedida').length,
  osCancelada: mockCadernoData.filter(c => c.controleOs === 'Cancelada').length,
  osTotaisPorMes: Array.from({ length: 12 }, (_, i) => ({
    mes: getMonthName(i),
    count: mockCadernoData.filter(c => {
      const date = new Date(c.datasol);
      return date.getMonth() === i;
    }).length,
  })),
  osTotaisPorResponsavel: responsaveis.map(r => ({
    responsavel: r,
    count: mockCadernoData.filter(c => c.responsavel === r).length,
  })),
  osPorBase: bases.map(b => ({
    base: b,
    count: mockCadernoData.filter(c => c.base5311 === b).length,
  })),
};
