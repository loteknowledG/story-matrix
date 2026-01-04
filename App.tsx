import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Image as ImageIcon,
  Plus,
  Search,
  Grid,
  X,
  UploadCloud,
  Trash2,
  Type as TypeIcon,
  Check,
  Palette,
  Download,
  Upload,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Zap,
  Droplets,
  Menu,
  CheckSquare,
  FolderPlus,
  ArrowLeft,
  Smile,
  Move
} from 'lucide-react';

import { Moment, MomentMetadata, Story, Sticker, Choice } from './types';
import { MomentCard } from './components/MomentCard';
import { StoryCard } from './components/StoryCard';
import { DialogueBox } from './components/DialogueBox';
import { TypewriterText } from './components/TypewriterText';
import { AddMomentModal } from './components/AddMomentModal';
import { AddToStoryModal } from './components/AddToStoryModal';
import { StickerDisplay } from './components/StickerDisplay';
import { resizeImage } from './utils';
import { saveState, loadState } from './storage';


// Sample data
const SAMPLE_MOMENTS: string[] = [
  "https://picsum.photos/id/10/800/800",
  "https://picsum.photos/id/129/800/800",
  "https://picsum.photos/id/1025/800/800",
];

const FONTS = [
  { name: 'Standard', value: 'Roboto' },
  { name: 'Meme', value: 'Anton' },
  { name: 'Cursive', value: 'Lobster' },
  { name: 'Fun', value: 'Pacifico' },
  { name: 'Typewriter', value: 'Courier New' },
];

const EFFECTS = [
  { name: 'None', value: 'none', icon: null },
  { name: 'Neon', value: 'neon', icon: <Zap size={14} /> },
  { name: 'Drip', value: 'drip', icon: <Droplets size={14} /> },
];

const COLORS = [
  '#FFFFFF', // White
  '#000000', // Black
  '#EF4444', // Red
  '#F59E0B', // Yellow
  '#10B981', // Green
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
];

const SAMPLE_STICKERS = [
  '⭐', '💖', '🔥', '✨', '💧', '🎞️', '🌈', '🍦', '🏝️', '🎉', '🦋', '🎈', '🍕', '🚀', '🎸', '🕹️'
];

const STICKER_ANIMATIONS: Sticker['animation'][] = ['none', 'float', 'pulse', 'jiggle', 'spin', 'tween'];

