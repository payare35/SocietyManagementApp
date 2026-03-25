import { Spin } from 'antd';

export default function Loader({ fullScreen = false }) {
  if (fullScreen) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Spin size="large" />
      </div>
    );
  }
  return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <Spin size="large" />
    </div>
  );
}
