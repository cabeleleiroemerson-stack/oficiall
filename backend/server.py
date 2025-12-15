from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from emergentintegrations.llm.chat import LlmChat, UserMessage
from pdf_processor import WatizatPDFProcessor
from auto_responses import get_auto_response, format_auto_response_post
from help_locations import HELP_LOCATIONS, get_all_help_locations, get_help_locations_by_category
import math

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

@api_router.get("/")
async def root():
    return {"message": "Watizat API - Bem-vindo!"}

security = HTTPBearer()
JWT_SECRET = os.environ.get('JWT_SECRET', 'default_secret')
ALGORITHM = "HS256"

pdf_processor = WatizatPDFProcessor()

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    display_name: Optional[str] = None
    use_display_name: bool = False
    role: str
    location: Optional[dict] = None
    bio: Optional[str] = None
    languages: List[str] = Field(default_factory=list)
    categories: List[str] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str
    languages: List[str] = Field(default_factory=list)
    professional_area: Optional[str] = None
    professional_specialties: Optional[List[str]] = Field(default_factory=list)
    availability: Optional[str] = None
    experience: Optional[str] = None
    education: Optional[str] = None
    certifications: Optional[List[str]] = Field(default_factory=list)
    professional_id: Optional[str] = None
    organization: Optional[str] = None
    years_experience: Optional[str] = None
    help_types: Optional[List[str]] = Field(default_factory=list)
    help_categories: Optional[List[str]] = Field(default_factory=list)  # Categorias de ajuda que voluntário oferece
    need_categories: Optional[List[str]] = Field(default_factory=list)  # Categorias de ajuda que migrante precisa
    phone: Optional[str] = None
    linkedin: Optional[str] = None
    location: Optional[dict] = None  # {lat: float, lng: float, address: str}
    show_location: bool = False  # Se quer mostrar localização no feed

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Post(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    type: str
    category: str
    title: str
    description: str
    location: Optional[dict] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PostCreate(BaseModel):
    type: str
    category: str
    title: str
    description: str
    location: Optional[dict] = None
    images: Optional[List[str]] = Field(default_factory=list)

class PostComment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    post_id: str
    user_id: str
    comment: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class PostCommentCreate(BaseModel):
    comment: str

class Service(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str
    description: str
    address: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[dict] = None
    hours: Optional[str] = None

class AIMessage(BaseModel):
    message: str
    language: str = "pt"

class Match(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    helper_id: str
    migrant_id: str
    status: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

def create_token(user_id: str, email: str) -> str:
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.now(timezone.utc) + timedelta(days=30)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        user_id = payload.get('user_id')
        
        user = await db.users.find_one({'id': user_id}, {'_id': 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return User(**user)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")

@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    existing = await db.users.find_one({'email': user_data.email}, {'_id': 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pw = bcrypt.hashpw(user_data.password.encode(), bcrypt.gensalt())
    
    user = User(
        email=user_data.email,
        name=user_data.name,
        role=user_data.role,
        languages=user_data.languages
    )
    
    user_dict = user.model_dump()
    user_dict['password'] = hashed_pw.decode()
    user_dict['created_at'] = user_dict['created_at'].isoformat()
    
    if user_data.role == 'volunteer':
        user_dict['professional_area'] = user_data.professional_area
        user_dict['professional_specialties'] = user_data.professional_specialties or []
        user_dict['availability'] = user_data.availability
        user_dict['experience'] = user_data.experience
        user_dict['education'] = user_data.education
        user_dict['certifications'] = user_data.certifications or []
        user_dict['professional_id'] = user_data.professional_id
        user_dict['organization'] = user_data.organization
        user_dict['years_experience'] = user_data.years_experience
        user_dict['help_types'] = user_data.help_types or []
        user_dict['help_categories'] = user_data.help_categories or []
        user_dict['phone'] = user_data.phone
        user_dict['linkedin'] = user_data.linkedin
        user_dict['location'] = user_data.location
        user_dict['show_location'] = user_data.show_location
    
    if user_data.role == 'migrant':
        user_dict['need_categories'] = user_data.need_categories or []
        user_dict['location'] = user_data.location
        user_dict['show_location'] = user_data.show_location
    
    if user_data.role == 'helper':
        user_dict['help_categories'] = user_data.help_categories or []
        user_dict['location'] = user_data.location
        user_dict['show_location'] = user_data.show_location
    
    await db.users.insert_one(user_dict)
    
    token = create_token(user.id, user.email)
    return {'token': token, 'user': user}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user_data = await db.users.find_one({'email': credentials.email}, {'_id': 0})
    
    if not user_data:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not bcrypt.checkpw(credentials.password.encode(), user_data['password'].encode()):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_data.pop('password')
    if isinstance(user_data['created_at'], str):
        user_data['created_at'] = datetime.fromisoformat(user_data['created_at'])
    
    user = User(**user_data)
    token = create_token(user.id, user.email)
    
    return {'token': token, 'user': user}

@api_router.get("/profile")
async def get_profile(current_user: User = Depends(get_current_user)):
    return current_user

@api_router.put("/profile")
async def update_profile(updates: dict, current_user: User = Depends(get_current_user)):
    allowed_fields = ['name', 'bio', 'location', 'languages', 'categories']
    update_data = {k: v for k, v in updates.items() if k in allowed_fields}
    
    await db.users.update_one({'id': current_user.id}, {'$set': update_data})
    
    updated_user = await db.users.find_one({'id': current_user.id}, {'_id': 0, 'password': 0})
    if isinstance(updated_user['created_at'], str):
        updated_user['created_at'] = datetime.fromisoformat(updated_user['created_at'])
    
    return User(**updated_user)

@api_router.post("/posts", response_model=Post)
async def create_post(post_data: PostCreate, current_user: User = Depends(get_current_user)):
    post = Post(
        user_id=current_user.id,
        type=post_data.type,
        category=post_data.category,
        title=post_data.title,
        description=post_data.description,
        location=post_data.location
    )
    
    post_dict = post.model_dump()
    post_dict['created_at'] = post_dict['created_at'].isoformat()
    post_dict['images'] = post_data.images or []
    
    await db.posts.insert_one(post_dict)
    
    if post_data.type == 'need':
        auto_response = get_auto_response(post_data.category)
        if auto_response:
            message_data = {
                'id': str(uuid.uuid4()),
                'from_user_id': 'system',
                'to_user_id': current_user.id,
                'message': f"{auto_response['title']}\n\n{auto_response['content']}",
                'created_at': datetime.now(timezone.utc).isoformat(),
                'is_auto_response': True
            }
            await db.messages.insert_one(message_data)
    
    return post

@api_router.post("/posts/{post_id}/comments")
async def add_comment(post_id: str, comment_data: PostCommentCreate, current_user: User = Depends(get_current_user)):
    comment = PostComment(
        post_id=post_id,
        user_id=current_user.id,
        comment=comment_data.comment
    )
    
    comment_dict = comment.model_dump()
    comment_dict['created_at'] = comment_dict['created_at'].isoformat()
    
    await db.comments.insert_one(comment_dict)
    return comment

@api_router.get("/posts/{post_id}/comments")
async def get_comments(post_id: str):
    comments = await db.comments.find({'post_id': post_id}, {'_id': 0}).sort('created_at', 1).to_list(1000)
    
    for comment in comments:
        if isinstance(comment['created_at'], str):
            comment['created_at'] = datetime.fromisoformat(comment['created_at'])
        
        user = await db.users.find_one({'id': comment['user_id']}, {'_id': 0, 'password': 0, 'email': 0})
        if user:
            comment['user'] = {'name': user['name'], 'role': user['role']}
    
    return comments

@api_router.get("/posts")
async def get_posts(type: Optional[str] = None, category: Optional[str] = None, current_user: User = Depends(get_current_user)):
    query = {}
    if type:
        query['type'] = type
    if category:
        query['category'] = category
    
    posts = await db.posts.find(query, {'_id': 0}).sort('created_at', -1).to_list(100)
    
    # Se o usuário é voluntário, filtrar posts baseado nas categorias que ele pode ajudar
    user_data = await db.users.find_one({'id': current_user.id}, {'_id': 0})
    user_help_categories = user_data.get('help_categories', []) if user_data else []
    
    filtered_posts = []
    for post in posts:
        if isinstance(post['created_at'], str):
            post['created_at'] = datetime.fromisoformat(post['created_at'])
        
        if post['user_id'] == 'system':
            post['user'] = {'name': 'Watizat Assistant', 'role': 'assistant'}
        else:
            user = await db.users.find_one({'id': post['user_id']}, {'_id': 0, 'password': 0, 'email': 0})
            if user:
                display_name = user.get('display_name') if user.get('use_display_name') else user['name']
                post['user'] = {'name': display_name, 'role': user['role']}
        
        # Se é voluntário ou helper e o post é do tipo "need" (precisa de ajuda)
        # só mostrar se a categoria do post está nas categorias que ele pode ajudar
        if current_user.role in ['volunteer', 'helper']:
            if post['type'] == 'need':
                # Se não tem categorias definidas ou a categoria do post está nas dele
                if not user_help_categories or post['category'] in user_help_categories:
                    post['can_help'] = True
                    filtered_posts.append(post)
            else:
                # Posts de oferta (type='offer') todos podem ver
                post['can_help'] = True
                filtered_posts.append(post)
        else:
            # Migrantes e outros usuários veem todos os posts
            post['can_help'] = True
            filtered_posts.append(post)
    
    return filtered_posts

@api_router.get("/services")
async def get_services(category: Optional[str] = None):
    query = {}
    if category:
        query['category'] = category
    
    services = await db.services.find(query, {'_id': 0}).to_list(100)
    return services

@api_router.post("/ai/chat")
async def ai_chat(message_data: AIMessage, current_user: User = Depends(get_current_user)):
    try:
        pdf_processor.load_index()
        relevant_chunks = pdf_processor.search(message_data.message, k=3)
        
        context = "\n\n".join(relevant_chunks) if relevant_chunks else "Informação não encontrada no guia Watizat."
        
        system_message = f"""Você é um assistente especializado em ajudar migrantes em Paris. 
        Use as informações do guia Watizat abaixo para responder perguntas.
        Seja empático, claro e objetivo. Responda em {message_data.language}.
        
        Contexto do Watizat:
        {context}
        """
        
        chat = LlmChat(
            api_key=os.environ['EMERGENT_LLM_KEY'],
            session_id=f"user_{current_user.id}",
            system_message=system_message
        ).with_model("openai", "gpt-5.1")
        
        user_message = UserMessage(text=message_data.message)
        response = await chat.send_message(user_message)
        
        chat_record = {
            'id': str(uuid.uuid4()),
            'user_id': current_user.id,
            'message': message_data.message,
            'response': response,
            'language': message_data.language,
            'created_at': datetime.now(timezone.utc).isoformat()
        }
        await db.ai_chats.insert_one(chat_record)
        
        return {'response': response, 'sources': relevant_chunks[:2] if relevant_chunks else []}
    
    except Exception as e:
        logging.error(f"AI Chat error: {str(e)}")
        raise HTTPException(status_code=500, detail="Error processing message")

@api_router.post("/matches")
async def create_match(helper_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != 'migrant':
        raise HTTPException(status_code=400, detail="Only migrants can create matches")
    
    match = Match(
        helper_id=helper_id,
        migrant_id=current_user.id,
        status='pending'
    )
    
    match_dict = match.model_dump()
    match_dict['created_at'] = match_dict['created_at'].isoformat()
    
    await db.matches.insert_one(match_dict)
    return match

@api_router.get("/matches")
async def get_matches(current_user: User = Depends(get_current_user)):
    query = {}
    if current_user.role == 'migrant':
        query['migrant_id'] = current_user.id
    else:
        query['helper_id'] = current_user.id
    
    matches = await db.matches.find(query, {'_id': 0}).to_list(100)
    return matches

@api_router.get("/admin/stats")
async def admin_stats(current_user: User = Depends(get_current_user)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin only")
    
    total_users = await db.users.count_documents({})
    total_posts = await db.posts.count_documents({})
    total_matches = await db.matches.count_documents({})
    total_volunteers = await db.users.count_documents({'role': 'volunteer'})
    total_migrants = await db.users.count_documents({'role': 'migrant'})
    total_messages = await db.messages.count_documents({})
    
    # Posts por categoria
    posts_by_category = {}
    categories = ['food', 'legal', 'health', 'housing', 'work', 'education', 'social', 'clothes', 'furniture', 'transport']
    for cat in categories:
        count = await db.posts.count_documents({'category': cat})
        posts_by_category[cat] = count
    
    # Posts por tipo
    needs_count = await db.posts.count_documents({'type': 'need'})
    offers_count = await db.posts.count_documents({'type': 'offer'})
    
    return {
        'total_users': total_users,
        'total_posts': total_posts,
        'total_matches': total_matches,
        'total_volunteers': total_volunteers,
        'total_migrants': total_migrants,
        'total_messages': total_messages,
        'posts_by_category': posts_by_category,
        'needs_count': needs_count,
        'offers_count': offers_count
    }

@api_router.get("/admin/users")
async def admin_get_users(current_user: User = Depends(get_current_user)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin only")
    
    users = await db.users.find({}, {'_id': 0, 'password': 0}).sort('created_at', -1).to_list(1000)
    
    for user in users:
        if isinstance(user.get('created_at'), str):
            user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    return users

@api_router.get("/admin/posts")
async def admin_get_posts(current_user: User = Depends(get_current_user)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin only")
    
    posts = await db.posts.find({}, {'_id': 0}).sort('created_at', -1).to_list(1000)
    
    for post in posts:
        if isinstance(post.get('created_at'), str):
            post['created_at'] = datetime.fromisoformat(post['created_at'])
        # Get user info
        user = await db.users.find_one({'id': post['user_id']}, {'_id': 0, 'password': 0, 'email': 0})
        if user:
            post['user'] = {'name': user['name'], 'role': user['role']}
    
    return posts

@api_router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin only")
    
    # Don't allow deleting yourself
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    result = await db.users.delete_one({'id': user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Also delete user's posts and messages
    await db.posts.delete_many({'user_id': user_id})
    await db.messages.delete_many({'$or': [{'from_user_id': user_id}, {'to_user_id': user_id}]})
    
    return {'message': 'User deleted successfully'}

@api_router.delete("/admin/posts/{post_id}")
async def admin_delete_post(post_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin only")
    
    result = await db.posts.delete_one({'id': post_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Post not found")
    
    # Also delete comments
    await db.comments.delete_many({'post_id': post_id})
    
    return {'message': 'Post deleted successfully'}

@api_router.put("/admin/users/{user_id}/role")
async def admin_update_user_role(user_id: str, role_data: dict, current_user: User = Depends(get_current_user)):
    if current_user.role != 'admin':
        raise HTTPException(status_code=403, detail="Admin only")
    
    new_role = role_data.get('role')
    if new_role not in ['migrant', 'volunteer', 'helper', 'admin']:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    result = await db.users.update_one({'id': user_id}, {'$set': {'role': new_role}})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {'message': 'Role updated successfully'}

class DirectMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    from_user_id: str
    to_user_id: str
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class DirectMessageCreate(BaseModel):
    to_user_id: str
    message: str
    location: Optional[dict] = None
    media: Optional[List[str]] = Field(default_factory=list)
    media_type: Optional[str] = None

@api_router.post("/messages")
async def send_message(msg_data: DirectMessageCreate, current_user: User = Depends(get_current_user)):
    message = DirectMessage(
        from_user_id=current_user.id,
        to_user_id=msg_data.to_user_id,
        message=msg_data.message
    )
    
    msg_dict = message.model_dump()
    msg_dict['created_at'] = msg_dict['created_at'].isoformat()
    msg_dict['location'] = msg_data.location
    msg_dict['media'] = msg_data.media or []
    msg_dict['media_type'] = msg_data.media_type
    
    await db.messages.insert_one(msg_dict)
    return message

@api_router.get("/messages/{other_user_id}")
async def get_messages(other_user_id: str, current_user: User = Depends(get_current_user)):
    messages = await db.messages.find({
        '$or': [
            {'from_user_id': current_user.id, 'to_user_id': other_user_id},
            {'from_user_id': other_user_id, 'to_user_id': current_user.id}
        ]
    }, {'_id': 0}).sort('created_at', 1).to_list(1000)
    
    for msg in messages:
        if isinstance(msg['created_at'], str):
            msg['created_at'] = datetime.fromisoformat(msg['created_at'])
    
    return messages

@api_router.get("/conversations")
async def get_conversations(current_user: User = Depends(get_current_user)):
    messages = await db.messages.find({
        '$or': [
            {'from_user_id': current_user.id},
            {'to_user_id': current_user.id}
        ]
    }, {'_id': 0}).to_list(10000)
    
    user_ids = set()
    for msg in messages:
        if msg['from_user_id'] != current_user.id:
            user_ids.add(msg['from_user_id'])
        if msg['to_user_id'] != current_user.id:
            user_ids.add(msg['to_user_id'])
    
    conversations = []
    for uid in user_ids:
        user = await db.users.find_one({'id': uid}, {'_id': 0, 'password': 0})
        if user:
            last_msg = await db.messages.find_one({
                '$or': [
                    {'from_user_id': current_user.id, 'to_user_id': uid},
                    {'from_user_id': uid, 'to_user_id': current_user.id}
                ]
            }, {'_id': 0}, sort=[('created_at', -1)])
            
            if isinstance(user.get('created_at'), str):
                user['created_at'] = datetime.fromisoformat(user['created_at'])
            
            conversations.append({
                'user': user,
                'last_message': last_msg['message'] if last_msg else '',
                'last_message_time': last_msg['created_at'] if last_msg else None
            })
    
    return conversations

@api_router.get("/users/{user_id}")
async def get_user_by_id(user_id: str, current_user: User = Depends(get_current_user)):
    user = await db.users.find_one({'id': user_id}, {'_id': 0, 'password': 0})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if isinstance(user.get('created_at'), str):
        user['created_at'] = datetime.fromisoformat(user['created_at'])
    
    return user

@api_router.get("/can-chat/{other_user_id}")
async def can_chat_with_user(other_user_id: str, current_user: User = Depends(get_current_user)):
    """
    Verifica se o usuário atual pode iniciar chat com outro usuário.
    Para voluntários e helpers, só podem conversar com migrantes se tiverem categorias de ajuda compatíveis.
    """
    other_user = await db.users.find_one({'id': other_user_id}, {'_id': 0})
    if not other_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    current_user_data = await db.users.find_one({'id': current_user.id}, {'_id': 0})
    
    # Migrantes podem conversar com qualquer voluntário ou helper
    if current_user.role == 'migrant':
        return {'can_chat': True, 'reason': 'allowed'}
    
    # Voluntários e helpers só podem conversar com migrantes se tiverem categorias compatíveis
    if current_user.role in ['volunteer', 'helper'] and other_user.get('role') == 'migrant':
        helper_categories = current_user_data.get('help_categories', []) if current_user_data else []
        
        if not helper_categories:
            # Se não definiu categorias, permitir chat (legacy)
            return {'can_chat': True, 'reason': 'no_categories_defined'}
        
        # Primeiro verificar need_categories do migrante
        migrant_need_categories = other_user.get('need_categories', [])
        
        if migrant_need_categories:
            # Verificar match entre need_categories do migrante e help_categories
            for cat in migrant_need_categories:
                if cat in helper_categories:
                    return {'can_chat': True, 'reason': 'category_match', 'matching_category': cat}
        
        # Se migrante não tem need_categories, verificar pelos posts
        migrant_posts = await db.posts.find({'user_id': other_user_id, 'type': 'need'}, {'_id': 0}).to_list(100)
        
        if not migrant_posts and not migrant_need_categories:
            # Se o migrante não tem posts nem need_categories, permitir chat
            return {'can_chat': True, 'reason': 'no_needs_defined'}
        
        # Verificar se há algum post do migrante em categoria que pode ajudar
        for post in migrant_posts:
            if post.get('category') in helper_categories:
                return {'can_chat': True, 'reason': 'category_match', 'matching_category': post.get('category')}
        
        return {'can_chat': False, 'reason': 'no_matching_categories'}
    
    # Outros casos: permitir
    return {'can_chat': True, 'reason': 'allowed'}

@api_router.get("/volunteers")
async def get_volunteers(area: Optional[str] = None):
    query = {'role': 'volunteer'}
    if area:
        query['professional_area'] = area
    
    volunteers = await db.users.find(query, {'_id': 0, 'password': 0, 'email': 0}).to_list(1000)
    
    for vol in volunteers:
        if isinstance(vol.get('created_at'), str):
            vol['created_at'] = datetime.fromisoformat(vol['created_at'])
    
    return volunteers

@api_router.get("/helpers-nearby")
async def get_helpers_nearby(
    lat: float, 
    lng: float, 
    category: Optional[str] = None,
    radius: float = 10.0,  # km
    current_user: User = Depends(get_current_user)
):
    """
    Busca helpers e voluntários próximos que podem ajudar em uma categoria específica.
    Usa fórmula de Haversine para calcular distância.
    """
    import math
    
    def haversine_distance(lat1, lon1, lat2, lon2):
        R = 6371  # Raio da Terra em km
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)
        
        a = math.sin(delta_phi/2)**2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda/2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        
        return R * c
    
    # Buscar helpers e voluntários com localização visível
    query = {
        'role': {'$in': ['helper', 'volunteer']},
        'show_location': True,
        'location': {'$ne': None}
    }
    
    if category:
        query['help_categories'] = category
    
    users = await db.users.find(query, {'_id': 0, 'password': 0, 'email': 0}).to_list(1000)
    
    nearby_users = []
    for user in users:
        if user.get('location') and user['location'].get('lat') and user['location'].get('lng'):
            distance = haversine_distance(
                lat, lng,
                user['location']['lat'],
                user['location']['lng']
            )
            if distance <= radius:
                user['distance'] = round(distance, 2)
                if isinstance(user.get('created_at'), str):
                    user['created_at'] = datetime.fromisoformat(user['created_at'])
                nearby_users.append(user)
    
    # Ordenar por distância
    nearby_users.sort(key=lambda x: x['distance'])
    
    return nearby_users

@api_router.put("/profile/location")
async def update_location(location_data: dict, current_user: User = Depends(get_current_user)):
    """Atualiza a localização do usuário"""
    update = {
        'location': location_data.get('location'),
        'show_location': location_data.get('show_location', False)
    }
    
    await db.users.update_one({'id': current_user.id}, {'$set': update})
    return {'message': 'Location updated successfully'}

# ==================== HELP LOCATIONS ENDPOINTS ====================

def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calcula a distância em km entre duas coordenadas usando a fórmula de Haversine"""
    R = 6371  # Raio da Terra em km
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lng = math.radians(lng2 - lng1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lng/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c

class HelpLocationResponse(BaseModel):
    id: str
    name: str
    address: str
    phone: Optional[str]
    category: str
    hours: Optional[str]
    lat: float
    lng: float
    distance: Optional[float] = None
    icon: Optional[str] = None
    color: Optional[str] = None

CATEGORY_ICONS = {
    'food': {'icon': '🍽️', 'color': 'bg-green-500'},
    'health': {'icon': '🏥', 'color': 'bg-red-500'},
    'legal': {'icon': '⚖️', 'color': 'bg-blue-500'},
    'housing': {'icon': '🏠', 'color': 'bg-purple-500'},
    'clothes': {'icon': '👕', 'color': 'bg-orange-500'},
    'social': {'icon': '🤝', 'color': 'bg-pink-500'},
    'education': {'icon': '📚', 'color': 'bg-indigo-500'},
    'work': {'icon': '💼', 'color': 'bg-yellow-500'}
}

@api_router.get("/help-locations")
async def get_help_locations(
    category: Optional[str] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None
):
    """
    Retorna todos os locais de ajuda.
    Pode filtrar por categoria e ordenar por distância se coordenadas forem fornecidas.
    """
    # Buscar locais do arquivo de dados
    if category and category != 'all':
        locations = get_help_locations_by_category(category)
    else:
        locations = get_all_help_locations()
    
    # Adicionar ícones e cores
    result = []
    for loc in locations:
        loc_data = {**loc}
        cat_info = CATEGORY_ICONS.get(loc['category'], {'icon': '📍', 'color': 'bg-gray-500'})
        loc_data['icon'] = cat_info['icon']
        loc_data['color'] = cat_info['color']
        
        # Calcular distância se coordenadas foram fornecidas
        if lat is not None and lng is not None:
            loc_data['distance'] = round(calculate_distance(lat, lng, loc['lat'], loc['lng']), 2)
        
        result.append(loc_data)
    
    # Ordenar por distância se aplicável
    if lat is not None and lng is not None:
        result.sort(key=lambda x: x.get('distance', float('inf')))
    
    return {'locations': result, 'total': len(result)}

@api_router.get("/help-locations/nearest")
async def get_nearest_help_location(
    lat: float,
    lng: float,
    category: Optional[str] = None
):
    """
    Retorna o local de ajuda mais próximo das coordenadas fornecidas.
    Pode filtrar por categoria.
    """
    if category and category != 'all':
        locations = get_help_locations_by_category(category)
    else:
        locations = get_all_help_locations()
    
    if not locations:
        raise HTTPException(status_code=404, detail="Nenhum local encontrado")
    
    nearest = None
    min_distance = float('inf')
    
    for loc in locations:
        distance = calculate_distance(lat, lng, loc['lat'], loc['lng'])
        if distance < min_distance:
            min_distance = distance
            cat_info = CATEGORY_ICONS.get(loc['category'], {'icon': '📍', 'color': 'bg-gray-500'})
            nearest = {
                **loc,
                'distance': round(distance, 2),
                'icon': cat_info['icon'],
                'color': cat_info['color']
            }
    
    return {'nearest': nearest}

@api_router.get("/help-locations/categories")
async def get_help_location_categories():
    """Retorna todas as categorias disponíveis com contagem de locais"""
    locations = get_all_help_locations()
    
    # Contar locais por categoria
    category_counts = {}
    for loc in locations:
        cat = loc['category']
        category_counts[cat] = category_counts.get(cat, 0) + 1
    
    # Formatar resposta com ícones
    categories = [
        {'value': 'all', 'label': 'Todos', 'icon': '🗺️', 'count': len(locations)}
    ]
    
    category_labels = {
        'food': 'Alimentação',
        'health': 'Saúde',
        'legal': 'Jurídico',
        'housing': 'Moradia',
        'clothes': 'Roupas',
        'social': 'Social',
        'education': 'Educação',
        'work': 'Trabalho'
    }
    
    for cat, count in sorted(category_counts.items()):
        cat_info = CATEGORY_ICONS.get(cat, {'icon': '📍', 'color': 'bg-gray-500'})
        categories.append({
            'value': cat,
            'label': category_labels.get(cat, cat.title()),
            'icon': cat_info['icon'],
            'color': cat_info['color'],
            'count': count
        })
    
    return {'categories': categories}

@api_router.post("/help-locations/seed")
async def seed_help_locations():
    """Popula o banco de dados com os locais de ajuda (operação única)"""
    locations = get_all_help_locations()
    
    # Verificar se já existem locais no banco
    existing_count = await db.help_locations.count_documents({})
    
    if existing_count > 0:
        return {'message': f'{existing_count} locais já existem no banco', 'seeded': False}
    
    # Inserir todos os locais
    for loc in locations:
        loc_with_metadata = {
            **loc,
            'created_at': datetime.now(timezone.utc)
        }
        await db.help_locations.insert_one(loc_with_metadata)
    
    return {'message': f'{len(locations)} locais adicionados com sucesso', 'seeded': True, 'count': len(locations)}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
