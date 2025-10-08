import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

interface EmailParams {
  candidateName: string;
  candidateEmail: string;
  testTitle: string;
  testUrl: string;
  submissionTime: string;
}

export async function POST(request: NextRequest) {
  try {
    const params: EmailParams = await request.json();
    
    // Validate required fields
    if (!params.candidateName || !params.testTitle || !params.testUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (!resendApiKey) {
      console.error('RESEND_API_KEY is not defined');
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }
    
    const resend = new Resend(resendApiKey);
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL || 'vijith@2hatslogic.com';
    
    console.log(`Sending email to ${adminEmail} using Resend`);
    
    const { data, error } = await resend.emails.send({
      from: 'Frontend Test <onboarding@resend.dev>',
      to: adminEmail,
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
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      );
    }
    
    console.log('Email sent successfully:', data);
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('Error in email API route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
