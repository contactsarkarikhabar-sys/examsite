/**
 * ExamSite.in Email Templates
 * Beautiful HTML email templates for job alerts
 */

export const emailTemplates = {
    /**
     * Welcome/Confirmation Email Template
     */
    welcome: (name: string, verificationLink: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ExamSite.in</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background-color:#ffffff;">
    <!-- Header -->
    <tr>
      <td style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:30px;text-align:center;">
        <h1 style="color:#ffffff;margin:0;font-size:28px;">📚 ExamSite.in</h1>
        <p style="color:#fecaca;margin:10px 0 0;font-size:14px;">Your Gateway to Government Jobs</p>
      </td>
    </tr>
    
    <!-- Content -->
    <tr>
      <td style="padding:40px 30px;">
        <h2 style="color:#1f2937;margin:0 0 20px;font-size:24px;">नमस्ते ${name}! 🎉</h2>
        <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 20px;">
          ExamSite.in में आपका स्वागत है! आपने सफलतापूर्वक Job Alert के लिए register किया है।
        </p>
        <p style="color:#4b5563;font-size:16px;line-height:1.6;margin:0 0 30px;">
          कृपया अपना email verify करने के लिए नीचे दिए गए button पर click करें:
        </p>
        
        <!-- CTA Button -->
        <div style="text-align:center;margin:30px 0;">
          <a href="${verificationLink}" style="display:inline-block;background-color:#dc2626;color:#ffffff;text-decoration:none;padding:15px 40px;border-radius:8px;font-weight:bold;font-size:16px;">
            ✅ Email Verify करें
          </a>
        </div>
        
        <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:30px 0 0;">
          अगर button काम नहीं कर रहा है तो इस link को copy करें:<br>
          <a href="${verificationLink}" style="color:#dc2626;word-break:break-all;">${verificationLink}</a>
        </p>
      </td>
    </tr>
    
    <!-- Features -->
    <tr>
      <td style="padding:0 30px 30px;">
        <div style="background-color:#fef2f2;border-radius:12px;padding:25px;">
          <h3 style="color:#991b1b;margin:0 0 15px;font-size:18px;">आपको क्या मिलेगा:</h3>
          <ul style="color:#4b5563;margin:0;padding-left:20px;line-height:2;">
            <li>🔔 नई Sarkari Naukri की instant notification</li>
            <li>📋 SSC, Railway, Banking, Police jobs की updates</li>
            <li>📅 Important dates और deadlines की याद</li>
            <li>📝 Admit Card और Result alerts</li>
          </ul>
        </div>
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="background-color:#1f2937;padding:25px;text-align:center;">
        <p style="color:#9ca3af;margin:0;font-size:12px;">
          © 2026 ExamSite.in | All Rights Reserved
        </p>
        <p style="color:#6b7280;margin:10px 0 0;font-size:11px;">
          यह email आपने job alerts के लिए subscribe करने पर भेजा गया है।
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`,

    /**
     * New Job Alert Email Template
     */
    jobAlert: (name: string, jobTitle: string, category: string, shortInfo: string, importantDates: string, applyLink: string, unsubscribeLink: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Job Alert - ${jobTitle}</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background-color:#ffffff;">
    <!-- Header -->
    <tr>
      <td style="background:linear-gradient(135deg,#dc2626,#991b1b);padding:25px;text-align:center;">
        <h1 style="color:#ffffff;margin:0;font-size:24px;">📚 ExamSite.in</h1>
      </td>
    </tr>
    
    <!-- Alert Badge -->
    <tr>
      <td style="padding:20px 30px 0;text-align:center;">
        <span style="display:inline-block;background-color:#fef3c7;color:#92400e;padding:8px 20px;border-radius:20px;font-size:12px;font-weight:bold;text-transform:uppercase;">
          🔔 New ${category} Job Alert
        </span>
      </td>
    </tr>
    
    <!-- Content -->
    <tr>
      <td style="padding:30px;">
        <p style="color:#6b7280;margin:0 0 10px;font-size:14px;">नमस्ते ${name},</p>
        <h2 style="color:#1f2937;margin:0 0 20px;font-size:22px;line-height:1.3;">
          ${jobTitle}
        </h2>
        
        <!-- Job Info Box -->
        <div style="background-color:#f9fafb;border-left:4px solid #dc2626;padding:20px;margin:20px 0;border-radius:0 8px 8px 0;">
          <p style="color:#4b5563;margin:0;font-size:15px;line-height:1.7;">
            ${shortInfo}
          </p>
        </div>
        
        <!-- Important Dates -->
        <div style="background-color:#fef2f2;border-radius:8px;padding:15px 20px;margin:20px 0;">
          <h4 style="color:#991b1b;margin:0 0 10px;font-size:14px;">📅 Important Dates:</h4>
          <p style="color:#4b5563;margin:0;font-size:14px;line-height:1.6;">
            ${importantDates}
          </p>
        </div>
        
        <!-- CTA Button -->
        <div style="text-align:center;margin:30px 0;">
          <a href="${applyLink}" style="display:inline-block;background-color:#16a34a;color:#ffffff;text-decoration:none;padding:15px 40px;border-radius:8px;font-weight:bold;font-size:16px;">
            📝 Apply Now / Details देखें
          </a>
        </div>
        
        <p style="color:#6b7280;font-size:13px;text-align:center;margin:20px 0 0;">
          जल्दी करें! Last date से पहले apply करें।
        </p>
      </td>
    </tr>
    
    <!-- More Jobs CTA -->
    <tr>
      <td style="padding:0 30px 30px;text-align:center;">
        <a href="https://examsite.in" style="color:#dc2626;font-size:14px;text-decoration:none;font-weight:bold;">
          🔍 सभी Latest Jobs देखें →
        </a>
      </td>
    </tr>
    
    <!-- Footer -->
    <tr>
      <td style="background-color:#1f2937;padding:25px;text-align:center;">
        <p style="color:#9ca3af;margin:0;font-size:12px;">
          © 2026 ExamSite.in | All Rights Reserved
        </p>
        <p style="color:#6b7280;margin:15px 0 0;font-size:11px;">
          <a href="${unsubscribeLink}" style="color:#9ca3af;text-decoration:underline;">Unsubscribe</a> | 
          आपको यह email इसलिए मिला क्योंकि आपने job alerts के लिए subscribe किया है।
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
`,

    /**
     * Email Verified Success Template
     */
    verified: (name: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Email Verified - ExamSite.in</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background-color:#f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background-color:#ffffff;">
    <tr>
      <td style="background:linear-gradient(135deg,#16a34a,#15803d);padding:30px;text-align:center;">
        <h1 style="color:#ffffff;margin:0;font-size:28px;">✅ Email Verified!</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:40px 30px;text-align:center;">
        <div style="font-size:60px;margin-bottom:20px;">🎉</div>
        <h2 style="color:#1f2937;margin:0 0 20px;">बधाई हो ${name}!</h2>
        <p style="color:#4b5563;font-size:16px;line-height:1.6;">
          आपका email successfully verify हो गया है। अब आपको सभी latest government job alerts मिलेंगे।
        </p>
        <div style="margin:30px 0;">
          <a href="https://examsite.in" style="display:inline-block;background-color:#dc2626;color:#ffffff;text-decoration:none;padding:15px 40px;border-radius:8px;font-weight:bold;font-size:16px;">
            ExamSite.in पर जाएं
          </a>
        </div>
      </td>
    </tr>
    <tr>
      <td style="background-color:#1f2937;padding:20px;text-align:center;">
        <p style="color:#9ca3af;margin:0;font-size:12px;">© 2026 ExamSite.in</p>
      </td>
    </tr>
  </table>
</body>
</html>
`
};
