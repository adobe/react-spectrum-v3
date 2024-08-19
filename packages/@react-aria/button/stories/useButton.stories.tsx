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

import {AriaButtonProps} from '@react-types/button';
import React, {useEffect, useRef, useState} from 'react';
import styles from './index.css';
import {useButton} from '../';

export default {
  title: 'useButton'
};

export const InputTypeButton = {
  render: () => <InputButton />,
  name: 'input type button'
};

interface InputButtonProps extends AriaButtonProps<'input'> {
  value?: string
}

function InputButton(props: InputButtonProps) {
  let {
    value = 'Test'
  } = props;

  let ref = useRef(null);
  let {buttonProps, isPressed} = useButton({...props, elementType: 'input'}, ref);

  return (
    <input ref={ref} value={value} style={{background: isPressed ? 'darkred' : 'red'}} {...buttonProps} />
  );
}

export const SubmitTypeButton = {
  render: SubmitButton,
  name: 'submit type button'
};

const defaultMessage = 'Either click the submit button or press \'Enter\' key while the focus is on the input.';

function SubmitButton() {
  let ref = useRef<HTMLButtonElement>(null);
  let [inputRef, setInputRef] = useState<HTMLInputElement|null>(null);
  let [message, setMessage] = useState(defaultMessage);
  let {buttonProps} = useButton({
    type: 'submit', 
    onPress: () => setMessage('Submit button clicked by the user. Check if the focus has moved to the button.')
  }, ref);

  useEffect(() => {
    function onKeyUp(e: KeyboardEvent) {
      if (document.activeElement === inputRef && e.key === 'Enter') {
        setMessage('Implicit form submission detected. Check if the focus is still on the input.');
      }
    }
    function onInputClick() {
      setMessage(msg => msg !== defaultMessage ? defaultMessage : msg);
    }
    document.addEventListener('keyup', onKeyUp);
    inputRef?.addEventListener('click', onInputClick);
    return () => {
      document.removeEventListener('keyup', onKeyUp);
      inputRef?.removeEventListener('click', onInputClick);
    };
  }, [inputRef]);

  return (
    <div className={styles.submitButtonExample}>
      <form
        onSubmit={e => {
          e.preventDefault();
        }}>
        <input ref={setInputRef} type="text" />
        <button {...buttonProps} ref={ref}>
          Submit
        </button>
      </form>
      <p>{message}</p>
    </div>
  );
}
