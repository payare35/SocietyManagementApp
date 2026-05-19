import { useEffect } from 'react';
import { Form, Input, InputNumber, Select, Button, message, Card, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { createMember, updateMember, fetchMemberById } from '../../api/members';
import { fetchConfig } from '../../api/config';

const { Title } = Typography;
const { Option } = Select;

export default function AddMember() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const queryClient = useQueryClient();

  const { data: member, isLoading: loadingMember } = useQuery({
    queryKey: ['member', id],
    queryFn: () => fetchMemberById(id),
    enabled: isEdit,
  });

  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: fetchConfig,
    staleTime: Infinity,
  });

  useEffect(() => {
    if (member) {
      form.setFieldsValue({
        name: member.name,
        contactNumber: member.contactNumber,
        email: member.email,
        flatNumber: member.flatNumber,
        role: member.role,
        monthlyMaintenanceAmount: member.monthlyMaintenanceAmount ?? undefined,
      });
    }
  }, [member, form]);

  const mutation = useMutation({
    mutationFn: (values) =>
      isEdit ? updateMember(id, values) : createMember(values),
    onSuccess: () => {
      message.success(`Member ${isEdit ? 'updated' : 'created'} successfully`);
      queryClient.invalidateQueries({ queryKey: ['members'] });
      navigate('/admin/members');
    },
    onError: (err) => {
      const msg = err.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} member`;
      message.error(msg);
    },
  });

  const normalizeFlatNumber = (raw) =>
    raw
      ? raw
          .split(',')
          .map((f) => f.trim())
          .filter(Boolean)
          .join(', ')
      : raw;

  const onFinish = (values) => {
    if (values.flatNumber != null && values.flatNumber !== '') {
      values.flatNumber = normalizeFlatNumber(values.flatNumber);
    }
    if (isEdit && !values.password) delete values.password;
    if (values.monthlyMaintenanceAmount === '' || values.monthlyMaintenanceAmount == null) {
      if (isEdit) values.monthlyMaintenanceAmount = null;
      else delete values.monthlyMaintenanceAmount;
    }
    mutation.mutate(values);
  };

  return (
    <div>
      <div className="page-header">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/members')}>
          Back
        </Button>
      </div>

      <Card style={{ maxWidth: 600 }}>
        <Title level={4}>{isEdit ? 'Edit Member' : 'Add New Member'}</Title>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          disabled={loadingMember}
        >
          <Form.Item
            name="name"
            label="Full Name"
            rules={[{ required: true, message: 'Name is required' }]}
          >
            <Input placeholder="e.g. Rahul Sharma" />
          </Form.Item>

          <Form.Item
            name="flatNumber"
            label="Flat Number(s)"
            extra="For multiple flats use comma-separated values — e.g. 501, 502"
            rules={[
              { required: true, message: 'Flat number is required' },
              {
                validator: (_, value) => {
                  if (!value) return Promise.resolve();
                  const parts = value.split(',').map((f) => f.trim()).filter(Boolean);
                  if (parts.length === 0) return Promise.reject('Enter at least one flat number');
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Input placeholder="e.g. 501  or  501, 502, 503" />
          </Form.Item>

          <Form.Item
            name="contactNumber"
            label="Contact Number"
            rules={[
              { required: true, message: 'Contact number is required' },
              { pattern: /^[6-9]\d{9}$/, message: 'Enter a valid 10-digit Indian mobile number' },
            ]}
          >
            <Input placeholder="e.g. 9876543210" maxLength={10} />
          </Form.Item>

          <Form.Item
            name="email"
            label="Email Address (Optional)"
            rules={[{ type: 'email', message: 'Enter a valid email address' }]}
          >
            <Input placeholder="e.g. rahul@email.com" />
          </Form.Item>

          <Form.Item
            name="password"
            label={isEdit ? 'New Password (leave blank to keep current)' : 'Password'}
            rules={
              isEdit
                ? [{ min: 6, message: 'Password must be at least 6 characters' }]
                : [
                    { required: true, message: 'Password is required' },
                    { min: 6, message: 'Password must be at least 6 characters' },
                  ]
            }
          >
            <Input.Password placeholder="Minimum 6 characters" />
          </Form.Item>

          <Form.Item
            name="role"
            label="Role"
            initialValue="member"
          >
            <Select>
              <Option value="member">Member</Option>
              <Option value="admin">Admin</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="monthlyMaintenanceAmount"
            label="Monthly Maintenance Override (₹)"
            extra={
              config?.monthlyMaintenanceAmount
                ? `Leave blank to use society default (₹${config.monthlyMaintenanceAmount}). Used when generating dues — e.g. shop/commercial units.`
                : 'Leave blank to use society default from Settings. Used when generating dues.'
            }
            rules={[
              {
                validator: (_, value) => {
                  if (value == null || value === '') return Promise.resolve();
                  if (Number(value) < 1) return Promise.reject(new Error('Must be at least ₹1'));
                  return Promise.resolve();
                },
              },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              min={1}
              step={100}
              placeholder="Society default"
            />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={mutation.isPending}
              block
            >
              {isEdit ? 'Update Member' : 'Create Member'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
