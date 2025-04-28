# Contributing to MeuAppTop

Thank you for your interest in contributing to **MeuAppTop**! We welcome all kinds of contributions: new features, bug fixes, documentation, and ideas. Please take a moment to review these guidelines before starting.

---

## 🚀 Project Goals

- Create a modern, scalable, and secure web application for task management.
- Offer real-time, encrypted messaging and integrated marketplace features.
- Maintain excellent code quality, tests, and documentation.
- Foster an inclusive and collaborative open-source community.

---

## 🛠️ Setting up the Local Environment

1. **Clone the repository:**

    ```bash
    git clone https://github.com/yourusername/meuapp-top.git
    cd meuapp-top
    ```

2. **Install dependencies:**

    ```bash
    npm install
    # or
    yarn
    # or
    pnpm install
    ```

3. **Set up environment variables:**

    - Copy `.env.example` to `.env.local` and configure your Firebase, Stripe, and other keys.

4. **Start development server:**

    ```bash
    npm run dev
    # Application runs at http://localhost:5173
    ```

---

## 🌳 Branching Model

- `main` — Production branch (protected).
- `develop` — Integration branch for ongoing development.
- `feature/*` — New features (ex: `feature/chat-encryption`).
- `bugfix/*` — Bug fixes.
- `docs/*` — Documentation improvements.
- `chore/*` — Maintenance chores.
- `refactor/*` — Refactoring code without functionality changes.
- `hotfix/*` — Critical production fixes (based off `main`).

Before starting work, create a new branch:

```bash
git checkout -b feature/your-feature-name
```

---

## 🔀 Pull Request Process

1. **Keep PRs focused**: One logical change per PR.
2. **Include tests**: PRs for code should include relevant tests.
3. **Ensure build passes**: CI must pass before merging.
4. **Link issues**: Reference relevant issues using GitHub keywords (e.g., "Closes #123").
5. **Provide context**: Describe the "what" and "why" in the PR description.

---

## 📝 Commit Message Conventions

We use [Conventional Commits](https://www.conventionalcommits.org):

- Format: `type(scope): description`
  - Examples:
    - `feat(auth): add two-factor authentication`
    - `fix(payments): correct Stripe callback bug`
    - `docs(readme): update screenshots`
- Use the guided CLI: `npm run commit`

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `perf`, `revert`.

---

## ✅ Running Tests & Linters

Before pushing, ensure all tests and linters pass:

```bash
# Lint the code
npm run lint

# Run and watch tests
npm test
npm run test:watch

# Format code
npm run format

# Husky and lint-staged will enforce this on pre-commit as well.
```

---

## 🤝 Code of Conduct

Be kind, inclusive, constructive, and respectful. Please read our [Code of Conduct](./CODE_OF_CONDUCT.md) before participating.

---

## 💬 Getting Help

- Open [issues](https://github.com/yourusername/meuapp-top/issues) for bugs, enhancements, or questions.
- For security concerns, see [SECURITY.md](./SECURITY.md).

---

Thank you for helping make MeuAppTop better! 🚀

