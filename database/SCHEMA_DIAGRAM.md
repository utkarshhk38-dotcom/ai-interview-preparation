# Database Schema Diagram

## Entity Relationship Overview

```
┌─────────────────┐
│   auth.users    │ (Supabase managed)
│  (Supabase)     │
└────────┬────────┘
         │
         │ 1:1
         │
         ▼
┌─────────────────────────────────────────┐
│           profiles                       │
│─────────────────────────────────────────│
│ • id (PK, FK → auth.users)              │
│ • email (unique)                         │
│ • full_name                              │
│ • role (admin/candidate)                 │
│ • avatar_url                             │
│ • phone                                  │
│ • created_at, updated_at                 │
└──────────┬──────────────────────────────┘
           │
           │ 1:N
           │
           ▼
┌─────────────────────────────────────────┐
│      interview_sessions                  │
│─────────────────────────────────────────│
│ • id (PK)                                │
│ • candidate_id (FK → profiles)           │
│ • interview_type                         │
│ • status                                 │
│ • difficulty_level                       │
│ • duration_minutes                       │
│ • score                                  │
│ • feedback                               │
│ • started_at, completed_at               │
│ • created_at, updated_at                 │
└──────────┬──────────────────────────────┘
           │
           │ 1:N
           │
           ▼
┌─────────────────────────────────────────┐
│       session_questions                  │
│─────────────────────────────────────────│
│ • id (PK)                                │
│ • session_id (FK → interview_sessions)   │
│ • question_id (FK → questions)           │
│ • question_order                         │
│ • candidate_answer                       │
│ • ai_feedback                            │
│ • score                                  │
│ • time_taken_seconds                     │
│ • created_at, updated_at                 │
└──────────┬──────────────────────────────┘
           │
           │ N:1
           │
           ▼
┌─────────────────────────────────────────┐
│           questions                      │
│─────────────────────────────────────────│
│ • id (PK)                                │
│ • question_text                          │
│ • question_type                          │
│ • difficulty_level                       │
│ • category                               │
│ • tags[]                                 │
│ • sample_answer                          │
│ • evaluation_criteria (JSONB)            │
│ • is_active                              │
│ • created_by (FK → profiles)             │
│ • created_at, updated_at                 │
└──────────────────────────────────────────┘


┌─────────────────────────────────────────┐
│     performance_analytics                │
│─────────────────────────────────────────│
│ • id (PK)                                │
│ • candidate_id (FK → profiles)           │
│ • session_id (FK → interview_sessions)   │
│ • metric_type                            │
│ • metric_value                           │
│ • notes                                  │
│ • recorded_at                            │
└──────────────────────────────────────────┘


┌─────────────────────────────────────────┐
│            feedback                      │
│─────────────────────────────────────────│
│ • id (PK)                                │
│ • session_id (FK → interview_sessions)   │
│ • feedback_type                          │
│ • feedback_text                          │
│ • rating                                 │
│ • created_by (FK → profiles)             │
│ • created_at                             │
└──────────────────────────────────────────┘
```

## Table Relationships

### profiles
- **Parent**: auth.users (1:1)
- **Children**: 
  - interview_sessions (1:N)
  - performance_analytics (1:N)
  - questions (1:N, as creator)
  - feedback (1:N, as creator)

### interview_sessions
- **Parent**: profiles (N:1)
- **Children**:
  - session_questions (1:N)
  - performance_analytics (1:N)
  - feedback (1:N)

### questions
- **Parent**: profiles (N:1, optional creator)
- **Children**: session_questions (1:N)

### session_questions
- **Parents**: 
  - interview_sessions (N:1)
  - questions (N:1)

### performance_analytics
- **Parents**:
  - profiles (N:1)
  - interview_sessions (N:1, optional)

### feedback
- **Parents**:
  - interview_sessions (N:1)
  - profiles (N:1, as creator)

## Data Flow

### User Registration Flow
```
1. User signs up
   ↓
2. auth.users record created (Supabase)
   ↓
3. Trigger: handle_new_user()
   ↓
4. profiles record created automatically
   ↓
5. Role set to 'candidate' by default
```

### Interview Session Flow
```
1. Candidate starts interview
   ↓
2. interview_sessions record created
   ↓
3. Questions selected from questions table
   ↓
4. session_questions records created
   ↓
5. Candidate answers questions
   ↓
6. Answers and feedback stored
   ↓
7. Session completed
   ↓
8. performance_analytics records created
   ↓
9. feedback records created
```

## Field Details

### profiles.role
- **Values**: 'admin' | 'candidate'
- **Default**: 'candidate'
- **Purpose**: Role-based access control

### interview_sessions.interview_type
- **Values**: 'technical' | 'behavioral' | 'hr' | 'case_study'
- **Purpose**: Categorize interview types

