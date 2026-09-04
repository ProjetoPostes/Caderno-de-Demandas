import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Loader2, Save, XCircle, MinusCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CopyableInput } from "@/components/CopyableInput";
import { maskCpf } from "@/lib/cpfMask";
import { useAuth } from "@/contexts/AuthContext";
import type { Json } from "@/integrations/supabase/schema";
import {
  useAnaliseAtual,
  useAnalistas,
  useCriteriosDaAnalise,
  useCriteriosEnquadramento,
  useOsResumo,
  useSalvarAnalise,
} from "@/hooks/useAnaliseOs";

const NULO = "__nulo__";

type TriState = "conforme" | "nao_conforme" | null;
type Resultado = "aprovado" | "reprovado" | "pendente_complementacao" | null;

interface FormState {
  validacao_municipio: TriState;
  observacao_municipio: string;
  validacao_cpf: TriState;
  casa: string;
  configuracao_moradia: string;
  enquadramento_beneficiario: string;
  enquadramento_confirmado: boolean | null;
  observacao_beneficiario: string;
  coordenada_x_solicitacao: string;
  coordenada_y_solicitacao: string;
  coordenada_x_derivacao: string;
  coordenada_y_derivacao: string;
  tipo_coordenada: string;
  fuso_utm: string;
  hemisferio_utm: string;
  distancia_prevista_m: string;
  coordenadas_conferidas: boolean | null;
  observacao_coordenadas: string;
  orcamento_estimado: string;
  numero_odi: string;
  tipo_atendimento: string;
  observacao_tecnica: string;
  tipo_comunidade: string;
  nome_comunidade: string;
  comunidade_validada: boolean | null;
  observacao_comunidade: string;
  nome_unidade_consumidora: string;
  nome_consumidor_validado: boolean | null;
  numero_uc: string;
  data_ligacao: string;
  distancia_cadastro_ligacao_m: string;
  critica_distancia: string;
  observacao_unidade_consumidora: string;
  resultado_analise: Resultado;
  observacoes_finais: string;
  analista_responsavel_id: string;
  data_analise: string;
}

const emptyForm = (): FormState => ({
  validacao_municipio: null,
  observacao_municipio: "",
  validacao_cpf: null,
  casa: "",
  configuracao_moradia: "",
  enquadramento_beneficiario: "",
  enquadramento_confirmado: null,
  observacao_beneficiario: "",
  coordenada_x_solicitacao: "",
  coordenada_y_solicitacao: "",
  coordenada_x_derivacao: "",
  coordenada_y_derivacao: "",
  tipo_coordenada: "",
  fuso_utm: "",
  hemisferio_utm: "",
  distancia_prevista_m: "",
  coordenadas_conferidas: null,
  observacao_coordenadas: "",
  orcamento_estimado: "",
  numero_odi: "",
  tipo_atendimento: "",
  observacao_tecnica: "",
  tipo_comunidade: "",
  nome_comunidade: "",
  comunidade_validada: null,
  observacao_comunidade: "",
  nome_unidade_consumidora: "",
  nome_consumidor_validado: null,
  numero_uc: "",
  data_ligacao: "",
  distancia_cadastro_ligacao_m: "",
  critica_distancia: "",
  observacao_unidade_consumidora: "",
  resultado_analise: null,
  observacoes_finais: "",
  analista_responsavel_id: "",
  data_analise: new Date().toISOString().slice(0, 10),
});

const txt = (v: string | null | undefined) => (v == null ? "" : String(v));
const num = (v: number | null | undefined) => (v == null ? "" : String(v).replace(".", ","));

