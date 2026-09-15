import { memo, useCallback, useEffect, useImperativeHandle, useMemo, useRef, type Ref } from 'react';
import {
  CaptureUpdateAction,
  Excalidraw,
  MainMenu,
  WelcomeScreen,
  convertToExcalidrawElements,
  getSceneVersion,
} from '@excalidraw/excalidraw';
import { Link2, Share2 } from 'lucide-react';
import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { AppState, BinaryFiles, ExcalidrawImperativeAPI } from '@excalidraw/excalidraw/types';
import '@excalidraw/excalidraw/index.css';
import './excalidraw-theme.css';
import type { Note } from '@orqelis/shared';
import { api } from '@/shared/api';
import { useAppStore } from '@/shared/store';
import { t, type Language } from '@/shared/i18n';
import {
  buildDiagramContent,
  extractDiagramLinks,
  loadSceneFiles,
  markFilesUploaded,
  parseDiagramData,
  parseNoteLink,
  serializeScene,
  uploadPendingFiles,
} from './diagramScene';

const AUTOSAVE_DELAY = 1500;

// Stable references: Excalidraw is memoized with a shallow prop comparison, so new
// objects/callbacks on every parent render would re-render the whole editor.
// The theme follows the app, so Excalidraw's own theme toggle is hidden
const UI_OPTIONS = { canvasActions: { saveToActiveFile: false, toggleTheme: false } } as const;

// Excalidraw's default white canvas is replaced by the app surface (see excalidraw-theme.css)
const DEFAULT_CANVAS_BACKGROUNDS = new Set([undefined, '', '#ffffff', '#fff']);

export interface DiagramEditorHandle {
  flush: () => Promise<void>;
  insertNoteLink: (title: string) => void;
  /** Re-measures the canvas position/size (after the container moved or animated) */
  refresh: () => void;
}

interface DiagramEditorProps {
  note: Note;
  theme: 'dark' | 'light';
  language: Language;
  onDirtyChange: (dirty: boolean) => void;
  onOpenNote: (title: string) => void;
  /** Fired when the [[links]] detected in the diagram change */
  onLinksChange?: (links: string[]) => void;
  /** Opens the linked notes panel (from the diagram menu / welcome screen) */
  onOpenLinksPanel?: () => void;
  ref?: Ref<DiagramEditorHandle>;
}

type Snapshot = {
  elements: readonly ExcalidrawElement[];
  appState: AppState;
  files: BinaryFiles;
};

// Runs on every pointer move: keep it cheap (image references only change with element versions)
const signatureOf = ({ elements, appState }: Snapshot) =>
  `${getSceneVersion(elements)}|${appState.viewBackgroundColor}|${appState.gridModeEnabled}`;

const sameLinks = (a: string[], b: string[]) => a.length === b.length && a.every((link, index) => link === b[index]);

/** Replaces a note in the global store (re-renders every store subscriber, so do it sparingly) */
const syncNoteToStore = (updated: Note) => {
  useAppStore.setState((state) => ({
    notes: state.notes
      .map((existing) => (existing.id === updated.id ? updated : existing))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
  }));
};

