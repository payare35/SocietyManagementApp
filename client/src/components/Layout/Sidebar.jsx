import { Layout, Menu, Drawer, Typography, Divider } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  DollarOutlined,
  TransactionOutlined,
  CalendarOutlined,
  HomeOutlined,
  UnorderedListOutlined,
  CreditCardOutlined,
  BankOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const { Sider } = Layout;
const { Text } = Typography;

const adminMenuItems = [
  { key: '/admin/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/admin/members',   icon: <TeamOutlined />,        label: 'Members' },
  { key: '/admin/expenses',  icon: <DollarOutlined />,      label: 'Expenses' },
  { key: '/admin/transactions', icon: <TransactionOutlined />, label: 'Transactions' },
  { key: '/admin/dues',      icon: <CalendarOutlined />,    label: 'Dues' },
];

const memberMenuItems = [
  { key: '/dashboard',        icon: <HomeOutlined />,          label: 'Dashboard' },
  { key: '/my-transactions',  icon: <TransactionOutlined />,   label: 'My Transactions' },
  { key: '/my-dues',          icon: <CalendarOutlined />,      label: 'My Dues' },
  { key: '/pay',              icon: <CreditCardOutlined />,    label: 'Pay Maintenance' },
  { key: '/expenses',         icon: <UnorderedListOutlined />, label: 'Society Expenses' },
];

const Logo = ({ collapsed }) => (
  <div
    style={{
      height: 56,
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      gap: 10,
      overflow: 'hidden',
      flexShrink: 0,
    }}
  >
    <div
      style={{
        width: 32,
        height: 32,
        borderRadius: 8,
        background: '#4F46E5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <BankOutlined style={{ color: '#fff', fontSize: 16 }} />
    </div>
    {!collapsed && (
      <Text
        strong
        style={{
          color: '#fff',
          fontSize: 14,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          lineHeight: 1.4,
        }}
      >
        Deshpande Blocks
      </Text>
    )}
  </div>
);

/** Thin labeled divider inside the dark sidebar */
const SectionLabel = ({ label, collapsed }) => {
  if (collapsed) {
    return <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '4px 12px' }} />;
  }
  return (
    <div
      style={{
        padding: '12px 20px 4px',
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.3)',
        userSelect: 'none',
      }}
    >
      {label}
    </div>
  );
};

const SidebarMenu = ({ onSelect, collapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  const handleSelect = ({ key }) => {
    navigate(key);
    onSelect?.();
  };

  if (!isAdmin) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Logo collapsed={collapsed} />
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={memberMenuItems}
          onSelect={handleSelect}
          style={{ flex: 1, paddingTop: 8, border: 'none' }}
        />
      </div>
    );
  }

  // Admin gets both sections — admin tools on top, personal (member) section below
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto' }}>
      <Logo collapsed={collapsed} />

      <SectionLabel label="Admin" collapsed={collapsed} />
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={adminMenuItems}
        onSelect={handleSelect}
        style={{ border: 'none', flex: 'none' }}
      />

      <SectionLabel label="My Account" collapsed={collapsed} />
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={memberMenuItems}
        onSelect={handleSelect}
        style={{ border: 'none', flex: 1 }}
      />
    </div>
  );
};

export default function AppSidebar({ collapsed, isMobile, onClose }) {
  if (isMobile) {
    return (
      <Drawer
        placement="left"
        open={!collapsed}
        onClose={onClose}
        closable={false}
        styles={{ body: { padding: 0, background: '#1E293B', display: 'flex', flexDirection: 'column' } }}
        width={220}
      >
        <SidebarMenu onSelect={onClose} collapsed={false} />
      </Drawer>
    );
  }

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width={220}
      className="app-sider"
      style={{ background: '#1E293B' }}
    >
      <SidebarMenu collapsed={collapsed} />
    </Sider>
  );
}
