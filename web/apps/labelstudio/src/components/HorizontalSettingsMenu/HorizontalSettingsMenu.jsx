import { cn } from "../../utils/bem";
import { Menu } from "../Menu/Menu";
import "./HorizontalSettingsMenu.scss";

export const HorizontalSettingsMenu = ({ children, menu, path, menuItems }) => {
  const rootClass = cn("horizontal-settings-menu");

  return (
    <div className={rootClass}>
      {menuItems && menuItems.length > 1 ? (
        <div className={rootClass.elem("navigation")}>
          <Menu>{menuItems ? Menu.Builder(path, menuItems) : menu}</Menu>
        </div>
      ) : null}
      <div className={rootClass.elem("content")}>{children}</div>
    </div>
  );
};
