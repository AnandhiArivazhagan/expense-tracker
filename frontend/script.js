/* ===============================
   BACKEND API URL
=================================*/
const API_URL = "https://expense-tracker-backend-o2vo.onrender.com/expenses";

/* ===============================
   GLOBAL DATA
=================================*/
let expenses = [];
let income = localStorage.getItem("income") || 0;

/* ===============================
   FETCH ALL EXPENSES
=================================*/
async function fetchExpenses() {
  try {
    const res = await fetch(API_URL);
    expenses = await res.json();
    renderDashboard();
    renderCharts();
  } catch (err) {
    console.error("Error fetching expenses:", err);
  }
}

/* ===============================
   ADD EXPENSE
=================================*/
async function addExpense() {
  const item = document.getElementById("item").value.trim();
  const price = parseFloat(document.getElementById("price").value);
  const date = document.getElementById("date").value;
  const location = document.getElementById("location").value.trim();
  const paymentMode = document.getElementById("paymentMode").value;
  const category = document.getElementById("category").value;

  if (!item || !price || !date || !category) {
    alert("Item, Price, Date & Category are required!");
    return;
  }

  const expenseData = { item, price, date, location, paymentMode, category };

  try {
    await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(expenseData)
    });

    alert("Expense Added Successfully 💸");
    window.location.href = "index.html";
  } catch (err) {
    console.error("Error adding expense:", err);
  }
}

/* ===============================
   DELETE EXPENSE
=================================*/
async function deleteExpense(id) {
  try {
    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    fetchExpenses();
  } catch (err) {
    console.error("Delete error:", err);
  }
}

