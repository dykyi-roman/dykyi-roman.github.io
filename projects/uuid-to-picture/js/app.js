// Main application module — wires all modules together

(function () {
  // DOM elements
  const uuidInput = document.getElementById('uuid-input');
  const uuidError = document.getElementById('uuid-error');
  const btnGenerateUUID = document.getElementById('btn-generate-uuid');
  const btnGeneratePicture = document.getElementById('btn-generate-picture');
  const encodeResult = document.getElementById('encode-result');
  const encodeCanvas = document.getElementById('encode-canvas');
  const btnDownloadPNG = document.getElementById('btn-download-png');
  const btnDownloadSVG = document.getElementById('btn-download-svg');
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('file-input');
  const decodeResult = document.getElementById('decode-result');
  const decodeCanvas = document.getElementById('decode-canvas');
  const decodedUUID = document.getElementById('decoded-uuid');
  const btnCopy = document.getElementById('btn-copy');
  const decodeConfidence = document.getElementById('decode-confidence');
  const decodeError = document.getElementById('decode-error');

  const colorInputs = [
    document.getElementById('color-seg1'),
    document.getElementById('color-seg2'),
    document.getElementById('color-seg3'),
    document.getElementById('color-seg4'),
    document.getElementById('color-seg5')
  ];

  let currentGridModel = null;

  // Get current colors from pickers
  function getColors() {
    return colorInputs.map(input => input.value);
  }

  // Validate UUID input and update UI
  function validateInput() {
    const value = uuidInput.value.trim();
    if (!value) {
      uuidInput.classList.remove('valid', 'invalid');
      uuidError.hidden = true;
      return false;
    }
    if (UUID.validate(value)) {
      uuidInput.classList.add('valid');
      uuidInput.classList.remove('invalid');
      uuidError.hidden = true;
      return true;
    }
    uuidInput.classList.add('invalid');
    uuidInput.classList.remove('valid');
    uuidError.hidden = false;
    return false;
  }

  // Generate picture from UUID
  function generatePicture() {
    if (!validateInput()) return;

    const uuid = uuidInput.value.trim();
    const colors = getColors();

    currentGridModel = Encoder.encode(uuid, colors);
    CanvasRenderer.render(encodeCanvas, currentGridModel);
    encodeResult.hidden = false;
  }

  // Download PNG
  function downloadPNG() {
    if (!encodeCanvas.width) return;
    const dataUrl = CanvasRenderer.exportToPNG(encodeCanvas);
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = 'uuid-picture.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  // Download SVG
  function downloadSVG() {
    if (!currentGridModel) return;
    const svgString = SVGRenderer.render(currentGridModel);
    SVGRenderer.download(svgString, 'uuid-picture.svg');
  }

  // Handle file for decoding
  async function handleFile(file) {
    if (!file || !file.type.startsWith('image/png')) {
      showDecodeError('Please upload a PNG image');
      return;
    }

    decodeError.hidden = true;
    decodeResult.hidden = false;
    decodedUUID.value = 'Decoding...';
    decodeConfidence.textContent = '';

    // Show preview
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        decodeCanvas.width = img.width;
        decodeCanvas.height = img.height;
        const ctx = decodeCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);

    try {
      const result = await Decoder.decode(file);
      decodedUUID.value = result.uuid;
      decodeConfidence.textContent = `Confidence: ${(result.confidence * 100).toFixed(0)}%`;
      decodeError.hidden = true;
    } catch (e) {
      decodedUUID.value = '';
      showDecodeError(e.message);
    }
  }

  function showDecodeError(message) {
    decodeError.textContent = message;
    decodeError.hidden = false;
    decodeResult.hidden = false;
  }

  // Copy decoded UUID to clipboard
  async function copyToClipboard() {
    const value = decodedUUID.value;
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      btnCopy.textContent = 'Copied!';
      setTimeout(() => { btnCopy.textContent = 'Copy'; }, 1500);
    } catch {
      // Fallback for non-secure contexts
      decodedUUID.select();
      document.execCommand('copy');
      btnCopy.textContent = 'Copied!';
      setTimeout(() => { btnCopy.textContent = 'Copy'; }, 1500);
    }
  }

  // Event listeners
  btnGenerateUUID.addEventListener('click', () => {
    uuidInput.value = UUID.generate();
    validateInput();
  });

  uuidInput.addEventListener('input', validateInput);

  btnGeneratePicture.addEventListener('click', generatePicture);

  btnDownloadPNG.addEventListener('click', downloadPNG);
  btnDownloadSVG.addEventListener('click', downloadSVG);

  // Re-render on color change if picture exists
  for (const input of colorInputs) {
    input.addEventListener('input', () => {
      if (currentGridModel && uuidInput.value.trim()) {
        generatePicture();
      }
    });
  }

  // Drag & drop
  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const file = e.dataTransfer.files[0];
    handleFile(file);
  });

  // Click on drop zone opens file dialog
  dropZone.addEventListener('click', (e) => {
    if (e.target.closest('.file-label')) return;
  });

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      handleFile(fileInput.files[0]);
      fileInput.value = '';
    }
  });

  btnCopy.addEventListener('click', copyToClipboard);

  // Allow Enter key in UUID input to generate picture
  uuidInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') generatePicture();
  });
})();
