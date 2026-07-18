import React from 'react';

export default function Dashboard({ budgetInfo, expenses }) {
  const { config, currentSpending, currentMonth, sentAlerts } = budgetInfo;
  const limit = config?.monthlyLimit || 1000;
  const threshold = config?.alertThreshold || 0.8;
  const spending = currentSpending || 0;

  const percentage = Math.min((spending / limit) * 100, 100);
  const thresholdPercentage = threshold * 100;
  const remaining = Math.max(limit - spending, 0);

  // Determine progress color
  let progressState = 'normal';
  if (spending >= limit) {
    progressState = 'danger';
  } else if (spending >= limit * threshold) {
    progressState = 'warning';
  }

  // Count categories
  const categorySummary = expenses.reduce((acc, exp) => {
    // Only count current month expenses for budget summary
    if (exp.date && exp.date.startsWith(currentMonth)) {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
    }
    return acc;
  }, {});

  return (
    <div>
      <div className="dashboard-stats">
        {/* Total Spent Stat Card */}
        <div className="glass-card stat-card">
          <div>
            <div className="stat-label">Spent This Month</div>
            <div className={`stat-value ${progressState === 'danger' ? 'danger' : ''}`}>
              ${spending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="stat-footer">
            Active Month: {currentMonth}
          </div>
        </div>

        {/* Remaining Budget Stat Card */}
        <div className="glass-card stat-card accent-card">
          <div>
            <div className="stat-label">Remaining Budget</div>
            <div className="stat-value">
              ${remaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="stat-footer">
            Limit: ${limit.toLocaleString('en-US')}
          </div>
        </div>

        {/* Budget Status Stat Card */}
        <div className="glass-card stat-card">
          <div>
            <div className="stat-label">Budget Threshold</div>
            <div className="stat-value" style={{ fontSize: '26px' }}>
              {(threshold * 100).toFixed(0)}% Trigger
            </div>
          </div>
          <div className="stat-footer" style={{ color: 'var(--warning)' }}>
            Alerts send at: ${(limit * threshold).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Budget Progress Bar Card */}
      <div className="glass-card" style={{ marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '10px' }}>Monthly Budget Utilization</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          You have utilized <strong>{((spending / limit) * 100).toFixed(1)}%</strong> of your monthly limit.
        </p>

        <div className="budget-progress-container">
          <div className="progress-bar-bg">
            <div 
              className={`progress-bar-fill ${progressState}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }}>
            <span>$0</span>
            <span style={{ color: 'var(--warning)', fontWeight: 'bold' }}>
              Threshold: ${(limit * threshold).toFixed(0)} ({thresholdPercentage}%)
            </span>
            <span>Limit: ${limit}</span>
          </div>
        </div>
      </div>

      {/* Dynamic Email Alerts Box */}
      {sentAlerts && sentAlerts.length > 0 && (
        <div className="glass-card" style={{ marginBottom: '30px' }}>
          <h3 style={{ color: 'var(--warning)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            ⚠️ Sent Email Alerts ({sentAlerts.length})
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '15px' }}>
            Budget thresholds were breached. Open the preview links below to view the actual HTML emails sent to <strong>{config?.alertEmail}</strong>.
          </p>
          <div className="alerts-list">
            {sentAlerts.map((alert, index) => (
              <div className="alert-item" key={alert.id || index}>
                <div>
                  <strong>{alert.month} Limit Breach</strong>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Triggered at ${alert.totalAtTrigger?.toFixed(2)} on {new Date(alert.timestamp).toLocaleString()}
                  </div>
                </div>
                {alert.previewUrl ? (
                  <a href={alert.previewUrl} target="_blank" rel="noopener noreferrer" className="alert-link">
                    Open Mail Preview ↗
                  </a>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>SMTP Alert Logged</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Spend breakdown */}
      <div className="glass-card">
        <h3 style={{ marginBottom: '16px' }}>Category Breakdown (Current Month)</h3>
        {Object.keys(categorySummary).length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '20px 0' }}>
            No expenses recorded for this month.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Object.entries(categorySummary).map(([cat, amt]) => {
              const catPercentage = Math.min((amt / (spending || 1)) * 100, 100);
              return (
                <div key={cat} style={{ fontSize: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ textTransform: 'capitalize', fontWeight: '500' }}>
                      {cat}
                    </span>
                    <strong>${amt.toFixed(2)}</strong>
                  </div>
                  <div className="progress-bar-bg" style={{ height: '4px', margin: 0 }}>
                    <div 
                      className="progress-bar-fill normal" 
                      style={{ 
                        width: `${catPercentage}%`, 
                        background: `var(--primary)` 
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
