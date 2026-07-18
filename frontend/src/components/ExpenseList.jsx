import React, { useState } from 'react';

const CATEGORIES = ['All', 'Food', 'Travel', 'Utilities', 'Shopping', 'Entertainment', 'Others'];

export default function ExpenseList({ expenses, onDelete }) {
  const [filterCategory, setFilterCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');

  // Filter expenses
  const filteredExpenses = expenses.filter(exp => {
    const matchesCategory = filterCategory === 'All' || exp.category === filterCategory;
    const matchesSearch = 
      exp.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (exp.notes && exp.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Sort expenses
  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    if (sortBy === 'date-desc') return new Date(b.date) - new Date(a.date);
    if (sortBy === 'date-asc') return new Date(a.date) - new Date(b.date);
    if (sortBy === 'amount-desc') return b.amount - a.amount;
    if (sortBy === 'amount-asc') return a.amount - b.amount;
    return 0;
  });

  const getCategoryBadgeClass = (category) => {
    const cat = category ? category.toLowerCase() : 'others';
    return `badge badge-${cat}`;
  };

  return (
    <div className="glass-card" style={{ marginTop: '30px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        flexWrap: 'wrap',
        gap: '15px',
        marginBottom: '20px'
      }}>
        <h3>Expense History</h3>
        
        {/* Sort selector */}
        <select 
          className="form-control" 
          style={{ width: '180px', padding: '8px 12px' }}
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="date-desc">Newest First</option>
          <option value="date-asc">Oldest First</option>
          <option value="amount-desc">Highest Amount</option>
          <option value="amount-asc">Lowest Amount</option>
        </select>
      </div>

      {/* Filters Toolbar */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '2fr 1fr', 
        gap: '15px',
        marginBottom: '20px'
      }}>
        <input 
          type="text" 
          className="form-control" 
          placeholder="Search expenses by merchant or notes..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select 
          className="form-control"
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
        >
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat === 'All' ? 'All Categories' : cat}</option>
          ))}
        </select>
      </div>

      {/* Table grid */}
      <div className="expense-table-container">
        {sortedExpenses.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '40px 0' }}>
            No expenses found matching the criteria.
          </p>
        ) : (
          <table className="expense-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Merchant</th>
                <th>Category</th>
                <th>Notes</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
                <th style={{ width: '50px' }}></th>
              </tr>
            </thead>
            <tbody>
              {sortedExpenses.map(exp => (
                <tr key={exp.id}>
                  <td style={{ color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {exp.date}
                  </td>
                  <td style={{ fontWeight: '600', display: 'flex', alignItems: 'center' }}>
                    {exp.title}
                    {exp.scanned && (
                      <span className="scanned-indicator" title="Scanned via AI OCR">
                        ⚡
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={getCategoryBadgeClass(exp.category)}>
                      {exp.category}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                    {exp.notes || '—'}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 'bold', fontFamily: 'var(--font-title)' }}>
                    ${exp.amount.toFixed(2)}
                  </td>
                  <td className="action-cell">
                    <button 
                      className="btn btn-danger btn-icon" 
                      style={{ padding: '6px 10px', fontSize: '12px' }}
                      onClick={() => onDelete(exp.id)}
                      title="Delete expense"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
