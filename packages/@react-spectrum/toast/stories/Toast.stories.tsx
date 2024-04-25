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

import {action} from '@storybook/addon-actions';
import {Button} from '@react-spectrum/button';
import {ButtonGroup} from '@react-spectrum/buttongroup';
import {Checkbox} from '@react-spectrum/checkbox';
import {Content} from '@react-spectrum/view';
import {createLandmarkController, useLandmark} from '@react-aria/landmark';
import {Dialog, DialogTrigger} from '@react-spectrum/dialog';
import {Flex} from '@react-spectrum/layout';
import {Heading} from '@react-spectrum/text';
import React, {SyntheticEvent, useEffect, useMemo, useRef, useState} from 'react';
import {SpectrumToastOptions} from '../src/ToastContainer';
import {ToastContainer, ToastQueue} from '../';

export default {
  title: 'Toast',
  decorators: [
    (story, {parameters}) => (
      <>
        {!parameters.disableToastContainer && <ToastContainer />}
        <MainLandmark>{story()}</MainLandmark>
      </>
    )
  ],
  args: {
    shouldCloseOnAction: false,
    timeout: null
  },
  argTypes: {
    timeout: {
      control: {
        type: 'radio',
        options: [null, 5000]
      }
    }
  }
};

export const Default = (args) => <RenderProvider {...args} />;
Default.story = {
  parameters: {
    a11y: {
      config: {
        rules: [
          // Ignore landmark accessibility failures since the extra main is just for testing purposes
          // and not a explicit part of the Toast component
          {id: 'landmark-main-is-top-level', enabled: false},
          {id: 'landmark-no-duplicate-main', enabled: false},
          {id: 'landmark-unique', enabled: false}
        ]
      }
    }
  }
};

export const WithReactNode = (args) => <RenderProviderWithReactNode {...args} />;
Default.story = {
  parameters: {
    a11y: {
      config: {
        rules: [
          {id: 'landmark-main-is-top-level', enabled: false},
          {id: 'landmark-no-duplicate-main', enabled: false},
          {id: 'landmark-unique', enabled: false}
        ]
      }
    }
  }
};


export const WithAction = (args) => (
  <RenderProvider {...args} actionLabel="Action" onAction={action('onAction')} />
);

WithAction.story = {
  name: 'With action',
  parameters: {
    a11y: {
      config: {
        rules: [
          {id: 'landmark-main-is-top-level', enabled: false},
          {id: 'landmark-no-duplicate-main', enabled: false},
          {id: 'landmark-unique', enabled: false}
        ]
      }
    }
  }
};

export const WithDialog = (args) => (
  <DialogTrigger isDismissable>
    <Button variant="accent">Open dialog</Button>
    <Dialog>
      <Heading>Toasty</Heading>
      <Content>
        <RenderProvider {...args} />
      </Content>
    </Dialog>
  </DialogTrigger>
);

WithDialog.story = {
  name: 'With dialog',
  parameters: {
    a11y: {
      config: {
        rules: [
          {id: 'landmark-main-is-top-level', enabled: false},
          {id: 'landmark-no-duplicate-main', enabled: false},
          {id: 'landmark-unique', enabled: false}
        ]
      }
    }
  }
};

export const MultipleToastContainers = (args) => <Multiple {...args} />;

MultipleToastContainers.story = {
  name: 'multiple ToastContainers',
  parameters: {
    disableToastContainer: true,
    a11y: {
      config: {
        rules: [
          {id: 'landmark-main-is-top-level', enabled: false},
          {id: 'landmark-no-duplicate-main', enabled: false},
          {id: 'landmark-unique', enabled: false}
        ]
      }
    }
  }
};

export const ProgrammaticallyClosing = (args) => <ToastToggle {...args} />;

ProgrammaticallyClosing.story = {
  name: 'programmatically closing',
  parameters: {
    a11y: {
      config: {
        rules: [
          {id: 'landmark-main-is-top-level', enabled: false},
          {id: 'landmark-no-duplicate-main', enabled: false},
          {id: 'landmark-unique', enabled: false}
        ]
      }
    }
  }
};

export const WithIframe = () => <IframeExample />;

WithIframe.story = {
  name: 'with iframe',
  parameters: {
    a11y: {
      config: {
        rules: [
          {id: 'aria-allowed-role', selector: '*:not(iframe[role="main"])'},
          {id: 'landmark-main-is-top-level', enabled: false},
          {id: 'landmark-no-duplicate-main', enabled: false},
          {id: 'landmark-unique', enabled: false}
        ]
      }
    }
  }
};

function RenderProvider(options: SpectrumToastOptions) {
  return (
    <ButtonGroup>
      <Button
        onPress={() => ToastQueue.neutral('Toast available', {...options, onClose: action('onClose')})}
        variant="secondary">
        Show Neutral Toast
      </Button>
      <Button
        onPress={() => ToastQueue.positive('Toast is done!', {...options, onClose: action('onClose')})}
        variant="primary">
        Show Positive Toast
      </Button>
      <Button
        onPress={() => ToastQueue.negative('Toast is burned!', {...options, onClose: action('onClose')})}
        variant="negative">
        Show Negative Toast
      </Button>
      <Button
        onPress={() => ToastQueue.info('Toasting…', {...options, onClose: action('onClose')})}
        variant="accent"
        style="outline">
        Show Info Toast
      </Button>
    </ButtonGroup>
  );
}

