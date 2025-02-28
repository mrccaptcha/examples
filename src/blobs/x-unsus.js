async function generateXUnsusBlob(client) {
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
        url: `https://api.x.com/cms/arkose/htc/dex.json`,
        params: {
          formPath: '/content/help-twitter/en/forms/account-access/regain-access/forgot-password/jcr:content/root/responsivegrid/ct16_columns_spa_cop/col2/f200_form'
        },
        headers: { 
          'content-type': 'application/json',
          'x-guest-token': guestToken
        }
      });
  
      return encodeURIComponent(data.dex);
    }
    catch(error) {
      throw new Error(`Generate blob error: ${error.message}`);
    }
  }

  const guestToken = await generateGuestToken();
  return generateBlobFromGuestToken(guestToken);
}

module.exports = generateXUnsusBlob;