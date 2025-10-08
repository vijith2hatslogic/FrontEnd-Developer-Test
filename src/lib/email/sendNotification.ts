import { Resend } from 'resend';

interface EmailParams {
  candidateName: string;
  candidateEmail: string;
  testTitle: string;
  testUrl: string;
  submissionTime: string;
}

export async function sendCompletionEmail(params: EmailParams): Promise<boolean> {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    const { data, error } = await resend.emails.send({
      from: 'Frontend Test <onboarding@resend.dev>',
      to: process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'vijith@2hatslogic.com',
      subject: `New Test Submission: ${params.testTitle}`,
      html: `
        <h1>New Test Submission</h1>
        <p>A new submission has been received for the test "${params.testTitle}".</p>
        
        <h2>Candidate Information</h2>
        <ul>
          <li><strong>Name:</strong> ${params.candidateName}</li>
          <li><strong>Email:</strong> ${params.candidateEmail}</li>
          <li><strong>Submission Time:</strong> ${params.submissionTime}</li>
        </ul>
        
        <p>
          <a href="${params.testUrl}" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-decoration: none; border-radius: 4px;">
            View Submission
          </a>
        </p>
        
        <p>This is an automated notification from the Frontend Developer Test Platform.</p>
      `,
    });

    if (error) {
      console.error('Error sending email notification:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error sending email notification:', error);
    return false;
  }
}