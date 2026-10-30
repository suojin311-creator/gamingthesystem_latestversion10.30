import React from 'react';

// The preview owns its clock and decodes these stills before playback. Remotion's
// Img expects a composition clock; a plain image needs no second player/context.
export function Img({ src, alt = '', ...props }) {
  return <img {...props} src={src} alt={alt} draggable={false} />;
}
