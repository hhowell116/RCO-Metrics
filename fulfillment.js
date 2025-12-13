document.addEventListener('DOMContentLoaded', () => {

  // DOM references (NOW SAFE)
  const calendarGrid = document.getElementById('calendarGrid');
  const yearSelect = document.getElementById('yearSelect');
  const monthSelect = document.getElementById('monthSelect');

  let currentView = 'monthly';
  let fillRateChart, ordersChart;

  function parseDate(dateStr) {
    const parts = dateStr.split('/');
    return new Date(+parts[2], +parts[0] - 1, +parts[1]);
  }

  function getMostRecentDataMonth() {
    if (!fullData || !fullData.length) {
      const d = new Date();
      return { month: d.getMonth(), year: d.getFullYear() };
    }

    const sorted = [...fullData].sort(
      (a, b) => parseDate(b.date) - parseDate(a.date)
    );
    const mostRecent = parseDate(sorted[0].date);

    return {
      month: mostRecent.getMonth(),
      year: mostRecent.getFullYear()
    };
  }

  const recent = getMostRecentDataMonth();
  let currentMonth = recent.month;
  let currentYear = recent.year;

  function getMonthData(year, month) {
    return fullData.filter(d => {
      const dt = parseDate(d.date);
      return dt.getFullYear() === year &&
             dt.getMonth() === month &&
             d.orders > 0;
    });
  }

  function getYearData(year) {
    return fullData.filter(d => parseDate(d.date).getFullYear() === year);
  }

  function updateDashboard() {
    if (currentView === 'calendar') {
      renderCalendarView();
      return;
    }

    const monthData = getMonthData(currentYear, currentMonth);
    if (!monthData.length) return;

    updateCharts(monthData);
    updateTable(monthData);
  }

  function renderCalendarView() {
    if (!calendarGrid) return;

    calendarGrid.innerHTML = '';

    const months = [
      'January','February','March','April','May','June',
      'July','August','September','October','November','December'
    ];

    for (let m = 0; m < 12; m++) {
      const monthDiv = document.createElement('div');
      monthDiv.className = 'month-calendar';

      const header = document.createElement('div');
      header.className = 'month-header';
      header.textContent = months[m];
      monthDiv.appendChild(header);

      const days = document.createElement('div');
      days.className = 'calendar-days';

      ['S','M','T','W','T','F','S'].forEach(d => {
        const lbl = document.createElement('div');
        lbl.className = 'day-label';
        lbl.textContent = d;
        days.appendChild(lbl);
      });

      const firstDay = new Date(currentYear, m, 1).getDay();
      const daysInMonth = new Date(currentYear, m + 1, 0).getDate();

      for (let i = 0; i < firstDay; i++) {
        days.appendChild(document.createElement('div'));
      }

      for (let d = 1; d <= daysInMonth; d++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-day';

        const dayData = fullData.find(row => {
          const dt = parseDate(row.date);
          return dt.getFullYear() === currentYear &&
                 dt.getMonth() === m &&
                 dt.getDate() === d;
        });

        if (dayData) {
          const rate = dayData.rate7;
          cell.classList.add(
            rate >= 95 ? 'cal-rate-excellent' :
            rate >= 85 ? 'cal-rate-good' :
            rate >= 70 ? 'cal-rate-warning' :
            'cal-rate-poor'
          );
          cell.innerHTML = `<strong>${d}</strong><br>${rate.toFixed(0)}%`;
        } else {
          cell.textContent = d;
          cell.classList.add('cal-rate-none');
        }

        days.appendChild(cell);
      }

      monthDiv.appendChild(days);
      calendarGrid.appendChild(monthDiv);
    }
  }

  function populateYearMonthSelectors() {
    yearSelect.innerHTML = '';
    monthSelect.innerHTML = '';

    const years = [...new Set(fullData.map(d => parseDate(d.date).getFullYear()))];
    years.sort((a,b) => b - a);

    years.forEach(y => {
      const o = document.createElement('option');
      o.value = y;
      o.textContent = y;
      yearSelect.appendChild(o);
    });

    [
      'January','February','March','April','May','June',
      'July','August','September','October','November','December'
    ].forEach((m,i) => {
      const o = document.createElement('option');
      o.value = i;
      o.textContent = m;
      monthSelect.appendChild(o);
    });

    yearSelect.value = currentYear;
    monthSelect.value = currentMonth;
  }

  function updateTable(monthData) {
    const tbody = document.getElementById('dataTable');
    tbody.innerHTML = '';

    monthData.forEach(row => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${parseDate(row.date).toLocaleDateString()}</td>
        <td>${row.orders}</td>
        <td>${row.rem4}</td>
        <td>${row.rem7}</td>
        <td>${row.rate4}%</td>
        <td>${row.rate7}%</td>
      `;
      tbody.appendChild(tr);
    });
  }

  document.querySelectorAll('.view-toggle button').forEach(btn => {
    btn.addEventListener('click', () => {
      currentView = btn.dataset.view;

      document.querySelectorAll('.view-toggle button')
        .forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.monthly-view, .calendar-view')
        .forEach(v => v.classList.remove('active'));

      document.querySelector(`.${currentView}-view`).classList.add('active');

      updateDashboard();
    });
  });

  yearSelect.addEventListener('change', e => {
    currentYear = +e.target.value;
    updateDashboard();
  });

  monthSelect.addEventListener('change', e => {
    currentMonth = +e.target.value;
    updateDashboard();
  });

  populateYearMonthSelectors();
  updateDashboard();
});
