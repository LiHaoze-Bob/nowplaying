import { LAYOUT } from "./config";
import type { CardTheme, CoverStyle } from "./types";

const { coverSize: SIZE } = LAYOUT;
const R = SIZE / 2;

function spinAnimation(duration: number): string {
  return `<animateTransform attributeName="transform" type="rotate" from="0" to="360" dur="${duration}s" repeatCount="indefinite"/>`;
}

function discImage(coverDataUri: string, id: string): string {
  return `<image href="${coverDataUri}" x="${-R}" y="${-R}" width="${SIZE}" height="${SIZE}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${id})"/>`;
}

function placeholderDisc(theme: CardTheme, id: string): string {
  return `
    <circle r="${R}" fill="#${theme.coverBg}"/>
    <g clip-path="url(#${id})">
      <circle r="${R}" fill="#${theme.coverBg}"/>
      <path d="M${-10} ${8} L${-4} ${-6} L${10} ${8} Z" fill="#${theme.muted}" opacity="0.35" transform="translate(0,-4)"/>
      <circle r="14" fill="none" stroke="#${theme.muted}" stroke-width="2" opacity="0.25"/>
    </g>
  `;
}

function vinylGrooves(): string {
  return [0.88, 0.76, 0.64]
    .map(
      (scale) =>
        `<circle r="${R * scale}" fill="none" stroke="#000" stroke-width="0.6" opacity="0.12"/>`,
    )
    .join("");
}

function centerSpindle(theme: CardTheme, style: CoverStyle): string {
  if (style === "cd") {
    return `
      <circle r="5" fill="#${theme.bg}" stroke="#${theme.border}" stroke-width="1"/>
      <circle r="1.5" fill="#${theme.muted}" opacity="0.6"/>
    `;
  }
  return `
    <circle r="${R * 0.28}" fill="#${theme.bg}" opacity="0.92"/>
    <circle r="4" fill="#${theme.coverBg}" stroke="#${theme.border}" stroke-width="0.75"/>
    <circle r="1.2" fill="#${theme.muted}" opacity="0.5"/>
  `;
}

export function renderCover(params: {
  style: CoverStyle;
  coverDataUri: string | null;
  theme: CardTheme;
  spin: boolean;
  spinDuration: number;
  idPrefix: string;
}): { markup: string; size: number } {
  const { style, coverDataUri, theme, spin, spinDuration, idPrefix } = params;

  if (style === "square") {
    const content = coverDataUri
      ? `<image href="${coverDataUri}" width="${SIZE}" height="${SIZE}" preserveAspectRatio="xMidYMid slice" clip-path="url(#${idPrefix}SquareClip)"/>`
      : `
        <rect width="${SIZE}" height="${SIZE}" rx="14" fill="#${theme.coverBg}"/>
        <path d="M${SIZE / 2 - 12} ${SIZE / 2 + 10} L${SIZE / 2 - 5} ${SIZE / 2 - 8} L${SIZE / 2 + 12} ${SIZE / 2 + 10} Z" fill="#${theme.muted}" opacity="0.35"/>
        <circle cx="${SIZE / 2}" cy="${SIZE / 2 - 4}" r="14" fill="none" stroke="#${theme.muted}" stroke-width="2" opacity="0.25"/>
      `;

    return {
      size: SIZE,
      markup: `
        <defs>
          <clipPath id="${idPrefix}SquareClip">
            <rect width="${SIZE}" height="${SIZE}" rx="14"/>
          </clipPath>
        </defs>
        <rect width="${SIZE}" height="${SIZE}" rx="14" fill="#${theme.coverBg}"/>
        ${content}
      `,
    };
  }

  const clipId = `${idPrefix}DiscClip`;
  const art = coverDataUri ? discImage(coverDataUri, clipId) : placeholderDisc(theme, clipId);
  const grooves = style === "vinyl" ? vinylGrooves() : "";
  const discBody = `${grooves}${art}`;
  const rotating = spin
    ? `<g>${spinAnimation(spinDuration)}${discBody}</g>`
    : discBody;

  return {
    size: SIZE,
    markup: `
      <defs>
        <clipPath id="${clipId}">
          <circle r="${R}" cx="0" cy="0"/>
        </clipPath>
        <radialGradient id="${idPrefix}VinylSheen" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stop-color="#fff" stop-opacity="0.08"/>
          <stop offset="55%" stop-color="#fff" stop-opacity="0"/>
          <stop offset="100%" stop-color="#000" stop-opacity="0.18"/>
        </radialGradient>
      </defs>
      <circle r="${R + 1}" fill="#000" opacity="0.25"/>
      <circle r="${R}" fill="#${theme.coverBg}"/>
      ${rotating}
      ${style === "vinyl" ? `<circle r="${R}" fill="url(#${idPrefix}VinylSheen)" pointer-events="none"/>` : ""}
      ${centerSpindle(theme, style)}
    `,
  };
}

export function coverOffsetY(coverSize: number, cardHeight: number): number {
  return (cardHeight - coverSize) / 2;
}
