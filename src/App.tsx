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
  Lock
} from 'lucide-react';
import { supabase, type AvaliacaoHospede } from './lib/supabase';

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
  { label: 'Golpe / Estelionato / Doc. falso', type: 'danger' },
  { label: 'Avaliação falsa / Má-fé', type: 'warning' },
  { label: 'Desrespeito / Ameaças', type: 'danger' },
  { label: 'Não recomendado', type: 'danger' },
];

const SENHA_EXCLUSAO = '15975300';

export default function App() {
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoHospede[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [modalAberto, setModalAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mensagemBanner, setMensagemBanner] = useState<string | null>(null);

  // Estados do modal de exclusão
  const [registroParaExcluir, setRegistroParaExcluir] = useState<AvaliacaoHospede | null>(null);
  const [senhaDigitada, setSenhaDigitada] = useState('');
  const [erroSenha, setErroSenha] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  // Estados do formulário
  const [nomeHospede, setNomeHospede] = useState('');
  const [acompanhanteInput, setAcompanhanteInput] = useState('');
  const [acompanhantes, setAcompanhantes] = useState<string[]>([]);
  const [tagsSelecionadas, setTagsSelecionadas] = useState<string[]>([]);
  const [relato, setRelato] = useState('');
  const [anfitriaoNome, setAnfitriaoNome] = useState('');
  const [plataforma, setPlataforma] = useState('Airbnb');

  useEffect(() => {
    carregarAvaliacoes();
  }, []);

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

  function mostrarAviso(texto: string) {
    setMensagemBanner(texto);
    setTimeout(() => setMensagemBanner(null), 4000);
  }

  // Busca inteligente: procura no nome do titular OU no nome de qualquer acompanhante
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
    if (!nomeHospede.trim() || !relato.trim()) return;

    const listaFinalAcompanhantes = [...acompanhantes];
    if (acompanhanteInput.trim() && !listaFinalAcompanhantes.includes(acompanhanteInput.trim())) {
      listaFinalAcompanhantes.push(acompanhanteInput.trim());
    }

    setEnviando(true);
    const { error } = await supabase.from('avaliacoes_hospedes').insert([
      {
        nome_hospede: nomeHospede.trim(),
        acompanhantes: listaFinalAcompanhantes,
        tags: tagsSelecionadas,
        relato: relato.trim(),
        anfitriao_nome: anfitriaoNome.trim() || 'Anfitrião Parceiro',
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
      setModalAberto(false);
      mostrarAviso('Ocorrência registrada com sucesso na Rede Anfitrião!');
      carregarAvaliacoes();
    } else {
      alert('Erro ao salvar relato: ' + error.message);
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

  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col">
      {/* Navbar Executiva */}
      <header className="sticky top-0 z-30 bg-navy-900/95 backdrop-blur-md border-b border-gold-500/20 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center shadow-md shadow-gold-500/20">
              <ShieldAlert className="w-6 h-6 text-navy-950" strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Rede <span className="text-gold-500">Anfitrião</span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                Base colaborativa de alertas e ocorrências com hóspedes
              </p>
            </div>
          </div>

          <button
            onClick={() => setModalAberto(true)}
            className="inline-flex items-center gap-2 bg-gold-500 hover:bg-gold-400 text-navy-950 font-semibold px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-gold-500/15 active:scale-95 text-sm sm:text-base"
          >
            <Plus className="w-5 h-5" strokeWidth={2.5} />
            <span>Registrar Ocorrência</span>
          </button>
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
              <AlertTriangle className="w-3.5 h-3.5" /> Consulta Preventiva de Hóspedes
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Pesquise pelo nome do hóspede ou acompanhante
            </h2>
            <p className="text-slate-300 text-sm sm:text-base mb-6">
              Verifique se há relatos negativos ou ocorrências registradas por outros anfitriões antes de liberar a reserva.
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
                ? 'Não encontramos ocorrências negativas para "' + busca + '" nem como titular nem como acompanhante.'
                : 'Seja o primeiro a registrar um alerta para ajudar outros anfitriões.'}
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
                          Relatado por: <strong className="text-slate-300">{item.anfitriao_nome}</strong>
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

      {/* Modal de Novo Relato */}
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
                  Relato Detalhado do Problema *
                </label>
                <textarea
                  required
                  rows={4}
                  value={relato}
                  onChange={(e) => setRelato(e.target.value)}
                  placeholder="Descreva o ocorrido (sujeira, danos, hóspedes extras, desrespeito às regras do condomínio, etc.)..."
                  className="w-full bg-navy-950 border border-slate-700 focus:border-gold-500 rounded-xl px-4 py-3 text-white placeholder-slate-500 outline-none text-sm"
                />
              </div>

              {/* Identificação Opcional do Anfitrião e Plataforma */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Seu Nome ou Operação (Opcional)
                  </label>
                  <input
                    type="text"
                    value={anfitriaoNome}
                    onChange={(e) => setAnfitriaoNome(e.target.value)}
                    placeholder="Digite seu nome ou da empresa"
                    className="w-full bg-navy-950 border border-slate-700 focus:border-gold-500 rounded-xl px-3.5 py-2.5 text-white placeholder-slate-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
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
              </div>

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
                  disabled={enviando}
                  className="bg-gold-500 hover:bg-gold-400 disabled:opacity-50 text-navy-950 font-semibold px-6 py-2.5 rounded-xl text-sm transition-all shadow-lg shadow-gold-500/15"
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
