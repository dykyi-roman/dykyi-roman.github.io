// SVG renderer for GridModel

const SVGRenderer = (() => {
  // Generate SVG string from GridModel
  function render(gridModel, userConfig) {
    const config = { ...CanvasRenderer.getDefaultConfig(), ...userConfig };
    const step = config.dotRadius * 2 + config.dotGap;

    const width = config.padding * 2 + gridModel.width * step - config.dotGap;
    const height = config.padding * 2 + gridModel.height * step - config.dotGap;

    const circles = [];

    // Render all cells (data + padding)
    const origin = gridModel.dataOrigin;
    for (const cell of gridModel.cells) {
      for (let dy = 0; dy < 2; dy++) {
        for (let dx = 0; dx < 2; dx++) {
          const gridX = origin.x + cell.col * 2 + dx;
          const gridY = origin.y + cell.row * 2 + dy;
          const pos = CanvasRenderer.dotPosition(gridX, gridY, config);
          const filled = cell.matrix[dy][dx];
          const color = filled ? cell.color : config.emptyDotColor;
          circles.push(`<circle cx="${pos.x}" cy="${pos.y}" r="${config.dotRadius}" fill="${color}"/>`);
        }
      }
    }

    return [
      `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
      `<rect width="${width}" height="${height}" fill="${config.bgColor}"/>`,
      ...circles,
      '</svg>'
    ].join('\n');
  }

  // Download SVG string as a file
  function download(svgString, filename) {
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'uuid-picture.svg';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return { render, download };
})();
