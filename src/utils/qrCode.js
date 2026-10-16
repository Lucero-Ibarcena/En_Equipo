// [UTILIDAD: CÓDIGOS QR] Genera una matriz QR para mostrar enlaces de invitación.
const SIZE = 41; // Versión QR 6-L: 136 bytes de datos y 18 bytes de corrección por bloque.
const DATA_CODEWORDS = 136;
const ECC_CODEWORDS_PER_BLOCK = 18;
function multiply(a, b) {
  let result = 0;
  for (let i = 7; i >= 0; i -= 1) {
    result = (result << 1) ^ ((result >>> 7) * 0x11d);
    result ^= ((b >>> i) & 1) * a;
  }
  return result;
}
function createGenerator(degree) {
  let polynomial = [1];
  let root = 1;
  for (let i = 0; i < degree; i += 1) {
    const next = Array(polynomial.length + 1).fill(0);
    polynomial.forEach((coefficient, index) => {
      next[index] ^= coefficient;
      next[index + 1] ^= multiply(coefficient, root);
    });
    polynomial = next;
    root = multiply(root, 2);
  }
  return polynomial;
}
function remainder(data, divisor) {
  const result = [...data, ...Array(divisor.length - 1).fill(0)];
  for (let i = 0; i < data.length; i += 1) {
    const factor = result[i];
    if (factor)
      divisor.forEach((coefficient, index) => {
        result[i + index] ^= multiply(coefficient, factor);
      });
  }
  return result.slice(data.length);
}
function appendBits(bits, value, count) {
  for (let i = count - 1; i >= 0; i -= 1) bits.push((value >>> i) & 1);
}
function makeCodewords(payload) {
  const bytes = Array.from(new TextEncoder().encode(payload));
  if (bytes.length > 134) throw new Error('El enlace es demasiado largo para el QR.');
  const bits = [];
  appendBits(bits, 0b0100, 4); // Modo de bytes.
  appendBits(bits, bytes.length, 8);
  bytes.forEach((byte) => appendBits(bits, byte, 8));
  appendBits(bits, 0, Math.min(4, DATA_CODEWORDS * 8 - bits.length));
  while (bits.length % 8) bits.push(0);
  const data = [];
  for (let index = 0; index < bits.length; index += 8) {
    data.push(bits.slice(index, index + 8).reduce((value, bit) => (value << 1) | bit, 0));
  }
  for (let pad = 0; data.length < DATA_CODEWORDS; pad += 1) data.push(pad % 2 ? 0x11 : 0xec);
  const blockSize = DATA_CODEWORDS / 2;
  const blocks = [data.slice(0, blockSize), data.slice(blockSize)];
  const ecc = blocks.map((block) => remainder(block, createGenerator(ECC_CODEWORDS_PER_BLOCK)));
  const interleaved = [];
  for (let index = 0; index < blockSize; index += 1)
    blocks.forEach((block) => interleaved.push(block[index]));
  for (let index = 0; index < ECC_CODEWORDS_PER_BLOCK; index += 1)
    ecc.forEach((block) => interleaved.push(block[index]));
  return interleaved;
}
export function createQrMatrix(payload) {
  const modules = Array.from(
    {
      length: SIZE,
    },
    () => Array(SIZE).fill(false)
  );
  const functions = Array.from(
    {
      length: SIZE,
    },
    () => Array(SIZE).fill(false)
  );
  const setFunction = (x, y, dark) => {
    if (x >= 0 && x < SIZE && y >= 0 && y < SIZE) {
      modules[y][x] = dark;
      functions[y][x] = true;
    }
  };
  for (let i = 0; i < SIZE; i += 1) {
    setFunction(6, i, i % 2 === 0);
    setFunction(i, 6, i % 2 === 0);
  }
  const finder = (centerX, centerY) => {
    for (let dy = -4; dy <= 4; dy += 1) {
      for (let dx = -4; dx <= 4; dx += 1) {
        const distance = Math.max(Math.abs(dx), Math.abs(dy));
        setFunction(centerX + dx, centerY + dy, distance !== 2 && distance !== 4);
      }
    }
  };
  finder(3, 3);
  finder(SIZE - 4, 3);
  finder(3, SIZE - 4);
  for (const centerY of [6, 34]) {
    for (const centerX of [6, 34]) {
      const overlapsFinder =
        (centerX === 6 && centerY === 6) ||
        (centerX === 34 && centerY === 6) ||
        (centerX === 6 && centerY === 34);
      if (overlapsFinder) continue;
      for (let dy = -2; dy <= 2; dy += 1) {
        for (let dx = -2; dx <= 2; dx += 1) {
          setFunction(centerX + dx, centerY + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1);
        }
      }
    }
  }

  // Este generador usa el esquema Reed–Solomon de la versión 6-L indicada arriba.
  // Los bits de formato indican el nivel L (01) y la máscara 0.
  const formatData = 0b01000;
  let formatRemainder = formatData;
  for (let i = 0; i < 10; i += 1)
    formatRemainder = (formatRemainder << 1) ^ ((formatRemainder >>> 9) * 0x537);
  const formatBits = ((formatData << 10) | formatRemainder) ^ 0x5412;
  const formatBit = (index) => ((formatBits >>> index) & 1) !== 0;
  for (let i = 0; i <= 5; i += 1) setFunction(8, i, formatBit(i));
  setFunction(8, 7, formatBit(6));
  setFunction(8, 8, formatBit(7));
  setFunction(7, 8, formatBit(8));
  for (let i = 9; i < 15; i += 1) setFunction(14 - i, 8, formatBit(i));
  for (let i = 0; i < 8; i += 1) setFunction(SIZE - 1 - i, 8, formatBit(i));
  for (let i = 8; i < 15; i += 1) setFunction(8, SIZE - 15 + i, formatBit(i));
  setFunction(8, SIZE - 8, true);
  const codewords = makeCodewords(payload);
  let bitIndex = 0;
  for (let right = SIZE - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    const upward = ((right + 1) & 2) === 0;
    for (let vert = 0; vert < SIZE; vert += 1) {
      const y = upward ? SIZE - 1 - vert : vert;
      for (let offset = 0; offset < 2; offset += 1) {
        const x = right - offset;
        if (functions[y][x]) continue;
        const dark =
          bitIndex < codewords.length * 8 &&
          ((codewords[bitIndex >>> 3] >>> (7 - (bitIndex & 7))) & 1) !== 0;
        modules[y][x] = dark !== ((x + y) % 2 === 0);
        bitIndex += 1;
      }
    }
  }
  return modules;
}
export function createHouseholdJoinLink(inviteCode) {
  const link = new URL('/', window.location.origin);
  link.searchParams.set('join', inviteCode);
  return link.toString();
}
export function formatInviteCode(code = '') {
  const compact = code.replaceAll('-', '').replaceAll(' ', '').toLocaleUpperCase('en-US');
  return compact.length === 10 ? `${compact.slice(0, 5)}-${compact.slice(5)}` : compact;
}
