import { motion } from 'framer-motion'
import { Shield } from 'lucide-react'

export function PrivacySection() {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="py-16 px-4 md:px-8"
    >
      <div className="max-w-3xl mx-auto glass-panel p-8 md:p-12 text-center">
        <Shield className="h-10 w-10 text-emerald-vivid mx-auto mb-4" />
        <h2 className="text-2xl font-heading font-bold text-foreground mb-4">
          Your credentials never leave your machine
        </h2>
        <p className="text-muted-foreground font-body leading-relaxed">
          Verdant is offline-first by design. The recommended workflow runs a bash script on your
          local machine and uploads only the JSON snapshot — no credentials transmitted. If you
          choose online mode, credentials exist only in Lambda execution memory for the duration
          of the scan and are never stored, logged, or persisted.
        </p>
      </div>
    </motion.section>
  )
}
