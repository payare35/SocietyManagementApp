import { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Typography,
  Form,
  Input,
  InputNumber,
  message,
  Alert,
  Row,
  Col,
  Skeleton,
} from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchMyDues } from '../../api/dues';
import { createSelfTransaction, fetchMyTransactions } from '../../api/transactions';
import { formatCurrency, formatMonth } from '../../utils/formatters';
import FileUpload from '../../components/common/FileUpload';

const { Title, Text } = Typography;

export default function PayMaintenance() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [fileData, setFileData] = useState(null);
  const [form] = Form.useForm();

  const { data: duesData, isLoading: duesLoading } = useQuery({
    queryKey: ['my-dues-pay'],
    queryFn: () => fetchMyDues({ limit: 50 }),
    enabled: !location.state?.due,
  });

  const { data: myTxData } = useQuery({
    queryKey: ['my-transactions'],
    queryFn: () => fetchMyTransactions({ limit: 100 }),
  });

  const isLoading = !location.state?.due && duesLoading;

  // Earliest unpaid/partial due
  const due =
    location.state?.due ||
    [...(duesData?.data || [])]
      .filter((d) => d.status !== 'paid')
      .sort((a, b) => (a.month || '').localeCompare(b.month || ''))[0];

  const remainingAmount = due ? due.amount - (due.paidAmount || 0) : 0;

  // Pre-fill amount when due loads
  useEffect(() => {
    if (remainingAmount > 0) {
      form.setFieldValue('amount', remainingAmount);
    }
  }, [remainingAmount, form]);

  const hasPendingForMonth = (myTxData?.data || []).some(
    (t) => t.month === due?.month && t.status === 'pending'
  );

  const submitMutation = useMutation({
    mutationFn: (values) =>
      createSelfTransaction({
        amount: values.amount,
        month: due?.month,
        note: values.note || '',
        fileUrl: fileData?.filePath || null,
        fileName: fileData?.fileName || null,
      }),
    onSuccess: () => {
      message.success('Payment submitted for verification. Admin will confirm shortly.');
      queryClient.invalidateQueries({ queryKey: ['my-dues-list'] });
      queryClient.invalidateQueries({ queryKey: ['my-dues-pay'] });
      queryClient.invalidateQueries({ queryKey: ['my-dues'] });
      queryClient.invalidateQueries({ queryKey: ['my-transactions'] });
      navigate('/my-transactions');
    },
    onError: (err) => message.error(err.response?.data?.message || 'Submission failed'),
  });

  if (isLoading) return <Skeleton active paragraph={{ rows: 8 }} />;

  if (!due) {
    return (
      <div>
        <Title level={3}>Pay Maintenance</Title>
        <Alert
          type="success"
          showIcon
          message="All dues are clear! Nothing to pay at the moment."
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 520 }}>
      <Title level={3}>Pay Maintenance</Title>

      {/* Due summary card */}
      <Card
        style={{
          borderRadius: 12,
          marginBottom: 24,
          border: '1px solid #C7D2FE',
          background: '#EEF2FF',
        }}
      >
        <Row justify="space-between" align="middle">
          <Col>
            <Text type="secondary" style={{ fontSize: 12 }}>Month</Text>
            <div>
              <Text strong style={{ fontSize: 16 }}>
                {formatMonth(due.month)}
              </Text>
              {due.status === 'partial' && (
                <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                  (partial)
                </Text>
              )}
            </div>
          </Col>
          <Col>
            <Text type="secondary" style={{ fontSize: 12 }}>Amount Due</Text>
            <div>
              <Text strong style={{ fontSize: 28, color: '#4F46E5' }}>
                {formatCurrency(remainingAmount)}
              </Text>
            </div>
          </Col>
        </Row>
      </Card>

      {hasPendingForMonth && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16, borderRadius: 8 }}
          message="Payment already pending verification"
          description="You have a submitted payment for this month awaiting admin confirmation. You can still submit another if needed."
        />
      )}

      {/* Payment form */}
      <Form
        form={form}
        layout="vertical"
        onFinish={(values) => submitMutation.mutate(values)}
      >
        <Form.Item
          name="amount"
          label="Amount Paid (₹)"
          rules={[
            { required: true, message: 'Please enter the amount paid' },
            { type: 'number', min: 1, message: 'Amount must be at least ₹1' },
          ]}
        >
          <InputNumber
            style={{ width: '100%' }}
            size="large"
            min={1}
            step={100}
            placeholder={String(remainingAmount)}
            formatter={(v) => v ? `₹ ${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : ''}
            parser={(v) => v.replace(/₹\s?|(,*)/g, '')}
          />
        </Form.Item>

        <Form.Item label="Upload Payment Receipt">
          <FileUpload
            folder="receipts"
            onUpload={setFileData}
            label="Upload screenshot or receipt (JPG, PNG, PDF)"
          />
        </Form.Item>

        <Form.Item name="note" label="Note (Optional)">
          <Input placeholder="e.g. UTR number or transaction ID" />
        </Form.Item>

        <Form.Item style={{ marginTop: 8 }}>
          <Button
            type="primary"
            htmlType="submit"
            block
            size="large"
            loading={submitMutation.isPending}
            disabled={!fileData}
          >
            Submit Payment for Verification
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
