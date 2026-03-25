import { useEffect } from 'react';
import { Form, Input, Select, Button, message, Card, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { createMember, updateMember, fetchMemberById } from '../../api/members';

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

  useEffect(() => {
    if (member) {
      form.setFieldsValue({
        name: member.name,
        contactNumber: member.contactNumber,
        email: member.email,
        flatNumber: member.flatNumber,
        role: member.role,
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

  const onFinish = (values) => {
    if (isEdit && !values.password) delete values.password;
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
            label="Flat Number"
            rules={[{ required: true, message: 'Flat number is required' }]}
          >
            <Input placeholder="e.g. A-101" />
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
