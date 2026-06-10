// ─── State ───────────────────────────────────────────
let expenses = [];
let chartInstance = null;

// ─── LocalStorage ─────────────────────────────────────
function saveToStorage() {
  localStorage.setItem('expenses', JSON.stringify(expenses));
}

function loadFromStorage() {
  const data = localStorage.getItem('expenses');
  expenses = data ? JSON.parse(data) : [];
}

// ─── Default date ────────────────────────────────────
document.getElementById('date').valueAsDate = new Date();

// ─── Add Button ──────────────────────────────────────
document.getElementById('add-btn').addEventListener('click', () => {
  const title    = document.getElementById('title').value.trim();
  const amount   = document.getElementById('amount').value.trim();
  const category = document.getElementById('category').value;
  const date     = document.getElementById('date').value;
  const notes    = document.getElementById('notes').value.trim();
  const errorMsg = document.getElementById('error-msg');

  if (!title || !amount || !category || !date) {
    errorMsg.textContent = 'Please fill all required fields.';
    errorMsg.classList.remove('hidden');
    return;
  }
  if (Number(amount) <= 0) {
    errorMsg.textContent = 'Amount must be greater than 0.';
    errorMsg.classList.remove('hidden');
    return;
  }

  errorMsg.classList.add('hidden');

  const expense = {
    id: Date.now(),
    title,
    amount: Number(amount),
    category,
    date,
    notes
  };

  expenses.push(expense);
  saveToStorage();
  render();
  clearForm();
});

// ─── Delete ──────────────────────────────────────────
function deleteExpense(id) {
  expenses = expenses.filter(exp => exp.id !== id);
  saveToStorage();
  render();
}

// ─── Edit ────────────────────────────────────────────
function editExpense(id) {
  const exp = expenses.find(e => e.id === id);
  if (!exp) return;

  document.getElementById('title').value    = exp.title;
  document.getElementById('amount').value   = exp.amount;
  document.getElementById('category').value = exp.category;
  document.getElementById('date').value     = exp.date;
  document.getElementById('notes').value    = exp.notes;

  expenses = expenses.filter(e => e.id !== id);
  saveToStorage();
  render();

  document.getElementById('add-btn').textContent = 'Update Expense';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ─── Clear Form ──────────────────────────────────────
function clearForm() {
  document.getElementById('title').value      = '';
  document.getElementById('amount').value     = '';
  document.getElementById('category').value   = '';
  document.getElementById('date').valueAsDate = new Date();
  document.getElementById('notes').value      = '';
  document.getElementById('add-btn').textContent = '+ Add Expense';
}

// ─── Master render — list + summary + chart ───────────
function render() {
  renderList();
  updateSummary();
  updateChart();
}

// ─── Render List ─────────────────────────────────────
function renderList() {
    const tbody  = document.getElementById('expense-tbody');
  const sorted = getFiltered().sort((a, b) => new Date(b.date) - new Date(a.date));
  if (sorted.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center text-gray-400 py-6 text-sm">
          No expenses yet. Add one above!
        </td>
      </tr>`;
    return;
  }

  tbody.innerHTML = sorted.map(exp => `
    <tr class="border-t border-gray-100 hover:bg-gray-50">
      <td class="px-4 py-3 text-sm">${exp.title}</td>
      <td class="px-4 py-3 text-sm font-medium text-indigo-600">PKR ${exp.amount.toLocaleString()}</td>
      <td class="px-4 py-3 text-sm">
        <span class="bg-indigo-50 text-indigo-600 text-xs px-2 py-1 rounded-full">${exp.category}</span>
      </td>
      <td class="px-4 py-3 text-sm text-gray-500">${exp.date}</td>
      <td class="px-4 py-3 text-sm text-gray-400">${exp.notes || '—'}</td>
      <td class="px-4 py-3 text-sm">
        <button onclick="editExpense(${exp.id})"
          class="text-blue-500 hover:text-blue-700 mr-3 text-xs font-medium">Edit</button>
        <button onclick="deleteExpense(${exp.id})"
          class="text-red-500 hover:text-red-700 text-xs font-medium">Delete</button>
      </td>
    </tr>
  `).join('');
}

// ─── Update Summary Cards ─────────────────────────────
function updateSummary() {
  const total = expenses.reduce((sum, e) => sum + e.amount, 0);
  document.getElementById('total-amount').textContent = 'PKR ' + total.toLocaleString();
  document.getElementById('total-count').textContent  = expenses.length;

  if (expenses.length === 0) {
    document.getElementById('top-category').textContent = '—';
    return;
  }

  const catTotals = {};
  expenses.forEach(e => {
    catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
  });
  const top = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0][0];
  document.getElementById('top-category').textContent = top;
}

// ─── Update Chart ─────────────────────────────────────
function updateChart() {
  if (chartInstance) {
    chartInstance.destroy();
    chartInstance = null;
  }

  if (getFiltered().length === 0) return;

  const catTotals = {};
  getFiltered().forEach(e => {
    catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
  });

  const labels = Object.keys(catTotals);
  const data   = Object.values(catTotals);
  const colors = [
    '#6366f1', '#10b981', '#f59e0b',
    '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'
  ];

  const ctx = document.getElementById('expense-chart').getContext('2d');
  chartInstance = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: colors.slice(0, labels.length),
        borderWidth: 2,
        borderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom' } }
    }
  });
}

// ─── App Init ─────────────────────────────────────────
loadFromStorage();
render();

// ─── Get Filtered Expenses ────────────────────────────
function getFiltered() {
  const cat  = document.getElementById('filter-category').value;
  const date = document.getElementById('filter-date').value;

  return expenses.filter(e => {
    const matchCat  = cat  ? e.category === cat  : true;
    const matchDate = date ? e.date === date      : true;
    return matchCat && matchDate;
  });
}

function clearFilters() {
  document.getElementById('filter-category').value = '';
  document.getElementById('filter-date').value     = '';
  render();
}

// Filter change hone par auto-render
document.getElementById('filter-category').addEventListener('change', render);
document.getElementById('filter-date').addEventListener('change', render);