import { useCallback, useMemo, useState } from "react";
import { Checkbox } from "@humansignal/ui";

/**
 * FIXME: This is legacy imports. We're not supposed to use such statements
 * each one of these eventually has to be migrated to core/ui
 */
import { useAPI } from "apps/labelstudio/src/providers/ApiProvider";
import { useConfig } from "apps/labelstudio/src/providers/ConfigProvider";
import { useCurrentUser } from "apps/labelstudio/src/providers/CurrentUser";

export const EmailPreferences = () => {
  const config = useConfig();
  const { user } = useCurrentUser();
  const api = useAPI();
  const [isAllowNewsLetter, setIsAllowNewsLetter] = useState(config.user.allow_newsletters);

  const toggleHandler = useCallback(
    async (e: any) => {
      setIsAllowNewsLetter(e.target.checked);
      await api.callApi("updateUser", {
        params: {
          pk: user?.id,
        },
        body: {
          allow_newsletters: e.target.checked ? 1 : 0,
        },
      });
    },
    [user?.id],
  );

  const message = useMemo(() => {
    return window.APP_SETTINGS?.whitelabel_is_active
      ? "Subscribe for news and tips"
      : "Subscribe to Toss Consultancy Services(K)";
  }, []);

  return (
    <div id="email-preferences">
      <Checkbox checked={isAllowNewsLetter} onChange={toggleHandler}>
        {message}
      </Checkbox>
    </div>
  );
};
