import { inject } from "mobx-react";
import React from "react";
import Running from "../../assets/running";

const injector = inject(({ store }) => {
  return {
    SDK: store?.SDK,
  };
});

export const Spinner = injector(({ SDK, visible = true, ...props }) => {
  const size = React.useMemo(() => {
    switch (props.size) {
      case "large":
        return SDK?.spinnerSize?.large ?? 128;
      case "middle":
        return SDK?.spinnerSize?.middle ?? 48;
      case "small":
        return SDK?.spinnerSize?.small ?? 24;
      default:
        return SDK?.spinnerSize?.middle ?? 48;
    }
  }, [props.size]);

  const source = React.useMemo(() => {
    return Running.full;
  }, [props.size]);

  const videoStyles = {
    width: "100%",
    height: "100%",
    objectFit: "contain",
  };

  const ExternalSpinner = SDK?.spinner;

  return visible ? (
    <div
      {...props}
      style={{ 
        width: size, 
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      children={
        <div 
          style={{ 
            width: size * 0.6, 
            height: size * 0.6,
            border: '3px solid #f3f3f3',
            borderTop: '3px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}
        />
      }
    />
  ) : null;
});
