/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import ChevronLeft from '@spectrum-icons/ui/ChevronLeftLarge';
import clsx from 'clsx';
import {Divider} from '@react-spectrum/divider';
import docStyles from './docs.css';
import {getAnchorProps} from './utils';
import heroImageAria from 'url:../pages/assets/ReactAria_976x445_2x.png';
import heroImageHome from 'url:../pages/assets/ReactSpectrumHome_976x445_2x.png';
import heroImageSpectrum from 'url:../pages/assets/ReactSpectrum_976x445_2x.png';
import heroImageStately from 'url:../pages/assets/ReactStately_976x445_2x.png';
import highlightCss from './syntax-highlight.css';
import {ImageContext} from './Image';
import {LinkProvider} from './types';
import linkStyle from '@adobe/spectrum-css-temp/components/link/vars.css';
import {MDXProvider} from '@mdx-js/react';
import path from 'path';
import React from 'react';
import ruleStyles from '@adobe/spectrum-css-temp/components/rule/vars.css';
import sideNavStyles from '@adobe/spectrum-css-temp/components/sidenav/vars.css';
import {theme} from '@react-spectrum/theme-default';
import {ToC} from './ToC';
import typographyStyles from '@adobe/spectrum-css-temp/components/typography/vars.css';
import {VersionBadge} from './VersionBadge';

const TLD = 'react-spectrum.adobe.com';
const HERO = {
  'react-spectrum': heroImageSpectrum,
  'react-aria': heroImageAria,
  'react-stately': heroImageStately
};

const mdxComponents = {
  h1: ({children, ...props}) => (
    <h1 {...props} className={clsx(typographyStyles['spectrum-Heading1--display'], typographyStyles['spectrum-Article'], docStyles['articleHeader'])}>
      {children}
    </h1>
  ),
  h2: ({children, ...props}) => (
    <>
      <h2 {...props} className={clsx(typographyStyles['spectrum-Heading3'], docStyles['sectionHeader'], docStyles['docsHeader'])}>
        {children}
        <span className={clsx(docStyles['headingAnchor'])}>
          <a className={clsx(linkStyle['spectrum-Link'], docStyles.link, docStyles.anchor)} href={`#${props.id}`} aria-label={`Direct link to ${children}`}>#</a>
        </span>
      </h2>
      <Divider marginBottom="33px" />
    </>
  ),
  h3: ({children, ...props}) => (
    <h3 {...props} className={clsx(typographyStyles['spectrum-Heading4'], docStyles['sectionHeader'], docStyles['docsHeader'])}>
      {children}
      <span className={docStyles['headingAnchor']}>
        <a className={clsx(linkStyle['spectrum-Link'], docStyles.link, docStyles.anchor)} href={`#${props.id}`} aria-label={`Direct link to ${children}`}>#</a>
      </span>
    </h3>
  ),
  p: ({children, ...props}) => <p className={typographyStyles['spectrum-Body3']} {...props}>{children}</p>,
  ul: ({children, ...props}) => <ul {...props} className={typographyStyles['spectrum-Body3']}>{children}</ul>,
  ol: ({children, ...props}) => <ol {...props} className={typographyStyles['spectrum-Body3']}>{children}</ol>,
  code: ({children, ...props}) => <code {...props} className={typographyStyles['spectrum-Code4']}>{children}</code>,
  inlineCode: ({children, ...props}) => <code {...props} className={typographyStyles['spectrum-Code4']}>{children}</code>,
  a: ({children, ...props}) => <a {...props} className={clsx(linkStyle['spectrum-Link'], docStyles.link)} {...getAnchorProps(props.href)}>{children}</a>,
  kbd: ({children, ...props}) => <kbd {...props} className={docStyles['keyboard']}>{children}</kbd>
};

const sectionTitles = {
  blog: 'React Spectrum Blog',
  releases: 'React Spectrum Releases'
};

