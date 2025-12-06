'use client';

import React, { useRef, useEffect } from 'react';
import { Sheet } from '@/types';
import { Download } from 'lucide-react';

interface SheetPreviewProps {
    sheet: Sheet;
    scale?: number;
}

export function SheetPreview({ sheet, scale = 0.2 }: SheetPreviewProps) {
    // 580mm width. At scale 1, 1px = 1mm.
    // At scale 0.2, 580mm = 116px (too small for detailed view).
    // Let's use a responsive container and calculate scale or just use CSS transform.

    const widthPx = sheet.width; // 1px = 1mm for SVG coordinate system
    const heightPx = sheet.height;

    return (
        <div className="flex flex-col gap-4 items-center">
            <div className="bg-card border border-border rounded-lg p-4 shadow-2xl relative">
                <div className="absolute top-2 right-2 z-10 flex gap-2">
                    <span className="bg-black/50 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                        {sheet.variant} • {sheet.width}mm x {sheet.height}mm
                    </span>
                </div>

                {/* SVG Container */}
                <div className="overflow-auto max-h-[70vh] max-w-[80vw] bg-neutral-900/50 rounded border border-white/5 p-8">
                    <svg
                        width={widthPx}
                        height={heightPx}
                        viewBox={`0 0 ${widthPx} ${heightPx}`}
                        className="bg-white shadow-sm mx-auto"
                        style={{
                            maxWidth: '100%',
                            height: 'auto',
                            // We can use CSS zoom or transform for scaling if needed, but responsive SVG is better
                        }}
                    >
                        {/* Grid Pattern */}
                        <defs>
                            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#f0f0f0" strokeWidth="0.5" />
                            </pattern>
                        </defs>
                        <rect width="100%" height="100%" fill="url(#grid)" />

                        {/* Items */}
                        {sheet.items.map((item, idx) => (
                            <g key={item.id} transform={`translate(${item.x}, ${item.y})`}>
                                {/* Item Border/Background */}
                                <rect
                                    width={item.rotated ? item.height : item.width}
                                    height={item.rotated ? item.width : item.height}
                                    fill={item.image.url ? "none" : "#ffecec"}
                                    stroke="#ddd"
                                    strokeDasharray="4 2"
                                />

                                {/* Image */}
                                {item.image.url && (
                                    <image
                                        href={item.image.url}
                                        width={item.rotated ? item.height : item.width}
                                        height={item.rotated ? item.width : item.height}
                                        preserveAspectRatio="none"
                                        transform={item.rotated ? `rotate(90) translate(0, -${item.width})` : ''}
                                    // Wait, if I rotate the group or the image?
                                    // If I rotate the image inside the rect:
                                    // transform origin is top-left (0,0) of the group.
                                    // If rotated: width becomes height.
                                    // SVG rotate is around (0,0) by default.
                                    // rotate(90) moves x axis to y axis.
                                    // Need to translate back.
                                    // Easier: just swap width/height in <image> tag? 
                                    // No, the image content needs to be rotated.
                                    // If I use CSS transform on a div it's easier, but SVG is better for export.
                                    // Let's try standard SVG transform.
                                    />
                                )}

                                {/* Debug/Info Text */}
                                <text
                                    x="5"
                                    y="15"
                                    fontSize="10"
                                    fill="red"
                                    className="opacity-50 pointer-events-none"
                                >
                                    {item.sku}
                                </text>
                            </g>
                        ))}

                        {/* Dimensions Lines (Simplified) */}
                        <line x1="0" y1="0" x2="0" y2={heightPx} stroke="red" strokeWidth="2" />
                        <line x1={widthPx} y1="0" x2={widthPx} y2={heightPx} stroke="red" strokeWidth="2" />
                    </svg>
                </div>
            </div>

            <button className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors">
                <Download className="w-4 h-4" />
                Download Preview PNG
            </button>
        </div>
    );
}
