export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface HiddenObject {
  id: string;
  name: string;
  hint: string;
  box?: BoundingBox; // Coordinates on 0-1000 scale
}

export interface LevelData {
  theme: string;
  story: string;
  hiddenObjects: HiddenObject[];
  imageMode: 'SVG' | 'RASTER';
  svgContent?: string;
  rasterImage?: string; // Base64 string
  isLocal?: boolean;    // ระบุว่าเป็นด่านที่อัปโหลดเอง
  localIndex?: number;  // ลำดับของด่าน
}

export enum GamePhase {
  INIT = 'INIT',
  LOADING = 'LOADING',
  COLORING = 'COLORING',
  HIDDEN_OBJECT = 'HIDDEN_OBJECT',
  WIN = 'WIN'
}

export interface Point {
  x: number;
  y: number;
}