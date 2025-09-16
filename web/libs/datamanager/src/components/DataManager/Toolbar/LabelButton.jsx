import { inject } from "mobx-react";
import { Button } from "../../Common/Button/Button";
import { Interface } from "../../Common/Interface";

const injector = inject(({ store }) => {
  const { dataStore, currentView } = store;
  const totalTasks = store.project?.task_count ?? store.project?.task_number ?? 0;
  const foundTasks = dataStore?.total ?? 0;

  return {
    store,
    canLabel: totalTasks > 0 || foundTasks > 0,
    target: currentView?.target ?? "tasks",
    selectedCount: currentView?.selectedCount,
    allSelected: currentView?.allSelected,
  };
});

export const LabelButton = injector(({ store, canLabel, size, target, selectedCount }) => {
  const disabled = target === "annotations";

  const onLabelAll = () => {
    localStorage.setItem("dm:labelstream:mode", "all");
    store.startLabelStream();
  };

  return canLabel ? (
    <Interface name="labelButton">
      <Button
        size={size}
        disabled={disabled}
        mod={{ size: size ?? "medium", look: "primary", disabled }}
        style={{ 
          background: "rgb(25 44 89) !important",
          color: "#ffffff !important",
          border: "none !important",
          borderRadius: "6px",
          padding: "8px 16px",
          fontSize: "12px",
          fontWeight: "600",
          cursor: "pointer",
          transition: "all 0.2s ease",
          minWidth: "160px"
        }}
        onClick={onLabelAll}
      >
        Label {selectedCount ? selectedCount : "All"} Task{!selectedCount || selectedCount > 1 ? "s" : ""}
      </Button>
    </Interface>
  ) : null;
});
