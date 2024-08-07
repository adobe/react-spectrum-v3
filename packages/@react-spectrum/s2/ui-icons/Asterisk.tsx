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

import S2_AsteriskSize100 from './S2_AsteriskSize100.svg';
import S2_AsteriskSize200 from './S2_AsteriskSize200.svg';
import S2_AsteriskSize300 from './S2_AsteriskSize300.svg';
import {SVGProps} from 'react';

export default function Asterisk({size, ...props}: {size: 'S' | 'M' | 'L' | 'XL'} & SVGProps<SVGSVGElement>) {
  switch (size) {
    case 'S':
    case 'M':
      return <S2_AsteriskSize100 {...props} />;
    case 'L':
      return <S2_AsteriskSize200 {...props} />;
    case 'XL':
      return <S2_AsteriskSize300 {...props} />;
  }
}
