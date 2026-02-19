
import { GradientState, ExportSettings } from '../types';

export async function downloadGradient(state: GradientState, settings: ExportSettings) {
  if (settings.format === 'svg') {
    return downloadSvg(state, settings);
  }
  return downloadRaster(state, settings);
}

function downloadRaster(state: GradientState, settings: ExportSettings) {
  const canvas = document.createElement('canvas');
  canvas.width = settings.width;
  canvas.height = settings.height;
  const ctx = canvas.getContext('2d');

  if (!ctx) return;

  let gradient: CanvasGradient;

  if (state.type === 'linear') {
    const angleRad = (state.angle - 90) * (Math.PI / 180);
    const x1 = canvas.width / 2 - (Math.cos(angleRad) * canvas.width) / 2;
    const y1 = canvas.height / 2 - (Math.sin(angleRad) * canvas.height) / 2;
    const x2 = canvas.width / 2 + (Math.cos(angleRad) * canvas.width) / 2;
    const y2 = canvas.height / 2 + (Math.sin(angleRad) * canvas.height) / 2;
    
    gradient = ctx.createLinearGradient(x1, y1, x2, y2);
  } else {
    gradient = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      0,
      canvas.width / 2,
      canvas.height / 2,
      Math.max(canvas.width, canvas.height) / 2
    );
  }

  state.stops.forEach(stop => {
    gradient.addColorStop(stop.position / 100, stop.color);
  });

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const dataUrl = canvas.toDataURL(`image/${settings.format}`, settings.quality);
  const link = document.createElement('a');
  link.download = `gradish-${Date.now()}.${settings.format}`;
  link.href = dataUrl;
  link.click();
}

function downloadSvg(state: GradientState, settings: ExportSettings) {
  const sortedStops = [...state.stops].sort((a, b) => a.position - b.position);
  const stopTags = sortedStops.map(s => 
    `<stop offset="${s.position}%" stop-color="${s.color}" />`
  ).join('\n    ');

  let gradientTag = '';
  if (state.type === 'linear') {
    const angleRad = (state.angle - 90) * (Math.PI / 180);
    const x1 = 50 - Math.cos(angleRad) * 50;
    const y1 = 50 - Math.sin(angleRad) * 50;
    const x2 = 50 + Math.cos(angleRad) * 50;
    const y2 = 50 + Math.sin(angleRad) * 50;
    gradientTag = `<linearGradient id="grad" x1="${x1}%" y1="${y1}%" x2="${x2}%" y2="${y2}%">\n    ${stopTags}\n  </linearGradient>`;
  } else {
    gradientTag = `<radialGradient id="grad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">\n    ${stopTags}\n  </radialGradient>`;
  }

  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${settings.width}" height="${settings.height}" viewBox="0 0 ${settings.width} ${settings.height}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    ${gradientTag}
  </defs>
  <rect width="100%" height="100%" fill="url(#grad)"/>
</svg>`;

  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = `gradish-vector-${Date.now()}.svg`;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
