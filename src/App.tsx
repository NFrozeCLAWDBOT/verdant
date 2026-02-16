import { HeroSection } from '@/components/hero/HeroSection'
import { HowItWorks } from '@/components/hero/HowItWorks'
import { Footer } from '@/components/layout/Footer'

export default function App() {
  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <HowItWorks />
      <Footer />
    </div>
  )
}
