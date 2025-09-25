# Database Connection Structure - Label Studio

## Overview
Your Label Studio project is located on **D Drive** (`D:\newlabel\label-studio (6)\label-studio\label-studio\label_studio`) but the database is stored on **C Drive** (`C:\Users\toss7\AppData\Local\label-studio\label-studio\label_studio.sqlite3`).

## Database Location Structure

```
C:\Users\toss7\AppData\Local\label-studio\label-studio\
├── label_studio.sqlite3          # Main SQLite database file
├── media\                        # User uploaded files
├── export\                       # Project exports
├── test_data\                    # Test data
└── .env                          # Environment configuration
```

## How Database Path is Determined

### 1. Configuration Flow
```
Project Startup → Settings Loading → Database Path Resolution
```

### 2. Key Configuration Files

#### `label_studio/core/settings/base.py`
```python
# Line 135-151: Database path configuration
BASE_DATA_DIR = get_env('BASE_DATA_DIR')
if BASE_DATA_DIR is None:
    BASE_DATA_DIR = get_data_dir()  # Uses appdirs library

DATABASE_NAME_DEFAULT = os.path.join(BASE_DATA_DIR, 'label_studio.sqlite3')
DATABASE_NAME = get_env('DATABASE_NAME', DATABASE_NAME_DEFAULT)

DATABASES_ALL = {
    'sqlite': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': DATABASE_NAME,  # Points to C:\Users\toss7\AppData\Local\label-studio\label-studio\label_studio.sqlite3
    }
}
```

#### `label_studio/core/utils/io.py`
```python
# Line 87-90: get_data_dir function
def get_data_dir():
    data_dir = user_data_dir(appname='label-studio')  # Uses appdirs library
    os.makedirs(data_dir, exist_ok=True)
    return data_dir
```

### 3. Appdirs Library
The `appdirs` library automatically determines the appropriate data directory based on the operating system:

- **Windows**: `C:\Users\{username}\AppData\Local\{appname}\`
- **macOS**: `~/Library/Application Support/{appname}/`
- **Linux**: `~/.local/share/{appname}/`

## User Existence Check Process

### 1. Login Flow
```
User Login Request → LoginForm.clean() → User Authentication → Database Query
```

### 2. Key Files for User Checking

#### `label_studio/users/forms.py` (LoginForm)
```python
def clean(self, *args, **kwargs):
    cleaned = super(LoginForm, self).clean()
    email = cleaned.get('email', '').lower()
    password = cleaned.get('password', '')
    
    # Advanced authentication (if configured)
    user = settings.USER_AUTH(User, email, password)
    
    # Regular Django authentication
    if user is None:
        user = auth.authenticate(email=email, password=password)
    
    if user and user.is_active:
        return {'user': user, 'persist_session': persist_session}
    else:
        raise forms.ValidationError(INVALID_USER_ERROR)
```

#### `label_studio/users/models.py` (User Model)
```python
class UserManager(BaseUserManager):
    def _create_user(self, email, password, **extra_fields):
        if not email:
            raise ValueError('Must specify an email address')
        
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)  # Saves to SQLite database
        return user
```

### 3. Database Query Process
When checking if a user exists, Django performs these steps:

1. **Email Normalization**: Converts email to lowercase
2. **Database Query**: `SELECT * FROM htx_user WHERE email = ?`
3. **Password Verification**: Uses Django's password hashing
4. **User Validation**: Checks if user is active

## Database Tables Structure

### Main User Table: `htx_user`
```sql
CREATE TABLE htx_user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    password VARCHAR(128) NOT NULL,
    last_login DATETIME,
    is_superuser BOOLEAN DEFAULT 0,
    username VARCHAR(256) NOT NULL,
    email VARCHAR(254) UNIQUE,           -- Primary field for user identification
    first_name VARCHAR(256),
    last_name VARCHAR(256),
    phone VARCHAR(256),
    avatar VARCHAR(100),
    is_staff BOOLEAN DEFAULT 0,
    is_active BOOLEAN DEFAULT 1,         -- User account status
    date_joined DATETIME DEFAULT CURRENT_TIMESTAMP,
    activity_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    active_organization_id INTEGER REFERENCES organizations_organization(id),
    allow_newsletters BOOLEAN
);
```

## How Project Connects to C Drive Database

### 1. Environment Variables
The project can be configured to use a different database path:

```bash
# Set custom database path
export BASE_DATA_DIR="D:\my-custom-path"
export DATABASE_NAME="D:\my-custom-path\my-database.sqlite3"
```

### 2. Configuration Priority
1. **Environment Variable**: `DATABASE_NAME` (highest priority)
2. **Default Path**: `BASE_DATA_DIR/label_studio.sqlite3`
3. **Appdirs Default**: `C:\Users\{username}\AppData\Local\label-studio\label-studio\`

### 3. Database Connection Code
```python
# In Django settings
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': 'C:\\Users\\toss7\\AppData\\Local\\label-studio\\label-studio\\label_studio.sqlite3',
        'OPTIONS': {
            'timeout': 20,
        },
    }
}
```

## User Authentication Flow

### 1. Login Process
```
1. User submits login form
2. LoginForm.clean() validates input
3. Django queries: SELECT * FROM htx_user WHERE email = ?
4. Password verification using Django's hashing
5. Session creation if successful
6. Redirect to dashboard
```

### 2. Signup Process
```
1. User submits signup form
2. UserSignupForm.clean() validates input
3. User.objects.create_user() creates new user
4. User saved to SQLite database
5. Organization assignment
6. Email notification sent
```

## Key Points

1. **Cross-Drive Connection**: Project on D drive connects to database on C drive via absolute path
2. **Automatic Path Resolution**: Uses `appdirs` library for OS-appropriate data directory
3. **Environment Override**: Can be customized via environment variables
4. **SQLite Database**: Single file database (`label_studio.sqlite3`)
5. **User Identification**: Primarily by email address (unique field)
6. **Password Security**: Uses Django's built-in password hashing

## Files Involved in Database Connection

1. **`label_studio/core/settings/base.py`** - Database configuration
2. **`label_studio/core/utils/io.py`** - Data directory resolution
3. **`label_studio/users/models.py`** - User model and manager
4. **`label_studio/users/forms.py`** - Authentication forms
5. **`label_studio/users/views.py`** - Login/signup views
6. **`label_studio/users/migrations/`** - Database schema

## To Change Database Location

If you want to move the database to D drive:

1. **Set Environment Variable**:
   ```bash
   export BASE_DATA_DIR="D:\newlabel\label-studio (6)\label-studio\label-studio\data"
   ```

2. **Or Set Database Path Directly**:
   ```bash
   export DATABASE_NAME="D:\newlabel\label-studio (6)\label-studio\label-studio\data\label_studio.sqlite3"
   ```

3. **Restart the application** for changes to take effect.
