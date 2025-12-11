let currentMonth = 0;
let currentYear = 2025;
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
        
        if (monthData.length === 0) {
            document.getElementById('fillRate4Day').textContent = 'N/A';
            document.getElementById('fillRate7Day').textContent = 'N/A';
            document.getElementById('totalOrders').textContent = '0';
            document.getElementById('avgOrders').textContent = '0';
            
            if (fillRateChart) fillRateChart.destroy();
            if (ordersChart) ordersChart.destroy();
            
            document.getElementById('dataTable').innerHTML = 'No data available for this month';
            
            document.getElementById('periodLabel').textContent = 'month';
            return;
        }
        
        const avg4Day = monthData.reduce((sum, d) => sum + d.rate4, 0) / monthData.length;
        const avg7Day = monthData.reduce((sum, d) => sum + d.rate7, 0) / monthData.length;
        const totalOrders = monthData.reduce((sum, d) => sum + d.orders, 0);
        
        document.getElementById('fillRate4Day').textContent = avg4Day.toFixed(0) + '%';
        document.getElementById('fillRate7Day').textContent = avg7Day.toFixed(0) + '%';
        document.getElementById('totalOrders').textContent = totalOrders.toLocaleString();
        document.getElementById('avgOrders').textContent = Math.round(totalOrders / monthData.length).toLocaleString();
        document.getElementById('periodLabel').textContent = 'month';
        
        updateCharts(monthData);
        updateTable(monthData);
    }
}

function renderCalendarView() {
    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';
    
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                  'July', 'August', 'September', 'October', 'November', 'December'];
    
    for (let m = 0; m < 12; m++) {
        const monthDiv = document.createElement('div');
        monthDiv.className = 'month-calendar';
        
        const header = document.createElement('div');
        header.className = 'month-header';
        header.textContent = months[m];
        monthDiv.appendChild(header);
        
        const daysContainer = document.createElement('div');
        daysContainer.className = 'calendar-days';
        
        ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(day => {
            const label = document.createElement('div');
            label.className = 'day-label';
            label.textContent = day;
            daysContainer.appendChild(label);
        });
        
        const firstDay = new Date(currentYear, m, 1).getDay();
        const daysInMonth = new Date(currentYear, m + 1, 0).getDate();
        
        for (let i = 0; i < firstDay; i++) {
            const empty = document.createElement('div');
            empty.className = 'calendar-day empty';
            daysContainer.appendChild(empty);
        }
        
        for (let d = 1; d <= daysInMonth; d++) {
            const dayData = fullData.find(item => {
                const date = parseDate(item.date);
                return date.getFullYear() === currentYear && 
                       date.getMonth() === m && 
                       date.getDate() === d;
            });
            
            const dayDiv = document.createElement('div');
            dayDiv.className = 'calendar-day';
            
            if (dayData && dayData.orders > 0) {
                const rate = dayData.rate7;
                let rateClass = 'cal-rate-none';
                
                if (rate >= 95) rateClass = 'cal-rate-excellent';
                else if (rate >= 85) rateClass = 'cal-rate-good';
                else if (rate >= 70) rateClass = 'cal-rate-warning';
                else if (rate > 0) rateClass = 'cal-rate-poor';
                
                dayDiv.classList.add(rateClass);
                dayDiv.innerHTML = `
                    ${d}
                    ${rate.toFixed(0)}%
                `;
                
                dayDiv.addEventListener('mouseenter', (e) => showTooltip(e, dayData));
                dayDiv.addEventListener('mouseleave', hideTooltip);
                dayDiv.addEventListener('mousemove', moveTooltip);
            } else {
                dayDiv.classList.add('cal-rate-none');
                dayDiv.innerHTML = `${d}`;
            }
            
            daysContainer.appendChild(dayDiv);
        }
        
        monthDiv.appendChild(daysContainer);
        grid.appendChild(monthDiv);
    }
}

