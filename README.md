# RCO Metrics Dashboard

Simple dashboard with tabs that switch between three views:
- **Shipping Leaderboard** - Daily shipping performance
- **Orders Overview** - Monthly order statistics  
- **Fulfillment KPIs** - Fill rate and order processing metrics

## 📁 File Structure

```
RCO-Metrics/
├── index.html                 # Main page with navigation
├── styles/
│   ├── main.css              # Global styles (navigation, layout)
│   ├── shipping.css          # Shipping dashboard styles
│   ├── orders.css           # Orders dashboard styles
│   └── fulfillment.css      # Fulfillment dashboard styles
├── scripts/
│   ├── main.js              # Dashboard switching logic
│   ├── shipping.js          # Shipping dashboard logic
│   ├── orders.js           # Orders dashboard logic
│   └── fulfillment.js      # Fulfillment dashboard logic
├── dashboards/
│   ├── shipping.html        # Shipping HTML (body content only)
│   ├── orders.html         # Orders HTML (body content only)
│   └── fulfillment.html    # Fulfillment HTML (body content only)
└── assets/
    └── data.js             # For fulfillment dashboard
```

## 🔒 Security

**Current:** No authentication - anyone with link can view  
**Future:** Add Firebase auth when ready (won't break anything!)

## 📊 Data Sources

| Dashboard | Source | Config Location |
|-----------|--------|----------------|
| Shipping | Google Sheets | `dashboards/shipping.html` line 70 |
| Orders | Google Sheets | `dashboards/orders.html` line 550 |
| Fulfillment | Static file | `js/data.js` (update manually) |
