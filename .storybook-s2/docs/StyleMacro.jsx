import { style } from '../../packages/@react-spectrum/s2/style/spectrum-theme' with {type: 'macro'};
import {Content, Disclosure, DisclosureTitle, DisclosurePanel, Heading, InlineAlert, Link} from '@react-spectrum/s2';
import {highlight} from './highlight' with {type: 'macro'};
import {H2, H3, H3, P, Pre, Code, Strong} from './typography';
import {Colors} from './Colors';

export function StyleMacro() {
  return (
    <div className={'sb-unstyled ' + style({marginX: 'auto'})}>
      <header
        className={style({
          paddingX: 48,
          marginBottom: 48
        })}>
        <h1 className={style({font: 'heading-2xl'})}>
          Style Macro
        </h1>
      </header>
      <main className={style({marginX: 48})}>
        <P>The React Spectrum <Code>style</Code> <Link href="https://parceljs.org/features/macros/" target="_blank">macro</Link> generates atomic CSS at build time, which can be applied to any DOM element or Spectrum component. Style properties use Spectrum tokens such as colors, spacing, sizing, and typography, helping you work more quickly with TypeScript autocomplete, reduce the design choices you need to make, and improve consistency between Adobe applications.</P>
        <Pre>{highlight(`import {style} from '@react-spectrum/s2/style' with {type: 'macro'};

<div className={style({backgroundColor: 'red-400', color: 'white'})}>
  {/* ... */}
</div>`)}</Pre>
        <P><Strong>Atomic CSS</Strong> scales as your application grows because it outputs a separate rule for each CSS property you write, ensuring there is no duplication across your whole app. The above example generates two CSS rules:</P>
        <Pre>{highlight(`.bJ { background-color: #ffbcb4 }
.ac { color: #fff }`, 'CSS')}</Pre>
        <P>These rules are reused across your app wherever the same values are used, which keeps your bundle size small even as you add features. In addition, you only pay for the values you use – there’s no unnecessary CSS custom properties for colors and other tokens that aren’t used.</P>
        <P>The <Code>style</Code> macro <Strong>colocates</Strong> your styles with your component code, rather than in separate CSS files. Colocation enables you to:</P>
        <ul className="sb-unstyled">
          <li className={style({font: 'body-lg', marginTop: 0, marginBottom: 8})}><Strong>Develop more efficiently</Strong> – No need to switch between multiple files when working on a component, or spend time writing CSS selectors.</li>
          <li className={style({font: 'body-lg', marginY: 0})}><Strong>Refactor with confidence</Strong> – Changing the styles in a component is guaranteed to never unintentionally affect any other parts of your application. When you delete a component, the corresponding styles are also removed, reducing technical debt.</li>
        </ul>
        <H2>Values</H2>
        <P>The <Code>style</Code> macro supports a constrained set of values for each CSS property, which conform to the Spectrum design system. For example, the <Code>backgroundColor</Code> property supports Spectrum colors, and does not allow arbitrary hex or rgb values by default. This helps make it easier to build consistent UIs that are maintainable over time.</P>
        <H3>Colors</H3>
        <P>The Spectrum 2 color palette is available across all color properties. See the following sections for color values available for each property.</P>
        <Colors />
        <H3>Spacing</H3>
        <P>Spacing properties such as <Code>margin</Code> and <Code>padding</Code> support a limited set of values. The API is represented in pixels, however, only values conforming to a 4px grid are allowed. This helps ensure that spacing and sizing are visually consistent. Spacing values are automatically converted to rems, which scale according to the user’s font size preference.</P>
        <P>In addition to numeric values, the following spacing options are available:</P>
        <ul className="sb-unstyled">
          <li className={style({font: 'body-lg', marginTop: 0, marginBottom: 8})}><Code>text-to-control</Code> – The default horizontal spacing between text and a UI control, for example between a label and input. This value automatically adjusts based on the font size.</li>
          <li className={style({font: 'body-lg', marginTop: 0, marginBottom: 8})}><Code>text-to-visual</Code> – The default horizontal spacing between text and a visual element, such as an icon. This value automatically adjusts based on the font size.</li>
          <li className={style({font: 'body-lg', marginTop: 0, marginBottom: 8})}><Code>edge-to-text</Code> – The default horizontal spacing between the edge of a UI control and text within it. This value is calculated relative to the height of the control.</li>
          <li className={style({font: 'body-lg', marginTop: 0, marginBottom: 8})}><Code>pill</Code> – The default horizontal spacing between the edge of a pill-shaped UI control (e.g. a fully rounded button) and text within it. This value is calculated relative to the height of the control.</li>
        </ul>
        <H3>Sizing</H3>
        <P>Sizing properties such as <Code>width</Code> and <Code>height</Code> accept arbitrary pixel values. Internally, sizes are converted to rems, which scale according to the user’s font size preference. Additionally, size values are multiplied by 1.25x on touch screen devices to help increase the size of hit targets.</P>
        <H3>Typography</H3>
        <P>Spectrum 2 does not include specific components for typography. Instead, you can use the style macro to apply Spectrum typography to any HTML element or component.</P>
        <P>The <Code>font</Code> shorthand applies default values for the <Code>fontFamily</Code>, <Code>fontSize</Code>, <Code>fontWeight</Code>, <Code>lineHeight</Code>, and <Code>color</Code> properties, following Spectrum design pairings. These individual properties can also be set to override the default set by the shorthand.</P>
        <Pre>{highlight(`<main>
  <h1 className={style({font: 'heading-xl'})}>Heading</h1>
  <p className={style({font: 'body'})}>Body</p>
  <ul className={style({font: 'body-sm', fontWeight: 'bold'})}>
    <li>List item</li>
  </ul>
</main>
`)}</Pre>
        <P>There are several different type scales.</P>
        <ul className="sb-unstyled">
          <li className={style({font: 'body-lg', marginTop: 0, marginBottom: 8})}><Strong>UI</Strong> – use within interactive UI components.</li>
          <li className={style({font: 'body-lg', marginTop: 0, marginBottom: 8})}><Strong>Body</Strong> – use for the content of pages that are primarily text.</li>
          <li className={style({font: 'body-lg', marginTop: 0, marginBottom: 8})}><Strong>Heading</Strong> – use for headings in content pages.</li>
          <li className={style({font: 'body-lg', marginTop: 0, marginBottom: 8})}><Strong>Title</Strong> – use for titles within UI components such as cards or panels.</li>
          <li className={style({font: 'body-lg', marginTop: 0, marginBottom: 8})}><Strong>Detail</Strong> – use for less important metadata.</li>
          <li className={style({font: 'body-lg', marginTop: 0, marginBottom: 8})}><Strong>Code</Strong> – use for source code.</li>
        </ul>
        <P>Each type scale has a default size, and several t-shirt size modifiers for additional sizes.</P>
        <div
          className={style({
            display: 'grid',
            gridTemplateColumns: {
              default: '1fr',
              sm: 'repeat(3, auto)',
              md: 'repeat(6, auto)'
            },
            justifyContent: 'space-between'
          })}>
          <ul className={'sb-unstyled' + style({padding: 0, listStyleType: 'none'})}>
            <li className={style({font: 'ui-xs'})}>ui-xs</li>
            <li className={style({font: 'ui-sm'})}>ui-sm</li>
            <li className={style({font: 'ui'})}>ui</li>
            <li className={style({font: 'ui-lg'})}>ui-lg</li>
            <li className={style({font: 'ui-xl'})}>ui-xl</li>
            <li className={style({font: 'ui-2xl'})}>ui-2xl</li>
            <li className={style({font: 'ui-3xl'})}>ui-3xl</li>
          </ul>
          <ul className={'sb-unstyled' + style({padding: 0, listStyleType: 'none'})}>
            <li className={style({font: 'body-2xs'})}>body-2xs</li>
            <li className={style({font: 'body-xs'})}>body-xs</li>
            <li className={style({font: 'body-sm'})}>body-sm</li>
            <li className={style({font: 'body'})}>body</li>
            <li className={style({font: 'body-lg'})}>body-lg</li>
            <li className={style({font: 'body-xl'})}>body-xl</li>
            <li className={style({font: 'body-2xl'})}>body-2xl</li>
            <li className={style({font: 'body-3xl'})}>body-3xl</li>
          </ul>
          <ul className={'sb-unstyled' + style({padding: 0, listStyleType: 'none'})}>
            <li className={style({font: 'heading-2xs'})}>heading-2xs</li>
            <li className={style({font: 'heading-xs'})}>heading-xs</li>
            <li className={style({font: 'heading-sm'})}>heading-sm</li>
            <li className={style({font: 'heading'})}>heading</li>
            <li className={style({font: 'heading-lg'})}>heading-lg</li>
            <li className={style({font: 'heading-xl'})}>heading-xl</li>
            <li className={style({font: 'heading-2xl'})}>heading-2xl</li>
            <li className={style({font: 'heading-3xl'})}>heading-3xl</li>
          </ul>
          <ul className={'sb-unstyled' + style({padding: 0, listStyleType: 'none'})}>
            <li className={style({font: 'title-xs'})}>title-xs</li>
            <li className={style({font: 'title-sm'})}>title-sm</li>
            <li className={style({font: 'title'})}>title</li>
            <li className={style({font: 'title-lg'})}>title-lg</li>
            <li className={style({font: 'title-xl'})}>title-xl</li>
            <li className={style({font: 'title-2xl'})}>title-2xl</li>
            <li className={style({font: 'title-3xl'})}>title-3xl</li>
          </ul>
          <ul className={'sb-unstyled' + style({padding: 0, listStyleType: 'none'})}>
            <li className={style({font: 'detail-sm'})}>detail-sm</li>
            <li className={style({font: 'detail'})}>detail</li>
            <li className={style({font: 'detail-lg'})}>detail-lg</li>
            <li className={style({font: 'detail-xl'})}>detail-xl</li>
          </ul>
          <ul className={'sb-unstyled' + style({padding: 0, listStyleType: 'none'})}>
            <li className={style({font: 'code-sm'})}>code-sm</li>
            <li className={style({font: 'code'})}>code</li>
            <li className={style({font: 'code-lg'})}>code-lg</li>
            <li className={style({font: 'code-xl'})}>code-xl</li>
          </ul>
        </div>
        <InlineAlert variant="notice" styles={style({maxWidth: 600})}>
          <Heading>Important Note</Heading>
          <Content>Only use <code className={style({font: 'code-xs', backgroundColor: 'layer-1', paddingX: 2, borderWidth: 1, borderColor: 'gray-100', borderStyle: 'solid', borderRadius: 'sm'})}>{'<Heading>'}</code> and <code className={style({font: 'code-xs', backgroundColor: 'layer-1', paddingX: 2, borderWidth: 1, borderColor: 'gray-100', borderStyle: 'solid', borderRadius: 'sm'})}>{'<Text>'}</code> inside other Spectrum components with predefined styles, such as <code className={style({font: 'code-xs', backgroundColor: 'layer-1', paddingX: 2, borderWidth: 1, borderColor: 'gray-100', borderStyle: 'solid', borderRadius: 'sm'})}>{'<Dialog>'}</code> and <code className={style({font: 'code-xs', backgroundColor: 'layer-1', paddingX: 2, borderWidth: 1, borderColor: 'gray-100', borderStyle: 'solid', borderRadius: 'sm'})}>{'<MenuItem>'}</code>. They do not include any styles by default, and should not be used standalone. Use HTML elements with the style macro directly instead.</Content>
        </InlineAlert>
        <H2>Conditional styles</H2>
        <P>The <Code>style</Code> macro also supports conditional styles, such as media queries, UI states such as hover and press, and component variants. Conditional values are defined as an object where each key is a condition. This keeps all values for each property together in one place so it is easy to see where overrides are coming from.</P>
        <P>This example sets the padding of a div to 8px by default, and 32px at the large media query breakpoint (1024px) defined by Spectrum.</P>
        <Pre>{highlight(`<div
  className={style({
    padding: {
      default: 8,
      lg: 32
    }
  })} />`)}</Pre>
        <P>Conditions are mutually exclusive, following object property order. The <Code>style</Code> macro uses <Link href="https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/Cascade_layers" target="_blank">CSS cascade layers</Link> to ensure that there are no specificity issues to worry about. The last matching condition always wins.</P>
        <H3>Runtime conditions</H3>
        <P>The <Code>style</Code> macro also supports conditions that are resolved in JavaScript at runtime, such as variant props and UI states. When a runtime condition is detected, the <Code>style</Code> macro returns a function that can be called at runtime to determine which styles to apply.</P>
        <P>Runtime conditions can be named however you like, and values are defined as an object. This example changes the background color depending on a <Code>variant</Code> prop:</P>
        <Pre>{highlight(`let styles = style({
  backgroundColor: {
    variant: {
      primary: 'accent',
      secondary: 'neutral'
    }
  }
});

function MyComponent({variant}) {
  return <div className={styles({variant})} />
}`)}</Pre>
        <P>Boolean conditions starting with <Code>is</Code> do not need to be nested in an object:</P>
        <Pre>{highlight(`let styles = style({
  backgroundColor: {
    default: 'gray-100',
    isSelected: 'gray-900'
  }
});

<div className={styles({isSelected: true})} />`)}</Pre>
        <P>Runtime conditions also work well with the <Link href="https://react-spectrum.adobe.com/react-aria/styling.html#render-props" target="_blank">render props</Link> in React Aria Components. If you define your styles inline, you’ll even get autocomplete for all of the available conditions.</P>
        <Pre>{highlight(`import {Checkbox} from 'react-aria-components';

<Checkbox
  className={style({
    backgroundColor: {
      default: 'gray-100',
      isHovered: 'gray-200',
      isSelected: 'gray-900'
    }
  })} />`)}</Pre>
        <H3>Nesting conditions</H3>
        <P>Conditions can be nested to apply styles when multiple conditions are true. Keep in mind that conditions at the same level are mutually exclusive, with the last matching condition winning. Since only one value can apply at a time, there are no specificity issues to worry about.</P>
        <Pre>{highlight(`let styles = style({
  backgroundColor: {
    default: 'gray-25',
    isSelected: {
      default: 'neutral',
      isEmphasized: 'accent',
      forcedColors: 'Highlight',
      isDisabled: {
        default: 'gray-400',
        forcedColors: 'GrayText'
      }
    }
  }
});

<div className={styles({isSelected, isEmphasized, isDisabled})} />`)}</Pre>
        <P>The above example has three runtime conditions (<Code>isSelected</Code>, <Code>isEmphasized</Code>, and <Code>isDisabled</Code>), and uses the <Code>forcedColors</Code> condition to apply styles for <Link href="https://developer.mozilla.org/en-US/docs/Web/CSS/@media/forced-colors" target="_blank">Windows High Contrast Mode</Link> (WHCM). The order of precedence follows the order the conditions are defined in the object, with the <Code>isSelected</Code> + <Code>isDisabled</Code> + <Code>forcedColors</Code> state having the highest priority.</P>
        <H2>Reusing styles</H2>
        <P>Styles can be reused by extracting common properties into objects, and spreading them into <Code>style</Code> calls. These must either be constants (declared with <Code>const</Code>) in the same file, or imported from another file as a macro (<Code>{"with {type: 'macro'}"}</Code>). Properties can be overridden just like normal JS objects – the last value always wins.</P>
        <Pre>{highlight(`const horizontalStack = {
  display: 'flex',
  alignItems: 'center',
  columnGap: 8
};

const styles = style({
  ...horizontalStack,
  columnGap: 4
});`)}</Pre>
        <P>You can also create custom utilities by defining your own macros. These are normal functions so you can do whatever computations you like to generate styles.</P>
        <Pre>{highlight(`// style-utils.ts
export function horizontalStack(gap: number) {
  return {
    display: 'flex',
    alignItems: 'center',
    columnGap: gap
  };
}`)}</Pre>
        <P>Then, import your macro and use it in a component.</P>
        <Pre>{highlight(`// component.tsx
import {horizontalStack} from './style-utils' with {type: 'macro'};

const styles = style({
  ...horizontalStack(4),
  backgroundColor: 'base'
});`)}</Pre>
        <H3>Built-in Utilities</H3>
        <P>The <Code>focusRing</Code> utility generates styles for the standard Spectrum focus ring, allowing you to reuse it in custom components.</P>
        <Pre>{highlight(`import {style, focusRing} from '@react-spectrum/s2/style' with {type: 'macro'};
import {Button} from 'react-aria-components';

const buttonStyle = style({
  ...focusRing(),
  // ...
});
        
export function CustomButton(props) {
  return <Button {...props} className={buttonStyle} />;
}
`)}</Pre>
        <H2>CSS optimization</H2>
        <P>The style macro relies on CSS bundling and minification to generate optimized output. When configuring your build tool, follow these best practices:</P>
        <ul className="sb-unstyled">
          <li className={style({font: 'body-lg', marginY: 8})}>Ensure that the styles are extracted into a CSS bundle and not injected at runtime by <Code>{'<style>'}</Code> elements.</li>
          <li className={style({font: 'body-lg', marginY: 8})}>Use a CSS minifier such as <Link href="https://lightningcss.dev" target="_blank">Lightning CSS</Link> to deduplicate common rules used between components. Consider running this during development as well to reduce style duplication in developer tools for improved debugging.</li>
          <li className={style({font: 'body-lg', marginY: 8})}>Configure your bundler to combine all CSS for S2 components and style macros into a single bundle instead of code splitting. Atomic CSS results in a lot of overlap between components. With code splitting, common rules are duplicated between bundles by default. To avoid this, load the CSS for all used S2 components in a single bundle. Because of the high degree of overlap between components, this initial bundle will be quite small.</li>
        </ul>
        <P>Guidance for specific build tools is below.</P>
        <Disclosure isQuiet>
          <DisclosureTitle>Parcel</DisclosureTitle>
          <DisclosurePanel>
            <P>Parcel includes support for macros out of the box, and automatically optimizes CSS with <Link href="https://lightningcss.dev" target="_blank">Lightning CSS</Link>. You can configure it to bundle all CSS for S2 components and style macros into a single file using the <Link href="https://parceljs.org/features/code-splitting/#manual-shared-bundles" target="_blank">manual shared bundles</Link> feature.</P>
            <Pre>{highlight(`// package.json
{
  "@parcel/bundler-default": {
    "manualSharedBundles": [
      {
        "name": "s2-styles",
        "assets": [
          "**/@react-spectrum/s2/**",
          // Update this glob as needed to match your source files.
          "src/**/*.{js,jsx,ts,tsx}"
        ],
        "types": ["css"]
      }
    ]
  }
}`)}</Pre>
          </DisclosurePanel>
        </Disclosure>
        <Disclosure isQuiet>
          <DisclosureTitle>Webpack</DisclosureTitle>
          <DisclosurePanel>
            <ul className="sb-unstyled">
              <li className={style({font: 'body-lg', marginY: 8})}>Use <Link href="https://webpack.js.org/plugins/mini-css-extract-plugin/" target="_blank">MiniCssExtractPlugin</Link> to extract the generated styles into a CSS bundle. Do not use <Code>style-loader</Code>, which injects individual <Code>{'<style>'}</Code> rules at runtime.</li>
              <li className={style({font: 'body-lg', marginY: 8})}>Use <Link href="https://webpack.js.org/plugins/css-minimizer-webpack-plugin/" target="_blank">CssMinimizerWebpackPlugin</Link> to optimize the generated CSS using <Link href="https://lightningcss.dev" target="_blank">Lightning CSS</Link>. You can also configure this to run in development to remove duplicate rules and improve debugging.</li>
              <li className={style({font: 'body-lg', marginY: 8})}>Use <Link href="https://webpack.js.org/plugins/split-chunks-plugin/" target="_blank">SplitChunksPlugin</Link> to bundle all S2 and style-macro generated CSS into a single bundle.</li>
            </ul>
            <P>See our <Link href="https://github.com/adobe/react-spectrum/blob/main/examples/s2-webpack-5-example/webpack.config.js" target="_blank">webpack example</Link> for full configuration options.</P>
          </DisclosurePanel>
          <Disclosure isQuiet>
            <DisclosureTitle>Vite</DisclosureTitle>
            <DisclosurePanel>
              <ul className="sb-unstyled">
                <li className={style({font: 'body-lg', marginY: 8})}>Configure the <Code>cssMinify</Code> option to use <Link href="https://lightningcss.dev" target="_blank">Lightning CSS</Link>, which produces much smaller output than the default minifier.</li>
                <li className={style({font: 'body-lg', marginY: 8})}>Configure Rollup to bundle all S2 and style-macro generated CSS into a single bundle using the <Link href="https://rollupjs.org/configuration-options/#output-manualchunks" target="_blank">manualChunks</Link> feature.</li>
              </ul>
              <P>See our <Link href="https://github.com/adobe/react-spectrum/blob/main/examples/s2-vite-project/vite.config.ts" target="_blank">Vite example</Link> for full configuration options.</P>
            </DisclosurePanel>
          </Disclosure>
        </Disclosure>
      </main>
    </div>
  )
}
