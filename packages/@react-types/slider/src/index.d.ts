import {
  AriaLabelingProps,
  AriaValidationProps,
  DOMProps,
  FocusableDOMProps,
  FocusableProps,
  InputDOMProps,
  LabelableProps,
  LabelPosition,
  Orientation,
  RangeInputBase,
  RangeValue,
  StyleProps,
  ValidationState,
  ValueBase
} from '@react-types/shared';
import {ReactNode} from 'react';

export interface SliderProps<T = number | number[]> extends RangeInputBase<number>, ValueBase<T>, LabelableProps {
  /**
   * The orientation of the Slider.
   * @default 'horizontal'
   */
  orientation?: Orientation,
  /** Whether the whole Slider is disabled. */
  isDisabled?: boolean,
  /** Fired when the slider stops moving, due to being let go. */
  onChangeEnd?: (value: T) => void,
  // These are duplicated from ValueBase to define defaults for the docs.
  /**
   * The slider's minimum value.
   * @default 0
   */
  minValue?: number,
  /**
   * The slider's maximum value.
   * @default 100
   */
  maxValue?: number,
  /**
   * The slider's step value.
   * @default 1
   */
  step?: number,
  /** The behavior of swapping thumbs when stuck.  
   * @default false
   */
  allowSwap?: boolean
}

export interface SliderThumbProps extends FocusableProps, LabelableProps {
  /**
   * The orientation of the Slider.
   * @default 'horizontal'
   * @deprecated - pass to the slider instead.
   */
  orientation?: Orientation,
  /** Whether the Thumb is disabled. */
  isDisabled?: boolean,
  /**
   * Index of the thumb within the slider.
   * @default 0
   */
  index?: number,
  /** @deprecated */
  isRequired?: boolean,
  /** @deprecated */
  isInvalid?: boolean,
  /** @deprecated */
  validationState?: ValidationState
}

export interface AriaSliderProps<T = number | number[]> extends SliderProps<T>, DOMProps, AriaLabelingProps {}
export interface AriaSliderThumbProps extends SliderThumbProps, DOMProps, FocusableDOMProps, InputDOMProps, AriaLabelingProps, AriaValidationProps {}

export interface SpectrumBarSliderBase<T> extends AriaSliderProps<T>, ValueBase<T>, StyleProps {
  /**
   * The display format of the value label.
   */
  formatOptions?: Intl.NumberFormatOptions,
  /**
   * The label's overall position relative to the element it is labeling.
   * @default 'top'
   */
  labelPosition?: LabelPosition,
  /** Whether the value's label is displayed. True by default if there's a `label`, false by default if not. */
  showValueLabel?: boolean,
  /** A function that returns the content to display as the value's label. Overrides default formatted number. */
  getValueLabel?: (value: T) => string,
  /**
   * A ContextualHelp element to place next to the label.
   */
  contextualHelp?: ReactNode
}

export interface SpectrumSliderProps extends SpectrumBarSliderBase<number>, InputDOMProps {
  /**
   * Whether a fill color is shown between the start of the slider and the current value.
   * @see https://spectrum.adobe.com/page/slider/#Fill.
   */
  isFilled?: boolean,
  /**
   * The offset from which to start the fill.
   * @see https://spectrum.adobe.com/page/slider/#Fill-start.
   */
  fillOffset?: number,
  /**
   * The background of the track, specified as the stops for a CSS background: `linear-gradient(to right/left, ...trackGradient)`.
   * @example trackGradient={['red', 'green']}
   * @example trackGradient={['red 20%', 'green 40%']}
   * @see https://spectrum.adobe.com/page/slider/#Gradient.
   */
  trackGradient?: string[]
}

export interface SpectrumRangeSliderProps extends SpectrumBarSliderBase<RangeValue<number>> {
  /**
   * The name of the start input element, used when submitting an HTML form. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#htmlattrdefname).
   */
  startName?: string,
  /**
   * The name of the end input element, used when submitting an HTML form. See [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#htmlattrdefname).
   */
  endName?: string
}
