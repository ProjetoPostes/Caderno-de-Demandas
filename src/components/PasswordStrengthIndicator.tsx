import { useMemo } from "react";
import { calculatePasswordStrength, getStrengthLabel, checkPasswordRequirements } from "@/lib/passwordValidation";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

export function PasswordStrengthIndicator({ 
  password, 
  showRequirements = true 
}: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => calculatePasswordStrength(password), [password]);
  const requirements = useMemo(() => checkPasswordRequirements(password), [password]);
  
  if (!password) return null;
  
  return (
    <div className="space-y-2 mt-2">
      {/* Barra de força */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Força da senha</span>
          <span className={cn(
            "font-medium",
            strength.score <= 1 && "text-destructive",
            strength.score === 2 && "text-warning",
            strength.score >= 3 && "text-green-500"
          )}>
            {getStrengthLabel(strength.label)}
          </span>
        </div>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((index) => (
            <div
              key={index}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                index <= strength.score ? strength.color : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>
      
      {/* Requisitos */}
      {showRequirements && (
        <div className="grid grid-cols-2 gap-1 text-xs">
          <RequirementItem met={requirements.minLength} label="8+ caracteres" />
          <RequirementItem met={requirements.hasUppercase} label="Maiúscula" />
          <RequirementItem met={requirements.hasLowercase} label="Minúscula" />
          <RequirementItem met={requirements.hasNumber} label="Número" />
          <RequirementItem met={requirements.hasSpecial} label="Especial (!@#...)" />
          <RequirementItem met={requirements.noSequences} label="Sem sequências" />
        </div>
      )}
      
      {/* Feedback */}
      {strength.feedback.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {strength.feedback[0]}
        </p>
      )}
    </div>
  );
}

function RequirementItem({ met, label }: { met: boolean; label: string }) {
  return (
    <div className={cn(
      "flex items-center gap-1",
      met ? "text-green-500" : "text-muted-foreground"
    )}>
      {met ? (
        <Check className="h-3 w-3" />
      ) : (
        <X className="h-3 w-3" />
      )}
      <span>{label}</span>
    </div>
  );
}
