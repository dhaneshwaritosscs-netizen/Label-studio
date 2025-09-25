import React, { Component } from "react";
import { ErrorWrapper } from "../components/Error/Error";
import { Modal } from "../components/Modal/ModalPopup";
import { captureException } from "../config/Sentry";
import { isFF } from "../utils/feature-flags";
import { IMPROVE_GLOBAL_ERROR_MESSAGES } from "../providers/ApiProvider";

export const ErrorContext = React.createContext();

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
    
    // Add global error handler for unhandled promise rejections
    this.handleUnhandledRejection = this.handleUnhandledRejection.bind(this);
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  componentWillUnmount() {
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  handleUnhandledRejection(event) {
    const error = event.reason;
    if (error && error.message && error.message.includes("Failed to resolve reference") && (error.message.includes("to type 'User'") || error.message.includes("to type 'UserExtended'"))) {
      console.warn("MobX State Tree InvalidReferenceError in promise rejection:", error.message);
      // Prevent the default behavior (logging to console)
      event.preventDefault();
      // Log to Sentry but don't crash the app
      captureException(error, {
        extra: {
          error_type: "mobx_invalid_reference_promise",
        },
      });
    }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, { componentStack }) {
    // Handle mobx-state-tree InvalidReferenceError gracefully
    if (error.message && error.message.includes("Failed to resolve reference") && (error.message.includes("to type 'User'") || error.message.includes("to type 'UserExtended'"))) {
      console.warn("MobX State Tree InvalidReferenceError detected:", error.message);
      // Don't show error modal for this specific error, just log it
      captureException(error, {
        extra: {
          component_stacktrace: componentStack,
          error_type: "mobx_invalid_reference",
        },
      });
      // Reset error state to continue normal operation
      this.setState({ hasError: false, error: null, errorInfo: null });
      return;
    }

    // Capture the error in Sentry, so we can fix it directly
    // Don't make the users copy and paste the stacktrace, it's not actionable
    captureException(error, {
      extra: {
        component_stacktrace: componentStack,
      },
    });
    this.setState({
      error,
      hasError: true,
      errorInfo: componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      const { error, errorInfo } = this.state;

      const goBack = () => {
        // usually this will trigger React Router in the broken app, which is not helpful
        history.back();
        // so we reload app totally on that previous page after some delay for Router's stuff
        setTimeout(() => location.reload(), 32);
      };

      // We will capture the stacktrace in Sentry, so we don't need to show it in the modal
      // It is not actionable to the user, let's not show it
      const stacktrace = isFF(IMPROVE_GLOBAL_ERROR_MESSAGES)
        ? undefined
        : `${errorInfo ? `Component Stack: ${errorInfo}` : ""}\n\n${this.state.error?.stack ?? ""}`;

      return (
        <Modal onHide={() => location.reload()} style={{ width: "60vw" }} visible bare>
          <div style={{ padding: 40 }}>
            <ErrorWrapper
              title="Runtime error"
              message={error}
              stacktrace={stacktrace}
              onGoBack={goBack}
              onReload={() => location.reload()}
            />
          </div>
        </Modal>
      );
    }

    return (
      <ErrorContext.Provider
        value={{
          hasError: this.state.hasError,
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          silence: this.silence,
          unsilence: this.unsilence,
        }}
      >
        {this.props.children}
      </ErrorContext.Provider>
    );
  }
}

export const ErrorUI = () => {
  const context = React.useContext(ErrorContext);

  return context.hasError && <div className="error">Error occurred</div>;
};
