import React from 'react';
import { Trash2, CheckCircle2, Circle } from 'lucide-react';
import { Moment } from '../types';
import { StickerDisplay } from './StickerDisplay';

interface MomentCardProps {
  moment: Moment;
  onDelete: (id: string) => void;
  onClick: (moment: Moment) => void;
  selected?: boolean; // For legacy lightbox selection or internal usage
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  draggable?: boolean;
  onReorder?: (targetMoment: Moment) => void;
  onDragStart?: (e: React.DragEvent, moment: Moment) => void;
  onDragOverCard?: (e: React.DragEvent, moment: Moment) => void;
  onDragLeaveCard?: (e: React.DragEvent, moment: Moment) => void;
  dropIndicator?: 'left' | 'right' | null;
}

export const MomentCard: React.FC<MomentCardProps> = ({
  moment,
  onDelete,
  onClick,
  selected = false,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
  draggable = false,
  onReorder,
  onDragStart,
  onDragOverCard,
  onDragLeaveCard,
  dropIndicator
}) => {
  const handleClick = (e: React.MouseEvent) => {
    if (isSelectionMode && onToggleSelect) {
      e.stopPropagation();
      onToggleSelect(moment.id);
    } else {
      onClick(moment);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    // Stop propagation so the global window drag listener doesn't see this as a file drag
    e.stopPropagation();

    if (draggable && onDragStart) {
      onDragStart(e, moment);
    } else if (draggable) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', moment.id);
      // Add a custom type to distinguish from external files
      e.dataTransfer.setData('application/x-story-matrix-moment', moment.id);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (draggable) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
      if (onDragOverCard) {
        onDragOverCard(e, moment);
      }
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (draggable && onDragLeaveCard) {
      e.preventDefault();
      e.stopPropagation();
      onDragLeaveCard(e, moment);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (draggable && onReorder) {
      e.preventDefault();
      e.stopPropagation();
      onReorder(moment);
    }
  };

  const renderOverlayText = () => {
    if (!moment.metadata?.overlayText) return null;

    const words = moment.metadata.overlayText.split(' ');
    const globalEffect = moment.metadata.overlayEffect || 'none';
    const wordEffects = moment.metadata.overlayWordEffects || [];

    return (
      <div className="absolute inset-0 flex items-end justify-center p-2 pointer-events-none">
        <p
          className="font-black text-center leading-tight tracking-wide break-words w-full"
          style={{
            fontSize: Math.max(12, (moment.metadata.overlayFontSize || 40) * 0.35) + 'px',
            fontFamily: moment.metadata.overlayFontFamily || 'Anton',
            color: moment.metadata.overlayColor || '#FFFFFF'
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
                  '--text-color': moment.metadata?.overlayColor || '#FFFFFF',
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
      draggable={draggable}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <img
        src={moment.url}
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

      {/* Stickers Display */}
      {moment.metadata?.stickers && moment.metadata.stickers.length > 0 && (
        <StickerDisplay
          stickers={moment.metadata.stickers}
          scale={0.5}
        />
      )}

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
              onDelete(moment.id);
            }}
            className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-white text-gray-700 hover:text-red-600 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-sm"
            title="Remove from gallery"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
      {/* Drop Indicators */}
      {dropIndicator === 'left' && (
        <div className="absolute left-0 top-0 bottom-0 w-1 z-50 animate-pulse">
          <div className="h-full border-l-4 border-dashed border-blue-500 -ml-0.5" />
        </div>
      )}
      {dropIndicator === 'right' && (
        <div className="absolute right-0 top-0 bottom-0 w-1 z-50 animate-pulse">
          <div className="h-full border-r-4 border-dashed border-blue-500 -mr-0.5" />
        </div>
      )}
    </div>
  );
};