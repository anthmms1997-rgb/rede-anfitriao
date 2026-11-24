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

const SENHA_EXCLUSAO = '15975300';
const STORAGE_USER_KEY = 'rede_anfitriao_user_v2';

export default function App() {
  const [usuarioLogado, setUsuarioLogado] = useState<UsuarioAcesso | null>(() => {
    try {
      const salvo = sessionStorage.getItem(STORAGE_USER_KEY);
      return salvo ? JSON.parse(salvo) : null;
    } catch {
      return null;
    }
  });

  // Estados da Tela de Login
  const [loginInput, setLoginInput] = useState('');
  const [senhaLogin, setSenhaLogin] = useState('');
  const [erroLogin, setErroLogin] = useState<string | null>(null);
  const [autenticando, setAutenticando] = useState(false);

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
    if (usuarioLogado) {
      carregarAvaliacoes();
    }
  }, [usuarioLogado]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!loginInput.trim() || !senhaLogin) return;

    setAutenticando(true);
    setErroLogin(null);

    const { data, error } = await supabase
      .from('usuarios_acesso')
      .select('id, created_at, login, nome_exibicao, is_admin')
      .eq('login', loginInput.trim().toLowerCase())
      .eq('senha', senhaLogin)
      .maybeSingle();

    setAutenticando(false);

    if (error) {
      setErroLogin('Erro ao conectar ao servidor de autenticação.');
      return;
    }

    if (!data) {
      setErroLogin('Login ou senha inválidos.');
      return;
    }

    sessionStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data));
    setUsuarioLogado(data);
    setLoginInput('');
    setSenhaLogin('');
  }

  function handleLogout() {
    sessionStorage.removeItem(STORAGE_USER_KEY);
    setUsuarioLogado(null);
    setAvaliacoes([]);
    setBusca('');
    setAdminAberto(false);
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
      .select('id, created_at, login, nome_exibicao, is_admin')
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
    mostrarAviso(`Acesso "${loginNormalizado}" criado com sucesso!`);
    carregarUsuarios();
  }

  async function handleAlterarSenhaUsuario(id: string) {
    if (!senhaAlteradaInput.trim()) return;

    const { error } = await supabase
      .from('usuarios_acesso')
      .update({ senha: senhaAlteradaInput.trim() })
      .eq('id', id);

    if (!error) {
      setEditandoSenhaId(null);
      setSenhaAlteradaInput('');
      mostrarAviso('Senha atualizada com sucesso!');
    } else {
      alert('Erro ao atualizar senha: ' + error.message);
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
    setTimeout(() => setMensagemBanner(null), 4000);
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

    // Identificação automática vinculada ao login conectado
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

    if (senhaDigitada !== SENHA_EXCLUSAO) {
      setErroSenha(true);
      return;
    }

    setExcluindo(true);
    const { error } = await supabase
      .from('avaliacoes_hospedes')
      .delete()
      .eq('id', registroParaExcluir.id);

    setExcluindo(false);

    if (!error) {
      setRegistroParaExcluir(null);
      setSenhaDigitada('');
      mostrarAviso('Registro excluído com sucesso.');
      carregarAvaliacoes();
    } else {
      alert('Erro ao excluir registro: ' + error.message);
    }
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

  // TELA DE LOGIN INDIVIDUAL (USUÁRIO + SENHA)
  if (!usuarioLogado) {
    return (
      <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-navy-900 border border-gold-500/30 rounded-2xl p-8 shadow-2xl">
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
            Uso restrito à gestão operacional e prevenção de riscos. Cada acesso é vinculado ao respectivo responsável.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col">
      {/* Navbar Executiva */}
      <header className="sticky top-0 z-30 bg-navy-900/95 backdrop-blur-md border-b border-gold-500/20 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center shadow-md shadow-gold-500/20 shrink-0">
              <ShieldAlert className="w-6 h-6 text-navy-950" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Rede <span className="text-gold-500">Anfitrião</span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                Conectado como: <strong className="text-gold-400">{usuarioLogado.nome_exibicao}</strong> ({usuarioLogado.login})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {usuarioLogado.is_admin && (
              <button
                onClick={abrirPainelAdmin}
                className="inline-flex items-center gap-1.5 bg-navy-800 hover:bg-navy-700 border border-gold-500/40 text-gold-400 font-medium px-3 py-2.5 rounded-xl transition-all text-xs sm:text-sm"
                title="Gerenciar logins e senhas de acesso"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden md:inline">Painel Admin</span>
              </button>
            )}

            <button
              onClick={() => setModalAberto(true)}
              className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-navy-950 font-semibold px-3.5 sm:px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-gold-500/15 active:scale-95 text-sm"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2.5} />
              <span>Registrar Ocorrência</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-2.5 rounded-xl bg-navy-800 hover:bg-navy-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="Sair da conta"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Banner de Feedback */}
      {mensagemBanner && (
        <div className="max-w-5xl mx-auto w-full px-4 sm:px-6 mt-4">
          <div className="bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 px-4 py-3 rounded-xl flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-sm font-medium">{mensagemBanner}</span>
          </div>
        </div>
      )}

      {/* Hero & Barra de Pesquisa Principal */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="bg-gradient-to-br from-navy-900 to-navy-800 border border-gold-500/20 rounded-2xl p-6 sm:p-8 shadow-2xl mb-8">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gold-400 bg-gold-500/10 border border-gold-500/25 px-3 py-1 rounded-full mb-3">
              <AlertTriangle className="w-3.5 h-3.5" /> Consulta Preventiva Interna
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Pesquise pelo nome do hóspede ou acompanhante
            </h2>
            <p className="text-slate-300 text-sm sm:text-base mb-6">
              Verifique registros operacionais anteriores relatados por anfitriões parceiros antes de confirmar uma estadia.
            </p>
          </div>

          <div className="relative">
            <Search className="w-5 h-5 text-gold-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Digite o nome completo ou sobrenome (busca também em acompanhantes)..."
              className="w-full bg-navy-950/90 border border-slate-700 focus:border-gold-500 focus:ring-2 focus:ring-gold-500/20 rounded-xl pl-12 pr-12 py-4 text-white placeholder-slate-400 text-base outline-none transition-all"
            />
            {busca && (
              <button
                onClick={() => setBusca('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
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
            <span>Busca automática em titulares e acompanhantes</span>
          </div>
        </div>

        {/* Lista de Resultados / Feed de Relatos */}
        {loading ? (
          <div className="text-center py-16">
            <div className="w-10 h-10 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400">Carregando base de ocorrências...</p>
          </div>
        ) : avaliacoesFiltradas.length === 0 ? (
          <div className="bg-navy-900/60 border border-slate-800 rounded-2xl p-12 text-center">
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
          <div className="space-y-5">
            {avaliacoesFiltradas.map((item) => {
              const termoBusca = busca.trim().toLowerCase();
              const encontradoViaAcompanhante =
                termoBusca &&
                !item.nome_hospede.toLowerCase().includes(termoBusca) &&
                (item.acompanhantes || []).some((a) => a.toLowerCase().includes(termoBusca));

              return (
                <article
                  key={item.id}
                  className="bg-navy-900 border border-slate-800 hover:border-gold-500/35 rounded-2xl p-6 transition-all shadow-lg"
                >
                  {/* Cabeçalho do Card */}
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800/80">
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-xl font-bold text-white">{item.nome_hospede}</h3>
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-navy-800 text-gold-400 border border-gold-500/20">
                          {item.plataforma}
                        </span>
                        {encontradoViaAcompanhante && (
                          <span className="text-xs font-medium px-2.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Encontrado na lista de acompanhantes
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-gold-500" />
                          Registrado por: <strong className="text-slate-300">{item.anfitriao_nome}</strong>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gold-500" />
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

                  {/* Tags Rápidas */}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {item.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className={'text-xs font-medium px-3 py-1 rounded-full border ' + getTagStyle(tag)}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Relato da Experiência */}
                  <div className="mt-4 bg-navy-950/60 border border-slate-800/80 rounded-xl p-4">
                    <p className="text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-line">
                      {item.relato}
                    </p>
                  </div>

                  {/* Lista de Acompanhantes */}
                  {item.acompanhantes && item.acompanhantes.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-800/60 flex flex-wrap items-center gap-2">
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
      <footer className="border-t border-slate-800/80 bg-navy-900/50 py-5 px-4 sm:px-6 mt-12">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-gold-500 shrink-0" />
            <span>
              Base privada de uso interno. Cada anfitrião identificado responde integralmente pela veracidade e comprovação dos fatos relatados.
            </span>
          </div>
          <span className="text-slate-500 shrink-0">Uso confidencial • Proibida reprodução externa</span>
        </div>
      </footer>

      {/* MODAL PAINEL ADMIN (GERENCIAMENTO DE LOGINS E SENHAS) */}
      {adminAberto && usuarioLogado.is_admin && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-navy-900 border border-gold-500/35 rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-8">
            <div className="px-6 py-4 bg-navy-800 border-b border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <UserCog className="w-5 h-5 text-gold-500" />
                <h3 className="text-lg font-bold text-white">Painel Admin — Controle de Acessos</h3>
              </div>
              <button
                onClick={() => setAdminAberto(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
              {/* Formulário de Criação de Novo Acesso */}
              <form
                onSubmit={handleCriarUsuario}
                className="bg-navy-950/80 border border-slate-800 rounded-xl p-5 space-y-4"
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
                    <label className="block text-xs text-slate-400 mb-1">Nome / Operação (Assinatura) *</label>
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
                    <label className="block text-xs text-slate-400 mb-1">Senha Inicial *</label>
                    <input
                      type="text"
                      required
                      value={novaSenhaUsuario}
                      onChange={(e) => setNovaSenhaUsuario(e.target.value)}
                      placeholder="Defina a senha"
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
                    Conceder permissão de Administrador
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

              {/* Lista de Logins Ativos */}
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
                        className="bg-navy-950 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">{user.nome_exibicao}</span>
                            <span className="text-xs px-2 py-0.5 rounded bg-navy-800 text-slate-300 border border-slate-700">
                              @{user.login}
                            </span>
                            {user.is_admin && (
                              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-gold-500/15 text-gold-400 border border-gold-500/30 font-medium">
                                <ShieldCheck className="w-3 h-3" /> Admin
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">
                            Criado em {formatarData(user.created_at)}
                          </p>
                        </div>

                        {editandoSenhaId === user.id ? (
                          <div className="flex items-center gap-2">
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
                              Trocar Senha
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

      {/* MODAL DE NOVO RELATO */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-navy-900 border border-gold-500/30 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden my-8">
            <div className="px-6 py-4 bg-navy-800 border-b border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-gold-500" />
                <h3 className="text-lg font-bold text-white">Registrar Ocorrência de Hóspede</h3>
              </div>
              <button
                onClick={() => setModalAberto(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSalvar} className="p-6 space-y-5 max-h-[82vh] overflow-y-auto">
              {/* Identificação Automática do Autor Logado */}
              <div className="bg-navy-950/90 border border-gold-500/25 rounded-xl px-4 py-3 flex items-center justify-between gap-2 text-xs">
                <span className="text-slate-400 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gold-500" />
                  Registro vinculado automaticamente a:
                </span>
                <strong className="text-gold-400">
                  {usuarioLogado.nome_exibicao} ({usuarioLogado.login})
                </strong>
              </div>

              {/* Aviso de Bloqueio Automático */}
              {!validacaoGeral.aprovado && (
                <div className="bg-rose-500/15 border border-rose-500/50 text-rose-200 text-xs px-4 py-3 rounded-xl flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-rose-300 mb-0.5">Publicação bloqueada automaticamente:</strong>
                    <span>{validacaoGeral.motivo}</span>
                  </div>
                </div>
              )}

              {/* Nome Completo do Hóspede */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1.5">
                  Nome Completo do Hóspede Titular *
                </label>
                <input
                  type="text"
                  required
                  value={nomeHospede}
                  onChange={(e) => setNomeHospede(e.target.value)}
                  placeholder="Ex.: João Carlos da Silva"
                  className="w-full bg-navy-950 border border-slate-700 focus:border-gold-500 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none"
                />
              </div>

              {/* Acompanhantes Dinâmicos */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1.5">
                  Acompanhantes (Opcional)
                </label>
                <div className="flex gap-2">
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
                    placeholder="Nome completo do acompanhante..."
                    className="flex-1 bg-navy-950 border border-slate-700 focus:border-gold-500 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 outline-none text-sm"
                  />
                  <button
                    type="button"
                    onClick={adicionarAcompanhante}
                    className="inline-flex items-center gap-1.5 bg-navy-800 hover:bg-navy-700 border border-gold-500/40 text-gold-400 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    Adicionar
                  </button>
                </div>

                {acompanhantes.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
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

              {/* Tags Rápidas */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Tags de Ocorrência (Selecione o que aconteceu)
                </label>
                <div className="flex flex-wrap gap-2">
                  {TAGS_DISPONIVEIS.map((tag) => {
                    const ativa = tagsSelecionadas.includes(tag.label);
                    return (
                      <button
                        type="button"
                        key={tag.label}
                        onClick={() => toggleTag(tag.label)}
                        className={
                          'text-xs px-3 py-1.5 rounded-full border transition-all ' +
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

              {/* Relato da Experiência */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-1.5">
                  Relato Objetivo da Ocorrência *
                </label>
                <textarea
                  required
                  rows={4}
                  value={relato}
                  onChange={(e) => setRelato(e.target.value)}
                  placeholder="Descreva apenas fatos objetivos comprováveis ocorridos durante a estadia (ex.: atraso no checkout, danos materiais, excesso de visitantes)..."
                  className={
                    'w-full bg-navy-950 border rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none text-sm ' +
                    (!validacaoGeral.aprovado
                      ? 'border-rose-500 focus:border-rose-500'
                      : 'border-slate-700 focus:border-gold-500')
                  }
                />
              </div>

              {/* Canal da Reserva */}
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

              {/* Termo de Responsabilidade */}
              <label className="flex items-start gap-2.5 bg-navy-950/80 border border-slate-800 rounded-xl p-3.5 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={aceiteResponsabilidade}
                  onChange={(e) => setAceiteResponsabilidade(e.target.checked)}
                  className="mt-0.5 accent-gold-500"
                />
                <span className="text-xs text-slate-300 leading-relaxed">
                  Declaro que as informações acima são verdadeiras, baseadas em fatos objetivos da hospedagem e que possuo registros/comprovantes do ocorrido, assumindo integral responsabilidade pelo conteúdo publicado sob meu login.
                </span>
              </label>

              {/* Botões de Ação */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-navy-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={enviando || !aceiteResponsabilidade || !validacaoGeral.aprovado}
                  className="bg-gold-500 hover:bg-gold-400 disabled:opacity-40 disabled:cursor-not-allowed text-navy-950 font-semibold px-6 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-gold-500/15"
                >
                  {enviando ? 'Salvando...' : 'Publicar Ocorrência'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão com Senha */}
      {registroParaExcluir && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-navy-900 border border-rose-500/40 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-navy-800 border-b border-slate-700/80 flex items-center justify-between">
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

            <form onSubmit={confirmarExclusao} className="p-6 space-y-4">
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

              <div className="pt-2 flex items-center justify-end gap-3">
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
                  className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-xl text-sm transition-colors"
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
