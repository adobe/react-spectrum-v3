import {version} from 'react';

export function inertValue(value?: boolean) {
  const pieces = version.split('.');
  const major = parseInt(pieces[0], 10);
  if (major >= 19) {
    return value;
  }
  // compatibility with React < 19
  return value ? 'true' : undefined;
}
