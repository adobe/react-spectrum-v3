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

import {action} from '@storybook/addon-actions';
import {ActionMenu, Item} from '@react-spectrum/menu';
import assetStyles from '@adobe/spectrum-css-temp/components/asset/vars.css';
import {Avatar} from '@react-spectrum/avatar';
import {Button} from '@react-spectrum/button';
import {Card} from '../';
import {CardBase} from '../src/CardBase';
import {CardViewContext} from '../src/CardViewContext';
import {classNames, useSlotProps, useStyleProps} from '@react-spectrum/utils';
import {Content, Footer} from '@react-spectrum/view';
import {getDescription, getImage} from './utils';
import {Heading, Text} from '@react-spectrum/text';
import {IllustratedMessage} from '@react-spectrum/illustratedmessage';
import {Image} from '@react-spectrum/image';
import {Meta, Story} from '@storybook/react';
import React from 'react';
import {SpectrumCardProps} from '@react-types/cards';


const meta: Meta<SpectrumCardProps> = {
  title: 'Card/default',
  component: Card
};

export default meta;


const Template = (): Story<SpectrumCardProps> => (args) => (
  <div style={{width: '208px'}}>
    <Card {...args} />
  </div>
);

/* This is a bit of a funny template, we can't get selected on a Card through context because
* if there's context it assumes it's being rendered in a collection. It's just here for a quick check of styles. */
let manager = {
  isSelected: () => true,
  select: action('select')
};
let state = {
  disabledKeys: new Set(),
  selectionManager: manager
};
const TemplateSelected = (): Story<SpectrumCardProps> => (args) => (
  <div style={{width: '208px'}}>
    <CardViewContext.Provider value={{state}}>
      <CardBase {...args} />
    </CardViewContext.Provider>
  </div>
);


export const Default = Template().bind({});
Default.args = {children: (
  <>
    <Image src="https://i.imgur.com/Z7AzH2c.jpg" />
    <Avatar src="https://mir-s3-cdn-cf.behance.net/project_modules/disp/690bc6105945313.5f84bfc9de488.png" />
    <Heading>Title</Heading>
    <Text slot="detail">PNG</Text>
    <Content>Description</Content>
    <ActionMenu>
      <Item>Action 1</Item>
      <Item>Action 2</Item>
    </ActionMenu>
    <Footer>
      <Button variant="primary">Something</Button>
    </Footer>
  </>
)};

export const DefaultSquare = Template().bind({});
DefaultSquare.args = {children: (
  <>
    <Image src="https://i.imgur.com/DhygPot.jpg" />
    <Heading>Title</Heading>
    <Text slot="detail">PNG</Text>
    <Content>Description</Content>
    <ActionMenu>
      <Item>Action 1</Item>
      <Item>Action 2</Item>
    </ActionMenu>
    <Footer>
      <Button variant="primary">Something</Button>
    </Footer>
  </>
)};

export const DefaultTall = Template().bind({});
DefaultTall.args = {children: (
  <>
    <Image src="https://i.imgur.com/3lzeoK7.jpg" />
    <Heading>Title</Heading>
    <Text slot="detail">PNG</Text>
    <Content>Description</Content>
    <ActionMenu>
      <Item>Action 1</Item>
      <Item>Action 2</Item>
    </ActionMenu>
    <Footer>
      <Button variant="primary">Something</Button>
    </Footer>
  </>
)};

export const DefaultPreviewAlt = Template().bind({});
DefaultPreviewAlt.args = {children: (
  <>
    <Image alt="preview" src="https://i.imgur.com/Z7AzH2c.jpg" />
    <Heading>Title</Heading>
    <Text slot="detail">PNG</Text>
    <Content>Description</Content>
    <ActionMenu>
      <Item>Action 1</Item>
      <Item>Action 2</Item>
    </ActionMenu>
    <Footer>
      <Button variant="primary">Something</Button>
    </Footer>
  </>
)};

export const LongContent = Template().bind({});
LongContent.args = {children: (
  <>
    <Image src="https://i.imgur.com/Z7AzH2c.png" />
    <Heading>Title</Heading>
    <Text slot="detail">PNG</Text>
    <Content>This is the description that never ends, it goes on and on my friends. Someone started typing without knowing what it was.</Content>
    <ActionMenu>
      <Item>Action 1</Item>
      <Item>Action 2</Item>
    </ActionMenu>
    <Footer>
      <Button variant="primary">Something</Button>
    </Footer>
  </>
)};

export const LongContentSquare = Template().bind({});
LongContentSquare.args = {children: (
  <>
    <Image src="https://i.imgur.com/DhygPot.png" />
    <Heading>Title</Heading>
    <Text slot="detail">PNG</Text>
    <Content>This is the description that never ends, it goes on and on my friends. Someone started typing without knowing what it was.</Content>
    <ActionMenu>
      <Item>Action 1</Item>
      <Item>Action 2</Item>
    </ActionMenu>
    <Footer>
      <Button variant="primary">Something</Button>
    </Footer>
  </>
)};

export const LongContentPoorWordSize = Template().bind({});
LongContentPoorWordSize.args = {children: (
  <>
    <Image src="https://i.imgur.com/Z7AzH2c.png" />
    <Heading>Title</Heading>
    <Text slot="detail">PNG</Text>
    <Content>Rechtsschutzversicherungsgesellschaften Nahrungsmittelunverträglichkeit Unabhängigkeitserklärungen Freundschaftsbeziehungen</Content>
    <ActionMenu>
      <Item>Action 1</Item>
      <Item>Action 2</Item>
    </ActionMenu>
    <Footer>
      <Button variant="primary">Something</Button>
    </Footer>
  </>
)};

export const NoDescription = Template().bind({});
NoDescription.args = {children: (
  <>
    <Image src="https://i.imgur.com/Z7AzH2c.png" />
    <Heading>Title</Heading>
    <Text slot="detail">PNG</Text>
    <ActionMenu>
      <Item>Action 1</Item>
      <Item>Action 2</Item>
    </ActionMenu>
    <Footer>
      <Button variant="primary">Something</Button>
    </Footer>
  </>
)};

export const NoDescriptionSquare = Template().bind({});
NoDescriptionSquare.args = {children: (
  <>
    <Image src="https://i.imgur.com/DhygPot.jpg" />
    <Heading>Title</Heading>
    <Text slot="detail">PNG</Text>
    <ActionMenu>
      <Item>Action 1</Item>
      <Item>Action 2</Item>
    </ActionMenu>
    <Footer>
      <Button variant="primary">Something</Button>
    </Footer>
  </>
)};

export const NoFooter = Template().bind({});
NoFooter.args = {children: (
  <>
    <Image src="https://i.imgur.com/Z7AzH2c.png" />
    <Heading>Title</Heading>
    <Text slot="detail">PNG</Text>
    <Content>Description</Content>
    <ActionMenu>
      <Item>Action 1</Item>
      <Item>Action 2</Item>
    </ActionMenu>
  </>
)};

export const NoActionMenu = Template().bind({});
NoActionMenu.args = {children: (
  <>
    <Image src="https://i.imgur.com/Z7AzH2c.png" />
    <Heading>Title</Heading>
    <Text slot="detail">PNG</Text>
    <Content>Description</Content>
    <Footer>
      <Button variant="primary">Something</Button>
    </Footer>
  </>
)};

export const NoFooterOrDescription = Template().bind({});
NoFooterOrDescription.args = {children: (
  <>
    <Image src="https://i.imgur.com/Z7AzH2c.png" />
    <Heading>Title</Heading>
    <Text slot="detail">PNG</Text>
    <ActionMenu>
      <Item>Action 1</Item>
      <Item>Action 2</Item>
    </ActionMenu>
  </>
)};

export const NoImage = Template().bind({});
NoImage.args = {children: (
  <>
    <Heading>Title</Heading>
    <Text slot="detail">PNG</Text>
    <ActionMenu>
      <Item>Action 1</Item>
      <Item>Action 2</Item>
    </ActionMenu>
  </>
)};

export const CardGrid = (props: SpectrumCardProps) => (
  <div
    style={{
      width: '100%',
      margin: '50px',
      display: 'grid',
      gap: '20px',
      gridTemplateColumns: 'repeat(auto-fit, 208px)',
      gridAutoRows: 'auto',
      justifyContent: 'center',
      justifyItems: 'center',
      alignItems: 'start'
    }}>
    {
      (new Array(15).fill(0)).map((_, index) => {
        let url = getImage(index);
        return (
          <div style={{width: '208px', height: '293px'}}>
            <Card {...Default.args} {...props} layout="grid" key={`${index}${url}`}>
              <Image src={url} />
              <Heading>Title {index}</Heading>
              <Text slot="detail">PNG</Text>
              <Content>Description</Content>
              <ActionMenu>
                <Item>Action 1</Item>
                <Item>Action 2</Item>
              </ActionMenu>
              <Footer>
                <Button variant="secondary">Button</Button>
              </Footer>
            </Card>
          </div>
        );
      })
    }
  </div>
);

export const CardWaterfall = (props: SpectrumCardProps) => (
  <div
    style={{
      width: '100%',
      height: '150vh',
      margin: '50px',
      display: 'flex',
      flexDirection: 'column',
      flexWrap: 'wrap',
      alignItems: 'start'
    }}>
    {
      (new Array(15).fill(0)).map((_, index) => {
        let url = getImage(index);
        return (
          <div style={{width: '208px', margin: '10px'}}>
            <Card {...Default.args} {...props} layout="waterfall" key={`${index}${url}`}>
              <Image src={url} />
              <Heading>Title {index}</Heading>
              <Text slot="detail">PNG</Text>
              <Content>{getDescription(index)}</Content>
              <ActionMenu>
                <Item>Action 1</Item>
                <Item>Action 2</Item>
              </ActionMenu>
              <Footer>
                <Button variant="secondary">Button</Button>
              </Footer>
            </Card>
          </div>
        );
      })
    }
  </div>
);

export const CardFloat = (props: SpectrumCardProps) => (
  <div
    style={{
      width: '100%',
      margin: '50px'
    }}>
    {
      (new Array(15).fill(0)).map((_, index) => {
        let url = getImage(index);
        return (
          <div style={{float: 'left', margin: '10px'}}>
            <Card {...Default.args} {...props} key={`${index}${url}`}>
              <Image src={url} />
              <Heading>Title {index}</Heading>
              <Text slot="detail">PNG</Text>
              <Content>Description</Content>
              <ActionMenu>
                <Item>Action 1</Item>
                <Item>Action 2</Item>
              </ActionMenu>
              <Footer>
                <Button variant="secondary">Button</Button>
              </Footer>
            </Card>
          </div>
        );
      })
    }
  </div>
);

export const WithIllustration = Template().bind({});
WithIllustration.args = {children: (
  <>
    <File alt="file" slot="illustration" width={50} height={50} />
    <Heading>Title</Heading>
    <Text slot="detail">PNG</Text>
    <ActionMenu>
      <Item>Action 1</Item>
      <Item>Action 2</Item>
    </ActionMenu>
  </>
)};

