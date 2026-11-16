import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Building2, Loader2, Pencil, Save, Trash2, Users, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useObraOsList } from "@/hooks/useTabelasOperacionais";
import {
  useExcluirQuantitativo, useObraDetalhe, useQuantitativosObra, useSalvarQuantitativo,
  useSalvarValidacaoObra, useTiposQuantitativos,
} from "@/hooks/useValidacaoObra";

const DESCRICAO_INICIAL = "CONSTRUÇÃO DE 3736M DE REDE MT MONOFÁSICA COM INSTALAÇÃO DE 01 TRANSFORMADOR DE 15 KVA EM RDR 19,9 KW";
const OPCOES_TIPO_ATENDIMENTO = ["Instalação de equipamentos", "Melhoria", "Melhoria / Propriedade rural", "Associações", "Indígenas", "Propriedade Rural", "Propriedade Urbana", "Quilombolas", "Torre de Telecomunicações"];
const OPCOES_ANALISE_OBRA = ["Análise", "Divergência", "Pronto para cadastro", "Não cadastrar"];
const OPCOES_CADASTRO_ENBPAR = ["Cadastrado", "Não cadastrado", "Pendente"];
const NULO = "__nulo__";

const brl = (v: number | null | undefined) =>
  v === null || v === undefined ? "—" : Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const formatarData = (v: string | null | undefined) => {
  if (!v) return "—";
  const d = new Date(`${v.slice(0, 10)}T00:00:00`);
  return Number.isNaN(d.getTime()) ? v : d.toLocaleDateString("pt-BR");
};
const rotuloResultado = (r: string | null) => (r === "aprovado" ? "Aprovado" : r === "reprovado" ? "Não aprovado" : "Pendente");
const varianteResultado = (r: string | null): "default" | "destructive" | "secondary" =>
  r === "aprovado" ? "default" : r === "reprovado" ? "destructive" : "secondary";
const comAtual = (lista: string[], atual: string | null) => (atual && !lista.includes(atual) ? [...lista, atual] : lista);



function Dropdown({ label, value, options, onChange }: { label: string; value: string | null; options: string[]; onChange: (v: string | null) => void }) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Select value={value ?? NULO} onValueChange={(v) => onChange(v === NULO ? null : v)}>
        <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value={NULO}>Não informado</SelectItem>
          {comAtual(options, value).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
        </SelectContent>
      </Select>
    </div>
  );
}

