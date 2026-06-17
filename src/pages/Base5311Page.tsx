import { useMemo, useState, useRef } from "react";
import { Navigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { useBase5311 } from "@/hooks/useBase5311";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Loader2, Plus, Pencil, Trash2, Upload, Search, X, Shield } from "lucide-react";
import { Base5311 } from "@/types/database";
import { readExcelFile } from "@/lib/excelUtils";
import { toast } from "sonner";

const empty: Partial<Base5311> = {
  controle: null, identificacao: "", alocacao: "", tranche: "", nome: "",
  cpf: "", cpf_corrigido: "", criterios: "", endereco: "", municipio: "",
  polo: "", regional: "", obra: "",
};

export default function Base5311Page() {
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const { data, isLoading, create, update, remove, importMany, isImporting } = useBase5311();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Partial<Base5311> | null>(null);
  const [open, setOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState<Base5311 | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!roleLoading && !isAdmin) return <Navigate to="/" replace />;

  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const s = search.toLowerCase();
    return data.filter((r) =>
      [r.nome, r.cpf, r.cpf_corrigido, r.identificacao, r.municipio, r.regional, r.obra, r.polo]
        .some((v) => (v ?? "").toString().toLowerCase().includes(s))
    );
  }, [data, search]);

  const handleSave = () => {
    if (!editing) return;
    const payload: Partial<Base5311> = {
      ...editing,
      controle: editing.controle == null || editing.controle === ("" as unknown as number) ? null : Number(editing.controle),
    };
    if (editing.id) update(payload as Base5311);
    else create(payload);
    setOpen(false);
    setEditing(null);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Arquivo muito grande (máx 10MB)");
      return;
    }
    try {
      const rows = await readExcelFile(file);
      if (!rows.length) {
        toast.error("Planilha vazia");
        return;
      }
      await importMany(rows as Record<string, unknown>[]);
    } catch (err) {
      toast.error("Falha ao importar planilha");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  if (roleLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Base 5311</CardTitle>
                <CardDescription>
                  Lista de clientes prioritários. Total: <strong>{data.length}</strong>
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
                <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={isImporting}>
                  {isImporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                  Importar Excel
                </Button>
                <Button onClick={() => { setEditing({ ...empty }); setOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" /> Novo
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por nome, CPF, município, regional..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8" />
              </div>
              <Button variant="outline" size="icon" onClick={() => setSearch("")}><X className="h-4 w-4" /></Button>
            </div>
            <ScrollArea className="h-[calc(100vh-320px)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Ações</TableHead>
                    <TableHead>Controle</TableHead>
                    <TableHead>Identificação</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>CPF corrigido</TableHead>
                    <TableHead>Alocação</TableHead>
                    <TableHead>Tranche</TableHead>
                    <TableHead>Polo</TableHead>
                    <TableHead>Regional</TableHead>
                    <TableHead>Município</TableHead>
                    <TableHead>Obra</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={12} className="text-center text-muted-foreground py-8">Nenhum registro</TableCell></TableRow>
                  ) : filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => { setEditing(r); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => setConfirmDel(r)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </TableCell>
                      <TableCell>{r.controle ?? "-"}</TableCell>
                      <TableCell className="text-xs">{r.identificacao ?? "-"}</TableCell>
                      <TableCell className="font-medium">{r.nome ?? "-"}</TableCell>
                      <TableCell className="font-mono text-xs">{r.cpf ?? "-"}</TableCell>
                      <TableCell className="font-mono text-xs">{r.cpf_corrigido ?? "-"}</TableCell>
                      <TableCell className="text-xs">{r.alocacao ?? "-"}</TableCell>
                      <TableCell className="text-xs">{r.tranche ?? "-"}</TableCell>
                      <TableCell className="text-xs">{r.polo ?? "-"}</TableCell>
                      <TableCell className="text-xs">{r.regional ?? "-"}</TableCell>
                      <TableCell className="text-xs">{r.municipio ?? "-"}</TableCell>
                      <TableCell className="text-xs">{r.obra ?? "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <Sheet open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editing?.id ? "Editar" : "Novo"} registro Base 5311</SheetTitle>
            <SheetDescription>Preencha os campos abaixo. CPF corrigido é usado para validação.</SheetDescription>
          </SheetHeader>
          {editing && (
            <div className="grid grid-cols-2 gap-3 mt-4">
              <Field label="Controle" type="number" value={editing.controle ?? ""} onChange={(v) => setEditing({ ...editing, controle: v === "" ? null : Number(v) })} />
              <Field label="Identificação" value={editing.identificacao ?? ""} onChange={(v) => setEditing({ ...editing, identificacao: v })} />
              <Field label="Nome" value={editing.nome ?? ""} onChange={(v) => setEditing({ ...editing, nome: v })} colSpan={2} />
              <Field label="CPF" value={editing.cpf ?? ""} onChange={(v) => setEditing({ ...editing, cpf: v })} />
              <Field label="CPF corrigido" value={editing.cpf_corrigido ?? ""} onChange={(v) => setEditing({ ...editing, cpf_corrigido: v })} />
              <Field label="Alocação" value={editing.alocacao ?? ""} onChange={(v) => setEditing({ ...editing, alocacao: v })} />
              <Field label="Tranche" value={editing.tranche ?? ""} onChange={(v) => setEditing({ ...editing, tranche: v })} />
              <Field label="Critérios" value={editing.criterios ?? ""} onChange={(v) => setEditing({ ...editing, criterios: v })} colSpan={2} />
              <Field label="Endereço" value={editing.endereco ?? ""} onChange={(v) => setEditing({ ...editing, endereco: v })} colSpan={2} />
              <Field label="Município" value={editing.municipio ?? ""} onChange={(v) => setEditing({ ...editing, municipio: v })} />
              <Field label="Polo" value={editing.polo ?? ""} onChange={(v) => setEditing({ ...editing, polo: v })} />
              <Field label="Regional" value={editing.regional ?? ""} onChange={(v) => setEditing({ ...editing, regional: v })} />
              <Field label="Obra" value={editing.obra ?? ""} onChange={(v) => setEditing({ ...editing, obra: v })} />
              <div className="col-span-2 flex gap-2 mt-2">
                <Button onClick={handleSave} className="flex-1">Salvar</Button>
                <Button variant="outline" onClick={() => { setOpen(false); setEditing(null); }}>Cancelar</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!confirmDel} onOpenChange={(v) => !v && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover registro?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDel?.nome ? `Remover "${confirmDel.nome}" da Base 5311?` : "Esta ação não pode ser desfeita."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (confirmDel) remove(confirmDel.id); setConfirmDel(null); }}>Remover</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Field({ label, value, onChange, type = "text", colSpan = 1 }: { label: string; value: string | number; onChange: (v: string) => void; type?: string; colSpan?: 1 | 2 }) {
  return (
    <div className={colSpan === 2 ? "col-span-2 space-y-1" : "space-y-1"}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}