import { useState } from 'react';
import {
  Table,
  Button,
  Select,
  DatePicker,
  Space,
  Tag,
  Modal,
  message,
  Tooltip,
  Typography,
} from 'antd';
import { PlusOutlined, DeleteOutlined, PaperClipOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { fetchExpenses, deleteExpense } from '../../api/expenses';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { EXPENSE_TYPES, EXPENSE_TYPE_COLORS } from '../../utils/constants';
import EmptyState from '../../components/common/EmptyState';
import FileViewerModal from '../../components/common/FileViewerModal';

const { RangePicker } = DatePicker;
const { Title } = Typography;

export default function Expenses() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [typeFilter, setTypeFilter] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['expenses', typeFilter, dateRange, page],
    queryFn: () =>
      fetchExpenses({
        type: typeFilter,
        startDate: dateRange?.[0]?.toISOString(),
        endDate: dateRange?.[1]?.toISOString(),
        page,
        limit: 20,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteExpense,
    onSuccess: () => {
      message.success('Expense deleted');
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
    },
    onError: () => message.error('Failed to delete expense'),
  });

  const handleDelete = (record) => {
    Modal.confirm({
      title: `Delete expense "${record.title}"?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: () => deleteMutation.mutate(record.id),
    });
  };

  const columns = [
    { title: 'Title', dataIndex: 'title', key: 'title' },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (v) => <Tag color={EXPENSE_TYPE_COLORS[v] || 'default'}>{v}</Tag>,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (v) => <strong>{formatCurrency(v)}</strong>,
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v) => formatDate(v),
    },
    {
      title: 'Attachment',
      dataIndex: 'fileUrl',
      key: 'fileUrl',
      render: (url, record) =>
        url ? (
          <FileViewerModal filePath={url} fileName={record.fileName}>
            <Tooltip title={record.fileName}>
              <Button size="small" type="link" icon={<PaperClipOutlined />}>
                View
              </Button>
            </Tooltip>
          </FileViewerModal>
        ) : (
          '-'
        ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_, record) => (
        <Button
          size="small"
          danger
          icon={<DeleteOutlined />}
          onClick={() => handleDelete(record)}
        />
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <Title level={3} style={{ margin: 0 }}>Expenses</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/admin/expenses/new')}
        >
          Add Expense
        </Button>
      </div>

      <Space wrap style={{ marginBottom: 16 }}>
        <Select
          placeholder="Filter by type"
          allowClear
          style={{ width: 180 }}
          onChange={(v) => { setTypeFilter(v); setPage(1); }}
          options={EXPENSE_TYPES.map((t) => ({ value: t, label: t }))}
        />
        <RangePicker onChange={(dates) => { setDateRange(dates ? dates.map((d) => d.toDate()) : null); setPage(1); }} />
      </Space>

      <Table
        dataSource={data?.data || []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        scroll={{ x: 700 }}
        locale={{ emptyText: <EmptyState description="No expenses found" /> }}
        pagination={{
          current: page,
          pageSize: 20,
          total: data?.total || 0,
          onChange: setPage,
          showTotal: (t) => `${t} expenses`,
        }}
      />
    </div>
  );
}
