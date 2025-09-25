# Generated manually for Role Management System

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0001_squashed_0009_auto_20210219_1237'),
    ]

    operations = [
        migrations.CreateModel(
            name='Role',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('name', models.CharField(help_text='Internal role identifier', max_length=100, unique=True)),
                ('display_name', models.CharField(help_text='Human-readable role name', max_length=200)),
                ('description', models.TextField(blank=True, help_text='Role description')),
                ('role_type', models.CharField(choices=[('system', 'System Role'), ('custom', 'Custom Role'), ('project', 'Project Role')], default='custom', max_length=20)),
                ('is_active', models.BooleanField(default=True, help_text='Whether this role is active')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('created_by', models.ForeignKey(help_text='User who created this role', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_roles', to='users.user')),
            ],
            options={
                'verbose_name': 'Role',
                'verbose_name_plural': 'Roles',
                'ordering': ['display_name'],
            },
        ),
        migrations.CreateModel(
            name='RolePermission',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('permission_name', models.CharField(help_text='Permission identifier', max_length=100)),
                ('permission_type', models.CharField(choices=[('read', 'Read'), ('write', 'Write'), ('delete', 'Delete'), ('admin', 'Admin')], default='read', max_length=20)),
                ('resource', models.CharField(blank=True, help_text='Resource this permission applies to', max_length=100)),
                ('is_granted', models.BooleanField(default=True, help_text='Whether this permission is granted')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('role', models.ForeignKey(help_text='Role this permission belongs to', on_delete=django.db.models.deletion.CASCADE, related_name='permissions', to='users.role')),
            ],
            options={
                'verbose_name': 'Role Permission',
                'verbose_name_plural': 'Role Permissions',
                'ordering': ['permission_name'],
            },
        ),
        migrations.CreateModel(
            name='UserRoleAssignment',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('assigned_at', models.DateTimeField(auto_now_add=True)),
                ('is_active', models.BooleanField(default=True, help_text='Whether this assignment is active')),
                ('revoked_at', models.DateTimeField(blank=True, null=True)),
                ('notes', models.TextField(blank=True, help_text='Additional notes about this assignment')),
                ('assigned_by', models.ForeignKey(help_text='User who assigned this role', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='assigned_roles', to='users.user')),
                ('role', models.ForeignKey(help_text='Role assigned to the user', on_delete=django.db.models.deletion.CASCADE, related_name='user_assignments', to='users.role')),
                ('revoked_by', models.ForeignKey(blank=True, help_text='User who revoked this role', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='revoked_roles', to='users.user')),
                ('user', models.ForeignKey(help_text='User this role is assigned to', on_delete=django.db.models.deletion.CASCADE, related_name='role_assignments', to='users.user')),
            ],
            options={
                'verbose_name': 'User Role Assignment',
                'verbose_name_plural': 'User Role Assignments',
                'ordering': ['-assigned_at'],
            },
        ),
        migrations.CreateModel(
            name='RoleAssignmentLog',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('action', models.CharField(choices=[('assigned', 'Assigned'), ('revoked', 'Revoked'), ('reactivated', 'Reactivated'), ('modified', 'Modified')], help_text='Type of action performed', max_length=20)),
                ('action_at', models.DateTimeField(auto_now_add=True)),
                ('details', models.JSONField(default=dict, help_text='Additional details about the action')),
                ('ip_address', models.GenericIPAddressField(blank=True, null=True)),
                ('user_agent', models.TextField(blank=True)),
                ('action_by', models.ForeignKey(help_text='User who performed this action', null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='performed_role_actions', to='users.user')),
                ('role', models.ForeignKey(help_text='Role involved in this action', on_delete=django.db.models.deletion.CASCADE, related_name='assignment_logs', to='users.role')),
                ('user', models.ForeignKey(help_text='User affected by this action', on_delete=django.db.models.deletion.CASCADE, related_name='role_assignment_logs', to='users.user')),
            ],
            options={
                'verbose_name': 'Role Assignment Log',
                'verbose_name_plural': 'Role Assignment Logs',
                'ordering': ['-action_at'],
            },
        ),
        migrations.AddConstraint(
            model_name='rolepermission',
            constraint=models.UniqueConstraint(fields=('role', 'permission_name', 'resource'), name='unique_role_permission'),
        ),
        migrations.AddConstraint(
            model_name='userroleassignment',
            constraint=models.UniqueConstraint(fields=('user', 'role'), name='unique_user_role_assignment'),
        ),
    ]
