export const LOCAL_FILE_INDEX_KEY = "sheetlife:file-index";
export const LOCAL_FILE_PREFIX = "sheetlife:file:";

export type LocalFileIndexEntry = {
  id: string;
  name: string;
  viewType: string;
  storageType: "local";
  createdAt: string;
  updatedAt: string;
};

export type LocalFileRecord = {
  id: string;
  name: string;
  viewType: string;
  mimeType: string;
  createdAt: string;
  updatedAt: string;
  contentBase64: string;
};

export type LocalFileIndex = {
  files: LocalFileIndexEntry[];
};
