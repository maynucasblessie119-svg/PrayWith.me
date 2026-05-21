import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  onImageSelected: (base64String: string | null) => void;
}

export default function ImageUpload({ onImageSelected }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse and validate loaded file
  const handleFile = (file: File) => {
    setError(null);

    // Validate type: JPG, PNG, WebP only
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setError('Please select a valid image type (JPG, PNG, WebP only).');
      return;
    }

    // Validate size: max 3MB (3 * 1024 * 1024 bytes)
    const maxSize = 3 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('Photo exceeds the 3MB size limit. Please select a smaller image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreviewUrl(result);
      onImageSelected(result); // Pass base64 data back to form
    };
    reader.onerror = () => {
      setError('Failed to process image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const removeImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(null);
    onImageSelected(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const selectFiles = () => {
    inputRef.current?.click();
  };

  return (
    <div className="w-full font-nunito" id="image-upload-wrapper">
      <input
        ref={inputRef}
        type="file"
        id="image-file-input"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleChange}
      />

      {previewUrl ? (
        // Previewing State with Remove Action
        <div className="relative w-full rounded-[14px] overflow-hidden border border-[#C4A882]/30 group" id="image-preview-container">
          <img
            id="uploaded-image-preview"
            src={previewUrl}
            alt="Prayer background preview"
            referrerPolicy="no-referrer"
            className="w-full h-48 object-cover object-center"
          />
          <div className="absolute inset-0 bg-neutral-950/20 pointer-events-none" />
          <button
            type="button"
            id="remove-image-button"
            onClick={removeImage}
            className="absolute top-3 right-3 bg-white/90 hover:bg-white text-[#3D3530] p-1.5 rounded-full shadow-lg transition-transform hover:scale-110 cursor-pointer"
            title="Remove picture"
          >
            <X size={16} />
          </button>
          <div className="absolute bottom-3 left-3 bg-black/50 backdrop-blur-xs text-white text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
            <ImageIcon size={12} />
            Background ready
          </div>
        </div>
      ) : (
        // Drag-and-drop / Browse Upload Area
        <div
          id="drag-drop-zone"
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={selectFiles}
          className={`w-full py-8 px-4 rounded-[14px] border-2 border-dashed flex flex-col items-center justify-center transition-all duration-300 cursor-pointer text-center
            ${dragActive 
              ? 'border-[#D4537E] bg-[#D4537E]/5' 
              : 'border-[#C4A882]/40 hover:border-[#B8976A] bg-[#FAF8F5]/50 hover:bg-[#F0EBE1]/30'
            }
          `}
        >
          <div className="p-3 bg-[#F0EBE1] rounded-full text-[#B8976A] mb-3 transition-colors duration-300 group-hover:bg-[#FAF8F5]">
            <Upload size={22} className="stroke-[1.8]" />
          </div>
          <p className="text-sm font-semibold text-[#3D3530]" id="upload-primary-text">
            Drag & drop an image here, or <span className="text-[#B8976A] hover:underline">browse</span>
          </p>
          <p className="text-xs text-[#3D3530]/60 mt-1 font-medium" id="upload-secondary-text">
            Supports JPG, PNG, WebP (Max 3MB)
          </p>
          <p className="text-[11px] text-[#C4A882] italic mt-2">
            An elegant fallback gradient is used automatically if no photo is chosen.
          </p>
        </div>
      )}

      {error && (
        <div className="mt-2 text-xs text-[#D4537E] font-medium" id="upload-error-message">
          {error}
        </div>
      )}
    </div>
  );
}
