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

import S2_LinkOutSize100 from './S2_LinkOutSize100.svg';
import S2_LinkOutSize200 from './S2_LinkOutSize200.svg';
import S2_LinkOutSize300 from './S2_LinkOutSize300.svg';
import {SVGProps} from 'react';

export default function LinkOut({size, ...props}: {size: 'S' | 'M' | 'L' | 'XL'} & SVGProps<SVGSVGElement>) {
  switch (size) {
    case 'S':
      return <S2_LinkOutSize100 {...props} />;
    case 'M':
      return <S2_LinkOutSize200 {...props} />;
    case 'L':
    case 'XL': // these are the same according to menu tokens
      return <S2_LinkOutSize300 {...props} />;
  }
}
