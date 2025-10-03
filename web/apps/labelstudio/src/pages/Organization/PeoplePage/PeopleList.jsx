import { formatDistance } from "date-fns";
import { useCallback, useEffect, useState } from "react";
import { Userpic } from "@humansignal/ui";
import { Pagination } from "../../../components";
import { usePage, usePageSize } from "../../../components/Pagination/Pagination";
import { useAPI } from "../../../providers/ApiProvider";
import { useCurrentUser } from "../../../providers/CurrentUser";
import { useUserRoles } from "../../../hooks/useUserRoles";
import { Block, Elem } from "../../../utils/bem";
import { isDefined } from "../../../utils/helpers";
import "./PeopleList.scss";
import { CopyableTooltip } from "../../../components/CopyableTooltip/CopyableTooltip";

export const PeopleList = ({ onSelect, selectedUser, defaultSelected }) => {
  const api = useAPI();
  const { user } = useCurrentUser();
  const { hasRole } = useUserRoles();
  const [usersList, setUsersList] = useState();
  const [currentPage] = usePage("page", 1);
  const [currentPageSize] = usePageSize("page_size", 100);
  const [totalItems, setTotalItems] = useState(0);

  // Determine user role
  const isAdmin = hasRole('admin') || user?.email === 'dhaneshwari.tosscss@gmail.com';
  const isClient = hasRole('client') || user?.email === 'dhaneshwari.ttosscss@gmail.com';

  console.log('DEBUG: Current user:', user?.email);
  console.log('DEBUG: isAdmin:', isAdmin);
  console.log('DEBUG: isClient:', isClient);
  console.log('DEBUG: hasRole("admin"):', hasRole('admin'));
  console.log('DEBUG: hasRole("client"):', hasRole('client'));
  console.log({ currentPage, currentPageSize });

  const fetchUsers = useCallback(async (page, pageSize) => {
    const response = await api.callApi("memberships", {
      params: {
        pk: 1,
        contributed_to_projects: 1,
        page,
        page_size: pageSize,
      },
      include: [
        "id",
        "email", 
        "first_name",
        "last_name",
        "username",
        "created_by",
        "is_active"
      ],
    });

    if (response.results) {
      let filteredResults = response.results;
      
      console.log('DEBUG: Total users fetched:', response.results.length);
      console.log('DEBUG: Current user ID:', user?.id);
      
      // Filter users based on role
      if (isClient) {
        console.log('DEBUG: Filtering for client user');
        // Client sees users they created (including themselves)
        filteredResults = response.results.filter(({ user: userData }) => {
          const isCreatedByClient = userData.created_by === user?.id;
          const isClientSelf = userData.id === user?.id;
          console.log(`DEBUG: User ${userData.email}: created_by=${userData.created_by}, current_user_id=${user?.id}, isCreatedByClient=${isCreatedByClient}, isClientSelf=${isClientSelf}`);
          return isCreatedByClient || isClientSelf;
        });
        console.log('DEBUG: Filtered users count:', filteredResults.length);
      } else {
        console.log('DEBUG: Admin user - showing all users');
      }
      // Admin sees all users (no additional filtering needed)
      
      setUsersList(filteredResults);
      setTotalItems(filteredResults.length);
    }
  }, [isClient, user?.id]);

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
  }, [fetchUsers, currentPage, currentPageSize]);

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
          pageSizeOptions={[100, 200, 500]}
          onPageLoad={fetchUsers}
          style={{ paddingTop: 16 }}
        />
      </Block>
    </>
  );
};
