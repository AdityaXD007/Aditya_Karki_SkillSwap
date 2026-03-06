from django.apps import AppConfig


class LearningConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'learning'

    def ready(self):
        import os
        from django.conf import settings
        from . import scheduler

        # Guard to prevent the scheduler from running twice in development
        if not settings.DEBUG or os.environ.get('RUN_MAIN'):
            scheduler.start()
            print("Session Expiry Scheduler initialized automatically.")
