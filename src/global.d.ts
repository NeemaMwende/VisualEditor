// global.d.ts
interface FileSystemDirectoryHandle {
  values(): AsyncIterableIterator<FileSystemHandle>;
}

interface Window {
  showDirectoryPicker(options?: Pick<FileSystemDirectoryHandle, 'mode'>): Promise<FileSystemDirectoryHandle>;
}
