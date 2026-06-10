import os
import sys
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "dnz52_site.settings")
django.setup()

from main import ai
for chunk in ai.answer_question_stream("Є у вас гурток англ мови?", "", []):
    print(repr(chunk))
