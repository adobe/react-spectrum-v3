import {SliderState} from '@react-stately/slider';

interface SliderData {
  id: string,
  'aria-describedby'?: string,
  'aria-details'?: string
}

export const sliderData = new WeakMap<SliderState, SliderData>();

export function getSliderThumbId(state: SliderState, index: number) {
  let data = sliderData.get(state);
  if (!data) {
    throw new Error('Unknown slider state');
  }

  return `${data.id}-${index}`;
}

 /**
  * Returns an array of thumbs indexes where the current thumb is stuck or null there are none.
  * 
  * @param state Slider state.
  * @param index Thumb index.
  */
export function getStuckThumbsIndexes(state: SliderState, index: number): number[] | null {
  const stuckThumbsIndexes = state.values.reduce((acc, value, i) => {
    if (value === state.values[index] && i !== index) {
      acc.push(i);
    }

    return acc;
  }, [] as number[]);

  return stuckThumbsIndexes.length !== 0 ? stuckThumbsIndexes : null;
}
