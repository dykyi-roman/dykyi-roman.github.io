// UUID to GridModel encoder

const Encoder = (() => {
  const GRID_COLS = 6;
  const GRID_ROWS = 6;
  const DATA_CELLS = 32;

  // Convert a single hex character to a 2x2 boolean matrix
  // bit3 (MSB) = top-left, bit2 = top-right, bit1 = bottom-left, bit0 (LSB) = bottom-right
  function hexToMatrix(hexChar) {
    const value = parseInt(hexChar, 16);
    return [
      [Boolean(value & 0x08), Boolean(value & 0x04)],
      [Boolean(value & 0x02), Boolean(value & 0x01)]
    ];
  }

  // Convert a 2x2 boolean matrix back to a hex character
  function matrixToHex(matrix) {
    const value =
      (matrix[0][0] ? 8 : 0) |
      (matrix[0][1] ? 4 : 0) |
      (matrix[1][0] ? 2 : 0) |
      (matrix[1][1] ? 1 : 0);
    return value.toString(16);
  }

  // Encode UUID into a GridModel
  // Square grid: 12x12 dots (6x6 cells of 2x2), no markers
  // 32 data cells + 4 padding cells to fill the 6x6 grid
  //
  // Layout (6 columns):
  // Row 0: seg1[0-5]                        — red
  // Row 1: seg1[6-7] seg2[0-3]              — red + blue
  // Row 2: seg3[0-3] seg4[0-1]              — green + orange
  // Row 3: seg4[2-3] seg5[0-3]              — orange + purple
  // Row 4: seg5[4-9]                        — purple
  // Row 5: seg5[10-11] [empty x4]           — purple + padding
  function encode(uuid, colors) {
    const segments = UUID.parse(uuid);
    const allHex = segments.join('');

    const segmentMap = [
      { start: 0, count: 8, colorIndex: 0 },
      { start: 8, count: 4, colorIndex: 1 },
      { start: 12, count: 4, colorIndex: 2 },
      { start: 16, count: 4, colorIndex: 3 },
      { start: 20, count: 12, colorIndex: 4 }
    ];

    const cells = [];
    let charIndex = 0;

    for (const seg of segmentMap) {
      for (let i = 0; i < seg.count; i++) {
        const globalIndex = seg.start + i;
        const row = Math.floor(globalIndex / GRID_COLS);
        const col = globalIndex % GRID_COLS;
        cells.push({
          row,
          col,
          matrix: hexToMatrix(allHex[charIndex]),
          color: colors[seg.colorIndex]
        });
        charIndex++;
      }
    }

    // Fill remaining 4 positions with empty cells to complete the square
    for (let i = DATA_CELLS; i < GRID_COLS * GRID_ROWS; i++) {
      cells.push({
        row: Math.floor(i / GRID_COLS),
        col: i % GRID_COLS,
        matrix: [[false, false], [false, false]],
        color: null
      });
    }

    return {
      width: GRID_COLS * 2,
      height: GRID_ROWS * 2,
      markers: [],
      cells,
      dataOrigin: { x: 0, y: 0 }
    };
  }

  return { hexToMatrix, matrixToHex, encode, GRID_COLS, GRID_ROWS, DATA_CELLS };
})();
