import React from 'react';

function DeleteConfirmationDialog({ transaction, saving, onCancel, onConfirm }) {
  if (!transaction) return null;

  return (
    <div className="modalBackdrop" role="presentation" onMouseDown={onCancel}>
      <section className="appModal compactModal" role="dialog" aria-modal="true" aria-labelledby="delete-transaction-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="sectionHeader">
          <h2 id="delete-transaction-title">Delete Transaction</h2>
          <button type="button" className="iconButton" onClick={onCancel} aria-label="Close delete transaction dialog">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="modalStack">
          <p>Are you sure you want to delete <strong>{transaction.description || 'this transaction'}</strong>? This action cannot be undone.</p>
        </div>

        <div className="modalActions">
          <button type="button" className="secondaryButton" onClick={onCancel}>Cancel</button>
          <button type="button" className="dangerButton" onClick={onConfirm} disabled={saving}>{saving ? 'Deleting...' : 'Delete'}</button>
        </div>
      </section>
    </div>
  );
}

export default DeleteConfirmationDialog;
