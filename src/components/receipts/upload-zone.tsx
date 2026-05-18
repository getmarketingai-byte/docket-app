'use client';

import { useRef, useState, useCallback } from 'react';
import { Upload, Camera, X, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

type FileStatus = 'pending' | 'uploading' | 'done' | 'error';

type FileItem = {
  id: string;
  file: File;
  status: FileStatus;
  receiptId?: string;
  error?: string;
};

type Props = {
  onUploadComplete?: (receiptId: string) => void;
};

const ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,.pdf';
const MAX_SIZE = 20 * 1024 * 1024; // 20MB

export function UploadZone({ onUploadComplete }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<FileItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(async (item: FileItem) => {
    setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'uploading' } : f));
    try {
      const formData = new FormData();
      formData.append('file', item.file);
      const res = await fetch('/api/receipts/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json() as { receiptId: string };
      setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'done', receiptId: data.receiptId } : f));
      onUploadComplete?.(data.receiptId);
    } catch {
      setFiles(prev => prev.map(f => f.id === item.id ? { ...f, status: 'error', error: 'Upload failed' } : f));
    }
  }, [onUploadComplete]);

  const addFiles = useCallback((incoming: File[]) => {
    const valid = incoming.filter(f => f.size <= MAX_SIZE);
    const items: FileItem[] = valid.map(f => ({ id: crypto.randomUUID(), file: f, status: 'pending' }));
    setFiles(prev => [...prev, ...items]);
    items.forEach(item => uploadFile(item));
  }, [uploadFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  }, [addFiles]);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);

  const statusIcon = (status: FileStatus) => {
    if (status === 'uploading') return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    if (status === 'done') return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === 'error') return <AlertCircle className="h-4 w-4 text-red-500" />;
    return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  };

  return (
    <div className="space-y-4">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
          isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/30'
        }`}
      >
        <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
        <p className="text-base font-medium">Drop receipts here or click to browse</p>
        <p className="text-sm text-muted-foreground mt-1">JPEG, PNG, WebP, HEIC, PDF — max 20MB</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPT}
          className="hidden"
          onChange={e => { if (e.target.files) addFiles(Array.from(e.target.files)); e.target.value = ''; }}
        />
      </div>

      <div className="flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => cameraInputRef.current?.click()}
          className="gap-2"
        >
          <Camera className="h-4 w-4" />
          Take a photo
        </Button>
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={e => { if (e.target.files) addFiles(Array.from(e.target.files)); e.target.value = ''; }}
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Upload queue</p>
            <button
              onClick={() => setFiles(f => f.filter(x => x.status !== 'done'))}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Clear done
            </button>
          </div>
          {files.map(f => (
            <div key={f.id} className="flex items-center gap-3 text-sm p-2 rounded-lg bg-muted/30">
              {statusIcon(f.status)}
              <span className="flex-1 truncate">{f.file.name}</span>
              <span className="text-xs text-muted-foreground capitalize">{f.status}</span>
              <button onClick={() => setFiles(prev => prev.filter(x => x.id !== f.id))}>
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