const App: React.FC = () => {
  const [moments, setMoments] = useState<Moment[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddToStoryModalOpen, setIsAddToStoryModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Persistence State
  const [isStorageInitialized, setIsStorageInitialized] = useState(false);

  // Navigation State
  const [view, setView] = useState<'timeline' | 'stories' | 'story_detail'>('timeline');
  const [currentStory, setCurrentStory] = useState<Story | null>(null);

  // Selection & Editing
  const [selectedMoment, setSelectedMoment] = useState<Moment | null>(null); // For Lightbox
  const [isEditingText, setIsEditingText] = useState(false);

  // Multi-Selection State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMomentIds, setSelectedMomentIds] = useState<Set<string>>(new Set());

  // Story Mode State
  const [isStoryMode, setIsStoryMode] = useState(false);
  const [storyIndex, setStoryIndex] = useState(0);

  // Edit State
  const [editingTextValue, setEditingTextValue] = useState('');
  const [editingFontSize, setEditingFontSize] = useState(40);
  const [editingFontFamily, setEditingFontFamily] = useState('Anton');
  const [editingColor, setEditingColor] = useState('#FFFFFF');
  const [editingEffect, setEditingEffect] = useState<MomentMetadata['overlayEffect']>('none');
  const [editingWordEffects, setEditingWordEffects] = useState<MomentMetadata['overlayWordEffects']>([]);
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null);
  const [editingStickers, setEditingStickers] = useState<Sticker[]>([]);
  const [selectedStickerId, setSelectedStickerId] = useState<string | null>(null);
  const [isSettingTweenEnd, setIsSettingTweenEnd] = useState(false);
  const [isStickerPickerOpen, setIsStickerPickerOpen] = useState(false);
  const [editMode, setEditMode] = useState<'text' | 'stickers' | 'dialogue'>('text');

  // Dialogue Edit State
  const [isDialogueMode, setIsDialogueMode] = useState(false);
  const [editingDialogueType, setEditingDialogueType] = useState<'speech' | 'narration'>('speech');
  const [editingCharacterName, setEditingCharacterName] = useState('');
  const [editingCharacterPortrait, setEditingCharacterPortrait] = useState('');
  const [editingCharacterPosition, setEditingCharacterPosition] = useState<'left' | 'right'>('left');
  const [editingChoices, setEditingChoices] = useState<Choice[]>([]);
  const [stickerPickerOffset, setStickerPickerOffset] = useState({ x: 0, y: 0 });
  const [stickerPropsOffset, setStickerPropsOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    setIsSettingTweenEnd(false);
  }, [selectedStickerId]);

  const [isDragging, setIsDragging] = useState(false);
  const [draggedOverMomentId, setDraggedOverMomentId] = useState<string | null>(null);
  const [draggedOverSide, setDraggedOverSide] = useState<'left' | 'right' | null>(null);

  const dragCounter = useRef(0);
  const draggedMomentIdRef = useRef<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Load state from storage on mount
  useEffect(() => {
    const loadData = async () => {
      const savedMoments = await loadState<Moment[]>('photos'); // Keep key 'photos' for data compat
      const savedStories = await loadState<Story[]>('albums'); // Keep key 'albums' for data compat

      if (savedMoments && savedMoments.length > 0) {
        setMoments(savedMoments);
      } else {
        // Init samples if no data found
        const initialMoments: Moment[] = [];
        for (const [index, url] of SAMPLE_MOMENTS.entries()) {
          initialMoments.push({
            id: `sample-${index}`,
            url,
            mimeType: 'image/jpeg',
            source: 'sample',
            createdAt: Date.now() + index
          });
        }
        setMoments(initialMoments);
      }

      if (savedStories) {
        // Migration: Ensure proper terminology in loaded data
        const migratedStories = savedStories.map((s: any) => ({
          ...s,
          momentIds: s.momentIds || s.photoIds || [], // Migrate photoIds -> momentIds
          coverMomentUrl: s.coverMomentUrl || s.coverPhotoUrl // Migrate coverPhotoUrl -> coverMomentUrl
        }));
        setStories(migratedStories);
      }

      setIsStorageInitialized(true);
    };
    loadData();
  }, []);

  // Save state to storage whenever it changes
  useEffect(() => {
    if (!isStorageInitialized) return;
    saveState('photos', moments);
    saveState('albums', stories);
  }, [moments, stories, isStorageInitialized]);

  // Handle Drag and Drop
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Ignore internal drags
      if (e.dataTransfer?.types.includes('application/x-story-matrix-moment')) {
        return;
      }

      dragCounter.current++;
      if (e.dataTransfer) {
        setIsDragging(true);
      }
    };
    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current--;
      if (dragCounter.current === 0) {
        setIsDragging(false);
      }
    };
    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      dragCounter.current = 0;

      // 1. Handle Files (Desktop drag)
      if (e.dataTransfer?.types.includes('Files') && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        if (files.length > 0) {
          const processed = [];
          for (const file of files) {
            const result = await resizeImage(file);
            processed.push({ ...result, source: 'upload' as const });
          }
          handleAddMoments(processed);
        }
      }
      // 2. Handle URLs (Web drag, e.g. from Google Photos tab)
      else if (e.dataTransfer && e.dataTransfer.types.includes('text/uri-list')) {
        const uri = e.dataTransfer.getData('text/uri-list');
        const html = e.dataTransfer.getData('text/html');

        let imageUrl = uri;
        if (!imageUrl && html) {
          const srcMatch = html.match(/src="?([^"\s]+)"?/);
          if (srcMatch && srcMatch[1]) {
            imageUrl = srcMatch[1];
          }
        }

        if (imageUrl) {
          handleAddMoments([{
            url: imageUrl,
            base64: '',
            mimeType: 'image/unknown',
            source: 'url'
          }]);
        }
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  // Prepare photos for story mode (Respects Album Order)
  const storyMoments = useMemo(() => {
    // Story Mode only works within an album now
    if (view === 'story_detail' && currentStory) {
      const momentMap = new Map(moments.map(m => [m.id, m]));
      return currentStory.momentIds
        .map(id => momentMap.get(id))
        .filter((m): m is Moment => !!m);
    }
    return [];
  }, [moments, view, currentStory]);

  // Story Mode Keyboard Navigation
  useEffect(() => {
    if (!isStoryMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setStoryIndex(i => (i + 1) % storyMoments.length);
      } else if (e.key === 'ArrowLeft') {
        setStoryIndex(i => (i - 1 + storyMoments.length) % storyMoments.length);
      } else if (e.key === 'Escape') {
        setIsStoryMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStoryMode, storyMoments.length]);

  const handleAddMoments = (newFiles: { url: string; base64: string; mimeType: string; source: 'upload' | 'url' }[]) => {
    setMoments(prev => {
      const existingBase64 = new Set(prev.map(p => p.base64).filter(Boolean));
      const existingUrls = new Set(prev.map(p => p.url));

      const uniqueNewFiles = newFiles.filter(f => {
        if (f.base64 && existingBase64.has(f.base64)) return false;
        if (existingUrls.has(f.url)) return false;
        if (f.base64) existingBase64.add(f.base64);
        existingUrls.add(f.url);
        return true;
      });

      if (uniqueNewFiles.length === 0) return prev;

      const newMoments: Moment[] = uniqueNewFiles.map((f, i) => ({
        id: `moment-${Date.now()}-${i}`,
        url: f.url,
        base64: f.base64,
        mimeType: f.mimeType,
        source: f.source,
        createdAt: Date.now()
      }));
      return [...newMoments, ...prev];
    });
  };

  const deleteMoment = (id: string) => {
    setMoments(prev => prev.filter(m => m.id !== id));
    // Also remove from stories
    setStories(prev => prev.map(s => ({
      ...s,
      momentIds: s.momentIds.filter(mid => mid !== id)
    })));
    if (selectedMoment?.id === id) setSelectedMoment(null);
  };

  const deleteSelectedMoments = () => {
    const idsToDelete = Array.from(selectedMomentIds);
    setMoments(prev => prev.filter(m => !idsToDelete.includes(m.id)));
    setStories(prev => prev.map(s => ({
      ...s,
      momentIds: s.momentIds.filter(mid => !idsToDelete.includes(mid))
    })));
    setSelectedMomentIds(new Set());
    setIsSelectionMode(false);
  };

  const handleToggleSelection = (id: string) => {
    setSelectedMomentIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCreateStory = (name: string) => {
    const ids = Array.from(selectedMomentIds);
    // Find cover (first selected)
    const coverId = ids[0];
    const coverMoment = moments.find(m => m.id === coverId);

    const newStory: Story = {
      id: `story-${Date.now()}`,
      title: name,
      momentIds: ids,
      createdAt: Date.now(),
      coverMomentUrl: coverMoment?.url
    };

    setStories(prev => [newStory, ...prev]);
    setIsAddToStoryModalOpen(false);
    setIsSelectionMode(false);
    setSelectedMomentIds(new Set());

    // Switch to story view
    setCurrentStory(newStory);
    setView('story_detail');
  };

  const handleAddToExistingStory = (storyId: string) => {
    const ids = Array.from(selectedMomentIds);
    setStories(prev => prev.map(s => {
      if (s.id === storyId) {
        // Merge ids
        const newIds = Array.from(new Set([...s.momentIds, ...ids]));
        return { ...s, momentIds: newIds };
      }
      return s;
    }));
    setIsAddToStoryModalOpen(false);
    setIsSelectionMode(false);
    setSelectedMomentIds(new Set());
  };

  const handleReorder = (targetMoment: Moment, side: 'left' | 'right') => {
    const draggedId = draggedMomentIdRef.current;
    if (!draggedId || !currentStory) return;
    if (draggedId === targetMoment.id) {
      setDraggedOverMomentId(null);
      setDraggedOverSide(null);
      return;
    }

    const ids = [...currentStory.momentIds];
    const sourceIndex = ids.indexOf(draggedId);
    let targetIndex = ids.indexOf(targetMoment.id);

    if (sourceIndex === -1 || targetIndex === -1) return;

    // Remove from source
    ids.splice(sourceIndex, 1);

    // Re-calculate target index after removal
    targetIndex = ids.indexOf(targetMoment.id);

    // If dropped on the right, increment target index
    if (side === 'right') {
      targetIndex += 1;
    }

    ids.splice(targetIndex, 0, draggedId);

    const newStory = { ...currentStory, momentIds: ids };
    setCurrentStory(newStory);
    setStories(prev => prev.map(s => s.id === newStory.id ? newStory : s));

    setDraggedOverMomentId(null);
    setDraggedOverSide(null);
  };

  const updateMomentMetadata = (id: string) => {
    setMoments(prev => prev.map(m => {
      if (m.id === id) {
        return {
          ...m,
          metadata: {
            caption: m.metadata?.caption || '',
            tags: m.metadata?.tags || [],
            category: m.metadata?.category || 'Other',
            overlayText: editingTextValue,
            overlayFontSize: editingFontSize,
            overlayFontFamily: editingFontFamily,
            overlayColor: editingColor,
            overlayEffect: editingEffect,
            overlayWordEffects: editingWordEffects,
            stickers: editingStickers,
            isDialogue: isDialogueMode,
            characterName: editingCharacterName,
            characterPortrait: editingCharacterPortrait,
            characterPosition: editingCharacterPosition,
            choices: editingChoices
          }
        };
      }
      return m;
    }));
  };

  const openMoment = (moment: Moment) => {
    setSelectedMoment(moment);
    setEditingTextValue(moment.metadata?.overlayText || '');
    setEditingFontSize(moment.metadata?.overlayFontSize || 40);
    setEditingFontFamily(moment.metadata?.overlayFontFamily || 'Anton');
    setEditingColor(moment.metadata?.overlayColor || '#FFFFFF');
    setEditingEffect(moment.metadata?.overlayEffect || 'none');
    setEditingWordEffects(moment.metadata?.overlayWordEffects || []);
    setEditingStickers(moment.metadata?.stickers || []);

    // Dialogue
    setIsDialogueMode(!!moment.metadata?.isDialogue);
    setEditingDialogueType(moment.metadata?.dialogueType || 'speech');
    setEditingCharacterName(moment.metadata?.characterName || '');
    setEditingCharacterPortrait(moment.metadata?.characterPortrait || '');
    setEditingCharacterPosition(moment.metadata?.characterPosition || 'left');
    setEditingChoices(moment.metadata?.choices || []);

    setIsEditingText(true);
    setEditMode('text');
    setIsStickerPickerOpen(false);
    setSelectedWordIndex(null);
  };

  const saveText = () => {
    if (selectedMoment) {
      updateMomentMetadata(selectedMoment.id);
      setSelectedMoment(prev => prev ? {
        ...prev,
        metadata: {
          caption: prev.metadata?.caption || '',
          tags: prev.metadata?.tags || [],
          category: prev.metadata?.category || 'Other',
          overlayText: editingTextValue,
          overlayFontSize: editingFontSize,
          overlayFontFamily: editingFontFamily,
          overlayColor: editingColor,
          overlayEffect: editingEffect,
          overlayWordEffects: editingWordEffects,
          stickers: editingStickers,
          isDialogue: isDialogueMode,
          dialogueType: editingDialogueType,
          characterName: editingCharacterName,
          characterPortrait: editingCharacterPortrait,
          characterPosition: editingCharacterPosition,
          choices: editingChoices
        }
      } : null);
      setIsEditingText(false);
      setIsStickerPickerOpen(false);
      setSelectedWordIndex(null);
      setSelectedStickerId(null);
    }
  };

  const cancelEdit = () => {
    if (!selectedMoment) return;
    setEditingTextValue(selectedMoment.metadata?.overlayText || '');
    setEditingFontSize(selectedMoment.metadata?.overlayFontSize || 40);
    setEditingFontFamily(selectedMoment.metadata?.overlayFontFamily || 'Anton');
    setEditingColor(selectedMoment.metadata?.overlayColor || '#FFFFFF');
    setEditingEffect(selectedMoment.metadata?.overlayEffect || 'none');
    setEditingWordEffects(selectedMoment.metadata?.overlayWordEffects || []);
    setEditingStickers(selectedMoment.metadata?.stickers || []);
    setIsDialogueMode(!!selectedMoment.metadata?.isDialogue);
    setEditingDialogueType(selectedMoment.metadata?.dialogueType || 'speech');
    setEditingCharacterName(selectedMoment.metadata?.characterName || '');
    setEditingCharacterPortrait(selectedMoment.metadata?.characterPortrait || '');
    setEditingCharacterPosition(selectedMoment.metadata?.characterPosition || 'left');
    setEditingChoices(selectedMoment.metadata?.choices || []);
    setIsEditingText(false);
    setIsStickerPickerOpen(false);
    setSelectedWordIndex(null);
    setSelectedStickerId(null);
  };

  const addSticker = (content: string) => {
    const newSticker: Sticker = {
      id: `sticker-${Date.now()}`,
      content,
      x: 50,
      y: 50,
      scale: 1,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      animation: 'none'
    };
    setEditingStickers(prev => [...prev, newSticker]);
  };

  const handleStickerPickerDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = stickerPickerOffset.x;
    const initialY = stickerPickerOffset.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      setStickerPickerOffset({
        x: initialX + (moveEvent.clientX - startX),
        y: initialY + (moveEvent.clientY - startY)
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleStickerPropsDrag = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    const initialX = stickerPropsOffset.x;
    const initialY = stickerPropsOffset.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      setStickerPropsOffset({
        x: initialX + (moveEvent.clientX - startX),
        y: initialY + (moveEvent.clientY - startY)
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const updateSticker = (id: string, updates: Partial<Sticker>) => {
    setEditingStickers(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  // When text changes, adjust word effects array size to match
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newText = e.target.value;
    setEditingTextValue(newText);

    // Resize effects array
    const wordCount = newText.split(' ').length;
    setEditingWordEffects(prev => {
      const next = [...(prev || [])];
      // If growing, fill with null (or last effect?) - use null to inherit global
      while (next.length < wordCount) next.push(null);
      // If shrinking, slice
      if (next.length > wordCount) return next.slice(0, wordCount);
      return next;
    });
  };

  const handleEffectSelect = (effectValue: any) => {
    if (selectedWordIndex !== null) {
      // Apply to selected word
      setEditingWordEffects(prev => {
        const next = [...(prev || [])];
        // Ensure array is big enough
        const wordCount = editingTextValue.split(' ').length;
        while (next.length < wordCount) next.push(null);

        // Toggle: if clicking same effect, remove it? No, explicit 'none' exists.
        next[selectedWordIndex] = effectValue;
        return next;
      });
    } else {
      // Apply global default
      setEditingEffect(effectValue);
    }
  };

  const exportData = () => {
    // Export both moments and stories
    const data = { moments, stories };
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gallery-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setIsMobileMenuOpen(false);
  };

  const triggerImport = () => {
    importInputRef.current?.click();
    setIsMobileMenuOpen(false);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        // Handle legacy format (array of photos) vs new format (object with moments & stories)
        if (Array.isArray(parsed)) {
          // Legacy check
          const isValid = parsed.every(p => p.id && p.url);
          if (isValid) setMoments(parsed);
        } else {
          // Try new format / old format wrapper
          if (parsed.moments && Array.isArray(parsed.moments)) {
            setMoments(parsed.moments);
          } else if (parsed.photos && Array.isArray(parsed.photos)) {
            setMoments(parsed.photos);
          }

          if (parsed.stories && Array.isArray(parsed.stories)) {
            setStories(parsed.stories);
          } else if (parsed.albums && Array.isArray(parsed.albums)) {
            setStories(parsed.albums); // Map albums to stories if needed, structure matches
          }
        }

        if (importInputRef.current) importInputRef.current.value = '';
      } catch (err) {
        alert('Failed to parse backup file');
      }
    };
    reader.readAsText(file);
  };

  const filteredMoments = useMemo(() => {
    let list = moments;

    // Filter by Story if in story view
    if (view === 'story_detail' && currentStory) {
      const momentMap = new Map(list.map(m => [m.id, m]));
      list = currentStory.momentIds
        .map(id => momentMap.get(id))
        .filter((m): m is Moment => !!m);
    }

    if (!searchQuery.trim()) return list;
    // Simple search implementation
    const q = searchQuery.toLowerCase();
    return list.filter(m =>
      m.metadata?.caption?.toLowerCase().includes(q) ||
      m.metadata?.tags?.some(t => t.toLowerCase().includes(q))
    );
  }, [moments, searchQuery, view, currentStory]);

  // Story Mode Render Helper
  const currentStoryMoment = storyMoments[storyIndex];

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">

      {/* Header */}
      <header className={`sticky top-0 z-30 bg-white/90 backdrop-blur-sm px-4 h-16 flex items-center gap-4 border-b border-gray-200 transition-all ${isSelectionMode ? 'bg-blue-50 border-blue-200' : ''}`}>
        {/* Mobile Hamburger */}
        <button
          className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg -ml-2"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu size={24} />
        </button>

        {isSelectionMode ? (
          <div className="flex items-center justify-between w-full animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-4">
              <button onClick={() => { setIsSelectionMode(false); setSelectedMomentIds(new Set()); }} className="p-2 hover:bg-white rounded-full">
                <X size={20} className="text-gray-600" />
              </button>
              <span className="font-medium text-blue-900">{selectedMomentIds.size} Selected</span>
            </div>
            <div className="flex items-center gap-2">
              {selectedMomentIds.size > 0 && (
                <>
                  <button
                    onClick={() => setIsAddToStoryModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-full text-sm font-medium shadow-sm hover:bg-blue-50 transition-colors"
                  >
                    <FolderPlus size={18} />
                    <span className="hidden sm:inline">Add to Story</span>
                  </button>
                  <button
                    onClick={deleteSelectedMoments}
                    className="p-2 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors"
                  >
                    <Trash2 size={20} />
                  </button>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 pr-4 md:w-64">
              <div className="bg-blue-600 rounded-full p-1.5 hidden md:block">
                <ImageIcon className="text-white w-5 h-5" />
              </div>
              <span className="text-xl font-normal text-gray-600 tracking-tight block">Story Matrix</span>
            </div>

            <div className="flex-1 max-w-3xl">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-2.5 border-none rounded-lg bg-gray-100 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 focus:bg-white focus:shadow-md transition-all"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="ml-auto flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full text-sm font-medium transition-colors shadow-sm"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Upload</span>
            </button>
          </>
        )}
      </header>

      <div className="flex flex-1 relative">
        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-2xl transform transition-transform duration-300 ease-in-out
            md:shadow-none md:translate-x-0 md:static md:block md:p-4 md:sticky md:top-16 md:h-[calc(100vh-64px)] md:overflow-y-auto md:border-r md:border-gray-100
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="flex justify-between items-center p-4 md:hidden border-b border-gray-100 mb-2">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 rounded-full p-1.5">
                <ImageIcon className="text-white w-4 h-4" />
              </div>
              <span className="font-bold text-lg text-gray-800">Menu</span>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 text-gray-500 hover:bg-gray-100 rounded-full">
              <X size={24} />
            </button>
          </div>

          <div className="p-4 md:p-0">
            <nav className="space-y-1">
              <button
                onClick={() => { setView('timeline'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-full font-medium transition-colors ${view === 'timeline' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <ImageIcon size={20} /> Moments
              </button>
              <button
                onClick={() => { setView('stories'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-full font-medium transition-colors ${view === 'stories' || view === 'story_detail' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Grid size={20} /> Stories
              </button>
            </nav>

            <div className="mt-8 px-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Storage</h3>
              <div className="space-y-1">
                <button
                  onClick={exportData}
                  className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg text-sm transition-colors"
                >
                  <Download size={18} /> Save Backup
                </button>
                <button
                  onClick={triggerImport}
                  className="w-full flex items-center gap-3 px-3 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-lg text-sm transition-colors"
                >
                  <Upload size={18} /> Restore Backup
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Hidden File Input (Shared between Mobile/Desktop) */}
        <input
          type="file"
          ref={importInputRef}
          className="hidden"
          accept=".json"
          onChange={handleImportFile}
        />

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8">

          {/* Sub Header / Breadcrumbs */}
          <div className="flex items-center justify-between mb-6 h-10">
            {view === 'timeline' && (
              <>
                <h2 className="text-gray-800 font-medium text-lg">Moments</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsSelectionMode(!isSelectionMode)}
                    className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors flex items-center gap-2 ${isSelectionMode ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >
                    <CheckSquare size={14} />
                    {isSelectionMode ? 'Cancel Selection' : 'Select'}
                  </button>
                  <div className="text-xs text-gray-500 font-medium bg-gray-100 px-3 py-1.5 rounded-full flex items-center">
                    {filteredMoments.length} Items
                  </div>
                </div>
              </>
            )}

            {view === 'stories' && (
              <h2 className="text-gray-800 font-medium text-lg">Stories</h2>
            )}

            {view === 'story_detail' && currentStory && (
              <>
                <div className="flex items-center gap-2">
                  <button onClick={() => setView('stories')} className="p-1 hover:bg-gray-100 rounded-full">
                    <ArrowLeft size={20} />
                  </button>
                  <h2 className="text-gray-800 font-medium text-lg">{currentStory.title}</h2>
                  <span className="text-gray-400 text-sm ml-2">({filteredMoments.length})</span>
                </div>

                <button
                  onClick={() => {
                    if (filteredMoments.length > 0) {
                      setStoryIndex(0);
                      setIsStoryMode(true);
                    }
                  }}
                  disabled={filteredMoments.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-full text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <BookOpen size={18} />
                  <span className="hidden sm:inline">Play Story</span>
                </button>
              </>
            )}
          </div>

          {/* Views */}
          {view === 'stories' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {stories.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="bg-gray-100 p-6 rounded-full">
                    <Grid size={48} className="text-gray-300" />
                  </div>
                  <p className="text-gray-500 text-lg">No stories yet</p>
                  <p className="text-gray-400 text-sm">Select moments from your timeline to create one.</p>
                </div>
              ) : (
                stories.map(story => (
                  <StoryCard
                    key={story.id}
                    story={story}
                    onClick={(s) => {
                      setCurrentStory(s);
                      setView('story_detail');
                    }}
                  />
                ))
              )}
            </div>
          ) : (
            <>
              {filteredMoments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="bg-gray-100 p-6 rounded-full">
                    <ImageIcon size={48} className="text-gray-300" />
                  </div>
                  <p className="text-gray-500 text-lg">
                    {view === 'story_detail' ? 'This story is empty' : 'Your Moments are empty'}
                  </p>
                  {view === 'timeline' && <p className="text-gray-400 text-sm">Drag and drop photos here from your computer or Google Photos</p>}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                  {filteredMoments.map(moment => (
                    <MomentCard
                      key={moment.id}
                      moment={moment}
                      onDelete={deleteMoment}
                      onClick={openMoment}
                      isSelectionMode={isSelectionMode}
                      isSelected={selectedMomentIds.has(moment.id)}
                      onToggleSelect={handleToggleSelection}
                      draggable={view === 'story_detail' && !isSelectionMode}
                      onDragStart={(e, m) => {
                        e.dataTransfer.effectAllowed = 'move';
                        e.dataTransfer.setData('text/plain', m.id);
                        e.dataTransfer.setData('application/x-story-matrix-moment', m.id);
                        draggedMomentIdRef.current = m.id;
                      }}
                      onDragOverCard={(e, m) => {
                        if (draggedMomentIdRef.current === m.id) return;
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        const x = e.clientX - rect.left;
                        const side = x < rect.width / 2 ? 'left' : 'right';
                        setDraggedOverMomentId(m.id);
                        setDraggedOverSide(side);
                      }}
                      onDragLeaveCard={() => {
                        setDraggedOverMomentId(null);
                        setDraggedOverSide(null);
                      }}
                      dropIndicator={draggedOverMomentId === moment.id ? draggedOverSide : null}
                      onReorder={(m) => {
                        if (draggedOverSide) {
                          handleReorder(m, draggedOverSide);
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </>
          )}

        </main>
      </div>

      {/* Drag Overlay */}
      {isDragging && (
        <div
          className="fixed inset-0 z-50 bg-blue-500/10 backdrop-blur-sm border-8 border-blue-400 border-dashed m-4 rounded-3xl flex items-center justify-center animate-in fade-in duration-200"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
            dragCounter.current = 0;
          }}
        >
          <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center text-blue-600 pointer-events-none">
            <UploadCloud size={64} className="mb-4 animate-bounce" />
            <h2 className="text-2xl font-bold">Drop moments here</h2>
            <p className="text-sm text-gray-400 mt-2">Click anywhere to cancel</p>
          </div>
        </div>
      )}

      {/* Story Mode Overlay */}
      {isStoryMode && currentStoryMoment && (
        <div className="fixed inset-0 z-[60] bg-black animate-in fade-in duration-300">
          {/* Background Blurred Image */}
          <div
            className="absolute inset-0 z-0 opacity-40 blur-2xl scale-110"
            style={{
              backgroundImage: `url(${currentStoryMoment.url})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />

          {/* Top Bar (Overlay) */}
          <div className="absolute top-0 left-0 right-0 h-20 flex items-center justify-between px-6 z-50 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
            <div className="flex flex-col pointer-events-auto">
              <h2 className="text-white font-black text-xl tracking-tight leading-none">
                {currentStory?.title || 'Story Mode'}
              </h2>
              <span className="text-white/50 text-[10px] uppercase font-bold tracking-[0.2em] mt-1">
                {storyIndex + 1} / {storyMoments.length}
              </span>
            </div>
            <button
              onClick={() => setIsStoryMode(false)}
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-md pointer-events-auto"
            >
              <X size={24} />
            </button>
          </div>

          {/* Main Content (Full Screen) */}
          <div className="absolute inset-0 flex items-center justify-between px-4 md:px-12 w-full h-full z-10">
            {/* Previous Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setStoryIndex(i => (i - 1 + storyMoments.length) % storyMoments.length);
              }}
              className="z-40 p-4 rounded-full bg-black/30 hover:bg-white/10 text-white transition-all hover:scale-110 backdrop-blur-sm"
            >
              <ChevronLeft size={32} className="md:w-12 md:h-12" />
            </button>

            {/* Image Display */}
            <div className="flex-1 flex items-center justify-center h-full relative overflow-hidden mx-4">
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="relative h-screen w-full flex items-center justify-center group">
                  <img
                    src={currentStoryMoment.url}
                    className="h-screen w-full object-contain shadow-2xl transition-transform duration-700 group-hover:scale-[1.01]"
                    alt="Story item"
                  />
                  {/* Stickers for Story Mode */}
                  {currentStoryMoment.metadata?.stickers && (
                    <StickerDisplay stickers={currentStoryMoment.metadata.stickers} />
                  )}
                  {/* Dialogue System in Story Mode */}
                  {currentStoryMoment.metadata?.isDialogue ? (
                    <DialogueBox
                      name={currentStoryMoment.metadata.characterName}
                      text={currentStoryMoment.metadata.overlayText || ""}
                      portrait={currentStoryMoment.metadata.characterPortrait}
                      position={currentStoryMoment.metadata.characterPosition}
                      dialogueType={currentStoryMoment.metadata.dialogueType}
                      fontSize={currentStoryMoment.metadata.overlayFontSize}
                      fontFamily={currentStoryMoment.metadata.overlayFontFamily}
                      color={currentStoryMoment.metadata.overlayColor}
                      globalEffect={currentStoryMoment.metadata.overlayEffect}
                      wordEffects={currentStoryMoment.metadata.overlayWordEffects}
                      choices={currentStoryMoment.metadata.choices}
                      onChoiceSelect={(targetId) => {
                        const index = storyMoments.findIndex(m => m.id === targetId);
                        if (index !== -1) setStoryIndex(index);
                      }}
                    />
                  ) : (
                    /* Floating Overlay for Story Mode */
                    currentStoryMoment.metadata?.overlayText && (
                      <div className="absolute inset-0 flex items-end justify-center p-8 pointer-events-none">
                        <TypewriterText
                          text={currentStoryMoment.metadata.overlayText}
                          wordEffects={currentStoryMoment.metadata.overlayWordEffects}
                          globalEffect={currentStoryMoment.metadata.overlayEffect}
                          className="font-black text-center leading-tight tracking-wide break-words w-full"
                          style={{
                            fontSize: `calc(1vw + ${currentStoryMoment.metadata.overlayFontSize || 40}px)`,
                            fontFamily: currentStoryMoment.metadata.overlayFontFamily || 'Anton',
                            color: currentStoryMoment.metadata.overlayColor || '#FFFFFF',
                            textShadow: '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                          }}
                        />
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Next Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setStoryIndex(i => (i + 1) % storyMoments.length);
              }}
              className="z-40 p-4 rounded-full bg-black/30 hover:bg-white/10 text-white transition-all hover:scale-110 backdrop-blur-sm"
            >
              <ChevronRight size={32} className="md:w-12 md:h-12" />
            </button>
          </div>

        </div>
      )}

      {/* Lightbox */}
      {selectedMoment && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex animate-in fade-in duration-200"
          onClick={() => {
            // Prevent accidental closing if user is in the middle of editing
            if (isEditingText) return;
            setSelectedMoment(null);
          }}
        >
          {/* Top Toolbar */}
          <div
            className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center text-white z-20 bg-gradient-to-b from-black/50 to-transparent"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setSelectedMoment(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X size={24} />
            </button>

            {isEditingText && editMode === 'stickers' && !selectedStickerId && (
              <div className="absolute left-1/2 -translate-x-1/2 text-blue-200 text-xs font-medium bg-blue-600/20 px-4 py-1.5 rounded-full border border-blue-400/30 backdrop-blur-sm animate-in fade-in slide-in-from-top-4">
                Select a sticker on the image to adjust its properties.
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isEditingText && editMode === 'text') {
                    saveText();
                  } else {
                    setIsEditingText(true);
                    setEditMode('text');
                    setIsDialogueMode(false);
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors ${isEditingText && editMode === 'text'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
              >
                {isEditingText && editMode === 'text' ? <Check size={18} /> : <TypeIcon size={18} />}
                {isEditingText && editMode === 'text' ? 'Save Changes' : 'Edit Text'}
              </button>

              {isEditingText && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    cancelEdit();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-full font-medium transition-colors border border-red-500/30"
                >
                  <X size={18} />
                  Discard
                </button>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEditMode('stickers');
                  setIsStickerPickerOpen(!isStickerPickerOpen);
                  setIsEditingText(true);
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors ${isStickerPickerOpen || (isEditingText && editMode === 'stickers')
                  ? 'bg-yellow-600 text-white'
                  : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
              >
                <Smile size={18} />
                Stickers
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (isEditingText && editMode === 'dialogue') {
                    saveText();
                  } else {
                    setEditMode('dialogue');
                    setIsEditingText(true);
                    setIsDialogueMode(true);
                  }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors ${isEditingText && editMode === 'dialogue'
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-white/10 hover:bg-white/20 text-white'
                  }`}
              >
                <BookOpen size={18} />
                {isEditingText && editMode === 'dialogue' ? 'Save Changes' : 'Cinematic Box'}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteMoment(selectedMoment.id);
                }}
                className="p-2 hover:bg-red-500/20 text-red-400 rounded-full transition-colors"
              >
                <Trash2 size={24} />
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center w-full h-full relative overflow-hidden">
            {/* Blurred background to fill screen */}
            <div
              className="absolute inset-0 z-0 opacity-30 blur-3xl scale-125"
              style={{
                backgroundImage: `url(${selectedMoment.url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />

            <div
              className="relative z-10 w-full h-full flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative max-h-full max-w-full">
                <img
                  src={selectedMoment.url}
                  className="h-screen w-full object-contain shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-sm"
                  alt="Full view"
                />

                {/* Stickers Display (Lightbox) */}
                <StickerDisplay
                  stickers={isEditingText ? editingStickers : (selectedMoment.metadata?.stickers || [])}
                  isEditing={isEditingText}
                  selectedId={selectedStickerId}
                  onSelect={setSelectedStickerId}
                  onStickerUpdate={(updated) => setEditingStickers(updated)}
                  isDraggingEnd={isSettingTweenEnd}
                />

                {/* Dialogue System in Lightbox */}
                {isDialogueMode ? (
                  <DialogueBox
                    name={editingCharacterName}
                    text={editingTextValue}
                    portrait={editingCharacterPortrait}
                    position={editingCharacterPosition}
                    isEditing={true}
                    dialogueType={editingDialogueType}
                    fontSize={editingFontSize}
                    fontFamily={editingFontFamily}
                    color={editingColor}
                    globalEffect={editingEffect}
                    wordEffects={editingWordEffects}
                  />
                ) : (
                  /* Floating Overlay Text Display (Lightbox) */
                  ((!isEditingText && selectedMoment.metadata?.overlayText) || (isEditingText && editMode === 'stickers' && editingTextValue)) && (
                    <div className="absolute inset-0 flex items-end justify-center p-8 pointer-events-none">
                      <p
                        className="font-black text-center leading-tight tracking-wide break-words w-full"
                        style={{
                          fontSize: (isEditingText ? editingFontSize : (selectedMoment.metadata?.overlayFontSize || 40)) + 'px',
                          fontFamily: isEditingText ? editingFontFamily : (selectedMoment.metadata?.overlayFontFamily || 'Anton'),
                          color: isEditingText ? editingColor : (selectedMoment.metadata?.overlayColor || '#FFFFFF')
                        }}
                      >
                        {(isEditingText ? editingTextValue : selectedMoment.metadata!.overlayText!).split(' ').map((word, index) => {
                          const effect = isEditingText
                            ? (editingWordEffects?.[index] || editingEffect)
                            : (selectedMoment.metadata?.overlayWordEffects?.[index] || selectedMoment.metadata?.overlayEffect);
                          return (
                            <span
                              key={index}
                              className={effect && effect !== 'none' ? `effect-${effect}` : ''}
                              style={{
                                textShadow: effect && effect !== 'none'
                                  ? undefined
                                  : '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                                '--text-color': isEditingText ? editingColor : (selectedMoment.metadata?.overlayColor || '#FFFFFF'),
                                '--neon-duration': effect === 'neon' ? `${2 + (index % 3)}s` : undefined,
                                '--neon-delay': effect === 'neon' ? `${(index % 5) * -0.7}s` : undefined,
                              } as React.CSSProperties}
                            >
                              {word}{' '}
                            </span>
                          );
                        })}
                      </p>
                    </div>
                  )
                )}

                {/* Sticker Picker Popup */}
                {isStickerPickerOpen && (
                  <div
                    className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 pointer-events-auto w-64 z-50"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      transform: `translate(calc(-50% + ${stickerPickerOffset.x}px), ${stickerPickerOffset.y}px)`
                    }}
                  >
                    <div className="flex justify-between items-center px-1 cursor-move" onMouseDown={handleStickerPickerDrag}>
                      <span className="text-white text-xs font-bold uppercase tracking-wider opacity-50">Pick a Sticker</span>
                      <button onClick={() => setIsStickerPickerOpen(false)} className="text-white/50 hover:text-white">
                        <X size={14} />
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {SAMPLE_STICKERS.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => addSticker(emoji)}
                          className="text-2xl p-2 hover:bg-white/10 rounded-xl transition-all hover:scale-125"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sticker Properties Dialog */}
                {isEditingText && editMode === 'stickers' && selectedStickerId && (
                  <div
                    className="absolute top-2 left-1/2 -translate-x-1/2 bg-black/90 backdrop-blur-xl border border-blue-500/30 p-4 rounded-2xl shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 pointer-events-auto w-72 z-50"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      transform: `translate(calc(-50% + ${stickerPropsOffset.x}px), ${stickerPropsOffset.y}px)`
                    }}
                  >
                    <div className="flex justify-between items-center px-1">
                      <div className="flex items-center gap-2 text-blue-400 cursor-move" onMouseDown={handleStickerPropsDrag}>
                        <Move size={16} className="animate-pulse" />
                        <span className="text-[10px] uppercase font-bold text-blue-300 tracking-wider">Move Dialog</span>
                      </div>
                      <button onClick={() => setSelectedStickerId(null)} className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-lg">
                        <X size={14} />
                      </button>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] uppercase font-bold text-blue-300 w-16">Size</span>
                        <input
                          type="range"
                          min="0.1"
                          max="5"
                          step="0.1"
                          value={editingStickers.find(s => s.id === selectedStickerId)?.scale || 1}
                          onChange={(e) => updateSticker(selectedStickerId!, { scale: Number(e.target.value) })}
                          className="flex-1 h-1.5 bg-blue-900 rounded-lg appearance-none cursor-pointer accent-blue-400"
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] uppercase font-bold text-blue-300 w-16">Width</span>
                        <input
                          type="range"
                          min="0.1"
                          max="5"
                          step="0.1"
                          value={editingStickers.find(s => s.id === selectedStickerId)?.scaleX || 1}
                          onChange={(e) => updateSticker(selectedStickerId!, { scaleX: Number(e.target.value) })}
                          className="flex-1 h-1.5 bg-blue-900 rounded-lg appearance-none cursor-pointer accent-blue-400"
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] uppercase font-bold text-blue-300 w-16">Height</span>
                        <input
                          type="range"
                          min="0.1"
                          max="5"
                          step="0.1"
                          value={editingStickers.find(s => s.id === selectedStickerId)?.scaleY || 1}
                          onChange={(e) => updateSticker(selectedStickerId!, { scaleY: Number(e.target.value) })}
                          className="flex-1 h-1.5 bg-blue-900 rounded-lg appearance-none cursor-pointer accent-blue-400"
                        />
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] uppercase font-bold text-blue-300 w-16">Rotation</span>
                        <input
                          type="range"
                          min="-180"
                          max="180"
                          value={editingStickers.find(s => s.id === selectedStickerId)?.rotation || 0}
                          onChange={(e) => updateSticker(selectedStickerId!, { rotation: Number(e.target.value) })}
                          className="flex-1 h-1.5 bg-blue-900 rounded-lg appearance-none cursor-pointer accent-blue-400"
                        />
                      </div>
                      <div className="flex flex-wrap items-center justify-center gap-1.5 bg-black/40 p-1.5 rounded-xl border border-white/5">
                        {STICKER_ANIMATIONS.map(anim => {
                          const currentAnim = editingStickers.find(s => s.id === selectedStickerId)?.animation;
                          return (
                            <button
                              key={anim}
                              onClick={() => {
                                updateSticker(selectedStickerId!, { animation: anim });
                                if (anim === 'tween') {
                                  const s = editingStickers.find(st => st.id === selectedStickerId);
                                  if (s && s.endX === undefined) {
                                    updateSticker(selectedStickerId!, { endX: s.x, endY: s.y, tweenDuration: 2 });
                                  }
                                } else {
                                  setIsSettingTweenEnd(false);
                                }
                              }}
                              className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all ${currentAnim === anim ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                            >
                              {anim}
                            </button>
                          );
                        })}
                      </div>

                      {editingStickers.find(s => s.id === selectedStickerId)?.animation === 'tween' && (
                        <div className="flex flex-col gap-3 p-3 bg-blue-600/10 rounded-xl border border-blue-500/20 animate-in fade-in zoom-in-95">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-blue-300 uppercase">Motion Path</span>
                            <button
                              onClick={() => setIsSettingTweenEnd(!isSettingTweenEnd)}
                              className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${isSettingTweenEnd ? 'bg-yellow-500 text-black shadow-lg' : 'bg-white/10 text-white'}`}
                            >
                              {isSettingTweenEnd ? 'DRAGGING END' : 'EDIT END POSITION'}
                            </button>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] uppercase font-bold text-blue-300 w-16">Duration</span>
                            <input
                              type="range"
                              min="0.2"
                              max="10"
                              step="0.1"
                              value={editingStickers.find(s => s.id === selectedStickerId)?.tweenDuration || 2}
                              onChange={(e) => updateSticker(selectedStickerId!, { tweenDuration: Number(e.target.value) })}
                              className="flex-1 h-1.5 bg-blue-900 rounded-lg appearance-none cursor-pointer accent-blue-400"
                            />
                            <span className="text-white text-[10px] w-6">{editingStickers.find(s => s.id === selectedStickerId)?.tweenDuration || 2}s</span>
                          </div>
                          <p className="text-[9px] text-blue-300/60 leading-tight">
                            {isSettingTweenEnd
                              ? "Drag the sticker to set where it lands. A dashed line shows the path."
                              : "Sticker will move from its base position to the end position."}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Edit Mode Toolbar (Bottom) */}
            {isEditingText && (
              <div className="absolute inset-x-0 bottom-0 z-40 p-4 pointer-events-none">
                <div className="bg-black/80 backdrop-blur-md p-4 flex flex-col gap-4 animate-in slide-in-from-bottom-10 pointer-events-auto rounded-xl border border-white/10" onClick={(e) => e.stopPropagation()}>
                  {/* Row -1: Dialogue Controls */}
                  {editMode === 'dialogue' && (
                    <div className="flex flex-col gap-4 max-w-2xl mx-auto w-full animate-in fade-in zoom-in-95 py-2">
                      {/* Style Selector */}
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <button
                          onClick={() => setEditingDialogueType('speech')}
                          className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${editingDialogueType === 'speech' ? 'bg-purple-600 text-white shadow-lg scale-105' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                        >
                          <Smile size={14} />
                          Character Speech
                        </button>
                        <button
                          onClick={() => setEditingDialogueType('narration')}
                          className={`flex items-center gap-2 px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${editingDialogueType === 'narration' ? 'bg-purple-600 text-white shadow-lg scale-105' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                        >
                          <BookOpen size={14} />
                          Narrative Text
                        </button>
                      </div>

                      {editingDialogueType === 'speech' && (
                        <div className="flex flex-col md:flex-row gap-4 animate-in slide-in-from-top-2">
                          <div className="flex-1 flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase font-bold text-purple-300 ml-1">Character Name</label>
                            <input
                              type="text"
                              value={editingCharacterName}
                              onChange={(e) => setEditingCharacterName(e.target.value)}
                              placeholder="Enter character name..."
                              className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-all font-sans text-sm"
                            />
                          </div>
                          <div className="flex-1 flex flex-col gap-1.5">
                            <label className="text-[10px] uppercase font-bold text-purple-300 ml-1">Portrait URL</label>
                            <input
                              type="text"
                              value={editingCharacterPortrait}
                              onChange={(e) => setEditingCharacterPortrait(e.target.value)}
                              placeholder="Paste portrait image URL..."
                              className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-purple-500 transition-all font-sans text-sm"
                            />
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-4 px-1 justify-between">
                        <div className="flex items-center gap-3">
                          {editingDialogueType === 'speech' && (
                            <div className="flex items-center gap-3 animate-in fade-in">
                              <span className="text-[10px] uppercase font-bold text-purple-300">Position</span>
                              <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                                <button
                                  onClick={() => setEditingCharacterPosition('left')}
                                  className={`px-4 py-1 rounded-md text-[10px] font-bold transition-all ${editingCharacterPosition === 'left' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                  LEFT
                                </button>
                                <button
                                  onClick={() => setEditingCharacterPosition('right')}
                                  className={`px-4 py-1 rounded-md text-[10px] font-bold transition-all ${editingCharacterPosition === 'right' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                  RIGHT
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => {
                            setIsDialogueMode(false);
                            setEditMode('text');
                          }}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all bg-white/10 text-white border border-white/5 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-300`}
                        >
                          <Zap size={14} />
                          Switch to Floating Text
                        </button>
                      </div>

                      {/* Narrative Choices Editor */}
                      <div className="mt-2 bg-white/5 rounded-2xl border border-white/10 p-4">
                        <div className="flex items-center justify-between mb-3 px-1">
                          <h4 className="text-[10px] uppercase font-bold text-purple-300 tracking-widest flex items-center gap-2">
                            <Plus size={12} />
                            Narrative Choices
                          </h4>
                          <button
                            onClick={() => {
                              const newChoice: Choice = {
                                id: `choice-${Date.now()}`,
                                label: 'New Choice',
                                targetMomentId: ''
                              };
                              setEditingChoices([...editingChoices, newChoice]);
                            }}
                            className="text-[9px] font-black uppercase tracking-tighter bg-purple-600/50 hover:bg-purple-600 text-white px-3 py-1 rounded-full transition-all"
                          >
                            Add Choice
                          </button>
                        </div>

                        <div className="flex flex-col gap-3">
                          {editingChoices.length === 0 ? (
                            <p className="text-[10px] text-white/30 italic text-center py-2">No choices added. This moment will proceed sequentially.</p>
                          ) : (
                            editingChoices.map((choice, idx) => (
                              <div key={choice.id} className="flex gap-2 items-center bg-black/40 p-2 rounded-xl border border-white/5 animate-in slide-in-from-left-2 transition-all">
                                <div className="flex-1 flex flex-col gap-1">
                                  <label className="text-[8px] uppercase font-bold text-white/30 ml-1">Button Label</label>
                                  <input
                                    type="text"
                                    value={choice.label}
                                    onChange={(e) => {
                                      const next = [...editingChoices];
                                      next[idx] = { ...choice, label: e.target.value };
                                      setEditingChoices(next);
                                    }}
                                    placeholder="e.g. Follow him..."
                                    className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500/50"
                                  />
                                </div>
                                <div className="flex-1 flex flex-col gap-1">
                                  <label className="text-[8px] uppercase font-bold text-white/30 ml-1">Target Moment</label>
                                  <select
                                    value={choice.targetMomentId}
                                    onChange={(e) => {
                                      const next = [...editingChoices];
                                      next[idx] = { ...choice, targetMomentId: e.target.value };
                                      setEditingChoices(next);
                                    }}
                                    className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500/50"
                                  >
                                    <option value="">Select Target...</option>
                                    {storyMoments.map((m, mIdx) => (
                                      <option key={m.id} value={m.id}>
                                        {mIdx + 1}. {m.metadata?.caption || 'Untitled Moment'} ({m.id})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <button
                                  onClick={() => {
                                    setEditingChoices(editingChoices.filter(c => c.id !== choice.id));
                                  }}
                                  className="self-end mb-0.5 p-2 text-red-400 hover:bg-red-400/20 rounded-lg transition-all"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Row 0: Word Selector */}
                  {(editMode === 'text' || editMode === 'dialogue') && editingTextValue.trim() && (
                    <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto py-2">
                      <span className="text-white/50 text-xs w-full text-center mb-1">Tap words to apply effects:</span>
                      {editingTextValue.split(' ').map((word, index) => {
                        const active = selectedWordIndex === index;
                        const hasEffect = editingWordEffects?.[index] && editingWordEffects[index] !== 'none';
                        return (
                          <button
                            key={index}
                            onClick={() => setSelectedWordIndex(active ? null : index)}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-all border ${active ? 'bg-blue-600 border-blue-400 text-white scale-110 shadow-lg ring-2 ring-blue-300/50' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'} ${hasEffect && !active ? 'border-green-400/50 text-green-100' : ''}`}
                          >
                            {word}
                            {hasEffect && <span className="ml-1 text-[10px] text-green-400">★</span>}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Row 1: Font & Size */}
                  {(editMode === 'text' || editMode === 'dialogue') && (
                    <div className="flex flex-wrap items-center gap-4 justify-center text-white">
                      {editMode === 'text' && (
                        <button
                          onClick={() => {
                            setEditMode('dialogue');
                            setIsDialogueMode(true);
                          }}
                          className="flex items-center gap-2 px-3 py-1.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-400/30 rounded-lg text-xs font-bold transition-all"
                        >
                          <BookOpen size={14} />
                          Switch to Box Style
                        </button>
                      )}
                      <select value={editingFontFamily} onChange={(e) => setEditingFontFamily(e.target.value)} className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500">
                        {FONTS.map(font => <option key={font.value} value={font.value}>{font.name}</option>)}
                      </select>
                      <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-1.5">
                        <span className="text-xs text-gray-400">Size</span>
                        <input type="range" min="16" max="120" value={editingFontSize} onChange={(e) => setEditingFontSize(Number(e.target.value))} className="w-24 h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500" />
                        <span className="text-xs w-6 text-center">{editingFontSize}</span>
                      </div>
                    </div>
                  )}

                  {/* Row 2: Colors & Effects */}
                  {(editMode === 'text' || editMode === 'dialogue') && (
                    <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                      <div className="flex gap-2 bg-gray-800 p-1 rounded-lg">
                        {EFFECTS.map(effect => {
                          const isActive = selectedWordIndex !== null ? editingWordEffects?.[selectedWordIndex] === effect.value : editingEffect === effect.value;
                          return (
                            <button key={effect.value} onClick={() => handleEffectSelect(effect.value)} title={effect.name} className={`p-2 rounded-md transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}>
                              {effect.icon ? effect.icon : <span className="text-xs font-bold px-1">T</span>}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex items-center justify-center gap-2">
                        {COLORS.map(color => (
                          <button key={color} onClick={() => setEditingColor(color)} className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${editingColor === color ? 'border-white scale-110' : 'border-transparent'}`} style={{ backgroundColor: color }} />
                        ))}
                        {/* Custom color input */}
                        <div className="relative">
                          <label className="w-6 h-6 rounded-full bg-gradient-to-br from-red-500 via-green-500 to-blue-500 flex items-center justify-center cursor-pointer border-2 border-transparent hover:scale-110 transition-transform">
                            <input
                              type="color"
                              value={editingColor}
                              onChange={(e) => setEditingColor(e.target.value)}
                              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                            />
                            <Palette size={12} className="text-white drop-shadow-md" />
                          </label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Row 3: Input Field */}
                  {(editMode === 'text' || editMode === 'dialogue') && (
                    <div className="flex justify-center w-full">
                      <input
                        autoFocus
                        type="text"
                        value={editingTextValue}
                        onChange={handleTextChange}
                        placeholder={editMode === 'dialogue' ? "Enter dialogue line..." : "Type your caption..."}
                        className="w-full max-w-2xl bg-white/10 border-b-2 border-white/30 px-2 py-2 text-center focus:outline-none focus:border-blue-500 focus:bg-white/20 transition-all placeholder-white/50"
                        style={{
                          fontSize: editMode === 'dialogue' ? '20px' : Math.min(editingFontSize, 60) + 'px',
                          fontFamily: editMode === 'dialogue' ? 'inherit' : editingFontFamily,
                          color: editMode === 'dialogue' ? '#FFFFFF' : editingColor,
                          textShadow: editMode === 'dialogue' ? 'none' : '2px 2px 0 #000'
                        }}
                        onKeyDown={(e) => e.key === 'Enter' && saveText()}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <AddMomentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddMoments}
      />

      <AddToStoryModal
        isOpen={isAddToStoryModalOpen}
        onClose={() => setIsAddToStoryModalOpen(false)}
        stories={stories}
        onAddToNew={handleCreateStory}
        onAddToExisting={handleAddToExistingStory}
        selectedCount={selectedMomentIds.size}
      />
    </div >
  );
};

export default App;