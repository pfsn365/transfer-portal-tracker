declare module 'react-simple-maps' {
  import * as React from 'react';

  interface ComposableMapProps {
    projection?: string;
    projectionConfig?: Record<string, unknown>;
    style?: React.CSSProperties;
    children?: React.ReactNode;
  }
  export function ComposableMap(props: ComposableMapProps): React.ReactElement;

  interface GeographiesProps {
    geography: string | object;
    children: (args: { geographies: Geography[] }) => React.ReactNode;
  }
  export function Geographies(props: GeographiesProps): React.ReactElement;

  export interface Geography {
    rsmKey: string;
    properties: Record<string, string>;
    [key: string]: unknown;
  }

  interface GeographyProps {
    key?: string;
    geography: Geography;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    style?: {
      default?: React.CSSProperties;
      hover?: React.CSSProperties;
      pressed?: React.CSSProperties;
    };
    onMouseEnter?: (event: React.MouseEvent<SVGPathElement>) => void;
    onMouseLeave?: (event: React.MouseEvent<SVGPathElement>) => void;
    onClick?: (event: React.MouseEvent<SVGPathElement>) => void;
  }
  export function Geography(props: GeographyProps): React.ReactElement;
}
