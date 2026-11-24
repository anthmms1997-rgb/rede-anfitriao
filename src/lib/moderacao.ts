export interface ResultadoModeracao {
  aprovado: boolean;
  motivo?: string;
}

// Palavras e expressões que geram risco jurídico (LGPD sensível, calúnia, injúria ou difamação)
const TERMOS_BLOQUEADOS: { termo: string; categoria: string }[] = [
  // Imputações criminais diretas
  { termo: 'estelionatario', categoria: 'acusação criminal direta' },
  { termo: 'estelionato', categoria: 'acusação criminal direta' },
  { termo: 'traficante', categoria: 'acusação criminal direta' },
  { termo: 'trafico', categoria: 'acusação criminal direta' },
  { termo: 'foragido', categoria: 'acusação criminal direta' },
  { termo: 'foragida', categoria: 'acusação criminal direta' },
  { termo: 'ladrao', categoria: 'termo ofensivo / acusação direta' },
  { termo: 'ladra', categoria: 'termo ofensivo / acusação direta' },
  { termo: 'bandido', categoria: 'termo ofensivo / acusação direta' },
  { termo: 'bandida', categoria: 'termo ofensivo / acusação direta' },
  { termo: 'criminoso', categoria: 'acusação criminal direta' },
  { termo: 'criminosa', categoria: 'acusação criminal direta' },
  { termo: 'golpista', categoria: 'termo ofensivo / acusação direta' },
  { termo: 'drogado', categoria: 'termo ofensivo / dado sensível' },
  { termo: 'drogada', categoria: 'termo ofensivo / dado sensível' },
  { termo: 'usuario de drogas', categoria: 'dado sensível / acusação' },
  { termo: 'usa drogas', categoria: 'dado sensível / acusação' },

  // Dados sensíveis (Saúde mental e vida sexual - Art. 5º, II da LGPD)
  { termo: 'garota de programa', categoria: 'dado sensível (vida sexual)' },
  { termo: 'garoto de programa', categoria: 'dado sensível (vida sexual)' },
  { termo: 'prostituta', categoria: 'dado sensível / injúria' },
  { termo: 'prostituicao', categoria: 'dado sensível (vida sexual)' },
  { termo: 'gp trans', categoria: 'dado sensível (identidade / vida sexual)' },
  { termo: 'transtorno psicologico', categoria: 'dado sensível de saúde' },
  { termo: 'problemas psicologicos', categoria: 'dado sensível de saúde' },
  { termo: 'doente mental', categoria: 'dado sensível de saúde / injúria' },
  { termo: 'esquizofrenico', categoria: 'dado sensível de saúde' },
  { termo: 'surto', categoria: 'dado sensível de saúde' },
  { termo: 'bipolar', categoria: 'dado sensível de saúde' },

  // Xingamentos e ofensas pessoais (Injúria)
  { termo: 'vagabundo', categoria: 'xingamento / ofensa pessoal' },
  { termo: 'vagabunda', categoria: 'xingamento / ofensa pessoal' },
  { termo: 'pilantra', categoria: 'xingamento / ofensa pessoal' },
  { termo: 'safado', categoria: 'xingamento / ofensa pessoal' },
  { termo: 'safada', categoria: 'xingamento / ofensa pessoal' },
  { termo: 'porco', categoria: 'xingamento / ofensa pessoal' },
  { termo: 'porca', categoria: 'xingamento / ofensa pessoal' },
  { termo: 'imundo', categoria: 'ofensa pessoal (prefira "imóvel entregue sujo")' },
  { termo: 'imunda', categoria: 'ofensa pessoal (prefira "imóvel entregue sujo")' },
  { termo: 'nojento', categoria: 'xingamento / ofensa pessoal' },
  { termo: 'nojenta', categoria: 'xingamento / ofensa pessoal' },
  { termo: 'idiota', categoria: 'xingamento / ofensa pessoal' },
  { termo: 'imbecil', categoria: 'xingamento / ofensa pessoal' },
  { termo: 'lixo de pessoa', categoria: 'xingamento / ofensa pessoal' },
];

function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function validarConteudoRelato(texto: string): ResultadoModeracao {
  if (!texto || !texto.trim()) {
    return { aprovado: true };
  }

  // 1. Bloqueio de CPF (formatado 000.000.000-00 ou 11 dígitos seguidos)
  const regexCpfFormatado = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/;
  const regexOnzeDigitos = /\b\d{11}\b/;
  if (regexCpfFormatado.test(texto) || regexOnzeDigitos.test(texto)) {
    return {
      aprovado: false,
      motivo: 'Por segurança jurídica (LGPD), não é permitido inserir números de CPF ou documentos no relato.',
    };
  }

  // 2. Bloqueio de telefone/WhatsApp com DDD
  const regexTelefone = /\(?\d{2}\)?\s?9?\d{4}-?\d{4}/;
  if (regexTelefone.test(texto)) {
    return {
      aprovado: false,
      motivo: 'Não inclua números de telefone ou WhatsApp no texto do relato.',
    };
  }

  // 3. Verificação de termos ofensivos, sensíveis ou acusações criminais
  const textoLimpo = normalizarTexto(texto);

  for (const item of TERMOS_BLOQUEADOS) {
    const regexPalavra = new RegExp(`\\b${item.termo}\\b`, 'i');
    if (regexPalavra.test(textoLimpo)) {
      return {
        aprovado: false,
        motivo: `O termo "${item.termo}" foi bloqueado automaticamente (${item.categoria}). Descreva apenas os fatos objetivos ocorridos no imóvel.`,
      };
    }
  }

  return { aprovado: true };
}
