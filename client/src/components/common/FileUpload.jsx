import { useState } from 'react';
import { Upload, Button, Space, Typography, message } from 'antd';
import { InboxOutlined, PaperClipOutlined, DeleteOutlined } from '@ant-design/icons';
import { uploadFile } from '../../api/upload';

const { Dragger } = Upload;
const { Text } = Typography;

/**
 * @param {object} props
 * @param {string} props.folder - Storage folder name
 * @param {function} props.onUpload - Called with { fileUrl, fileName } on success, null on clear
 * @param {string} [props.label]
 */
export default function FileUpload({ folder = 'general', onUpload, label }) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);

  const beforeUpload = async (file) => {
    const allowed = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowed.includes(file.type)) {
      message.error('Only JPG, PNG, and PDF files are allowed');
      return Upload.LIST_IGNORE;
    }
    if (file.size > 5 * 1024 * 1024) {
      message.error('File must be smaller than 5MB');
      return Upload.LIST_IGNORE;
    }

    setUploading(true);
    try {
      const result = await uploadFile(file, folder);
      setUploadedFile(result);
      onUpload(result);
      message.success(`${file.name} uploaded`);
    } catch {
      message.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleClear = () => {
    setUploadedFile(null);
    onUpload(null);
  };

  if (uploadedFile) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 12px',
          border: '1px solid #C7D2FE',
          borderRadius: 8,
          background: '#EEF2FF',
        }}
      >
        <PaperClipOutlined style={{ color: '#4F46E5' }} />
        <Text
          style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 13 }}
          title={uploadedFile.fileName}
        >
          {uploadedFile.fileName}
        </Text>
        <Button
          type="text"
          size="small"
          icon={<DeleteOutlined />}
          onClick={handleClear}
          style={{ color: '#64748B', flexShrink: 0 }}
          title="Remove file"
        />
      </div>
    );
  }

  return (
    <Dragger
      beforeUpload={beforeUpload}
      showUploadList={false}
      disabled={uploading}
      accept=".jpg,.jpeg,.png,.pdf"
      style={{ borderColor: '#C7D2FE' }}
    >
      <p className="ant-upload-drag-icon">
        <InboxOutlined style={{ color: '#4F46E5' }} />
      </p>
      <p className="ant-upload-text">{label || 'Click or drag file to upload'}</p>
      <p className="ant-upload-hint">JPG, PNG, PDF · max 5 MB</p>
    </Dragger>
  );
}
