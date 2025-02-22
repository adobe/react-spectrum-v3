
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

import { Card, CardView, Collection, CollectionCardPreview, Content, Image, SkeletonCollection, Text } from '@react-spectrum/s2';
import Folder from '@react-spectrum/s2/icons/Folder';
import { style } from "@react-spectrum/s2/style" with { type: "macro" };
import { useAsyncList } from 'react-stately';

const cardViewStyles = style({
  width: 'full',
  maxWidth: '[800px]',
  height: '[800px]',
  margin: 32
});

function TopicCard({topic}) {
  return (
    <Card href={topic.links.html} target="_blank" textValue={topic.title}>
      <CollectionCardPreview>
        {topic.preview_photos.slice(0, 4).map(photo => (
          <Image key={photo.id} alt="" src={photo.urls.small} />
        ))}
      </CollectionCardPreview>
      <Content>
        <Text slot="title">{topic.title}</Text>
        <div className={style({display: 'flex', alignItems: 'center', gap: 8})}>
          <Folder />
          <Text slot="description">{topic.total_photos.toLocaleString()} photos</Text>
        </div>
      </Content>
    </Card>
  );
}

export const CollectionCardsExample = (props) => {
  let list = useAsyncList({
    async load({signal, cursor}) {
      let page = cursor || 1;
      let res = await fetch(
        `https://api.unsplash.com/topics?page=${page}&per_page=30&client_id=AJuU-FPh11hn7RuumUllp4ppT8kgiLS7LtOHp_sp4nc`,
        {signal}
      );
      let items = (await res.json()).filter((topic) => !!topic.preview_photos);
      return {items, cursor: items.length ? page + 1 : null};
    }
  });

  let loadingState = props.loadingState === 'idle' ? list.loadingState : props.loadingState;
  let items = loadingState === 'loading' ? [] : list.items;

  return (
    <CardView
      aria-label="Topics"
      {...props}
      loadingState={loadingState}
      onLoadMore={props.loadingState === 'idle' ? list.loadMore : undefined}
      styles={cardViewStyles}>
      <Collection items={items}>
        {topic => <TopicCard topic={topic} />}
      </Collection>
      {(loadingState === 'loading' || loadingState === 'loadingMore') && (
        <SkeletonCollection>
          {() => (
            <TopicCard
              topic={{
                id: Math.random().toString(36),
                title: 'Topic title',
                total_photos: 80,
                links: {html: ''},
                preview_photos: [
                  {id: 'a', urls: {small: ''}},
                  {id: 'b', urls: {small: ''}},
                  {id: 'c', urls: {small: ''}},
                  {id: 'd', urls: {small: ''}}
                ]
              }} />
          )}
        </SkeletonCollection>
      )}
    </CardView>
  );
};