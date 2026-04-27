import mongoose from 'mongoose';
import User from './src/models/User.js';
import dotenv from 'dotenv';
import readline from 'readline';

dotenv.config();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function criarAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB\n');

    // Perguntar dados do admin
    const email = await perguntar('📧 Email do admin: ');
    const senha = await perguntar('🔑 Senha do admin: ');
    const confirmarSenha = await perguntar('✅ Confirmar senha: ');

    if (senha !== confirmarSenha) {
      console.log('❌ Senhas não conferem!');
      process.exit(1);
    }

    if (senha.length < 6) {
      console.log('❌ Senha deve ter no mínimo 6 caracteres');
      process.exit(1);
    }

    // Verificar se email já existe
    const existente = await User.findOne({ email });
    if (existente) {
      console.log('❌ Este email já está cadastrado!');
      process.exit(1);
    }

    // Criar admin
    const admin = new User({
      email: email,
      password: senha,
      userType: 'admin',
      status: 'active'
    });
    await admin.save();

    console.log('\n✅ ADMIN CRIADO COM SUCESSO!');
    console.log('📧 Email:', email);
    console.log('🔑 Senha:', senha);
    console.log('\n🎯 Use estas credenciais para fazer login como admin');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await mongoose.disconnect();
    rl.close();
    process.exit();
  }
}

function perguntar(pergunta) {
  return new Promise((resolve) => {
    rl.question(pergunta, resolve);
  });
}

criarAdmin();