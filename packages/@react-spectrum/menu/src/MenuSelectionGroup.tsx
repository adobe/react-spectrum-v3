import { Node, SelectionGroupProps } from "@react-types/shared";
import {
  SelectionManager,
  useMultipleSelectionState,
} from "@react-stately/selection";
import { TreeState } from "@react-stately/tree";
import React, { useMemo, Key, useEffect } from "react";
import { MenuItem } from "./MenuItem";

interface MenuSelectionGroupProps<T>
  extends SelectionGroupProps<T> {
  item: Node<T>;
  state: TreeState<T>;
  onAction?: (key: Key) => void;
}

export function MenuSelectionGroup<T extends object>(
  props: MenuSelectionGroupProps<T>
) {
  const {
    collection: tree,
    selectionManager: menuSelectionManager,
  } = props.state;

  let selectionState = useMultipleSelectionState(props);

  const selectionManager = useMemo(
    () => new SelectionManager(tree, selectionState),
    [tree, selectionState]
  );

  const newState = {
    ...props.state,
    selectionManager,
  };

  useEffect(() => {
    selectionManager.setFocusedKey(menuSelectionManager.focusedKey);
  }, [menuSelectionManager.focusedKey]);

  useEffect(() => {
    selectionManager.setFocused(menuSelectionManager.isFocused);
  }, [menuSelectionManager.isFocused]);

  return (
    <>
      {[...props.item.childNodes].map((node) => {
        let item = (
          <MenuItem
            key={node.key}
            item={node}
            state={newState}
            onAction={props.onAction}
          />
        );

        if (node.wrapper) {
          item = node.wrapper(item);
        }

        return item;
      })}
    </>
  );
}
