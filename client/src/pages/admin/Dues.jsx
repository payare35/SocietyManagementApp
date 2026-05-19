import { useState } from 'react';
import {
  Table,
  Button,
  Select,
  DatePicker,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  message,
  Typography,
} from 'antd';
import { CalendarOutlined, CheckOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { fetchDues, generateDues } from '../../api/dues';
import { createTransaction } from '../../api/transactions';
import { formatCurrency, formatDate, formatMonth } from '../../utils/formatters';
import { STATUS_COLORS } from '../../utils/constants';
import EmptyState from '../../components/common/EmptyState';

const { Title, Text } = Typography;

export default function Dues() {
  const queryClient = useQueryClient();
  const [markPaidForm] = Form.useForm();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({});
  const [genMonth, setGenMonth] = useState(null);
  const [genModalOpen, setGenModalOpen] = useState(false);
  const [markPaidRecord, setMarkPaidRecord] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['dues', filters, page],
    queryFn: () => fetchDues({ ...filters, page, limit: 20 }),
  });

  const generateMutation = useMutation({
    mutationFn: generateDues,
    onSuccess: (result) => {
      message.success(`Generated ${result.generated} dues, ${result.skipped} already existed`);
      queryClient.invalidateQueries({ queryKey: ['dues'] });
      setGenModalOpen(false);
      setGenMonth(null);
    },
    onError: (err) => message.error(err.response?.data?.message || 'Failed to generate dues'),
  });

  const markPaidMutation = useMutation({
    mutationFn: async ({ record, comment }) => {
      await createTransaction({
        memberId: record.memberId,
        amount: record.amount,
        type: 'maintenance',
        month: record.month,
        note: comment?.trim() || 'Marked as paid by admin',
      });
    },
    onSuccess: () => {
      message.success('Marked as paid');
      queryClient.invalidateQueries({ queryKey: ['dues'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['my-dues'] });
      queryClient.invalidateQueries({ queryKey: ['my-dues-list'] });
      queryClient.invalidateQueries({ queryKey: ['my-dues-pay'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setMarkPaidRecord(null);
      markPaidForm.resetFields();
    },
    onError: () => message.error('Failed to mark as paid'),
  });

  const handleMarkPaidSubmit = () => {
    markPaidForm.validateFields().then((values) => {
      markPaidMutation.mutate({ record: markPaidRecord, comment: values.comment });
    });
  };

  const columns = [
    { title: 'Member', dataIndex: 'memberName', key: 'memberName' },
    { title: 'Flat No.', dataIndex: 'flatNumber', key: 'flatNumber', width: 100 },
    { title: 'Month', dataIndex: 'month', key: 'month', render: (v) => formatMonth(v) },
    {
      title: 'Rate/flat',
      dataIndex: 'ratePerFlat',
      key: 'ratePerFlat',
      width: 110,
      render: (v) => (v != null ? formatCurrency(v) : '—'),
    },
    { title: 'Due Amount', dataIndex: 'amount', key: 'amount', render: (v) => formatCurrency(v) },
    { title: 'Paid Amount', dataIndex: 'paidAmount', key: 'paidAmount', render: (v) => formatCurrency(v) },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v) => <Tag color={STATUS_COLORS[v]}>{v?.toUpperCase()}</Tag>,
    },
    { title: 'Due Date', dataIndex: 'dueDate', key: 'dueDate', render: (v) => formatDate(v) },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) =>
        record.status !== 'paid' ? (
          <Button
            size="small"
            type="primary"
            icon={<CheckOutlined />}
            onClick={() => {
              markPaidForm.resetFields();
              setMarkPaidRecord(record);
            }}
          >
            Mark Paid
          </Button>
        ) : null,
    },
  ];

  return (
    <div>
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>Maintenance Dues</Title>
        <Button
          type="primary"
          icon={<CalendarOutlined />}
          onClick={() => setGenModalOpen(true)}
        >
          Generate Dues
        </Button>
      </div>

      <Space wrap style={{ marginBottom: 16 }}>
        <DatePicker
          picker="month"
          placeholder="Filter by month"
          onChange={(d) => { setFilters((f) => ({ ...f, month: d?.format('YYYY-MM') })); setPage(1); }}
        />
        <Select
          placeholder="Filter by status"
          allowClear
          style={{ width: 160 }}
          onChange={(v) => { setFilters((f) => ({ ...f, status: v })); setPage(1); }}
          options={[
            { value: 'unpaid', label: 'Unpaid' },
            { value: 'paid', label: 'Paid' },
            { value: 'partial', label: 'Partial' },
          ]}
        />
      </Space>

      <Table
        dataSource={data?.data || []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        scroll={{ x: 920 }}
        locale={{ emptyText: <EmptyState description="No dues found. Generate dues for a month." /> }}
        pagination={{
          current: page,
          pageSize: 20,
          total: data?.total || 0,
          onChange: setPage,
        }}
      />

      <Modal
        title="Generate Dues for Month"
        open={genModalOpen}
        onCancel={() => setGenModalOpen(false)}
        onOk={() => {
          if (!genMonth) { message.warning('Please select a month'); return; }
          generateMutation.mutate(genMonth.format('YYYY-MM'));
        }}
        confirmLoading={generateMutation.isPending}
        okText="Generate"
      >
        <p>Select the month to generate maintenance dues for all active members:</p>
        <DatePicker
          picker="month"
          style={{ width: '100%' }}
          value={genMonth}
          onChange={setGenMonth}
          disabledDate={(d) => d && d > dayjs().endOf('month')}
        />
      </Modal>

      <Modal
        title={markPaidRecord ? `Mark ${markPaidRecord.memberName}'s due as paid?` : 'Mark as paid'}
        open={Boolean(markPaidRecord)}
        onCancel={() => {
          setMarkPaidRecord(null);
          markPaidForm.resetFields();
        }}
        onOk={handleMarkPaidSubmit}
        confirmLoading={markPaidMutation.isPending}
        okText="Mark Paid"
        destroyOnClose
      >
        {markPaidRecord && (
          <>
            <Text type="secondary">
              Month: {formatMonth(markPaidRecord.month)} | Amount:{' '}
              {formatCurrency(markPaidRecord.amount)}
            </Text>
            <Form form={markPaidForm} layout="vertical" style={{ marginTop: 16 }}>
              <Form.Item name="comment" label="Comment (Optional)">
                <Input.TextArea rows={3} placeholder="Optional note for this payment" />
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </div>
  );
}
