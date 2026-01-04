export interface Sticker {
  id: string;
  content: string; // Emoji
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  scale: number;
  scaleX?: number;
  scaleY?: number;
  rotation: number;
  animation: 'none' | 'float' | 'pulse' | 'jiggle' | 'spin' | 'tween';
  endX?: number;
  endY?: number;
  tweenDuration?: number; // seconds
}

export interface Choice {
  id: string;
  label: string;
  targetMomentId: string;
}

export interface MomentMetadata {
  caption: string;
  tags: string[];
  category: 'People' | 'Nature' | 'Animals' | 'Documents' | 'Food' | 'Urban' | 'Other';
  overlayText?: string;
  overlayFontSize?: number;
  overlayFontFamily?: string;
  overlayColor?: string;
  overlayEffect?: 'none' | 'neon' | 'drip';
  overlayWordEffects?: ('none' | 'neon' | 'drip' | null)[];
  stickers?: Sticker[];
  // Dialogue System
  isDialogue?: boolean;
  dialogueType?: 'speech' | 'narration';
  characterName?: string;
  characterPortrait?: string;
  characterPosition?: 'left' | 'right';
  choices?: Choice[];
}

export interface Moment {
  id: string;
  url: string;
  base64?: string;
  mimeType: string;
  source: 'upload' | 'url' | 'sample';
  metadata?: MomentMetadata;
  createdAt: number;
}

export interface Story {
  id: string;
  title: string;
  coverPhotoUrl?: string; // Keep as coverPhotoUrl or change to coverMomentUrl? Let's keep it generic for now or match. "coverUrl" might be better but let's stick to simple rename first.
  // Actually, to be consistent:
  coverMomentUrl?: string;
  momentIds: string[]; // photoIds -> momentIds
  createdAt: number;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}