import React from 'react';
import { TypewriterText } from './TypewriterText';
import { Choice } from '../types';

interface DialogueBoxProps {
    name?: string;
    text: string;
    portrait?: string;
    position?: 'left' | 'right';
    isEditing?: boolean;
    dialogueType?: 'speech' | 'narration';
    fontSize?: number;
    fontFamily?: string;
    color?: string;
    globalEffect?: 'none' | 'neon' | 'drip';
    wordEffects?: ('none' | 'neon' | 'drip' | null)[];
    choices?: Choice[];
    onChoiceSelect?: (targetMomentId: string) => void;
}

export const DialogueBox: React.FC<DialogueBoxProps> = ({
    name,
    text,
    portrait,
    position = 'left',
    isEditing = false,
    dialogueType = 'speech',
    fontSize,
    fontFamily,
    color,
    globalEffect,
    wordEffects,
    choices,
    onChoiceSelect
}) => {
    return (
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center justify-end p-6 md:p-12 z-40 pointer-events-none">
            <div className={`
                relative w-full max-w-5xl 
                bg-gradient-to-b from-black/60 to-black/90 
                backdrop-blur-xl border border-white/10 
                rounded-3xl p-6 md:p-8 
                shadow-[0_20px_50px_rgba(0,0,0,0.5)] 
                flex gap-6 md:gap-10 items-center 
                ${position === 'right' ? 'flex-row-reverse' : 'flex-row'} 
                pointer-events-auto
                animate-in slide-in-from-bottom-10 fade-in duration-500
            `}>

                {/* Decorative Accents */}
                <div className="absolute top-4 left-4 w-2 h-2 rounded-full bg-blue-500/50 animate-pulse" />
                <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500/50 animate-pulse" />

                {/* Portrait */}
                {dialogueType === 'speech' && portrait && (
                    <div className="relative shrink-0">
                        <div className="w-24 h-24 md:w-36 md:h-36 rounded-2xl overflow-hidden border-2 border-white/20 bg-slate-900 shadow-2xl relative z-10">
                            <img
                                src={portrait}
                                alt={name || "Character"}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        {/* Glow behind portrait */}
                        <div className="absolute -inset-1 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl blur-md opacity-30 -z-0" />
                    </div>
                )}

                {/* Content Area */}
                <div className={`flex-1 flex flex-col gap-3 ${dialogueType === 'narration' ? 'text-center italic' : (position === 'right' ? 'text-right' : 'text-left')}`}>
                    {dialogueType === 'speech' && name && (
                        <div className={`
                            relative inline-flex 
                            ${position === 'right' ? 'self-end' : 'self-start'}
                        `}>
                            <span className="text-blue-400 font-black uppercase tracking-[0.2em] text-xs md:text-sm drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">
                                {name}
                            </span>
                            <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-transparent" />
                        </div>
                    )}

                    <div
                        className="text-white/95 leading-relaxed drop-shadow-sm min-h-[3em]"
                        style={{
                            fontSize: fontSize ? `${fontSize}px` : '1.25rem',
                            fontFamily: fontFamily || 'inherit',
                            color: color || '#FFFFFF'
                        }}
                    >
                        {isEditing ? (
                            <p>{text || "Type dialogue here..."}</p>
                        ) : (
                            <TypewriterText
                                text={text}
                                speed={25}
                                globalEffect={globalEffect}
                                wordEffects={wordEffects}
                                className="font-sans"
                                style={{
                                    fontSize: fontSize ? `${fontSize}px` : 'inherit',
                                    fontFamily: fontFamily || 'inherit',
                                    color: color || 'inherit'
                                }}
                            />
                        )}
                    </div>

                    {/* Choices UI */}
                    {choices && choices.length > 0 && !isEditing && (
                        <div className={`flex flex-wrap gap-3 mt-4 ${dialogueType === 'narration' ? 'justify-center' : (position === 'right' ? 'justify-end' : 'justify-start')}`}>
                            {choices.map((choice) => (
                                <button
                                    key={choice.id}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onChoiceSelect?.(choice.targetMomentId);
                                    }}
                                    className="px-6 py-2.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-100 border border-blue-400/30 rounded-xl text-sm font-bold transition-all hover:scale-105 hover:shadow-[0_0_15px_rgba(59,130,246,0.5)] active:scale-95 animate-in zoom-in-95"
                                >
                                    {choice.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Next Indicator (Only show if no choices) */}
                {(!choices || choices.length === 0) && (
                    <div className="absolute bottom-4 right-6 text-white/30 animate-bounce">
                        <div className="w-2 h-2 border-r-2 border-b-2 border-white/50 rotate-45" />
                    </div>
                )}
            </div>
        </div>
    );
};
