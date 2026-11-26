import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HubBackground } from "@/components/HubBackground";
import logoEnergisa from "@/assets/energisa.png";
import { HubIcon } from "@/components/HubIcon";
import { UserMenu } from "@/components/UserMenu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface CategoryItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface SubItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  route?: string;
}

const categories: CategoryItem[] = [
  { id: "despacho", label: "Despacho", icon: <HubIcon name="document" /> },
  { id: "analise", label: "Análise", icon: <HubIcon name="search" /> },
  { id: "cartas", label: "Cartas", icon: <HubIcon name="cartas" /> },
  { id: "obras", label: "Obras", icon: <HubIcon name="buildings" /> },
  { id: "prioridades", label: "Prioridades", icon: <HubIcon name="prioridade" /> },
  { id: "reclamacoes", label: "Reclamações", icon: <HubIcon name="complaint" /> },
  { id: "oficios", label: "Ofícios", icon: <HubIcon name="approval" /> },
  { id: "relatorios", label: "Relatórios", icon: <HubIcon name="relatorio" /> },
];

const subItems: Record<string, SubItem[]> = {
  despacho: [
    {
      id: "pendente",
      label: "Pendente",
      icon: <HubIcon name="clock" className="h-10 w-10" />,
      route: "/consulta/despacho?filtro=Pendente",
    },
    {
      id: "inconsistencia",
      label: "Inconsistência",
      icon: <HubIcon name="cancel" className="h-10 w-10" />,
      route: "/consulta/despacho?filtro=Inconsistencia",
    },
  ],
  analise: [
    { id: "despacho", label: "Despacho", icon: <HubIcon name="document" className="h-10 w-10" />, route: "/consulta/despacho" },
    { id: "caderno", label: "Caderno", icon: <HubIcon name="book" className="h-10 w-10" />, route: "/consulta/caderno" },
    { id: "cliente", label: "Cliente", icon: <HubIcon name="users" className="h-10 w-10" />, route: "/consulta/clientes" },
    { id: "prioritarios", label: "Prioritários", icon: <HubIcon name="prioridade" className="h-10 w-10" />, route: "/consulta/prioritarios" },
    { id: "cartas", label: "Cartas", icon: <HubIcon name="cartas" className="h-10 w-10" />, route: "/consulta/caderno?modo=cartas" },
  ],
  cartas: [
    { id: "mod-cartas", label: "Mod. Cartas", icon: <HubIcon name="edit" className="h-10 w-10" />, route: "/consulta/documentos-cartas" },
    { id: "outros-doc", label: "Outros Doc", icon: <HubIcon name="folder" className="h-10 w-10" /> },
  ],
  obras: [
    { id: "obras", label: "Obras", icon: <HubIcon name="buildings" className="h-10 w-10" />, route: "/consulta/obras" },
    { id: "pendente", label: "Pendente", icon: <HubIcon name="clock" className="h-10 w-10" /> },
    { id: "analisada", label: "Analisada", icon: <HubIcon name="search" className="h-10 w-10" /> },
    { id: "contratada", label: "Contratada", icon: <HubIcon name="briefcase" className="h-10 w-10" /> },
    { id: "suspensa", label: "Suspensa", icon: <HubIcon name="cancel" className="h-10 w-10" /> },
    { id: "encerrada", label: "Encerrada", icon: <HubIcon name="approval" className="h-10 w-10" /> },
    { id: "prazo-construcao", label: "Prazo Construção", icon: <HubIcon name="calendar" className="h-10 w-10" /> },
  ],
  prioridades: [
    {
      id: "diretoria",
      label: "Diretoria",
      icon: <HubIcon name="briefcase" className="h-10 w-10" />,
      route: "/consulta/caderno?modo=prioridade&prioridade=Diretoria",
    },
    {
      id: "reclamacoes",
      label: "Reclamações",
      icon: <HubIcon name="complaint" className="h-10 w-10" />,
      route: "/consulta/caderno?modo=prioridade&prioridade=Reclamações",
    },
    {
      id: "aneel-mme-judicial",
      label: "Aneel / MME / Judicial",
      icon: <HubIcon name="law" className="h-10 w-10" />,
      route: "/consulta/caderno?modo=prioridade&prioridade=Aneel / MME / Judicial",
    },
    {
      id: "quilombolas",
      label: "Quilombolas",
      icon: <HubIcon name="shield" className="h-10 w-10" />,
      route: "/consulta/caderno?modo=prioridade&prioridade=Quilombolas",
    },
    {
      id: "indigenas",
      label: "Indígenas",
      icon: <HubIcon name="shield" className="h-10 w-10" />,
      route: "/consulta/caderno?modo=prioridade&prioridade=Indígenas",
    },
    {
      id: "outros",
      label: "Outros",
      icon: <HubIcon name="folder" className="h-10 w-10" />,
      route: "/consulta/caderno?modo=prioridade&prioridade=Outros",
    },
  ],
  reclamacoes: [
    { id: "controle", label: "Controle", icon: <HubIcon name="clipboard" className="h-10 w-10" /> },
    { id: "prazos", label: "Prazos", icon: <HubIcon name="calendar" className="h-10 w-10" /> },
  ],
  oficios: [{ id: "controle", label: "Controle", icon: <HubIcon name="clipboard" className="h-10 w-10" /> }],
  relatorios: [
    { id: "diretoria", label: "Diretoria", icon: <HubIcon name="briefcase" className="h-10 w-10" /> },
    { id: "cartas", label: "Cartas", icon: <HubIcon name="cartas" className="h-10 w-10" />, route: "/consulta/relatorio-cartas" },
    { id: "projetos", label: "Projetos", icon: <HubIcon name="chart" className="h-10 w-10" /> },
    { id: "obras", label: "Obras", icon: <HubIcon name="buildings" className="h-10 w-10" /> },
  ],
};

