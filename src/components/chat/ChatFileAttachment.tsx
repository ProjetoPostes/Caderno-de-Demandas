import { ChatFile } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  FileText, 
  Image, 
  File, 
  FileSpreadsheet, 
  FileCode,
  FileArchive,
  FileAudio,
  FileVideo,
  Presentation
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ChatFileAttachmentProps {
  file: ChatFile;
  isUser?: boolean;
}

export function ChatFileAttachment({ file, isUser }: ChatFileAttachmentProps) {
  const handleDownload = () => {
    if (!file.data) {
      toast.error('Link do arquivo não disponível.');
      return;
    }
    window.open(file.data, '_blank');
  };

  const getFileIcon = () => {
    const type = file.type?.toLowerCase() || '';
    const name = file.name?.toLowerCase() || '';
    
    // Images
    if (type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)$/i.test(name)) {
      return <Image className="h-5 w-5" />;
    }
    
    // PDF
    if (type === 'application/pdf' || name.endsWith('.pdf')) {
      return <FileText className="h-5 w-5" />;
    }
    
    // Spreadsheets
    if (type.includes('spreadsheet') || type.includes('excel') || 
        /\.(xlsx?|csv|ods)$/i.test(name)) {
      return <FileSpreadsheet className="h-5 w-5" />;
    }
    
    // Presentations
    if (type.includes('presentation') || type.includes('powerpoint') || 
        /\.(pptx?|odp)$/i.test(name)) {
      return <Presentation className="h-5 w-5" />;
    }
    
    // Documents (Word, etc)
    if (type.includes('document') || type.includes('word') || 
        /\.(docx?|odt|rtf|txt)$/i.test(name)) {
      return <FileText className="h-5 w-5" />;
    }
    
    // Code files
    if (type.includes('javascript') || type.includes('json') || type.includes('xml') ||
        /\.(js|ts|jsx|tsx|html|css|json|xml|py|java|c|cpp|h|php|rb|go|rs|sql)$/i.test(name)) {
      return <FileCode className="h-5 w-5" />;
    }
    
    // Archives
    if (type.includes('zip') || type.includes('rar') || type.includes('tar') ||
        /\.(zip|rar|7z|tar|gz|bz2)$/i.test(name)) {
      return <FileArchive className="h-5 w-5" />;
    }
    
    // Audio
    if (type.startsWith('audio/') || /\.(mp3|wav|ogg|flac|aac|m4a)$/i.test(name)) {
      return <FileAudio className="h-5 w-5" />;
    }
    
    // Video
    if (type.startsWith('video/') || /\.(mp4|avi|mov|mkv|webm|wmv)$/i.test(name)) {
      return <FileVideo className="h-5 w-5" />;
    }
    
    // Default
    return <File className="h-5 w-5" />;
  };

  const getFileExtension = () => {
    const name = file.name || '';
    const ext = name.split('.').pop()?.toUpperCase();
    return ext || 'FILE';
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div 
      className={cn(
        "mt-2 flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
        isUser 
          ? "bg-primary-foreground/10 border-primary-foreground/20 hover:bg-primary-foreground/20" 
          : "bg-muted/50 border-border hover:bg-muted"
      )}
      onClick={handleDownload}
    >
      <div className={cn(
        "flex items-center justify-center h-10 w-10 rounded-lg shrink-0",
        isUser ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
      )}>
        {getFileIcon()}
      </div>
      
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm font-medium truncate",
          isUser ? "text-primary-foreground" : "text-foreground"
        )}>
          {file.name || 'Arquivo'}
        </p>
        <div className={cn(
          "flex items-center gap-2 text-xs",
          isUser ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          <span className="font-medium">{getFileExtension()}</span>
          {file.size && (
            <>
              <span>•</span>
              <span>{formatSize(file.size)}</span>
            </>
          )}
        </div>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          "h-8 w-8 shrink-0",
          isUser 
            ? "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10" 
            : "text-muted-foreground hover:text-foreground"
        )}
        onClick={(e) => {
          e.stopPropagation();
          handleDownload();
        }}
      >
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
}
