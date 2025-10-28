from fastapi import APIRouter, Depends, HTTPException
from app.utils.security import get_current_user, verify_password, hash_password
from app.services.storage import StorageService
from bson import ObjectId
from pydantic import BaseModel, EmailStr
import secrets


router = APIRouter()
storage = StorageService()


class UserUpdate(BaseModel):
  first_name: str | None = None
  last_name: str | None = None
  email: EmailStr | None = None

class PreferencesUpdate(BaseModel):
  language: str | None = None
  theme: str | None = None
  ai_model: str | None = None
  auto_generate_tags: bool | None = None

class IntegrationToggle(BaseModel):
  provider: str
  enabled: bool

class IntegrationConfig(BaseModel):
  provider: str
  settings: dict

class Webhook(BaseModel):
  id: str | None = None
  url: str
  enabled: bool = True
  events: list[str] = []

class PasswordUpdate(BaseModel):
  current_password: str
  new_password: str

@router.get('/me')
async def me(user=Depends(get_current_user)):
  return user


@router.get('/me/articles')
async def my_articles(user=Depends(get_current_user)):
  cursor = storage.db.articles.find({ 'owner_id': user['id'] })
  items = []
  async for doc in cursor:
    items.append({ 'id': str(doc['_id']), 'title': doc.get('title',''), 'content': doc.get('content',''), 'tags': doc.get('tags', []) })
  return items


@router.put('/me')
async def update_me(payload: UserUpdate, user=Depends(get_current_user)):
  update_doc = { k:v for k,v in payload.model_dump(exclude_none=True).items() }
  if not update_doc:
    return { 'updated': False }
  # Prevent duplicate email
  if 'email' in update_doc:
    existing = await storage.db.users.find_one({ 'email': update_doc['email'], '_id': { '$ne': ObjectId(user['id']) } })
    if existing:
      raise HTTPException(status_code=400, detail='Email already in use')
  result = await storage.db.users.update_one({ '_id': ObjectId(user['id']) }, { '$set': update_doc })
  return { 'updated': result.modified_count > 0 }


@router.get('/me/preferences')
async def get_preferences(user=Depends(get_current_user)):
  doc = await storage.db.users.find_one({ '_id': ObjectId(user['id']) })
  prefs = (doc or {}).get('preferences', {})
  # Defaults to match UI
  return {
    'language': prefs.get('language', 'English'),
    'theme': prefs.get('theme', 'Light'),
    'ai_model': prefs.get('ai_model', 'GPT-4 (Recommended)'),
    'auto_generate_tags': prefs.get('auto_generate_tags', True)
  }


@router.put('/me/preferences')
async def update_preferences(payload: PreferencesUpdate, user=Depends(get_current_user)):
  update_doc = { k:v for k,v in payload.model_dump(exclude_none=True).items() }
  if not update_doc:
    return { 'updated': False }
  result = await storage.db.users.update_one(
    { '_id': ObjectId(user['id']) },
    { '$set': { **{ f'preferences.{k}': v for k,v in update_doc.items() } } }
  )
  return { 'updated': result.modified_count > 0 }


# API keys
@router.get('/me/api-keys')
async def list_api_keys(user=Depends(get_current_user)):
  doc = await storage.db.users.find_one({ '_id': ObjectId(user['id']) })
  keys = (doc or {}).get('api_keys', [])
  return keys


@router.post('/me/api-keys')
async def create_api_key(user=Depends(get_current_user)):
  key = 'ib_' + secrets.token_urlsafe(24)
  entry = { 'id': str(ObjectId()), 'key': key, 'created_at': __import__('datetime').datetime.utcnow().isoformat(), 'label': 'default' }
  await storage.db.users.update_one({ '_id': ObjectId(user['id']) }, { '$push': { 'api_keys': entry } })
  return entry


@router.delete('/me/api-keys/{key_id}')
async def delete_api_key(key_id: str, user=Depends(get_current_user)):
  result = await storage.db.users.update_one({ '_id': ObjectId(user['id']) }, { '$pull': { 'api_keys': { 'id': key_id } } })
  return { 'deleted': result.modified_count > 0 }


# Webhooks
@router.get('/me/webhooks')
async def list_webhooks(user=Depends(get_current_user)):
  doc = await storage.db.users.find_one({ '_id': ObjectId(user['id']) })
  return (doc or {}).get('webhooks', [])


@router.post('/me/webhooks')
async def add_webhook(payload: Webhook, user=Depends(get_current_user)):
  entry = { 'id': str(ObjectId()), 'url': payload.url, 'enabled': payload.enabled, 'events': payload.events }
  await storage.db.users.update_one({ '_id': ObjectId(user['id']) }, { '$push': { 'webhooks': entry } })
  return entry


