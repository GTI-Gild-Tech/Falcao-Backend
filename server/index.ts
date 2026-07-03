// server/index.ts
import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';


dotenv.config({ path: `.env.${process.env.NODE_ENV || 'development'}` });

const app = express();
const PORT = process.env.PORT || 3001;

// Configurar Supabase com service role (para admin)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

app.use(cors());
app.use(express.json());


// Interface para a resposta da API de IA
interface AIResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
  error?: {
    message: string;
  };
}

// ============================================
// ROTA DO CHAT IA
// ============================================
app.post("/api/chat", async (req: Request, res: Response) => {
  const { mensagem, historico } = req.body;

  console.log('💬 Chat - Mensagem recebida:', mensagem);

  if (!mensagem) {
    return res.status(400).json({ erro: "Mensagem não informada" });
  }

  try {
    const system = `
Você é um assistente virtual especializado da Falcão Capital, uma empresa de consultoria financeira e crédito.
Você deve:
- Responder em português de forma profissional e amigável
- Ajudar com dúvidas sobre crédito, reestruturação financeira, relatórios
- Explicar os serviços da empresa
- Fornecer informações gerais (não consulte dados específicos de clientes)
- Se não souber algo, sugira falar com um consultor
- Seja conciso (máx 200 palavras)
`;

    const messages = [
      { role: "system", content: system },
      ...(historico || []),
      { role: "user", content: mensagem }
    ];

    console.log('🔄 Chamando NVIDIA API para o chat...');

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-8b-instruct",
        messages: messages,
        temperature: 0.7,
        max_tokens: 500
      })
    });

    const data = await response.json() as AIResponse;

    if (!response.ok) {
      console.error('❌ Erro na API NVIDIA:', data.error);
      throw new Error(data.error?.message || 'Erro na API NVIDIA');
    }

    const resposta = data.choices[0].message.content;
    console.log('✅ Resposta gerada com sucesso');

    res.json({ resposta });

  } catch (error: any) {
    console.error('❌ Erro no chat:', error);
    res.status(500).json({ 
      erro: "Erro ao processar mensagem",
      resposta: "Desculpe, tive um problema. Pode tentar novamente?"
    });
  }
});

