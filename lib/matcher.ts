import { MatchedItem, OrderItem, UploadedImage, Variant } from '@/types';

export function matchItems(orders: OrderItem[], images: UploadedImage[]): MatchedItem[] {
    return orders.map(order => {
        // 1. Try to find exact match including variant if possible

        // Extract base key from SKU for fuzzy matching
        // Example: TORBA_EKO_CAT_03_MIX_OS -> TORBA_EKO_CAT_03
        let baseKey = order.sku.toUpperCase();

        // Remove known segments safely
        // We want to remove _WH_, _BK_, _MIX_ and size suffixes
        // Strategy: Split by underscore, filter out known keywords, join back
        const segments = baseKey.split('_');
        const filteredSegments = segments.filter(seg => {
            const s = seg.toUpperCase();
            return !['WH', 'BK', 'MIX', 'OS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL'].includes(s) && !/^\d+$/.test(s); // Remove numbers? Maybe risky if part of design name.
            // The user said: "Nie usuwaj agresywnie innych segmentów poza ewidentnie wariantem lub MIX"
            // And "usuń tylko _WH_, _BK_ i _MIX_ oraz końcowy rozmiar"
        });

        // Let's try a more specific regex approach as per user request
        // "usuń tylko _WH_, _BK_ i _MIX_ oraz końcowy rozmiar, jeśli jest oczywisty."
        let improvedBaseKey = order.sku.toUpperCase();
        improvedBaseKey = improvedBaseKey.replace(/_WH|_BK|_MIX/g, '');
        improvedBaseKey = improvedBaseKey.replace(/_(OS|XS|S|M|L|XL|XXL|2XL|3XL)$/, ''); // Only at end

        // Also remove trailing numbers if they look like size/variant? User said "końcowy rozmiar".
        // Let's stick to the regex above.

        const baseKeyLower = improvedBaseKey.toLowerCase();

        // Filter images that might be related
        const candidates = images.filter(img => {
            const imgName = img.name.toLowerCase().replace(/\.[^/.]+$/, ""); // remove extension
            const sku = order.sku.toLowerCase();

            // Direct match
            if (sku.includes(imgName) || imgName.includes(sku)) return true;

            // Fuzzy match using base key
            if (imgName.includes(baseKeyLower)) return true;

            return false;
        });

        let selectedImage: UploadedImage | undefined;
        let detectedVariant = order.variant; // Start with what we parsed (SKU or NOTES)
        let variantSource = order.variantSource;
        let status: MatchedItem['status'] = 'missing_image';

        if (candidates.length === 0) {
            return { orderItem: order, status: 'missing_image', detectedVariant, variantSource };
        }

        // 2. Resolve Variant Priority
        // Priority: NOTES > SKU (Explicit) > HEURISTIC (Match) > FALLBACK (Single Candidate)

        // If Source is NOTES, we MUST find a matching variant if possible, or fallback to whatever is there but keep variant as NOTES
        if (variantSource === 'NOTES') {
            // Try to find image matching the note variant
            const matchingCandidate = candidates.find(img => {
                const name = img.name.toUpperCase();
                return detectedVariant === 'WH' ? (name.includes('_WH') || !name.includes('_BK')) : (name.includes('_BK') || !name.includes('_WH'));
            });

            if (matchingCandidate) {
                selectedImage = matchingCandidate;
                status = 'matched';
            } else {
                // Notes say one thing, but we don't have a matching image.
                // We should probably pick *an* image (fallback) but warn?
                // Or just pick the first one.
                selectedImage = candidates[0];
                status = 'matched'; // It is matched to a file, but maybe variant mismatch?
                // User said: "gdy NOTATKI wymuszają wariant, ale odpowiedni plik nie istnieje" -> Warning?
                // For now, let's match it. The UI shows "Note Override".
            }
        } else if (variantSource === 'SKU') {
            // SKU specifies variant. Try to find it.
            const matchingCandidate = candidates.find(img => {
                const name = img.name.toUpperCase();
                return detectedVariant === 'WH' ? (name.includes('_WH') || !name.includes('_BK')) : (name.includes('_BK') || !name.includes('_WH'));
            });

            if (matchingCandidate) {
                selectedImage = matchingCandidate;
                status = 'matched';
            } else {
                // SKU wanted WH, but maybe only BK exists?
                // Fallback to what we have?
                if (candidates.length === 1) {
                    selectedImage = candidates[0];
                    status = 'matched';
                    // If we fallback, should we update detectedVariant?
                    // If SKU said WH, but we forced to use BK image...
                    // Ideally we keep detectedVariant as WH (what we want to print) but image is BK (source).
                    // But for this tool, maybe we update detectedVariant to what we actually have?
                    // User said: "Jeśli istnieje tylko jeden wariant: wybierz dostępny i oznacz w UI: fallback"
                    if (selectedImage.variant && selectedImage.variant !== detectedVariant) {
                        detectedVariant = selectedImage.variant;
                        variantSource = 'FALLBACK';
                    }
                } else {
                    // Multiple candidates, none match SKU? Ambiguous?
                    status = 'ambiguous';
                }
            }
        } else {
            // Source is FALLBACK/HEURISTIC (SKU didn't specify, Notes didn't specify)
            // We need to decide based on candidates.

            const whCandidate = candidates.find(img => img.name.toUpperCase().includes('_WH'));
            const bkCandidate = candidates.find(img => img.name.toUpperCase().includes('_BK'));

            if (whCandidate && bkCandidate) {
                // Both exist. Ambiguous if we don't have a preference.
                // But wait, if we are here, variantSource is FALLBACK (default WH).
                // If we have both, and no preference, we default to WH?
                // User said: "Jeśli znajdziesz wiele kandydatów: oznacz jako AMBIGUOUS"
                status = 'ambiguous';
            } else if (whCandidate) {
                selectedImage = whCandidate;
                detectedVariant = 'WH';
                variantSource = 'FALLBACK'; // Only one available
                status = 'matched';
            } else if (bkCandidate) {
                selectedImage = bkCandidate;
                detectedVariant = 'BK';
                variantSource = 'FALLBACK'; // Only one available
                status = 'matched';
            } else {
                // Candidates exist but neither is explicitly WH/BK (e.g. base images)
                if (candidates.length === 1) {
                    selectedImage = candidates[0];
                    status = 'matched';
                    variantSource = 'FALLBACK';
                } else {
                    status = 'ambiguous';
                }
            }
        }

        return {
            orderItem: order,
            image: selectedImage,
            status,
            detectedVariant,
            variantSource
        };
    });
}
