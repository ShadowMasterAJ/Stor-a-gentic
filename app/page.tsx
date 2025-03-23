import Hero from '@/components/Hero';
import ChatWidget from '@/components/ChatWidget';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted">
      <Hero />
      <ChatWidget />
    </main>
  );
}