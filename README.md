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

[![Build Status](https://img.shields.io/github/actions/workflow/status/yourusername/meuapp-top/ci.yml?branch=main&style=flat-square)](https://github.com/yourusername/meuapp-top/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/github/package-json/v/yourusername/meuapp-top?style=flat-square)](https://github.com/yourusername/meuapp-top)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg?style=flat-square)](https://conventionalcommits.org)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![Vercel](https://therealsujitk-vercel-badge.vercel.app/?app=meuapp-top&style=flat-square)](https://meuapp-top.vercel.app)

> Modern web application for task management with advanced features including real-time messaging, marketplace functionality, and secure user authentication.

## ✨ Features

- **Secure Authentication**: User registration and login with Firebase Authentication, including email/password and support for 2FA
- **Task Management**: Create, organize, and track tasks with customizable categories and priorities
- **Real-time Messaging**: Encrypted communication between users with Signal Protocol integration
- **Marketplace**: Browse and purchase products with integrated payment processing
- **Profile Management**: Comprehensive user profiles with privacy settings and contact management
- **Smart Search**: Advanced search capabilities across tasks, contacts, and marketplace items
- **Responsive Design**: Full support for mobile, tablet, and desktop devices

## 📸 Screenshots

<div align="center">
  <img src="https://via.placeholder.com/800x450?text=MeuAppTop+Dashboard" alt="Dashboard" width="800"/>
  <p><em>Dashboard view with task management interface</em></p>
  
  <br />
  
  <div style="display: flex; justify-content: space-between;">
    <img src="https://via.placeholder.com/380x700?text=Mobile+View" alt="Mobile View" width="380"/>
    <img src="https://via.placeholder.com/380x700?text=Messaging+Interface" alt="Messaging" width="380"/>
  </div>
  <p><em>Mobile-responsive views of the application</em></p>
</div>

## 🛠️ Technologies

- **Frontend**
  - React 18
  - Vite build tool
  - TailwindCSS for styling
  - Material UI components
  - React Router for navigation
  - Context API for state management

- **Backend & Services**
  - Firebase Authentication
  - Firebase Realtime Database
  - Firebase Firestore
  - Firebase Storage

- **Security & Encryption**
  - Signal Protocol for end-to-end encryption
  - Firebase Security Rules
  - Two-factor authentication support

- **Payment Processing**
  - Stripe integration for secure payments

- **Testing & Quality**
  - Vitest for unit and integration tests
  - ESLint for code quality
  - Prettier for code formatting
  - Husky for Git hooks

- **CI/CD & Deployment**
  - GitHub Actions for CI/CD
  - Vercel for hosting and deployment

## 📦 Installation

### Prerequisites

- Node.js (v18+)
- npm, yarn, or pnpm
- Git

### Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/meuapp-top.git
cd meuapp-top
```

2. Install dependencies:

```bash
# Using npm
npm install

# Using yarn
yarn

# Using pnpm
pnpm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory with the following variables:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=your_database_url
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
```

4. Start the development server:

```bash
npm run dev
```

The application will be available at http://localhost:5173.

## 🧑‍💻 Development Workflow

### Branch Naming Convention

- `feature/name-of-feature` - For new features
- `bugfix/issue-description` - For bug fixes
- `docs/what-was-documented` - For documentation changes
- `refactor/what-was-refactored` - For code refactoring
- `chore/description` - For maintenance tasks

### Commit Guidelines

This project follows [Conventional Commits](https://www.conventionalcommits.org/) specification. You can use our configured Commitizen to help format your commit messages:

```bash
npm run commit
```

### Testing

Run tests with:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Code Formatting

```bash
# Format code
npm run format

# Check formatting
npm run format:check

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

## 🚀 Deployment

### Automatic Deployment

Merging to the `main` branch will automatically trigger a deployment to Vercel through our GitHub Actions workflow.

### Manual Deployment

If needed, you can manually deploy using:

```bash
# Build for production
npm run build

# Preview the production build locally
npm run preview
```

## 👥 Contributing

Contributions are welcome! Please check out our [Contributing Guidelines](./CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

### Getting Started with Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes using conventional commits (`npm run commit`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 📞 Support

If you have any questions or need help with MeuAppTop, please open an issue on GitHub or contact the maintainers at:

- Email: support@meuapptop.com
- Twitter: [@MeuAppTop](https://twitter.com/MeuAppTop)

---

<div align="center">
  <p>Made with ❤️ by MeuAppTop Team</p>
  <p>
    <a href="https://github.com/yourusername/meuapp-top/stargazers">⭐ Star us on GitHub</a>
  </p>
</div>