/* ===============================
   EDIT EXPENSE
=================================*/
async function editExpense(id) {
  const exp = expenses.find(e => e._id === id);

  const newItem = prompt("Edit Item", exp.item);
  const newPrice = prompt("Edit Price", exp.price);

  if (!newItem || !newPrice) return;

  try {
    await fetch(`${API_URL}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...exp,
        item: newItem,
        price: parseFloat(newPrice)
      })
    });

    fetchExpenses();
  } catch (err) {
    console.error("Edit error:", err);
  }
}

/* ===============================
   CATEGORY COLORS
=================================*/
function getCategoryColor(category) {
  const colors = {
    Food: "#ff7043",
    Travel: "#42a5f5",
    Shopping: "#ab47bc",
    Electricity: "#ffd54f",
    Entertainment: "#26c6da",
    Health: "#66bb6a",
    Other: "#ef5350"
  };
  return colors[category] || "#999";
}

/* ===============================
   DASHBOARD RENDER
=================================*/
function renderDashboard() {
  const list = document.getElementById("expenseList");
  if (!list) return;

  list.innerHTML = "";

  let total = 0;
  let onlineTotal = 0;
  let offlineTotal = 0;

  expenses.forEach(exp => {
    total += exp.price;
    if (exp.paymentMode === "Online") onlineTotal += exp.price;
    else offlineTotal += exp.price;

    const li = document.createElement("li");

    li.innerHTML = `
      <span>
        <strong>${exp.item}</strong> - ₹${exp.price}<br>
        <small style="color:${getCategoryColor(exp.category)}; font-weight:600;">
          ${exp.category}
        </small><br>
        <small>${exp.date} | ${exp.paymentMode}</small>
      </span>

      <div class="action-buttons">
        <button class="edit-btn" onclick="editExpense('${exp._id}')">✏</button>
        <button class="delete-btn" onclick="deleteExpense('${exp._id}')">🗑</button>
      </div>
    `;

    list.appendChild(li);
  });

  document.getElementById("totalAmount").innerText = "₹" + total;
  document.getElementById("onlineTotal").innerText = "₹" + onlineTotal;
  document.getElementById("offlineTotal").innerText = "₹" + offlineTotal;

  calculateSavings(total);
}

/* ===============================
   INCOME + SAVINGS
=================================*/
function saveIncome() {
  income = document.getElementById("incomeInput").value;
  localStorage.setItem("income", income);
  renderDashboard();
}

function calculateSavings(total) {
  if (!income) return;

  const savings = income - total;
  const savingsText = document.getElementById("savings");

  savingsText.innerText = "Remaining Savings: ₹" + savings;

  if (savings < 0) {
    savingsText.style.color = "red";
    savingsText.style.animation = "shake 0.5s";
  } else {
    savingsText.style.color = "green";
  }
}

/* ===============================
   SMART INSIGHTS
=================================*/
function generateSmartInsight() {
  const insightBox = document.getElementById("insights");
  if (!insightBox || expenses.length === 0) return;

  const total = expenses.reduce((sum, e) => sum + e.price, 0);

  const categoryTotals = {};
  expenses.forEach(exp => {
    categoryTotals[exp.category] =
      (categoryTotals[exp.category] || 0) + exp.price;
  });

  let highestCategory = "";
  let highestAmount = 0;

  for (let cat in categoryTotals) {
    if (categoryTotals[cat] > highestAmount) {
      highestAmount = categoryTotals[cat];
      highestCategory = cat;
    }
  }

  const percentage = ((highestAmount / total) * 100).toFixed(1);

  insightBox.innerHTML = `
    <h3>Smart Insight 💡</h3>
    <p>You spend <strong>${percentage}%</strong> on 
    <strong style="color:${getCategoryColor(highestCategory)}">
    ${highestCategory}</strong>.</p>
  `;
}

/* ===============================
   ANALYTICS CHARTS
=================================*/
function renderCharts() {
  if (!document.getElementById("barChart")) return;

  const dailyTotals = {};
  expenses.forEach(exp => {
    dailyTotals[exp.date] = (dailyTotals[exp.date] || 0) + exp.price;
  });

  new Chart(document.getElementById("barChart"), {
    type: "bar",
    data: {
      labels: Object.keys(dailyTotals),
      datasets: [{
        label: "Daily Spending",
        data: Object.values(dailyTotals),
        backgroundColor: "#81d4fa"
      }]
    }
  });

  const categoryTotals = {};
  expenses.forEach(exp => {
    categoryTotals[exp.category] =
      (categoryTotals[exp.category] || 0) + exp.price;
  });

  new Chart(document.getElementById("pieChart"), {
    type: "pie",
    data: {
      labels: Object.keys(categoryTotals),
      datasets: [{
        data: Object.values(categoryTotals),
        backgroundColor: Object.keys(categoryTotals).map(cat =>
          getCategoryColor(cat)
        )
      }]
    }
  });

  generateSmartInsight();
}

/* ===============================
   DOWNLOAD CSV
=================================*/
function downloadCSV() {
  if (expenses.length === 0) {
    alert("No expenses to download!");
    return;
  }

  let csv = "Item,Price,Date,Category,Payment Mode,Location\n";

  expenses.forEach(exp => {
    csv += `${exp.item},${exp.price},${exp.date},${exp.category},${exp.paymentMode},${exp.location}\n`;
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "expenses.csv";
  a.click();

  URL.revokeObjectURL(url);
}

/* ===============================
   MONEY RAIN (SMOOTH)
=================================*/
function createMoney() {
  const container = document.querySelector(".money-rain");
  if (!container) return;

  const money = document.createElement("div");
  money.classList.add("money");

  const symbols = ["💸", "💰", "🪙", "₹"];
  money.innerText = symbols[Math.floor(Math.random() * symbols.length)];

  money.style.left = Math.random() * 100 + "vw";
  money.style.animationDuration = 5 + Math.random() * 5 + "s";

  container.appendChild(money);

  setTimeout(() => money.remove(), 10000);
}

setInterval(createMoney, 800);

/* ===============================
   INIT
=================================*/
document.addEventListener("DOMContentLoaded", () => {
  fetchExpenses();
});