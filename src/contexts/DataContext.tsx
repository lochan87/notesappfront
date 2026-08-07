import React, { createContext, useContext, useState, useRef, useCallback, ReactNode } from 'react';
import { folderApi, Folder, Note } from '../services/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface NotesFetchResult {
  notes: Note[];
  pagination: {
    current: number;
    total: number;
    count: number;
    totalNotes: number;
  };
}

/** Stores notes data alongside the fetch params so we know when cache is stale. */
interface NotesCacheEntry {
  data: NotesFetchResult;
  search: string;
  sortBy: string;
  sortOrder: string;
  page: number;
}

interface DataContextType {
  // ── Folders ──────────────────────────────────────────────────────────────
  folders: Folder[];
  /** True after the first successful fetch (stays true even when refreshing). */
  foldersLoaded: boolean;
  /** True only while an active network fetch is in flight. */
  foldersLoading: boolean;
  /**
   * Fetch folders from the API.
   * @param force When true, always hits the network even if already loaded.
   */
  fetchFolders: (force?: boolean) => Promise<void>;
  addFolderLocally: (folder: Folder) => void;
  updateFolderLocally: (folder: Folder) => void;
  removeFolderLocally: (folderId: string) => void;

  // ── Notes Cache ──────────────────────────────────────────────────────────
  /** Keyed by folderId – stores last fetched notes + the params used. */
  notesCacheByFolder: Record<string, NotesCacheEntry>;
  cacheNotes: (
    folderId: string,
    data: NotesFetchResult,
    params: { search: string; sortBy: string; sortOrder: string; page: number }
  ) => void;
  /**
   * Prepend a newly created note to the cache and increment the folder's
   * notesCount in the folders list.
   */
  addNoteLocally: (folderId: string, note: Note) => void;
  updateNoteLocally: (folderId: string, note: Note) => void;
  /**
   * Remove a note from the cache and decrement the folder's notesCount
   * in the folders list.
   */
  removeNoteLocally: (folderId: string, noteId: string) => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const DataContext = createContext<DataContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [foldersLoaded, setFoldersLoaded] = useState(false);
  const [foldersLoading, setFoldersLoading] = useState(false);
  const [notesCacheByFolder, setNotesCacheByFolder] = useState<Record<string, NotesCacheEntry>>({});

  // Use a ref so the fetchFolders callback can check load status without
  // needing foldersLoaded in its dependency array (avoids stale closures).
  const foldersLoadedRef = useRef(false);

  // ── Folder helpers ─────────────────────────────────────────────────────

  const fetchFolders = useCallback(async (force = false) => {
    // Skip network call if already loaded and not forced
    if (!force && foldersLoadedRef.current) return;
    try {
      setFoldersLoading(true);
      const data = await folderApi.getAll();
      setFolders(data);
      setFoldersLoaded(true);
      foldersLoadedRef.current = true;
    } catch (err) {
      console.error('Error loading folders:', err);
      throw err; // Let the caller handle the error display
    } finally {
      setFoldersLoading(false);
    }
  }, []); // Empty deps — relies on ref for cache check, no stale closure risk

  const addFolderLocally = useCallback((folder: Folder) => {
    setFolders(prev => [folder, ...prev]);
  }, []);

  const updateFolderLocally = useCallback((folder: Folder) => {
    setFolders(prev => prev.map(f => (f._id === folder._id ? folder : f)));
  }, []);

  const removeFolderLocally = useCallback((folderId: string) => {
    setFolders(prev => prev.filter(f => f._id !== folderId));
    // Also evict the notes cache for this folder
    setNotesCacheByFolder(prev => {
      const next = { ...prev };
      delete next[folderId];
      return next;
    });
  }, []);

  // ── Notes cache helpers ────────────────────────────────────────────────

  const cacheNotes = useCallback(
    (
      folderId: string,
      data: NotesFetchResult,
      params: { search: string; sortBy: string; sortOrder: string; page: number }
    ) => {
      setNotesCacheByFolder(prev => ({
        ...prev,
        [folderId]: { data, ...params },
      }));
    },
    []
  );

  const addNoteLocally = useCallback((folderId: string, note: Note) => {
    // Update notes cache
    setNotesCacheByFolder(prev => {
      const entry = prev[folderId];
      if (!entry) return prev; // No cache yet — nothing to update
      return {
        ...prev,
        [folderId]: {
          ...entry,
          data: {
            notes: [note, ...entry.data.notes],
            pagination: {
              ...entry.data.pagination,
              totalNotes: entry.data.pagination.totalNotes + 1,
            },
          },
        },
      };
    });
    // Keep the folders list notesCount in sync (Dashboard uses this)
    setFolders(prev =>
      prev.map(f => (f._id === folderId ? { ...f, notesCount: f.notesCount + 1 } : f))
    );
  }, []);

  const updateNoteLocally = useCallback((folderId: string, note: Note) => {
    setNotesCacheByFolder(prev => {
      const entry = prev[folderId];
      if (!entry) return prev;
      return {
        ...prev,
        [folderId]: {
          ...entry,
          data: {
            ...entry.data,
            notes: entry.data.notes.map(n => (n._id === note._id ? note : n)),
          },
        },
      };
    });
  }, []);

  const removeNoteLocally = useCallback((folderId: string, noteId: string) => {
    // Update notes cache
    setNotesCacheByFolder(prev => {
      const entry = prev[folderId];
      if (!entry) return prev;
      return {
        ...prev,
        [folderId]: {
          ...entry,
          data: {
            notes: entry.data.notes.filter(n => n._id !== noteId),
            pagination: {
              ...entry.data.pagination,
              totalNotes: Math.max(0, entry.data.pagination.totalNotes - 1),
            },
          },
        },
      };
    });
    // Keep the folders list notesCount in sync
    setFolders(prev =>
      prev.map(f =>
        f._id === folderId ? { ...f, notesCount: Math.max(0, f.notesCount - 1) } : f
      )
    );
  }, []);

  return (
    <DataContext.Provider
      value={{
        folders,
        foldersLoaded,
        foldersLoading,
        fetchFolders,
        addFolderLocally,
        updateFolderLocally,
        removeFolderLocally,
        notesCacheByFolder,
        cacheNotes,
        addNoteLocally,
        updateNoteLocally,
        removeNoteLocally,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
