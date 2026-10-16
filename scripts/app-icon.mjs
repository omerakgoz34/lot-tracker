import { deflateSync, crc32 } from "node:zlib";

const BG = [0x16, 0x18, 0x1c];
const TAG = [0xf3, 0xf1, 0xec];
const HOLE = [0x16, 0x18, 0x1c];
const BAR = [0x3f, 0x5f, 0x6b];
const INK = [0x1c, 0x1e, 0x22];

function inRoundRect(x, y, rx, ry, rw, rh, r) {
  if (x < rx || y < ry || x >= rx + rw || y >= ry + rh) return false;
  const left = x < rx + r;
  const right = x > rx + rw - r;
  const top = y < ry + r;
  const bottom = y > ry + rh - r;
  if (!left && !right && !top && !bottom) return true;
  const cx = left ? rx + r : right ? rx + rw - r : x;
  const cy = top ? ry + r : bottom ? ry + rh - r : y;
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

function paint(size) {
  const scale = size / 32;
  const pixels = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const px = x + 0.5;
      const py = y + 0.5;
      let color = BG;
      if (inRoundRect(px, py, 8 * scale, 6 * scale, 16 * scale, 20 * scale, 2 * scale)) color = TAG;
      const dx = px - 16 * scale;
      const dy = py - 10 * scale;
      const hole = 2 * scale;
      if (dx * dx + dy * dy <= hole * hole) color = HOLE;
      if (inRoundRect(px, py, 10 * scale, 16 * scale, 12 * scale, 2 * scale, 1 * scale)) color = BAR;
      if (inRoundRect(px, py, 10 * scale, 20 * scale, 8 * scale, 2 * scale, 1 * scale)) color = INK;
      const offset = (y * size + x) * 4;
      pixels[offset] = color[0];
      pixels[offset + 1] = color[1];
      pixels[offset + 2] = color[2];
      pixels[offset + 3] = 255;
    }
  }
  return encodePng(size, size, pixels);
}

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(body.length - 4);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0);
  return Buffer.concat([length, body, crc]);
}

function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 4 + 1);
    raw[row] = 0;
    rgba.copy(raw, row + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

export function appIcons() {
  return [
    { size: 180, name: "apple-touch-icon", png: paint(180) },
    { size: 192, name: "icon-192", png: paint(192) },
    { size: 512, name: "icon-512", png: paint(512) },
  ];
}
