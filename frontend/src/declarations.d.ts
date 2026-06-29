declare module '*.svg' {
  import React from 'react';
  const ReactComponent: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  export { ReactComponent };
  export default ReactComponent;
}

declare const process: {
  env: {
    NODE_ENV?: string;
    REACT_APP_API_URL?: string;
    REACT_APP_LEAD_SOURCE?: string;
    [key: string]: string | undefined;
  };
};
