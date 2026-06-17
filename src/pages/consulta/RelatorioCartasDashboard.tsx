import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCaderno } from "@/hooks/useCaderno";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { Loader2, Home, Mail, FileText } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(var(--accent))",
];

export default function RelatorioCartasDashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useCaderno(1000);

  const stats = useMemo(() => {
    // Count by tipo_carta_enviada
    const cartasCounts: Record<string, number> = {};
    let totalComCarta = 0;
    let totalSemCarta = 0;

    data.forEach((item) => {
      if (item.tipo_carta_enviada) {
        cartasCounts[item.tipo_carta_enviada] = (cartasCounts[item.tipo_carta_enviada] || 0) + 1;
        totalComCarta++;
      } else {
        totalSemCarta++;
      }
    });

    const cartasData = Object.entries(cartasCounts)
      .map(([tipo, count]) => ({
        tipo,
        count,
      }))
      .sort((a, b) => b.count - a.count);

    // Count by regional with carta
    const regionalCounts: Record<string, number> = {};
    data.forEach((item) => {
      if (item.tipo_carta_enviada && item.regional) {
        regionalCounts[item.regional] = (regionalCounts[item.regional] || 0) + 1;
      }
    });

    const regionalData = Object.entries(regionalCounts)
      .map(([regional, count]) => ({
        regional,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Count by month (data_carta)
    const monthCounts: Record<string, number> = {};
    data.forEach((item) => {
      if (item.data_carta) {
        const date = new Date(item.data_carta);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
      }
    });

    const monthData = Object.entries(monthCounts)
      .map(([month, count]) => ({
        month,
        count,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);

    return {
      totalOS: data.length,
      totalComCarta,
      totalSemCarta,
      cartasData,
      regionalData,
      monthData,
    };
  }, [data]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
              <Home className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-primary">Relatório – Cartas</h1>
              <span className="text-xs text-muted-foreground">Dashboard de visualização</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-6 space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de OSs</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOS}</div>
              <p className="text-xs text-muted-foreground">No caderno</p>
            </CardContent>
          </Card>
          <Card className="border-primary/50 bg-primary/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">OSs com Carta</CardTitle>
              <Mail className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{stats.totalComCarta}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.totalComCarta / stats.totalOS) * 100).toFixed(1)}% do total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">OSs sem Carta</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSemCarta}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.totalSemCarta / stats.totalOS) * 100).toFixed(1)}% do total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Pie Chart - Tipos de Carta */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição por Tipo de Carta</CardTitle>
              <CardDescription>Proporção de cada tipo de carta enviada</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.cartasData}
                    dataKey="count"
                    nameKey="tipo"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ tipo, percent }) => `${tipo} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {stats.cartasData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Bar Chart - Por Tipo */}
          <Card>
            <CardHeader>
              <CardTitle>Quantidade por Tipo de Carta</CardTitle>
              <CardDescription>Total de OSs para cada tipo</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.cartasData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="tipo" type="category" className="text-xs" width={120} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Second Row */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Bar Chart - Por Regional */}
          <Card>
            <CardHeader>
              <CardTitle>Cartas por Regional</CardTitle>
              <CardDescription>Top 10 regionais com mais cartas enviadas</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.regionalData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="regional" className="text-xs" angle={-45} textAnchor="end" height={80} />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Line/Bar Chart - Por Mês */}
          <Card>
            <CardHeader>
              <CardTitle>Cartas Enviadas por Mês</CardTitle>
              <CardDescription>Histórico dos últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.monthData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
