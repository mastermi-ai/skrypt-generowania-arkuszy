import { MatchedItem, OrderItem, UploadedImage, Variant } from '@/types';

export function matchItems(orders: OrderItem[], images: UploadedImage[]): MatchedItem[] {
    return orders.map(order => {
        // 1. Try to find exact match including variant if possible
        // Heuristic: Image name should be contained in SKU or vice versa, or fuzzy match
        // Simplified: Check if image name (without extension) is part of SKU

        // Extract base key from SKU for fuzzy matching
        // Remove common suffixes like _WH, _BK, _MIX, _OS, _S, _M, _L, _XL, _XXL, numbers
        // Example: TORBA_EKO_CAT_03_MIX_OS -> TORBA_EKO_CAT_03
        let baseKey = order.sku.toUpperCase();
        // Remove variant markers
        baseKey = baseKey.replace(/_WH|_BK|_MIX/g, '');
        // Remove size markers (simplified)
        baseKey = baseKey.replace(/_OS|_XS|_S|_M|_L|_XL|_XXL|_2XL|_3XL/g, '');
        // Remove trailing numbers if they look like size/variant (optional, maybe risky)

        const baseKeyLower = baseKey.toLowerCase();

        // Filter images that might be related
        const candidates = images.filter(img => {
            const imgName = img.name.toLowerCase().replace(/\.[^/.]+$/, ""); // remove extension
            const sku = order.sku.toLowerCase();

            // Direct match
            if (sku.includes(imgName) || imgName.includes(sku)) return true;

            // Fuzzy match using base key
            // Check if image name starts with base key or contains it significantly
            if (imgName.includes(baseKeyLower)) return true;

            return false;
        });

        let selectedImage: UploadedImage | undefined;
        let detectedVariant = order.variant; // Start with what we parsed
        let variantSource = order.variantSource;

        if (candidates.length === 0) {
            return { orderItem: order, status: 'missing_image', detectedVariant, variantSource };
        }

        // 2. Filter by variant if multiple candidates exist
        // If we have explicit variant from Notes or SKU, try to find matching image
        const variantCandidates = candidates.filter(img => {
            const name = img.name.toUpperCase();
            if (detectedVariant === 'WH') return name.includes('_WH') || !name.includes('_BK');
            if (detectedVariant === 'BK') return name.includes('_BK') || !name.includes('_WH');
            return true;
        });

        if (variantCandidates.length > 0) {
            // We found images matching our expected variant
            selectedImage = variantCandidates[0];
        } else {
            // We didn't find images matching our expected variant.
            // This might happen if SKU says MIX/OS (defaults to WH) but only BK image exists?
            // Or if we have a base match but the variants don't align with default.

            // If we have candidates but none match the *expected* variant, what do we do?
            // "Jeśli istnieje tylko jeden wariant: wybierz dostępny i oznacz w UI: fallback"

            if (candidates.length === 1) {
                selectedImage = candidates[0];
                // Update detected variant based on the image we found
                if (selectedImage.variant) {
                    detectedVariant = selectedImage.variant;
                    variantSource = 'FALLBACK';
                }
            } else {
                // Multiple candidates but none match preference?
                // E.g. wanted WH, but have BK and maybe something else?
                // Just pick the first one or try to pick one that exists?
                // If we have both WH and BK images available (in candidates), but we filtered them out?
                // Wait, if detectedVariant is WH, we filter for WH. If we have BK image, it's filtered out.
                // If we only have BK image, variantCandidates is empty.
                // Then we fall here.

                // Try to find ANY variant
                const whCandidate = candidates.find(img => img.name.toUpperCase().includes('_WH'));
                const bkCandidate = candidates.find(img => img.name.toUpperCase().includes('_BK'));

                if (whCandidate) {
                    selectedImage = whCandidate;
                    detectedVariant = 'WH';
                    variantSource = 'HEURISTIC';
                } else if (bkCandidate) {
                    selectedImage = bkCandidate;
                    detectedVariant = 'BK';
                    variantSource = 'HEURISTIC';
                } else {
                    selectedImage = candidates[0];
                    variantSource = 'FALLBACK';
                }
            }
        }

        return {
            orderItem: order,
            image: selectedImage,
            status: selectedImage ? 'matched' : 'missing_image',
            detectedVariant,
            variantSource
        };
    });
}
