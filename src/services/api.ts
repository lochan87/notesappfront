import axios from 'axios';

// Types
export interface Folder {
  _id: string;
  name: string;
  description: string;
  color: string;
  notesCount: number;
  customCreatedDates: Array<{
    date: string;
    modifiedAt: string;
  }>;
  mainCreatedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Note {
  _id: string;
  title: string;
  content: string;
  folderId: string | Folder;
  images: {
    filename: string;
    originalName: string;
    mimetype: string;
    size: number;
    data: string; // Base64 data
  }[];
  tags: string[];
  isPinned: boolean;
  customCreatedDates: Array<{
    date: string;
    modifiedAt: string;
  }>;
  customLastModifiedDates: Array<{
    date: string;
    modifiedAt: string;
  }>;
  mainCreatedAt: string;
  mainLastModified: string;
  lastModified: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateFolderData {
  name: string;
  description?: string;
  color?: string;
  customCreatedAt?: string;
}

export interface CreateNoteData {
  title: string;
  content: string;
  folderId: string;
  tags?: string[];
  isPinned?: boolean;
  images?: File[];
}

export interface UpdateNoteData {
  title: string;
  content: string;
  tags?: string[];
  isPinned?: boolean;
  images?: File[];
  removeImages?: string[];
  customCreatedAt?: string;
  customLastModified?: string;
}

// Use the default axios instance (which will have interceptors from AuthContext)
// Don't create a separate instance
const api = axios;

// Helper function to convert File to Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Folder API
export const folderApi = {
  getAll: async (): Promise<Folder[]> => {
    const response = await api.get('/api/folders');
    return response.data;
  },

  getById: async (id: string): Promise<Folder> => {
    const response = await api.get(`/api/folders/${id}`);
    return response.data;
  },

  create: async (data: CreateFolderData): Promise<Folder> => {
    const response = await api.post('/api/folders', data);
    return response.data;
  },

  update: async (id: string, data: Partial<CreateFolderData>): Promise<Folder> => {
    const response = await api.put(`/api/folders/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/folders/${id}`);
  },

  getStats: async (id: string) => {
    const response = await api.get(`/api/folders/${id}/stats`);
    return response.data;
  },
};

// Note API
export const noteApi = {
  getByFolder: async (
    folderId: string,
    params?: {
      search?: string;
      sortBy?: string;
      sortOrder?: string;
      page?: number;
      limit?: number;
    }
  ) => {
    const response = await api.get(`/api/notes/folder/${folderId}`, { params });
    return response.data;
  },

  getById: async (id: string): Promise<Note> => {
    const response = await api.get(`/api/notes/${id}`);
    return response.data;
  },

  create: async (data: CreateNoteData): Promise<Note> => {
    // Convert images to Base64
    const images = [];
    if (data.images) {
      for (const file of data.images) {
        const base64Data = await fileToBase64(file);
        images.push({
          data: base64Data,
          originalName: file.name,
          mimetype: file.type,
          size: file.size
        });
      }
    }

    const payload = {
      title: data.title,
      content: data.content,
      folderId: data.folderId,
      tags: data.tags || [],
      isPinned: data.isPinned || false,
      images
    };

    const response = await api.post('/api/notes', payload);
    return response.data;
  },

  update: async (id: string, data: UpdateNoteData): Promise<Note> => {
    // Convert images to Base64
    const images = [];
    if (data.images) {
      for (const file of data.images) {
        const base64Data = await fileToBase64(file);
        images.push({
          data: base64Data,
          originalName: file.name,
          mimetype: file.type,
          size: file.size
        });
      }
    }

    const payload = {
      title: data.title,
      content: data.content,
      tags: data.tags || [],
      isPinned: data.isPinned || false,
      images,
      removeImages: data.removeImages || [],
      customCreatedAt: data.customCreatedAt,
      customLastModified: data.customLastModified
    };

    const response = await api.put(`/api/notes/${id}`, payload);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/api/notes/${id}`);
  },

  togglePin: async (id: string): Promise<Note> => {
    const response = await api.patch(`/api/notes/${id}/pin`);
    return response.data;
  },

  search: async (query: string, page = 1, limit = 20) => {
    const response = await api.get('/api/notes/search/global', {
      params: { q: query, page, limit },
    });
    return response.data;
  },
};

export default api;
