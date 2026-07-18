import React, { useState, useEffect } from 'react';

const FRONTEND_CATEGORIES = ['Food', 'Travel', 'Utilities', 'Shopping', 'Entertainment', 'Others'];

export default function ExpenseForm({ onSubmit, initialData, onClearInitial }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [category, setCategory] = useState('Others');
  const [notes, setNotes] = useState('');
  const [isScanned, setIsScanned] = useState(false);

  // Prefill form when scanned data becomes available
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setAmount(initialData.amount || '');
      setDate(initialData.date || new Date().toISOString().split('T')[0]);
      setCategory(initialData.category || 'Others');
      setNotes(initialData.notes || '');
      setIsScanned(initialData.scanned || false);
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !amount) return;

    onSubmit({
      title,
      amount: parseFloat(amount),
      date: date || new Date().toISOString().split('T')[0],
      category,
      notes,
      scanned: isScanned
    });

    // Reset Form
    setTitle('');
    setAmount('');
    setDate('');
    setCategory('Others');
    setNotes('');
    setIsScanned(false);
    
    if (onClearInitial) {
      onClearInitial();
    }
  };

  const handleReset = () => {
    setTitle('');
    setAmount('');
    setDate('');
    setCategory('Others');
    setNotes('');
    setIsScanned(false);
    if (onClearInitial) {
      onClearInitial();
    }
  };

  return (
    <div className="glass-card">
      <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {isScanned ? '📝 Review Scanned Expense' : '➕ Add Expense'}
        {isScanned && (
          <span style={{ 
            fontSize: '11px', 
            backgroundColor: 'var(--accent)', 
            color: 'black', 
            padding: '2px 8px', 
            borderRadius: '12px',
            fontWeight: 'bold'
          }}>
            AI OCR Prefilled
          </span>
        )}
      </h3>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Merchant / Title</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="e.g. Starbucks" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
          <div className="form-group">
            <label>Amount ($)</label>
            <input 
              type="number" 
              step="0.01"
              className="form-control" 
              placeholder="0.00" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Date</label>
            <input 
              type="date" 
              className="form-control" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label>Category</label>
          <select 
            className="form-control" 
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {FRONTEND_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Notes</label>
          <input 
            type="text" 
            className="form-control" 
            placeholder="e.g. Morning team coffee" 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '25px' }}>
          <button type="submit" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
            {isScanned ? 'Approve & Save' : 'Save Expense'}
          </button>
          
          {(title || amount || isScanned) && (
            <button type="button" className="btn btn-secondary" onClick={handleReset}>
              Clear
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
