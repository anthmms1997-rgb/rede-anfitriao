import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Users, 
  ShieldAlert, 
  UserPlus, 
  X, 
  Calendar, 
  Building2, 
  CheckCircle2,
  AlertTriangle,
  FileText,
  UserCheck,
  Trash2,
  Lock,
  LogOut,
  KeyRound,
  Scale,
  Settings,
  UserCog,
  Key,
  ShieldCheck
} from 'lucide-react';
import { supabase, type AvaliacaoHospede, type UsuarioAcesso } from './lib/supabase';
import { validarConteudoRelato } from './lib/moderacao';

interface TagOption {
  label: string;
  type: 'warning' | 'danger';
}

const TAGS_DISPONIVEIS: TagOption[] = [
  { label: 'Imóvel muito sujo / lixo', type: 'danger' },
  { label: 'Danos ao imóvel / enxoval', type: 'danger' },
  { label: 'Fumou no apartamento', type: 'danger' },
  { label: 'Hóspede não informado', type: 'warning' },
  { label: 'Festa / Barulho / Vizinhos', type: 'danger' },
  { label: 'Furto / Itens ausentes', type: 'danger' },
  { label: 'Atraso no check-out / Não sai', type: 'warning' },
  { label: 'Pet não autorizado', type: 'warning' },
  { label: 'Divergência cadastral / Pagamento', type: 'danger' },
  { label: 'Avaliação contestada / Má-fé', type: 'warning' },
  { label: 'Desrespeito / Ameaças', type: 'danger' },
  { label: 'Não recomendado', type: 'danger' },
];

const STORAGE_USER_KEY = 'rede_anfitriao_user_v3';

