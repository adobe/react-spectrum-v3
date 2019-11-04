import Alert from '@spectrum-icons/workflow/Alert';
import Checkmark from '@spectrum-icons/workflow/Checkmark';
import {classNames, cloneIcon, filterDOMProps} from '@react-spectrum/utils';
import {FocusRing} from '@react-aria/focus';
import React, {forwardRef, RefObject} from 'react';
import {SpectrumTextFieldProps} from './types';
import styles from '@adobe/spectrum-css-temp/components/textfield/vars.css';
import {useProviderProps} from '@react-spectrum/provider';
import {useTextField} from '@react-aria/textfield';

export const TextField = forwardRef((props: SpectrumTextFieldProps, ref: RefObject<HTMLInputElement & HTMLTextAreaElement>) => {
  props = useProviderProps(props);
  let {
    validationState,
    icon,
    isQuiet = false,
    className,
    multiLine,
    isDisabled = false,
    value,
    defaultValue,
    ...otherProps
  } = props;
  
  let {textFieldProps} = useTextField(props);
  let ElementType: React.ElementType = multiLine ? 'textarea' : 'input';
  let isInvalid = validationState === 'invalid';

  if (icon) {
    icon = cloneIcon(icon, {
      className: classNames(
        styles,
        'spectrum-Textfield-icon',
        {
          'disabled': isDisabled
        }
      ),
      size: 'S'
    });
  } 

  let validationIcon = isInvalid ? <Alert /> : <Checkmark />;
  let validation = cloneIcon(validationIcon, {
    className: classNames(
      styles,
      'spectrum-Textfield-validationIcon',
      {
        'is-invalid': isInvalid,
        'is-valid': validationState === 'valid'
      }
    )
  });

  let component = (
    <div
      className={
        classNames(
          styles,
          'spectrum-Textfield',
          {
            'is-invalid': isInvalid,
            'is-valid': validationState === 'valid',
            'spectrum-Textfield--quiet': isQuiet,
            'spectrum-Textfield--multiline': multiLine
          }
        )
      }>
      <FocusRing focusRingClass={classNames(styles, 'focus-ring')}>
        <ElementType
          {...filterDOMProps(otherProps, {
            value: false,
            defaultValue: false,
            onChange: false
          })}
          {...textFieldProps}
          ref={ref}
          value={value}
          defaultValue={defaultValue}
          className={
            classNames(
              styles,
              'spectrum-Textfield-input',
              {
                'spectrum-Textfield-inputIcon': icon
              },
              className
            )
          } /> 
      </FocusRing> 
      {icon}
      {validationState ? validation : null}
    </div>
  );

  return component;
});
