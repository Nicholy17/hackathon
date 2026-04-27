import axios from 'axios';

class WatsonXService {
  constructor() {
    this.token = null;
    this.tokenExpiry = null;
  }

  async getToken() {
    if (this.token && this.tokenExpiry > Date.now()) {
      return this.token;
    }

    const response = await axios.post(
      'https://iam.cloud.ibm.com/identity/token',
      new URLSearchParams({
        apikey: process.env.IBM_API_KEY,
        grant_type: 'urn:ibm:params:oauth:grant-type:apikey'
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    this.token = response.data.access_token;
    this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
    return this.token;
  }

  async analyzePerfil(respostas, habilidades, experiencia) {
    const token = await this.getToken();

    const prompt = `Você é um sistema de análise de perfis para voluntários em projetos sociais e desastres ambientais.
    
Baseado nas seguintes informações do voluntário:

Habilidades: ${habilidades.join(', ')}

Experiência: ${experiencia}

Respostas do teste de compatibilidade: ${JSON.stringify(respostas)}

Analise e determine qual o perfil de atuação mais adequado dentre estas opções:
- OPERACIONAL (Campo / Desastres): Voluntários que atuam diretamente em emergências, resgates, primeiros socorros e ações práticas no campo.
- EDUCACIONAL (Ensino / Informática): Voluntários focados em capacitação, ensino de informática, educação comunitária e treinamentos.
- APOIO GERAL (Logística / Social): Voluntários que organizam recursos, fazem distribuição, comunicação e apoio administrativo.

Responda APENAS no formato JSON (sem texto antes ou depois):
{
  "perfil": "OPERACIONAL",
  "score": 0-100,
  "justificativa": "resumo da análise baseada nas respostas",
  "recomendacoes": ["recomendacao1", "recomendacao2"]
}`;

    try {
      const response = await axios.post(
        `${process.env.WATSONX_URL}/ml/v1/text/generation?version=2023-05-29`,
        {
          input: prompt,
          model_id: "ibm/granite-3-8b-instruct",
          project_id: process.env.PROJECT_ID,
          parameters: {
            max_new_tokens: 500,
            temperature: 0.3,
            min_new_tokens: 50
          }
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      let textoGerado = response.data.results[0]?.generated_text || "";
      
      // Limpar a resposta
      textoGerado = textoGerado.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      let jsonInicio = textoGerado.indexOf('{');
      let jsonFim = textoGerado.lastIndexOf('}') + 1;
      
      if (jsonInicio !== -1 && jsonFim > jsonInicio) {
        textoGerado = textoGerado.substring(jsonInicio, jsonFim);
      }
      
      const resultado = JSON.parse(textoGerado);
      
      // Validar perfil
      const perfisValidos = ['OPERACIONAL', 'EDUCACIONAL', 'APOIO GERAL'];
      if (!perfisValidos.includes(resultado.perfil)) {
        resultado.perfil = 'APOIO GERAL';
      }
      
      return {
        perfil: resultado.perfil,
        score: Math.min(100, Math.max(0, resultado.score || 50)),
        justificativa: resultado.justificativa || "Perfil determinado com base nas respostas",
        recomendacoes: resultado.recomendacoes || ["Participar de treinamentos", "Conhecer a equipe"]
      };
      
    } catch (error) {
      console.error("❌ Erro na análise do Watsonx:", error.message);
      
      // Fallback: calcular perfil baseado nas respostas
      let perfil = "APOIO GERAL";
      let score = 50;
      
      // Lógica simples de fallback
      const habilidadesStr = habilidades.join(' ').toLowerCase();
      if (habilidadesStr.includes('socorro') || habilidadesStr.includes('primeiros')) {
        perfil = "OPERACIONAL";
        score = 70;
      } else if (habilidadesStr.includes('ensinar') || habilidadesStr.includes('aulas')) {
        perfil = "EDUCACIONAL";
        score = 70;
      }
      
      return {
        perfil: perfil,
        score: score,
        justificativa: "Perfil atribuído com base nas informações disponíveis",
        recomendacoes: ["Participar de treinamentos específicos"]
      };
    }
  }
}

export default new WatsonXService();