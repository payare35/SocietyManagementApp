import { db } from '../config/firebase.js';
import { getCurrentMonth } from '../utils/helpers.js';

export const getAdminStats = async () => {
  const currentMonth = getCurrentMonth();

  // Fetch everything needed in one parallel round-trip
  const [membersSnap, transactionsSnap, allExpensesSnap, duesSnap, recentTxSnap] =
    await Promise.all([
      db.collection('members').where('isActive', '==', true).get(),
      db.collection('transactions').where('month', '==', currentMonth).get(),
      db.collection('expenses').get(),                               // fetch once, reuse for all months
      db.collection('maintenanceDues').where('month', '==', currentMonth).get(),
      db.collection('transactions').orderBy('createdAt', 'desc').limit(10).get(),
    ]);

  const totalMembers = membersSnap.size;

  const confirmedTx = transactionsSnap.docs
    .map((d) => d.data())
    .filter((t) => t.status === 'confirmed');
  const totalCollections = confirmedTx.reduce((sum, t) => sum + (t.amount || 0), 0);

  // Build a month → expenses lookup once so the monthly chart loop is O(n) not O(n×6)
  const allExpenses = allExpensesSnap.docs.map((d) => d.data());
  const expensesByMonth = {};
  for (const e of allExpenses) {
    const ts = e.createdAt?.toDate ? e.createdAt.toDate() : new Date(e.createdAt || 0);
    const m = `${ts.getFullYear()}-${String(ts.getMonth() + 1).padStart(2, '0')}`;
    if (!expensesByMonth[m]) expensesByMonth[m] = 0;
    expensesByMonth[m] += e.amount || 0;
  }

  const totalExpenses = expensesByMonth[currentMonth] || 0;

  // Count both unpaid AND partial dues as pending
  const pendingDues = duesSnap.docs
    .map((d) => d.data())
    .filter((d) => d.status === 'unpaid' || d.status === 'partial').length;

  // Monthly chart — fetch all 6 months' transactions in one parallel round-trip
  const last6Months = getLast6Months();
  // Use single WHERE per query to avoid composite index requirement.
  // Filter status === 'confirmed' in memory.
  const txSnaps = await Promise.all(
    last6Months.map((month) =>
      db.collection('transactions').where('month', '==', month).get()
    )
  );

  const monthlyData = last6Months.map((month, i) => {
    const collections = txSnaps[i].docs
      .filter((d) => d.data().status === 'confirmed')
      .reduce((s, d) => s + (d.data().amount || 0), 0);
    const expenses = expensesByMonth[month] || 0;
    return { month, collections, expenses };
  });

  const recentTransactions = recentTxSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  return {
    totalMembers,
    totalCollections,
    totalExpenses,
    pendingDues,
    monthlyData,
    recentTransactions,
  };
};

const getLast6Months = () => {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
  }
  return months;
};
