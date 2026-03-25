import { useState } from 'react';
import { Table, Button, Input, Tag, Space, Modal, message, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, StopOutlined } from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { fetchMembers, deleteMember } from '../../api/members';
import { STATUS_COLORS } from '../../utils/constants';
import EmptyState from '../../components/common/EmptyState';

const { Search } = Input;

export default function Members() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['members', search, page],
    queryFn: () => fetchMembers({ search, page, limit: 20 }),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id) => deleteMember(id),
    onSuccess: () => {
      message.success('Member deactivated');
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
    onError: () => message.error('Failed to deactivate member'),
  });

  const handleDeactivate = (record) => {
    Modal.confirm({
      title: `Deactivate ${record.name}?`,
      content: 'This will prevent the member from logging in.',
      okText: 'Deactivate',
      okType: 'danger',
      onOk: () => deactivateMutation.mutate(record.uid),
    });
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Flat No.', dataIndex: 'flatNumber', key: 'flatNumber', width: 100 },
    { title: 'Contact', dataIndex: 'contactNumber', key: 'contactNumber' },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      render: (v) => v || '-',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (v) => <Tag color={v === 'admin' ? 'blue' : 'default'}>{v?.toUpperCase()}</Tag>,
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (v) => (
        <Tag color={STATUS_COLORS[v ? 'active' : 'inactive']}>{v ? 'ACTIVE' : 'INACTIVE'}</Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Tooltip title="Edit">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => navigate(`/admin/members/${record.uid}/edit`)}
            />
          </Tooltip>
          {record.isActive && (
            <Tooltip title="Deactivate">
              <Button
                size="small"
                danger
                icon={<StopOutlined />}
                onClick={() => handleDeactivate(record)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h2 style={{ margin: 0 }}>Members</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/admin/members/new')}
        >
          Add Member
        </Button>
      </div>

      <Search
        placeholder="Search by name or flat number"
        allowClear
        onSearch={(v) => { setSearch(v); setPage(1); }}
        onChange={(e) => { if (!e.target.value) { setSearch(''); setPage(1); } }}
        style={{ marginBottom: 16, maxWidth: 400 }}
      />

      <Table
        dataSource={data?.data || []}
        columns={columns}
        rowKey="uid"
        loading={isLoading}
        scroll={{ x: 700 }}
        locale={{ emptyText: <EmptyState description="No members found" /> }}
        pagination={{
          current: page,
          pageSize: 20,
          total: data?.total || 0,
          onChange: setPage,
          showTotal: (t) => `${t} members`,
        }}
      />
    </div>
  );
}
