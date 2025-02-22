import React from "react";
import { Heading } from "@react-spectrum/s2";
import { style } from "@react-spectrum/s2/style" with { type: "macro" };

export default function Section(props) {
  let { title, children } = props;
  return (
    <div className={style({ marginY: 8 })}>
      <Heading
        styles={style({
          textAlign: "center",
          font: "heading-lg",
        })}
        id={title.toLowerCase()}
        level={2}
      >
        {title}
      </Heading>
      <div
        className={style({
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        })}
      >
        {children}
      </div>
    </div>
  );
}
