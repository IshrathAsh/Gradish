
export type GradientType = 'linear' | 'radial';

export interface ColorStop {
  id: string;
  color: string;
  position: number;
}

export interface GradientState {
  type: GradientType;
  angle: number;
  stops: ColorStop[];
}

export interface ExportSettings {
  width: number;
  height: number;
  format: 'png' | 'jpeg' | 'svg';
  quality: number;
}
