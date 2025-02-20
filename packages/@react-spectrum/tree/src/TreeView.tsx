/*
 * Copyright 2024 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {AriaTreeGridListProps} from '@react-aria/tree';
import {
  ButtonContext,
  Tree,
  TreeItem,
  TreeItemContent,
  TreeItemContentProps,
  TreeItemContentRenderProps,
  TreeItemProps,
  TreeItemRenderProps,
  TreeRenderProps,
  useContextProps
} from 'react-aria-components';
import {Checkbox} from '@react-spectrum/checkbox';
import ChevronLeftMedium from '@spectrum-icons/ui/ChevronLeftMedium';
import ChevronRightMedium from '@spectrum-icons/ui/ChevronRightMedium';
import {DOMRef, Expandable, Key, SelectionBehavior, SpectrumSelectionProps, StyleProps} from '@react-types/shared';
import {isAndroid} from '@react-aria/utils';
import React, {createContext, JSX, JSXElementConstructor, ReactElement, ReactNode, useRef} from 'react';
import {SlotProvider, useDOMRef, useStyleProps} from '@react-spectrum/utils';
import {style} from '@react-spectrum/style-macro-s1' with {type: 'macro'};
import {useButton} from '@react-aria/button';
import {useLocale} from '@react-aria/i18n';

export interface SpectrumTreeViewProps<T> extends Omit<AriaTreeGridListProps<T>, 'children'>, StyleProps, SpectrumSelectionProps, Expandable {
  /** Provides content to display when there are no items in the tree. */
  renderEmptyState?: () => JSX.Element,
  /**
   * Handler that is called when a user performs an action on an item. The exact user event depends on
   * the collection's `selectionStyle` prop and the interaction modality.
   */
  onAction?: (key: Key) => void,
  /**
   * The contents of the tree.
   */
  children?: ReactNode | ((item: T) => ReactNode)
}

export interface SpectrumTreeViewItemProps<T extends object = object> extends Omit<TreeItemProps, 'className' | 'style' | 'value' | 'onHoverStart' | 'onHoverEnd' | 'onHoverChange'> {
  /** Rendered contents of the tree item or child items. */
  children: ReactNode,
  /** A list of child tree item objects used when dynamically rendering the tree item children. */
  childItems?: Iterable<T>
}

interface TreeRendererContextValue {
  renderer?: (item) => ReactElement<any, string | JSXElementConstructor<any>>
}
const TreeRendererContext = createContext<TreeRendererContextValue>({});

// TODO: add animations for rows appearing and disappearing

// TODO: the below is needed so the borders of the top and bottom row isn't cut off if the TreeView is wrapped within a container by always reserving the 2px needed for the
// keyboard focus ring. Perhaps find a different way of rendering the outlines since the top of the item doesn't
// scroll into view due to how the ring is offset. Alternatively, have the tree render the top/bottom outline like it does in Listview
const tree = style<Pick<TreeRenderProps, 'isEmpty'>>({
  borderWidth: 2,
  boxSizing: 'border-box',
  borderXWidth: 0,
  borderStyle: 'solid',
  borderColor: {
    default: 'transparent',
    forcedColors: 'Background'
  },
  justifyContent: {
    isEmpty: 'center'
  },
  alignItems: {
    isEmpty: 'center'
  },
  width: {
    isEmpty: 'full'
  },
  height: {
    isEmpty: 'full'
  },
  display: {
    isEmpty: 'flex'
  }
});

/**
 * A tree view provides users with a way to navigate nested hierarchical information.
 */
export const TreeView = React.forwardRef(function TreeView<T extends object>(props: SpectrumTreeViewProps<T>, ref: DOMRef<HTMLDivElement>) {
  let {children, selectionStyle} = props;

  let renderer;
  if (typeof children === 'function') {
    renderer = children;
  }

  let {styleProps} = useStyleProps(props);
  let domRef = useDOMRef(ref);
  let selectionBehavior = selectionStyle === 'highlight' ? 'replace' : 'toggle';

  return (
    <TreeRendererContext.Provider value={{renderer}}>
      <Tree {...props} {...styleProps} className={({isEmpty}) => tree({isEmpty})} selectionBehavior={selectionBehavior as SelectionBehavior} ref={domRef}>
        {props.children}
      </Tree>
    </TreeRendererContext.Provider>
  );
}) as <T>(props: SpectrumTreeViewProps<T> & {ref?: DOMRef<HTMLDivElement>}) => ReactElement;

