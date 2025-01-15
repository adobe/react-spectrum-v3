import { style } from '../../packages/@react-spectrum/s2/style/spectrum-theme' with {type: 'macro'};
import {Button, LinkButton, ButtonGroup, Checkbox, Content, Dialog, DialogTrigger, Footer, Header, Heading, Image, InlineAlert, Menu, MenuItem, MenuSection, MenuTrigger, SubmenuTrigger, Switch, Text} from '@react-spectrum/s2';
import NewIcon from '@react-spectrum/s2/s2wf-icons/S2_Icon_New_20_N.svg';
import ImgIcon from '@react-spectrum/s2/s2wf-icons/S2_Icon_Image_20_N.svg';
import CopyIcon from '@react-spectrum/s2/s2wf-icons/S2_Icon_Copy_20_N.svg';
import CommentTextIcon from '@react-spectrum/s2/s2wf-icons/S2_Icon_CommentText_20_N.svg';
import ClockPendingIcon from '@react-spectrum/s2/s2wf-icons/S2_Icon_ClockPending_20_N.svg';
import CommunityIcon from '@react-spectrum/s2/s2wf-icons/S2_Icon_Community_20_N.svg';
import DeviceTabletIcon from '@react-spectrum/s2/s2wf-icons/S2_Icon_DeviceTablet_20_N.svg';
import DeviceDesktopIcon from '@react-spectrum/s2/s2wf-icons/S2_Icon_DeviceDesktop_20_N.svg';
import {highlight} from './highlight' with {type: 'macro'};
import {H2, H3, H4, P, Pre, Code, Strong, Link} from './typography';

