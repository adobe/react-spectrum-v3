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

import {ActionButton} from './ActionButton';
import AlertIcon from '../s2wf-icons/S2_Icon_AlertTriangle_20_N.svg';
import {
  Tag as AriaTag,
  TagGroup as AriaTagGroup,
  TagGroupProps as AriaTagGroupProps,
  TagProps as AriaTagProps,
  composeRenderProps,
  ContextValue,
  Provider,
  TextContext as RACTextContext,
  TagList,
  TagListProps,
  useLocale,
  useSlottedContext
} from 'react-aria-components';
import {AvatarContext} from './Avatar';
import {CenterBaseline, centerBaseline} from './CenterBaseline';
import {ClearButton} from './ClearButton';
import {Collection, CollectionBuilder} from '@react-aria/collections';
import {createContext, forwardRef, ReactNode, useContext, useEffect, useMemo, useRef, useState} from 'react';
import {DOMRef, DOMRefValue, HelpTextProps, Node, SpectrumLabelableProps} from '@react-types/shared';
import {field, getAllowedOverrides, StyleProps} from './style-utils' with {type: 'macro'};
import {FieldLabel} from './Field';
import {flushSync} from 'react-dom';
import {focusRing, fontRelative, style} from '../style' with { type: 'macro' };
import {FormContext, useFormProps} from './Form';
import {forwardRefType} from './types';
import {IconContext} from './Icon';
import {ImageContext} from './Image';
import {inertValue, useEffectEvent, useId, useLayoutEffect, useResizeObserver} from '@react-aria/utils';
// @ts-ignore
import intlMessages from '../intl/*.json';
import {pressScale} from './pressScale';
import {Text, TextContext} from './Content';
import {useDOMRef} from '@react-spectrum/utils';
import {useLocalizedStringFormatter} from '@react-aria/i18n';
import {useSpectrumContextProps} from './useSpectrumContextProps';

// Get types from RSP and extend those?
export interface TagProps extends Omit<AriaTagProps, 'children' | 'style' | 'className'> {
  /** The children of the tag. */
  children?: ReactNode
}

export interface TagGroupProps<T> extends Omit<AriaTagGroupProps, 'children' | 'style' | 'className'>, Pick<TagListProps<T>, 'items' | 'children' | 'renderEmptyState'>, Omit<SpectrumLabelableProps, 'isRequired' | 'necessityIndicator'>, StyleProps, Omit<HelpTextProps, 'errorMessage'> {
  /** A description for the tag group. */
  description?: ReactNode,
  /**
   * The size of the tag group.
   *
   * @default 'M'
   */
  size?: 'S' | 'M' | 'L',
  /** Whether the tags are displayed in an emphasized style. */
  isEmphasized?: boolean,
  /** Provides content to display when there are no items in the tag group. */
  renderEmptyState?: () => ReactNode,
  /** Whether the tags are displayed in a error state. */
  isInvalid?: boolean,
  /** An error message for the field. */
  errorMessage?: ReactNode,
  /** Limit the number of rows initially shown. This will render a button that allows the user to expand to show all tags. */
  maxRows?: number,
  /** The label to display on the action button.  */
  groupActionLabel?: string,
  /** Handler that is called when the action button is pressed. */
  onGroupAction?: () => void
}

export const TagGroupContext = createContext<ContextValue<TagGroupProps<any>, DOMRefValue<HTMLDivElement>>>(null);

const helpTextStyles = style({
  gridArea: 'helptext',
  display: 'flex',
  alignItems: 'baseline',
  gap: 'text-to-visual',
  font: 'control',
  color: {
    default: 'neutral-subdued',
    isInvalid: 'negative'
  },
  '--iconPrimary': {
    type: 'fill',
    value: 'currentColor'
  },
  contain: 'inline-size',
  paddingTop: '--field-gap',
  cursor: 'text'
});

const InternalTagGroupContext = createContext<TagGroupProps<any>>({});

/** Tags allow users to categorize content. They can represent keywords or people, and are grouped to describe an item or a search request. */
export const TagGroup = /*#__PURE__*/ (forwardRef as forwardRefType)(function TagGroup<T extends object>(props: TagGroupProps<T>, ref: DOMRef<HTMLDivElement>) {
  [props, ref] = useSpectrumContextProps(props, ref, TagGroupContext);
  props = useFormProps(props);
  let {onRemove} = props;
  return (
    <InternalTagGroupContext.Provider value={{onRemove}}>
      <CollectionBuilder content={<Collection {...props} />}>
        {collection => <TagGroupInner props={props} forwardedRef={ref} collection={collection} />}
      </CollectionBuilder>
    </InternalTagGroupContext.Provider>
  );
});

