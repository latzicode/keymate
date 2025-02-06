'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface EncryptionVisualizerProps {
  originalMessage: string;
  encryptedMessage: string;
  isEncrypting: boolean;
  selectedKeyName?: string;
}

export default function EncryptionVisualizer({
  originalMessage,
  encryptedMessage,
  isEncrypting,
  selectedKeyName
}: EncryptionVisualizerProps) {
  const [showEncrypted, setShowEncrypted] = useState(false);

  useEffect(() => {
    if (isEncrypting) {
      const timer = setTimeout(() => setShowEncrypted(true), 1000);
      return () => clearTimeout(timer);
    }
    setShowEncrypted(false);
  }, [isEncrypting]);

  return (
    <div className="relative p-4 bg-card/30 rounded-lg backdrop-blur-sm">
      <AnimatePresence mode="wait">
        {isEncrypting && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="space-y-2 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-primary rounded-full border-t-transparent" />
              <div className="text-sm text-muted">
                Chiffrement en cours avec la clé {selectedKeyName}...
              </div>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={false}
          animate={{ 
            scale: showEncrypted ? 0.9 : 1,
            opacity: showEncrypted ? 0.5 : 1 
          }}
          className="space-y-4"
        >
          <div>
            <h4 className="text-sm font-medium text-muted mb-2">Message original</h4>
            <div className="p-3 bg-background/50 rounded border border-border">
              {originalMessage || "Aucun message"}
            </div>
          </div>

          {showEncrypted && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h4 className="text-sm font-medium text-muted mb-2">Message chiffré</h4>
              <div className="p-3 bg-primary/5 rounded border border-primary/20 font-mono text-xs">
                {encryptedMessage}
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
