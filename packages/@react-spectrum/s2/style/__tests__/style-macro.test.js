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
      ".\\.:not(#a#b) { all: revert-layer }

      @layer _.a, _.b, _.c, UNSAFE_overrides;

      @layer _.b {
        .D-13alit4c {
          &:first-child {
            margin-top: 0.25rem;
          }
        }
      }

      @layer _.c.e {
        @media (min-width: 1024px) {
          .D-13alit4ed {
            &:first-child {
              margin-top: 0.5rem;
            }
          }
        }
      }

      "
    `);
    expect(js).toMatchInlineSnapshot('" . D-13alit4c D-13alit4ed"');
  });

  it('should support self references', () => {
    let {css} = testStyle({
      borderWidth: 2,
      paddingX: 'edge-to-text',
      width: '[calc(200px - self(borderStartWidth) - self(paddingStart))]'
    });

    expect(css).toMatchInlineSnapshot(`
      ".\\.:not(#a#b) { all: revert-layer }

      @layer _.a, _.b, UNSAFE_overrides;

      @layer _.a {
        .tc {
          border-top-width: 2px;
        }


        .uc {
          border-bottom-width: 2px;
        }


        .r-375tox {
          border-inline-start-width: var(--r);
        }


        .sc {
          border-inline-end-width: 2px;
        }


        .F-375tnp {
          padding-inline-start: var(--F);
        }


        .GI {
          padding-inline-end: calc(var(--j, var(--n)) * 3 / 8);
        }


        .k-4s570k {
          width: calc(200px - var(--r) - var(--F));
        }


        .-_375tox_r-c {
          --r: 2px;
        }


        .-_375tnp_F-I {
          --F: calc(var(--j, var(--n)) * 3 / 8);
        }
      }

      "
    `);
  });
});
