import {classNames, DOMRef} from '@react-spectrum/utils';
import {FieldLabelProps} from './types';
import {LabelBase} from './LabelBase';
import React, {forwardRef} from 'react';
import styles from '@adobe/spectrum-css-temp/components/fieldlabel/vars.css';

function FieldLabel(props: FieldLabelProps, ref: DOMRef<HTMLLabelElement & HTMLDivElement>) {
  let {label, labelAlign, labelFor, labelPosition, children, ...otherProps} = props;
  let labelClassNames = classNames(
    styles,
    'spectrum-FieldLabel',
    {
      'spectrum-FieldLabel--alignEnd': labelAlign === 'end',
      'spectrum-FieldLabel--positionSide': labelPosition === 'side'
    }
  );

  return (
    <LabelBase
      {...otherProps}
      label={label}
      labelClassName={labelClassNames}
      labelFor={labelFor}
      componentName="FieldLabel"
      ref={ref}>
      {children}
    </LabelBase>
  );
}

let _FieldLabel = forwardRef(FieldLabel);
export {_FieldLabel as FieldLabel};
