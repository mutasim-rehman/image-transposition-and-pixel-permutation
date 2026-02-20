/**
 * Pixel Permutation — Rearrange base image pixels to match target structure
 * Preserves exact pixel histogram; output contains same pixels, different arrangement.
 */

const baseInput = document.getElementById('baseInput');
const baseUploadZone = document.getElementById('baseUploadZone');
const targetInput = document.getElementById('targetInput');
const targetUploadZone = document.getElementById('targetUploadZone');
const runBtn = document.getElementById('runBtn');
const methodSelect = document.getElementById('method');

const baseCanvas = document.getElementById('baseCanvas');
const baseCtx = baseCanvas.getContext('2d');
const targetCanvas = document.getElementById('targetCanvas');
const targetCtx = targetCanvas.getContext('2d');
const outputCanvas = document.getElementById('outputCanvas');
const outputCtx = outputCanvas.getContext('2d');
const downloadBtn = document.getElementById('downloadBtn');

let baseImageData = null;
let targetImageData = null;
let baseLoaded = false;
let targetLoaded = false;

// Base image upload
baseUploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  baseUploadZone.classList.add('dragover');
});
baseUploadZone.addEventListener('dragleave', () => baseUploadZone.classList.remove('dragover'));
baseUploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  baseUploadZone.classList.remove('dragover');
  const file = e.dataTransfer?.files?.[0];
  if (file?.type?.startsWith('image/')) loadBaseImage(file);
});
baseInput.addEventListener('change', () => {
  const file = baseInput.files?.[0];
  if (file) loadBaseImage(file);
});

// Target image upload
targetUploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  targetUploadZone.classList.add('dragover');
});
targetUploadZone.addEventListener('dragleave', () => targetUploadZone.classList.remove('dragover'));
targetUploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  targetUploadZone.classList.remove('dragover');
  const file = e.dataTransfer?.files?.[0];
  if (file?.type?.startsWith('image/')) loadTargetImage(file);
});
targetInput.addEventListener('change', () => {
  const file = targetInput.files?.[0];
  if (file) loadTargetImage(file);
});

function loadBaseImage(file) {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    baseImageData = img;
    baseLoaded = true;
    drawBasePreview();
    URL.revokeObjectURL(url);
    tryEnableRun();
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    alert('Failed to load image.');
  };
  img.src = url;
}

function loadTargetImage(file) {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.onload = () => {
    targetImageData = img;
    targetLoaded = true;
    drawTargetPreview();
    URL.revokeObjectURL(url);
    tryEnableRun();
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    alert('Failed to load image.');
  };
  img.src = url;
}

function drawBasePreview() {
  if (!baseImageData) return;
  const maxDim = 200;
  const w = baseImageData.width;
  const h = baseImageData.height;
  const scale = Math.min(maxDim / w, maxDim / h, 1);
  const dw = Math.round(w * scale);
  const dh = Math.round(h * scale);
  baseCanvas.width = dw;
  baseCanvas.height = dh;
  baseCtx.imageSmoothingEnabled = true;
  baseCtx.imageSmoothingQuality = 'high';
  baseCtx.drawImage(baseImageData, 0, 0, w, h, 0, 0, dw, dh);
}

function drawTargetPreview() {
  if (!targetImageData) return;
  const w = targetImageData.width;
  const h = targetImageData.height;
  const maxDim = 200;
  const scale = Math.min(maxDim / w, maxDim / h, 1);
  const dw = Math.round(w * scale);
  const dh = Math.round(h * scale);
  targetCanvas.width = dw;
  targetCanvas.height = dh;
  targetCtx.drawImage(targetImageData, 0, 0, w, h, 0, 0, dw, dh);
}

function tryEnableRun() {
  runBtn.disabled = !(baseLoaded && targetLoaded);
}

