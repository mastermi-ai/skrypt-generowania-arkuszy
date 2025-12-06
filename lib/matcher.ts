import { MatchedItem, OrderItem, UploadedImage, Variant } from '@/types';

export function matchItems(orders: OrderItem[], images: UploadedImage[]): MatchedItem[] {
    return orders.map(order => {
        // 1. Try to find exact match including variant if possible
        // Heuristic: Image name should be contained in SKU or vice versa, or fuzzy match
        // Simplified: Check if image name (without extension) is part of SKU

        // Filter images that might be related
        const candidates = images.filter(img => {
            const imgName = img.name.toLowerCase().replace(/\.[^/.]+$/, ""); // remove extension
            const sku = order.sku.toLowerCase();
            return sku.includes(imgName) || imgName.includes(sku);
        });

        let selectedImage: UploadedImage | undefined;

        if (candidates.length === 0) {
            return { orderItem: order, status: 'missing_image' };
        }

        // 2. Filter by variant if multiple candidates exist
        const variantCandidates = candidates.filter(img => {
            const name = img.name.toUpperCase();
            if (order.variant === 'WH') return name.includes('_WH') || !name.includes('_BK');
            if (order.variant === 'BK') return name.includes('_BK') || !name.includes('_WH');
            return true;
        });

        if (variantCandidates.length > 0) {
            selectedImage = variantCandidates[0];
            // If we have both WH and BK images and the order specifies one, we picked the right one.
            // If we only have one image, we use it.
        } else {
            // Fallback to any candidate if variant match fails (e.g. only have base image)
            selectedImage = candidates[0];
        }

        return {
            orderItem: order,
            image: selectedImage,
            status: selectedImage ? 'matched' : 'missing_image'
        };
    });
}
