import { DhanHolding } from "../dhanApi";
import { BrokerInfo } from "./brokerConfig";

type RawHolding = Record<string, unknown>;

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
    rawHolding.totalQty ?? rawHolding.quantity ?? rawHolding.availableQty ?? rawHolding.qty
  );
  const avgPrice = toNumber(
    rawHolding.avgCostPrice ??
      rawHolding.averagePrice ??
      rawHolding.costPrice ??
      rawHolding.buyAvg ??
      rawHolding.avgPrice
  );
  const lastPrice = toNumber(
    rawHolding.ltp ??
      rawHolding.lastTradedPrice ??
      rawHolding.currentPrice ??
      rawHolding.price
  );

  const investedFallback = avgPrice * quantity;
  const currentFallback = (lastPrice || avgPrice) * quantity;

  const invested =
    toNumber(
      rawHolding.totalCost ??
        rawHolding.totalInvestment ??
        rawHolding.investedAmount ??
        rawHolding.buyAmount
    ) || investedFallback;
  const current =
    toNumber(
      rawHolding.currentValue ??
        rawHolding.marketValue ??
        rawHolding.netValue ??
        rawHolding.ltp_value
    ) || currentFallback;

  return {
    symbol: firstString([
      rawHolding.tradingSymbol,
      rawHolding.customSymbol,
      rawHolding.securityId,
      rawHolding.dhanUniqueKey,
      rawHolding.isin,
      rawHolding.instrumentToken,
    ]),
    name: firstString([
      rawHolding.companyName,
      rawHolding.tradingSymbol,
      rawHolding.securityId,
      rawHolding.name,
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

    // Try common data field names
    if (Array.isArray(typedPayload.data)) {
      return typedPayload.data as RawHolding[];
    }

    if (Array.isArray(typedPayload.holdings)) {
      return typedPayload.holdings as RawHolding[];
    }

    if (Array.isArray(typedPayload.items)) {
      return typedPayload.items as RawHolding[];
    }

    if (Array.isArray(typedPayload.result)) {
      return typedPayload.result as RawHolding[];
    }

    if (Array.isArray(typedPayload.body)) {
      return typedPayload.body as RawHolding[];
    }
  }

  return [];
}

async function requestBroker(
  brokerInfo: BrokerInfo,
  apiKey: string
): Promise<unknown> {
  const url = `${brokerInfo.baseUrl}${brokerInfo.holdingsEndpoint}`;
  
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  // Add auth header based on broker
  if (brokerInfo.authHeader === "access-token") {
    headers[brokerInfo.authHeader] = apiKey;
  } else {
    // For Authorization header, add Bearer prefix if needed
    const authValue = apiKey.startsWith("Bearer ") ? apiKey : `Bearer ${apiKey}`;
    headers[brokerInfo.authHeader] = authValue;
  }

  const response = await fetch(url, {
    method: "GET",
    headers,
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
    let message = `${brokerInfo.displayName} API request failed (${response.status})`;

    if (parsedBody && typeof parsedBody === "object") {
      const typedBody = parsedBody as Record<string, unknown>;
      const errorMessage =
        typedBody.message ??
        typedBody.errorMessage ??
        typedBody.error ??
        typedBody.detail;
      if (typeof errorMessage === "string" && errorMessage.trim().length > 0) {
        message = errorMessage;
      }
    }

    throw new Error(message);
  }

  return parsedBody;
}

export async function fetchBrokerHoldings(
  brokerInfo: BrokerInfo,
  apiKey: string
): Promise<DhanHolding[]> {
  const parsedBody = await requestBroker(brokerInfo, apiKey);
  const rawHoldings = normalizeHoldingsResponse(parsedBody);
  return rawHoldings.map(parseHolding);
}
