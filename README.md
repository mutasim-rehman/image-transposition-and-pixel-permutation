# Pixel Permutation

An experimental image transformation that reconstructs a target image by **rearranging** the pixels of a base image — without altering the original pixel values.

## How the Transformation Works

### Overview

The algorithm reassigns every base pixel to a new position so that the output roughly resembles the target image. No pixel colors are changed; the same exact set of pixels is reused in a different spatial arrangement. The output therefore has the **exact same histogram** as the base — only where each pixel sits changes.

### Step-by-Step

1. **Resize & align**  
   The base image is resized to match the target’s width and height (center-cropped if the aspect ratio differs), so base and target have the same pixel count.

2. **Compute a sort key for each pixel**  
   Each pixel is assigned a scalar key used for matching:
   - **Luminance** (default): `0.299·R + 0.587·G + 0.114·B` — reflects perceived brightness
   - **RGB**: `(R<<16) | (G<<8) | B` — full color, ordered lexicographically

3. **Sort both images by that key**  
   Base pixels and target pixels are each sorted by their key. Sorting defines a global ordering (darkest to brightest, or lowest to highest RGB).

4. **Assign by rank**  
   The base pixel at rank *i* is placed where the target pixel at rank *i* was:
   - Darkest base pixel → where the darkest target pixel was
   - Next darkest base pixel → where the next darkest target pixel was  
   and so on for all ranks.

5. **Result**  
   The output image keeps the base’s exact pixel values but arranges them so that bright target regions get bright base pixels and dark target regions get dark base pixels. Structurally it mimics the target, while color content stays from the base.

## Running Locally

For CORS to work with local images, use a local server:

```bash
npx serve .
```

Then open `http://localhost:3000` in your browser.

## Controls

- **Base image** — Drag & drop or click to select (pixels to rearrange)
- **Target image** — Drag & drop or click to select (structure to match)
- **Matching method** — Luminance (fast) or RGB (lexicographic sort)