export default function MainHub() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const navigate = useNavigate();
  const { isAdmin, isOperadorChefe, isOperador } = useUserRole();
  const canAccessTratativas = isAdmin || isOperadorChefe || isOperador;

  // A arte de fundo começa abaixo do cabeçalho: medimos a altura real da barra
  // (muda com o tamanho da tela) e passamos para a camada de fundo.
  const headerRef = useRef<HTMLElement>(null);
  const [alturaCabecalho, setAlturaCabecalho] = useState(0);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;

    const medir = () => setAlturaCabecalho(Math.round(header.getBoundingClientRect().height));
    medir();

    const observador = new ResizeObserver(medir);
    observador.observe(header);
    return () => observador.disconnect();
  }, []);

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
  };

  const handleSubItemClick = (item: SubItem) => {
    if (item.route) {
      navigate(item.route);
    }
  };

  const goToTratativas = () => {
    navigate("/tratativas");
  };

  return (
    <div className="min-h-screen isolate bg-gradient-to-br from-background via-accent/10 to-primary/5 flex flex-col">
      {/* Header */}
      <header
        ref={headerRef}
        className="border-b border-primary/20 bg-card/80 backdrop-blur-sm sticky top-0 z-10"
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="flex items-center">
              <img src={logoEnergisa} alt="Energisa" className="h-9 w-auto sm:h-10" />
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <TooltipProvider>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="default"
                    onClick={goToTratativas}
                    className="bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                    disabled={!canAccessTratativas}
                  >
                    Acessar Tratativas
                  </Button>
                </TooltipTrigger>
                {!canAccessTratativas && (
                  <TooltipContent>
                    <p>Este recurso é exclusivo para operadores, supervisores e administradores</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
            <ThemeToggle />
            <UserMenu />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-start justify-center p-8 pt-12">
        <div className="w-full max-w-6xl flex gap-12">
          {/* Primary Column */}
          <div className="w-72 flex-shrink-0">
            <div className="space-y-3">
              {categories.map((category) => (
                <Button
                    variant="ghost"
                  key={category.id}
                  onClick={() => handleCategoryClick(category.id)}
                  className={cn(
                    "h-auto w-full group relative flex items-center justify-start gap-3 px-5 py-4 rounded-xl border transition-all duration-200",
                    "shadow-sm hover:shadow-md",
                    selectedCategory === category.id
                      ? "bg-secondary text-secondary-foreground border-secondary shadow-lg"
                      : "bg-card text-foreground border-border hover:border-primary/50 hover:bg-accent/20",
                  )}
                >
                  <div
                    className={cn(
                      "transition-colors",
                      selectedCategory === category.id ? "text-secondary-foreground" : "text-primary",
                    )}
                  >
                    {category.icon}
                  </div>
                  <span className="font-medium text-left">{category.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Secondary Column */}
          <div
            className={cn(
              "flex-1 transition-all duration-300",
              selectedCategory ? "opacity-100 translate-x-0" : "opacity-0 translate-x-4 pointer-events-none",
            )}
          >
            {selectedCategory && (
              <>
                <h2 className="text-lg font-semibold text-primary mb-6 flex items-center gap-2">
                  {categories.find((c) => c.id === selectedCategory)?.icon}
                  {categories.find((c) => c.id === selectedCategory)?.label}
                </h2>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                  {subItems[selectedCategory]?.map((item) => (
                    <Button
                    variant="ghost"
                      key={item.id}
                      onClick={() => handleSubItemClick(item)}
                      className={cn(
                        "h-auto whitespace-normal group flex flex-col items-center justify-center gap-4 p-6 rounded-xl border-2 transition-all duration-200",
                        "bg-card shadow-md hover:shadow-xl min-h-[140px]",
                        item.route
                          ? "cursor-pointer border-primary/30 hover:border-primary hover:bg-primary/5"
                          : "opacity-60 cursor-not-allowed border-border",
                      )}
                    >
                      <div
                        className={cn(
                          "w-16 h-16 rounded-lg flex items-center justify-center transition-all",
                          item.route
                            ? "bg-muted/40 group-hover:scale-110"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {item.icon}
                      </div>
                      <span
                        className={cn(
                          "font-medium text-sm text-center transition-colors",
                          item.route ? "text-foreground group-hover:text-primary" : "text-muted-foreground",
                        )}
                      >
                        {item.label}
                      </span>
                    </Button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-primary/20 bg-card/30 py-4">
        <div className="container mx-auto px-6 text-center text-sm text-muted-foreground">
          Sistema de Consulta e Atribuição de Demandas • <span className="text-primary">Inteligência LPT</span>
        </div>
      </footer>

      <HubBackground inicioAbaixoDo={alturaCabecalho} />
    </div>
  );
}
