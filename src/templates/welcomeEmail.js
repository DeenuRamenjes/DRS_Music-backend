/**
 * Generate a styled welcome/login email for DRS Music
 * @param {Object} options
 * @param {string} options.userName - User's display name
 * @param {string} [options.userImage] - User's profile image URL
 * @param {boolean} [options.isNewUser] - Whether this is a new user
 */
export const getWelcomeEmailTemplate = ({ userName, userImage, isNewUser = false }) => {
    const currentYear = new Date().getFullYear();
    const greeting = isNewUser ? 'Welcome to DRS Music!' : 'Welcome Back!';
    const subtitle = isNewUser
        ? 'Your musical journey begins now.'
        : 'Great to see you again.';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${greeting}</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0a;">
    <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0a0a0a;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse;">
                    
                    <!-- Main Content Card -->
                    <tr>
                        <td>
                            <table role="presentation" style="width: 100%; border-collapse: collapse; background: linear-gradient(180deg, #18181b 0%, #1f1f23 100%); border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(139, 92, 246, 0.15);">
                                
                                <!-- Purple Gradient Header -->
                                <tr>
                                    <td style="background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 50%, #a855f7 100%); padding: 40px 40px 60px 40px;" align="center">
                                        ${userImage ? `
                                        <img src="${userImage}" alt="Profile" style="width: 80px; height: 80px; border-radius: 50%; border: 4px solid rgba(255,255,255,0.3); margin-bottom: 20px; object-fit: cover;">
                                        ` : `
                                        <div style="width: 80px; height: 80px; border-radius: 50%; background: rgba(255,255,255,0.2); margin: 0 auto 20px auto; display: flex; align-items: center; justify-content: center;">
                                            <span style="font-size: 36px;">👤</span>
                                        </div>
                                        `}
                                        <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700; text-shadow: 0 2px 10px rgba(0,0,0,0.2);">${greeting}</h1>
                                        <p style="margin: 12px 0 0 0; color: rgba(255,255,255,0.9); font-size: 18px; font-weight: 400;">${subtitle}</p>
                                    </td>
                                </tr>
                                
                                <!-- Content Body -->
                                <tr>
                                    <td style="padding: 40px;">
                                        <p style="margin: 0 0 24px 0; color: #e4e4e7; font-size: 16px; line-height: 1.6;">
                                            Hey <span style="color: #a855f7; font-weight: 600;">${userName}</span>! 👋
                                        </p>
                                        
                                        <p style="margin: 0 0 24px 0; color: #a1a1aa; font-size: 15px; line-height: 1.7;">
                                            ${isNewUser
            ? 'Thank you for joining DRS Music! We\'re thrilled to have you as part of our community. Get ready to discover amazing music, create playlists, and enjoy a premium listening experience.'
            : 'You\'ve successfully signed in to your DRS Music account. Your personalized music experience awaits you!'
        }
                                        </p>
                                        
                                        <!-- Feature Highlights -->
                                        <table role="presentation" style="width: 100%; border-collapse: collapse; margin: 30px 0;">
                                            <tr>
                                                <td style="padding: 16px; background: rgba(139, 92, 246, 0.1); border-radius: 12px; border-left: 4px solid #8b5cf6;">
                                                    <table role="presentation" style="border-collapse: collapse;">
                                                        <tr>
                                                            <td style="padding-right: 16px; font-size: 24px;">🎧</td>
                                                            <td>
                                                                <p style="margin: 0; color: #e4e4e7; font-size: 14px; font-weight: 600;">High Quality Audio</p>
                                                                <p style="margin: 4px 0 0 0; color: #71717a; font-size: 13px;">Crystal clear sound quality</p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr><td style="height: 12px;"></td></tr>
                                            <tr>
                                                <td style="padding: 16px; background: rgba(168, 85, 247, 0.1); border-radius: 12px; border-left: 4px solid #a855f7;">
                                                    <table role="presentation" style="border-collapse: collapse;">
                                                        <tr>
                                                            <td style="padding-right: 16px; font-size: 24px;">📱</td>
                                                            <td>
                                                                <p style="margin: 0; color: #e4e4e7; font-size: 14px; font-weight: 600;">Offline Mode</p>
                                                                <p style="margin: 4px 0 0 0; color: #71717a; font-size: 13px;">Download and listen anywhere</p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr><td style="height: 12px;"></td></tr>
                                            <tr>
                                                <td style="padding: 16px; background: rgba(192, 132, 252, 0.1); border-radius: 12px; border-left: 4px solid #c084fc;">
                                                    <table role="presentation" style="border-collapse: collapse;">
                                                        <tr>
                                                            <td style="padding-right: 16px; font-size: 24px;">💜</td>
                                                            <td>
                                                                <p style="margin: 0; color: #e4e4e7; font-size: 14px; font-weight: 600;">Share with Friends</p>
                                                                <p style="margin: 4px 0 0 0; color: #71717a; font-size: 13px;">Send songs to your friends</p>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td align="center" style="padding: 40px 20px 20px 20px;">
                            <p style="margin: 0 0 12px 0; color: #52525b; font-size: 13px;">
                                This email was sent because you signed in to DRS Music.
                            </p>
                            <p style="margin: 0; color: #3f3f46; font-size: 12px;">
                                © ${currentYear} DRS Music. All rights reserved.
                            </p>
                        </td>
                    </tr>
                    
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();
};

/**
 * Get plain text version of the email
 */
export const getWelcomeEmailText = ({ userName, isNewUser = false }) => {
    const greeting = isNewUser ? 'Welcome to DRS Music!' : 'Welcome Back!';
    return `
${greeting}

Hey ${userName}!

${isNewUser
            ? 'Thank you for joining DRS Music! We\'re thrilled to have you as part of our community.'
            : 'You\'ve successfully signed in to your DRS Music account.'
        }

Features you can enjoy:
- 🎧 High Quality Audio
- 📱 Offline Mode
- 💜 Share with Friends

Open the DRS Music app to start listening!

© ${new Date().getFullYear()} DRS Music. All rights reserved.
    `.trim();
};

export default { getWelcomeEmailTemplate, getWelcomeEmailText };