function RenderProviderWithReactNode(options: SpectrumToastOptions) {
  return (
    <ButtonGroup>
      <Button
        onPress={() => ToastQueue.neutral(<div>Toast <i>available</i></div>, {...options, onClose: action('onClose')})}
        variant="secondary">
        Show Neutral Toast
      </Button>
      <Button
        onPress={() => ToastQueue.positive(<span>Toast is <b>done</b>!</span>, {...options, onClose: action('onClose')})}
        variant="primary">
        Show Positive Toast
      </Button>
      <Button
        onPress={() => ToastQueue.negative(<div>Toast is <em>burned</em>!</div>, {...options, onClose: action('onClose')})}
        variant="negative">
        Show Negative Toast
      </Button>
      <Button
        onPress={() => ToastQueue.info(<span><strong>Toasting</strong>…</span>, {...options, onClose: action('onClose')})}
        variant="accent"
        style="outline">
        Show Info Toast
      </Button>
    </ButtonGroup>
  );
}

function ToastToggle(options: SpectrumToastOptions) {
  let [close, setClose] = useState(null);

  return (
    <Button
      onPress={() => {
        if (!close) {
          let close = ToastQueue.negative('Unable to save', {...options, onClose: () => setClose(null)});
          setClose(() => close);
        } else {
          close();
        }
      }}
      variant="primary">
      {close ? 'Hide' : 'Show'} Toast
    </Button>
  );
}

function Multiple(options: SpectrumToastOptions) {
  let [isMounted1, setMounted1] = useState(true);

  return (
    <Flex direction="column">
      <Checkbox isSelected={isMounted1} onChange={setMounted1}>First mounted</Checkbox>
      {isMounted1 && <ToastContainer />}
      <MultipleInner />
      <RenderProvider {...options} />
    </Flex>
  );
}

function MultipleInner() {
  let [isMounted2, setMounted2] = useState(true);

  return (
    <>
      <Checkbox isSelected={isMounted2} onChange={setMounted2}>Second mounted</Checkbox>
      {isMounted2 && <ToastContainer />}
    </>
  );
}

function IframeExample() {
  let controller = useMemo(() => createLandmarkController(), []);
  useEffect(() => () => controller.dispose(), [controller]);
  let onLoad = (e: SyntheticEvent) => {
    let iframe = e.target as HTMLIFrameElement;
    let window = iframe.contentWindow;
    let document = window.document;

    // Catch toasts inside the iframe and redirect them outside.
    window.addEventListener('react-spectrum-toast', (e: CustomEvent) => {
      e.preventDefault();
      ToastQueue[e.detail.variant](e.detail.children, e.detail.options);
    });

    let prevFocusedElement = null;
    window.addEventListener('react-aria-landmark-navigation', (e: CustomEvent) => {
      e.preventDefault();
      let el = document.activeElement;
      if (el !== document.body) {
        prevFocusedElement = el;
      }

      // Prevent focus scope from stealing focus back when we move focus to the iframe.
      document.body.setAttribute('data-react-aria-top-layer', 'true');

      window.parent.postMessage({
        type: 'landmark-navigation',
        direction: e.detail.direction
      });

      setTimeout(() => {
        document.body.removeAttribute('data-react-aria-top-layer');
      }, 100);
    });

    // When the iframe is re-focused, restore focus back inside where it was before.
    window.addEventListener('focus', () => {
      if (prevFocusedElement) {
        prevFocusedElement.focus();
        prevFocusedElement = null;
      }
    });

    // Move focus to first or last landmark when we receive a message from the parent page.
    window.addEventListener('message', e => {
      if (e.data.type === 'landmark-navigation') {
        // (Can't use LandmarkController in this example because we need the controller instance inside the iframe)
        document.body.dispatchEvent(new KeyboardEvent('keydown', {key: 'F6', shiftKey: e.data.direction === 'backward', bubbles: true}));
      }
    });
  };

  useEffect(() => {
    let onMessage = (e: MessageEvent) => {
      let iframe = ref.current;
      if (e.data.type === 'landmark-navigation') {
        // Move focus to the iframe so that when focus is restored there, and we can redirect it back inside (below).
        iframe.focus();

        // Now re-dispatch the keyboard event so landmark navigation outside the iframe picks it up.
        controller.navigate(e.data.direction);
      }
    };

    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [controller]);

  let ref = useRef(null);
  let {landmarkProps} = useLandmark({
    role: 'main',
    focus(direction) {
      // when iframe landmark receives focus via landmark navigation, go to first/last landmark inside iframe.
      ref.current.contentWindow.postMessage({
        type: 'landmark-navigation',
        direction
      });
    }
  }, ref);

  return (
    <iframe
      ref={ref}
      {...landmarkProps}
      title="iframe"
      width="500"
      height="500"
      src="iframe.html?providerSwitcher-express=false&providerSwitcher-toastPosition=bottom&viewMode=story&id=toast--with-dialog"
      onLoad={onLoad}
      tabIndex={-1} />
  );
}

function MainLandmark(props) {
  let ref = useRef();
  let {landmarkProps} = useLandmark({...props, role: 'main'}, ref);
  return <main aria-label="Danni's unicorn corral" ref={ref} {...props} {...landmarkProps} style={{padding: 40, background: 'white'}}>{props.children}</main>;
}
