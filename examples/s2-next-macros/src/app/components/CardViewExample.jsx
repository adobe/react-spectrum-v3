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

import { ActionMenu, Avatar, Card, CardPreview, CardView, Collection, CollectionCardPreview, Content, Image, MenuItem, SkeletonCollection, Text } from '@react-spectrum/s2';
import Folder from '@react-spectrum/s2/icons/Folder';
import ErrorIcon from '@react-spectrum/s2/illustrations/linear/AlertNotice';
import { style } from "@react-spectrum/s2/style" with { type: "macro" };
import { useAsyncList } from 'react-stately';

const cardViewStyles = style({
  width: 'full',
  maxWidth: '[800px]',
  height: '[800px]',
  margin: 32
});

const avatarSize = {
  XS: 16,
  S: 20,
  M: 24,
  L: 28,
  XL: 32
};

function PhotoCard({item, layout}) {
  return (
    <Card id={item.id} textValue={item.description || item.alt_description}>
      {({size}) => (<>
        <CardPreview>
          <Image
            alt={item.description || item.alt_description}
            src={item.urls.regular}
            styles={style({
              width: 'full',
              pointerEvents: 'none'
            })}
            // TODO - should we have a safe `dynamicStyles` or something for this?
            UNSAFE_style={{
              aspectRatio: layout === 'waterfall' ? `${item.width} / ${item.height}` : '4/3',
              objectFit: layout === 'waterfall' ? 'contain' : 'cover'
            }}
            renderError={() => (
              <div className={style({display: 'flex', alignItems: 'center', justifyContent: 'center', size: 'full'})}>
                <ErrorIcon size="S" />
              </div>
            )} />
        </CardPreview>
        <Content>
          <Text slot="title">{item.description || item.alt_description}</Text>
          {size !== 'XS' && <ActionMenu>
            <MenuItem>Test</MenuItem>
          </ActionMenu>}
          <div className={style({display: 'flex', alignItems: 'center', gap: 8, gridArea: 'description'})}>
            <Avatar src={item.user.profile_image.small} size={avatarSize[size]} />
            <Text slot="description">{item.user.name}</Text>
          </div>
        </Content>
      </>)}
    </Card>
  );
}

export const CardViewExample = (props) => {
  let list = useAsyncList({
    async load({signal, cursor, items}) {
      let page = cursor || 1;
      let res = await fetch(
        `https://api.unsplash.com/topics/nature/photos?page=${page}&per_page=30&client_id=AJuU-FPh11hn7RuumUllp4ppT8kgiLS7LtOHp_sp4nc`,
        {signal}
      );
      let nextItems = await res.json();
      // Filter duplicates which might be returned by the API.
      let existingKeys = new Set(items.map(i => i.id));
      nextItems = nextItems.filter(i => !existingKeys.has(i.id) && (i.description || i.alt_description));
      return {items: nextItems, cursor: nextItems.length ? page + 1 : null};
    }
  });

  let loadingState = props.loadingState === 'idle' ? list.loadingState : props.loadingState;
  let items = loadingState === 'loading' ? [] : list.items;

  return (
    <CardView
      aria-label="Nature photos"
      {...props}
      loadingState={loadingState}
      onLoadMore={props.loadingState === 'idle' ? list.loadMore : undefined}
      styles={cardViewStyles}>
      <Collection items={items} dependencies={[props.layout]}>
        {item => <PhotoCard item={item} layout={props.layout || 'grid'} />}
      </Collection>
      {(loadingState === 'loading' || loadingState === 'loadingMore') && (
        <SkeletonCollection>
          {() => (
            <PhotoCard
              item={{
                id: Math.random(),
                user: {name: 'Devon Govett', profile_image: {small: ''}},
                urls: {regular: ''},
                description: 'This is a fake description. Kinda long so it wraps to a new line.',
                alt_description: '',
                width: 400,
                height: 200 + Math.max(0, Math.round(Math.random() * 400))
              }}
              layout={props.layout || 'grid'} />
          )}
        </SkeletonCollection>
      )}
    </CardView>
  );
};

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