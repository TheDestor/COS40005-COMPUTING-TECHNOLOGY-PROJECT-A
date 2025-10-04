import Newsletter from "../models/Newsletter.js";
import transporter from "../config/emailConfig.js";
import { getWelcomeEmailTemplate } from "../utils/emailTemplates.js";

export const subscribeToNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    const trimmedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const existingSubscriber = await Newsletter.findOne({ 
      email: trimmedEmail 
    });

    if (existingSubscriber) {
      return res.status(409).json({
        success: false,
        message: 'This email is already subscribed to our newsletter'
      });
    }

    // Save new subscriber to database
    const newSubscriber = new Newsletter({
      email: trimmedEmail,
      subscribedAt: new Date(),
      isActive: true
    });

    await newSubscriber.save();
    console.log(`✅ New subscriber added: ${trimmedEmail}`);

    // Send welcome email
    try {
      const emailTemplate = getWelcomeEmailTemplate(trimmedEmail);
      
      await transporter.sendMail({
        from: `"Sarawak Tourism 🌴" <${process.env.EMAIL_USER}>`,
        to: trimmedEmail,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text
      });

      console.log(`📧 Welcome email sent to: ${trimmedEmail}`);
      
      return res.status(201).json({
        success: true,
        message: 'You are subscribed to our newsletter! Check your email for a welcome message.'
      });

    } catch (emailError) {
      console.error('❌ Error sending welcome email:', emailError);
      
      // Even if email fails, subscription is saved
      return res.status(201).json({
        success: true,
        message: 'You are subscribed to our newsletter!'
      });
    }

  } catch (error) {
    console.error('❌ Newsletter subscription error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'This email is already subscribed to our newsletter'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'An error occurred while subscribing. Please try again later.'
    });
  }
};