interface TreeRowRenderProps extends TreeItemRenderProps {
  isLink?: boolean
}

const treeRow = style<TreeRowRenderProps>({
  position: 'relative',
  display: 'flex',
  height: 10,
  width: 'full',
  boxSizing: 'border-box',
  fontSize: 'base',
  fontWeight: 'normal',
  lineHeight: 200,
  color: 'body',
  outlineStyle: 'none',
  cursor: {
    default: 'default',
    isLink: 'pointer'
  },
  // TODO: not sure where to get the equivalent colors here, for instance isHovered is spectrum 600 with 10% opacity but I don't think that exists in the theme
  backgroundColor: {
    isHovered: '[var(--spectrum-table-row-background-color-hover)]',
    isFocusVisibleWithin: '[var(--spectrum-table-row-background-color-hover)]',
    isPressed: '[var(--spectrum-table-row-background-color-down)]',
    isSelected: '[var(--spectrum-table-row-background-color-selected)]'
  }
});

const treeCellGrid = style({
  display: 'grid',
  width: 'full',
  alignItems: 'center',
  gridTemplateColumns: ['minmax(0, auto)', 'minmax(0, auto)', 'minmax(0, auto)', 10, 'minmax(0, auto)', '1fr', 'minmax(0, auto)', 'auto'],
  gridTemplateRows: '1fr',
  gridTemplateAreas: [
    'drag-handle checkbox level-padding expand-button icon content actions actionmenu'
  ],
  color: {
    isDisabled: {
      default: 'gray-400',
      forcedColors: 'GrayText'
    }
  }
});

// TODO: These styles lose against the spectrum class names, so I've did unsafe for the ones that get overridden
const treeCheckbox = style({
  gridArea: 'checkbox',
  transitionDuration: '160ms',
  marginStart: 3,
  marginEnd: 0
});

const treeIcon = style({
  gridArea: 'icon',
  marginEnd: 2
});

const treeContent = style<Pick<TreeItemContentRenderProps, 'isDisabled'>>({
  gridArea: 'content',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  overflow: 'hidden'
});

const treeActions = style({
  gridArea: 'actions',
  flexGrow: 0,
  flexShrink: 0,
  /* TODO: I made this one up, confirm desired behavior. These paddings are to make sure the action group has enough padding for the focus ring */
  marginStart: .5,
  marginEnd: 1
});

const treeActionMenu = style({
  gridArea: 'actionmenu',
  width: 8
});

const treeRowOutline = style({
  content: '',
  display: 'block',
  position: 'absolute',
  insetStart: 0,
  insetEnd: 0,
  top: {
    default: 0,
    isFocusVisible: '[-2px]',
    isSelected: {
      default: '[-1px]',
      isFocusVisible: '[-2px]'
    }
  },
  bottom: 0,
  pointerEvents: 'none',
  forcedColorAdjust: 'none',

  boxShadow: {
    isFocusVisible: '[inset 2px 0 0 0 var(--spectrum-alias-focus-color), inset -2px 0 0 0 var(--spectrum-alias-focus-color), inset 0 -2px 0 0 var(--spectrum-alias-focus-color), inset 0 2px 0 0 var(--spectrum-alias-focus-color)]',
    isSelected: {
      default: '[inset 1px 0 0 0 var(--spectrum-alias-focus-color), inset -1px 0 0 0 var(--spectrum-alias-focus-color), inset 0 -1px 0 0 var(--spectrum-alias-focus-color), inset 0 1px 0 0 var(--spectrum-alias-focus-color)]',
      isFocusVisible: '[inset 2px 0 0 0 var(--spectrum-alias-focus-color), inset -2px 0 0 0 var(--spectrum-alias-focus-color), inset 0 -2px 0 0 var(--spectrum-alias-focus-color), inset 0 2px 0 0 var(--spectrum-alias-focus-color)]'
    },
    forcedColors: {
      isFocusVisible: '[inset 2px 0 0 0 Highlight, inset -2px 0 0 0 Highlight, inset 0 -2px 0 0 Highlight, inset 0 2px 0 0 Highlight]',
      isSelected: {
        default: '[inset 1px 0 0 0 Highlight, inset -1px 0 0 0 Highlight, inset 0 -1px 0 0 Highlight, inset 0 1px 0 0 Highlight]',
        isFocusVisible: '[inset 2px 0 0 0 Highlight, inset -2px 0 0 0 Highlight, inset 0 -2px 0 0 Highlight, inset 0 2px 0 0 Highlight]'
      }
    }
  }
});

