import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { GestureType } from '../../hooks/useWebcamGestures';
import { useWebcamGestures } from '../../hooks/useWebcamGestures';

// --- SVG Icons for Hand Cursor ---
const OpenHandIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_8px_rgba(0,212,255,0.8)]">
    <path d="M18 11V6a2 2 0 0 0-4 0v4" />
    <path d="M14 10V5a2 2 0 0 0-4 0v5" />
    <path d="M10 10.5V6a2 2 0 0 0-4 0v7.5" />
    <path d="M6 13.5v-2a2 2 0 0 0-4 0v4.5a7.5 7.5 0 0 0 15 0V12a2 2 0 0 0-4 0" />
  </svg>
);

const FistIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_12px_rgba(239,68,68,0.8)]">
    <path d="M10 14V5a2 2 0 0 1 4 0v4" />
    <path d="M14 13V7a2 2 0 0 1 4 0v4" />
    <path d="M18 13v-1a2 2 0 0 1 4 0v5a7.5 7.5 0 0 1-15 0V11a2 2 0 0 1 4 0v3" />
    <path d="M10 14H6" />
  </svg>
);

const PinchIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-[0_0_12px_rgba(0,255,136,0.8)]">
    <path d="M8 13V5a2 2 0 0 1 4 0v4" />
    <path d="M12 11V7a2 2 0 0 1 4 0v4" />
    <path d="M16 12v-1a2 2 0 0 1 4 0v5a7.5 7.5 0 0 1-15 0V11a2 2 0 0 1 4 0v2" />
  </svg>
);

export interface AIAnnotation {
  x: number;
  y: number;
  text: string;
  color?: string;
}

interface GestureCanvasProps {
  isDrawingMode: boolean;
  annotations: AIAnnotation[];
  onCanvasData: (base64: string) => void;
  clearCount: number;
  onGesture?: (g: GestureType) => void;
  onPanelDrag?: (x: number, y: number) => void;
  onPanelScale?: (scaleDelta: number) => void;
  onDragEnd?: (x: number, y: number) => void;
  enabled?: boolean;
  smartShapes?: boolean;
}

const TRASH_ZONE_SIZE = 150;

const TrashIcon = ({ isHovering }: { isHovering: boolean }) => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
       className={`transition-all duration-200 ${isHovering ? 'text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,1)] scale-110' : 'text-cyan-600/50 drop-shadow-[0_0_8px_rgba(0,212,255,0.3)]'}`}>
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
    <line x1="10" x2="10" y1="11" y2="17" />
    <line x1="14" x2="14" y1="11" y2="17" />
  </svg>
);

type Point = { x: number; y: number };
type ShapeType = 'path' | 'circle' | 'rectangle' | 'line';
interface Bounds { minX: number; minY: number; maxX: number; maxY: number; }

interface VectorShape {
  id: string;
  type: ShapeType;
  color: string;
  bounds: Bounds;
  points?: Point[];
  cx?: number; cy?: number; radius?: number;
  x?: number; y?: number; width?: number; height?: number;
  x1?: number; y1?: number; x2?: number; y2?: number;
}

