import useLocalStorage from '../useLocalStorage';

export default function useSelectedStory(): [string[], (value: string[]) => void] {
  return useLocalStorage('selectedStory', []) as any;
}
