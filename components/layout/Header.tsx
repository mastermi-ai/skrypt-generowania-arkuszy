import React from 'react';
import { Layers, Printer } from 'lucide-react';

export function Header() {
  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Printer className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">DTF Sheet Visualizer</h1>
            <p className="text-xs text-muted-foreground">Proof of Concept</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 px-3 py-1 rounded-full border border-border/50">
            <Layers className="w-4 h-4" />
            <span>Sheet Width: 58cm</span>
          </div>
        </div>
      </div>
    </header>
  );
}
