async function generateXSignupBlob(client) {
  const generateGuestToken = async () => {
    try {
      const {data} = await client({
        url: 'https://api.x.com/1.1/guest/activate.json',
        method: 'POST',
        headers: { 
          'content-type': 'application/json',
        },
      });
      
      return data.guest_token;
    }
    catch(error) {
      throw new Error(`Generate guest token error: ${error.message}`);
    }
  }

  const generateBlobFromGuestToken = async (guestToken) => {
    try {
      const {data} = await client({
        method: 'POST',
        url: `https://api.x.com/1.1/onboarding/task.json?flow_name=signup`,
        headers: { 
          'content-type': 'application/json',
          'referer': `https://x.com/`,
          'x-guest-token': guestToken
        },
        data: {
          "input_flow_data": {
            "requested_variant": JSON.stringify({
              "signup_type": "phone_email"
            }),
            "flow_context": {
              "debug_overrides": {},
              "start_location": {
                "location": 'splash_screen'
              }
            }
          },
        }
      });
  
      const task = data.subtasks.find(task => task.subtask_id.includes('ArkoseEmail'));
      const blob = new URL(task.web_modal.url).searchParams.get('data');
  
      return encodeURIComponent(blob);
    }
    catch(error) {
      throw new Error(`Generate blob error: ${error.message}`);
    }
  }

  const guestToken = await generateGuestToken();
  return generateBlobFromGuestToken(guestToken);
}

module.exports = generateXSignupBlob;