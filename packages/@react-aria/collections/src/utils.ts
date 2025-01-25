import {Key} from '@react-types/shared';

export function getNodeKey(key: Key, idScope?: Key) {
  return idScope ? `${idScope}:${key}` : `${key}`;
}
