# [React Spectrum UXP](https://react-spectrum.adobe.com/react-spectrum/index.html)

A React implementation for Adobe's Unified Extensibility Platform (UXP) of Spectrum, Adobe's design system.

This repository is API compatible with the @adobe/react-spectrum monopackage.

For projects which are going to run on the UXP Platform you can either change your @adobe/react-spectrum imports to @adobe/react-spectrum-uxp or if you are using a bundler such as Parcel or Webpack then you can setup an alias to automatically do that.

When running on a non-UXP platform the exported react-spectrum components fall back to using the standard web based @react-spectrum/* components.

It's build and publishing process is consistent with all other packages within this monorepo.

External documentation on the Unified Extensibility Platform is available here: https://adobexdplatform.com/plugin-docs/reference/uxp/

See the main React Spectrum docs for more information.

For more information on testing React-Spectrum-UXP see th /packages/@react-spectrum-uxp/storybook repository.