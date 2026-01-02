import Link from 'next/link'
import { Dumbbell, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="container mx-auto flex h-14 items-center">
        <Link href="/" className="flex items-center gap-2">
          <Dumbbell className="h-6 w-6" />
          <span className="font-bold">GymGo</span>
        </Link>
        <nav className="ml-auto flex gap-4">
          <Button variant="ghost" asChild>
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild>
            <Link href="/register">Get Started</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        <section className="container mx-auto flex flex-col items-center justify-center gap-6 py-24 text-center md:py-32">
          <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
            Your Fitness Journey
            <br />
            <span className="text-muted-foreground">Starts Here</span>
          </h1>
          <p className="max-w-[600px] text-lg text-muted-foreground md:text-xl">
            Track your workouts, set goals, and achieve results. GymGo helps you stay motivated and reach your fitness potential.
          </p>
          <div className="flex gap-4">
            <Button size="lg" asChild>
              <Link href="/register">
                Start Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-6">
        <div className="container flex flex-col items-center justify-center gap-4 md:flex-row md:justify-between">
          <p className="text-sm text-muted-foreground">
            Built with Next.js and Supabase
          </p>
        </div>
      </footer>
    </div>
  )
}