function showTooltip(e, data) {
    const tooltip = document.getElementById('tooltip');
    const date = parseDate(data.date);
    
    tooltip.innerHTML = `
        ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        Orders: ${data.orders.toLocaleString()}
        4-Day Rate: ${data.rate4.toFixed(2)}%
        7-Day Rate: ${data.rate7.toFixed(2)}%
        Remaining (4d): ${data.rem4}
        Remaining (7d): ${data.rem7}
    `;
    
    tooltip.classList.add('show');
    moveTooltip(e);
}

function hideTooltip() {
    document.getElementById('tooltip').classList.remove('show');
}

function moveTooltip(e) {
    const tooltip = document.getElementById('tooltip');
    tooltip.style.left = (e.clientX + 15) + 'px';
    tooltip.style.top = (e.clientY + 15) + 'px';
}

function updateCharts(monthData) {
    const labels = monthData.map(d => parseDate(d.date).getDate());
    
    if (fillRateChart) fillRateChart.destroy();
    
    const ctx1 = document.getElementById('fillRateChart').getContext('2d');
    
    fillRateChart = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: '4 Day Fill Rate',
                    data: monthData.map(d => d.rate4),
                    backgroundColor: '#d2b48c',
                    borderWidth: 0,
                    borderRadius: 4,
                    barPercentage: 0.4,
                    categoryPercentage: 0.8
                },
                {
                    label: '7 Day Fill Rate',
                    data: monthData.map(d => d.rate7),
                    backgroundColor: '#8b7355',
                    borderWidth: 0,
                    borderRadius: 4,
                    barPercentage: 0.4,
                    categoryPercentage: 0.8
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    display: true,
                    labels: { 
                        color: '#8b7355', 
                        font: { size: 11 }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: { 
                        callback: v => v + '%',
                        color: '#a0906f'
                    }
                },
                x: {
                    ticks: { color: '#a0906f' }
                }
            }
        }
    });
    
    if (ordersChart) ordersChart.destroy();
    
    const ctx2 = document.getElementById('ordersChart').getContext('2d');
    ordersChart = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Orders Remaining (4 Day)',
                data: monthData.map(d => d.rem4),
                borderColor: '#d2b48c',
                backgroundColor: 'rgba(210, 180, 140, 0.1)',
                tension: 0.3,
                fill: true
            }, {
                label: 'Orders Remaining (7 Day)',
                data: monthData.map(d => d.rem7),
                borderColor: '#8b7355',
                backgroundColor: 'rgba(139, 115, 85, 0.1)',
                tension: 0.3,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    display: true,
                    labels: { color: '#8b7355' }
                }
            },
            scales: {
                y: { beginAtZero: true, ticks: { color: '#a0906f' } },
                x: { ticks: { color: '#a0906f' } }
            }
        }
    });
}

function updateTable(monthData) {
    const tbody = document.getElementById('dataTable');
    tbody.innerHTML = '';
    
    const getRateClass = rate => {
        if (rate >= 95) return 'rate-good';
        if (rate >= 85) return 'rate-warning';
        return 'rate-poor';
    };
    
    monthData.forEach(row => {
        const tr = document.createElement('tr');
        const date = parseDate(row.date);
        
        tr.innerHTML = `
            ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            ${row.orders.toLocaleString()}
            ${row.rem4.toLocaleString()}
            ${row.rem7.toLocaleString()}
            ${row.rate4.toFixed(2)}%
            ${row.rate7.toFixed(2)}%
        `;
        
        tbody.appendChild(tr);
    });
}

// Event listeners
document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        currentView = btn.dataset.view;
        
        document.querySelector('.monthly-view').classList.toggle('active', currentView === 'monthly');
        document.querySelector('.calendar-view').classList.toggle('active', currentView === 'calendar');
        document.getElementById('monthSelect').disabled = currentView === 'calendar';
        
        updateDashboard();
    });
});

document.getElementById('yearSelect').addEventListener('change', e => {
    currentYear = parseInt(e.target.value);
    updateDashboard();
});

document.getElementById('monthSelect').addEventListener('change', e => {
    currentMonth = parseInt(e.target.value);
    updateDashboard();
});

// Initialize
updateDashboard();

