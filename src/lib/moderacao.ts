export interface ResultadoModeracao {
  aprovado: boolean;
  motivo?: string;
}

// Radicais e prefixos bloqueados: pega a palavra completa, cortada (ex.: "vagabund"), plural ou feminino
const RADICAIS_BLOQUEADOS: { radical: string; categoria: string }[] = [
  // Imputações criminais diretas (mesmo abreviadas)
  { radical: 'estelionat', categoria: 'acusação criminal direta' },
  { radical: 'traficant', categoria: 'acusação criminal direta' },
  { radical: 'foragid', categoria: 'acusação criminal direta' },
  { radical: 'ladra', categoria: 'termo ofensivo / acusação direta' },
  { radical: 'ladro', categoria: 'termo ofensivo / acusação direta' },
  { radical: 'bandid', categoria: 'termo ofensivo / acusação direta' },
  { radical: 'criminos', categoria: 'acusação criminal direta' },
  { radical: 'golpist', categoria: 'termo ofensivo / acusação direta' },
  { radical: 'drogad', categoria: 'termo ofensivo / dado sensível' },
  { radical: 'usuario de droga', categoria: 'dado sensível / acusação' },
  { radical: 'usa droga', categoria: 'dado sensível / acusação' },

  // Dados sensíveis (Saúde mental e vida sexual - Art. 5º, II da LGPD)
  { radical: 'garota de programa', categoria: 'dado sensível (vida sexual)' },
  { radical: 'garoto de programa', categoria: 'dado sensível (vida sexual)' },
  { radical: 'prostitut', categoria: 'dado sensível / injúria' },
  { radical: 'prostituic', categoria: 'dado sensível (vida sexual)' },
  { radical: 'gp trans', categoria: 'dado sensível (identidade / vida sexual)' },
  { radical: 'transtorno psicologic', categoria: 'dado sensível de saúde' },
  { radical: 'problema psicologic', categoria: 'dado sensível de saúde' },
  { radical: 'doente mental', categoria: 'dado sensível de saúde / injúria' },
  { radical: 'esquizofren', categoria: 'dado sensível de saúde' },
  { radical: 'surtad', categoria: 'dado sensível de saúde' },
  { radical: 'surto', categoria: 'dado sensível de saúde' },
  { radical: 'bipolar', categoria: 'dado sensível de saúde' },

  // Xingamentos e ofensas pessoais (mesmo cortados, como "vagabund")
  { radical: 'vagabund', categoria: 'xingamento / ofensa pessoal' },
  { radical: 'pilantr', categoria: 'xingamento / ofensa pessoal' },
  { radical: 'safad', categoria: 'xingamento / ofensa pessoal' },
  { radical: 'porc', categoria: 'xingamento / ofensa pessoal (prefira "imóvel entregue sujo")' },
  { radical: 'imund', categoria: 'ofensa pessoal (prefira "imóvel entregue sujo")' },
  { radical: 'nojen', categoria: 'xingamento / ofensa pessoal' },
  { radical: 'idiot', categoria: 'xingamento / ofensa pessoal' },
  { radical: 'imbec', categoria: 'xingamento / ofensa pessoal' },
  { radical: 'lixo de pessoa', categoria: 'xingamento / ofensa pessoal' },
  { radical: 'fdp', categoria: 'xingamento / sigla ofensiva' },
  { radical: 'filho da puta', categoria: 'xingamento / ofensa pessoal' },
  { radical: 'filha da puta', categoria: 'xingamento / ofensa pessoal' },
  { radical: 'arrombad', categoria: 'xingamento / ofensa pessoal' },
  { radical: 'desgracad', categoria: 'xingamento / ofensa pessoal' },
  { radical: 'merda', categoria: 'termo chulo / ofensivo' },
  { radical: 'bosta', categoria: 'termo chulo / ofensivo' },
  { radical: 'puta', categoria: 'xingamento / ofensa pessoal' },
  { radical: 'piranh', categoria: 'xingamento / ofensa pessoal' },
  { radical: 'otari', categoria: 'xingamento / ofensa pessoal' },
  { radical: 'troux', categoria: 'xingamento / ofensa pessoal' },
  { radical: 'malandr', categoria: 'xingamento / ofensa pessoal' },
  { radical: 'caloteir', categoria: 'ofensa pessoal (prefira "não efetuou o pagamento")' },
];

function normalizarTexto(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Converte substituições comuns por números/símbolos (ex.: v4g4bund0 -> vagabundo)
    .replace(/4/g, 'a')
    .replace(/@/g, 'a')
    .replace(/3/g, 'e')
    .replace(/1/g, 'i')
    .replace(/!/g, 'i')
    .replace(/0/g, 'o')
    .replace(/\$/g, 's')
    .replace(/5/g, 's')
    .replace(/7/g, 't');
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

  // 3. Verificação por radical (pega início da palavra, mesmo cortada ou disfarçada)
  const textoLimpo = normalizarTexto(texto);

  for (const item of RADICAIS_BLOQUEADOS) {
    // \b apenas no INÍCIO do radical: bloqueia "vagabund", "vagabundo", "vagabunda", "vagabundagem", etc.
    const regexRadical = new RegExp(`\\b${item.radical}`, 'i');
    if (regexRadical.test(textoLimpo)) {
      return {
        aprovado: false,
        motivo: `O termo iniciado por "${item.radical}..." foi bloqueado automaticamente (${item.categoria}). Descreva apenas os fatos objetivos ocorridos no imóvel.`,
      };
    }
  }

  return { aprovado: true };
}
