# Supabase Schema Visualizer

This diagram represents the relational database schema defined in the `src/lib/supabase/schema` directory. It maps out the entities, their attributes, and the relationships (Foreign Keys) between them.

```mermaid
erDiagram
    institutions ||--|{ profiles : "has users (restrict)"
    institutions ||--o{ courses : "offers (cascade)"
    profiles ||--o{ course_enrollment : "enrolled in (cascade)"
    courses ||--o{ course_enrollment : "has students (cascade)"
    courses ||--o{ exams : "contains (cascade)"
    profiles ||--o{ exams : "creates (set null)"
    exams ||--o{ answer_keys : "has answer keys (cascade)"
    exams ||--o{ exam_papers : "has answers (cascade)"
    profiles ||--o{ exam_papers : "submits (cascade)"
    exams ||--o{ score_results : "has results (cascade)"
    profiles ||--o{ score_results : "receives (cascade)"
    exams ||--o{ feedbacks : "receives feedback (cascade)"
    profiles ||--o{ feedbacks : "gives feedback (cascade)"

    institutions {
        uuid institution_id PK
        text institution_name
        timestamptz created_at
    }
    
    profiles {
        uuid user_id PK
        varchar email
        varchar first_name
        varchar middle_name
        varchar last_name
        user_role role
        timestamptz created_at
        timestamptz updated_at
        uuid institution_id FK
        varchar examinee_id_number
    }

    courses {
        uuid course_id PK
        uuid institution_id FK
        text course_name
        text course_description
        timestamptz created_at
        timestamptz updated_at
    }

    course_enrollment {
        uuid user_id PK "FK to profiles"
        uuid course_id PK "FK to courses"
        timestamptz created_at
    }

    exams {
        uuid exam_id PK
        uuid course_id FK
        text exam_title
        timestamptz exam_date
        numeric passing_rate
        uuid created_by FK "FK to profiles"
        timestamptz created_at
        varchar[] topics
        numeric total_items
    }

    answer_keys {
        uuid key_id PK
        uuid exam_id FK
        smallint version
        jsonb answer_key
        timestamptz created_at
        timestamptz updated_at
    }

    exam_papers {
        uuid paper_id PK
        uuid exam_id FK
        uuid user_id FK
        jsonb actual_answers
        timestamptz created_at
    }

    score_results {
        uuid exam_id FK
        uuid student_id FK "FK to profiles"
        jsonb scores
    }

    feedbacks {
        uuid feedback_id PK
        uuid exam_id FK
        uuid user_id FK
        text comment
        timestamptz created_at
    }
```
