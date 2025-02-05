/*
 * Copyright 2023 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {fireEvent, screen, testSSR} from '@react-spectrum/test-utils-internal';

describe('ComboBox SSR', function () {
  it('should render text of default selected key', async function () {
    await testSSR(__filename, `
      import {ComboBox, Label, Input, Popover, ListBox, ListBoxItem} from '../';

      <React.StrictMode>
        <ComboBox defaultSelectedKey="dog">
          <Label>Favorite Animal</Label>
          <Input />
          <Popover>
            <ListBox>
              <ListBoxItem id="cat">Cat</ListBoxItem>
              <ListBoxItem id="dog">Dog</ListBoxItem>
              <ListBoxItem id="kangaroo">Kangaroo</ListBoxItem>
            </ListBox>
          </Popover>
        </ComboBox>
      </React.StrictMode>
    `, () => {
      // Assert that server rendered stuff into the HTML.
      let input = screen.getByRole('combobox');
      expect(input.value).toBe('Dog');
    });

    // Assert that hydrated UI matches what we expect.
    let input = screen.getByRole('combobox');
    expect(input.value).toBe('Dog');
  });

  it('should point ref correctly after hydration', async function () {
    await testSSR(__filename, `
      import {ComboBox, Label, Input, Popover, ListBox, ListBoxItem} from '../';
      import {useState, useRef} from 'react';
      import {useLayoutEffect} from '@react-aria/utils';

      function App() {
        let [trigger, setTrigger] = useState(['null']);
        let [otherState, setOtherState] = useState(0);
        let ref = useRef(null);

        useLayoutEffect(() => {
          setTrigger(prev => [...prev, ref.current?.outerHTML]);
        }, [otherState]);

        return (
          <React.StrictMode>
            <ComboBox defaultSelectedKey="dog">
              <div ref={ref}>
                <Label>Favorite Animal</Label>
                <Input />
              </div>
              <Popover>
                <ListBox>
                  <ListBoxItem id="cat">Cat</ListBoxItem>
                  <ListBoxItem id="dog">Dog</ListBoxItem>
                  <ListBoxItem id="kangaroo">Kangaroo</ListBoxItem>
                </ListBox>
              </Popover>
            </ComboBox>
            <div role="button">{trigger.join(", ")}</div>
            <div role="button" onClick={() => setOtherState(1)}>{otherState}</div>
          </React.StrictMode>
        );
      }
    <App />
    `, () => {
      // Assert that server rendered stuff into the HTML.
      let input = screen.getByRole('combobox');
      expect(input.value).toBe('Dog');
      let buttons = screen.getAllByRole('button');
      expect(buttons[0].textContent).toBe('null');
    });

    // Assert that hydrated UI matches what we expect.
    let input = screen.getByRole('combobox');
    expect(input.value).toBe('Dog');
    let buttons = screen.getAllByRole('button');
    let [button, button2] = buttons;
    fireEvent.click(button2);
    expect(button2.textContent).toBe('1');
    expect(button.textContent.split(', ')[2]).toBe(button.textContent.split(', ')[1]);
  });
});