export default function App() {
  const [usuarioLogado, setUsuarioLogado] = useState<UsuarioAcesso | null>(() => {
    try {
      const salvo = sessionStorage.getItem(STORAGE_USER_KEY);
      return salvo ? JSON.parse(salvo) : null;
    } catch {
      return null;
    }
  });

  const [salvandoTermos, setSalvandoTermos] = useState(false);

  const [carimboTempo, setCarimboTempo] = useState(() =>
    new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
  );

  // Estados da Tela de Login
  const [loginInput, setLoginInput] = useState('');
  const [senhaLogin, setSenhaLogin] = useState('');
  const [erroLogin, setErroLogin] = useState<string | null>(null);
  const [autenticando, setAutenticando] = useState(false);

  // Estados de Redefinição no Primeiro Acesso
  const [novaSenhaPrimeiroAcesso, setNovaSenhaPrimeiroAcesso] = useState('');
  const [confirmaSenhaPrimeiroAcesso, setConfirmaSenhaPrimeiroAcesso] = useState('');
  const [erroPrimeiroAcesso, setErroPrimeiroAcesso] = useState<string | null>(null);
  const [salvandoPrimeiroAcesso, setSalvandoPrimeiroAcesso] = useState(false);

  // Estados do Modal "Trocar Minha Senha"
  const [modalTrocarMinhaSenha, setModalTrocarMinhaSenha] = useState(false);
  const [senhaAtualInput, setSenhaAtualInput] = useState('');
  const [minhaNovaSenha, setMinhaNovaSenha] = useState('');
  const [confirmaMinhaNovaSenha, setConfirmaMinhaNovaSenha] = useState('');
  const [erroMinhaSenha, setErroMinhaSenha] = useState<string | null>(null);
  const [salvandoMinhaSenha, setSalvandoMinhaSenha] = useState(false);

  // Estados da Base de Ocorrências
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoHospede[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensagemBanner, setMensagemBanner] = useState<string | null>(null);

  // Estados do Modal de Exclusão de Ocorrência
  const [registroParaExcluir, setRegistroParaExcluir] = useState<AvaliacaoHospede | null>(null);
  const [senhaDigitada, setSenhaDigitada] = useState('');
  const [erroSenha, setErroSenha] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  // Estados do Painel Admin (Gerenciamento de Usuários)
  const [adminAberto, setAdminAberto] = useState(false);
  const [usuariosLista, setUsuariosLista] = useState<UsuarioAcesso[]>([]);
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(false);
  const [novoLogin, setNovoLogin] = useState('');
  const [novoNomeExibicao, setNovoNomeExibicao] = useState('');
  const [novaSenhaUsuario, setNovaSenhaUsuario] = useState('');
  const [novoIsAdmin, setNovoIsAdmin] = useState(false);
  const [criandoUsuario, setCriandoUsuario] = useState(false);
  const [editandoSenhaId, setEditandoSenhaId] = useState<string | null>(null);
  const [senhaAlteradaInput, setSenhaAlteradaInput] = useState('');

  // Estados do Formulário de Ocorrência
  const [nomeHospede, setNomeHospede] = useState('');
  const [acompanhanteInput, setAcompanhanteInput] = useState('');
  const [acompanhantes, setAcompanhantes] = useState<string[]>([]);
  const [tagsSelecionadas, setTagsSelecionadas] = useState<string[]>([]);
  const [relato, setRelato] = useState('');
  const [plataforma, setPlataforma] = useState('Airbnb');
  const [aceiteResponsabilidade, setAceiteResponsabilidade] = useState(false);

  // Validação automática em tempo real
  const validacaoGeral = useMemo(() => {
    const textoCompleto = [nomeHospede, acompanhanteInput, ...acompanhantes, relato].join(' ');
    return validarConteudoRelato(textoCompleto);
  }, [nomeHospede, acompanhanteInput, acompanhantes, relato]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCarimboTempo(new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Bloqueio de clique direito e atalhos de cópia/impressão no desktop
  useEffect(() => {
    if (!usuarioLogado) return;

    const handleContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isField = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA');

      if ((e.ctrlKey || e.metaKey) && ['p', 's', 'u'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c' && !isField) {
        e.preventDefault();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [usuarioLogado]);

  useEffect(() => {
    if (usuarioLogado && !usuarioLogado.primeiro_acesso && usuarioLogado.termos_aceitos) {
      carregarAvaliacoes();
    }
  }, [usuarioLogado]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!loginInput.trim() || !senhaLogin) return;

    setAutenticando(true);
    setErroLogin(null);

    const { data, error } = await supabase.rpc('autenticar_usuario', {
      p_login: loginInput.trim().toLowerCase(),
      p_senha: senhaLogin,
    });

    setAutenticando(false);

    if (error) {
      setErroLogin('Erro ao conectar ao servidor de autenticação.');
      return;
    }

    const usuarioAutenticado = Array.isArray(data) ? data[0] : data;

    if (!usuarioAutenticado) {
      setErroLogin('Login ou senha inválidos.');
      return;
    }

    sessionStorage.setItem(STORAGE_USER_KEY, JSON.stringify(usuarioAutenticado));
    setUsuarioLogado(usuarioAutenticado);
    setLoginInput('');
    setSenhaLogin('');
  }

  async function handleAceitarTermosIniciais() {
    if (!usuarioLogado) return;

    setSalvandoTermos(true);
    const { error } = await supabase
      .from('usuarios_acesso')
      .update({
        termos_aceitos: true,
        termos_aceitos_em: new Date().toISOString(),
      })
      .eq('id', usuarioLogado.id);

    setSalvandoTermos(false);

    if (error) {
      alert('Erro ao registrar ciência dos termos: ' + error.message);
      return;
    }

    const usuarioAtualizado: UsuarioAcesso = {
      ...usuarioLogado,
      termos_aceitos: true,
    };

    sessionStorage.setItem(STORAGE_USER_KEY, JSON.stringify(usuarioAtualizado));
    setUsuarioLogado(usuarioAtualizado);
  }

  async function handleSalvarPrimeiroAcesso(e: React.FormEvent) {
    e.preventDefault();
    if (!usuarioLogado) return;

    if (novaSenhaPrimeiroAcesso.trim().length < 6) {
      setErroPrimeiroAcesso('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (novaSenhaPrimeiroAcesso !== confirmaSenhaPrimeiroAcesso) {
      setErroPrimeiroAcesso('As senhas digitadas não coincidem.');
      return;
    }

    setSalvandoPrimeiroAcesso(true);
    setErroPrimeiroAcesso(null);

    const { data: atualizado, error } = await supabase.rpc('atualizar_senha_usuario', {
      p_id: usuarioLogado.id,
      p_nova_senha: novaSenhaPrimeiroAcesso.trim(),
      p_primeiro_acesso: false,
    });

    setSalvandoPrimeiroAcesso(false);

    if (error || !atualizado) {
      setErroPrimeiroAcesso('Erro ao redefinir senha: ' + (error?.message || 'falha na atualização'));
      return;
    }

    const usuarioAtualizado: UsuarioAcesso = {
      ...usuarioLogado,
      primeiro_acesso: false,
    };

    sessionStorage.setItem(STORAGE_USER_KEY, JSON.stringify(usuarioAtualizado));
    setUsuarioLogado(usuarioAtualizado);
    setNovaSenhaPrimeiroAcesso('');
    setConfirmaSenhaPrimeiroAcesso('');
    mostrarAviso('Senha pessoal definida com sucesso!');
  }

  async function handleTrocarMinhaSenha(e: React.FormEvent) {
    e.preventDefault();
    if (!usuarioLogado) return;

    if (minhaNovaSenha.trim().length < 6) {
      setErroMinhaSenha('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (minhaNovaSenha !== confirmaMinhaNovaSenha) {
      setErroMinhaSenha('A confirmação da nova senha não coincide.');
      return;
    }

    setSalvandoMinhaSenha(true);
    setErroMinhaSenha(null);

    const { data: verificado } = await supabase
      .from('usuarios_acesso')
      .select('id')
      .eq('id', usuarioLogado.id)
      .eq('senha', senhaAtualInput)
      .maybeSingle();

    if (!verificado) {
      setSalvandoMinhaSenha(false);
      setErroMinhaSenha('A senha atual informada está incorreta.');
      return;
    }

    const { data: atualizado, error } = await supabase.rpc('atualizar_senha_usuario', {
      p_id: usuarioLogado.id,
      p_nova_senha: minhaNovaSenha.trim(),
      p_primeiro_acesso: false,
    });

    setSalvandoMinhaSenha(false);

    if (error || !atualizado) {
      setErroMinhaSenha('Erro ao atualizar senha: ' + (error?.message || 'falha na atualização'));
      return;
    }

    setModalTrocarMinhaSenha(false);
    setSenhaAtualInput('');
    setMinhaNovaSenha('');
    setConfirmaMinhaNovaSenha('');
    mostrarAviso('Sua senha foi alterada com sucesso!');
  }

  function handleLogout() {
    sessionStorage.removeItem(STORAGE_USER_KEY);
    setUsuarioLogado(null);
    setAvaliacoes([]);
    setBusca('');
    setAdminAberto(false);
    setModalTrocarMinhaSenha(false);
  }

  async function carregarAvaliacoes() {
    setLoading(true);
    const { data, error } = await supabase
      .from('avaliacoes_hospedes')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setAvaliacoes(data);
    }
    setLoading(false);
  }

  async function carregarUsuarios() {
    setCarregandoUsuarios(true);
    const { data, error } = await supabase
      .from('usuarios_acesso')
      .select('id, created_at, login, nome_exibicao, is_admin, primeiro_acesso, termos_aceitos')
      .order('created_at', { ascending: true });

    if (!error && data) {
      setUsuariosLista(data);
    }
    setCarregandoUsuarios(false);
  }

  function abrirPainelAdmin() {
    setAdminAberto(true);
    carregarUsuarios();
  }

  async function handleCriarUsuario(e: React.FormEvent) {
    e.preventDefault();
    if (!novoLogin.trim() || !novaSenhaUsuario.trim()) return;

    const loginNormalizado = novoLogin.trim().toLowerCase().replace(/\s+/g, '.');
    const nomeFinal = novoNomeExibicao.trim() || novoLogin.trim();

    setCriandoUsuario(true);
    const { error } = await supabase.from('usuarios_acesso').insert([
      {
        login: loginNormalizado,
        senha: novaSenhaUsuario.trim(),
        nome_exibicao: nomeFinal,
        is_admin: novoIsAdmin,
        primeiro_acesso: true,
        termos_aceitos: false,
      },
    ]);
    setCriandoUsuario(false);

    if (error) {
      if (error.code === '23505') {
        alert('Já existe um usuário cadastrado com este login.');
      } else {
        alert('Erro ao criar acesso: ' + error.message);
      }
      return;
    }

    setNovoLogin('');
    setNovoNomeExibicao('');
    setNovaSenhaUsuario('');
    setNovoIsAdmin(false);
    mostrarAviso(`Acesso "${loginNormalizado}" criado! O usuário redefinirá a senha no 1º acesso.`);
    carregarUsuarios();
  }

  async function handleAlterarSenhaUsuario(id: string) {
    if (!senhaAlteradaInput.trim()) return;

    if (senhaAlteradaInput.trim().length < 6) {
      alert('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    const { data: atualizado, error } = await supabase.rpc('atualizar_senha_usuario', {
      p_id: id,
      p_nova_senha: senhaAlteradaInput.trim(),
      p_primeiro_acesso: true,
    });

    if (!error && atualizado) {
      setEditandoSenhaId(null);
      setSenhaAlteradaInput('');
      mostrarAviso('Senha provisória atualizada! O usuário definirá uma nova senha ao entrar.');
      carregarUsuarios();
    } else {
      alert('Erro ao atualizar senha: ' + (error?.message || 'verifique se a senha tem ao menos 6 caracteres'));
    }
  }

  async function handleExcluirUsuario(usuario: UsuarioAcesso) {
    if (usuario.login === 'admin') {
      alert('O usuário administrador principal não pode ser excluído.');
      return;
    }

    const confirmar = window.confirm(`Deseja realmente revogar e excluir o acesso de "${usuario.login}"?`);
    if (!confirmar) return;

    const { error } = await supabase
      .from('usuarios_acesso')
      .delete()
      .eq('id', usuario.id);

    if (!error) {
      mostrarAviso(`Acesso "${usuario.login}" removido.`);
      carregarUsuarios();
    } else {
      alert('Erro ao excluir usuário: ' + error.message);
    }
  }

  function mostrarAviso(texto: string) {
    setMensagemBanner(texto);
    setTimeout(() => setMensagemBanner(null), 4500);
  }

  const avaliacoesFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return avaliacoes;

    return avaliacoes.filter((item) => {
      const matchTitular = item.nome_hospede.toLowerCase().includes(termo);
      const matchAcompanhante = (item.acompanhantes || []).some((acomp) =>
        acomp.toLowerCase().includes(termo)
      );
      return matchTitular || matchAcompanhante;
    });
  }, [avaliacoes, busca]);

  function adicionarAcompanhante() {
    const nomeLimpo = acompanhanteInput.trim();
    if (!nomeLimpo) return;
    if (!acompanhantes.includes(nomeLimpo)) {
      setAcompanhantes([...acompanhantes, nomeLimpo]);
    }
    setAcompanhanteInput('');
  }

  function removerAcompanhante(index: number) {
    setAcompanhantes(acompanhantes.filter((_, i) => i !== index));
  }

  function toggleTag(label: string) {
    if (tagsSelecionadas.includes(label)) {
      setTagsSelecionadas(tagsSelecionadas.filter((t) => t !== label));
    } else {
      setTagsSelecionadas([...tagsSelecionadas, label]);
    }
  }

  async function handleSalvar(e: React.FormEvent) {
    e.preventDefault();
    if (!usuarioLogado || !nomeHospede.trim() || !relato.trim() || !aceiteResponsabilidade) return;

    const listaFinalAcompanhantes = [...acompanhantes];
    if (acompanhanteInput.trim() && !listaFinalAcompanhantes.includes(acompanhanteInput.trim())) {
      listaFinalAcompanhantes.push(acompanhanteInput.trim());
    }

    const checkFinal = validarConteudoRelato(
      [nomeHospede, ...listaFinalAcompanhantes, relato].join(' ')
    );
    if (!checkFinal.aprovado) {
      alert(checkFinal.motivo);
      return;
    }

    const autorAutomatico =
      usuarioLogado.nome_exibicao.toLowerCase() !== usuarioLogado.login.toLowerCase()
        ? `${usuarioLogado.nome_exibicao} (${usuarioLogado.login})`
        : usuarioLogado.login;

    setEnviando(true);
    const { error } = await supabase.from('avaliacoes_hospedes').insert([
      {
        nome_hospede: nomeHospede.trim(),
        acompanhantes: listaFinalAcompanhantes,
        tags: tagsSelecionadas,
        relato: relato.trim(),
        anfitriao_nome: autorAutomatico,
        plataforma,
      },
    ]);

    setEnviando(false);

    if (!error) {
      setNomeHospede('');
      setAcompanhantes([]);
      setAcompanhanteInput('');
      setTagsSelecionadas([]);
      setRelato('');
      setAceiteResponsabilidade(false);
      setModalAberto(false);
      mostrarAviso('Ocorrência registrada com sucesso!');
      carregarAvaliacoes();
    } else {
      alert('Publicação bloqueada: ' + error.message);
    }
  }

  function abrirModalExclusao(item: AvaliacaoHospede) {
    setRegistroParaExcluir(item);
    setSenhaDigitada('');
    setErroSenha(false);
  }

  async function confirmarExclusao(e: React.FormEvent) {
    e.preventDefault();
    if (!registroParaExcluir) return;

    setExcluindo(true);
    const { data, error } = await supabase.rpc('excluir_ocorrencia_segura', {
      p_id: registroParaExcluir.id,
      p_senha: senhaDigitada,
    });
    setExcluindo(false);

    if (error) {
      alert('Erro ao validar exclusão: ' + error.message);
      return;
    }

    if (!data) {
      setErroSenha(true);
      return;
    }

    setRegistroParaExcluir(null);
    setSenhaDigitada('');
    mostrarAviso('Registro excluído com sucesso.');
    carregarAvaliacoes();
  }

  function getTagStyle(tagLabel: string) {
    const found = TAGS_DISPONIVEIS.find((t) => t.label === tagLabel);
    if (found && found.type === 'warning') {
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    }
    return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
  }

  function formatarData(isoString: string) {
    return new Date(isoString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  // 1. TELA DE LOGIN INDIVIDUAL (USUÁRIO + SENHA)
  if (!usuarioLogado) {
    return (
      <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-navy-900 border border-gold-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/20 mb-4">
              <KeyRound className="w-7 h-7 text-navy-950" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold text-white">
              Rede <span className="text-gold-500">Anfitrião</span>
            </h1>
            <p className="text-xs uppercase tracking-wider text-gold-400 font-semibold mt-1">
              Ambiente Privado • Acesso Restrito
            </p>
            <p className="text-sm text-slate-400 mt-3">
              Identifique-se com seu login e senha autorizados para acessar a base operacional.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Login de Acesso
              </label>
              <input
                type="text"
                required
                autoFocus
                autoCapitalize="none"
                value={loginInput}
                onChange={(e) => {
                  setLoginInput(e.target.value);
                  setErroLogin(null);
                }}
                placeholder="Digite seu usuário..."
                className="w-full bg-navy-950 border border-slate-700 focus:border-gold-500 rounded-xl px-4 py-3 text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Senha
              </label>
              <input
                type="password"
                required
                value={senhaLogin}
                onChange={(e) => {
                  setSenhaLogin(e.target.value);
                  setErroLogin(null);
                }}
                placeholder="••••••••"
                className="w-full bg-navy-950 border border-slate-700 focus:border-gold-500 rounded-xl px-4 py-3 text-white outline-none"
              />
            </div>

            {erroLogin && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
                {erroLogin}
              </p>
            )}

            <button
              type="submit"
              disabled={autenticando}
              className="w-full bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-navy-950 font-semibold py-3 rounded-xl transition-all shadow-lg shadow-gold-500/15"
            >
              {autenticando ? 'Verificando...' : 'Entrar no Sistema'}
            </button>
          </form>

          <p className="text-[11px] text-slate-500 text-center mt-6 leading-relaxed">
            Uso restrito à gestão operacional e prevenção de riscos. Cada acesso é rastreado e vinculado ao respectivo responsável.
          </p>
        </div>
      </div>
    );
  }

  // 2. TELA OBRIGATÓRIA DE REDEFINIÇÃO DE SENHA NO PRIMEIRO ACESSO
  if (usuarioLogado.primeiro_acesso) {
    return (
      <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-navy-900 border border-gold-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center shadow-lg shadow-gold-500/20 mb-4">
              <Key className="w-7 h-7 text-navy-950" strokeWidth={2.5} />
            </div>
            <span className="text-xs uppercase tracking-wider text-gold-400 font-semibold">
              Primeiro Acesso • Segurança da Conta
            </span>
            <h2 className="text-xl font-bold text-white mt-1">
              Olá, {usuarioLogado.nome_exibicao}!
            </h2>
            <p className="text-sm text-slate-300 mt-2">
              Por segurança, defina uma senha pessoal e intransferível para substituir a senha provisória antes de acessar o sistema.
            </p>
          </div>

          <form onSubmit={handleSalvarPrimeiroAcesso} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Nova Senha Pessoal (mínimo 6 caracteres) *
              </label>
              <input
                type="password"
                required
                autoFocus
                minLength={6}
                value={novaSenhaPrimeiroAcesso}
                onChange={(e) => {
                  setNovaSenhaPrimeiroAcesso(e.target.value);
                  setErroPrimeiroAcesso(null);
                }}
                placeholder="Digite sua nova senha..."
                className="w-full bg-navy-950 border border-slate-700 focus:border-gold-500 rounded-xl px-4 py-3 text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Confirmar Nova Senha *
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmaSenhaPrimeiroAcesso}
                onChange={(e) => {
                  setConfirmaSenhaPrimeiroAcesso(e.target.value);
                  setErroPrimeiroAcesso(null);
                }}
                placeholder="Repita a nova senha..."
                className="w-full bg-navy-950 border border-slate-700 focus:border-gold-500 rounded-xl px-4 py-3 text-white outline-none"
              />
            </div>

            {erroPrimeiroAcesso && (
              <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
                {erroPrimeiroAcesso}
              </p>
            )}

            <button
              type="submit"
              disabled={salvandoPrimeiroAcesso}
              className="w-full bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-navy-950 font-semibold py-3 rounded-xl transition-all shadow-lg shadow-gold-500/15"
            >
              {salvandoPrimeiroAcesso ? 'Salvando senha...' : 'Salvar Senha e Acessar'}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full text-xs text-slate-400 hover:text-white py-2 transition-colors"
            >
              Cancelar e voltar ao login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 3. TELA INSTITUCIONAL DE DIRETRIZES (EXIBIDA UMA ÚNICA VEZ POR USUÁRIO)
  if (!usuarioLogado.termos_aceitos) {
    return (
      <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col items-center justify-center p-3 sm:p-6">
        <div className="max-w-2xl w-full bg-navy-900 border border-gold-500/35 rounded-2xl shadow-2xl overflow-hidden">
          <div className="px-5 sm:px-8 py-5 bg-navy-800 border-b border-gold-500/20 flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center shrink-0 shadow-md">
              <Scale className="w-6 h-6 text-navy-950" strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-gold-400 font-semibold block">
                Governança e Compliance • Ciência Única Obrigatória
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Diretrizes de Uso, Sigilo e Responsabilidade
              </h2>
            </div>
          </div>

          <div className="p-5 sm:p-8 space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed max-h-[68vh] overflow-y-auto">
            <p className="text-slate-200">
              Bem-vindo(a), <strong className="text-gold-400">{usuarioLogado.nome_exibicao}</strong>. A{' '}
              <strong className="text-white">Rede Anfitrião</strong> é um ambiente privado de apoio operacional destinado exclusivamente à prevenção de danos materiais e gestão de riscos entre anfitriões autorizados. Para liberar seu acesso definitivo, leia e aceite as diretrizes abaixo:
            </p>

            <div className="bg-navy-950/90 border border-slate-800 rounded-xl p-4 space-y-3.5">
              <div>
                <h3 className="text-gold-400 font-semibold text-xs sm:text-sm mb-1">
                  1. Objetividade e Comprovação Documental
                </h3>
                <p className="text-slate-300 text-xs leading-relaxed">
                  Registre exclusivamente fatos objetivos, verificáveis e relacionados à estadia (como danos ao imóvel, descumprimento de regras internas, atraso injustificado de check-out ou divergência de ocupantes). Nunca publique suposições, juízos de valor, ofensas pessoais ou relatos sem lastro probatório (fotos, mensagens na plataforma ou registros formais).
                </p>
              </div>

              <div className="border-t border-slate-800/80 pt-3">
                <h3 className="text-gold-400 font-semibold text-xs sm:text-sm mb-1">
                  2. Proteção de Dados e Vedação de Conteúdo Sensível (LGPD)
                </h3>
                <p className="text-slate-300 text-xs leading-relaxed">
                  É estritamente proibido inserir números de CPF, documentos pessoais, telefones, endereços residenciais, acusações criminais sem sentença ou informações sobre saúde, vida íntima e características pessoais. Todo registro fica permanentemente vinculado ao login do respectivo autor, que responde civil e criminalmente pela veracidade das informações inseridas.
                </p>
              </div>

              <div className="border-t border-slate-800/80 pt-3">
                <h3 className="text-gold-400 font-semibold text-xs sm:text-sm mb-1">
                  3. Confidencialidade Absoluta e Proibição de Compartilhamento Externo
                </h3>
                <p className="text-slate-300 text-xs leading-relaxed">
                  As informações consultadas nesta plataforma são de uso estritamente interno e confidencial. É expressamente vedado capturar telas, extrair dados, mencionar a existência deste sistema ou encaminhar qualquer informação a hóspedes, intermediários ou terceiros não autorizados. O descumprimento acarretará a revogação imediata do acesso e responsabilização por eventuais prejuízos decorrentes do vazamento.
                </p>
              </div>

              <div className="border-t border-slate-800/80 pt-3">
                <h3 className="text-gold-400 font-semibold text-xs sm:text-sm mb-1">
                  4. Moderação e Remoção Administrativa
                </h3>
                <p className="text-slate-300 text-xs leading-relaxed">
                  A administração reserva-se o direito de editar, ocultar ou excluir imediatamente qualquer publicação que fuja aos padrões de objetividade, apresente risco jurídico ou careça de comprovação adequada.
                </p>
              </div>
            </div>
          </div>

          <div className="px-5 sm:px-8 py-4 bg-navy-800/80 border-t border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm text-slate-400 hover:text-white hover:bg-navy-800 transition-colors text-center"
            >
              Sair da Conta
            </button>

            <button
              type="button"
              disabled={salvandoTermos}
              onClick={handleAceitarTermosIniciais}
              className="inline-flex items-center justify-center gap-2 bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-navy-950 font-semibold px-6 py-3 rounded-xl text-xs sm:text-sm transition-all shadow-lg shadow-gold-500/15"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {salvandoTermos ? 'Registrando ciência...' : 'Li, compreendi e concordo com as diretrizes'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col relative overflow-x-hidden">
      {/* SELO ESTRATÉGICO DISCRETO NO CANTO INFERIOR DIREITO */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-3 right-3 z-30 select-none bg-navy-900/80 backdrop-blur-sm border border-gold-500/20 px-2.5 py-1 rounded-lg text-[10px] font-medium tracking-wide text-slate-400/75 shadow-md"
      >
        @{usuarioLogado.login} • {carimboTempo}
      </div>

      {/* Navbar Executiva 100% Responsiva */}
      <header className="sticky top-0 z-30 bg-navy-900/95 backdrop-blur-md border-b border-gold-500/20 shadow-lg">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center shadow-md shadow-gold-500/20 shrink-0">
              <ShieldAlert className="w-5 h-5 sm:w-6 sm:h-6 text-navy-950" strokeWidth={2.5} />
            </div>
            <div className="truncate">
              <h1 className="text-base sm:text-2xl font-bold tracking-tight text-white truncate">
                Rede <span className="text-gold-500">Anfitrião</span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block truncate">
                Conectado como: <strong className="text-gold-400">{usuarioLogado.nome_exibicao}</strong> ({usuarioLogado.login})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {usuarioLogado.is_admin && (
              <button
                onClick={abrirPainelAdmin}
                className="inline-flex items-center gap-1.5 bg-navy-800 hover:bg-navy-700 border border-gold-500/40 text-gold-400 font-medium p-2 sm:px-3 sm:py-2.5 rounded-xl transition-all text-xs sm:text-sm"
                title="Gerenciar logins e senhas de acesso"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden md:inline">Painel Admin</span>
              </button>
            )}

            <button
              onClick={() => {
                setSenhaAtualInput('');
                setMinhaNovaSenha('');
                setConfirmaMinhaNovaSenha('');
                setErroMinhaSenha(null);
                setModalTrocarMinhaSenha(true);
              }}
              className="inline-flex items-center gap-1.5 bg-navy-800 hover:bg-navy-700 border border-slate-700 text-slate-200 hover:text-white font-medium p-2 sm:px-3 sm:py-2.5 rounded-xl transition-all text-xs sm:text-sm"
              title="Alterar sua senha de acesso"
            >
              <Key className="w-4 h-4 text-gold-400" />
              <span className="hidden lg:inline">Trocar Senha</span>
            </button>

            <button
              onClick={() => setModalAberto(true)}
              className="inline-flex items-center gap-1.5 bg-gold-500 hover:bg-gold-400 text-navy-950 font-semibold px-2.5 py-2 sm:px-4 sm:py-2.5 rounded-xl transition-all shadow-lg shadow-gold-500/15 active:scale-95 text-xs sm:text-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" strokeWidth={2.5} />
              <span className="sm:hidden">Registrar</span>
              <span className="hidden sm:inline">Registrar Ocorrência</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-2 sm:p-2.5 rounded-xl bg-navy-800 hover:bg-navy-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="Sair da conta"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Banner de Feedback */}
      {mensagemBanner && (
        <div className="max-w-5xl mx-auto w-full px-3 sm:px-6 mt-4">
          <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 px-4 py-3 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-sm font-medium">{mensagemBanner}</span>
          </div>
        </div>
      )}

      {/* Hero & Barra de Pesquisa Principal */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-3 sm:px-6 py-6 sm:py-8">
        <div className="bg-gradient-to-br from-navy-900 to-navy-800 border border-gold-500/20 rounded-2xl p-5 sm:p-8 shadow-2xl mb-6 sm:mb-8">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-gold-400 bg-gold-500/10 border border-gold-500/25 px-3 py-1 rounded-full mb-3">
              <AlertTriangle className="w-3.5 h-3.5" /> Consulta Preventiva Interna
            </span>
            <h2 className="text-xl sm:text-3xl font-bold text-white mb-2">
              Pesquise pelo nome do hóspede ou acompanhante
            </h2>
            <p className="text-slate-300 text-xs sm:text-base mb-5 sm:mb-6">
              Verifique registros operacionais anteriores relatados por anfitriões parceiros antes de confirmar uma estadia.
            </p>
          </div>

          <div className="relative">
            <Search className="w-5 h-5 text-gold-500 absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Nome completo ou sobrenome..."
              className="w-full bg-navy-950/90 border border-slate-700 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 rounded-xl pl-11 sm:pl-12 pr-10 sm:pr-12 py-3.5 sm:py-4 text-white placeholder-slate-400 text-sm sm:text-base outline-none transition-all"
            />
            {busca && (
              <button
                onClick={() => setBusca('')}
                className="absolute right-3.5 sm:right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                title="Limpar pesquisa"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
            <span>
              Exibindo <strong className="text-gold-400">{avaliacoesFiltradas.length}</strong>{' '}
              {avaliacoesFiltradas.length === 1 ? 'registro encontrado' : 'registros encontrados'}
            </span>
            <span>Busca em titulares e acompanhantes</span>
          </div>
        </div>

        {/* Lista de Resultados / Feed de Relatos */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400">Carregando base de ocorrências...</p>
          </div>
        ) : avaliacoesFiltradas.length === 0 ? (
          <div className="bg-navy-900/60 border border-slate-800 rounded-2xl p-8 sm:p-12 text-center">
            <UserCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-white mb-1">
              {busca ? 'Nenhum registro encontrado para este nome' : 'Nenhuma ocorrência cadastrada ainda'}
            </h3>
            <p className="text-slate-400 text-sm max-w-md mx-auto mb-6">
              {busca
                ? 'Não encontramos ocorrências para "' + busca + '" nem como titular nem como acompanhante.'
                : 'Seja o primeiro a registrar uma ocorrência operacional.'}
            </p>
            <button
              onClick={() => {
                setNomeHospede(busca);
                setModalAberto(true);
              }}
              className="inline-flex items-center gap-2 bg-navy-800 hover:bg-navy-700 border border-gold-500/40 text-gold-400 px-5 py-2.5 rounded-xl text-sm font-medium transition-all"
            >
              <Plus className="w-4 h-4" />
              Cadastrar ocorrência {busca ? 'para "' + busca + '"' : 'agora'}
            </button>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-5">
            {avaliacoesFiltradas.map((item) => {
              const termoBusca = busca.trim().toLowerCase();
              const encontradoViaAcompanhante =
                termoBusca &&
                !item.nome_hospede.toLowerCase().includes(termoBusca) &&
                (item.acompanhantes || []).some((a) => a.toLowerCase().includes(termoBusca));

              return (
                <article
                  key={item.id}
                  className="bg-navy-900 border border-slate-800 hover:border-gold-500/35 rounded-2xl p-4 sm:p-6 transition-all shadow-lg"
                >
                  <div className="flex items-start justify-between gap-3 pb-3 sm:pb-4 border-b border-slate-800/80">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg sm:text-xl font-bold text-white break-words">
                          {item.nome_hospede}
                        </h3>
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-navy-800 text-gold-400 border border-gold-500/20">
                          {item.plataforma}
                        </span>
                        {encontradoViaAcompanhante && (
                          <span className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Encontrado nos acompanhantes
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-gold-500 shrink-0" />
                          Registrado por: <strong className="text-slate-300">{item.anfitriao_nome}</strong>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gold-500 shrink-0" />
                          {formatarData(item.created_at)}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => abrirModalExclusao(item)}
                      className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 p-2 rounded-lg transition-colors shrink-0"
                      title="Excluir relato (requer senha)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3.5 sm:mt-4">
                      {item.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className={'text-[11px] sm:text-xs font-medium px-2.5 sm:px-3 py-1 rounded-full border ' + getTagStyle(tag)}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3.5 sm:mt-4 bg-navy-950/60 border border-slate-800/80 rounded-xl p-3.5 sm:p-4">
                    <p className="text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-line break-words">
                      {item.relato}
                    </p>
                  </div>

                  {item.acompanhantes && item.acompanhantes.length > 0 && (
                    <div className="mt-3.5 sm:mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 mr-1">
                        <Users className="w-4 h-4 text-gold-500" />
                        Acompanhantes ({item.acompanhantes.length}):
                      </span>
                      {item.acompanhantes.map((acomp, index) => {
                        const isHighlighted =
                          termoBusca && acomp.toLowerCase().includes(termoBusca);
                        return (
                          <span
                            key={index}
                            className={
                              'text-xs px-2.5 py-1 rounded-lg border ' +
                              (isHighlighted
                                ? 'bg-gold-500/20 text-gold-300 border-gold-500 font-semibold'
                                : 'bg-navy-800 text-slate-300 border-slate-700')
                            }
                          >
                            {acomp}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Rodapé de Governança e Responsabilidade */}
      <footer className="border-t border-slate-800/80 bg-navy-900/50 py-5 px-4 sm:px-6 mt-12 pb-12 sm:pb-5">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-gold-500 shrink-0 hidden sm:block" />
            <span>
              Base privada de uso interno. Cada anfitrião identificado responde integralmente pela veracidade e comprovação dos fatos relatados.
            </span>
          </div>
          <span className="text-slate-500 shrink-0">Uso confidencial • Sessão rastreada</span>
        </div>
      </footer>

      {/* MODAL TROCAR MINHA SENHA */}
      {modalTrocarMinhaSenha && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-navy-900 border border-gold-500/35 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="px-4 sm:px-6 py-4 bg-navy-800 border-b border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-gold-500" />
                <h3 className="text-base font-bold text-white">Alterar Minha Senha</h3>
              </div>
              <button
                onClick={() => setModalTrocarMinhaSenha(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTrocarMinhaSenha} className="p-4 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Senha Atual *
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={senhaAtualInput}
                  onChange={(e) => {
                    setSenhaAtualInput(e.target.value);
                    setErroMinhaSenha(null);
                  }}
                  placeholder="Digite sua senha atual..."
                  className="w-full bg-navy-950 border border-slate-700 focus:border-gold-500 rounded-xl px-4 py-2.5 text-white outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Nova Senha (mínimo 6 caracteres) *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={minhaNovaSenha}
                  onChange={(e) => {
                    setMinhaNovaSenha(e.target.value);
                    setErroMinhaSenha(null);
                  }}
                  placeholder="Digite a nova senha..."
                  className="w-full bg-navy-950 border border-slate-700 focus:border-gold-500 rounded-xl px-4 py-2.5 text-white outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Confirmar Nova Senha *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={confirmaMinhaNovaSenha}
                  onChange={(e) => {
                    setConfirmaMinhaNovaSenha(e.target.value);
                    setErroMinhaSenha(null);
                  }}
                  placeholder="Repita a nova senha..."
                  className="w-full bg-navy-950 border border-slate-700 focus:border-gold-500 rounded-xl px-4 py-2.5 text-white outline-none text-sm"
                />
              </div>

              {erroMinhaSenha && (
                <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
                  {erroMinhaSenha}
                </p>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setModalTrocarMinhaSenha(false)}
                  className="px-4 py-2 rounded-xl text-sm text-slate-300 hover:bg-navy-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoMinhaSenha}
                  className="bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-navy-950 font-semibold px-4 sm:px-5 py-2 rounded-xl text-sm transition-colors"
                >
                  {salvandoMinhaSenha ? 'Salvando...' : 'Atualizar Senha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PAINEL ADMIN */}
      {adminAberto && usuarioLogado.is_admin && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-navy-900 border border-gold-500/35 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-auto">
            <div className="px-4 sm:px-6 py-4 bg-navy-800 border-b border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCog className="w-5 h-5 text-gold-500 shrink-0" />
                <h3 className="text-base sm:text-lg font-bold text-white">Painel Admin — Acessos</h3>
              </div>
              <button
                onClick={() => setAdminAberto(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-6 max-h-[82vh] overflow-y-auto">
              <form
                onSubmit={handleCriarUsuario}
                className="bg-navy-950/80 border border-slate-800 rounded-xl p-4 sm:p-5 space-y-4"
              >
                <h4 className="text-sm font-semibold text-gold-400 flex items-center gap-2">
                  <UserPlus className="w-4 h-4" /> Criar Novo Login de Acesso
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Login (Usuário) *</label>
                    <input
                      type="text"
                      required
                      autoCapitalize="none"
                      value={novoLogin}
                      onChange={(e) => setNovoLogin(e.target.value)}
                      placeholder="ex: allhost.goiania"
                      className="w-full bg-navy-900 border border-slate-700 focus:border-gold-500 rounded-lg px-3 py-2 text-sm text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Nome / Operação *</label>
                    <input
                      type="text"
                      required
                      value={novoNomeExibicao}
                      onChange={(e) => setNovoNomeExibicao(e.target.value)}
                      placeholder="ex: ALL Host"
                      className="w-full bg-navy-900 border border-slate-700 focus:border-gold-500 rounded-lg px-3 py-2 text-sm text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Senha Provisória *</label>
                    <input
                      type="text"
                      required
                      value={novaSenhaUsuario}
                      onChange={(e) => setNovaSenhaUsuario(e.target.value)}
                      placeholder="Senha inicial"
                      className="w-full bg-navy-900 border border-slate-700 focus:border-gold-500 rounded-lg px-3 py-2 text-sm text-white outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={novoIsAdmin}
                      onChange={(e) => setNovoIsAdmin(e.target.checked)}
                      className="accent-gold-500"
                    />
                    Permissão de Administrador
                  </label>

                  <button
                    type="submit"
                    disabled={criandoUsuario}
                    className="bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-navy-950 font-semibold px-4 py-2 rounded-lg text-xs sm:text-sm transition-all"
                  >
                    {criandoUsuario ? 'Criando...' : '+ Criar Acesso'}
                  </button>
                </div>
              </form>

              <div>
                <h4 className="text-sm font-semibold text-white mb-3">
                  Usuários Autorizados ({usuariosLista.length})
                </h4>

                {carregandoUsuarios ? (
                  <p className="text-xs text-slate-400">Carregando usuários...</p>
                ) : (
                  <div className="space-y-2.5">
                    {usuariosLista.map((user) => (
                      <div
                        key={user.id}
                        className="bg-navy-950 border border-slate-800 rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-white text-sm">{user.nome_exibicao}</span>
                            <span className="text-xs px-2 py-0.5 rounded bg-navy-800 text-slate-300 border border-slate-700">
                              @{user.login}
                            </span>
                            {user.is_admin && (
                              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-gold-500/15 text-gold-400 border border-gold-500/30 font-medium">
                                <ShieldCheck className="w-3 h-3" /> Admin
                              </span>
                            )}
                            {user.primeiro_acesso && (
                              <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                                Aguardando 1º acesso
                              </span>
                            )}
                            {user.termos_aceitos && (
                              <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                Termos aceitos
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Criado em {formatarData(user.created_at)}
                          </p>
                        </div>

                        {editandoSenhaId === user.id ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <input
                              type="text"
                              autoFocus
                              value={senhaAlteradaInput}
                              onChange={(e) => setSenhaAlteradaInput(e.target.value)}
                              placeholder="Nova senha..."
                              className="bg-navy-900 border border-gold-500 rounded-lg px-3 py-1.5 text-xs text-white outline-none w-36"
                            />
                            <button
                              type="button"
                              onClick={() => handleAlterarSenhaUsuario(user.id)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
                            >
                              Salvar
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditandoSenhaId(null);
                                setSenhaAlteradaInput('');
                              }}
                              className="text-slate-400 hover:text-white text-xs px-2 py-1.5"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditandoSenhaId(user.id);
                                setSenhaAlteradaInput('');
                              }}
                              className="inline-flex items-center gap-1.5 bg-navy-800 hover:bg-navy-700 border border-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg transition-colors"
                            >
                              <Key className="w-3.5 h-3.5 text-gold-400" />
                              Resetar Senha
                            </button>

                            {user.login !== 'admin' && (
                              <button
                                type="button"
                                onClick={() => handleExcluirUsuario(user)}
                                className="inline-flex items-center gap-1 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs px-3 py-1.5 rounded-lg transition-colors"
                                title="Revogar e excluir acesso"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Excluir
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE NOVO RELATO — RESPONSIVO PARA MOBILE */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-navy-900 border-t sm:border border-gold-500/30 rounded-t-2xl sm:rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-navy-800 border-b border-slate-700/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-gold-500 shrink-0" />
                <h3 className="text-base sm:text-lg font-bold text-white">Registrar Ocorrência</h3>
              </div>
              <button
                onClick={() => setModalAberto(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto flex-1">
              <div className="bg-navy-950/90 border border-gold-500/25 rounded-xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-1 text-xs">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-gold-500 shrink-0" />
                  Autor do registro:
                </span>
                <strong className="text-gold-400 truncate">
                  {usuarioLogado.nome_exibicao} ({usuarioLogado.login})
                </strong>
              </div>

              {!validacaoGeral.aprovado && (
                <div className="bg-rose-500/15 border border-rose-500/50 text-rose-200 text-xs px-3.5 py-3 rounded-xl flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-rose-300 mb-0.5">Publicação bloqueada automaticamente:</strong>
                    <span>{validacaoGeral.motivo}</span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-200 mb-1.5">
                  Nome Completo do Hóspede Titular *
                </label>
                <input
                  type="text"
                  required
                  value={nomeHospede}
                  onChange={(e) => setNomeHospede(e.target.value)}
                  placeholder="Ex.: João Carlos da Silva"
                  className="w-full bg-navy-950 border border-slate-700 focus:border-gold-500 rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-sm sm:text-base text-white placeholder-slate-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-200 mb-1.5">
                  Acompanhantes (Opcional)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={acompanhanteInput}
                    onChange={(e) => setAcompanhanteInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        adicionarAcompanhante();
                      }
                    }}
                    placeholder="Nome do acompanhante..."
                    className="flex-1 bg-navy-950 border border-slate-700 focus:border-gold-500 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 outline-none text-sm"
                  />
                  <button
                    type="button"
                    onClick={adicionarAcompanhante}
                    className="inline-flex items-center justify-center gap-1.5 bg-navy-800 hover:bg-navy-700 border border-gold-500/40 text-gold-400 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shrink-0"
                  >
                    <UserPlus className="w-4 h-4" />
                    Adicionar
                  </button>
                </div>

                {acompanhantes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2.5">
                    {acompanhantes.map((acomp, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1.5 bg-navy-800 border border-slate-700 text-slate-200 text-xs px-3 py-1.5 rounded-lg"
                      >
                        {acomp}
                        <button
                          type="button"
                          onClick={() => removerAcompanhante(index)}
                          className="text-slate-400 hover:text-rose-400"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-200 mb-2">
                  Tags de Ocorrência (Selecione o que aconteceu)
                </label>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {TAGS_DISPONIVEIS.map((tag) => {
                    const ativa = tagsSelecionadas.includes(tag.label);
                    return (
                      <button
                        type="button"
                        key={tag.label}
                        onClick={() => toggleTag(tag.label)}
                        className={
                          'text-[11px] sm:text-xs px-2.5 sm:px-3 py-1.5 rounded-full border transition-all text-left ' +
                          (ativa
                            ? 'bg-rose-500 text-white border-rose-500 font-semibold shadow-sm'
                            : 'bg-navy-950 text-slate-300 border-slate-700 hover:border-slate-500')
                        }
                      >
                        {ativa ? '✓ ' : '+ '}
                        {tag.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-200 mb-1.5">
                  Relato Objetivo da Ocorrência *
                </label>
                <textarea
                  required
                  rows={4}
                  value={relato}
                  onChange={(e) => setRelato(e.target.value)}
                  placeholder="Descreva apenas fatos objetivos comprováveis ocorridos durante a estadia..."
                  className={
                    'w-full bg-navy-950 border rounded-xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-white placeholder-slate-500 outline-none text-sm ' +
                    (!validacaoGeral.aprovado
                      ? 'border-rose-500 focus:border-rose-500'
                      : 'border-slate-700 focus:border-gold-500')
                  }
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Canal da Reserva
                </label>
                <select
                  value={plataforma}
                  onChange={(e) => setPlataforma(e.target.value)}
                  className="w-full bg-navy-950 border border-slate-700 focus:border-gold-500 rounded-xl px-3.5 py-2.5 text-white outline-none text-sm"
                >
                  <option value="Airbnb">Airbnb</option>
                  <option value="Booking.com">Booking.com</option>
                  <option value="Expedia">Expedia</option>
                  <option value="Reserva Direta">Reserva Direta</option>
                  <option value="Grupo Anfitriões">Grupo Anfitriões</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <label className="flex items-start gap-2.5 bg-navy-950/80 border border-slate-800 rounded-xl p-3 sm:p-3.5 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={aceiteResponsabilidade}
                  onChange={(e) => setAceiteResponsabilidade(e.target.checked)}
                  className="mt-0.5 accent-gold-500 shrink-0"
                />
                <span className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
                  Declaro que as informações acima são verdadeiras, baseadas em fatos objetivos da hospedagem e que possuo registros/comprovantes do ocorrido, assumindo integral responsabilidade pelo conteúdo publicado sob meu login.
                </span>
              </label>

              <div className="pt-3 border-t border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-navy-800 transition-colors text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando || !aceiteResponsabilidade || !validacaoGeral.aprovado}
                  className="bg-gold-500 hover:bg-gold-400 disabled:opacity-40 disabled:cursor-not-allowed text-navy-950 font-semibold px-6 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-gold-500/15 text-center"
                >
                  {enviando ? 'Salvando...' : 'Publicar Ocorrência'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO COM SENHA */}
      {registroParaExcluir && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-navy-900 border border-rose-500/40 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="px-4 sm:px-6 py-4 bg-navy-800 border-b border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-400">
                <Lock className="w-5 h-5" />
                <h3 className="text-base font-bold text-white">Excluir Ocorrência</h3>
              </div>
              <button
                onClick={() => setRegistroParaExcluir(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={confirmarExclusao} className="p-4 sm:p-6 space-y-4">
              <p className="text-sm text-slate-300">
                Você está prestes a remover permanentemente o registro de{' '}
                <strong className="text-white">{registroParaExcluir.nome_hospede}</strong>.
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Digite a senha de administrador para confirmar:
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  value={senhaDigitada}
                  onChange={(e) => {
                    setSenhaDigitada(e.target.value);
                    setErroSenha(false);
                  }}
                  placeholder="••••••••"
                  className="w-full bg-navy-950 border border-slate-700 focus:border-rose-500 rounded-xl px-4 py-2.5 text-white outline-none"
                />
                {erroSenha && (
                  <p className="text-xs text-rose-400 mt-1.5">
                    Senha incorreta. Exclusão não autorizada.
                  </p>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setRegistroParaExcluir(null)}
                  className="px-4 py-2 rounded-xl text-sm text-slate-300 hover:bg-navy-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={excluindo}
                  className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold px-4 sm:px-5 py-2 rounded-xl text-sm transition-colors"
                >
                  {excluindo ? 'Excluindo...' : 'Confirmar Exclusão'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}



