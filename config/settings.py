from pathlib import Path
BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'dummy'
DEBUG = False
ALLOWED_HOSTS = ['*']

INSTALLED_APPS = ['django.contrib.staticfiles', 'resume_analyzer_app']
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.middleware.common.CommonMiddleware',
]

ROOT_URLCONF = 'config.urls'  # 'config' = nee main project folder peru
WSGI_APPLICATION = 'config.wsgi.application'

TEMPLATES = [{
    'BACKEND': 'django.template.backends.django.DjangoTemplates',
    'DIRS': [], 'APP_DIRS': True, 'OPTIONS': {'context_processors': []},
}]

DATABASES = {'default': {'ENGINE': 'django.db.backends.dummy'}}
STATIC_URL = '/static/'