export const WithColorfulIllustration = Template().bind({});
WithColorfulIllustration.args = {children: (
  <>
    <IllustrationContainer><ColorfulIllustration /></IllustrationContainer>
    <Heading>Title</Heading>
    <Text slot="detail">PNG</Text>
    <ActionMenu>
      <Item>Action 1</Item>
      <Item>Action 2</Item>
    </ActionMenu>
  </>
)};

// doesn't work right now, Illustrated Message messes with the styles and has some other interference
export const WithColorfulIllustratedMessage = Template().bind({});
WithColorfulIllustratedMessage.args = {children: (
  <>
    <IllustratedMessage><ColorfulIllustration /></IllustratedMessage>
    <Heading>Title</Heading>
    <Text slot="detail">PNG</Text>
    <ActionMenu>
      <Item>Action 1</Item>
      <Item>Action 2</Item>
    </ActionMenu>
  </>
)};

export const LongTitle = Template().bind({});
LongTitle.args = {children: (
  <>
    <Image src="https://i.imgur.com/Z7AzH2c.jpg" />
    <Heading>This is a long title about how dinosaurs used to rule the earth before a meteor came and wiped them all out</Heading>
    <Text slot="detail">PNG</Text>
    <Content>Description</Content>
    <ActionMenu>
      <Item>Action 1</Item>
      <Item>Action 2</Item>
    </ActionMenu>
    <Footer>
      <Button variant="primary">Something</Button>
    </Footer>
  </>
)};

export const LongDescription = Template().bind({});
LongDescription.args = {children: (
  <>
    <Image src="https://i.imgur.com/Z7AzH2c.jpg" />
    <Heading>Title</Heading>
    <Text slot="detail">PNG</Text>
    <Content>This is a long description about the Pterodactyl, a pterosaur of the late Jurassic period, with a long slender head and neck and a very short tail.</Content>
    <ActionMenu>
      <Item>Action 1</Item>
      <Item>Action 2</Item>
    </ActionMenu>
    <Footer>
      <Button variant="primary">Something</Button>
    </Footer>
  </>
)};

export const LongDetail = Template().bind({});
LongDetail.args = {children: (
  <>
    <Image src="https://i.imgur.com/Z7AzH2c.jpg" />
    <Heading>Title</Heading>
    <Text slot="detail">Stats: Genus: Pterodactylus; Rafinesque, 1815 Order: Pterosauria Kingdom: Animalia Phylum: Chordata</Text>
    <Content>Description</Content>
    <ActionMenu>
      <Item>Action 1</Item>
      <Item>Action 2</Item>
    </ActionMenu>
    <Footer>
      <Button variant="primary">Something</Button>
    </Footer>
  </>
)};

export const Selected = TemplateSelected().bind({});
Selected.args = {...Default.args};

// actually use Illustration???
// where to get the three asset svgs to use with Illustration
function File(props) {
  props = useSlotProps(props, 'asset');
  let {styleProps} = useStyleProps(props);
  return (
    <div className={classNames(assetStyles, styleProps.className)}>
      <svg
        viewBox="0 0 128 128"
        {...styleProps as any}
        className={classNames(assetStyles, 'spectrum-Asset-file')}
        aria-label={props.alt}
        aria-hidden={props.decorative || null}
        role="img">
        <g>
          <path
            className={classNames(assetStyles, 'spectrum-Asset-fileBackground')}
            d="M24,126c-5.5,0-10-4.5-10-10V12c0-5.5,4.5-10,10-10h61.5c2.1,0,4.1,0.8,5.6,2.3l20.5,20.4c1.5,1.5,2.4,3.5,2.4,5.7V116c0,5.5-4.5,10-10,10H24z" />
          <g>
            <path
              className={classNames(assetStyles, 'spectrum-Asset-fileOutline')}
              d="M113.1,23.3L92.6,2.9C90.7,1,88.2,0,85.5,0H24c-6.6,0-12,5.4-12,12v104c0,6.6,5.4,12,12,12h80c6.6,0,12-5.4,12-12V30.4C116,27.8,114.9,25.2,113.1,23.3z M90,6l20.1,20H92c-1.1,0-2-0.9-2-2V6z M112,116c0,4.4-3.6,8-8,8H24c-4.4,0-8-3.6-8-8V12c0-4.4,3.6-8,8-8h61.5c0.2,0,0.3,0,0.5,0v20c0,3.3,2.7,6,6,6h20c0,0.1,0,0.3,0,0.4V116z" />
          </g>
        </g>
      </svg>
    </div>
  );
}

function IllustrationContainer(props) {
  props = useSlotProps(props, 'illustration');
  let {styleProps} = useStyleProps(props);
  return (
    <div {...styleProps}>
      {props.children}
    </div>
  );
}

