export type Variant = 'WH' | 'BK';
export type VariantSource = 'NOTES' | 'SKU' | 'HEURISTIC' | 'FALLBACK' | 'AMBIGUOUS';

export interface OrderItem {
    id: string;
    sku: string;
    orderId: string;
    notes?: string;
    variant: Variant;
    variantSource: VariantSource;
    quantity: number;
    originalLine: Record<string, string>;
}

export interface UploadedImage {
    id: string;
    file: File;
    name: string;
    url: string;
    width: number;
    height: number;
    variant?: Variant; // Inferred from filename
}

export interface MatchedItem {
    orderItem: OrderItem;
    image?: UploadedImage;
    status: 'matched' | 'missing_image' | 'manual_review' | 'ambiguous';
    detectedVariant?: Variant;
    variantSource?: VariantSource;
}

export interface SheetItem {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotated: boolean;
    image: UploadedImage;
    orderId: string;
    sku: string;
}

export interface Sheet {
    id: string;
    width: number;
    height: number;
    items: SheetItem[];
    variant: Variant | 'MIXED';
}
