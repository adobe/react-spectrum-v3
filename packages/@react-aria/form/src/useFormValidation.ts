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

import {FormValidationState} from '@react-stately/form';
import {RefObject, useEffect} from 'react';
import {useEffectEvent} from '@react-aria/utils';
import {Validation, ValidationResult} from '@react-types/shared';

type ValidatableElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

export function useFormValidation<T>(props: Validation<T>, state: FormValidationState<T>, ref: RefObject<ValidatableElement>) {
  let {validationBehavior} = props;

  useEffect(() => {
    if (validationBehavior === 'native') {
      let errorMessage = state.realtimeValidation.isInvalid ? state.realtimeValidation.errors.join(' ') || 'Invalid value.' : '';
      ref.current?.setCustomValidity(errorMessage);

      // Prevent default tooltip for validation message.
      // https://bugzilla.mozilla.org/show_bug.cgi?id=605277
      if (!ref.current.hasAttribute('title')) {
        ref.current.title = '';
      }

      if (!state.realtimeValidation.isInvalid) {
        state.updateValidation(getNativeValidity(ref.current));
      }
    }
  });

  let onReset = useEffectEvent(() => {
    state.resetValidation();
  });

  let commitValidation = useEffectEvent(() => {
    state.commitValidation();
  });

  useEffect(() => {
    let input = ref.current;
    if (!input || validationBehavior !== 'native') {
      return;
    }

    let form = input.form;
    let onInvalid = (e: Event) => {
      e.preventDefault();
      commitValidation();
    };

    let onChange = () => {
      commitValidation();
    };

    input.addEventListener('invalid', onInvalid);
    input.addEventListener('change', onChange);
    form?.addEventListener('reset', onReset);
    return () => {
      input.removeEventListener('invalid', onInvalid);
      input.removeEventListener('change', onChange);
      form?.removeEventListener('reset', onReset);
    };
  }, [ref, commitValidation, onReset, validationBehavior]);
}

function getValidity(input: ValidatableElement) {
  // The native ValidityState object is live, meaning each property is a getter that returns the current state.
  // We need to create a snapshot of the validity state at the time this function is called to avoid unpredictable React renders.
  let validity = input.validity;
  return {
    badInput: validity.badInput,
    customError: validity.customError,
    patternMismatch: validity.patternMismatch,
    rangeOverflow: validity.rangeOverflow,
    rangeUnderflow: validity.rangeUnderflow,
    stepMismatch: validity.stepMismatch,
    tooLong: validity.tooLong,
    tooShort: validity.tooShort,
    typeMismatch: validity.typeMismatch,
    valueMissing: validity.valueMissing,
    valid: validity.valid
  };
}

function getNativeValidity(input: ValidatableElement): ValidationResult {
  return {
    isInvalid: !input.validity.valid,
    validationDetails: getValidity(input),
    errors: input.validationMessage ? [input.validationMessage] : []
  };
}
