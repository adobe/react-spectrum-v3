import {fireEvent, installMouseEvent, installPointerEvent, pointerMap, render, renderHook, screen} from '@react-spectrum/test-utils-internal';
import * as React from 'react';
import {useRef} from 'react';
import userEvent from '@testing-library/user-event';
import {useSlider, useSliderThumb} from '../src';
import {useSliderState} from '@react-stately/slider';

describe('useSliderThumb', () => {
  let numberFormatter = new Intl.NumberFormat('en-US', {});
  describe('aria labels', () => {
    it('should have the right labels with Slider-level label', () => {
      let result = renderHook(() => {
        let trackRef = React.createRef(null);
        let inputRef = React.createRef(null);
        let sliderProps = {
          label: 'slider',
          defaultValue: [50],
          minValue: 10,
          maxValue: 200,
          step: 2
        };
        let state = useSliderState({...sliderProps, numberFormatter});
        let {labelProps, groupProps} = useSlider(sliderProps, state, trackRef);
        let props = useSliderThumb({
          index: 0,
          trackRef,
          inputRef
        }, state);
        return {props, labelProps, groupProps};
      }).result;

      let {inputProps} = result.current.props;
      let labelId = result.current.labelProps.id;
      expect(inputProps).toMatchObject({type: 'range', step: 2, value: 50, min: 10, max: 200, 'aria-labelledby': `${labelId}`});
    });
    it('should have the right labels with Slider thumb label', () => {
      let result = renderHook(() => {
        let trackRef = React.createRef(null);
        let inputRef = React.createRef(null);
        let sliderProps = {
          'aria-label': 'slider',
          defaultValue: [50],
          minValue: 10,
          maxValue: 200,
          step: 2
        };
        let state = useSliderState({...sliderProps, numberFormatter});
        let {labelProps, groupProps} = useSlider(sliderProps, state, trackRef);
        let props = useSliderThumb({
          index: 0,
          label: 'thumb',
          trackRef,
          inputRef
        }, state);
        return {props, labelProps, groupProps};
      }).result;

      let {inputProps, labelProps} = result.current.props;
      let labelId = result.current.groupProps.id;
      expect(inputProps).toMatchObject({type: 'range', step: 2, value: 50, min: 10, max: 200, 'aria-labelledby': `${labelProps.id} ${labelId}`, id: labelProps.htmlFor});
    });
    it('should have the right labels with Slider thumb aria-label', () => {
      let result = renderHook(() => {
        let trackRef = React.createRef(null);
        let inputRef = React.createRef(null);
        let sliderProps = {
          'aria-label': 'slider',
          defaultValue: [50, 70],
          minValue: 10,
          maxValue: 200,
          step: 2
        };
        let state = useSliderState({...sliderProps, numberFormatter});
        let {labelProps, groupProps} = useSlider(sliderProps, state, trackRef);
        let props0 = useSliderThumb({
          index: 0,
          'aria-label': 'thumb0',
          trackRef,
          inputRef
        }, state);
        let props1 = useSliderThumb({
          index: 1,
          'aria-label': 'thumb1',
          trackRef,
          inputRef
        }, state);
        return {props0, props1, labelProps, groupProps};
      }).result;

      let {inputProps: inputProps0} = result.current.props0;
      let {inputProps: inputProps1} = result.current.props1;
      let labelId = result.current.groupProps.id;
      expect(inputProps0).toMatchObject({type: 'range', step: 2, value: 50, min: 10, max: 70, 'aria-label': 'thumb0',  'aria-labelledby': `${inputProps0.id} ${labelId}`});
      expect(inputProps1).toMatchObject({type: 'range', step: 2, value: 70, min: 50, max: 200, 'aria-label': 'thumb1', 'aria-labelledby': `${inputProps1.id} ${labelId}`});
    });
  });

  describe('interactions on thumbs, where track does not contain thumbs', () => {
    let widthStub;
    beforeAll(() => {
      widthStub = jest.spyOn(window.HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({top: 0, left: 0, width: 100}));
    });
    afterAll(() => {
      widthStub.mockReset();
    });

    installMouseEvent();

    let stateRef = React.createRef();

    function RangeExample(props) {
      let trackRef = useRef(null);
      let input0Ref = useRef(null);
      let input1Ref = useRef(null);
      let state = useSliderState({...props, numberFormatter});
      stateRef.current = state;
      let {trackProps, thumbProps: commonThumbProps} = useSlider(props, state, trackRef);
      let {inputProps: input0Props, thumbProps: thumb0Props} = useSliderThumb({
        ...commonThumbProps,
        'aria-label': 'Min',
        index: 0,
        trackRef,
        inputRef: input0Ref
      }, state);
      let {inputProps: input1Props, thumbProps: thumb1Props} = useSliderThumb({
        ...commonThumbProps,
        'aria-label': 'Max',
        index: 1,
        trackRef,
        inputRef: input1Ref
      }, state);
      return (
        <div>
          <div data-testid="track" ref={trackRef} {...trackProps} />
          <div data-testid="thumb0" {...thumb0Props}>
            <input ref={input0Ref} {...input0Props} />
          </div>
          <div data-testid="thumb1" {...thumb1Props}>
            <input ref={input1Ref} {...input1Props} />
          </div>
        </div>
      );
    }

    describe('using PointerEvents', () => {
      installPointerEvent();

      it('can be moved by dragging', () => {
        let onChangeSpy = jest.fn();
        let onChangeEndSpy = jest.fn();
        render(<RangeExample onChange={onChangeSpy} onChangeEnd={onChangeEndSpy} aria-label="Slider" defaultValue={[10, 80]} />);

        // Drag thumb0
        let thumb0 = screen.getByTestId('thumb0');
        fireEvent.pointerDown(thumb0, {clientX: 10, pageX: 10});
        expect(onChangeSpy).not.toHaveBeenCalled();
        expect(onChangeEndSpy).not.toHaveBeenCalled();
        expect(stateRef.current.values).toEqual([10, 80]);

        fireEvent.pointerMove(thumb0, {clientX: 20, pageX: 20});
        expect(onChangeSpy).toHaveBeenLastCalledWith([20, 80]);
        expect(onChangeEndSpy).not.toHaveBeenCalled();
        expect(stateRef.current.values).toEqual([20, 80]);

        fireEvent.pointerMove(thumb0, {clientX: 30, pageX: 30});
        expect(onChangeSpy).toHaveBeenLastCalledWith([30, 80]);
        expect(onChangeEndSpy).not.toHaveBeenCalled();
        expect(stateRef.current.values).toEqual([30, 80]);

        fireEvent.pointerMove(thumb0, {clientX: 40, pageX: 40});
        fireEvent.pointerUp(thumb0, {clientX: 40, pageX: 40});
        expect(onChangeSpy).toHaveBeenLastCalledWith([40, 80]);
        expect(onChangeEndSpy).toHaveBeenLastCalledWith([40, 80]);
        expect(stateRef.current.values).toEqual([40, 80]);
      });
    });
    describe('using MouseEvents', () => {
      it('can be moved by dragging', () => {
        let onChangeSpy = jest.fn();
        let onChangeEndSpy = jest.fn();
        render(<RangeExample onChange={onChangeSpy} onChangeEnd={onChangeEndSpy} aria-label="Slider" defaultValue={[10, 80]} />);

        // Drag thumb0
        let thumb0 = screen.getByTestId('thumb0');
        fireEvent.mouseDown(thumb0, {clientX: 10, pageX: 10});
        expect(onChangeSpy).not.toHaveBeenCalled();
        expect(onChangeEndSpy).not.toHaveBeenCalled();
        expect(stateRef.current.values).toEqual([10, 80]);

        fireEvent.mouseMove(thumb0, {clientX: 20, pageX: 20});
        expect(onChangeSpy).toHaveBeenLastCalledWith([20, 80]);
        expect(onChangeEndSpy).not.toHaveBeenCalled();
        expect(stateRef.current.values).toEqual([20, 80]);

        fireEvent.mouseMove(thumb0, {clientX: 30, pageX: 30});
        expect(onChangeSpy).toHaveBeenLastCalledWith([30, 80]);
        expect(onChangeEndSpy).not.toHaveBeenCalled();
        expect(stateRef.current.values).toEqual([30, 80]);

        fireEvent.mouseMove(thumb0, {clientX: 40, pageX: 40});
        fireEvent.mouseUp(thumb0, {clientX: 40, pageX: 40});
        expect(onChangeSpy).toHaveBeenLastCalledWith([40, 80]);
        expect(onChangeEndSpy).toHaveBeenLastCalledWith([40, 80]);
        expect(stateRef.current.values).toEqual([40, 80]);
      });
    });

  });

  describe('interactions on thumbs, where track contains thumbs', () => {
    let widthStub;
    beforeAll(() => {
      widthStub = jest.spyOn(window.HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({top: 0, left: 0, width: 100, height: 100}));
    });
    afterAll(() => {
      widthStub.mockReset();
    });
    installMouseEvent();

    let stateRef = React.createRef();

    function Example(props) {
      let trackRef = useRef(null);
      let inputRef = useRef(null);
      let state = useSliderState({...props, numberFormatter});
      stateRef.current = state;
      let {trackProps} = useSlider(props, state, trackRef);
      let {inputProps, thumbProps} = useSliderThumb({
        ...props,
        'aria-label': 'Min',
        index: 0,
        trackRef,
        inputRef: inputRef
      }, state);
      return (
        <div data-testid="track" ref={trackRef} {...trackProps}>
          <div data-testid="thumb" {...thumbProps}>
            <input ref={inputRef} {...inputProps} />
          </div>
        </div>
      );
    }

    describe('using PointerEvents', () => {
      installPointerEvent();

      it('can be moved by dragging', () => {
        let onChangeSpy = jest.fn();
        let onChangeEndSpy = jest.fn();
        render(<Example onChange={onChangeSpy} onChangeEnd={onChangeEndSpy} aria-label="Slider" defaultValue={[10]} />);

        // Drag thumb
        let thumb0 = screen.getByTestId('thumb');
        fireEvent.pointerDown(thumb0, {clientX: 10, pageX: 10});
        expect(onChangeSpy).not.toHaveBeenCalled();
        expect(onChangeEndSpy).not.toHaveBeenCalled();
        expect(stateRef.current.values).toEqual([10]);

        fireEvent.pointerMove(thumb0, {clientX: 20, pageX: 20});
        expect(onChangeSpy).toHaveBeenLastCalledWith([20]);
        expect(onChangeEndSpy).not.toHaveBeenCalled();
        expect(stateRef.current.values).toEqual([20]);

        fireEvent.pointerMove(thumb0, {clientX: 40, pageX: 40});
        fireEvent.pointerUp(thumb0, {clientX: 40, pageX: 40});
        expect(onChangeSpy).toHaveBeenLastCalledWith([40]);
        expect(onChangeEndSpy).toHaveBeenLastCalledWith([40]);
        expect(stateRef.current.values).toEqual([40]);
        expect(onChangeEndSpy).toBeCalledTimes(1);
      });
    });

    describe('using MouseEvents', () => {
      it('can be moved by dragging', () => {
        let onChangeSpy = jest.fn();
        let onChangeEndSpy = jest.fn();
        render(<Example onChange={onChangeSpy} onChangeEnd={onChangeEndSpy} aria-label="Slider" defaultValue={[10]} />);

        // Drag thumb
        let thumb0 = screen.getByTestId('thumb');
        fireEvent.mouseDown(thumb0, {clientX: 10, pageX: 10});
        expect(onChangeSpy).not.toHaveBeenCalled();
        expect(onChangeEndSpy).not.toHaveBeenCalled();
        expect(stateRef.current.values).toEqual([10]);

        fireEvent.mouseMove(thumb0, {clientX: 20, pageX: 20});
        expect(onChangeSpy).toHaveBeenLastCalledWith([20]);
        expect(onChangeEndSpy).not.toHaveBeenCalled();
        expect(stateRef.current.values).toEqual([20]);

        fireEvent.mouseMove(thumb0, {clientX: 40, pageX: 40});
        fireEvent.mouseUp(thumb0, {clientX: 40, pageX: 40});
        expect(onChangeSpy).toHaveBeenLastCalledWith([40]);
        expect(onChangeEndSpy).toHaveBeenLastCalledWith([40]);
        expect(stateRef.current.values).toEqual([40]);
        expect(onChangeEndSpy).toBeCalledTimes(1);
      });

      it('can be moved by dragging (vertical)', () => {
        let onChangeSpy = jest.fn();
        let onChangeEndSpy = jest.fn();
        render(<Example onChange={onChangeSpy} onChangeEnd={onChangeEndSpy} aria-label="Slider" defaultValue={[10]} orientation="vertical" />);

        // Drag thumb
        let thumb0 = screen.getByTestId('thumb');
        fireEvent.mouseDown(thumb0, {clientY: 90, pageY: 90});
        expect(onChangeSpy).not.toHaveBeenCalled();
        expect(onChangeEndSpy).not.toHaveBeenCalled();
        expect(stateRef.current.values).toEqual([10]);

        fireEvent.mouseMove(thumb0, {clientY: 80, pageY: 80});
        expect(onChangeSpy).toHaveBeenLastCalledWith([20]);
        expect(onChangeEndSpy).not.toHaveBeenCalled();
        expect(stateRef.current.values).toEqual([20]);

        fireEvent.mouseMove(thumb0, {clientY: 60, pageY: 60});
        fireEvent.mouseUp(thumb0, {clientY: 60, pageY: 60});
        expect(onChangeSpy).toHaveBeenLastCalledWith([40]);
        expect(onChangeEndSpy).toHaveBeenLastCalledWith([40]);
        expect(stateRef.current.values).toEqual([40]);
        expect(onChangeEndSpy).toBeCalledTimes(1);
      });
    });

    describe('using KeyEvents', () => {
      it('can be moved with keys', async () => {
        let user = userEvent.setup({delay: null, pointerMap});
        let onChangeSpy = jest.fn();
        let onChangeEndSpy = jest.fn();
        render(<Example onChange={onChangeSpy} onChangeEnd={onChangeEndSpy} aria-label="Slider" defaultValue={[10]} />);

        // Drag thumb
        await user.tab();
        await user.keyboard('{ArrowRight}');
        expect(onChangeSpy).toHaveBeenLastCalledWith([11]);
        expect(onChangeSpy).toHaveBeenCalledTimes(1);
        expect(onChangeEndSpy).toHaveBeenLastCalledWith([11]);
        expect(onChangeEndSpy).toHaveBeenCalledTimes(1);
        expect(stateRef.current.values).toEqual([11]);

        await user.keyboard('{ArrowLeft}');
        expect(onChangeSpy).toHaveBeenLastCalledWith([10]);
        expect(onChangeSpy).toHaveBeenCalledTimes(2);
        expect(onChangeEndSpy).toHaveBeenLastCalledWith([10]);
        expect(onChangeEndSpy).toHaveBeenCalledTimes(2);
        expect(stateRef.current.values).toEqual([10]);
      });

      it('can be moved with keys at the beginning of the slider', async () => {
        let user = userEvent.setup({delay: null, pointerMap});
        let onChangeSpy = jest.fn();
        let onChangeEndSpy = jest.fn();
        render(<Example onChange={onChangeSpy} onChangeEnd={onChangeEndSpy} aria-label="Slider" defaultValue={[0]} />);

        await user.tab();
        await user.keyboard('{ArrowLeft}');
        expect(onChangeSpy).not.toHaveBeenCalled();
        expect(onChangeEndSpy).toHaveBeenCalledWith([0]);

        await user.keyboard('{ArrowRight}');
        expect(onChangeSpy).toHaveBeenLastCalledWith([1]);
        expect(onChangeSpy).toHaveBeenCalledTimes(1);
        expect(onChangeEndSpy).toHaveBeenLastCalledWith([1]);
        expect(onChangeEndSpy).toHaveBeenCalledTimes(2);
        expect(stateRef.current.values).toEqual([1]);
      });

      it('can be moved with keys at the end of the slider', async () => {
        let user = userEvent.setup({delay: null, pointerMap});
        let onChangeSpy = jest.fn();
        let onChangeEndSpy = jest.fn();
        render(<Example onChange={onChangeSpy} onChangeEnd={onChangeEndSpy} aria-label="Slider" defaultValue={[100]} />);

        await user.tab();
        await user.keyboard('{ArrowRight}');
        expect(onChangeSpy).not.toHaveBeenCalled();
        expect(onChangeEndSpy).toHaveBeenCalledWith([100]);

        await user.keyboard('{ArrowLeft}');
        expect(onChangeSpy).toHaveBeenLastCalledWith([99]);
        expect(onChangeSpy).toHaveBeenCalledTimes(1);
        expect(onChangeEndSpy).toHaveBeenLastCalledWith([99]);
        expect(onChangeEndSpy).toHaveBeenCalledTimes(2);
        expect(stateRef.current.values).toEqual([99]);
      });

      it('can be moved with keys (vertical)', async () => {
        let user = userEvent.setup({delay: null, pointerMap});
        let onChangeSpy = jest.fn();
        let onChangeEndSpy = jest.fn();
        render(<Example onChange={onChangeSpy} onChangeEnd={onChangeEndSpy} aria-label="Slider" defaultValue={[10]} orientation="vertical" />);

        // Drag thumb
        await user.tab();
        await user.keyboard('{ArrowRight}');
        expect(onChangeSpy).toHaveBeenLastCalledWith([11]);
        expect(onChangeSpy).toHaveBeenCalledTimes(1);
        await user.keyboard('{ArrowUp}');
        expect(onChangeSpy).toHaveBeenLastCalledWith([12]);
        expect(onChangeSpy).toHaveBeenCalledTimes(2);
        await user.keyboard('{ArrowDown}');
        expect(onChangeSpy).toHaveBeenLastCalledWith([11]);
        expect(onChangeSpy).toHaveBeenCalledTimes(3);
        await user.keyboard('{ArrowLeft}');
        expect(onChangeSpy).toHaveBeenLastCalledWith([10]);
        expect(onChangeSpy).toHaveBeenCalledTimes(4);
      });

      it('can be moved with keys (vertical) at the bottom of the slider', async () => {
        let user = userEvent.setup({delay: null, pointerMap});
        let onChangeSpy = jest.fn();
        let onChangeEndSpy = jest.fn();
        render(<Example onChange={onChangeSpy} onChangeEnd={onChangeEndSpy} aria-label="Slider" defaultValue={[0]} orientation="vertical" />);

        // Drag thumb
        await user.tab();
        await user.keyboard('{ArrowDown}');
        expect(onChangeSpy).not.toHaveBeenCalled();
        expect(onChangeEndSpy).toHaveBeenCalledWith([0]);

        await user.keyboard('{ArrowUp}');
        expect(onChangeSpy).toHaveBeenLastCalledWith([1]);
        expect(onChangeSpy).toHaveBeenCalledTimes(1);
        expect(onChangeEndSpy).toHaveBeenLastCalledWith([1]);
        expect(onChangeEndSpy).toHaveBeenCalledTimes(2);
        expect(stateRef.current.values).toEqual([1]);
      });

      it('can be moved with keys (vertical) at the top of the slider', async () => {
        let user = userEvent.setup({delay: null, pointerMap});
        let onChangeSpy = jest.fn();
        let onChangeEndSpy = jest.fn();
        render(<Example onChange={onChangeSpy} onChangeEnd={onChangeEndSpy} aria-label="Slider" defaultValue={[100]} orientation="vertical" />);

        // Drag thumb
        await user.tab();
        await user.keyboard('{ArrowUp}');
        expect(onChangeSpy).not.toHaveBeenCalled();
        expect(onChangeEndSpy).toHaveBeenCalledWith([100]);

        await user.keyboard('{ArrowDown}');
        expect(onChangeSpy).toHaveBeenLastCalledWith([99]);
        expect(onChangeSpy).toHaveBeenCalledTimes(1);
        expect(onChangeEndSpy).toHaveBeenLastCalledWith([99]);
        expect(onChangeEndSpy).toHaveBeenCalledTimes(2);
        expect(stateRef.current.values).toEqual([99]);
      });
    });
  });

  describe('interactions with 4 thumbs on track', () => { 
    let widthStub;
    beforeAll(() => {
      widthStub = jest.spyOn(window.HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => ({top: 0, left: 0, width: 100, height: 100}));
    });
    afterAll(() => {
      widthStub.mockReset();
    });
    installMouseEvent();

    let stateRef = React.createRef(); 

    function RangeExample(props) {
      let input0Ref = useRef(null);
      let input1Ref = useRef(null);
      let input2Ref = useRef(null);
      let input3Ref = useRef(null);

      let trackRef = useRef(null);

      let state = useSliderState({...props, numberFormatter});
      stateRef.current = state;

      let {trackProps, thumbProps: commonThumbProps} = useSlider(props, state, trackRef);

      let {inputProps: input0Props, thumbProps: thumb0Props} = useSliderThumb({
        ...commonThumbProps,
        'aria-label': 'Min',
        index: 0,
        trackRef,
        inputRef: input0Ref
      }, state);
      let {inputProps: input1Props, thumbProps: thumb1Props} = useSliderThumb({
        ...commonThumbProps,
        index: 1,
        trackRef,
        inputRef: input1Ref
      }, state);

      let {inputProps: input2Props, thumbProps: thumb2Props} = useSliderThumb({
        ...commonThumbProps,
        index: 2,
        trackRef,
        inputRef: input2Ref
      }, state);
      let {inputProps: input3Props, thumbProps: thumb3Props} = useSliderThumb({
        ...commonThumbProps,
        'aria-label': 'Max',
        index: 3,
        trackRef,
        inputRef: input3Ref
      }, state);
      
      return (
        <div data-testid="track" ref={trackRef} {...trackProps}>
          <div data-testid="thumb0" {...thumb0Props}>
            <input ref={input0Ref} {...input0Props} />
          </div>
          <div data-testid="thumb1" {...thumb1Props}>
            <input ref={input1Ref} {...input1Props} />
          </div>
          <div data-testid="thumb2" {...thumb2Props}>
            <input ref={input2Ref} {...input2Props} />
          </div>
          <div data-testid="thumb3" {...thumb3Props}>
            <input ref={input3Ref} {...input3Props} />
          </div>
        </div>
      );
    }

    const defaultValue = [10, 30, 50, 70];

    describe('thumbs swap is enabled', () => {

      describe('using PointerEvents', () => {
        installPointerEvent();
        
        it('can be swapped with the pointer', () => {
          let onChangeSpy = jest.fn();
          let onChangeEndSpy = jest.fn();
          render(<RangeExample onChange={onChangeSpy} onChangeEnd={onChangeEndSpy} aria-label="Slider" defaultValue={defaultValue} allowSwap />);

          const thumb3 = screen.getByTestId('thumb3');

          fireEvent.pointerDown(thumb3, {clientX: 70, pageX: 70});
          expect(onChangeSpy).not.toHaveBeenCalled();
          expect(onChangeEndSpy).not.toHaveBeenCalled();
          expect(stateRef.current.values).toEqual([10, 30, 50, 70]);

          fireEvent.pointerMove(thumb3, {clientX: 50, pageX: 50});
          expect(onChangeSpy).toHaveBeenLastCalledWith([10, 30, 50, 50]);
          expect(onChangeEndSpy).not.toHaveBeenCalled();
          expect(stateRef.current.values).toEqual([10, 30, 50, 50]);

          fireEvent.pointerMove(thumb3, {clientX: 40, pageX: 40});
          fireEvent.pointerUp(thumb3, {clientX: 40, pageX: 40});
          expect(onChangeSpy).toHaveBeenLastCalledWith([10, 30, 40, 50]);
          expect(onChangeEndSpy).toHaveBeenLastCalledWith([10, 30, 40, 50]);
          expect(onChangeEndSpy).toBeCalledTimes(1);
          expect(stateRef.current.values).toEqual([10, 30, 40, 50]);
        });

        it('can be swapped thumbs when they get stuck in each other', () => {
          let onChangeSpy = jest.fn();
          let onChangeEndSpy = jest.fn();
          render(<RangeExample onChange={onChangeSpy} onChangeEnd={onChangeEndSpy} aria-label="Slider" defaultValue={[50, 50, 50, 50]} allowSwap />);
  
          const thumb4 = screen.getByTestId('thumb3');
  
          // Choose the thumb 4 as it overlaps all the others 
          fireEvent.pointerDown(thumb4, {clientX: 50, pageX: 50});
          expect(onChangeSpy).not.toHaveBeenCalled();
          expect(onChangeEndSpy).not.toHaveBeenCalled();

          fireEvent.pointerMove(thumb4, {clientX: 40, pageX: 40});
          expect(onChangeEndSpy).not.toHaveBeenCalled();
          expect(onChangeSpy).toHaveBeenLastCalledWith([40, 50, 50, 50]);
          expect(onChangeSpy).toHaveBeenCalledTimes(1);
          expect(stateRef.current.values).toEqual([40, 50, 50, 50]);
  
          fireEvent.pointerUp(thumb4, {clientX: 40, pageX: 40});
          expect(onChangeSpy).toHaveBeenLastCalledWith([40, 50, 50, 50]);
          expect(onChangeSpy).toHaveBeenCalledTimes(1);
          expect(onChangeEndSpy).toHaveBeenLastCalledWith([40, 50, 50, 50]);
          expect(onChangeEndSpy).toHaveBeenCalledTimes(1);
          expect(stateRef.current.values).toEqual([40, 50, 50, 50]);

          onChangeSpy.mockClear();
          onChangeEndSpy.mockClear();

          fireEvent.pointerDown(thumb4, {clientX: 50, pageX: 50});
          expect(onChangeSpy).not.toHaveBeenCalled();
          expect(onChangeEndSpy).not.toHaveBeenCalled();

          fireEvent.pointerMove(thumb4, {clientX: 60, pageX: 60});
          expect(onChangeSpy).toHaveBeenCalledWith([40, 50, 50, 60]);
          expect(onChangeSpy).toHaveBeenCalledTimes(1);
          expect(onChangeEndSpy).not.toHaveBeenCalled();
          expect(stateRef.current.values).toEqual([40, 50, 50, 60]);

          fireEvent.pointerUp(thumb4, {clientX: 60, pageX: 60});
          expect(onChangeSpy).toHaveBeenLastCalledWith([40, 50, 50, 60]);
          expect(onChangeSpy).toHaveBeenCalledTimes(1);
          expect(onChangeEndSpy).toHaveBeenCalledWith([40, 50, 50, 60]);
          expect(onChangeEndSpy).toHaveBeenCalledTimes(1);
          expect(stateRef.current.values).toEqual([40, 50, 50, 60]);
        });
      });

      describe('using MouseEvents', () => {
        it('can be swapped', () => {
          let onChangeSpy = jest.fn();
          let onChangeEndSpy = jest.fn();
          render(<RangeExample onChange={onChangeSpy} onChangeEnd={onChangeEndSpy} aria-label="Slider" defaultValue={defaultValue} allowSwap />);
  
          const thumb3 = screen.getByTestId('thumb3');
  
           // Drag thumb3
          fireEvent.mouseDown(thumb3, {clientX: 70, pageX: 70});
          expect(onChangeSpy).not.toHaveBeenCalled();
          expect(onChangeEndSpy).not.toHaveBeenCalled();
  
          // it is important to swipe through the other thumb otherwise the swap will not work correctly
          fireEvent.mouseMove(thumb3, {clientX: 50, pageX: 50});
          expect(onChangeEndSpy).not.toHaveBeenCalled();
          expect(onChangeSpy).toHaveBeenLastCalledWith([10, 30, 50, 50]);
          expect(onChangeSpy).toHaveBeenCalledTimes(1);
          expect(stateRef.current.values).toEqual([10, 30, 50, 50]);
  
          // Here swap 3 and 2
          fireEvent.mouseMove(thumb3, {clientX: 40, pageX: 40});
          expect(onChangeSpy).toHaveBeenLastCalledWith([10, 30, 40, 50]);
          expect(onChangeSpy).toHaveBeenCalledTimes(2);
          expect(onChangeEndSpy).not.toHaveBeenCalled();
          expect(stateRef.current.values).toEqual([10, 30, 40, 50]);
  
          fireEvent.mouseUp(thumb3, {clientX: 40, pageX: 40});
          expect(onChangeSpy).toHaveBeenLastCalledWith([10, 30, 40, 50]);
          expect(onChangeSpy).toHaveBeenCalledTimes(2);
          expect(onChangeEndSpy).toHaveBeenLastCalledWith([10, 30, 40, 50]);
          expect(onChangeEndSpy).toHaveBeenCalledTimes(1);
          expect(stateRef.current.values).toEqual([10, 30, 40, 50]);
        });

        it('can be swapped thumbs when they get stuck in each other', () => {
          const defaultValue = [50, 50, 50, 50];

          let onChangeSpy = jest.fn();
          let onChangeEndSpy = jest.fn();
          render(<RangeExample onChange={onChangeSpy} onChangeEnd={onChangeEndSpy} aria-label="Slider" defaultValue={defaultValue} allowSwap />);
  
          const thumb3 = screen.getByTestId('thumb3');
  
          // Choose the thumb 4 as it overlaps all the others 
          fireEvent.mouseDown(thumb3, {clientX: 50, pageX: 50});
          expect(onChangeSpy).not.toHaveBeenCalled();
          expect(onChangeEndSpy).not.toHaveBeenCalled();

          fireEvent.mouseMove(thumb3, {clientX: 40, pageX: 40});
          expect(onChangeEndSpy).not.toHaveBeenCalled();
          expect(onChangeSpy).toHaveBeenLastCalledWith([40, 50, 50, 50]);
          expect(onChangeSpy).toHaveBeenCalledTimes(1);
          expect(stateRef.current.values).toEqual([40, 50, 50, 50]);
  
          fireEvent.mouseUp(thumb3, {clientX: 40, pageX: 40});
          expect(onChangeSpy).toHaveBeenLastCalledWith([40, 50, 50, 50]);
          expect(onChangeSpy).toHaveBeenCalledTimes(1);
          expect(onChangeEndSpy).toHaveBeenLastCalledWith([40, 50, 50, 50]);
          expect(onChangeEndSpy).toHaveBeenCalledTimes(1);
          expect(stateRef.current.values).toEqual([40, 50, 50, 50]);

          onChangeSpy.mockClear();
          onChangeEndSpy.mockClear();

          fireEvent.mouseDown(thumb3, {clientX: 50, pageX: 50});
          expect(onChangeSpy).not.toHaveBeenCalled();
          expect(onChangeEndSpy).not.toHaveBeenCalled();

          fireEvent.mouseMove(thumb3, {clientX: 60, pageX: 60});
          expect(onChangeSpy).toHaveBeenCalledWith([40, 50, 50, 60]);
          expect(onChangeSpy).toHaveBeenCalledTimes(1);
          expect(onChangeEndSpy).not.toHaveBeenCalled();
          expect(stateRef.current.values).toEqual([40, 50, 50, 60]);

          fireEvent.mouseUp(thumb3, {clientX: 60, pageX: 60});
          expect(onChangeSpy).toHaveBeenLastCalledWith([40, 50, 50, 60]);
          expect(onChangeSpy).toHaveBeenCalledTimes(1);
          expect(onChangeEndSpy).toHaveBeenCalledWith([40, 50, 50, 60]);
          expect(onChangeEndSpy).toHaveBeenCalledTimes(1);
          expect(stateRef.current.values).toEqual([40, 50, 50, 60]);
        });
      });

      describe('using KeyEvents', () => {
        it('can be swapped', async () => {
          let user = userEvent.setup({delay: null, pointerMap});
  
          let onChangeSpy = jest.fn();
          let onChangeEndSpy = jest.fn();
          render(<RangeExample onChange={onChangeSpy} onChangeEnd={onChangeEndSpy} aria-label="Slider" defaultValue={defaultValue} step={10} allowSwap />);
  
          await user.tab();
          await user.keyboard('{ArrowRight}');
          expect(onChangeSpy).toHaveBeenCalledWith([20, 30, 50, 70]);
          expect(onChangeSpy).toHaveBeenCalledTimes(1);
          expect(onChangeEndSpy).toHaveBeenCalledWith([20, 30, 50, 70]);
          expect(onChangeEndSpy).toHaveBeenCalledTimes(1);
          expect(stateRef.current.values).toEqual([20, 30, 50, 70]);
  
          await user.keyboard('{ArrowRight}');
          expect(onChangeSpy).toHaveBeenCalledWith([30, 30, 50, 70]);
          expect(onChangeSpy).toHaveBeenCalledTimes(2);
          expect(onChangeEndSpy).toHaveBeenCalledWith([30, 30, 50, 70]);
          expect(onChangeEndSpy).toHaveBeenCalledTimes(2);
          expect(stateRef.current.values).toEqual([30, 30, 50, 70]);
  
          // Here thumbs with indexes 0 and 1 should be swap
          await user.keyboard('{ArrowRight}');
          expect(onChangeSpy).toHaveBeenCalledWith([30, 40, 50, 70]);
          expect(onChangeSpy).toHaveBeenCalledTimes(3);
          expect(onChangeEndSpy).toHaveBeenCalledWith([30, 40, 50, 70]);
          expect(onChangeEndSpy).toHaveBeenCalledTimes(3);
          expect(stateRef.current.values).toEqual([30, 40, 50, 70]);
        });

        it('can be swapped thumbs when they get stuck in each other', async () => {
          let user = userEvent.setup({delay: null, pointerMap});
  
          let onChangeSpy = jest.fn();
          let onChangeEndSpy = jest.fn();
          render(<RangeExample onChange={onChangeSpy} onChangeEnd={onChangeEndSpy} aria-label="Slider" defaultValue={[50, 50, 50, 50]} allowSwap />);
  
          // Choose the third thumb
          await user.tab();
          await user.tab();
          await user.tab();

          // The first thumb should change as we move to the left
          await user.keyboard('{ArrowLeft}');
          expect(onChangeSpy).toHaveBeenCalledWith([49, 50, 50, 50]);
          expect(onChangeSpy).toHaveBeenCalledTimes(1);
          expect(onChangeEndSpy).toHaveBeenCalledWith([49, 50, 50, 50]);
          expect(onChangeEndSpy).toHaveBeenCalledTimes(1);
          expect(stateRef.current.values).toEqual([49, 50, 50, 50]);
  
          await user.keyboard('{ArrowLeft}');
          expect(onChangeSpy).toHaveBeenCalledWith([48, 50, 50, 50]);
          expect(onChangeSpy).toHaveBeenCalledTimes(2);
          expect(onChangeEndSpy).toHaveBeenCalledWith([48, 50, 50, 50]);
          expect(onChangeEndSpy).toHaveBeenCalledTimes(2);
          expect(stateRef.current.values).toEqual([48, 50, 50, 50]);

          // Choose the second thumb
          await user.tab();
          await user.keyboard('{ArrowRight}');
          expect(onChangeSpy).toHaveBeenCalledWith([48, 50, 50, 51]);
          expect(onChangeSpy).toHaveBeenCalledTimes(3);
          expect(onChangeEndSpy).toHaveBeenCalledWith([48, 50, 50, 51]);
          expect(onChangeEndSpy).toHaveBeenCalledTimes(3);
          expect(stateRef.current.values).toEqual([48, 50, 50, 51]);
        });
  
      });

    });

    describe('thumbs swap is disabled', () => {

      describe('using PointerEvents', () => {
        installPointerEvent();
          
        it('can not be swapped', () => {
          let onChangeSpy = jest.fn();
          let onChangeEndSpy = jest.fn();
          render(<RangeExample onChange={onChangeSpy} onChangeEnd={onChangeEndSpy} aria-label="Slider" defaultValue={defaultValue} />);
  
          const thumb3 = screen.getByTestId('thumb3');
  
          fireEvent.pointerDown(thumb3, {clientX: 70, pageX: 70});
          expect(onChangeSpy).not.toHaveBeenCalled();
          expect(onChangeEndSpy).not.toHaveBeenCalled();
          expect(stateRef.current.values).toEqual([10, 30, 50, 70]);
  
          fireEvent.pointerMove(thumb3, {clientX: 50, pageX: 50});
          expect(onChangeSpy).toHaveBeenLastCalledWith([10, 30, 50, 50]);
          expect(onChangeEndSpy).not.toHaveBeenCalled();
          expect(stateRef.current.values).toEqual([10, 30, 50, 50]);
  
          fireEvent.pointerMove(thumb3, {clientX: 40, pageX: 40});
          expect(onChangeSpy).toHaveBeenCalledWith([10, 30, 50, 50]);

          fireEvent.pointerUp(thumb3, {clientX: 40, pageX: 40});
          expect(onChangeSpy).toHaveBeenCalledTimes(1);
          expect(onChangeEndSpy).toHaveBeenLastCalledWith([10, 30, 50, 50]);
          expect(onChangeEndSpy).toBeCalledTimes(1);
          expect(stateRef.current.values).toEqual([10, 30, 50, 50]);
        });
  
        it('can be swapped thumbs when they get stuck in each other (only once)', () => {
          let onChangeSpy = jest.fn();
          let onChangeEndSpy = jest.fn();
          render(<RangeExample onChange={onChangeSpy} onChangeEnd={onChangeEndSpy} aria-label="Slider" defaultValue={[50, 50, 50, 50]} />);
    
          const thumb3 = screen.getByTestId('thumb3');
    
          // Choose the thumb 4 as it overlaps all the others 
          fireEvent.pointerDown(thumb3, {clientX: 50, pageX: 50});
          expect(onChangeSpy).not.toHaveBeenCalled();
          expect(onChangeEndSpy).not.toHaveBeenCalled();
  
          fireEvent.pointerMove(thumb3, {clientX: 40, pageX: 40});
          expect(onChangeEndSpy).not.toHaveBeenCalled();
          expect(onChangeSpy).toHaveBeenLastCalledWith([40, 50, 50, 50]);
          expect(onChangeSpy).toHaveBeenCalledTimes(1);
          expect(stateRef.current.values).toEqual([40, 50, 50, 50]);
    
          fireEvent.pointerUp(thumb3, {clientX: 40, pageX: 40});
          expect(onChangeSpy).toHaveBeenLastCalledWith([40, 50, 50, 50]);
          expect(onChangeSpy).toHaveBeenCalledTimes(1);
          expect(onChangeEndSpy).toHaveBeenLastCalledWith([40, 50, 50, 50]);
          expect(onChangeEndSpy).toHaveBeenCalledTimes(1);
          expect(stateRef.current.values).toEqual([40, 50, 50, 50]);
  
          onChangeSpy.mockClear();
          onChangeEndSpy.mockClear();
  
          fireEvent.pointerDown(thumb3, {clientX: 50, pageX: 50});
          expect(onChangeSpy).not.toHaveBeenCalled();
          expect(onChangeEndSpy).not.toHaveBeenCalled();
  
          fireEvent.pointerMove(thumb3, {clientX: 60, pageX: 60});
          expect(onChangeSpy).toHaveBeenCalledWith([40, 50, 50, 60]);
          expect(onChangeSpy).toHaveBeenCalledTimes(1);
          expect(onChangeEndSpy).not.toHaveBeenCalled();
          expect(stateRef.current.values).toEqual([40, 50, 50, 60]);
  
          fireEvent.pointerUp(thumb3, {clientX: 60, pageX: 60});
          expect(onChangeSpy).toHaveBeenLastCalledWith([40, 50, 50, 60]);
          expect(onChangeSpy).toHaveBeenCalledTimes(1);
          expect(onChangeEndSpy).toHaveBeenCalledWith([40, 50, 50, 60]);
          expect(onChangeEndSpy).toHaveBeenCalledTimes(1);
          expect(stateRef.current.values).toEqual([40, 50, 50, 60]);
        });
      });
  
      describe('using MouseEvents', () => {
        it('can not be swapped', () => {
          let onChangeSpy = jest.fn();
          let onChangeEndSpy = jest.fn();
          render(<RangeExample onChange={onChangeSpy} onChangeEnd={onChangeEndSpy} aria-label="Slider" defaultValue={defaultValue} />);
    
          const thumb3 = screen.getByTestId('thumb3');
    
             // Drag thumb3
          fireEvent.mouseDown(thumb3, {clientX: 70, pageX: 70});
          expect(onChangeSpy).not.toHaveBeenCalled();
          expect(onChangeEndSpy).not.toHaveBeenCalled();
    
            // it is important to swipe through the other thumb otherwise the swap will not work correctly
          fireEvent.mouseMove(thumb3, {clientX: 50, pageX: 50});
          expect(onChangeEndSpy).not.toHaveBeenCalled();
          expect(onChangeSpy).toHaveBeenLastCalledWith([10, 30, 50, 50]);
          expect(onChangeSpy).toHaveBeenCalledTimes(1);
          expect(stateRef.current.values).toEqual([10, 30, 50, 50]);
    
            // Here swap 3 and 2
          fireEvent.mouseMove(thumb3, {clientX: 40, pageX: 40});
          expect(onChangeSpy).toHaveBeenLastCalledWith([10, 30, 50, 50]);
          expect(onChangeSpy).toHaveBeenCalledTimes(1);
          expect(onChangeEndSpy).not.toHaveBeenCalled();
          expect(stateRef.current.values).toEqual([10, 30, 50, 50]);
    
          fireEvent.mouseUp(thumb3, {clientX: 40, pageX: 40});
          expect(onChangeSpy).toHaveBeenLastCalledWith([10, 30, 50, 50]);
          expect(onChangeSpy).toHaveBeenCalledTimes(1);
          expect(onChangeEndSpy).toHaveBeenLastCalledWith([10, 30, 50, 50]);
          expect(onChangeEndSpy).toHaveBeenCalledTimes(1);
          expect(stateRef.current.values).toEqual([10, 30, 50, 50]);
        });
  
        it('can be swapped thumbs when they get stuck in each other (only once)', () => {
          let onChangeSpy = jest.fn();
          let onChangeEndSpy = jest.fn();
          render(<RangeExample onChange={onChangeSpy} onChangeEnd={onChangeEndSpy} aria-label="Slider" defaultValue={[50, 50, 50, 50]} />);
    
          const thumb3 = screen.getByTestId('thumb3');
    
            // Choose the thumb 4 as it overlaps all the others 
          fireEvent.mouseDown(thumb3, {clientX: 50, pageX: 50});
          expect(onChangeSpy).not.toHaveBeenCalled();
          expect(onChangeEndSpy).not.toHaveBeenCalled();
  
          fireEvent.mouseMove(thumb3, {clientX: 40, pageX: 40});
          expect(onChangeEndSpy).not.toHaveBeenCalled();
          expect(onChangeSpy).toHaveBeenLastCalledWith([40, 50, 50, 50]);
          expect(onChangeSpy).toHaveBeenCalledTimes(1);
          expect(stateRef.current.values).toEqual([40, 50, 50, 50]);
    
          fireEvent.mouseUp(thumb3, {clientX: 40, pageX: 40});
          expect(onChangeSpy).toHaveBeenLastCalledWith([40, 50, 50, 50]);
          expect(onChangeSpy).toHaveBeenCalledTimes(1);
          expect(onChangeEndSpy).toHaveBeenLastCalledWith([40, 50, 50, 50]);
          expect(onChangeEndSpy).toHaveBeenCalledTimes(1);
          expect(stateRef.current.values).toEqual([40, 50, 50, 50]);
  
          onChangeSpy.mockClear();
          onChangeEndSpy.mockClear();
  
          fireEvent.mouseDown(thumb3, {clientX: 50, pageX: 50});
          expect(onChangeSpy).not.toHaveBeenCalled();
          expect(onChangeEndSpy).not.toHaveBeenCalled();
  
          fireEvent.mouseMove(thumb3, {clientX: 60, pageX: 60});
          expect(onChangeSpy).toHaveBeenCalledWith([40, 50, 50, 60]);
          expect(onChangeSpy).toHaveBeenCalledTimes(1);
          expect(onChangeEndSpy).not.toHaveBeenCalled();
          expect(stateRef.current.values).toEqual([40, 50, 50, 60]);
  
          fireEvent.mouseUp(thumb3, {clientX: 60, pageX: 60});
          expect(onChangeSpy).toHaveBeenLastCalledWith([40, 50, 50, 60]);
          expect(onChangeSpy).toHaveBeenCalledTimes(1);
          expect(onChangeEndSpy).toHaveBeenCalledWith([40, 50, 50, 60]);
          expect(onChangeEndSpy).toHaveBeenCalledTimes(1);
          expect(stateRef.current.values).toEqual([40, 50, 50, 60]);
        });
      });
  
      describe('using KeyEvents', () => {
        it('can not be swapped', async () => {
          let user = userEvent.setup({delay: null, pointerMap});
    
          let onChangeSpy = jest.fn();
          let onChangeEndSpy = jest.fn();
          render(<RangeExample onChange={onChangeSpy} onChangeEnd={onChangeEndSpy} aria-label="Slider" defaultValue={defaultValue} step={10} />);
    
          await user.tab();
          await user.keyboard('{ArrowRight}');
          expect(onChangeSpy).toHaveBeenCalledWith([20, 30, 50, 70]);
          expect(onChangeSpy).toHaveBeenCalledTimes(1);
          expect(onChangeEndSpy).toHaveBeenCalledWith([20, 30, 50, 70]);
          expect(onChangeEndSpy).toHaveBeenCalledTimes(1);
          expect(stateRef.current.values).toEqual([20, 30, 50, 70]);
    
          await user.keyboard('{ArrowRight}');
          expect(onChangeSpy).toHaveBeenCalledWith([30, 30, 50, 70]);
          expect(onChangeSpy).toHaveBeenCalledTimes(2);
          expect(onChangeEndSpy).toHaveBeenCalledWith([30, 30, 50, 70]);
          expect(onChangeEndSpy).toHaveBeenCalledTimes(2);
          expect(stateRef.current.values).toEqual([30, 30, 50, 70]);
    
          // Here thumbs with indexes 0 and 1 should be swap
          await user.keyboard('{ArrowRight}');
          expect(onChangeSpy).toHaveBeenCalledWith([30, 30, 50, 70]);
          expect(onChangeSpy).toHaveBeenCalledTimes(2);
          expect(onChangeEndSpy).toHaveBeenCalledWith([30, 30, 50, 70]);
          expect(onChangeEndSpy).toHaveBeenCalledTimes(3);
          expect(stateRef.current.values).toEqual([30, 30, 50, 70]);
        });
  
        it('can be swapped thumbs when they get stuck in each other (only once)', async () => {
          const defaultValue = [50, 50, 50, 50];
          let user = userEvent.setup({delay: null, pointerMap});
    
          let onChangeSpy = jest.fn();
          let onChangeEndSpy = jest.fn();
          render(<RangeExample onChange={onChangeSpy} onChangeEnd={onChangeEndSpy} aria-label="Slider" defaultValue={defaultValue} />);
    
          // Choose the first thumb
          await user.tab();
  
          // The first thumb should change as we move to the left
          await user.keyboard('{ArrowLeft}');
          expect(onChangeSpy).toHaveBeenCalledWith([49, 50, 50, 50]);
          expect(onChangeSpy).toHaveBeenCalledTimes(1);
          expect(onChangeEndSpy).toHaveBeenCalledWith([49, 50, 50, 50]);
          expect(onChangeEndSpy).toHaveBeenCalledTimes(1);
          expect(stateRef.current.values).toEqual([49, 50, 50, 50]);
    
          await user.keyboard('{ArrowLeft}');
          expect(onChangeSpy).toHaveBeenCalledWith([48, 50, 50, 50]);
          expect(onChangeSpy).toHaveBeenCalledTimes(2);
          expect(onChangeEndSpy).toHaveBeenCalledWith([48, 50, 50, 50]);
          expect(onChangeEndSpy).toHaveBeenCalledTimes(2);
          expect(stateRef.current.values).toEqual([48, 50, 50, 50]);
  
          // Choose the second thumb
          await user.tab();
          await user.keyboard('{ArrowRight}');
          expect(onChangeSpy).toHaveBeenCalledWith([48, 50, 50, 51]);
          expect(onChangeSpy).toHaveBeenCalledTimes(3);
          expect(onChangeEndSpy).toHaveBeenCalledWith([48, 50, 50, 51]);
          expect(onChangeEndSpy).toHaveBeenCalledTimes(3);
          expect(stateRef.current.values).toEqual([48, 50, 50, 51]);

          await user.keyboard('{ArrowLeft}');
          await user.keyboard('{ArrowLeft}');
          await user.keyboard('{ArrowLeft}');
          expect(onChangeSpy).toHaveBeenCalledWith([48, 50, 50, 50]);
          expect(onChangeSpy).toHaveBeenCalledTimes(4);
          expect(onChangeEndSpy).toHaveBeenCalledWith([48, 50, 50, 50]);
          expect(onChangeEndSpy).toHaveBeenCalledTimes(6);
          expect(stateRef.current.values).toEqual([48, 50, 50, 50]);
        });
    
      });
    });
  });
});
