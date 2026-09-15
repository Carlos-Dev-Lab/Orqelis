import type { ExcalidrawElement } from '@excalidraw/excalidraw/element/types';
import type { AppState, BinaryFileData, BinaryFiles } from '@excalidraw/excalidraw/types';
import { api } from '@/shared/api';
import { extractBidirectionalLinks } from '@/shared/utils';

// ---------------------------------------------------------------------------
// Scene (de)serialization for diagram notes.
// Stored JSON keeps elements + a minimal appState + file metadata; file binaries
// live on the API's disk storage and are fetched on demand.
// ---------------------------------------------------------------------------

export const MAX_DIAGRAM_FILE_BYTES = 10 * 1024 * 1024;

type StoredFile = Pick<BinaryFileData, 'id' | 'mimeType' | 'created'>;

export interface StoredScene {
  type: 'excalidraw';
  version: 2;
  elements: ExcalidrawElement[];
  appState: Partial<Pick<AppState, 'viewBackgroundColor' | 'gridSize' | 'gridModeEnabled'>>;
  files: Record<string, StoredFile>;
}

export const parseDiagramData = (value?: string | null): StoredScene => {
  const empty: StoredScene = { type: 'excalidraw', version: 2, elements: [], appState: {}, files: {} };
  if (!value) return empty;
  try {
    const parsed = JSON.parse(value);
    return {
      ...empty,
      elements: Array.isArray(parsed?.elements) ? parsed.elements : [],
      appState: parsed?.appState && typeof parsed.appState === 'object' ? parsed.appState : {},
      files: parsed?.files && typeof parsed.files === 'object' ? parsed.files : {},
    };
  } catch {
    return empty;
  }
};

const isLiveImage = (element: ExcalidrawElement): element is ExcalidrawElement & { fileId: string } =>
  element.type === 'image' && !element.isDeleted && !!(element as { fileId?: string | null }).fileId;

export const getReferencedFileIds = (elements: readonly ExcalidrawElement[]): string[] =>
  Array.from(new Set(elements.filter(isLiveImage).map((element) => element.fileId)));

export const serializeScene = (
  elements: readonly ExcalidrawElement[],
  appState: Partial<AppState>,
  files: BinaryFiles,
): string => {
  const liveElements = elements.filter((element) => !element.isDeleted);
  const storedFiles: Record<string, StoredFile> = {};
  for (const fileId of getReferencedFileIds(liveElements)) {
    const file = files[fileId];
    if (file) storedFiles[fileId] = { id: file.id, mimeType: file.mimeType, created: file.created };
  }

  const scene: StoredScene = {
    type: 'excalidraw',
    version: 2,
    elements: liveElements as ExcalidrawElement[],
    appState: {
      viewBackgroundColor: appState.viewBackgroundColor,
      gridSize: appState.gridSize,
      gridModeEnabled: appState.gridModeEnabled,
    },
    files: storedFiles,
  };
  return JSON.stringify(scene);
};

/** Matches a note link written as an element hyperlink: [[Note title]] */
export const parseNoteLink = (link?: string | null): string | null => {
  const match = /^\s*\[\[([^\]]+)\]\]\s*$/.exec(link ?? '');
  return match ? match[1].trim() : null;
};

/**
 * Searchable plain text for a diagram: its text elements plus element links.
 * Stored as the note `content` so search, previews and [[link]] extraction keep working.
 */
export const buildDiagramContent = (elements: readonly ExcalidrawElement[]): string => {
  const parts: string[] = [];
  for (const element of elements) {
    if (element.isDeleted) continue;
    const text = element.type === 'text' ? (element as { text?: string }).text?.trim() : undefined;
    if (text) parts.push(text);
    const linkedTitle = parseNoteLink(element.link);
    if (linkedTitle && !text?.includes(`[[${linkedTitle}]]`)) parts.push(`[[${linkedTitle}]]`);
  }
  return parts.join('\n');
};

export const extractDiagramLinks = (elements: readonly ExcalidrawElement[]): string[] =>
  Array.from(new Set(extractBidirectionalLinks(buildDiagramContent(elements))));

// ---------------------------------------------------------------------------
// File transfer (images)
// ---------------------------------------------------------------------------

const blobToDataURL = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });

const fileKey = (noteId: string, fileId: string) => `${noteId}:${fileId}`;

// In-memory caches shared by editors and previews
const loadedFiles = new Map<string, Promise<BinaryFileData | null>>();
const uploadedFiles = new Set<string>();

/** Fetches the stored images of a scene as Excalidraw BinaryFileData (with dataURL). */
export const loadSceneFiles = async (noteId: string, scene: StoredScene): Promise<BinaryFileData[]> => {
  const referenced = getReferencedFileIds(scene.elements);
  const results = await Promise.all(
    referenced.map((fileId) => {
      const key = fileKey(noteId, fileId);
      if (!loadedFiles.has(key)) {
        const meta = scene.files[fileId];
        loadedFiles.set(
          key,
          api.notes
            .getFile(noteId, fileId)
            .then(async (blob) => {
              uploadedFiles.add(key);
              return {
                id: fileId,
                mimeType: (meta?.mimeType ?? blob.type) as BinaryFileData['mimeType'],
                created: meta?.created ?? Date.now(),
                dataURL: (await blobToDataURL(blob)) as BinaryFileData['dataURL'],
              } as BinaryFileData;
            })
            .catch((error) => {
              console.error(`Failed to load diagram file ${fileId}:`, error);
              loadedFiles.delete(key);
              return null;
            }),
        );
      }
      return loadedFiles.get(key)!;
    }),
  );
  return results.filter((file): file is BinaryFileData => !!file);
};

/** Marks the files already persisted for a note so they are not uploaded again. */
export const markFilesUploaded = (noteId: string, fileIds: string[]) => {
  fileIds.forEach((fileId) => uploadedFiles.add(fileKey(noteId, fileId)));
};

/** Uploads referenced images that are not stored yet. Throws if any upload fails. */
export const uploadPendingFiles = async (
  noteId: string,
  elements: readonly ExcalidrawElement[],
  files: BinaryFiles,
): Promise<void> => {
  const pending = getReferencedFileIds(elements).filter(
    (fileId) => !uploadedFiles.has(fileKey(noteId, fileId)) && files[fileId]?.dataURL,
  );

  for (const fileId of pending) {
    const file = files[fileId];
    const blob = await (await fetch(file.dataURL)).blob();
    if (blob.size > MAX_DIAGRAM_FILE_BYTES) {
      throw new Error(`File ${fileId} exceeds ${MAX_DIAGRAM_FILE_BYTES} bytes`);
    }
    await api.notes.uploadFile(noteId, fileId, new Blob([blob], { type: file.mimeType }));
    const key = fileKey(noteId, fileId);
    uploadedFiles.add(key);
    loadedFiles.set(key, Promise.resolve(file));
  }
};