// disable the rest, it's for show
/* eslint-disable */
function ColorfulIllustration(props) {
  return (
    <svg viewBox="0 0 612 792">
      <style dangerouslySetInnerHTML={{__html: `
        .st0{display:none;}
        .st1{display:inline;}
        .st2{display:inline;fill:none;stroke:#000000;stroke-width:3;stroke-miterlimit:10;}
        .st3{display:inline;fill:none;stroke:#000000;stroke-width:2;stroke-miterlimit:10;}
        .st4{display:inline;fill:none;stroke:#000000;stroke-miterlimit:10;}
        .st5{display:inline;fill:none;}
        .st6{fill:#2D2D2D;}
        .st7{fill:none;stroke:#000000;stroke-width:3;stroke-miterlimit:10;}
        .st8{fill:#3F3F3F;}
        .st9{fill:#FFFFFF;}
        .st10{fill:#43A547;}
        .st11{fill:#43A548;}
        .st12{fill:none;}
        .st13{fill:none;stroke:#000000;stroke-width:2;stroke-miterlimit:10;}
        .st14{fill:none;stroke:#000000;stroke-miterlimit:10;}
      `}} />
      <g id="Trace" className="st0">
        <path className="st2" d="M284,279c-62.23,0-113.75,45.84-122.64,105.59l18.01-3.33c0,0,17.1-40.07,71.34-42.02
        c54.23-1.95,70.85,44.71,61.56,55.21c9.28-1.47,10.26,20.52,6.35,27.85c17.59,5.37,15.15,56.19,6.84,75.73
        c2.55,4.15,6.77,12.67,9.39,18.09C377.98,496.71,408,453.36,408,403C408,334.52,352.48,279,284,279z"/>
        <g className="st1">
          <path d="M254.12,428.65c1.9-4.77,3.97-9.47,6.15-14.13c1.09-2.33,2.21-4.65,3.39-6.94c1.16-2.31,2.59-4.47,4.02-6.65
          c0.74-1.08,1.51-2.14,2.39-3.16c0.45-0.51,0.92-1.01,1.5-1.47c0.29-0.23,0.61-0.46,1.02-0.64c0.2-0.09,0.44-0.17,0.7-0.22
          c0.29-0.05,0.56-0.03,0.8,0.01c0.88,0.18,1.48,0.5,2.09,0.82c0.6,0.33,1.16,0.68,1.72,1.04c1.1,0.73,2.15,1.5,3.18,2.29
          c4.1,3.18,7.93,6.61,11.7,10.13c3.75,3.52,7.41,7.14,10.95,10.89c1.77,1.88,3.5,3.78,5.18,5.75c1.68,1.97,3.32,3.97,4.78,6.17
          c1.46,2.28,2.53,4.61,3.54,7.03c0.99,2.41,1.84,4.87,2.55,7.37c0.71,2.5,1.28,5.05,1.67,7.63c0.19,1.29,0.33,2.6,0.38,3.93
          c0.04,1.33,0.04,2.67-0.29,4.1l-0.25,1.06l-1.01-0.34c-2.95-1-5.63-2.15-8.42-3.25l-8.28-3.37c-5.51-2.25-11.03-4.48-16.56-6.66
          c-2.77-1.08-5.53-2.17-8.33-3.18c-2.79-0.98-5.52-2.23-8.3-3.05c-0.34-0.1-0.69-0.19-1.02-0.26c-0.37-0.07-0.5-0.09-0.89-0.02
          c-0.67,0.09-1.38,0.29-2.08,0.5c-1.4,0.43-2.78,0.96-4.16,1.51c-2.74,1.13-5.47,2.34-8.15,3.63c2.56-1.53,5.15-3.01,7.83-4.34
          c1.34-0.67,2.69-1.31,4.11-1.87c0.71-0.27,1.42-0.54,2.22-0.71c0.21-0.04,0.35-0.1,0.66-0.11c0.25-0.01,0.46,0.01,0.67,0.03
          c0.41,0.05,0.79,0.12,1.17,0.2c1.5,0.32,2.94,0.74,4.38,1.17c1.44,0.43,2.87,0.87,4.26,1.42l8.35,3.22
          c5.55,2.18,11.07,4.42,16.58,6.67l8.27,3.36c2.74,1.09,5.55,2.28,8.24,3.19l-1.26,0.72c0.25-1.07,0.28-2.32,0.24-3.54
          c-0.05-1.23-0.18-2.48-0.36-3.72c-0.37-2.48-0.93-4.95-1.61-7.38c-0.69-2.43-1.51-4.82-2.47-7.15c-0.97-2.31-2.05-4.66-3.37-6.69
          c-2.81-4.13-6.29-7.93-9.75-11.65c-3.5-3.71-7.13-7.31-10.86-10.8c-3.73-3.48-7.55-6.89-11.55-10c-1-0.77-2.02-1.52-3.06-2.21
          c-0.52-0.34-1.04-0.67-1.57-0.96c-0.51-0.28-1.08-0.54-1.46-0.61c-0.08-0.01-0.13-0.01-0.15-0.01c-0.05,0.01-0.12,0.03-0.21,0.07
          c-0.18,0.08-0.39,0.21-0.6,0.39c-0.42,0.34-0.84,0.77-1.24,1.22c-0.8,0.92-1.53,1.93-2.24,2.97c-1.44,2.07-2.63,4.32-4,6.47
          c-1.34,2.17-2.63,4.37-3.9,6.6C258.93,419.59,256.51,424.11,254.12,428.65z"/>
        </g>
        <g className="st1">
          <path d="M273.67,476.54l9.84,3.73l-0.24,0.08c1.86-3.18,3.91-6.25,6.27-9.11c1.19-1.42,2.46-2.79,3.95-3.96
          c0.74-0.6,1.58-1.09,2.47-1.48c0.88-0.36,1.77-0.67,2.67-0.91c3.59-1.02,7.24-1.61,10.88-2.18c3.65-0.54,7.3-0.98,10.98-1.34
          l0.15,1.99c-3.64,0.22-7.29,0.53-10.92,0.93c-3.62,0.43-7.27,0.88-10.78,1.75c-1.77,0.44-3.45,0.95-4.86,2.03
          c-1.44,1.04-2.73,2.34-3.95,3.68c-2.42,2.72-4.57,5.7-6.54,8.79l-0.09,0.14l-0.15-0.06L273.67,476.54z"/>
        </g>
        <g className="st1">
          <path d="M195.49,410.09c1.67-2.31,3.44-4.53,5.24-6.74c2.02-1.98,4.03-3.97,6.12-5.9c1.06-0.97,2.08-1.92,3.3-2.83
          c0.15-0.11,0.33-0.23,0.51-0.34c0.1-0.06,0.23-0.13,0.35-0.18c0.11-0.06,0.51-0.17,0.72-0.13c0.59,0.1,0.62,0.2,0.87,0.29
          l0.51,0.27c0.64,0.37,1.25,0.75,1.85,1.13c2.4,1.54,4.73,3.12,7.08,4.68c4.69,3.12,9.36,6.31,14.19,9.08
          c0.6,0.34,1.21,0.67,1.82,0.96c0.59,0.29,1.26,0.58,1.69,0.66c0.09-0.02-0.02,0.04,0.16-0.01c0.12-0.04,0.23-0.06,0.36-0.11
          c0.27-0.12,0.54-0.23,0.83-0.4c0.58-0.28,1.09-0.73,1.67-1.08c2.39-1.36,4.68-3.05,6.97-4.73c-1.74,2.26-3.63,4.39-5.8,6.35
          c-0.28,0.24-0.58,0.45-0.91,0.63c-0.32,0.19-0.63,0.4-0.97,0.58c-0.32,0.19-0.71,0.35-1.08,0.51c-0.2,0.08-0.43,0.13-0.65,0.19
          c-0.15,0.07-0.63,0.07-0.89,0.03c-0.95-0.19-1.57-0.52-2.25-0.84c-0.67-0.32-1.3-0.67-1.92-1.02c-4.96-2.85-9.62-6.04-14.32-9.16
          c-2.35-1.57-4.68-3.15-7.04-4.66c-0.59-0.37-1.18-0.74-1.76-1.08l-0.42-0.23c-0.07-0.05-0.35-0.13-0.11-0.09
          c0.02-0.01,0.09,0.01,0.14,0c0.04,0,0.12-0.05,0.08-0.02l-0.12,0.06c-0.12,0.08-0.23,0.15-0.37,0.25
          c-1.04,0.78-2.09,1.74-3.12,2.68c-2.05,1.9-4.07,3.87-6.05,5.86C199.95,406.56,197.76,408.35,195.49,410.09z"/>
        </g>
        <g className="st1">
          <path d="M285.71,397.72l5.31,4.57c1.77,1.52,3.51,3.08,5.27,4.62l-0.71-0.15c1.48-0.63,2.84-1.66,4.12-2.78
          c1.28-1.12,2.45-2.38,3.71-3.56c1.26-1.19,2.56-2.36,3.95-3.46c0.7-0.54,1.42-1.08,2.2-1.54c0.39-0.24,0.8-0.44,1.23-0.61
          c0.43-0.16,0.91-0.29,1.39-0.22v0.2c-0.79,0.23-1.39,0.86-2,1.44c-0.6,0.6-1.18,1.23-1.76,1.87c-1.16,1.28-2.32,2.58-3.57,3.81
          c-1.25,1.23-2.63,2.36-4.06,3.42c-1.44,1.06-2.95,2.08-4.74,2.7l-0.42,0.15l-0.29-0.29c-1.64-1.66-3.29-3.31-4.91-4.99l-4.87-5.04
          L285.71,397.72z"/>
        </g>
        <path className="st3" d="M201.84,403.73c0,0-1.95,18.57,18.57,22.48c14.68,2.8,19.54-14.17,19.54-14.17"/>
        <path className="st1" d="M227.06,405.91c-3.52-2.29-7.22-4.8-10.25-6.82c-0.63,2.35-0.88,5.33-0.62,8.56
        c0.58,7.23,3.51,12.89,6.54,12.64c3.03-0.24,5.01-6.3,4.42-13.53C227.13,406.48,227.09,406.2,227.06,405.91z M222.87,413.08
        c-1.06,0.18-2.26-1.61-2.67-4c-0.41-2.39,0.12-4.48,1.18-4.66c1.06-0.18,2.26,1.61,2.67,4
        C224.46,410.8,223.93,412.89,222.87,413.08z"/>
        <path className="st1" d="M308.48,396.98c-2.86,2.56-6.55,6.66-10.05,9.01c0.49,5.42,3.37,9.59,6.66,9.44c3.45-0.16,6.03-4.99,5.77-10.8
        C310.72,401.57,309.81,398.85,308.48,396.98z M304.81,410.66c-1.06,0-1.92-1.32-1.92-2.96c0-1.63,0.86-2.96,1.92-2.96
        c1.06,0,1.92,1.32,1.92,2.96C306.73,409.33,305.87,410.66,304.81,410.66z"/>
        <g className="st1">
          <path d="M295.13,493.16c-0.09-1.59-0.04-2.97,0.03-4.43c0.08-1.44,0.23-2.87,0.41-4.29c0.37-2.84,0.93-5.65,1.67-8.41
          c1.47-5.52,3.6-10.84,6.29-15.85c2.73-4.99,5.99-9.68,9.7-13.95c3.72-4.27,7.89-8.12,12.34-11.58c4.45-3.46,9.21-6.49,14.15-9.15
          c1.25-0.67,2.42-1.36,3.59-2.06l1.76-1.04l1.66-1.19l1.66-1.19c0.55-0.4,1.05-0.88,1.57-1.31c1.04-0.88,2.09-1.76,3.03-2.76
          c3.92-3.82,7.24-8.25,10.11-12.95c0.75-1.16,1.37-2.39,2.06-3.59c0.62-1.23,1.28-2.45,1.84-3.71c1.16-2.5,2.22-5.07,3.06-7.68
          l0.7,0.19c-0.71,2.73-1.64,5.37-2.74,7.95c-0.52,1.3-1.14,2.56-1.73,3.83c-0.66,1.24-1.23,2.52-1.96,3.73
          c-2.74,4.9-6.1,9.48-10.05,13.52c-0.95,1.05-2.02,1.97-3.08,2.91c-0.54,0.46-1.04,0.96-1.61,1.39l-1.7,1.27l-1.71,1.27l-1.82,1.11
          c-1.21,0.75-2.43,1.49-3.61,2.16c-4.79,2.72-9.38,5.79-13.64,9.26c-4.26,3.46-8.21,7.29-11.71,11.48
          c-3.49,4.21-6.51,8.77-9.01,13.6c-2.46,4.85-4.38,9.96-5.65,15.23c-0.64,2.63-1.11,5.3-1.4,7.98c-0.14,1.34-0.25,2.68-0.29,4.02
          c-0.04,1.31-0.05,2.72,0.05,3.9L295.13,493.16z"/>
        </g>
        <g className="st1">
          <path d="M254.06,449.02c2.54-1.57,5.12-3.07,7.79-4.43c1.34-0.68,2.69-1.34,4.1-1.91c0.72-0.28,1.42-0.56,2.23-0.74
          c0.22-0.04,0.35-0.11,0.68-0.12c0.27-0.01,0.48,0.01,0.69,0.03c0.42,0.05,0.81,0.11,1.19,0.19c1.52,0.3,2.96,0.73,4.37,1.25
          l4.22,1.52c2.8,1.04,5.58,2.11,8.36,3.2c5.55,2.18,11.07,4.42,16.58,6.67l8.27,3.36c2.74,1.09,5.55,2.28,8.24,3.19l-1.26,0.72
          c0.25-1.07,0.28-2.32,0.24-3.54c-0.05-1.23-0.18-2.48-0.36-3.72c-0.37-2.48-0.93-4.95-1.61-7.38c-0.69-2.43-1.51-4.82-2.47-7.15
          c-0.97-2.31-2.05-4.66-3.37-6.69c-2.81-4.13-6.29-7.93-9.75-11.65c-3.5-3.71-7.13-7.31-10.86-10.8
          c-3.72-3.49-7.56-6.87-11.54-10.01c-0.97-0.81-1.96-1.6-2.98-2.33c-0.51-0.37-1.02-0.72-1.54-1.03c-0.51-0.31-1.07-0.6-1.53-0.71
          c-0.3-0.11-0.76,0.13-1.23,0.49c-0.46,0.35-0.89,0.79-1.31,1.24c-0.83,0.92-1.59,1.94-2.32,2.97c-2.9,4.17-5.41,8.66-7.85,13.16
          c-2.43,4.51-4.77,9.07-7,13.69c2.05-4.7,4.2-9.36,6.47-13.96c2.3-4.59,4.65-9.16,7.46-13.5c0.71-1.08,1.46-2.15,2.31-3.16
          c0.43-0.5,0.88-1,1.43-1.45c0.27-0.23,0.57-0.44,0.94-0.61c0.18-0.09,0.39-0.16,0.62-0.2c0.25-0.04,0.48-0.03,0.7-0.01
          c0.81,0.14,1.41,0.43,2.03,0.72c0.6,0.3,1.18,0.63,1.74,0.97c1.12,0.68,2.2,1.42,3.26,2.17c4.12,3.15,7.93,6.61,11.71,10.11
          c3.75,3.52,7.41,7.14,10.95,10.89c1.77,1.88,3.5,3.78,5.18,5.75c1.68,1.97,3.32,3.97,4.78,6.17c1.46,2.28,2.53,4.61,3.54,7.03
          c0.99,2.41,1.84,4.87,2.55,7.37c0.71,2.5,1.28,5.05,1.67,7.63c0.19,1.29,0.33,2.6,0.38,3.93c0.04,1.33,0.04,2.67-0.29,4.1
          l-0.25,1.06l-1.01-0.34c-2.95-1-5.63-2.15-8.42-3.25l-8.28-3.37c-5.51-2.25-11.03-4.48-16.56-6.66
          c-5.51-2.18-11.13-4.3-16.67-6.06c-0.34-0.11-0.68-0.2-1-0.27c-0.37-0.07-0.45-0.09-0.84-0.03c-0.66,0.08-1.37,0.27-2.06,0.47
          c-1.39,0.41-2.78,0.93-4.16,1.47C259.5,446.58,256.77,447.77,254.06,449.02z"/>
        </g>
        <g className="st1">
          <path d="M339.52,425.68c0.11-0.16,0.15-0.18,0.21-0.24c0.06-0.06,0.11-0.09,0.16-0.13c0.1-0.08,0.2-0.15,0.29-0.19
          c0.2-0.12,0.37-0.18,0.56-0.25c0.36-0.12,0.71-0.18,1.05-0.22c0.67-0.07,1.31-0.04,1.93,0.03c1.24,0.14,2.4,0.45,3.54,0.8
          c1.14,0.36,2.25,0.77,3.33,1.24c1.09,0.45,2.15,0.96,3.21,1.45c-1.12-0.34-2.24-0.7-3.37-0.98c-1.13-0.3-2.27-0.55-3.4-0.74
          c-1.13-0.18-2.28-0.32-3.38-0.28c-0.55,0.01-1.09,0.07-1.57,0.19c-0.24,0.06-0.46,0.14-0.64,0.23c-0.08,0.05-0.18,0.1-0.22,0.15
          c-0.03,0.02-0.06,0.05-0.06,0.06c-0.01,0.01-0.02,0.02-0.01,0.01c0.01-0.01-0.01,0.02,0.06-0.08L339.52,425.68z"/>
        </g>
        <g className="st1">
          <path d="M341.94,424.24c0.21-0.3,0.45-0.79,0.63-1.23c0.2-0.45,0.36-0.93,0.51-1.42c0.29-0.97,0.49-1.99,0.63-3.01
          c0.14-1.03,0.19-2.08,0.21-3.13c0.01-1.05-0.05-2.11-0.14-3.17c0.25,1.03,0.48,2.07,0.64,3.13c0.15,1.06,0.27,2.13,0.29,3.21
          c0.02,1.08-0.02,2.18-0.16,3.28c-0.08,0.55-0.17,1.1-0.31,1.65c-0.14,0.57-0.28,1.06-0.57,1.7L341.94,424.24z"/>
        </g>
        <g className="st1">
          <path d="M359.23,408.73c0.16-0.32,0.32-0.87,0.41-1.35c0.11-0.5,0.16-1.02,0.2-1.54c0.07-1.05-0.01-2.12-0.16-3.19
          c-0.15-1.07-0.43-2.13-0.75-3.18c-0.17-0.52-0.37-1.03-0.55-1.56l-0.66-1.52l0.88,1.42c0.26,0.49,0.55,0.97,0.79,1.48
          c0.48,1.01,0.94,2.05,1.27,3.14c0.33,1.09,0.58,2.22,0.69,3.39c0.05,0.58,0.07,1.17,0.04,1.77c-0.04,0.62-0.08,1.16-0.3,1.89
          L359.23,408.73z"/>
        </g>
        <g className="st1">
          <path d="M362.94,403.96c1.01,0.16,2.12,0.25,3.2,0.28c1.09,0.03,2.18-0.01,3.27-0.1c1.09-0.09,2.17-0.28,3.24-0.54
          c1.07-0.25,2.11-0.64,3.14-1.09c-0.94,0.6-1.93,1.14-2.98,1.56c-1.05,0.42-2.13,0.79-3.23,1.05c-1.1,0.27-2.23,0.48-3.36,0.62
          c-1.15,0.14-2.26,0.22-3.47,0.21L362.94,403.96z"/>
        </g>
        <path className="st4" d="M344.03,417.9c-3.42,0.24-5.05-8.94-7.08-19.54c-1.22-6.35-2.44-13.44-1.47-21.01
        c1.47-0.49,10.02,15.64,10.99,20.03C347.45,401.78,347.45,417.66,344.03,417.9z"/>
        <path className="st4" d="M359.42,400.56c-6.35-1.47-13.19-32.25-10.99-35.91C352.82,366.11,365.77,395.92,359.42,400.56z"/>
        <path className="st4" d="M367.72,404.22c0,0,8.79-13.19,31.76-10.26C398.26,399.83,371.39,414.48,367.72,404.22z"/>
        <path className="st4" d="M347.2,425.72c0,0,4.15,9.53,16.12,9.28c11.97-0.24,26.63-7.82,26.87-11.24c-1.71-1.22-15.64,4.4-24.92,2.2
        c-4.57-1.08-16.12-1.22-16.12-1.22L347.2,425.72z"/>
        <path className="st4" d="M386.29,355.12c-3.66,2.2-16.86,18.32-18.32,26.14c-1.47,7.82,5.08,8.73,8.79,4.4
        C379.7,382.24,387.02,360.25,386.29,355.12z"/>
        <g className="st1">
          <path d="M292.79,408.06c3.51,2.95,7,5.94,10.38,9.06c1.69,1.56,3.36,3.14,5.02,4.75c1.64,1.64,3.33,3.2,4.69,5.24l-1.01-0.44
          c0.72-0.11,1.45-0.4,2.11-0.89c0.67-0.48,1.29-1.1,1.85-1.79c1.12-1.38,2.09-2.99,2.94-4.67l0.19,0.06
          c-0.12,0.96-0.39,1.88-0.68,2.8c-0.32,0.92-0.72,1.81-1.22,2.67c-0.52,0.85-1.12,1.68-1.93,2.37c-0.79,0.7-1.8,1.27-2.94,1.47
          l-0.6,0.11l-0.41-0.55c-1.28-1.7-2.74-3.49-4.23-5.2c-1.51-1.71-3.08-3.37-4.66-5.02c-3.19-3.28-6.36-6.59-9.62-9.82
          L292.79,408.06z"/>
        </g>
      </g>
      <g id="Brushes" className="st0">
        <path className="st4" d="M165.41,383.22c5.62,2.5,12.37,0.01,16.97-4.07c4.61-4.08,7.72-9.53,11.52-14.36
        c8.7-11.06,21.17-18.92,34.66-22.9c13.5-3.98,27.97-4.19,41.79-1.54c10.69,2.05,21.27,5.92,29.63,12.9
        c8.36,6.98,14.25,17.39,14.08,28.28c-0.17,10.89-7.26,21.8-17.72,24.82"/>
        <path className="st4" d="M286.33,398.45c4.61,1.89,8.66,5.11,11.54,9.18"/>
        <path className="st4" d="M314.12,384.58c-0.82,4.43,1.18,8.88,3.54,12.71c2.37,3.83,5.19,7.51,6.31,11.87c0.51,1.99,0.57,4.07,0.26,6.1
        c-0.36,2.34-2.11,4.43-2.45,6.59c-0.43,2.82,4.76,7.64,6.2,10.48c4,7.89,5.37,17,4.84,25.77c-0.79,12.98-5.34,25.4-9.84,37.61"/>
        <path className="st4" d="M320.18,492.81c6.13,6.38,10.78,14.17,13.49,22.6"/>
        <path className="st4" d="M256.3,448.41c3.07-3.17,7.78-4.31,12.18-4.01c4.4,0.3,8.61,1.86,12.74,3.4c12.48,4.66,25.71,9.38,38.19,14.04
        c1.34-13.05-4.07-26.07-12.08-36.46s-18.48-18.56-28.84-26.62c-1.26-0.98-2.66-2.01-4.26-1.95c-2.43,0.08-3.99,2.53-5.11,4.68
        c-4.62,8.88-9.23,17.76-13.85,26.65"/>
        <path className="st4" d="M274.39,475.98c2.35,1.38,5,2.8,7.66,2.22c2.87-0.64,4.69-3.36,6.56-5.63c5.89-7.14,15.13-11.38,24.38-11.18"
        />
        <path className="st4" d="M297.62,492.94c-0.68-15.73,4.81-31.66,15.04-43.63c6.24-7.3,14.05-13.06,21.86-18.67
        c7.8-5.6,15.73-11.16,22.31-18.16s11.8-15.65,13.01-25.18"/>
        <path className="st4" d="M342.23,405.49c3.07,5.7,3.61,12.71,1.43,18.81"/>
        <path className="st4" d="M365.32,434.23c-7.04-5.2-15.71-8.15-24.46-8.31"/>
        <path className="st4" d="M380.64,400.87c-5.62,1-11.23,1.99-16.85,2.99"/>
        <path className="st4" d="M355.69,386.92c4.3,6,6.23,13.65,5.29,20.98"/>
        <path className="st4" d="M337.11,390.92c2.9,4.01,5.81,8.03,8.71,12.04c1.15,1.59,2.31,3.2,3.02,5.03c0.71,1.83,0.91,3.93,0.14,5.74
        c-3.43,7.95-8.79-1.72-10.21-5.23c-1.13-2.81-1.85-5.78-2.13-8.8C336.51,398.22,337.73,391.77,337.11,390.92z"/>
        <path className="st4" d="M351.13,434.48c1.95,1.64,4.54,2.35,7.09,2.54c7.09,0.54,14.36-2.83,18.53-8.59
        c-4.64,0.65-9.26-0.97-13.82-2.04c-3.9-0.91-8.45-1.47-12.19,0.37C347.25,428.48,348.42,432.2,351.13,434.48z"/>
        <path className="st4" d="M349.95,374.81c2.51,3.7,5.86,6.77,8.34,10.49c1.87,2.81,3.62,6.71,2.88,10.17c-0.65,3.02-3.35,5.6-5.92,2.78
        c-2.32-2.54-3.11-7.67-3.84-10.91C350.49,383.23,349.99,379.02,349.95,374.81z"/>
        <path className="st4" d="M391.44,395.99c-0.44,0.02-3.68,5.01-4.33,5.64c-1.8,1.78-3.88,3.3-6.13,4.47c-3.03,1.57-8.29,3.38-9.46-1.17
        C368.76,394.27,385.91,396.24,391.44,395.99z"/>
        <path className="st4" d="M365.56,376.89c1.6-1.94,4.19-2.67,6.49-3.69c4.9-2.18,8.97-6.17,11.25-11.02c1.16,5.68,1.56,11.51,1.18,17.29
        c-0.19,2.9-0.66,5.98-2.6,8.14C376.04,394.12,359.15,384.67,365.56,376.89z"/>
        <path className="st4" d="M249.08,405.11c-2.35,3.54-6.23,6.3-10.48,6.31c-3.85,0.01-7.37-2.19-10.28-4.72s-5.46-5.5-8.71-7.58
        c-3.24-2.08-7.49-3.16-10.97-1.5c-1.15,0.55-2.14,1.36-3.13,2.16c-3.65,2.98-7.31,5.95-10.96,8.93"/>
      </g>
      <g id="Trace_copy" className="st0">
        <path className="st2" d="M284,279c-62.23,0-113.75,45.84-122.64,105.59l18.01-3.33c0,0,17.1-40.07,71.34-42.02
        c54.23-1.95,68.57,43.49,61.56,55.21c6.84,2.12,10.26,20.52,6.35,27.85c17.59,5.37,15.15,56.19,6.84,75.73
        c2.55,4.15,6.77,12.67,9.39,18.09C377.98,496.71,408,453.36,408,403C408,334.52,352.48,279,284,279z"/>
        <path className="st1" d="M254.12,428.65c1.9-4.77,3.97-9.47,6.15-14.13c1.09-2.33,2.21-4.65,3.39-6.94c1.16-2.31,2.59-4.47,4.02-6.65
        c0.74-1.08,1.51-2.14,2.39-3.16c0.45-0.51,0.92-1.01,1.5-1.47c0.29-0.23,0.61-0.46,1.02-0.64c0.2-0.09,0.44-0.17,0.7-0.22
        c0.29-0.05,0.56-0.03,0.8,0.01c0.88,0.18,1.48,0.5,2.09,0.82c0.6,0.33,1.16,0.68,1.72,1.04c1.1,0.73,2.15,1.5,3.18,2.29
        c4.1,3.18,7.93,6.61,11.7,10.13c3.75,3.52,7.41,7.14,10.95,10.89c1.77,1.88,3.5,3.78,5.18,5.75c1.68,1.97,3.32,3.97,4.78,6.17
        c1.46,2.28,2.53,4.61,3.54,7.03c0.99,2.41,1.84,4.87,2.55,7.37c0.71,2.5,1.28,5.05,1.67,7.63c0.19,1.29,0.33,2.6,0.38,3.93
        c0.04,1.33,0.04,2.67-0.29,4.1l-0.25,1.06l-1.01-0.34c-2.95-1-5.63-2.15-8.42-3.25l-8.28-3.37c-5.51-2.25-11.03-4.48-16.56-6.66
        c-2.77-1.08-5.53-2.17-8.33-3.18c-2.79-0.98-5.52-2.23-8.3-3.05c-0.34-0.1-0.69-0.19-1.02-0.26c-0.37-0.07-0.5-0.09-0.89-0.02
        c-0.67,0.09-1.38,0.29-2.08,0.5c-1.4,0.43-2.78,0.96-4.16,1.51c-2.74,1.13-5.47,2.34-8.15,3.63c2.56-1.53,5.15-3.01,7.83-4.34
        c1.34-0.67,2.69-1.31,4.11-1.87c0.71-0.27,1.42-0.54,2.22-0.71c0.21-0.04,0.35-0.1,0.66-0.11c0.25-0.01,0.46,0.01,0.67,0.03
        c0.41,0.05,0.79,0.12,1.17,0.2c1.5,0.32,2.94,0.74,4.38,1.17c1.44,0.43,2.87,0.87,4.26,1.42l8.35,3.22
        c5.55,2.18,11.07,4.42,16.58,6.67l8.27,3.36c2.74,1.09,5.55,2.28,8.24,3.19l-1.26,0.72c0.25-1.07,0.28-2.32,0.24-3.54
        c-0.05-1.23-0.18-2.48-0.36-3.72c-0.37-2.48-0.93-4.95-1.61-7.38c-0.69-2.43-1.51-4.82-2.47-7.15c-0.97-2.31-2.05-4.66-3.37-6.69
        c-2.81-4.13-6.29-7.93-9.75-11.65c-3.5-3.71-7.13-7.31-10.86-10.8c-3.73-3.48-7.55-6.89-11.55-10c-1-0.77-2.02-1.52-3.06-2.21
        c-0.52-0.34-1.04-0.67-1.57-0.96c-0.51-0.28-1.08-0.54-1.46-0.61c-0.08-0.01-0.13-0.01-0.15-0.01c-0.05,0.01-0.12,0.03-0.21,0.07
        c-0.18,0.08-0.39,0.21-0.6,0.39c-0.42,0.34-0.84,0.77-1.24,1.22c-0.8,0.92-1.53,1.93-2.24,2.97c-1.44,2.07-2.63,4.32-4,6.47
        c-1.34,2.17-2.63,4.37-3.9,6.6C258.93,419.59,256.51,424.11,254.12,428.65z"/>
        <path className="st1" d="M273.67,476.54l9.84,3.73l-0.24,0.08c1.86-3.18,3.91-6.25,6.27-9.11c1.19-1.42,2.46-2.79,3.95-3.96
        c0.74-0.6,1.58-1.09,2.47-1.48c0.88-0.36,1.77-0.67,2.67-0.91c3.59-1.02,7.06-1.87,10.7-2.44c3.65-0.54,5.11-1.11,8.79-1.47
        l1.3,1.63c-3.64,0.22-6.14,0.98-9.77,1.38c-3.62,0.43-7.21,1.18-10.72,2.05c-1.77,0.44-3.45,0.95-4.86,2.03
        c-1.44,1.04-2.73,2.34-3.95,3.68c-2.42,2.72-4.57,5.7-6.54,8.79l-0.09,0.14l-0.15-0.06L273.67,476.54z"/>
        <path className="st1" d="M195.49,410.09c1.67-2.31,3.44-4.53,5.24-6.74c2.02-1.98,4.03-3.97,6.12-5.9c1.06-0.97,2.08-1.92,3.3-2.83
        c0.15-0.11,0.33-0.23,0.51-0.34c0.1-0.06,0.23-0.13,0.35-0.18c0.11-0.06,0.51-0.17,0.72-0.13c0.59,0.1,0.62,0.2,0.87,0.29
        l0.51,0.27c0.64,0.37,1.25,0.75,1.85,1.13c2.4,1.54,4.73,3.12,7.08,4.68c4.69,3.12,9.36,6.31,14.19,9.08
        c0.6,0.34,1.21,0.67,1.82,0.96c0.59,0.29,1.26,0.58,1.69,0.66c0.09-0.02-0.02,0.04,0.16-0.01c0.12-0.04,0.23-0.06,0.36-0.11
        c0.27-0.12,0.54-0.23,0.83-0.4c0.58-0.28,1.09-0.73,1.67-1.08c2.39-1.36,4.68-3.05,6.97-4.73c-1.74,2.26-3.63,4.39-5.8,6.35
        c-0.28,0.24-0.58,0.45-0.91,0.63c-0.32,0.19-0.63,0.4-0.97,0.58c-0.32,0.19-0.71,0.35-1.08,0.51c-0.2,0.08-0.43,0.13-0.65,0.19
        c-0.15,0.07-0.63,0.07-0.89,0.03c-0.95-0.19-1.57-0.52-2.25-0.84c-0.67-0.32-1.3-0.67-1.92-1.02c-4.96-2.85-9.62-6.04-14.32-9.16
        c-2.35-1.57-4.68-3.15-7.04-4.66c-0.59-0.37-1.18-0.74-1.76-1.08l-0.42-0.23c-0.07-0.05-0.35-0.13-0.11-0.09
        c0.02-0.01,0.09,0.01,0.14,0c0.04,0,0.12-0.05,0.08-0.02l-0.12,0.06c-0.12,0.08-0.23,0.15-0.37,0.25
        c-1.04,0.78-2.09,1.74-3.12,2.68c-2.05,1.9-4.07,3.87-6.05,5.86C199.95,406.56,197.76,408.35,195.49,410.09z"/>
        <path className="st1" d="M285.71,397.72l5.31,4.57c1.77,1.52,3.51,3.08,5.27,4.62l-0.71-0.15c1.48-0.63,2.84-1.66,4.12-2.78
        c1.28-1.12,2.45-2.38,3.71-3.56c1.26-1.19,2.91-3.08,3.48-3.77c0.58-0.68,1.29-1.49,2.08-1.95c0.39-0.24,1.4,0.29,1.83,0.12
        c0.43-0.16,0.91-0.29,1.39-0.22v0.2c-0.79,0.23-1.39,0.86-2,1.44c-0.6,0.6-1.18,1.23-1.76,1.87c-1.16,1.28-2.32,2.58-3.57,3.81
        c-1.25,1.23-2.63,2.36-4.06,3.42c-1.44,1.06-2.95,2.08-4.74,2.7l-0.42,0.15l-0.29-0.29c-1.64-1.66-3.29-3.31-4.91-4.99l-4.87-5.04
        L285.71,397.72z"/>
        <path className="st3" d="M201.84,403.73c0,0-1.95,18.57,18.57,22.48c14.68,2.8,19.54-14.17,19.54-14.17"/>
        <path className="st1" d="M308.48,396.98c-2.86,2.56-6.55,6.66-10.05,9.01c0.49,5.42,3.37,9.59,6.66,9.44c3.45-0.16,6.03-4.99,5.77-10.8
        C310.72,401.57,309.81,398.85,308.48,396.98z M303.5,410.48c-1.06,0-1.92-1.32-1.92-2.96c0-1.63,0.86-2.96,1.92-2.96
        c1.06,0,1.92,1.32,1.92,2.96C305.43,409.15,304.57,410.48,303.5,410.48z"/>
        <path className="st1" d="M254.06,449.02c2.54-1.57,5.12-3.07,7.79-4.43c1.34-0.68,2.69-1.34,4.1-1.91c0.72-0.28,1.42-0.56,2.23-0.74
        c0.22-0.04,0.35-0.11,0.68-0.12c0.27-0.01,0.48,0.01,0.69,0.03c0.42,0.05,0.81,0.11,1.19,0.19c1.52,0.3,2.96,0.73,4.37,1.25
        l4.22,1.52c2.8,1.04,5.58,2.11,8.36,3.2c5.55,2.18,11.07,4.42,16.58,6.67l8.27,3.36c2.74,1.09,5.55,2.28,8.24,3.19l-1.26,0.72
        c0.25-1.07,0.28-2.32,0.24-3.54c-0.05-1.23-0.18-2.48-0.36-3.72c-0.37-2.48-0.93-4.95-1.61-7.38c-0.69-2.43-1.51-4.82-2.47-7.15
        c-0.97-2.31-2.05-4.66-3.37-6.69c-2.81-4.13-6.29-7.93-9.75-11.65c-3.5-3.71-7.13-7.31-10.86-10.8
        c-3.72-3.49-7.56-6.87-11.54-10.01c-0.97-0.81-1.96-1.6-2.98-2.33c-0.51-0.37-1.02-0.72-1.54-1.03c-0.51-0.31-1.07-0.6-1.53-0.71
        c-0.3-0.11-0.76,0.13-1.23,0.49c-0.46,0.35-0.89,0.79-1.31,1.24c-0.83,0.92-1.59,1.94-2.32,2.97c-2.9,4.17-5.41,8.66-7.85,13.16
        c-2.43,4.51-4.77,9.07-7,13.69c2.05-4.7,4.2-9.36,6.47-13.96c2.3-4.59,4.65-9.16,7.46-13.5c0.71-1.08,1.46-2.15,2.31-3.16
        c0.43-0.5,0.88-1,1.43-1.45c0.27-0.23,0.57-0.44,0.94-0.61c0.18-0.09,0.39-0.16,0.62-0.2c0.25-0.04,0.48-0.03,0.7-0.01
        c0.81,0.14,1.41,0.43,2.03,0.72c0.6,0.3,1.18,0.63,1.74,0.97c1.12,0.68,2.2,1.42,3.26,2.17c4.12,3.15,7.93,6.61,11.71,10.11
        c3.75,3.52,7.41,7.14,10.95,10.89c1.77,1.88,3.5,3.78,5.18,5.75c1.68,1.97,3.32,3.97,4.78,6.17c1.46,2.28,2.53,4.61,3.54,7.03
        c0.99,2.41,1.84,4.87,2.55,7.37c0.71,2.5,1.28,5.05,1.67,7.63c0.19,1.29,0.33,2.6,0.38,3.93c0.04,1.33,0.04,2.67-0.29,4.1
        l-0.25,1.06l-1.01-0.34c-2.95-1-5.63-2.15-8.42-3.25l-8.28-3.37c-5.51-2.25-11.03-4.48-16.56-6.66c-5.51-2.18-11.13-4.3-16.67-6.06
        c-0.34-0.11-0.68-0.2-1-0.27c-0.37-0.07-0.45-0.09-0.84-0.03c-0.66,0.08-1.37,0.27-2.06,0.47c-1.39,0.41-2.78,0.93-4.16,1.47
        C259.5,446.58,256.77,447.77,254.06,449.02z"/>
        <path className="st1" d="M339.52,425.68c0.11-0.16,0.15-0.18,0.21-0.24c0.06-0.06,0.11-0.09,0.16-0.13c0.1-0.08,0.2-0.15,0.29-0.19
        c0.2-0.12,0.37-0.18,0.56-0.25c0.36-0.12,0.71-0.18,1.05-0.22c0.67-0.07,1.31-0.04,1.93,0.03c1.24,0.14,2.4,0.45,3.54,0.8
        c1.14,0.36,2.25,0.77,3.33,1.24c1.09,0.45,2.15,0.96,3.21,1.45c-1.12-0.34-2.24-0.7-3.37-0.98c-1.13-0.3-2.27-0.55-3.4-0.74
        c-1.13-0.18-2.28-0.32-3.38-0.28c-0.55,0.01-1.09,0.07-1.57,0.19c-0.24,0.06-0.46,0.14-0.64,0.23c-0.08,0.05-0.18,0.1-0.22,0.15
        c-0.03,0.02-0.06,0.05-0.06,0.06c-0.01,0.01-0.02,0.02-0.01,0.01c0.01-0.01-0.01,0.02,0.06-0.08L339.52,425.68z"/>
        <path className="st1" d="M341.94,424.24c0.21-0.3,0.45-0.79,0.63-1.23c0.2-0.45,0.36-0.93,0.51-1.42c0.29-0.97,0.49-1.99,0.63-3.01
        c0.14-1.03,0.19-2.08,0.21-3.13c0.01-1.05-0.05-2.11-0.14-3.17c0.25,1.03,0.48,2.07,0.64,3.13c0.15,1.06,0.27,2.13,0.29,3.21
        c0.02,1.08-0.02,2.18-0.16,3.28c-0.08,0.55-0.17,1.1-0.31,1.65c-0.14,0.57-0.28,1.06-0.57,1.7L341.94,424.24z"/>
        <path className="st1" d="M359.23,408.73c0.16-0.32,0.32-0.87,0.41-1.35c0.11-0.5,0.16-1.02,0.2-1.54c0.07-1.05-0.01-2.12-0.16-3.19
        c-0.15-1.07-0.43-2.13-0.75-3.18c-0.17-0.52-0.37-1.03-0.55-1.56l-0.66-1.52l0.88,1.42c0.26,0.49,0.55,0.97,0.79,1.48
        c0.48,1.01,0.94,2.05,1.27,3.14c0.33,1.09,0.58,2.22,0.69,3.39c0.05,0.58,0.07,1.17,0.04,1.77c-0.04,0.62-0.6,1.03-0.81,1.76
        L359.23,408.73z"/>
        <path className="st1" d="M362.94,403.96c1.01,0.16,2.12,0.25,3.2,0.28c1.09,0.03,2.18-0.01,3.27-0.1c1.09-0.09,2.17-0.28,3.24-0.54
        c1.07-0.25,2.11-0.64,3.14-1.09c-0.94,0.6-1.93,1.14-2.98,1.56c-1.05,0.42-2.13,0.79-3.23,1.05c-1.1,0.27-2.23,0.48-3.36,0.62
        c-1.15,0.14-2.26,0.22-3.47,0.21L362.94,403.96z"/>
        <path className="st4" d="M344.03,417.9c-3.42,0.24-5.05-8.94-7.08-19.54c-1.22-6.35-2.44-13.44-1.47-21.01
        c1.47-0.49,10.02,15.64,10.99,20.03C347.45,401.78,347.45,417.66,344.03,417.9z"/>
        <path className="st4" d="M359.42,400.56c-6.35-1.47-13.19-32.25-10.99-35.91C352.82,366.11,365.77,395.92,359.42,400.56z"/>
        <path className="st4" d="M367.72,404.22c0,0,8.79-13.19,31.76-10.26C398.26,399.83,371.39,414.48,367.72,404.22z"/>
        <path className="st4" d="M347.2,425.72c0,0,4.15,9.53,16.12,9.28c11.97-0.24,26.63-7.82,26.87-11.24c-1.71-1.22-15.6,4.23-24.92,2.2
        C355.92,423.93,347.2,425.72,347.2,425.72z"/>
        <path className="st1" d="M292.79,408.06c3.51,2.95,7,5.94,10.38,9.06c1.69,1.56,3.36,3.14,5.02,4.75c1.64,1.64,3.33,3.2,4.69,5.24
        l-1.01-0.44c0.72-0.11,1.45-0.4,2.11-0.89c0.67-0.48,1.29-1.1,1.85-1.79c1.12-1.38,2.09-2.99,2.94-4.67l0.19,0.06
        c-0.12,0.96-0.39,1.88-0.68,2.8c-0.32,0.92-0.72,1.81-1.22,2.67c-0.52,0.85-1.12,1.68-1.93,2.37c-0.79,0.7-1.8,1.27-2.94,1.47
        l-0.6,0.11l-0.41-0.55c-1.28-1.7-2.74-3.49-4.23-5.2c-1.51-1.71-3.08-3.37-4.66-5.02c-3.19-3.28-6.36-6.59-9.62-9.82L292.79,408.06
        z"/>
        <g className="st1">
          <path d="M305.69,456.45c-0.75,1.22-1.48,2.46-2.16,3.71c-2.69,5.01-4.82,10.33-6.29,15.85c-0.73,2.76-1.3,5.57-1.67,8.41
          c-0.18,1.42-0.33,2.85-0.41,4.29c-0.07,1.46-0.13,2.84-0.03,4.43l3.98-0.35c-0.1-1.18-0.09-2.59-0.05-3.9
          c0.05-1.34,0.15-2.68,0.29-4.02c0.29-2.68,0.76-5.35,1.4-7.98c1.27-5.27,3.19-10.38,5.65-15.23c0.71-1.37,1.47-2.71,2.26-4.03
          L305.69,456.45z"/>
          <path d="M370.06,388.01c-0.84,2.61-1.91,5.18-3.06,7.68c-0.56,1.26-1.22,2.48-1.84,3.71c-0.69,1.19-1.3,2.43-2.06,3.59
          c-2.87,4.7-6.19,9.13-10.11,12.95c-0.94,1-1.99,1.87-3.03,2.76c-0.53,0.44-1.02,0.91-1.57,1.31l-1.66,1.19l-1.66,1.19l-1.76,1.03
          c-1.17,0.69-2.34,1.38-3.59,2.06c-4.94,2.66-9.7,5.69-14.15,9.15c-2.98,2.31-5.81,4.82-8.49,7.49c0.4,0.97,0.78,1.98,1.07,2.85
          c2.78-3,5.79-5.79,8.98-8.38c4.25-3.47,8.85-6.53,13.64-9.26c1.18-0.67,2.4-1.42,3.61-2.16l1.82-1.11l1.71-1.27l1.7-1.27
          c0.56-0.43,1.07-0.93,1.61-1.39c1.06-0.94,2.13-1.86,3.08-2.91c3.95-4.04,7.31-8.62,10.05-13.52c0.72-1.2,1.3-2.49,1.96-3.73
          c0.58-1.28,1.21-2.53,1.73-3.83c1.1-2.58,2.03-5.22,2.74-7.95L370.06,388.01z"/>
        </g>
        <path className="st1" d="M228.47,407.89c-0.01-0.29,0.03-0.94,0-1.22c-3.52-2.29-8.63-5.55-11.66-7.57c-0.63,2.35-1.02,5.35-0.62,8.56
        c0.68,5.36,3.39,9.64,6.42,9.88C227.13,417.9,228.7,413.52,228.47,407.89z M221.96,411.66c-1.06,0-1.92-1.32-1.92-2.96
        c0-1.63,0.86-2.96,1.92-2.96c1.06,0,1.92,1.32,1.92,2.96C223.88,410.33,223.02,411.66,221.96,411.66z"/>
        <path id="SVGID_x5F_1_x5F_" className="st5" d="M284,519.85c64.43,0,116.85-52.42,116.85-116.85c0-64.43-52.42-116.85-116.85-116.85
        c-64.43,0-116.85,52.42-116.85,116.85C167.15,467.43,219.57,519.85,284,519.85z"/>
        <text className="st1">	<textPath startOffset="1165.844%">
          <tspan  style={{fontFamily: 'MyriadPro-Regular', fontSize: '16.6923px', letterSpacing: '262px'}}>{'DON’T  @HERE  ME'}</tspan>	</textPath>
        </text>
      </g>
      <g id="Colors">
        <path className="st6" d="M333.93,516.09c0.72-0.32,1.44-0.63,2.15-0.97l-2.63-1.23c-1.86-5.77-8.31-15.7-8.31-15.7
        s17.92-61.24-5.86-74.92c1.95-3.58,1.95-26.71-7.49-28.34c5.86-8.47-0.98-55.37-57.33-55.05s-74.27,41.04-74.27,41.04l-17.73,3.67
        l-1.29-1.41c-0.99,6.31-1.51,12.78-1.51,19.36c0,68.54,55.57,124.11,124.11,124.11c17.82,0,34.76-3.77,50.08-10.54
        c0.03-0.01,0.05-0.01,0.08-0.02C333.93,516.11,333.93,516.1,333.93,516.09z"/>
        <circle className="st7" cx="283.83" cy="403.33" r="124.33"/>
        <path className="st8" d="M254.12,428.82c2.44-6.76,15.71-31.95,18.89-32.25c3.18-0.3,34.85,25.73,39.09,36.48
        c4.23,10.75,9.77,14.33,8.79,29.97c-4.56-3.91-51.96-20.88-51.96-20.88l-14.49,6.88C254.45,449.01,251.6,435.8,254.12,428.82z"/>
        <path className="st8" d="M315.04,462.69c0,0-12.38,0.98-18.57,3.26c-6.19,2.28-13.1,14.67-13.1,14.67s-6.93-3.03-9.7-4.25
        c-2.56-1.13-19.22-27.36-19.22-27.36l14.49-6.88l46.1,18.6V462.69z"/>
        <path className="st9" d="M211.78,394.94l-10.42,9.45c0,0,0.63,20.78,21.5,22.48c12.05,0.98,16.29-14.33,16.29-14.33L211.78,394.94z"/>
        <path className="st9" d="M312.43,428.16c0,0,11.15-5.23,6.84-22.48c-3.26-13.03-7.49-10.75-7.49-10.75l-15.64,13.03l-1.63,1.95
        L312.43,428.16z"/>
        <path className="st10" d="M335.72,378.08c0,0-0.86,5.5-0.73,7.7c0.12,2.2,4.52,24.8,4.52,24.8s2.32,6.6,3.18,7.08
        c0.86,0.49,2.2-0.12,2.2-0.12l1.71-4.89c0,0,0.86-12.09,0.12-14.17C345.98,396.41,339.51,379.79,335.72,378.08z"/>
        <polygon className="st10" points="347.94,426.7 350.62,430.49 357.22,434.27 364.67,435 373.59,433.42 383.6,429.39 389.47,425.6
        390.08,423.89 387.76,423.64 377.99,425.6 368.7,426.58 360.03,425.11 350.38,424.99 	"/>
        <polygon className="st10" points="367.72,404.34 372.86,399.09 381.04,395.18 387.02,394.08 396.43,393.72 399.48,394.08
        397.65,397.02 392.89,400.68 384.34,405.32 378.6,407.15 372.61,407.89 368.82,406.06 	"/>
        <polygon className="st10" points="359.42,400.56 357.22,399.09 354.04,393.72 349.4,378.33 348.06,367.33 348.55,364.65 352.09,368.55
        357.22,378.94 361.13,392.62 361.13,397.87 	"/>
        <path className="st11" d="M384.42,360.74c-4.4,7.82-18.08,14.01-20.68,18.73s7.03,8.72,7.03,8.72s7.94,3.47,9.75,1.05
        C386.05,381.82,383.12,373.74,384.42,360.74z M377.09,382.6l-5.21-2.97l6.93-5.27L377.09,382.6z"/>
        <path id="SVGID_x5F_00000080910466905454608670000016559596414473353368_x5F_" className="st12" d="M284,519.85
        c64.43,0,116.85-52.42,116.85-116.85c0-64.43-52.42-116.85-116.85-116.85c-64.43,0-116.85,52.42-116.85,116.85
        C167.15,467.43,219.57,519.85,284,519.85z"/>
        <text>	<textPath startOffset="1165.844%">
          <tspan  className="st9" style={{fontFamily: 'MyriadPro-Regular', fontSize: '16.6923px', letterSpacing: '262px'}}>{'DON’T  @HERE  ME'}</tspan>	</textPath>
        </text>
      </g>
      <g id="Trace_w_x2F_shading">
        <path className="st7" d="M284,279c-62.23,0-113.75,45.84-122.64,105.59l18.01-3.33c0,0,17.1-40.07,71.34-42.02
        c54.23-1.95,68.57,43.49,61.56,55.21c6.84,2.12,10.26,20.52,6.35,27.85c17.59,5.37,15.15,56.19,6.84,75.73
        c2.55,4.15,6.77,12.67,9.39,18.09C377.98,496.71,408,453.36,408,403C408,334.52,352.48,279,284,279z"/>
        <path d="M254.12,428.65c1.9-4.77,3.97-9.47,6.15-14.13c1.09-2.33,2.21-4.65,3.39-6.94c1.16-2.31,2.59-4.47,4.02-6.65
        c0.74-1.08,1.51-2.14,2.39-3.16c0.45-0.51,0.92-1.01,1.5-1.47c0.29-0.23,0.61-0.46,1.02-0.64c0.2-0.09,0.44-0.17,0.7-0.22
        c0.29-0.05,0.56-0.03,0.8,0.01c0.88,0.18,1.48,0.5,2.09,0.82c0.6,0.33,1.16,0.68,1.72,1.04c1.1,0.73,2.15,1.5,3.18,2.29
        c4.1,3.18,7.93,6.61,11.7,10.13c3.75,3.52,7.41,7.14,10.95,10.89c1.77,1.88,3.5,3.78,5.18,5.75c1.68,1.97,3.32,3.97,4.78,6.17
        c1.46,2.28,2.53,4.61,3.54,7.03c0.99,2.41,1.84,4.87,2.55,7.37c0.71,2.5,1.28,5.05,1.67,7.63c0.19,1.29,0.33,2.6,0.38,3.93
        c0.04,1.33,0.04,2.67-0.29,4.1l-0.25,1.06l-1.01-0.34c-2.95-1-5.63-2.15-8.42-3.25l-8.28-3.37c-5.51-2.25-11.03-4.48-16.56-6.66
        c-2.77-1.08-5.53-2.17-8.33-3.18c-2.79-0.98-5.52-2.23-8.3-3.05c-0.34-0.1-0.69-0.19-1.02-0.26c-0.37-0.07-0.5-0.09-0.89-0.02
        c-0.67,0.09-1.38,0.29-2.08,0.5c-1.4,0.43-2.78,0.96-4.16,1.51c-2.74,1.13-5.47,2.34-8.15,3.63c2.56-1.53,5.15-3.01,7.83-4.34
        c1.34-0.67,2.69-1.31,4.11-1.87c0.71-0.27,1.42-0.54,2.22-0.71c0.21-0.04,0.35-0.1,0.66-0.11c0.25-0.01,0.46,0.01,0.67,0.03
        c0.41,0.05,0.79,0.12,1.17,0.2c1.5,0.32,2.94,0.74,4.38,1.17c1.44,0.43,2.87,0.87,4.26,1.42l8.35,3.22
        c5.55,2.18,11.07,4.42,16.58,6.67l8.27,3.36c2.74,1.09,5.55,2.28,8.24,3.19l-1.26,0.72c0.25-1.07,0.28-2.32,0.24-3.54
        c-0.05-1.23-0.18-2.48-0.36-3.72c-0.37-2.48-0.93-4.95-1.61-7.38c-0.69-2.43-1.51-4.82-2.47-7.15c-0.97-2.31-2.05-4.66-3.37-6.69
        c-2.81-4.13-6.29-7.93-9.75-11.65c-3.5-3.71-7.13-7.31-10.86-10.8c-3.73-3.48-7.55-6.89-11.55-10c-1-0.77-2.02-1.52-3.06-2.21
        c-0.52-0.34-1.04-0.67-1.57-0.96c-0.51-0.28-1.08-0.54-1.46-0.61c-0.08-0.01-0.13-0.01-0.15-0.01c-0.05,0.01-0.12,0.03-0.21,0.07
        c-0.18,0.08-0.39,0.21-0.6,0.39c-0.42,0.34-0.84,0.77-1.24,1.22c-0.8,0.92-1.53,1.93-2.24,2.97c-1.44,2.07-2.63,4.32-4,6.47
        c-1.34,2.17-2.63,4.37-3.9,6.6C258.93,419.59,256.51,424.11,254.12,428.65z"/>
        <path d="M273.67,476.54l9.84,3.73l-0.24,0.08c1.86-3.18,3.91-6.25,6.27-9.11c1.19-1.42,2.46-2.79,3.95-3.96
        c0.74-0.6,1.58-1.09,2.47-1.48c0.88-0.36,1.77-0.67,2.67-0.91c3.59-1.02,7.06-1.87,10.7-2.44c3.65-0.54,5.11-1.11,8.79-1.47
        l1.3,1.63c-3.64,0.22-6.14,0.98-9.77,1.38c-3.62,0.43-7.21,1.18-10.72,2.05c-1.77,0.44-3.45,0.95-4.86,2.03
        c-1.44,1.04-2.73,2.34-3.95,3.68c-2.42,2.72-4.57,5.7-6.54,8.79l-0.09,0.14l-0.15-0.06L273.67,476.54z"/>
        <path d="M195.49,410.09c1.67-2.31,3.44-4.53,5.24-6.74c2.02-1.98,4.03-3.97,6.12-5.9c1.06-0.97,2.08-1.92,3.3-2.83
        c0.15-0.11,0.33-0.23,0.51-0.34c0.1-0.06,0.23-0.13,0.35-0.18c0.11-0.06,0.51-0.17,0.72-0.13c0.59,0.1,0.62,0.2,0.87,0.29
        l0.51,0.27c0.64,0.37,1.25,0.75,1.85,1.13c2.4,1.54,4.73,3.12,7.08,4.68c4.69,3.12,9.36,6.31,14.19,9.08
        c0.6,0.34,1.21,0.67,1.82,0.96c0.59,0.29,1.26,0.58,1.69,0.66c0.09-0.02-0.02,0.04,0.16-0.01c0.12-0.04,0.23-0.06,0.36-0.11
        c0.27-0.12,0.54-0.23,0.83-0.4c0.58-0.28,1.09-0.73,1.67-1.08c2.39-1.36,4.68-3.05,6.97-4.73c-1.74,2.26-3.63,4.39-5.8,6.35
        c-0.28,0.24-0.58,0.45-0.91,0.63c-0.32,0.19-0.63,0.4-0.97,0.58c-0.32,0.19-0.71,0.35-1.08,0.51c-0.2,0.08-0.43,0.13-0.65,0.19
        c-0.15,0.07-0.63,0.07-0.89,0.03c-0.95-0.19-1.57-0.52-2.25-0.84c-0.67-0.32-1.3-0.67-1.92-1.02c-4.96-2.85-9.62-6.04-14.32-9.16
        c-2.35-1.57-4.68-3.15-7.04-4.66c-0.59-0.37-1.18-0.74-1.76-1.08l-0.42-0.23c-0.07-0.05-0.35-0.13-0.11-0.09
        c0.02-0.01,0.09,0.01,0.14,0c0.04,0,0.12-0.05,0.08-0.02l-0.12,0.06c-0.12,0.08-0.23,0.15-0.37,0.25
        c-1.04,0.78-2.09,1.74-3.12,2.68c-2.05,1.9-4.07,3.87-6.05,5.86C199.95,406.56,197.76,408.35,195.49,410.09z"/>
        <path d="M285.71,397.72l5.31,4.57c1.77,1.52,3.51,3.08,5.27,4.62l-0.71-0.15c1.48-0.63,2.84-1.66,4.12-2.78
        c1.28-1.12,2.45-2.38,3.71-3.56c1.26-1.19,2.91-3.08,3.48-3.77c0.58-0.68,1.29-1.49,2.08-1.95c0.39-0.24,1.4,0.29,1.83,0.12
        c0.43-0.16,0.91-0.29,1.39-0.22v0.2c-0.79,0.23-1.39,0.86-2,1.44c-0.6,0.6-1.18,1.23-1.76,1.87c-1.16,1.28-2.32,2.58-3.57,3.81
        c-1.25,1.23-2.63,2.36-4.06,3.42c-1.44,1.06-2.95,2.08-4.74,2.7l-0.42,0.15l-0.29-0.29c-1.64-1.66-3.29-3.31-4.91-4.99l-4.87-5.04
        L285.71,397.72z"/>
        <path className="st13" d="M201.84,403.73c0,0-1.95,18.57,18.57,22.48c14.68,2.8,19.54-14.17,19.54-14.17"/>
        <path d="M308.48,396.98c-2.86,2.56-6.55,6.66-10.05,9.01c0.49,5.42,3.37,9.59,6.66,9.44c3.45-0.16,6.03-4.99,5.77-10.8
        C310.72,401.57,309.81,398.85,308.48,396.98z M303.5,410.48c-1.06,0-1.92-1.32-1.92-2.96c0-1.63,0.86-2.96,1.92-2.96
        c1.06,0,1.92,1.32,1.92,2.96C305.43,409.15,304.57,410.48,303.5,410.48z"/>
        <path d="M254.06,449.02c2.54-1.57,5.12-3.07,7.79-4.43c1.34-0.68,2.69-1.34,4.1-1.91c0.72-0.28,1.42-0.56,2.23-0.74
        c0.22-0.04,0.35-0.11,0.68-0.12c0.27-0.01,0.48,0.01,0.69,0.03c0.42,0.05,0.81,0.11,1.19,0.19c1.52,0.3,2.96,0.73,4.37,1.25
        l4.22,1.52c2.8,1.04,5.58,2.11,8.36,3.2c5.55,2.18,11.07,4.42,16.58,6.67l8.27,3.36c2.74,1.09,5.55,2.28,8.24,3.19l-1.26,0.72
        c0.25-1.07,0.28-2.32,0.24-3.54c-0.05-1.23-0.18-2.48-0.36-3.72c-0.37-2.48-0.93-4.95-1.61-7.38c-0.69-2.43-1.51-4.82-2.47-7.15
        c-0.97-2.31-2.05-4.66-3.37-6.69c-2.81-4.13-6.29-7.93-9.75-11.65c-3.5-3.71-7.13-7.31-10.86-10.8
        c-3.72-3.49-7.56-6.87-11.54-10.01c-0.97-0.81-1.96-1.6-2.98-2.33c-0.51-0.37-1.02-0.72-1.54-1.03c-0.51-0.31-1.07-0.6-1.53-0.71
        c-0.3-0.11-0.76,0.13-1.23,0.49c-0.46,0.35-0.89,0.79-1.31,1.24c-0.83,0.92-1.59,1.94-2.32,2.97c-2.9,4.17-5.41,8.66-7.85,13.16
        c-2.43,4.51-4.77,9.07-7,13.69c2.05-4.7,4.2-9.36,6.47-13.96c2.3-4.59,4.65-9.16,7.46-13.5c0.71-1.08,1.46-2.15,2.31-3.16
        c0.43-0.5,0.88-1,1.43-1.45c0.27-0.23,0.57-0.44,0.94-0.61c0.18-0.09,0.39-0.16,0.62-0.2c0.25-0.04,0.48-0.03,0.7-0.01
        c0.81,0.14,1.41,0.43,2.03,0.72c0.6,0.3,1.18,0.63,1.74,0.97c1.12,0.68,2.2,1.42,3.26,2.17c4.12,3.15,7.93,6.61,11.71,10.11
        c3.75,3.52,7.41,7.14,10.95,10.89c1.77,1.88,3.5,3.78,5.18,5.75c1.68,1.97,3.32,3.97,4.78,6.17c1.46,2.28,2.53,4.61,3.54,7.03
        c0.99,2.41,1.84,4.87,2.55,7.37c0.71,2.5,1.28,5.05,1.67,7.63c0.19,1.29,0.33,2.6,0.38,3.93c0.04,1.33,0.04,2.67-0.29,4.1
        l-0.25,1.06l-1.01-0.34c-2.95-1-5.63-2.15-8.42-3.25l-8.28-3.37c-5.51-2.25-11.03-4.48-16.56-6.66c-5.51-2.18-11.13-4.3-16.67-6.06
        c-0.34-0.11-0.68-0.2-1-0.27c-0.37-0.07-0.45-0.09-0.84-0.03c-0.66,0.08-1.37,0.27-2.06,0.47c-1.39,0.41-2.78,0.93-4.16,1.47
        C259.5,446.58,256.77,447.77,254.06,449.02z"/>
        <path d="M339.52,425.68c0.11-0.16,0.15-0.18,0.21-0.24c0.06-0.06,0.11-0.09,0.16-0.13c0.1-0.08,0.2-0.15,0.29-0.19
        c0.2-0.12,0.37-0.18,0.56-0.25c0.36-0.12,0.71-0.18,1.05-0.22c0.67-0.07,1.31-0.04,1.93,0.03c1.24,0.14,2.4,0.45,3.54,0.8
        c1.14,0.36,2.25,0.77,3.33,1.24c1.09,0.45,2.15,0.96,3.21,1.45c-1.12-0.34-2.24-0.7-3.37-0.98c-1.13-0.3-2.27-0.55-3.4-0.74
        c-1.13-0.18-2.28-0.32-3.38-0.28c-0.55,0.01-1.09,0.07-1.57,0.19c-0.24,0.06-0.46,0.14-0.64,0.23c-0.08,0.05-0.18,0.1-0.22,0.15
        c-0.03,0.02-0.06,0.05-0.06,0.06c-0.01,0.01-0.02,0.02-0.01,0.01c0.01-0.01-0.01,0.02,0.06-0.08L339.52,425.68z"/>
        <path d="M341.94,424.24c0.21-0.3,0.45-0.79,0.63-1.23c0.2-0.45,0.36-0.93,0.51-1.42c0.29-0.97,0.49-1.99,0.63-3.01
        c0.14-1.03,0.19-2.08,0.21-3.13c0.01-1.05-0.05-2.11-0.14-3.17c0.25,1.03,0.48,2.07,0.64,3.13c0.15,1.06,0.27,2.13,0.29,3.21
        c0.02,1.08-0.02,2.18-0.16,3.28c-0.08,0.55-0.17,1.1-0.31,1.65c-0.14,0.57-0.28,1.06-0.57,1.7L341.94,424.24z"/>
        <path d="M359.23,408.73c0.16-0.32,0.32-0.87,0.41-1.35c0.11-0.5,0.16-1.02,0.2-1.54c0.07-1.05-0.01-2.12-0.16-3.19
        c-0.15-1.07-0.43-2.13-0.75-3.18c-0.17-0.52-0.37-1.03-0.55-1.56l-0.66-1.52l0.88,1.42c0.26,0.49,0.55,0.97,0.79,1.48
        c0.48,1.01,0.94,2.05,1.27,3.14c0.33,1.09,0.58,2.22,0.69,3.39c0.05,0.58,0.07,1.17,0.04,1.77c-0.04,0.62-0.6,1.03-0.81,1.76
        L359.23,408.73z"/>
        <path d="M362.94,403.96c1.01,0.16,2.12,0.25,3.2,0.28c1.09,0.03,2.18-0.01,3.27-0.1c1.09-0.09,2.17-0.28,3.24-0.54
        c1.07-0.25,2.11-0.64,3.14-1.09c-0.94,0.6-1.93,1.14-2.98,1.56c-1.05,0.42-2.13,0.79-3.23,1.05c-1.1,0.27-2.23,0.48-3.36,0.62
        c-1.15,0.14-2.26,0.22-3.47,0.21L362.94,403.96z"/>
        <path className="st14" d="M344.03,417.9c-3.42,0.24-5.05-8.94-7.08-19.54c-1.22-6.35-2.44-13.44-1.47-21.01
        c1.47-0.49,10.02,15.64,10.99,20.03C347.45,401.78,347.45,417.66,344.03,417.9z"/>
        <path className="st14" d="M359.42,400.56c-6.35-1.47-13.19-32.25-10.99-35.91C352.82,366.11,365.77,395.92,359.42,400.56z"/>
        <path className="st14" d="M367.72,404.22c0,0,8.79-13.19,31.76-10.26C398.26,399.83,371.39,414.48,367.72,404.22z"/>
        <path className="st14" d="M347.2,425.72c0,0,4.15,9.53,16.12,9.28c11.97-0.24,26.63-7.82,26.87-11.24c-1.71-1.22-15.6,4.23-24.92,2.2
        C355.92,423.93,347.2,425.72,347.2,425.72z"/>
        <path d="M292.79,408.06c3.51,2.95,7,5.94,10.38,9.06c1.69,1.56,3.36,3.14,5.02,4.75c1.64,1.64,3.33,3.2,4.69,5.24l-1.01-0.44
        c0.72-0.11,1.45-0.4,2.11-0.89c0.67-0.48,1.29-1.1,1.85-1.79c1.12-1.38,2.09-2.99,2.94-4.67l0.19,0.06
        c-0.12,0.96-0.39,1.88-0.68,2.8c-0.32,0.92-0.72,1.81-1.22,2.67c-0.52,0.85-1.12,1.68-1.93,2.37c-0.79,0.7-1.8,1.27-2.94,1.47
        l-0.6,0.11l-0.41-0.55c-1.28-1.7-2.74-3.49-4.23-5.2c-1.51-1.71-3.08-3.37-4.66-5.02c-3.19-3.28-6.36-6.59-9.62-9.82L292.79,408.06
        z"/>
        <g>
          <path d="M305.69,456.45c-0.75,1.22-1.48,2.46-2.16,3.71c-2.69,5.01-4.82,10.33-6.29,15.85c-0.73,2.76-1.3,5.57-1.67,8.41
          c-0.18,1.42-0.33,2.85-0.41,4.29c-0.07,1.46-0.13,2.84-0.03,4.43l3.98-0.35c-0.1-1.18-0.09-2.59-0.05-3.9
          c0.05-1.34,0.15-2.68,0.29-4.02c0.29-2.68,0.76-5.35,1.4-7.98c1.27-5.27,3.19-10.38,5.65-15.23c0.71-1.37,1.47-2.71,2.26-4.03
          L305.69,456.45z"/>
          <path d="M370.06,388.01c-0.84,2.61-1.91,5.18-3.06,7.68c-0.56,1.26-1.22,2.48-1.84,3.71c-0.69,1.19-1.3,2.43-2.06,3.59
          c-2.87,4.7-6.19,9.13-10.11,12.95c-0.94,1-1.99,1.87-3.03,2.76c-0.53,0.44-1.02,0.91-1.57,1.31l-1.66,1.19l-1.66,1.19l-1.76,1.03
          c-1.17,0.69-2.34,1.38-3.59,2.06c-4.94,2.66-9.7,5.69-14.15,9.15c-2.98,2.31-5.81,4.82-8.49,7.49c0.4,0.97,0.78,1.98,1.07,2.85
          c2.78-3,5.79-5.79,8.98-8.38c4.25-3.47,8.85-6.53,13.64-9.26c1.18-0.67,2.4-1.42,3.61-2.16l1.82-1.11l1.71-1.27l1.7-1.27
          c0.56-0.43,1.07-0.93,1.61-1.39c1.06-0.94,2.13-1.86,3.08-2.91c3.95-4.04,7.31-8.62,10.05-13.52c0.72-1.2,1.3-2.49,1.96-3.73
          c0.58-1.28,1.21-2.53,1.73-3.83c1.1-2.58,2.03-5.22,2.74-7.95L370.06,388.01z"/>
        </g>
        <path d="M228.47,407.89c-0.01-0.29,0.03-0.94,0-1.22c-3.52-2.29-8.63-5.55-11.66-7.57c-0.63,2.35-1.02,5.35-0.62,8.56
        c0.68,5.36,3.39,9.64,6.42,9.88C227.13,417.9,228.7,413.52,228.47,407.89z M221.96,411.66c-1.06,0-1.92-1.32-1.92-2.96
        c0-1.63,0.86-2.96,1.92-2.96c1.06,0,1.92,1.32,1.92,2.96C223.88,410.33,223.02,411.66,221.96,411.66z"/>
        <path className="st14" d="M384.42,360.74c-4.4,7.82-18.08,14.01-20.68,18.73c-2.61,4.72,7.03,8.72,7.03,8.72s7.94,3.47,9.75,1.05
        C386.05,381.82,383.12,373.74,384.42,360.74z"/>
        <polygon className="st14" points="377.09,382.6 371.88,379.63 378.81,374.36 	"/>
        <polygon points="375.3,381.58 375.79,390.1 377.66,382.42 	"/>
      </g>
    </svg>
  );
}
