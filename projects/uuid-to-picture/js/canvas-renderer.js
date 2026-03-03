// Canvas renderer for GridModel

const CanvasRenderer = (() => {
  const DEFAULT_CONFIG = {
    dotRadius: 8,
    dotGap: 2,
    bgColor: '#FFFFFF',
    markerColor: '#000000',
    emptyDotColor: '#E8E8E8',
    padding: 1
  };

  // Calculate pixel position for a dot in the grid
  function dotPosition(gridX, gridY, config) {
    const step = config.dotRadius * 2 + config.dotGap;
    return {
      x: config.padding + gridX * step + config.dotRadius,
      y: config.padding + gridY * step + config.dotRadius
    };
  }

  // Draw a single dot (filled circle)
  function drawDot(ctx, cx, cy, radius, color) {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }

  // Render GridModel to canvas
  function render(canvas, gridModel, userConfig) {
    const config = { ...DEFAULT_CONFIG, ...userConfig };
    const step = config.dotRadius * 2 + config.dotGap;

    const width = config.padding * 2 + gridModel.width * step - config.dotGap;
    const height = config.padding * 2 + gridModel.height * step - config.dotGap;

    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = config.bgColor;
    ctx.fillRect(0, 0, width, height);

    // Draw all cells (data + padding)
    const origin = gridModel.dataOrigin;
    for (const cell of gridModel.cells) {
      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          const gridX = origin.x + cell.col * 2 + dx;
          const gridY = origin.y + cell.row * 2 + dy;
          const pos = dotPosition(gridX, gridY, config);
          const filled = cell.matrix[dy][dx];
          drawDot(ctx, pos.x, pos.y, config.dotRadius, filled ? cell.color : config.emptyDotColor);
        }
      }
    }
  }

  // Export canvas to PNG data URL
  function exportToPNG(canvas) {
    return canvas.toDataURL('image/png');
  }

  // Get default config (for shared use by SVG renderer and decoder)
  function getDefaultConfig() {
    return { ...DEFAULT_CONFIG };
  }

  return { render, exportToPNG, dotPosition, getDefaultConfig };
})();
