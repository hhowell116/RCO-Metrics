diff --git a/fulfillment.js b/fulfillment.js
index c0272aeefbd3f69551dd67b92c75a3f52557bd01..24c161230607926b22d19b053974922cfc880ee8 100644
--- a/fulfillment.js
+++ b/fulfillment.js
@@ -23,50 +23,55 @@ function getMostRecentDataMonth() {
 const recentData = getMostRecentDataMonth();
 let currentMonth = recentData.month;
 let currentYear = recentData.year;
 let currentView = 'monthly';
 let fillRateChart, ordersChart;
 
 function parseDate(dateStr) {
     const parts = dateStr.split('/');
     return new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
 }
 
 function getMonthData(year, month) {
     return fullData.filter(d => {
         const date = parseDate(d.date);
         return date.getFullYear() === year && date.getMonth() === month && d.orders > 0;
     });
 }
 
 function getYearData(year) {
     return fullData.filter(d => {
         const date = parseDate(d.date);
         return date.getFullYear() === year;
     });
 }
 
+function setDashboardView(view) {
+    document.body.classList.remove('view-monthly', 'view-calendar');
+    document.body.classList.add(`view-${view}`);
+}
+
 function updateDashboard() {
     if (currentView === 'calendar') {
         renderCalendarView();
         const yearData = getYearData(currentYear);
         const validData = yearData.filter(d => d.orders > 0);
         
         if (validData.length === 0) {
             document.getElementById('fillRate4Day').textContent = 'N/A';
             document.getElementById('fillRate7Day').textContent = 'N/A';
             document.getElementById('totalOrders').textContent = '0';
             document.getElementById('avgOrders').textContent = '0';
             return;
         }
         
         const avg4Day = validData.reduce((sum, d) => sum + d.rate4, 0) / validData.length;
         const avg7Day = validData.reduce((sum, d) => sum + d.rate7, 0) / validData.length;
         const totalOrders = validData.reduce((sum, d) => sum + d.orders, 0);
         
         document.getElementById('fillRate4Day').textContent = avg4Day.toFixed(0) + '%';
         document.getElementById('fillRate7Day').textContent = avg7Day.toFixed(0) + '%';
         document.getElementById('totalOrders').textContent = totalOrders.toLocaleString();
         document.getElementById('avgOrders').textContent = Math.round(totalOrders / validData.length).toLocaleString();
         document.getElementById('periodLabel').textContent = 'year';
     } else {
         const monthData = getMonthData(currentYear, currentMonth);
@@ -429,58 +434,49 @@ function updateTable(monthData) {
         
         tr.innerHTML = `
             <td>${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</td>
             <td>${row.orders.toLocaleString()}</td>
             <td>${row.rem4.toLocaleString()}</td>
             <td>${row.rem7.toLocaleString()}</td>
             <td class="${getRateClass(row.rate4)}">${row.rate4.toFixed(2)}%</td>
             <td class="${getRateClass(row.rate7)}">${row.rate7.toFixed(2)}%</td>
         `;
         
         tbody.appendChild(tr);
     });
 }
 
 // Event listeners
 document.querySelectorAll('[data-view]').forEach(btn => {
     if (btn.tagName === 'BUTTON') {
         btn.addEventListener('click', () => {
             document.querySelectorAll('[data-view]').forEach(b => {
                 if (b.tagName === 'BUTTON') b.classList.remove('active');
             });
             btn.classList.add('active');
             
             currentView = btn.dataset.view;
             
-            const monthlyView = document.querySelector('.monthly-view');
-            const calendarView = document.querySelector('.calendar-view');
-            
-            monthlyView.classList.remove('active');
-            calendarView.classList.remove('active');
-            
-            if (currentView === 'monthly') {
-                monthlyView.classList.add('active');
-            } else {
-                calendarView.classList.add('active');
-            }
+            setDashboardView(currentView);
             
             document.getElementById('monthSelect').disabled = currentView === 'calendar';
             
             updateDashboard();
         });
     }
 });
 
 document.getElementById('yearSelect').addEventListener('change', e => {
     currentYear = parseInt(e.target.value);
     updateDashboard();
 });
 
 document.getElementById('monthSelect').addEventListener('change', e => {
     currentMonth = parseInt(e.target.value);
     updateDashboard();
 });
 
 // Initialize with most recent data month
 document.getElementById('monthSelect').value = currentMonth.toString();
 document.getElementById('yearSelect').value = currentYear.toString();
+setDashboardView(currentView);
 updateDashboard();
