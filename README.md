# Converto

[![Status de Build](https://img.shields.io/github/actions/workflow/status/DonatoReis/Converto/ci.yml?branch=main&style=flat-square)](https://github.com/DonatoReis/Converto/actions)
[![Licença: MIT](https://img.shields.io/badge/Licen%C3%A7a-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Versão](https://img.shields.io/github/package-json/v/DonatoReis/Converto?style=flat-square)](https://github.com/DonatoReis/Converto)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg?style=flat-square)](https://conventionalcommits.org)
[![Estilo de Código: Prettier](https://img.shields.io/badge/Estilo%20de%20C%C3%B3digo-Prettier-ff69b4.svg?style=flat-square)](https://prettier.io)
[![Deploy em Vercel](https://therealsujitk-vercel-badge.vercel.app/?app=converto&style=flat-square)](https://converto.vercel.app)

> Aplicativo web moderno para gerenciamento de tarefas com mensagens em tempo real, funcionalidades de marketplace e pagamentos integrados.

## ✨ Funcionalidades Principais

- **Autenticação Segura**: Registro e login de usuários com Firebase Authentication, suportando e-mail/senha e 2FA.  
- **Gerenciamento de Tarefas**: Crie, organize e acompanhe tarefas com categorias e prioridades personalizáveis.  
- **Mensagens em Tempo Real**: Comunicação criptografada entre usuários via Signal Protocol.  
- **Marketplace**: Navegue e adquira produtos com integração de pagamento seguro (Stripe).  
- **Processamento de Pagamentos**: Checkout de produtos e serviços com Stripe.  
- **Gerenciamento de Perfil**: Edite informações pessoais, configurações de privacidade e contatos bloqueados.  
- **Busca Inteligente**: Filtre tarefas, contatos e itens do marketplace facilmente.  
- **Design Responsivo**: Interface adaptável para desktop, tablet e mobile.

## 📸 Capturas de Tela

<div align="center">
  <img src="https://via.placeholder.com/800x450?text=Converto+-+Dashboard" alt="Dashboard Converto" width="800"/>
  <p><em>Visão geral do dashboard com tarefas</em></p>
  <br/>
  <div style="display: flex; gap: 16px; justify-content: center;">
    <img src="https://via.placeholder.com/380x700?text=Mobile+View" alt="Visão Mobile" width="380"/>
    <img src="https://via.placeholder.com/380x700?text=Mensagens+Tempo+Real" alt="Mensagens em Tempo Real" width="380"/>
  </div>
  <p><em>Visualizações em dispositivos móveis</em></p>
</div>

## 🛠 Tecnologias Utilizadas

- **Frontend**: React 18, Vite, TailwindCSS, Material UI  
- **Backend & Serviços**: Firebase Authentication, Firestore, Realtime Database  
- **Criptografia**: Signal Protocol para mensagens seguras  
- **Pagamentos**: Stripe  
- **Qualidade de Código**: ESLint, Prettier, Husky, lint-staged  
- **Testes**: Vitest  
- **CI/CD**: GitHub Actions, Semantic Release  
- **Deploy**: Vercel

## 🚀 Instalação e Configuração

### Pré-requisitos

- Node.js v18+  
- npm, yarn ou pnpm  
- Git

### Passos

1. Clone o repositório:
   ```bash
   git clone https://github.com/DonatoReis/Converto.git
   cd Converto
   ```
2. Instale as dependências:
   ```bash
   npm install
   # ou
   yarn
   # ou
   pnpm install
   ```
3. Configure variáveis de ambiente:
   - Crie um arquivo `.env.local` na raiz com as chaves:
     ```
     VITE_FIREBASE_API_KEY=...
     VITE_FIREBASE_AUTH_DOMAIN=...
     VITE_FIREBASE_PROJECT_ID=...
     VITE_FIREBASE_STORAGE_BUCKET=...
     VITE_FIREBASE_MESSAGING_SENDER_ID=...
     VITE_FIREBASE_APP_ID=...
     VITE_FIREBASE_DATABASE_URL=...
     VITE_STRIPE_PUBLIC_KEY=...
     ```
4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
   Acesse em http://localhost:5173

## 🧑‍💻 Scripts Disponíveis

```bash
npm run dev         # Inicia o modo de desenvolvimento
npm run build       # Gera build de produção
npm run build:ci    # Build para CI
npm run preview     # Pré-visualiza build localmente
npm run lint        # Executa ESLint
npm run lint:fix    # Corrige problemas de lint
npm run test        # Executa testes com Vitest
npm run test:watch  # Testes em modo watch
npm run test:coverage # Gera relatório de cobertura
npm run format      # Formata código com Prettier
npm run format:check# Verifica formatação
npm run prepare     # Instala hooks Husky
npm run commit      # Inicia Commitizen para mensagens convencionais
```

## 🌿 Workflow de Desenvolvimento

- **Branches**:
  - `main`: produção (protegida)  
  - `develop`: desenvolvimento contínuo  
  - `feature/*`: novas funcionalidades  
  - `bugfix/*`: correção de bugs  
  - `docs/*`: documentação  
  - `chore/*`: tarefas de manutenção  
- **Commits**: siga o [Conventional Commits](https://www.conventionalcommits.org)  
  - Exemplo: `feat(auth): adicionar autenticação de dois fatores`

## 🤝 Contribuição

Para contribuir, veja o guia completo: [CONTRIBUTING.md](./CONTRIBUTING.md)

## 📄 Licença

Este projeto está licenciado sob a Licença MIT. Veja o arquivo [LICENSE](./LICENSE) para mais detalhes.

## 📞 Contato e Suporte

Em caso de dúvidas ou problemas, abra uma issue no GitHub ou contate:

- Email: suporte@converto.com  
- Twitter: [@ConvertoApp](https://twitter.com/ConvertoApp)

---

<p align="center">Desenvolvido com ❤️ por Converto Team</p>

