// news-image-20261122 — one image summing up Sunday 22 November 2026.
// Node 22, standard library only. No network, no external assets.
// Draws a 1024x1024 newspaper front page ("THE WORLD DAILY") to
// /output/entry.png (or $MAKEFUN_OUTPUT_DIR/entry.png). Deterministic:
// no randomness, no clocks, no timestamps anywhere in the output.
//
// Winning template (leaderboard research 22 Nov 2026): classic one-page
// newspaper front page — masthead, KPI strip, region bar, 3 illustrated
// leads, 10 illustrated cards, dotted world map, numbered "ALSO ON SUNDAY"
// list, red DATE CHECK box. 30 verified stories, every one dated
// Sunday 22 November 2026.
//
// Stories (all verified 22 Nov 2026; sources in the final report):
//  Leads: 1 COP31 overtime (AP/Reuters) — 2 Iran hits Bahrain plant
//  (Reuters) — 3 Indonesia factory fire, 36 missing (Reuters).
//  Cards: 4 Seoul minister resigns, AI cheating — 5 Zverev v Alcaraz
//  tonight, Turin (ATP Tour) — 6 Hong Kong votes — 7 Pant 128, India
//  629-6 (Reuters) — 8 Verstappen wins Las Vegas GP (Reuters/F1) —
//  9 Missiles fall on Poland (Reuters) — 10 Russian ship still ablaze
//  off Finland (CNN) — 11 Bolsonaro may need surgery (The Times) —
//  12 FBI probes database hack (Fox/AP) — 13 Belgium to ground flights
//  Monday (Xinhua).
//  List 14-30: AUKUS (Reuters) — ICJ Myanmar ruling — Pugh swims
//  Hormuz — ICE jet-bridge detentions — Rajasthan crash — Israel
//  coalition talks — EU budget cuts — Modi opens Nitish Setu — India
//  1 crore HPV jabs — Ramachandran keeps snooker crown — Florida river
//  still at record — Poland Senate by-election — Cyclone Xavier fades
//  — BYU 31-29 Kansas 3OT — Nebraska stuns Ohio State 31-27 —
//  Alabama 47, Chattanooga 0 — Nigeria boat toll rises to 24 (Reuters).
//  NOT used (wrong day, per brief): Norway court ruling (13 Nov),
//  Peru quake (20 Nov), El Chapo Isidro capture (21 Nov).
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

// ---------------------------------------------------------------------------
// Canvas: a plain RGB framebuffer, 1024 by 1024.
// ---------------------------------------------------------------------------
const W = 1024;
const H = 1024;
const buf = new Uint8Array(W * H * 3);

type RGB = [number, number, number];
const PAPER: RGB = [251, 247, 236];
const INK: RGB = [26, 26, 26];
const NAVY: RGB = [22, 41, 77];
const NIGHT: RGB = [13, 24, 48];
const RED: RGB = [179, 38, 30];
const BLUE: RGB = [36, 86, 166];
const SKY: RGB = [168, 205, 232];
const GOLD: RGB = [201, 162, 39];
const GREEN: RGB = [46, 125, 50];
const GREY: RGB = [107, 107, 107];
const RULE: RGB = [201, 194, 176];
const WHITE: RGB = [255, 255, 255];
const ORANGE: RGB = [232, 126, 32];
const YELLOW: RGB = [244, 196, 48];
const SAND: RGB = [238, 222, 186];
const DARKBLDG: RGB = [44, 64, 104];
const TEAL: RGB = [18, 77, 74];
const DEEPSEA: RGB = [18, 52, 86];
const BRICK: RGB = [140, 52, 40];
const MAPDOT: RGB = [90, 110, 140];
const LIGHTGREY: RGB = [214, 208, 192];

function put(x: number, y: number, c: RGB): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  buf[i] = c[0];
  buf[i + 1] = c[1];
  buf[i + 2] = c[2];
}

function rect(x: number, y: number, w: number, h: number, c: RGB): void {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) put(xx, yy, c);
  }
}

function hline(x0: number, x1: number, y: number, c: RGB): void {
  for (let x = x0; x <= x1; x++) put(x, y, c);
}

function vline(x: number, y0: number, y1: number, c: RGB): void {
  for (let y = y0; y <= y1; y++) put(x, y, c);
}

// Bresenham line, any slope.
function line(x0: number, y0: number, x1: number, y1: number, c: RGB): void {
  const dx = Math.abs(x1 - x0);
  const dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  let x = x0;
  let y = y0;
  for (;;) {
    put(x, y, c);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

function thickLine(x0: number, y0: number, x1: number, y1: number, c: RGB, t: number): void {
  for (let d = 0; d < t; d++) line(x0, y0 + d, x1, y1 + d, c);
}

function disc(cx: number, cy: number, r: number, c: RGB): void {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r) put(x, y, c);
    }
  }
}