function parseNumero(value: string): number | null {
  const raw = value.trim();
  if (!raw) return null;
  const normalized = raw.replace(/\s/g, "").replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseMoeda(value: string): number | null {
  const raw = value.trim();
  if (!raw) return null;
  const cleaned = raw.replace(/[^\d,.-]/g, "");
  const normalized = cleaned.includes(",")
    ? cleaned.replace(/\./g, "").replace(",", ".")
    : cleaned;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatMoeda(value: number | null | undefined): string {
  if (value == null) return "";
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

const nullIfEmpty = (v: string): string | null => (v.trim() === "" ? null : v.trim());

const CASA_OPCOES = ["sim", "nao"];
const CONFIG_MORADIA_OPCOES = ["sim", "nao"];
const ENQUADRAMENTO_OPCOES = ["sim", "nao"];

interface CampoObrigatorio {
  id: string;
  label: string;
  ok: boolean;
}

export default function AnaliseSolicitacao() {
  const { idOs } = useParams<{ idOs: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const os = useOsResumo(idOs);
  const analise = useAnaliseAtual(idOs);
  const criterios = useCriteriosEnquadramento();
  const criteriosAnalise = useCriteriosDaAnalise(analise.data?.id_analise);
  const analistas = useAnalistas();
  const salvar = useSalvarAnalise();

  const [form, setForm] = useState<FormState>(emptyForm);
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [dirty, setDirty] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const hidratado = useRef(false);
  const criteriosHidratados = useRef(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  // Hidrata o formulário com a análise existente (ou nova em branco)
  useEffect(() => {
    if (hidratado.current || analise.isLoading || !idOs) return;
    const a = analise.data;
    hidratado.current = true;
    if (!a) {
      setForm({ ...emptyForm(), analista_responsavel_id: user?.id ?? "" });
      return;
    }
    setForm({
      validacao_municipio: (a.validacao_municipio as TriState) ?? null,
      observacao_municipio: txt(a.observacao_municipio),
      validacao_cpf: (a.validacao_cpf as TriState) ?? null,
      casa: txt(a.casa),
      configuracao_moradia: txt(a.configuracao_moradia),
      enquadramento_beneficiario: txt(a.enquadramento_beneficiario),
      enquadramento_confirmado: a.enquadramento_confirmado,
      observacao_beneficiario: txt(a.observacao_beneficiario),
      coordenada_x_solicitacao: num(a.coordenada_x_solicitacao),
      coordenada_y_solicitacao: num(a.coordenada_y_solicitacao),
      coordenada_x_derivacao: num(a.coordenada_x_derivacao),
      coordenada_y_derivacao: num(a.coordenada_y_derivacao),
      tipo_coordenada: txt(a.tipo_coordenada),
      fuso_utm: a.fuso_utm == null ? "" : String(a.fuso_utm),
      hemisferio_utm: txt(a.hemisferio_utm),
      distancia_prevista_m: num(a.distancia_prevista_m),
      coordenadas_conferidas: a.coordenadas_conferidas,
      observacao_coordenadas: txt(a.observacao_coordenadas),
      orcamento_estimado: formatMoeda(a.orcamento_estimado),
      numero_odi: txt(a.numero_odi),
      tipo_atendimento: txt(a.tipo_atendimento),
      observacao_tecnica: txt(a.observacao_tecnica),
      tipo_comunidade: txt(a.tipo_comunidade),
      nome_comunidade: txt(a.nome_comunidade),
      comunidade_validada: a.comunidade_validada,
      observacao_comunidade: txt(a.observacao_comunidade),
      nome_unidade_consumidora: txt(a.nome_unidade_consumidora),
      nome_consumidor_validado: a.nome_consumidor_validado,
      numero_uc: txt(a.numero_uc),
      data_ligacao: txt(a.data_ligacao),
      distancia_cadastro_ligacao_m: num(a.distancia_cadastro_ligacao_m),
      critica_distancia: txt(a.critica_distancia),
      observacao_unidade_consumidora: txt(a.observacao_unidade_consumidora),
      resultado_analise: (a.resultado_analise as Resultado) ?? null,
      observacoes_finais: txt(a.observacoes_finais),
      analista_responsavel_id: txt(a.analista_responsavel_id) || (user?.id ?? ""),
      data_analise: txt(a.data_analise) || new Date().toISOString().slice(0, 10),
    });
  }, [analise.data, analise.isLoading, idOs, user?.id]);

  useEffect(() => {
    if (criteriosHidratados.current) return;
    if (!analise.data?.id_analise) return;
    if (criteriosAnalise.data === undefined) return;
    criteriosHidratados.current = true;
    setSelecionados(criteriosAnalise.data);
  }, [analise.data?.id_analise, criteriosAnalise.data]);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const criterioZero = useMemo(
    () => criterios.data?.find((c) => c.codigo?.trim() === "0"),
    [criterios.data],
  );

  const toggleCriterio = (id: number, checked: boolean) => {
    setDirty(true);
    setSelecionados((prev) => {
      if (criterioZero && id === criterioZero.id_criterio) {
        return checked ? [id] : [];
      }
      if (checked) {
        const semZero = criterioZero ? prev.filter((p) => p !== criterioZero.id_criterio) : prev;
        return [...semZero, id];
      }
      return prev.filter((p) => p !== id);
    });
  };

  const criteriosPorCategoria = useMemo(() => {
    const grupos = new Map<string, typeof criterios.data>();
    (criterios.data ?? []).forEach((c) => {
      const cat = c.categoria?.trim() || "Outros";
      if (!grupos.has(cat)) grupos.set(cat, []);
      grupos.get(cat)!.push(c);
    });
    return Array.from(grupos.entries());
  }, [criterios.data]);

  const indicadores = [
    { label: "Município", valor: form.validacao_municipio === "conforme" ? true : form.validacao_municipio === "nao_conforme" ? false : null },
    { label: "CPF", valor: form.validacao_cpf === "conforme" ? true : form.validacao_cpf === "nao_conforme" ? false : null },
    { label: "Enquadramento", valor: form.enquadramento_confirmado },
    { label: "Coordenadas", valor: form.coordenadas_conferidas },
    { label: "Comunidade", valor: form.comunidade_validada },
    { label: "Consumidor", valor: form.nome_consumidor_validado },
  ];

  const obrigatorios: CampoObrigatorio[] = [
    { id: "campo-validacao_municipio", label: "Validação do município", ok: form.validacao_municipio !== null },
    { id: "campo-validacao_cpf", label: "Validação do CPF", ok: form.validacao_cpf !== null },
    { id: "campo-enquadramento_confirmado", label: "Enquadramento confirmado", ok: form.enquadramento_confirmado !== null },
    { id: "campo-coordenadas_conferidas", label: "Coordenadas conferidas", ok: form.coordenadas_conferidas !== null },
    { id: "campo-comunidade_validada", label: "Comunidade validada", ok: form.comunidade_validada !== null },
    { id: "campo-nome_consumidor_validado", label: "Nome do consumidor validado", ok: form.nome_consumidor_validado !== null },
    { id: "campo-resultado_analise", label: "Resultado da análise", ok: form.resultado_analise !== null },
    { id: "campo-analista", label: "Analista responsável", ok: form.analista_responsavel_id.trim() !== "" },
    { id: "campo-data_analise", label: "Data da análise", ok: form.data_analise.trim() !== "" },
  ];

  const montarDados = (): Record<string, Json> => ({
    validacao_municipio: form.validacao_municipio,
    observacao_municipio: nullIfEmpty(form.observacao_municipio),
    validacao_cpf: form.validacao_cpf,
    casa: nullIfEmpty(form.casa),
    configuracao_moradia: nullIfEmpty(form.configuracao_moradia),
    enquadramento_beneficiario: nullIfEmpty(form.enquadramento_beneficiario),
    enquadramento_confirmado: form.enquadramento_confirmado,
    observacao_beneficiario: nullIfEmpty(form.observacao_beneficiario),
    coordenada_x_solicitacao: parseNumero(form.coordenada_x_solicitacao),
    coordenada_y_solicitacao: parseNumero(form.coordenada_y_solicitacao),
    coordenada_x_derivacao: parseNumero(form.coordenada_x_derivacao),
    coordenada_y_derivacao: parseNumero(form.coordenada_y_derivacao),
    tipo_coordenada: nullIfEmpty(form.tipo_coordenada),
    fuso_utm: form.tipo_coordenada === "utm" ? parseNumero(form.fuso_utm) : null,
    hemisferio_utm: form.tipo_coordenada === "utm" ? nullIfEmpty(form.hemisferio_utm) : null,
    distancia_prevista_m: parseNumero(form.distancia_prevista_m),
    coordenadas_conferidas: form.coordenadas_conferidas,
    observacao_coordenadas: nullIfEmpty(form.observacao_coordenadas),
    orcamento_estimado: parseMoeda(form.orcamento_estimado),
    numero_odi: nullIfEmpty(form.numero_odi),
    tipo_atendimento: nullIfEmpty(form.tipo_atendimento),
    observacao_tecnica: nullIfEmpty(form.observacao_tecnica),
    tipo_comunidade: nullIfEmpty(form.tipo_comunidade),
    nome_comunidade: nullIfEmpty(form.nome_comunidade),
    comunidade_validada: form.comunidade_validada,
    observacao_comunidade: nullIfEmpty(form.observacao_comunidade),
    nome_unidade_consumidora: nullIfEmpty(form.nome_unidade_consumidora),
    nome_consumidor_validado: form.nome_consumidor_validado,
    numero_uc: nullIfEmpty(form.numero_uc),
    data_ligacao: nullIfEmpty(form.data_ligacao),
    distancia_cadastro_ligacao_m: parseNumero(form.distancia_cadastro_ligacao_m),
    critica_distancia: nullIfEmpty(form.critica_distancia),
    observacao_unidade_consumidora: nullIfEmpty(form.observacao_unidade_consumidora),
    resultado_analise: form.resultado_analise,
    observacoes_finais: nullIfEmpty(form.observacoes_finais),
    analista_responsavel_id: nullIfEmpty(form.analista_responsavel_id),
    data_analise: nullIfEmpty(form.data_analise),
  });

  const executarSalvamento = async (concluir: boolean) => {
    if (!idOs || salvar.isPending) return;
    try {
      await salvar.mutateAsync({
        idOs,
        dados: montarDados(),
        criterios: selecionados,
        concluir,
      });
      setDirty(false);
      hidratado.current = false;
      criteriosHidratados.current = false;
      await Promise.all([analise.refetch(), criteriosAnalise.refetch()]);
      toast.success(concluir ? "Análise concluída com sucesso!" : "Rascunho salvo com sucesso!");
    } catch (err) {
      const mensagem = err instanceof Error ? err.message : "Erro ao salvar a análise";
      console.error("salvar_analise_os falhou:", err);
      toast.error(mensagem);
    }
  };

  const handleConcluir = () => {
    const pendentes = obrigatorios.filter((c) => !c.ok);
    if (pendentes.length > 0) {
      toast.error(`Preencha antes de concluir: ${pendentes.map((p) => p.label).join(", ")}`);
      document.getElementById(pendentes[0].id)?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setConfirmOpen(true);
  };

  if (os.isLoading || analise.isLoading || criterios.isLoading) {
    return (
      <div className="container mx-auto max-w-6xl p-4 space-y-4">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-24 w-full" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (os.isError || !os.data) {
    return (
      <div className="container mx-auto max-w-3xl p-6 space-y-4">
        <h1 className="text-xl font-semibold">Análise da Solicitação</h1>
        <p className="text-sm text-muted-foreground">
          Não foi possível carregar a OS: {os.error instanceof Error ? os.error.message : "registro não encontrado"}
        </p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />Voltar
        </Button>
      </div>
    );
  }

  const dados = os.data;

  return (
    <div className="container mx-auto max-w-6xl p-4 space-y-4 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Análise da Solicitação</h1>
          <p className="text-muted-foreground">
            OS {dados.num_os} · {dados.nome ?? "Beneficiário não informado"} · {dados.municipio ?? "Município não informado"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={analise.data?.analise_concluida ? "default" : "secondary"}>
            {analise.data?.status_analise ?? "rascunho"}
          </Badge>
          {dirty && <Badge variant="outline">Alterações não salvas</Badge>}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Identificação da Solicitação */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Identificação da Solicitação</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div><Label>Nº OS</Label><CopyableInput value={String(dados.num_os)} /></div>
            <div><Label>Data da solicitação</Label><CopyableInput value={dados.datasol} /></div>
            <div><Label>Tranche</Label><CopyableInput value={dados.tranche} /></div>
            <div><Label>Status da OS</Label><CopyableInput value={dados.status} /></div>
            <div><Label>Nº Obra</Label><CopyableInput value={dados.num_obra} /></div>
          </CardContent>
        </Card>

        {/* Identificação do Beneficiário */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Identificação do Beneficiário</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nome</Label><CopyableInput value={dados.nome} /></div>
              <div><Label>CPF</Label><CopyableInput value={maskCpf(dados.cpf)} /></div>
              <div><Label>Data de nascimento</Label><CopyableInput value={dados.dt_nasc} /></div>
              <div id="campo-validacao_cpf">
                <Label>Validação do CPF</Label>
                <Select
                  value={form.validacao_cpf ?? NULO}
                  onValueChange={(v) => set("validacao_cpf", v === NULO ? null : (v as TriState))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NULO}>Não informado</SelectItem>
                    <SelectItem value="conforme">Conforme</SelectItem>
                    <SelectItem value="nao_conforme">Não conforme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Casa</Label>
                <Select value={form.casa || NULO} onValueChange={(v) => set("casa", v === NULO ? "" : v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NULO}>Não informado</SelectItem>
                    {CASA_OPCOES.map((o) => (<SelectItem key={o} value={o}>{o === "sim" ? "Sim" : "Não"}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Configuração de moradia</Label>
                <Select value={form.configuracao_moradia || NULO} onValueChange={(v) => set("configuracao_moradia", v === NULO ? "" : v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NULO}>Não informado</SelectItem>
                    {CONFIG_MORADIA_OPCOES.map((o) => (<SelectItem key={o} value={o}>{o === "sim" ? "Sim" : "Não"}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Enquadramento do beneficiário</Label>
                <Select value={form.enquadramento_beneficiario || NULO} onValueChange={(v) => set("enquadramento_beneficiario", v === NULO ? "" : v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NULO}>Não informado</SelectItem>
                    {ENQUADRAMENTO_OPCOES.map((o) => (<SelectItem key={o} value={o}>{o === "sim" ? "Sim" : "Não"}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div id="campo-enquadramento_confirmado">
                <Label>Enquadramento confirmado</Label>
                <Select
                  value={form.enquadramento_confirmado === null ? NULO : String(form.enquadramento_confirmado)}
                  onValueChange={(v) => set("enquadramento_confirmado", v === NULO ? null : v === "true")}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NULO}>Não informado</SelectItem>
                    <SelectItem value="true">Sim</SelectItem>
                    <SelectItem value="false">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Observação do beneficiário</Label>
              <Textarea value={form.observacao_beneficiario} onChange={(e) => set("observacao_beneficiario", e.target.value)} rows={2} />
            </div>
          </CardContent>
        </Card>

        {/* Informações Geográficas */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Informações Geográficas</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Localidade</Label><CopyableInput value={dados.nome_lcd} /></div>
              <div><Label>Município</Label><CopyableInput value={dados.municipio} /></div>
              <div><Label>Código IBGE</Label><CopyableInput value={dados.codigo_ibge_municipio} /></div>
              <div><Label>UF</Label><CopyableInput value={dados.uf} /></div>
              <div><Label>Regional</Label><CopyableInput value={dados.regional} /></div>
              <div id="campo-validacao_municipio">
                <Label>Validação do município</Label>
                <Select
                  value={form.validacao_municipio ?? NULO}
                  onValueChange={(v) => set("validacao_municipio", v === NULO ? null : (v as TriState))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NULO}>Não informado</SelectItem>
                    <SelectItem value="conforme">Conforme</SelectItem>
                    <SelectItem value="nao_conforme">Não conforme</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Observação do município</Label>
              <Textarea value={form.observacao_municipio} onChange={(e) => set("observacao_municipio", e.target.value)} rows={2} />
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tipo de coordenada</Label>
                <Select value={form.tipo_coordenada || NULO} onValueChange={(v) => set("tipo_coordenada", v === NULO ? "" : v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NULO}>Não informado</SelectItem>
                    <SelectItem value="utm">UTM</SelectItem>
                    <SelectItem value="graus_decimais">Graus decimais</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div id="campo-coordenadas_conferidas">
                <Label>Coordenadas conferidas</Label>
                <Select
                  value={form.coordenadas_conferidas === null ? NULO : String(form.coordenadas_conferidas)}
                  onValueChange={(v) => set("coordenadas_conferidas", v === NULO ? null : v === "true")}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NULO}>Não informado</SelectItem>
                    <SelectItem value="true">Sim</SelectItem>
                    <SelectItem value="false">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Coordenada X (solicitação)</Label><Input value={form.coordenada_x_solicitacao} onChange={(e) => set("coordenada_x_solicitacao", e.target.value)} inputMode="decimal" /></div>
              <div><Label>Coordenada Y (solicitação)</Label><Input value={form.coordenada_y_solicitacao} onChange={(e) => set("coordenada_y_solicitacao", e.target.value)} inputMode="decimal" /></div>
              <div><Label>Coordenada X (derivação)</Label><Input value={form.coordenada_x_derivacao} onChange={(e) => set("coordenada_x_derivacao", e.target.value)} inputMode="decimal" /></div>
              <div><Label>Coordenada Y (derivação)</Label><Input value={form.coordenada_y_derivacao} onChange={(e) => set("coordenada_y_derivacao", e.target.value)} inputMode="decimal" /></div>
              {form.tipo_coordenada === "utm" && (
                <>
                  <div><Label>Fuso UTM</Label><Input value={form.fuso_utm} onChange={(e) => set("fuso_utm", e.target.value)} inputMode="numeric" /></div>
                  <div>
                    <Label>Hemisfério UTM</Label>
                    <Select value={form.hemisferio_utm || NULO} onValueChange={(v) => set("hemisferio_utm", v === NULO ? "" : v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NULO}>Não informado</SelectItem>
                        <SelectItem value="N">N</SelectItem>
                        <SelectItem value="S">S</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              <div><Label>Distância prevista (m)</Label><Input value={form.distancia_prevista_m} onChange={(e) => set("distancia_prevista_m", e.target.value)} inputMode="decimal" /></div>
            </div>
            <div>
              <Label>Observação das coordenadas</Label>
              <Textarea value={form.observacao_coordenadas} onChange={(e) => set("observacao_coordenadas", e.target.value)} rows={2} />
            </div>
          </CardContent>
        </Card>

        {/* Informações Técnicas */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Informações Técnicas</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Orçamento estimado (R$)</Label><Input value={form.orcamento_estimado} onChange={(e) => set("orcamento_estimado", e.target.value)} inputMode="decimal" placeholder="0,00" /></div>
              <div><Label>Número ODI</Label><Input value={form.numero_odi} onChange={(e) => set("numero_odi", e.target.value)} /></div>
              <div><Label>Tipo de atendimento</Label><Input value={form.tipo_atendimento} onChange={(e) => set("tipo_atendimento", e.target.value)} /></div>
              <div><Label>Tranche</Label><CopyableInput value={dados.tranche} /></div>
            </div>
            <div>
              <Label>Observação técnica</Label>
              <Textarea value={form.observacao_tecnica} onChange={(e) => set("observacao_tecnica", e.target.value)} rows={2} />
            </div>
          </CardContent>
        </Card>

        {/* Informações da Comunidade */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Informações da Comunidade</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Tipo de comunidade</Label><Input value={form.tipo_comunidade} onChange={(e) => set("tipo_comunidade", e.target.value)} /></div>
              <div><Label>Nome da comunidade</Label><Input value={form.nome_comunidade} onChange={(e) => set("nome_comunidade", e.target.value)} /></div>
              <div id="campo-comunidade_validada">
                <Label>Comunidade validada</Label>
                <Select
                  value={form.comunidade_validada === null ? NULO : String(form.comunidade_validada)}
                  onValueChange={(v) => set("comunidade_validada", v === NULO ? null : v === "true")}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NULO}>Não informado</SelectItem>
                    <SelectItem value="true">Sim</SelectItem>
                    <SelectItem value="false">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Observação da comunidade</Label>
              <Textarea value={form.observacao_comunidade} onChange={(e) => set("observacao_comunidade", e.target.value)} rows={2} />
            </div>
          </CardContent>
        </Card>

        {/* Dados da Unidade Consumidora */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Dados da Unidade Consumidora</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Nome da unidade consumidora</Label><Input value={form.nome_unidade_consumidora} onChange={(e) => set("nome_unidade_consumidora", e.target.value)} /></div>
              <div id="campo-nome_consumidor_validado">
                <Label>Nome do consumidor validado</Label>
                <Select
                  value={form.nome_consumidor_validado === null ? NULO : String(form.nome_consumidor_validado)}
                  onValueChange={(v) => set("nome_consumidor_validado", v === NULO ? null : v === "true")}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NULO}>Não informado</SelectItem>
                    <SelectItem value="true">Sim</SelectItem>
                    <SelectItem value="false">Não</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Número da UC</Label><Input value={form.numero_uc} onChange={(e) => set("numero_uc", e.target.value)} /></div>
              <div><Label>Data de ligação</Label><Input type="date" value={form.data_ligacao} onChange={(e) => set("data_ligacao", e.target.value)} /></div>
              <div><Label>Distância cadastro/ligação (m)</Label><Input value={form.distancia_cadastro_ligacao_m} onChange={(e) => set("distancia_cadastro_ligacao_m", e.target.value)} inputMode="decimal" /></div>
              <div><Label>Crítica de distância</Label><Input value={form.critica_distancia} onChange={(e) => set("critica_distancia", e.target.value)} /></div>
            </div>
            <div>
              <Label>Observação da unidade consumidora</Label>
              <Textarea value={form.observacao_unidade_consumidora} onChange={(e) => set("observacao_unidade_consumidora", e.target.value)} rows={2} />
            </div>
          </CardContent>
        </Card>

        {/* Critérios de Enquadramento */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Critérios de Enquadramento</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {criteriosPorCategoria.length === 0 && (
              <p className="text-muted-foreground">Nenhum critério ativo cadastrado.</p>
            )}
            {criteriosPorCategoria.map(([categoria, itens]) => (
              <div key={categoria} className="space-y-2">
                <h3 className="font-medium text-muted-foreground uppercase text-xs tracking-wide">{categoria}</h3>
                <div className="grid gap-2 md:grid-cols-2">
                  {(itens ?? []).map((c) => (
                    <label key={c.id_criterio} className="flex items-start gap-2 rounded-md border p-2 cursor-pointer hover:bg-muted/50">
                      <Checkbox
                        checked={selecionados.includes(c.id_criterio)}
                        onCheckedChange={(checked) => toggleCriterio(c.id_criterio, checked === true)}
                      />
                      <span>{c.codigo} - {c.descricao}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Resultado da Análise */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Resultado da Análise</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div id="campo-resultado_analise">
              <Label>Resultado</Label>
              <Select
                value={form.resultado_analise ?? NULO}
                onValueChange={(v) => set("resultado_analise", v === NULO ? null : (v as Resultado))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NULO}>Não informado</SelectItem>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="reprovado">Reprovado</SelectItem>
                  <SelectItem value="pendente_complementacao">Pendente de complementação</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observações finais</Label>
              <Textarea value={form.observacoes_finais} onChange={(e) => set("observacoes_finais", e.target.value)} rows={3} />
            </div>
          </CardContent>
        </Card>

        {/* Responsáveis */}
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm">Responsáveis</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div id="campo-analista">
              <Label>Analista responsável</Label>
              <Select
                value={form.analista_responsavel_id || NULO}
                onValueChange={(v) => set("analista_responsavel_id", v === NULO ? "" : v)}
              >
                <SelectTrigger><SelectValue placeholder="Selecione o analista" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value={NULO}>Não informado</SelectItem>
                  {(analistas.data ?? []).map((p) => (
                    <SelectItem key={p.user_id} value={p.user_id}>
                      {p.full_name || p.username || p.user_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div id="campo-data_analise">
              <Label>Data da análise</Label>
              <Input type="date" value={form.data_analise} onChange={(e) => set("data_analise", e.target.value)} />
            </div>
            <div>
              <Label>Status da análise</Label>
              <CopyableInput value={analise.data?.status_analise ?? "rascunho"} />
            </div>
          </CardContent>
        </Card>

        {/* Status da Validação */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3"><CardTitle className="text-sm">Status da Validação</CardTitle></CardHeader>
          <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {indicadores.map((ind) => (
              <div
                key={ind.label}
                className={`flex items-center gap-2 rounded-md border p-2 ${
                  ind.valor === true
                    ? "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400"
                    : ind.valor === false
                      ? "border-destructive/40 bg-destructive/10 text-destructive"
                      : "border-border bg-muted/40 text-muted-foreground"
                }`}
              >
                {ind.valor === true ? <CheckCircle2 className="h-4 w-4" /> : ind.valor === false ? <XCircle className="h-4 w-4" /> : <MinusCircle className="h-4 w-4" />}
                <span>{ind.label}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap justify-end gap-2 pb-8">
        <Button variant="outline" onClick={() => navigate(-1)} disabled={salvar.isPending}>
          <ArrowLeft className="mr-2 h-4 w-4" />Voltar
        </Button>
        <Button variant="secondary" onClick={() => executarSalvamento(false)} disabled={salvar.isPending}>
          {salvar.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Salvar Rascunho
        </Button>
        <Button onClick={handleConcluir} disabled={salvar.isPending}>
          {salvar.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
          Concluir Análise
        </Button>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Concluir análise da OS {dados.num_os}?</AlertDialogTitle>
            <AlertDialogDescription>
              A análise será registrada como concluída. Confirme se todas as informações estão corretas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmOpen(false);
                void executarSalvamento(true);
              }}
            >
              Concluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>

      </AlertDialog>
    </div>
  );
}
