import { useState } from 'react';
import { Form, Input, InputNumber, Select, Button, message, Card, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createExpense } from '../../api/expenses';
import { fetchConfig } from '../../api/config';
import { EXPENSE_TYPES } from '../../utils/constants';
import FileUpload from '../../components/common/FileUpload';

const { Title } = Typography;
const { TextArea } = Input;

export default function AddExpense() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [fileData, setFileData] = useState(null);

  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: fetchConfig,
    staleTime: Infinity,
  });

  const expenseTypes = config?.expenseTypes || EXPENSE_TYPES;

  const mutation = useMutation({
    mutationFn: (values) =>
      createExpense({
        ...values,
        fileUrl: fileData?.filePath || null,
        fileName: fileData?.fileName || null,
      }),
    onSuccess: () => {
      message.success('Expense created successfully');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      navigate('/admin/expenses');
    },
    onError: (err) => {
      message.error(err.response?.data?.message || 'Failed to create expense');
    },
  });

  return (
    <div>
      <div className="page-header">
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admin/expenses')}>
          Back
        </Button>
      </div>

      <Card style={{ maxWidth: 600 }}>
        <Title level={4}>Add New Expense</Title>
        <Form form={form} layout="vertical" onFinish={(v) => mutation.mutate(v)}>
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Title is required' }]}
          >
            <Input placeholder="e.g. Garden maintenance" />
          </Form.Item>

          <Form.Item
            name="type"
            label="Expense Type"
            rules={[{ required: true, message: 'Please select a type' }]}
          >
            <Select
              placeholder="Select type"
              options={expenseTypes.map((t) => ({ value: t, label: t }))}
            />
          </Form.Item>

          <Form.Item
            name="amount"
            label="Amount (₹)"
            rules={[
              { required: true, message: 'Amount is required' },
              { type: 'number', min: 1, message: 'Amount must be greater than 0' },
            ]}
          >
            <InputNumber
              style={{ width: '100%' }}
              prefix="₹"
              placeholder="0"
              min={1}
              formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
            />
          </Form.Item>

          <Form.Item name="description" label="Description (Optional)">
            <TextArea rows={3} placeholder="Additional details about this expense" />
          </Form.Item>

          <Form.Item label="Receipt / Document (Optional)">
            <FileUpload
              folder="expenses"
              onUpload={setFileData}
              label="Upload receipt or document"
            />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={mutation.isPending} block>
              Create Expense
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
