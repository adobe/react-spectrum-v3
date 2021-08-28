import {Button} from '@react-spectrum/button';
import React from 'react';

export default function Sample() {
  return (<div>
    <Button
      variant="cta"
      onPress={() => console.log('Clicked!')}>
      Hello React Spectrum
    </Button>
  </div>);
}
