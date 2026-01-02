import { DividendEvent, GroundingSource } from "../types";

// Yahoo Finance Quote Summary Endpoint
// We use the proxy configured in vite.config.ts to avoid CORS
const BASE_URL = "/api/yahoo/v10/finance/quoteSummary";

// Yahoo Finance Chart Endpoint (usually more open than quoteSummary)
const CHART_URL = "/api/yahoo/v8/finance/chart";

interface YahooChartResponse {
    chart: {
        result: Array<{
            meta: {
                currency: string;
                symbol: string;
                currentTradingPeriod: { regular: { price: number; } };
            };
            events?: {
                dividends?: Record<string, { amount: number; date: number }>;
            };
        }> | null;
        error?: any;
    };
}

const fetchTickerData = async (ticker: string): Promise<DividendEvent | null> => {
    try {
        // We request 1 year of data to catch the last dividend
        const response = await fetch(`${CHART_URL}/${ticker}?interval=1d&range=1y&events=div`);

        if (!response.ok) {
            // Fallback or retry logic could go here
            console.warn(`Yahoo Chart API failed for ${ticker}: ${response.status}`);
            return null;
        }

        const data: YahooChartResponse = await response.json();
        const result = data.chart.result?.[0];

        if (!result) return null;

        const dividends = result.events?.dividends;
        const meta = result.meta;

        if (!dividends) return null;

        const divList = Object.values(dividends).sort((a, b) => a.date - b.date); // Sort ascending (oldest to newest)
        const nowSec = Math.floor(Date.now() / 1000);

        // Find the next upcoming dividend
        let targetDiv = divList.find(d => d.date >= nowSec);
        let status: 'Confirmed' | 'Estimated' = 'Confirmed';

        // If no future dividend found, estimate based on the last one
        if (!targetDiv) {
            const lastDiv = divList[divList.length - 1];
            if (!lastDiv) return null;

            // Estimate next date: Add 3 months (quarterly assumption)
            const lastDate = new Date(lastDiv.date * 1000);
            const nextDate = new Date(lastDate);
            nextDate.setMonth(nextDate.getMonth() + 3);

            targetDiv = {
                date: Math.floor(nextDate.getTime() / 1000),
                amount: lastDiv.amount
            };
            status = 'Estimated';
        }

        const exDateObj = new Date(targetDiv.date * 1000);

        // Estimate Pay Date (typically 2-4 weeks after Ex Date)
        const payDateObj = new Date(exDateObj);
        payDateObj.setDate(payDateObj.getDate() + 14);

        return {
            symbol: meta.symbol,
            exDate: exDateObj.toISOString().split('T')[0],
            payDate: payDateObj.toISOString().split('T')[0], // Estimate pay date to ensure UI renders it
            amount: targetDiv.amount,
            currency: meta.currency,
            status: status,
            frequency: "Quarterly"
        };

    } catch (error) {
        console.error(`Error fetching ${ticker}`, error);
        return null;
    }
};

export const fetchDividendData = async (tickers: string[]): Promise<{ events: DividendEvent[], sources: GroundingSource[] }> => {
    // Fetch all tickers in parallel
    const promises = tickers.map(t => fetchTickerData(t));
    const results = await Promise.all(promises);

    // Filter out nulls
    const events = results.filter((e): e is DividendEvent => e !== null);

    const sources: GroundingSource[] = [{
        title: "Yahoo Finance",
        uri: "https://finance.yahoo.com"
    }];

    return { events, sources };
};
