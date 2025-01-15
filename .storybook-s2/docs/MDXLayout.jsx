import { style } from '../../packages/@react-spectrum/s2/style/spectrum-theme' with {type: 'macro'};
import {highlight} from './highlight' with {type: 'macro'};
import {H2, H3, H3, P, Pre, Code, Strong, H4, Link} from './typography';
import {MDXProvider} from '@mdx-js/react';

const mdxComponents = {
  h1: ({children}) => <h1 className={style({font: 'heading-2xl'})}>{children}</h1>,
  h2: H2,
  h3: H3,
  h4: H4,
  p: P,
  pre: Pre,
  code: Code,
  strong: Strong,
  ul: ({children}) => <ul className="sb-unstyled">{children}</ul>,
  li: ({children}) => <li className={style({font: 'body-lg', marginTop: 0, marginBottom: 4})}>{children}</li>,
  a: Link
}

export function MDXLayout({children}) {
  return (
    <div className={'sb-unstyled ' + style({marginX: 'auto'})}>
      <main className={style({marginX: 48})}>
        <MDXProvider components={mdxComponents}>
          {children}
        </MDXProvider>
      </main>
    </div>
  );
}
