<!-- Copyright 2020 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License. -->

- Start Date: 2021-06-28
- RFC PR: https://github.com/adobe/react-spectrum/pull/2068
- Authors: Rob Snow @snowystinger

# Upgrade to DNA 7

## Summary

<!-- One-paragraph explanation of the feature. -->
This RFC entails the work needed to upgrade us from our custom vars to `@spectrum-css/vars`. It will outline
how to install DNA, move components to the new tokens, what to do when you find a bug in the new DNA version,
and build our components with the new tokens, both Parcel and Webpack.

## Motivation

<!-- Why are we doing this? What use cases does it support? What is the expected
outcome? -->
We need to upgrade our version of DNA to make any future decisions about Spectrum-CSS easier.
First, this will make updating to new versions of DNA as they come out easier.
By doing the upgrade now and alone, we can make a chromatic baseline. We'll quickly know what colors or sizes that DNA
has changed or added.
The DNA upgrade will make it easier to enact any plans for Spectrum-CSS, including transitioning our changes back or moving off
to consume DSS directly because we won't need to worry about colors or sizes changing as much.
The expected outcome is that we use the current values that Design has specified for Spectrum,
and we limit our testing surface area to size and color. We do not include behavior.
As an added benefit, this gets us closer to supporting t-shirt sizes.

## Detailed design

<!--
   This is the bulk of the RFC.

   Explain the Design with enough detail that someone familiar with React-Spectrum
   can implement it by reading this document. Please get into specifics
   of your approach, corner cases, and examples of how the change will be
   used. Be sure to define any new terms in this section.
-->
First, we'll start a branch with a dependency on the last `@spectrum-css/vars` with DNA 7.
Next, we can work on individual components on branches based on this one. You can see the changes I made to
Checkbox's CSS in this branch https://github.com/adobe/react-spectrum/compare/prototype-dna-upgrade?expand=1.


We can make a simple change to convert all tokens to use the 'm', or medium t-shirt, size.
This change will match our current sizes for everything.


There will be some bugs, and we'll need to look into them as we find them. So far, most of them have been what I
believe to be errors in DNA, not in DSS or CSS.
Some class names may need updating as well; see the Icons CSS in that same branch. Open question about renaming.
We have some comments in our code for patches/fixes since we couldn't easily update DNA.
If we come across one of these, we should do our best to fix it where it originates.


Components share some CSS files. People working on a component should address these
as needed and get them merged to the upgrade branch early not to duplicate that effort.
Again, see the branch link above; there are font styles, icon styles, and typography styles that need to apply to many
components. One person can do the shared component work before we farm out the rest of the components.

## Documentation

<!--
    How will this RFC be documented? Does it need a formal announcement to explain 
  the motivation?
-->
This change should be minor as far as work and use go. We may need something explaining our relationship
with our token system so that contributors don't get confused.

## Drawbacks

<!--
    Why should we *not* do this? Consider why adding this into React-Spectrum
    might not benefit the project or the community. Attempt to think about any opposing viewpoints that reviewers might bring up. 

    Any change has potential downsides, including increased maintenance burden, incompatibility with other tools, breaking existing user experience, etc. Try to identify as many potential problems with
    implementing this RFC as possible.
-->
There is a chance that we'll let some DNA bugs through. If there is a DNA bug, it may be
harder for a contributor or one of us to fix and may take longer.

## Backwards Compatibility Analysis

<!--
    How does this change affect existing React-Spectrum users? Will any behavior
    change for them? If so, how are you going to minimize the disruption
    to existing users?
-->
This RFC should result in no changes to existing users of React-Spectrum, unless anyone was customizing based on token names.
Token names are not considered API right now, so it's not something we really need to worry about yet.

## Alternatives

<!--
    What other designs did you consider? Why did you decide against those?

    This section should also include prior art, such as whether similar
    projects have already implemented a similar feature.
-->

We could do this as part of a wholesale upgrade to move back to Spectrum-CSS or move off and straight to DSS,
but given we haven't decided, this is an easier move with less surface area that lets us find any issues with DNA ahead of time.

## Open Questions

<!--
    This section is optional, but is suggested for a first draft.

    What parts of this proposal are you unclear about? What do you
    need to know before you can finalize this RFC?

    List the questions that you'd like reviewers to focus on. When
    you've received the answers and updated the Design to reflect them, 
    you can remove this section.
-->
We'll need to determine if it is enough to have a dependency on `@spectrum-css/vars`
or if we need to copy that package into our temp directory so that Parcel can build with it.
Do we want to change the ui icon class names?

## Help Needed

<!--
    This section is optional.

    Are you able to implement this RFC on your own? If not, what kind
    of help would you need from the team?
-->
There are too many components for one person, and it'd be easiest to break up the repo and farm it out to everyone on the team.
We'll also need a testing session afterward focused on size and color; chromatic can hit a lot, but not everything, particularly
around focus/hover/active.
We'll likely want someone from Design who can answer questions if something is intentional or a bug.

## Frequently Asked Questions

<!--
    This section is optional but suggested.

    Try to anticipate points of clarification that might be needed by
    the people reviewing this RFC. Include those questions and answers
    in this section.
-->

## Related Discussions

<!--
    This section is optional but suggested.

    If there is an issue, pull request, or other URL that provides useful
    context for this proposal, please include those links here.
-->
Spectrum-CSS is doing similar work here: https://github.com/adobe/spectrum-css/pull/1138
