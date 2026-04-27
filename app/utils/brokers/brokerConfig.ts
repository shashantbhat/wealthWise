// Broker configuration and metadata
export interface BrokerInfo {
  id: string;
  name: string;
  displayName: string;
  baseUrl: string;
  authHeader: string;
  holdingsEndpoint: string;
  logo?: string;
}

export const SUPPORTED_BROKERS: Record<string, BrokerInfo> = {
  dhan: {
    id: "dhan",
    name: "Dhan",
    displayName: "Dhan",
    baseUrl: "https://api.dhan.co/v2",
    authHeader: "access-token",
    holdingsEndpoint: "/holdings",
  },
  zerodha: {
    id: "zerodha",
    name: "Zerodha",
    displayName: "Zerodha (Kite)",
    baseUrl: "https://api.kite.trade",
    authHeader: "Authorization",
    holdingsEndpoint: "/portfolio/holdings",
  },
  groww: {
    id: "groww",
    name: "Groww",
    displayName: "Groww",
    baseUrl: "https://api.groww.in",
    authHeader: "Authorization",
    holdingsEndpoint: "/api/v1/portfolio/holdings",
  },
  angelbroking: {
    id: "angelbroking",
    name: "Angel Broking",
    displayName: "Angel Broking",
    baseUrl: "https://api.angelbroking.com",
    authHeader: "Authorization",
    holdingsEndpoint: "/api/v1/holdings",
  },
  upstox: {
    id: "upstox",
    name: "Upstox",
    displayName: "Upstox",
    baseUrl: "https://api.upstox.com",
    authHeader: "Authorization",
    holdingsEndpoint: "/v2/portfolio/long-term-holdings",
  },
};

export const BROKER_LIST = Object.values(SUPPORTED_BROKERS);
