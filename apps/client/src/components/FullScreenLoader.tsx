import { motion } from 'framer-motion';

export function FullScreenLoader({ message, progress }: { message: string; progress?: number }) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center bg-white p-6 rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-black/5"
      >
        <div className="relative w-16 h-16 mb-4">
          <svg className="animate-spin w-full h-full text-orange-500" viewBox="0 0 50 50">
            <circle className="opacity-20" cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="4" />
            <circle cx="25" cy="25" r="20" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeDasharray="90 150" strokeDashoffset="0" />
          </svg>
          {progress !== undefined && (
            <div className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-orange-700">
              {Math.round(progress)}%
            </div>
          )}
        </div>
        <div className="text-sm font-medium text-black/80">{message}</div>
      </motion.div>
    </div>
  );
}
