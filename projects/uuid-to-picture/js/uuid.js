// UUID validation, parsing, generation, and assembly

const UUID = (() => {
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  function validate(input) {
    if (typeof input !== 'string') return false;
    return UUID_REGEX.test(input.trim());
  }

  function parse(uuid) {
    const clean = uuid.trim().toLowerCase();
    if (!validate(clean)) throw new Error('Invalid UUID format');
    const parts = clean.split('-');
    return [parts[0], parts[1], parts[2], parts[3], parts[4]];
  }

  function generate() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    // Set version 4 (bits 12-15 of time_hi_and_version)
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    // Set variant (bits 6-7 of clock_seq_hi_and_reserved)
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20, 32)
    ].join('-');
  }

  function assemble(segments) {
    if (!Array.isArray(segments) || segments.length !== 5) {
      throw new Error('Expected 5 segments');
    }
    const uuid = segments.join('-');
    if (!validate(uuid)) throw new Error('Assembled UUID is invalid');
    return uuid;
  }

  return { validate, parse, generate, assemble };
})();