export const GestureCanvas: React.FC<GestureCanvasProps> = ({
  isDrawingMode,
  annotations,
  onCanvasData,
  clearCount,
  onGesture,
  onPanelDrag,
  onPanelScale,
  onDragEnd,
  enabled = true,
  smartShapes = true
}) => {
  const { cursors } = useWebcamGestures({ onGesture, enabled });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  
  const shapesRef = useRef<VectorShape[]>([]);
  const currentPathRef = useRef<Point[]>([]);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const draggingShapeIdRef = useRef<string | null>(null);
  const lastPrimaryCursorRef = useRef<Point | null>(null);
  const scaleStartDataRef = useRef<{ initialDist: number, shapeId: string | null } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = 4;
        contextRef.current = ctx;
        drawFrame();
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    if (clearCount > 0) {
      shapesRef.current = [];
      currentPathRef.current = [];
      drawFrame();
      onCanvasData('');
    }
  }, [clearCount, onCanvasData]);

  const drawFrame = useCallback(() => {
    const ctx = contextRef.current;
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (const shape of shapesRef.current) {
      ctx.beginPath();
      ctx.strokeStyle = shape.color;
      ctx.lineWidth = 4;

      if (shape.type === 'path' && shape.points && shape.points.length > 0) {
        ctx.moveTo(shape.points[0].x, shape.points[0].y);
        for (let i = 1; i < shape.points.length; i++) {
          ctx.lineTo(shape.points[i].x, shape.points[i].y);
        }
      } else if (shape.type === 'circle' && shape.cx !== undefined && shape.cy !== undefined && shape.radius !== undefined) {
        ctx.arc(shape.cx, shape.cy, shape.radius, 0, Math.PI * 2);
      } else if (shape.type === 'rectangle' && shape.x !== undefined && shape.y !== undefined && shape.width !== undefined && shape.height !== undefined) {
        ctx.rect(shape.x, shape.y, shape.width, shape.height);
      } else if (shape.type === 'line' && shape.x1 !== undefined && shape.y1 !== undefined && shape.x2 !== undefined && shape.y2 !== undefined) {
        ctx.moveTo(shape.x1, shape.y1);
        ctx.lineTo(shape.x2, shape.y2);
      }
      ctx.stroke();
    }

    const currentPath = currentPathRef.current;
    if (currentPath.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = '#00d4ff';
      ctx.lineWidth = 4;
      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i].x, currentPath[i].y);
      }
      ctx.stroke();
    }
  }, []);

  const recognizeShape = (points: Point[]): VectorShape => {
    const minX = Math.min(...points.map(p => p.x));
    const maxX = Math.max(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y));
    const maxY = Math.max(...points.map(p => p.y));
    const width = maxX - minX;
    const height = maxY - minY;
    const bounds = { minX, minY, maxX, maxY };
    const id = Date.now().toString();
    const color = '#00d4ff';

    if (!smartShapes || points.length < 10) return { id, type: 'path', points, color, bounds };

    const p0 = points[0];
    const pN = points[points.length - 1];
    const distEnds = Math.hypot(pN.x - p0.x, pN.y - p0.y);
    let maxDevLine = 0;
    for (const p of points) {
      const num = Math.abs((pN.y - p0.y)*p.x - (pN.x - p0.x)*p.y + pN.x*p0.y - pN.y*p0.x);
      const dev = num / distEnds;
      if (dev > maxDevLine) maxDevLine = dev;
    }
    if (maxDevLine < 20 && distEnds > 50) return { id, type: 'line', x1: p0.x, y1: p0.y, x2: pN.x, y2: pN.y, color, bounds };

    const cx = minX + width / 2;
    const cy = minY + height / 2;
    const avgRadius = points.reduce((acc, p) => acc + Math.hypot(p.x - cx, p.y - cy), 0) / points.length;
    let maxDevCircle = 0;
    for (const p of points) {
      const dev = Math.abs(Math.hypot(p.x - cx, p.y - cy) - avgRadius);
      if (dev > maxDevCircle) maxDevCircle = dev;
    }
    if (maxDevCircle / avgRadius < 0.3 && width > 40) return { id, type: 'circle', cx, cy, radius: avgRadius, color, bounds };

    let isRect = true;
    for (const p of points) {
      if (Math.abs(p.x - minX) >= 30 && Math.abs(p.x - maxX) >= 30 && Math.abs(p.y - minY) >= 30 && Math.abs(p.y - maxY) >= 30) {
        isRect = false; break;
      }
    }
    if (isRect && width > 40) return { id, type: 'rectangle', x: minX, y: minY, width, height, color, bounds };

    return { id, type: 'path', points, color, bounds };
  };

  const getIntersectingShapeId = (x: number, y: number): string | null => {
    for (let i = shapesRef.current.length - 1; i >= 0; i--) {
      const b = shapesRef.current[i].bounds;
      if (x >= b.minX - 20 && x <= b.maxX + 20 && y >= b.minY - 20 && y <= b.maxY + 20) return shapesRef.current[i].id;
    }
    return null;
  };

  const moveShape = (id: string, dx: number, dy: number) => {
    const shape = shapesRef.current.find(s => s.id === id);
    if (!shape) return;
    shape.bounds.minX += dx; shape.bounds.maxX += dx; shape.bounds.minY += dy; shape.bounds.maxY += dy;
    if (shape.type === 'path' && shape.points) shape.points.forEach(p => { p.x += dx; p.y += dy; });
    else if (shape.type === 'circle' && shape.cx !== undefined && shape.cy !== undefined) { shape.cx += dx; shape.cy += dy; }
    else if (shape.type === 'rectangle' && shape.x !== undefined && shape.y !== undefined) { shape.x += dx; shape.y += dy; }
    else if (shape.type === 'line' && shape.x1 !== undefined && shape.y1 !== undefined && shape.x2 !== undefined && shape.y2 !== undefined) {
      shape.x1 += dx; shape.y1 += dy; shape.x2 += dx; shape.y2 += dy;
    }
  };

  const scaleShape = (id: string, scaleFactor: number) => {
    const shape = shapesRef.current.find(s => s.id === id);
    if (!shape) return;
    
    // Calculate centroid
    let cx = 0, cy = 0;
    if (shape.type === 'circle' && shape.cx !== undefined && shape.cy !== undefined) {
      cx = shape.cx; cy = shape.cy;
    } else {
      cx = shape.bounds.minX + (shape.bounds.maxX - shape.bounds.minX) / 2;
      cy = shape.bounds.minY + (shape.bounds.maxY - shape.bounds.minY) / 2;
    }

    const scalePoint = (p: Point) => ({ x: cx + (p.x - cx) * scaleFactor, y: cy + (p.y - cy) * scaleFactor });

    if (shape.type === 'path' && shape.points) {
      shape.points = shape.points.map(scalePoint);
    } else if (shape.type === 'circle' && shape.radius !== undefined) {
      shape.radius *= scaleFactor;
    } else if (shape.type === 'rectangle' && shape.x !== undefined && shape.y !== undefined && shape.width !== undefined && shape.height !== undefined) {
      const p1 = scalePoint({ x: shape.x, y: shape.y });
      const p2 = scalePoint({ x: shape.x + shape.width, y: shape.y + shape.height });
      shape.x = p1.x; shape.y = p1.y;
      shape.width = p2.x - p1.x; shape.height = p2.y - p1.y;
    } else if (shape.type === 'line' && shape.x1 !== undefined && shape.y1 !== undefined && shape.x2 !== undefined && shape.y2 !== undefined) {
      const p1 = scalePoint({ x: shape.x1, y: shape.y1 });
      const p2 = scalePoint({ x: shape.x2, y: shape.y2 });
      shape.x1 = p1.x; shape.y1 = p1.y; shape.x2 = p2.x; shape.y2 = p2.y;
    }
    
    // update bounds
    const pMin = scalePoint({ x: shape.bounds.minX, y: shape.bounds.minY });
    const pMax = scalePoint({ x: shape.bounds.maxX, y: shape.bounds.maxY });
    shape.bounds = { minX: pMin.x, minY: pMin.y, maxX: pMax.x, maxY: pMax.y };
  };

  useEffect(() => {
    if (!enabled || cursors.length === 0) return;

    const primary = cursors[0];
    const secondary = cursors.length > 1 ? cursors[1] : null;

    const x = primary.x; const y = primary.y;
    const lx = lastPrimaryCursorRef.current?.x ?? x;
    const ly = lastPrimaryCursorRef.current?.y ?? y;
    const dx = x - lx; const dy = y - ly;
    lastPrimaryCursorRef.current = { x, y };

    // --- TWO-HANDED SCALING LOGIC ---
    if (primary.isGrabbing && secondary && secondary.isGrabbing) {
      const currentDist = Math.hypot(primary.x - secondary.x, primary.y - secondary.y);
      if (!scaleStartDataRef.current) {
        // Start dual-hand scale
        const shapeId = draggingShapeIdRef.current || getIntersectingShapeId(x, y);
        scaleStartDataRef.current = { initialDist: currentDist, shapeId };
      } else {
        const { initialDist, shapeId } = scaleStartDataRef.current;
        const scaleFactor = currentDist / initialDist;
        
        if (shapeId) {
          scaleShape(shapeId, scaleFactor);
        } else if (onPanelScale) {
          onPanelScale(scaleFactor);
        }
        // reset base distance for relative incremental scaling
        scaleStartDataRef.current.initialDist = currentDist;
      }
      drawFrame();
      return; // Skip normal dragging/drawing if we are scaling
    } else {
      scaleStartDataRef.current = null;
    }

    // --- DRAWING LOGIC ---
    if (isDrawingMode && !primary.isGrabbing) {
      if (primary.isPinching) {
        if (!isDrawing) {
          currentPathRef.current = [{ x, y }];
          setIsDrawing(true);
        } else {
          currentPathRef.current.push({ x, y });
        }
      } else if (isDrawing) {
        setIsDrawing(false);
        if (currentPathRef.current.length > 5) {
          shapesRef.current.push(recognizeShape(currentPathRef.current));
        }
        currentPathRef.current = [];
        setTimeout(() => { if (canvasRef.current) onCanvasData(canvasRef.current.toDataURL('image/png')); }, 50);
      }
    }

    // --- DRAGGING LOGIC ---
    if (primary.isGrabbing) {
      if (!draggingShapeIdRef.current) {
        const shapeId = getIntersectingShapeId(x, y);
        if (shapeId) {
          draggingShapeIdRef.current = shapeId;
        } else if (onPanelDrag) {
          onPanelDrag(x, y);
        }
      } else {
        const inTrash = x > window.innerWidth - TRASH_ZONE_SIZE && y > window.innerHeight - TRASH_ZONE_SIZE;
        if (inTrash) {
          // Instantly delete the shape
          shapesRef.current = shapesRef.current.filter(s => s.id !== draggingShapeIdRef.current);
          draggingShapeIdRef.current = null;
          if (canvasRef.current) onCanvasData(canvasRef.current.toDataURL('image/png'));
        } else {
          moveShape(draggingShapeIdRef.current, dx, dy);
        }
      }
    } else {
      if (draggingShapeIdRef.current) {
        draggingShapeIdRef.current = null;
        if (canvasRef.current) onCanvasData(canvasRef.current.toDataURL('image/png'));
      } else if (onDragEnd) {
        onDragEnd(x, y);
      }
    }

    drawFrame();
  }, [cursors, isDrawingMode, isDrawing, enabled, onCanvasData, onPanelDrag, onPanelScale, onDragEnd, drawFrame, smartShapes]);

  // Derived state for Trash Zone UI
  const isHoveringTrash = cursors.some(c => c.isGrabbing && c.x > window.innerWidth - TRASH_ZONE_SIZE && c.y > window.innerHeight - TRASH_ZONE_SIZE);

  return (
    <div className={`absolute inset-0 z-40 ${isDrawingMode ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      <canvas ref={canvasRef} className="w-full h-full" style={{ filter: 'drop-shadow(0 0 8px rgba(0,212,255,0.5))' }} />
      
      {/* Hand Cursors */}
      {cursors.map((cursor) => {
        let Icon = OpenHandIcon;
        let colorClass = 'text-cyan-400';
        if (cursor.isGrabbing) { Icon = FistIcon; colorClass = 'text-red-400'; }
        else if (cursor.isPinching) { Icon = PinchIcon; colorClass = 'text-[#00ff88]'; }

        return (
          <div key={cursor.id}
            className={`absolute pointer-events-none transition-transform duration-75 flex items-center justify-center z-50 ${colorClass}`}
            style={{ 
              left: cursor.x - 14, top: cursor.y - 14,
              transform: `scale(${cursor.isPinching ? 0.9 : cursor.isGrabbing ? 1.1 : 1})`
            }}
          >
            <Icon />
          </div>
        );
      })}

      {/* AI Annotations overlay */}
      {annotations.map((ann, idx) => (
        <div key={idx} className="absolute bg-black/80 border text-[11px] px-2 py-1 rounded shadow-lg backdrop-blur-md max-w-xs font-mono z-50"
          style={{ left: ann.x, top: ann.y, borderColor: ann.color || '#a855f7', color: ann.color || '#d8b4fe' }}>
          <div className="absolute -top-1.5 -left-1.5 w-3 h-3 rounded-full border-2 border-black" style={{ backgroundColor: ann.color || '#a855f7' }} />
          {ann.text}
        </div>
      ))}

      {/* Trash Zone */}
      {cursors.some(c => c.isGrabbing) && (
        <div 
          className="absolute bottom-6 right-6 w-32 h-32 flex items-center justify-center rounded-2xl border-2 border-dashed transition-colors duration-200"
          style={{
            borderColor: isHoveringTrash ? 'rgba(239, 68, 68, 0.8)' : 'rgba(0, 212, 255, 0.3)',
            backgroundColor: isHoveringTrash ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
          }}
        >
          <TrashIcon isHovering={isHoveringTrash} />
        </div>
      )}
    </div>
  );
};