export const TreeViewItem = <T extends object>(props: SpectrumTreeViewItemProps<T>): ReactElement => {
  let {
    href
  } = props;

  return (
    <TreeItem
      {...props}
      className={renderProps => treeRow({
        ...renderProps,
        isLink: !!href
      })} />
  );
};


export const TreeViewItemContent = (props: Omit<TreeItemContentProps, 'children'> & {children: ReactNode}): ReactElement => {
  let {
    children
  } = props;

  return (
    <TreeItemContent>
      {({isExpanded, hasChildItems, level, selectionMode, selectionBehavior, isDisabled, isSelected, isFocusVisible}) => (
        <div className={treeCellGrid({isDisabled})}>
          {selectionMode !== 'none' && selectionBehavior === 'toggle' && (
              // TODO: add transition?
          <Checkbox
            isEmphasized
            UNSAFE_className={treeCheckbox()}
            UNSAFE_style={{paddingInlineEnd: '0px'}}
            slot="selection" />
            )}
          <div style={{gridArea: 'level-padding', marginInlineEnd: `calc(${level - 1} * var(--spectrum-global-dimension-size-200))`}} />
          {/* TODO: revisit when we do async loading, at the moment hasChildItems will only cause the chevron to be rendered, no aria/data attributes indicating the row's expandability are added */}
          {hasChildItems && <ExpandableRowChevron isDisabled={isDisabled} isExpanded={isExpanded} />}
          <SlotProvider
            slots={{
              text: {UNSAFE_className: treeContent({isDisabled})},
                // Note there is also an issue here where these icon props are making into the action menu's icon. Resolved by 8ab0ffb276ff437a65b365c9a3be0323a1b24656
                // but could crop up later for other components
              icon: {UNSAFE_className: treeIcon(), size: 'S'},
              actionButton: {UNSAFE_className: treeActions(), isQuiet: true},
              actionGroup: {
                UNSAFE_className: treeActions(),
                isQuiet: true,
                density: 'compact',
                buttonLabelBehavior: 'hide',
                isDisabled,
                overflowMode: 'collapse'
              },
              actionMenu: {UNSAFE_className: treeActionMenu(), UNSAFE_style: {marginInlineEnd: '.5rem'}, isQuiet: true}
            }}>
            {children}
          </SlotProvider>
          <div className={treeRowOutline({isFocusVisible, isSelected})} />
        </div>
        )}
    </TreeItemContent>
  );
};

interface ExpandableRowChevronProps {
  isExpanded?: boolean,
  isDisabled?: boolean,
  isRTL?: boolean
}

const expandButton = style<ExpandableRowChevronProps>({
  gridArea: 'expand-button',
  height: 'full',
  aspectRatio: 'square',
  display: 'flex',
  flexWrap: 'wrap',
  alignContent: 'center',
  justifyContent: 'center',
  outlineStyle: 'none',
  transform: {
    isExpanded: {
      default: 'rotate(90deg)',
      isRTL: 'rotate(-90deg)'
    }
  },
  transition: '[transform ease var(--spectrum-global-animation-duration-100)]'
});

function ExpandableRowChevron(props: ExpandableRowChevronProps) {
  let expandButtonRef = useRef(null);
  let [fullProps, ref] = useContextProps({...props, slot: 'chevron'}, expandButtonRef, ButtonContext);
  let {isExpanded, isDisabled} = fullProps;
  let {direction} = useLocale();

  // Will need to keep the chevron as a button for iOS VO at all times since VO doesn't focus the cell. Also keep as button if cellAction is defined by the user in the future
  let {buttonProps} = useButton({
    ...fullProps,
    elementType: 'span'
  }, ref);

  return (
    <span
      {...buttonProps}
      ref={ref}
      // Override tabindex so that grid keyboard nav skips over it. Needs -1 so android talkback can actually "focus" it
      tabIndex={isAndroid() && !isDisabled ? -1 : undefined}
      className={expandButton({isExpanded, isDisabled, isRTL: direction === 'rtl'})}>
      {direction === 'ltr' ? <ChevronRightMedium /> : <ChevronLeftMedium />}
    </span>
  );
}
