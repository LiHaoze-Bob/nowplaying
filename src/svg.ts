import { renderCover, coverOffsetY } from "./cover";
import { LAYOUT } from "./config";
import type { CardOptions, CoverStyle, SpinMode, TrackData } from "./types";
import { escapeXml, formatTimeAgo, truncate } from "./utils";

const FONT = LAYOUT.font;

function maxChars(width: number, startX: number, size = 7.2): number {
  return Math.max(12, Math.floor((width - startX - LAYOUT.padding) / size));
}

function shouldSpin(style: CoverStyle, mode: SpinMode, isNowPlaying: boolean): boolean {
  if (mode === "never") return false;
  if (mode === "always") return true;
  return isNowPlaying;
}

function equalizerBars(x: number, y: number, color: string): string {
  const bars = [
    { h: 5, delay: "0s" },
    { h: 9, delay: "0.12s" },
    { h: 4, delay: "0.24s" },
  ];
  return bars
    .map((bar, i) => {
      const bx = x + i * 4;
      const by = y + 10 - bar.h;
      return `
        <rect x="${bx}" y="${by}" width="2.5" height="${bar.h}" rx="1" fill="#${color}">
          <animate attributeName="height" values="${bar.h};${bar.h + 5};${bar.h}" dur="0.75s" repeatCount="indefinite" begin="${bar.delay}"/>
          <animate attributeName="y" values="${by};${by - 5};${by}" dur="0.75s" repeatCount="indefinite" begin="${bar.delay}"/>
        </rect>
      `;
    })
    .join("");
}

function statusBadge(
  status: string,
  isNowPlaying: boolean,
  x: number,
  y: number,
): string {
  const label = escapeXml(status.toUpperCase());
  const textWidth = status.length * 6.8;
  const textOffset = isNowPlaying ? 24 : 18;
  const badgeWidth = textOffset + textWidth + 9;
  const bx = x - badgeWidth;

  const icon = isNowPlaying
    ? equalizerBars(bx + 6, y - 10, "ffffff")
    : `<circle cx="${bx + 8}" cy="${y - 4}" r="2.5" fill="#ffffff" opacity="0.9"/>`;

  const textX = bx + textOffset;

  return `
    <rect x="${bx}" y="${y - 14}" width="${badgeWidth}" height="20" rx="10" fill="#ffffff" opacity="0.14"/>
    <rect x="${bx + 0.5}" y="${y - 13.5}" width="${badgeWidth - 1}" height="19" rx="9.5" fill="none" stroke="#ffffff" stroke-opacity="0.22"/>
    ${icon}
    <text x="${textX}" y="${y}" fill="#ffffff" font-family="${FONT}" font-size="10" font-weight="700" letter-spacing="0.06em">${label}</text>
  `;
}

function renderInfoPanel(
  track: TrackData,
  options: CardOptions,
  textX: number,
): string {
  const { width, showAlbum } = options;
  const chars = maxChars(width, textX);

  const status = track.isNowPlaying
    ? "Now Playing"
    : track.playedAt
      ? formatTimeAgo(track.playedAt)
      : "Last played";

  const title = escapeXml(truncate(track.name, chars));
  const artist = escapeXml(truncate(track.artist, chars + 4));
  const album =
    showAlbum && track.album ? escapeXml(truncate(track.album, chars + 4)) : "";

  const badgeX = width - LAYOUT.padding;

  return `
    <text x="${textX}" y="30" fill="#ffffff" fill-opacity="0.72" font-family="${FONT}" font-size="10" font-weight="650" letter-spacing="0.12em">♪ APPLE MUSIC</text>
    ${statusBadge(status, track.isNowPlaying, badgeX, 30)}

    <text x="${textX}" y="58" fill="#ffffff" font-family="${FONT}" font-size="17" font-weight="700">${title}</text>

    <text x="${textX}" y="78" fill="#ffffff" fill-opacity="0.82" font-family="${FONT}" font-size="12">
      <tspan fill-opacity="0.64">by </tspan>
      <tspan font-weight="600">${artist}</tspan>
    </text>

    ${
      album
        ? `
    <g transform="translate(${textX}, 94)">
      <rect width="10" height="10" rx="3" fill="#ffffff" opacity="0.16"/>
      <circle cx="5" cy="5" r="2.5" fill="#ffffff" opacity="0.72"/>
      <text x="16" y="9" fill="#ffffff" fill-opacity="0.64" font-family="${FONT}" font-size="11">${album}</text>
    </g>`
        : ""
    }
  `;
}

export function renderErrorCard(message: string, options: CardOptions): string {
  const { width, theme } = options;
  const idPrefix = "err";
  const cover = renderCover({
    style: "square",
    coverDataUri: null,
    theme,
    spin: false,
    spinDuration: 6,
    idPrefix,
  });
  const coverY = coverOffsetY(cover.size, LAYOUT.cardHeight);
  const textX = LAYOUT.padding + cover.size + LAYOUT.textGap;

  return wrapSvg(
    width,
    LAYOUT.cardHeight,
    `
  <rect width="${width}" height="${LAYOUT.cardHeight}" rx="12" fill="#${theme.bg}" stroke="#${theme.border}" stroke-width="1"/>
  <g transform="translate(${LAYOUT.padding}, ${coverY})">${cover.markup}</g>
  <text x="${textX}" y="52" fill="#${theme.text}" font-family="${FONT}" font-size="15" font-weight="700">Last.fm</text>
  <text x="${textX}" y="74" fill="#${theme.muted}" font-family="${FONT}" font-size="12">${escapeXml(truncate(message, maxChars(width, textX)))}</text>
`,
  );
}