function ring(cx: number, cy: number, r: number, c: RGB): void {
  for (let a = 0; a < 360; a += 2) {
    const t = (a * Math.PI) / 180;
    put(Math.round(cx + r * Math.cos(t)), Math.round(cy + r * Math.sin(t)), c);
  }
}

function frame(x: number, y: number, w: number, h: number, c: RGB): void {
  hline(x, x + w - 1, y, c);
  hline(x, x + w - 1, y + h - 1, c);
  vline(x, y, y + h - 1, c);
  vline(x + w - 1, y, y + h - 1, c);
}

// ---------------------------------------------------------------------------
// 5x7 bitmap font. Each glyph is 7 rows of 5 cells; '#' is ink, '.' blank.
// Uppercase, lowercase, digits and punctuation the page uses.
// ---------------------------------------------------------------------------
const GLYPHS: Record<string, string[]> = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.###.', '#...#', '#....', '#....', '#....', '#...#', '.###.'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.###.', '#...#', '#....', '#.###', '#...#', '#...#', '.####'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  J: ['..###', '...#.', '...#.', '...#.', '...#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#.#.#', '#...#', '#...#', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#.#.#', '#.#.#', '##.##', '#...#'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  a: ['.....', '.....', '.###.', '....#', '.####', '#...#', '.####'],
  b: ['#....', '#....', '####.', '#...#', '#...#', '#...#', '####.'],
  c: ['.....', '.....', '.###.', '#...#', '#....', '#...#', '.###.'],
  d: ['....#', '....#', '.####', '#...#', '#...#', '#...#', '.####'],
  e: ['.....', '.....', '.###.', '#...#', '#####', '#....', '.###.'],
  f: ['..##.', '.#...', '.#...', '####.', '.#...', '.#...', '.#...'],
  g: ['.....', '.####', '#...#', '#...#', '.####', '....#', '.###.'],
  h: ['#....', '#....', '####.', '#...#', '#...#', '#...#', '#...#'],
  i: ['..#..', '.....', '.##..', '..#..', '..#..', '..#..', '.###.'],
  j: ['...#.', '.....', '..##.', '...#.', '...#.', '#..#.', '.##..'],
  k: ['#....', '#....', '#..#.', '#.#..', '##...', '#.#..', '#..#.'],
  l: ['.##..', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  m: ['.....', '.....', '##.#.', '#.#.#', '#.#.#', '#.#.#', '#.#.#'],
  n: ['.....', '.....', '####.', '#...#', '#...#', '#...#', '#...#'],
  o: ['.....', '.....', '.###.', '#...#', '#...#', '#...#', '.###.'],
  p: ['.....', '.....', '####.', '#...#', '#...#', '####.', '#....'],
  q: ['.....', '.....', '.####', '#...#', '#...#', '.####', '....#'],
  r: ['.....', '.....', '#.##.', '##..#', '#....', '#....', '#....'],
  s: ['.....', '.....', '.####', '#....', '.###.', '....#', '####.'],
  t: ['.#...', '.#...', '####.', '.#...', '.#...', '.#...', '..##.'],
  u: ['.....', '.....', '#...#', '#...#', '#...#', '#..##', '.##.#'],
  v: ['.....', '.....', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  w: ['.....', '.....', '#...#', '#.#.#', '#.#.#', '#.#.#', '.#.#.'],
  x: ['.....', '.....', '#...#', '.#.#.', '..#..', '.#.#.', '#...#'],
  y: ['.....', '#...#', '#...#', '#...#', '.####', '....#', '.###.'],
  z: ['.....', '.....', '#####', '...#.', '..#..', '.#...', '#####'],
  '0': ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  '2': ['.###.', '#...#', '....#', '..##.', '.#...', '#....', '#####'],
  '3': ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
  '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  '6': ['..##.', '.#...', '#....', '####.', '#...#', '#...#', '.###.'],
  '7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  '9': ['.###.', '#...#', '#...#', '.####', '....#', '...#.', '.##..'],
  ' ': ['.....', '.....', '.....', '.....', '.....', '.....', '.....'],
  '.': ['.....', '.....', '.....', '.....', '.....', '.##..', '.##..'],
  ',': ['.....', '.....', '.....', '.....', '.##..', '..#..', '.#...'],
  ':': ['.....', '.##..', '.##..', '.....', '.##..', '.##..', '.....'],
  ';': ['.....', '.##..', '.##..', '.....', '.##..', '..#..', '.#...'],
  "'": ['..#..', '..#..', '.#...', '.....', '.....', '.....', '.....'],
  '-': ['.....', '.....', '.....', '.###.', '.....', '.....', '.....'],
  $: ['..#..', '.####', '#.#..', '.###.', '..#.#', '####.', '..#..'],
  '%': ['##..#', '##.#.', '...#.', '..#..', '.#...', '#.##.', '#..##'],
  '/': ['....#', '...#.', '...#.', '..#..', '.#...', '.#...', '#....'],
  '(': ['...#.', '..#..', '.#...', '.#...', '.#...', '..#..', '...#.'],
  ')': ['.#...', '..#..', '...#.', '...#.', '...#.', '..#..', '.#...'],
  '!': ['..#..', '..#..', '..#..', '..#..', '..#..', '.....', '..#..'],
  '?': ['.###.', '#...#', '....#', '..##.', '..#..', '.....', '..#..'],
  '&': ['.##..', '#..#.', '#.#..', '.#...', '#.#.#', '#..#.', '.##.#'],
  '"': ['.#.#.', '.#.#.', '.....', '.....', '.....', '.....', '.....'],
  '=': ['.....', '.....', '#####', '.....', '#####', '.....', '.....'],
  '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'],
  '[': ['.###.', '.#...', '.#...', '.#...', '.#...', '.#...', '.###.'],
  ']': ['.###.', '...#.', '...#.', '...#.', '...#.', '...#.', '.###.'],
};

