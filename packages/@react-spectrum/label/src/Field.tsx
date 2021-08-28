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

import {classNames, useStyleProps} from '@react-spectrum/utils';
import {Flex} from '@react-spectrum/layout';
import {HelpText} from './HelpText';
import {Label} from './Label';
import {LabelPosition} from '@react-types/shared';
import labelStyles from '@adobe/spectrum-css-temp/components/fieldlabel/vars.css';
import {mergeProps} from '@react-aria/utils';
import React, {RefObject} from 'react';
import {SpectrumFieldProps} from '@react-types/label';

function Field(props: SpectrumFieldProps, ref: RefObject<HTMLElement>) {
  let {
    label,
    labelPosition = 'top' as LabelPosition,
    labelAlign,
    isRequired,
    necessityIndicator,
    includeNecessityIndicatorInAccessibilityName,
    validationState,
    description,
    errorMessage,
    isDisabled,
    showErrorIcon,
    children,
    labelProps,
    // Not every component that uses <Field> supports help text.
    descriptionProps = {},
    errorMessageProps = {},
    elementType,
    wrapperClassName,

    ...otherProps
  } = props;
  let {styleProps} = useStyleProps(otherProps);
  let hasHelpText = !!description || errorMessage && validationState === 'invalid';

  if (label || hasHelpText) {
    let labelWrapperClass = classNames(
      labelStyles,
      'spectrum-Field',
      {
        'spectrum-Field--positionTop': labelPosition === 'top',
        'spectrum-Field--positionSide': labelPosition === 'side'
      },
      styleProps.className,
      wrapperClassName
    );

    children = React.cloneElement(children, mergeProps(children.props, {
      className: classNames(
        labelStyles,
        'spectrum-Field-field'
      )
    }));

    let renderHelpText = () => (
      <HelpText
        descriptionProps={descriptionProps}
        errorMessageProps={errorMessageProps}
        description={description}
        errorMessage={errorMessage}
        validationState={validationState}
        isDisabled={isDisabled}
        labelAlign={labelAlign}
        showErrorIcon={showErrorIcon} />
    );

    let renderChildren = () => {
      if (hasHelpText) {
        if (labelPosition === 'side') {
          return (
            <Flex direction="column" UNSAFE_className={classNames(labelStyles, 'spectrum-Field-wrapper')}>
              {children}
              {renderHelpText()}
            </Flex>
          );
        }

        return (
          <>
            {children}
            {renderHelpText()}
          </>
        );
      }

      return children;
    };

    return (
      <div
        {...styleProps}
        ref={ref as RefObject<HTMLDivElement>}
        className={labelWrapperClass}>
        {label && (
          <Label
            {...labelProps}
            labelPosition={labelPosition}
            labelAlign={labelAlign}
            isRequired={isRequired}
            necessityIndicator={necessityIndicator}
            includeNecessityIndicatorInAccessibilityName={includeNecessityIndicatorInAccessibilityName}
            elementType={elementType}>
            {label}
          </Label>
        )}
        {renderChildren()}
      </div>
    );
  }

  return React.cloneElement(children, mergeProps(children.props, {
    ...styleProps,
    ref
  }));
}

let _Field = React.forwardRef(Field);
export {_Field as Field};
