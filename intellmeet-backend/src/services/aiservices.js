import axios from 'axios';

// This function will be called once a meeting ends and a transcript is ready
export const generateMeetingSummary = async (transcript) => {
  try {
    // We use a provider like Groq or OpenAI here
    // For now, this is the infrastructure ready for the API key
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: "gpt-4-turbo",
      messages: [
        { 
          role: "system", 
          content: "You are an AI assistant for IntellMeet. Summarize the meeting transcript and provide a list of key action items." 
        },
        { role: "user", content: transcript }
      ]
    }, {
      headers: { 
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('AI Summary Error:', error.message);
    return null;
  }
};