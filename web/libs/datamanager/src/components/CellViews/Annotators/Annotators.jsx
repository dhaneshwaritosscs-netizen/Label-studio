import { inject } from "mobx-react";
import clsx from "clsx";
import { useSDK } from "../../../providers/SDKProvider";
import { cn } from "../../../utils/bem";
import { isDefined } from "../../../utils/utils";
import { Space } from "../../Common/Space/Space";
import { IconCheckAlt, IconCrossAlt } from "@humansignal/icons";
import { Tooltip, Userpic } from "@humansignal/ui";
import { Common } from "../../Filters/types";
import { VariantSelect } from "../../Filters/types/List";
import "./Annotators.scss";

export const Annotators = (cell) => {
  const { value, column, original: task } = cell;
  const sdk = useSDK();
  const userList = Array.from(value);
  const renderable = userList.slice(0, 10);
  const extra = userList.length - renderable.length;
  const userPickBadge = cn("userpic-badge");
  const annotatorsCN = cn("annotators");
  const isEnterprise = window.APP_SETTINGS.billing?.enterprise;

  return (
    <div className={annotatorsCN.toString()}>
      {renderable.map((item, index) => {
        let user;
        try {
          user = item.user ?? item;
        } catch (error) {
          // Handle missing user reference gracefully
          console.warn("Failed to resolve user reference:", error);
          user = {
            id: item.id || index,
            firstName: "Unknown",
            lastName: "User",
            email: `user${item.id || index}@unknown.com`,
            username: `user_${item.id || index}`,
            fullName: "Unknown User",
            initials: "U",
            avatar: null,
            lastActivity: "",
          };
        }
        const { annotated, reviewed, review } = item;

        const userpicIsFaded =
          (isDefined(annotated) && annotated === false) || (isDefined(reviewed) && reviewed === false && isEnterprise);
        const suppressStats = column.alias === "comment_authors";

        return (
          <div
            key={`user-${user.id}-${index}`}
            className={annotatorsCN.elem("item").toString()}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              sdk.invoke("userCellClick", e, column.alias, task, user, suppressStats);
            }}
          >
            <Tooltip title={user.fullName || user.email}>
              <Userpic
                user={user}
                faded={userpicIsFaded}
                badge={{
                  bottomRight: review && (
                    <div className={clsx(userPickBadge.toString(), userPickBadge.mod({ [review]: true }).toString())}>
                      {review === "rejected" ? <IconCrossAlt /> : <IconCheckAlt />}
                    </div>
                  ),
                }}
              />
            </Tooltip>
          </div>
        );
      })}
      {extra > 0 && (
        <div
          className={annotatorsCN.elem("item").toString()}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            sdk.invoke("userCellCounterClick", e, column.alias, task, userList);
          }}
        >
          <Userpic username={`+${extra}`} />
        </div>
      )}
    </div>
  );
};

const UsersInjector = inject(({ store }) => {
  return {
    users: store.users,
  };
});

Annotators.filterItems = (items) => {
  return items.filter((userId) => {
    let user;
    try {
      user = DM.usersMap.get(userId);
    } catch (error) {
      console.warn("Failed to get user for filter items:", error);
      user = null;
    }
    return !(user?.firstName === "Deleted" && user?.lastName === "User");
  });
};

Annotators.FilterItem = UsersInjector(({ item }) => {
  let user;
  try {
    user = DM.usersMap.get(item);
  } catch (error) {
    console.warn("Failed to get user from usersMap:", error);
    user = null;
  }

  return user ? (
    <Space size="small">
      <Userpic user={user} size={16} key={`user-${item}`} />
      {user.displayName}
    </Space>
  ) : (
    <Space size="small">
      <Userpic username={`user_${item}`} size={16} key={`user-${item}`} />
      Unknown User
    </Space>
  );
});

Annotators.searchFilter = (option, queryString) => {
  let user;
  try {
    user = DM.usersMap.get(option?.value);
  } catch (error) {
    console.warn("Failed to get user for search filter:", error);
    user = null;
  }
  
  if (!user) {
    return `user_${option?.value}`.toLowerCase().includes(queryString.toLowerCase());
  }
  
  return (
    user.id?.toString().toLowerCase().includes(queryString.toLowerCase()) ||
    user.email?.toLowerCase().includes(queryString.toLowerCase()) ||
    user.displayName?.toLowerCase().includes(queryString.toLowerCase())
  );
};

Annotators.filterable = true;
Annotators.customOperators = [
  {
    key: "contains",
    label: "contains",
    valueType: "list",
    input: (props) => <VariantSelect {...props} />,
  },
  {
    key: "not_contains",
    label: "not contains",
    valueType: "list",
    input: (props) => <VariantSelect {...props} />,
  },
  ...Common,
];
