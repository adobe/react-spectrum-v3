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

import {compileSVG} from '@spectrum-icons/build-tools/compileSVG';
import {generateIcons} from '@spectrum-icons/build-tools/generateIcons';
import * as path from 'path';

// Spectrum Express has overrides for the following icons. We will include both within
// the icon component, and switch dynamically depending on the theme.
const EXPRESS_ICON_MAPPING = {
  AlertMedium: 'SX_Alert_18_N',
  AlertSmall: 'SX_Alert_14_S',
  InfoMedium: 'SX_Info_18_N',
  InfoSmall: 'SX_Info_14_S',
  SuccessMedium: 'SX_CheckmarkCircle_18_N',
  SuccessSmall: 'SX_CheckmarkCircle_14_S',
  FolderBreadcrumb: 'SX_More_18',
  ChevronRightSmall: 'SX_ChevronRight_18',
};

let displayNameRegex = /.*?\.displayName = '(?<name>.*?)';/;
let expressDir = path.join(__dirname, '..', 'express');

function template(iconName) {
  let expressName = EXPRESS_ICON_MAPPING[iconName];
  if (expressName) {
    let jsx = compileSVG(path.join(expressDir, expressName + '.svg'), 'ExpressIcon');

    return (
`import {${iconName} as IconComponent} from '@adobe/react-spectrum-ui/dist/${iconName}.js';
import {UIIcon, UIIconPropsWithoutChildren} from '@react-spectrum/icon';
import {useProvider} from '@react-spectrum/provider';
import React from 'react';

${jsx}

ExpressIcon.displayName = IconComponent.displayName;

export default function ${iconName}(props: UIIconPropsWithoutChildren) {
  let provider = useProvider();
  return <UIIcon {...props}>{provider?.theme?.global?.express ? <ExpressIcon /> : <IconComponent />}</UIIcon>;
}
`
  );
  }

  return (
`import {${iconName} as IconComponent} from '@adobe/react-spectrum-ui/dist/${iconName}.js';
import {UIIcon, UIIconPropsWithoutChildren} from '@react-spectrum/icon';
import React from 'react';

export default function ${iconName}(props: UIIconPropsWithoutChildren) {
  return <UIIcon {...props}><IconComponent /></UIIcon>;
}
`
  );
}

generateIcons(path.dirname(require.resolve('@adobe/react-spectrum-ui')), path.join(__dirname, '..', 'src'), displayNameRegex, template);

