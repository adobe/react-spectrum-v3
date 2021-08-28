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

import {act, render} from '@testing-library/react';
import {AriaCheckboxGroupItemProps, AriaCheckboxGroupProps} from '@react-types/checkbox';
import {CheckboxGroupState, useCheckboxGroupState} from '@react-stately/checkbox';
import React, {useRef} from 'react';
import {useCheckboxGroup, useCheckboxGroupItem} from '../';
import userEvent from '@testing-library/user-event';

function Checkbox({checkboxGroupState, ...props}: AriaCheckboxGroupItemProps & { checkboxGroupState: CheckboxGroupState }) {
  const ref = useRef<HTMLInputElement>();
  const {children} = props;
  const {inputProps} = useCheckboxGroupItem(props, checkboxGroupState, ref);
  return <label><input ref={ref} {...inputProps} />{children}</label>;
}

function CheckboxGroup({groupProps, checkboxProps}: {groupProps: AriaCheckboxGroupProps, checkboxProps: AriaCheckboxGroupItemProps[]}) {
  const state = useCheckboxGroupState(groupProps);
  const {groupProps: checkboxGroupProps, labelProps} = useCheckboxGroup(groupProps, state);
  return (
    <div {...checkboxGroupProps}>
      {groupProps.label && <span {...labelProps}>{groupProps.label}</span>}
      <Checkbox checkboxGroupState={state} {...checkboxProps[0]} />
      <Checkbox checkboxGroupState={state} {...checkboxProps[1]} />
      <Checkbox checkboxGroupState={state} {...checkboxProps[2]} />
    </div>
  );
}

