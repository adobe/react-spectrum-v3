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

import {Button} from '../src/Button';
import {Disclosure, DisclosurePanel} from '../src/Disclosure';
import {Header} from '../src/Header';
import {Link} from '../src/Link';
import {Navigation, NavigationItem, NavigationSection} from '../src/Navigation';
import React from 'react';
import './styles.css';

export default {
  title: 'React Aria Components',
  component: Navigation,
  args: {
    orientation: 'vertical'
  },
  argTypes: {
    isDisabled: {
      control: 'boolean'
    },
    orientation: {
      control: 'radio',
      options: ['horizontal', 'vertical']
    }
  }
};

export const NavigationExample = (args: any) => (
  <Navigation {...args}>
    <NavigationItem>
      <Link href="//react-spectrum.adobe.com/releases/index.html">Releases</Link>
    </NavigationItem>
    <NavigationSection>
      <Header>Libraries</Header>
      <NavigationItem>
        <Link href="//react-spectrum.adobe.com/">Internationslized</Link>
      </NavigationItem>
      <NavigationItem isCurrent>
        <Link href="//react-spectrum.adobe.com/">React Spectrum</Link>
      </NavigationItem>
      <NavigationItem>
        <Link href="//react-spectrum.adobe.com/react-aria/">React Aria</Link>
      </NavigationItem>
      <NavigationItem>
        <Link href="//react-spectrum.adobe.com/react-state/">React Stately</Link>
      </NavigationItem>
      <NavigationItem isDisabled>
        <Link href="//react-spectrum.adobe.com/s2/">React Spectrum 2</Link>
      </NavigationItem>
    </NavigationSection>
    <NavigationSection>
      <Disclosure>
        {({isExpanded}) => (
          <>
            <Header>
              <Button slot="trigger">{isExpanded ? '⬇️' : '➡️'} React Aria Components</Button>
            </Header>
            <DisclosurePanel>
              <NavigationItem>
                <Link href="//react-spectrum.adobe.com/react-aria/Button.html">Button</Link>
              </NavigationItem>
              <NavigationItem>
                <Link href="//react-spectrum.adobe.com/react-aria/Disclosure.html">Disclosure</Link>
              </NavigationItem>
              <NavigationItem>
                <Link href="//react-spectrum.adobe.com/react-aria/Button.html">Button</Link>
              </NavigationItem>
              <NavigationItem>
                <Link href="//react-spectrum.adobe.com/react-aria/Link.html">Link</Link>
              </NavigationItem>
              <NavigationItem>
                <Link href="//react-spectrum.adobe.com/react-aria/Menu.html">Menu</Link>
              </NavigationItem>
            </DisclosurePanel>
          </>
        )}
      </Disclosure>
    </NavigationSection>
  </Navigation>
);

