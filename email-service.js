// Email service utility
class EmailService {
    constructor() {
        // In a real application, you would use a proper email service
        // like SendGrid, AWS SES, or similar
        this.fromEmail = 'noreply@reflexa.com';
    }

    async sendWelcomeEmail(user) {
        try {
            // In a real application, this would make an API call to your email service
            console.log(`Welcome email sent to ${user.email}`);

            // Simulate email sending delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            return {
                success: true,
                message: 'Welcome email sent successfully'
            };
        } catch (error) {
            console.error('Error sending welcome email:', error);
            return {
                success: false,
                message: 'Failed to send welcome email'
            };
        }
    }

    async sendPasswordResetEmail(email, resetToken) {
        try {
            // In a real application, this would make an API call to your email service
            console.log(`Password reset email sent to ${email}`);

            // Simulate email sending delay
            await new Promise(resolve => setTimeout(resolve, 1000));

            return {
                success: true,
                message: 'Password reset email sent successfully'
            };
        } catch (error) {
            console.error('Error sending password reset email:', error);
            return {
                success: false,
                message: 'Failed to send password reset email'
            };
        }
    }
}

// Create global email service instance
const emailService = new EmailService(); 