describe('useCheckboxGroup', () => {
  it('handles defaults', () => {
    let onChangeSpy = jest.fn();
    let {getByRole, getAllByRole, getByLabelText} = render(
      <CheckboxGroup
        groupProps={{label: 'Favorite Pet', onChange: onChangeSpy}}
        checkboxProps={[
          {value: 'dogs', children: 'Dogs'},
          {value: 'cats', children: 'Cats'},
          {value: 'dragons', children: 'Dragons'}
        ]} />
    );

    let checkboxGroup = getByRole('group', {exact: true});
    let checkboxes = getAllByRole('checkbox') as HTMLInputElement[];
    expect(checkboxGroup).toBeInTheDocument();
    expect(checkboxes.length).toBe(3);

    expect(checkboxes[0]).not.toHaveAttribute('name');
    expect(checkboxes[1]).not.toHaveAttribute('name');
    expect(checkboxes[2]).not.toHaveAttribute('name');

    expect(checkboxes[0].value).toBe('dogs');
    expect(checkboxes[1].value).toBe('cats');
    expect(checkboxes[2].value).toBe('dragons');

    expect(checkboxes[0].checked).toBeFalsy();
    expect(checkboxes[1].checked).toBeFalsy();
    expect(checkboxes[2].checked).toBeFalsy();

    let dragons = getByLabelText('Dragons');
    userEvent.click(dragons);
    expect(onChangeSpy).toHaveBeenCalledTimes(1);
    expect(onChangeSpy).toHaveBeenCalledWith(['dragons']);

    expect(checkboxes[0].checked).toBeFalsy();
    expect(checkboxes[1].checked).toBeFalsy();
    expect(checkboxes[2].checked).toBeTruthy();
  });

  it('can have a default value', () => {
    let {getByLabelText} = render(
      <CheckboxGroup
        groupProps={{label: 'Favorite Pet', value: ['cats']}}
        checkboxProps={[
          {value: 'dogs', children: 'Dogs'},
          {value: 'cats', children: 'Cats'},
          {value: 'dragons', children: 'Dragons'}
        ]} />
    );

    expect((getByLabelText('Cats') as HTMLInputElement).checked).toBe(true);
  });

  it('name can be controlled', () => {
    let {getAllByRole} = render(
      <CheckboxGroup
        groupProps={{name: 'awesome-react-aria', label: 'Favorite Pet'}}
        checkboxProps={[
          {value: 'dogs', children: 'Dogs'},
          {value: 'cats', children: 'Cats'},
          {value: 'dragons', children: 'Dragons'}
        ]} />
    );

    let checkboxes = getAllByRole('checkbox') as HTMLInputElement[];

    expect(checkboxes[0]).toHaveAttribute('name', 'awesome-react-aria');
    expect(checkboxes[1]).toHaveAttribute('name', 'awesome-react-aria');
    expect(checkboxes[2]).toHaveAttribute('name', 'awesome-react-aria');
  });

  it('supports labeling', () => {
    let {getByRole} = render(
      <CheckboxGroup
        groupProps={{label: 'Favorite Pet'}}
        checkboxProps={[
          {value: 'dogs', children: 'Dogs'},
          {value: 'cats', children: 'Cats'},
          {value: 'dragons', children: 'Dragons'}
        ]} />
    );
    let checkboxGroup = getByRole('group', {exact: true});

    let labelId = checkboxGroup.getAttribute('aria-labelledby');
    expect(labelId).toBeDefined();
    let label = document.getElementById(labelId);
    expect(label).toHaveTextContent('Favorite Pet');
  });

  it('supports aria-label', () => {
    let {getByRole} = render(
      <CheckboxGroup
        groupProps={{'aria-label': 'My Favorite Pet'}}
        checkboxProps={[
          {value: 'dogs', children: 'Dogs'},
          {value: 'cats', children: 'Cats'},
          {value: 'dragons', children: 'Dragons'}
        ]} />
    );
    let checkboxGroup = getByRole('group', {exact: true});

    expect(checkboxGroup).toHaveAttribute('aria-label', 'My Favorite Pet');
  });

  it('supports custom props', () => {
    const groupProps = {label: 'Favorite Pet', 'data-testid': 'favorite-pet'};
    let {getByRole} = render(
      <CheckboxGroup
        groupProps={groupProps}
        checkboxProps={[
          {value: 'dogs', children: 'Dogs'},
          {value: 'cats', children: 'Cats'},
          {value: 'dragons', children: 'Dragons'}
        ]} />
    );
    let checkboxGroup = getByRole('group', {exact: true});

    expect(checkboxGroup).toHaveAttribute('data-testid', 'favorite-pet');
  });

  it('sets aria-disabled and makes checkboxes disabled when isDisabled is true', () => {
    let groupOnChangeSpy = jest.fn();
    let checkboxOnChangeSpy = jest.fn();
    let {getAllByRole, getByRole, getByLabelText} = render(
      <CheckboxGroup
        groupProps={{label: 'Favorite Pet', isDisabled: true, onChange: groupOnChangeSpy}}
        checkboxProps={[
          {value: 'dogs', children: 'Dogs'},
          {value: 'cats', children: 'Cats'},
          {value: 'dragons', children: 'Dragons', onChange: checkboxOnChangeSpy}
        ]} />
    );

    let checkboxGroup = getByRole('group', {exact: true});
    expect(checkboxGroup).toHaveAttribute('aria-disabled', 'true');

    let checkboxes = getAllByRole('checkbox') as HTMLInputElement[];
    expect(checkboxes[0]).toHaveAttribute('disabled');
    expect(checkboxes[1]).toHaveAttribute('disabled');
    expect(checkboxes[2]).toHaveAttribute('disabled');
    let dragons = getByLabelText('Dragons');

    act(() => {userEvent.click(dragons);});

    expect(groupOnChangeSpy).toHaveBeenCalledTimes(0);
    expect(checkboxOnChangeSpy).toHaveBeenCalledTimes(0);
    expect(checkboxes[2].checked).toBeFalsy();
  });

  it('doesn\'t set aria-disabled or make checkboxes disabled by default', () => {
    let {getAllByRole, getByRole} = render(
      <CheckboxGroup
        groupProps={{label: 'Favorite Pet'}}
        checkboxProps={[
          {value: 'dogs', children: 'Dogs'},
          {value: 'cats', children: 'Cats'},
          {value: 'dragons', children: 'Dragons'}
        ]} />
    );

    let checkboxGroup = getByRole('group', {exact: true});
    expect(checkboxGroup).not.toHaveAttribute('aria-disabled');

    let checkboxes = getAllByRole('checkbox') as HTMLInputElement[];
    expect(checkboxes[0]).not.toHaveAttribute('disabled');
    expect(checkboxes[1]).not.toHaveAttribute('disabled');
    expect(checkboxes[2]).not.toHaveAttribute('disabled');
  });

  it('doesn\'t set aria-disabled or make checkboxes disabled when isDisabled is false', () => {
    let {getAllByRole, getByRole} = render(
      <CheckboxGroup
        groupProps={{label: 'Favorite Pet', isDisabled: false}}
        checkboxProps={[
          {value: 'dogs', children: 'Dogs'},
          {value: 'cats', children: 'Cats'},
          {value: 'dragons', children: 'Dragons'}
        ]} />
    );

    let checkboxGroup = getByRole('group', {exact: true});
    expect(checkboxGroup).not.toHaveAttribute('aria-disabled');

    let checkboxes = getAllByRole('checkbox') as HTMLInputElement[];
    expect(checkboxes[0]).not.toHaveAttribute('disabled');
    expect(checkboxes[1]).not.toHaveAttribute('disabled');
    expect(checkboxes[2]).not.toHaveAttribute('disabled');
  });

  it('sets aria-readonly="true" on each checkbox', () => {
    let groupOnChangeSpy = jest.fn();
    let checkboxOnChangeSpy = jest.fn();
    let {getAllByRole, getByLabelText} = render(
      <CheckboxGroup
        groupProps={{label: 'Favorite Pet', isReadOnly: true, onChange: groupOnChangeSpy}}
        checkboxProps={[
          {value: 'dogs', children: 'Dogs'},
          {value: 'cats', children: 'Cats'},
          {value: 'dragons', children: 'Dragons', onChange: checkboxOnChangeSpy}
        ]} />
    );

    let checkboxes = getAllByRole('checkbox') as HTMLInputElement[];
    expect(checkboxes[0]).toHaveAttribute('aria-readonly', 'true');
    expect(checkboxes[1]).toHaveAttribute('aria-readonly', 'true');
    expect(checkboxes[2]).toHaveAttribute('aria-readonly', 'true');
    expect(checkboxes[2].checked).toBeFalsy();
    let dragons = getByLabelText('Dragons');

    act(() => {userEvent.click(dragons);});

    expect(groupOnChangeSpy).toHaveBeenCalledTimes(0);
    expect(checkboxOnChangeSpy).toHaveBeenCalledTimes(0);
    expect(checkboxes[2].checked).toBeFalsy();
  });

  it('should not update state for readonly checkbox', () => {
    let groupOnChangeSpy = jest.fn();
    let checkboxOnChangeSpy = jest.fn();
    let {getAllByRole, getByLabelText} = render(
      <CheckboxGroup
        groupProps={{label: 'Favorite Pet', onChange: groupOnChangeSpy}}
        checkboxProps={[
          {value: 'dogs', children: 'Dogs'},
          {value: 'cats', children: 'Cats'},
          {value: 'dragons', children: 'Dragons', isReadOnly: true, onChange: checkboxOnChangeSpy}
        ]} />
    );

    let checkboxes = getAllByRole('checkbox') as HTMLInputElement[];
    let dragons = getByLabelText('Dragons');

    userEvent.click(dragons);

    expect(groupOnChangeSpy).toHaveBeenCalledTimes(0);
    expect(checkboxOnChangeSpy).toHaveBeenCalledTimes(0);
    expect(checkboxes[2].checked).toBeFalsy();
  });
});
