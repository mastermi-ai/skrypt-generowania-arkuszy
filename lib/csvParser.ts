import { OrderItem, Variant } from '@/types';

export function parseCSV(content: string): OrderItem[] {
    const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length === 0) return [];

    // Simple CSV parser assuming header is present or specific columns
    // Requirements: SKU, Numer zamówienia, optional NOTATKI

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const skuIndex = headers.findIndex(h => h.includes('sku') || h.includes('wzór'));
    const orderIndex = headers.findIndex(h => h.includes('numer') || h.includes('order'));
    const notesIndex = headers.findIndex(h => h.includes('notatki') || h.includes('notes'));

    if (skuIndex === -1 || orderIndex === -1) {
        throw new Error('CSV must contain SKU and Order Number columns');
    }

    const items: OrderItem[] = [];

    for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim());
        if (cols.length < 2) continue;

        const sku = cols[skuIndex];
        const orderId = cols[orderIndex];
        const notes = notesIndex !== -1 ? cols[notesIndex] : undefined;

        // Logic to determine variant
        let variant: Variant = 'WH'; // Default

        // Priority 1: Notes
        if (notes) {
            if (notes.toUpperCase().includes('KOLOR: WH')) variant = 'WH';
            else if (notes.toUpperCase().includes('KOLOR: BK')) variant = 'BK';
        } else {
            // Priority 2: SKU
            if (sku.toUpperCase().includes('_WH_')) variant = 'WH';
            else if (sku.toUpperCase().includes('_BK_')) variant = 'BK';
        }

        items.push({
            id: `${orderId}-${sku}-${i}`,
            sku,
            orderId,
            notes,
            variant,
            quantity: 1, // Assuming 1 per row for now, unless quantity column exists
            originalLine: { sku, orderId, notes: notes || '' }
        });
    }

    return items;
}
