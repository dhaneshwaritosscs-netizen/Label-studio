# Role Assignment System

This document describes the Role Assignment System implemented for Label Studio, which allows administrators to assign roles to users by email address.

## Overview

The Role Assignment System provides a comprehensive solution for managing user roles and permissions in Label Studio. It includes:

- **Role Management**: Create and manage different roles with specific permissions
- **User Role Assignment**: Assign roles to users by email address
- **Assignment Tracking**: Log all role assignment activities
- **Email Notifications**: Send notifications when roles are assigned
- **API Endpoints**: RESTful API for frontend integration

## Components

### 1. Models (`role_models.py`)

#### Role
- Represents a role that can be assigned to users
- Fields: `name`, `display_name`, `description`, `role_type`, `is_active`
- Supports system, custom, and project roles

#### UserRoleAssignment
- Links users to roles
- Tracks assignment metadata (who assigned, when, etc.)
- Supports role revocation and reactivation

#### RolePermission
- Defines specific permissions for each role
- Supports different permission types (read, write, delete, admin)

#### RoleAssignmentLog
- Logs all role assignment activities
- Tracks IP address and user agent for audit purposes

### 2. API Views (`role_assignment_api.py`)

#### RoleAssignmentAPIView
- **POST** `/api/role-assignment/`
- Assigns roles to users by email
- Creates new users if they don't exist
- Sends email notifications

#### RoleAssignmentViewSet
- **GET** `/api/assignments/by-email/?email=user@example.com`
- **GET** `/api/assignments/available-roles/`
- **POST** `/api/assignments/{id}/revoke/`

### 3. Serializers (`role_serializers.py`)

- `RoleAssignmentRequestSerializer`: Validates role assignment requests
- `RoleAssignmentResponseSerializer`: Formats API responses
- `UserRoleAssignmentSerializer`: Manages role assignment data
- `BulkRoleAssignmentSerializer`: Supports bulk operations

### 4. URL Configuration (`role_urls.py`)

Defines all API endpoints for role management:
- `/api/role-assignment/` - Main assignment endpoint
- `/api/roles/` - Role management
- `/api/assignments/` - Assignment management

## API Usage

### Assign Roles to User

```bash
POST /api/role-assignment/
Content-Type: application/json
Authorization: Token <your-token>

{
    "email": "user@example.com",
    "selected_roles": ["labeling-interface", "annotation", "model"]
}
```

**Response:**
```json
{
    "success": true,
    "message": "Successfully assigned 3 role(s) to user@example.com",
    "user": {
        "id": "uuid",
        "email": "user@example.com",
        "username": "user",
        "user_exists": false
    },
    "assigned_roles": [
        {
            "id": "uuid",
            "name": "labeling-interface",
            "display_name": "Labeling Interface"
        }
    ]
}
```

### Get Available Roles

```bash
GET /api/assignments/available-roles/
Authorization: Token <your-token>
```

### Get User Assignments by Email

```bash
GET /api/assignments/by-email/?email=user@example.com
Authorization: Token <your-token>
```

## Frontend Integration

The `AssignRole.jsx` component integrates with the backend API:

```javascript
const handleSubmit = async () => {
  try {
    const response = await api.callApi("role-assignment", {}, {
      email: email.trim(),
      selected_roles: selectedOptions
    });

    if (response.success) {
      setSuccess(true);
      setEmail("");
      setSelectedOptions([]);
    }
  } catch (err) {
    setError(err.message);
  }
};
```

## Default Roles

The system includes these default roles:

1. **labeling-interface**: Access to labeling tools and interface
2. **annotation**: Create and manage annotations
3. **model**: Access to ML models and predictions
4. **predictions**: View and manage model predictions
5. **cloud-storage**: Access to cloud storage settings
6. **webhooks**: Configure and manage webhooks
7. **danger-zone**: Critical system settings and operations

## Email Notifications

When roles are assigned, the system automatically sends email notifications:

- **New Users**: Welcome email with account creation and role assignment details
- **Existing Users**: Notification about new role assignments

## Database Migration

To set up the role assignment system, run:

```bash
python manage.py makemigrations users
python manage.py migrate
```

## Security Considerations

1. **Authentication Required**: All API endpoints require authentication
2. **Permission Checks**: Only authenticated users can assign roles
3. **Input Validation**: All inputs are validated and sanitized
4. **Audit Logging**: All role assignments are logged with IP and user agent
5. **Email Verification**: Email addresses are validated before processing

## Testing

Run the test suite:

```bash
python manage.py test users.tests.test_role_assignment_api
```

## Error Handling

The API provides comprehensive error handling:

- **400 Bad Request**: Invalid input data
- **401 Unauthorized**: Missing or invalid authentication
- **404 Not Found**: User or role not found
- **500 Internal Server Error**: Server-side errors

## Future Enhancements

1. **Bulk Role Assignment**: Assign roles to multiple users at once
2. **Role Templates**: Predefined role sets for common use cases
3. **Time-based Assignments**: Roles with expiration dates
4. **Advanced Permissions**: Granular permission system
5. **Role Hierarchy**: Parent-child role relationships
