import { Layout, Button, Avatar, Dropdown, Space, Typography } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { fetchConfig } from '../../api/config';

const { Header } = Layout;
const { Text } = Typography;

export default function AppHeader({ collapsed, onToggle }) {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: fetchConfig,
    staleTime: Infinity,
  });

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const menuItems = [
    {
      key: 'profile-info',
      label: (
        <div style={{ padding: '4px 0', minWidth: 160 }}>
          <div style={{ fontWeight: 600 }}>{profile?.name}</div>
          <div style={{ fontSize: 12, color: '#64748B', textTransform: 'capitalize' }}>
            {profile?.role}
          </div>
        </div>
      ),
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: handleLogout,
    },
  ];

  return (
    <Header
      style={{
        padding: '0 16px',
        background: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid #E2E8F0',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        height: 56,
        lineHeight: '56px',
      }}
    >
      <Space>
        <Button
          type="text"
          icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={onToggle}
          style={{ color: '#4F46E5' }}
        />
        <Text strong style={{ fontSize: 15, color: '#1E293B' }}>
          {config?.societyName || 'Deshpande Blocks'}
        </Text>
      </Space>

      <Dropdown menu={{ items: menuItems }} placement="bottomRight" arrow>
        <Space style={{ cursor: 'pointer', padding: '0 8px' }}>
          <Avatar
            icon={<UserOutlined />}
            style={{ background: '#4F46E5', flexShrink: 0 }}
          />
          <Text style={{ color: '#1E293B', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {profile?.name}
          </Text>
        </Space>
      </Dropdown>
    </Header>
  );
}
