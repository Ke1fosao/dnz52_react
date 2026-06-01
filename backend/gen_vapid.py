"""
Генерує VAPID-ключі для web-push.
Запуск:  .venv\\Scripts\\python.exe gen_vapid.py

Виводить два ключі:
  VAPID_PRIVATE_KEY → у backend/.env
  VAPID_PUBLIC_KEY  → у backend/.env І у frontend/.env (VITE_VAPID_PUBLIC_KEY)
"""
import base64
from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives import serialization


def b64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('ascii')


# Генеруємо EC P-256 ключ
private_key = ec.generate_private_key(ec.SECP256R1())

# Приватний ключ → base64url від raw 32 байтів (формат для py_vapid/pywebpush)
private_value = private_key.private_numbers().private_value
private_bytes = private_value.to_bytes(32, 'big')
vapid_private = b64url(private_bytes)

# Публічний ключ → uncompressed point (65 байтів: 0x04 + X + Y) base64url
public_key = private_key.public_key()
public_bytes = public_key.public_bytes(
    encoding=serialization.Encoding.X962,
    format=serialization.PublicFormat.UncompressedPoint,
)
vapid_public = b64url(public_bytes)

print('=' * 70)
print('VAPID ключі згенеровано! Додайте у відповідні .env файли:')
print('=' * 70)
print()
print('# backend/.env:')
print(f'VAPID_PRIVATE_KEY={vapid_private}')
print(f'VAPID_PUBLIC_KEY={vapid_public}')
print('VAPID_ADMIN_EMAIL=admin@dnz52.rv.ua')
print()
print('# frontend/.env (і frontend/.env.example):')
print(f'VITE_VAPID_PUBLIC_KEY={vapid_public}')
print()
print('=' * 70)
print('УВАГА: приватний ключ — секрет! Не комітьте у git.')
print('=' * 70)
