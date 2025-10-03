import { HorizontalSettingsMenu } from "../../components/HorizontalSettingsMenu";
import { WebhookPage } from "../WebhookPage/WebhookPage";
import { DangerZone } from "./DangerZone";
import { GeneralSettings } from "./GeneralSettings";
import { AnnotationSettings } from "./AnnotationSettings";
import { LabelingSettings } from "./LabelingSettings";
import { QCRSettings } from "./QCRSettings";
import { MachineLearningSettings } from "./MachineLearningSettings/MachineLearningSettings";
import { PredictionsSettings } from "./PredictionsSettings/PredictionsSettings";
import { StorageSettings } from "./StorageSettings/StorageSettings";
import { isInLicense, LF_CLOUD_STORAGE_FOR_MANAGERS } from "../../utils/license-flags";
import { useCurrentUser } from "../../providers/CurrentUser";
import { useState, useEffect } from "react";
import { useUserRoles } from "../../hooks/useUserRoles";

const isAllowCloudStorage = !isInLicense(LF_CLOUD_STORAGE_FOR_MANAGERS);

export const MenuLayout = ({ children, ...routeProps }) => {
  const { user } = useCurrentUser();
  const { userRoles, loadingRoles } = useUserRoles();

  // Map role names to settings components
  const roleToSettingsMap = {
    'general': GeneralSettings,
    'labeling-interface': LabelingSettings,
    'qcr': QCRSettings,
    'annotation': AnnotationSettings,
    'model': MachineLearningSettings,
    'predictions': PredictionsSettings,
    'cloud-storage': StorageSettings,
    'webhooks': WebhookPage,
    'danger-zone': DangerZone,
  };

  // Filter menu items based on user roles
  const getFilteredMenuItems = () => {
    if (loadingRoles) {
      // Show no items while loading - wait for role check to complete
      return [];
    }

    // Filter based on user roles
    const userRoleNames = userRoles.map(role => role.name);
    const filteredItems = [];

    // Add settings based on user roles (including General settings)
    Object.entries(roleToSettingsMap).forEach(([roleName, component]) => {
      if (userRoleNames.includes(roleName)) {
        // Special handling for cloud storage
        if (roleName === 'cloud-storage' && !isAllowCloudStorage) {
          return; // Skip if cloud storage is not allowed
        }
        filteredItems.push(component);
      }
    });

    return filteredItems;
  };

  const filteredMenuItems = getFilteredMenuItems();
  
  if (filteredMenuItems.length === 0 && !loadingRoles) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f8f9fa', borderRadius: '8px', margin: '20px' }}>
        <h3 style={{ color: '#6c757d', marginBottom: '16px' }}>No Settings Available</h3>
        <p style={{ color: '#6c757d', marginBottom: '20px' }}>
          You don't have any roles assigned yet. Please contact your administrator to assign roles for accessing settings.
        </p>
        <div style={{ 
          backgroundColor: '#fff3cd', 
          border: '1px solid #ffeaa7', 
          borderRadius: '4px', 
          padding: '12px',
          color: '#856404'
        }}>
          <strong>Note:</strong> Settings will become available once you have the appropriate roles assigned to your account.
        </div>
      </div>
    );
  }

  return (
    <HorizontalSettingsMenu
      menuItems={filteredMenuItems}
      path={routeProps.match.url}
      children={children}
    />
  );
};

// Create a function to get filtered pages based on user roles
const getFilteredPages = (userRoles = []) => {
  const userRoleNames = userRoles.map(role => role.name);
  
  const pages = {};

  // Add pages based on user roles (including General settings)
  if (userRoleNames.includes('general')) {
    pages.GeneralSettings = GeneralSettings;
  }
  if (userRoleNames.includes('labeling-interface')) {
    pages.LabelingSettings = LabelingSettings;
  }
  if (userRoleNames.includes('qcr')) {
    pages.QCRSettings = QCRSettings;
  }
  if (userRoleNames.includes('annotation')) {
    pages.AnnotationSettings = AnnotationSettings;
  }
  if (userRoleNames.includes('model')) {
    pages.MachineLearningSettings = MachineLearningSettings;
  }
  if (userRoleNames.includes('predictions')) {
    pages.PredictionsSettings = PredictionsSettings;
  }
  if (userRoleNames.includes('cloud-storage') && isAllowCloudStorage) {
    pages.StorageSettings = StorageSettings;
  }
  if (userRoleNames.includes('webhooks')) {
    pages.WebhookPage = WebhookPage;
  }
  if (userRoleNames.includes('danger-zone')) {
    pages.DangerZone = DangerZone;
  }

  return pages;
};

// Dynamic component that shows the first available settings page or no settings message
const DynamicSettingsComponent = (props) => {
  const { userRoles, loadingRoles } = useUserRoles();
  
  if (loadingRoles) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{ color: '#6c757d' }}>Loading settings...</div>
      </div>
    );
  }
  
  const userRoleNames = userRoles.map(role => role.name);
  
  // Check if user has any settings roles
  const hasAnySettingsRole = userRoleNames.some(roleName => 
    ['general', 'labeling-interface', 'qcr', 'annotation', 'model', 'predictions', 'cloud-storage', 'webhooks', 'danger-zone'].includes(roleName)
  );
  
  if (!hasAnySettingsRole) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', backgroundColor: '#f8f9fa', borderRadius: '8px', margin: '20px' }}>
        <h3 style={{ color: '#6c757d', marginBottom: '16px' }}>No Settings Available</h3>
        <p style={{ color: '#6c757d', marginBottom: '20px' }}>
          You don't have any roles assigned yet. Please contact your administrator to assign roles for accessing settings.
        </p>
        <div style={{ 
          backgroundColor: '#fff3cd', 
          border: '1px solid #ffeaa7', 
          borderRadius: '4px', 
          padding: '12px',
          color: '#856404'
        }}>
          <strong>Note:</strong> Settings will become available once you have the appropriate roles assigned to your account.
        </div>
      </div>
    );
  }
  
  // Show the first available settings page
  if (userRoleNames.includes('general')) {
    return <GeneralSettings {...props} />;
  }
  if (userRoleNames.includes('labeling-interface')) {
    return <LabelingSettings {...props} />;
  }
  if (userRoleNames.includes('qcr')) {
    return <QCRSettings {...props} />;
  }
  if (userRoleNames.includes('annotation')) {
    return <AnnotationSettings {...props} />;
  }
  if (userRoleNames.includes('model')) {
    return <MachineLearningSettings {...props} />;
  }
  if (userRoleNames.includes('predictions')) {
    return <PredictionsSettings {...props} />;
  }
  if (userRoleNames.includes('cloud-storage') && isAllowCloudStorage) {
    return <StorageSettings {...props} />;
  }
  if (userRoleNames.includes('webhooks')) {
    return <WebhookPage {...props} />;
  }
  if (userRoleNames.includes('danger-zone')) {
    return <DangerZone {...props} />;
  }
  
  // Fallback
  return <GeneralSettings {...props} />;
};

export const SettingsPage = {
  title: "Settings",
  path: "/settings",
  exact: true,
  layout: MenuLayout,
  component: DynamicSettingsComponent,
  pages: {
    LabelingSettings,
    QCRSettings,
    AnnotationSettings,
    MachineLearningSettings,
    PredictionsSettings,
    ...(isAllowCloudStorage && { StorageSettings }),
    WebhookPage,
    DangerZone,
  },
};
