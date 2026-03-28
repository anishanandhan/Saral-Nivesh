const fetch = require('node-fetch');

async function testFetch() {
    console.log("Fetching technical...");
    try {
        const res = await fetch("http://localhost:8000/api/stocks/RELIANCE/technical");
        console.log("OK?", res.ok);
        const json = await res.json();
        console.log("JSON:", json);
    } catch(e) {
        console.error("Tech error:", e);
    }
    
    console.log("\nFetching OHLCV...");
    try {
        const ohlcvRes = await fetch("http://localhost:8000/api/stocks/RELIANCE/ohlcv?period=3mo");
        console.log("OHLCV OK?", ohlcvRes.ok);
        const data = await ohlcvRes.json();
        console.log("OHLCV data items:", data.data?.length);
    } catch(e) {
        console.error("OHLCV error:", e);
    }
}
testFetch();