### interview_sessions.status
- **Values**: 'pending' | 'in_progress' | 'completed' | 'cancelled'
- **Purpose**: Track session lifecycle

### interview_sessions.difficulty_level
- **Values**: 'beginner' | 'intermediate' | 'advanced'
- **Purpose**: Match questions to candidate level

### questions.question_type
- **Values**: 'technical' | 'behavioral' | 'hr' | 'case_study'
- **Purpose**: Categorize questions

### questions.difficulty_level
- **Values**: 'beginner' | 'intermediate' | 'advanced'
- **Purpose**: Filter questions by difficulty

### performance_analytics.metric_type
- **Values**: 'overall_score' | 'communication' | 'technical_accuracy' | 'problem_solving' | 'confidence'
- **Purpose**: Track different performance aspects

### feedback.feedback_type
- **Values**: 'strengths' | 'improvements' | 'suggestions' | 'overall'
- **Purpose**: Categorize feedback

## Indexes

### Performance Optimization
```sql
-- Profiles
idx_profiles_email          → Fast email lookups
idx_profiles_role           → Filter by role

-- Interview Sessions
idx_interview_sessions_candidate    → Candidate's sessions
idx_interview_sessions_status       → Filter by status
idx_interview_sessions_type         → Filter by type
idx_interview_sessions_created      → Sort by date

-- Questions
idx_questions_type          → Filter by type
idx_questions_difficulty    → Filter by difficulty
idx_questions_active        → Show only active

-- Session Questions
idx_session_questions_session   → Questions in session
idx_session_questions_question  → Sessions using question

-- Performance Analytics
idx_performance_candidate   → Candidate's analytics
idx_performance_session     → Session analytics
idx_performance_recorded    → Sort by date

-- Feedback
idx_feedback_session        → Session feedback
```

## Row Level Security (RLS)

### Access Control Matrix

| Table | Candidate (Own) | Candidate (Others) | Admin |
|-------|----------------|-------------------|-------|
| profiles | Read/Update | No Access | Read All |
| interview_sessions | Full Access | No Access | Read All |
| questions | Read Active | Read Active | Full Access |
| session_questions | Full Access | No Access | Read All |
| performance_analytics | Read Own | No Access | Read All |
| feedback | Read Own | No Access | Full Access |

### Policy Examples

```sql
-- Candidates can only see their own data
CREATE POLICY "view_own_sessions"
  ON interview_sessions FOR SELECT
  USING (candidate_id = auth.uid());

-- Admins can see everything
CREATE POLICY "admin_view_all"
  ON interview_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

## Triggers

### Automatic Actions

1. **on_auth_user_created**
   - **When**: New user signs up
   - **Action**: Create profile record
   - **Function**: handle_new_user()

2. **set_updated_at_***
   - **When**: Record updated
   - **Action**: Update updated_at timestamp
   - **Function**: handle_updated_at()

## Sample Data

### Questions Included
- **Technical**: 5 questions (JavaScript, React)
- **Behavioral**: 5 questions (Problem-solving, Teamwork)
- **HR**: 5 questions (Motivation, Career goals)
- **Total**: 15 sample questions

### Difficulty Distribution
- **Beginner**: 6 questions
- **Intermediate**: 9 questions
- **Advanced**: 0 questions (to be added)

## Constraints

### Unique Constraints
- profiles.email
- session_questions(session_id, question_id)

### Check Constraints
- profiles.role IN ('admin', 'candidate')
- interview_sessions.interview_type IN (...)
- interview_sessions.status IN (...)
- questions.question_type IN (...)
- questions.difficulty_level IN (...)
- performance_analytics.metric_type IN (...)
- feedback.feedback_type IN (...)
- feedback.rating BETWEEN 1 AND 5

### Foreign Key Constraints
- All FK constraints use ON DELETE CASCADE
- Deleting a user cascades to all related data
- Deleting a session cascades to questions and feedback

## Storage Estimates

### Per User (Candidate)
- Profile: ~1 KB
- 10 Sessions: ~10 KB
- 100 Questions answered: ~50 KB
- Analytics: ~5 KB
- Feedback: ~10 KB
- **Total**: ~76 KB per active candidate

### For 1000 Users
- Profiles: ~1 MB
- Sessions: ~10 MB
- Questions answered: ~50 MB
- Analytics: ~5 MB
- Feedback: ~10 MB
- **Total**: ~76 MB

### Question Bank
- 1000 questions: ~2 MB
- With sample answers: ~5 MB

## Maintenance

### Regular Tasks
1. Archive old sessions (>1 year)
2. Clean up inactive questions
3. Vacuum and analyze tables
4. Review and optimize slow queries
5. Monitor table sizes
6. Update statistics

### Backup Strategy
1. Daily automated backups (Supabase)
2. Weekly manual exports
3. Before major schema changes
4. Test restore procedures monthly