function TagGroupInner<T>({
  props: {
    label,
    description,
    labelPosition = 'top',
    labelAlign = 'start',
    isEmphasized,
    isInvalid,
    errorMessage,
    UNSAFE_className = '',
    UNSAFE_style,
    size = 'M',
    ...props
  },
  forwardedRef: ref,
  collection
}: {props: TagGroupProps<T>, forwardedRef: DOMRef<HTMLDivElement>, collection: any}) {
  let stringFormatter = useLocalizedStringFormatter(intlMessages, '@react-spectrum/s2');
  let {
    maxRows,
    groupActionLabel,
    onGroupAction,
    renderEmptyState = () => stringFormatter.format('tag.noTags'),
    ...otherProps
  } = props;
  let {direction} = useLocale();
  let containerRef = useRef(null);
  let tagsRef = useRef<HTMLDivElement | null>(null);
  let actionsRef = useRef<HTMLDivElement | null>(null);
  let hiddenTagsRef = useRef<HTMLDivElement | null>(null);
  let [tagState, setTagState] = useState({visibleTagCount: collection.size, showCollapseButton: false});
  let [isCollapsed, setIsCollapsed] = useState(maxRows != null);
  let {onRemove} = useContext(InternalTagGroupContext);
  let isEmpty = collection.size === 0;
  let showCollapseToggleButton = tagState.showCollapseButton || tagState.visibleTagCount < collection.size;
  let formContext = useContext(FormContext);
  let domRef = useDOMRef(ref);

  let allItems = useMemo(
    () => Array.from(collection) as Array<Node<T>>,
    [collection]
  );
  let items = useMemo(
    () => Array.from(collection).slice(0, !isCollapsed ? collection.size : tagState.visibleTagCount) as Array<Node<T>>,
    [collection, tagState.visibleTagCount, isCollapsed]
  );

  let updateVisibleTagCount = useEffectEvent(() => {
    if (maxRows == null) {
      setTagState({visibleTagCount: collection.size, showCollapseButton: false});
    }

    if (maxRows != null && maxRows > 0) {
      let computeVisibleTagCount = () => {
        let currContainerRef: HTMLDivElement | null = hiddenTagsRef.current;
        let currTagsRef: HTMLDivElement | null = hiddenTagsRef.current;
        let currActionsRef: HTMLDivElement | null = actionsRef.current;
        if (!currContainerRef || !currTagsRef || collection.size === 0 || currContainerRef.parentElement == null) {
          return {
            visibleTagCount: 0,
            showCollapseButton: false
          };
        }

        // Count rows and show tags until we hit the maxRows.
        // I think this is still a safe assumption, and we don't need to queryAll for role=tag
        let tags = [...currTagsRef.children];
        let currY = -Infinity;
        let rowCount = 0;
        let index = 0;
        let tagWidths: number[] = [];
        for (let tag of tags) {
          let {width, y} = tag.getBoundingClientRect();

          if (y !== currY) {
            currY = y;
            rowCount++;
          }

          if (rowCount > maxRows) {
            break;
          }
          tagWidths.push(width);
          index++;
        }

        // Remove tags until there is space for the collapse button and action button (if present) on the last row.
        let buttons = currActionsRef ? [...currActionsRef.children] : [];
        if (buttons.length > 0 && rowCount >= maxRows) {
          let buttonsWidth = buttons.reduce((acc, curr) => acc += curr.getBoundingClientRect().width, 0);
          let margins = parseFloat(getComputedStyle(buttons[0]).marginInlineStart);
          buttonsWidth += margins * 2;
          let end = direction === 'ltr' ? 'right' : 'left';
          let containerEnd = currContainerRef.parentElement?.getBoundingClientRect()[end] - margins;
          let lastTagEnd = tags[index - 1]?.getBoundingClientRect()[end];
          lastTagEnd += margins;
          let availableWidth = containerEnd - lastTagEnd;

          while (availableWidth <= buttonsWidth && index > 0) {
            let tagWidth = tagWidths.pop();
            if (tagWidth != null) {
              availableWidth += tagWidth;
            }
            index--;
          }
        }

        return {
          visibleTagCount: Math.max(index, 1),
          showCollapseButton: index < collection.size
        };
      };
      let result = computeVisibleTagCount();
      flushSync(() => {
        setTagState(result);
      });
    }
  });

  useResizeObserver({ref: maxRows != null ? containerRef : undefined, onResize: updateVisibleTagCount});

  useLayoutEffect(() => {
    if (collection.size > 0 && (maxRows != null && maxRows > 0)) {
      queueMicrotask(updateVisibleTagCount);
    }
  }, [collection.size, updateVisibleTagCount, maxRows]);

  useEffect(() => {
    // Recalculate visible tags when fonts are loaded.
    document.fonts?.ready.then(() => updateVisibleTagCount());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let handlePressCollapse = () => {
    setIsCollapsed(prevCollapsed => !prevCollapsed);
  };

  let helpText: ReactNode = null;
  if (!isInvalid && description) {
    helpText =  (
      <Text
        slot="description"
        styles={helpTextStyles({size})}>
        {description}
      </Text>
    );
  } else if (isInvalid) {
    helpText = (
      <div
        className={helpTextStyles({size, isInvalid})}>
        <CenterBaseline>
          <AlertIcon />
        </CenterBaseline>
        <Text slot="errorMessage">
          {errorMessage}
        </Text>
      </div>
    );
  }

  return (
    <AriaTagGroup
      {...otherProps}
      ref={domRef}
      style={UNSAFE_style}
      className={UNSAFE_className + style(field(), getAllowedOverrides())({
        size,
        labelPosition: labelPosition,
        isInForm: !!formContext
      }, props.styles)}>
      <FieldLabel
        size={size}
        labelPosition={labelPosition}
        labelAlign={labelAlign}
        contextualHelp={props.contextualHelp}>
        {label}
      </FieldLabel>
      <div
        ref={containerRef}
        className={style({
          gridArea: 'input',
          minWidth: 'full',
          marginStart: {
            default: -4,
            isEmpty: 0
          },
          marginEnd: {
            default: 4,
            isEmpty: 0
          },
          position: 'relative'
        })({isEmpty})}>
        <FormContext.Provider value={{...formContext, size}}>
          <Provider
            values={[
              [RACTextContext, undefined],
              [TagGroupContext, {size, isEmphasized}]
            ]}>
            {/* invisible collection for measuring */}
            {maxRows != null && (
              <div
                // @ts-ignore
                inert={inertValue(true)}
                ref={hiddenTagsRef}
                className={style({
                  display: 'inline',
                  flexWrap: 'wrap',
                  fontFamily: 'sans',
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  start: -4,
                  end: 4,
                  visibility: 'hidden',
                  overflow: 'hidden',
                  opacity: 0
                })}>
                {allItems.map(item => {
                  // pull off individual props as an allow list, don't want refs or other props getting through
                  return (
                    <div
                      style={item.props.UNSAFE_style}
                      key={item.key}
                      className={item.props.className({size, allowsRemoving: Boolean(onRemove)})}>
                      {item.props.children({size, allowsRemoving: Boolean(onRemove), isInCtx: true})}
                    </div>
                  );
                })}
              </div>
            )}
            {/* real tag list */}
            <TagList
              ref={tagsRef}
              items={items}
              renderEmptyState={renderEmptyState}
              className={style({
                display: 'inline',
                minWidth: 'full',
                font: 'ui'
              })}>
              {item => <Tag {...item.props} id={item.key} textValue={item.textValue} />}
            </TagList>
            {!isEmpty && (showCollapseToggleButton || groupActionLabel) &&
              <ActionGroup
                collection={collection}
                aria-label={props['aria-label']}
                aria-labelledby={props['aria-labelledby']}
                actionsRef={actionsRef}
                tagState={tagState}
                size={size}
                isCollapsed={isCollapsed}
                handlePressCollapse={handlePressCollapse}
                onGroupAction={onGroupAction}
                groupActionLabel={groupActionLabel} />
            }
          </Provider>
        </FormContext.Provider>
      </div>
      {helpText}
    </AriaTagGroup>
  );
}

function ActionGroup(props) {
  let stringFormatter = useLocalizedStringFormatter(intlMessages, '@react-spectrum/s2');
  let {
    actionsRef,
    tagState,
    size,
    isCollapsed,
    handlePressCollapse,
    onGroupAction,
    groupActionLabel,
    collection,
    // directly use aria-labelling from the TagGroup because we can't use the id from the TagList
    // and we can't supply an id to the TagList because it'll cause an issue where all the tag ids flip back
    // and forth with their prefix in an infinite loop
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy
  } = props;

  let actionsId = useId();
  // might need to localize the aria-label which concatenates with this label
  let actionGroupLabel = stringFormatter.format('tag.actions');
  return (
    <div
      role="group"
      ref={actionsRef}
      id={actionsId}
      aria-label={ariaLabel ? `${ariaLabel} ${actionGroupLabel}` : actionGroupLabel}
      aria-labelledby={ariaLabelledBy ? ariaLabelledBy : undefined}
      className={style({
        display: 'inline'
      })}>
      {tagState.showCollapseButton &&
        <ActionButton
          isQuiet
          size={size}
          styles={style({margin: 4})}
          UNSAFE_style={{display: 'inline-flex'}}
          onPress={handlePressCollapse}>
          {isCollapsed ?
            stringFormatter.format('tag.showAllButtonLabel', {tagCount: collection.size}) :
            stringFormatter.format('tag.hideButtonLabel')}
        </ActionButton>
      }
      {groupActionLabel && onGroupAction &&
        <ActionButton
          isQuiet
          size={size}
          styles={style({margin: 4})}
          UNSAFE_style={{display: 'inline-flex'}}
          onPress={() => onGroupAction?.()}>
          {groupActionLabel}
        </ActionButton>
      }
    </div>
  );
}

const tagStyles = style({
  ...focusRing(),
  display: 'inline-flex',
  boxSizing: 'border-box',
  maxWidth: 'full',
  verticalAlign: 'middle',
  alignItems: 'center',
  justifyContent: 'center',
  font: 'control',
  height: 'control',
  transition: 'default',
  minWidth: 0,
  // maxWidth: '[calc(self(height) * 7)]', // s2 designs show a max width on tags but we pushed back on this in v3
  backgroundColor: {
    default: 'gray-100',
    isHovered: {
      default: 'gray-200'
    },
    isFocusVisible: {
      default: 'gray-200'
    },
    isSelected: {
      default: 'neutral',
      isEmphasized: {
        default: 'accent'
      }
    },
    isDisabled: 'disabled',
    forcedColors: {
      default: 'ButtonFace',
      isSelected: 'Highlight'
    }
  },
  color: {
    default: 'neutral',
    isSelected: {
      default: 'gray-25',
      isEmphasized: 'white'
    },
    isDisabled: 'disabled',
    forcedColors: {
      default: 'ButtonText',
      isSelected: 'HighlightText',
      isDisabled: 'GrayText'
    }
  },
  borderStyle: 'none',
  paddingStart: {
    default: 'edge-to-text'
  },
  paddingEnd: {
    default: 'edge-to-text',
    allowsRemoving: 0
  },
  paddingY: 0,
  margin: 4,
  borderRadius: 'control',
  cursor: {
    default: 'default',
    isLink: 'pointer'
  },
  '--iconMargin': {
    type: 'marginTop',
    value: {
      default: fontRelative(-2)
    }
  },
  '--iconPrimary': {
    type: 'fill',
    value: 'currentColor'
  }
});

const avatarSize = {
  S: 16,
  M: 20,
  L: 24
} as const;

/** An individual Tag for TagGroups. */
export const Tag = /*#__PURE__*/ (forwardRef as forwardRefType)(function Tag({children, textValue, ...props}: TagProps, ref: DOMRef<HTMLDivElement>) {
  textValue ||= typeof children === 'string' ? children : undefined;
  let ctx = useSlottedContext(TagGroupContext);
  let isInRealDOM = Boolean(ctx?.size);
  let {size, isEmphasized} = ctx ?? {};
  let domRef = useDOMRef(ref);

  let backupRef = useRef(null);
  domRef = domRef || backupRef;
  let isLink = props.href != null;
  return (
    <AriaTag
      textValue={textValue}
      {...props}
      ref={domRef}
      style={pressScale(domRef)}
      className={renderProps => tagStyles({size, isEmphasized, isLink, ...renderProps})} >
      {composeRenderProps(children, (children, renderProps) => (
        <TagWrapper isInRealDOM={isInRealDOM} {...renderProps}>{typeof children === 'string' ? <Text>{children}</Text> : children}</TagWrapper>
      ))}
    </AriaTag>
  );
});

function TagWrapper({children, isDisabled, allowsRemoving, isInRealDOM}) {
  let {size = 'M'} = useSlottedContext(TagGroupContext) ?? {};
  return (
    <>
      {isInRealDOM && (
      <div
        className={style({
          display: 'flex',
          minWidth: 0,
          alignItems: 'center',
          gap: 'text-to-visual',
          forcedColorAdjust: 'none',
          backgroundColor: 'transparent'
        })}>
        <Provider
          values={[
            [TextContext, {styles: style({order: 1, truncate: true})}],
            [IconContext, {
              render: centerBaseline({slot: 'icon', styles: style({order: 0})}),
              styles: style({size: fontRelative(20), marginStart: '--iconMargin', flexShrink: 0})
            }],
            [AvatarContext, {
              size: avatarSize[size],
              styles: style({order: 0})
            }],
            [ImageContext, {
              styles: style({
                size: fontRelative(20),
                flexShrink: 0,
                order: 0,
                aspectRatio: 'square',
                objectFit: 'contain',
                borderRadius: 'sm'
              })
            }]
          ]}>
          {children}
        </Provider>
      </div>
        )}
      {!isInRealDOM && children}
      {allowsRemoving && isInRealDOM && (
        <ClearButton
          slot="remove"
          size={size}
          isDisabled={isDisabled} />
      )}
    </>
  );
}
