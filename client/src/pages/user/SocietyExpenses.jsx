import { useState } from 'react';
import { Table, Tag, Button, Select, DatePicker, Space, Typography, Tooltip } from 'antd';
import { PaperClipOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { fetchExpenses } from '../../api/expenses';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { EXPENSE_TYPES, EXPENSE_TYPE_COLORS } from '../../utils/constants';
import EmptyState from '../../components/common/EmptyState';
import FileViewerModal from '../../components/common/FileViewerModal';

const { Title } = Typography;

export default function SocietyExpenses() {
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
    { title: 'Date', dataIndex: 'createdAt', key: 'createdAt', render: (v) => formatDate(v) },
    {
      title: 'Document',
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
        ) : '-',
    },
  ];

  return (
    <div>
      <Title level={3}>Society Expenses</Title>

      <Space wrap style={{ marginBottom: 16 }}>
        <Select
          placeholder="Filter by type"
          allowClear
          style={{ width: 180 }}
          onChange={(v) => { setTypeFilter(v); setPage(1); }}
          options={EXPENSE_TYPES.map((t) => ({ value: t, label: t }))}
        />
        <DatePicker.RangePicker
          onChange={(dates) => { setDateRange(dates ? dates.map((d) => d.toDate()) : null); setPage(1); }}
        />
      </Space>

      <Table
        dataSource={data?.data || []}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        scroll={{ x: 600 }}
        locale={{ emptyText: <EmptyState description="No expenses recorded yet" /> }}
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
