# 🌱 Plataforma de Voluntários - API

API completa para gerenciamento de voluntários em desastres ambientais e vulnerabilidade social, com integração de IA para análise de perfil.

## 📋 Índice

- [Tecnologias](#tecnologias)
- [Pré-requisitos](#pré-requisitos)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Endpoints da API](#endpoints-da-api)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Banco de Dados](#banco-de-dados)
- [Exemplos de Uso](#exemplos-de-uso)
- [Contribuição](#contribuição)

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **Express** - Framework web
- **MongoDB** - Banco de dados
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticação
- **IBM Watsonx.ai** - IA para análise de perfil
- **Axios** - Requisições HTTP

## 📋 Pré-requisitos

- Node.js (v18 ou superior)
- MongoDB instalado e rodando
- Conta IBM Cloud (para Watsonx.ai)

## 🔧 Instalação

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