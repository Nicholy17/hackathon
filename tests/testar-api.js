import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

async function testarAPI() {
  try {
    console.log('🚀 Iniciando teste da API...\n');

    // 1. Criar voluntário
    console.log('1. Criando voluntário...');
    const email = `teste_${Date.now()}@email.com`;
    const cadastro = await axios.post('http://localhost:3000/api/auth/register', {
      email: email,
      password: '123456',
      nome: 'Usuário Teste',
      idade: 25
    });
    console.log('✅ Cadastro OK:', cadastro.data.message);
    console.log(`📧 Email: ${email}`);

    // 2. Login
    console.log('\n2. Fazendo login...');
    const login = await axios.post('http://localhost:3000/api/auth/login', {
      email: email,
      password: '123456',
      userType: 'volunteer'
    });
    const token = login.data.token;
    console.log('✅ Login OK');
    console.log(`🔑 Token: ${token.substring(0, 50)}...`);

    // 3. Buscar perguntas
    console.log('\n3. Buscando perguntas...');
    const perguntasRes = await axios.get('http://localhost:3000/api/test/questions', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const perguntas = perguntasRes.data;
    console.log(`✅ ${perguntas.length} perguntas encontradas`);

    // 4. Preparar respostas
    console.log('\n4. Preparando respostas...');
    const respostas = perguntas.map(pergunta => {
      let resposta = '';
      if (pergunta.type === 'multiple_choice') {
        resposta = pergunta.options[0]; // Primeira opção
      } else if (pergunta.type === 'scale') {
        resposta = '3'; // Valor médio
      }
      return {
        questionId: pergunta._id,
        answer: resposta
      };
    });

    console.log(`✅ ${respostas.length} respostas preparadas`);

    // 5. Enviar teste
    console.log('\n5. Enviando teste para o IBM Watsonx...');
    const testeRes = await axios.post('http://localhost:3000/api/test/submit', 
      { responses: respostas },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('\n🎉 TESTE FINALIZADO COM SUCESSO!');
    console.log('📊 RESULTADO DA ANÁLISE:');
    console.log(`   Perfil: ${testeRes.data.resultado.perfil}`);
    console.log(`   Score: ${testeRes.data.resultado.score}/100`);
    console.log(`   Status: ${testeRes.data.resultado.status}`);
    console.log(`   Justificativa: ${testeRes.data.resultado.justificativa}`);

    // 6. Ver resultado novamente
    console.log('\n6. Buscando resultado salvo...');
    const resultadoRes = await axios.get('http://localhost:3000/api/test/result', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('✅ Resultado persistido no banco de dados');
    console.log(`   Perfil: ${resultadoRes.data.perfil}`);
    console.log(`   Score: ${resultadoRes.data.score}`);

  } catch (error) {
    console.error('\n❌ ERRO:');
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Mensagem: ${JSON.stringify(error.response.data, null, 2)}`);
    } else {
      console.error(error.message);
    }
  }
}

testarAPI();