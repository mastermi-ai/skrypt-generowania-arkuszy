
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { UploadSection } from '@/components/UploadSection';
import { SheetPreview } from '@/components/SheetPreview';
import { parseCSV } from '@/lib/csvParser';
import { matchItems } from '@/lib/matcher';
import { packItems } from '@/lib/packer';
import { OrderItem, UploadedImage, Sheet, MatchedItem } from '@/types';
import { AlertCircle, CheckCircle2, Settings2, Info } from 'lucide-react';

export default function Home() {
  const [csvFile, setCsvFile] = useState<File | undefined>();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [sheets, setSheets] = useState<Sheet[]>([]);
  const [matchedItems, setMatchedItems] = useState<MatchedItem[]>([]);

  // Options
  const [allowRotation, setAllowRotation] = useState(true);
  const [separateSheets, setSeparateSheets] = useState(true);

  // Handle CSV Upload
  const handleCsvUpload = async (file: File) => {
    setCsvFile(file);
    const text = await file.text();
    try {
      const parsedOrders = parseCSV(text);
      setOrders(parsedOrders);
    } catch (e) {
      console.error("Failed to parse CSV", e);
      alert("Failed to parse CSV. Ensure it has SKU and Order columns.");
    }
  };

  // Handle Image Upload
  const handleImagesUpload = (files: File[]) => {
    const newImages: UploadedImage[] = [];
    let processed = 0;

    files.forEach(file => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        // Assumption: 300 DPI. 1 inch = 25.4mm.
        const mmPerPx = 25.4 / 300;

        newImages.push({
          id: file.name,
          file,
          name: file.name,
          url,
          width: img.width * mmPerPx,
          height: img.height * mmPerPx,
          variant: file.name.toUpperCase().includes('_BK') ? 'BK' : (file.name.toUpperCase().includes('_WH') ? 'WH' : undefined)
        });

        processed++;
        if (processed === files.length) {
          setImages(prev => [...prev, ...newImages]);
        }
      };
      img.src = url;
    });
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  // Run Logic
  useEffect(() => {
    if (orders.length === 0) return;

    // 1. Match
    const matches = matchItems(orders, images);
    setMatchedItems(matches);

    // 2. Prepare items for packing
    // Only pack matched items
    const itemsToPack = matches
      .filter(m => m.status === 'matched' && m.image)
      .map(m => ({
        id: m.orderItem.id,
        x: 0,
        y: 0,
        width: m.image!.width,
        height: m.image!.height,
        rotated: false,
        image: m.image!,
        orderId: m.orderItem.orderId,
        sku: m.orderItem.sku
      }));

    // 3. Pack
    const generatedSheets = packItems(itemsToPack, allowRotation, separateSheets);
    setSheets(generatedSheets);

  }, [orders, images, allowRotation, separateSheets]);

  return (
    <div className="flex h-full">
      {/* Sidebar / Controls */}
      <aside className="w-96 border-r border-border bg-card/30 flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold flex items-center gap-2">
            <Settings2 className="w-4 h-4" />
            Configuration
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-8">
          <UploadSection
            onCsvUpload={handleCsvUpload}
            onImagesUpload={handleImagesUpload}
            csvFile={csvFile}
            images={images}
            onRemoveImage={handleRemoveImage}
          />

          {/* Stats / Status */}
          {orders.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Status</h3>
              <div className="bg-secondary/30 rounded-lg p-3 text-sm space-y-2">
                <div className="flex justify-between">
                  <span>Total Orders:</span>
                  <span className="font-mono">{orders.length}</span>
                </div>
                <div className="flex justify-between text-green-500">
                  <span>Matched:</span>
                  <span className="font-mono">{matchedItems.filter(m => m.status === 'matched').length}</span>
                </div>
                <div className="flex justify-between text-destructive">
                  <span>Missing:</span>
                  <span className="font-mono">{matchedItems.filter(m => m.status === 'missing_image').length}</span>
                </div>
              </div>

              {/* Detailed Diagnostics */}
              <div className="mt-4 space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                  <Info className="w-3 h-3" /> Diagnostics
                </h4>
                <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                  {matchedItems.map(m => (
                    <div key={m.orderItem.id} className={`text-xs p-2 rounded border ${m.status === 'matched' ? 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400' :
                        m.status === 'ambiguous' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400' :
                          'bg-destructive/10 border-destructive/20 text-destructive'
                      }`}>
                      <div className="font-mono truncate" title={m.orderItem.sku}>{m.orderItem.sku}</div>
                      <div className="flex items-center gap-2 mt-1 opacity-80">
                        {m.variantSource === 'NOTES' && <span className="px-1 py-0.5 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 rounded text-[10px] uppercase">Note Override</span>}
                        {m.variantSource === 'FALLBACK' && <span className="px-1 py-0.5 bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded text-[10px] uppercase">Fallback</span>}
                        {m.variantSource === 'HEURISTIC' && <span className="px-1 py-0.5 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded text-[10px] uppercase">Fuzzy</span>}
                        {m.variantSource === 'AMBIGUOUS' && <span className="px-1 py-0.5 bg-red-500/20 text-red-600 dark:text-red-400 rounded text-[10px] uppercase">Ambiguous</span>}
                        <span>{m.detectedVariant || m.orderItem.variant}</span>
                      </div>
                      {m.status === 'missing_image' && <div className="mt-1 font-bold">MISSING IMAGE</div>}
                      {m.status === 'ambiguous' && <div className="mt-1 font-bold">AMBIGUOUS</div>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Ambiguous Items List */}
              {matchedItems.some(m => m.status === 'ambiguous') && (
                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-yellow-500 mb-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Ambiguous Matches
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {matchedItems.filter(m => m.status === 'ambiguous').map(m => (
                      <div key={m.orderItem.id} className="text-xs bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 p-2 rounded border border-yellow-500/20">
                        <div className="font-mono">{m.orderItem.sku}</div>
                        <div className="opacity-70">Multiple candidates found</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Items List */}
              {matchedItems.some(m => m.status === 'missing_image') && (
                <div className="mt-4">
                  <h4 className="text-xs font-semibold text-destructive mb-2 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Missing Designs
                  </h4>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {matchedItems.filter(m => m.status === 'missing_image').map(m => (
                      <div key={m.orderItem.id} className="text-xs bg-destructive/10 text-destructive p-2 rounded border border-destructive/20">
                        <div className="font-mono">{m.orderItem.sku}</div>
                        <div className="opacity-70">Order: {m.orderItem.orderId}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Controls */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Packing Options</h3>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allowRotation}
                onChange={e => setAllowRotation(e.target.checked)}
                className="rounded border-border bg-secondary"
              />
              Allow 90° Rotation
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={separateSheets}
                onChange={e => setSeparateSheets(e.target.checked)}
                className="rounded border-border bg-secondary"
              />
              Separate Sheets (WH/BK)
            </label>
          </div>
        </div>
      </aside>

      {/* Main Visualization Area */}
      <div className="flex-1 bg-secondary/10 p-8 overflow-y-auto relative">
        <div className="absolute inset-0 grid grid-cols-[repeat(auto-fill,minmax(50px,1fr))] grid-rows-[repeat(auto-fill,minmax(50px,1fr))] opacity-[0.03] pointer-events-none">
          <div className="col-span-full row-span-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:20px_20px]"></div>
        </div>

        <div className="max-w-5xl mx-auto space-y-8 relative z-10">
          {sheets.length > 0 ? (
            sheets.map(sheet => (
              <SheetPreview key={sheet.id} sheet={sheet} />
            ))
          ) : (
            <div className="text-center space-y-4 mt-20">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                <div className="w-8 h-8 bg-primary rounded-full animate-pulse"></div>
              </div>
              <h2 className="text-2xl font-bold">Ready to Visualize</h2>
              <p className="text-muted-foreground">Upload your CSV and PNG files to generate the DTF sheet layout.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

