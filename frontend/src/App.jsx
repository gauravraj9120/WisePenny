import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import ReceiptScanner from './components/ReceiptScanner';
import ExpenseForm from './components/ExpenseForm';
import ExpenseList from './components/ExpenseList';
import BudgetSettings from './components/BudgetSettings';

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [budgetInfo, setBudgetInfo] = useState({
    config: { monthlyLimit: 1000, alertThreshold: 0.8, alertEmail: 'user@example.com' },
    currentMonth: new Date().toISOString().substring(0, 7),
    currentSpending: 0,
    sentAlerts: []
  });
  const [scannedPrefill, setScannedPrefill] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  useEffect(() => {
    async function initData() {
      try {
        await Promise.all([fetchExpenses(), fetchBudgetInfo()]);
      } catch (err) {
        console.error('Failed to load application data:', err);
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, []);

  const fetchExpenses = async () => {
    const res = await fetch('/api/expenses');
    if (res.ok) {
      const data = await res.json();
      setExpenses(data);
    }
  };

  const fetchBudgetInfo = async () => {
    const res = await fetch('/api/budget');
    if (res.ok) {
      const data = await res.json();
      setBudgetInfo(data);
    }
  };

  const handleAddExpense = async (expense) => {
    try {
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expense)
      });
      if (res.ok) {
        // Re-sync state
        await fetchExpenses();
        await fetchBudgetInfo();
      }
    } catch (error) {
      console.error('Error adding expense:', error);
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        // Re-sync state
        await fetchExpenses();
        await fetchBudgetInfo();
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const handleScanComplete = (scannedData) => {
    setScannedPrefill(scannedData);
  };

  const handleClearPrefill = () => {
    setScannedPrefill(null);
  };

  const handleBudgetConfigUpdate = (newConfig) => {
    setBudgetInfo(prev => ({
      ...prev,
      config: newConfig
    }));
    // Re-trigger spending calculation in dashboard
    fetchBudgetInfo();
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        justifyContent: 'center',
        alignItems: 'center',
        fontFamily: 'var(--font-title)',
        gap: '20px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '3px solid rgba(99, 102, 241, 0.2)',
          borderTopColor: 'var(--primary)',
          borderRadius: '50%',
          animation: 'pulse 1.5s infinite ease-in-out'
        }} />
        <h2 style={{ letterSpacing: '0.05em' }}>Loading WisePenny...</h2>
      </div>
    );
  }

  return (
    <div>
      {/* Premium Header */}
      <header className="app-header">
        <div className="header-container">
          <div className="logo">
            <span>🪙</span> WisePenny
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
            AI-Powered Budget Management
          </div>
        </div>
      </header>

      {/* Main Body Grid Layout */}
      <main className="app-container">
        {/* Left Side: History & Receipt Upload */}
        <section>
          <ReceiptScanner onScanComplete={handleScanComplete} />
          
          <ExpenseList 
            expenses={expenses} 
            onDelete={handleDeleteExpense} 
          />
        </section>

        {/* Right Side: Stats Panel & Manual Forms */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <Dashboard 
            budgetInfo={budgetInfo} 
            expenses={expenses}
          />
          
          <ExpenseForm 
            onSubmit={handleAddExpense}
            initialData={scannedPrefill}
            onClearInitial={handleClearPrefill}
          />

          <BudgetSettings 
            budgetConfig={budgetInfo.config}
            onUpdate={handleBudgetConfigUpdate}
          />
        </aside>
      </main>
    </div>
  );
}
