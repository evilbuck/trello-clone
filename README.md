# Trello Clone

A kanban board application inspired by Trello, built to prove that AI can indeed produce useful, polished applications.

## The Origin Story

This project exists to test a claim made on X by [@asaio87](https://x.com/asaio87/status/2048478440983068933):

> "I told Claude to build me a Trello replica. By noon, I maxed out my $100 plan. The app looks really terrible. I think I need thousands of prompts, a team, and several $200 subscriptions to create something useful. This isn't looking good for AI right now"

The implicit assertion: AI-assisted development can't produce useful applications without massive time and money investments.

This project proves otherwise. Built with AI assistance in a single session, it demonstrates that the problem isn't AI—it's methodology. With proper agentic workflows, clear requirements, and iterative refinement, AI can build production-quality applications.

---

## Tech Stack

- **Framework**: Next.js 16.2.4 + React 19
- **Styling**: Tailwind CSS 4
- **Database**: SQLite via Drizzle ORM
- **Drag & Drop**: @hello-pangea/dnd
- **Auth**: JWT + bcrypt
- **State**: TanStack React Query

## Getting Started

### Prerequisites

- Node.js 20+
- npm, yarn, pnpm, or bun

### Installation

1. **Clone the repository**

2. **Install dependencies**

   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and set your secrets:

   ```env
   JWT_SECRET=your-secret-key-here
   ```

4. **Start the development server**

   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

5. **Open in browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

### Database

The project uses SQLite with Drizzle ORM. The database file (`trello-clone.db`) is created automatically on first run.

To reset the database:

```bash
rm trello-clone.db
```

## Project Structure

```
├── app/                 # Next.js app router pages
├── components/          # React components
├── config/              # Configuration files
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
├── features/            # Feature-based modules
├── .env.example         # Environment template
└── drizzle.config.ts    # Drizzle ORM config
```
