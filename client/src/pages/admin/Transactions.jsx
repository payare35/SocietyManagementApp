import { useState } from 'react';
import {
  Table,
  Button,
  Select,
  Tag,
  Space,
  Modal,
  Form,
  Input,
  InputNumber,
  DatePicker,
  message,
  Tooltip,
  Typography,
} from 'antd';
import { PlusOutlined, CheckOutlined, CloseOutlined, PaperClipOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { fetchTransactions, createTransaction, updateTransactionStatus } from '../../api/transactions';
import { fetchMembers } from '../../api/members';
import { formatCurrency, formatDate, formatMonth } from '../../utils/formatters';
import { STATUS_COLORS, TRANSACTION_STATUS } from '../../utils/constants';
import FileUpload from '../../components/common/FileUpload';
import EmptyState from '../../components/common/EmptyState';
import FileViewerModal from '../../components/common/FileViewerModal';

const { Title } = Typography;

export default function Transactions() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [fileData, setFileData] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['transactions', filters, page],
    queryFn: () => fetchTransactions({ ...filters, page, limit: 20 }),
  });

  const { data: membersData } = useQuery({
    queryKey: ['members-all'],
    queryFn: () => fetchMembers({ limit: 500 }),
  });

  const createMutation = useMutation({
    mutationFn: (values) =>
      createTransaction({
        ...values,
        month: values.month?.format('YYYY-MM'),
        fileUrl: fileData?.filePath || null,
        fileName: fileData?.fileName || null,
      }),
    onSuccess: () => {
      message.success('Transaction recorded');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dues'] });
      queryClient.invalidateQueries({ queryKey: ['my-dues'] });
      queryClient.invalidateQueries({ queryKey: ['my-dues-list'] });
      queryClient.invalidateQueries({ queryKey: ['my-dues-pay'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setModalOpen(false);
      form.resetFields();
      setFileData(null);
    },
    onError: (err) => message.error(err.response?.data?.message || 'Failed to record transaction'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateTransactionStatus(id, status),
    onSuccess: () => {
      message.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['dues'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: () => message.error('Failed to update status'),
  });

  const handleStatusChange = (id, status, memberName) => {
    Modal.confirm({
      title: `${status === TRANSACTION_STATUS.CONFIRMED ? 'Confirm' : 'Reject'} this transaction?`,
      content: `For: ${memberName}`,
      onOk: () => statusMutation.mutate({ id, status }),
    });
  };

  const columns = [
    { title: 'Member', dataIndex: 'memberName', key: 'memberName' },
    { title: 'Flat No.', dataIndex: 'flatNumber', key: 'flatNumber', width: 90 },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (v) => formatCurrency(v) },
    { title: 'Type', dataIndex: 'type', key: 'type', render: (v) => <Tag>{v?.toUpperCase()}</Tag> },
    { title: 'Month', dataIndex: 'month', key: 'month', render: (v) => formatMonth(v) },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v) => <Tag color={STATUS_COLORS[v]}>{v?.toUpperCase()}</Tag>,
    },
    {
      title: 'Receipt',
      dataIndex: 'fileUrl',
      key: 'fileUrl',
      render: (url, record) =>
        url ? (
          <FileViewerModal filePath={url} fileName={record.fileName}>
            <Button size="small" type="link" icon={<PaperClipOutlined />}>
              View
            </Button>
          </FileViewerModal>
        ) : '-',
    },
    { title: 'Date', dataIndex: 'createdAt', key: 'createdAt', render: (v) => formatDate(v) },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) =>
        record.status === TRANSACTION_STATUS.PENDING ? (
          <Space>
            <Tooltip title="Confirm">
              <Button
                size="small"
                type="primary"
                icon={<CheckOutlined />}
                onClick={() => handleStatusChange(record.id, TRANSACTION_STATUS.CONFIRMED, record.memberName)}
              />
            </Tooltip>
            <Tooltip title="Reject">
              <Button
                size="small"
                danger
                icon={<CloseOutlined />}
                onClick={() => handleStatusChange(record.id, TRANSACTION_STATUS.REJECTED, record.memberName)}
              />
            </Tooltip>
          </Space>
        ) : null,
    },
  ];

  const memberOptions = (membersData?.data || []).map((m) => ({
    value: m.uid,
    label: `${m.name} - ${m.flatNumber}`,
  }));

  return (
    <div>
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>Transactions</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>
          Record Payment
        </Button>
      </div>

      <Space wrap style={{ marginBottom: 16 }}>
        <Select
          placeholder="Filter by status"
          allowClear
          style={{ width: 160 }}
          onChange={(v) => { setFilters((f) => ({ ...f, status: v })); setPage(1); }}
          options={[
            { value: 'pending', label: 'Pending' },
            { value: 'confirmed', label: 'Confirmed' },
            { value: 'rejected', label: 'Rejected' },
          ]}
        />
        <DatePicker
          picker="month"
          placeholder="Filter by month"
          onChange={(d) => { setFilters((f) => ({ ...f, month: d?.format('YYYY-MM') })); setPage(1); }}
        />
      </Space>

      <Table
        dataSource={data?.data || []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        scroll={{ x: 900 }}
        locale={{ emptyText: <EmptyState description="No transactions found" /> }}
        pagination={{
          current: page,
          pageSize: 20,
          total: data?.total || 0,
          onChange: setPage,
        }}
      />

      <Modal
        title="Record Payment"
        open={modalOpen}
        onCancel={() => { setModalOpen(false); form.resetFields(); setFileData(null); }}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={(v) => createMutation.mutate(v)}>
          <Form.Item
            name="memberId"
            label="Member"
            rules={[{ required: true, message: 'Select a member' }]}
          >
            <Select
              showSearch
              placeholder="Search member"
              options={memberOptions}
              filterOption={(input, option) =>
                option.label.toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
          <Form.Item
            name="amount"
            label="Amount (₹)"
            rules={[{ required: true, message: 'Amount is required' }]}
          >
            <InputNumber style={{ width: '100%' }} min={1} placeholder="0" />
          </Form.Item>
          <Form.Item
            name="type"
            label="Type"
            initialValue="maintenance"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { value: 'maintenance', label: 'Maintenance' },
                { value: 'penalty', label: 'Penalty' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="month"
            label="Month"
            rules={[{ required: true, message: 'Select the billing month' }]}
          >
            <DatePicker picker="month" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="note" label="Note (Optional)">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item label="Receipt Upload (Optional)">
            <FileUpload folder="transactions" onUpload={setFileData} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={createMutation.isPending} block>
              Record Payment
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