export default function ValidacaoObra() {
  const { idObra: idParam } = useParams();
  const idObra = idParam ? Number(idParam) : null;
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile: perfil } = useProfile();
  const nomeUsuario = (perfil as { full_name?: string | null; username?: string | null } | null | undefined)?.full_name
    || (perfil as { username?: string | null } | null | undefined)?.username || user?.email || "";

  const { data: obra, isLoading } = useObraDetalhe(idObra);
  const { data: osList, isLoading: loadingOs } = useObraOsList(idObra);
  const primeiraOs = osList?.[0];

  const [form, setForm] = useState({ tipo_atendimento: null as string | null, analise_obra: null as string | null, cadastro_enbpar: null as string | null, check_txt: null as string | null });
  useEffect(() => {
    if (!obra) return;
    const ct = obra.check_txt;
    setForm({
      tipo_atendimento: obra.tipo_atendimento ?? null,
      analise_obra: obra.analise_obra ?? null,
      cadastro_enbpar: obra.cadastro_enbpar ?? null,
      check_txt: ct === null || ct === undefined ? null : ct === true || ct === "Sim" || ct === "true" ? "Sim" : "Não",
    });
  }, [obra]);

  const salvarValidacao = useSalvarValidacaoObra(idObra ?? 0);
  const handleSalvarValidacao = async () => {
    try {
      await salvarValidacao.mutateAsync({ ...form, data_analise: new Date().toISOString(), responsavel: nomeUsuario || null });
      toast.success("Validação da obra salva");
    } catch (e) {
      console.error(e);
      toast.error(`Erro ao salvar: ${(e as { message?: string }).message ?? "desconhecido"}`);
    }
  };

  // Quantitativos
  const { data: tipos = [] } = useTiposQuantitativos();
  const { data: itens = [], isLoading: loadingItens } = useQuantitativosObra(idObra);
    // Total acumulado em todas as OSs vinculadas à obra
  const totaisOs = useMemo(() => {
    if (!osList) return { padrao: 0, kit: 0 };
    return osList.reduce(
      (acc, os) => ({
        padrao: acc.padrao + (Number((os as any).num_padrao) || 0),
        kit: acc.kit + (Number((os as any).num_kit) || 0),
      }),
      { padrao: 0, kit: 0 }
    );
  }, [osList]);
  
  // Total já registrado na tabela de quantitativos da obra
  const totaisQuantitativosObra = useMemo(() => {
    let padrao = 0;
    let kit = 0;
  
    itens.forEach((it) => {
      const nome = it.tipo?.nome?.toLowerCase() ?? "";
      const qtd = Number(it.quantidade) || 0;
  
      if (nome.includes("padrão") || nome.includes("padrao")) padrao += qtd;
      if (nome.includes("kit")) kit += qtd;
    });
  
    return { padrao, kit };
  }, [itens]);
  
  const salvarItem = useSalvarQuantitativo(idObra ?? 0);
  const excluirItem = useExcluirQuantitativo(idObra ?? 0);
  const [categoria, setCategoria] = useState<string>("");
  const [tipoId, setTipoId] = useState<string>("");
  const [quantidade, setQuantidade] = useState("");
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const categorias = useMemo(() => Array.from(new Set(tipos.map((t) => t.categoria ?? "Sem categoria"))).sort(), [tipos]);
  const tiposFiltrados = tipos.filter((t) => (t.categoria ?? "Sem categoria") === categoria);

  const limparItem = () => { setCategoria(""); setTipoId(""); setQuantidade(""); setEditandoId(null); };
  const handleSalvarItem = async () => {
    const q = Number(quantidade.replace(",", "."));
    const itemSelecionado = tipos.find((t) => t.id === tipoId);
    const nomeItem = itemSelecionado?.nome?.toLowerCase() ?? "";
    if (!tipoId || !quantidade || Number.isNaN(q) || q <= 0) { toast.error("Selecione o item e informe uma quantidade válida"); return; }
    if (nomeItem.includes("padrão") || nomeItem.includes("padrao")) {
      if (q !== totaisOs.padrao) {
        // Alerta informativo ou bloqueio conforme sua preferência
        toast.error(`Atenção: A quantidade informada (${q}) difere do total de padrões das OSs (${totaisOs.padrao}).`); return; }
    }
    if (nomeItem.includes("kit")) {
      if (q !== totaisOs.kit) {
        toast.error(`Atenção: A quantidade informada (${q}) difere do total de kits das OSs (${totaisOs.kit}).`); return; } 
    }
    try {
      await salvarItem.mutateAsync({ id: editandoId ?? undefined, tipo_quantitativo_id: tipoId, quantidade: q });
      toast.success(editandoId ? "Item alterado" : "Item adicionado");
      limparItem();
    } catch (e) {
      console.error(e);
      toast.error(`Erro ao salvar item: ${(e as { message?: string }).message ?? ""}`);
    }
  };
  const editar = (id: string) => {
    const it = itens.find((i) => i.id === id);
    if (!it) return;
    const t = tipos.find((x) => x.id === it.tipo_quantitativo_id);
    setCategoria(t?.categoria ?? "Sem categoria");
    setTipoId(String(it.tipo_quantitativo_id));
    setQuantidade(String(it.quantidade).replace(".", ","));
    setEditandoId(id);
  };
  const excluir = async (id: string) => {
    if (!confirm("Excluir este item?")) return;
    try { await excluirItem.mutateAsync(id); toast.success("Item excluído"); if (editandoId === id) limparItem(); }
    catch (e) { console.error(e); toast.error(`Erro ao excluir: ${(e as { message?: string }).message ?? ""}`); }
  };

  if (isLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!obra) return <div className="p-8 text-sm text-muted-foreground">Obra não encontrada. <Button variant="link" onClick={() => navigate(-1)}>Voltar</Button></div>;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-card px-4 py-3 md:px-8">
        <div className="mx-auto flex max-w-6xl items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)}><ArrowLeft className="mr-1 h-4 w-4" />Voltar</Button>
          <Building2 className="h-5 w-5" />
          <h1 className="text-lg font-semibold">Validação da Obra</h1>
          <span className="font-mono text-sm text-muted-foreground">{obra.num_obra}</span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
        <section className="grid gap-x-8 gap-y-3 rounded-md border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
          {[["Nº Obra", obra.num_obra], ["Tranche", primeiraOs?.tranche], ["Nome envolvido", primeiraOs?.cliente?.nome], ["Município", primeiraOs?.localidade?.municipio ?? obra.nome_lcd]].map(([l, v]) => (
            <div key={l as string}>
              <p className="text-xs font-medium uppercase text-muted-foreground">{l}</p>
              <p className="mt-1 text-sm font-semibold">{v ?? "—"}</p>
            </div>
          ))}
        </section>

        <section>
          <h3 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Informações da obra</h3>
          <div className="grid overflow-hidden rounded-md border sm:grid-cols-2 lg:grid-cols-5">
            {[["Status", obra.status ?? "Indefinido"], ["Data Início", formatarData(primeiraOs?.datasol)], ["Data de Fim", formatarData(primeiraOs?.datatertrab)], ["Valor orçado", brl(obra.valor_orcado)], ["Valor realizado", brl(obra.valor_realizado)]].map(([l, v], i) => (
              <div key={l} className={`bg-muted/30 p-3 ${i > 0 ? "border-t sm:border-l sm:border-t-0" : ""}`}>
                <p className="text-xs font-medium text-muted-foreground">{l}</p>
                <p className="mt-1 text-sm font-semibold">{v}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Descrição da obra</h3>
          <div className="rounded-md border bg-muted/20 p-3 text-sm leading-relaxed">{DESCRICAO_INICIAL}</div>
        </section>

        <section className="rounded-md border bg-card p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Validação da obra</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Dropdown label="Tipo de atendimento" value={form.tipo_atendimento} options={OPCOES_TIPO_ATENDIMENTO} onChange={(v) => setForm((p) => ({ ...p, tipo_atendimento: v }))} />
            <Dropdown label="Análise da obra" value={form.analise_obra} options={OPCOES_ANALISE_OBRA} onChange={(v) => setForm((p) => ({ ...p, analise_obra: v }))} />
            <Dropdown label="Cadastro ENBPar" value={form.cadastro_enbpar} options={OPCOES_CADASTRO_ENBPAR} onChange={(v) => setForm((p) => ({ ...p, cadastro_enbpar: v }))} />
            <Dropdown label="Check TXT" value={form.check_txt} options={["Sim", "Não"]} onChange={(v) => setForm((p) => ({ ...p, check_txt: v }))} />
            <div className="space-y-1">
              <Label className="text-xs">Data da análise</Label>
              <Input readOnly className="h-9 bg-muted/40 text-sm" value={obra.data_analise ? new Date(obra.data_analise).toLocaleString("pt-BR") : "Preenchida ao salvar"} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Responsável</Label>
              <Input readOnly className="h-9 bg-muted/40 text-sm" value={obra.responsavel || nomeUsuario} />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={handleSalvarValidacao} disabled={salvarValidacao.isPending}>
              {salvarValidacao.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Salvar validação
            </Button>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className={`p-3 rounded-md border ${
            totaisQuantitativosObra.padrao === totaisOs.padrao 
              ? "bg-emerald-500/10 border-emerald-500/30" 
              : "bg-amber-500/10 border-amber-500/30"
          }`}>
            <p className="text-xs font-medium text-muted-foreground">Padrões</p>
            <p className="text-sm font-semibold">
              OSs: <span className="font-mono">{totaisOs.padrao}</span> | Na Obra: <span className="font-mono">{totaisQuantitativosObra.padrao}</span>
            </p>
          </div>
        
          <div className={`p-3 rounded-md border ${
            totaisQuantitativosObra.kit === totaisOs.kit 
              ? "bg-emerald-500/10 border-emerald-500/30" 
              : "bg-amber-500/10 border-amber-500/30"
          }`}>
            <p className="text-xs font-medium text-muted-foreground">Kits</p>
            <p className="text-sm font-semibold">
              OSs: <span className="font-mono">{totaisOs.kit}</span> | Na Obra: <span className="font-mono">{totaisQuantitativosObra.kit}</span>
            </p>
          </div>
        </div>


        <section className="rounded-md border bg-card p-4">
          <h3 className="mb-3 text-xs font-semibold uppercase text-muted-foreground">Quantitativos da obra</h3>
          <div className="grid items-end gap-3 sm:grid-cols-[1fr_1fr_140px_auto]">
            <div className="space-y-1">
              <Label className="text-xs">Categoria</Label>
              <Select value={categoria} onValueChange={(v) => { setCategoria(v); setTipoId(""); }}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{categorias.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Item</Label>
              <Select value={tipoId} onValueChange={setTipoId} disabled={!categoria}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{tiposFiltrados.map((t) => <SelectItem key={t.id} value={String(t.id)}>{t.nome}{t.unidade ? ` (${t.unidade})` : ""}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Quantidade</Label>
              <Input className="h-9 text-sm" inputMode="decimal" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSalvarItem} disabled={salvarItem.isPending}><Save className="mr-1 h-4 w-4" />{editandoId ? "Alterar" : "Salvar"}</Button>
              {editandoId && <Button variant="outline" onClick={limparItem}><X className="h-4 w-4" /></Button>}
            </div>
          </div>
          <div className="mt-4 overflow-hidden rounded-md border">
            <Table>
              <TableHeader><TableRow className="bg-muted/40">
                <TableHead className="text-xs uppercase">Categoria</TableHead>
                <TableHead className="text-xs uppercase">Item</TableHead>
                <TableHead className="text-xs uppercase">Quantidade</TableHead>
                <TableHead className="w-24 text-xs uppercase">Ações</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {loadingItens ? (
                  <TableRow><TableCell colSpan={4} className="py-6 text-center"><Loader2 className="mx-auto h-4 w-4 animate-spin" /></TableCell></TableRow>
                ) : itens.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="py-6 text-center text-xs text-muted-foreground">Nenhum item adicionado</TableCell></TableRow>
                ) : itens.map((it) => (
                  <TableRow key={it.id} className={editandoId === it.id ? "bg-muted/40" : ""}>
                    <TableCell className="text-sm">{it.tipo?.categoria ?? "—"}</TableCell>
                    <TableCell className="text-sm">{it.tipo?.nome ?? `#${it.tipo_quantitativo_id}`}</TableCell>
                    <TableCell className="text-sm">{Number(it.quantidade).toLocaleString("pt-BR")} {it.tipo?.unidade ?? ""}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => editar(it.id)} aria-label="Alterar"><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => excluir(it.id)} aria-label="Excluir"><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase text-muted-foreground"><Users className="h-4 w-4" /> Clientes</h3>
            <span className="text-xs text-muted-foreground">{loadingOs ? "Carregando..." : `${osList?.length ?? 0} vinculado(s) · clique para abrir a análise`}</span>
          </div>
          <div className="overflow-hidden rounded-md border bg-card">
            <Table>
              <TableHeader><TableRow className="bg-muted/40">
                <TableHead className="text-xs uppercase">Cliente</TableHead>
                <TableHead className="text-xs uppercase">OS</TableHead>
                 <TableHead className="text-xs uppercase">Tranche</TableHead>
                <TableHead className="w-48 text-xs uppercase">Status validação</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {(osList ?? []).length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="py-8 text-center text-xs text-muted-foreground">Nenhum cliente vinculado</TableCell></TableRow>
                ) : (osList ?? []).map((os) => (
                  <TableRow key={os.id_os} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/analise/${os.id_os}`)}>
                    <TableCell className="text-sm font-medium">{os.cliente?.nome ?? "Cliente não informado"}</TableCell>
                    <TableCell className="font-mono text-xs">{os.num_os}</TableCell>
                    <TableCell className="font-mono text-xs">{os.tranche}</TableCell>
                    <TableCell><Badge variant={varianteResultado(os.resultado_analise)}>{rotuloResultado(os.resultado_analise)}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      </main>
    </div>
  );
}
