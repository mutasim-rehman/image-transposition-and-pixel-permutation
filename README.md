# Pixel Permutation

An experimental image transformation that reconstructs a target image by **rearranging** the pixels of a base image — without altering the original pixel values.

## How It Works

- **Base image** — Your chosen image (the pixel source)
- **Target image** — Fixed reference (`target-image.webp`), defines the desired structure
- **Output** — Same pixels as the base, rearranged spatially to approximate the target

The output has the **exact same histogram** as the base; only spatial organization changes.

## Running Locally

For CORS to work with local images, use a local server:

```bash
npx serve .
```

Then open `http://localhost:3000` in your browser.

## Controls

- **Base image** — Drag & drop or click to select
- **Matching method** — Luminance (fast) or RGB (lexicographic sort)
- **Max dimension** — Smaller = faster; 256px is a good balance
