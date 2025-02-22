
import {RefObject} from '@react-types/shared';
import {useEffect} from 'react';

function hasResizeObserver() {
  return typeof window.ResizeObserver !== 'undefined';
}

type useResizeObserverOptionsType<T> = {
  ref: RefObject<T | undefined | null> | undefined,
  box?: ResizeObserverBoxOptions,
  onResize: () => void
}

export function useResizeObserver<T extends Element>(options: useResizeObserverOptionsType<T>) {
  const {ref, box, onResize} = options;

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

        requestAnimationFrame(() => onResize());
      });
      resizeObserverInstance.observe(element, {box});

      return () => {
        if (element) {
          resizeObserverInstance.unobserve(element);
        }
      };
    }

  }, [onResize, ref, box]);
}
