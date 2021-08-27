/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {AsyncLoadingCardView, ControlledCardView, DynamicCardView, items, NoItemCardView, renderEmptyState, StaticCardView} from './GridCardView.stories';
import {WaterfallLayout} from '../';

let itemsNoSize = [
  {src: 'https://i.imgur.com/Z7AzH2c.jpg', title: 'Bob 1'},
  {src: 'https://i.imgur.com/DhygPot.jpg', title: 'Joe 1'},
  {src: 'https://i.imgur.com/L7RTlvI.png', title: 'Jane 1'},
  {src: 'https://i.imgur.com/1nScMIH.jpg', title: 'Bob 2'},
  {src: 'https://i.imgur.com/DhygPot.jpg', title: 'Joe 2'},
  {src: 'https://i.imgur.com/1nScMIH.jpg', title: 'Jane 2'},
  {src: 'https://i.imgur.com/Z7AzH2c.jpg', title: 'Bob 3'},
  {src: 'https://i.imgur.com/L7RTlvI.png', title: 'Joe 3'},
  {src: 'https://i.imgur.com/zzwWogn.jpg', title: 'Jane 3'},
  {src: 'https://i.imgur.com/1nScMIH.jpg', title: 'Bob 4'},
  {src: 'https://i.imgur.com/L7RTlvI.png', title: 'Joe 4'},
  {src: 'https://i.imgur.com/Z7AzH2c.jpg', title: 'Jane 4'},
  {src: 'https://i.imgur.com/L7RTlvI.png', title: 'Bob 5'},
  {src: 'https://i.imgur.com/1nScMIH.jpg', title: 'Joe 5'},
  {src: 'https://i.imgur.com/L7RTlvI.png', title: 'Jane 5'},
  {src: 'https://i.imgur.com/1nScMIH.jpg', title: 'Bob 6'},
  {src: 'https://i.imgur.com/zzwWogn.jpg', title: 'Joe 6'},
  {src: 'https://i.imgur.com/DhygPot.jpg', title: 'Jane 6'},
  {src: 'https://i.imgur.com/L7RTlvI.png', title: 'Bob 7'},
  {src: 'https://i.imgur.com/Z7AzH2c.jpg', title: 'Joe 7'},
  {src: 'https://i.imgur.com/1nScMIH.jpg', title: 'Jane 7'},
  {src: 'https://i.imgur.com/zzwWogn.jpg', title: 'Bob 8'}
];

export default {
  title: 'CardView/Waterfall layout'
};

export const DefaultWaterfallStatic = () => StaticCardView({layout: WaterfallLayout, items});
DefaultWaterfallStatic.storyName = 'static card';

export const DefaultWaterfall = () => DynamicCardView({layout: WaterfallLayout, items});
DefaultWaterfall.storyName = 'size provided with items';

export const DefaultWaterfallNoSize = () => DynamicCardView({layout: WaterfallLayout, items: itemsNoSize});
DefaultWaterfallNoSize.storyName = 'no size provided with items';

export const QuietWaterfall = () => DynamicCardView({layout: WaterfallLayout, items, isQuiet: true});
QuietWaterfall.storyName = 'quiet cards';

export const QuietWaterfallNoSize = () => DynamicCardView({layout: WaterfallLayout, items: itemsNoSize, isQuiet: true});
QuietWaterfallNoSize.storyName = 'quiet cards, no size provided with items';

export const DisabledKeys = () => DynamicCardView({layout: WaterfallLayout, items, disabledKeys: ['Joe 2', 'Bob 4']});
DisabledKeys.storyName = 'disabled keys, Joe2, Bob 4';

export const NoSelection = () => DynamicCardView({layout: WaterfallLayout, items, selectionMode: 'none'});
NoSelection.storyName = 'no selection allowed';

export const SingleSelection = () => DynamicCardView({layout: WaterfallLayout, items, selectionMode: 'single'});
SingleSelection.storyName = 'single selection only';

export const SelectedKeys = () => ControlledCardView({layout: WaterfallLayout, items});
SelectedKeys.storyName = 'selected keys, controlled';

export const isLoadingNoHeightWaterfall = () => NoItemCardView({layout: WaterfallLayout, width: '800px', loadingState: 'loading'});
isLoadingNoHeightWaterfall.storyName = 'loadingState = loading, no height';

export const isLoadingHeightWaterfall = () => NoItemCardView({layout: WaterfallLayout, width: '800px', height: '800px', loadingState: 'loading'});
isLoadingHeightWaterfall.storyName = 'loadingState = loading, set height';

export const loadingMoreWaterfall = () => DynamicCardView({layout: WaterfallLayout, width: '800px', height: '800px', loadingState: 'loadingMore', items});
loadingMoreWaterfall.storyName = 'loadingState = loadingMore';

export const emptyWithHeightWaterfall = () => NoItemCardView({layout: WaterfallLayout, width: '800px', height: '800px', renderEmptyState});
emptyWithHeightWaterfall.storyName = 'empty, set height';

export const AsyncLoading = () => AsyncLoadingCardView({layout: WaterfallLayout, width: '800px', height: '800px'});
AsyncLoading.storyName = 'Async loading';
