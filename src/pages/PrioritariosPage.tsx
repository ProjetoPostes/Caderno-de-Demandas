import { useDebounce } from "@/hooks/useDebounce";
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Star, Copy, Save, Loader2, AlertTriangle, CheckCircle2, MapPin, IdCard, ClipboardCheck, StickyNote, Users, SearchCheck, FileText } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SimpleTablePage, type SortDir } from "@/components/tables/SimpleTablePage";
import { coordsDoMapa, fmtCoord } from "@/lib/coords";
import { rotaObra } from "@/lib/rotas";
import { podeEditarCorrecao, validarCorrecao } from "@/lib/prioritarioValidation";
import { criarCorTranche, corAlocacao, corCoordenadaValidada, corDecisao, canonicalizarDecisao, type CorBadge } from "@/lib/prioritarioCores";
import { usePrioritarios, useTranchesPrioritario, usePrioritarioOsList, useMunicipiosLocalidade } from "@/hooks/useTabelasOperacionais";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useAnalistas } from "@/hooks/useAnaliseOs";
import { Checkbox } from "@/components/ui/checkbox";
import { maskCpf } from "@/lib/cpfMask";
import { FILTRO_PREENCHIDO, FILTRO_EM_BRANCO, FILTRO_NULO } from "@/lib/valoresColuna";
import type { Prioritario } from "@/types/database";

const PAGE_SIZE = 20;

type PrioritarioRowExt = Prioritario & {
  controle?: string | null;
  tranche?: string | null;
  identificacao?: string | null;
  alocacao?: string | null;
  check_po?: string | null;
  criterio?: string | null;
  motivo_impedimento?: string | null;
  manter_retirar?: string | null;
  endereco?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  cpf_correto?: string | null;
  nome_correto?: string | null;
  nome_municipio_correto?: string | null;
  nome_cliente_ligado?: string | null;
  "Responsável"?: string | null;
  coordenada_validada?: boolean | null;
  municipio_coord?: string | null;
  atendimento?: string | null;
  decisao?: string | null;
  latitude_enbpar?: number | string | null;
  longitude_enbpar?: number | string | null;
  nome_alterado?: boolean | null;
  cpf_alterado?: boolean | null;
  municipio_alterado?: boolean | null;
};

// Contagens apenas para exibição (derivadas dos registros existentes)
function usePrioritariosKpis() {
  return useQuery({
    queryKey: ["prioritarios-kpis"],
    queryFn: async () => {
      const count = async (fn?: (q: any) => any) => {
        let q: any = supabase.from("prioritario").select("id", { count: "exact", head: true });
        if (fn) q = fn(q);
        const { count: c, error } = await q;
        if (error) throw error;
        return c ?? 0;
      };
      const [total, comTranche, checkPo, impedimento] = await Promise.all([
        count(),
        count((q) => q.not("tranche", "is", null)),
        count((q) => q.not("check_po", "is", null).neq("check_po", "")),
        count((q) => q.not("motivo_impedimento", "is", null).neq("motivo_impedimento", "")),
      ]);
      return { total, comTranche, checkPo, impedimento };
    },
  });
}

const copiar = (v?: string | null) => {
  if (!v) return;
  navigator.clipboard.writeText(v);
  toast.success("Copiado");
};

const iniciais = (nome?: string | null) =>
  (nome ?? "?").split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase();

function Kpi({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value?: number; tone: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-md ${tone}`}>{icon}</div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
          <div className="text-lg font-semibold leading-tight">{value?.toLocaleString("pt-BR") ?? "–"}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function Campo({ label, value, copy, mono }: { label: string; value?: string | null; copy?: boolean; mono?: boolean }) {
  return (
    <div className="min-w-0">
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="mt-0.5 flex items-center gap-1">
        <span className={`truncate text-sm ${mono ? "font-mono" : ""}`}>{value || "-"}</span>
        {copy && value && (
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copiar(value)}>
            <Copy className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

function Secao({ icon, titulo, children, className = "" }: { icon: React.ReactNode; titulo: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border bg-card p-4 ${className}`}>
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon} {titulo}
      </div>
      {children}
    </div>
  );
}

function BadgeCor({ cor, children }: { cor: CorBadge | null; children: React.ReactNode }) {
  return <Badge variant="outline" className={`text-[11px] ${cor ?? ""}`}>{children}</Badge>;
}