function dirToTitle(dir) {
  return dir
    .split('/')[0]
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function stripMarkdown(description) {
  return (description || '').replace(/\[(.*?)\]\(.*?\)/g, '$1');
}

function isBlogSection(section) {
  return section === 'blog' || section === 'releases';
}

function Page({children, currentPage, publicUrl, styles, scripts}) {
  let parts = currentPage.name.split('/');
  let isBlog = isBlogSection(parts[0]);
  let isSubpage = parts.length > 1 && !/index\.html$/.test(currentPage.name);
  let pageSection = isSubpage ? dirToTitle(currentPage.name) : 'React Spectrum';
  if (isBlog && isSubpage) {
    pageSection = sectionTitles[parts[0]];
  }

  let keywords = [...new Set(currentPage.keywords.concat([currentPage.category, currentPage.title, pageSection]).filter(k => !!k))];
  let description = stripMarkdown(currentPage.description) || `Documentation for ${currentPage.title} in the ${pageSection} package.`;
  let title = currentPage.title + (!/index\.html$/.test(currentPage.name) || isBlog ? ` – ${pageSection}` : '');
  let hero = (parts.length > 1 ? HERO[parts[0]] : '') || heroImageHome;
  let heroUrl = `https://${TLD}/${currentPage.image || path.basename(hero)}`;

  return (
    <html
      lang="en-US"
      dir="ltr"
      prefix="og: http://ogp.me/ns#"
      className={clsx(
        theme.global.spectrum,
        theme.light['spectrum--light'],
        theme.medium['spectrum--medium'],
        typographyStyles.spectrum,
        docStyles.provider,
        highlightCss.spectrum)}>
      <head>
        <title>{title}</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Server rendering means we cannot use a real <Provider> component to do this.
            Instead, we apply the default theme classes to the html element. In order to
            prevent a flash between themes when loading the page, an inline script is put
            as close to the top of the page as possible to switch the theme as soon as
            possible during loading. It also handles when the media queries update, or
            local storage is updated. */}
        <script
          dangerouslySetInnerHTML={{__html: `(() => {
            let classList = document.documentElement.classList;
            let style = document.documentElement.style;
            let dark = window.matchMedia('(prefers-color-scheme: dark)');
            let fine = window.matchMedia('(any-pointer: fine)');
            let update = () => {
              if (localStorage.theme === "dark" || (!localStorage.theme && dark.matches)) {
                classList.remove("${theme.light['spectrum--light']}");
                classList.add("${theme.dark['spectrum--darkest']}", "${docStyles.dark}");
                style.colorScheme = 'dark';
              } else {
                classList.add("${theme.light['spectrum--light']}");
                classList.remove("${theme.dark['spectrum--darkest']}", "${docStyles.dark}");
                style.colorScheme = 'light';
              }

              if (!fine.matches) {
                classList.remove("${theme.medium['spectrum--medium']}", "${docStyles.medium}");
                classList.add("${theme.large['spectrum--large']}", "${docStyles.large}");
              } else {
                classList.add("${theme.medium['spectrum--medium']}", "${docStyles.medium}");
                classList.remove("${theme.large['spectrum--large']}", "${docStyles.large}");
              }
            };

            update();
            dark.addListener(() => {
              delete localStorage.theme;
              update();
            });
            fine.addListener(update);
            window.addEventListener('storage', update);
          })();
        `.replace(/\n|\s{2,}/g, '')}} />
        <link rel="preload" as="font" href="https://use.typekit.net/af/eaf09c/000000000000000000017703/27/l?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n7&v=3" crossOrigin="" />
        <link rel="preload" as="font" href="https://use.typekit.net/af/cb695f/000000000000000000017701/27/l?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n4&v=3" crossOrigin="" />
        <link rel="preload" as="font" href="https://use.typekit.net/af/505d17/00000000000000003b9aee44/27/l?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n9&v=3" crossOrigin="" />
        <link rel="preload" as="font" href="https://use.typekit.net/af/74ffb1/000000000000000000017702/27/l?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=i4&v=3" crossOrigin="" />
        {styles.map(s => <link rel="stylesheet" href={s.url} />)}
        {scripts.map(s => <script type={s.type} src={s.url} defer />)}
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content={heroUrl} />
        <meta property="og:title" content={currentPage.title} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={`https://${TLD}${currentPage.url}`} />
        <meta property="og:image" content={heroUrl} />
        <meta property="og:description" content={description} />
        <meta property="og:locale" content="en_US" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{__html: JSON.stringify(
            {
              '@context': 'http://schema.org',
              '@type': 'Article',
              author: 'Adobe Inc',
              headline: currentPage.title,
              description: description,
              image: heroUrl,
              publisher: {
                '@type': 'Organization',
                url: 'https://www.adobe.com',
                name: 'Adobe',
                logo: 'https://www.adobe.com/favicon.ico'
              }
            }
          )}} />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/docsearch.js@2/dist/cdn/docsearch.min.css" />
      </head>
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{__html: `
            window.addEventListener('load', () => {
              let script = document.createElement('script');
              script.async = true;
              script.src = 'https://assets.adobedtm.com/a7d65461e54e/01d650a3ee55/launch-4d5498348926.min.js';
              document.head.appendChild(script);
            });
          `}} />
        <script type="text/javascript" src="https://cdn.jsdelivr.net/npm/docsearch.js@2/dist/cdn/docsearch.min.js" />
      </body>
    </html>
  );
}

