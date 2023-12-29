/**
 * index.tsx
 *
 * sobird<i@sobird.me> at 2023/12/28 16:22:10 created.
 */

import React from 'react';
import {
  Button, Form, Row, Col, ButtonProps, ColProps,
} from 'antd';

interface SubmitterButtonProps extends ButtonProps {
  text?: React.ReactNode;
}

export interface SubmitterProps<T = Record<string, any>> {
  labelCol?: ColProps;
  wrapperCol?: ColProps;
  reversed?: boolean;
  submitButtonProps?: false | SubmitterButtonProps;
  resetButtonProps?: false | SubmitterButtonProps;
  render?:
  | ((
    props: SubmitterProps & T,
    dom: JSX.Element[],
  ) => React.ReactNode[] | React.ReactNode | false)
  | false;
}

const Submitter: React.FC<SubmitterProps> = ({
  submitButtonProps = {},
  resetButtonProps = {},
  reversed,
  render,
  labelCol,
  wrapperCol,
}) => {
  const form = Form.useFormInstance();
  if (render === false) {
    return null;
  }

  const buttonDom: JSX.Element[] = [];

  if (submitButtonProps !== false) {
    const { text = '提交' } = submitButtonProps;
    buttonDom.push(
      <Button
        type="primary"
        key="submit"
        htmlType="submit"
        {...submitButtonProps}
      >
        {text}
      </Button>,
    );
  }

  if (resetButtonProps !== false) {
    const { text = '重置' } = resetButtonProps;
    buttonDom.push(
      <Button
        key="reset"
        htmlType="reset"
        {...resetButtonProps}
      >
        {text}
      </Button>,
    );
  }

  if (reversed) {
    buttonDom.reverse();
  }

  const renderDom = render ? render({ form }, buttonDom) : buttonDom;
  if (!renderDom) {
    return null;
  }

  return (
    <Row gutter={5}>
      {labelCol && (<Col {...labelCol} />)}
      <Col {...wrapperCol} style={{ display: 'flex', gap: 8 }}>{renderDom}</Col>
    </Row>
  );
};

export default Submitter;