export default function PrioritariosPage({ standalone = false }: { standalone?: boolean }) {
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sortField, setSortField] = useState("nome");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const buscaAtraso = useDebounce(search, 350);
  const filtrosAtraso = useDebounce(filters, 350);

  const { data, isLoading } = usePrioritarios({ page, pageSize: PAGE_SIZE, search: buscaAtraso, sortField, sortDir, filters: filtrosAtraso });
  const { data: kpis } = usePrioritariosKpis();
  const { data: tranchesOpcoes } = useTranchesPrioritario();
  const corTranche = useMemo(() => criarCorTranche(tranchesOpcoes ?? []), [tranchesOpcoes]);
  const navigate = useNavigate();
  const rows = (data?.rows ?? []) as PrioritarioRowExt[];
  const [selected, setSelected] = useState<PrioritarioRowExt | null>(null);

  const muted = (v?: string | null) => <span className="text-xs text-muted-foreground">{v || "-"}</span>;
  const mapa = coordsDoMapa(selected?.latitude, selected?.longitude);
  const { data: analistas = [] } = useAnalistas();
  const responsaveis = useMemo(() => Array.from(new Set(analistas.map((a) => (a.full_name || a.username || "").trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b)), [analistas]);
  const [marcados, setMarcados] = useState<Set<string | number>>(new Set());
  const [responsavelLote, setResponsavelLote] = useState("");
  const [atribuindo, setAtribuindo] = useState(false);
  const alternarMarcado = (id: string | number) => setMarcados((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const qc = useQueryClient();
  const { user } = useAuth();
  const { profile: perfil } = useProfile();
  const p2 = perfil as { full_name?: string | null; username?: string | null } | null | undefined;
  const nomeUsuario = p2?.full_name || p2?.username || user?.email || "";
  const [erros, setErros] = useState<Record<string, string>>({});
  const [salvando, setSalvando] = useState(false);
  const [consultandoMunicipio, setConsultandoMunicipio] = useState(false);
  const { data: osList, isLoading: loadingOs } = usePrioritarioOsList(selected?.id_cliente, selected?.cpf_corrigido);
  const { data: municipios = [] } = useMunicipiosLocalidade();
  const validarMunicipio = async () => {
    if (!selected) return;
    const latitude = Number(fmtCoord(selected.latitude));
    const longitude = Number(fmtCoord(selected.longitude));
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      toast.error("Informe latitude e longitude válidas para validar o município.");
      return;
    }
    setConsultandoMunicipio(true);
    try {
      const { data: municipio, error } = await supabase.rpc("consultar_municipio_coordenada", {
        p_latitude: latitude,
        p_longitude: longitude,
      });
      if (error) throw error;
      const nome =
        typeof municipio === "string"
          ? municipio
          : municipio && typeof municipio === "object"
            ? String((municipio as Record<string, unknown>).nome ?? (municipio as Record<string, unknown>).municipio ?? "")
            : "";
      if (!nome) {
        toast.warning("Nenhum município encontrado para essas coordenadas.");
        return;
      }
      alterarCampo("municipio_coord", nome);
      toast.success(`Município identificado: ${nome}`);
    } catch (e) {
      toast.error(`Erro ao consultar município: ${e instanceof Error ? e.message : "erro desconhecido"}`);
    } finally {
      setConsultandoMunicipio(false);
    }
  };
  const alterarCampo = (campo: keyof PrioritarioRowExt, valor: string | boolean | null) => {
    setSelected((atual) => atual ? { ...atual, [campo]: valor } : null);
    setErros((e) => { const { [campo as string]: _, ...resto } = e; return resto; });
  };
  const erro = (campo: string) => erros[campo] ? <p className="text-xs text-destructive">{erros[campo]}</p> : null;
  const salvar = async () => {
    if (!selected) return;
    const { erros: novos, payload } = validarCorrecao(selected);
    setErros(novos);
    if (Object.keys(novos).length) { toast.error("Corrija os campos destacados antes de salvar"); return; }
    setSalvando(true);
    const { error } = await (supabase.from("prioritario") as any).update(payload).eq("id", selected.id);
    setSalvando(false);
    if (error) { toast.error(`Erro ao salvar: ${error.message}`); return; }
    toast.success("Alterações salvas");
    setSelected((a) => a ? { ...a, ...payload } as PrioritarioRowExt : a);
    qc.invalidateQueries({ queryKey: ["prioritarios"] });
    qc.invalidateQueries({ queryKey: ["prioritarios-kpis"] });
    qc.invalidateQueries({ queryKey: ["valores-colunas"] });
  };

  const atribuirResponsavel = async () => {
    if (!responsavelLote || marcados.size === 0) return;
    setAtribuindo(true);
    const { error } = await (supabase.from("prioritario") as any).update({ "Responsável": responsavelLote }).in("id", Array.from(marcados));
    setAtribuindo(false);
    if (error) { toast.error(`Erro ao atribuir: ${error.message}`); return; }
    toast.success(`Responsável atribuído a ${marcados.size} cliente(s)`);
    setMarcados(new Set());
    qc.invalidateQueries({ queryKey: ["prioritarios"] });
  };

  return (
    <>
      {!selected && (<>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi icon={<Users className="h-4 w-4" />} label="Prioritários" value={kpis?.total} tone="bg-primary/10 text-primary" />
        <Kpi icon={<Star className="h-4 w-4" />} label="Com tranche" value={kpis?.comTranche} tone="bg-secondary text-secondary-foreground" />
        <Kpi icon={<CheckCircle2 className="h-4 w-4" />} label="Check PO" value={kpis?.checkPo} tone="bg-accent text-accent-foreground" />
        <Kpi icon={<AlertTriangle className="h-4 w-4" />} label="Com impedimento" value={kpis?.impedimento} tone="bg-destructive/10 text-destructive" />
      </div>

      <SimpleTablePage<PrioritarioRowExt>
        standalone={standalone}
        title="Prioritários"
        subtitle="Clientes prioritários"
        icon={<Star className="h-4 w-4" />}
        isLoading={isLoading}
        rows={rows}
        total={data?.total ?? 0}
        page={page}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1); }}
        searchPlaceholder="Buscar por nome, CPF..."
        filterSource={{ tabela: "prioritario", chave: "id" }}
        columnFilters={[
          { field: "controle", label: "Controle", type: "text" },
          { field: "tranche", label: "Tranche" },
          { field: "alocacao", label: "Alocação" },
          { field: "nome", label: "Nome", type: "text" },
          { field: "cpf_corrigido", label: "CPF Corrigido", type: "text" },
          { field: "check_po", label: "Check PO", type: "text" },
          { field: "coordenada_validada", label: "Coordenada validada", options: [
            { value: "true", label: "Sim" },
            { value: "false", label: "Não" },
            { value: FILTRO_NULO, label: "Não informado" },
          ] },
          { field: "nome_cliente_ligado", label: "Nome do cliente ligado", options: [
            { value: FILTRO_PREENCHIDO, label: "Preenchido" },
            { value: FILTRO_EM_BRANCO, label: "Vazio" },
          ] },
          { field: "decisao", label: "Decisão" },
          { field: "Responsável", label: "Responsável", options: [...responsaveis, { value: FILTRO_NULO, label: "Sem responsável" }] },
        ]}
        extraFilters={
          <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/30 p-2 text-xs">
            <span>{marcados.size} selecionado(s)</span>
            <Select value={responsavelLote} onValueChange={setResponsavelLote}>
              <SelectTrigger className="h-8 w-56 text-xs"><SelectValue placeholder="Escolher responsável" /></SelectTrigger>
              <SelectContent>
                {nomeUsuario && !responsaveis.includes(nomeUsuario) && <SelectItem value={nomeUsuario}>{nomeUsuario} (eu)</SelectItem>}
                {responsaveis.map((r) => <SelectItem key={r} value={r}>{r}{r === nomeUsuario ? " (eu)" : ""}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button size="sm" className="h-8" disabled={!responsavelLote || marcados.size === 0 || atribuindo} onClick={atribuirResponsavel}>
              {atribuindo && <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />}Atribuir responsável
            </Button>
            {marcados.size > 0 && <Button size="sm" variant="ghost" className="h-8" onClick={() => setMarcados(new Set())}>Limpar seleção</Button>}
          </div>
        }
        filterValues={filters}
        onFilterChange={(f, v) => { setFilters((p) => ({ ...p, [f]: v })); setPage(1); }}
        sortField={sortField}
        sortDir={sortDir}
        onSortChange={(f, d) => { setSortField(f); setSortDir(d); }}
        onClear={() => { setSearch(""); setFilters({}); setPage(1); }}
        onRowClick={(p) => { setErros({}); setSelected(p); window.scrollTo(0, 0); }}
        rowKey={(p) => p.id}
        columns={[
          { header: "", className: "w-8", cell: (p) => (
            <div onClick={(e) => e.stopPropagation()}>
              <Checkbox aria-label="Selecionar cliente" checked={marcados.has(p.id)} onCheckedChange={() => alternarMarcado(p.id)} />
            </div>
          ) },
          { header: "Controle", sortField: "controle", className: "text-xs", cell: (p) => muted(p.controle) },
          {
            header: "Cliente", sortField: "nome", className: "text-xs",
            cell: (p) => (
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-semibold text-primary">{iniciais(p.nome)}</div>
                <div className="min-w-0">
                  <div className="truncate text-xs font-medium">{p.nome ?? "-"}</div>
                  <div className="font-mono text-[11px] text-muted-foreground">{p.cpf_corrigido ? maskCpf(p.cpf_corrigido) : "sem CPF"}</div>
                </div>
              </div>
            ),
          },
          { header: "Tranche", sortField: "tranche", className: "text-xs", cell: (p) => p.tranche ? <BadgeCor cor={corTranche(p.tranche)}>{p.tranche}</BadgeCor> : muted(null) },
          { header: "Alocação", sortField: "alocacao", className: "text-xs", cell: (p) => p.alocacao ? <BadgeCor cor={corAlocacao(p.alocacao)}>{p.alocacao}</BadgeCor> : muted(null) },
          { header: "Coordenada validada", sortField: "coordenada_validada", className: "text-xs", cell: (p) => p.coordenada_validada == null ? muted(null) : <BadgeCor cor={corCoordenadaValidada(p.coordenada_validada)}>{p.coordenada_validada ? "Sim" : "Não"}</BadgeCor> },
          { header: "Decisão", sortField: "decisao", className: "text-xs", cell: (p) => p.decisao ? <BadgeCor cor={corDecisao(p.decisao)}>{canonicalizarDecisao(p.decisao)}</BadgeCor> : muted(null) },
          { header: "Responsável", sortField: "Responsável", className: "text-xs", cell: (p) => muted(p["Responsável"]) },
        ]}
      />
      </>)}

      {selected && (
        <div className={standalone ? "p-6" : ""}>
          <Button variant="ghost" size="sm" className="mb-3" onClick={() => setSelected(null)}>
            <ArrowLeft className="mr-1 h-4 w-4" /> Voltar para Prioritários
          </Button>
          <div className="overflow-hidden rounded-lg border bg-card">
            <>
              <div className="border-b bg-muted/40 p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-base font-semibold text-primary-foreground">{iniciais(selected.nome)}</div>
                  <div className="min-w-0 flex-1 text-left">
                    <h2 className="truncate text-lg font-semibold">{selected.nome ?? "Prioritário"}</h2>
                    <p className="font-mono text-sm text-muted-foreground">{selected.cpf_corrigido ? maskCpf(selected.cpf_corrigido) : "Sem CPF"}</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {selected.tranche && <BadgeCor cor={corTranche(selected.tranche)}>Tranche {selected.tranche}</BadgeCor>}
                      {selected.alocacao && <BadgeCor cor={corAlocacao(selected.alocacao)}>{selected.alocacao}</BadgeCor>}
                      {selected.coordenada_validada != null && (
                        <BadgeCor cor={corCoordenadaValidada(selected.coordenada_validada)}>
                          Coordenada {selected.coordenada_validada ? "validada" : "não validada"}
                        </BadgeCor>
                      )}
                      {selected.decisao && <BadgeCor cor={corDecisao(selected.decisao)}>{canonicalizarDecisao(selected.decisao)}</BadgeCor>}
                      {selected.check_po ? <Badge>PO: {selected.check_po}</Badge> : <Badge variant="outline">PO pendente</Badge>}
                      {selected.motivo_impedimento && <Badge variant="destructive">Com impedimento</Badge>}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 p-5">
                {selected.motivo_impedimento && (
                  <div className="flex gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4">
                    <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-destructive">Motivo do impedimento</div>
                      <p className="mt-1 text-sm">{selected.motivo_impedimento}</p>
                    </div>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <Secao icon={<IdCard className="h-4 w-4" />} titulo="Identificação">
                    <div className="grid grid-cols-2 gap-3">
                      <Campo label="CPF" value={selected.cpf_corrigido ? maskCpf(selected.cpf_corrigido) : null} copy mono />
                      <Campo label="Controle" value={selected.controle} copy />
                      <Campo label="Identificação" value={selected.identificacao} copy />
                      <Campo label="Alocação" value={selected.alocacao} />
                    </div>
                  </Secao>
                  <Secao icon={<ClipboardCheck className="h-4 w-4" />} titulo="Validação">
                    <div className="grid grid-cols-2 gap-3">
                      <Campo label="Critério" value={selected.criterio} />
                      <Campo label="Check PO" value={selected.check_po} />
                      <Campo label="Manter / Retirar" value={selected.manter_retirar} />
                      <Campo label="Tranche" value={selected.tranche} />
                    </div>
                  </Secao>
                </div>

                <Secao icon={<ClipboardCheck className="h-4 w-4" />} titulo="Correção dos dados">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="min-w-0 space-y-2">
                      <Label htmlFor="prioritario-cpf_correto">CPF correto</Label>
                      <Input id="prioritario-cpf_correto" disabled={!podeEditarCorrecao(selected.cpf_alterado)} aria-invalid={!!erros.cpf_correto} className={erros.cpf_correto ? "border-destructive" : ""} value={selected.cpf_correto ?? ""} onChange={(event) => alterarCampo("cpf_correto", event.target.value)} />
                      {erro("cpf_correto")}
                    </div>
                    <div className="min-w-0 space-y-2">
                      <Label htmlFor="prioritario-cpf_alterado">CPF alterado?</Label>
                      <Select value={selected.cpf_alterado == null ? "nao-informado" : selected.cpf_alterado ? "sim" : "nao"} onValueChange={(v) => alterarCampo("cpf_alterado", v === "nao-informado" ? null : v === "sim")}>
                        <SelectTrigger id="prioritario-cpf_alterado"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nao-informado">Não informado</SelectItem>
                          <SelectItem value="sim">Sim</SelectItem>
                          <SelectItem value="nao">Não</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="min-w-0 space-y-2">
                      <Label htmlFor="prioritario-nome_correto">Nome correto</Label>
                      <Input id="prioritario-nome_correto" disabled={!podeEditarCorrecao(selected.nome_alterado)} aria-invalid={!!erros.nome_correto} className={erros.nome_correto ? "border-destructive" : ""} value={selected.nome_correto ?? ""} onChange={(event) => alterarCampo("nome_correto", event.target.value)} />
                      {erro("nome_correto")}
                    </div>
                    <div className="min-w-0 space-y-2">
                      <Label htmlFor="prioritario-nome_alterado">Nome alterado?</Label>
                      <Select value={selected.nome_alterado == null ? "nao-informado" : selected.nome_alterado ? "sim" : "nao"} onValueChange={(v) => alterarCampo("nome_alterado", v === "nao-informado" ? null : v === "sim")}>
                        <SelectTrigger id="prioritario-nome_alterado"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nao-informado">Não informado</SelectItem>
                          <SelectItem value="sim">Sim</SelectItem>
                          <SelectItem value="nao">Não</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="min-w-0 space-y-2">
                      <Label htmlFor="prioritario-nome_municipio_correto">Nome do município correto</Label>
                      <Select disabled={!podeEditarCorrecao(selected.municipio_alterado)} value={selected.nome_municipio_correto || "nao-informado"} onValueChange={(v) => alterarCampo("nome_municipio_correto", v === "nao-informado" ? "" : v)}>
                        <SelectTrigger id="prioritario-nome_municipio_correto" className={erros.nome_municipio_correto ? "border-destructive" : ""}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nao-informado">Não informado</SelectItem>
                          {selected.nome_municipio_correto && !municipios.includes(selected.nome_municipio_correto) && (
                            <SelectItem value={selected.nome_municipio_correto}>{selected.nome_municipio_correto}</SelectItem>
                          )}
                          {municipios.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {erro("nome_municipio_correto")}
                    </div>
                    <div className="min-w-0 space-y-2">
                      <Label htmlFor="prioritario-municipio_alterado">Município alterado?</Label>
                      <Select value={selected.municipio_alterado == null ? "nao-informado" : selected.municipio_alterado ? "sim" : "nao"} onValueChange={(v) => alterarCampo("municipio_alterado", v === "nao-informado" ? null : v === "sim")}>
                        <SelectTrigger id="prioritario-municipio_alterado"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nao-informado">Não informado</SelectItem>
                          <SelectItem value="sim">Sim</SelectItem>
                          <SelectItem value="nao">Não</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="min-w-0 space-y-2">
                      <Label htmlFor="prioritario-nome_cliente_ligado">Nome do cliente ligado</Label>
                      <Input id="prioritario-nome_cliente_ligado" disabled={false} aria-invalid={!!erros.nome_cliente_ligado} className={erros.nome_cliente_ligado ? "border-destructive" : ""} value={selected.nome_cliente_ligado ?? ""} onChange={(event) => alterarCampo("nome_cliente_ligado", event.target.value)} />
                      {erro("nome_cliente_ligado")}
                    </div>
                    <div className="min-w-0 space-y-2">
                      <Label htmlFor="prioritario-responsavel">Responsável</Label>
                      <Select value={selected["Responsável"] || "nao-informado"} onValueChange={(v) => alterarCampo("Responsável", v === "nao-informado" ? null : v)}>
                        <SelectTrigger id="prioritario-responsavel"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nao-informado">Sem responsável</SelectItem>
                          {selected["Responsável"] && !responsaveis.includes(selected["Responsável"]) && <SelectItem value={selected["Responsável"]}>{selected["Responsável"]}</SelectItem>}
                          {responsaveis.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prioritario-atendimento">Atendimento</Label>
                      <Select value={selected.atendimento ?? "nao-informado"} onValueChange={(valor) => alterarCampo("atendimento", valor === "nao-informado" ? null : valor)}>
                        <SelectTrigger id="prioritario-atendimento"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nao-informado">Não informado</SelectItem>
                          <SelectItem value="Atendido">Atendido</SelectItem>
                          <SelectItem value="Não atendido">Não atendido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prioritario-decisao">Decisão</Label>
                      <Select value={canonicalizarDecisao(selected.decisao) ?? "nao-informado"} onValueChange={(valor) => alterarCampo("decisao", valor === "nao-informado" ? null : valor)}>
                        <SelectTrigger id="prioritario-decisao"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nao-informado">Não informado</SelectItem>
                          <SelectItem value="Mantido">Mantido</SelectItem>
                          <SelectItem value="Retirado">Retirado</SelectItem>
                          <SelectItem value="Substituir">Substituir</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </Secao>

                <Secao icon={<MapPin className="h-4 w-4" />} titulo="Localização">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Campo label="Endereço" value={selected.endereco} copy />
                    <Campo label="Coordenadas" value={mapa?.texto ?? null} copy mono />
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="prioritario-latitude">Latitude</Label>
                      <Input id="prioritario-latitude" inputMode="decimal" placeholder="Não informado no banco" value={selected.latitude ?? ""} onChange={(event) => alterarCampo("latitude", event.target.value)} />
                      {erro("latitude")}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prioritario-longitude">Longitude</Label>
                      <Input id="prioritario-longitude" inputMode="decimal" placeholder="Não informado no banco" value={selected.longitude ?? ""} onChange={(event) => alterarCampo("longitude", event.target.value)} />
                      {erro("longitude")}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prioritario-coordenada-validada">Coordenada validada</Label>
                      <Select value={selected.coordenada_validada == null ? "nao-informado" : selected.coordenada_validada ? "sim" : "nao"} onValueChange={(valor) => alterarCampo("coordenada_validada", valor === "nao-informado" ? null : valor === "sim")}>
                        <SelectTrigger id="prioritario-coordenada-validada"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="nao-informado">Não informado</SelectItem>
                          <SelectItem value="sim">Sim</SelectItem>
                          <SelectItem value="nao">Não</SelectItem>
                        </SelectContent>
                      </Select>
                      {erro("coordenada_validada")}
                    </div>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="prioritario-lat-enbpar">Latitude ENBPAR</Label>
                      <Input id="prioritario-lat-enbpar" readOnly className="bg-muted/40" placeholder="Não informado no banco" value={selected.latitude_enbpar ?? ""} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="prioritario-lng-enbpar">Longitude ENBPAR</Label>
                      <Input id="prioritario-lng-enbpar" readOnly className="bg-muted/40" placeholder="Não informado no banco" value={selected.longitude_enbpar ?? ""} />
                    </div>
                  </div>
                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="prioritario-municipio-coord">Município da coordenada</Label>
                      <Input id="prioritario-municipio-coord" readOnly value={selected.municipio_coord ?? ""} />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={validarMunicipio} disabled={consultandoMunicipio}>
                      {consultandoMunicipio ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <SearchCheck className="mr-1 h-3.5 w-3.5" />}
                      Validar município
                    </Button>
                    {mapa && (
                      <Button asChild variant="outline" size="sm">
                        <a href={mapa.url} target="_blank" rel="noreferrer">
                          <MapPin className="mr-1 h-3.5 w-3.5" /> Abrir no mapa
                        </a>
                      </Button>
                    )}
                  </div>
                </Secao>

                <Secao icon={<FileText className="h-4 w-4" />} titulo="Ordens de Serviço do cliente">
                  <div className="mb-2 text-xs text-muted-foreground">
                    {loadingOs ? "Carregando..." : `${osList?.length ?? 0} vinculada(s) · clique para abrir a análise`}
                  </div>
                  <div className="overflow-hidden rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/40">
                          <TableHead className="text-xs uppercase">OS</TableHead>
                          <TableHead className="text-xs uppercase">Obra</TableHead>
                          <TableHead className="text-xs uppercase">Status</TableHead>
                          <TableHead className="text-xs uppercase">Controle OS</TableHead>
                          <TableHead className="text-xs uppercase">Tranche</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(osList ?? []).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="py-8 text-center text-xs text-muted-foreground">
                              {loadingOs ? "Carregando..." : "Nenhuma OS vinculada a este cliente"}
                            </TableCell>
                          </TableRow>
                        ) : (osList ?? []).map((os) => (
                          <TableRow
                            key={os.id_os}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => navigate(`/analise/${os.id_os}`)}
                          >
                            <TableCell className="font-mono text-xs">{os.num_os ?? "-"}</TableCell>
                            <TableCell className="font-mono text-xs">
                              {rotaObra(os.id_obra) ? (
                                <button
                                  type="button"
                                  className="text-primary underline-offset-2 hover:underline"
                                  title="Abrir a tela desta obra"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const rota = rotaObra(os.id_obra);
                                    if (rota) navigate(rota);
                                  }}
                                >
                                  {os.obra?.num_obra ?? "-"}
                                </button>
                              ) : (
                                os.obra?.num_obra ?? "-"
                              )}
                            </TableCell>
                            <TableCell className="text-xs">{os.status ? <Badge variant="outline" className="text-[11px]">{os.status}</Badge> : "-"}</TableCell>
                            <TableCell className="font-mono text-xs">{os.controle_os ?? "-"}</TableCell>
                            <TableCell className="text-xs">{os.tranche ? <BadgeCor cor={corTranche(os.tranche)}>{os.tranche}</BadgeCor> : "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </Secao>

                <Secao icon={<StickyNote className="h-4 w-4" />} titulo="Observações">
                  <Label htmlFor="prioritario-observacao" className="sr-only">Observação</Label>
                  <Textarea id="prioritario-observacao" value={selected.observacao ?? ""} onChange={(event) => alterarCampo("observacao", event.target.value)} />
                  <div className="mt-3 text-[11px] text-muted-foreground">Cadastrado em {new Date(selected.created_at).toLocaleString("pt-BR")}</div>
                </Secao>
                <div className="flex justify-end gap-2 border-t pt-4">
                  <Button variant="outline" onClick={() => setSelected(null)} disabled={salvando}>Voltar</Button>
                  <Button onClick={salvar} disabled={salvando}>
                    {salvando ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Save className="mr-1 h-4 w-4" />} Salvar alterações
                  </Button>
                </div>
              </div>
            </>
          </div>
        </div>
      )}
    </>
  );
}
