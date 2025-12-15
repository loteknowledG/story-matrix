import React from 'react';
import { Trash2, CheckCircle2, Circle } from 'lucide-react';
import { Photo } from '../types';

interface PhotoCardProps {
  photo: Photo;
  onDelete: (id: string) => void;
  onClick: (photo: Photo) => void;
  selected?: boolean; // For legacy lightbox selection or internal usage
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({ 
  photo, 
  onDelete, 
  onClick, 
  selected = false,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect
}) => {
  const handleClick = (e: React.MouseEvent) => {
    if (isSelectionMode && onToggleSelect) {
      e.stopPropagation();
      onToggleSelect(photo.id);
    } else {
      onClick(photo);
    }
  };

  const renderOverlayText = () => {
    if (!photo.metadata?.overlayText) return null;

    const words = photo.metadata.overlayText.split(' ');
    const globalEffect = photo.metadata.overlayEffect || 'none';
    const wordEffects = photo.metadata.overlayWordEffects || [];

    return (
      <div className="absolute inset-0 flex items-end justify-center p-2 pointer-events-none">
        <p 
          className="font-black text-center leading-tight tracking-wide break-words w-full"
          style={{ 
            fontSize: Math.max(12, (photo.metadata.overlayFontSize || 40) * 0.35) + 'px',
            fontFamily: photo.metadata.overlayFontFamily || 'Anton',
            color: photo.metadata.overlayColor || '#FFFFFF'
          }}
        >
          {words.map((word, index) => {
            const effect = wordEffects[index] || globalEffect;
            return (
              <span 
                key={index} 
                className={effect !== 'none' ? `effect-${effect}` : ''}
                style={{
                  textShadow: effect && effect !== 'none' 
                    ? undefined 
                    : '1px 1px 0 #000, -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000',
                }}
              >
                {word}{' '}
              </span>
            );
          })}
        </p>
      </div>
    );
  };

  return (
    <div 
      className={`
        group relative aspect-square bg-gray-100 overflow-hidden cursor-pointer transition-all duration-200
        ${(selected || isSelected) ? 'ring-4 ring-blue-500 z-10 scale-95 rounded-xl' : 'rounded-lg hover:rounded-xl'}
        ${isSelectionMode ? 'hover:bg-gray-50' : ''}
      `}
      onClick={handleClick}
    >
      <img 
        src={photo.url} 
        alt="Gallery item"
        className={`w-full h-full object-cover transition-transform duration-500 ${!isSelectionMode && 'group-hover:scale-105'}`}
        loading="lazy"
      />
      
      {/* Selection Indicator */}
      {isSelectionMode && (
        <div className="absolute top-2 left-2 z-20 transition-transform duration-200 active:scale-90">
           {isSelected ? (
             <div className="bg-white rounded-full text-blue-500 shadow-sm">
                <CheckCircle2 size={24} fill="currentColor" className="text-white" />
             </div>
           ) : (
             <div className="bg-black/20 hover:bg-black/40 rounded-full text-white backdrop-blur-sm shadow-sm p-0.5">
                <Circle size={20} className="stroke-2" />
             </div>
           )}
        </div>
      )}

      {renderOverlayText()}

      {selected && !isSelectionMode && (
        <div className="absolute top-2 left-2 text-blue-500 bg-white rounded-full">
          <CheckCircle2 size={20} fill="currentColor" className="text-white" />
        </div>
      )}

      {/* Hover Overlay (Only if NOT selection mode) */}
      {!isSelectionMode && (
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200">
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete(photo.id);
            }}
            className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white text-gray-700 hover:text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-sm"
            title="Remove from gallery"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  );
};