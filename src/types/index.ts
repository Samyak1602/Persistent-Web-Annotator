export interface Note {
  id: string;
  url: string;
  content: string;
  domLocator: DOMLocator;
  createdAt: number;
}

export interface DOMLocator {
  selector: string;
  textOffset: number;
  textContent: string;
  startOffset?: number;
  endOffset?: number;
}

export interface StorageData {
  notes: Note[];
}

