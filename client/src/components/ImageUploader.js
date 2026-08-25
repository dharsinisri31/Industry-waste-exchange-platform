import React from 'react';
import { FiUploadCloud } from 'react-icons/fi';

export default function ImageUploader({ imagePreview, onImageChange }) {
  return (
    <div className="h-48 rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/30 relative overflow-hidden flex flex-col justify-center items-center p-4 hover:border-emerald-400 transition-colors">
      {imagePreview ? (
        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-xl" />
      ) : (
        <label className="flex flex-col items-center justify-center cursor-pointer space-y-2">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center border border-emerald-200">
            <FiUploadCloud className="w-5 h-5" />
          </div>
          <span className="text-xs text-gray-700 font-bold">Upload Material Image</span>
          <input type="file" onChange={onImageChange} className="hidden" accept="image/*" />
        </label>
      )}
    </div>
  );
}
