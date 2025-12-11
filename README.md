# RCO Metrics Dashboard

Simple dashboard with tabs that switch between three views:
- **Shipping Leaderboard** - Daily shipping performance
- **Orders Overview** - Monthly order statistics  
- **Fulfillment KPIs** - Fill rate and order processing metrics

## 📁 File Structure

```
RCO-Metrics/
├── index.html                 # Main page with tab navigation
├── dashboards/
│   ├── shipping.html         # Pulls from Google Sheets
│   ├── orders.html           # Pulls from Google Sheets
│   └── fulfillment.html      # Uses js/data.js
└── js/
    ├── data.js               # Static fulfillment data
    └── fulfillment.js        # Fulfillment dashboard logic
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
