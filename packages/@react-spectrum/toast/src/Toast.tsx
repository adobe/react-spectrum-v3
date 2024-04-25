/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import AlertMedium from '@spectrum-icons/ui/AlertMedium';
import {Button, ClearButton} from '@react-spectrum/button';
import {classNames, useDOMRef, useStyleProps} from '@react-spectrum/utils';
import CrossMedium from '@spectrum-icons/ui/CrossMedium';
import {DOMRef} from '@react-types/shared';
import InfoMedium from '@spectrum-icons/ui/InfoMedium';
// @ts-ignore
import intlMessages from '../intl/*.json';
import {QueuedToast, ToastState} from '@react-stately/toast';
import React, {useContext} from 'react';
import styles from '@adobe/spectrum-css-temp/components/toast/vars.css';
import SuccessMedium from '@spectrum-icons/ui/SuccessMedium';
import toastContainerStyles from './toastContainer.css';
import {ToasterContext} from './Toaster';
import {useLocalizedStringFormatter} from '@react-aria/i18n';
import {useToast} from '@react-aria/toast';

export interface SpectrumToastValue {
  children: string | React.ReactNode,
  variant: 'positive' | 'negative' | 'info' | 'neutral',
  actionLabel?: string,
  onAction?: () => void,
  shouldCloseOnAction?: boolean
}

export interface SpectrumToastProps {
  toast: QueuedToast<SpectrumToastValue>,
  state: ToastState<SpectrumToastValue>
}

// TODO: express should use filled icons...
export const ICONS = {
  info: InfoMedium,
  negative: AlertMedium,
  positive: SuccessMedium
};

function Toast(props: SpectrumToastProps, ref: DOMRef<HTMLDivElement>) {
  let {
    toast: {
      key,
      animation,
      content: {
        children,
        variant,
        actionLabel,
        onAction,
        shouldCloseOnAction
      }
    },
    state,
    ...otherProps
  } = props;
  let domRef = useDOMRef(ref);
  let {
    closeButtonProps,
    titleProps,
    toastProps
  } = useToast(props, state, domRef);
  let {styleProps} = useStyleProps(otherProps);

  let stringFormatter = useLocalizedStringFormatter(intlMessages, '@react-spectrum/toast');
  let iconLabel = variant && variant !== 'neutral' ? stringFormatter.format(variant) : null;
  let Icon = ICONS[variant];
  let isFocusVisible = useContext(ToasterContext);

  const handleAction = () => {
    if (onAction) {
      onAction();
    }

    if (shouldCloseOnAction) {
      state.close(key);
    }
  };

  return (
    <div
      {...styleProps}
      {...toastProps}
      ref={domRef}
      className={classNames(styles,
        'spectrum-Toast',
        {['spectrum-Toast--' + variant]: variant},
        styleProps.className,
        classNames(
          toastContainerStyles,
          'spectrum-Toast',
          {'focus-ring': props.toast.key === state.visibleToasts[0]?.key && isFocusVisible}
        )
      )}
      style={{
        ...styleProps.style,
        zIndex: props.toast.priority
      }}
      data-animation={animation}
      onAnimationEnd={() => {
        if (animation === 'exiting') {
          state.remove(key);
        }
      }}>
      {Icon &&
        <Icon
          aria-label={iconLabel}
          UNSAFE_className={classNames(styles, 'spectrum-Toast-typeIcon')} />
      }
      <div className={classNames(styles, 'spectrum-Toast-body')}>
        <div className={classNames(styles, 'spectrum-Toast-content')} {...titleProps}>{children}</div>
        {actionLabel &&
          <Button
            onPress={handleAction}
            UNSAFE_className={classNames(styles, 'spectrum-Button')}
            variant="secondary"
            staticColor="white">
            {actionLabel}
          </Button>
        }
      </div>
      <div className={classNames(styles, 'spectrum-Toast-buttons')}>
        <ClearButton {...closeButtonProps} variant="overBackground">
          <CrossMedium />
        </ClearButton>
      </div>
    </div>
  );
}

let _Toast = React.forwardRef(Toast);
export {_Toast as Toast};
