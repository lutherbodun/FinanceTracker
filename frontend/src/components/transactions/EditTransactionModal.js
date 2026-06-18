import React, { useEffect, useMemo, useState } from 'react';

function toDateInputValue(date) {
  if (!date) return new Date().toISOString().slice(0, 10);
  return new Date(date).toISOString().slice(0, 10);
}

function validate(form) {
  const amount = Number(form.amount);

  if (!Number.isFinite(amount) || amount < 0) return 'Amount must be a valid positive number.';
  if (!form.category.trim()) return 'Category is required.';
  if (!form.description.trim()) return 'Description is required.';
  if (!form.date || Number.isNaN(new Date(form.date).getTime())) return 'Date must be valid.';
  return '';
}

function EditTransactionModal({ transaction, categories, saving, onClose, onSave }) {
  const [form, setForm] = useState({
    amount: '',
    category: '',
    description: '',
    date: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!transaction) return;

    setForm({
      amount: String(transaction.amount ?? ''),
      category: transaction.category || '',
      description: transaction.description || '',
      date: toDateInputValue(transaction.date),
    });
    setError('');
  }, [transaction]);

  const canSubmit = useMemo(() => !saving && !validate(form), [form, saving]);

  if (!transaction) return null;

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (error) setError('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    // Client-side validation keeps bad data out of the API and gives immediate feedback.
    const validationMessage = validate(form);
    if (validationMessage) {
      setError(validationMessage);
      return;
    }

    onSave({
      amount: Number(form.amount),
      category: form.category.trim(),
      description: form.description.trim(),
      date: form.date,
    });
  };

  return (
    <div className="modalBackdrop" role="presentation" onMouseDown={onClose}>
      <section className="appModal" role="dialog" aria-modal="true" aria-labelledby="edit-transaction-title" onMouseDown={(event) => event.stopPropagation()}>
        <div className="sectionHeader">
          <h2 id="edit-transaction-title">Edit Transaction</h2>
          <button type="button" className="iconButton" onClick={onClose} aria-label="Close edit transaction dialog">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form className="modalForm" onSubmit={handleSubmit}>
          {error ? <div className="formError" role="alert">{error}</div> : null}

          <label>
            Amount
            <input type="number" min="0" step="0.01" value={form.amount} onChange={(event) => updateField('amount', event.target.value)} required />
          </label>

          <label>
            Category
            <select value={form.category} onChange={(event) => updateField('category', event.target.value)} required>
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select>
          </label>

          <label>
            Description
            <input value={form.description} onChange={(event) => updateField('description', event.target.value)} required />
          </label>

          <label>
            Date
            <input type="date" value={form.date} onChange={(event) => updateField('date', event.target.value)} required />
          </label>

          <div className="modalActions">
            <button type="button" className="secondaryButton" onClick={onClose}>Cancel</button>
            <button type="submit" className="sendButton" disabled={!canSubmit}>{saving ? 'Saving...' : 'Save Changes'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default EditTransactionModal;