export function Docs() {
  return (
    <div className={'sb-unstyled ' + style({marginX: 'auto', marginY: 48})}>
      <header
        style={{
          backgroundImage: `url(${new URL('wallpaper_collaborative_S2_desktop.webp', import.meta.url).toString()})`,
          backgroundSize: 'cover'
        }}
        className={style({
          paddingX: 48,
          paddingY: 96,
          marginBottom: 48,
          borderRadius: 'xl'
        })}>
        <h1 className={style({font: 'heading-2xl', color: 'white'})}>
          Spectrum 2 in React Spectrum
        </h1>
      </header>
      <main className={style({marginX: 48})}>
        <P><Strong>Introducing <Link href="https://s2.spectrum.adobe.com" target="_blank">Spectrum 2</Link></Strong> – a new update to Adobe's design system, now in pre-release! Designed to support our growing suite of products, Spectrum 2 aims to work seamlessly across experiences by balancing personality and function.</P>
        <P>The React Spectrum team has been hard at work to bring the Spectrum 2 design to our components. Spectrum 2 in React Spectrum is built on <Link href="https://react-spectrum.adobe.com/react-aria/" target="_blank">React Aria Components</Link> and a new styling foundation powered by <Link href="https://github.com/adobe/spectrum-tokens" target="_blank">Spectrum Tokens</Link>. This gives you access to Spectrum design fundamentals such as colors, spacing, sizing, and typography in your own applications and custom components. Spectrum 2 also brings new features such as t-shirt sizing, improved form layout, dynamic new press interactions, and more.</P>
        <P>Check out the new Button design, with fresh new colors and icons, a fun new press scaling interaction, and support for t-shirt sizes.</P>
        <Example>
          <Button variant="accent" size="L"><NewIcon /><Text>Large accent button</Text></Button>
          <Button variant="primary" size="M"><NewIcon /><Text>Medium primary button</Text></Button>
          <Button variant="secondary" size="S"><NewIcon /><Text>Small secondary button</Text></Button>
        </Example>
        <P>Spectrum 2 switches have a more accessible design, with a solid border and new animations.</P>
        <Example>
          <Switch size="XL">Wi-Fi</Switch>
        </Example>
        <P>Dialogs have a refreshed design with more pronounced rounding, and improved layout.</P>
        <Example>
          <DialogTrigger>
            <Button variant="primary">Open dialog</Button>
            <Dialog size="L">
              {({close}) => (
                <>
                  <Image slot="hero" src="https://i.imgur.com/Z7AzH2c.png" alt="" />
                  <Heading slot="title">Dialog title</Heading>
                  <Header>Header</Header>
                  <Content>
                    <P>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in</P>
                  </Content>
                  <Footer><Checkbox>Don't show this again</Checkbox></Footer>
                  <ButtonGroup>
                    <Button onPress={close} variant="secondary">Cancel</Button>
                    <Button onPress={close} variant="accent">Save</Button>
                  </ButtonGroup>
                </>
              )}
            </Dialog>
          </DialogTrigger>
        </Example>
        <P>Menus received a major design update, with new styles for sections, links, selection, focus rings, and submenus.</P>
        <Example>
          <MenuTrigger>
            <Button aria-label="Share menu"><NewIcon /></Button>
            <Menu>
              <MenuSection>
                <Header>
                  <Heading>Publish and export</Heading>
                  <Text slot="description">Social media, other formats</Text>
                </Header>
                <MenuItem id="quick-export" textValue="quick export">
                  <ImgIcon />
                  <Text slot="label">Quick Export</Text>
                  <Text slot="description">Share a low-res snapshot.</Text>
                </MenuItem>
                <SubmenuTrigger>
                  <MenuItem id="open-in" textValue="open a copy">
                    <CopyIcon />
                    <Text slot="label">Open a copy</Text>
                    <Text slot="description">Illustrator for iPad or desktop</Text>
                  </MenuItem>
                  <Menu>
                    <MenuSection>
                      <Header>
                        <Heading>Open a copy in</Heading>
                      </Header>
                      <MenuItem id="ipad" textValue="illustrator for ipad">
                        <DeviceTabletIcon />
                        <Text slot="label">Illustrator for iPad</Text>
                      </MenuItem>
                      <MenuItem id="desktop" textValue="illustrator for desktop">
                        <DeviceDesktopIcon />
                        <Text slot="label">Illustrator for desktop</Text>
                      </MenuItem>
                    </MenuSection>
                  </Menu>
                </SubmenuTrigger>
              </MenuSection>
              <MenuSection>
                <Header>
                  <Heading>Menu section header</Heading>
                  <Text slot="description">Menu section description</Text>
                </Header>
                <MenuItem id="share" href="https://adobe.com/" target="_blank" textValue="share link">
                  <CommentTextIcon />
                  <Text slot="label">Share link</Text>
                  <Text slot="description">Enable comments and downloads</Text>
                </MenuItem>
                <MenuItem id="preview" textValue="preview timelapse">
                  <ClockPendingIcon />
                  <Text slot="label">Preview Timelapse</Text>
                </MenuItem>
                <MenuItem id="livestream" textValue="start streaming" isDisabled>
                  <CommunityIcon />
                  <Text slot="label">Livestream</Text>
                  <Text slot="description">Start streaming</Text>
                </MenuItem>
              </MenuSection>
            </Menu>
          </MenuTrigger>
        </Example>
        <H2>Getting started</H2>
        <H3>Installation</H3>
        <P>Spectrum 2 in React Spectrum can be installed from npm:</P>
        <Pre>yarn add @react-spectrum/s2</Pre>
        <H3>Configuring your bundler</H3>
        <P>React Spectrum supports styling via <Link href="https://parceljs.org/features/macros/" target="_blank">macros</Link>, a new bundler feature that enables functions to run at build time. Currently, Parcel v2.12.0 and newer supports macros out of the box. When using other build tools, you can install a plugin to enable them.</P>
        <P>See <Link href="#styling" target="_self">below</Link> to learn more about using the React Spectrum <Code>style</Code> macro.</P>
        <H4>Webpack, Next.js, Vite, Rollup, or ESBuild</H4>
        <P>First, install <Link href="https://github.com/devongovett/unplugin-parcel-macros" target="_blank">unplugin-parcel-macros</Link> using your package manager:</P>
        <Pre>yarn add unplugin-parcel-macros --dev</Pre>
        <P>Then, configure your bundler according to the steps documented in the <Link href="https://github.com/devongovett/unplugin-parcel-macros#setup" target="_blank">readme</Link>. Note that plugin order is important: <Code>unplugin-parcel-macros</Code> must run before other plugins like Babel.</P>
        <P>You may also need to configure other tools such as TypeScript, Babel, ESLint, and Jest to support parsing import attributes. See <Link href="https://parceljs.org/features/macros/#usage-with-other-tools" target="_blank">these docs</Link> for details.</P>
        <P>See the <Link href="https://github.com/adobe/react-spectrum/tree/main/examples" target="_blank">examples folder</Link> in our repo for working setups with various build tools. For details on optimizing the output CSS, see the <Link href="?path=/docs/style-macro--docs#css-optimization" target="_top">style macro docs</Link>.</P>
        <H2>Setting up your app</H2>
        <P>Unlike React Spectrum v3, a <Code>Provider</Code> is not required. Instead, import <Code>@react-spectrum/s2/page.css</Code> in the entry component of your app to apply the background color and color scheme to the <Code>{'<html>'}</Code> element. This ensures that the entire page has the proper styles even before your JavaScript runs.</P>
        <Pre>{highlight(`import '@react-spectrum/s2/page.css';
import {Button} from '@react-spectrum/s2';

function App() {
  return (
    <Button
      variant="accent"
      onPress={() => alert('Hey there!')}>
      Hello Spectrum 2!
    </Button>
  );
}`)}</Pre>
        <Example>
          <Button variant="accent" onPress={() => alert('Hey there!')}>Hello Spectrum 2!</Button>
        </Example>
        <P><Strong>Note</Strong>: If you’re embedding Spectrum 2 as a section of a larger page rather than taking over the whole window, follow the <Link href="#embedded-sections" target="_self">directions below</Link> instead of using <Code>page.css</Code>.</P>
        <H3>Overriding the color scheme</H3>
        <P>By default, the page follows the user’s operating system color scheme setting, supporting both light and dark mode. The page background is set to the <Code>base</Code> Spectrum background layer by default. This can be configured by setting the <Code>data-color-scheme</Code> and <Code>data-background</Code> attributes on the <Code>{'<html>'}</Code> element. For example, to force the application to only render in light mode, set <Code>data-color-scheme="light"</Code>.</P>
        <Pre>{highlight(`<html data-color-scheme="light">
  <!-- ... -->
</html>`)}</Pre>
        <H3>Overriding the locale</H3>
        <P>By default, React Spectrum uses the browser/operating system language setting for localized strings, date and number formatting, and to determine the layout direction (left-to-right or right-to-left). This can be overridden by rendering a <Code>{'<Provider>'}</Code> component at the root of your app, and setting the <Code>locale</Code> prop.</P>
        <Pre>{highlight(`import {Provider} from '@react-spectrum/s2';

<Provider locale="en-US">
  {/* your app */}
</Provider>`)}</Pre>
        <H3>Embedded sections</H3>
        <P>If you’re building an embedded section of a larger page using Spectrum 2, use the <Code>{'<Provider>'}</Code> component to set the background instead of importing <Code>page.css</Code>. The <Code>background</Code> prop should be set to the Spectrum background layer appropriate for your app, and the <Code>colorScheme</Code> can be overridden as well.</P>
        <Pre>{highlight(`import {Provider} from '@react-spectrum/s2';

<Provider background="base">
  {/* your app */}
</Provider>`)}</Pre>
        <H2>Styling</H2>
        <P>React Spectrum v3 supported a limited set of <Link href="https://react-spectrum.adobe.com/react-spectrum/styling.html" target="_blank">style props</Link> for layout and positioning using Spectrum-defined values. In Spectrum 2, we’re improving on this by offering a much more flexible style macro. This offers additional Spectrum tokens, improves performance by generating CSS at build time rather than runtime, and works with any DOM element for use in custom components.</P>
        <P><Link href="https://parceljs.org/features/macros/" target="_blank">Macros</Link> are a new bundler feature that enable functions to run at build time. The React Spectrum <Code>style</Code> macro uses this to generate CSS that can be applied to any DOM element or component. Import the <Code>style</Code> macro using the with <Code>{`{type: 'macro'}`}</Code> <Link href="https://github.com/tc39/proposal-import-attributes" target="_blank">import attribute</Link>, and pass the result to the <Code>styles</Code> prop of any React Spectrum component to provide it with styles.</P>
        <Pre>{highlight(`import {style} from '@react-spectrum/s2/style' with {type: 'macro'};
import {ActionButton} from '@react-spectrum/s2';

<ActionButton styles={style({marginStart: 8})}>
  Edit
</ActionButton>`)}</Pre>
        <P>The <Code>styles</Code> prop accepts a limited set of CSS properties, including layout, spacing, sizing, and positioning. Other styles such as colors and internal padding cannot be customized within Spectrum components.</P>
        <InlineAlert variant="informative" fillStyle="subtleFill" styles={style({marginBottom: 16})}>
          <Heading>Learn more about styling</Heading>
          <Content>See the <Link href="?path=/docs/style-macro--docs" variant="secondary" target="_top">full docs</Link> to learn about using the style macro to build custom components.</Content>
        </InlineAlert>
        <H3>Supported CSS properties on Spectrum components</H3>
        <ul className={'sb-unstyled' + style({fontSize: 'body-lg', lineHeight: 'body', color: 'body', columns: 3, padding: 0, listStyleType: 'none'})}>
          <li><Code>margin</Code></li>
          <li><Code>marginStart</Code></li>
          <li><Code>marginEnd</Code></li>
          <li><Code>marginTop</Code></li>
          <li><Code>marginBottom</Code></li>
          <li><Code>marginX</Code></li>
          <li><Code>marginY</Code></li>
          <li><Code>width</Code></li>
          <li><Code>minWidth</Code></li>
          <li><Code>maxWidth</Code></li>
          <li><Code>flex</Code></li>
          <li><Code>flexGrow</Code></li>
          <li><Code>flexShrink</Code></li>
          <li><Code>flexBasis</Code></li>
          <li><Code>justifySelf</Code></li>
          <li><Code>alignSelf</Code></li>
          <li><Code>order</Code></li>
          <li><Code>gridArea</Code></li>
          <li><Code>gridRow</Code></li>
          <li><Code>gridRowStart</Code></li>
          <li><Code>gridRowEnd</Code></li>
          <li><Code>gridColumn</Code></li>
          <li><Code>gridColumnStart</Code></li>
          <li><Code>gridColumnEnd</Code></li>
          <li><Code>position</Code></li>
          <li><Code>zIndex</Code></li>
          <li><Code>top</Code></li>
          <li><Code>bottom</Code></li>
          <li><Code>inset</Code></li>
          <li><Code>insetX</Code></li>
          <li><Code>insetY</Code></li>
          <li><Code>insetStart</Code></li>
          <li><Code>insetEnd</Code></li>
        </ul>
        <H3>UNSAFE Style Overrides</H3>
        <P>We highly discourage overriding the styles of React Spectrum components because it may break at any time when we change our implementation, making it difficult for you to update in the future. Consider using <Link href="https://react-spectrum.adobe.com/react-aria/" target="_blank">React Aria Components</Link> with our <Link href="?path=/docs/style-macro--docs" target="_top">style macro</Link> to build a custom component with Spectrum styles instead.</P>
        <P>That said, just like in React Spectrum v3, the <Code>UNSAFE_className</Code> and <Code>UNSAFE_style</Code> props are supported on Spectrum 2 components as last-resort escape hatches.</P>
        <Pre>{highlight(`/* YourComponent.tsx */
import {Button} from '@react-spectrum/s2';
import './YourComponent.css';

function YourComponent() {
  return <Button UNSAFE_className="your-unsafe-class">Button</Button>;
}`)}</Pre>
        <Pre>{highlight(`/* YourComponent.css */
.your-unsafe-class {
  background: red;
}
`, 'CSS')}</Pre>
      </main>
    </div>
  )
}

function Example({children}) {
  return (
    <div
      className={style({
        display: 'flex',
        gap: 16,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: {
          default: 'column',
          md: 'row'
        },
        padding: 48,
        marginY: 32,
        backgroundColor: 'layer-1',
        borderRadius: 'xl'
      })}>
      {children}
    </div>
  );
}
