import { Row, Col, Card, Statistic, Typography, Tag, Skeleton, Alert } from 'antd';
import { CalendarOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchMyDues } from '../../api/dues';
import { fetchMyTransactions } from '../../api/transactions';
import { formatCurrency, formatMonth } from '../../utils/formatters';

const { Title, Text } = Typography;

export default function UserDashboard() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const { data: duesData, isLoading: duesLoading } = useQuery({
    queryKey: ['my-dues'],
    queryFn: () => fetchMyDues({ limit: 100 }),
  });

  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ['my-transactions'],
    queryFn: () => fetchMyTransactions({ limit: 100 }),
  });

  const allDues = duesData?.data || [];
  const allTx = txData?.data || [];

  // Include both unpaid and partial dues as "pending"
  const pendingDues = allDues.filter((d) => d.status === 'unpaid' || d.status === 'partial');
  const currentYear = new Date().getFullYear();
  const totalPaidThisYear = allTx
    .filter((t) => {
      const parts = (t.month ?? '').split('-');
      const year = parts.length >= 1 ? Number(parts[0]) : NaN;
      return t.status === 'confirmed' && year === currentYear;
    })
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const nextDue = [...pendingDues].sort((a, b) =>
    (a.month || '').localeCompare(b.month || '')
  )[0];

  if (duesLoading || txLoading) return <Skeleton active paragraph={{ rows: 8 }} />;

  return (
    <div>
      <Title level={3}>Welcome, {profile?.name}</Title>
      <Text type="secondary">Flat No: {profile?.flatNumber}</Text>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} sm={12}>
          <Card className="stat-card" style={{ border: '1px solid #E2E8F0' }}>
            <Statistic
              title="Pending Dues"
              value={pendingDues.length}
              prefix={<CalendarOutlined style={{ color: '#4F46E5' }} />}
              valueStyle={{ color: '#4F46E5' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card className="stat-card" style={{ border: '1px solid #E2E8F0' }}>
            <Statistic
              title={`Total Paid in ${currentYear}`}
              value={totalPaidThisYear}
              formatter={formatCurrency}
              prefix={<CheckCircleOutlined style={{ color: '#4F46E5' }} />}
              valueStyle={{ color: '#4F46E5' }}
            />
          </Card>
        </Col>
      </Row>

      {nextDue && (
        <Alert
          style={{ marginTop: 24, borderRadius: 8 }}
          type="info"
          showIcon
          message={
            <span>
              <strong>Next Due:</strong> {formatMonth(nextDue.month)} —{' '}
              <strong>{formatCurrency(nextDue.amount - (nextDue.paidAmount || 0))}</strong>
              {nextDue.status === 'partial' && ' (partial — balance remaining)'}
            </span>
          }
          description="Go to Pay Maintenance in the sidebar to pay now."
          action={
            <Tag
              color="blue"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate('/pay', { state: { due: nextDue } })}
            >
              Pay Now
            </Tag>
          }
        />
      )}

      {pendingDues.length === 0 && (
        <Alert
          style={{ marginTop: 24, borderRadius: 8 }}
          type="success"
          showIcon
          message="All dues are clear! Great job keeping up with payments."
        />
      )}
    </div>
  );
}
