import { useMemo, useState } from "react";
import { RefreshCw, Gauge, Network, Users, Wallet } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardQuantitativos } from "@/hooks/useDashboardQuantitativos";
import { useTranchesCaderno } from "@/hooks/useTabelasOperacionais";
import { resumoDashboard, type QuantitativoDashboard } from "@/lib/dashboardObras";

const fmtNum = (n: number, d = 2) => n.toLocaleString("pt-BR", { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtPct = (r: number) => `${fmtNum(r * 100)}%`;
const curto = (u: string) => (u.length > 28 ? u.slice(0, 26) + "…" : u);

function Kpi({ titulo, valor, sub, icon: Icon, progresso }: { titulo: string; valor: string; sub: string; icon: any; progresso?: number }) {
  return (
    <Card>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{titulo}</span>
          <Icon className="h-4 w-4" />
        </div>
        <div className="text-2xl font-bold">{valor}</div>
        {progresso !== undefined && <Progress value={Math.min(100, progresso * 100)} className="h-2" />}
        <div className="text-xs text-muted-foreground">{sub}</div>
      </CardContent>
    </Card>
  );
}

function Tabela({ linhas, titulo }: { linhas: QuantitativoDashboard[]; titulo: string }) {
  const prev = linhas.reduce((s, l) => s + l.vr_previsto, 0);
  const exec = linhas.reduce((s, l) => s + l.vr_executado, 0);
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-base">{titulo}</CardTitle></CardHeader>
      <CardContent className="overflow-x-auto">
        <Table className="text-xs">
          <TableHeader>
            <TableRow>
              <TableHead>Unidade</TableHead>
              <TableHead className="text-right">Meta</TableHead>
              <TableHead className="text-right">Valor ref.</TableHead>
              <TableHead className="text-right">VR previsto</TableHead>
              <TableHead className="text-right">Qtd. executada</TableHead>
              <TableHead className="text-right">VR executado</TableHead>
              <TableHead className="text-right">% execução</TableHead>
              <TableHead className="text-right">Saldo físico</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {linhas.map((l) => (
              <TableRow key={l.unidade}>
                <TableCell className="font-medium">{l.unidade}</TableCell>
                <TableCell className="text-right">{fmtNum(l.meta_programa, 3)}</TableCell>
                <TableCell className="text-right">{fmtNum(l.valor_referencia)}</TableCell>
                <TableCell className="text-right">{fmtNum(l.vr_previsto)}</TableCell>
                <TableCell className="text-right">{fmtNum(l.quantidade_executada, 3)}</TableCell>
                <TableCell className="text-right">{fmtNum(l.vr_executado)}</TableCell>
                <TableCell className="text-right">{fmtNum(l.percentual_execucao)}%</TableCell>
                <TableCell className="text-right">{fmtNum(l.saldo_fisico, 3)}</TableCell>
              </TableRow>
            ))}
            {linhas.length === 0 && (
              <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground">Sem dados</TableCell></TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3} className="font-semibold">Total</TableCell>
              <TableCell className="text-right font-semibold">{fmtNum(prev)}</TableCell>
              <TableCell />
              <TableCell className="text-right font-semibold">{fmtNum(exec)}</TableCell>
              <TableCell className="text-right font-semibold">{fmtPct(prev > 0 ? exec / prev : 0)}</TableCell>
              <TableCell />
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function DashboardObras() {
  const [tranche, setTranche] = useState<string>("todas");
  const { data: tranches } = useTranchesCaderno();
  const { data = [], isLoading, error, refetch, isFetching } = useDashboardQuantitativos(tranche === "todas" ? null : tranche);
  const r = useMemo(() => resumoDashboard(data), [data]);
  const chart = data.map((l) => ({ nome: curto(l.unidade), Previsto: l.vr_previsto, Executado: l.vr_executado }));

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard de Obras</h1>
          <p className="text-sm text-muted-foreground">Avanço físico e quantitativos</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={tranche} onValueChange={setTranche}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Tranche" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as tranches</SelectItem>
              {(tranches ?? []).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => refetch()} aria-label="Atualizar">
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive"><CardContent className="p-4 text-sm text-destructive">
          Erro ao carregar: {(error as Error).message}
        </CardContent></Card>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Kpi titulo="Avanço físico" valor={fmtPct(r.avancoGeral)} sub="VR executado total / VR previsto total" icon={Gauge} progresso={r.avancoGeral} />
            <Kpi titulo="Avanço redes" valor={fmtPct(r.avancoRedes)} sub="Redes, postes, transformadores e padrão" icon={Network} progresso={r.avancoRedes} />
            <Kpi titulo="Avanço consumidor" valor={fmtPct(r.avancoConsumidor)} sub="Medidores" icon={Users} progresso={r.avancoConsumidor} />
            <Kpi titulo="VR executado / previsto" valor={fmtNum(r.vrExecutado)} sub={`de ${fmtNum(r.vrPrevisto)} · saldo ${fmtNum(r.vrPrevisto - r.vrExecutado)}`} icon={Wallet} />
          </div>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">VR previsto x executado</CardTitle></CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="nome" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={70} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(v: number) => fmtNum(v)} />
                  <Legend />
                  <Bar dataKey="Previsto" fill="hsl(var(--muted-foreground))" />
                  <Bar dataKey="Executado" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Tabela titulo="Redes" linhas={r.redes} />
          <Tabela titulo="Consumidor" linhas={r.consumidor} />
        </>
      )}
    </div>
  );
}
