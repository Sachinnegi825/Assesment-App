import React from 'react';

export default function ViolationModal({ violation, onConfirm, limit }) {
  if (!violation) return null;

  return (
    <div className="consent-modal-backdrop" style={{ zIndex: 9999 }}>
      <section className="consent-modal violation-warning">
        <p className="info-card__label" style={{ color: 'var(--error-color)' }}>Security Alert</p>
        <h2 style={{ color: 'var(--error-color)' }}>Violation Detected</h2>
        <p><strong>{violation.message}</strong></p>
        <div className="violation-stats">
          <p>This incident has been logged. Violation <strong>{violation.count} of {limit}</strong>.</p>
          <progress value={violation.count} max={limit} className="violation-progress"></progress>
        </div>
        <p className="small-note">Multiple violations will result in automatic disqualification and exam termination.</p>
        <div className="consent-modal__actions">
          <button className="primary-button" onClick={onConfirm}>
            I understand, return to exam
          </button>
        </div>
      </section>
    </div>
  );
}