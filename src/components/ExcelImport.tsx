import { useState, useRef } from "react";
import { readExcelFile } from "@/lib/excelUtils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Upload, FileSpreadsheet, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { validateAndSanitizeRecord, isValidCPF, isValidEmail, isValidPhone } from "@/lib/inputValidation";

interface ExcelImportProps {
  onImport: (data: Record<string, unknown>[]) => Promise<void>;
  expectedColumns: string[];
  tableName: string;
}

// Validation rules for different tables
const TABLE_VALIDATION_RULES: Record<string, {
  cpfFields: string[];
  phoneFields: string[];
  emailFields: string[];
  maxLengths: Record<string, number>;
}> = {
  caderno: {
    cpfFields: ['numcpf', 'NUMCPF'],
    phoneFields: ['numtel', 'numtel2', 'NUMTEL', 'NUMTEL2'],
    emailFields: ['email', 'EMAIL'],
    maxLengths: {
      nomecli: 255,
      nomelcd: 255,
      email: 255,
      complemento: 500,
      observacao: 1000,
    }
  },
  despacho: {
    cpfFields: ['numcpf', 'NUMCPF'],
    phoneFields: ['telefone', 'TELEFONE'],
    emailFields: ['email', 'EMAIL'],
    maxLengths: {
      nomecli: 255,
      nomelcd: 255,
      email: 255,
      complemento: 500,
    }
  },
  default: {
    cpfFields: [],
    phoneFields: [],
    emailFields: [],
    maxLengths: {}
  }
};

export function ExcelImport({ onImport, expectedColumns, tableName }: ExcelImportProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, unknown>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getValidationRules = () => {
    return TABLE_VALIDATION_RULES[tableName.toLowerCase()] || TABLE_VALIDATION_RULES.default;
  };

  const validateImportData = (data: Record<string, unknown>[]): { valid: boolean; errors: string[] } => {
    const rules = getValidationRules();
    const errors: string[] = [];
    
    data.forEach((row, index) => {
      // Check CPF fields
      for (const cpfField of rules.cpfFields) {
        const value = row[cpfField];
        if (value && typeof value === 'string' && !isValidCPF(value)) {
          errors.push(`Linha ${index + 1}: CPF inválido no campo "${cpfField}"`);
        }
      }
      
      // Check phone fields
      for (const phoneField of rules.phoneFields) {
        const value = row[phoneField];
        if (value && typeof value === 'string' && !isValidPhone(value)) {
          errors.push(`Linha ${index + 1}: Telefone inválido no campo "${phoneField}"`);
        }
      }
      
      // Check email fields
      for (const emailField of rules.emailFields) {
        const value = row[emailField];
        if (value && typeof value === 'string' && !isValidEmail(value)) {
          errors.push(`Linha ${index + 1}: Email inválido no campo "${emailField}"`);
        }
      }
      
      // Check max lengths
      for (const [field, maxLength] of Object.entries(rules.maxLengths)) {
        const value = row[field] || row[field.toUpperCase()];
        if (value && typeof value === 'string' && value.length > maxLength) {
          errors.push(`Linha ${index + 1}: Campo "${field}" excede ${maxLength} caracteres`);
        }
      }
    });
    
    // Limit displayed errors
    return {
      valid: errors.length === 0,
      errors: errors.slice(0, 10)
    };
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setValidationErrors([]);
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("O arquivo é muito grande. Tamanho máximo: 10MB.");
      return;
    }
    
    readExcelFile(file)
      .then((jsonData) => {
        if (jsonData.length === 0) {
          setError("O arquivo está vazio ou não contém dados válidos.");
          return;
        }

        // Validate data
        const validation = validateImportData(jsonData);
        if (!validation.valid) {
          setValidationErrors(validation.errors);
        }

        const fileColumns = Object.keys(jsonData[0]);
        setColumns(fileColumns);
        setPreviewData(jsonData.slice(0, 10));
        
        (window as unknown as { __excelImportData: Record<string, unknown>[] }).__excelImportData = jsonData;
      })
      .catch(() => {
        setError("Erro ao ler o arquivo. Verifique se é um arquivo Excel válido.");
      });
  };

  const handleImport = async () => {
    const fullData = (window as unknown as { __excelImportData: Record<string, unknown>[] }).__excelImportData;
    if (!fullData || fullData.length === 0) {
      toast.error("Nenhum dado para importar");
      return;
    }

    // Warn about validation errors but allow import
    if (validationErrors.length > 0) {
      const confirm = window.confirm(
        `Foram encontrados ${validationErrors.length} erros de validação. Deseja continuar com a importação mesmo assim?`
      );
      if (!confirm) return;
    }

    setIsImporting(true);
    try {
      // Sanitize data before import
      const rules = getValidationRules();
      const sanitizedData = fullData.map(row => {
        const result = validateAndSanitizeRecord(row, rules);
        return result.sanitizedData;
      });
      
      await onImport(sanitizedData);
      toast.success(`${fullData.length} registros importados com sucesso!`);
      setDialogOpen(false);
      setPreviewData([]);
      setColumns([]);
      setValidationErrors([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      toast.error("Erro ao importar dados");
    } finally {
      setIsImporting(false);
    }
  };

  const resetImport = () => {
    setPreviewData([]);
    setColumns([]);
    setError(null);
    setValidationErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetImport(); }}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" />
          Importar Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Importar dados para {tableName}</DialogTitle>
          <DialogDescription>
            Selecione um arquivo Excel (.xlsx, .xls) para importar. Tamanho máximo: 10MB.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Input */}
          <div className="flex items-center gap-4">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
              id="excel-file"
            />
            <label
              htmlFor="excel-file"
              className="flex items-center gap-2 px-4 py-2 border border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Clique para selecionar um arquivo
              </span>
            </label>
          </div>

          {/* Expected Columns Info */}
          <div className="text-xs text-muted-foreground">
            <strong>Colunas esperadas:</strong> {expectedColumns.slice(0, 8).join(", ")}
            {expectedColumns.length > 8 && "..."}
          </div>

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-1">Erros de validação encontrados:</div>
                <ul className="list-disc list-inside text-xs space-y-0.5">
                  {validationErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
                {validationErrors.length >= 10 && (
                  <div className="mt-1 text-xs italic">...e mais erros</div>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Preview */}
          {previewData.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">
                Pré-visualização (primeiros 10 registros de {(window as unknown as { __excelImportData: Record<string, unknown>[] }).__excelImportData?.length || 0} total)
              </div>
              <ScrollArea className="h-[300px] border rounded-lg">
                <div className="min-w-[800px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {columns.slice(0, 8).map((col) => (
                          <TableHead key={col} className="text-xs">{col}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {previewData.map((row, idx) => (
                        <TableRow key={idx}>
                          {columns.slice(0, 8).map((col) => (
                            <TableCell key={col} className="text-xs">
                              {String(row[col] ?? "")}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={previewData.length === 0 || isImporting}
          >
            {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Importar {(window as unknown as { __excelImportData: Record<string, unknown>[] }).__excelImportData?.length || 0} registros
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
