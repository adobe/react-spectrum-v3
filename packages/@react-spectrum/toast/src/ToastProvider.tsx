/*************************************************************************
* ADOBE CONFIDENTIAL
* ___________________
*
* Copyright 2019 Adobe
* All Rights Reserved.
*
* NOTICE: All information contained herein is, and remains
* the property of Adobe and its suppliers, if any. The intellectual
* and technical concepts contained herein are proprietary to Adobe
* and its suppliers and are protected by all applicable intellectual
* property laws, including trade secret and copyright laws.
* Dissemination of this information or reproduction of this material
* is strictly forbidden unless prior written permission is obtained
* from Adobe.
**************************************************************************/

import React, {ReactElement, ReactNode, useContext} from 'react';
import {ToastContainer} from './';
import {ToastOptions} from '@react-types/toast';
import {useProviderProps} from '@react-spectrum/provider';
import {useToastState} from '@react-stately/toast';

interface ToastContextProps {
  setToasts?: (any) => void,
  toasts?: {content: ReactNode, props: ToastOptions, ref: any}[],
  positive?: (content: ReactNode, options: ToastOptions) => void,
  negative?: (content: ReactNode, options: ToastOptions) => void,
  neutral?: (content: ReactNode, options: ToastOptions) => void,
  info?: (content: ReactNode, options: ToastOptions) => void
}

interface ToastProviderProps {
  children: ReactNode
}

export const ToastContext = React.createContext<ToastContextProps | null>(null);

export function useToastProvider() {
  return useContext(ToastContext);
}

export function ToastProvider(props: ToastProviderProps): ReactElement {
  let {onAdd, toasts, setToasts} = useToastState([]);
  let {
    children
  } = useProviderProps(props);

  let contextValue = {
    toasts,
    setToasts,
    neutral: (content: ReactNode, options: ToastOptions = {}) => {
      onAdd(content, options);
    },
    positive: (content: ReactNode, options: ToastOptions = {}) => {
      onAdd(content, {...options, variant: 'positive'});
    },
    negative: (content: ReactNode, options: ToastOptions = {}) => {
      onAdd(content, {...options, variant: 'negative'});
    },
    info: (content: ReactNode, options: ToastOptions = {}) => {
      onAdd(content, {...options, variant: 'info'});
    }
  }

  return (
    <ToastContext.Provider value={contextValue}>
      <ToastContainer />
      {children}
    </ToastContext.Provider>
  );
}
