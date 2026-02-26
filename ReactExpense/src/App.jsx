import { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import './App.css';

const API_URL = "https://expense-tracker-backend-o2vo.onrender.com/expenses";

function App() {
  // Navigation State
  const [currentPage, setCurrentPage] = useState('dashboard');
  
  // Expense State
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState(localStorage.getItem("income") || 0);
  const [searchInput, setSearchInput] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    item: '',
    price: '',
    date: '',
    location: '',
    category: '',
    paymentMode: 'Online'
  });

  // chart instance refs to persist across renders
  const barChartInstance = useRef(null);
  const pieChartInstance = useRef(null);

  // helper functions that need to be declared before hooks
  function fetchExpenses() {
    return (async () => {
      try {
        const res = await fetch(API_URL);
        const data = await res.json();
        setExpenses(data);
      } catch (err) {
        console.error("Error fetching expenses:", err);
      }
    })();
  }

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

  // Fetch all expenses on mount
  useEffect(() => {
    fetchExpenses();
  }, []);

  // Money rain effect
  useEffect(() => {
    const interval = setInterval(createMoney, 800);
    return () => clearInterval(interval);
  }, []);

  const addExpense = async () => {
    const { item, price, date, location, category, paymentMode } = formData;

    if (!item || !price || !date || !category) {
      alert("Item, Price, Date & Category are required!");
      return;
    }

    const expenseData = { item, price: parseFloat(price), date, location, paymentMode, category };

    try {
      await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(expenseData)
      });

      alert("Expense Added Successfully 💸");
      setFormData({ item: '', price: '', date: '', location: '', category: '', paymentMode: 'Online' });
      await fetchExpenses();
      setCurrentPage('dashboard');
    } catch (err) {
      console.error("Error adding expense:", err);
    }
  };

  const deleteExpense = async (id) => {
    try {
      await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      fetchExpenses();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  const editExpense = async (id) => {
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
  };

  const getCategoryColor = (category) => {
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
  };

  const saveIncome = () => {
    localStorage.setItem("income", income);
  };

  const calculateSavings = (total) => {
    if (!income) return null;
    return income - total;
  };

  const downloadCSV = () => {
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
  };



  const generateSmartInsight = () => {
    if (expenses.length === 0) return null;

    const total = expenses.reduce((sum, e) => sum + e.price, 0);
    const categoryTotals = {};

    expenses.forEach(exp => {
      categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.price;
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

    return { percentage, highestCategory, highestAmount };
  };

  // effect handles chart creation when on analytics page
  useEffect(() => {
    if (currentPage !== 'analytics') return;

    const dailyTotals = {};
    expenses.forEach(exp => {
      dailyTotals[exp.date] = (dailyTotals[exp.date] || 0) + exp.price;
    });

    // Bar Chart
    setTimeout(() => {
      const barCtx = document.getElementById("barChart");
      if (barCtx && barCtx.getContext) {
        if (barChartInstance.current) barChartInstance.current.destroy();
        barChartInstance.current = new Chart(barCtx, {
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
      }
    }, 100);

    // Pie Chart
    setTimeout(() => {
      const categoryTotals = {};
      expenses.forEach(exp => {
        categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.price;
      });

      const pieCtx = document.getElementById("pieChart");
      if (pieCtx && pieCtx.getContext) {
        if (pieChartInstance.current) pieChartInstance.current.destroy();
        pieChartInstance.current = new Chart(pieCtx, {
          type: "pie",
          data: {
            labels: Object.keys(categoryTotals),
            datasets: [{
              data: Object.values(categoryTotals),
              backgroundColor: Object.keys(categoryTotals).map(cat => getCategoryColor(cat))
            }]
          }
        });
      }
    }, 150);
  }, [currentPage, expenses]);

  const filteredExpenses = expenses.filter(exp =>
    exp.item.toLowerCase().includes(searchInput.toLowerCase()) ||
    exp.category.toLowerCase().includes(searchInput.toLowerCase())
  );

  const total = expenses.reduce((sum, e) => sum + e.price, 0);
  const onlineTotal = expenses.filter(e => e.paymentMode === "Online").reduce((sum, e) => sum + e.price, 0);
  const offlineTotal = expenses.filter(e => e.paymentMode === "Offline").reduce((sum, e) => sum + e.price, 0);
  const savings = calculateSavings(total);
  const insight = generateSmartInsight();


  return (
    <>
      <div className="money-rain"></div>
      <header className="main-header">
        <h1>💰 Smart Expense Tracker</h1>
        <p>Track Smart. Spend Smart. Save Smart.</p>
      </header>
      <nav className="navbar">
        <button
          className={currentPage === 'dashboard' ? 'active' : ''}
          onClick={() => setCurrentPage('dashboard')}
        >
          Dashboard
        </button>
        <button
          className={currentPage === 'add' ? 'active' : ''}
          onClick={() => setCurrentPage('add')}
        >
          Add Expense
        </button>
        <button
          className={currentPage === 'analytics' ? 'active' : ''}
          onClick={() => setCurrentPage('analytics')}
        >
          Analytics
        </button>
      </nav>

      {currentPage === 'dashboard' && (
        <div className="container">
          <div className="glass-card">
            <h2>Total Expenses</h2>
            <h1 id="totalAmount">₹{total}</h1>
          </div>

          <div className="glass-card">
            <h3>Online Paid</h3>
            <p id="onlineTotal">₹{onlineTotal}</p>
            <h3>Offline Paid</h3>
            <p id="offlineTotal">₹{offlineTotal}</p>
          </div>

          <div className="glass-card">
            <h3>Monthly Income</h3>
            <input
              type="number"
              placeholder="Enter monthly income"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
            />
            <button onClick={saveIncome}>Save Income</button>
            {savings !== null && (
              <p id="savings" style={{ color: savings < 0 ? "red" : "green" }}>
                Remaining Savings: ₹{savings}
              </p>
            )}
          </div>

          <div className="glass-card">
            <h3>Search Expense</h3>
            <input
              type="text"
              placeholder="Search..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          <div className="glass-card">
            <h3>Expenses List</h3>
            <ul id="expenseList">
              {filteredExpenses.map(exp => (
                <li key={exp._id}>
                  <span>
                    <strong>{exp.item}</strong> - ₹{exp.price}<br />
                    <small style={{ color: getCategoryColor(exp.category), fontWeight: 600 }}>
                      {exp.category}
                    </small><br />
                    <small>{exp.date} | {exp.paymentMode}</small>
                  </span>
                  <div className="action-buttons">
                    <button className="edit-btn" onClick={() => editExpense(exp._id)}>✏</button>
                    <button className="delete-btn" onClick={() => deleteExpense(exp._id)}>🗑</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <button onClick={downloadCSV}>⬇ Download CSV</button>
          </div>

          <div className="quote">
            "Track your money before it tracks you."
          </div>
        </div>
      )}

      {currentPage === 'add' && (
        <div className="container">
          <div className="glass-card">
            <input
              type="text"
              id="item"
              placeholder="What did you purchase?"
              value={formData.item}
              onChange={(e) => setFormData({ ...formData, item: e.target.value })}
              required
            />
            <input
              type="number"
              id="price"
              placeholder="Price"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
            <input
              type="date"
              id="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
            <input
              type="text"
              id="location"
              placeholder="Purchase location (optional)"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />

            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            >
              <option value="">Select Category</option>
              <option value="Food">🍔 Food</option>
              <option value="Travel">✈ Travel</option>
              <option value="Shopping">🛍 Shopping</option>
              <option value="Electricity">💡 Bill</option>
              <option value="Entertainment">🎬 Entertainment</option>
              <option value="Health">🏥 Health</option>
              <option value="Other">💰 Other</option>
            </select>

            <select
              id="paymentMode"
              value={formData.paymentMode}
              onChange={(e) => setFormData({ ...formData, paymentMode: e.target.value })}
            >
              <option value="Online">Online</option>
              <option value="Offline">Offline</option>
            </select>

            <button onClick={addExpense}>Add Expense</button>
          </div>
        </div>
      )}

      {currentPage === 'analytics' && (
        <div className="container">
          <div className="glass-card">
            <canvas id="barChart"></canvas>
          </div>

          <div className="glass-card">
            <canvas id="pieChart"></canvas>
          </div>

          {insight && (
            <div className="glass-card" id="insights">
              <h3>Smart Insight 💡</h3>
              <p>You spend <strong>{insight.percentage}%</strong> on 
              <strong style={{ color: getCategoryColor(insight.highestCategory), marginLeft: '5px' }}>
                {insight.highestCategory}
              </strong>.</p>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export default App;
