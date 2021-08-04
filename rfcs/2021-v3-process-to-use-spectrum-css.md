<!-- Copyright 2020 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License. -->

- Start Date: (fill me in with today's date, YYYY-MM-DD)
- RFC PR: (leave this empty, to be filled in later)
- Authors: Rob Snow

# Process to get back to Spectrum CSS

## Summary

<!-- One-paragraph explanation of the feature. -->
React Spectrum has been on a copy of Spectrum-CSS since we started work on v3. This was originally due to needing to perform redesigns quickly and Spectrum-CSS not quite being in a place where we could easily use it and update it. Spectrum-CSS moved to individual component packages between then and now, making it much easier for us to consume their packages. At that point, we had diverged from their implementation though, making the task of actually using them much harder. This document aims to outline a plan for getting us back on Spectrum-CSS.

## Motivation

<!-- Why are we doing this? What use cases does it support? What is the expected
outcome? -->

We would like to use Spectrum CSS so that we do not maintain a duplicate and diverging copy of Spectrum-CSS.
Right now we are very far behind on DNA as well, and we use a structure for our CSS that now differs from how Spectrum-CSS has organized.
We'd like to benefit from their work on the Express theme and T-shirt sizes, this will help us support future themes as well.
We'd like to not bundle CSS with our components so that users of our library only get one copy of a components CSS in their code.
This isn't just for external users, we've run into this ourselves in our documentation website.
We'd also like for others to benefit from the work that we've done on CSS since we originally forked.
We'd like for DNA updates to be easier to do, which should just be a new release of Spectrum-CSS.

## Detailed Design

<!--
   This is the bulk of the RFC.

   Explain the design with enough detail that someone familiar with React-Spectrum
   can implement it by reading this document. Please get into specifics
   of your approach, corner cases, and examples of how the change will be
   used. Be sure to define any new terms in this section.
-->

We can do a couple of things without being blocked by decisions in this RFC. First and foremost, we can add more stories to Chromatic for visual regression test coverage on components.
We don't need to do every component at once, but the more we have ahead of time, the easier this whole process will be. It can help us move both to the new CSS and new DNA.


The second thing we can do is upgrade to DNA 7. Again, the more chromatic stories we have in place, the easier this will be, as we'll need to do it to all components at once. This will prepare us more for the merge with CSS in which we'll need to worry about merging our changes with Spectrum-CSS' changes.

Once both of the above are in place, we can move forward with merging with Spectrum CSS.

--Initial leaning-- is to wait for and consume DSS directly, and write out our own CSS based on that. Reason being that we are currently asking for a specialized package that requires additional post processing such as css modules. Meanwhile, web components are running their own post processing on Spectrum-CSS as well. We could see Spectrum-CSS providing CSS for teams that just want to include it on their page, but each implementation with a framework comes with different needs that are known best by the implementing team. Any changes that we'd need to make to post processing would need to be made in Spectrum-CSS leading to potentially breaking changes in their output. It'd have to be labelled as a breaking change for non-css modules users as well since it'd be in the same package. 
We see another avenue for continuing to work with Spectrum-CSS. Since it's meant to do things that DSS can't, if they could turn those "things that DSS can't do" into their own mixins and publish those, then we could use them too. In addition, they could make use of those mixins themselves for Spectrum-CSS.
This would allow us to not duplicate much of what Spectrum-CSS does, and give us the flexibility to change our DOM structure or build processing without causing a breaking change to Spectrum CSS. It would also allow us to iterate more quickly because we could make CSS changes in sync with our code changes.


### Approaches

These are different steps in the process of moving and maintaining one or both code bases compared and contrasted informing the above design.

#### Chromatic:
Before a component is moved over, we should make sure it's in Chromatic. This way we can test for visual regressions and be confident that we've consumed the new CSS correctly. This will also allow us to verify that we've contributed back our changes correctly. This will still have holes, but it will help. In addition, DSS may have a feature that all component states are top-leveled, allowing us to render every combination of states eventually.

#### CSS Modules:
CSS modules allows us to uniquely name css classnames so that even if someone has conflicting versions of CSS, the styles will not collide. This is done as a step in processing CSS. Spectrum-CSS does not currently perform this step when they build their packages.
In order for users of React Spectrum to be able to make use of CSS Modules, we either need to package our CSS that we've modularized into our React Spectrum packages as we've been doing. Or we need to put into its own package with the modularizing applied.
There are some PostCSS plugins that can handle writing out the mappings of classes and can even join class names across files. https://github.com/madyankin/postcss-modules We'll need to mind which class names are shared across files though, right now it's done in Spectrum-CSS (search for spectrum-Icon) but we are careful not to do it in React Spectrum's copy of Spectrum CSS. This means there are some class names we have taken the liberty of re-naming to make that distinction more clear, since CSS modules doesn't actually support the same name across multiple files and this plugin hides that a bit by created joined classnames.

#### Where should the CSS live
This has the most impact on what we ultimately do as it not only influences what we do immediately, it also impacts how we contribute back and make fixes during things like a release.

Groupings for this section:
  - Spectrum CSS publishes
    - Spectrum-CSS maintains all css packages
  - RSP publishes
    - RSP maintains css modules packages
    - RSP consumes DSS directly
    - RSP maintains their own CSS packages
  - Cohabit, RSP publishes
    - Spectrum-CSS and React Spectrum move into an even bigger monorepo
    - Spectrum-CSS becomes a submodule in React Spectrum
    - Spectrum-CSS submodule alternatives

##### Spectrum-CSS maintains all css packages
In this scenario, the Spectrum-CSS project adds two files to their distribution, a js file with the mapping of classnames to css module classnames and a css file that the js file imports. They can point to the js file using the main field of the package.json and can use styles to point to their css files. Spectrum-CSS is open to doing this. 

###### Pros:
  - Source of truth is Spectrum-CSS
  - We no longer provide our own separate copy bundle of the CSS
  - We are likely not blocked on several components we thought we'd have to maintain forever, Spectrum-CSS has already taken on grid in Dialog
  - Should Spectrum-CSS inadvertently break during a release, users of React Spectrum will be able to pin to earlier versions of Spectrum-CSS
  - Fixing CSS for the most part should still have the same turn around because they can test and release independent of us, and our range dependency should still allow users to pick up the fix

###### Cons:
  - We may need to still distribute some of our own modularized css if there are things Spectrum-CSS cannot have from us
    - It may be that we just don't distribute those files
  - If we use any new features that Spectrum-CSS implements, we will need to update our packages to point to the new minimum version of the CSS that supports our component
  - Slower cycle to add new features that require CSS
  - Our priorities may not match Spectrum-CSS' priorities
  - Any additional post-processing steps we want to do would need to be contributed to Spectrum-CSS, and some we may not be able to run at all, for instance, Parcel can remove unused classes. They'd be hard for a human to spot.
  - We have an extremely high quality bar, so releasing something where we're still waiting on the CSS updates as well is not something we want to do
  
##### RSP maintains css modules packages
Generate from node_modules in React Spectrum and publish as separate packages.

###### Pros:
  - Spectrum-CSS has to do less work
  - Should we inadvertently break CSS during a release, users of React Spectrum will be able to pin to earlier versions of our CSS packages

###### Cons:
  - A completely new package(s) for everyone
  - Wouldn't track with Spectrum-CSS updates, it'd always be behind
  - Local development would be difficult
    - in post install, so they'd be ready for use in storybook
    - have our own packages that import spectrum-css and apply overrides?
  - If we use any new features that we implement in CSS, we will need to update our packages to point to the new minimum version of the CSS that supports our component

##### React Spectrum consumes DSS directly

In this scenario, we stop using Spectrum-CSS and maintain our own CSS packages using the mixins provided by DSS. We may be able to make use of Spectrum-CSS if they also created mixins that covered some things that DSS can't.

###### Pros:
  - We can make use of all the nice things that DSS provides while also being able to quickly iterate on changes we need to make
  - Releases won't be held up by waiting for Spectrum-CSS, and hold ups from DSS should theoretically be less
  - We can make changes to structure, and it wouldn't be breaking for Spectrum-CSS or DSS

###### Cons:
  - Outstanding question, will DSS cover layout (grid/flex)
  - DSS isn't a standard thing, so understanding how our CSS files work may cause trouble for contributors

##### RSP maintains their own CSS packages
Everything stays the same, but we publish our CSS. What I mean by everything stays the same is that we keep a full copy of CSS and don't adopt new DSS or try to move back to Spectrum-CSS in any way.

###### Pros:
  - Very fast to add new features
  - Spectrum-CSS doesn't have to do anything

###### Cons:
  - More confusing ecosystem
  - Diverge from Spectrum-CSS
  - More work for us, we'd be duplicating efforts of Spectrum-CSS at best


##### Spectrum-CSS and React Spectrum share a monorepo
Either we'd move into theirs, or they'd move into ours, or we'd set up a new repo. Releases could be done in sync or not.

###### Pros:
  - No need to do local linking when trying to develop a new feature requiring CSS updates
  - Coordinated releases
  - Shared tooling

###### Cons:
  - Would set precedent for bringing in other groups to an already large repo
  - Work required to move into another repo for someone
  - Managing reviews could become difficult, especially around build

##### Spectrum-CSS becomes a submodule in React Spectrum

In this scenario, we'd likely run the Spectrum-CSS build as they provide it, we'd additionally run our own post processing steps to create the packages with CSS Modules. 

###### Pros:
  - No need to do local linking when trying to develop a new feature requiring CSS updates, it's taken care of by workspaces and lerna
  - Shared tooling

###### Cons:
  - Sub modules notoriously difficult to manage, contributors would need to learn some new workflows
  - Would likely need tooling in our repo specific to Spectrum-CSS
  - Would still be held up by Spectrum-CSS release cycles potentially
    - This could potentially be mitigated by us releasing the css module version of Spectrum-CSS, however, if we have multiple PR's open against Spectrum-CSS before we try to release, we'd need to merge all of them together which will make Spectrum-CSS task of reviewing and merging them more difficult. This is a common scenario in release testing.
  - https://www.atlassian.com/git/tutorials/git-submodule has a list of good use cases, ours isn't really one of them

##### Spectrum-CSS submodule alternatives

Looked at some alternatives to sub-modules, https://dev.to/giteden/4-git-submodules-alternatives-you-should-know-1hga some require subscriptions or would need an RFC for moving to them as their workflows and setups are different than ours. Some require moving to BitBucket.

Each of these seems to have mostly the same pros and cons as submodules regardless of the technology used.

#### DNA

There has been a breaking change to DNA, many tokens have changed. In addition, a script was run that changed our vars, so our vars don't look like Spectrum-CSS's vars. We will need to see if the script can be run again or if it's even something we want to keep.

##### Upgrade to 7.0 DNA first

###### Pros
  - There will be less to resolve when we start using Spectrum-CSS.

###### Cons
  - It would be more up front work that we'd need to do all at once before we could move to Spectrum-CSS. Probably we'd have a branch very similar to Spectrum-CSS'

##### Upgrade to 7.0 via move to Spectrum-CSS

###### Pros
  - Less up front work to getting on Spectrum-CSS.

###### Cons
  - We may have to support two versions of DNA at the same time. It would be susceptible to ordering 
  - would probably increase our overall library size while we're working on this.


#### DSS

This affects generation of Spectrum-CSS and token names. We will likely need to add some new classes. If we do have some components that we can't merge back to Spectrum-CSS, we'll need to decide if we keep using the Spectrum-CSS build tools to build our own.

#### Use complete, partial, none
We will likely have three different kinds of components. Components where we can immediately switch to Spectrum-CSS, components where we will need to merge back some changes before we can switch completely over, and components that we will never be able to use spectrum-css for. After talking to Spectrum-CSS the worry about having some components we can never contribute back has diminished, as shown by them taking on Dialog's CSS changes over half a year ago.

##### Contributing back
In order to merge back the changes we've made, we'll need to go component by component and get guidance on if we should contribute the changes to Spectrum-CSS or directly into DSS. Pros and cons are wrapped up in where Spectrum-CSS ends up living. See above "Where should the CSS live".

##### Local overrides & new packages
Spectrum-CSS provides a whole tools packages that we can use to build our own CSS. Yarn/Lerna resolution will choose a local copy of a package over a remote one by the same name. We don't want to include CSS into our packages other than some minor bits like TableView has, so we'd need to publish any overrides. This would be confusing to the community, and a lot of work to maintain.
If we do have components that spectrum-css never wants, those we should publish ourselves.

With Spectrum-CSS potentially taking on CSS Modules, how do we want to handle local CSS such as TableView. Can these local files be contributed to Spectrum-CSS, or will they need to be published with the package as we currently do. I see this as low risk because we already apply both Spectrum-CSS and React-Spectrum-CSS selectors and Table, at least, isn't relying on variables nor creating any.


## Documentation

<!--
    How will this RFC be documented? Does it need a formal announcement to explain 
		the motivation?
-->
No formal announcement should be needed, npm should take care of installing new package dependencies when we change over. If people don't use the combined @adobe/react-spectrum package though, they may end up with some duplicate css, we should be able to cover this by updating all minimum package references for this release. We will need to add some documentation describing how we expect contributions and bugs concerning CSS to be carried out. We should be able to rely on Spectrum-CSS for information on what tokens are considered API for theming, though we should link to the appropriate place from our Styling docs.

## Drawbacks

<!--
    Why should we *not* do this? Consider why adding this into React-Spectrum
    might not benefit the project or the community. Attempt to think 
    about any opposing viewpoints that reviewers might bring up. 

    Any change has potential downsides, including increased maintenance
    burden, incompatibility with other tools, breaking existing user
    experience, etc. Try to identify as many potential problems with
    implementing this RFC as possible.
-->
It will be slower to make CSS updates should there be any bugs. In addition, it'll be more confusing to the community when they find a bug, we'll likely have a number of them reported against us that we'll need to re-report to Spectrum-CSS. This may also affect how willing someone is to work on a bug and contribute a fix. Especially with upcoming DSS which would be a completely new technology for nearly everyone.

## Backwards Compatibility Analysis

<!--
    How does this change affect existing React-Spectrum users? Will any behavior
    change for them? If so, how are you going to minimize the disruption
    to existing users?
-->
Our changes should not affect the existing users of React-Spectrum. They will now have access to the CSS packages we use and should see an overall application size reduction.
It will affect how people contribute back to React-Spectrum and our team will need to be good at forwarding bugs to Spectrum-CSS. We can also add to our Contributing docs to educate people on the difference, and maybe our Architecture page as well.

## Alternatives

<!--
    What other designs did you consider? Why did you decide against those?

    This section should also include prior art, such as whether similar
    projects have already implemented a similar feature.
-->
One alternative is to keep things the way they are. This is not great though as we will continue to drift from Spectrum-CSS leading to different experiences across Adobe which could be seen as a violation of our projects goals. In addition, it leads to a sub par user experience as we have duplicate code in packages leading to unneeded size bloat of our packages. In many ways, this would be the least disruptive answer, especially for our team.


Another alternative is to start publishing the CSS we have as packages and to start merging in Spectrum-CSS changes when they release. This would require a lot of manual labor and will only become harder with the arrival of DSS. This would require us to move ourselves to DSS so we can track with Spectrum CSS' changes instead of copying the output of DSS. This would mean more tools that we'd need to track versions of as well. It'd be a lot of manual labor to keep up with their changes as well and determine how they fit with our divergence. This assumes that we don't take an active role contributing back.



## Open Questions

<!--
    This section is optional, but is suggested for a first draft.

    What parts of this proposal are you unclear about? What do you
    need to know before you can finalize this RFC?

    List the questions that you'd like reviewers to focus on. When
    you've received the answers and updated the design to reflect them, 
    you can remove this section.
-->




## Help Needed

<!--
    This section is optional.

    Are you able to implement this RFC on your own? If not, what kind
    of help would you need from the team?
-->

We'll need Spectrum-CSS' help in order to include CSS modules in Spectrum-CSS' packages. We'll also need their help merging back many of our changes.
People within our own team will need to champion the various components where they've done a lot of the CSS changes. That way we don't forget bugs that we've solved by doing something in a particular way. As domain experts on those components, they will be the best chance we have at avoiding regressions.

## Frequently Asked Questions

<!--
    This section is optional but suggested.

    Try to anticipate points of clarification that might be needed by
    the people reviewing this RFC. Include those questions and answers
    in this section.
-->

When will DSS actually be prime time ready?
What timeline are going to work with here?
Size comparison current Spectrum-CSS vs DSS output

## Related Discussions

<!--
    This section is optional but suggested.

    If there is an issue, pull request, or other URL that provides useful
    context for this proposal, please include those links here.
-->
