import { Row, Col, Card, Statistic } from 'antd';
import {
  TeamOutlined,
  RiseOutlined,
  FallOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { formatCurrency } from '../../utils/formatters';

const CARDS = [
  {
    title: 'Total Members',
    key: 'totalMembers',
    icon: <TeamOutlined />,
    iconBg: '#EEF2FF',
    iconColor: '#4F46E5',
    formatter: (v) => v,
  },
  {
    title: 'Collections This Month',
    key: 'totalCollections',
    icon: <RiseOutlined />,
    iconBg: '#F0FDF4',
    iconColor: '#16A34A',
    formatter: formatCurrency,
  },
  {
    title: 'Expenses This Month',
    key: 'totalExpenses',
    icon: <FallOutlined />,
    iconBg: '#FEF2F2',
    iconColor: '#DC2626',
    formatter: formatCurrency,
  },
  {
    title: 'Pending Dues',
    key: 'pendingDues',
    icon: <WarningOutlined />,
    iconBg: '#FFFBEB',
    iconColor: '#D97706',
    formatter: (v) => v,
  },
];

export default function DashboardCards({ stats = {} }) {
  return (
    <Row gutter={[16, 16]}>
      {CARDS.map((card) => (
        <Col xs={24} sm={12} lg={6} key={card.title}>
          <Card className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <Statistic
                title={
                  <span style={{ color: '#64748B', fontSize: 13, fontWeight: 500 }}>
                    {card.title}
                  </span>
                }
                value={stats[card.key] ?? 0}
                formatter={card.formatter}
                valueStyle={{ color: '#1E293B', fontWeight: 700, fontSize: 22 }}
              />
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: card.iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  color: card.iconColor,
                  flexShrink: 0,
                  marginTop: 2,
                }}
              >
                {card.icon}
              </div>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );
}
