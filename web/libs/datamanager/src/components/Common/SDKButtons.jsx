import { useSDK } from "../../providers/SDKProvider";
import { Button } from "./Button/Button";

const SDKButton = ({ eventName, ...props }) => {
  const sdk = useSDK();

  return sdk.hasHandler(eventName) ? (
    <Button
      {...props}
      style={{
        background: "rgb(25, 44, 89) !important",
        color: "#ffffff !important",
        border: "none !important",
        borderRadius: "6px",
        padding: "8px 16px",
        fontSize: "12px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "all 0.2s ease",
        ...props.style
      }}
      onClick={() => {
        sdk.invoke(eventName);
      }}
    />
  ) : null;
};

export const SettingsButton = ({ ...props }) => {
  return <SDKButton {...props} eventName="settingsClicked" />;
};

export const ImportButton = ({ ...props }) => {
  return <SDKButton {...props} eventName="importClicked" />;
};

export const ExportButton = ({ ...props }) => {
  return <SDKButton {...props} eventName="exportClicked" />;
};