function DiagramEditor({ note, theme, language, onDirtyChange, onOpenNote, onLinksChange, onOpenLinksPanel, ref }: DiagramEditorProps) {
  const apiRef = useRef<ExcalidrawImperativeAPI | null>(null);
  const latestRef = useRef<Snapshot | null>(null);
  const savedSignatureRef = useRef<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const savingRef = useRef<Promise<void> | null>(null);
  const noteId = note.id;

  // Parent callbacks change identity on every store update; read them through refs
  const onDirtyChangeRef = useRef(onDirtyChange);
  onDirtyChangeRef.current = onDirtyChange;
  const onOpenNoteRef = useRef(onOpenNote);
  onOpenNoteRef.current = onOpenNote;
  const onLinksChangeRef = useRef(onLinksChange);
  onLinksChangeRef.current = onLinksChange;
  const onOpenLinksPanelRef = useRef(onOpenLinksPanel);
  onOpenLinksPanelRef.current = onOpenLinksPanel;
  const linksRef = useRef<string[]>(note.links);
  // Latest server copy not yet pushed to the global store
  const pendingStoreSyncRef = useRef<Note | null>(null);

  // Initial scene is read once per note; later store updates come from our own saves
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const scene = useMemo(() => parseDiagramData(note.diagramData), [noteId]);

  const initialData = useMemo(() => {
    markFilesUploaded(noteId, Object.keys(scene.files));
    const viewBackgroundColor = DEFAULT_CANVAS_BACKGROUNDS.has(scene.appState.viewBackgroundColor)
      ? 'transparent'
      : scene.appState.viewBackgroundColor;
    return {
      elements: scene.elements,
      appState: { ...scene.appState, viewBackgroundColor },
      scrollToContent: true,
    };
  }, [noteId, scene]);

  const flush = useCallback(async () => {
    clearTimeout(timerRef.current);
    if (savingRef.current) await savingRef.current;

    const snapshot = latestRef.current;
    if (!snapshot) return;
    const signature = signatureOf(snapshot);
    if (signature === savedSignatureRef.current) return;

    const run = (async () => {
      try {
        await uploadPendingFiles(noteId, snapshot.elements, snapshot.files);
      } catch (error) {
        console.error('Diagram image upload failed:', error);
        const { showAlert, language: lang } = useAppStore.getState();
        showAlert(t('diagram', lang), t('imageUploadError', lang));
      }

      try {
        const links = extractDiagramLinks(snapshot.elements);
        // Autosave talks to the API directly: updating the global store on every save
        // re-renders the whole app behind the canvas and makes drawing stutter.
        // The store is synced once the editor closes (see unmount effect).
        const updated = await api.notes.update(noteId, {
          diagramData: serializeScene(snapshot.elements, snapshot.appState, snapshot.files),
          content: buildDiagramContent(snapshot.elements),
          links,
        });
        pendingStoreSyncRef.current = updated;
        savedSignatureRef.current = signature;
        if (!sameLinks(links, linksRef.current)) {
          linksRef.current = links;
          onLinksChangeRef.current?.(links);
        }
        if (latestRef.current && signatureOf(latestRef.current) === signature) {
          onDirtyChangeRef.current(false);
        }
      } catch (error) {
        console.error('Error saving diagram:', error);
        onDirtyChangeRef.current(true);
      }
    })();

    savingRef.current = run;
    await run;
    savingRef.current = null;
  }, [noteId]);

  const flushRef = useRef(flush);
  flushRef.current = flush;

  const handleChange = useCallback(
    (elements: readonly ExcalidrawElement[], appState: AppState, files: BinaryFiles) => {
      const snapshot = { elements, appState, files };
      latestRef.current = snapshot;
      const signature = signatureOf(snapshot);

      // First change event reflects the loaded scene: use it as the saved baseline
      if (savedSignatureRef.current === null) {
        savedSignatureRef.current = signature;
        return;
      }
      if (signature === savedSignatureRef.current) return;

      if (timerRef.current === undefined) onDirtyChangeRef.current(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = undefined;
        void flushRef.current();
      }, AUTOSAVE_DELAY);
    },
    [],
  );

  const handleApi = useCallback(
    (excalidrawApi: ExcalidrawImperativeAPI) => {
      apiRef.current = excalidrawApi;
      // Excalidraw caches its DOM rect on mount; if the container was still settling
      // (modal entering, full-screen switch) pointer coordinates end up offset.
      requestAnimationFrame(() => apiRef.current?.refresh());
      setTimeout(() => apiRef.current?.refresh(), 400);
      loadSceneFiles(noteId, scene).then((files) => {
        if (files.length > 0) apiRef.current?.addFiles(files);
      });
    },
    [noteId, scene],
  );

  const handleLinkOpen = useCallback(
    (element: { link: string | null }, event: CustomEvent<{ nativeEvent: MouseEvent | React.PointerEvent<HTMLCanvasElement> }>) => {
      const title = parseNoteLink(element.link);
      if (!title) return;
      event.preventDefault();
      void flushRef.current();
      onOpenNoteRef.current(title);
    },
    [],
  );

  useImperativeHandle(
    ref,
    () => ({
      flush: () => flushRef.current(),
      refresh: () => apiRef.current?.refresh(),
      insertNoteLink: (title: string) => {
        const excalidrawApi = apiRef.current;
        if (!excalidrawApi) return;
        const { scrollX, scrollY, zoom, width, height } = excalidrawApi.getAppState();
        const link = `[[${title}]]`;
        const [element] = convertToExcalidrawElements([
          {
            type: 'text',
            text: link,
            link,
            x: width / 2 / zoom.value - scrollX,
            y: height / 2 / zoom.value - scrollY,
          },
        ]);
        excalidrawApi.updateScene({
          elements: [...excalidrawApi.getSceneElementsIncludingDeleted(), element],
          captureUpdate: CaptureUpdateAction.IMMEDIATELY,
        });
      },
    }),
    [],
  );

  // Ctrl+S saves immediately; pending changes are flushed when the editor unmounts
  useEffect(() => {
    const handleSave = () => void flushRef.current();
    window.addEventListener('orqelis:save-note', handleSave);
    return () => {
      window.removeEventListener('orqelis:save-note', handleSave);
      void flushRef.current().then(() => {
        const updated = pendingStoreSyncRef.current;
        pendingStoreSyncRef.current = null;
        if (!updated) return;
        // Keep metadata edited meanwhile in the modal (title, tags...) from the store copy
        const current = useAppStore.getState().notes.find((existing) => existing.id === updated.id);
        syncNoteToStore(current ? { ...current, diagramData: updated.diagramData, content: updated.content, links: updated.links, updatedAt: updated.updatedAt } : updated);
      });
    };
  }, []);

  // Position changes without a size change (e.g. scrolling ancestors) aren't observed by Excalidraw
  useEffect(() => {
    const refresh = () => apiRef.current?.refresh();
    window.addEventListener('scroll', refresh, true);
    return () => window.removeEventListener('scroll', refresh, true);
  }, []);

  // Children are compared by identity by Excalidraw's memo: keep them stable
  const customUi = useMemo(() => {
    const openLinks = () => onOpenLinksPanelRef.current?.();
    return (
      <>
        <MainMenu>
          <MainMenu.Item icon={<Link2 size={16} strokeWidth={2} />} onSelect={openLinks}>
            {t('linkedNotes', language)}
          </MainMenu.Item>
          <MainMenu.Separator />
          <MainMenu.DefaultItems.LoadScene />
          <MainMenu.DefaultItems.Export />
          <MainMenu.DefaultItems.SaveAsImage />
          <MainMenu.DefaultItems.SearchMenu />
          <MainMenu.DefaultItems.Help />
          <MainMenu.DefaultItems.ClearCanvas />
          <MainMenu.Separator />
          <MainMenu.DefaultItems.ChangeCanvasBackground />
        </MainMenu>
        <WelcomeScreen>
          <WelcomeScreen.Hints.MenuHint>{t('diagramMenuHint', language)}</WelcomeScreen.Hints.MenuHint>
          <WelcomeScreen.Hints.ToolbarHint>{t('diagramToolbarHint', language)}</WelcomeScreen.Hints.ToolbarHint>
          <WelcomeScreen.Hints.HelpHint />
          <WelcomeScreen.Center>
            <WelcomeScreen.Center.Logo>
              <span className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary text-background shadow-lg shadow-primary/20">
                  <Share2 size={22} />
                </span>
                <span className="text-2xl font-bold tracking-tight">Orqelis</span>
              </span>
            </WelcomeScreen.Center.Logo>
            <WelcomeScreen.Center.Heading>{t('diagramWelcomeHeading', language)}</WelcomeScreen.Center.Heading>
            <WelcomeScreen.Center.Menu>
              <WelcomeScreen.Center.MenuItem icon={<Link2 size={16} strokeWidth={2} />} onSelect={openLinks}>
                {t('linkedNotes', language)}
              </WelcomeScreen.Center.MenuItem>
              <WelcomeScreen.Center.MenuItemLoadScene />
              <WelcomeScreen.Center.MenuItemHelp />
            </WelcomeScreen.Center.Menu>
          </WelcomeScreen.Center>
        </WelcomeScreen>
      </>
    );
  }, [language]);

  return (
    <div className="orqelis-diagram h-full w-full">
      <Excalidraw
        key={noteId}
        initialData={initialData}
        excalidrawAPI={handleApi}
        onChange={handleChange}
        onLinkOpen={handleLinkOpen}
        theme={theme}
        langCode={language === 'es' ? 'es-ES' : 'en'}
        name={note.title}
        aiEnabled={false}
        UIOptions={UI_OPTIONS}
      >
        {customUi}
      </Excalidraw>
    </div>
  );
}

export default memo(DiagramEditor);
