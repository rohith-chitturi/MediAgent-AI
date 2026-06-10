import { motion } from 'framer-motion';
import useAuthStore from '../../store/authStore';

export default function WelcomeHeader({ title, subtitle, customGreeting }) {
  const { user } = useAuthStore();

  const greeting = customGreeting || `Good Morning, ${user?.name?.split(' ')[0] || 'User'}`;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
        {title || greeting}
      </h1>
      <p className="text-sm text-[var(--color-text-secondary)] mt-1">
        {subtitle}
      </p>
    </motion.div>
  );
}
