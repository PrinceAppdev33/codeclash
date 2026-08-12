declare module 'react-katex' {
  import * as React from 'react';

  export interface KatexProps {
    math?: string;
    children?: string;
    errorColor?: string;
    renderError?: (error: Error | TypeError) => React.ReactNode;
    settings?: Record<string, unknown>;
  }

  export const InlineMath: React.FC<KatexProps>;
  export const BlockMath: React.FC<KatexProps>;
  export default InlineMath;
}