@router.put('/me/webhooks/{webhook_id}')
async def update_webhook(webhook_id: str, payload: Webhook, user=Depends(get_current_user)):
  update_doc = { k:v for k,v in payload.model_dump(exclude_none=True).items() if k != 'id' }
  await storage.db.users.update_one({ '_id': ObjectId(user['id']), 'webhooks.id': webhook_id }, { '$set': { **{ f'webhooks.$.{k}': v for k,v in update_doc.items() } } })
  return { 'updated': True }


@router.delete('/me/webhooks/{webhook_id}')
async def delete_webhook(webhook_id: str, user=Depends(get_current_user)):
  result = await storage.db.users.update_one({ '_id': ObjectId(user['id']) }, { '$pull': { 'webhooks': { 'id': webhook_id } } })
  return { 'deleted': result.modified_count > 0 }


# Security
@router.post('/me/change-password')
async def change_password(payload: PasswordUpdate, user=Depends(get_current_user)):
  doc = await storage.db.users.find_one({ '_id': ObjectId(user['id']) })
  if not doc or not verify_password(payload.current_password, doc.get('password_hash','')):
    raise HTTPException(status_code=400, detail='Current password is incorrect')
  new_hash = hash_password(payload.new_password)
  await storage.db.users.update_one({ '_id': ObjectId(user['id']) }, { '$set': { 'password_hash': new_hash } })
  return { 'updated': True }


@router.get('/me/2fa')
async def get_2fa(user=Depends(get_current_user)):
  doc = await storage.db.users.find_one({ '_id': ObjectId(user['id']) })
  return { 'enabled': bool((doc or {}).get('two_factor_enabled', False)) }


@router.post('/me/2fa')
async def set_2fa(enabled: bool, user=Depends(get_current_user)):
  await storage.db.users.update_one({ '_id': ObjectId(user['id']) }, { '$set': { 'two_factor_enabled': enabled } })
  return { 'enabled': enabled }


# Notifications
@router.get('/me/notifications')
async def get_notifications(user=Depends(get_current_user)):
  doc = await storage.db.users.find_one({ '_id': ObjectId(user['id']) })
  notif = (doc or {}).get('notifications', {})
  defaults = {
    'email': True,
    'push': True,
    'types': {
      'processing_complete': True,
      'weekly_report': True,
      'feature_updates': False,
      'api_usage_alerts': False
    }
  }
  # merge defaults
  defaults['email'] = notif.get('email', defaults['email'])
  defaults['push'] = notif.get('push', defaults['push'])
  defaults['types'].update(notif.get('types', {}))
  return defaults


@router.put('/me/notifications')
async def update_notifications(payload: dict, user=Depends(get_current_user)):
  # trust shape: { email: bool, push: bool, types: { ... } }
  await storage.db.users.update_one({ '_id': ObjectId(user['id']) }, { '$set': { 'notifications': payload } })
  return { 'updated': True }


@router.delete('/me')
async def delete_me(user=Depends(get_current_user)):
  # delete user-owned articles and related data
  await storage.db.articles.delete_many({ 'owner_id': user['id'] })
  await storage.db.feedback.delete_many({ 'user_id': user['id'] })
  result = await storage.db.users.delete_one({ '_id': ObjectId(user['id']) })
  return { 'deleted': result.deleted_count > 0 }


@router.get('/me/integrations')
async def get_integrations(user=Depends(get_current_user)):
  doc = await storage.db.users.find_one({ '_id': ObjectId(user['id']) })
  ints = (doc or {}).get('integrations', {})
  default = {
    'google_drive': {'enabled': False},
    'onedrive': {'enabled': False},
    'dropbox': {'enabled': False},
    'office365': {'enabled': False},
    'slack': {'enabled': False},
    'teams': {'enabled': False}
  }
  default.update(ints)
  return default


@router.put('/me/integrations/toggle')
async def toggle_integration(payload: IntegrationToggle, user=Depends(get_current_user)):
  key = f'integrations.{payload.provider}.enabled'
  result = await storage.db.users.update_one({ '_id': ObjectId(user['id']) }, { '$set': { key: payload.enabled } })
  return { 'updated': result.modified_count > 0 }


@router.post('/me/integrations/config')
async def configure_integration(payload: IntegrationConfig, user=Depends(get_current_user)):
  key = f'integrations.{payload.provider}.settings'
  result = await storage.db.users.update_one({ '_id': ObjectId(user['id']) }, { '$set': { key: payload.settings } })
  return { 'updated': result.modified_count > 0 }


