export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      base_5311: {
        Row: {
          alocacao: string | null
          controle: number | null
          cpf: string | null
          cpf_corrigido: string | null
          created_at: string
          criterios: string | null
          endereco: string | null
          id: string
          identificacao: string | null
          municipio: string | null
          nome: string | null
          obra: string | null
          polo: string | null
          regional: string | null
          tranche: string | null
          updated_at: string
        }
        Insert: {
          alocacao?: string | null
          controle?: number | null
          cpf?: string | null
          cpf_corrigido?: string | null
          created_at?: string
          criterios?: string | null
          endereco?: string | null
          id?: string
          identificacao?: string | null
          municipio?: string | null
          nome?: string | null
          obra?: string | null
          polo?: string | null
          regional?: string | null
          tranche?: string | null
          updated_at?: string
        }
        Update: {
          alocacao?: string | null
          controle?: number | null
          cpf?: string | null
          cpf_corrigido?: string | null
          created_at?: string
          criterios?: string | null
          endereco?: string | null
          id?: string
          identificacao?: string | null
          municipio?: string | null
          nome?: string | null
          obra?: string | null
          polo?: string | null
          regional?: string | null
          tranche?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      caderno: {
        Row: {
          base_5311: string | null
          bloco_cliente: string | null
          complemento: string | null
          controle_os: string | null
          created_at: string
          criterio: string | null
          data_766: string | null
          data_carta: string | null
          data_recebimento: string | null
          datacontab: string | null
          dataprev: string | null
          datasol: string | null
          datatertrab: string | null
          deleted_at: string | null
          deleted_by: string | null
          dsclgr_os: string | null
          dth_envio_dineng: string | null
          dth_impedimento: string | null
          dth_nascimento: string | null
          dth_retorno_dineng: string | null
          email: string | null
          empreiteira: string | null
          id: string
          motivo_improcedencia: string | null
          nomecli: string | null
          nomelcd: string | null
          numcpf: string | null
          numobra: number | null
          numos: number
          numtel: string | null
          numtel2: string | null
          observacao: string | null
          origem: string | null
          pendencia_obra: string | null
          prazo: string | null
          prioridade: string | null
          regional: string | null
          responsavel: string | null
          status: string | null
          tipo_carta_enviada: string | null
          tranche: string | null
          updated_at: string
        }
        Insert: {
          base_5311?: string | null
          bloco_cliente?: string | null
          complemento?: string | null
          controle_os?: string | null
          created_at?: string
          criterio?: string | null
          data_766?: string | null
          data_carta?: string | null
          data_recebimento?: string | null
          datacontab?: string | null
          dataprev?: string | null
          datasol?: string | null
          datatertrab?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          dsclgr_os?: string | null
          dth_envio_dineng?: string | null
          dth_impedimento?: string | null
          dth_nascimento?: string | null
          dth_retorno_dineng?: string | null
          email?: string | null
          empreiteira?: string | null
          id?: string
          motivo_improcedencia?: string | null
          nomecli?: string | null
          nomelcd?: string | null
          numcpf?: string | null
          numobra?: number | null
          numos: number
          numtel?: string | null
          numtel2?: string | null
          observacao?: string | null
          origem?: string | null
          pendencia_obra?: string | null
          prazo?: string | null
          prioridade?: string | null
          regional?: string | null
          responsavel?: string | null
          status?: string | null
          tipo_carta_enviada?: string | null
          tranche?: string | null
          updated_at?: string
        }
        Update: {
          base_5311?: string | null
          bloco_cliente?: string | null
          complemento?: string | null
          controle_os?: string | null
          created_at?: string
          criterio?: string | null
          data_766?: string | null
          data_carta?: string | null
          data_recebimento?: string | null
          datacontab?: string | null
          dataprev?: string | null
          datasol?: string | null
          datatertrab?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          dsclgr_os?: string | null
          dth_envio_dineng?: string | null
          dth_impedimento?: string | null
          dth_nascimento?: string | null
          dth_retorno_dineng?: string | null
          email?: string | null
          empreiteira?: string | null
          id?: string
          motivo_improcedencia?: string | null
          nomecli?: string | null
          nomelcd?: string | null
          numcpf?: string | null
          numobra?: number | null
          numos?: number
          numtel?: string | null
          numtel2?: string | null
          observacao?: string | null
          origem?: string | null
          pendencia_obra?: string | null
          prazo?: string | null
          prioridade?: string | null
          regional?: string | null
          responsavel?: string | null
          status?: string | null
          tipo_carta_enviada?: string | null
          tranche?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          file: Json | null
          id: string
          recipient_id: string
          sender_id: string
          status: string
        }
        Insert: {
          content: string
          created_at?: string
          file?: Json | null
          id?: string
          recipient_id: string
          sender_id: string
          status?: string
        }
        Update: {
          content?: string
          created_at?: string
          file?: Json | null
          id?: string
          recipient_id?: string
          sender_id?: string
          status?: string
        }
        Relationships: []
      }
      demandas: {
        Row: {
          created_at: string
          criado_por: string
          deleted_at: string | null
          deleted_by: string | null
          descricao: string | null
          id: string
          operador_id: string | null
          prazo_execucao: string | null
          prioridade: string | null
          status: string | null
          tipo: string
          tipo_carta: string | null
          tipo_demanda: string | null
          titulo: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          criado_por: string
          deleted_at?: string | null
          deleted_by?: string | null
          descricao?: string | null
          id?: string
          operador_id?: string | null
          prazo_execucao?: string | null
          prioridade?: string | null
          status?: string | null
          tipo: string
          tipo_carta?: string | null
          tipo_demanda?: string | null
          titulo: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          criado_por?: string
          deleted_at?: string | null
          deleted_by?: string | null
          descricao?: string | null
          id?: string
          operador_id?: string | null
          prazo_execucao?: string | null
          prioridade?: string | null
          status?: string | null
          tipo?: string
          tipo_carta?: string | null
          tipo_demanda?: string | null
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      despacho: {
        Row: {
          base: string | null
          complemento: string | null
          concluida: boolean
          created_at: string
          criterio: string | null
          data_conclusao: string | null
          deleted_at: string | null
          deleted_by: string | null
          dias_para_despacho: number | null
          dsclgr_os: string | null
          dth_nascimento: string | null
          email: string | null
          familia: string | null
          id: string
          inconsistencia: number | null
          motivo_da_improcedencia: string | null
          nomecli: string | null
          nomelcd: string | null
          numcpf: string | null
          numos: number
          regional: string | null
          responsavel: string | null
          telefone: string | null
          tratativa: string | null
          updated_at: string
        }
        Insert: {
          base?: string | null
          complemento?: string | null
          concluida?: boolean
          created_at?: string
          criterio?: string | null
          data_conclusao?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          dias_para_despacho?: number | null
          dsclgr_os?: string | null
          dth_nascimento?: string | null
          email?: string | null
          familia?: string | null
          id?: string
          inconsistencia?: number | null
          motivo_da_improcedencia?: string | null
          nomecli?: string | null
          nomelcd?: string | null
          numcpf?: string | null
          numos: number
          regional?: string | null
          responsavel?: string | null
          telefone?: string | null
          tratativa?: string | null
          updated_at?: string
        }
        Update: {
          base?: string | null
          complemento?: string | null
          concluida?: boolean
          created_at?: string
          criterio?: string | null
          data_conclusao?: string | null
          deleted_at?: string | null
          deleted_by?: string | null
          dias_para_despacho?: number | null
          dsclgr_os?: string | null
          dth_nascimento?: string | null
          email?: string | null
          familia?: string | null
          id?: string
          inconsistencia?: number | null
          motivo_da_improcedencia?: string | null
          nomecli?: string | null
          nomelcd?: string | null
          numcpf?: string | null
          numos?: number
          regional?: string | null
          responsavel?: string | null
          telefone?: string | null
          tratativa?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      documentos_cartas: {
        Row: {
          categoria: string
          created_at: string
          criado_por: string
          descricao: string | null
          id: string
          nome: string
          updated_at: string
          url: string
        }
        Insert: {
          categoria: string
          created_at?: string
          criado_por: string
          descricao?: string | null
          id?: string
          nome: string
          updated_at?: string
          url: string
        }
        Update: {
          categoria?: string
          created_at?: string
          criado_por?: string
          descricao?: string | null
          id?: string
          nome?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      encryption_config: {
        Row: {
          created_at: string | null
          encryption_key: string
          id: string
        }
        Insert: {
          created_at?: string | null
          encryption_key: string
          id?: string
        }
        Update: {
          created_at?: string | null
          encryption_key?: string
          id?: string
        }
        Relationships: []
      }
      mfa_requirements: {
        Row: {
          created_at: string
          id: string
          required: boolean
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          required?: boolean
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          required?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cargo: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      masked_audit_logs: {
        Row: {
          action: string | null
          created_at: string | null
          id: string | null
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string | null
          id?: string | null
          ip_address?: string | null
          new_data?: never
          old_data?: never
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string | null
          id?: string | null
          ip_address?: string | null
          new_data?: never
          old_data?: never
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      check_security_health: { Args: never; Returns: Json }
      check_user_mfa_requirement: { Args: { p_user_id: string }; Returns: Json }
      decrypt_sensitive: { Args: { p_encrypted: string }; Returns: string }
      encrypt_sensitive: { Args: { p_text: string }; Returns: string }
      find_cliente_duplicatas: {
        Args: { p_current_numos: number; p_numcpf: string }
        Returns: Json
      }
      get_caderno_decrypted: {
        Args: { p_show_deleted?: boolean }
        Returns: Json
      }
      get_despacho_decrypted: {
        Args: { p_show_concluded?: boolean }
        Returns: Json
      }
      get_encryption_key: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_in_base_5311: { Args: { p_cpf: string }; Returns: boolean }
      list_operadores: {
        Args: never
        Returns: {
          cargo: string
          full_name: string
          user_id: string
        }[]
      }
      log_audit_action: {
        Args: {
          p_action: string
          p_new_data?: Json
          p_old_data?: Json
          p_record_id?: string
          p_table_name: string
        }
        Returns: string
      }
      secure_delete_record: {
        Args: { p_record_id: string; p_table_name: string }
        Returns: Json
      }
      soft_delete_record: {
        Args: { p_record_id: string; p_table_name: string }
        Returns: Json
      }
      validate_operador_assignment: {
        Args: { p_operador_id: string }
        Returns: Json
      }
      validate_user_access: {
        Args: {
          p_operation: string
          p_record_id?: string
          p_table_name: string
        }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "operador_chefe" | "operador" | "consultor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "operador_chefe", "operador", "consultor"],
    },
  },
} as const
