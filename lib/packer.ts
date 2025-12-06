import { Sheet, SheetItem, Variant } from '@/types';

const SHEET_WIDTH = 580; // mm
const PADDING = 20; // mm

export function packItems(items: SheetItem[], allowRotation: boolean = true): Sheet[] {
    // Group items by variant
    const whItems = items.filter(i => i.image.variant === 'WH' || (!i.image.variant && i.sku.includes('_WH')));
    const bkItems = items.filter(i => !whItems.includes(i)); // Remainder

    // Actually, the variant is on the OrderItem/SheetItem logic, let's assume input items have correct variant
    // But we need to separate sheets by variant? Usually yes, different film/powder settings maybe?
    // The requirements don't explicitly say split sheets by variant, but it's implied "WH = na jasne", "BK = na ciemne".
    // Usually printed separately or sequentially. Let's pack them separately for safety.

    // Wait, SheetItem doesn't have variant directly in my type, but it has orderId/sku.
    // I should add variant to SheetItem or Sheet.
    // Let's assume we pack all provided items. The caller should filter if they want separate batches.
    // But for the demo, I'll pack them into sheets, maybe mixed is fine? 
    // "SKU zawiera wariant... WH = na jasne... BK = na ciemne".
    // Let's split by variant to be safe.

    // Re-reading requirements: "wizualizuje generowanie arkuszy DTF".
    // I will split by variant.

    const sheets: Sheet[] = [];

    // Helper to pack a list of items
    const packList = (list: SheetItem[], variant: Variant) => {
        if (list.length === 0) return;

        let currentSheet: Sheet = {
            id: `SHEET_${variant}_1`,
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

            // Try rotation if allowed and beneficial (e.g. fits in row where it wouldn't otherwise, or just standardizing)
            // Simple heuristic: if width > height, rotate to make it taller? Or vice versa?
            // Shelf packing: minimize width usage?
            // Let's try to fit in current row.

            if (allowRotation) {
                // If rotating makes it fit in remaining width?
                // Or just always try to orient same way?
                // Let's just try both orientations.
                if (width > SHEET_WIDTH - 2 * PADDING) {
                    // Must rotate if it doesn't fit width-wise
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
            // Update item dimensions in the sheet item (it might be rotated)
            // Note: The input 'item' is a reference, but we should probably clone or update carefully.
            // My SheetItem type has width/height.
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

    // Split items by variant (using a heuristic if not explicit)
    // I'll assume the caller passes items that have a variant property or I check the image/sku.
    // Let's use the variant from the item (which comes from OrderItem).
    // I need to update SheetItem type to include variant or check it.
    // I'll cast for now or update type in next step if needed.
    // Actually, SheetItem has `sku` and `image`. I can check those.

    const itemsWH = items.filter(i => i.sku.includes('_WH_') || i.image.name.includes('_WH'));
    const itemsBK = items.filter(i => !itemsWH.includes(i));

    packList(itemsWH, 'WH');
    packList(itemsBK, 'BK');

    return sheets;
}
