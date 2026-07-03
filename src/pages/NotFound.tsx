import { Home } from 'lucide-react'
import { Container } from '../components/ui/Container'
import { Button } from '../components/ui/Button'

export function NotFound() {
  return (
    <section className="flex min-h-[70vh] items-center bg-brand-dark text-white">
      <Container className="text-center">
        <div className="font-display text-7xl font-extrabold text-white/90 sm:text-9xl">404</div>
        <h1 className="mt-4 text-2xl font-bold text-white sm:text-3xl">This page wandered off the campus</h1>
        <p className="mx-auto mt-3 max-w-md text-white/70">
          The page you’re looking for doesn’t exist or has moved. Let’s get you back home.
        </p>
        <div className="mt-8 flex justify-center">
          <Button to="/" variant="accent" size="lg">
            <Home className="h-4 w-4" /> Back to Home
          </Button>
        </div>
      </Container>
    </section>
  )
}
