/*
 * Copyright 2022 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {
  BrowserRouter,
  Route,
  Routes,
  useHref,
  useNavigate
} from 'react-router';
import {Link, RouterProvider} from 'react-aria-components';
import React from 'react';

export default {
  title: 'React Aria Components'
};

export const LinkExample = () => {
  return (
    <Link
      data-testid="link-example"
      href="https://www.imdb.com/title/tt6348138/"
      hrefLang="en"
      target="_blank">
      The missing link
    </Link>
  );
};

const LinkReactRouterExternalInner = () => {
  const navigate = useNavigate();

  return (
    <RouterProvider navigate={navigate} useHref={useHref}>
      <Routes>
        <Route
          path="/iframe.html"
          index
          element={
            <Link
              data-testid="link-example"
              href="https://www.imdb.com/title/tt6348138/"
              hrefLang="en"
              target="_blank">
              The missing link
            </Link>
          } />
      </Routes>
    </RouterProvider>
  );
};

export const LinkReactRouterExternal = () => {
  return (
    <BrowserRouter>
      <LinkReactRouterExternalInner />
    </BrowserRouter>
  );
};

const LinkReactRouterNested = () => {
  return (
    <>
      <Link href="next_nested">The next nested Link</Link>
      <Routes>
        <Route path="next_nested" element={'The end of the links'} />
      </Routes>
    </>
  );
};

const LinkReactRouterInternalInner = () => {
  const navigate = useNavigate();

  return (
    <RouterProvider navigate={navigate} useHref={useHref}>
      <Link href="nested">The nested link</Link>
      <Routes>
        <Route path="nested/*" element={<LinkReactRouterNested />} />
      </Routes>
    </RouterProvider>
  );
};

export const LinkReactRouterInternal = () => {
  return (
    <BrowserRouter>
      <LinkReactRouterInternalInner />
    </BrowserRouter>
  );
};
