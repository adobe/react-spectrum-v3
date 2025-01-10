import {HiddenSelect, HiddenSelectProps} from '../src';
import {Item} from 'react-stately';
import {pointerMap} from '@react-spectrum/test-utils-internal';
import React, {useRef} from 'react';
import {render, screen} from '@testing-library/react';
import {Select} from '../stories/example';
import {SelectProps, useSelectState} from '@react-stately/select';
import userEvent from '@testing-library/user-event';

const HiddenSelectExample = (props: Partial<SelectProps<{ key: number, value: string }>> & { hiddenProps?: Partial<HiddenSelectProps<any>> }) => {
  const triggerRef = useRef(null);
  const state = useSelectState({
    children: (item) => (
      <Item>{item.value}</Item>
    ), ...props
  });

  return (
    <>
      <HiddenSelect
        label={props.label}
        state={state}
        triggerRef={triggerRef}
        {...props.hiddenProps} />
      <button ref={triggerRef}>trigger</button>
    </>
  );
};

const makeItems = (size: number) => (new Array(size).fill('')).map((__, index) => ({
  key: index + 1,
  value: `${index + 1}`
}));

describe('<HiddenSelect />', () => {
  let user;
  beforeAll(() => {
    user = userEvent.setup({delay: null, pointerMap});
  });

  it('should successfully render for collection.size <= 300 and no selected key', () => {
    render(
      <HiddenSelectExample items={makeItems(5)} />
    );
  });

  it('should successfully render for collection.size > 300 with a name and no selected key', () => {
    render(
      <HiddenSelectExample
        hiddenProps={{
          name: 'select'
        }}
        items={makeItems(400)} />
    );
  });

  it('should trigger on onSelectionChange when select onchange is triggered (autofill)', async () => {
    const onSelectionChange = jest.fn();
    render(
      <HiddenSelectExample
        label="select"
        onSelectionChange={onSelectionChange}
        items={makeItems(5)} />
    );

    const select = screen.getByLabelText('select');
    await user.selectOptions(select, '5');
    expect(onSelectionChange).toBeCalledWith('5');
  });

  it('should always add a data attribute data-a11y-ignore="aria-hidden-focus"', () => {
    render(
      <HiddenSelectExample items={makeItems(5)} />
    );

    expect(screen.getByTestId('hidden-select-container')).toHaveAttribute('data-a11y-ignore', 'aria-hidden-focus');
  });

  it('should always add a data attribute data-react-aria-prevent-focus', () => {
    render(
      <HiddenSelectExample items={makeItems(5)} />
    );

    expect(screen.getByTestId('hidden-select-container')).toHaveAttribute('data-react-aria-prevent-focus');
  });

  it('should trigger onChange when select option is changed', async () => {
    const onChangeSpy = jest.fn();
    const {getByRole} = render(
      <form onChange={onChangeSpy}>
        <Select isOpen data-testid={'select-onchange'} label={'Example'}>
          <Item key={'1'}>Item 1</Item>
          <Item key={'2'}>Item 2</Item>
          <Item key={'3'}>Item 3</Item>
        </Select>
      </form>
    );

    // Simulate user selecting an option
    const option = getByRole('option', {name: 'Item 1'});
    await user.click(option);

    // Check if the form's onChange event was called
    expect(onChangeSpy).toHaveBeenCalled();
  });
});
