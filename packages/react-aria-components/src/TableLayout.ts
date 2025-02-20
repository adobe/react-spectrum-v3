/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {TableLayout as BaseTableLayout, TableLayoutProps} from '@react-stately/layout';
import {LayoutOptionsDelegate} from './Virtualizer';
import {TableColumnResizeStateContext} from './Table';
import {useContext, useMemo} from 'react';

export class TableLayout<T> extends BaseTableLayout<T> implements LayoutOptionsDelegate<TableLayoutProps> {
  // Invalidate the layout whenever the column widths change.
  useLayoutOptions(): TableLayoutProps {
    // This is not a React class component, just a regular class.
    /* eslint-disable react-hooks/rules-of-hooks */
    let colResizeState = useContext(TableColumnResizeStateContext);
    return useMemo(() => ({
      columnWidths: colResizeState?.columnWidths
    }), [colResizeState?.columnWidths]);
  }
}
