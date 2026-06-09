from django.db import migrations

def enable_rls(apps, schema_editor):
    if schema_editor.connection.vendor == 'postgresql':
        with schema_editor.connection.cursor() as cursor:
            cursor.execute("""
            DO $$ 
            DECLARE 
              t record;
            BEGIN 
              FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
              LOOP 
                EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t.tablename); 
              END LOOP; 
            END $$;
            """)

def disable_rls(apps, schema_editor):
    if schema_editor.connection.vendor == 'postgresql':
        with schema_editor.connection.cursor() as cursor:
            cursor.execute("""
            DO $$ 
            DECLARE 
              t record;
            BEGIN 
              FOR t IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
              LOOP 
                EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY;', t.tablename); 
              END LOOP; 
            END $$;
            """)

class Migration(migrations.Migration):

    dependencies = [
        ('main', '0015_searchembedding'),
    ]

    operations = [
        migrations.RunPython(enable_rls, disable_rls),
    ]
