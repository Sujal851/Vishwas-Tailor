import { useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const BUCKET = 'bill-photos';

export default function BillPhotoUpload({ value, onChange, orderId }) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  async function uploadFile(file) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error('Image too large (max 8MB)');
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop() || 'jpg';
      const fileName = `${orderId || 'temp'}-${Date.now()}.${ext}`;
      const filePath = `${fileName}`;

      const { error: uploadErr } = await supabase.storage
        .from(BUCKET)
        .upload(filePath, file, { cacheControl: '3600', upsert: false });

      if (uploadErr) throw uploadErr;

      const { data: publicUrlData } = supabase.storage
        .from(BUCKET)
        .getPublicUrl(filePath);

      onChange(publicUrlData.publicUrl);
      toast.success('Bill photo uploaded');
    } catch (err) {
      toast.error('Upload failed: ' + (err?.message || 'unknown error'));
      console.error('Bill photo upload error:', err);
    } finally {
      setUploading(false);
    }
  }

  function handleRemove() {
    onChange('');
  }

  return (
    <div className="space-y-2">
      <label className="text-xs text-gray-500 mb-1 block">Bill Photo</label>

      {value ? (
        <div className="relative w-40">
          <img
            src={value}
            alt="Bill"
            className="w-40 h-40 object-cover rounded border border-gray-300"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center shadow"
            title="Remove photo"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            disabled={uploading}
            onClick={() => cameraInputRef.current?.click()}
            className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 hover:border-gray-400 disabled:opacity-50"
          >
            📷 {uploading ? 'Uploading...' : 'Capture'}
          </button>
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 border border-gray-300 rounded text-sm text-gray-700 hover:border-gray-400 disabled:opacity-50"
          >
            📁 {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      )}

      {/* Capture via device camera */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={e => uploadFile(e.target.files?.[0])}
      />
      {/* Upload from gallery/files */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => uploadFile(e.target.files?.[0])}
      />
    </div>
  );
}