import { useMemo } from "react";
import { useDespacho } from "./useDespacho";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getMonth, getYear } from "date-fns";
import { ptBR } from "date-fns/locale";

export function useDespachoStats() {
  const { data: despachoData, isLoading } = useDespacho(true); // Inclui concluídas para estatísticas

  const stats = useMemo(() => {
    if (!despachoData || despachoData.length === 0) {
      return {
        osAbertas: 0,
        osComInconsistenciaAbertas: 0,
        osPrazo0a5: 0,
        osPrazo6a10: 0,
        osPrazo11a15: 0,
        osNaoConcluidasPorFamilia: [],
        osTotaisPorResponsavel: [],
        osConcluidasPorMes: [],
        osTotaisPorDiaMesAtual: [],
      };
    }

    // OSs não concluídas (abertas) - filtra pela coluna concluida
    const osAbertas = despachoData.filter(
      (d) => !d.concluida
    );

    // OSs abertas com inconsistência
    const osComInconsistenciaAbertas = osAbertas.filter(
      (d) => d.inconsistencia && d.inconsistencia > 0
    ).length;

    // OSs por prazo
    const osPrazo0a5 = osAbertas.filter(
      (d) => (d.dias_para_despacho ?? 0) >= 0 && (d.dias_para_despacho ?? 0) <= 5
    ).length;
    const osPrazo6a10 = osAbertas.filter(
      (d) => (d.dias_para_despacho ?? 0) >= 6 && (d.dias_para_despacho ?? 0) <= 10
    ).length;
    const osPrazo11a15 = osAbertas.filter(
      (d) => (d.dias_para_despacho ?? 0) >= 11 && (d.dias_para_despacho ?? 0) <= 15
    ).length;

    // OSs não concluídas por família
    const familiaCounts: Record<string, number> = {};
    osAbertas.forEach((d) => {
      const familia = d.familia || "Sem Família";
      familiaCounts[familia] = (familiaCounts[familia] || 0) + 1;
    });
    const osNaoConcluidasPorFamilia = Object.entries(familiaCounts)
      .map(([familia, count]) => ({ familia, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // OSs totais por responsável
    const responsavelCounts: Record<string, number> = {};
    despachoData.forEach((d) => {
      const responsavel = d.responsavel || "Não Atribuído";
      responsavelCounts[responsavel] = (responsavelCounts[responsavel] || 0) + 1;
    });
    const osTotaisPorResponsavel = Object.entries(responsavelCounts)
      .map(([responsavel, count]) => ({ responsavel, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // OSs concluídas por mês (últimos 6 meses)
    const osConcluidas = despachoData.filter(
      (d) => d.tratativa === "Concluída" || d.tratativa === "Executada"
    );
    const mesCounts: Record<string, number> = {};
    osConcluidas.forEach((d) => {
      try {
        const date = parseISO(d.updated_at);
        const mesKey = format(date, "MMM/yy", { locale: ptBR });
        mesCounts[mesKey] = (mesCounts[mesKey] || 0) + 1;
      } catch {
        // Ignora datas inválidas
      }
    });
    const osConcluidasPorMes = Object.entries(mesCounts)
      .map(([mes, count]) => ({ mes, count }))
      .slice(-6);

    // OSs totais por dia (mês atual)
    const hoje = new Date();
    const inicioMes = startOfMonth(hoje);
    const fimMes = endOfMonth(hoje);
    const diasMes = eachDayOfInterval({ start: inicioMes, end: fimMes });
    
    const diaCounts: Record<string, number> = {};
    despachoData.forEach((d) => {
      try {
        const date = parseISO(d.created_at);
        if (getMonth(date) === getMonth(hoje) && getYear(date) === getYear(hoje)) {
          const diaKey = format(date, "dd");
          diaCounts[diaKey] = (diaCounts[diaKey] || 0) + 1;
        }
      } catch {
        // Ignora datas inválidas
      }
    });
    const osTotaisPorDiaMesAtual = diasMes.slice(0, 15).map((dia) => ({
      dia: format(dia, "dd"),
      count: diaCounts[format(dia, "dd")] || 0,
    }));

    return {
      osAbertas: osAbertas.length,
      osComInconsistenciaAbertas,
      osPrazo0a5,
      osPrazo6a10,
      osPrazo11a15,
      osNaoConcluidasPorFamilia,
      osTotaisPorResponsavel,
      osConcluidasPorMes,
      osTotaisPorDiaMesAtual,
    };
  }, [despachoData]);

  return { stats, isLoading };
}
