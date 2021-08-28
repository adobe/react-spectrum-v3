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

// @ts-ignore
import intlMessages from '../intl/*.json';
import {Provider} from '@react-spectrum/provider';
import React from 'react';
import {renderHook} from '@testing-library/react-hooks';
import {theme} from '@react-spectrum/theme-default';
import {useSearchField} from '../';

describe('useSearchField hook', () => {
  let state = {};
  let setValue = jest.fn();
  let ref = React.createRef();
  let focus = jest.fn();
  let onClear = jest.fn();

  let renderSearchHook = (props, wrapper) => {
    let {result} = renderHook(() => useSearchField({...props, 'aria-label': 'testLabel'}, state, ref), {wrapper});
    return result.current;
  };

  beforeEach(() => {
    state.value = '';
    state.setValue = setValue;
    ref.current = {focus};
  });

  afterEach(() => {
    setValue.mockClear();
    focus.mockClear();
    onClear.mockClear();
  });

  describe('should return inputProps', () => {
    it('with base props and value equal to state.value', () => {
      let {inputProps} = renderSearchHook({});
      expect(inputProps.type).toBe('search');
      expect(inputProps.value).toBe(state.value);
      expect(typeof inputProps.onKeyDown).toBe('function');
    });

    describe('with specific onKeyDown behavior', () => {
      let preventDefault = jest.fn();
      let stopPropagation = jest.fn();
      let onSubmit = jest.fn();
      let event = (key) => ({
        key,
        preventDefault,
        stopPropagation
      });

      afterEach(() => {
        preventDefault.mockClear();
        onSubmit.mockClear();
      });

      it('preventDefault is called for Enter and Escape', () => {
        let {inputProps} = renderSearchHook({});
        inputProps.onKeyDown(event('Enter'));
        expect(preventDefault).toHaveBeenCalledTimes(1);
        inputProps.onKeyDown(event('Escape'));
        expect(preventDefault).toHaveBeenCalledTimes(2);
      });

      it('onSubmit is called if Enter is pressed', () => {
        let {inputProps} = renderSearchHook({onSubmit});
        inputProps.onKeyDown(event('Enter'));
        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(onSubmit).toHaveBeenCalledWith(state.value);
      });

      it('pressing the Escape key sets the state value to "" and calls onClear if provided', () => {
        let {inputProps} = renderSearchHook({onClear});
        inputProps.onKeyDown(event('Escape'));
        expect(state.setValue).toHaveBeenCalledTimes(1);
        expect(state.setValue).toHaveBeenCalledWith('');
        expect(onClear).toHaveBeenCalledTimes(1);
      });

      it('does not return an defaultValue prop', () => {
        let {inputProps} = renderSearchHook({onClear, onSubmit, defaultValue: 'ABC'});
        expect(inputProps.defaultValue).not.toBeDefined();
      });
    });
  });

  describe('should return clearButtonProps', () => {
    it('with a localized aria-label', () => {
      let locale = 'de-DE';
      let wrapper = ({children}) => <Provider locale={locale} theme={theme}>{children}</Provider>;
      let expectedIntl = intlMessages[locale]['Clear search'];
      let {clearButtonProps} = renderSearchHook({}, wrapper);
      expect(clearButtonProps['aria-label']).toBe(expectedIntl);
    });

    it('clear button should not be tabbable', () => {
      let {clearButtonProps} = renderSearchHook({});
      expect(clearButtonProps.excludeFromTabOrder).toBe(true);
    });

    describe('with specific onPress behavior', () => {
      let mockEvent = {blah: 1};
      it('sets the state to "" and focuses the search field', () => {
        let {clearButtonProps} = renderSearchHook({});
        clearButtonProps.onPressStart(mockEvent);
        clearButtonProps.onPress(mockEvent);
        expect(state.setValue).toHaveBeenCalledTimes(1);
        expect(state.setValue).toHaveBeenCalledWith('');
        expect(ref.current.focus).toHaveBeenCalledTimes(1);
      });

      it('calls the user provided onClear if provided', () => {
        let {clearButtonProps} = renderSearchHook({onClear});
        clearButtonProps.onPressStart(mockEvent);
        clearButtonProps.onPress(mockEvent);
        // Verify that onClearButtonClick stuff still triggers
        expect(state.setValue).toHaveBeenCalledTimes(1);
        expect(state.setValue).toHaveBeenCalledWith('');
        expect(ref.current.focus).toHaveBeenCalledTimes(1);
        // Verify that props.onClear is triggered as well with the same event
        expect(onClear).toHaveBeenCalledTimes(1);
        expect(onClear).toHaveBeenCalledWith();
      });
    });
  });
});
