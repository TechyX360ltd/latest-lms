import { serve } from 'std/server';
import { createClient } from '@supabase/supabase-js';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  const { user } = await supabase.auth.getUser();
  if (!user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const { recipientEmail, courseId, message } = await req.json();
  if (!recipientEmail || !courseId) {
    return new Response(JSON.stringify({ error: 'Missing parameters' }), { status: 400 });
  }

  // 1. Validate sender owns the course (or is allowed to gift)
  const { data: senderCourse, error: senderCourseError } = await supabase
    .from('user_courses')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_id', courseId)
    .single();
  if (senderCourseError || !senderCourse) {
    return new Response(JSON.stringify({ error: 'You do not own this course or are not enrolled' }), { status: 403 });
  }

  // 2. Find or create recipient user by email
  let recipientId: string | null = null;
  const { data: recipientUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', recipientEmail)
    .single();
  if (recipientUser) {
    recipientId = recipientUser.id;
  } else {
    // Optionally, create a new user (invite flow)
    // For now, return error if not found
    return new Response(JSON.stringify({ error: 'Recipient not found. Please ask them to register first.' }), { status: 404 });
  }

  // 3. Enroll recipient in the course
  const { data: existingEnrollment } = await supabase
    .from('user_courses')
    .select('id')
    .eq('user_id', recipientId)
    .eq('course_id', courseId)
    .single();
  if (existingEnrollment) {
    return new Response(JSON.stringify({ error: 'Recipient is already enrolled in this course.' }), { status: 409 });
  }
  const { error: enrollError } = await supabase
    .from('user_courses')
    .insert({ user_id: recipientId, course_id: courseId, status: 'enrolled', gifted_by: user.id });
  if (enrollError) {
    return new Response(JSON.stringify({ error: 'Failed to enroll recipient.' }), { status: 500 });
  }

  // Trigger gamification for course enrollment
  try {
    await supabase.rpc('award_points_and_check_badges', {
      p_user_id: recipientId,
      p_points: 5000,
      p_coins: 5000,
      p_event_type: 'course_enrollment',
      p_description: 'Enrolled in a new course',
      p_metadata: JSON.stringify({ course_id: courseId })
    });
  } catch (gamificationError) {
    console.error('Error triggering gamification for gifted course:', gamificationError);
    // Continue with the gift process even if gamification fails
  }

  // 4. Record the gift
  await supabase.from('gifts').insert({
    sender_id: user.id,
    recipient_id: recipientId,
    gift_type: 'course',
    course_id: courseId,
    message,
    status: 'sent'
  });

  // 5. Send email notification to recipient
  // Fetch course title
  const { data: courseData } = await supabase
    .from('courses')
    .select('title')
    .eq('id', courseId)
    .single();
  // Fetch sender name
  const { data: senderData } = await supabase
    .from('users')
    .select('first_name, last_name, email')
    .eq('id', user.id)
    .single();
  const senderName = senderData ? `${senderData.first_name || ''} ${senderData.last_name || ''}`.trim() || senderData.email : 'A friend';
  const courseTitle = courseData?.title || 'a course';
  const emailSubject = `You've been gifted a course: ${courseTitle}!`;
  const emailHtml = `
    <div style="font-family: sans-serif;">
      <h2>🎁 You've been gifted a course!</h2>
      <p>Hi,</p>
      <p><b>${senderName}</b> has gifted you the course <b>${courseTitle}</b> on Skill Sage.</p>
      ${message ? `<blockquote style='margin:1em 0;padding:1em;background:#f9f9f9;border-left:4px solid #eab308;'>${message}</blockquote>` : ''}
      <p>To access your new course, simply log in to your account.</p>
      <p>Happy learning!<br/>Skill Sage Team</p>
    </div>
  `;
  await fetch(Deno.env.get('SUPABASE_URL') + '/functions/v1/send-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}` },
    body: JSON.stringify({
      to: recipientEmail,
      subject: emailSubject,
      html: emailHtml
    })
  });

  return new Response(JSON.stringify({ success: true }));
}); 