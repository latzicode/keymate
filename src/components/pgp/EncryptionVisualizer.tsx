'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface EncryptionVisualizerProps {
  originalMessage: string;
  encryptedMessage: string;
  isEncrypting: boolean;
  selectedKeyName?: string;
  className?: string;
}

export default function EncryptionVisualizer({
  originalMessage,
  encryptedMessage,
  isEncrypting,
  selectedKeyName,
  className
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
    <div className={`relative p-4 bg-card/30 rounded-lg backdrop-blur-sm ${className || ''}`}>
      <AnimatePresence mode="wait">
        {isEncrypting ? (
          <motion.div
            key="encrypting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-sm"
          >
            Chiffrement en cours...
          </motion.div>
        ) : encryptedMessage ? (
          <motion.div
            key="encrypted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <pre className="text-xs overflow-auto">{encryptedMessage}</pre>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
