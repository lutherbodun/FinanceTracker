import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { deleteTransaction, updateTransaction } from '../services/transactions';
import DeleteConfirmationDialog from '../components/transactions/DeleteConfirmationDialog';
import EditTransactionModal from '../components/transactions/EditTransactionModal';
import TransactionList from '../components/transactions/TransactionList';
import './Dashboard.css';

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

const navItems = [
  { view: 'dashboard', label: 'Dashboard', icon: 'home' },
  { view: 'transactions', label: 'Transactions', icon: 'monitoring' },
  { view: 'invoices', label: 'Invoices', icon: 'receipt' },
  { view: 'wallets', label: 'My Wallets', icon: 'account_balance_wallet' },
  { view: 'settings', label: 'Settings', icon: 'settings' },
];

const categories = ['Mobile', 'Entertainment', 'Software', 'Technology', 'Payment', 'Withdraw', 'Food', 'Other'];

const emptyTransaction = {
  type: 'expense',
  amount: '',
  category: 'Payment',
  description: '',
  date: new Date().toISOString().slice(0, 10),
};

const emptyInvoice = {
  clientName: '',
  clientEmail: '',
  amount: '',
  ordersType: '01',
  status: 'pending',
};

function Dashboard() {
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('dashboard');
  const [transactions, setTransactions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [wallet, setWallet] = useState(null);
  const [profile, setProfile] = useState(null);
  const [transactionForm, setTransactionForm] = useState(emptyTransaction);
  const [invoiceForm, setInvoiceForm] = useState(emptyInvoice);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [deletingTransaction, setDeletingTransaction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [transactionActionLoading, setTransactionActionLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [modal, setModal] = useState(null);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [transactionQuery, setTransactionQuery] = useState('');
  const [invoiceQuery, setInvoiceQuery] = useState('');
  const [paymentQuery, setPaymentQuery] = useState('');
  const [settingsEditable, setSettingsEditable] = useState(false);

  const loadData = useCallback(async () => {
    if (!localStorage.getItem('token')) {
      navigate('/');
      return;
    }

    setLoading(true);
    setNotice('');

    try {
      const [meRes, txRes, invoiceRes, walletRes] = await Promise.all([
        api.get('/api/users/me'),
        api.get('/api/transactions'),
        api.get('/api/invoices'),
        api.get('/api/wallets'),
      ]);

      setProfile(meRes.data);
      setTransactions(Array.isArray(txRes.data) ? txRes.data : []);
      setInvoices(Array.isArray(invoiceRes.data) ? invoiceRes.data : []);
      setWallet(walletRes.data);
    } catch (err) {
      if (err?.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/');
        return;
      }
      setNotice(err?.response?.data?.message || 'Could not load your workspace.');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const summary = useMemo(() => {
    const income = transactions
      .filter((item) => item.type === 'income')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const spending = transactions
      .filter((item) => item.type === 'expense')
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
    const balance = income - spending;
    const saved = Math.max(balance, 0);
    return { income, spending, saved, balance };
  }, [transactions]);

  const displayTransactions = transactions;
  const displayInvoices = invoices.length ? invoices : [];
  const displayName = profile?.name || profile?.email || 'Omega User';
  const filteredTransactions = filterItems(displayTransactions, transactionQuery, ['description', 'category', 'type']);
  const filteredInvoices = filterItems(displayInvoices, invoiceQuery, ['clientName', 'clientEmail', 'invoiceId', 'status', 'ordersType']);
  const filteredPayments = filterItems(transactions, paymentQuery, ['description', 'category', 'type']);

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const openModal = (title, content) => {
    setModal({ title, content });
    setProfileMenuOpen(false);
  };

  const openHelp = () => openModal('Help', (
    <div className="modalStack">
      <p>Use the sidebar to move between your dashboard, transactions, invoices, wallet, and settings.</p>
      <p>Search fields filter tables instantly, and row action buttons open the selected record.</p>
    </div>
  ));

  const openNotifications = () => openModal('Notifications', (
    <div className="modalStack">
      <p>{displayInvoices.filter((invoice) => invoice.status === 'pending').length} invoices are pending.</p>
      <p>{transactions.length} transactions are currently in your workspace.</p>
    </div>
  ));

  const openSearch = () => openModal('Search', (
    <div className="modalStack">
      <button type="button" onClick={() => { setActiveView('transactions'); setModal(null); }}>Search transactions</button>
      <button type="button" onClick={() => { setActiveView('invoices'); setModal(null); }}>Search invoices</button>
      <button type="button" onClick={() => { setActiveView('wallets'); setModal(null); }}>Search payments</button>
    </div>
  ));

  const viewTransaction = (item) => openModal('Transaction Details', (
    <div className="detailList">
      <span>Name</span><strong>{item.description || 'Transaction'}</strong>
      <span>Type</span><strong>{item.category || item.type}</strong>
      <span>Amount</span><strong>{item.type === 'expense' ? '- ' : '+ '}{currency.format(Number(item.amount || 0))}</strong>
      <span>Date</span><strong>{formatDate(item.date)}</strong>
    </div>
  ));

  const startEditTransaction = (item) => {
    if (String(item?._id || '').startsWith('sample-')) {
      setNotice('Create a real transaction before editing sample rows.');
      return;
    }
    setNotice('');
    setEditingTransaction(item);
  };

  const startDeleteTransaction = (item) => {
    if (String(item?._id || '').startsWith('sample-')) {
      setNotice('Create a real transaction before deleting sample rows.');
      return;
    }
    setNotice('');
    setDeletingTransaction(item);
  };

  const saveTransactionEdit = async (payload) => {
    if (!editingTransaction?._id) return;

    const id = editingTransaction._id;
    const previousTransactions = transactions;
    const optimisticTransaction = {
      ...editingTransaction,
      ...payload,
      date: new Date(payload.date).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Optimistically paint the edited values so the table feels instant.
    setTransactionActionLoading(true);
    setNotice('');
    setTransactions((current) => current.map((item) => (item._id === id ? optimisticTransaction : item)));

    try {
      const res = await updateTransaction(id, payload);
      setTransactions((current) => current.map((item) => (item._id === id ? res.data : item)));
      setEditingTransaction(null);
      setNotice('Transaction updated.');
    } catch (err) {
      setTransactions(previousTransactions);
      setNotice(err?.response?.data?.message || 'Could not update transaction.');
    } finally {
      setTransactionActionLoading(false);
    }
  };

  const confirmDeleteTransaction = async () => {
    if (!deletingTransaction?._id) return;

    const id = deletingTransaction._id;
    const previousTransactions = transactions;

    // Optimistic delete keeps the UI responsive; rollback restores the row if the API fails.
    setTransactionActionLoading(true);
    setNotice('');
    setTransactions((current) => current.filter((item) => item._id !== id));

    try {
      await deleteTransaction(id);
      setDeletingTransaction(null);
      setNotice('Transaction deleted.');
    } catch (err) {
      setTransactions(previousTransactions);
      setNotice(err?.response?.data?.message || 'Could not delete transaction.');
    } finally {
      setTransactionActionLoading(false);
    }
  };

  const viewInvoice = (invoice) => openModal('Invoice Details', (
    <div className="detailList">
      <span>Client</span><strong>{invoice.clientName}</strong>
      <span>Email</span><strong>{invoice.clientEmail || 'No email saved'}</strong>
      <span>Status</span><strong>{invoice.status}</strong>
      <span>Amount</span><strong>{currency.format(Number(invoice.amount || 0))}</strong>
    </div>
  ));

  const updateInvoiceStatus = async (invoice, status) => {
    if (!invoice?._id) return;
    setSaving(true);
    setNotice('');

    try {
      const res = await api.put(`/api/invoices/${invoice._id}`, { ...invoice, status });
      setInvoices((current) => current.map((item) => (item._id === invoice._id ? res.data : item)));
      setNotice(status === 'paid' ? 'Invoice marked as paid.' : 'Invoice queued to send.');
    } catch (err) {
      setNotice(err?.response?.data?.message || 'Could not update invoice.');
    } finally {
      setSaving(false);
    }
  };

  const deleteInvoiceRecord = async (invoice) => {
    if (!invoice?._id) return;
    const confirmed = window.confirm(`Delete invoice ${invoice.invoiceId || invoice.clientName}? This cannot be undone.`);
    if (!confirmed) return;

    const previousInvoices = invoices;
    setSaving(true);
    setNotice('');
    setInvoices((current) => current.filter((item) => item._id !== invoice._id));

    try {
      await api.delete(`/api/invoices/${invoice._id}`);
      setNotice('Invoice deleted.');
    } catch (err) {
      setInvoices(previousInvoices);
      setNotice(err?.response?.data?.message || 'Could not delete invoice.');
    } finally {
      setSaving(false);
    }
  };

  const downloadInvoice = (invoice) => {
    if (!invoice) return;
    const text = [
      `Invoice ${invoice.invoiceId || ''}`,
      `Client: ${invoice.clientName}`,
      `Email: ${invoice.clientEmail || 'N/A'}`,
      `Amount: ${currency.format(Number(invoice.amount || 0))}`,
      `Status: ${invoice.status}`,
    ].join('\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `${invoice.invoiceId || 'invoice'}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const addCard = async () => {
    const cards = wallet?.cards || [];
    const newCard = {
      bank: 'Reserve Bank',
      cardNumber: `7319 44${String(Math.floor(1000 + Math.random() * 9000))} ****`,
      expires: '12/29',
      network: 'VISA',
    };
    const nextWallet = {
      ...(wallet || {}),
      cards: [newCard, ...cards],
      balance: wallet?.balance ?? summary.balance,
      status: wallet?.status || 'Active',
      currency: wallet?.currency || 'USD / US Dollar',
    };

    setSaving(true);
    setNotice('');
    try {
      const res = await api.put('/api/wallets', nextWallet);
      setWallet(res.data);
      setNotice('New card added.');
    } catch (err) {
      setNotice(err?.response?.data?.message || 'Could not add card.');
    } finally {
      setSaving(false);
    }
  };

  const addTransaction = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice('');

    try {
      const res = await api.post('/api/transactions', {
        ...transactionForm,
        amount: Number(transactionForm.amount),
      });
      setTransactions((current) => [res.data, ...current]);
      setTransactionForm({ ...emptyTransaction, category: transactionForm.category, type: transactionForm.type });
    } catch (err) {
      setNotice(err?.response?.data?.message || 'Could not save transaction.');
    } finally {
      setSaving(false);
    }
  };

  const addInvoice = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice('');

    try {
      const amount = Number(invoiceForm.amount);
      const res = await api.post('/api/invoices', {
        ...invoiceForm,
        amount,
        invoiceId: `OMG${Math.floor(100000 + Math.random() * 900000)}`,
        items: [{ name: invoiceForm.clientName || 'Service', orderType: invoiceForm.ordersType, rate: amount, amount }],
      });
      setInvoices((current) => [res.data, ...current]);
      setInvoiceForm(emptyInvoice);
    } catch (err) {
      setNotice(err?.response?.data?.message || 'Could not create invoice.');
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice('');

    try {
      const res = await api.put('/api/users/me', profile);
      setProfile(res.data);
      setNotice(res.data.devVerificationUrl || res.data.message || 'Settings updated.');
      setSettingsEditable(false);
    } catch (err) {
      setNotice(err?.response?.data?.message || 'Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="magloApp">
      <aside className="magloSidebar">
        <div className="magloBrand">
          <img src="/assets/omega-tracker-logo.png" alt="" aria-hidden="true" />
          <strong>Omega.</strong>
        </div>

        <nav className="magloNav" aria-label="Primary navigation">
          {navItems.map((item) => (
            <button
              key={item.view}
              type="button"
              className={activeView === item.view ? 'active' : ''}
              onClick={() => setActiveView(item.view)}
              aria-current={activeView === item.view ? 'page' : undefined}
            >
              <span className="material-symbols-outlined" aria-hidden="true">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebarFooter">
          <button type="button" onClick={openHelp}>
            <span className="material-symbols-outlined" aria-hidden="true">help</span>
            Help
          </button>
          <button type="button" onClick={logout}>
            <span className="material-symbols-outlined" aria-hidden="true">logout</span>
            Logout
          </button>
        </div>
      </aside>

      <main className="magloMain">
        <TopBar
          title={titleFor(activeView)}
          displayName={displayName}
          profileMenuOpen={profileMenuOpen}
          onSearch={openSearch}
          onNotifications={openNotifications}
          onProfile={() => setProfileMenuOpen((open) => !open)}
          onSettings={() => { setActiveView('settings'); setProfileMenuOpen(false); }}
          onLogout={logout}
        />
        {notice ? <div className="magloNotice" role="status">{notice}</div> : null}
        {loading ? <LoadingPanel /> : null}

        {!loading && activeView === 'dashboard' && (
          <DashboardView
            summary={summary}
            transactions={displayTransactions}
            wallet={wallet}
            setActiveView={setActiveView}
            onViewTransaction={viewTransaction}
            onEditTransaction={startEditTransaction}
            onDeleteTransaction={startDeleteTransaction}
          />
        )}

        {!loading && activeView === 'transactions' && (
          <TransactionsView
            transactions={filteredTransactions}
            form={transactionForm}
            setForm={setTransactionForm}
            onSubmit={addTransaction}
            saving={saving}
            query={transactionQuery}
            setQuery={setTransactionQuery}
            onViewTransaction={viewTransaction}
            onEditTransaction={startEditTransaction}
            onDeleteTransaction={startDeleteTransaction}
          />
        )}

        {!loading && activeView === 'invoices' && (
          <InvoicesView
            invoices={filteredInvoices}
            form={invoiceForm}
            setForm={setInvoiceForm}
            onSubmit={addInvoice}
            saving={saving}
            query={invoiceQuery}
            setQuery={setInvoiceQuery}
            onViewInvoice={viewInvoice}
            onSendInvoice={updateInvoiceStatus}
            onDownloadInvoice={downloadInvoice}
            onDeleteInvoice={deleteInvoiceRecord}
          />
        )}

        {!loading && activeView === 'wallets' && (
          <WalletsView
            wallet={wallet}
            summary={summary}
            payments={filteredPayments}
            query={paymentQuery}
            setQuery={setPaymentQuery}
            onAddCard={addCard}
          />
        )}

        {!loading && activeView === 'settings' && (
          <SettingsView
            profile={profile}
            setProfile={setProfile}
            onSubmit={saveProfile}
            saving={saving}
            editable={settingsEditable}
            setEditable={setSettingsEditable}
          />
        )}
      </main>
      {modal ? <AppModal modal={modal} onClose={() => setModal(null)} /> : null}
      <EditTransactionModal
        transaction={editingTransaction}
        categories={categories}
        saving={transactionActionLoading}
        onClose={() => setEditingTransaction(null)}
        onSave={saveTransactionEdit}
      />
      <DeleteConfirmationDialog
        transaction={deletingTransaction}
        saving={transactionActionLoading}
        onCancel={() => setDeletingTransaction(null)}
        onConfirm={confirmDeleteTransaction}
      />
    </div>
  );
}

function TopBar({ title, displayName, profileMenuOpen, onSearch, onNotifications, onProfile, onSettings, onLogout }) {
  return (
    <header className="magloTop">
      <h1>{title}</h1>
      <div className="topActions">
        <button type="button" aria-label="Search" onClick={onSearch}>
          <span className="material-symbols-outlined">search</span>
        </button>
        <button type="button" aria-label="Notifications" onClick={onNotifications}>
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <div className="profileWrap">
          <button className="profileChip" type="button" onClick={onProfile} aria-expanded={profileMenuOpen}>
            <span>{initials(displayName)}</span>
            <strong>{displayName}</strong>
            <span className="material-symbols-outlined">expand_more</span>
          </button>
          {profileMenuOpen ? (
            <div className="profileMenu">
              <button type="button" onClick={onSettings}><span className="material-symbols-outlined">settings</span>Settings</button>
              <button type="button" onClick={onLogout}><span className="material-symbols-outlined">logout</span>Logout</button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}

function DashboardView({ summary, transactions, wallet, setActiveView, onViewTransaction, onEditTransaction, onDeleteTransaction }) {
  return (
    <div className="dashboardLayout">
      <section className="dashboardCenter">
        <div className="metricRow">
          <MetricCard label="Total balance" value={currency.format(summary.balance || 0)} icon="account_balance_wallet" featured />
          <MetricCard label="Total spending" value={currency.format(summary.spending || 0)} icon="payments" />
          <MetricCard label="Total saved" value={currency.format(summary.saved || 0)} icon="savings" />
        </div>

        <section className="chartCard">
          <div className="sectionHeader">
            <h2>Working Capital</h2>
            <div className="legend"><span /> Income <i /> Expenses</div>
          </div>
          <WorkingCapitalChart transactions={transactions} />
        </section>

        <section className="tableCard">
          <div className="sectionHeader">
            <h2>Recent Transaction</h2>
            <button type="button" onClick={() => setActiveView('transactions')}>View All</button>
          </div>
          <TransactionList
            transactions={transactions.slice(0, 3)}
            compact
            formatCurrency={(value) => currency.format(value)}
            formatDate={formatDate}
            onView={onViewTransaction}
            onEdit={onEditTransaction}
            onDelete={onDeleteTransaction}
          />
        </section>
      </section>

      <aside className="dashboardAside">
        <h2>Wallet</h2>
        <CardStack cards={wallet?.cards} />
        <h2>Scheduled Transfers</h2>
        <PaymentList payments={transactions.slice(0, 5)} />
      </aside>
    </div>
  );
}

function WorkingCapitalChart({ transactions }) {
  const chart = useMemo(() => buildCapitalChart(transactions), [transactions]);

  if (!transactions.length) {
    return (
      <div className="chartMock emptyChart" aria-label="Working capital chart">
        <p>Add income and expenses to see your working capital trend.</p>
      </div>
    );
  }

  return (
    <div className="chartMock" aria-label="Working capital chart">
      <svg viewBox="0 0 720 240" role="img" aria-label="Income and expenses trend">
        <path className="gridLine" d="M50 40H690 M50 100H690 M50 160H690 M50 220H690" />
        <text className="axisLabel" x="12" y="45">{chart.labels[3]}</text>
        <text className="axisLabel" x="12" y="105">{chart.labels[2]}</text>
        <text className="axisLabel" x="12" y="165">{chart.labels[1]}</text>
        <text className="axisLabel" x="12" y="225">$0</text>
        <path className="incomeLine" d={chart.incomePath} />
        <path className="expenseLine" d={chart.expensePath} />
        {chart.points.map((point) => (
          <g key={point.label}>
            <circle className="incomeDot" cx={point.x} cy={point.incomeY} r="3" />
            <circle className="expenseDot" cx={point.x} cy={point.expenseY} r="3" />
            <text className="dateLabel" x={point.x} y="236">{point.label}</text>
          </g>
        ))}
      </svg>
      <div className="chartSummary">
        <span>Income {currency.format(chart.totalIncome)}</span>
        <span>Expenses {currency.format(chart.totalExpenses)}</span>
      </div>
    </div>
  );
}

function TransactionsView({ transactions, form, setForm, onSubmit, saving, query, setQuery, onViewTransaction, onEditTransaction, onDeleteTransaction }) {
  return (
    <section className="pageStack">
      <div className="toolbar">
        <label className="searchBox">
          <span className="material-symbols-outlined">search</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search anything on Transactions" />
        </label>
      </div>
      <form className="quickForm" onSubmit={onSubmit}>
        <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}>
          <option value="expense">Expense</option>
          <option value="income">Income</option>
        </select>
        <input value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Name or business" required />
        <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}>
          {categories.map((category) => <option key={category}>{category}</option>)}
        </select>
        <input type="number" min="0" step="0.01" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} placeholder="Amount" required />
        <button type="submit" disabled={saving}>{saving ? 'Saving' : 'Add'}</button>
      </form>
      <TransactionList
        transactions={transactions}
        formatCurrency={(value) => currency.format(value)}
        formatDate={formatDate}
        onView={onViewTransaction}
        onEdit={onEditTransaction}
        onDelete={onDeleteTransaction}
      />
    </section>
  );
}

function InvoicesView({ invoices, form, setForm, onSubmit, saving, query, setQuery, onViewInvoice, onSendInvoice, onDownloadInvoice, onDeleteInvoice }) {
  const selectedInvoice = invoices[0];

  return (
    <section className="invoiceGrid">
      <div className="invoiceList">
        <div className="toolbar">
          <label className="searchBox">
            <span className="material-symbols-outlined">search</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search invoices" />
          </label>
        </div>
        <form className="quickForm invoiceQuickForm" onSubmit={onSubmit}>
          <input value={form.clientName} onChange={(event) => setForm((current) => ({ ...current, clientName: event.target.value }))} placeholder="Client name" required />
          <input value={form.clientEmail} onChange={(event) => setForm((current) => ({ ...current, clientEmail: event.target.value }))} placeholder="Client email" />
          <input type="number" min="0" step="0.01" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} placeholder="Amount" required />
          <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))}>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
          <button type="submit" disabled={saving}>{saving ? 'Creating' : 'Create Invoice'}</button>
        </form>
        <InvoiceTable
          invoices={invoices}
          onView={onViewInvoice}
          onSetStatus={onSendInvoice}
          onDelete={onDeleteInvoice}
        />
      </div>
      <InvoicePreview invoice={selectedInvoice} onSend={(invoice) => onSendInvoice(invoice, 'pending')} onDownload={onDownloadInvoice} onPreview={onViewInvoice} />
    </section>
  );
}

function WalletsView({ wallet, summary, payments, query, setQuery, onAddCard }) {
  return (
    <div className="walletGrid">
      <section>
        <CardStack cards={wallet?.cards} large />
        <div className="balanceCard">
          <span>Your Balance</span>
          <strong>{currency.format(summary.balance)}</strong>
          <hr />
          <div><span>Currency</span><b>{wallet?.currency || 'USD / US Dollar'}</b></div>
          <div><span>Status</span><b>{wallet?.status || 'Active'}</b></div>
        </div>
        <button className="ghostAction" type="button" onClick={onAddCard}><span className="material-symbols-outlined">add</span>Add New Card</button>
      </section>
      <section className="paymentsPanel">
        <div className="sectionHeader"><h2>My Payments</h2><label className="plainSearch"><span className="material-symbols-outlined">search</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" /></label></div>
        <PaymentList payments={payments} expanded />
      </section>
    </div>
  );
}

function SettingsView({ profile, setProfile, onSubmit, saving, editable, setEditable }) {
  const safeProfile = profile || {};

  return (
    <section className="settingsCard">
      <div className="sectionHeader">
        <div>
          <h2>Account Information</h2>
          <p>Update your account information</p>
        </div>
        <button type="button" className="linkAction" onClick={() => setEditable((value) => !value)}><span className="material-symbols-outlined">edit</span>{editable ? 'Cancel' : 'Edit'}</button>
      </div>
      <form className="settingsForm" onSubmit={onSubmit}>
        <h3>Personal Information</h3>
        <label>First Name<input disabled={!editable} value={safeProfile.firstName || ''} onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))} /></label>
        <label>Last Name<input disabled={!editable} value={safeProfile.lastName || ''} onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))} /></label>
        <label>Date of Birth<input disabled={!editable} value={safeProfile.dateOfBirth || ''} onChange={(e) => setProfile((p) => ({ ...p, dateOfBirth: e.target.value }))} placeholder="27/09/1998" /></label>
        <label>Mobile Number<input disabled={!editable} value={safeProfile.mobile || ''} onChange={(e) => setProfile((p) => ({ ...p, mobile: e.target.value }))} placeholder="+123 456 7890" /></label>
        <label className="wide">Email<input disabled={!editable} type="email" value={safeProfile.email || ''} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} /></label>
        <label>New Password<input type="password" placeholder="********" disabled /></label>
        <label>Confirm Password<input type="password" placeholder="********" disabled /></label>
        <button type="submit" disabled={saving || !editable}>{saving ? 'Updating' : 'Update'}</button>
      </form>
    </section>
  );
}

function MetricCard({ label, value, icon, featured }) {
  return (
    <article className={featured ? 'metricBox featured' : 'metricBox'}>
      <span className="material-symbols-outlined">{icon}</span>
      <div><p>{label}</p><strong>{value}</strong></div>
    </article>
  );
}

function InvoiceTable({ invoices, onView, onSetStatus, onDelete }) {
  return (
    <div className="dataTable invoiceDataTable">
      <table>
        <thead><tr><th>Name/Client</th><th>Date</th><th>Orders/Type</th><th>Amount</th><th>Status</th><th>Action</th></tr></thead>
        <tbody>
          {invoices.map((invoice) => (
            <tr key={invoice._id}>
              <td data-label="Name/Client"><div className="entity"><span>{invoice.clientName.slice(0, 1)}</span><div><strong>{invoice.clientName}</strong><small>Inv: {invoice.invoiceId}</small></div></div></td>
              <td data-label="Date">{formatDate(invoice.invoiceDate)}<small>at 8:00 PM</small></td>
              <td data-label="Orders/Type">{invoice.ordersType}</td>
              <td data-label="Amount" className="moneyCell">{currency.format(Number(invoice.amount || 0))}</td>
              <td data-label="Status"><span className={`status ${invoice.status}`}>{invoice.status}</span></td>
              <td data-label="Action">
                <div className="rowActions">
                  <button className="dotsButton" type="button" onClick={() => onView?.(invoice)} aria-label={`View ${invoice.invoiceId}`}>...</button>
                  <button className="miniTextButton" type="button" onClick={() => onSetStatus?.(invoice, 'paid')}>Paid</button>
                  <button className="miniTextButton" type="button" onClick={() => onSetStatus?.(invoice, 'unpaid')}>Unpaid</button>
                  <button className="miniTextButton danger" type="button" onClick={() => onDelete?.(invoice)}>Delete</button>
                </div>
              </td>
            </tr>
          ))}
          {!invoices.length ? <tr><td colSpan="6">No invoices found.</td></tr> : null}
        </tbody>
      </table>
    </div>
  );
}

function InvoicePreview({ invoice, onSend, onDownload, onPreview }) {
  if (!invoice) return <aside className="sideCard"><h2>Invoice Details</h2><p>Create an invoice to preview it here.</p></aside>;
  return (
    <aside className="invoicePreview">
      <section className="invoiceHero">
        <img src="/assets/omega-tracker-logo.png" alt="" />
        <div><strong>Omega</strong><span>sales@omegatracker.com</span></div>
      </section>
      <section className="sideCard">
        <h2>Client Details</h2>
        <div className="entity"><span>{invoice.clientName.slice(0, 1)}</span><div><strong>{invoice.clientName}</strong><small>{invoice.clientEmail || 'client@example.com'}</small></div></div>
        <hr />
        <p>{invoice.clientAddress || '3471 Rainy Day Drive Tulsa, USA'}</p>
      </section>
      <section className="sideCard invoiceBasicInfo">
        <h2>Basic Info</h2>
        <p>Invoice Date</p><strong>{formatDate(invoice.invoiceDate)}</strong>
        <p>Due Date</p><strong>{formatDate(invoice.dueDate)}</strong>
        <button className="sendButton" type="button" onClick={() => onSend?.(invoice)}>Send Invoice</button>
        <div className="invoiceActions">
          <button type="button" onClick={() => onPreview?.(invoice)}><span className="material-symbols-outlined">visibility</span>Preview</button>
          <button type="button" onClick={() => onDownload?.(invoice)}><span className="material-symbols-outlined">download</span>Download</button>
        </div>
      </section>
    </aside>
  );
}

function CardStack({ cards = [], large }) {
  const safeCards = cards.length ? cards : [{ bank: 'Universal Bank', cardNumber: '5495 7381 3759 2321', expires: '09/25', network: 'VISA' }];
  return (
    <div className={large ? 'cardStack large' : 'cardStack'}>
      {safeCards.slice(0, 2).map((card, index) => (
        <article className={index ? 'bankCard floating' : 'bankCard'} key={`${card.cardNumber}-${index}`}>
          <div><strong>Omega.</strong><span>{card.bank}</span></div>
          <b>{card.cardNumber}</b>
          <small>{card.expires}</small>
          <em>{card.network}</em>
        </article>
      ))}
    </div>
  );
}

function PaymentList({ payments = [], expanded }) {
  const safePayments = payments;
  return (
    <div className={expanded ? 'paymentList expanded' : 'paymentList'}>
      {safePayments.map((payment, index) => (
        <div className="paymentItem" key={`${payment._id || payment.name || payment.description}-${index}`}>
          <span>{(payment.description || payment.category || 'T').slice(0, 1)}</span>
          <div className="paymentMeta">
            <strong>{payment.description || 'Transaction'}</strong>
            <small>{formatDate(payment.date)}</small>
            <small>{payment.category || payment.type}</small>
          </div>
          <b>{payment.type === 'income' ? '+' : '-'} {currency.format(Number(payment.amount || 0))}</b>
        </div>
      ))}
      {!safePayments.length ? <p className="emptyState">No transactions added yet.</p> : null}
    </div>
  );
}

function AppModal({ modal, onClose }) {
  return (
    <div className="modalBackdrop" role="presentation" onMouseDown={onClose}>
      <section className="appModal" role="dialog" aria-modal="true" aria-label={modal.title} onMouseDown={(event) => event.stopPropagation()}>
        <div className="sectionHeader">
          <h2>{modal.title}</h2>
          <button type="button" className="iconButton" onClick={onClose} aria-label="Close dialog">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        {modal.content}
      </section>
    </div>
  );
}

function LoadingPanel() {
  return (
    <div className="loadingPanel" role="status" aria-live="polite">
      <div className="omegaLoader" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <strong>Loading Omega Tracker</strong>
      <p>Preparing your finance workspace...</p>
    </div>
  );
}

function formatDate(date) {
  if (!date) return '14 Apr 2026';
  return new Date(date).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

function titleFor(view) {
  const found = navItems.find((item) => item.view === view);
  return found?.label || 'Dashboard';
}

function initials(name) {
  return String(name || 'OU').split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
}

function filterItems(items, query, keys) {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return items;

  return items.filter((item) => keys.some((key) => String(item?.[key] || '').toLowerCase().includes(trimmed)));
}

function buildCapitalChart(transactions) {
  const grouped = new Map();

  transactions.forEach((transaction) => {
    const date = new Date(transaction.date);
    const key = Number.isNaN(date.getTime()) ? 'No date' : date.toISOString().slice(0, 10);
    const current = grouped.get(key) || { income: 0, expenses: 0 };
    const amount = Number(transaction.amount || 0);

    if (transaction.type === 'income') current.income += amount;
    if (transaction.type === 'expense') current.expenses += amount;
    grouped.set(key, current);
  });

  const entries = Array.from(grouped.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-7);

  const maxValue = Math.max(
    1,
    ...entries.flatMap(([, value]) => [value.income, value.expenses])
  );

  const left = 62;
  const right = 688;
  const top = 34;
  const bottom = 220;
  const width = right - left;
  const height = bottom - top;
  const step = entries.length > 1 ? width / (entries.length - 1) : 0;

  const points = entries.map(([date, value], index) => {
    const x = entries.length === 1 ? left + width / 2 : left + step * index;
    return {
      x,
      incomeY: bottom - (value.income / maxValue) * height,
      expenseY: bottom - (value.expenses / maxValue) * height,
      income: value.income,
      expenses: value.expenses,
      label: date === 'No date'
        ? 'No date'
        : new Date(`${date}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
  });

  const labels = [0.25, 0.5, 0.75, 1].map((ratio) => compactCurrency(maxValue * ratio));

  return {
    points,
    labels,
    incomePath: linePath(points.map((point) => [point.x, point.incomeY])),
    expensePath: linePath(points.map((point) => [point.x, point.expenseY])),
    totalIncome: transactions.filter((item) => item.type === 'income').reduce((sum, item) => sum + Number(item.amount || 0), 0),
    totalExpenses: transactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount || 0), 0),
  };
}

function linePath(points) {
  if (!points.length) return '';
  if (points.length === 1) {
    const [x, y] = points[0];
    return `M${x - 20} ${y} L${x + 20} ${y}`;
  }

  return points.map(([x, y], index) => `${index === 0 ? 'M' : 'L'}${x} ${y}`).join(' ');
}

function compactCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: value >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: 0,
  }).format(value);
}

export default Dashboard;