const CHAR_W = 6; // 5 pixels of glyph plus 1 of space

function glyphWidth(s: string, scale: number): number {
  return s.length * CHAR_W * scale - scale;
}

function drawGlyph(x: number, y: number, ch: string, scale: number, c: RGB): void {
  const g = GLYPHS[ch];
  if (!g) return;
  for (let r = 0; r < 7; r++) {
    const row = g[r];
    for (let col = 0; col < 5; col++) {
      if (row[col] === '#') {
        for (let dy = 0; dy < scale; dy++) {
          for (let dx = 0; dx < scale; dx++) {
            put(x + col * scale + dx, y + r * scale + dy, c);
          }
        }
      }
    }
  }
}

function drawText(x: number, y: number, s: string, scale: number, c: RGB): void {
  let cx = x;
  for (const ch of s) {
    drawGlyph(cx, y, ch, scale, c);
    cx += CHAR_W * scale;
  }
}

function drawTextCentered(cx: number, y: number, s: string, scale: number, c: RGB): void {
  drawText(cx - Math.floor(glyphWidth(s, scale) / 2), y, s, scale, c);
}

// Greedy word wrap to a pixel width; returns lines of the original text.
function wrap(s: string, maxPx: number, scale: number): string[] {
  const maxChars = Math.max(1, Math.floor(maxPx / (CHAR_W * scale)));
  const words = s.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const next = cur === '' ? w : cur + ' ' + w;
    if (next.length <= maxChars) {
      cur = next;
    } else {
      if (cur !== '') lines.push(cur);
      cur = w;
    }
  }
  if (cur !== '') lines.push(cur);
  return lines;
}

