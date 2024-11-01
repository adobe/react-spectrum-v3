/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {Button, Dialog, DialogTrigger, Label, Modal, ModalOverlay, Radio, RadioGroup} from 'react-aria-components';
import React, {useState} from 'react';
import styles from '../example/index.css';

export default {
  title: 'React Aria Components'
};

export const RadioGroupExample = () => {
  return (
    <RadioGroup
      data-testid="radio-group-example"
      className={styles.radiogroup}>
      <Label>Favorite pet</Label>
      <Radio className={styles.radio} value="dogs" data-testid="radio-dog">Dog</Radio>
      <Radio className={styles.radio} value="cats">Cat</Radio>
      <Radio className={styles.radio} value="dragon">Dragon</Radio>
    </RadioGroup>
  );
};

export const RadioGroupControlledExample = () => {
  let [selected, setSelected] = useState<string | number | null>(null);

  return (
    <RadioGroup
      data-testid="radio-group-example"
      className={styles.radiogroup}
      value={selected}
      onChange={setSelected}>
      <Label>Favorite pet (controlled)</Label>
      <Radio className={styles.radio} value="dogs" data-testid="radio-dog">Dog</Radio>
      <Radio className={styles.radio} value="cats">Cat</Radio>
      <Radio className={styles.radio} value="dragon">Dragon</Radio>
    </RadioGroup>
  );
};

export const RadioGroupInDialogExample = () => {
  return (
    <DialogTrigger>
      <Button>Open dialog</Button>
      <ModalOverlay
        style={{
          position: 'fixed',
          zIndex: 100,
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
        <Modal
          style={{
            background: 'Canvas',
            color: 'CanvasText',
            border: '1px solid gray',
            padding: 30
          }}>
          <Dialog
            style={{
              outline: '2px solid transparent',
              outlineOffset: '2px',
              position: 'relative'
            }}>
            {({close}) => (
              <>
                <div>
                  <RadioGroupExample />
                </div>
                <div>
                  <Button onPress={close} style={{marginTop: 10}}>
                    Close
                  </Button>
                </div>
              </>
            )}
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  );
};
