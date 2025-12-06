# DTF Sheet Visualizer (Proof of Concept)

A web application to visualize the generation of DTF (Direct to Film) sheets from a CSV of orders and a set of PNG designs.

## Features

- **CSV Parsing**: Automatically extracts SKU, Order Number, and Notes.
- **Variant Matching**: Matches orders to images based on SKU/Notes and "WH" (White) / "BK" (Black) variants.
- **Auto-Packing**: Uses a "Shelf" bin-packing algorithm to arrange designs on a 58cm wide sheet with 20mm padding.
- **Visualization**: Interactive preview of the generated sheets with dimensions and cut lines.
- **Export**: Download a preview PNG of the arranged sheet.

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run the development server**:
   ```bash
   npm run dev
   ```

3. **Open the app**:
   Navigate to [http://localhost:3000](http://localhost:3000).

## Usage

1. **Upload CSV**: Drag and drop the `orders.csv` file (sample provided in `public/samples`).
2. **Upload Images**: Drag and drop the PNG files (samples provided in `public/samples`).
3. **View Results**: The app will automatically match orders to images and generate the sheets.
4. **Download**: Click "Download Preview PNG" to save the visualization.

## Assumptions & Limitations (PoC)

- **Sheet Width**: Fixed at 580mm.
- **DPI**: Assumes 300 DPI for image sizing (1px = 0.0846mm).
- **Colors**: Preview is in RGB. Production files should be converted to CMYK.
- **Packing**: Uses a simple greedy algorithm. Does not support complex nesting or rotation optimization beyond 90 degrees.

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS v4
- Lucide React (Icons)
