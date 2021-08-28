import React from 'react';
import useLocalStorage from '../../useLocalStorage';
import './SidebarItem.css';

export default function SidebarItem(props: { name: string, selected?: boolean, indent: number, defaultOpen?: boolean, action?: any, children?: any }) {
  let [open, setOpen] = useLocalStorage(props.name, false);
  let toggle = () => setOpen(!open);
  let {selected, indent, action = toggle, ...rest} = props;
  let baseStyle = {paddingLeft: indent * 16};
  let style = selected ? {...baseStyle, color: 'blue'} : baseStyle;
  return (
    // css is not working... for some reason with this older version of parcel 2...
    //  so we are going to style it manually so we at least see it as blue.
    <div className={'SidebarItem' + (selected ? ' selected' : '')} style={style} {...rest}>
      <button className="SidebarItem_Title" onClick={action}>
        {props.name}
      </button>
      {
        !open ? null : <div className="SidebarItem_Children">
          {props.children}
        </div>
      }
    </div>
  );
}
