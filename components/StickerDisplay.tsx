import React from 'react';
import { Sticker } from '../types';

interface StickerDisplayProps {
    stickers: Sticker[];
    isEditing?: boolean;
    selectedId?: string | null;
    onSelect?: (id: string | null) => void;
    onStickerUpdate?: (updatedStickers: Sticker[]) => void;
    scale?: number; // Overall scale for small displays (like MomentCard)
    isDraggingEnd?: boolean;
}

export const StickerDisplay: React.FC<StickerDisplayProps> = ({
    stickers = [],
    isEditing = false,
    selectedId = null,
    onSelect,
    onStickerUpdate,
    scale = 1,
    isDraggingEnd = false
}) => {
    const containerRef = React.useRef<HTMLDivElement>(null);

    if (!stickers || stickers.length === 0) return null;

    const handleUpdate = (id: string, updates: Partial<Sticker>) => {
        if (!onStickerUpdate) return;
        const newStickers = stickers.map(s => s.id === id ? { ...s, ...updates } : s);
        onStickerUpdate(newStickers);
    };

    const handleRemove = (id: string) => {
        if (!onStickerUpdate) return;
        const newStickers = stickers.filter(s => s.id !== id);
        onStickerUpdate(newStickers);
        if (onSelect && selectedId === id) onSelect(null);
    };

    const handleDragStart = (e: React.MouseEvent, sticker: Sticker) => {
        if (!isEditing || !onStickerUpdate) return;
        e.preventDefault();
        e.stopPropagation();

        if (onSelect) onSelect(sticker.id);

        const startX = e.clientX;
        const startY = e.clientY;
        const initialX = isDraggingEnd ? (sticker.endX ?? sticker.x) : sticker.x;
        const initialY = isDraggingEnd ? (sticker.endY ?? sticker.y) : sticker.y;

        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();

        const handleMouseMove = (moveEvent: MouseEvent) => {
            const deltaX = ((moveEvent.clientX - startX) / rect.width) * 100;
            const deltaY = ((moveEvent.clientY - startY) / rect.height) * 100;

            const newX = Math.max(0, Math.min(100, initialX + deltaX));
            const newY = Math.max(0, Math.min(100, initialY + deltaY));

            if (isDraggingEnd) {
                handleUpdate(sticker.id, { endX: newX, endY: newY });
            } else {
                handleUpdate(sticker.id, { x: newX, y: newY });
            }
        };

        const handleMouseUp = () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    };

    return (
        <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none">
            {stickers.map((sticker) => {
                const isSelected = sticker.id === selectedId;
                const isTween = sticker.animation === 'tween';
                const duration = sticker.tweenDuration || 2;
                const animationClass = sticker.animation !== 'none' ? `animate-sticker-${sticker.animation}` : '';

                // For tween animation, we ONLY want it on the parent div because it controls left/top
                // For other animations (float, pulse, etc), we apply them to the inner div to avoid layout shifts
                const parentAnimationClass = isTween && !isEditing ? animationClass : '';
                const childAnimationClass = !isTween && !isEditing ? animationClass : '';

                const endX = sticker.endX ?? sticker.x;
                const endY = sticker.endY ?? sticker.y;

                return (
                    <React.Fragment key={sticker.id}>
                        {/* Connection Line when editing tween */}
                        {isEditing && isSelected && isTween && isDraggingEnd && (
                            <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
                                <line
                                    x1={`${sticker.x}%`}
                                    y1={`${sticker.y}%`}
                                    x2={`${endX}%`}
                                    y2={`${endY}%`}
                                    stroke="#3b82f6"
                                    strokeWidth="2"
                                    strokeDasharray="4 4"
                                    className="animate-pulse"
                                />
                                <circle cx={`${sticker.x}%`} cy={`${sticker.y}%`} r="4" fill="#3b82f6" />
                            </svg>
                        )}

                        {/* Ghost Sticker at Start Position when editing end */}
                        {isEditing && isSelected && isTween && isDraggingEnd && (
                            <div
                                className="absolute opacity-30 pointer-events-none text-5xl"
                                style={{
                                    left: `${sticker.x}%`,
                                    top: `${sticker.y}%`,
                                    transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${(sticker.scaleX || 1) * sticker.scale * scale}, ${(sticker.scaleY || 1) * sticker.scale * scale})`,
                                    zIndex: 30
                                }}
                            >
                                {sticker.content}
                            </div>
                        )}

                        <div
                            className={`absolute pointer-events-auto group ${isEditing ? 'cursor-move' : ''} ${parentAnimationClass}`}
                            onMouseDown={(e) => handleDragStart(e, sticker)}
                            style={{
                                left: isTween && !isEditing ? undefined : (isDraggingEnd && isSelected ? `${endX}%` : `${sticker.x}%`),
                                top: isTween && !isEditing ? undefined : (isDraggingEnd && isSelected ? `${endY}%` : `${sticker.y}%`),
                                transform: `translate(-50%, -50%) rotate(${sticker.rotation}deg) scale(${(sticker.scaleX || 1) * sticker.scale * scale}, ${(sticker.scaleY || 1) * sticker.scale * scale})`,
                                transition: isEditing ? 'none' : 'all 0.3s ease-out',
                                zIndex: isSelected ? 40 : 10,
                                '--tween-start-x': `${sticker.x}%`,
                                '--tween-start-y': `${sticker.y}%`,
                                '--tween-end-x': `${endX}%`,
                                '--tween-end-y': `${endY}%`,
                                '--tween-duration': `${duration}s`,
                            } as React.CSSProperties}
                        >
                            {/* Sticker Content */}
                            <div className={`text-5xl select-none ${childAnimationClass} ${isEditing ? 'pointer-events-auto' : ''} ${sticker.content === '💧' ? 'sticker-drip' : ''}`}>
                                {sticker.content}
                            </div>

                            {/* Editing Controls */}
                            {isEditing && (
                                <>
                                    <div className={`absolute -top-6 -right-6 flex gap-1 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                        <button
                                            onMouseDown={(e) => e.stopPropagation()}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemove(sticker.id);
                                            }}
                                            className="p-1 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg pointer-events-auto"
                                            title="Remove sticker"
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                        </button>
                                    </div>

                                    {/* Visual indicator for drag area */}
                                    <div className={`absolute inset-0 border-2 rounded-lg pointer-events-none transition-all -m-4 ${isSelected ? 'border-blue-500 opacity-100' : 'border-dashed border-blue-400 opacity-0 group-hover:opacity-50'} ${isDraggingEnd && isSelected ? 'border-yellow-500' : ''}`} />

                                    {/* Label for End Position */}
                                    {isDraggingEnd && isSelected && (
                                        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shadow-lg">
                                            END POSITION
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </React.Fragment>
                );
            })}
        </div>
    );
};