function luminance(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Scale image to match target dimensions. Uses high-quality smoothing for depixelization.
 * Center-crops if aspect ratio differs (scale to cover, then crop).
 */
function resizeToMatch(img, targetW, targetH) {
  const w = img.width;
  const h = img.height;
  const scale = Math.max(targetW / w, targetH / h);
  const sw = w * scale;
  const sh = h * scale;
  const sx = (sw - targetW) / 2;
  const sy = (sh - targetH) / 2;

  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, -sx, -sy, sw, sh);
  return ctx.getImageData(0, 0, targetW, targetH);
}

/**
 * Get image pixel data at its natural dimensions.
 */
function getImageData(img) {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, w, h);
}

/**
 * Get sort key for luminance-based matching.
 */
function luminanceKey(r, g, b) {
  return luminance(r, g, b);
}

/**
 * Get sort key for RGB lexicographic matching.
 */
function rgbKey(r, g, b) {
  return (r << 16) | (g << 8) | b;
}

/**
 * Compute permutation: for each target position, which base pixel index to place there.
 * Base and target must have same dimensions (same pixel count).
 */
function computePermutation(baseData, targetData, method) {
  const n = baseData.width * baseData.height;
  const basePixels = [];
  const targetPixels = [];

  for (let i = 0; i < n; i++) {
    const bi = i * 4;
    basePixels.push({
      r: baseData.data[bi],
      g: baseData.data[bi + 1],
      b: baseData.data[bi + 2],
      a: baseData.data[bi + 3],
    });
    targetPixels.push({
      r: targetData.data[bi],
      g: targetData.data[bi + 1],
      b: targetData.data[bi + 2],
      idx: i,
    });
  }

  const getKey = method === 'rgb' ? rgbKey : luminanceKey;

  const baseWithKey = basePixels.map((p, i) => ({
    ...p,
    idx: i,
    key: getKey(p.r, p.g, p.b),
  }));
  const targetWithKey = targetPixels.map((p) => ({
    ...p,
    key: getKey(p.r, p.g, p.b),
  }));

  baseWithKey.sort((a, b) => a.key - b.key);
  targetWithKey.sort((a, b) => a.key - b.key);

  const assignment = new Array(n);
  for (let i = 0; i < n; i++) {
    assignment[targetWithKey[i].idx] = baseWithKey[i].idx;
  }
  return assignment;
}

/**
 * Apply permutation to create output image.
 */
function applyPermutation(baseData, assignment, outputData) {
  const n = baseData.width * baseData.height;
  const basePixels = baseData.data;

  for (let outIdx = 0; outIdx < n; outIdx++) {
    const baseIdx = assignment[outIdx];
    const outOffset = outIdx * 4;
    const baseOffset = baseIdx * 4;
    outputData.data[outOffset] = basePixels[baseOffset];
    outputData.data[outOffset + 1] = basePixels[baseOffset + 1];
    outputData.data[outOffset + 2] = basePixels[baseOffset + 2];
    outputData.data[outOffset + 3] = basePixels[baseOffset + 3];
  }
}

runBtn.addEventListener('click', async () => {
  if (!baseImageData || !targetImageData) return;

  const method = methodSelect.value;
  const targetW = targetImageData.naturalWidth || targetImageData.width;
  const targetH = targetImageData.naturalHeight || targetImageData.height;

  runBtn.classList.add('running');
  runBtn.textContent = 'Computing…';

  await new Promise((r) => setTimeout(r, 0));

  const baseData = resizeToMatch(baseImageData, targetW, targetH);
  const targetData = getImageData(targetImageData);

  const assignment = computePermutation(baseData, targetData, method);
  outputCanvas.width = targetW;
  outputCanvas.height = targetH;
  const outData = outputCtx.createImageData(targetW, targetH);
  applyPermutation(baseData, assignment, outData);
  outputCtx.putImageData(outData, 0, 0);

  downloadBtn.disabled = false;
  runBtn.classList.remove('running');
  runBtn.textContent = 'Transform';
});

downloadBtn.addEventListener('click', () => {
  if (outputCanvas.width === 0) return;
  const a = document.createElement('a');
  a.download = 'pixel-permutation-output.png';
  a.href = outputCanvas.toDataURL('image/png');
  a.click();
});
