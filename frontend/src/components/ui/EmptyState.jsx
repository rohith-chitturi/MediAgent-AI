import { motion } from 'framer-motion';

export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-[var(--color-border-2)] rounded-[var(--radius-xl)] bg-[var(--color-surface)]"
    >
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-[var(--color-surface-2)] flex items-center justify-center mb-4 shadow-sm">
          <Icon className="w-8 h-8 text-[var(--color-text-muted)]" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--color-text-secondary)] max-w-sm mx-auto mb-6">
        {description}
      </p>
      {action && (
        <div>{action}</div>
      )}
    </motion.div>
  );
}
