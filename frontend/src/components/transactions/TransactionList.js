import React from 'react';

function TransactionList({
  transactions,
  compact = false,
  formatCurrency,
  formatDate,
  onView,
  onEdit,
  onDelete,
}) {
  return (
    <div className="dataTable">
      <table>
        <thead>
          <tr>
            <th>Name/Business</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Date</th>
            <th>Invoice ID</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((item, index) => {
            const isSample = String(item._id || '').startsWith('sample-');

            return (
              <tr key={item._id || index}>
                <td data-label="Name/Business">
                  <div className="entity">
                    <span>{(item.description || item.category || 'T').slice(0, 1)}</span>
                    <div>
                      <strong>{item.description || 'Transaction'}</strong>
                      <small>{item.category || 'General'}</small>
                    </div>
                  </div>
                </td>
                <td data-label="Type">{item.category || item.type}</td>
                <td data-label="Amount" className="moneyCell">{item.type === 'expense' ? '- ' : '+ '}{formatCurrency(Number(item.amount || 0))}</td>
                <td data-label="Date">{formatDate(item.date)}<small>at 8:00 PM</small></td>
                <td data-label="Invoice ID">{compact ? 'MGL0124877' : `OMG${String(index + 124240).padStart(6, '0')}`}</td>
                <td data-label="Action">
                  <div className="rowActions transactionActions">
                    <button className="smallButton" type="button" onClick={() => onView?.(item)}>View</button>
                    <button className="miniTextButton" type="button" onClick={() => onEdit?.(item)} disabled={isSample}>Edit</button>
                    <button className="miniTextButton danger" type="button" onClick={() => onDelete?.(item)} disabled={isSample}>Delete</button>
                  </div>
                </td>
              </tr>
            );
          })}
          {!transactions.length ? <tr><td colSpan="6">No transactions found.</td></tr> : null}
        </tbody>
      </table>
    </div>
  );
}

export default TransactionList;
