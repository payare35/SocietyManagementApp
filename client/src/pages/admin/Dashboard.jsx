import { Table, Tag, Typography, Skeleton } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { fetchDashboardStats } from '../../api/dashboard';
import DashboardCards from '../../components/dashboard/DashboardCards';
import MonthlyChart from '../../components/dashboard/Charts';
import { formatCurrency, formatDate, formatMonth } from '../../utils/formatters';
import { STATUS_COLORS } from '../../utils/constants';

const { Title } = Typography;

const txColumns = [
  { title: 'Member', dataIndex: 'memberName', key: 'memberName' },
  { title: 'Flat', dataIndex: 'flatNumber', key: 'flatNumber' },
  {
    title: 'Amount',
    dataIndex: 'amount',
    key: 'amount',
    render: (v) => formatCurrency(v),
  },
  {
    title: 'Month',
    dataIndex: 'month',
    key: 'month',
    render: (v) => formatMonth(v),
  },
  {
    title: 'Status',
    dataIndex: 'status',
    key: 'status',
    render: (v) => <Tag color={STATUS_COLORS[v]}>{v?.toUpperCase()}</Tag>,
  },
  {
    title: 'Date',
    dataIndex: 'createdAt',
    key: 'createdAt',
    render: (v) => formatDate(v),
  },
];

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    staleTime: 0,
  });

  if (isLoading) return <Skeleton active paragraph={{ rows: 10 }} />;

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>Dashboard</Title>

      <DashboardCards stats={stats} />

      <MonthlyChart data={stats?.monthlyData || []} />

      <div style={{ marginTop: 24 }}>
        <Title level={4}>Recent Transactions</Title>
        <Table
          dataSource={stats?.recentTransactions || []}
          columns={txColumns}
          rowKey="id"
          pagination={false}
          size="small"
          scroll={{ x: 600 }}
        />
      </div>
    </div>
  );
}
