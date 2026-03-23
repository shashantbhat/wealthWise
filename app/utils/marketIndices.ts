export type MarketIndexSnapshot = {
  symbol: "NIFTY 50" | "SENSEX";
  exchangeSymbol: "^NSEI" | "^BSESN";
  value: number;
  change: number;
  changePercent: number;
  points: number[];
  asOf: number;
};

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        previousClose?: number;
      };
      indicators?: {
        quote?: Array<{
          close?: Array<number | null>;
        }>;
      };
    }>;
  };
};

const INDEX_DEFINITIONS = [
  {
    symbol: "NIFTY 50" as const,
    exchangeSymbol: "^NSEI" as const,
  },
  {
    symbol: "SENSEX" as const,
    exchangeSymbol: "^BSESN" as const,
  },
];

function toFiniteNumber(value: unknown): number | null {
  if (typeof value !== "number") return null;
  return Number.isFinite(value) ? value : null;
}

async function fetchSingleIndex(
  symbol: "NIFTY 50" | "SENSEX",
  exchangeSymbol: "^NSEI" | "^BSESN",
): Promise<MarketIndexSnapshot> {
  const encoded = encodeURIComponent(exchangeSymbol);
  const response = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encoded}?range=1d&interval=5m`,
  );

  if (!response.ok) {
    throw new Error(`Unable to fetch ${symbol} (${response.status})`);
  }

  const payload = (await response.json()) as YahooChartResponse;
  const result = payload.chart?.result?.[0];

  if (!result) {
    throw new Error(`No chart data found for ${symbol}`);
  }

  const meta = result.meta ?? {};
  const closeSeries = result.indicators?.quote?.[0]?.close ?? [];
  const points = closeSeries
    .map(toFiniteNumber)
    .filter((point): point is number => point !== null);

  const fallbackPrice = points[points.length - 1] ?? 0;
  const value = toFiniteNumber(meta.regularMarketPrice) ?? fallbackPrice;
  const previousClose = toFiniteNumber(meta.previousClose) ?? value;
  const change = value - previousClose;
  const changePercent = previousClose > 0 ? (change / previousClose) * 100 : 0;

  return {
    symbol,
    exchangeSymbol,
    value,
    change,
    changePercent,
    points: points.slice(-32),
    asOf: Date.now(),
  };
}

export async function fetchIndianIndices(): Promise<MarketIndexSnapshot[]> {
  const snapshots = await Promise.all(
    INDEX_DEFINITIONS.map((entry) =>
      fetchSingleIndex(entry.symbol, entry.exchangeSymbol),
    ),
  );

  return snapshots;
}
