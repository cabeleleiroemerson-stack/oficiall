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
        auto_response_data = format_auto_response_post(post_data.category, post.id)
        if auto_response_data:
            auto_response = Post(
                user_id='system',
                type=auto_response_data['type'],
                category=auto_response_data['category'],
                title=auto_response_data['title'],
                description=auto_response_data['description'],
                location=None
            )
            
            auto_response_dict = auto_response.model_dump()
            auto_response_dict['created_at'] = auto_response_dict['created_at'].isoformat()
            auto_response_dict['images'] = []
            auto_response_dict['is_auto_response'] = True
            auto_response_dict['reply_to'] = post.id
            
            await db.posts.insert_one(auto_response_dict)
    
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
async def get_posts(type: Optional[str] = None, category: Optional[str] = None):
    query = {}
    if type:
        query['type'] = type
    if category:
        query['category'] = category
    
    posts = await db.posts.find(query, {'_id': 0}).sort('created_at', -1).to_list(100)
    
    for post in posts:
        if isinstance(post['created_at'], str):
            post['created_at'] = datetime.fromisoformat(post['created_at'])
        
        if post['user_id'] == 'system':
            post['user'] = {'name': 'Watizat Assistant', 'role': 'assistant'}
        else:
            user = await db.users.find_one({'id': post['user_id']}, {'_id': 0, 'password': 0, 'email': 0})
            if user:
                post['user'] = {'name': user['name'], 'role': user['role']}
    
    return posts

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
    
    return {
        'total_users': total_users,
        'total_posts': total_posts,
        'total_matches': total_matches
    }

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
