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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      condominios: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          nome: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          nome: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      prestacao_eventos: {
        Row: {
          data_ocorrido: string
          id: string
          ocorrido: Database["public"]["Enums"]["evento_tipo"]
          prestacao_id: string
          usuario: string
        }
        Insert: {
          data_ocorrido?: string
          id?: string
          ocorrido: Database["public"]["Enums"]["evento_tipo"]
          prestacao_id: string
          usuario: string
        }
        Update: {
          data_ocorrido?: string
          id?: string
          ocorrido?: Database["public"]["Enums"]["evento_tipo"]
          prestacao_id?: string
          usuario?: string
        }
        Relationships: [
          {
            foreignKeyName: "prestacao_eventos_prestacao_id_fkey"
            columns: ["prestacao_id"]
            isOneToOne: false
            referencedRelation: "prestacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      prestacoes: {
        Row: {
          ativo: boolean
          condominio_id: string
          created_at: string
          data_evento: string
          id: string
          mes: string
          observacoes: string | null
          processo: Database["public"]["Enums"]["processo_tipo"]
          updated_at: string
          usuario: string
          usuario_responsavel: string
        }
        Insert: {
          ativo?: boolean
          condominio_id: string
          created_at?: string
          data_evento: string
          id?: string
          mes: string
          observacoes?: string | null
          processo: Database["public"]["Enums"]["processo_tipo"]
          updated_at?: string
          usuario: string
          usuario_responsavel: string
        }
        Update: {
          ativo?: boolean
          condominio_id?: string
          created_at?: string
          data_evento?: string
          id?: string
          mes?: string
          observacoes?: string | null
          processo?: Database["public"]["Enums"]["processo_tipo"]
          updated_at?: string
          usuario?: string
          usuario_responsavel?: string
        }
        Relationships: [
          {
            foreignKeyName: "prestacoes_condominio_id_fkey"
            columns: ["condominio_id"]
            isOneToOne: false
            referencedRelation: "condominios"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          data_nascimento: string
          email: string
          id: string
          matricula: string | null
          primeiro_nome: string
          segundo_nome: string
        }
        Insert: {
          created_at?: string
          data_nascimento: string
          email: string
          id: string
          matricula?: string | null
          primeiro_nome: string
          segundo_nome: string
        }
        Update: {
          created_at?: string
          data_nascimento?: string
          email?: string
          id?: string
          matricula?: string | null
          primeiro_nome?: string
          segundo_nome?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      public_profiles: {
        Row: {
          email: string | null
          id: string | null
          primeiro_nome: string | null
          segundo_nome: string | null
        }
        Insert: {
          email?: string | null
          id?: string | null
          primeiro_nome?: string | null
          segundo_nome?: string | null
        }
        Update: {
          email?: string | null
          id?: string | null
          primeiro_nome?: string | null
          segundo_nome?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_usuarios_padrao: {
        Args: never
        Returns: {
          id: string
          primeiro_nome: string
          segundo_nome: string
        }[]
      }
      get_usuarios_todos: {
        Args: never
        Returns: {
          id: string
          primeiro_nome: string
          segundo_nome: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "adm" | "padrao"
      evento_tipo: "criação" | "edição"
      processo_tipo:
        | "Documentação Recebida"
        | "Lançamento Contábeis"
        | "Montagem Balancete"
        | "Data da Entrega"
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
      app_role: ["adm", "padrao"],
      evento_tipo: ["criação", "edição"],
      processo_tipo: [
        "Documentação Recebida",
        "Lançamento Contábeis",
        "Montagem Balancete",
        "Data da Entrega",
      ],
    },
  },
} as const
