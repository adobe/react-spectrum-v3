import {MutableRefObject, useEffect} from 'react';

function hasResizeObserver() {
  return typeof window.ResizeObserver !== 'undefined';
}

type useResizeObserverOptionsType<T> = {
  ref: MutableRefObject<T>,
  onResize: () => void
}

export function useResizeObserver<T extends HTMLElement | undefined>(options: useResizeObserverOptionsType<T>) {
  const {ref, onResize} = options;

  useEffect(() => {
    let element = ref?.current;
    if (!element) {
      return;
    }

    if (!hasResizeObserver()) {
      window.addEventListener('resize', onResize, false);
      return () => {
        window.removeEventListener('resize', onResize, false);
      };
    } else {

      const resizeObserverInstance = new window.ResizeObserver((entries) => {
        if (!entries.length) {
          return;
        }

        onResize();
      });
      resizeObserverInstance.observe(element);

      return () => {
        if (element) {
          resizeObserverInstance.unobserve(element);
        }
      };
    }

  }, [onResize, ref]);
}
