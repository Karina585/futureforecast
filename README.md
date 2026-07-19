# FutureForecast

A personal financial modelling tool for Australian salary, income tax, and
mortgage offset forecasting. Everything runs client-side in the browser — no
data is sent anywhere.

## Features

- **Salary & income tax**: enter your gross salary and get AU resident income
  tax, Medicare levy, optional Medicare levy surcharge, optional HELP/HECS
  repayment, and take-home pay by year/month/fortnight/week. Covers tax years
  2024-25 through 2027-28 (including the legislated 16% → 15% → 14% cuts to
  the second tax bracket).
- **Mortgage & offset account**: enter loan amount, interest rate, monthly
  repayment, start date, and today's offset account balance.
- **Extra repayments & redraws**: schedule one-off or recurring (weekly,
  fortnightly, monthly, yearly) extra repayments into the offset account, or
  redraws out of it.
- **Forecast graph**: month-by-month projection of loan balance, offset
  balance, and net debt, plus the forecast payoff date and how much time and
  interest your extra repayments save versus doing nothing extra.

## Tax and mortgage assumptions

Tax bracket rates are legislated in advance so they're reliable years ahead;
the Medicare levy low-income thresholds and HELP repayment thresholds are
indexed annually by the ATO and only the most recently published figures are
used, so treat those two as approximate for future years. The mortgage
simulation assumes a constant interest rate and repayment amount — real rates
and repayments change over time, so treat the forecast as a planning tool,
not a guarantee.

## Development

```bash
npm install
npm run dev      # start the dev server
npm test         # run unit tests (vitest)
npm run build    # type-check and build for production
```
