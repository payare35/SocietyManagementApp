import { Routes, Route, Navigate } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';
import AdminRoute from './AdminRoute';
import AppLayout from '../components/Layout/AppLayout';
import LoginPage from '../pages/auth/LoginPage';
import Dashboard from '../pages/admin/Dashboard';
import Members from '../pages/admin/Members';
import AddMember from '../pages/admin/AddMember';
import Expenses from '../pages/admin/Expenses';
import AddExpense from '../pages/admin/AddExpense';
import Transactions from '../pages/admin/Transactions';
import Dues from '../pages/admin/Dues';
import UserDashboard from '../pages/user/UserDashboard';
import MyTransactions from '../pages/user/MyTransactions';
import MyDues from '../pages/user/MyDues';
import PayMaintenance from '../pages/user/PayMaintenance';
import SocietyExpenses from '../pages/user/SocietyExpenses';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<PrivateRoute />}>
        <Route element={<AppLayout />}>
          {/* Admin routes */}
          <Route element={<AdminRoute />}>
            <Route path="/admin/dashboard" element={<Dashboard />} />
            <Route path="/admin/members" element={<Members />} />
            <Route path="/admin/members/new" element={<AddMember />} />
            <Route path="/admin/members/:id/edit" element={<AddMember />} />
            <Route path="/admin/expenses" element={<Expenses />} />
            <Route path="/admin/expenses/new" element={<AddExpense />} />
            <Route path="/admin/transactions" element={<Transactions />} />
            <Route path="/admin/dues" element={<Dues />} />
          </Route>

          {/* Member routes */}
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/my-transactions" element={<MyTransactions />} />
          <Route path="/my-dues" element={<MyDues />} />
          <Route path="/pay" element={<PayMaintenance />} />
          <Route path="/expenses" element={<SocietyExpenses />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
