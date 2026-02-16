import { motion } from 'framer-motion'

export function HeroSection() {
  const scrollToScan = () => {
    document.getElementById('scan-interface')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative h-screen w-full overflow-hidden flex items-center justify-center">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        src="/verdant-hero.mp4"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0F0A] via-[#0A0F0A]/60 to-transparent" />
      <div className="absolute inset-0 bg-[#0A0F0A]/30" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 glass-panel px-8 py-12 md:px-16 md:py-16 max-w-2xl mx-4 text-center"
      >
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-4">
          Verdant
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground font-body mb-2">
          AWS Security Posture Dashboard
        </p>
        <p className="text-2xl md:text-3xl font-heading font-semibold text-emerald-vivid mb-10">
          Know your cloud.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={scrollToScan}
            className="gradient-cta px-8 py-3 rounded-xl text-foreground font-heading font-semibold text-lg transition-all duration-300 cursor-pointer"
          >
            Upload JSON
          </button>
          <button
            onClick={scrollToScan}
            className="px-8 py-3 rounded-xl border border-emerald-vivid/30 text-emerald-vivid font-heading font-semibold text-lg hover:bg-emerald-vivid/10 transition-all duration-300 cursor-pointer"
          >
            Scan with Credentials
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
      >
        <div className="w-6 h-10 rounded-full border-2 border-emerald-vivid/30 flex items-start justify-center p-2">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-1.5 rounded-full bg-emerald-vivid"
          />
        </div>
      </motion.div>
    </section>
  )
}
