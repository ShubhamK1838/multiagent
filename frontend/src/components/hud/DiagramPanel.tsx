import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export interface DiagramItem {
  label: string;
  kind: 'dir' | 'file';
  depth: number;
}

export interface DiagramData {
  title: string;
  items: DiagramItem[];
}

interface DiagramPanelProps {
  data: DiagramData;
  onClose: () => void;
}

// ── Tree builder ──────────────────────────────────────────────────────────────
interface TreeNode {
  label: string;
  kind: 'dir' | 'file';
  depth: number;
  idx: number;
  children: TreeNode[];
}

function buildTree(items: DiagramItem[]): TreeNode[] {
  const roots: TreeNode[] = [];
  const stack: TreeNode[] = [];

  items.forEach((item, idx) => {
    const node: TreeNode = { ...item, idx, children: [] };

    // Pop stack until we find the parent depth
    while (stack.length > 0 && stack[stack.length - 1].depth >= item.depth) {
      stack.pop();
    }

    if (stack.length === 0) {
      roots.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }
    stack.push(node);
  });

  return roots;
}

// ── Single tree row ───────────────────────────────────────────────────────────
interface RowProps {
  node: TreeNode;
  isLast: boolean;
  ancestorHasMore: boolean[];
  expanded: Set<number>;
  onToggle: (idx: number) => void;
}

const FILE_EXT_COLORS: Record<string, string> = {
  ts: '#3b82f6', tsx: '#06b6d4', js: '#f59e0b', jsx: '#f97316',
  json: '#a3e635', md: '#e879f9', java: '#ef4444', sql: '#10b981',
  css: '#818cf8', html: '#f97316', py: '#facc15', txt: '#94a3b8',
  xml: '#fb923c', yml: '#34d399', yaml: '#34d399', sh: '#4ade80',
};

function fileColor(label: string): string {
  const ext = label.split('.').pop()?.toLowerCase() ?? '';
  return FILE_EXT_COLORS[ext] ?? '#64748b';
}

