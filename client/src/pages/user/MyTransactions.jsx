import { useState } from 'react';
import { Table, Tag, Button, Typography, Tooltip } from 'antd';
import { PaperClipOutlined, RedoOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchMyTransactions } from '../../api/transactions';
import { formatCurrency, formatDate, formatMonth } from '../../utils/formatters';
import { STATUS_COLORS } from '../../utils/constants';
import EmptyState from '../../components/common/EmptyState';
import FileViewerModal from '../../components/common/FileViewerModal';

const { Title } = Typography;

export default function MyTransactions() {
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['my-transactions', page],
    queryFn: () => fetchMyTransactions({ page, limit: 20 }),
  });

  const columns = [
    { title: 'Date', dataIndex: 'createdAt', key: 'createdAt', render: (v) => formatDate(v) },
    { title: 'Amount', dataIndex: 'amount', key: 'amount', render: (v) => <strong>{formatCurrency(v)}</strong> },
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
    {
      title: 'Note',
      dataIndex: 'note',
      key: 'note',
      render: (v) => v || '-',
    },
    {
      title: 'Action',
      key: 'action',
      width: 100,
      render: (_, record) =>
        record.status === 'rejected' ? (
          <Tooltip title="Re-submit payment for this month">
            <Button
              size="small"
              type="primary"
              icon={<RedoOutlined />}
              onClick={() => navigate('/pay', { state: { due: { month: record.month, amount: record.amount, paidAmount: 0, status: 'unpaid' } } })}
            >
              Retry
            </Button>
          </Tooltip>
        ) : null,
    },
  ];

  return (
    <div>
      <Title level={3}>My Transactions</Title>
      <Table
        dataSource={data?.data || []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        scroll={{ x: 750 }}
        locale={{
          emptyText: (
            <EmptyState
              description="No transactions yet"
              buttonText="Pay Maintenance"
              onAction={() => navigate('/pay')}
            />
          ),
        }}
        pagination={{
          current: page,
          pageSize: 20,
          total: data?.total || 0,
          onChange: setPage,
          showTotal: (t) => `${t} transactions`,
        }}
      />
    </div>
  );
}
