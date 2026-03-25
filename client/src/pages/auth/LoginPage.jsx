import { useState } from 'react';
import { Card, Form, Input, Button, Typography, message, Divider } from 'antd';
import { LockOutlined, UserOutlined, BankOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const onFinish = async ({ identifier, password }) => {
    setLoading(true);
    try {
      const profile = await login(identifier, password);
      if (profile?.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      const codeMap = {
        'auth/invalid-credential': 'Invalid credentials. Check your email / contact number and password.',
        'auth/user-not-found': 'No account found with those details.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/too-many-requests': 'Too many failed attempts. Please wait a few minutes and try again.',
        'auth/user-disabled': 'This account has been disabled. Contact your admin.',
        'auth/network-request-failed': 'Network error. Check your connection and retry.',
        'auth/unauthorized-domain': 'This domain is not authorised in Firebase. Ask your admin to add it to Firebase → Authentication → Authorised domains.',
      };
      message.error(codeMap[err?.code] || `Login failed: ${err?.message || 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F8FAFC',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      {/* Left accent bar */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          width: 4,
          background: '#4F46E5',
        }}
      />

      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Brand header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: '#4F46E5',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
            }}
          >
            <BankOutlined style={{ color: '#fff', fontSize: 26 }} />
          </div>
          <Title level={3} style={{ margin: 0, color: '#1E293B', fontWeight: 700 }}>
            Deshpande Blocks
          </Title>
          <Text style={{ color: '#64748B', fontSize: 14 }}>
            Sign in to your account
          </Text>
        </div>

        <Card
          bordered={false}
          style={{
            borderRadius: 14,
            border: '1px solid #E2E8F0',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            padding: '8px 0',
          }}
        >
          <Form layout="vertical" onFinish={onFinish} size="large" requiredMark={false}>
            <Form.Item
              name="identifier"
              label="Email or Mobile Number"
              rules={[
                { required: true, message: 'Please enter your email or contact number' },
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
                    const isContact = /^[6-9]\d{9}$/.test(value.trim());
                    if (isEmail || isContact) return Promise.resolve();
                    return Promise.reject('Enter a valid email or 10-digit mobile number');
                  },
                },
              ]}
            >
              <Input
                prefix={<UserOutlined style={{ color: '#94A3B8' }} />}
                placeholder="User name"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#94A3B8' }} />}
                placeholder="Your password"
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                style={{ height: 44, fontWeight: 600 }}
              >
                Sign In
              </Button>
            </Form.Item>
          </Form>

          <Divider style={{ margin: '20px 0 12px', borderColor: '#E2E8F0' }} />
          <Text style={{ color: '#94A3B8', fontSize: 12, display: 'block', textAlign: 'center' }}>
            Use your registered email address or 10-digit mobile number
          </Text>
        </Card>
      </div>
    </div>
  );
}
