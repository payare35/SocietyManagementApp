import { useEffect } from 'react';
import {
  Card,
  Form,
  Input,
  InputNumber,
  Button,
  Typography,
  Divider,
  message,
  Skeleton,
} from 'antd';
import {
  SaveOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchConfig, updateConfig } from '../../api/config';

const { Title, Text } = Typography;

export default function Settings() {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { data: config, isLoading } = useQuery({
    queryKey: ['config'],
    queryFn: fetchConfig,
  });

  // Populate form once config loads
  useEffect(() => {
    if (config) {
      form.setFieldsValue({
        societyName:               config.societyName               || '',
        monthlyMaintenanceAmount:  config.monthlyMaintenanceAmount  ?? '',
        upiId:                     config.upiId                     || '',
      });
    }
  }, [config, form]);

  const mutation = useMutation({
    mutationFn: (values) => updateConfig(values),
    onSuccess: (updated) => {
      queryClient.setQueryData(['config'], updated);
      queryClient.invalidateQueries({ queryKey: ['config'] });
      message.success('Settings saved successfully');
    },
    onError: () => message.error('Failed to save settings'),
  });

  if (isLoading) return <Skeleton active paragraph={{ rows: 6 }} />;

  return (
    <div style={{ maxWidth: 560 }}>
      <Title level={3} style={{ margin: '0 0 24px' }}>Society Settings</Title>

      <Card
        bordered={false}
        style={{ border: '1px solid #E2E8F0', borderRadius: 12 }}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => mutation.mutate(values)}
          requiredMark={false}
        >
          {/* ── General ─────────────────────────────── */}
          <Text strong style={{ color: '#4F46E5', fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            General
          </Text>
          <Divider style={{ margin: '8px 0 20px', borderColor: '#E2E8F0' }} />

          <Form.Item
            name="societyName"
            label="Society Name"
            rules={[{ required: true, message: 'Society name is required' }]}
          >
            <Input placeholder="e.g. Deshpande Blocks" />
          </Form.Item>

          {/* ── Maintenance ──────────────────────────── */}
          <Text strong style={{ color: '#4F46E5', fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Maintenance
          </Text>
          <Divider style={{ margin: '8px 0 20px', borderColor: '#E2E8F0' }} />

          <Form.Item
            name="monthlyMaintenanceAmount"
            label="Monthly Maintenance Amount (₹)"
            rules={[
              { required: true, message: 'Maintenance amount is required' },
              { type: 'number', min: 1, message: 'Must be at least ₹1' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              step={100}
              placeholder="e.g. 1500"
              formatter={(v) => v ? `₹ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
              parser={(v) => v.replace(/₹\s?|(,*)/g, '')}
            />
          </Form.Item>

          <Form.Item>
            <Text type="secondary" style={{ fontSize: 12 }}>
              This amount is used when generating monthly dues for all active members.
              Changing it only affects <strong>future</strong> dues — existing dues are not modified.
            </Text>
          </Form.Item>

          {/* ── Payments ─────────────────────────────── */}
          <Text strong style={{ color: '#4F46E5', fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Payments
          </Text>
          <Divider style={{ margin: '8px 0 20px', borderColor: '#E2E8F0' }} />

          <Form.Item
            name="upiId"
            label="Society UPI ID"
            extra="Members see this UPI ID when paying maintenance."
          >
            <Input placeholder="e.g. society@upi" />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={mutation.isPending}
              size="large"
            >
              Save Settings
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
