type BannerCopy = {
  title: string;
  subtitle: string;
  cta: string;
};

type BannerSize = {
  name: string;
  width: number;
  height: number;
};

// Specific layout configuration per banner format
interface FormatConfig {
  // Image placement
  image: { x: number; y: number; w: number; h: number };
  // Text area
  text: { x: number; y: number; w: number; h: number };
  // Typography sizes
  titleSize: number;
  subtitleSize: number;
  ctaSize: number;
  // CTA button
  ctaPaddingX: number;
  ctaPaddingY: number;
  ctaBorderRadius: number;
  ctaBorderWidth: number;
  // Layout flags
  showSubtitle: boolean;
  titleMaxLines: number;
  subtitleMaxLines: number;
  // Vertical alignment of CTA
  ctaAtBottom: boolean;
}

function getFormatConfig(size: BannerSize): FormatConfig {
  const { name, width: w, height: h } = size;

  // ============ LEADERBOARD (728×90) ============
  // Very wide, horizontal - text left, image right, no subtitle
  if (name === "Leaderboard") {
    const pad = 12;
    return {
      image: { x: w - h * 1.2, y: 0, w: h * 1.2, h },
      text: { x: pad, y: pad, w: w - h * 1.2 - pad * 2, h: h - pad * 2 },
      titleSize: 28,
      subtitleSize: 0,
      ctaSize: 14,
      ctaPaddingX: 16,
      ctaPaddingY: 8,
      ctaBorderRadius: 16,
      ctaBorderWidth: 2,
      showSubtitle: false,
      titleMaxLines: 1,
      subtitleMaxLines: 0,
      ctaAtBottom: false,
    };
  }

  // ============ LARGE MOBILE BANNER (320×100) ============
  // Similar to leaderboard but smaller
  if (name === "Large Mobile Banner") {
    const pad = 10;
    return {
      image: { x: w - h * 1.1, y: 0, w: h * 1.1, h },
      text: { x: pad, y: pad, w: w - h * 1.1 - pad, h: h - pad * 2 },
      titleSize: 20,
      subtitleSize: 0,
      ctaSize: 11,
      ctaPaddingX: 12,
      ctaPaddingY: 6,
      ctaBorderRadius: 12,
      ctaBorderWidth: 2,
      showSubtitle: false,
      titleMaxLines: 2,
      subtitleMaxLines: 0,
      ctaAtBottom: false,
    };
  }

  // ============ MEDIUM RECTANGLE (300×250) ============
  // Classic rectangle - image top, text + CTA bottom
  if (name === "Medium Rectangle") {
    const pad = 16;
    const imageH = Math.round(h * 0.52);
    return {
      image: { x: 0, y: 0, w, h: imageH },
      text: { x: pad, y: imageH + 8, w: w - pad * 2, h: h - imageH - pad },
      titleSize: 26,
      subtitleSize: 14,
      ctaSize: 13,
      ctaPaddingX: 18,
      ctaPaddingY: 10,
      ctaBorderRadius: 18,
      ctaBorderWidth: 2,
      showSubtitle: true,
      titleMaxLines: 2,
      subtitleMaxLines: 1,
      ctaAtBottom: true,
    };
  }

  // ============ LARGE RECTANGLE (336×280) ============
  // Similar to medium rectangle, slightly bigger
  if (name === "Large Rectangle") {
    const pad = 18;
    const imageH = Math.round(h * 0.52);
    return {
      image: { x: 0, y: 0, w, h: imageH },
      text: { x: pad, y: imageH + 10, w: w - pad * 2, h: h - imageH - pad },
      titleSize: 28,
      subtitleSize: 15,
      ctaSize: 14,
      ctaPaddingX: 20,
      ctaPaddingY: 10,
      ctaBorderRadius: 20,
      ctaBorderWidth: 2,
      showSubtitle: true,
      titleMaxLines: 2,
      subtitleMaxLines: 1,
      ctaAtBottom: true,
    };
  }

  // ============ HALF PAGE (300×600) ============
  // Tall vertical - image top half, text bottom half
  if (name === "Half Page") {
    const pad = 20;
    const imageH = Math.round(h * 0.48);
    return {
      image: { x: 0, y: 0, w, h: imageH },
      text: { x: pad, y: imageH + 16, w: w - pad * 2, h: h - imageH - pad * 2 },
      titleSize: 32,
      subtitleSize: 16,
      ctaSize: 15,
      ctaPaddingX: 24,
      ctaPaddingY: 14,
      ctaBorderRadius: 24,
      ctaBorderWidth: 3,
      showSubtitle: true,
      titleMaxLines: 3,
      subtitleMaxLines: 2,
      ctaAtBottom: true,
    };
  }

  // ============ WIDE SKYSCRAPER (160×600) ============
  // Very tall narrow - image top, text center, CTA bottom
  if (name === "Wide Skyscraper") {
    const pad = 12;
    const imageH = Math.round(h * 0.35);
    return {
      image: { x: 0, y: 0, w, h: imageH },
      text: { x: pad, y: imageH + 12, w: w - pad * 2, h: h - imageH - pad * 2 },
      titleSize: 22,
      subtitleSize: 13,
      ctaSize: 12,
      ctaPaddingX: 14,
      ctaPaddingY: 10,
      ctaBorderRadius: 16,
      ctaBorderWidth: 2,
      showSubtitle: true,
      titleMaxLines: 4,
      subtitleMaxLines: 3,
      ctaAtBottom: true,
    };
  }

  // ============ FALLBACK - generic layout ============
  const ratio = w / h;
  const pad = Math.round(Math.min(w, h) * 0.06);
  
  if (ratio >= 2) {
    // Wide
    return {
      image: { x: Math.round(w * 0.7), y: 0, w: Math.round(w * 0.3), h },
      text: { x: pad, y: pad, w: Math.round(w * 0.65) - pad, h: h - pad * 2 },
      titleSize: Math.round(h * 0.35),
      subtitleSize: Math.round(h * 0.16),
      ctaSize: Math.round(h * 0.14),
      ctaPaddingX: Math.round(h * 0.15),
      ctaPaddingY: Math.round(h * 0.08),
      ctaBorderRadius: Math.round(h * 0.15),
      ctaBorderWidth: 2,
      showSubtitle: h > 60,
      titleMaxLines: 1,
      subtitleMaxLines: 1,
      ctaAtBottom: false,
    };
  }
  
  if (ratio >= 1) {
    // Square-ish
    const imageH = Math.round(h * 0.5);
    return {
      image: { x: 0, y: 0, w, h: imageH },
      text: { x: pad, y: imageH + pad, w: w - pad * 2, h: h - imageH - pad * 2 },
      titleSize: Math.round(w * 0.09),
      subtitleSize: Math.round(w * 0.05),
      ctaSize: Math.round(w * 0.045),
      ctaPaddingX: Math.round(w * 0.06),
      ctaPaddingY: Math.round(w * 0.035),
      ctaBorderRadius: Math.round(w * 0.06),
      ctaBorderWidth: 2,
      showSubtitle: true,
      titleMaxLines: 2,
      subtitleMaxLines: 1,
      ctaAtBottom: true,
    };
  }
  
  // Tall
  const imageH = Math.round(h * 0.4);
  return {
    image: { x: 0, y: 0, w, h: imageH },
    text: { x: pad, y: imageH + pad, w: w - pad * 2, h: h - imageH - pad * 2 },
    titleSize: Math.round(w * 0.14),
    subtitleSize: Math.round(w * 0.08),
    ctaSize: Math.round(w * 0.07),
    ctaPaddingX: Math.round(w * 0.08),
    ctaPaddingY: Math.round(w * 0.05),
    ctaBorderRadius: Math.round(w * 0.1),
    ctaBorderWidth: 2,
    showSubtitle: true,
    titleMaxLines: 3,
    subtitleMaxLines: 2,
    ctaAtBottom: true,
  };
}