const TreeRow: React.FC<RowProps> = ({ node, isLast, ancestorHasMore, expanded, onToggle }) => {
  const isDir = node.kind === 'dir';
  const isOpen = expanded.has(node.idx);
  const hasChildren = node.children.length > 0;

  return (
    <>
      <div
        className={`flex items-center min-w-0 leading-[1.65] rounded-sm transition-colors px-1 ${
          isDir && hasChildren ? 'cursor-pointer hover:bg-cyan-400/8' : ''
        }`}
        onClick={() => isDir && hasChildren && onToggle(node.idx)}
        title={node.label}
      >
        {/* Vertical guides from ancestors */}
        {ancestorHasMore.map((has, i) => (
          <span
            key={i}
            className="shrink-0 font-mono text-[11px] select-none whitespace-pre"
            style={{ color: has ? 'rgba(0,212,255,0.22)' : 'transparent' }}
          >
            {'│  '}
          </span>
        ))}

        {/* Branch connector */}
        <span
          className="shrink-0 font-mono text-[11px] select-none whitespace-pre"
          style={{ color: 'rgba(0,212,255,0.45)' }}
        >
          {isLast ? '└─ ' : '├─ '}
        </span>

        {/* Expand/collapse chevron for dirs */}
        {isDir && hasChildren ? (
          <span
            className="shrink-0 text-[8px] mr-1 text-cyan-400/60 transition-transform duration-150"
            style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', display: 'inline-block' }}
          >
            ▶
          </span>
        ) : (
          <span className="shrink-0 w-[13px]" />
        )}

        {/* Icon */}
        <span className="shrink-0 text-[10px] select-none mr-1.5">
          {isDir
            ? <span style={{ color: isOpen ? '#fbbf24' : '#d97706' }}>{isOpen ? '📂' : '📁'}</span>
            : <span style={{ color: fileColor(node.label), fontSize: '8px' }}>◈</span>
          }
        </span>

        {/* Label */}
        <span
          className={`font-mono text-[11px] truncate min-w-0 ${
            isDir ? 'text-cyan-100/90 font-medium' : 'text-cyan-100/60'
          }`}
          style={!isDir ? { color: fileColor(node.label) + 'cc' } : {}}
        >
          {node.label}
        </span>

        {/* Child count badge */}
        {isDir && hasChildren && (
          <span className="shrink-0 ml-1.5 text-[8px] font-mono text-cyan-400/35 tabular-nums">
            {node.children.length}
          </span>
        )}
      </div>

      {/* Children */}
      <AnimatePresence initial={false}>
        {isDir && isOpen && (
          <motion.div
            key="children"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            {node.children.map((child, i) => (
              <TreeRow
                key={child.idx}
                node={child}
                isLast={i === node.children.length - 1}
                ancestorHasMore={[...ancestorHasMore, !isLast]}
                expanded={expanded}
                onToggle={onToggle}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// ── Main panel ────────────────────────────────────────────────────────────────
export const DiagramPanel: React.FC<DiagramPanelProps> = ({ data, onClose }) => {
  const roots = useMemo(() => buildTree(data.items), [data.items]);

  // Default: expand only the root nodes
  const [expanded, setExpanded] = useState<Set<number>>(() => {
    const s = new Set<number>();
    roots.forEach(r => { if (r.kind === 'dir') s.add(r.idx); });
    return s;
  });

  const [filter, setFilter] = useState('');

  const toggle = (idx: number) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  // Flatten for filter mode
  const flatFiltered = useMemo(() => {
    if (!filter.trim()) return null;
    const q = filter.toLowerCase();
    return data.items.filter(item => item.label.toLowerCase().includes(q));
  }, [filter, data.items]);

  const totalFiles = data.items.filter(i => i.kind === 'file').length;
  const totalDirs  = data.items.filter(i => i.kind === 'dir').length;

  return (
    <motion.div
      drag
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.88, transition: { duration: 0.14 } }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      style={{
        position: 'fixed',
        left: 64,
        top: 110,
        zIndex: 60,
        width: 420,
        maxHeight: '78vh',
        background: 'linear-gradient(150deg, rgba(0,6,18,0.97) 0%, rgba(0,15,35,0.95) 100%)',
        border: '1px solid rgba(0,212,255,0.20)',
        boxShadow: '0 16px 60px rgba(0,0,0,0.7), 0 0 40px rgba(0,212,255,0.04)',
        backdropFilter: 'blur(20px)',
      }}
      className="flex flex-col rounded-sm overflow-hidden pointer-events-auto"
    >
      {/* Scanline */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.015]"
        style={{ background: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,212,255,1) 2px,rgba(0,212,255,1) 3px)' }}
      />

      {/* Corner brackets */}
      {[['top-0 left-0','border-t border-l'],['top-0 right-0','border-t border-r'],
        ['bottom-0 left-0','border-b border-l'],['bottom-0 right-0','border-b border-r']
       ].map(([pos, b]) => (
        <div key={pos} className={`absolute ${pos} w-3 h-3 ${b} border-cyan-400/30 pointer-events-none`} />
      ))}

      {/* ── Header ── */}
      <div
        className="relative flex items-center gap-2 px-3 py-2 shrink-0 cursor-grab active:cursor-grabbing"
        style={{ borderBottom: '1px solid rgba(0,212,255,0.12)' }}
      >
        <motion.div
          className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"
          animate={{ opacity: [0.5,1,0.5] }}
          transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
          style={{ boxShadow: '0 0 6px rgba(0,212,255,0.8)' }}
        />
        <span className="text-[9px] font-mono uppercase tracking-[0.22em] text-cyan-400/80 truncate flex-1 min-w-0">
          {data.title}
        </span>
        <span className="shrink-0 text-[8px] font-mono text-cyan-400/35 tabular-nums">
          {totalDirs}d · {totalFiles}f
        </span>
        <button
          onClick={onClose}
          onPointerDown={e => e.stopPropagation()}
          className="shrink-0 w-5 h-5 flex items-center justify-center rounded-sm text-cyan-500/35
                     hover:text-red-400/90 hover:bg-red-400/10 transition-colors text-[9px] font-mono"
        >✕</button>
      </div>

      {/* ── Search ── */}
      <div
        className="px-2 py-1.5 shrink-0"
        style={{ borderBottom: '1px solid rgba(0,212,255,0.08)' }}
        onPointerDown={e => e.stopPropagation()}
      >
        <input
          type="text"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Filter..."
          className="w-full bg-cyan-950/30 border border-cyan-500/15 rounded-sm
                     px-2 py-0.5 text-[10px] font-mono text-cyan-100/80
                     placeholder-cyan-700/50 outline-none focus:border-cyan-400/40 transition-colors"
        />
      </div>

      {/* ── Tree / Filter results ── */}
      <div
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-1.5 px-2
                   scrollbar-thin scrollbar-track-transparent scrollbar-thumb-cyan-900/40"
        onPointerDown={e => e.stopPropagation()}
      >
        {flatFiltered ? (
          // Search results — flat list
          flatFiltered.length === 0 ? (
            <p className="text-[10px] font-mono text-cyan-400/35 px-1 py-2">No matches.</p>
          ) : (
            flatFiltered.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 px-1 py-0.5 hover:bg-cyan-400/5 rounded-sm">
                <span className="text-[9px]" style={{ color: item.kind === 'dir' ? '#d97706' : fileColor(item.label) }}>
                  {item.kind === 'dir' ? '📁' : '◈'}
                </span>
                <span
                  className="font-mono text-[11px] truncate"
                  style={{ color: item.kind === 'dir' ? 'rgba(207,250,254,0.88)' : fileColor(item.label) + 'bb' }}
                  title={item.label}
                >
                  {item.label}
                </span>
              </div>
            ))
          )
        ) : (
          // Tree view
          roots.map((root, i) => (
            <TreeRow
              key={root.idx}
              node={root}
              isLast={i === roots.length - 1}
              ancestorHasMore={[]}
              expanded={expanded}
              onToggle={toggle}
            />
          ))
        )}
      </div>

      {/* ── Footer ── */}
      <div
        className="px-3 py-1.5 shrink-0 flex items-center justify-between"
        style={{ borderTop: '1px solid rgba(0,212,255,0.08)' }}
      >
        <span className="text-[8px] font-mono text-cyan-400/25 uppercase tracking-widest">
          click dirs to expand
        </span>
        <button
          onPointerDown={e => e.stopPropagation()}
          onClick={() => {
            const allIdxs = new Set(data.items.map((_, i) => i).filter(i => data.items[i].kind === 'dir'));
            setExpanded(prev => prev.size === allIdxs.size ? new Set() : allIdxs);
          }}
          className="text-[8px] font-mono text-cyan-400/35 hover:text-cyan-300/70 transition-colors uppercase tracking-widest"
        >
          expand all
        </button>
      </div>
    </motion.div>
  );
};
