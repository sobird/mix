/**
 * 验证码表单输入字段
 *
 * sobird<i@sobird.me> at 2023/10/29 18:20:51 created.
 */

import React, { useState } from 'react';
import {
  Button, Form, Input, ButtonProps, InputProps,
} from 'antd';
import type { NamePath } from 'antd/lib/form/interface';
import useInterval from '@/hooks/useInterval';
import { sendCaptchaEmail } from '@/actions/auth';

export type FieldCaptchaProps = {
  value?: InputProps['value'];
  onChange?: InputProps['onChange'];

  /** 倒计时的秒数 */
  countDown?: number;
  /** 手机号的 name */
  identifierName?: NamePath;
  /** 获取验证码的方法 */
  onCaptcha?: (mobile: string) => Promise<void>;
  /** 渲染按钮的文字 */
  buttonTextRender?: (count: number) => React.ReactNode;
  /** 获取验证码按钮的props */
  buttonProps?: ButtonProps;

  /** 内部字段属性 */
  fieldProps?: {
    style?: React.CSSProperties;
    width?: string;
    placeholder?: string;
  }
};

const FieldCaptcha: React.FC<FieldCaptchaProps> = ({
  value,
  onChange,
  countDown,
  identifierName = 'identifier',
  onCaptcha = async (mobile) => {
    await sendCaptchaEmail(mobile);
  },
  buttonTextRender = (count) => {
    return count ? `${count} 秒后重新获取` : '获取验证码';
  },
  buttonProps,
  fieldProps,
}) => {
  const form = Form.useFormInstance();
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>();
  const resumeInterval = useInterval(() => {
    setCount((prevState) => {
      if (prevState <= 1) {
        resumeInterval(null);
      }
      return prevState - 1;
    });
  });

  const onGetCaptcha = async (mobile: string) => {
    try {
      setLoading(true);
      await onCaptcha(mobile);
      setLoading(false);
      setCount(countDown || 60);
      resumeInterval(1000);
    } catch (error) {
      setLoading(false);
      resumeInterval(null);
      console.log(error);
    }
  };

  return (
    <div
      style={{
        // ...fieldProps?.style,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Input
        value={value}
        onChange={onChange}
        {...fieldProps}
        style={{
          flex: 1,
          transition: 'width .3s',
          marginRight: 8,
        }}
      />
      <Button
        style={{
          display: 'block',
        }}
        size="small"
        type="link"
        disabled={count > 0}
        loading={loading}
        {...buttonProps}
        onClick={async () => {
          try {
            if (identifierName) {
              await form.validateFields([identifierName].flat(1) as string[]);
              const mobile = form.getFieldValue(
                [identifierName].flat(1) as string[],
              );
              await onGetCaptcha(mobile);
            } else {
              await onGetCaptcha('');
            }
          } catch (error) {
            // eslint-disable-next-line no-console
            console.log(error);
          }
        }}
      >
        {buttonTextRender(count)}
      </Button>
    </div>
  );
};

export default FieldCaptcha;
