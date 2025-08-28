import Image from 'next/image';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
          Welcome to your new app
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          Get started by editing{' '}
          <code className="rounded-md bg-muted px-2 py-1 font-mono text-sm">
            src/app/page.tsx
          </code>
        </p>
      </div>
    </main>
  );
}
