This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Environment Setup

This project requires an OpenAI API key to function. Follow these steps to set it up:

1. **Get an OpenAI API key**:
   - Go to [OpenAI Platform](https://platform.openai.com/api-keys)
   - Create a new API key

2. **Create environment file**:
   ```bash
   # Create .env.local file in the project root
   echo "OPENAI_API_KEY=your_actual_api_key_here" > .env.local
   ```

3. **Replace the placeholder**:
   - Open `.env.local`
   - Replace `your_actual_api_key_here` with your actual OpenAI API key

## Available Scripts

- `pnpm dev` - Start the development server
- `pnpm build` - Build the application for production
- `pnpm start` - Start the production server
- `pnpm lint` - Run ESLint
- `pnpm docs` - Start the documentation server to view architecture diagrams

## Architecture Documentation

To view the project's architecture diagrams:

```bash
pnpm docs
```

Then open [http://localhost:8000/view-diagrams.html](http://localhost:8000/view-diagrams.html) in your browser.

## Dependency Management

This project uses [pnpm](https://pnpm.io/) as its package manager. To install dependencies, run:
