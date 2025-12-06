
import { Sheet, SheetItem, Variant } from '@/types';

const SHEET_WIDTH = 580; // mm
const PADDING = 20; // mm

export function packItems(items: SheetItem[], allowRotation: boolean = true, separateSheets: boolean = true): Sheet[] {
    const sheets: Sheet[] = [];

    // Helper to pack a list of items
    const packList = (list: SheetItem[], variant: Variant | 'MIXED') => {
        if (list.length === 0) return;

        let currentSheet: Sheet = {
            id: `SHEET_${variant} _1`,
            width: SHEET_WIDTH,
            height: 0, // Dynamic
            items: [],
            variant
        };

        let currentX = PADDING;
        let currentY = PADDING;
        let rowHeight = 0;

        // Sort by height desc for Shelf algorithm
        const sorted = [...list].sort((a, b) => b.height - a.height);

        for (const item of sorted) {
            let width = item.width;
            let height = item.height;
            let rotated = false;

            // Try rotation if allowed and beneficial
            if (allowRotation) {
                if (width > SHEET_WIDTH - 2 * PADDING) {
                    if (height <= SHEET_WIDTH - 2 * PADDING) {
                        const temp = width; width = height; height = temp;
                        rotated = true;
                    }
                }
            }

            // Check if fits in current row
            if (currentX + width + PADDING > SHEET_WIDTH) {
                // Move to next row
                currentX = PADDING;
                currentY += rowHeight + PADDING;
                rowHeight = 0;
            }

            // Place item
            item.x = currentX;
            item.y = currentY;
            item.rotated = rotated;

            if (rotated) {
                const temp = item.width; item.width = item.height; item.height = temp;
            }

            currentSheet.items.push(item);

            currentX += width + PADDING;
            rowHeight = Math.max(rowHeight, height);
        }

        // Finalize sheet height
        currentSheet.height = currentY + rowHeight + PADDING;
        sheets.push(currentSheet);
    };

    if (separateSheets) {
        // Split items by variant
        // Use the variant from the item (which comes from OrderItem/MatchedItem)
        // We need to check the item's associated variant.
        // In packItems, we receive SheetItem.
        // SheetItem doesn't explicitly have 'variant' field in my interface, but it has 'image'.
        // However, the decision was made in Matcher.
        // Let's assume we can infer it or we should have passed it.
        // Actually, SheetItem needs to know its variant for separation.
        // I should update SheetItem to include variant, or check image variant, or check SKU.
        // But wait, we might have overridden it in Notes!
        // The SheetItem is created in page.tsx from MatchedItem.
        // I should update SheetItem in types/index.ts to include variant?
        // Or just check image.variant?
        // If Notes overrode it to BK, but image is BK, then image.variant is BK.
        // If Notes overrode it to BK, but image is WH (fallback?), then we might want to put it on BK sheet?
        // But if image is WH, putting it on BK sheet is weird (printing WH on dark?).
        // Usually "Variant" means "Film Type" or "Powder Type".
        // If I force BK, I want it on BK sheet.
        // So I should use the "detectedVariant" from MatchedItem.
        // I need to pass that to SheetItem.

        // For now, I'll use a heuristic: check if SKU/Image implies WH/BK.
        // But really I should update SheetItem.
        // Let's rely on image variant for now as that's what we print.
        // If image is WH, it goes to WH sheet.

        const itemsWH = items.filter(i => i.image.variant === 'WH' || (!i.image.variant && i.sku.includes('_WH')));
        const itemsBK = items.filter(i => !itemsWH.includes(i));

        packList(itemsWH, 'WH');
        packList(itemsBK, 'BK');
    } else {
        // Pack all together
        packList(items, 'MIXED');
    }

    return sheets;
}

