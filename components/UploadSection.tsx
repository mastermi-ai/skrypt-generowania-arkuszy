'use client';

import React, { useCallback } from 'react';
import { Upload, FileText, Image as ImageIcon, X } from 'lucide-react';

// Actually, I'll implement custom simple dropzone to avoid extra deps if possible, or just standard inputs for MVP.
// User asked for "drag & drop + input".
// I'll use standard HTML5 drag and drop API.

import { UploadedImage } from '@/types';

interface UploadSectionProps {
    onCsvUpload: (file: File) => void;
    onImagesUpload: (files: File[]) => void;
    csvFile?: File;
    images: UploadedImage[];
    onRemoveImage: (index: number) => void;
}

export function UploadSection({ onCsvUpload, onImagesUpload, csvFile, images, onRemoveImage }: UploadSectionProps) {
    const handleDrop = useCallback((e: React.DragEvent, type: 'csv' | 'image') => {
        e.preventDefault();
        e.stopPropagation();

        const files = Array.from(e.dataTransfer.files);
        if (files.length === 0) return;

        if (type === 'csv') {
            const csv = files.find(f => f.name.endsWith('.csv'));
            if (csv) onCsvUpload(csv);
        } else {
            const imgs = files.filter(f => f.type.startsWith('image/'));
            if (imgs.length > 0) onImagesUpload(imgs);
        }
    }, [onCsvUpload, onImagesUpload]);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    return (
        <div className="space-y-6">
            {/* CSV Upload */}
            <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">1. Orders (CSV)</h3>
                <div
                    className={`
            relative group border-2 border-dashed rounded-lg p-6 transition-all
            ${csvFile ? 'border-primary/50 bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-secondary/50'}
          `}
                    onDrop={(e) => handleDrop(e, 'csv')}
                    onDragOver={handleDragOver}
                >
                    <input
                        type="file"
                        accept=".csv"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => e.target.files?.[0] && onCsvUpload(e.target.files[0])}
                    />
                    <div className="flex flex-col items-center justify-center text-center gap-2">
                        <FileText className={`w-8 h-8 ${csvFile ? 'text-primary' : 'text-muted-foreground'}`} />
                        {csvFile ? (
                            <div>
                                <p className="text-sm font-medium text-foreground">{csvFile.name}</p>
                                <p className="text-xs text-muted-foreground">{(csvFile.size / 1024).toFixed(1)} KB</p>
                            </div>
                        ) : (
                            <div>
                                <p className="text-sm font-medium text-foreground">Drop CSV here</p>
                                <p className="text-xs text-muted-foreground">or click to browse</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Images Upload */}
            <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">2. Designs (PNG)</h3>
                <div
                    className="relative group border-2 border-dashed border-border hover:border-primary/50 hover:bg-secondary/50 rounded-lg p-6 transition-all"
                    onDrop={(e) => handleDrop(e, 'image')}
                    onDragOver={handleDragOver}
                >
                    <input
                        type="file"
                        accept="image/png"
                        multiple
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        onChange={(e) => e.target.files && onImagesUpload(Array.from(e.target.files))}
                    />
                    <div className="flex flex-col items-center justify-center text-center gap-2">
                        <Upload className="w-8 h-8 text-muted-foreground" />
                        <div>
                            <p className="text-sm font-medium text-foreground">Drop PNG files here</p>
                            <p className="text-xs text-muted-foreground">Upload multiple files</p>
                        </div>
                    </div>
                </div>

                {/* Image List */}
                {images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-2 max-h-40 overflow-y-auto pr-1">
                        {images.map((file, idx) => (
                            <div key={idx} className="relative group bg-secondary/30 rounded p-2 flex items-center gap-2 overflow-hidden border border-border">
                                <div className="w-8 h-8 bg-black/20 rounded flex items-center justify-center shrink-0">
                                    <ImageIcon className="w-4 h-4 text-muted-foreground" />
                                </div>
                                <span className="text-xs truncate flex-1" title={file.name}>{file.name}</span>
                                <button
                                    onClick={() => onRemoveImage(idx)}
                                    className="p-1 hover:bg-destructive/20 hover:text-destructive rounded transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
