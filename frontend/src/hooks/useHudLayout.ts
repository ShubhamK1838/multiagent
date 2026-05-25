import { useState, useEffect, useCallback } from 'react';

export interface PanelLayout {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  zIndex: number;
}

export interface HudLayoutState {
  panels: Record<string, PanelLayout>;
}

const STORAGE_KEY = 'jarvis_hud_layout_v3';

const DEFAULT_LAYOUT: HudLayoutState = {
  panels: {
    diagnostics: { id: 'diagnostics', x: 20, y: 20, width: 280, height: window.innerHeight - 120, visible: true, zIndex: 10 },
    logs: { id: 'logs', x: window.innerWidth - 320, y: 20, width: 300, height: window.innerHeight - 120, visible: true, zIndex: 10 },
  }
};

export function useHudLayout() {
  const [layout, setLayout] = useState<HudLayoutState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse HUD layout from localStorage', e);
    }
    return DEFAULT_LAYOUT;
  });

  // Save to localStorage whenever layout changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  }, [layout]);

  const updatePanelPosition = useCallback((id: string, x: number, y: number) => {
    setLayout(prev => ({
      ...prev,
      panels: {
        ...prev.panels,
        [id]: { ...prev.panels[id], x, y }
      }
    }));
  }, []);

  const updatePanelSize = useCallback((id: string, width: number, height: number) => {
    setLayout(prev => ({
      ...prev,
      panels: {
        ...prev.panels,
        [id]: { ...prev.panels[id], width, height }
      }
    }));
  }, []);

  const togglePanelVisibility = useCallback((id: string) => {
    setLayout(prev => ({
      ...prev,
      panels: {
        ...prev.panels,
        [id]: { ...prev.panels[id], visible: !prev.panels[id].visible }
      }
    }));
  }, []);

  const bringToFront = useCallback((id: string) => {
    setLayout(prev => {
      const maxZ = Math.max(...Object.values(prev.panels).map(p => p.zIndex || 0));
      return {
        ...prev,
        panels: {
          ...prev.panels,
          [id]: { ...prev.panels[id], zIndex: maxZ + 1 }
        }
      };
    });
  }, []);

  const resetLayout = useCallback(() => {
    setLayout({
      panels: {
        diagnostics: { id: 'diagnostics', x: 20, y: 20, width: 280, height: window.innerHeight - 120, visible: true, zIndex: 10 },
        logs: { id: 'logs', x: window.innerWidth - 320, y: 20, width: 300, height: window.innerHeight - 120, visible: true, zIndex: 10 },
      }
    });
  }, []);

  return {
    layout,
    updatePanelPosition,
    updatePanelSize,
    togglePanelVisibility,
    bringToFront,
    resetLayout
  };
}
