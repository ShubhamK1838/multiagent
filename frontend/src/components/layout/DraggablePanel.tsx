import React from 'react';
import { motion } from 'framer-motion';

interface DraggablePanelProps {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
  title?: string;
  onPositionChange: (id: string, x: number, y: number) => void;
  onFocus: (id: string) => void;
  children: React.ReactNode;
}

export const DraggablePanel: React.FC<DraggablePanelProps> = ({
  id, x, y, width, height, zIndex, title,
  onPositionChange, onFocus, children
}) => {
  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragEnd={(_, info) => {
        onPositionChange(id, x + info.offset.x, y + info.offset.y);
      }}
      onPointerDown={() => onFocus(id)}
      initial={{ x, y, opacity: 0 }}
      animate={{ x, y, opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15, type: 'spring', bounce: 0, opacity: { duration: 0.2 } }}
      style={{
        position: 'absolute',
        width,
        height,
        zIndex,
      }}
      className="flex flex-col rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-md"
    >
      {/* Drag Handle */}
      <div 
        className="h-6 bg-cyan-900/40 border-b border-cyan-500/20 flex items-center justify-between px-3 cursor-grab active:cursor-grabbing shrink-0"
      >
        <div className="flex gap-1.5 items-center">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/50" />
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/50" />
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/50" />
        </div>
        {title && (
          <span className="text-[9px] uppercase tracking-widest text-cyan-400/70 font-mono">
            {title}
          </span>
        )}
        <div className="w-4" /> {/* Spacer for symmetry */}
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden bg-black/40 pointer-events-auto">
        {/* We stop propagation of pointer down on children so we don't drag when interacting with content */}
        <div 
          className="absolute inset-0"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </motion.div>
  );
};
