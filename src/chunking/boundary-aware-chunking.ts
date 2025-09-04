/*!
 * Copyright (c) ushirononeko 2025
 * Copyright (c) sirasagi62 2025
 * Published under MIT License
 * see https://opensource.org/licenses/MIT
 *
 * This code was originally created by ushirononeko and modified by sirasagi62
 * Original: https://github.com/ushironoko/gistdex
 */



/**
 * Boundary-aware chunking for maintaining semantic boundaries in content
 */

export type BoundaryChunkOptions = {
  maxChunkSize: number;
  overlap: number;
};

export type BoundaryInfo = {
  type: string;
  level?: number;
  name?: string;
  title?: string;
};

export type BoundaryChunk = {
  content: string;
  startOffset: number;
  endOffset: number;
  boundary: BoundaryInfo;
};
