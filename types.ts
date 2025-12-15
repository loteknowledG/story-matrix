export interface PhotoMetadata {
  caption: string;
  tags: string[];
  category: 'People' | 'Nature' | 'Animals' | 'Documents' | 'Food' | 'Urban' | 'Other';
  overlayText?: string;
  overlayFontSize?: number;
  overlayFontFamily?: string;
  overlayColor?: string;
  overlayEffect?: 'none' | 'neon' | 'drip' | 'sparkle';
  overlayWordEffects?: ('none' | 'neon' | 'drip' | 'sparkle' | null)[];
}

export interface Photo {
  id: string;
  url: string;
  base64?: string;
  mimeType: string;
  source: 'upload' | 'url' | 'sample';
  metadata?: PhotoMetadata;
  createdAt: number;
}

export interface Album {
  id: string;
  title: string;
  coverPhotoUrl?: string;
  photoIds: string[];
  createdAt: number;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}