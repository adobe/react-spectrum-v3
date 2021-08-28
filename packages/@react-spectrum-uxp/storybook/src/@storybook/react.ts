import {useEffect, useState} from 'react';

export const components = new Map<string, StoryComponent>();

export class StoryComponent {

  name: string;
  module: any;
  parameters: any[];
  stories: Map<string, Story>;

  constructor(name: string, module: any) {
    this.name = name;
    this.module = module;
    this.parameters = [];
    this.stories = new Map();
  }

  addParameters(parameter: any): this {
    this.parameters.push(parameter);
    return this;
  }

  add(name: string, render: () => any): this {
    this.stories.set(name, new Story(name, render));
    return this;
  }

  getStory(name: string) {
    return this.stories.get(name);
  }

}

export class Story {

  name: string;
  render: () => any;

  constructor(name: string, render: () => any) {
    this.name = name;
    this.render = render;
  }

}

export function storiesOf(name: string, module: any) {
  console.log('====== storiesOf', {name});
  let component = new StoryComponent(name, module);
  components.set(name, component);
  notifyListeners();
  return component;
}

export function getComponent(name: string) {
  return components.get(name);
}

export function getStory(componentName: string, storyName: string) {
  return getComponent(componentName)?.getStory(storyName);
}

function notifyListeners() {
  for (let listener of listeners) {
    listener(components);
  }
}
let listeners = new Set<any>();

export function useComponents() {
  let [, setComponents] = useState(components);

  useEffect(() => {
    listeners.add(setComponents);
    return () => {
      listeners.delete(setComponents);
    };
  }, []);

  return components;
}
