// global.d.ts
interface FileSystemDirectoryHandle {
  values(): AsyncIterableIterator<FileSystemHandle>;
  requestPermission?: (options: FileSystemHandlePermissionDescriptor) => Promise<PermissionState>;
  queryPermission?: (options: FileSystemHandlePermissionDescriptor) => Promise<PermissionState>;
}


interface Window {
  showDirectoryPicker(options?: Pick<FileSystemDirectoryHandle, 'mode'>): Promise<FileSystemDirectoryHandle>;
}
