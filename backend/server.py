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
from passlib.context import CryptContext
import jwt

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()
SECRET_KEY = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
ALGORITHM = "HS256"

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# ============ MODELS ============

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    full_name: str
    id_number: str
    role: str  # admin, supervisor, participant
    company_id: Optional[str] = None
    location: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    is_active: bool = True

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    id_number: str
    role: str
    company_id: Optional[str] = None
    location: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: User

class Company(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class CompanyCreate(BaseModel):
    name: str

class Session(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    company_id: str
    location: str
    start_date: str
    end_date: str
    supervisor_ids: List[str] = []
    participant_ids: List[str] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class SessionCreate(BaseModel):
    name: str
    company_id: str
    location: str
    start_date: str
    end_date: str
    supervisor_ids: List[str] = []

class Test(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    session_id: str
    test_type: str  # pre or post
    questions: List[dict] = []  # {question: str, options: List[str], correct_answer: int}
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TestCreate(BaseModel):
    session_id: str
    test_type: str
    questions: List[dict]

class TestResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    test_id: str
    participant_id: str
    answers: List[int] = []  # indices of selected answers
    score: float = 0.0
    total_questions: int = 0
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TestSubmit(BaseModel):
    test_id: str
    answers: List[int]

class VehicleChecklist(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    participant_id: str
    session_id: str
    interval: str  # 1_month, 3_month, 6_month
    checklist_items: List[dict] = []  # {item: str, status: bool, comments: str}
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    verified_by: Optional[str] = None
    verified_at: Optional[datetime] = None
    verification_status: str = "pending"  # pending, approved, rejected

class ChecklistSubmit(BaseModel):
    session_id: str
    interval: str
    checklist_items: List[dict]

class ChecklistVerify(BaseModel):
    checklist_id: str
    status: str  # approved or rejected
    comments: Optional[str] = None

class CourseFeedback(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    participant_id: str
    session_id: str
    rating: int  # 1-5
    feedback_text: str
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FeedbackSubmit(BaseModel):
    session_id: str
    rating: int
    feedback_text: str

class Certificate(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    participant_id: str
    session_id: str
    issue_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    certificate_url: Optional[str] = None

# ============ HELPER FUNCTIONS ============

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = timedelta(days=7)):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        user_doc = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user_doc:
            raise HTTPException(status_code=401, detail="User not found")
        
        if isinstance(user_doc.get('created_at'), str):
            user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
        
        return User(**user_doc)
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============ ROUTES ============

@api_router.get("/")
async def root():
    return {"message": "Defensive Driving Training API"}

# Auth Routes
@api_router.post("/auth/register", response_model=User)
async def register_user(user_data: UserCreate, current_user: User = Depends(get_current_user)):
    # Only admin can create users
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create users")
    
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="User already exists")
    
    # Hash password and create user
    hashed_pw = hash_password(user_data.password)
    user_obj = User(
        email=user_data.email,
        full_name=user_data.full_name,
        id_number=user_data.id_number,
        role=user_data.role,
        company_id=user_data.company_id,
        location=user_data.location
    )
    
    doc = user_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['password'] = hashed_pw
    
    await db.users.insert_one(doc)
    return user_obj

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(user_data: UserLogin):
    user_doc = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not verify_password(user_data.password, user_doc['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user_doc.get('is_active', True):
        raise HTTPException(status_code=401, detail="Account is inactive")
    
    token = create_access_token({"sub": user_doc['id']})
    
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    user_doc.pop('password', None)
    user = User(**user_doc)
    
    return TokenResponse(access_token=token, token_type="bearer", user=user)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# Company Routes
@api_router.post("/companies", response_model=Company)
async def create_company(company_data: CompanyCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create companies")
    
    company_obj = Company(name=company_data.name)
    doc = company_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.companies.insert_one(doc)
    return company_obj

@api_router.get("/companies", response_model=List[Company])
async def get_companies(current_user: User = Depends(get_current_user)):
    companies = await db.companies.find({}, {"_id": 0}).to_list(1000)
    for company in companies:
        if isinstance(company.get('created_at'), str):
            company['created_at'] = datetime.fromisoformat(company['created_at'])
    return companies

# Session Routes
@api_router.post("/sessions", response_model=Session)
async def create_session(session_data: SessionCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create sessions")
    
    session_obj = Session(**session_data.model_dump())
    doc = session_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.sessions.insert_one(doc)
    return session_obj

@api_router.get("/sessions", response_model=List[Session])
async def get_sessions(current_user: User = Depends(get_current_user)):
    if current_user.role == "participant":
        # Participants only see their sessions
        sessions = await db.sessions.find(
            {"participant_ids": current_user.id},
            {"_id": 0}
        ).to_list(1000)
    elif current_user.role == "supervisor":
        # Supervisors see sessions they're assigned to
        sessions = await db.sessions.find(
            {"supervisor_ids": current_user.id},
            {"_id": 0}
        ).to_list(1000)
    else:
        # Admins see all
        sessions = await db.sessions.find({}, {"_id": 0}).to_list(1000)
    
    for session in sessions:
        if isinstance(session.get('created_at'), str):
            session['created_at'] = datetime.fromisoformat(session['created_at'])
    return sessions

@api_router.post("/sessions/{session_id}/add-participant")
async def add_participant_to_session(session_id: str, participant_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can add participants")
    
    result = await db.sessions.update_one(
        {"id": session_id},
        {"$addToSet": {"participant_ids": participant_id}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return {"message": "Participant added successfully"}

# User Routes
@api_router.get("/users", response_model=List[User])
async def get_users(role: Optional[str] = None, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin" and current_user.role != "supervisor":
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    query = {}
    if role:
        query["role"] = role
    
    users = await db.users.find(query, {"_id": 0, "password": 0}).to_list(1000)
    for user in users:
        if isinstance(user.get('created_at'), str):
            user['created_at'] = datetime.fromisoformat(user['created_at'])
    return users

# Test Routes
@api_router.post("/tests", response_model=Test)
async def create_test(test_data: TestCreate, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can create tests")
    
    test_obj = Test(**test_data.model_dump())
    doc = test_obj.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.tests.insert_one(doc)
    return test_obj

@api_router.get("/tests/session/{session_id}", response_model=List[Test])
async def get_tests_by_session(session_id: str, current_user: User = Depends(get_current_user)):
    tests = await db.tests.find({"session_id": session_id}, {"_id": 0}).to_list(100)
    for test in tests:
        if isinstance(test.get('created_at'), str):
            test['created_at'] = datetime.fromisoformat(test['created_at'])
    return tests

@api_router.post("/tests/submit", response_model=TestResult)
async def submit_test(submission: TestSubmit, current_user: User = Depends(get_current_user)):
    if current_user.role != "participant":
        raise HTTPException(status_code=403, detail="Only participants can submit tests")
    
    # Get test
    test_doc = await db.tests.find_one({"id": submission.test_id}, {"_id": 0})
    if not test_doc:
        raise HTTPException(status_code=404, detail="Test not found")
    
    # Calculate score
    questions = test_doc['questions']
    correct = sum(1 for i, ans in enumerate(submission.answers) if i < len(questions) and ans == questions[i]['correct_answer'])
    score = (correct / len(questions)) * 100 if questions else 0
    
    result_obj = TestResult(
        test_id=submission.test_id,
        participant_id=current_user.id,
        answers=submission.answers,
        score=score,
        total_questions=len(questions)
    )
    
    doc = result_obj.model_dump()
    doc['submitted_at'] = doc['submitted_at'].isoformat()
    
    await db.test_results.insert_one(doc)
    return result_obj

@api_router.get("/tests/results/participant/{participant_id}", response_model=List[TestResult])
async def get_participant_results(participant_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role == "participant" and current_user.id != participant_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    results = await db.test_results.find({"participant_id": participant_id}, {"_id": 0}).to_list(100)
    for result in results:
        if isinstance(result.get('submitted_at'), str):
            result['submitted_at'] = datetime.fromisoformat(result['submitted_at'])
    return results

# Vehicle Checklist Routes
@api_router.post("/checklists/submit", response_model=VehicleChecklist)
async def submit_checklist(checklist_data: ChecklistSubmit, current_user: User = Depends(get_current_user)):
    if current_user.role != "participant":
        raise HTTPException(status_code=403, detail="Only participants can submit checklists")
    
    checklist_obj = VehicleChecklist(
        participant_id=current_user.id,
        session_id=checklist_data.session_id,
        interval=checklist_data.interval,
        checklist_items=checklist_data.checklist_items
    )
    
    doc = checklist_obj.model_dump()
    doc['submitted_at'] = doc['submitted_at'].isoformat()
    if doc.get('verified_at'):
        doc['verified_at'] = doc['verified_at'].isoformat()
    
    await db.vehicle_checklists.insert_one(doc)
    return checklist_obj

@api_router.get("/checklists/participant/{participant_id}", response_model=List[VehicleChecklist])
async def get_participant_checklists(participant_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role == "participant" and current_user.id != participant_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    checklists = await db.vehicle_checklists.find({"participant_id": participant_id}, {"_id": 0}).to_list(100)
    for checklist in checklists:
        if isinstance(checklist.get('submitted_at'), str):
            checklist['submitted_at'] = datetime.fromisoformat(checklist['submitted_at'])
        if checklist.get('verified_at') and isinstance(checklist['verified_at'], str):
            checklist['verified_at'] = datetime.fromisoformat(checklist['verified_at'])
    return checklists

@api_router.get("/checklists/pending", response_model=List[VehicleChecklist])
async def get_pending_checklists(current_user: User = Depends(get_current_user)):
    if current_user.role != "supervisor" and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only supervisors can verify checklists")
    
    checklists = await db.vehicle_checklists.find({"verification_status": "pending"}, {"_id": 0}).to_list(100)
    for checklist in checklists:
        if isinstance(checklist.get('submitted_at'), str):
            checklist['submitted_at'] = datetime.fromisoformat(checklist['submitted_at'])
    return checklists

@api_router.post("/checklists/verify")
async def verify_checklist(verification: ChecklistVerify, current_user: User = Depends(get_current_user)):
    if current_user.role != "supervisor" and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only supervisors can verify checklists")
    
    result = await db.vehicle_checklists.update_one(
        {"id": verification.checklist_id},
        {
            "$set": {
                "verification_status": verification.status,
                "verified_by": current_user.id,
                "verified_at": datetime.now(timezone.utc).isoformat()
            }
        }
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Checklist not found")
    
    return {"message": "Checklist verified successfully"}

# Course Feedback Routes
@api_router.post("/feedback/submit", response_model=CourseFeedback)
async def submit_feedback(feedback_data: FeedbackSubmit, current_user: User = Depends(get_current_user)):
    if current_user.role != "participant":
        raise HTTPException(status_code=403, detail="Only participants can submit feedback")
    
    feedback_obj = CourseFeedback(
        participant_id=current_user.id,
        session_id=feedback_data.session_id,
        rating=feedback_data.rating,
        feedback_text=feedback_data.feedback_text
    )
    
    doc = feedback_obj.model_dump()
    doc['submitted_at'] = doc['submitted_at'].isoformat()
    
    await db.course_feedback.insert_one(doc)
    return feedback_obj

@api_router.get("/feedback/session/{session_id}", response_model=List[CourseFeedback])
async def get_session_feedback(session_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin" and current_user.role != "supervisor":
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    feedback = await db.course_feedback.find({"session_id": session_id}, {"_id": 0}).to_list(100)
    for fb in feedback:
        if isinstance(fb.get('submitted_at'), str):
            fb['submitted_at'] = datetime.fromisoformat(fb['submitted_at'])
    return feedback

@api_router.get("/feedback/company/{company_id}")
async def get_company_feedback(company_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only admins can view company feedback")
    
    # Get all sessions for the company
    sessions = await db.sessions.find({"company_id": company_id}, {"_id": 0}).to_list(1000)
    session_ids = [s['id'] for s in sessions]
    
    # Get feedback for all sessions
    feedback = await db.course_feedback.find({"session_id": {"$in": session_ids}}, {"_id": 0}).to_list(1000)
    for fb in feedback:
        if isinstance(fb.get('submitted_at'), str):
            fb['submitted_at'] = datetime.fromisoformat(fb['submitted_at'])
    
    return feedback

# Certificate Routes
@api_router.get("/certificates/participant/{participant_id}", response_model=List[Certificate])
async def get_participant_certificates(participant_id: str, current_user: User = Depends(get_current_user)):
    if current_user.role == "participant" and current_user.id != participant_id:
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    certificates = await db.certificates.find({"participant_id": participant_id}, {"_id": 0}).to_list(100)
    for cert in certificates:
        if isinstance(cert.get('issue_date'), str):
            cert['issue_date'] = datetime.fromisoformat(cert['issue_date'])
    return certificates

# Include router
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
