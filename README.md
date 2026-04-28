**COMPATIBILIZE:**

Sistema web para conectar voluntários a projetos sociais, desastres ambientais e causas envolvendo vulnerabilidade social através de um teste de compatibilidade inteligente.

Objetivo:

Facilitar o encontro entre pessoas que querem ajudar e entidades que precisam de apoio, garantindo alinhamento de expectativas, disponibilidade e tipo de atuação.

_________________________________________________________________________________________

Funcionalidade Principal

Teste de Compatibilidade

O sistema aplica um questionário para:

- Entender o perfil do voluntário
- Avaliar preferências (tipo de atividade, disponibilidade, local)
- Coletar dados comportamentais e de interesse

Após o preenchimento:

- O **Watsonx (IBM)** processa as respostas do voluntário  
- Interpreta o perfil de forma inteligente  
- Identifica em quais tipos de projetos ele melhor se encaixa  
- Retorna um nível de compatibilidade com base em contexto, não apenas regras fixas

_________________________________________________________________________________________

Tipos de Usuário:

- Cadastro e login
- Preenchimento do teste
- Visualização de projetos compatíveis
- Inscrição em projetos

Administrador:
- Cadastro de projetos
- Definição de requisitos (local, dias, duração, tipo de atividade)
- Visualização de candidatos
- Gestão de inscrições

_________________________________________________________________________________________

Estrutura do Projeto:

- Frontend: Interface web com foco em UX/UI intuitiva
- Backend: API para autenticação, lógica de compatibilidade e gestão de dados
- Banco de dados: Armazena usuários, projetos e respostas do teste

_________________________________________________________________________________________

Tecnologias:

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **MongoDB** - Banco de dados
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticação
- **IBM Watsonx.ai** - IA para análise de perfil
- **Axios** - Requisições HTTP

_________________________________________________________________________________________

Pré-requisitos: 
- Node.js (v18 ou superior)
- MongoDB instalado e rodando
- Conta IBM Cloud (para Watsonx.ai)

_________________________________________________________________________________________

Lógica de Compatibilidade:

O cálculo considera:

- Disponibilidade (dias e horários)
- Localização
- Tipo de atividade (manual, educacional, remoto, etc.)
- Tempo de compromisso
- Preferências do voluntário

Cada critério possui um peso para gerar um score final de compatibilidade.
_________________________________________________________________________________________

Campos do Projeto:

- Nome do projeto
- Descrição
- Localização
- Dias e horários
- Duração
- Tipo de atividade
- Requisitos específicos

_________________________________________________________________________________________

Instalação

```bash
# Clone o repositório
git clone seu-repositorio

# Entre na pasta
cd HACKATON

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env

# Inicie o servidor
npm start