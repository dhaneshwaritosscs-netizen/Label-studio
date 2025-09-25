import { types } from "mobx-state-tree";
import { User } from "./Users";
import { StringOrNumberID } from "./types";

export const Assignee = types
  .model("Assignee", {
    id: StringOrNumberID,
    user: types.late(() => types.maybeNull(types.reference(User))),
    review: types.maybeNull(types.enumeration(["accepted", "rejected", "fixed"])),
    reviewed: types.maybeNull(types.boolean),
    annotated: types.maybeNull(types.boolean),
  })
  .views((self) => ({
    get firstName() {
      return self.user?.firstName || "Unknown";
    },
    get lastName() {
      return self.user?.lastName || "User";
    },
    get username() {
      return self.user?.username || `user_${self.id}`;
    },
    get email() {
      return self.user?.email || `user${self.id}@unknown.com`;
    },
    get lastActivity() {
      return self.user?.lastActivity || "";
    },
    get avatar() {
      return self.user?.avatar || null;
    },
    get initials() {
      return self.user?.initials || "U";
    },
    get fullName() {
      return self.user?.fullName || "Unknown User";
    },
  }))
  .preProcessSnapshot((sn) => {
    let result = sn;

    if (typeof sn === "number") {
      result = {
        id: sn,
        user: sn,
        annotated: true,
        review: null,
        reviewed: false,
      };
    } else {
      const { user_id, user, ...rest } = sn;

      result = {
        ...rest,
        id: user_id ?? user,
        user: user_id ?? user,
      };
    }

    return result;
  })
  .actions((self) => ({
    // Action to handle missing user references gracefully
    ensureUserExists() {
      if (!self.user) {
        // Create a placeholder user if the reference is missing
        const root = self.getRoot();
        if (root && root.users) {
          const existingUser = root.users.find(u => u.id === self.id);
          if (!existingUser) {
            // Add a placeholder user to prevent reference errors
            root.users.push({
              id: self.id,
              firstName: "Unknown",
              lastName: "User",
              username: `user_${self.id}`,
              email: `user${self.id}@unknown.com`,
              lastActivity: "",
              avatar: null,
              initials: "U",
            });
          }
        }
      }
    },
  }));
