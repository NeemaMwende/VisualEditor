import { useState, useEffect, useCallback } from 'react';
import { Question } from '../app/components/Dashboard';
import { generateMarkdown } from '../utils/markdownUtils';

interface FileSyncOptions {
  debounceMs?: number;
  onError?: (error: Error) => void;
}

interface FileSystemState {
  handle: FileSystemDirectoryHandle | null;
  path: string;
}

export const useFileSync = (fileSystem: FileSystemState, options: FileSyncOptions = {}) => {
  const { debounceMs = 1000, onError } = options;
  const [syncQueue, setSyncQueue] = useState<Map<string, Question>>(new Map());
  const [isSyncing, setIsSyncing] = useState(false);

  const createOrUpdateFile = useCallback(async (
    question: Question,
    oldTitle?: string
  ): Promise<boolean> => {
    if (!fileSystem.handle) return false;

    try {
      // Generate the markdown content
      const markdownContent = generateMarkdown(
        question,
        question.enableCodeFormatting ?? true,
        question.codeLanguage || 'javascript'
      );

      // Create filenames
      const newFileName = `${question.title.toLowerCase().replace(/\s+/g, '-')}.md`;
      const oldFileName = oldTitle ? 
        `${oldTitle.toLowerCase().replace(/\s+/g, '-')}.md` : 
        newFileName;

      // If title changed, remove old file
      if (oldTitle && oldTitle !== question.title) {
        try {
          await fileSystem.handle.removeEntry(oldFileName);
        } catch (error) {
          if ((error as Error).name !== 'NotFoundError') {
            throw error;
          }
        }
      }

      // Create or update the file
      const fileHandle = await fileSystem.handle.getFileHandle(newFileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(markdownContent);
      await writable.close();

      return true;
    } catch (error) {
      const err = error as Error;
      console.error('Error syncing file:', err);
      onError?.(err);
      return false;
    }
  }, [fileSystem.handle, onError]);

  // Process sync queue
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const processSyncQueue = async () => {
      if (syncQueue.size === 0 || isSyncing) return;

      setIsSyncing(true);
      const currentQueue = new Map(syncQueue);
      setSyncQueue(new Map());

      try {
        const syncOperations = Array.from(currentQueue.entries()).map(
          async ([key, question]) => {
            const [, oldTitle] = key.split('::');
            return createOrUpdateFile(question, oldTitle);
          }
        );

        await Promise.all(syncOperations);
      } finally {
        setIsSyncing(false);
      }
    };

    if (syncQueue.size > 0) {
      timeoutId = setTimeout(processSyncQueue, debounceMs);
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, [syncQueue, isSyncing, debounceMs, createOrUpdateFile]);

  // Queue a file for synchronization
  const queueSync = useCallback((question: Question, oldTitle?: string) => {
    const key = `${question.id}::${oldTitle || ''}`;
    setSyncQueue(prev => new Map(prev).set(key, question));
  }, []);

  // Delete a file
  const deleteFile = useCallback(async (fileName: string): Promise<boolean> => {
    if (!fileSystem.handle) return false;

    try {
      await fileSystem.handle.removeEntry(fileName);
      return true;
    } catch (error) {
      const err = error as Error;
      if (err.name !== 'NotFoundError') {
        console.error('Error deleting file:', err);
        onError?.(err);
        return false;
      }
      return true;
    }
  }, [fileSystem.handle, onError]);

  return {
    queueSync,
    deleteFile,
    isSyncing
  };
};