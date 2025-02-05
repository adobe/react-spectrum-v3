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

import {style} from '../spectrum-theme';

function testStyle(...args) {
  let css;
  let js = style.apply(
    {
      addAsset({content}) {
        css = content;
      }
    },
    args
  );
  return {css, js};
}

describe('style-macro', () => {
  it('should handle nested css conditions', () => {
    let {css, js} = testStyle({
      marginTop: {
        ':first-child': {
          default: 4,
          lg: 8
        }
      }
    });

    expect(css).toMatchInlineSnapshot(`
      "@layer _.a, _.b, _.c;

      @layer _.b {
        .A-13alit4c {
          &:first-child {
            margin-top: 0.25rem;
          }
        }
      }

      @layer _.c.e {
        @media (min-width: 1024px) {
          .A-13alit4ed {
            &:first-child {
              margin-top: 0.5rem;
            }
          }
        }
      }

      "
    `);
    expect(js).toMatchInlineSnapshot('" A-13alit4c A-13alit4ed"');
  });

  it('should support self references', () => {
    let {css} = testStyle({
      borderWidth: 2,
      paddingX: 'edge-to-text',
      width: '[calc(200px - self(borderStartWidth) - self(paddingStart))]'
    });

    expect(css).toMatchInlineSnapshot(`
      "@layer _.a, _.b;

      @layer _.a {
        .uc {
          border-top-width: 2px;
        }


        .vc {
          border-bottom-width: 2px;
        }


        .s-375toy {
          border-inline-start-width: var(--s);
        }


        .tc {
          border-inline-end-width: 2px;
        }


        .C-375tnm {
          padding-inline-start: var(--C);
        }


        .DI {
          padding-inline-end: calc(var(--k, var(--o)) * 3 / 8);
        }


        .l-4s570k {
          width: calc(200px - var(--s) - var(--C));
        }


        .-_375toy_s-c {
          --s: 2px;
        }


        .-_375tnm_C-I {
          --C: calc(var(--k, var(--o)) * 3 / 8);
        }
      }

      "
    `);
  });
});
