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

import Asterisk from '@spectrum-icons/ui/Asterisk';
import {classNames, useDOMRef, useStyleProps} from '@react-spectrum/utils';
import {DOMRef} from '@react-types/shared';
import {filterDOMProps} from '@react-aria/utils';
// @ts-ignore
import intlMessages from '../intl/*.json';
import React from 'react';
import {SpectrumLabelProps} from '@react-types/label';
import styles from '@adobe/spectrum-css-temp/components/fieldlabel/vars.css';
import {useMessageFormatter} from '@react-aria/i18n';
import {useProviderProps} from '@react-spectrum/provider';

function Label(props: SpectrumLabelProps, ref: DOMRef<HTMLLabelElement>) {
  props = useProviderProps(props);
  let {
    children,
    labelPosition = 'top',
    labelAlign = labelPosition === 'side' ? 'start' : null,
    isRequired,
    necessityIndicator = isRequired != null ? 'icon' : null,
    includeNecessityIndicatorInAccessibilityName = false,
    htmlFor,
    for: labelFor,
    elementType: ElementType = 'label',
    onClick,
    isQuiet,
    ...otherProps
  } = props;

  let domRef = useDOMRef(ref);
  let {styleProps} = useStyleProps(otherProps);

  let formatMessage = useMessageFormatter(intlMessages);
  let necessityLabel = isRequired ? formatMessage('(required)') : formatMessage('(optional)');
  let icon = (
    <Asterisk
      UNSAFE_className={classNames(styles, 'spectrum-FieldLabel-requiredIcon')}
      aria-label={includeNecessityIndicatorInAccessibilityName ? formatMessage('(required)') : undefined} />
  );

  let labelClassNames = classNames(
    styles,
    'spectrum-FieldLabel',
    {
      'spectrum-FieldLabel--positionSide': labelPosition === 'side',
      'spectrum-FieldLabel--alignEnd': labelAlign === 'end',
      'spectrum-FieldLabel--quiet': isQuiet
    },
    styleProps.className
  );

  return (
    <ElementType
      {...filterDOMProps(otherProps)}
      {...styleProps}
      onClick={onClick}
      ref={domRef}
      className={labelClassNames}
      htmlFor={ElementType === 'label' ? labelFor || htmlFor : undefined}>
      {children}
      {necessityIndicator && ' \u200b'}
      {/* necessityLabel is hidden to screen readers if the field is required because
        * aria-required is set on the field in that case. That will already be announced,
        * so no need to duplicate it here. If optional, we do want it to be announced here. */}
      {necessityIndicator === 'label' && <span aria-hidden={!includeNecessityIndicatorInAccessibilityName ? isRequired : undefined}>{necessityLabel}</span>}
      {necessityIndicator === 'icon' && isRequired && icon}
    </ElementType>
  );
}

let _Label = React.forwardRef(Label);
export {_Label as Label};
