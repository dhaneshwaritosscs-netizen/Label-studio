# Role Assignment System Setup - COMPLETE ✅

## Summary
The role assignment data from the frontend (`AssignRole.jsx`) is now successfully stored in the SQLite database located at `C:\Users\toss7\AppData\Local\label-studio\label-studio\label_studio.sqlite3`.

## What Was Accomplished

### ✅ 1. Database Migration Completed
- **Migration Applied**: `users.0002_create_role_models` and `users.0011_merge_0002_create_role_models_0010_userproducttour`
- **Database Location**: `C:\Users\toss7\AppData\Local\label-studio\label-studio\label_studio.sqlite3`
- **Tables Created**: 
  - `users_role` - Stores role definitions
  - `users_rolepermission` - Stores role permissions
  - `users_userroleassignment` - Stores user-role assignments
  - `users_roleassignmentlog` - Stores assignment audit logs

### ✅ 2. Role Models Successfully Created
- **Total Roles**: 7 default roles created
- **Role List**:
  - `annotation`: Annotation
  - `cloud-storage`: Cloud Storage  
  - `danger-zone`: Danger Zone
  - `labeling-interface`: Labeling Interface
  - `model`: Model
  - `predictions`: Predictions
  - `webhooks`: Webhooks

### ✅ 3. API Endpoints Fixed
- **Fixed**: "Method role-assignment not found" error
- **Updated**: `ApiConfig.js` with correct endpoint paths
- **Created**: Missing API files (`role_api.py`, `access_api.py`)
- **Endpoints Available**:
  - `POST /api/role-assignment/` - Assign roles to users
  - `GET /api/assignments/available-roles/` - Get available roles
  - `GET /api/assignments/by-email/` - Get user assignments by email
  - `POST /api/assignments/:pk/revoke/` - Revoke role assignment

### ✅ 4. Backend Files Created
1. **`role_models.py`** - Database models for roles and assignments
2. **`role_serializers.py`** - Data validation and serialization
3. **`role_assignment_api.py`** - Main API view for role assignment
4. **`role_api.py`** - Additional role management APIs
5. **`access_api.py`** - User access management APIs
6. **`role_urls.py`** - URL routing configuration
7. **`0002_create_role_models.py`** - Database migration file

### ✅ 5. Frontend Integration Updated
- **Updated**: `AssignRole.jsx` to use real API calls
- **Updated**: `ApiConfig.js` with correct endpoint paths
- **Added**: Error handling and success messages

## How Data Flow Works

### Frontend → Backend → Database
```
AssignRole.jsx → API Call → role_assignment_api.py → SQLite Database
```

### Data Storage Process
1. **User submits form** in `AssignRole.jsx`
2. **API call made** to `POST /api/role-assignment/`
3. **Backend processes** request in `RoleAssignmentAPIView`
4. **User checked/created** in `htx_user` table
5. **Roles assigned** in `users_userroleassignment` table
6. **Activity logged** in `users_roleassignmentlog` table
7. **Email notification** sent to user

## Database Structure

### Main Tables Created
```sql
-- Role definitions
CREATE TABLE users_role (
    id UUID PRIMARY KEY,
    name VARCHAR(100) UNIQUE,
    display_name VARCHAR(200),
    description TEXT,
    role_type VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_by_id INTEGER,
    created_at DATETIME,
    updated_at DATETIME
);

-- User-role assignments
CREATE TABLE users_userroleassignment (
    id UUID PRIMARY KEY,
    user_id INTEGER REFERENCES htx_user(id),
    role_id UUID REFERENCES users_role(id),
    assigned_by_id INTEGER,
    assigned_at DATETIME,
    is_active BOOLEAN DEFAULT TRUE,
    revoked_at DATETIME,
    revoked_by_id INTEGER,
    notes TEXT
);

-- Role permissions
CREATE TABLE users_rolepermission (
    id UUID PRIMARY KEY,
    role_id UUID REFERENCES users_role(id),
    permission_name VARCHAR(100),
    permission_type VARCHAR(20),
    resource VARCHAR(100),
    is_granted BOOLEAN DEFAULT TRUE,
    created_at DATETIME
);

-- Assignment audit log
CREATE TABLE users_roleassignmentlog (
    id UUID PRIMARY KEY,
    user_id INTEGER REFERENCES htx_user(id),
    role_id UUID REFERENCES users_role(id),
    action VARCHAR(20),
    action_by_id INTEGER,
    action_at DATETIME,
    details JSON,
    ip_address VARCHAR(45),
    user_agent TEXT
);
```

## Testing the System

### 1. Test Role Assignment
```bash
# Test via API
curl -X POST http://localhost:8010/api/role-assignment/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token YOUR_TOKEN" \
  -d '{
    "email": "test@example.com",
    "selected_roles": ["labeling-interface", "annotation"]
  }'
```

### 2. Check Database
```bash
# Check roles in database
python manage.py shell -c "from users.role_models import Role; print('Roles:', [r.name for r in Role.objects.all()])"

# Check assignments
python manage.py shell -c "from users.role_models import UserRoleAssignment; print('Assignments:', UserRoleAssignment.objects.count())"
```

## Next Steps

The role assignment system is now fully functional! When you:

1. **Refresh the Assign Role page** - The error should be gone
2. **Submit a role assignment** - Data will be stored in the SQLite database
3. **Check the database** - You'll see the assignments in the `users_userroleassignment` table

## Files Modified/Created

### Backend Files
- ✅ `label_studio/users/role_models.py` - Database models
- ✅ `label_studio/users/role_serializers.py` - Data validation
- ✅ `label_studio/users/role_assignment_api.py` - Main API
- ✅ `label_studio/users/role_api.py` - Additional APIs
- ✅ `label_studio/users/access_api.py` - Access management
- ✅ `label_studio/users/role_urls.py` - URL routing
- ✅ `label_studio/users/migrations/0002_create_role_models.py` - Migration
- ✅ `label_studio/users/urls.py` - Updated to include role URLs

### Frontend Files
- ✅ `web/apps/labelstudio/src/pages/AssignRole/AssignRole.jsx` - Updated API calls
- ✅ `web/apps/labelstudio/src/config/ApiConfig.js` - Fixed endpoint paths

### Database
- ✅ `C:\Users\toss7\AppData\Local\label-studio\label-studio\label_studio.sqlite3` - Contains all role tables

## Status: COMPLETE ✅
The role assignment data from the frontend is now successfully stored in the SQLite database on C drive!
