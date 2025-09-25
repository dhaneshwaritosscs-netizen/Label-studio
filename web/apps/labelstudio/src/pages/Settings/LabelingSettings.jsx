import { useCallback, useMemo, useState } from "react";
import { useAPI } from "../../providers/ApiProvider";
import { useProject } from "../../providers/ProjectProvider";
import { FF_UNSAVED_CHANGES, isFF } from "../../utils/feature-flags";
import { isEmptyString } from "../../utils/helpers";
import { ConfigPage } from "../CreateProject/Config/Config";
import { useUserRoles } from "../../hooks/useUserRoles";
import { Block, Elem } from "../../utils/bem";
import "./access-denied.scss";

export const LabelingSettings = () => {
  const { project, fetchProject, updateProject } = useProject();
  const [config, setConfig] = useState("");
  const [essentialDataChanged, setEssentialDataChanged] = useState(false);
  const hasChanges = isFF(FF_UNSAVED_CHANGES) && config !== project.label_config;
  const api = useAPI();
  const { hasRole, loadingRoles } = useUserRoles();

  // All hooks must be called before any conditional returns
  const saveConfig = useCallback(
    isFF(FF_UNSAVED_CHANGES)
      ? async () => {
          const res = await updateProject({
            label_config: config,
          });

          if (res?.$meta?.ok) {
            // Backend can prettify the config, so we need to update it to have relevant hasChanges value
            setConfig(res.label_config);
            return true;
          }

          //error handling
          return res.response;
        }
      : async () => {
          const res = await api.callApi("updateProjectRaw", {
            params: {
              pk: project.id,
            },
            body: {
              label_config: config,
            },
          });

          if (res.ok) {
            return true;
          }

          const error = await res.json();

          fetchProject();
          return error;
        },
    [project, config],
  );

  const projectAlreadySetUp = useMemo(() => {
    if (project.label_config) {
      const hasConfig = !isEmptyString(project.label_config);
      const configIsEmpty = project.label_config.replace(/\s/g, "") === "<View></View>";
      const hasTasks = project.task_number > 0;

      console.log({ hasConfig, configIsEmpty, hasTasks, project });
      return hasConfig && !configIsEmpty && hasTasks;
    }
    return false;
  }, [project]);

  const onSave = useCallback(async () => {
    return saveConfig();
  }, [essentialDataChanged, saveConfig]);

  const onUpdate = useCallback((config) => {
    setConfig(config);
    fetchProject();
  });

  const onValidate = useCallback((validation) => {
    setEssentialDataChanged(validation.config_essential_data_has_changed);
  }, []);

  // Check if user has labeling-interface role
  if (loadingRoles) {
    return (
      <Block name="labeling-settings">
        <Elem name="loading">Loading...</Elem>
      </Block>
    );
  }

  if (!hasRole('labeling-interface')) {
    return (
      <Block name="labeling-settings">
        <Elem name="access-denied">
          <h1>Access Denied</h1>
          <p>You don't have permission to access Labeling Interface settings.</p>
          <p>Contact your administrator to request the 'labeling-interface' role.</p>
        </Elem>
      </Block>
    );
  }

  if (!project.id) return null;

  return (
    <ConfigPage
      config={project.label_config}
      project={project}
      onUpdate={onUpdate}
      onSaveClick={onSave}
      onValidate={onValidate}
      hasChanges={hasChanges}
    />
  );
};

LabelingSettings.title = "Labeling Interface";
LabelingSettings.path = "/labeling";