// ============================================
// MAPEAMENTO DE PROMPTS POR SERVIÇO
// ============================================
const PROMPTS: Record<string, string> = {
  // PROMPT PARA CRÉDITO
  "credito": `
Gere um RELATÓRIO TÉCNICO DE ANÁLISE DE CRÉDITO, contendo:

1. Perfil do solicitante (pessoa física ou jurídica)
2. Análise da capacidade de pagamento
3. Avaliação de riscos
4. Histórico de crédito (se disponível nos dados)
5. Recomendação técnica de crédito
6. Limite sugerido e condições
7. Conclusão da análise
`,

  // Todos os possíveis nomes para Crédito
  "Crédito": `
Gere um RELATÓRIO TÉCNICO PARA CAPTAÇÃO DE RECURSOS E CAPITAL DE GIRO, contendo:

1. Enquadramento da empresa/cliente
2. Necessidade de crédito e finalidade
3. Análise da estrutura financeira atual
4. Avaliação da capacidade de alavancagem
5. Perfil de risco para instituições financeiras
6. Valor recomendado de captação
7. Prazo e modalidade indicados
8. Conclusão técnica para apresentação a agentes financeiros
`,

  "Captação de Recursos / Capital de Giro": `
Gere um RELATÓRIO TÉCNICO PARA CAPTAÇÃO DE RECURSOS E CAPITAL DE GIRO, contendo:

1. Enquadramento da empresa/cliente
2. Necessidade de crédito e finalidade
3. Análise da estrutura financeira atual
4. Avaliação da capacidade de alavancagem
5. Perfil de risco para instituições financeiras
6. Valor recomendado de captação
7. Prazo e modalidade indicados
8. Conclusão técnica para apresentação a agentes financeiros
`,

  "Captação de Recursos": `
Gere um RELATÓRIO TÉCNICO PARA CAPTAÇÃO DE RECURSOS E CAPITAL DE GIRO, contendo:

1. Enquadramento da empresa/cliente
2. Necessidade de crédito e finalidade
3. Análise da estrutura financeira atual
4. Avaliação da capacidade de alavancagem
5. Perfil de risco para instituições financeiras
6. Valor recomendado de captação
7. Prazo e modalidade indicados
8. Conclusão técnica para apresentação a agentes financeiros
`,

  "Capital de Giro": `
Gere um RELATÓRIO TÉCNICO PARA CAPTAÇÃO DE RECURSOS E CAPITAL DE GIRO, contendo:

1. Enquadramento da empresa/cliente
2. Necessidade de crédito e finalidade
3. Análise da estrutura financeira atual
4. Avaliação da capacidade de alavancagem
5. Perfil de risco para instituições financeiras
6. Valor recomendado de captação
7. Prazo e modalidade indicados
8. Conclusão técnica para apresentação a agentes financeiros
`,

  // Reestruturação
  "Reestruturação Financeira": `
Gere um RELATÓRIO TÉCNICO DE REESTRUTURAÇÃO FINANCEIRA, contendo:

1. Diagnóstico financeiro da empresa
2. Identificação de desequilíbrios financeiros
3. Análise de endividamento
4. Avaliação de capacidade de pagamento
5. Recomendações de reestruturação (prazo, perfil da dívida, fluxo de caixa)
6. Plano técnico resumido de recuperação financeira
7. Conclusão técnica
`,

  "Reestruturação": `
Gere um RELATÓRIO TÉCNICO DE REESTRUTURAÇÃO FINANCEIRA, contendo:

1. Diagnóstico financeiro da empresa
2. Identificação de desequilíbrios financeiros
3. Análise de endividamento
4. Avaliação de capacidade de pagamento
5. Recomendações de reestruturação (prazo, perfil da dívida, fluxo de caixa)
6. Plano técnico resumido de recuperação financeira
7. Conclusão técnica
`,

  // Planejamento
  "Planejamento Financeiro": `
Gere um RELATÓRIO DE PLANEJAMENTO FINANCEIRO EMPRESARIAL, contendo:

1. Diagnóstico financeiro
2. Estrutura de receitas e custos
3. Análise de fluxo de caixa
4. Projeção financeira simplificada
5. Recomendações de organização financeira
6. Indicadores gerenciais sugeridos
7. Conclusão técnica
`,

  // Análise de Balanço
  "Análise de Balanço Patrimonial, DRE e Indicadores Financeiros": `
Gere um RELATÓRIO DE ANÁLISE DE BALANÇO PATRIMONIAL, DRE E INDICADORES FINANCEIROS, contendo:

1. Análise patrimonial
2. Análise de resultado (DRE)
3. Indicadores de liquidez
4. Indicadores de endividamento
5. Indicadores de rentabilidade
6. Avaliação da saúde financeira
7. Conclusão técnica
`,

  "Análise de Balanço": `
Gere um RELATÓRIO DE ANÁLISE DE BALANÇO PATRIMONIAL, DRE E INDICADORES FINANCEIROS, contendo:

1. Análise patrimonial
2. Análise de resultado (DRE)
3. Indicadores de liquidez
4. Indicadores de endividamento
5. Indicadores de rentabilidade
6. Avaliação da saúde financeira
7. Conclusão técnica
`,

  // Perícia
  "Perícia Econômica de Contratos Bancários": `
Gere um RELATÓRIO TÉCNICO DE PERÍCIA ECONÔMICA DE CONTRATOS BANCÁRIOS, contendo:

1. Contextualização da demanda
2. Perfil econômico-financeiro do contratante
3. Análise da estrutura de endividamento bancário
4. Indícios de onerosidade excessiva
5. Riscos financeiros identificados
6. Limitações técnicas do material apresentado
7. Conclusão pericial preliminar
`,

  "Perícia Econômica": `
Gere um RELATÓRIO TÉCNICO DE PERÍCIA ECONÔMICA DE CONTRATOS BANCÁRIOS, contendo:

1. Contextualização da demanda
2. Perfil econômico-financeiro do contratante
3. Análise da estrutura de endividamento bancário
4. Indícios de onerosidade excessiva
5. Riscos financeiros identificados
6. Limitações técnicas do material apresentado
7. Conclusão pericial preliminar
`
};

