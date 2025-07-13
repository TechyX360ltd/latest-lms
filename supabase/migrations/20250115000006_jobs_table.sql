-- Create jobs table
CREATE TABLE IF NOT EXISTS jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    company_logo TEXT,
    location VARCHAR(255) NOT NULL,
    job_type VARCHAR(50) NOT NULL CHECK (job_type IN ('Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance')),
    description TEXT NOT NULL,
    requirements TEXT,
    salary_text TEXT,
    tags TEXT[] DEFAULT '{}',
    application_url TEXT,
    contact_email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better search performance
CREATE INDEX IF NOT EXISTS idx_jobs_title_company ON jobs USING gin(to_tsvector('english', title || ' ' || company));
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_jobs_is_active ON jobs(is_active);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);

-- Enable RLS
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow all authenticated users to read active jobs
CREATE POLICY "Allow authenticated users to read active jobs" ON jobs
    FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);

-- Placeholder: Add admin policy here if you have a way to identify admins
-- Example:
-- CREATE POLICY "Allow admins full access to jobs" ON jobs
--     FOR ALL USING (auth.role() = 'authenticated' AND auth.jwt() ->> 'role' = 'admin');

-- Allow job creators to update their own jobs
CREATE POLICY "Allow job creators to update their jobs" ON jobs
    FOR UPDATE USING (auth.uid() = created_by);

-- Allow job creators to delete their own jobs
CREATE POLICY "Allow job creators to delete their jobs" ON jobs
    FOR DELETE USING (auth.uid() = created_by);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_jobs_updated_at();

-- Insert some sample jobs
INSERT INTO jobs (title, company, company_logo, location, job_type, description, requirements, salary_text, tags, is_featured) VALUES
(
    'Frontend Developer',
    'Acme Corp',
    'https://ui-avatars.com/api/?name=Acme+Corp&background=random',
    'Remote',
    'Full-time',
    'Join our team to build modern web applications with React and TypeScript. We are looking for a passionate frontend developer who loves creating beautiful, responsive user interfaces.',
    '• 3+ years experience with React/TypeScript\n• Strong CSS/SCSS skills\n• Experience with state management (Redux/Zustand)\n• Knowledge of modern build tools (Vite/Webpack)',
    '₦800,000 - ₦1,200,000',
    ARRAY['React', 'TypeScript', 'JavaScript', 'CSS', 'Remote'],
    true
),
(
    'Backend Engineer',
    'BetaTech',
    'https://ui-avatars.com/api/?name=BetaTech&background=random',
    'San Francisco, CA',
    'Part-time',
    'Work on scalable backend services and RESTful APIs. Help us build robust, high-performance systems that serve millions of users.',
    '• 2+ years experience with Node.js/Python\n• Database design and optimization\n• API design and documentation\n• Experience with cloud platforms (AWS/GCP)',
    'Negotiable',
    ARRAY['Node.js', 'PostgreSQL', 'API', 'AWS', 'Python'],
    false
),
(
    'UI/UX Designer',
    'Designify',
    'https://ui-avatars.com/api/?name=Designify&background=random',
    'Remote',
    'Contract',
    'Craft beautiful and user-friendly interfaces for our SaaS products. We need someone who can translate complex requirements into intuitive designs.',
    '• 4+ years of UI/UX design experience\n• Proficiency in Figma/Sketch\n• Strong portfolio showcasing web/mobile designs\n• Experience with design systems',
    '₦700,000 - ₦1,000,000',
    ARRAY['Figma', 'UX Design', 'UI Design', 'Prototyping', 'Design Systems'],
    true
),
(
    'Data Analyst',
    'Insightful',
    'https://ui-avatars.com/api/?name=Insightful&background=random',
    'New York, NY',
    'Internship',
    'Analyze data trends and help drive business decisions. Perfect opportunity for students or recent graduates interested in data science.',
    '• Currently pursuing degree in Statistics/Computer Science\n• Basic knowledge of SQL and Python\n• Strong analytical thinking\n• Experience with Excel/Google Sheets',
    'Negotiable',
    ARRAY['SQL', 'Python', 'Data Analysis', 'Excel', 'Statistics'],
    false
),
(
    'DevOps Engineer',
    'CloudScale',
    'https://ui-avatars.com/api/?name=CloudScale&background=random',
    'Austin, TX',
    'Full-time',
    'Build and maintain our cloud infrastructure. Help us scale our systems and implement best practices for deployment and monitoring.',
    '• 3+ years experience with AWS/Azure\n• Experience with Docker and Kubernetes\n• Knowledge of CI/CD pipelines\n• Monitoring and logging tools experience',
    '₦900,000 - ₦1,300,000',
    ARRAY['AWS', 'Docker', 'Kubernetes', 'CI/CD', 'Monitoring'],
    true
); 