import { inject } from "mobx-react";
import { IconSortDown, IconSortUp, IconChevronDown } from "@humansignal/icons";
import { Button } from "../../Common/Button/Button";
import { FieldsButton } from "../../Common/FieldsButton";
import { Space } from "../../Common/Space/Space";
import { Icon } from "../../Common/Icon/Icon";

const injector = inject(({ store }) => {
  const view = store?.currentView;

  return {
    view,
    ordering: view?.currentOrder,
  };
});

export const OrderButton = injector(({ size, ordering, view, ...rest }) => {
  return (
    <Space style={{ fontSize: 12 }}>
      <div style={{ display: "flex", gap: "8px" }}>
        <FieldsButton
          size={size}
          style={{ minWidth: 67, textAlign: "left" }}
          title={ordering ? ordering.column?.title : "Order by"}
          onClick={(col) => view.setOrdering(col.id)}
          onReset={() => view.setOrdering(null)}
          resetTitle="Default"
          selected={ordering?.field}
          trailingIcon={<Icon icon={IconChevronDown} style={{ color: "#ffffff" }} />}
          wrapper={({ column, children }) => (
            <Space style={{ width: "100%", justifyContent: "space-between" }}>
              {children}

              <div
                style={{
                  width: 24,
                  height: 24,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {column?.icon}
              </div>
            </Space>
          )}
          openUpwardForShortViewport={false}
        />

        <Button
          size={size}
          disabled={false}
          onClick={() => {
            try {
              // Ensure we have a valid field before calling setOrdering
              if (ordering?.field) {
                view.setOrdering(ordering.field);
              } else {
                console.warn('No ordering field selected');
              }
            } catch (error) {
              console.error('Error setting ordering:', error);
            }
          }}
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
            minWidth: "60px"
          }}
        >
          Sort
        </Button>
      </div>
    </Space>
  );
});
