import { useState } from 'react';
import { Form, Input, InputNumber, Cascader, Button, message, Card, Typography, DatePicker } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { createExpense } from '../../api/expenses';
import { getExpenseCascaderOptions, cascaderPathToExpense } from '../../utils/expenseCategories';
import FileUpload from '../../components/common/FileUpload';

const { Title } = Typography;
const { TextArea } = Input;

const cascaderOptions = getExpenseCascaderOptions();

export default function AddExpense() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [fileData, setFileData] = useState(null);

  const mutation = useMutation({
    mutationFn: (values) => {
      const { type, subType } = cascaderPathToExpense(values.categoryPath);
      return createExpense({
        title: values.title,
        type,
        subType: subType || undefined,
        amount: values.amount,
        description: values.description,
        date: values.date ? values.date.toISOString() : new Date().toISOString(),
        fileUrl: fileData?.filePath || null,
        fileName: fileData?.fileName || null,
      });
    },
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
            name="categoryPath"
            label="Expense Category"
            rules={[
              { required: true, message: 'Please select a category' },
              {
                validator: (_, value) => {
                  const { type } = cascaderPathToExpense(value);
                  if (!type) return Promise.reject(new Error('Please select a valid category'));
                  return Promise.resolve();
                },
              },
            ]}
          >
            <Cascader
              options={cascaderOptions}
              placeholder="Select category"
              showSearch={{
                filter: (input, path) =>
                  path.some((opt) =>
                    String(opt.label).toLowerCase().includes(input.toLowerCase())
                  ),
              }}
              expandTrigger="hover"
              style={{ width: '100%' }}
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

          <Form.Item
            name="date"
            label="Expense Date"
            initialValue={dayjs()}
            rules={[{ required: true, message: 'Please select the expense date' }]}
          >
            <DatePicker
              style={{ width: '100%' }}
              format="DD MMM YYYY"
              disabledDate={(d) => d && d.isAfter(dayjs(), 'day')}
              allowClear={false}
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
