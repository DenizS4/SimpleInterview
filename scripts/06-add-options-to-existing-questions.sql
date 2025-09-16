-- Add options to existing multiple choice questions that don't have any

-- First, let's see what multiple choice questions exist without options
DO $$
DECLARE
    question_record RECORD;
    option_count INTEGER;
BEGIN
    -- Loop through all multiple choice questions
    FOR question_record IN 
        SELECT q.id, q.title, q.interview_id 
        FROM questions q 
        WHERE q.type = 'multiple_choice'
    LOOP
        -- Check if this question has options
        SELECT COUNT(*) INTO option_count 
        FROM question_options 
        WHERE question_id = question_record.id;
        
        -- If no options exist, add some sample options
        IF option_count = 0 THEN
            RAISE NOTICE 'Adding options to question: % (ID: %)', question_record.title, question_record.id;
            
            -- Add 4 sample options
            INSERT INTO question_options (question_id, option_text, is_correct, order_index) VALUES 
            (question_record.id, 'Option A - First choice', true, 1),
            (question_record.id, 'Option B - Second choice', false, 2),
            (question_record.id, 'Option C - Third choice', false, 3),
            (question_record.id, 'Option D - Fourth choice', false, 4);
            
        ELSE
            RAISE NOTICE 'Question % already has % options', question_record.title, option_count;
        END IF;
    END LOOP;
END $$;

-- Verify the results
SELECT 
    q.title as question_title,
    q.id as question_id,
    COUNT(qo.id) as option_count
FROM questions q
LEFT JOIN question_options qo ON q.id = qo.question_id
WHERE q.type = 'multiple_choice'
GROUP BY q.id, q.title
ORDER BY q.title;

-- Show all options for multiple choice questions
SELECT 
    q.title as question_title,
    qo.option_text,
    qo.is_correct,
    qo.order_index
FROM questions q
JOIN question_options qo ON q.id = qo.question_id
WHERE q.type = 'multiple_choice'
ORDER BY q.title, qo.order_index;
