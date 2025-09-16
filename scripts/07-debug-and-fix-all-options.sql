-- Comprehensive debug and fix script for question options

-- 1. Show all interviews
SELECT 'ALL INTERVIEWS:' as section;
SELECT id, title, status, created_at FROM interviews ORDER BY created_at DESC;

-- 2. Show all questions with their types
SELECT 'ALL QUESTIONS:' as section;
SELECT 
  q.id,
  q.title,
  q.type,
  i.title as interview_title,
  q.created_at
FROM questions q
JOIN interviews i ON q.interview_id = i.id
ORDER BY q.created_at DESC;

-- 3. Show multiple choice questions and their option counts
SELECT 'MULTIPLE CHOICE QUESTIONS WITH OPTION COUNTS:' as section;
SELECT 
  q.id as question_id,
  q.title as question_title,
  i.title as interview_title,
  q.type,
  COUNT(qo.id) as option_count,
  q.created_at
FROM questions q
JOIN interviews i ON q.interview_id = i.id
LEFT JOIN question_options qo ON q.id = qo.question_id
WHERE q.type = 'multiple_choice'
GROUP BY q.id, q.title, i.title, q.type, q.created_at
ORDER BY q.created_at DESC;

-- 4. Add options to ALL multiple choice questions that don't have any
DO $$
DECLARE
    question_record RECORD;
    option_count INTEGER;
BEGIN
    RAISE NOTICE 'Starting to add options to multiple choice questions...';
    
    FOR question_record IN 
        SELECT q.id, q.title, q.interview_id, i.title as interview_title
        FROM questions q 
        JOIN interviews i ON q.interview_id = i.id
        WHERE q.type = 'multiple_choice'
        ORDER BY q.created_at DESC
    LOOP
        -- Check if this question has options
        SELECT COUNT(*) INTO option_count 
        FROM question_options 
        WHERE question_id = question_record.id;
        
        IF option_count = 0 THEN
            RAISE NOTICE 'Adding options to question: "%" in interview "%"', question_record.title, question_record.interview_title;
            
            -- Add 4 sample options
            INSERT INTO question_options (question_id, option_text, is_correct, order_index) VALUES 
            (question_record.id, 'Option A - First choice', true, 1),
            (question_record.id, 'Option B - Second choice', false, 2),
            (question_record.id, 'Option C - Third choice', false, 3),
            (question_record.id, 'Option D - Fourth choice', false, 4);
            
            RAISE NOTICE 'Added 4 options to question: %', question_record.title;
        ELSE
            RAISE NOTICE 'Question "%" already has % options', question_record.title, option_count;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Finished adding options to multiple choice questions.';
END $$;

-- 5. Verify all options were added
SELECT 'VERIFICATION - ALL OPTIONS:' as section;
SELECT 
  q.title as question_title,
  i.title as interview_title,
  qo.option_text,
  qo.is_correct,
  qo.order_index,
  q.created_at as question_created
FROM questions q
JOIN interviews i ON q.interview_id = i.id
JOIN question_options qo ON q.id = qo.question_id
WHERE q.type = 'multiple_choice'
ORDER BY q.created_at DESC, qo.order_index;

-- 6. Final summary
SELECT 'FINAL SUMMARY:' as section;
SELECT 
  i.title as interview_title,
  COUNT(DISTINCT q.id) as total_questions,
  COUNT(DISTINCT CASE WHEN q.type = 'multiple_choice' THEN q.id END) as mc_questions,
  COUNT(qo.id) as total_options
FROM interviews i
LEFT JOIN questions q ON i.id = q.interview_id
LEFT JOIN question_options qo ON q.id = qo.question_id
GROUP BY i.id, i.title
ORDER BY i.created_at DESC;
