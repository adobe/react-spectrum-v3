import React from "react";
import { PartialNode } from "@react-stately/collections";
import { SelectionGroupProps } from "@react-types/shared";

function SelectionGroup<T extends object>(props: SelectionGroupProps<T>) {
  return null;
}

SelectionGroup.__name = "SelectionGroup";

SelectionGroup.getCollectionNode = function* getCollectionNode<T>(
  props: any
): Generator<PartialNode<T>> {
  let { children, items } = props;
  yield {
    type: "selectionGroup",
    props,
    hasChildNodes: true,
    *childNodes() {
      if (typeof children === "function") {
        if (!items) {
          throw new Error(
            "props.children was a function but props.items is missing"
          );
        }

        for (let item of items) {
          yield {
            type: "item",
            value: item,
            renderer: children,
          };
        }
      } else {
        let items: PartialNode<T>[] = [];
        React.Children.forEach(children, (child) => {
          items.push({
            type: "item",
            element: child,
          });
        });

        yield* items;
      }
    },
  };
};

// We don't want getCollectionNode to show up in the type definition
let _SelectionGroup = SelectionGroup as (props: SelectionGroupProps<object>) => JSX.Element;
export { _SelectionGroup as SelectionGroup };
