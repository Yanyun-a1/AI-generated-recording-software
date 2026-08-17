export interface MediaItem {
  id: string;
  type: 'text' | 'image' | 'video';
  content: string;
  title: string;
  createdAt: number;
}

export interface StyleConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  animationSpeed: number;
  panelOpacity: number;
  panelBlur: number;
  fontSize: number;
  borderRadius: number;
  dateFormat: 'gregorian' | 'lunar';
}

export const DEFAULT_STYLE: StyleConfig = {
  primaryColor: '#8b5cf6',
  secondaryColor: '#ec4899',
  accentColor: '#06b6d4',
  animationSpeed: 1,
  panelOpacity: 0.12,
  panelBlur: 20,
  fontSize: 14,
  borderRadius: 16,
  dateFormat: 'gregorian',
};
