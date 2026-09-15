import { lazy } from 'react';

// Excalidraw resolves font URLs when its module loads, so the self-hosted asset path
// (served under /fonts, see excalidrawAssets in vite.config.ts) must be set before the lazy import
if (typeof window !== 'undefined') {
  (window as Window & { EXCALIDRAW_ASSET_PATH?: string }).EXCALIDRAW_ASSET_PATH = '/';
}

// Excalidraw is heavy: load it only when a diagram is opened or rendered
export const DiagramEditor = lazy(() => import('./DiagramEditor'));
export const DiagramPreview = lazy(() => import('./DiagramPreview'));
export type { DiagramEditorHandle } from './DiagramEditor';
