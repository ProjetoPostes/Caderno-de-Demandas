import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, Send, Loader2 } from "lucide-react";
import { useDespacho } from "@/hooks/useDespacho";
import { useCaderno } from "@/hooks/useCaderno";
import { Despacho, Caderno } from "@/types/database";

interface OsSelectionDialogProps {
  onSelect: (items: Array<{ type: "despacho" | "caderno"; numos: number; nomecli: string | null }>) => void;
  trigger?: React.ReactNode;
}

export function OsSelectionDialog({ onSelect, trigger }: OsSelectionDialogProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedDespachos, setSelectedDespachos] = useState<Set<string>>(new Set());
  const [selectedCadernos, setSelectedCadernos] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<"despacho" | "caderno">("despacho");

  const { data: despachoData, isLoading: loadingDespacho } = useDespacho(false);
  const { data: cadernoData, isLoading: loadingCaderno } = useCaderno(100);

  const filteredDespacho = useMemo(() => {
    if (!search) return despachoData.slice(0, 50);
    const s = search.toLowerCase();
    return despachoData
      .filter((d) => d.numos.toString().includes(s) || d.nomecli?.toLowerCase().includes(s))
      .slice(0, 50);
  }, [despachoData, search]);

  const filteredCaderno = useMemo(() => {
    if (!search) return cadernoData.slice(0, 50);
    const s = search.toLowerCase();
    return cadernoData
      .filter((c) => c.numos.toString().includes(s) || c.nomecli?.toLowerCase().includes(s))
      .slice(0, 50);
  }, [cadernoData, search]);

  const toggleDespacho = (id: string) => {
    const newSet = new Set(selectedDespachos);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedDespachos(newSet);
  };

  const toggleCaderno = (id: string) => {
    const newSet = new Set(selectedCadernos);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedCadernos(newSet);
  };

  const handleConfirm = () => {
    const items: Array<{ type: "despacho" | "caderno"; numos: number; nomecli: string | null }> = [];

    selectedDespachos.forEach((id) => {
      const d = despachoData.find((x) => x.id === id);
      if (d) items.push({ type: "despacho", numos: d.numos, nomecli: d.nomecli });
    });

    selectedCadernos.forEach((id) => {
      const c = cadernoData.find((x) => x.id === id);
      if (c) items.push({ type: "caderno", numos: c.numos, nomecli: c.nomecli });
    });

    onSelect(items);
    setOpen(false);
    setSelectedDespachos(new Set());
    setSelectedCadernos(new Set());
    setSearch("");
  };

  const totalSelected = selectedDespachos.size + selectedCadernos.size;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Send className="h-4 w-4 mr-2" />
            Selecionar OS/Obras
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Selecionar OS/Obras para Demanda</DialogTitle>
          <DialogDescription>
            Selecione as ordens de serviço ou obras para enviar como demanda
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por NUMOS ou Nome do Cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "despacho" | "caderno")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="despacho">
                Despacho
                {selectedDespachos.size > 0 && (
                  <Badge variant="secondary" className="ml-2">{selectedDespachos.size}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="caderno">
                Caderno
                {selectedCadernos.size > 0 && (
                  <Badge variant="secondary" className="ml-2">{selectedCadernos.size}</Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="despacho">
              {loadingDespacho ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <ScrollArea className="h-[300px] border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>NUMOS</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Regional</TableHead>
                        <TableHead>Tratativa</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDespacho.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedDespachos.has(item.id)}
                              onCheckedChange={() => toggleDespacho(item.id)}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-sm">{item.numos}</TableCell>
                          <TableCell>{item.nomecli}</TableCell>
                          <TableCell>{item.regional}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.tratativa}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredDespacho.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            Nenhum registro encontrado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="caderno">
              {loadingCaderno ? (
                <div className="flex items-center justify-center h-48">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <ScrollArea className="h-[300px] border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[50px]"></TableHead>
                        <TableHead>NUMOS</TableHead>
                        <TableHead>Num Obra</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Controle</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredCaderno.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedCadernos.has(item.id)}
                              onCheckedChange={() => toggleCaderno(item.id)}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-sm">{item.numos}</TableCell>
                          <TableCell className="font-mono text-sm">{item.numobra}</TableCell>
                          <TableCell>{item.nomecli}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.controle_os}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                      {filteredCaderno.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            Nenhum registro encontrado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <div className="flex-1 text-sm text-muted-foreground">
            {totalSelected} item(s) selecionado(s)
          </div>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={totalSelected === 0}>
            Confirmar Seleção
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