export function renderTrackCard(
  track: TrackData,
  coverDataUri: string | null,
  options: CardOptions,
): string {
  const { width, theme, coverStyle, spinMode, spinDuration } = options;
  const idPrefix = "card";
  const spin = shouldSpin(coverStyle, spinMode, track.isNowPlaying);
  const cover = renderCover({
    style: coverStyle,
    coverDataUri,
    theme,
    spin,
    spinDuration,
    idPrefix,
  });

  const coverY = coverOffsetY(cover.size, LAYOUT.cardHeight);
  const textX = LAYOUT.padding + cover.size + LAYOUT.textGap;
  const coverAnchor =
    coverStyle === "square"
      ? `translate(${LAYOUT.padding}, ${coverY})`
      : `translate(${LAYOUT.padding + cover.size / 2}, ${coverY + cover.size / 2})`;

  const backdrop = coverDataUri
    ? `<image href="${coverDataUri}" x="-32" y="-32" width="${width + 64}" height="${LAYOUT.cardHeight + 64}" preserveAspectRatio="xMidYMid slice" filter="url(#cardBackdropBlur)" opacity="0.9"/>`
    : `<rect width="${width}" height="${LAYOUT.cardHeight}" fill="url(#cardFallbackGradient)"/>`;

  const squareCoverBorder =
    coverStyle === "square"
      ? `<rect x="${LAYOUT.padding + 0.5}" y="${coverY + 0.5}" width="${cover.size - 1}" height="${cover.size - 1}" rx="13.5" fill="none" stroke="#ffffff" stroke-opacity="0.32"/>`
      : "";

  const squareSpinAnimation =
    coverStyle === "square" && spin
      ? `<animateTransform attributeName="transform" type="rotate" from="0 ${LAYOUT.padding + cover.size / 2} ${coverY + cover.size / 2}" to="360 ${LAYOUT.padding + cover.size / 2} ${coverY + cover.size / 2}" dur="${spinDuration}s" repeatCount="indefinite"/>`
      : "";

  return wrapSvg(
    width,
    LAYOUT.cardHeight,
    `
  <defs>
    <clipPath id="cardGlassClip">
      <rect width="${width}" height="${LAYOUT.cardHeight}" rx="22"/>
    </clipPath>
    <filter id="cardBackdropBlur" x="-20%" y="-50%" width="140%" height="200%">
      <feGaussianBlur stdDeviation="22"/>
      <feColorMatrix type="saturate" values="1.3"/>
    </filter>
    <filter id="cardCoverShadow" x="-30%" y="-30%" width="160%" height="170%">
      <feDropShadow dx="0" dy="5" stdDeviation="6" flood-color="#000000" flood-opacity="0.32"/>
    </filter>
    <linearGradient id="cardFallbackGradient" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#8b8fa8"/>
      <stop offset="0.5" stop-color="#5f6685"/>
      <stop offset="1" stop-color="#272b3a"/>
    </linearGradient>
    <linearGradient id="cardReadabilityShade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#000000" stop-opacity="0.16"/>
      <stop offset="0.38" stop-color="#000000" stop-opacity="0.32"/>
      <stop offset="1" stop-color="#000000" stop-opacity="0.58"/>
    </linearGradient>
    <linearGradient id="cardTopSheen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.18"/>
      <stop offset="0.45" stop-color="#ffffff" stop-opacity="0.04"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <g clip-path="url(#cardGlassClip)">
    <rect width="${width}" height="${LAYOUT.cardHeight}" fill="#${theme.bg}"/>
    ${backdrop}
    <rect width="${width}" height="${LAYOUT.cardHeight}" fill="url(#cardReadabilityShade)"/>
    <rect width="${width}" height="${LAYOUT.cardHeight}" fill="#ffffff" opacity="0.055"/>
    <rect width="${width}" height="${LAYOUT.cardHeight * 0.62}" fill="url(#cardTopSheen)"/>
  </g>
  <rect x="0.5" y="0.5" width="${width - 1}" height="${LAYOUT.cardHeight - 1}" rx="21.5" fill="none" stroke="#ffffff" stroke-opacity="0.28"/>
  <a href="${escapeXml(track.url)}" target="_blank">
    <g filter="url(#cardCoverShadow)">
      <g>
        ${squareSpinAnimation}
        <g transform="${coverAnchor}">${cover.markup}</g>
        ${squareCoverBorder}
      </g>
    </g>
    <g>${renderInfoPanel(track, options, textX)}</g>
  </a>
  <title>${escapeXml(`${track.artist} — ${track.name}`)}</title>
`,
  );
}

function wrapSvg(width: number, height: number, body: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
${body}
</svg>`;
}
