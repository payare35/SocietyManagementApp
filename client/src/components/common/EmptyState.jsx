import { Empty, Button } from 'antd';

/**
 * @param {object} props
 * @param {string} [props.description]
 * @param {string} [props.buttonText]
 * @param {function} [props.onAction]
 */
export default function EmptyState({ description = 'No data found', buttonText, onAction }) {
  return (
    <Empty description={description}>
      {buttonText && onAction && (
        <Button type="primary" onClick={onAction}>
          {buttonText}
        </Button>
      )}
    </Empty>
  );
}
