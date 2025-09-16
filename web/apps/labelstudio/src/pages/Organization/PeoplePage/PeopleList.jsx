import { formatDistance } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { Userpic } from "@humansignal/ui";
import { Pagination } from "../../../components";
import { usePage, usePageSize } from "../../../components/Pagination/Pagination";
import { useAPI } from "../../../providers/ApiProvider";
import { Block, Elem } from "../../../utils/bem";
import { isDefined } from "../../../utils/helpers";
import "./PeopleList.scss";
import { CopyableTooltip } from "../../../components/CopyableTooltip/CopyableTooltip";

export const PeopleList = ({ onSelect, selectedUser, defaultSelected }) => {
  const api = useAPI();
  const [usersList, setUsersList] = useState();
  const [currentPage] = usePage("page", 1);
  const [currentPageSize] = usePageSize("page_size", 30);
  const [totalItems, setTotalItems] = useState(0);

  console.log({ currentPage, currentPageSize });

  const fetchUsers = useCallback(async (page, pageSize) => {
    const response = await api.callApi("memberships", {
      params: {
        pk: 1,
        contributed_to_projects: 1,
        page,
        page_size: pageSize,
      },
    });

    if (response.results) {
      setUsersList(response.results);
      setTotalItems(response.count);
    }
  }, []);

  const selectUser = useCallback(
    (user) => {
      if (selectedUser?.id === user.id) {
        onSelect?.(null);
      } else {
        onSelect?.(user);
      }
    },
    [selectedUser],
  );

  useEffect(() => {
    fetchUsers(currentPage, currentPageSize);
  }, []);

  useEffect(() => {
    if (isDefined(defaultSelected) && usersList) {
      const selected = usersList.find(({ user }) => user.id === Number(defaultSelected));

      if (selected) selectUser(selected.user);
    }
  }, [usersList, defaultSelected]);

  return (
    <>
      <Block name="people-list">
        <Elem name="wrapper">
          {usersList ? (
            <Elem name="users">
              <Elem name="header">
                <Elem name="title">People</Elem>
                <Elem name="search-container">
                  <Elem name="search-input" placeholder="Search People..." />
                </Elem>
                <Elem name="filters">
                  <Elem name="filter-button">Filter</Elem>
                  <Elem name="filter-button">Cersvafile</Elem>
                </Elem>
              </Elem>
              <Elem name="user-cards">
                {usersList.map(({ user }) => {
                  const active = user.id === selectedUser?.id;

                  return (
                    <Elem key={`user-${user.id}`} name="user-card" mod={{ active }} onClick={() => selectUser(user)}>
                      <Elem name="user-info">
                        <Elem name="avatar">
                          <CopyableTooltip title={`User ID: ${user.id}`} textForCopy={user.id}>
                            <Userpic user={user} style={{ width: 40, height: 40 }} />
                          </CopyableTooltip>
                        </Elem>
                        <Elem name="details">
                          <Elem name="email">{user.email}</Elem>
                          <Elem name="activity">
                            {formatDistance(new Date(user.last_activity), new Date(), { addSuffix: true })}
                            <Elem name="status-dot" />
                          </Elem>
                        </Elem>
                      </Elem>
                      {active && (
                        <Elem name="view-profile-button">View Profile</Elem>
                      )}
                    </Elem>
                  );
                })}
              </Elem>
            </Elem>
          ) : (
            <Elem name="loading">
            </Elem>
          )}
        </Elem>
        <Pagination
          page={currentPage}
          urlParamName="page"
          totalItems={totalItems}
          pageSize={currentPageSize}
          pageSizeOptions={[30, 50, 100]}
          onPageLoad={fetchUsers}
          style={{ paddingTop: 16 }}
        />
      </Block>
    </>
  );
};
