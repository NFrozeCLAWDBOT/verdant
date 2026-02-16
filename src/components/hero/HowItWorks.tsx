import { motion } from 'framer-motion'

const steps = [
  {
    number: '01',
    title: 'Run the script',
    description: 'Download our bash script and run it against your AWS account — or enter read-only credentials directly.',
  },
  {
    number: '02',
    title: 'Analyse',
    description: 'Verdant evaluates your environment against the CIS AWS Foundations Benchmark — 16 security checks across 5 categories.',
  },
  {
    number: '03',
    title: 'Get your scorecard',
    description: 'See your posture score, per-finding details, severity ratings, and remediation steps — all in under 60 seconds.',
  },
]

export function HowItWorks() {
  return (
    <section className="relative py-24 px-4 md:px-8">
      <div className="max-w-6xl mx-auto">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-3xl md:text-4xl font-heading font-bold text-center text-foreground mb-16"
        >
          How It Works
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="glass-panel glass-panel-hover p-8 transition-all duration-300"
            >
              <span className="text-5xl font-heading font-bold text-emerald-vivid/20 mb-4 block">
                {step.number}
              </span>
              <h3 className="text-xl font-heading font-semibold text-foreground mb-3">
                {step.title}
              </h3>
              <p className="text-muted-foreground font-body leading-relaxed">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