// ============================================
// ROTA PARA GERAR RELATÓRIOS
// ============================================
app.post("/api/gerar-relatorios", async (req: Request, res: Response) => {
  const { dados, servicos_interesse, submissao_id, tipo_servico } = req.body;

  console.log('='.repeat(50));
  console.log('📥 REQUISIÇÃO RECEBIDA:', new Date().toISOString());
  console.log('📦 Dados recebidos:', { 
    temDados: !!dados, 
    servicos: servicos_interesse,
    tipo_servico,
    submissao_id 
  });

  if (!dados) {
    console.log('❌ Erro: dados não informados');
    return res.status(400).json({ erro: "Dados não informados." });
  }

  try {
    const resultados = [];

    // CASO ESPECIAL: Crédito (não precisa de serviços de interesse)
    if (tipo_servico === 'credito') {
      console.log('\n🔍 PROCESSANDO RELATÓRIO DE CRÉDITO');
      
      const instrucao = PROMPTS["credito"];
      
      if (!instrucao) {
        console.log('❌ Prompt para crédito não encontrado');
        return res.status(500).json({ erro: "Prompt para crédito não configurado" });
      }

      const system = `
Você é um analista de crédito sênior no Brasil.
Utilize exclusivamente as informações fornecidas no formulário do cliente.
NÃO crie dados fictícios.
NÃO invente números ou informações.
Mantenha linguagem técnica, formal e bem estruturada.
Se informações estiverem faltando, indique as limitações da análise.
`;

      const user = `
${instrucao}

DADOS DO CLIENTE:
${JSON.stringify(dados, null, 2)}

INSTRUÇÕES IMPORTANTES:
- Baseie-se APENAS nos dados fornecidos acima
- Seja técnico e profissional
- Estruture o relatório de forma clara
- Destaque pontos fortes e riscos
- Inclua recomendações práticas quando possível
`;

      const payload = {
        model: "meta/llama-3.1-8b-instruct",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ],
        temperature: 0.2,
        max_tokens: 2500
      };

      const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json() as AIResponse;

      if (!response.ok) {
        console.error('❌ Erro na API NVIDIA:', data.error);
        throw new Error(data.error?.message || 'Erro na API NVIDIA');
      }

      const relatorio = data.choices[0].message.content;
      console.log(`✅ Relatório de crédito gerado com sucesso! Tamanho: ${relatorio.length} caracteres`);

      resultados.push({
        servico: 'Análise de Crédito',
        relatorio,
        gerado_em: new Date().toISOString()
      });

      // Salvar no Supabase
      if (submissao_id) {
        console.log(`💾 Tentando salvar no Supabase...`);
        
        try {
          const { error } = await supabase
            .from('relatorios_gerados')
            .insert({
              submissao_id,
              servico: 'Análise de Crédito',
              relatorio,
              created_at: new Date().toISOString()
            });

          if (error) {
            console.error('❌ ERRO AO SALVAR NO SUPABASE:', error);
          } else {
            console.log('✅ Relatório salvo com sucesso no Supabase!');
          }
        } catch (supabaseError: any) {
          console.error('❌ Exceção ao salvar no Supabase:', supabaseError.message);
        }
      }

      return res.json({ 
        sucesso: true, 
        resultados,
        total_gerados: 1 
      });
    }

    // PARA OS DEMAIS SERVIÇOS - mantém a lógica atual
    if (!Array.isArray(servicos_interesse) || servicos_interesse.length === 0) {
      console.log('❌ Erro: serviços não informados');
      return res.status(400).json({ erro: "Serviços não informados." });
    }

    for (const servicoOriginal of servicos_interesse) {
      console.log(`\n🔍 PROCESSANDO SERVIÇO: "${servicoOriginal}"`);

      const instrucao = PROMPTS[servicoOriginal];
      
      if (!instrucao) {
        console.log(`⚠️ Serviço não encontrado no mapeamento: "${servicoOriginal}"`);
        continue;
      }

      console.log('✅ Serviço encontrado no mapeamento');

      const system = `
Você é um analista financeiro sênior e perito econômico no Brasil.
Utilize exclusivamente as informações fornecidas no formulário do cliente.
NÃO crie dados fictícios.
NÃO invente números ou informações.
Mantenha linguagem técnica, formal e bem estruturada.
Se informações estiverem faltando, indique as limitações da análise.
`;

      const user = `
${instrucao}

DADOS DO CLIENTE:
${JSON.stringify(dados, null, 2)}

INSTRUÇÕES IMPORTANTES:
- Baseie-se APENAS nos dados fornecidos acima
- Seja técnico e profissional
- Estruture o relatório de forma clara
- Destaque pontos fortes e riscos
- Inclua recomendações práticas quando possível
`;

      const payload = {
        model: "meta/llama-3.1-8b-instruct",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user }
        ],
        temperature: 0.2,
        max_tokens: 2500
      };

      console.log(`🔄 Chamando API NVIDIA para: ${servicoOriginal}`);

      const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.NVIDIA_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json() as AIResponse;

      if (!response.ok) {
        console.error('❌ Erro na API NVIDIA:', data.error);
        throw new Error(data.error?.message || 'Erro na API NVIDIA');
      }

      const relatorio = data.choices[0].message.content;
      console.log(`✅ Relatório gerado com sucesso! Tamanho: ${relatorio.length} caracteres`);

      resultados.push({
        servico: servicoOriginal,
        relatorio,
        gerado_em: new Date().toISOString()
      });

      if (submissao_id) {
        try {
          const { error } = await supabase
            .from('relatorios_gerados')
            .insert({
              submissao_id,
              servico: servicoOriginal,
              relatorio,
              created_at: new Date().toISOString()
            });

          if (error) {
            console.error('❌ ERRO AO SALVAR NO SUPABASE:', error);
          }
        } catch (supabaseError: any) {
          console.error('❌ Exceção ao salvar no Supabase:', supabaseError.message);
        }
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log(`\n🎉 Processamento concluído! Total de relatórios gerados: ${resultados.length}`);
    return res.json({ 
      sucesso: true, 
      resultados,
      total_gerados: resultados.length 
    });

  } catch (error: any) {
    console.error('\n❌ ERRO GERAL:');
    console.error('Mensagem:', error.message);
    
    return res.status(500).json({ 
      erro: "Erro interno ao gerar relatórios", 
      detalhes: error.message 
    });
  }
});

