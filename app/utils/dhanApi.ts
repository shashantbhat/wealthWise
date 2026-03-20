const DHAN_BASE_URL = "https://api.dhan.co/v2";

type RawHolding = Record<string, unknown>;

export interface DhanHolding {
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  lastPrice: number;
  invested: number;
  current: number;
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function firstString(values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value;
    }
  }
  return "Unknown";
}

function parseHolding(rawHolding: RawHolding): DhanHolding {
  const quantity = toNumber(
    rawHolding.totalQty ?? rawHolding.quantity ?? rawHolding.availableQty,
  );
  const avgPrice = toNumber(
    rawHolding.avgCostPrice ??
      rawHolding.averagePrice ??
      rawHolding.costPrice ??
      rawHolding.buyAvg,
  );
  const lastPrice = toNumber(
    rawHolding.ltp ?? rawHolding.lastTradedPrice ?? rawHolding.currentPrice,
  );

  const investedFallback = avgPrice * quantity;
  const currentFallback = (lastPrice || avgPrice) * quantity;

  const invested =
    toNumber(
      rawHolding.totalCost ??
        rawHolding.totalInvestment ??
        rawHolding.investedAmount,
    ) || investedFallback;
  const current =
    toNumber(
      rawHolding.currentValue ?? rawHolding.marketValue ?? rawHolding.netValue,
    ) || currentFallback;

  return {
    symbol: firstString([
      rawHolding.tradingSymbol,
      rawHolding.customSymbol,
      rawHolding.securityId,
      rawHolding.dhanUniqueKey,
    ]),
    name: firstString([
      rawHolding.companyName,
      rawHolding.tradingSymbol,
      rawHolding.securityId,
    ]),
    quantity,
    avgPrice,
    lastPrice,
    invested,
    current,
  };
}

function normalizeHoldingsResponse(payload: unknown): RawHolding[] {
  if (Array.isArray(payload)) {
    return payload as RawHolding[];
  }

  if (payload && typeof payload === "object") {
    const typedPayload = payload as Record<string, unknown>;

    if (Array.isArray(typedPayload.data)) {
      return typedPayload.data as RawHolding[];
    }

    if (Array.isArray(typedPayload.holdings)) {
      return typedPayload.holdings as RawHolding[];
    }
  }

  return [];
}

export async function fetchDhanHoldings(
  apiKey: string,
): Promise<DhanHolding[]> {
  const response = await fetch(`${DHAN_BASE_URL}/holdings`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "access-token": apiKey,
    },
  });

  const rawBody = await response.text();

  let parsedBody: unknown = null;
  if (rawBody) {
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      parsedBody = rawBody;
    }
  }

  if (!response.ok) {
    let message = `Dhan API request failed (${response.status})`;

    if (parsedBody && typeof parsedBody === "object") {
      const typedBody = parsedBody as Record<string, unknown>;
      const errorMessage = typedBody.message ?? typedBody.errorMessage;
      if (typeof errorMessage === "string" && errorMessage.trim().length > 0) {
        message = errorMessage;
      }
    }

    throw new Error(message);
  }

  const rawHoldings = normalizeHoldingsResponse(parsedBody);
  return rawHoldings.map(parseHolding);
}
