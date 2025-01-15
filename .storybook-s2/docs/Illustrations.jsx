import linearIllustrations from '@react-spectrum/s2/spectrum-illustrations/linear/*.tsx';
import gradientIllustrations from '@react-spectrum/s2/spectrum-illustrations/gradient/*/*.tsx';
import Paste from '@react-spectrum/s2/s2wf-icons/S2_Icon_Paste_20_N.svg';
import { style } from '../../packages/@react-spectrum/s2/style/spectrum-theme' with {type: 'macro'};
import {ActionButton, Text} from '@react-spectrum/s2';
import {H2, H3, P, Code, Pre, Link} from './typography';
import {highlight} from './highlight' with {type: 'macro'};
import { Radio, RadioGroup } from '../../packages/@react-spectrum/s2/src';
import { useState } from 'react';

export function Illustrations() {
  let [gradientStyle, setStyle] = useState('generic1');
  return (
    <div className={'sb-unstyled ' + style({marginX: 'auto'})}>
      <div className={style({marginX: 48})}>
        <h1 className={style({font: 'heading-2xl', marginBottom: 48})}>
          Illustrations
        </h1>
        <P>Spectrum 2 offers a collection of illustrations in two styles: gradient and linear. These illustrations can be imported from <Code>@react-spectrum/s2/illustrations</Code>. See below for a full list of available illustrations. Click the clipboard icon to copy the import statement.</P>
        <H2>Gradient illustrations</H2>
        <P>Gradient illustrations are available in two styles: Generic 1 and Generic 2. These should be consistently applied within products. They can be imported using the corresponding sub-path, for example:</P>
        <Pre>{highlight("import Cloud from '@react-spectrum/s2/illustrations/gradient/generic1/Cloud';")}</Pre>
        <RadioGroup label="Style" value={gradientStyle} onChange={setStyle} orientation="horizontal" styles={style({marginTop: 32})}>
          <Radio value="generic1">Generic 1</Radio>
          <Radio value="generic2">Generic 2</Radio>
        </RadioGroup>
        <div className={style({display: 'grid', gridTemplateColumns: 'repeat(auto-fit, 164px)', gap: 20, justifyContent: 'space-between', marginTop: 32})}>
          {Object.keys(gradientIllustrations[gradientStyle]).map(icon => {
            let Illustration = gradientIllustrations[gradientStyle][icon].default;
            return (
              <div key={icon} className={style({display: 'flex', flexDirection: 'column', rowGap: 8, alignItems: 'center', padding: 16, borderRadius: 'lg', boxShadow: 'elevated', backgroundColor: 'layer-2'})}>
                <Illustration />
                <span className={style({font: 'ui', display: 'flex', gap: 8, alignItems: 'center', maxWidth: 'full'})}>
                  <span className={style({truncate: true})}>{icon}</span>
                  <ActionButton
                    size="XS"
                    isQuiet
                    aria-label="Copy"
                    onPress={() => navigator.clipboard.writeText(`import ${name} from '@react-spectrum/s2/illustrations/gradient/${gradientStyle}/${icon}';`)}>
                    <Paste />
                  </ActionButton>
                </span>
              </div>
            );
          })}
        </div>
        <H2>Linear illustrations</H2>
        <P>Linear illustrations can be imported as shown below:</P>
        <Pre>{highlight("import Cloud from '@react-spectrum/s2/illustrations/linear/Cloud';")}</Pre>
        <div className={style({display: 'grid', gridTemplateColumns: 'repeat(auto-fit, 164px)', gap: 20, justifyContent: 'space-between', marginTop: 48})}>
          {Object.keys(linearIllustrations).map(icon => {
            let Illustration = linearIllustrations[icon].default;
            return (
              <div key={icon} className={style({display: 'flex', flexDirection: 'column', rowGap: 8, alignItems: 'center', padding: 16, borderRadius: 'lg', boxShadow: 'elevated', backgroundColor: 'layer-2'})}>
                <Illustration />
                <span className={style({font: 'ui', display: 'flex', gap: 8, alignItems: 'center', maxWidth: 'full'})}>
                  <span className={style({truncate: true})}>{icon}</span>
                  <ActionButton
                    size="XS"
                    isQuiet
                    aria-label="Copy"
                    onPress={() => navigator.clipboard.writeText(`import ${icon} from '@react-spectrum/s2/illustrations/linear/${icon}';`)}>
                    <Paste />
                  </ActionButton>
                </span>
              </div>
            );
          })}
        </div>
        <H2>Custom illustrations</H2>
        <P>To use custom illustrations, you first need to convert your SVGs into compatible illustration components. This depends on your bundler.</P>
        <H3>Parcel</H3>
        <P>If you are using Parcel, the <Code>@react-spectrum/parcel-transformer-s2-icon</Code> plugin can be used to convert SVGs to illustration components. First install it into your project as a dev dependency:</P>
        <Pre>yarn add @react-spectrum/parcel-transformer-s2-icon --dev</Pre>
        <P>Then, add it to your <Code>.parcelrc</Code>:</P>
        <Pre>{highlight(`{
  "extends": "@parcel/config-default",
  "transformers": {
    "illustration:*.svg": ["@react-spectrum/parcel-transformer-s2-icon"]
  }
}`)}</Pre>
        <P>Now you can import illustration SVGs using the <Code>illustration:</Code> <Link href="https://parceljs.org/features/plugins/#named-pipelines">pipeline</Link>:</P>
        <Pre>{highlight(`import Illustration from 'illustration:./path/to/Illustration.svg';`)}</Pre>
        <H3>Other bundlers</H3>
        <P>The <Code>@react-spectrum/s2-icon-builder</Code> CLI tool can be used to pre-process a folder of SVG illustrations into TSX files.</P>
        <Pre>npx @react-spectrum/s2-icon-builder -i 'path/to/illustrations/*.svg' --type illustration -o 'path/to/destination'</Pre>
        <P>This outputs a folder of TSX files with names corresponding to the input SVG files. You may rename them as you wish. To use them in your application, import them like normal components.</P>
        <Pre>{highlight(`import Illustration from './path/to/destination/Illustration';`)}</Pre>
      </div>
    </div>
  );
}
