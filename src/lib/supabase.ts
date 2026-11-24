import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Variáveis de ambiente do Supabase não configuradas!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface AvaliacaoHospede {
  id: string;
  created_at: string;
  nome_hospede: string;
  acompanhantes: string[];
  tags: string[];
  relato: string;
  anfitriao_nome: string;
  plataforma: string;
}

export interface UsuarioAcesso {
  id: string;
  created_at: string;
  login: string;
  senha?: string;
  nome_exibicao: string;
  is_admin: boolean;
  primeiro_acesso: boolean;
}
