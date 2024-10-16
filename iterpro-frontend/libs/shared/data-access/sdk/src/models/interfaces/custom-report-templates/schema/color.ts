type RGB = `rgb(${number}, ${number}, ${number})`;
type RGBA = `rgba(${number}, ${number}, ${number}, ${number})`;
type HEX = `#${string}`;
type CSSVAR = `var(--${string})`;

export type Color = RGB | RGBA | HEX | CSSVAR;
