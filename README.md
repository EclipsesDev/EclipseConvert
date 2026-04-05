# EclipseConvert

A Chrome & Firefox extension that lets you highlight any currency amount on a webpage and instantly convert it to your preferred currency. No copy-pasting into Google, no need of switching tabs.

## How it works

1. Highlight a currency value on any page (e.g. `€250`, `£99.99`, `1500 JPY`)
2. A small button pops up right below your selection
3. Click it, the converted amount shows up instantly

That's it. No popups to fill out & no extra steps.

## Supported formats

You can highlight currencies in pretty much any format you'd see online:

| Format | Examples |
|---|---|
| Symbol before amount | `€50`, `£1,000.50`, `¥10000`, `₹500` |
| Symbol after amount | `50€`, `1000¥` |
| Currency code | `100 EUR`, `GBP 200`, `50JPY`, `CAD 75` |

It supports 60+ currencies including common ones like EUR, GBP, JPY, INR, and crypto like BTC and ETH.

## Settings

Click the extension icon in your toolbar to pick which currency you want everything converted **to**. It defaults to USD, but you can change it to any of the 30+ options in the dropdown. Your choice is saved and syncs across devices if you're signed into your browser.

## Manual Installation

### From source

```
git clone https://github.com/YourUsername/EclipseConvert.git
cd EclipseConvert
npm install
npm run build
```

### Chrome
1. Go to `chrome://extensions`
2. Turn on **Developer mode** (top right)
3. Click **Load unpacked** and select the `dist` folder

### Firefox
1. Go to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Navigate into the `dist` folder and select `manifest.json`

Or to install from a zip:
```
npm run package
```
This creates `eclipseconvert.zip` in the project root. Load it via **Load Temporary Add-on** in Firefox, or submit it to [AMO](https://addons.mozilla.org).

### Updating

After pulling new changes, run `npm run build` again and reload the extension in your browser.

## How the conversion works

Rates come from [fawazahmed0/exchange-api](https://github.com/fawazahmed0/exchange-api), free API with 200+ currencies and no rate limits. Rates are fetched live and cached for 1 hour so it doesn't spam the API on every selection. If the primary CDN is down, it automatically falls back to a Cloudflare mirror.

## Privacy

EclipseConvert doesn't collect, store, or transmit any user data. Currency lookups go directly to the exchange rate API — nothing passes through any intermediary server.

## License

MIT