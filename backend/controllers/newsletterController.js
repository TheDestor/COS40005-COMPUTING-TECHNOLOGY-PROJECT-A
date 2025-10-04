import Newsletter from "../models/Newsletter.js";

export const subscribeToNewsletter = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if email is provided
    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    // Check if email already exists
    const existingSubscriber = await Newsletter.findOne({ 
      email: email.toLowerCase().trim() 
    });

    if (existingSubscriber) {
      return res.status(409).json({
        success: false,
        message: 'This email is already subscribed to our newsletter'
      });
    }

    // Save new subscriber
    const newSubscriber = new Newsletter({
      email: email.toLowerCase().trim()
    });

    await newSubscriber.save();

    return res.status(201).json({
      success: true,
      message: 'You are subscribed to our newsletter!'
    });

  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return res.status(500).json({
      success: false,
      message: 'An error occurred while subscribing. Please try again later.'
    });
  }
};