function hslFromVarValue(varValue: string) {
  const v = varValue.trim();
  if (!v) return "hsl(24 95% 53%)";
  if (v.startsWith("hsl(")) return v;
  return `hsl(${v})`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = (text || "").trim().split(/\s+/).filter(Boolean);
  if (words.length === 0 || maxLines === 0) return [];

  const lines: string[] = [];
  let current = words[0];

  for (let i = 1; i < words.length; i++) {
    const test = `${current} ${words[i]}`;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      lines.push(current);
      current = words[i];
      if (lines.length >= maxLines - 1) break;
    }
  }

  lines.push(current);
  return lines.slice(0, maxLines);
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  const radius = clamp(r, 0, Math.min(w, h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

async function fetchAsObjectUrl(url: string) {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Image fetch failed: ${resp.status}`);
  const blob = await resp.blob();
  const objectUrl = URL.createObjectURL(blob);
  return { objectUrl, revoke: () => URL.revokeObjectURL(objectUrl) };
}

async function loadImage(url: string): Promise<{ img: HTMLImageElement; cleanup: () => void }> {
  const { objectUrl, revoke } = await fetchAsObjectUrl(url);
  const img = new Image();
  img.decoding = "async";
  img.src = objectUrl;
  await img.decode();
  return { img, cleanup: revoke };
}

function drawImageContain(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const scale = Math.min(w / iw, h / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;
  ctx.drawImage(img, dx, dy, dw, dh);
}

export async function renderBannerPng(opts: {
  size: BannerSize;
  creativeImageUrl: string;
  copy: BannerCopy;
  primaryVarValue: string;
}): Promise<Blob> {
  const { size, creativeImageUrl, copy, primaryVarValue } = opts;
  const primaryColor = hslFromVarValue(primaryVarValue);
  const textColor = "hsl(0 0% 0%)";

  const canvas = document.createElement("canvas");
  canvas.width = size.width;
  canvas.height = size.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  // Background
  ctx.fillStyle = primaryColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Load creative
  const { img, cleanup } = await loadImage(creativeImageUrl);
  try {
    const config = getFormatConfig(size);

    // Draw creative image
    drawImageContain(ctx, img, config.image.x, config.image.y, config.image.w, config.image.h);

    // Typography setup
    ctx.fillStyle = textColor;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    let cursorY = config.text.y;
    const maxTextW = config.text.w;
    const lineSpacing = 1.15;

    // Title
    ctx.font = `800 ${config.titleSize}px Champ, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
    const titleLines = wrapText(ctx, copy.title, maxTextW, config.titleMaxLines);
    for (const line of titleLines) {
      ctx.fillText(line, config.text.x, cursorY);
      cursorY += Math.round(config.titleSize * lineSpacing);
    }

    // Subtitle
    if (config.showSubtitle && config.subtitleSize > 0 && copy.subtitle?.trim()) {
      cursorY += Math.round(config.titleSize * 0.15);
      ctx.font = `600 ${config.subtitleSize}px Champ, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
      const subtitleLines = wrapText(ctx, copy.subtitle, maxTextW, config.subtitleMaxLines);
      for (const line of subtitleLines) {
        ctx.fillText(line, config.text.x, cursorY);
        cursorY += Math.round(config.subtitleSize * lineSpacing);
      }
    }

    // CTA Button
    const ctaText = (copy.cta || "Zjistit více").trim();
    ctx.font = `800 ${config.ctaSize}px Champ, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`;
    const ctaTextWidth = ctx.measureText(ctaText).width;
    const btnW = Math.round(ctaTextWidth + config.ctaPaddingX * 2);
    const btnH = Math.round(config.ctaSize + config.ctaPaddingY * 2);

    let btnX = config.text.x;
    let btnY: number;

    if (config.ctaAtBottom) {
      // Position at bottom of text area
      btnY = config.text.y + config.text.h - btnH - 4;
    } else {
      // Position after current text with small gap
      btnY = cursorY + Math.round(config.titleSize * 0.2);
    }

    // Ensure button fits
    btnY = clamp(btnY, cursorY + 4, config.text.y + config.text.h - btnH);

    // Draw filled black button
    ctx.fillStyle = textColor; // Black fill
    roundRect(ctx, btnX, btnY, btnW, btnH, config.ctaBorderRadius);
    ctx.fill();

    // Draw button text in white
    ctx.fillStyle = "hsl(0 0% 100%)"; // White text
    ctx.font = `600 ${config.ctaSize}px Champ, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial`; // Semibold
    ctx.textBaseline = "middle";
    ctx.fillText(ctaText, btnX + config.ctaPaddingX, btnY + btnH / 2);

  } finally {
    cleanup();
  }

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error("Failed to export PNG"));
      resolve(blob);
    }, "image/png");
  });
}
