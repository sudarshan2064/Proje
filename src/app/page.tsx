import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
          Welcome to your Next.js App
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          Get started by editing this page.
        </p>
      </div>
    </main>
  );
}
