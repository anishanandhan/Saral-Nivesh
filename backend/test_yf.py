import yfinance as yf
ticker = yf.Ticker("BAJFINANCE.NS")
print(ticker.info.get('currentPrice', 'None!'))
