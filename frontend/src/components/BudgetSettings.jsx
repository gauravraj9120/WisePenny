import React, { useState, useEffect } from 'react';

export default function BudgetSettings({ budgetConfig, onUpdate }) {
  const [monthlyLimit, setMonthlyLimit] = useState('1000');
  const [alertThreshold, setAlertThreshold] = useState('0.8');
  const [alertEmail, setAlertEmail] = useState('user@example.com');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  // Load current configuration
  useEffect(() => {
    if (budgetConfig) {
      setMonthlyLimit(budgetConfig.monthlyLimit || '1000');
      setAlertThreshold(budgetConfig.alertThreshold || '0.8');
      setAlertEmail(budgetConfig.alertEmail || 'user@example.com');
    }
  }, [budgetConfig]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    try {
      const response = await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monthlyLimit: parseFloat(monthlyLimit),
          alertThreshold: parseFloat(alertThreshold),
          alertEmail
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update budget settings');
      }

      const updated = await response.json();
      onUpdate(updated);
      setMsg({ type: 'success', text: 'Settings updated successfully!' });
    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass-card">
      <h3 style={{ marginBottom: '16px' }}>Budget Settings</h3>
      
      <form onSubmit={handleSave}>
        <div className="form-group">
          <label>Monthly Budget Limit ($)</label>
          <input 
            type="number" 
            className="form-control" 
            value={monthlyLimit}
            onChange={(e) => setMonthlyLimit(e.target.value)}
            required
            min="1"
          />
        </div>

        <div className="form-group">
          <label>Warning Alert Threshold</label>
          <select 
            className="form-control"
            value={alertThreshold}
            onChange={(e) => setAlertThreshold(e.target.value)}
          >
            <option value="0.5">50% of Limit</option>
            <option value="0.6">60% of Limit</option>
            <option value="0.7">70% of Limit</option>
            <option value="0.8">80% of Limit (Recommended)</option>
            <option value="0.9">90% of Limit</option>
            <option value="1.0">100% of Limit</option>
          </select>
        </div>

        <div className="form-group">
          <label>Alert Notification Email</label>
          <input 
            type="email" 
            className="form-control" 
            value={alertEmail}
            onChange={(e) => setAlertEmail(e.target.value)}
            required
            placeholder="alerts@domain.com"
          />
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
            Nodemailer will trigger warning emails to this inbox.
          </span>
        </div>

        {msg && (
          <div style={{ 
            padding: '10px', 
            borderRadius: '6px', 
            fontSize: '13px', 
            marginBottom: '15px',
            backgroundColor: msg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: `1px solid ${msg.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
            color: msg.type === 'success' ? '#34d399' : '#f87171'
          }}>
            {msg.text}
          </div>
        )}

        <button 
          type="submit" 
          className="btn btn-secondary" 
          style={{ width: '100%', justifyContent: 'center' }}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
