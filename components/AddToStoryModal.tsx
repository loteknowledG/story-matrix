import React, { useState } from 'react';
import { X, Plus, Folder, FolderPlus } from 'lucide-react';
import { Story } from '../types';

interface AddToStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  stories: Story[];
  onAddToNew: (name: string) => void;
  onAddToExisting: (storyId: string) => void;
  selectedCount: number;
}

export const AddToStoryModal: React.FC<AddToStoryModalProps> = ({
  isOpen,
  onClose,
  stories,
  onAddToNew,
  onAddToExisting,
  selectedCount
}) => {
  const [newStoryName, setNewStoryName] = useState('');
  const [mode, setMode] = useState<'select' | 'create'>('select');

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newStoryName.trim()) {
      onAddToNew(newStoryName);
      setNewStoryName('');
      setMode('select');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-medium text-gray-800">Add {selectedCount} items to...</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <X size={20} />
          </button>
        </div>

        <div className="p-2 overflow-y-auto">
          {mode === 'select' ? (
            <div className="space-y-1">
              {/* Create New Option */}
              <button
                onClick={() => setMode('create')}
                className="w-full flex items-center gap-4 p-3 hover:bg-blue-50 rounded-xl transition-colors text-left group"
              >
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <Plus size={24} />
                </div>
                <div>
                  <p className="font-medium text-gray-800">New Story</p>
                  <p className="text-xs text-gray-500">Create a new collection</p>
                </div>
              </button>

              <div className="h-px bg-gray-100 my-2 mx-4" />

              {/* Existing Stories */}
              {stories.length === 0 ? (
                <div className="p-4 text-center text-gray-400 text-sm">
                  No stories yet
                </div>
              ) : (
                stories.map(story => (
                  <button
                    key={story.id}
                    onClick={() => onAddToExisting(story.id)}
                    className="w-full flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl transition-colors text-left"
                  >
                    <div className="w-12 h-12 bg-gray-100 text-gray-500 rounded-lg flex items-center justify-center overflow-hidden">
                      {story.coverPhotoUrl ? (
                        <img src={story.coverPhotoUrl} className="w-full h-full object-cover" />
                      ) : (
                        <Folder size={24} />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{story.title}</p>
                      <p className="text-xs text-gray-500">{story.momentIds.length} items</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            <form onSubmit={handleCreate} className="p-4">
              <div className="flex items-center justify-center mb-6 text-blue-600">
                <FolderPlus size={48} />
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Story Title</label>
              <input
                autoFocus
                type="text"
                value={newStoryName}
                onChange={e => setNewStoryName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g., Summer 2024"
              />
              <div className="flex gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => setMode('select')}
                  className="flex-1 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!newStoryName.trim()}
                  className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};