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
  Sparkles,
  Zap,
  Droplets,
  Menu,
  CheckSquare,
  FolderPlus,
  ArrowLeft
} from 'lucide-react';

import { Photo, PhotoMetadata, Album } from './types';
import { PhotoCard } from './components/PhotoCard';
import { AlbumCard } from './components/AlbumCard';
import { AddPhotoModal } from './components/AddPhotoModal';
import { AddToAlbumModal } from './components/AddToAlbumModal';
import { TypewriterText } from './components/TypewriterText';
import { resizeImage } from './utils';
import { saveState, loadState } from './storage';

// Sample data
const SAMPLE_PHOTOS: string[] = [
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
  { name: 'Sparkle', value: 'sparkle', icon: <Sparkles size={14} /> },
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

const App: React.FC = () => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddToAlbumModalOpen, setIsAddToAlbumModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Persistence State
  const [isStorageInitialized, setIsStorageInitialized] = useState(false);

  // Navigation State
  const [view, setView] = useState<'timeline' | 'albums' | 'album_detail'>('timeline');
  const [currentAlbum, setCurrentAlbum] = useState<Album | null>(null);

  // Selection & Editing
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null); // For Lightbox
  const [isEditingText, setIsEditingText] = useState(false);
  
  // Multi-Selection State
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());

  // Story Mode State
  const [isStoryMode, setIsStoryMode] = useState(false);
  const [storyIndex, setStoryIndex] = useState(0);
  
  // Edit State
  const [editingTextValue, setEditingTextValue] = useState('');
  const [editingFontSize, setEditingFontSize] = useState(40);
  const [editingFontFamily, setEditingFontFamily] = useState('Anton');
  const [editingColor, setEditingColor] = useState('#FFFFFF');
  const [editingEffect, setEditingEffect] = useState<PhotoMetadata['overlayEffect']>('none');
  const [editingWordEffects, setEditingWordEffects] = useState<PhotoMetadata['overlayWordEffects']>([]);
  const [selectedWordIndex, setSelectedWordIndex] = useState<number | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const importInputRef = useRef<HTMLInputElement>(null);

  // Load state from storage on mount
  useEffect(() => {
    const loadData = async () => {
      const savedPhotos = await loadState<Photo[]>('photos');
      const savedAlbums = await loadState<Album[]>('albums');

      if (savedPhotos && savedPhotos.length > 0) {
        setPhotos(savedPhotos);
      } else {
        // Init samples if no data found
        const initialPhotos: Photo[] = [];
        for (const [index, url] of SAMPLE_PHOTOS.entries()) {
          initialPhotos.push({
            id: `sample-${index}`,
            url,
            mimeType: 'image/jpeg',
            source: 'sample',
            createdAt: Date.now() + index
          });
        }
        setPhotos(initialPhotos);
      }

      if (savedAlbums) {
        setAlbums(savedAlbums);
      }
      
      setIsStorageInitialized(true);
    };
    loadData();
  }, []);

  // Save state to storage whenever it changes
  useEffect(() => {
    if (!isStorageInitialized) return;
    saveState('photos', photos);
    saveState('albums', albums);
  }, [photos, albums, isStorageInitialized]);

  // Handle Drag and Drop
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
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
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        if (files.length > 0) {
           const processed = [];
           for (const file of files) {
             const result = await resizeImage(file);
             processed.push({ ...result, source: 'upload' as const });
           }
           handleAddPhotos(processed);
        }
      } 
      // 2. Handle URLs (Web drag, e.g. from Google Photos tab)
      else if (e.dataTransfer) {
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
          handleAddPhotos([{
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

  // Prepare photos for story mode (Sorted Oldest -> Newest)
  const storyPhotos = useMemo(() => {
    // Story Mode only works within an album now
    if (view === 'album_detail' && currentAlbum) {
      return photos
        .filter(p => currentAlbum.photoIds.includes(p.id))
        .sort((a, b) => a.createdAt - b.createdAt);
    }
    return [];
  }, [photos, view, currentAlbum]);

  // Story Mode Keyboard Navigation
  useEffect(() => {
    if (!isStoryMode) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setStoryIndex(i => (i + 1) % storyPhotos.length);
      } else if (e.key === 'ArrowLeft') {
        setStoryIndex(i => (i - 1 + storyPhotos.length) % storyPhotos.length);
      } else if (e.key === 'Escape') {
        setIsStoryMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isStoryMode, storyPhotos.length]);

  const handleAddPhotos = (newFiles: { url: string; base64: string; mimeType: string; source: 'upload' | 'url' }[]) => {
    setPhotos(prev => {
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

      const newPhotos: Photo[] = uniqueNewFiles.map((f, i) => ({
        id: `photo-${Date.now()}-${i}`,
        url: f.url,
        base64: f.base64,
        mimeType: f.mimeType,
        source: f.source,
        createdAt: Date.now()
      }));
      return [...newPhotos, ...prev];
    });
  };

  const deletePhoto = (id: string) => {
    setPhotos(prev => prev.filter(p => p.id !== id));
    // Also remove from albums
    setAlbums(prev => prev.map(a => ({
      ...a,
      photoIds: a.photoIds.filter(pid => pid !== id)
    })));
    if (selectedPhoto?.id === id) setSelectedPhoto(null);
  };

  const deleteSelectedPhotos = () => {
    const idsToDelete = Array.from(selectedPhotoIds);
    setPhotos(prev => prev.filter(p => !idsToDelete.includes(p.id)));
    setAlbums(prev => prev.map(a => ({
      ...a,
      photoIds: a.photoIds.filter(pid => !idsToDelete.includes(pid))
    })));
    setSelectedPhotoIds(new Set());
    setIsSelectionMode(false);
  };

  const handleToggleSelection = (id: string) => {
    setSelectedPhotoIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCreateAlbum = (name: string) => {
    const ids = Array.from(selectedPhotoIds);
    // Find cover photo (first selected)
    const coverId = ids[0];
    const coverPhoto = photos.find(p => p.id === coverId);

    const newAlbum: Album = {
      id: `album-${Date.now()}`,
      title: name,
      photoIds: ids,
      createdAt: Date.now(),
      coverPhotoUrl: coverPhoto?.url
    };

    setAlbums(prev => [newAlbum, ...prev]);
    setIsAddToAlbumModalOpen(false);
    setIsSelectionMode(false);
    setSelectedPhotoIds(new Set());
    
    // Switch to album view
    setCurrentAlbum(newAlbum);
    setView('album_detail');
  };

  const handleAddToExistingAlbum = (albumId: string) => {
    const ids = Array.from(selectedPhotoIds);
    setAlbums(prev => prev.map(a => {
       if (a.id === albumId) {
         // Merge ids
         const newIds = Array.from(new Set([...a.photoIds, ...ids]));
         return { ...a, photoIds: newIds };
       }
       return a;
    }));
    setIsAddToAlbumModalOpen(false);
    setIsSelectionMode(false);
    setSelectedPhotoIds(new Set());
  };

  const updatePhotoMetadata = (id: string) => {
    setPhotos(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          metadata: {
            caption: p.metadata?.caption || '',
            tags: p.metadata?.tags || [],
            category: p.metadata?.category || 'Other',
            overlayText: editingTextValue,
            overlayFontSize: editingFontSize,
            overlayFontFamily: editingFontFamily,
            overlayColor: editingColor,
            overlayEffect: editingEffect,
            overlayWordEffects: editingWordEffects
          }
        };
      }
      return p;
    }));
  };

  const openPhoto = (photo: Photo) => {
    setSelectedPhoto(photo);
    setEditingTextValue(photo.metadata?.overlayText || '');
    setEditingFontSize(photo.metadata?.overlayFontSize || 40);
    setEditingFontFamily(photo.metadata?.overlayFontFamily || 'Anton');
    setEditingColor(photo.metadata?.overlayColor || '#FFFFFF');
    setEditingEffect(photo.metadata?.overlayEffect || 'none');
    setEditingWordEffects(photo.metadata?.overlayWordEffects || []);
    setIsEditingText(false);
    setSelectedWordIndex(null);
  };

  const saveText = () => {
    if (selectedPhoto) {
      updatePhotoMetadata(selectedPhoto.id);
      setSelectedPhoto(prev => prev ? {
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
            overlayWordEffects: editingWordEffects
        }
      } : null);
      setIsEditingText(false);
      setSelectedWordIndex(null);
    }
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
    // Export both photos and albums
    const data = { photos, albums };
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `gallery-backup-${new Date().toISOString().slice(0,10)}.json`;
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
        
        // Handle legacy format (array of photos) vs new format (object with photos & albums)
        if (Array.isArray(parsed)) {
          // Legacy check
          const isValid = parsed.every(p => p.id && p.url);
          if (isValid) setPhotos(parsed);
        } else if (parsed.photos && Array.isArray(parsed.photos)) {
          // New format
          setPhotos(parsed.photos);
          if (parsed.albums && Array.isArray(parsed.albums)) {
             setAlbums(parsed.albums);
          }
        }
        
        if (importInputRef.current) importInputRef.current.value = '';
      } catch (err) {
        alert('Failed to parse backup file');
      }
    };
    reader.readAsText(file);
  };

  const filteredPhotos = useMemo(() => {
    let list = photos;
    
    // Filter by Album if in album view
    if (view === 'album_detail' && currentAlbum) {
      list = list.filter(p => currentAlbum.photoIds.includes(p.id));
    }

    if (!searchQuery.trim()) return list;
    // Simple search implementation
    const q = searchQuery.toLowerCase();
    return list.filter(p => 
      p.metadata?.caption?.toLowerCase().includes(q) || 
      p.metadata?.tags?.some(t => t.toLowerCase().includes(q))
    );
  }, [photos, searchQuery, view, currentAlbum]);

  // Story Mode Render Helper
  const currentStoryPhoto = storyPhotos[storyIndex];

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
                 <button onClick={() => { setIsSelectionMode(false); setSelectedPhotoIds(new Set()); }} className="p-2 hover:bg-white rounded-full">
                    <X size={20} className="text-gray-600" />
                 </button>
                 <span className="font-medium text-blue-900">{selectedPhotoIds.size} Selected</span>
              </div>
              <div className="flex items-center gap-2">
                 {selectedPhotoIds.size > 0 && (
                   <>
                     <button 
                       onClick={() => setIsAddToAlbumModalOpen(true)}
                       className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 rounded-full text-sm font-medium shadow-sm hover:bg-blue-50 transition-colors"
                     >
                       <FolderPlus size={18} />
                       <span className="hidden sm:inline">Add to Album</span>
                     </button>
                     <button 
                       onClick={deleteSelectedPhotos}
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
                <ImageIcon size={20} /> Photos
              </button>
              <button 
                onClick={() => { setView('albums'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-full font-medium transition-colors ${view === 'albums' || view === 'album_detail' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Grid size={20} /> Albums
              </button>
              {/* Story Mode button removed from sidebar as it is now context-specific to Albums */}
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
                 <h2 className="text-gray-800 font-medium text-lg">Timeline</h2>
                 <div className="flex gap-2">
                    <button 
                      onClick={() => setIsSelectionMode(!isSelectionMode)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors flex items-center gap-2 ${isSelectionMode ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      <CheckSquare size={14} />
                      {isSelectionMode ? 'Cancel Selection' : 'Select'}
                    </button>
                    <div className="text-xs text-gray-500 font-medium bg-gray-100 px-3 py-1.5 rounded-full flex items-center">
                      {filteredPhotos.length} Items
                    </div>
                 </div>
              </>
            )}

            {view === 'albums' && (
              <h2 className="text-gray-800 font-medium text-lg">Albums</h2>
            )}

            {view === 'album_detail' && currentAlbum && (
               <>
                 <div className="flex items-center gap-2">
                   <button onClick={() => setView('albums')} className="p-1 hover:bg-gray-100 rounded-full">
                      <ArrowLeft size={20} />
                   </button>
                   <h2 className="text-gray-800 font-medium text-lg">{currentAlbum.title}</h2>
                   <span className="text-gray-400 text-sm ml-2">({filteredPhotos.length})</span>
                 </div>
                 
                 <button 
                    onClick={() => {
                      if (filteredPhotos.length > 0) {
                        setStoryIndex(0);
                        setIsStoryMode(true);
                      }
                    }}
                    disabled={filteredPhotos.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-full text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    <BookOpen size={18} />
                    <span className="hidden sm:inline">Play Story</span>
                 </button>
               </>
            )}
          </div>

          {/* Views */}
          {view === 'albums' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {albums.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="bg-gray-100 p-6 rounded-full">
                    <Grid size={48} className="text-gray-300" />
                  </div>
                  <p className="text-gray-500 text-lg">No albums yet</p>
                  <p className="text-gray-400 text-sm">Select photos from your timeline to create one.</p>
                </div>
              ) : (
                albums.map(album => (
                  <AlbumCard 
                    key={album.id} 
                    album={album}
                    onClick={(a) => {
                      setCurrentAlbum(a);
                      setView('album_detail');
                    }}
                  />
                ))
              )}
            </div>
          ) : (
            <>
              {filteredPhotos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                  <div className="bg-gray-100 p-6 rounded-full">
                    <ImageIcon size={48} className="text-gray-300" />
                  </div>
                  <p className="text-gray-500 text-lg">
                    {view === 'album_detail' ? 'This album is empty' : 'Your gallery is empty'}
                  </p>
                  {view === 'timeline' && <p className="text-gray-400 text-sm">Drag and drop photos here from your computer or Google Photos</p>}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                  {filteredPhotos.map(photo => (
                    <PhotoCard 
                      key={photo.id} 
                      photo={photo} 
                      onDelete={deletePhoto}
                      onClick={openPhoto}
                      isSelectionMode={isSelectionMode}
                      isSelected={selectedPhotoIds.has(photo.id)}
                      onToggleSelect={handleToggleSelection}
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
             <h2 className="text-2xl font-bold">Drop photos here</h2>
             <p className="text-sm text-gray-400 mt-2">Click anywhere to cancel</p>
           </div>
        </div>
      )}

      {/* Story Mode Overlay */}
      {isStoryMode && currentStoryPhoto && (
        <div className="fixed inset-0 z-[60] bg-black flex flex-col animate-in fade-in duration-300">
          <div className="absolute top-0 right-0 p-6 z-50">
            <button 
              onClick={() => setIsStoryMode(false)} 
              className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-between relative px-4 md:px-12 w-full h-full">
            {/* Previous Button */}
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setStoryIndex(i => (i - 1 + storyPhotos.length) % storyPhotos.length);
              }}
              className="absolute left-2 md:static z-20 p-2 md:p-4 rounded-full bg-black/30 md:bg-white/5 hover:bg-white/20 text-white transition-all md:hover:scale-110 backdrop-blur-sm md:backdrop-blur-none"
            >
              <ChevronLeft size={32} className="md:w-12 md:h-12" />
            </button>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center h-full relative p-4">
               <div className="relative max-h-full max-w-full">
                  <img 
                    src={currentStoryPhoto.url} 
                    className="max-h-[85vh] max-w-full object-contain shadow-2xl rounded-lg"
                    alt="Story item"
                  />
                  {/* Overlay for Story Mode */}
                  {currentStoryPhoto.metadata?.overlayText && (
                    <div className="absolute inset-0 flex items-end justify-center p-8 pointer-events-none">
                      <TypewriterText 
                        text={currentStoryPhoto.metadata.overlayText}
                        wordEffects={currentStoryPhoto.metadata.overlayWordEffects}
                        globalEffect={currentStoryPhoto.metadata.overlayEffect}
                        className="font-black text-center leading-tight tracking-wide break-words w-full"
                        style={{ 
                          // Only apply drop shadow if no specific effect is active to avoid conflict with effect shadows
                          textShadow: currentStoryPhoto.metadata.overlayEffect && currentStoryPhoto.metadata.overlayEffect !== 'none' 
                            ? undefined 
                            : '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                          fontSize: (currentStoryPhoto.metadata.overlayFontSize || 40) + 'px',
                          fontFamily: currentStoryPhoto.metadata.overlayFontFamily || 'Anton',
                          color: currentStoryPhoto.metadata.overlayColor || '#FFFFFF'
                        }}
                      />
                    </div>
                  )}
               </div>
            </div>

            {/* Next Button */}
            <button 
               onClick={(e) => {
                e.stopPropagation();
                setStoryIndex(i => (i + 1) % storyPhotos.length);
              }}
              className="absolute right-2 md:static z-20 p-2 md:p-4 rounded-full bg-black/30 md:bg-white/5 hover:bg-white/20 text-white transition-all md:hover:scale-110 backdrop-blur-sm md:backdrop-blur-none"
            >
              <ChevronRight size={32} className="md:w-12 md:h-12" />
            </button>
          </div>
          
          {/* Footer Info */}
          <div className="h-16 flex flex-col items-center justify-center text-white/50 bg-gradient-to-t from-black/80 to-transparent">
             <div className="text-sm font-medium tracking-widest uppercase mb-1">
                Story Mode: {currentAlbum?.title || 'Album'}
             </div>
             <div className="text-xs">
                {storyIndex + 1} of {storyPhotos.length}
             </div>
          </div>
        </div>
      )}

      {/* Lightbox */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex animate-in fade-in duration-200"
          onClick={() => {
            // Prevent accidental closing if user is in the middle of editing
            if (isEditingText) return;
            setSelectedPhoto(null);
          }}
        >
          {/* Top Toolbar */}
          <div 
            className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center text-white z-20 bg-gradient-to-b from-black/50 to-transparent"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={() => setSelectedPhoto(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <X size={24} />
            </button>
            <div className="flex gap-2">
              <button 
                onClick={(e) => {
                   e.stopPropagation();
                   if (isEditingText) {
                     saveText();
                   } else {
                     setIsEditingText(true);
                   }
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium transition-colors ${
                  isEditingText 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                {isEditingText ? <Check size={18} /> : <TypeIcon size={18} />}
                {isEditingText ? 'Save Text' : 'Edit Text'}
              </button>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  deletePhoto(selectedPhoto.id);
                }}
                className="p-2 hover:bg-red-500/20 text-red-400 rounded-full transition-colors"
              >
                <Trash2 size={24} />
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center p-4 w-full h-full relative">
            <div 
              className="relative max-h-full max-w-full" 
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={selectedPhoto.url} 
                className="max-h-[90vh] max-w-full object-contain shadow-2xl"
              />
              
              {/* Overlay Text Display (Lightbox) */}
              {!isEditingText && selectedPhoto.metadata?.overlayText && (
                <div className="absolute inset-0 flex items-end justify-center p-8 pointer-events-none">
                  <p 
                    className={`font-black text-center leading-tight tracking-wide break-words w-full`}
                    style={{ 
                      fontSize: (selectedPhoto.metadata.overlayFontSize || 40) + 'px',
                      fontFamily: selectedPhoto.metadata.overlayFontFamily || 'Anton',
                      color: selectedPhoto.metadata.overlayColor || '#FFFFFF'
                    }}
                  >
                    {selectedPhoto.metadata.overlayText.split(' ').map((word, index) => {
                      const effect = selectedPhoto.metadata?.overlayWordEffects?.[index] || selectedPhoto.metadata?.overlayEffect;
                      return (
                         <span 
                           key={index}
                           className={effect && effect !== 'none' ? `effect-${effect}` : ''}
                           style={{
                              textShadow: effect && effect !== 'none' 
                                ? undefined 
                                : '3px 3px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                           }}
                         >
                           {word}{' '}
                         </span>
                      );
                    })}
                  </p>
                </div>
              )}

              {/* Edit Mode Controls */}
              {isEditingText && (
                 <div className="absolute inset-0 flex flex-col justify-end">
                    {/* Toolbar */}
                    <div 
                      className="bg-black/80 backdrop-blur-md p-4 flex flex-col gap-4 animate-in slide-in-from-bottom-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Row 0: Word Selector */}
                      {editingTextValue.trim() && (
                        <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto py-2">
                           <span className="text-white/50 text-xs w-full text-center mb-1">Tap words to apply effects:</span>
                           {editingTextValue.split(' ').map((word, index) => {
                              const active = selectedWordIndex === index;
                              const hasEffect = editingWordEffects?.[index] && editingWordEffects[index] !== 'none';
                              
                              return (
                                <button
                                  key={index}
                                  onClick={() => setSelectedWordIndex(active ? null : index)}
                                  className={`
                                    px-3 py-1 rounded-full text-sm font-medium transition-all border
                                    ${active 
                                      ? 'bg-blue-600 border-blue-400 text-white scale-110 shadow-lg ring-2 ring-blue-300/50' 
                                      : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}
                                    ${hasEffect && !active ? 'border-green-400/50 text-green-100' : ''}
                                  `}
                                >
                                  {word}
                                  {hasEffect && <span className="ml-1 text-[10px] text-green-400">★</span>}
                                </button>
                              );
                           })}
                        </div>
                      )}

                      {/* Row 1: Font & Size */}
                      <div className="flex flex-wrap items-center gap-4 justify-center text-white">
                        <select 
                          value={editingFontFamily}
                          onChange={(e) => setEditingFontFamily(e.target.value)}
                          className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500"
                        >
                          {FONTS.map(font => (
                            <option key={font.value} value={font.value}>{font.name}</option>
                          ))}
                        </select>

                        <div className="flex items-center gap-2 bg-gray-800 rounded-lg px-3 py-1.5">
                          <span className="text-xs text-gray-400">Size</span>
                          <input 
                            type="range" 
                            min="16" 
                            max="120" 
                            value={editingFontSize}
                            onChange={(e) => setEditingFontSize(Number(e.target.value))}
                            className="w-24 h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                          />
                          <span className="text-xs w-6 text-center">{editingFontSize}</span>
                        </div>
                      </div>

                      {/* Row 2: Colors & Effects */}
                      <div className="flex flex-col md:flex-row items-center justify-center gap-4">
                        {/* Effects Selector */}
                        <div className="flex gap-2 bg-gray-800 p-1 rounded-lg">
                           {EFFECTS.map(effect => {
                             // Check if this effect is active (either globally or for selected word)
                             let isActive = false;
                             if (selectedWordIndex !== null) {
                               isActive = editingWordEffects?.[selectedWordIndex] === effect.value;
                             } else {
                               isActive = editingEffect === effect.value;
                             }

                             return (
                               <button
                                 key={effect.value}
                                 onClick={() => handleEffectSelect(effect.value)}
                                 title={effect.name}
                                 className={`p-2 rounded-md transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-gray-700'}`}
                               >
                                 {effect.icon ? effect.icon : <span className="text-xs font-bold px-1">T</span>}
                               </button>
                             );
                           })}
                        </div>

                        {/* Colors */}
                        <div className="flex items-center justify-center gap-2">
                           {COLORS.map(color => (
                             <button
                               key={color}
                               onClick={() => setEditingColor(color)}
                               className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${editingColor === color ? 'border-white scale-110' : 'border-transparent'}`}
                               style={{ backgroundColor: color }}
                             />
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

                      {/* Input Field */}
                      <div className="flex justify-center w-full">
                        <input 
                          autoFocus
                          type="text" 
                          value={editingTextValue}
                          onChange={handleTextChange}
                          placeholder="Type your caption..."
                          className={`w-full max-w-2xl bg-white/10 border-b-2 border-white/30 px-2 py-2 text-center focus:outline-none focus:border-blue-500 focus:bg-white/20 transition-all placeholder-white/50`}
                          style={{
                            fontSize: Math.min(editingFontSize, 60) + 'px', 
                            fontFamily: editingFontFamily,
                            color: editingColor,
                            // Preview rendering in input is tricky with word effects, so keep input simple
                            // The real preview is the image behind
                            textShadow: '2px 2px 0 #000'
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveText();
                          }}
                        />
                      </div>
                    </div>
                 </div>
              )}
            </div>
          </div>
        </div>
      )}

      <AddPhotoModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAdd={handleAddPhotos} 
      />

      <AddToAlbumModal
        isOpen={isAddToAlbumModalOpen}
        onClose={() => setIsAddToAlbumModalOpen(false)}
        albums={albums}
        onAddToNew={handleCreateAlbum}
        onAddToExisting={handleAddToExistingAlbum}
        selectedCount={selectedPhotoIds.size}
      />
    </div>
  );
};

export default App;