const CATEGORY_ORDER = [
  'Introduction',
  'Concepts',
  'Application',
  'Interactions',
  'Layout',
  '...',
  'Content',
  'Internationalization',
  'Server Side Rendering',
  'Utilities'
];

function Nav({currentPageName, pages}) {
  let isIndex = /index\.html$/;
  let currentParts = currentPageName.split('/');
  let isBlog = isBlogSection(currentParts[0]);
  let blogIndex = currentParts[0] + '/index.html';
  if (isBlog) {
    currentParts.shift();
  }

  let currentDir = currentParts[0];

  pages = pages.filter(p => {
    let pageParts = p.name.split('/');
    let pageDir = pageParts[0];
    if (isBlogSection(pageDir)) {
      return currentParts.length === 1 && pageParts[pageParts.length - 1] === 'index.html';
    }

    // Skip the error page, its only used for 404s
    if (p.name === 'error.html') {
      return false;
    }

    // Pages within same directory (react-spectrum/Alert.html)
    if (currentParts.length > 1) {
      return currentDir === pageDir && !isIndex.test(p.name);
    }

    // Top-level index pages (react-spectrum/index.html)
    if (currentParts.length === 1 && pageParts.length > 1 && isIndex.test(p.name)) {
      return true;
    }

    // Other top-level pages
    return !isIndex.test(p.name) && pageParts.length === 1;
  });

  if (currentParts.length === 1) {
    pages.push({
      category: 'Spectrum Ecosystem',
      name: 'spectrum-design',
      title: 'Spectrum Design',
      url: 'https://spectrum.adobe.com'
    });
    pages.push({
      category: 'Spectrum Ecosystem',
      name: 'spectrum-css',
      title: 'Spectrum CSS',
      url: 'https://opensource.adobe.com/spectrum-css/'
    });
  }

  // Key by category
  let pageMap = {};
  let rootPages = [];
  pages.forEach(p => {
    let cat = p.category;
    if (cat) {
      if (cat in pageMap) {
        pageMap[cat].push(p);
      } else {
        pageMap[cat] = [p];
      }
    } else {
      rootPages.push(p);
    }
  });

  // Order categories so specific ones come first, then all the others in sorted order.
  let categories = [];
  for (let category of CATEGORY_ORDER) {
    if (pageMap[category]) {
      categories.push(category);
    } else if (category === '...') {
      for (let category of Object.keys(pageMap).sort()) {
        if (!CATEGORY_ORDER.includes(category)) {
          categories.push(category);
        }
      }
    }
  }

  let title = currentParts.length > 1 ? dirToTitle(currentPageName) : 'React Spectrum';
  let currentPageIsIndex = isIndex.test(currentPageName);

  function SideNavItem({name, url, title, preRelease}) {
    const isCurrentPage = !currentPageIsIndex && name === currentPageName;
    return (
      <li className={clsx(sideNavStyles['spectrum-SideNav-item'], {[sideNavStyles['is-selected']]: isCurrentPage || (name === blogIndex && isBlog)})}>
        <a
          className={clsx(sideNavStyles['spectrum-SideNav-itemLink'], docStyles.sideNavItem)}
          href={url}
          aria-current={isCurrentPage ? 'page' : null}
          {...getAnchorProps(url)}>{title}
          <VersionBadge version={preRelease} />
        </a>
      </li>
    );
  }

  return (
    <nav className={docStyles.nav} aria-labelledby="nav-title-id">
      <header>
        {currentParts.length > 1 &&
          <a href="../index.html" className={docStyles.backBtn}>
            <ChevronLeft aria-label="Back" />
          </a>
        }
        <a href={isBlog ? '/index.html' : './index.html'} className={docStyles.homeBtn} id="nav-title-id">
          <svg viewBox="0 0 30 26" fill="#E1251B" role="img" aria-label="Adobe">
            <polygon points="19,0 30,0 30,26" />
            <polygon points="11.1,0 0,0 0,26" />
            <polygon points="15,9.6 22.1,26 17.5,26 15.4,20.8 10.2,20.8" />
          </svg>
          <h2 className={typographyStyles['spectrum-Heading4']}>
            {title}
          </h2>
        </a>
      </header>
      <ul className={sideNavStyles['spectrum-SideNav']}>
        {rootPages.map(p => <SideNavItem {...p} />)}
        {categories.map(key => {
          const headingId = `${key.trim().toLowerCase().replace(/\s+/g, '-')}-heading`;
          return (
            <li className={sideNavStyles['spectrum-SideNav-item']}>
              <h3 className={sideNavStyles['spectrum-SideNav-heading']} id={headingId}>{key}</h3>
              <ul className={sideNavStyles['spectrum-SideNav']} aria-labelledby={headingId}>
                {pageMap[key].sort((a, b) => (a.order || 0) < (b.order || 0) || a.title < b.title ? -1 : 1).map(p => <SideNavItem {...p} />)}
              </ul>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className={docStyles.pageFooter}>
      <hr className={clsx(ruleStyles['spectrum-Rule'], ruleStyles['spectrum-Rule--small'], ruleStyles['spectrum-Rule--horizontal'])} />
      <ul>
        <li>Copyright © {year} Adobe. All rights reserved.</li>
        <li><a className={clsx(linkStyle['spectrum-Link'], linkStyle['spectrum-Link--secondary'], docStyles.link)} href="//www.adobe.com/privacy.html">Privacy</a></li>
        <li><a className={clsx(linkStyle['spectrum-Link'], linkStyle['spectrum-Link--secondary'], docStyles.link)} href="//www.adobe.com/legal/terms.html">Terms of Use</a></li>
        <li><a className={clsx(linkStyle['spectrum-Link'], linkStyle['spectrum-Link--secondary'], docStyles.link)} href="//www.adobe.com/privacy/cookies.html">Cookies</a></li>
        <li><a className={clsx(linkStyle['spectrum-Link'], linkStyle['spectrum-Link--secondary'], docStyles.link)} href="//www.adobe.com/privacy/ca-rights.html">Do not sell my personal information</a></li>
      </ul>
    </footer>
  );
}

export const PageContext = React.createContext();
export function BaseLayout({scripts, styles, pages, currentPage, publicUrl, children, toc}) {
  return (
    <Page scripts={scripts} styles={styles} publicUrl={publicUrl} currentPage={currentPage}>
      <div style={{isolation: 'isolate'}}>
        <header className={docStyles.pageHeader} />
        <Nav currentPageName={currentPage.name} pages={pages} />
        <main>
          <MDXProvider components={mdxComponents}>
            <ImageContext.Provider value={publicUrl}>
              <LinkProvider>
                <PageContext.Provider value={{pages, currentPage}}>
                  {children}
                </PageContext.Provider>
              </LinkProvider>
            </ImageContext.Provider>
          </MDXProvider>
          {toc.length ? <ToC toc={toc} /> : null}
          <Footer />
        </main>
      </div>
    </Page>
  );
}

export function Layout(props) {
  return (
    <BaseLayout {...props}>
      <article className={clsx(typographyStyles['spectrum-Typography'], docStyles.article, {[docStyles.inCategory]: !props.currentPage.name.endsWith('index.html')})}>
        <VersionBadge version={props.currentPage.preRelease} size="large" />
        {props.children}
      </article>
    </BaseLayout>
  );
}

export function BlogLayout(props) {
  return (
    <BaseLayout {...props}>
      <div className={clsx(typographyStyles['spectrum-Typography'], docStyles.article, docStyles.inCategory)}>
        {props.children}
      </div>
    </BaseLayout>
  );
}

export function BlogPostLayout(props) {
  // Add post date underneath the h1
  let date = props.currentPage.date;
  let author = props.currentPage.author || '';
  let authorParts = author.match(/^\[(.*?)\]\((.*?)\)$/) || [''];
  let components = mdxComponents;
  if (date) {
    components = {
      ...mdxComponents,
      h1: (props) => (
        <header className={docStyles.blogHeader}>
          {mdxComponents.h1(props)}
          {author && <address className={typographyStyles['spectrum-Body4']}>By <a rel="author" href={authorParts[2]} className={clsx(linkStyle['spectrum-Link'], docStyles.link)} {...getAnchorProps(authorParts[2])}>{authorParts[1]}</a></address>}
          <Time date={date} />
        </header>
      )
    };
  }

  return (
    <Layout {...props}>
      <MDXProvider components={components}>
        {props.children}
      </MDXProvider>
    </Layout>
  );
}

export function Time({date}) {
  // treat date as local time rather than UTC
  let localDate = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return (
    <time
      dateTime={date.toISOString().slice(0, 10)}
      className={typographyStyles['spectrum-Body4']}>
      {localDate.toLocaleString('en-US', {year: 'numeric', month: 'long', day: 'numeric'})}
    </time>
  );
}
