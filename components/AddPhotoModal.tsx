import React, { useState, useRef } from 'react';
import { X, Upload, Link as LinkIcon, Image as ImageIcon, Loader2, ExternalLink, Download } from 'lucide-react';
import { resizeImage, processUrlImage } from '../utils';

interface AddPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (files: { url: string; base64: string; mimeType: string; source: 'upload' | 'url' }[]) => void;
}

export const AddPhotoModal: React.FC<AddPhotoModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'google' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setLoading(true);
      setError('');
      try {
        const processedFiles = [];
        for (let i = 0; i < e.target.files.length; i++) {
          const file = e.target.files[i];
          const result = await resizeImage(file);
          processedFiles.push({ ...result, source: 'upload' as const });
        }
        onAdd(processedFiles);
        onClose();
      } catch (err) {
        setError('Failed to process image.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setLoading(true);
    setError('');

    try {
      if (urlInput.includes('photos.app.goo.gl')) {
        throw new Error("Google Photos share links are not direct images. Please open the image, right-click, and select 'Copy Image Address'.");
      }
      let imageData;
      try {
        imageData = await processUrlImage(urlInput);
      } catch (corsError) {
        throw new Error("Cannot access this image URL. Try downloading it instead.");
      }
      onAdd([{ 
        url: urlInput, 
        base64: imageData.base64, 
        mimeType: imageData.mimeType, 
        source: 'url' 
      }]);
      setUrlInput('');
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-google font-medium text-gray-800">Add photos</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-4 pt-2 border-b border-gray-100">
          <button
            onClick={() => setActiveTab('upload')}
            className={`pb-3 px-4 text-sm font-medium transition-colors relative ${
              activeTab === 'upload' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Computer
            {activeTab === 'upload' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />}
          </button>
          <button
            onClick={() => setActiveTab('google')}
            className={`pb-3 px-4 text-sm font-medium transition-colors relative ${
              activeTab === 'google' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Google Photos
            {activeTab === 'google' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />}
          </button>
          <button
            onClick={() => setActiveTab('url')}
            className={`pb-3 px-4 text-sm font-medium transition-colors relative ${
              activeTab === 'url' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            From Link
            {activeTab === 'url' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />}
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-red-600 text-sm flex items-center gap-2">
               <span className="font-bold">!</span> {error}
            </div>
          )}

          {activeTab === 'upload' && (
            <div 
              className="border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-xl py-12 flex flex-col items-center justify-center cursor-pointer transition-colors bg-gray-50"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                multiple 
                onChange={handleFileUpload} 
              />
              {loading ? (
                <Loader2 className="animate-spin text-blue-600 mb-3" size={32} />
              ) : (
                <div className="bg-blue-100 p-3 rounded-full mb-3 text-blue-600">
                  <Upload size={24} />
                </div>
              )}
              <p className="text-gray-700 font-medium">Select from computer</p>
              <p className="text-gray-400 text-sm mt-1">or drag and drop here</p>
            </div>
          )}

          {activeTab === 'google' && (
            <div className="flex flex-col gap-4 text-center">
              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-left">
                <h3 className="font-medium text-yellow-800 text-sm mb-1">Import Instructions</h3>
                <p className="text-yellow-700 text-xs leading-relaxed">
                  Due to privacy security, you cannot directly browse your private cloud photos here. 
                  However, you can easily drag and drop them from the Google Photos website.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 text-left">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</span>
                  <span className="text-sm text-gray-600">Open <strong className="text-gray-900">Google Photos</strong> in a new tab</span>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 text-left">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">2</span>
                  <span className="text-sm text-gray-600">Drag images from that tab <strong>directly onto this page</strong></span>
                </div>
              </div>

              <a 
                href="https://photos.google.com" 
                target="_blank" 
                rel="noreferrer"
                className="mt-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
              >
                Open Google Photos <ExternalLink size={16} />
              </a>
            </div>
          )}

          {activeTab === 'url' && (
            <form onSubmit={handleUrlSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm text-gray-600 mb-2 font-medium">Paste image address</label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-3 text-gray-400" size={18} />
                  <input 
                    type="url" 
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://..."
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2.5 pl-10 pr-4 text-gray-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    autoFocus
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={loading || !urlInput.trim()}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="animate-spin" size={16} />}
                Add Image
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
