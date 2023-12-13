import {animate, useIntersectionObserver} from './utils';
import {ListBoxItem as AriaListBoxItem, ListBoxItemProps as AriaListBoxItemProps, Key, ListBox, Selection} from 'react-aria-components';
import {itemStyles} from 'tailwind-starter/ListBox';
import React, {useCallback, useRef, useState} from 'react';

const keyframes = [
  {fill: 'transparent', offset: 0},
  {fill: 'var(--press-fill)', offset: 0.5},
  {fill: 'transparent', offset: 1}
];

// let played = false;
export function ListBoxExample() {
  let [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());
  let [focusedKey, setFocusedKey] = useState<Key | null>(null);
  let ref = useRef<HTMLDivElement>(null);

  useIntersectionObserver(ref, useCallback(() => {
    let spaceKey = document.getElementById('space-key')!;
    let downKey = document.getElementById('down-key')!;
    let upKey = document.getElementById('up-key')!;
    let shiftKey = document.getElementById('shift-key')!;
    let cancel = animate([
      // {
      //   // Delay to let other cards start animating first.
      //   time: !played && window.innerWidth >= 768 ? 14000 : 500,
      //   perform() {}
      // },
      {
        time: 800,
        perform() {
          setFocusedKey('chocolate');
          setSelectedKeys(new Set());
        }
      },
      {
        time: 800,
        perform() {
          downKey.animate(keyframes, {duration: 600});
          setFocusedKey('mint');
        }
      },
      {
        time: 800,
        perform() {
          spaceKey.animate(keyframes, {duration: 600});
          setSelectedKeys(new Set(['mint']));
        }
      },
      {
        time: 800,
        perform() {
          shiftKey.animate([
            {fill: 'transparent'},
            {fill: 'var(--press-fill)', offset: 1}
          ], {duration: 300, fill: 'forwards'});
        }
      },
      {
        time: 800,
        perform() {
          downKey.animate(keyframes, {duration: 600});
          setFocusedKey('strawberry');
          setSelectedKeys(new Set(['mint', 'strawberry']));
        }
      },
      {
        time: 600,
        perform() {
          downKey.animate(keyframes, {duration: 600});
          setFocusedKey('vanilla');
          setSelectedKeys(new Set(['mint', 'strawberry', 'vanilla']));
        }
      },
      {
        time: 600,
        perform() {
          upKey.animate(keyframes, {duration: 600});
          setFocusedKey('strawberry');
          setSelectedKeys(new Set(['mint', 'strawberry']));
        }
      },
      {
        time: 1200,
        perform() {
          shiftKey.animate([
            {fill: 'var(--press-fill)'},
            {fill: 'transparent', offset: 1}
          ], {duration: 300, fill: 'forwards'});
        }
      },
      {
        time: 800,
        perform() {
          setFocusedKey(null);
          setSelectedKeys(new Set());
        }
      }
    ]);

    return () => {
      cancel();
      setFocusedKey(null);
      setSelectedKeys(new Set());
      shiftKey.style.fill = 'transparent';
    };
  }, []));

  return (
    <ListBox ref={ref} className="outline-0 p-1 border border-gray-300 dark:border-zinc-600 rounded-lg" aria-label="Ice cream flavor" selectionMode="multiple" selectedKeys={selectedKeys} onSelectionChange={setSelectedKeys}>
      <ListBoxItem id="chocolate" focusedKey={focusedKey}>Chocolate</ListBoxItem>
      <ListBoxItem id="mint" focusedKey={focusedKey}>Mint</ListBoxItem>
      <ListBoxItem id="strawberry" focusedKey={focusedKey}>Strawberry</ListBoxItem>
      <ListBoxItem id="vanilla" focusedKey={focusedKey}>Vanilla</ListBoxItem>
    </ListBox>
  );
}

interface ListBoxItemProps extends AriaListBoxItemProps {
  focusedKey: Key | null
}

function ListBoxItem(props: ListBoxItemProps) {
  let textValue = props.textValue || (typeof props.children === 'string' ? props.children : undefined);
  return (
    <AriaListBoxItem {...props} textValue={textValue} className={({isFocusVisible, ...renderProps}) => itemStyles({isFocusVisible: isFocusVisible || props.id === props.focusedKey, ...renderProps})}>
      {renderProps => (<>
        {typeof props.children === 'function' ? props.children(renderProps) : props.children}
        <div className="absolute left-2.5 right-2.5 bottom-0 h-px bg-white/20 forced-colors:bg-[HighlightText] hidden [.group[data-selected]:has(+[data-selected])_&]:block" />
      </>)}
    </AriaListBoxItem>
  );
}
