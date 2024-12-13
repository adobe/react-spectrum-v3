import {Avatar} from '../';
import React from 'react';
import {renderv3 as render, screen} from '@react-spectrum/test-utils-internal';

let isOldReact = parseInt(React.version, 10) < 18;

describe('Avatar', () => {
  it('renders an avatar image', () => {
    render(<Avatar src="http://localhost/some_image.png" />);
    expect(screen.getByRole(isOldReact ? 'img' : 'presentation')).toBeInTheDocument();
    expect(screen.getByRole(isOldReact ? 'img' : 'presentation')).toHaveAttribute('src', 'http://localhost/some_image.png');
  });

  it('can render an avatar image with an alt', () => {
    render(<Avatar src="http://localhost/some_image.png" alt="Test avatar" />);
    expect(screen.getByAltText(/test avatar/i)).toBeInTheDocument();
  });

  describe('when given a custom size', () => {
    it('supports custom sizes in units, such as pixels', () => {
      render(<Avatar src="http://localhost/some_image.png" size="80px" />);
      expect(screen.getByRole(isOldReact ? 'img' : 'presentation')).toHaveStyle({
        height: '80px',
        width: '80px'
      });
    });

    it('supports custom sizes in numbers', () => {
      render(<Avatar src="http://localhost/some_image.png" size={80} />);
      expect(screen.getByRole(isOldReact ? 'img' : 'presentation')).toHaveStyle({
        height: '80px',
        width: '80px'
      });
    });
  });

  it('supports custom class names', () => {
    render(<Avatar src="http://localhost/some_image.png" UNSAFE_className="my-class" />);
    expect(screen.getByRole(isOldReact ? 'img' : 'presentation')).toHaveAttribute('class', expect.stringContaining('my-class'));
  });

  it('supports style props', () => {
    render(<Avatar src="http://localhost/some_image.png" isHidden />);
    expect(screen.getByRole(isOldReact ? 'img' : 'presentation', {hidden: true})).toBeInTheDocument();
  });

  it('supports custom DOM props', () => {
    render(<Avatar src="http://localhost/some_image.png" data-testid="Test avatar" />);
    expect(screen.getByTestId(/test avatar/i)).toBeInTheDocument();
  });

  describe('when isDisabled = true', () => {
    it('renders a disabled avatar image', () => {
      render(<Avatar src="http://localhost/some_image.png" isDisabled />);
      expect(screen.getByRole(isOldReact ? 'img' : 'presentation')).toHaveAttribute('class', expect.stringMatching(/disabled/i));
    });
  });
});
