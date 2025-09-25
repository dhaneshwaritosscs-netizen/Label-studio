from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0012_remove_rolepermission_unique_role_permission_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='created_by',
            field=models.ForeignKey(
                related_name='created_users',
                on_delete=django.db.models.deletion.SET_NULL,
                to='users.user',
                null=True,
                blank=True,
            ),
        ),
    ]


