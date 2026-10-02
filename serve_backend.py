import os
import sys

# Ensure unbuffered stdout/stderr
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(line_buffering=True)
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(line_buffering=True)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

from django.core.wsgi import get_wsgi_application
from django.contrib.staticfiles.handlers import StaticFilesHandler
import waitress

app = StaticFilesHandler(get_wsgi_application())

print("Sanctuary OS Backend Server listening on http://127.0.0.1:8000 (Waitress)")
sys.stdout.flush()

waitress.serve(app, host='127.0.0.1', port=8000, threads=8)
