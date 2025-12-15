import React from 'react';
import { Folder } from 'lucide-react';
import { Album } from '../types';

interface AlbumCardProps {
  album: Album;
  onClick: (album: Album) => void;
}

export const AlbumCard: React.FC<AlbumCardProps> = ({ album, onClick }) => {
  return (
    <div 
      onClick={() => onClick(album)}
      className="group cursor-pointer flex flex-col gap-2"
    >
      <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden relative shadow-sm group-hover:shadow-md transition-all border border-gray-100">
         {album.coverPhotoUrl ? (
           <img 
             src={album.coverPhotoUrl} 
             alt={album.title}
             className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
           />
         ) : (
           <div className="w-full h-full flex items-center justify-center text-blue-200 bg-blue-50">
              <Folder size={64} strokeWidth={1} />
           </div>
         )}
         <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
         
         {/* Stack effect */}
         <div className="absolute top-0 right-0 w-full h-full border-t-2 border-r-2 border-white/50 rounded-2xl pointer-events-none" />
      </div>
      <div>
         <h3 className="font-medium text-gray-900 leading-tight group-hover:text-blue-600 transition-colors truncate">{album.title}</h3>
         <p className="text-xs text-gray-500">{album.photoIds.length} items</p>
      </div>
    </div>
  );
}