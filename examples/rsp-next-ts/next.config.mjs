// TODO just add a react version checker here
import ReactDOM from 'react-dom';
import withTM from 'next-transpile-modules';

let fullConfig;
let transpilePackages =  [
  '@adobe/react-spectrum',
  '@react-spectrum/actionbar',
  '@react-spectrum/actiongroup',
  '@react-spectrum/avatar',
  '@react-spectrum/badge',
  '@react-spectrum/breadcrumbs',
  '@react-spectrum/button',
  '@react-spectrum/buttongroup',
  '@react-spectrum/calendar',
  '@react-spectrum/checkbox',
  '@react-spectrum/color',
  '@react-spectrum/combobox',
  '@react-spectrum/contextualhelp',
  '@react-spectrum/datepicker',
  '@react-spectrum/dialog',
  '@react-spectrum/divider',
  '@react-spectrum/dnd',
  '@react-spectrum/form',
  '@react-spectrum/icon',
  '@react-spectrum/illustratedmessage',
  '@react-spectrum/image',
  '@react-spectrum/label',
  '@react-spectrum/labeledvalue',
  '@react-spectrum/layout',
  '@react-spectrum/link',
  '@react-spectrum/list',
  '@react-spectrum/listbox',
  '@react-spectrum/menu',
  '@react-spectrum/meter',
  '@react-spectrum/numberfield',
  '@react-spectrum/overlays',
  '@react-spectrum/picker',
  '@react-spectrum/progress',
  '@react-spectrum/provider',
  '@react-spectrum/radio',
  '@react-spectrum/slider',
  '@react-spectrum/searchfield',
  '@react-spectrum/statuslight',
  '@react-spectrum/switch',
  '@react-spectrum/table',
  '@react-spectrum/tabs',
  '@react-spectrum/tag',
  '@react-spectrum/text',
  '@react-spectrum/textfield',
  '@react-spectrum/theme-dark',
  '@react-spectrum/theme-default',
  '@react-spectrum/theme-light',
  '@react-spectrum/tooltip',
  '@react-spectrum/toast',
  '@react-spectrum/view',
  '@react-spectrum/well',
  '@spectrum-icons/illustrations',
  '@spectrum-icons/ui',
  '@spectrum-icons/workflow'
];
let baseConfig = {
  basePath:
    process.env.VERDACCIO && process.env.CIRCLE_SHA1
      ? `/reactspectrum/${process.env.CIRCLE_SHA1}/verdaccio/next`
      : "",
};

if (ReactDOM.version.startsWith('18')) {
  fullConfig = {
    transpilePackages,
    ...baseConfig
  };
} else {
  fullConfig = withTM(
    transpilePackages
  )(baseConfig);
}

export default fullConfig;
