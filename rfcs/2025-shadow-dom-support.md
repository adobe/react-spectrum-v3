<!-- Copyright 2025 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License. -->

- Start Date: 2025/1/28
- RFC PR: exploration PRs: https://github.com/adobe/react-spectrum/pull/6046
- Authors: Rob Snow

# Improving React Aria Shadow DOM Support

## Summary

This RFC outlines a plan for progressive enhancement of Shadow DOM support in React Aria, React Aria Components, and React Spectrum S2.
Shadow DOM support can mean many things; open root vs closed root, single containing shadow root, or multitude of individual components.
We can improve across all of these.


## Motivation

As Shadow DOM is used by more libraries and applications, users have encountered friction trying to adopt or use our libraries. This might be using another 3rd party library that wants to prevent outside styles from affecting their components. It might be the usage of web components. Or, it might be just using native controls such as the `video` tag.

Some examples of these are:
- [Dialog's focus management and work with 3rd party dialogs](https://github.com/adobe/react-spectrum/issues/5314)
- [Video Controls are not respected when using FocusScope](https://github.com/adobe/react-spectrum/issues/6729)
- [FocusScope not working when used inside shadowRoot](https://github.com/adobe/react-spectrum/issues/1472)
- [ariaHideOutside incorrect behavior inside shadow DOM.](https://github.com/adobe/react-spectrum/issues/6133)
- [usePress is not work in shadowRoot](https://github.com/adobe/react-spectrum/issues/2040)
- [useOverlay Click Outside in Shadow-DOM context](https://github.com/adobe/react-spectrum/issues/3970)

We have also had a contribution to solve some of the issues. While this is useful, we would like it to feel less hacky and more importantly, we'd like to incorporate the support into our daily lives in as easy as way as possible.


## Detailed Design

As mentioned earlier, there are proposed parts to this initiative:

1. Custom React Testing Library Renderer

Much like our custom renderer to test React.StrictMode, we should create a custom React Testing Library renderer for our unit tests which can wrap each test's rendered dom in a shadow root.

This will give us a baseline to develop against and it will also hold us accountable in any future changes without needing to write many specific tests. In the worst case, should we pull the plug on this, it will also make it easy to remove the tests.

I expect many tests will fail in the beginning. We make use of a lot of DOM API's and have not generally thought of the ShadowDOM while developing.

2. Avoid DOM Traversal/Manipulation

This is most prominent in Focus Scope where we traverse the DOM in order to assign focus, such as in Collections, and contain focus such as in Dialogs.

One proposal to avoid this traversal is to create focusable sentinels in order to trap focus.

This will have the side benefit of theoretically working with closed root shadow doms as well, such as the aforementioned native video players inside a Dialog.

3. In-team Education

Writing code that can handle the prescence of Shadow DOM can be tricky. As a result, there will be a learning curve for the team.

Some work has already been done to write utilities to hide away some of this complexity. We will also want to write lint rules to help us automatically catch as many common situations as possible. Some examples of these are:

```jsx
document.activeElement
<->
getActiveElement();

e.target
<->
getTargetElement(e);

let walker = document.createTreeWalker(...)
<->
let walker = createShadowTreeWalker(...)

e.currentTarget.contains(e.target)
<->
nodeContains(e.currentTarget, getEventTarget(e.nativeEvent))
```

4. Communication

We have our current Shadow DOM support gated behind a feature flag to both signal that it is experimental as well as to protect users who are not using any Shadow DOM from possible performance hits.

We will want to expand this to also shield those users from code size increases. This could be accomplished with a global registry for the utility functions we provide that would replace the feature flag system we have for it right now.

We also need to communicate, through documentation, what the specifics are of our Shadow DOM support since we likely will not be able to support everything, and certainly not much for a while.

For example, some of our support may require open root Shadow DOMs. Or someone using our FocusScope's focus manager may need to know about different traversal methods to avoid the same issues we are trying to avoid.

## Drawbacks

One concern is on-going support. Our current use cases do not call for Shadow DOM support, so knowledge on the team is currently thin. It will take time for people to ramp up on skills. Not only that, but it isn't part of our weekly testing and we have no plans for it to be at this time, which means we must rely on unit tests as much as possible.

In addition, contributions may occur for a little while until those teams have their needs met. However, it should be assumed that there will be further work to complete the goals as outlined here.

Another concern is that the current approach is, for lack of a better word, hacky. This is because we are accessing and manipulating the Shadow DOM in ways that it wasn't really intended. If we were to rewrite our library today, there are other ways we'd solve these issues which would respect more of the concept of the Shadow DOM and its purpose. What we do here and now may complicate a future where we have different APIs to support this vision of what support would ideally look like.


## Backwards Compatibility Analysis

This is a backwards compatible change, we should just be extending functionality, not breaking any of it.

## Alternatives

Unknown, haven't done research here yet.

## Open Questions

* How to actually define the limitations of our support? See Introduction, it's missing a final sentence with this information.

## Help Needed

The biggest help we can receive is tests, either in the form of unit tests or in the form of examples of real life applications/setups that we can turn into unit tests. The more tests we have, the less likely we will break anything moving forward after the initial effort is complete.

## Frequently Asked Questions

* How much can we count on contributor support? will the code just rot after the initial push?
  * We should expect that we'll take ownership of any code that comes in, we should not count on external support.
* Is there any benefit to our selves or other people not using Shadow DOM?
  * Yes, see some of the issues listed above, specifically native video players breaking FocusScopes in Dialogs.
  * Users may be unaware that they are using Shadow DOM as it may be an implementation detail of a 3rd party component.


## Related Discussions

Original issue: [feat: Focus Management within ShadowDOM](https://github.com/adobe/react-spectrum/pull/6046). Many of the ideas discussed in this RFC are from conversations around this PR.