// ---------------------------------------------------------------------------
// PNG encoder: signature, IHDR, one IDAT (zlib, filter 0 per row), IEND.
// ---------------------------------------------------------------------------
const CRC_TABLE = ((): Uint32Array => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(b: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < b.length; i++) c = CRC_TABLE[(c ^ b[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function encodePng(): Buffer {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type RGB
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    raw.set(buf.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', idat),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ---------------------------------------------------------------------------
// Illustrations (all fixed coordinates — no randomness).
// ---------------------------------------------------------------------------

// Lead 1: COP31 — globe, sun, thermometer on sky blue.
function drawClimate(x0: number, y0: number, w: number, h: number): void {
  rect(x0, y0, w, h, SKY);
  disc(x0 + w - 40, y0 + 22, 14, GOLD);
  const gx = x0 + 86;
  const gy = y0 + 46;
  disc(gx, gy, 34, BLUE);
  disc(gx - 12, gy - 8, 10, GREEN);
  disc(gx + 10, gy + 8, 9, GREEN);
  disc(gx + 14, gy - 16, 6, GREEN);
  ring(gx, gy, 34, WHITE);
  disc(x0 + 190, y0 + 20, 10, WHITE);
  disc(x0 + 204, y0 + 20, 13, WHITE);
  disc(x0 + 218, y0 + 20, 10, WHITE);
  const tx = x0 + 252;
  rect(tx, y0 + 16, 12, 50, WHITE);
  rect(tx + 3, y0 + 20, 6, 42, RED);
  disc(tx + 6, y0 + 68, 11, RED);
  drawText(x0 + 270, y0 + 28, '1.5C', 2, INK);
  rect(x0, y0 + h - 8, w, 8, GREEN);
}

// Lead 2: Bahrain — night skyline, industrial fire, missile trails.
function drawBahrain(x0: number, y0: number, w: number, h: number): void {
  rect(x0, y0, w, h, NIGHT);
  for (let i = 0; i < 22; i++) {
    const sx = x0 + 8 + ((i * 47) % (w - 16));
    const sy = y0 + 6 + ((i * 29) % 22);
    put(sx, sy, WHITE);
  }
  const base = y0 + h;
  const towers: [number, number][] = [
    [12, 44], [70, 60], [128, 48], [186, 66], [244, 40],
  ];
  for (const [bx, bh] of towers) {
    rect(x0 + bx, base - bh, 42, bh, DARKBLDG);
    for (let wy = base - bh + 7; wy < base - 6; wy += 13) {
      for (let wx = x0 + bx + 6; wx < x0 + bx + 36; wx += 13) {
        if ((wx + wy) % 26 === 0) rect(wx, wy, 3, 4, GOLD);
      }
    }
  }
  // Fireball over the plant.
  const ex = x0 + 208;
  const ey = y0 + 34;
  disc(ex, ey, 18, RED);
  disc(ex, ey, 12, ORANGE);
  disc(ex, ey, 7, YELLOW);
  line(ex, ey - 18, ex, ey - 30, YELLOW);
  line(ex - 18, ey, ex - 30, ey, YELLOW);
  line(ex + 18, ey, ex + 30, ey, YELLOW);
  // Smoke.
  disc(ex - 26, ey - 22, 8, GREY);
  disc(ex - 14, ey - 30, 10, GREY);
  // Missile trails diving from top right.
  line(x0 + w - 16, y0 + 4, x0 + w - 64, y0 + 40, WHITE);
  line(x0 + w - 15, y0 + 4, x0 + w - 63, y0 + 40, WHITE);
  disc(x0 + w - 64, y0 + 40, 4, ORANGE);
}

// Lead 3: Indonesia factory fire — sawtooth factory, flames, smoke.
function drawFactory(x0: number, y0: number, w: number, h: number): void {
  rect(x0, y0, w, h, [52, 52, 58]);
  // Smoke plumes.
  disc(x0 + 90, y0 + 14, 12, GREY);
  disc(x0 + 116, y0 + 8, 14, GREY);
  disc(x0 + 200, y0 + 16, 11, GREY);
  disc(x0 + 224, y0 + 8, 13, GREY);
  // Factory block with sawtooth roof.
  const base = y0 + h;
  rect(x0 + 20, base - 44, 262, 44, BRICK);
  for (let i = 0; i < 4; i++) {
    const rx = x0 + 20 + i * 66;
    line(rx, base - 44, rx + 33, base - 62, BRICK);
    line(rx + 33, base - 62, rx + 66, base - 44, BRICK);
  }
  // Windows.
  for (let wx = x0 + 34; wx < x0 + 270; wx += 26) {
    rect(wx, base - 30, 12, 12, GOLD);
  }
  // Flames along the roofline.
  const flames: [number, number][] = [
    [60, 16], [120, 20], [180, 15], [240, 19],
  ];
  for (const [fx, fh] of flames) {
    disc(x0 + fx, base - 62 - 4, fh, RED);
    disc(x0 + fx, base - 62 - 2, Math.floor(fh * 0.6), ORANGE);
    disc(x0 + fx, base - 62, Math.floor(fh * 0.35), YELLOW);
  }
  // Ground.
  rect(x0, base - 6, w, 6, INK);
}

// Card 4: exam paper, pencil, red cross.
function drawExam(x0: number, y0: number, w: number, h: number): void {
  rect(x0, y0, w, h, [232, 226, 205]);
  rect(x0 + 66, y0 + 6, 46, 36, WHITE);
  frame(x0 + 66, y0 + 6, 46, 36, RULE);
  for (let ly = y0 + 14; ly < y0 + 38; ly += 7) hline(x0 + 72, x0 + 104, ly, GREY);
  line(x0 + 118, y0 + 8, x0 + 146, y0 + 36, RED);
  line(x0 + 146, y0 + 8, x0 + 118, y0 + 36, RED);
  line(x0 + 20, y0 + 40, x0 + 60, y0 + 40, GOLD);
  line(x0 + 60, y0 + 40, x0 + 66, y0 + 36, INK);
}

// Card 5: tennis court, ball.
function drawTennis(x0: number, y0: number, w: number, h: number): void {
  rect(x0, y0, w, h, GREEN);
  rect(x0 + 30, y0 + 8, 118, 32, [74, 160, 74]);
  frame(x0 + 30, y0 + 8, 118, 32, WHITE);
  hline(x0 + 30, x0 + 148, y0 + 24, WHITE);
  vline(x0 + 89, y0 + 8, y0 + 40, WHITE);
  disc(x0 + 158, y0 + 14, 7, YELLOW);
  disc(x0 + 20, y0 + 36, 5, YELLOW);
}

// Card 6: ballot box, check, slip.
function drawBallot(x0: number, y0: number, w: number, h: number): void {
  rect(x0, y0, w, h, [226, 220, 200]);
  rect(x0 + 56, y0 + 22, 66, 20, NAVY);
  rect(x0 + 52, y0 + 18, 74, 6, NAVY);
  rect(x0 + 82, y0 + 6, 14, 14, WHITE);
  frame(x0 + 82, y0 + 6, 14, 14, RULE);
  line(x0 + 84, y0 + 12, x0 + 88, y0 + 17, RED);
  line(x0 + 88, y0 + 17, x0 + 96, y0 + 6, RED);
  line(x0 + 130, y0 + 10, x0 + 152, y0 + 32, RED);
  line(x0 + 152, y0 + 32, x0 + 168, y0 + 8, RED);
}

// Card 7: cricket bat, ball, stumps.
function drawCricket(x0: number, y0: number, w: number, h: number): void {
  rect(x0, y0, w, h, [120, 170, 90]);
  rect(x0, y0 + h - 8, w, 8, [90, 130, 60]);
  // Stumps.
  for (let i = 0; i < 3; i++) rect(x0 + 24 + i * 8, y0 + 16, 4, 22, GOLD);
  rect(x0 + 24, y0 + 13, 20, 3, GOLD);
  // Bat.
  line(x0 + 120, y0 + 6, x0 + 96, y0 + 38, SAND);
  line(x0 + 121, y0 + 6, x0 + 97, y0 + 38, SAND);
  line(x0 + 122, y0 + 6, x0 + 98, y0 + 38, SAND);
  rect(x0 + 90, y0 + 36, 14, 8, SAND);
  // Ball.
  disc(x0 + 152, y0 + 30, 7, RED);
}

// Card 8: race car, checkered flag.
function drawRace(x0: number, y0: number, w: number, h: number): void {
  rect(x0, y0, w, h, NIGHT);
  // Checkered strip.
  for (let cx = 0; cx < 8; cx++) {
    for (let cy = 0; cy < 2; cy++) {
      if ((cx + cy) % 2 === 0) rect(x0 + 130 + cx * 6, y0 + 6 + cy * 6, 6, 6, WHITE);
    }
  }
  // Car body.
  rect(x0 + 20, y0 + 24, 96, 10, RED);
  rect(x0 + 44, y0 + 16, 40, 8, RED);
  disc(x0 + 40, y0 + 36, 7, INK);
  disc(x0 + 40, y0 + 36, 3, GREY);
  disc(x0 + 96, y0 + 36, 7, INK);
  disc(x0 + 96, y0 + 36, 3, GREY);
  // Speed lines.
  hline(x0 + 8, x0 + 16, y0 + 20, WHITE);
  hline(x0 + 4, x0 + 14, y0 + 28, WHITE);
  hline(x0 + 122, y0 + 20, x0 + 128, WHITE);
}

// Card 9: missile trail, map pin.
function drawMissile(x0: number, y0: number, w: number, h: number): void {
  rect(x0, y0, w, h, SKY);
  line(x0 + 150, y0 + 4, x0 + 90, y0 + 34, WHITE);
  line(x0 + 149, y0 + 4, x0 + 89, y0 + 34, WHITE);
  disc(x0 + 90, y0 + 34, 5, ORANGE);
  disc(x0 + 90, y0 + 34, 3, RED);
  // Map pin.
  disc(x0 + 52, y0 + 22, 10, RED);
  disc(x0 + 52, y0 + 22, 4, WHITE);
  line(x0 + 52, y0 + 30, x0 + 52, y0 + 42, RED);
  line(x0 + 46, y0 + 42, x0 + 58, y0 + 42, RED);
}

// Card 10: ship on the sea, flames.
function drawShip(x0: number, y0: number, w: number, h: number): void {
  rect(x0, y0, w, h, DEEPSEA);
  // Sea waves.
  for (let wx = x0 + 4; wx < x0 + w - 4; wx += 4) {
    if (((wx + y0) % 16) < 8) put(wx, y0 + h - 8, [120, 180, 220]);
  }
  // Hull.
  rect(x0 + 34, y0 + 26, 110, 10, [70, 70, 74]);
  rect(x0 + 60, y0 + 14, 30, 12, [90, 90, 94]);
  rect(x0 + 96, y0 + 8, 6, 18, [90, 90, 94]);
  // Flames on deck.
  disc(x0 + 120, y0 + 12, 8, RED);
  disc(x0 + 120, y0 + 12, 5, ORANGE);
  disc(x0 + 120, y0 + 12, 3, YELLOW);
  disc(x0 + 70, y0 + 10, 6, GREY);
}

// Card 11: hospital cross, bed.
function drawHospital(x0: number, y0: number, w: number, h: number): void {
  rect(x0, y0, w, h, TEAL);
  rect(x0 + 20, y0 + 10, 28, 28, WHITE);
  rect(x0 + 30, y0 + 14, 8, 20, RED);
  rect(x0 + 24, y0 + 20, 20, 8, RED);
  // Bed.
  rect(x0 + 70, y0 + 30, 90, 5, WHITE);
  vline(x0 + 74, y0 + 30, y0 + 42, WHITE);
  vline(x0 + 156, y0 + 30, y0 + 42, WHITE);
  disc(x0 + 84, y0 + 26, 6, SAND);
  rect(x0 + 92, y0 + 26, 40, 4, SAND);
}

// Card 12: magnifier over database bars.
function drawFbi(x0: number, y0: number, w: number, h: number): void {
  rect(x0, y0, w, h, NIGHT);
  const bars = [14, 26, 10, 30, 18];
  for (let i = 0; i < 5; i++) {
    rect(x0 + 22 + i * 16, y0 + 40 - bars[i], 10, bars[i], BLUE);
  }
  ring(x0 + 128, y0 + 18, 13, WHITE);
  ring(x0 + 128, y0 + 18, 12, WHITE);
  line(x0 + 137, y0 + 27, x0 + 152, y0 + 40, WHITE);
  line(x0 + 138, y0 + 28, x0 + 153, y0 + 41, WHITE);
}

// Card 13: plane, strike line.
function drawPlane(x0: number, y0: number, w: number, h: number): void {
  rect(x0, y0, w, h, SKY);
  disc(x0 + 150, y0 + 12, 9, GOLD);
  // Plane silhouette.
  rect(x0 + 60, y0 + 18, 60, 8, WHITE);
  line(x0 + 70, y0 + 18, x0 + 62, y0 + 8, WHITE);
  line(x0 + 70, y0 + 26, x0 + 62, y0 + 36, WHITE);
  line(x0 + 110, y0 + 18, x0 + 104, y0 + 10, WHITE);
  line(x0 + 110, y0 + 26, x0 + 104, y0 + 34, WHITE);
  line(x0 + 60, y0 + 22, x0 + 44, y0 + 22, WHITE);
  // Red strike line.
  line(x0 + 20, y0 + 40, x0 + 160, y0 + 40, RED);
  line(x0 + 20, y0 + 42, x0 + 160, y0 + 42, RED);
  drawText(x0 + 24, y0 + 30, 'X', 2, RED);
}

// ---------------------------------------------------------------------------
// Panels.
// ---------------------------------------------------------------------------
function numberChip(x: number, y: number, n: string): void {
  const w = n.length > 1 ? 26 : 20;
  rect(x, y, w, 20, RED);
  drawTextCentered(x + Math.floor(w / 2), y + 3, n, 2, WHITE);
}

function drawLead(
  x: number, y: number, w: number, h: number, n: string,
  kicker: string, headline: string, sub: string,
  art: (x0: number, y0: number, w: number, h: number) => void,
): void {
  frame(x, y, w, h, RULE);
  art(x + 2, y + 2, w - 4, 88);
  numberChip(x + 8, y + 8, n);
  drawText(x + 14, y + 98, kicker, 2, RED);
  const lines = wrap(headline, w - 28, 3);
  for (let i = 0; i < lines.length && i < 2; i++) {
    drawText(x + 14, y + 120 + i * 27, lines[i], 3, INK);
  }
  drawText(x + 14, y + 176, sub, 2, GREY);
}

function drawCard(
  x: number, y: number, w: number, h: number, n: string,
  kicker: string, headline: string,
  art: (x0: number, y0: number, w: number, h: number) => void,
): void {
  frame(x, y, w, h, RULE);
  art(x + 2, y + 2, w - 4, 48);
  numberChip(x + 6, y + 6, n);
  drawText(x + 10, y + 56, kicker, 2, RED);
  const lines = wrap(headline, w - 20, 2);
  for (let i = 0; i < lines.length && i < 2; i++) {
    drawText(x + 10, y + 74 + i * 18, lines[i], 2, INK);
  }
}

// ---------------------------------------------------------------------------
// Dotted world map.
// ---------------------------------------------------------------------------
const LAND: string[] = [
  '................................................',
  '................................................',
  '.....#####........................................',
  '...###########........#####...#############........',
  '..##############......#######.###############......',
  '..###############.....######..################.....',
  '...##############......#####...##############......',
  '....############.......####.....##########.........',
  '.....##########........####......########..........',
  '......########.........#####.......######..........',
  '.......######..........######.......#####..........',
  '........####...........#######.......###...........',
  '.........###............######.......###...........',
  '.........##.............#######......##............',
  '..........#.............######....................',
  '........................#####.....................',
  '........................####........#####.........',
  '.........................##.........######........',
  '....................................####.........',
  '.............................................#...',
  '................................................',
  '................................................',
  '................................................',
  '................................................',
];

// [number, grid col, grid row]
const MARKERS: [string, number, number][] = [
  ['1', 31, 6],
  ['2', 33, 8],
  ['3', 40, 11],
  ['4', 43, 6],
  ['5', 25, 7],
  ['6', 41, 9],
  ['7', 45, 19],
  ['8', 4, 7],
  ['9', 27, 4],
  ['10', 28, 2],
  ['11', 12, 14],
  ['12', 6, 6],
  ['13', 23, 5],
];

function drawMap(mx: number, my: number): void {
  for (let r = 0; r < LAND.length; r++) {
    const row = LAND[r];
    for (let c = 0; c < row.length; c++) {
      if (row[c] === '#') {
        disc(mx + c * 5 + 2, my + r * 5 + 2, 2, MAPDOT);
      }
    }
  }
  for (const [n, c, r] of MARKERS) {
    const cx = mx + c * 5 + 2;
    const cy = my + r * 5 + 2;
    const rad = n.length > 1 ? 7 : 6;
    disc(cx, cy, rad + 1, WHITE);
    disc(cx, cy, rad, RED);
    drawText(cx - Math.floor(glyphWidth(n, 1) / 2), cy - 3, n, 1, WHITE);
  }
}

// ---------------------------------------------------------------------------
// Page: fill the paper, then draw the front page top to bottom.
// ---------------------------------------------------------------------------
rect(0, 0, W, H, PAPER);

// --- Top bar ----------------------------------------------------------------
rect(0, 0, W, 26, NAVY);
drawTextCentered(512, 6, 'THE WORLD IN ONE DAY - 30 STORIES - 7 REGIONS - SUNDAY 22 NOVEMBER 2026', 2, WHITE);

// --- Masthead ---------------------------------------------------------------
drawTextCentered(512, 38, 'THE WORLD DAILY', 7, INK);
rect(0, 98, W, 4, RED);
drawTextCentered(512, 108, 'SUNDAY 22 NOVEMBER 2026', 4, INK);
drawTextCentered(512, 142, 'WAR, COURTS AND SPORT SHARED THE FRONT PAGE', 2, RED);

// --- KPI strip --------------------------------------------------------------
const KPI: [string, string][] = [
  ['36', 'MISSING'],
  ['111', 'CHEAT CASES'],
  ['629-6', 'INDIA AT LUNCH'],
  ['35', 'LEAD CHANGES'],
  ['2nd', 'DAY OVERTIME'],
];
for (let i = 0; i < KPI.length; i++) {
  const bx = 40 + i * 190;
  rect(bx, 160, 184, 46, NAVY);
  drawTextCentered(bx + 92, 166, KPI[i][0], 3, YELLOW);
  drawTextCentered(bx + 92, 190, KPI[i][1], 2, WHITE);
}

// --- Region bar -------------------------------------------------------------
const REGIONS: [string, RGB, RGB][] = [
  ['EUROPE 6', NAVY, WHITE],
  ['M.EAST 3', RED, WHITE],
  ['AMERICAS 8', TEAL, WHITE],
  ['ASIA-PAC. 9', GREEN, WHITE],
  ['AFRICA 1', GOLD, INK],
  ['OCEANIA 2', BLUE, WHITE],
  ['GLOBAL 1', GREY, WHITE],
];
for (let i = 0; i < REGIONS.length; i++) {
  const rx = 40 + i * 135;
  rect(rx, 212, 134, 22, REGIONS[i][1]);
  drawTextCentered(rx + 67, 217, REGIONS[i][0], 2, REGIONS[i][2]);
}

// --- Three leads ------------------------------------------------------------
drawLead(40, 240, 306, 196, '1', 'CLIMATE - COP31', 'CLIMATE TALKS IN OVERTIME', 'Day two of overtime', drawClimate);
drawLead(359, 240, 306, 196, '2', 'MIDDLE EAST', 'IRAN HITS BAHRAIN PLANT', 'US bases targeted too', drawBahrain);
drawLead(678, 240, 306, 196, '3', 'INDONESIA', '36 MISSING IN FACTORY FIRE', 'Three dead in Cikande', drawFactory);

// --- Ten cards, two rows of five --------------------------------------------
drawCard(41, 442, 182, 118, '4', 'SOUTH KOREA', 'SEOUL MINISTER RESIGNS', drawExam);
drawCard(231, 442, 182, 118, '5', 'ATP FINAL', 'ALCARAZ V ZVEREV', drawTennis);
drawCard(421, 442, 182, 118, '6', 'HONG KONG', 'HONG KONG VOTES TODAY', drawBallot);
drawCard(611, 442, 182, 118, '7', 'CRICKET', 'PANT 128 PILES ON', drawCricket);
drawCard(801, 442, 182, 118, '8', 'FORMULA 1', 'VERSTAPPEN WINS IN VEGAS', drawRace);
drawCard(41, 566, 182, 118, '9', 'POLAND', 'MISSILES FALL ON POLAND', drawMissile);
drawCard(231, 566, 182, 118, '10', 'BALTIC SEA', 'RUSSIAN SHIP STILL ABLAZE', drawShip);
drawCard(421, 566, 182, 118, '11', 'BRAZIL', 'BOLSONARO MAY NEED SURGERY', drawHospital);
drawCard(611, 566, 182, 118, '12', 'WASHINGTON', 'FBI PROBES DATABASE HACK', drawFbi);
drawCard(801, 566, 182, 118, '13', 'BRUSSELS', 'BELGIUM FLIGHTS OFF', drawPlane);

// --- Bottom: map + list -----------------------------------------------------
frame(40, 690, 290, 282, RULE);
drawText(54, 698, 'WHERE IT HAPPENED', 2, RED);
drawMap(58, 738);
drawText(54, 872, 'EACH DOT MARKS WHERE A STORY HAPPENED', 1, GREY);
drawText(54, 884, 'NUMBERS 1-13 MATCH THE LEADS AND CARDS ABOVE', 1, GREY);

frame(340, 690, 644, 282, RULE);
drawText(352, 698, 'ALSO ON SUNDAY', 2, RED);
// [number, line 1, line 2] — each column holds 6 items, 2 lines each.
const LIST: [string, string, string][] = [
  ['14. ', 'AUKUS: MARLES', "CALLS CBO WRONG"],
  ['15. ', 'ICJ RULES IN', 'MYANMAR CASE'],
  ['16. ', 'PUGH SWIMS', 'WAR-HIT HORMUZ'],
  ['17. ', 'ICE SEIZES 2', 'ON JET BRIDGE'],
  ['18. ', 'NINE DEAD IN', 'RAJASTHAN CRASH'],
  ['19. ', 'ISRAEL', 'COALITION TALKS'],
  ['20. ', 'EU BUDGET:', '204BN IN CUTS'],
  ['21. ', 'MODI OPENS', 'NITISH SETU'],
  ['22. ', 'INDIA PASSES', 'CRORE HPV JABS'],
  ['23. ', 'RAMACHANDRAN', 'KEEPS CROWN'],
  ['24. ', 'FLORIDA RIVER', 'STILL AT RECORD'],
  ['25. ', 'POLAND VOTES', 'IN BY-ELECTION'],
  ['26. ', 'XAVIER', 'FADES NEAR SAMOA'],
  ['27. ', 'BYU BEATS', 'KANSAS 31-29 3OT'],
  ['28. ', 'NEBRASKA', 'OHIO STATE 31-27'],
  ['29. ', 'ALABAMA 47,', 'CHATTANOOGA 0'],
  ['30. ', 'NIGERIA BOAT', 'TOLL RISES TO 24'],
];
for (let i = 0; i < LIST.length; i++) {
  const col = Math.floor(i / 6);
  const row = i % 6;
  const lx = 352 + col * 214;
  const ly = 722 + row * 40;
  drawText(lx, ly, LIST[i][0], 2, RED);
  drawText(lx + glyphWidth(LIST[i][0], 2), ly, LIST[i][1], 2, INK);
  drawText(lx, ly + 17, LIST[i][2], 2, INK);
}

// --- Footer: DATE CHECK + sources -------------------------------------------
rect(40, 982, 944, 28, RED);
drawTextCentered(512, 990, 'DATE CHECK - EVERY STORY ON THIS PAGE HAPPENED ON SUNDAY 22 NOVEMBER 2026', 2, WHITE);
drawTextCentered(512, 1016, 'SOURCES: REUTERS - AP - ATP TOUR - CHINA DAILY - XINHUA - FOX NEWS - CNN - THE TIMES', 1, GREY);

// ---------------------------------------------------------------------------
// Write the PNG.
// ---------------------------------------------------------------------------
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'entry.png'), encodePng());