// ============================================
// ROTA PARA BUSCAR RELATÓRIOS DE UMA SUBMISSÃO
// ============================================
app.get("/api/relatorios/:submissao_id", async (req: Request, res: Response) => {
  const { submissao_id } = req.params;

  try {
    const { data, error } = await supabase
      .from('relatorios_gerados')
      .select('*')
      .eq('submissao_id', submissao_id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return res.json(data);
  } catch (error: any) {
    return res.status(500).json({ erro: error.message });
  }
});

// ============================================
// ROTA PARA LISTAR TODOS OS RELATÓRIOS
// ============================================
app.get("/api/relatorios", async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('relatorios_gerados')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return res.json(data);
  } catch (error: any) {
    return res.status(500).json({ erro: error.message });
  }
});

// ============================================
// ROTA DE HEALTH CHECK (para manter o servidor acordado)
// ============================================
app.get("/api/health", (req: Request, res: Response) => {
  res.json({
    status: "ok", 
    timestamp: new Date().toISOString(),
    ambiente: process.env.NODE_ENV || 'development'
  });
});

// ============================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================
app.listen(PORT, () => {
  console.log('='.repeat(50));
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📝 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 URL: http://localhost:${PORT}`);
  console.log(`📊 NVIDIA API Key configurada: ${process.env.NVIDIA_API_KEY ? '✅' : '❌'}`);
  console.log(`📊 Supabase URL configurada: ${process.env.SUPABASE_URL ? '✅' : '❌'}`);
  console.log(`📊 Supabase Service Key configurada: ${process.env.SUPABASE_SERVICE_KEY ? '✅' : '❌'}`);
  console.log(`💬 Rota do chat: /api/chat`);
  console.log(`📊 Rota de relatórios: /api/gerar-relatorios`);
  console.log('='.repeat(50));
});

//https://build.nvidia.com/meta/llama-3_1-8b-instruct