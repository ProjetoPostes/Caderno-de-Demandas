import { useMemo } from "react";
import { useCaderno } from "./useCaderno";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function useCadernoStats() {
  const { data: cadernoData, isLoading } = useCaderno();

  const stats = useMemo(() => {
    if (!cadernoData || cadernoData.length === 0) {
      return {
        osTotal: 0,
        osAberta: 0,
        osExecutada: 0,
        osImpedida: 0,
        osTotaisPorMes: [],
        osTotaisPorResponsavel: [],
        osPorBase: [],
      };
    }

    // Contagens por status/controle
    const osTotal = cadernoData.length;
    const osAberta = cadernoData.filter(
      (d) => d.controle_os === "Aberta" || !d.controle_os
    ).length;
    const osExecutada = cadernoData.filter(
      (d) => d.controle_os === "Executada"
    ).length;
    const osImpedida = cadernoData.filter(
      (d) => d.controle_os === "Impedida"
    ).length;

    // OSs totais por mês (últimos 6 meses)
    const mesCounts: Record<string, number> = {};
    cadernoData.forEach((d) => {
      try {
        const date = parseISO(d.created_at);
        const mesKey = format(date, "MMM/yy", { locale: ptBR });
        mesCounts[mesKey] = (mesCounts[mesKey] || 0) + 1;
      } catch {
        // Ignora datas inválidas
      }
    });
    const osTotaisPorMes = Object.entries(mesCounts)
      .map(([mes, count]) => ({ mes, count }))
      .slice(-6);

    // OSs totais por responsável
    const responsavelCounts: Record<string, number> = {};
    cadernoData.forEach((d) => {
      const responsavel = d.responsavel || "Não Atribuído";
      responsavelCounts[responsavel] = (responsavelCounts[responsavel] || 0) + 1;
    });
    const osTotaisPorResponsavel = Object.entries(responsavelCounts)
      .map(([responsavel, count]) => ({ responsavel, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // OSs por base
    const baseCounts: Record<string, number> = {};
    cadernoData.forEach((d) => {
      const base = d.base_5311 || "Sem Base";
      baseCounts[base] = (baseCounts[base] || 0) + 1;
    });
    const osPorBase = Object.entries(baseCounts)
      .map(([base, count]) => ({ base, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      osTotal,
      osAberta,
      osExecutada,
      osImpedida,
      osTotaisPorMes,
      osTotaisPorResponsavel,
      osPorBase,
    };
  }, [cadernoData]);

  return { stats, isLoading };
}
