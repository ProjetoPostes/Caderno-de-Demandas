import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { Home, Search, FileText, ExternalLink, Plus, FolderOpen, File, X, Pencil, Trash2, Loader2 } from "lucide-react";
import { useDocumentosCartas, DocumentoCarta, DocumentoCartaInput } from "@/hooks/useDocumentosCartas";
import { useUserRole } from "@/hooks/useUserRole";

export default function DocumentosCartas() {
  const navigate = useNavigate();
  const { documentos, categorias, isLoading, addDocumento, updateDocumento, deleteDocumento, isAdding, isUpdating, isDeleting } = useDocumentosCartas();
  const { isAdmin } = useUserRole();
  
  const [search, setSearch] = useState("");
  const [filterCategoria, setFilterCategoria] = useState<string>("all");
  
  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocumentoCarta | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<DocumentoCartaInput>({
    nome: "",
    descricao: "",
    categoria: "",
    url: "",
  });

  const filteredDocs = documentos.filter((doc) => {
    const matchesSearch =
      doc.nome.toLowerCase().includes(search.toLowerCase()) ||
      (doc.descricao?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesCategoria = filterCategoria === "all" || doc.categoria === filterCategoria;
    return matchesSearch && matchesCategoria;
  });

  const handleOpenDocument = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const resetForm = () => {
    setFormData({ nome: "", descricao: "", categoria: "", url: "" });
  };

  const handleAddDocument = async () => {
    if (!formData.nome || !formData.url || !formData.categoria) {
      return;
    }
    await addDocumento(formData);
    setAddDialogOpen(false);
    resetForm();
  };

  const handleEditClick = (doc: DocumentoCarta) => {
    setSelectedDoc(doc);
    setFormData({
      nome: doc.nome,
      descricao: doc.descricao || "",
      categoria: doc.categoria,
      url: doc.url,
    });
    setEditDialogOpen(true);
  };

  const handleUpdateDocument = async () => {
    if (!selectedDoc || !formData.nome || !formData.url || !formData.categoria) {
      return;
    }
    await updateDocumento({ id: selectedDoc.id, ...formData });
    setEditDialogOpen(false);
    setSelectedDoc(null);
    resetForm();
  };

  const handleDeleteClick = (doc: DocumentoCarta) => {
    setSelectedDoc(doc);
    setDeleteDialogOpen(true);
  };

  const handleDeleteDocument = async () => {
    if (!selectedDoc) return;
    await deleteDocumento(selectedDoc.id);
    setDeleteDialogOpen(false);
    setSelectedDoc(null);
  };

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
              <h1 className="text-xl font-bold text-primary flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Modelos de Cartas
              </h1>
              <span className="text-xs text-muted-foreground">
                Documentos e modelos disponíveis
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar
              </Button>
            )}
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-6 space-y-6">
        {/* Info Card */}
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Sobre os Modelos de Cartas
            </CardTitle>
            <CardDescription>
              Aqui você encontra os modelos de cartas utilizados nos processos de tratativas. 
              Clique no botão "Abrir" para visualizar ou baixar o documento.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou descrição..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={filterCategoria === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterCategoria("all")}
                >
                  Todas
                </Button>
                {categorias.map((cat) => (
                  <Button
                    key={cat}
                    variant={filterCategoria === cat ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilterCategoria(cat)}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
              {search && (
                <Button variant="ghost" size="icon" onClick={() => setSearch("")}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {isLoading && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin" />
              <p>Carregando documentos...</p>
            </CardContent>
          </Card>
        )}

        {/* Documents Grid */}
        {!isLoading && filteredDocs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map((doc) => (
              <Card key={doc.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <File className="h-5 w-5 text-primary shrink-0" />
                      <CardTitle className="text-sm font-medium line-clamp-1">
                        {doc.nome}
                      </CardTitle>
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {doc.categoria}
                    </Badge>
                  </div>
                  <CardDescription className="text-xs line-clamp-2 mt-1">
                    {doc.descricao || "Sem descrição"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-muted-foreground">
                      {new Date(doc.created_at).toLocaleDateString("pt-BR")}
                    </span>
                    <div className="flex items-center gap-1">
                      {isAdmin && (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEditClick(doc)}
                            className="h-8 w-8"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDeleteClick(doc)}
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDocument(doc.url)}
                        className="gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Abrir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredDocs.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              {documentos.length === 0 ? (
                <>
                  <p>Nenhum documento cadastrado.</p>
                  {isAdmin && (
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => setAddDialogOpen(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar primeiro documento
                    </Button>
                  )}
                </>
              ) : (
                <p>Nenhum documento encontrado com os filtros aplicados.</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Documents Table (alternative view) */}
        {!isLoading && filteredDocs.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Lista Completa</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome do Documento</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredDocs.map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <File className="h-4 w-4 text-primary" />
                            {doc.nome}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[300px] truncate">
                          {doc.descricao || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{doc.categoria}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(doc.created_at).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isAdmin && (
                              <>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleEditClick(doc)}
                                  className="h-8 w-8"
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleDeleteClick(doc)}
                                  className="h-8 w-8 text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenDocument(doc.url)}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </main>

      {/* Add Document Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Documento</DialogTitle>
            <DialogDescription>
              Adicione um novo modelo de carta ao sistema.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Documento *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Modelo Carta 3ª Notificação"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Breve descrição do documento"
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select
                value={formData.categoria}
                onValueChange={(value) => setFormData({ ...formData, categoria: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Improcedência">Improcedência</SelectItem>
                  <SelectItem value="Orçamento">Orçamento</SelectItem>
                  <SelectItem value="Suspensão de Obra">Suspensão de Obra</SelectItem>
                  <SelectItem value="Retomada de Obra">Retomada de Obra</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>URL do Documento *</Label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://docs.google.com/document/d/..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setAddDialogOpen(false); resetForm(); }}>
              Cancelar
            </Button>
            <Button 
              onClick={handleAddDocument} 
              disabled={isAdding || !formData.nome || !formData.url || !formData.categoria}
            >
              {isAdding ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Document Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Documento</DialogTitle>
            <DialogDescription>
              Atualize as informações do documento.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome do Documento *</Label>
              <Input
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Modelo Carta 3ª Notificação"
              />
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Breve descrição do documento"
              />
            </div>
            <div className="space-y-2">
              <Label>Categoria *</Label>
              <Select
                value={formData.categoria}
                onValueChange={(value) => setFormData({ ...formData, categoria: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Improcedência">Improcedência</SelectItem>
                  <SelectItem value="Orçamento">Orçamento</SelectItem>
                  <SelectItem value="Suspensão de Obra">Suspensão de Obra</SelectItem>
                  <SelectItem value="Retomada de Obra">Retomada de Obra</SelectItem>
                  <SelectItem value="Outros">Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>URL do Documento *</Label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://docs.google.com/document/d/..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditDialogOpen(false); setSelectedDoc(null); resetForm(); }}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpdateDocument} 
              disabled={isUpdating || !formData.nome || !formData.url || !formData.categoria}
            >
              {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o documento "{selectedDoc?.nome}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedDoc(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDocument}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
