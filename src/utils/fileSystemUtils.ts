import { Question } from "@/app/questioneditor/components/QuestionEditor";

export interface FileSystemState {
  handle: FileSystemDirectoryHandle | null;
  path: string;
  fileName?: string;
  content?: string;
}

export async function writeToFileSystem(
  fileSystem: FileSystemState,
  fileName: string,
  content: string
): Promise<boolean> {
  if (!fileSystem.handle) return false;

  try {
    const fileHandle = await fileSystem.handle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
    return true;
  } catch (error) {
    console.error('Error writing to file system:', error);
    return false;
  }
}

export async function readFromFileSystem(
  fileSystem: FileSystemState,
  fileName: string
): Promise<string | null> {
  if (!fileSystem.handle) return null;

  try {
    const fileHandle = await fileSystem.handle.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    return await file.text();
  } catch (error) {
    console.error('Error reading from file system:', error);
    return null;
  }
}

export function generateFileName(title: string): string {
  return `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
}

export async function syncQuestionChanges(
  fileSystem: FileSystemState,
  question: Question,
  content: string,
  oldTitle?: string
): Promise<boolean> {
  try {
    const newFileName = generateFileName(question.title);
    
    // If title changed, delete old file
    if (oldTitle && oldTitle !== question.title) {
      const oldFileName = generateFileName(oldTitle);
      try {
        await fileSystem.handle?.removeEntry(oldFileName);
      } catch (error) {
        // Ignore if old file doesn't exist
        if ((error as Error).name !== 'NotFoundError') {
          throw error;
        }
      }
    }

    // Write new content
    return await writeToFileSystem(fileSystem, newFileName, content);
  } catch (error) {
    console.error('Error syncing question changes:', error);
    return false;
  }
}