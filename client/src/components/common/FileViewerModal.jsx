import { useState, useRef } from 'react';
import { Modal, Spin, Button, message as antMessage } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { fetchFileAsBlob } from '../../api/files';

/**
 * Wraps any trigger element (children) and shows the file in a dialog.
 *
 * – For new private files (GCS paths):  streams through the authenticated
 *   backend, creates a transient blob URL that disappears when the modal
 *   closes.  Copying the blob URL to another tab produces a dead link.
 *
 * – For legacy public URLs (starts with "http"):  opens in a new tab
 *   to preserve backward compatibility.
 *
 * Props:
 *   filePath  {string}   GCS path or legacy http URL
 *   fileName  {string}   Used as modal title and download filename
 *   children  {ReactNode} The clickable trigger (e.g. a Button)
 */
export default function FileViewerModal({ filePath, fileName, children }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [blobUrl, setBlobUrl] = useState(null);
  const [mimeType, setMimeType] = useState(null);
  const blobRef = useRef(null);

  const handleOpen = async () => {
    // Legacy public URLs — just open externally
    if (!filePath || filePath.startsWith('http')) {
      if (filePath) window.open(filePath, '_blank');
      return;
    }

    setOpen(true);
    setLoading(true);

    try {
      const blob = await fetchFileAsBlob(filePath);
      const url = URL.createObjectURL(blob);
      blobRef.current = url;
      setBlobUrl(url);
      setMimeType(blob.type);
    } catch {
      antMessage.error('Could not load file. Please try again.');
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    if (blobRef.current) {
      URL.revokeObjectURL(blobRef.current);
      blobRef.current = null;
      setBlobUrl(null);
      setMimeType(null);
    }
  };

  const isImage = mimeType?.startsWith('image/');
  const isPdf = mimeType === 'application/pdf';
  const displayName = fileName || 'File Preview';

  return (
    <>
      <span
        role="button"
        tabIndex={0}
        style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}
        onClick={handleOpen}
        onKeyDown={(e) => e.key === 'Enter' && handleOpen()}
      >
        {children}
      </span>

      <Modal
        open={open}
        onCancel={handleClose}
        title={displayName}
        footer={
          blobUrl
            ? [
                <Button
                  key="download"
                  icon={<DownloadOutlined />}
                  href={blobUrl}
                  download={displayName}
                  type="default"
                >
                  Download
                </Button>,
                <Button key="close" type="primary" onClick={handleClose}>
                  Close
                </Button>,
              ]
            : null
        }
        width={860}
        centered
        destroyOnClose
        styles={{ body: { padding: loading || !blobUrl ? '40px 24px' : '0', minHeight: 200 } }}
      >
        {loading && (
          <div style={{ textAlign: 'center' }}>
            <Spin size="large" tip="Loading file…" />
          </div>
        )}

        {!loading && blobUrl && isImage && (
          <img
            src={blobUrl}
            alt={displayName}
            style={{ width: '100%', maxHeight: '72vh', objectFit: 'contain', display: 'block' }}
          />
        )}

        {!loading && blobUrl && isPdf && (
          <iframe
            src={blobUrl}
            title={displayName}
            style={{ width: '100%', height: '72vh', border: 'none', display: 'block' }}
          />
        )}

        {!loading && blobUrl && !isImage && !isPdf && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ marginBottom: 12, color: '#64748b' }}>
              Preview is not available for this file type.
            </p>
            <Button icon={<DownloadOutlined />} href={blobUrl} download={displayName} type="primary">
              Download {displayName}
            </Button>
          </div>
        )}
      </Modal>
    </>
  );
}
