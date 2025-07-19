-- Bảng để lưu trữ feedback từ các cuộc hội thoại luyện tập
CREATE TABLE public.conversation_feedbacks (
    -- Cột ID chính, sử dụng UUID làm khóa chính
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Khóa ngoại liên kết đến bảng "users" trong schema "auth" của Supabase
    -- Giả định bạn đang sử dụng Supabase Auth cho người dùng
    user_id uuid NOT NULL REFERENCES auth.users(id),
    
    -- Định danh cho topic hội thoại (ví dụ: 'intro', 'ordering-food')
    topic_id text NOT NULL,
    
    -- Điểm tổng thể, giá trị từ 0 đến 100
    total_score smallint NOT NULL,
    
    -- Lưu trữ object điểm của từng hạng mục dưới dạng JSONB
    -- Ví dụ: {"pronunciation": 85, "fluency": 90, ...}
    category_scores jsonb NOT NULL,
    
    -- Lưu trữ mảng các điểm mạnh dưới dạng JSONB
    -- Ví dụ: ["Good intonation", "Used varied vocabulary"]
    strengths jsonb NOT NULL,
    
    -- Lưu trữ mảng các điểm cần cải thiện dưới dạng JSONB
    -- Ví dụ: ["Speak a little slower", "Work on 'th' sound"]
    areas_for_improvement jsonb NOT NULL,
    
    -- Lưu trữ nhận xét cuối cùng của AI
    final_assessment text,
    
    -- Tự động ghi lại thời gian tạo bản ghi
    created_at timestamptz DEFAULT now() NOT NULL
);

-- (Tùy chọn nhưng rất khuyến khích) Thêm comment để mô tả bảng và các cột
COMMENT ON TABLE public.conversation_feedbacks IS 'Stores AI-generated feedback for user conversation practice sessions.';
COMMENT ON COLUMN public.conversation_feedbacks.user_id IS 'Links to the user who completed the conversation.';
COMMENT ON COLUMN public.conversation_feedbacks.topic_id IS 'Identifier for the conversation topic.';
COMMENT ON COLUMN public.conversation_feedbacks.category_scores IS 'JSON object containing scores for different language skills.';

-- Bật Row Level Security (RLS) cho bảng này. Đây là bước CỰC KỲ QUAN TRỌNG để bảo mật.
ALTER TABLE public.conversation_feedbacks ENABLE ROW LEVEL SECURITY;

-- Tạo các policy bảo mật cơ bản:
-- 1. Cho phép người dùng đã đăng nhập có thể tạo feedback cho chính họ.
CREATE POLICY "Users can insert their own feedback"
ON public.conversation_feedbacks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 2. Cho phép người dùng có thể đọc feedback của chính họ.
CREATE POLICY "Users can view their own feedback"
ON public.conversation_feedbacks
FOR SELECT
USING (auth.uid() = user_id);

-- Thêm cột mới 'companion_id' vào bảng 'conversation_feedbacks'
ALTER TABLE public.conversation_feedbacks
ADD COLUMN companion_id uuid NOT NULL;

-- Thêm ràng buộc khóa ngoại để liên kết 'companion_id' với bảng 'companions'
ALTER TABLE public.conversation_feedbacks
ADD CONSTRAINT fk_companion
FOREIGN KEY (companion_id) 
REFERENCES public.companions(id)
ON DELETE CASCADE;

-- (Tùy chọn) Thêm comment để mô tả cột mới
COMMENT ON COLUMN public.conversation_feedbacks.companion_id IS 'Links to the companion used in the conversation.';
