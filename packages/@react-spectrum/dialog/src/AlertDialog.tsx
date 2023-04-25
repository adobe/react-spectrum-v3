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
import {AlertDialogContext, DialogContext, DialogContextValue} from './context';
import AlertMedium from '@spectrum-icons/ui/AlertMedium';
import {Button} from '@react-spectrum/button';
import {ButtonGroup} from '@react-spectrum/buttongroup';
import {chain} from '@react-aria/utils';
import {classNames, useStyleProps} from '@react-spectrum/utils';
import {Content} from '@react-spectrum/view';
import {Dialog} from './Dialog';
import {Divider} from '@react-spectrum/divider';
import {DOMRef} from '@react-types/shared';
import {Heading} from '@react-spectrum/text';
// @ts-ignore
import intlMessages from '../intl/*.json';
import React, {forwardRef, useContext} from 'react';
import {SpectrumAlertDialogProps} from '@react-types/dialog';
import {SpectrumButtonProps} from '@react-types/button';
import styles from '@adobe/spectrum-css-temp/components/dialog/vars.css';
import {useLocalizedStringFormatter} from '@react-aria/i18n';
import {useObjectRef} from '@react-aria/utils';
/**
 * AlertDialogs are a specific type of Dialog. They display important information that users need to acknowledge.
 */
function AlertDialog(props: SpectrumAlertDialogProps, ref: DOMRef) {
  let {
    onClose = () => {}
  } = useContext(DialogContext) || {} as DialogContextValue;

  let {
    variant,
    children,
    primaryActionLabel,
    secondaryActionLabel,
    cancelLabel,
    autoFocusButton,
    title,
    isPrimaryActionDisabled,
    isSecondaryActionDisabled,
    allowsKeyboardConfirmation,
    onCancel = () => {},
    onPrimaryAction = () => {},
    onSecondaryAction = () => {},
    ...otherProps
  } = props;
  let {styleProps} = useStyleProps(otherProps);
  let stringFormatter = useLocalizedStringFormatter(intlMessages);
  let dialogRef = useObjectRef(ref);

  let confirmVariant: SpectrumButtonProps['variant'] = 'primary';
  if (variant) {
    if (variant === 'confirmation') {
      confirmVariant = 'cta';
    } else if (variant === 'destructive') {
      confirmVariant = 'negative';
    }
  }

  let onKeyDown = (e) => {
    let dialogNode: HTMLElement = dialogRef.current.UNSAFE_getDOMNode();
    if (e.key === 'Enter' && allowsKeyboardConfirmation && dialogNode === e.target) {
      e.stopPropagation();
      e.preventDefault();
      onPrimaryAction();
      onClose();
    }
  };

  return (
    <AlertDialogContext.Provider value={{onKeyDown}}>
      <Dialog
        UNSAFE_style={styleProps.style}
        UNSAFE_className={classNames(styles, {[`spectrum-Dialog--${variant}`]: variant}, styleProps.className)}
        isHidden={styleProps.hidden}
        size="M"
        role="alertdialog"
        ref={dialogRef}>
        <Heading>{title}</Heading>
        {(variant === 'error' || variant === 'warning') &&
          <AlertMedium
            slot="typeIcon"
            aria-label={stringFormatter.format('alert')} />
        }
        <Divider />
        <Content>{children}</Content>
        <ButtonGroup align="end">
          {cancelLabel &&
            <Button
              variant="secondary"
              onPress={() => chain(onClose(), onCancel())}
              autoFocus={autoFocusButton === 'cancel'}>
              {cancelLabel}
            </Button>
          }
          {secondaryActionLabel &&
            <Button
              variant="secondary"
              onPress={() => chain(onClose(), onSecondaryAction())}
              isDisabled={isSecondaryActionDisabled}
              autoFocus={autoFocusButton === 'secondary'}>
              {secondaryActionLabel}
            </Button>
          }
          <Button
            variant={confirmVariant}
            onPress={() => chain(onClose(), onPrimaryAction())}
            isDisabled={isPrimaryActionDisabled}
            autoFocus={autoFocusButton === 'primary'}>
            {primaryActionLabel}
          </Button>
        </ButtonGroup>
      </Dialog>
    </AlertDialogContext.Provider>
  );
}

/**
 * AlertDialogs are a specific type of Dialog. They display important information that users need to acknowledge.
 */
let _AlertDialog = forwardRef(AlertDialog);
export {_AlertDialog as AlertDialog};
